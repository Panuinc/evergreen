package sync

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// VehicleMapping holds identifiers for a single vehicle.
type VehicleMapping struct {
	VehicleID    string
	ForthtrackID string
	PlateNumber  string
}

// GetActiveVehicles returns all active vehicles with their tracking identifiers.
func (s *Store) GetActiveVehicles(ctx context.Context) ([]VehicleMapping, error) {
	rows, err := s.pool.Query(ctx, `SELECT "tmsVehicleId","tmsVehicleForthtrackRef","tmsVehiclePlateNumber" FROM "tmsVehicle" WHERE "isActive"=true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []VehicleMapping
	for rows.Next() {
		var vid, ftid, plate *string
		rows.Scan(&vid, &ftid, &plate)
		m := VehicleMapping{}
		if vid != nil {
			m.VehicleID = *vid
		}
		if ftid != nil {
			m.ForthtrackID = *ftid
		}
		if plate != nil {
			m.PlateNumber = *plate
		}
		result = append(result, m)
	}
	return result, nil
}

// UpsertGpsLog inserts a GPS log entry, ignoring conflicts on (forthtrackId, recordedAt).
func (s *Store) UpsertGpsLog(ctx context.Context, vehicleID string, lat, lng, speed float64, engine, driver, address, fuel, gpsID any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "tmsGpsLog" ("tmsGpsLogVehicleId","tmsGpsLogLatitude","tmsGpsLogLongitude","tmsGpsLogSpeed",
			"tmsGpsLogEngine","tmsGpsLogDriver","tmsGpsLogAddress","tmsGpsLogFuel","tmsGpsLogForthtrackRef","tmsGpsLogSource","tmsGpsLogRecordedAt")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'forthtrack',now())
		ON CONFLICT ("tmsGpsLogForthtrackRef","tmsGpsLogRecordedAt") DO NOTHING
	`, vehicleID, lat, lng, speed, engine, driver, address, fuel, gpsID)
	return err
}

// ---- BC Sync State ----

// GetSyncState returns the stored value for a sync state key.
func (s *Store) GetSyncState(ctx context.Context, key string) (string, error) {
	var val *string
	err := s.pool.QueryRow(ctx,
		`SELECT "bcSyncStateValue" FROM "bcSyncState" WHERE "bcSyncStateKey" = $1`, key,
	).Scan(&val)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	if val == nil {
		return "", nil
	}
	return *val, nil
}

// SetSyncState upserts a sync state key-value pair.
func (s *Store) SetSyncState(ctx context.Context, key, value string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO "bcSyncState" ("bcSyncStateKey", "bcSyncStateValue", "bcSyncStateUpdatedAt")
		 VALUES ($1, $2, $3)
		 ON CONFLICT ("bcSyncStateKey") DO UPDATE SET "bcSyncStateValue" = EXCLUDED."bcSyncStateValue", "bcSyncStateUpdatedAt" = EXCLUDED."bcSyncStateUpdatedAt"`,
		key, value, time.Now().UTC().Format(time.RFC3339),
	)
	return err
}

// ---- Full Sync Table Clear ----

// TruncateTable deletes all rows from a table (used for full sync reset).
func (s *Store) TruncateTable(ctx context.Context, table string) error {
	_, err := s.pool.Exec(ctx, fmt.Sprintf(`TRUNCATE %q CASCADE`, table))
	return err
}

// ---- RFID Assignment ----

// GetMaxItemRfidCode returns the highest existing RFID code integer for the given item table.
func (s *Store) GetMaxItemRfidCode(ctx context.Context, table string) (int, error) {
	var max int
	err := s.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT COALESCE(MAX(CAST("bcItemRfidCode" AS INTEGER)), 0) FROM %q WHERE "bcItemRfidCode" IS NOT NULL`, table),
	).Scan(&max)
	return max, err
}

