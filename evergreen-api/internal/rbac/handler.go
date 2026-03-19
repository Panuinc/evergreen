package rbac

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- Roles ----

func (h *Handler) ListRoles(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.ListRoles(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	data, err := h.store.CreateRole(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())

	role, err := h.store.GetRole(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบ Role")
		return
	}

	perms, err := h.store.GetRolePermissions(r.Context(), id)
	if err != nil {
		perms = []map[string]any{}
	}

	role["rbacRolePermission"] = perms
	response.OK(w, role)
}

func (h *Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	data, err := h.store.UpdateRole(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteRole(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Permissions ----

func (h *Handler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.ListPermissions(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreatePermission(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	data, err := h.store.CreatePermission(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) DeletePermission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeletePermission(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Resources ----

func (h *Handler) ListResources(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.ListResources(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateResource(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateResource(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateResource(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateResource(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteResource(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteResource(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Actions ----

func (h *Handler) ListActions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.ListActions(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateAction(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateAction(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateAction(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteAction(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Role Permissions ----

func (h *Handler) ListRolePermissions(w http.ResponseWriter, r *http.Request) {
	roleId := chi.URLParam(r, "roleId")
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.ListRolePermissions(r.Context(), roleId, sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) AddRolePermission(w http.ResponseWriter, r *http.Request) {
	roleId := chi.URLParam(r, "roleId")
	var body struct {
		PermissionID any `json:"permissionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	data, err := h.store.AddRolePermission(r.Context(), roleId, body.PermissionID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) RemoveRolePermission(w http.ResponseWriter, r *http.Request) {
	roleId := chi.URLParam(r, "roleId")
	permId := r.URL.Query().Get("permissionId")

	if err := h.store.RemoveRolePermission(r.Context(), roleId, permId); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- User Roles ----

func (h *Handler) ListUserRoles(w http.ResponseWriter, r *http.Request) {
	users, err := h.store.ListAllUserProfiles(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}

	userRoles, err := h.store.ListActiveUserRoles(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}

	for i, user := range users {
		uid, _ := user["rbacUserProfileId"].(string)
		var matched []map[string]any
		var roles []any
		for _, ur := range userRoles {
			if urUID, _ := ur["rbacUserRoleUserId"].(string); urUID == uid {
				matched = append(matched, ur)
				if role, ok := ur["rbacRole"]; ok {
					roles = append(roles, role)
				}
			}
		}
		if matched == nil {
			matched = []map[string]any{}
		}
		if roles == nil {
			roles = []any{}
		}
		users[i]["userRoles"] = matched
		users[i]["roles"] = roles
	}

	response.OK(w, users)
}

func (h *Handler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	userId := chi.URLParam(r, "userId")
	sa := middleware.IsSuperAdmin(r.Context())

	data, err := h.store.GetUserRoles(r.Context(), userId, sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) AssignUserRole(w http.ResponseWriter, r *http.Request) {
	userId := chi.URLParam(r, "userId")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	roleId := body["rbacUserRoleRoleId"]
	if roleId == nil {
		roleId = body["roleId"]
	}

	data, err := h.store.AssignUserRole(r.Context(), userId, roleId)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	if !middleware.IsSuperAdmin(r.Context()) {
		response.Forbidden(w, "Forbidden")
		return
	}

	userId := chi.URLParam(r, "userId")
	var body struct {
		IsActive *bool `json:"isActive"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IsActive == nil {
		response.BadRequest(w, "isActive must be boolean")
		return
	}

	if err := h.store.SetUserActive(r.Context(), userId, *body.IsActive); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) RemoveUserRole(w http.ResponseWriter, r *http.Request) {
	userId := chi.URLParam(r, "userId")
	roleId := r.URL.Query().Get("rbacUserRoleRoleId")
	if roleId == "" {
		roleId = r.URL.Query().Get("roleId")
	}

	if err := h.store.RemoveUserRole(r.Context(), userId, roleId); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- User Permissions (RPC) ----

func (h *Handler) GetUserPermissions(w http.ResponseWriter, r *http.Request) {
	userId := chi.URLParam(r, "userId")
	result, err := h.store.GetUserPermissions(r.Context(), userId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, result)
}

// ---- Access Logs ----

func (h *Handler) ListAccessLogs(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListAccessLogs(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateAccessLog(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID   string `json:"rbacAccessLogUserId"`
		Resource string `json:"rbacAccessLogResource"`
		Action   string `json:"rbacAccessLogAction"`
		Granted  bool   `json:"rbacAccessLogGranted"`
		Metadata any    `json:"rbacAccessLogMetadata"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	if err := h.store.CreateAccessLog(r.Context(), body.UserID, body.Resource, body.Action, body.Granted, body.Metadata); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, map[string]bool{"success": true})
}
