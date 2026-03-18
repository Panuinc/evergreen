package admin

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
	r.Post("/createUser", h.CreateUser)
	r.Post("/resetPassword", h.ResetPassword)
	return r
}

// hasPermission checks if user has a specific permission or is superadmin.
func (h *Handler) hasPermission(r *http.Request, perm string) bool {
	if middleware.IsSuperAdmin(r.Context()) {
		return true
	}
	userID := middleware.UserID(r.Context())
	rows, err := h.db.Query(r.Context(), `SELECT * FROM get_user_permissions($1)`, userID)
	if err != nil {
		return false
	}
	defer rows.Close()
	for rows.Next() {
		var resourceName, actionName string
		var isSuperadmin bool
		if err := rows.Scan(&resourceName, &actionName, &isSuperadmin); err != nil {
			continue
		}
		if isSuperadmin || resourceName+":"+actionName == perm {
			return true
		}
	}
	return false
}

// CreateUser handles POST /api/admin/createUser
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if !h.hasPermission(r, "rbac:create") {
		response.Forbidden(w, "ไม่มีสิทธิ์ในการสร้างผู้ใช้")
		return
	}

	var body struct {
		Email      string `json:"email"`
		Password   string `json:"password"`
		EmployeeID string `json:"employeeId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.Email == "" || body.Password == "" {
		response.BadRequest(w, "กรุณากรอกอีเมลและรหัสผ่าน")
		return
	}
	if len(body.Password) < 6 {
		response.BadRequest(w, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
		return
	}

	// Create auth user
	user, err := h.auth.AdminCreateUser(body.Email, body.Password)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := user["id"].(string)
	email, _ := user["email"].(string)
	result := map[string]any{"user": user}

	// Create rbacUserProfile
	_, err = h.db.Exec(r.Context(), `
		INSERT INTO "rbacUserProfile" ("rbacUserProfileId", "rbacUserProfileEmail")
		VALUES ($1, $2)
	`, userID, email)
	if err != nil {
		result["warning"] = "สร้างผู้ใช้สำเร็จ แต่ไม่สามารถสร้างโปรไฟล์ได้: " + err.Error()
	}

	// Link to employee if provided
	if body.EmployeeID != "" {
		_, err = h.db.Exec(r.Context(), `
			UPDATE "hrEmployee" SET "hrEmployeeUserId" = $1
			WHERE "hrEmployeeId" = $2
		`, userID, body.EmployeeID)
		if err != nil {
			result["warning"] = "สร้างผู้ใช้สำเร็จ แต่ไม่สามารถเชื่อมต่อพนักงานได้: " + err.Error()
		}
	}

	response.Created(w, result)
}

// ResetPassword handles POST /api/admin/resetPassword
func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if !h.hasPermission(r, "rbac:create") {
		response.Forbidden(w, "ไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน")
		return
	}

	var body struct {
		UserID   string `json:"userId"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if body.UserID == "" || body.Password == "" {
		response.BadRequest(w, "กรุณาระบุ userId และ password")
		return
	}
	if len(body.Password) < 6 {
		response.BadRequest(w, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
		return
	}

	_, err := h.auth.AdminUpdateUser(body.UserID, map[string]any{
		"password": body.Password,
	})
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.OK(w, map[string]bool{"success": true})
}
