package profile

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/external"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	db   *pgxpool.Pool
	auth *external.SupabaseAuth
}

func New(db *pgxpool.Pool, supaAuth *external.SupabaseAuth) *Handler {
	return &Handler{db: db, auth: supaAuth}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetProfile)
	r.Put("/changePassword", h.ChangePassword)
	return r
}

// GetProfile handles GET /api/profile
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	// Get user info from auth
	user, err := h.auth.AdminGetUser(userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	userInfo := map[string]any{
		"id":        user["id"],
		"email":     user["email"],
		"createdAt": user["created_at"],
	}

	// Get employee info
	var employee map[string]any
	rows, err := h.db.Query(ctx, `SELECT * FROM "hrEmployee" WHERE "hrEmployeeUserId" = $1 LIMIT 1`, userID)
	if err == nil {
		defer rows.Close()
		if rows.Next() {
			cols := rows.FieldDescriptions()
			vals, _ := rows.Values()
			if vals != nil {
				employee = make(map[string]any, len(cols))
				for i, col := range cols {
					employee[string(col.Name)] = vals[i]
				}
			}
		}
	}

	// Get roles
	var roles []map[string]any
	roleRows, err := h.db.Query(ctx, `
		SELECT r.*
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r.id = ur."rbacUserRoleRoleId"
		WHERE ur."rbacUserRoleUserId" = $1
		  AND ur."isActive" = true
	`, userID)
	if err == nil {
		defer roleRows.Close()
		for roleRows.Next() {
			cols := roleRows.FieldDescriptions()
			vals, _ := roleRows.Values()
			if vals != nil {
				role := make(map[string]any, len(cols))
				for i, col := range cols {
					role[string(col.Name)] = vals[i]
				}
				roles = append(roles, role)
			}
		}
	}

	if roles == nil {
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
