package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// QueryRows executes a query and returns all rows as []map[string]any.
func QueryRows(ctx context.Context, pool *pgxpool.Pool, sql string, args ...any) ([]map[string]any, error) {
	rows, err := pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectRows(rows)
}

// QueryRow executes a query and returns a single row as map[string]any.
func QueryRow(ctx context.Context, pool *pgxpool.Pool, sql string, args ...any) (map[string]any, error) {
	rows, err := pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results, err := collectRows(rows)
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, pgx.ErrNoRows
	}
	return results[0], nil
}

func collectRows(rows pgx.Rows) ([]map[string]any, error) {
	cols := rows.FieldDescriptions()
	var result []map[string]any

	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return nil, err
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			row[string(col.Name)] = normalizeValue(vals[i])
		}
		result = append(result, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if result == nil {
		result = []map[string]any{}
	}
	return result, nil
}

// normalizeValue converts pgx types to JSON-friendly types.
// Notably converts [16]byte UUIDs to "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" strings.
func normalizeValue(v any) any {
	switch val := v.(type) {
	case [16]byte:
		return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
			val[0:4], val[4:6], val[6:8], val[8:10], val[10:16])
	default:
		return v
	}
}
