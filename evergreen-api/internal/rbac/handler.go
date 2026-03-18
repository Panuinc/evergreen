package rbac

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/roles", func(r chi.Router) {
		r.Get("/", h.ListRoles)
		r.Post("/", h.CreateRole)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetRole)
			r.Put("/", h.UpdateRole)
			r.Delete("/", h.DeleteRole)
		})
	})

	r.Route("/permissions", func(r chi.Router) {
		r.Get("/", h.ListPermissions)
		r.Post("/", h.CreatePermission)
		r.Delete("/{id}", h.DeletePermission)
	})

	r.Route("/resources", func(r chi.Router) {
		r.Get("/", h.ListResources)
		r.Post("/", h.CreateResource)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateResource)
			r.Delete("/", h.DeleteResource)
		})
	})

	r.Route("/actions", func(r chi.Router) {
		r.Get("/", h.ListActions)
		r.Post("/", h.CreateAction)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateAction)
			r.Delete("/", h.DeleteAction)
		})
	})

	r.Route("/rolePermissions/{roleId}", func(r chi.Router) {
		r.Get("/", h.ListRolePermissions)
		r.Post("/", h.AddRolePermission)
		r.Delete("/", h.RemoveRolePermission)
	})

	r.Get("/userRoles", h.ListUserRoles)
	r.Route("/userRoles/{userId}", func(r chi.Router) {
		r.Get("/", h.GetUserRoles)
		r.Post("/", h.AssignUserRole)
		r.Patch("/", h.ToggleUserActive)
		r.Delete("/", h.RemoveUserRole)
	})

	r.Get("/userPermissions/{userId}", h.GetUserPermissions)

	r.Route("/accessLogs", func(r chi.Router) {
		r.Get("/", h.ListAccessLogs)
		r.Post("/", h.CreateAccessLog)
	})

	return r
}

// ---- Roles ----

func (h *Handler) ListRoles(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT r.*,
		(SELECT count(*) FROM "rbacUserRole" ur WHERE ur."rbacUserRoleRoleId" = r."rbacRoleId" AND ur."isActive" = true) as "userCount",
		(SELECT count(*) FROM "rbacRolePermission" rp WHERE rp."rbacRolePermissionRoleId" = r."rbacRoleId" AND rp."isActive" = true) as "permissionCount"
		FROM "rbacRole" r`
	if !sa {
		q += ` WHERE r."isActive" = true`
	}
	q += ` ORDER BY r."rbacRoleCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q)
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

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacRole" ("rbacRoleName", "rbacRoleDescription", "rbacRoleIsSuperadmin")
		VALUES ($1, $2, $3)
		RETURNING *
	`, body["rbacRoleName"], body["rbacRoleDescription"], body["rbacRoleIsSuperadmin"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())

	q := `SELECT * FROM "rbacRole" WHERE "rbacRoleId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	role, err := db.QueryRow(r.Context(), h.pool, q, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Role")
		return
	}

	// Get role permissions with nested data
	perms, err := db.QueryRows(r.Context(), h.pool, `
		SELECT rp.*, p.*, res.*, act.*
		FROM "rbacRolePermission" rp
		JOIN "rbacPermission" p ON p."rbacPermissionId" = rp."rbacRolePermissionPermissionId"
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"
		WHERE rp."rbacRolePermissionRoleId" = $1 AND rp."isActive" = true
	`, id)
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

	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "rbacRole" SET
			"rbacRoleName" = COALESCE($2, "rbacRoleName"),
			"rbacRoleDescription" = COALESCE($3, "rbacRoleDescription"),
			"rbacRoleIsSuperadmin" = COALESCE($4, "rbacRoleIsSuperadmin")
		WHERE "rbacRoleId" = $1
		RETURNING *
	`, id, body["rbacRoleName"], body["rbacRoleDescription"], body["rbacRoleIsSuperadmin"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "rbacRole" SET "isActive" = false WHERE "rbacRoleId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Permissions ----

func (h *Handler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT p.*,
		row_to_json(res.*) as "rbacResource",
		row_to_json(act.*) as "rbacAction"
		FROM "rbacPermission" p
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"`
	if !sa {
		q += ` WHERE p."isActive" = true`
	}
	q += ` ORDER BY p."rbacPermissionCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q)
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

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacPermission" ("rbacPermissionResourceId", "rbacPermissionActionId")
		VALUES ($1, $2)
		RETURNING *
	`, body["rbacPermissionResourceId"], body["rbacPermissionActionId"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) DeletePermission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "rbacPermission" SET "isActive" = false WHERE "rbacPermissionId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Resources ----

