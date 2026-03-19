package admin

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

// GetUserPermissions returns all permissions for a user from get_user_permissions().
// Each entry is [resourceName, actionName, isSuperadmin].
func (s *Store) GetUserPermissions(ctx context.Context, userID string) ([][3]any, error) {
	rows, err := s.pool.Query(ctx, `SELECT * FROM get_user_permissions($1)`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result [][3]any
	for rows.Next() {
		var resourceName, actionName string
		var isSuperadmin bool
		if err := rows.Scan(&resourceName, &actionName, &isSuperadmin); err != nil {
			continue
		}
		result = append(result, [3]any{resourceName, actionName, isSuperadmin})
	}
	return result, nil
}

// CreateUserProfile inserts a new row into rbacUserProfile.
func (s *Store) CreateUserProfile(ctx context.Context, userID, email string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "rbacUserProfile" ("rbacUserProfileId", "rbacUserProfileEmail")
		VALUES ($1, $2)
	`, userID, email)
	return err
}

// LinkEmployeeToUser sets hrEmployeeUserId on the matching hrEmployee row.
func (s *Store) LinkEmployeeToUser(ctx context.Context, userID, employeeID string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "hrEmployee" SET "hrEmployeeUserId" = $1
		WHERE "hrEmployeeId" = $2
	`, userID, employeeID)
	return err
}
