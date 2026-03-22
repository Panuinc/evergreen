package rbac

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Roles ----

func (s *Store) ListRoles(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT r."rbacRoleId", r."rbacRoleName", r."rbacRoleDescription", r."rbacRoleIsSuperadmin", r."rbacRoleCreatedAt", r."isActive",
		COUNT(DISTINCT ur."rbacUserRoleId") FILTER (WHERE ur."isActive" = true) AS "userCount",
		COUNT(DISTINCT rp."rbacRolePermissionId") FILTER (WHERE rp."isActive" = true) AS "permissionCount"
		FROM "rbacRole" r
		LEFT JOIN "rbacUserRole" ur ON ur."rbacUserRoleRoleId" = r."rbacRoleId"
		LEFT JOIN "rbacRolePermission" rp ON rp."rbacRolePermissionRoleId" = r."rbacRoleId"`
	if !includeInactive {
		q += ` WHERE r."isActive" = true`
	}
	q += ` GROUP BY r."rbacRoleId", r."rbacRoleName", r."rbacRoleDescription", r."rbacRoleIsSuperadmin", r."rbacRoleCreatedAt", r."isActive"`
	q += ` ORDER BY r."rbacRoleCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreateRole(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacRole" ("rbacRoleName", "rbacRoleDescription", "rbacRoleIsSuperadmin")
		VALUES ($1, $2, $3)
		RETURNING *
	`, body["rbacRoleName"], body["rbacRoleDescription"], body["rbacRoleIsSuperadmin"])
}

func (s *Store) GetRole(ctx context.Context, id string, includeInactive bool) (map[string]any, error) {
	q := `SELECT "rbacRoleId", "rbacRoleName", "rbacRoleDescription", "rbacRoleIsSuperadmin", "rbacRoleCreatedAt", "isActive" FROM "rbacRole" WHERE "rbacRoleId" = $1`
	if !includeInactive {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) GetRolePermissions(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT rp."rbacRolePermissionId", rp."rbacRolePermissionRoleId", rp."rbacRolePermissionPermissionId", rp."isActive",
			p."rbacPermissionId", p."rbacPermissionResourceId", p."rbacPermissionActionId",
			res."rbacResourceId", res."rbacResourceName",
			act."rbacActionId", act."rbacActionName"
		FROM "rbacRolePermission" rp
		JOIN "rbacPermission" p ON p."rbacPermissionId" = rp."rbacRolePermissionPermissionId"
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"
		WHERE rp."rbacRolePermissionRoleId" = $1 AND rp."isActive" = true
	`, id)
}

func (s *Store) UpdateRole(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "rbacRole" SET
			"rbacRoleName" = COALESCE($2, "rbacRoleName"),
			"rbacRoleDescription" = COALESCE($3, "rbacRoleDescription"),
			"rbacRoleIsSuperadmin" = COALESCE($4, "rbacRoleIsSuperadmin")
		WHERE "rbacRoleId" = $1
		RETURNING *
	`, id, body["rbacRoleName"], body["rbacRoleDescription"], body["rbacRoleIsSuperadmin"])
}

func (s *Store) DeleteRole(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "rbacRole" SET "isActive" = false WHERE "rbacRoleId" = $1`, id)
	return err
}

// ---- Permissions ----

func (s *Store) ListPermissions(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT p."rbacPermissionId", p."rbacPermissionResourceId", p."rbacPermissionActionId", p."isActive",
		json_build_object('rbacResourceId', res."rbacResourceId", 'rbacResourceName', res."rbacResourceName", 'rbacResourceDescription', res."rbacResourceDescription") as "rbacResource",
		json_build_object('rbacActionId', act."rbacActionId", 'rbacActionName', act."rbacActionName") as "rbacAction"
		FROM "rbacPermission" p
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"`
	if !includeInactive {
		q += ` WHERE p."isActive" = true`
	}
	q += ` ORDER BY p."rbacPermissionCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreatePermission(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacPermission" ("rbacPermissionResourceId", "rbacPermissionActionId")
		VALUES ($1, $2)
		RETURNING *
	`, body["rbacPermissionResourceId"], body["rbacPermissionActionId"])
}