func (h *Handler) ListResources(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "rbacResource"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "rbacResourceName"`

	data, err := db.QueryRows(r.Context(), h.pool, q)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacResource" ("rbacResourceName", "rbacResourceDescription")
		VALUES ($1, $2) RETURNING *
	`, body["rbacResourceName"], body["rbacResourceDescription"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "rbacResource" SET
			"rbacResourceName" = COALESCE($2, "rbacResourceName"),
			"rbacResourceDescription" = COALESCE($3, "rbacResourceDescription")
		WHERE "rbacResourceId" = $1 RETURNING *
	`, id, body["rbacResourceName"], body["rbacResourceDescription"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteResource(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "rbacResource" SET "isActive" = false WHERE "rbacResourceId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Actions ----

func (h *Handler) ListActions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "rbacAction"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "rbacActionName"`

	data, err := db.QueryRows(r.Context(), h.pool, q)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacAction" ("rbacActionName", "rbacActionDescription")
		VALUES ($1, $2) RETURNING *
	`, body["rbacActionName"], body["rbacActionDescription"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "rbacAction" SET
			"rbacActionName" = COALESCE($2, "rbacActionName"),
			"rbacActionDescription" = COALESCE($3, "rbacActionDescription")
		WHERE "rbacActionId" = $1 RETURNING *
	`, id, body["rbacActionName"], body["rbacActionDescription"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "rbacAction" SET "isActive" = false WHERE "rbacActionId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Role Permissions ----

func (h *Handler) ListRolePermissions(w http.ResponseWriter, r *http.Request) {
	roleId := chi.URLParam(r, "roleId")
	sa := middleware.IsSuperAdmin(r.Context())

	q := `SELECT rp.*,
		row_to_json(p.*) as "rbacPermission",
		row_to_json(res.*) as "rbacResource",
		row_to_json(act.*) as "rbacAction"
		FROM "rbacRolePermission" rp
		JOIN "rbacPermission" p ON p."rbacPermissionId" = rp."rbacRolePermissionPermissionId"
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"
		WHERE rp."rbacRolePermissionRoleId" = $1`
	if !sa {
		q += ` AND rp."isActive" = true`
	}

	data, err := db.QueryRows(r.Context(), h.pool, q, roleId)
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

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacRolePermission" ("rbacRolePermissionRoleId", "rbacRolePermissionPermissionId")
		VALUES ($1, $2) RETURNING *
	`, roleId, body.PermissionID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) RemoveRolePermission(w http.ResponseWriter, r *http.Request) {
	roleId := chi.URLParam(r, "roleId")
	permId := r.URL.Query().Get("permissionId")

	_, err := h.pool.Exec(r.Context(), `
		UPDATE "rbacRolePermission" SET "isActive" = false
		WHERE "rbacRolePermissionRoleId" = $1 AND "rbacRolePermissionPermissionId" = $2
	`, roleId, permId)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- User Roles ----

func (h *Handler) ListUserRoles(w http.ResponseWriter, r *http.Request) {
	// Get all users
	users, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "rbacUserProfile" ORDER BY "rbacUserProfileCreatedAt" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	// Get all active user-role mappings
	userRoles, err := db.QueryRows(r.Context(), h.pool, `
		SELECT ur.*, row_to_json(r.*) as "rbacRole"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."isActive" = true
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	// Client-side join
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

	q := `SELECT ur.*, row_to_json(r.*) as "rbacRole"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."rbacUserRoleUserId" = $1`
	if !sa {
		q += ` AND ur."isActive" = true`
	}

	data, err := db.QueryRows(r.Context(), h.pool, q, userId)
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

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "rbacUserRole" ("rbacUserRoleUserId", "rbacUserRoleRoleId")
		VALUES ($1, $2) RETURNING *
	`, userId, roleId)
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

	_, err := h.pool.Exec(r.Context(), `
		UPDATE "rbacUserProfile" SET "isActive" = $2 WHERE "rbacUserProfileId" = $1
	`, userId, *body.IsActive)
	if err != nil {
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

	_, err := h.pool.Exec(r.Context(), `
		UPDATE "rbacUserRole" SET "isActive" = false
		WHERE "rbacUserRoleUserId" = $1 AND "rbacUserRoleRoleId" = $2
	`, userId, roleId)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- User Permissions (RPC) ----

func (h *Handler) GetUserPermissions(w http.ResponseWriter, r *http.Request) {
	userId := chi.URLParam(r, "userId")

	rows, err := h.pool.Query(r.Context(), `SELECT * FROM get_user_permissions($1)`, userId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	defer rows.Close()

	var result []map[string]any
	for rows.Next() {
		var resourceName, actionName string
		var isSuperadmin bool
		if err := rows.Scan(&resourceName, &actionName, &isSuperadmin); err != nil {
			response.InternalError(w, err)
			return
		}
		result = append(result, map[string]any{
			"permission":  resourceName + ":" + actionName,
			"isSuperadmin": isSuperadmin,
		})
	}
	if result == nil {
		result = []map[string]any{}
	}
	response.OK(w, result)
}

// ---- Access Logs ----

func (h *Handler) ListAccessLogs(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "rbacAccessLog"
		ORDER BY "rbacAccessLogCreatedAt" DESC
		LIMIT 200
	`)
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

	_, err := h.pool.Exec(r.Context(), `
		INSERT INTO "rbacAccessLog" ("rbacAccessLogUserId", "rbacAccessLogResource", "rbacAccessLogAction", "rbacAccessLogGranted", "rbacAccessLogMetadata")
		VALUES ($1, $2, $3, $4, $5)
	`, body.UserID, body.Resource, body.Action, body.Granted, body.Metadata)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, map[string]bool{"success": true})
}
