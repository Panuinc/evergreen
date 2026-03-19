package it

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

// ---- Assets ----

func (s *Store) ListAssets(ctx context.Context, search string, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT * FROM "itAsset" WHERE 1=1`
	var args []any
	idx := 1
	if !includeInactive {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("itAssetName" ILIKE $%d OR "itAssetTag" ILIKE $%d OR "itAssetBrand" ILIKE $%d)`, idx, idx+1, idx+2)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	q += ` ORDER BY "itAssetCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateAsset(ctx context.Context, args ...any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "itAsset" ("itAssetName", "itAssetTag", "itAssetCategory", "itAssetBrand", "itAssetModel", "itAssetSerialNumber", "itAssetStatus", "itAssetAssignedTo", "itAssetPurchaseDate", "itAssetWarrantyExpiry", "itAssetLocation", "itAssetNotes")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
	`, args...)
}

func (s *Store) GetAsset(ctx context.Context, id string, includeInactive bool) (map[string]any, error) {
	q := `SELECT * FROM "itAsset" WHERE "itAssetId" = $1`
	if !includeInactive {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) UpdateAsset(ctx context.Context, args ...any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "itAsset" SET
			"itAssetName" = COALESCE($2, "itAssetName"),
			"itAssetTag" = COALESCE($3, "itAssetTag"),
			"itAssetCategory" = COALESCE($4, "itAssetCategory"),
			"itAssetBrand" = COALESCE($5, "itAssetBrand"),
			"itAssetModel" = COALESCE($6, "itAssetModel"),
			"itAssetSerialNumber" = COALESCE($7, "itAssetSerialNumber"),
			"itAssetStatus" = COALESCE($8, "itAssetStatus"),
			"itAssetAssignedTo" = COALESCE($9, "itAssetAssignedTo"),
			"itAssetPurchaseDate" = COALESCE($10, "itAssetPurchaseDate"),
			"itAssetWarrantyExpiry" = COALESCE($11, "itAssetWarrantyExpiry"),
			"itAssetLocation" = COALESCE($12, "itAssetLocation"),
			"itAssetNotes" = COALESCE($13, "itAssetNotes")
		WHERE "itAssetId" = $1 RETURNING *
	`, args...)
}

func (s *Store) DeleteAsset(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "itAsset" SET "isActive" = false WHERE "itAssetId" = $1`, id)
	return err
}

// ---- Dev Requests ----

func (s *Store) ListDevRequests(ctx context.Context, search string, includeInactive bool) ([]map[string]any, error) {
	q := `SELECT * FROM "itDevRequest" WHERE 1=1`
	var args []any
	idx := 1
	if !includeInactive {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("itDevRequestNo" ILIKE $%d OR "itDevRequestTitle" ILIKE $%d OR "itDevRequestRequestedBy" ILIKE $%d OR "itDevRequestAssignedTo" ILIKE $%d)`, idx, idx+1, idx+2, idx+3)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}
	q += ` ORDER BY "itDevRequestCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateDevRequest(ctx context.Context, args ...any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "itDevRequest" ("itDevRequestNo", "itDevRequestTitle", "itDevRequestDescription", "itDevRequestRequestedBy", "itDevRequestAssignedTo", "itDevRequestStatus", "itDevRequestPriority", "itDevRequestDueDate", "itDevRequestStartDate", "itDevRequestNotes")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
	`, args...)
}

func (s *Store) GetDevRequest(ctx context.Context, id string, includeInactive bool) (map[string]any, error) {
	q := `SELECT * FROM "itDevRequest" WHERE "itDevRequestId" = $1`
	if !includeInactive {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) UpdateDevRequest(ctx context.Context, args ...any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "itDevRequest" SET
			"itDevRequestNo" = COALESCE($2, "itDevRequestNo"),
			"itDevRequestTitle" = COALESCE($3, "itDevRequestTitle"),
			"itDevRequestDescription" = COALESCE($4, "itDevRequestDescription"),
			"itDevRequestRequestedBy" = COALESCE($5, "itDevRequestRequestedBy"),
			"itDevRequestAssignedTo" = COALESCE($6, "itDevRequestAssignedTo"),
			"itDevRequestStatus" = COALESCE($7, "itDevRequestStatus"),
			"itDevRequestPriority" = COALESCE($8, "itDevRequestPriority"),
			"itDevRequestDueDate" = COALESCE($9, "itDevRequestDueDate"),
			"itDevRequestStartDate" = COALESCE($10, "itDevRequestStartDate"),
			"itDevRequestNotes" = COALESCE($11, "itDevRequestNotes")
		WHERE "itDevRequestId" = $1 RETURNING *
	`, args...)
}

func (s *Store) DeleteDevRequest(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "itDevRequest" SET "isActive" = false WHERE "itDevRequestId" = $1`, id)
	return err
}

// ---- Progress Logs ----

func (s *Store) ListProgressLogs(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "itDevProgressLog"
		WHERE "itDevProgressLogRequestId" = $1
		ORDER BY "itDevProgressLogCreatedAt" DESC
	`, id)
}

func (s *Store) CreateProgressLog(ctx context.Context, id string, progress any, description any, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "itDevProgressLog" ("itDevProgressLogRequestId", "itDevProgressLogProgress", "itDevProgressLogDescription", "itDevProgressLogCreatedBy")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, id, progress, description, createdBy)
}

func (s *Store) UpdateDevRequestCompleted(ctx context.Context, id string, progress any) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "itDevRequest" SET "itDevRequestProgress" = $2, "itDevRequestStatus" = 'completed', "itDevRequestCompletedAt" = now()
		WHERE "itDevRequestId" = $1
	`, id, progress)
	return err
}

func (s *Store) UpdateDevRequestInProgress(ctx context.Context, id string, progress any) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "itDevRequest" SET "itDevRequestProgress" = $2, "itDevRequestStatus" = 'in_progress'
		WHERE "itDevRequestId" = $1
	`, id, progress)
	return err
}

func (s *Store) UpdateDevRequestProgress(ctx context.Context, id string, progress any) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "itDevRequest" SET "itDevRequestProgress" = $2
		WHERE "itDevRequestId" = $1
	`, id, progress)
	return err
}

// ---- Dashboard ----

func (s *Store) ListActiveAssets(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "itAsset" WHERE "isActive" = true`)
}

func (s *Store) ListActiveDevRequests(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "itDevRequest" WHERE "isActive" = true`)
}