func (s *Store) DeletePermission(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "rbacPermission" SET "isActive" = false WHERE "rbacPermissionId" = $1`, id)
	return err
}

// ---- Resources ----

func (s *Store) ListResources(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT "rbacResourceId", "rbacResourceName", "rbacResourceDescription", "rbacResourceModuleRef", "isActive" FROM "rbacResource"`
	if !includeInactive {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "rbacResourceName"`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreateResource(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacResource" ("rbacResourceName", "rbacResourceDescription")
		VALUES ($1, $2) RETURNING *
	`, body["rbacResourceName"], body["rbacResourceDescription"])
}

func (s *Store) UpdateResource(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "rbacResource" SET
			"rbacResourceName" = COALESCE($2, "rbacResourceName"),
			"rbacResourceDescription" = COALESCE($3, "rbacResourceDescription")
		WHERE "rbacResourceId" = $1 RETURNING *
	`, id, body["rbacResourceName"], body["rbacResourceDescription"])
}

func (s *Store) DeleteResource(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "rbacResource" SET "isActive" = false WHERE "rbacResourceId" = $1`, id)
	return err
}

// ---- Actions ----

func (s *Store) ListActions(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT "rbacActionId", "rbacActionName", "rbacActionDescription", "rbacActionCreatedAt", "isActive" FROM "rbacAction"`
	if !includeInactive {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "rbacActionName"`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreateAction(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacAction" ("rbacActionName", "rbacActionDescription")
		VALUES ($1, $2) RETURNING *
	`, body["rbacActionName"], body["rbacActionDescription"])
}

func (s *Store) UpdateAction(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "rbacAction" SET
			"rbacActionName" = COALESCE($2, "rbacActionName"),
			"rbacActionDescription" = COALESCE($3, "rbacActionDescription")
		WHERE "rbacActionId" = $1 RETURNING *
	`, id, body["rbacActionName"], body["rbacActionDescription"])
}

func (s *Store) DeleteAction(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "rbacAction" SET "isActive" = false WHERE "rbacActionId" = $1`, id)
	return err
}

// ---- Role Permissions ----

func (s *Store) ListRolePermissions(ctx context.Context, roleId string, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT rp."rbacRolePermissionId", rp."rbacRolePermissionRoleId", rp."rbacRolePermissionPermissionId", rp."isActive",
		json_build_object('rbacPermissionId', p."rbacPermissionId", 'rbacPermissionResourceId', p."rbacPermissionResourceId", 'rbacPermissionActionId', p."rbacPermissionActionId") as "rbacPermission",
		json_build_object('rbacResourceId', res."rbacResourceId", 'rbacResourceName', res."rbacResourceName") as "rbacResource",
		json_build_object('rbacActionId', act."rbacActionId", 'rbacActionName', act."rbacActionName") as "rbacAction"
		FROM "rbacRolePermission" rp
		JOIN "rbacPermission" p ON p."rbacPermissionId" = rp."rbacRolePermissionPermissionId"
		LEFT JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
		LEFT JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"
		WHERE rp."rbacRolePermissionRoleId" = $1`
	if !includeInactive {
		q += ` AND rp."isActive" = true`
	}
	return db.QueryRows(ctx, s.pool, q, roleId)
}

func (s *Store) AddRolePermission(ctx context.Context, roleId string, permissionId any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacRolePermission" ("rbacRolePermissionRoleId", "rbacRolePermissionPermissionId")
		VALUES ($1, $2) RETURNING *
	`, roleId, permissionId)
}

func (s *Store) RemoveRolePermission(ctx context.Context, roleId string, permId string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "rbacRolePermission" SET "isActive" = false
		WHERE "rbacRolePermissionRoleId" = $1 AND "rbacRolePermissionPermissionId" = $2
	`, roleId, permId)
	return err
}

