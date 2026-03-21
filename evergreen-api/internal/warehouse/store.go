package warehouse

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

// ---- Inventory ----

func (s *Store) ListInventory(ctx context.Context, group, category string) ([]map[string]any, error) {
	q := `SELECT i."bcItemNo", i."bcItemDescription", i."bcItemType", i."bcItemInventory",
		i."bcItemBaseUnitOfMeasure", i."bcItemUnitPrice", i."bcItemUnitCost",
		i."bcItemItemCategoryCode", i."bcItemGenProdPostingGroup", i."bcItemGlobalDimension1Code",
		i."bcItemRfidCode",
		COALESCE(d."bcDimensionSetEntryDimensionValueName", '') AS "projectName"
	FROM "bcItem" i
	LEFT JOIN (
		SELECT DISTINCT ON ("bcDimensionSetEntryDimensionValueCode")
			"bcDimensionSetEntryDimensionValueCode",
			"bcDimensionSetEntryDimensionValueName"
		FROM "bcDimensionSetEntry"
		WHERE "bcDimensionSetEntryDimensionCode" = 'PROJECT'
		ORDER BY "bcDimensionSetEntryDimensionValueCode"
	) d ON d."bcDimensionSetEntryDimensionValueCode" = COALESCE(
		NULLIF(i."bcItemGlobalDimension1Code", ''),
		NULLIF(SPLIT_PART(i."bcItemNo", '-', 2), '')
	)
	WHERE (i."bcItemBlocked" IS NULL OR i."bcItemBlocked" != 'true') AND i."bcItemInventory" > 0`
	args := []any{}
	argIdx := 1
	if group != "" {
		q += fmt.Sprintf(` AND i."bcItemItemCategoryCode" = $%d`, argIdx)
		args = append(args, group)
		argIdx++
	}
	if category != "" {
		q += fmt.Sprintf(` AND i."bcItemGenProdPostingGroup" = $%d`, argIdx)
		args = append(args, category)
	}
	q += ` ORDER BY i."bcItemNo"`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetItemByNo(ctx context.Context, itemNo string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "bcItemNo", "bcItemDescription", "bcItemType", "bcItemInventory", "bcItemBaseUnitOfMeasure", "bcItemUnitPrice", "bcItemUnitCost", "bcItemItemCategoryCode", "bcItemGenProdPostingGroup", "bcItemRfidCode"
		FROM "bcItem" WHERE "bcItemNo"=$1
	`, itemNo)
}

func (s *Store) GetItemsWithRfidCode(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcItemNo", "bcItemDescription", "bcItemRfidCode"
		FROM "bcItem" WHERE "bcItemRfidCode" IS NOT NULL
	`)
}

// ---- Orders ----

func (s *Store) ListOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcSalesOrderId", "bcSalesOrderNoValue", "bcSalesOrderSellToCustomerNo", "bcSalesOrderSellToCustomerName", "bcSalesOrderStatus", "bcSalesOrderOrderDate"
		FROM "bcSalesOrder" ORDER BY "bcSalesOrderNoValue" DESC
	`)
}

func (s *Store) CreateOrderMatch(ctx context.Context, orderNo, itemNo, quantity, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "whOrderMatch" ("whOrderMatchOrderNo", "whOrderMatchItemNo", "whOrderMatchQuantity", "whOrderMatchCreatedBy")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, orderNo, itemNo, quantity, createdBy)
}

// ---- Sessions ----

func (s *Store) ListSessions(ctx context.Context, userID any) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "whScanSessionId", "whScanSessionType", "whScanSessionStatus", "whScanSessionCreatedBy", "whScanSessionStartedAt", "whScanSessionUserId"
		FROM "whScanSession"
		WHERE "whScanSessionUserId" = $1
		ORDER BY "whScanSessionStartedAt" DESC
	`, userID)
}

