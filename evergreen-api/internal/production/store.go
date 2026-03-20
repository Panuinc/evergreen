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
	return db.QueryRows(ctx, s.pool, `
		SELECT
			po."bcProductionOrderNo"                   AS "orderNo",
			po."bcProductionOrderStatus"               AS "status",
			po."bcProductionOrderDescription"           AS "description",
			po."bcProductionOrderSourceNo"              AS "sourceNo",
			po."bcProductionOrderQuantity"              AS "quantity",
			po."bcProductionOrderDueDate"               AS "dueDate",
			po."bcProductionOrderFinishedDate"          AS "finishedDate",
			po."bcProductionOrderStartingDateTime"      AS "startingDateTime",
			po."bcProductionOrderShortcutDimension1Code" AS "dim1Code",
			po."bcProductionOrderShortcutDimension2Code" AS "dim2Code",
			po."bcProductionOrderLocationCode"          AS "locationCode",
			po."bcProductionOrderUnitCost"              AS "unitCost",
			i."bcItemDescription"                       AS "itemDescription",
			i."bcItemBaseUnitOfMeasure"                 AS "uom",
			i."bcItemItemCategoryCode"                  AS "itemCategory",
			i."bcItemUnitPrice"                         AS "itemUnitPrice"
		FROM "bcProductionOrder" po
		LEFT JOIN "bcItem" i ON i."bcItemNo" = po."bcProductionOrderSourceNo"
	`)
}

// GetItemLedgerEntries returns output and consumption entries linked to production orders.
func (s *Store) GetItemLedgerEntries(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			ile."bcItemLedgerEntryEntryType"          AS "entryType",
			ile."bcItemLedgerEntryItemNo"              AS "itemNo",
			ile."bcItemLedgerEntryQuantityValue"       AS "quantity",
			ile."bcItemLedgerEntryPostingDate"         AS "postingDate",
			ile."bcItemLedgerEntryOrderNo"             AS "orderNo",
			ile."bcItemLedgerEntryDocumentNo"          AS "documentNo",
			ile."bcItemLedgerEntryDescriptionValue"    AS "description",
			ile."bcItemLedgerEntryGlobalDimension1Code" AS "dim1Code",
			ile."bcItemLedgerEntryGlobalDimension2Code" AS "dim2Code",
			ile."bcItemLedgerEntryItemCategoryCode"    AS "itemCategory",
			i."bcItemDescription"                      AS "itemDescription",
			i."bcItemUnitPrice"                        AS "itemUnitPrice"
		FROM "bcItemLedgerEntry" ile
		LEFT JOIN "bcItem" i ON i."bcItemNo" = ile."bcItemLedgerEntryItemNo"
		WHERE ile."bcItemLedgerEntryEntryType" IN ('Output', 'Consumption')
		  AND ile."bcItemLedgerEntryOrderNo" IS NOT NULL
		  AND ile."bcItemLedgerEntryOrderNo" != ''
	`)
}

// GetConsumptionCosts returns consumption costs aggregated by order from value entries.
func (s *Store) GetConsumptionCosts(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			ve."bcValueEntryOrderNo"              AS "orderNo",
			ve."bcValueEntryItemNo"               AS "itemNo",
			ve."bcValueEntryPostingDate"          AS "postingDate",
			ve."bcValueEntryGlobalDimension1Code" AS "dim1Code",
			ve."bcValueEntryGlobalDimension2Code" AS "dim2Code",
			ve."bcValueEntryDescriptionValue"     AS "description",
			ABS(ve."bcValueEntryCostPerUnit" * ve."bcValueEntryValuedQuantity") AS "costAmount",
			ABS(ve."bcValueEntryValuedQuantity")  AS "quantity",
			i."bcItemDescription"                 AS "itemDescription"
		FROM "bcValueEntry" ve
		LEFT JOIN "bcItem" i ON i."bcItemNo" = ve."bcValueEntryItemNo"
		WHERE ve."bcValueEntryItemLedgerEntryType" = 'Consumption'
		  AND ve."bcValueEntryOrderNo" IS NOT NULL
		  AND ve."bcValueEntryOrderNo" != ''
	`)
}

// GetSalesPriceMap returns the latest unit price for each item from sales order lines.
func (s *Store) GetSalesPriceMap(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcSalesOrderLineNoValue"    AS "itemNo",
			MAX("bcSalesOrderLineUnitPrice") AS "unitPrice"
		FROM "bcSalesOrderLine"
		WHERE "bcSalesOrderLineTypeValue" = 'Item'
		  AND "bcSalesOrderLineUnitPrice" > 0
		GROUP BY "bcSalesOrderLineNoValue"
	`)
}

// GetDimensionNames returns dimension value names for dim1 and dim2.
func (s *Store) GetDimensionNames(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcDimensionSetEntryDimensionCode"      AS "dimCode",
			"bcDimensionSetEntryDimensionValueCode"  AS "valueCode",
			"bcDimensionSetEntryDimensionValueName"  AS "valueName"
		FROM "bcDimensionSetEntry"
		WHERE "bcDimensionSetEntryDimensionCode" IN ('DEPARTMENT', 'PROJECT')
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
