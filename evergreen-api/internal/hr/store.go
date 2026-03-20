package hr

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Employees ----

func (s *Store) ListEmployees(ctx context.Context, search string, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT
		e."hrEmployeeId",
		e."hrEmployeeFirstName",
		e."hrEmployeeLastName",
		e."hrEmployeeEmail",
		e."hrEmployeePhone",
		e."hrEmployeeHrDivisionId",
		e."hrEmployeeHrDepartmentId",
		e."hrEmployeeHrPositionId",
		e."hrEmployeeCreatedAt",
		e."isActive",
		d."hrDivisionName" AS "divisionName",
		dept."hrDepartmentName" AS "departmentName",
		p."hrPositionTitle" AS "positionName"
	FROM "hrEmployee" e
	LEFT JOIN "hrDivision" d ON d."hrDivisionId" = e."hrEmployeeHrDivisionId"
	LEFT JOIN "hrDepartment" dept ON dept."hrDepartmentId" = e."hrEmployeeHrDepartmentId"
	LEFT JOIN "hrPosition" p ON p."hrPositionId" = e."hrEmployeeHrPositionId"
	WHERE 1=1`
	var args []any
	idx := 1
	if !includeInactive {
		q += ` AND e."isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND (e."hrEmployeeFirstName" ILIKE $%d OR e."hrEmployeeLastName" ILIKE $%d OR e."hrEmployeeEmail" ILIKE $%d)`, idx, idx+1, idx+2)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	q += ` ORDER BY e."hrEmployeeCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateEmployee(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "hrEmployee" ("hrEmployeeFirstName", "hrEmployeeLastName", "hrEmployeeEmail", "hrEmployeePhone", "hrEmployeeHrDivisionId", "hrEmployeeHrDepartmentId", "hrEmployeeHrPositionId")
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
	`, body["hrEmployeeFirstName"], body["hrEmployeeLastName"], body["hrEmployeeEmail"],
		body["hrEmployeePhone"], body["hrEmployeeHrDivisionId"], body["hrEmployeeHrDepartmentId"], body["hrEmployeeHrPositionId"])
}

func (s *Store) GetEmployee(ctx context.Context, id string, includeInactive bool) (map[string]any, error) {
	q := `SELECT
		e."hrEmployeeId",
		e."hrEmployeeFirstName",
		e."hrEmployeeLastName",
		e."hrEmployeeEmail",
		e."hrEmployeePhone",
		e."hrEmployeeHrDivisionId",
		e."hrEmployeeHrDepartmentId",
		e."hrEmployeeHrPositionId",
		e."hrEmployeeCreatedAt",
		e."isActive",
		d."hrDivisionName" AS "divisionName",
		dept."hrDepartmentName" AS "departmentName",
		p."hrPositionTitle" AS "positionName"
	FROM "hrEmployee" e
	LEFT JOIN "hrDivision" d ON d."hrDivisionId" = e."hrEmployeeHrDivisionId"
	LEFT JOIN "hrDepartment" dept ON dept."hrDepartmentId" = e."hrEmployeeHrDepartmentId"
	LEFT JOIN "hrPosition" p ON p."hrPositionId" = e."hrEmployeeHrPositionId"
	WHERE e."hrEmployeeId" = $1`
	if !includeInactive {
		q += ` AND e."isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) UpdateEmployee(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "hrEmployee" SET
			"hrEmployeeFirstName" = COALESCE($2, "hrEmployeeFirstName"),
			"hrEmployeeLastName" = COALESCE($3, "hrEmployeeLastName"),
			"hrEmployeeEmail" = COALESCE($4, "hrEmployeeEmail"),
			"hrEmployeePhone" = COALESCE($5, "hrEmployeePhone"),
			"hrEmployeeHrDivisionId" = COALESCE($6, "hrEmployeeHrDivisionId"),
			"hrEmployeeHrDepartmentId" = COALESCE($7, "hrEmployeeHrDepartmentId"),
			"hrEmployeeHrPositionId" = COALESCE($8, "hrEmployeeHrPositionId")
		WHERE "hrEmployeeId" = $1 RETURNING *
	`, id, body["hrEmployeeFirstName"], body["hrEmployeeLastName"], body["hrEmployeeEmail"],
		body["hrEmployeePhone"], body["hrEmployeeHrDivisionId"], body["hrEmployeeHrDepartmentId"], body["hrEmployeeHrPositionId"])
}

func (s *Store) DeleteEmployee(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "hrEmployee" SET "isActive" = false WHERE "hrEmployeeId" = $1`, id)
	return err
}

// ---- Departments ----

