package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// GetUserIsActive returns the isActive flag for a user profile, or nil if not found.
func (s *Store) GetUserIsActive(ctx context.Context, userID string) (*bool, error) {
	var isActive *bool
	err := s.pool.QueryRow(ctx, `
		SELECT "isActive" FROM "rbacUserProfile"
		WHERE "rbacUserProfileId" = $1
	`, userID).Scan(&isActive)
	if err != nil {
		return nil, err
	}
	return isActive, nil
}
