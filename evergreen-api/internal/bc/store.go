package bc

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

// Store handles all SQL queries for the bc domain.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore creates a new bc Store.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) ListCustomers(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcCustomer" ORDER BY "bcCustomerNo"`)
}

func (s *Store) ListItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcItem" ORDER BY "bcItemNo"`)
}

func (s *Store) ListSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcSalesOrder" ORDER BY "bcSalesOrderNoValue" DESC`)
}

func (s *Store) ListProduction(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcItemLedgerEntry" ORDER BY "bcItemLedgerEntryEntryNo" DESC LIMIT 1000`)
}

func (s *Store) ListProductionOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcProductionOrder" ORDER BY "bcProductionOrderNo" DESC`)
}