func (s *Store) ListDepartments(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT "hrDepartmentId", "hrDepartmentName", "hrDepartmentDescription", "hrDepartmentHrDivisionId", "hrDepartmentCreatedAt", "isActive" FROM "hrDepartment"`
	if !includeInactive {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrDepartmentName"`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreateDepartment(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "hrDepartment" ("hrDepartmentName", "hrDepartmentDescription", "hrDepartmentHrDivisionId")
		VALUES ($1, $2, $3) RETURNING *
	`, body["hrDepartmentName"], body["hrDepartmentDescription"], body["hrDepartmentHrDivisionId"])
}

func (s *Store) UpdateDepartment(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "hrDepartment" SET
			"hrDepartmentName" = COALESCE($2, "hrDepartmentName"),
			"hrDepartmentDescription" = COALESCE($3, "hrDepartmentDescription"),
			"hrDepartmentHrDivisionId" = COALESCE($4, "hrDepartmentHrDivisionId")
		WHERE "hrDepartmentId" = $1 RETURNING *
	`, id, body["hrDepartmentName"], body["hrDepartmentDescription"], body["hrDepartmentHrDivisionId"])
}

func (s *Store) DeleteDepartment(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "hrDepartment" SET "isActive" = false WHERE "hrDepartmentId" = $1`, id)
	return err
}

// ---- Divisions ----

func (s *Store) ListDivisions(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT "hrDivisionId", "hrDivisionName", "hrDivisionDescription", "hrDivisionCreatedAt", "isActive" FROM "hrDivision"`
	if !includeInactive {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrDivisionName"`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreateDivision(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "hrDivision" ("hrDivisionName", "hrDivisionDescription")
		VALUES ($1, $2) RETURNING *
	`, body["hrDivisionName"], body["hrDivisionDescription"])
}

func (s *Store) UpdateDivision(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "hrDivision" SET
			"hrDivisionName" = COALESCE($2, "hrDivisionName"),
			"hrDivisionDescription" = COALESCE($3, "hrDivisionDescription")
		WHERE "hrDivisionId" = $1 RETURNING *
	`, id, body["hrDivisionName"], body["hrDivisionDescription"])
}

func (s *Store) DeleteDivision(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "hrDivision" SET "isActive" = false WHERE "hrDivisionId" = $1`, id)
	return err
}

// ---- Positions ----

func (s *Store) ListPositions(ctx context.Context, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT "hrPositionId", "hrPositionTitle", "hrPositionDescription", "hrPositionHrDepartmentId", "hrPositionCreatedAt", "isActive" FROM "hrPosition"`
	if !includeInactive {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrPositionTitle"`
	return db.QueryRows(ctx, s.pool, q)
}

func (s *Store) CreatePosition(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "hrPosition" ("hrPositionTitle", "hrPositionDescription", "hrPositionHrDepartmentId")
		VALUES ($1, $2, $3) RETURNING *
	`, body["hrPositionTitle"], body["hrPositionDescription"], body["hrPositionHrDepartmentId"])
}

func (s *Store) UpdatePosition(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "hrPosition" SET
			"hrPositionTitle" = COALESCE($2, "hrPositionTitle"),
			"hrPositionDescription" = COALESCE($3, "hrPositionDescription"),
			"hrPositionHrDepartmentId" = COALESCE($4, "hrPositionHrDepartmentId")
		WHERE "hrPositionId" = $1 RETURNING *
	`, id, body["hrPositionTitle"], body["hrPositionDescription"], body["hrPositionHrDepartmentId"])
}

func (s *Store) DeletePosition(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "hrPosition" SET "isActive" = false WHERE "hrPositionId" = $1`, id)
	return err
}

// ---- Dashboard ----

func (s *Store) ListAllEmployees(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT
		e."isActive",
		e."hrEmployeeCreatedAt",
		d."hrDivisionName" AS "divisionName",
		dept."hrDepartmentName" AS "departmentName"
	FROM "hrEmployee" e
	LEFT JOIN "hrDivision" d ON d."hrDivisionId" = e."hrEmployeeHrDivisionId"
	LEFT JOIN "hrDepartment" dept ON dept."hrDepartmentId" = e."hrEmployeeHrDepartmentId"`)
}

func (s *Store) ListActiveDivisions(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "hrDivisionId" FROM "hrDivision" WHERE "isActive" = true`)
}

func (s *Store) ListActiveDepartments(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "hrDepartmentId" FROM "hrDepartment" WHERE "isActive" = true`)
}

func (s *Store) ListActivePositions(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "hrPositionId" FROM "hrPosition" WHERE "isActive" = true`)
}

// ---- Unlinked ----

func (s *Store) ListUnlinkedEmployees(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "hrEmployeeId", "hrEmployeeFirstName", "hrEmployeeLastName", "hrEmployeeEmail"
		FROM "hrEmployee"
		WHERE "isActive" = true AND "hrEmployeeUserId" IS NULL
		ORDER BY "hrEmployeeFirstName"
	`)
}

func (s *Store) ListAllUserProfiles(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "rbacUserProfileId", "rbacUserProfileEmail", "rbacUserProfileCreatedAt" FROM "rbacUserProfile"`)
}

func (s *Store) ListLinkedEmployees(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "hrEmployeeUserId" FROM "hrEmployee"
		WHERE "isActive" = true AND "hrEmployeeUserId" IS NOT NULL
	`)
}
