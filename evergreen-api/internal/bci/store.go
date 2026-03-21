package bci

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

// Store handles all SQL queries for the bci domain.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore creates a new bci Store.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ListProjects returns all projects, optionally filtered by a search term.
func (s *Store) ListProjects(ctx context.Context, search string) ([]map[string]any, error) {
	cols := `"bciProjectId", "bciProjectExternalRef", "bciProjectName", "bciProjectType", "bciProjectDescription",
		"bciProjectStreetName", "bciProjectCityOrTown", "bciProjectStateProvince", "bciProjectRegion", "bciProjectCountry",
		"bciProjectValue", "bciProjectCurrency", "bciProjectStage", "bciProjectStageStatus",
		"bciProjectCategory", "bciProjectSubCategory", "bciProjectDevelopmentType", "bciProjectOwnershipType",
		"bciProjectOwnerCompany", "bciProjectOwnerContact", "bciProjectOwnerPhone", "bciProjectOwnerEmail",
		"bciProjectArchitectCompany", "bciProjectArchitectContact", "bciProjectArchitectPhone", "bciProjectArchitectEmail",
		"bciProjectContractorCompany", "bciProjectContractorContact", "bciProjectContractorPhone", "bciProjectContractorEmail",
		"bciProjectPmCompany", "bciProjectPmContact", "bciProjectPmPhone", "bciProjectPmEmail",
		"bciProjectStoreys", "bciProjectFloorArea", "bciProjectSiteArea",
		"bciProjectConstructionStartDate", "bciProjectConstructionStartString", "bciProjectConstructionEndDate", "bciProjectConstructionEndString",
		"bciProjectRemarks", "bciProjectModifiedDate"`
	if search != "" {
		pattern := "%" + search + "%"
		return db.QueryRows(ctx, s.pool,
			`SELECT `+cols+` FROM "bciProject" WHERE ("bciProjectName" ILIKE $1 OR "bciProjectOwnerCompany" ILIKE $2 OR "bciProjectContractorCompany" ILIKE $3) ORDER BY "bciProjectModifiedDate" DESC NULLS LAST`,
			pattern, pattern, pattern)
	}
	return db.QueryRows(ctx, s.pool, `SELECT `+cols+` FROM "bciProject" ORDER BY "bciProjectModifiedDate" DESC NULLS LAST`)
}

// CreateProject inserts a new bciProject row and returns it.
func (s *Store) CreateProject(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "bciProject" ("bciProjectName","bciProjectType","bciProjectDescription","bciProjectStreetName",
			"bciProjectCityOrTown","bciProjectStateProvince","bciProjectRegion","bciProjectCountry",
			"bciProjectValue","bciProjectCurrency","bciProjectStage","bciProjectStageStatus",
			"bciProjectCategory","bciProjectSubCategory","bciProjectOwnerCompany")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING "bciProjectId","bciProjectExternalRef","bciProjectName","bciProjectType",
			"bciProjectDescription","bciProjectStreetName","bciProjectCityOrTown",
			"bciProjectStateProvince","bciProjectRegion","bciProjectCountry",
			"bciProjectValue","bciProjectCurrency","bciProjectStage","bciProjectStageStatus",
			"bciProjectCategory","bciProjectSubCategory","bciProjectOwnerCompany","bciProjectModifiedDate"
	`, body["bciProjectName"], body["bciProjectType"], body["bciProjectDescription"],
		body["bciProjectStreetName"], body["bciProjectCityOrTown"], body["bciProjectStateProvince"],
		body["bciProjectRegion"], body["bciProjectCountry"], body["bciProjectValue"],
		body["bciProjectCurrency"], body["bciProjectStage"], body["bciProjectStageStatus"],
		body["bciProjectCategory"], body["bciProjectSubCategory"], body["bciProjectOwnerCompany"])
}

// UpsertProjectRecord builds and executes a dynamic upsert from a flat record map.
// The record must contain "bciProjectExternalRef" as the conflict key.
func (s *Store) UpsertProjectRecord(ctx context.Context, record map[string]any) error {
	cols := []string{}
	vals := []any{}
	placeholders := []string{}
	updates := []string{}
	idx := 1
	for col, val := range record {
		cols = append(cols, fmt.Sprintf(`"%s"`, col))
		vals = append(vals, val)
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		if col != "bciProjectExternalRef" {
			updates = append(updates, fmt.Sprintf(`"%s"=EXCLUDED."%s"`, col, col))
		}
		idx++
	}
	q := fmt.Sprintf(
		`INSERT INTO "bciProject" (%s) VALUES (%s) ON CONFLICT ("bciProjectExternalRef") DO UPDATE SET %s`,
		strings.Join(cols, ","),
		strings.Join(placeholders, ","),
		strings.Join(updates, ","),
	)
	_, err := s.pool.Exec(ctx, q, vals...)
	return err
}
