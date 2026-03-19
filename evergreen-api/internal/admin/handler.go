package admin

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

// hasPermission checks if user has a specific permission or is superadmin.
func (h *Handler) hasPermission(r *http.Request, perm string) bool {
	if middleware.IsSuperAdmin(r.Context()) {
		return true
	}
	userID := middleware.UserID(r.Context())
	permissions, err := h.store.GetUserPermissions(r.Context(), userID)
	if err != nil {
		return false
	}
	for _, p := range permissions {
		resourceName, _ := p[0].(string)
		actionName, _ := p[1].(string)
		isSuperadmin, _ := p[2].(bool)
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
	if err := h.store.CreateUserProfile(r.Context(), userID, email); err != nil {
		result["warning"] = "สร้างผู้ใช้สำเร็จ แต่ไม่สามารถสร้างโปรไฟล์ได้: " + err.Error()
	}

	// Link to employee if provided
	if body.EmployeeID != "" {
		if err := h.store.LinkEmployeeToUser(r.Context(), userID, body.EmployeeID); err != nil {
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
