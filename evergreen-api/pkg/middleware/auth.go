package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"

	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/response"
	"github.com/evergreen/api/pkg/security"
)

type contextKey string

const (
	UserIDKey       contextKey = "userID"
	UserEmailKey    contextKey = "userEmail"
	IsSuperAdminKey contextKey = "isSuperAdmin"

	authCacheTTL = 5 * time.Minute
)

// authCacheEntry holds cached user access data.
type authCacheEntry struct {
	isSuperAdmin bool
	isActive     bool
	cachedAt     time.Time
}

// authCache is an in-memory cache for user access checks.
type authCache struct {
	mu      sync.RWMutex
	entries map[string]authCacheEntry
}

func newAuthCache() *authCache {
	return &authCache{entries: make(map[string]authCacheEntry)}
}

func (c *authCache) get(userID string) (authCacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.entries[userID]
	if !ok || time.Since(entry.cachedAt) > authCacheTTL {
		return authCacheEntry{}, false
	}
	return entry, true
}

func (c *authCache) set(userID string, isSuperAdmin, isActive bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[userID] = authCacheEntry{
		isSuperAdmin: isSuperAdmin,
		isActive:     isActive,
		cachedAt:     time.Now(),
	}
}

// UserID extracts the user ID from request context.
func UserID(ctx context.Context) string {
	v, _ := ctx.Value(UserIDKey).(string)
	return v
}

// IsSuperAdmin extracts the superadmin flag from request context.
func IsSuperAdmin(ctx context.Context) bool {
	v, _ := ctx.Value(IsSuperAdminKey).(bool)
	return v
}

// Auth is middleware that validates Supabase JWTs via JWKS.
type Auth struct {
	jwkCache  *jwk.Cache
	jwksURL   string
	db        *pgxpool.Pool
	userCache *authCache
}

// NewAuth creates an Auth middleware with JWKS caching.
func NewAuth(cfg *config.Config, db *pgxpool.Pool) (*Auth, error) {
	ctx := context.Background()
	jwksURL := cfg.JWKSURL()

	client := httprc.NewClient()
	cache, err := jwk.NewCache(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("creating JWKS cache: %w", err)
	}

	if err := cache.Register(ctx, jwksURL); err != nil {
		return nil, fmt.Errorf("registering JWKS URL: %w", err)
	}

	// Initial fetch to verify connectivity
	_, err = cache.Lookup(ctx, jwksURL)
	if err != nil {
		return nil, fmt.Errorf("initial JWKS fetch from %s: %w", jwksURL, err)
	}

	logger.Info("JWKS cache initialized", "url", jwksURL)
	return &Auth{jwkCache: cache, jwksURL: jwksURL, db: db, userCache: newAuthCache()}, nil
}

// Authenticate is HTTP middleware that validates the JWT and injects user context.
func (a *Auth) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := extractBearerToken(r)
		if token == "" {
			response.Unauthorized(w, "Unauthorized")
			return
		}

		// Get JWKS from cache
		keySet, err := a.jwkCache.Lookup(r.Context(), a.jwksURL)
		if err != nil {
			logger.Error("JWKS lookup failed", "error", err)
			response.InternalError(w, err)
			return
		}

		// Parse and validate JWT with JWKS
		parsed, err := security.ParseJWT([]byte(token), keySet)
		if err != nil {
			response.Unauthorized(w, "Unauthorized")
			return
		}

		// Extract user ID from sub claim
		userID, ok := parsed.Subject()
		if !ok || userID == "" {
			response.Unauthorized(w, "Unauthorized")
			return
		}

		// Check user access (active status + superadmin)
		isSuperAdmin, isActive, err := a.checkUserAccess(r.Context(), userID)
		if err != nil {
			logger.Error("check user access failed", "error", err, "userID", userID)
			response.InternalError(w, err)
			return
		}

		if !isActive {
			response.Forbidden(w, "บัญชีถูกปิดใช้งาน")
			return
		}

		// Extract email from claims
		var email string
		_ = parsed.Get("email", &email)

		// Inject user info into context
		ctx := r.Context()
		ctx = context.WithValue(ctx, UserIDKey, userID)
		ctx = context.WithValue(ctx, IsSuperAdminKey, isSuperAdmin)
		if email != "" {
			ctx = context.WithValue(ctx, UserEmailKey, email)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// checkUserAccess queries RBAC tables for active status and superadmin flag.
// Uses in-memory cache with 5-minute TTL to avoid hitting DB on every request.
// Combined into a single query: JOIN rbacUserRole + rbacRole + rbacUserProfile.
func (a *Auth) checkUserAccess(ctx context.Context, userID string) (isSuperAdmin bool, isActive bool, err error) {
	// Check cache first
	if entry, ok := a.userCache.get(userID); ok {
		return entry.isSuperAdmin, entry.isActive, nil
	}

	// Single combined query for superadmin flag + profile active status
	var superAdmin bool
	var profileActive *bool
	err = a.db.QueryRow(ctx, `
		SELECT
			COALESCE(bool_or(r."rbacRoleIsSuperadmin"), false) AS "isSuperAdmin",
			p."isActive" AS "profileActive"
		FROM "rbacUserProfile" p
		LEFT JOIN "rbacUserRole" ur ON ur."rbacUserRoleUserId" = p."rbacUserProfileId" AND ur."isActive" = true
		LEFT JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE p."rbacUserProfileId" = $1
		GROUP BY p."isActive"
	`, userID).Scan(&superAdmin, &profileActive)
	if err != nil {
		// If no profile found, default to active, not superadmin
		a.userCache.set(userID, false, true)
		return false, true, nil
	}

	isActive = true
	if profileActive != nil {
		isActive = *profileActive
	}

	// Cache the result
	a.userCache.set(userID, superAdmin, isActive)
	return superAdmin, isActive, nil
}

// extractBearerToken extracts the token from the Authorization header.
func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}

// CronAuth is middleware that validates the CRON_SECRET bearer token.
func CronAuth(cronSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" || token != cronSecret {
				response.Unauthorized(w, "Unauthorized")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// InternalAuth is middleware that validates the x-internal-secret header.
func InternalAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headerSecret := r.Header.Get("x-internal-secret")
			if headerSecret == "" || headerSecret != secret {
				response.Unauthorized(w, "Unauthorized")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
