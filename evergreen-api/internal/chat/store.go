package chat

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

func (s *Store) CountEmployees(ctx context.Context) int {
	var count int
	s.pool.QueryRow(ctx, `SELECT count(*) FROM "hrEmployee" WHERE "isActive"=true`).Scan(&count)
	return count
}

func (s *Store) CountCustomers(ctx context.Context) int {
	var count int
	s.pool.QueryRow(ctx, `SELECT count(*) FROM "bcCustomer"`).Scan(&count)
	return count
}

func (s *Store) GetHRAgentData(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "hrEmployee" WHERE "isActive"=true LIMIT 50
	`)
}

func (s *Store) GetSalesAgentData(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcCustomer" ORDER BY "bcCustomerBalanceDueLCY" DESC LIMIT 20
	`)
}

func (s *Store) GetTMSAgentData(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "tmsVehicle" WHERE "isActive"=true
	`)
}

func (s *Store) GetFinanceAgentData(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcGLAccount" WHERE "bcGLAccountBalance" != 0 LIMIT 30
	`)
}
