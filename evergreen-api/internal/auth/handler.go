package auth

import (
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
	"github.com/evergreen/api/pkg/security"
)

var pinRegex = regexp.MustCompile(`^\d{6}$`)

const maxPINAttempts = 5

type Handler struct {
	store   *Store
	auth    *clients.SupabaseAuth
	jwtAuth *middleware.Auth
}

func New(db *pgxpool.Pool, supaAuth *clients.SupabaseAuth, jwtAuth *middleware.Auth) *Handler {
	return &Handler{store: NewStore(db), auth: supaAuth, jwtAuth: jwtAuth}
}

// Login handles POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.Email == "" || body.Password == "" {
		response.BadRequest(w, "กรุณากรอกอีเมลและรหัสผ่าน")
		return
	}

	result, err := h.auth.SignInWithPassword(body.Email, body.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	// Check if user is active
	user, _ := result["user"].(map[string]any)
	if user != nil {
		userID, _ := user["id"].(string)
		if userID != "" {
			isActive, _ := h.store.GetUserIsActive(r.Context(), userID)
			if isActive != nil && !*isActive {
				response.Forbidden(w, "บัญชีถูกปิดใช้งาน")
				return
			}
		}
	}

	response.OK(w, result)
}

// Refresh handles POST /api/auth/refresh
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.RefreshToken == "" {
		response.BadRequest(w, "กรุณาระบุ refresh_token")
		return
	}

	result, err := h.auth.RefreshSession(body.RefreshToken)
	if err != nil {
		response.Unauthorized(w, "refresh token ไม่ถูกต้อง")
		return
	}
	response.OK(w, result)
}

// Verify handles POST /api/auth/verify
func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TokenHash string `json:"token_hash"`
		Type      string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.TokenHash == "" || body.Type == "" {
		response.BadRequest(w, "กรุณาระบุ token_hash และ type")
		return
	}

	result, err := h.auth.VerifyOTP(body.TokenHash, body.Type)
	if err != nil {
		response.Unauthorized(w, "token ไม่ถูกต้อง")
		return
	}
	response.OK(w, result)
}

// PINStatus handles GET /api/auth/pin
func (h *Handler) PINStatus(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	user, err := h.auth.AdminGetUser(userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	pinEnabled := false
	if meta, ok := user["app_metadata"].(map[string]any); ok {
		if hash, ok := meta["pinHash"].(string); ok && hash != "" {
			pinEnabled = true
		}
	}
	response.OK(w, map[string]bool{"pinEnabled": pinEnabled})
}

// PINSet handles POST /api/auth/pin
func (h *Handler) PINSet(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body struct {
		PIN string `json:"pin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if !pinRegex.MatchString(body.PIN) {
		response.BadRequest(w, "PIN ต้องเป็นตัวเลข 6 หลัก")
		return
	}

	hashStr, err := security.HashPassword(body.PIN)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	_, err = h.auth.AdminUpdateUser(userID, map[string]any{
		"app_metadata": map[string]any{
			"pinHash":           hashStr,
			"pinFailedAttempts": 0,
			"pinLockedUntil":    nil,
		},
	})
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// PINDelete handles DELETE /api/auth/pin
func (h *Handler) PINDelete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	_, err := h.auth.AdminUpdateUser(userID, map[string]any{
		"app_metadata": map[string]any{
			"pinHash":           nil,
			"pinFailedAttempts": 0,
			"pinLockedUntil":    nil,
		},
	})
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// PINVerify handles POST /api/auth/pin/verify (public endpoint)
func (h *Handler) PINVerify(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
		PIN   string `json:"pin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.Email == "" || !pinRegex.MatchString(body.PIN) {
		response.BadRequest(w, "กรุณาระบุอีเมลและ PIN 6 หลัก")
		return
	}

	// Find user by email
	users, err := h.auth.AdminListUsers()
	if err != nil {
		response.InternalError(w, err)
		return
	}

	var targetUser map[string]any
	for _, u := range users {
		if email, _ := u["email"].(string); email == body.Email {
			targetUser = u
			break
		}
	}
	if targetUser == nil {
		response.Unauthorized(w, "ไม่พบบัญชีผู้ใช้")
		return
	}

	userID, _ := targetUser["id"].(string)
	meta, _ := targetUser["app_metadata"].(map[string]any)
	if meta == nil {
		response.Unauthorized(w, "ยังไม่ได้ตั้งค่า PIN")
		return
	}

	pinHash, _ := meta["pinHash"].(string)
	if pinHash == "" {
		response.Unauthorized(w, "ยังไม่ได้ตั้งค่า PIN")
		return
	}

	// Check lock
	if lockedUntil, ok := meta["pinLockedUntil"].(string); ok && lockedUntil != "" {
		response.Error(w, http.StatusTooManyRequests, "บัญชีถูกล็อค กรุณาลองใหม่ภายหลัง")
		return
	}

	// Verify PIN
	if err := security.CheckPassword(pinHash, body.PIN); err != nil {
		// Failed attempt
		attempts, _ := meta["pinFailedAttempts"].(float64)
		attempts++
		updates := map[string]any{
			"app_metadata": map[string]any{
				"pinHash":           pinHash,
				"pinFailedAttempts": int(attempts),
				"pinLockedUntil":    meta["pinLockedUntil"],
			},
		}
		if int(attempts) >= maxPINAttempts {
			updates["app_metadata"].(map[string]any)["pinFailedAttempts"] = 0
			updates["app_metadata"].(map[string]any)["pinLockedUntil"] = "locked"
		}
		_, _ = h.auth.AdminUpdateUser(userID, updates)

		attemptsLeft := maxPINAttempts - int(attempts)
		if attemptsLeft < 0 {
			attemptsLeft = 0
		}
		response.JSON(w, http.StatusUnauthorized, map[string]any{
			"error":        "PIN ไม่ถูกต้อง",
			"attemptsLeft": attemptsLeft,
		})
		return
	}

	// PIN correct — reset attempts
	_, _ = h.auth.AdminUpdateUser(userID, map[string]any{
		"app_metadata": map[string]any{
			"pinHash":           pinHash,
			"pinFailedAttempts": 0,
			"pinLockedUntil":    nil,
		},
	})

	// Generate magic link
	linkResult, err := h.auth.AdminGenerateLink("magiclink", body.Email)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	props, _ := linkResult["properties"].(map[string]any)
	tokenHash := ""
	if props != nil {
		tokenHash, _ = props["hashed_token"].(string)
	}

	response.OK(w, map[string]any{
		"success":    true,
		"token_hash": tokenHash,
		"email":      body.Email,
	})
}
