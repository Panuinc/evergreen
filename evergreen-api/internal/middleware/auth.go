package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"

	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/internal/response"
)

type contextKey string

const (
	UserIDKey       contextKey = "userID"
	UserEmailKey    contextKey = "userEmail"
	IsSuperAdminKey contextKey = "isSuperAdmin"
)

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
	jwkCache *jwk.Cache
	jwksURL  string
	db       *pgxpool.Pool
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

	slog.Info("JWKS cache initialized", "url", jwksURL)
	return &Auth{jwkCache: cache, jwksURL: jwksURL, db: db}, nil
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
			slog.Error("JWKS lookup failed", "error", err)
			response.InternalError(w, err)
			return
		}

		// Parse and validate JWT with JWKS
		parsed, err := jwt.Parse([]byte(token), jwt.WithKeySet(keySet))
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
			slog.Error("check user access failed", "error", err, "userID", userID)
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
// Port of checkUserAccess() from auth.js
func (a *Auth) checkUserAccess(ctx context.Context, userID string) (isSuperAdmin bool, isActive bool, err error) {
	// Default: active unless proven otherwise
	isActive = true

	// Check superadmin roles
	rows, err := a.db.Query(ctx, `
		SELECT r."rbacRoleIsSuperadmin"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."rbacUserRoleUserId" = $1
		  AND ur."isActive" = true
	`, userID)
	if err != nil {
		return false, false, fmt.Errorf("querying user roles: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var superadmin bool
		if err := rows.Scan(&superadmin); err != nil {
			return false, false, fmt.Errorf("scanning role: %w", err)
		}
		if superadmin {
			isSuperAdmin = true
		}
	}

	// Check user profile active status
	var profileActive *bool
	err = a.db.QueryRow(ctx, `
		SELECT "isActive"
		FROM "rbacUserProfile"
		WHERE "rbacUserProfileId" = $1
	`, userID).Scan(&profileActive)
	if err != nil {
		// If no profile found, default to active
		return isSuperAdmin, true, nil
	}
	if profileActive != nil {
		isActive = *profileActive
	}

	return isSuperAdmin, isActive, nil
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