// ---- User Roles ----

func (s *Store) ListAllUserProfiles(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "rbacUserProfileId", "rbacUserProfileEmail", "rbacUserProfileCreatedAt", "isActive" FROM "rbacUserProfile" ORDER BY "rbacUserProfileCreatedAt" DESC
	`)
}

func (s *Store) ListActiveUserRoles(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT ur."rbacUserRoleId", ur."rbacUserRoleUserId", ur."rbacUserRoleRoleId", ur."isActive",
			json_build_object('rbacRoleId', r."rbacRoleId", 'rbacRoleName', r."rbacRoleName", 'rbacRoleIsSuperadmin', r."rbacRoleIsSuperadmin", 'rbacRoleDescription', r."rbacRoleDescription") as "rbacRole"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."isActive" = true
	`)
}

func (s *Store) GetUserRoles(ctx context.Context, userId string, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT ur."rbacUserRoleId", ur."rbacUserRoleUserId", ur."rbacUserRoleRoleId", ur."isActive",
		json_build_object('rbacRoleId', r."rbacRoleId", 'rbacRoleName', r."rbacRoleName", 'rbacRoleIsSuperadmin', r."rbacRoleIsSuperadmin", 'rbacRoleDescription', r."rbacRoleDescription") as "rbacRole"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."rbacUserRoleUserId" = $1`
	if !includeInactive {
		q += ` AND ur."isActive" = true`
	}
	return db.QueryRows(ctx, s.pool, q, userId)
}

func (s *Store) AssignUserRole(ctx context.Context, userId string, roleId any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "rbacUserRole" ("rbacUserRoleUserId", "rbacUserRoleRoleId")
		VALUES ($1, $2) RETURNING *
	`, userId, roleId)
}

func (s *Store) SetUserActive(ctx context.Context, userId string, isActive bool) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "rbacUserProfile" SET "isActive" = $2 WHERE "rbacUserProfileId" = $1
	`, userId, isActive)
	return err
}

func (s *Store) RemoveUserRole(ctx context.Context, userId string, roleId string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "rbacUserRole" SET "isActive" = false
		WHERE "rbacUserRoleUserId" = $1 AND "rbacUserRoleRoleId" = $2
	`, userId, roleId)
	return err
}

// ---- User Permissions (RPC) ----

func (s *Store) GetUserPermissions(ctx context.Context, userId string) ([]map[string]any, error) {
	rows, err := s.pool.Query(ctx, `SELECT * FROM get_user_permissions($1)`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]any
	for rows.Next() {
		var resourceName, actionName string
		var isSuperadmin bool
		if err := rows.Scan(&resourceName, &actionName, &isSuperadmin); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{
			"permission":   resourceName + ":" + actionName,
			"isSuperadmin": isSuperadmin,
		})
	}
	if result == nil {
		result = []map[string]any{}
	}
	return result, nil
}

// ---- Access Logs ----

func (s *Store) ListAccessLogs(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT l."rbacAccessLogId", l."rbacAccessLogUserId", l."rbacAccessLogResource", l."rbacAccessLogAction", l."rbacAccessLogGranted", l."rbacAccessLogCreatedAt",
			COALESCE(u."rbacUserProfileEmail", l."rbacAccessLogUserId"::text) AS "rbacUserProfileEmail"
		FROM "rbacAccessLog" l
		LEFT JOIN "rbacUserProfile" u ON u."rbacUserProfileId" = l."rbacAccessLogUserId"
		ORDER BY l."rbacAccessLogCreatedAt" DESC
		LIMIT 200
	`)
}

func (s *Store) CreateAccessLog(ctx context.Context, userID, resource, action string, granted bool, metadata any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "rbacAccessLog" ("rbacAccessLogUserId", "rbacAccessLogResource", "rbacAccessLogAction", "rbacAccessLogGranted", "rbacAccessLogMetadata")
		VALUES ($1, $2, $3, $4, $5)
	`, userID, resource, action, granted, metadata)
	return err
}
