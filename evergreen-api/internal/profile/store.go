package profile

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

// GetUserProfile returns the rbacUserProfile row for a given user ID.
func (s *Store) GetUserProfile(ctx context.Context, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "rbacUserProfileId", "rbacUserProfileEmail", "rbacUserProfileCreatedAt" FROM "rbacUserProfile" WHERE "rbacUserProfileId" = $1`, userID)
}

// GetEmployee returns the hrEmployee row linked to a given user ID, with resolved division/department/position names.
func (s *Store) GetEmployee(ctx context.Context, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT
		e."hrEmployeeId",
		e."hrEmployeeFirstName",
		e."hrEmployeeLastName",
		e."hrEmployeeEmail",
		e."hrEmployeePhone",
		e."isActive",
		d."hrDivisionName" AS "divisionName",
		dept."hrDepartmentName" AS "departmentName",
		p."hrPositionTitle" AS "positionName"
	FROM "hrEmployee" e
	LEFT JOIN "hrDivision" d ON d."hrDivisionId" = e."hrEmployeeHrDivisionId"
	LEFT JOIN "hrDepartment" dept ON dept."hrDepartmentId" = e."hrEmployeeHrDepartmentId"
	LEFT JOIN "hrPosition" p ON p."hrPositionId" = e."hrEmployeeHrPositionId"
	WHERE e."hrEmployeeUserId" = $1 LIMIT 1`, userID)
}

// GetUserRoles returns all active roles assigned to a given user ID.
func (s *Store) GetUserRoles(ctx context.Context, userID string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT r."rbacRoleId", r."rbacRoleName", r."rbacRoleIsSuperadmin"
		FROM "rbacUserRole" ur
		JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
		WHERE ur."rbacUserRoleUserId" = $1
		  AND ur."isActive" = true
	`, userID)
}
