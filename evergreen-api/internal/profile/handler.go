package profile

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
	auth  *clients.SupabaseAuth
}

func New(db *pgxpool.Pool, supaAuth *clients.SupabaseAuth) *Handler {
	return &Handler{store: NewStore(db), auth: supaAuth}
}

// GetProfile handles GET /api/profile
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	// Get user info from rbacUserProfile (instead of Supabase Auth API)
	profile, _ := h.store.GetUserProfile(ctx, userID)

	userInfo := map[string]any{
		"id":    userID,
		"email": nil,
	}
	if profile != nil {
		userInfo["email"] = profile["rbacUserProfileEmail"]
		userInfo["createdAt"] = profile["rbacUserProfileCreatedAt"]
	}

	// Get employee info
	employee, _ := h.store.GetEmployee(ctx, userID)

	// Get roles
	roles, err := h.store.GetUserRoles(ctx, userID)
	if err != nil || roles == nil {
		roles = []map[string]any{}
	}

	response.OK(w, map[string]any{
		"user":     userInfo,
		"employee": employee,
		"roles":    roles,
	})
}

// ChangePassword handles PUT /api/profile/changePassword
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())

	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.NewPassword == "" || len(body.NewPassword) < 6 {
		response.BadRequest(w, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร")
		return
	}

	// Verify current password by attempting sign-in
	user, err := h.auth.AdminGetUser(userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	email, _ := user["email"].(string)

	_, err = h.auth.SignInWithPassword(email, body.CurrentPassword)
	if err != nil {
		response.BadRequest(w, "รหัสผ่านปัจจุบันไม่ถูกต้อง")
		return
	}

	// Update password
	_, err = h.auth.AdminUpdateUser(userID, map[string]any{
		"password": body.NewPassword,
	})
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.OK(w, map[string]bool{"success": true})
}