// GetItemsWithoutRfid returns PKs of items that have no RFID code, ordered for sequential assignment.
func (s *Store) GetItemsWithoutRfid(ctx context.Context, table, pkCol string) ([]string, error) {
	rows, err := s.pool.Query(ctx,
		fmt.Sprintf(`SELECT %q FROM %q WHERE "bcItemRfidCode" IS NULL ORDER BY "bcItemGenProdPostingGroup" ASC, %q ASC`, pkCol, table, pkCol),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var itemNo string
		if err := rows.Scan(&itemNo); err != nil {
			return nil, err
		}
		result = append(result, itemNo)
	}
	return result, rows.Err()
}

// ---- Batch Upsert ----

// BatchUpsert inserts rows into table using INSERT … ON CONFLICT DO UPDATE.
// conflictCols is a comma-separated list of conflict column names.
// Records are split into batches of batchSize executed with up to concurrency parallel workers.
func (s *Store) BatchUpsert(ctx context.Context, table, conflictCols string, records []map[string]any, batchSize, concurrency int) error {
	if len(records) == 0 {
		return nil
	}

	cols := stableColumns(records[0])
	conflictColList := strings.Split(conflictCols, ",")

	conflictSet := make(map[string]bool)
	for _, c := range conflictColList {
		conflictSet[strings.TrimSpace(c)] = true
	}

	var setClauses []string
	for _, col := range cols {
		if !conflictSet[col] {
			setClauses = append(setClauses, fmt.Sprintf("%q = EXCLUDED.%q", col, col))
		}
	}
	if len(setClauses) == 0 {
		setClauses = append(setClauses, fmt.Sprintf("%q = EXCLUDED.%q", cols[0], cols[0]))
	}

	var batches [][]map[string]any
	for i := 0; i < len(records); i += batchSize {
		end := i + batchSize
		if end > len(records) {
			end = len(records)
		}
		batches = append(batches, records[i:end])
	}

	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(concurrency)

	for _, batch := range batches {
		batch := batch
		g.Go(func() error {
			return s.execBatchInsert(gCtx, table, cols, conflictColList, setClauses, batch)
		})
	}

	return g.Wait()
}

// execBatchInsert builds and executes a single batch INSERT … ON CONFLICT DO UPDATE statement.
func (s *Store) execBatchInsert(ctx context.Context, table string, cols []string, conflictCols []string, setClauses []string, batch []map[string]any) error {
	numCols := len(cols)
	numRows := len(batch)

	quotedCols := make([]string, numCols)
	for i, c := range cols {
		quotedCols[i] = fmt.Sprintf("%q", c)
	}

	args := make([]any, 0, numCols*numRows)
	var valueParts []string
	for rowIdx, record := range batch {
		var placeholders []string
		for colIdx, col := range cols {
			paramNum := rowIdx*numCols + colIdx + 1
			placeholders = append(placeholders, fmt.Sprintf("$%d", paramNum))
			val := record[col]
			// pgx v5: bool cannot be encoded into text columns — convert to string
			if b, ok := val.(bool); ok {
				if b {
					val = "true"
				} else {
					val = "false"
				}
			}
			args = append(args, val)
		}
		valueParts = append(valueParts, "("+strings.Join(placeholders, ", ")+")")
	}

	quotedConflict := make([]string, len(conflictCols))
	for i, c := range conflictCols {
		quotedConflict[i] = fmt.Sprintf("%q", strings.TrimSpace(c))
	}

	query := fmt.Sprintf(
		`INSERT INTO %q (%s) VALUES %s ON CONFLICT (%s) DO UPDATE SET %s`,
		table,
		strings.Join(quotedCols, ", "),
		strings.Join(valueParts, ", "),
		strings.Join(quotedConflict, ", "),
		strings.Join(setClauses, ", "),
	)

	_, err := s.pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("batch upsert into %q: %w", table, err)
	}
	return nil
}

// stableColumns returns the keys of a record in sorted order for deterministic column ordering.
func stableColumns(record map[string]any) []string {
	cols := make([]string, 0, len(record))
	for k := range record {
		cols = append(cols, k)
	}
	sort.Strings(cols)
	return cols
}