func (s *Store) CreateSession(ctx context.Context, sessionType, status, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "whScanSession" ("whScanSessionType", "whScanSessionStatus", "whScanSessionCreatedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, sessionType, status, createdBy)
}

func (s *Store) GetSession(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "whScanSessionId", "whScanSessionType", "whScanSessionStatus", "whScanSessionCreatedBy", "whScanSessionStartedAt", "whScanSessionUserId" FROM "whScanSession" WHERE "whScanSessionId" = $1`, id)
}

func (s *Store) UpdateSession(ctx context.Context, id, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "whScanSession" SET
			"whScanSessionStatus" = COALESCE($2, "whScanSessionStatus")
		WHERE "whScanSessionId" = $1 RETURNING *
	`, id, status)
}

func (s *Store) ListSessionRecords(ctx context.Context, sessionId string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "whScanRecordId", "whScanRecordSessionId", "whScanRecordBarcode", "whScanRecordItemNo", "whScanRecordQuantity", "whScanRecordCreatedAt"
		FROM "whScanRecord"
		WHERE "whScanRecordSessionId" = $1
		ORDER BY "whScanRecordCreatedAt" DESC
	`, sessionId)
}

func (s *Store) CreateScanRecord(ctx context.Context, sessionId, barcode, itemNo, quantity any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "whScanRecord" ("whScanRecordSessionId", "whScanRecordBarcode", "whScanRecordItemNo", "whScanRecordQuantity")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, sessionId, barcode, itemNo, quantity)
}

// ---- Transfers ----

func (s *Store) ListTransfers(ctx context.Context, userID any) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "whTransferId", "whTransferNumber", "whTransferFromLocation", "whTransferToLocation", "whTransferStatus", "whTransferCreatedBy", "whTransferCreatedAt", "whTransferUserId"
		FROM "whTransfer"
		WHERE "whTransferUserId" = $1
		ORDER BY "whTransferCreatedAt" DESC
	`, userID)
}

func (s *Store) CountTransfersByPrefix(ctx context.Context, prefix string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT COUNT(*) as cnt FROM "whTransfer" WHERE "whTransferNumber" LIKE $1
	`, prefix+"%")
}

func (s *Store) CreateTransfer(ctx context.Context, number, fromLocation, toLocation, status, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "whTransfer" ("whTransferNumber", "whTransferFromLocation", "whTransferToLocation", "whTransferStatus", "whTransferCreatedBy")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, number, fromLocation, toLocation, status, createdBy)
}

func (s *Store) GetTransfer(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "whTransferId", "whTransferNumber", "whTransferFromLocation", "whTransferToLocation", "whTransferStatus", "whTransferCreatedBy", "whTransferCreatedAt", "whTransferUserId" FROM "whTransfer" WHERE "whTransferId" = $1`, id)
}

func (s *Store) UpdateTransfer(ctx context.Context, id, fromLocation, toLocation, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "whTransfer" SET
			"whTransferFromLocation" = COALESCE($2, "whTransferFromLocation"),
			"whTransferToLocation" = COALESCE($3, "whTransferToLocation"),
			"whTransferStatus" = COALESCE($4, "whTransferStatus")
		WHERE "whTransferId" = $1 RETURNING *
	`, id, fromLocation, toLocation, status)
}

// ---- RFID ----

func (s *Store) RfidAssign(ctx context.Context, tagCode, itemNo, assignedBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "whRfidTag" ("whRfidTagCode", "whRfidTagItemNo", "whRfidTagAssignedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, tagCode, itemNo, assignedBy)
}

func (s *Store) RfidUnassign(ctx context.Context, tagCode any) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM "whRfidTag" WHERE "whRfidTagCode" = $1`, tagCode)
	return err
}

// ---- Dashboard ----

func (s *Store) DashboardSessions(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "whScanSessionId", "whScanSessionStatus" FROM "whScanSession"`)
}

func (s *Store) DashboardTransfers(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "whTransferId", "whTransferStatus" FROM "whTransfer"`)
}

// ---- App Version ----

func (s *Store) GetLatestAppVersion(ctx context.Context) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "whAppVersionId", "whAppVersionNumber", "whAppVersionNotes", "whAppVersionUrl", "whAppVersionCreatedAt"
		FROM "whAppVersion" ORDER BY "whAppVersionCreatedAt" DESC LIMIT 1
	`)
}
