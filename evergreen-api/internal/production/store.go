package production

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

// Store handles all SQL queries for the production domain.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore creates a new production Store.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) GetProductionOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcProductionOrder"`)
}

func (s *Store) GetOutputQty(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT COALESCE(SUM("bcItemLedgerEntryQuantityValue"), 0) as "totalOutput"
		FROM "bcItemLedgerEntry"
		WHERE "bcItemLedgerEntryEntryType" = 'Output'
	`)
}

func (s *Store) ListCores(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcItem"
		WHERE "bcItemGenProdPostingGroup" = 'RM'
			AND ("bcItemNo" LIKE 'RM-16-07%' OR "bcItemNo" LIKE 'RM-16-08%')
		ORDER BY "bcItemNo"
	`)
}

func (s *Store) ListFrames(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcItem"
		WHERE "bcItemNo" LIKE 'RM-14-01%'
			OR "bcItemNo" LIKE 'RM-14-04%'
			OR "bcItemNo" LIKE 'RM-16-19%'
		ORDER BY "bcItemNo"
	`)
}

func (s *Store) FgCoverage(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		WITH so_data AS (
			SELECT
				"bcSalesOrderLineNoValue" AS "itemNo",
				SUM("bcSalesOrderLineQuantityValue") AS "soQty",
				SUM("bcSalesOrderLineQuantityShipped") AS "shippedQty",
				SUM("bcSalesOrderLineOutstandingQuantity") AS "soOutstandingQty"
			FROM "bcSalesOrderLine"
			WHERE "bcSalesOrderLineOutstandingQuantity" > 0
			GROUP BY "bcSalesOrderLineNoValue"
			HAVING SUM("bcSalesOrderLineOutstandingQuantity") > 0
		),
		po_data AS (
			SELECT
				"bcProductionOrderSourceNo" AS "itemNo",
				COUNT(*) AS "poCount",
				COALESCE(SUM("bcProductionOrderQuantity"), 0) AS "poTotalQty",
				array_agg(DISTINCT "bcProductionOrderStatus") AS "poStatuses",
				json_agg(json_build_object(
					'orderNo', "bcProductionOrderNo",
					'status', "bcProductionOrderStatus",
					'quantity', "bcProductionOrderQuantity",
					'dueDate', "bcProductionOrderDueDate"
				) ORDER BY "bcProductionOrderNo") AS "productionOrders"
			FROM "bcProductionOrder"
			WHERE "bcProductionOrderStatus" IN ('Planned', 'Firm Planned', 'Released')
			GROUP BY "bcProductionOrderSourceNo"
		)
		SELECT
			i."bcItemNo" AS "itemNo",
			i."bcItemDescription" AS "description",
			i."bcItemItemCategoryCode" AS "category",
			COALESCE(s."soQty", 0) AS "soQty",
			COALESCE(s."shippedQty", 0) AS "shippedQty",
			COALESCE(s."soOutstandingQty", 0) AS "soOutstandingQty",
			(p."itemNo" IS NOT NULL) AS "hasProductionOrder",
			COALESCE(p."poCount", 0) AS "poCount",
			COALESCE(p."poTotalQty", 0) AS "poTotalQty",
			COALESCE(p."poStatuses", '{}') AS "poStatuses",
			COALESCE(p."productionOrders", '[]') AS "productionOrders"
		FROM "bcItem" i
		INNER JOIN so_data s ON s."itemNo" = i."bcItemNo"
		LEFT JOIN po_data p ON p."itemNo" = i."bcItemNo"
		WHERE i."bcItemGenProdPostingGroup" = 'FG'
		ORDER BY COALESCE(s."soOutstandingQty", 0) DESC
	`)
}
