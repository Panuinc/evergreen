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
			po."bcProductionOrderNo",
			po."bcProductionOrderStatus",
			po."bcProductionOrderDescription",
			po."bcProductionOrderDescription2",
			po."bcProductionOrderSourceNo",
			po."bcProductionOrderRoutingNo",
			po."bcProductionOrderQuantity",
			po."bcProductionOrderDueDate",
			po."bcProductionOrderFinishedDate",
			po."bcProductionOrderStartingDateTime",
			po."bcProductionOrderEndingDateTime",
			po."bcProductionOrderShortcutDimension1Code",
			po."bcProductionOrderShortcutDimension2Code",
			po."bcProductionOrderLocationCode",
			po."bcProductionOrderAssignedUserID",
			po."bcProductionOrderSearchDescription",
			po."bcProductionOrderUnitCost",
			i."bcItemDescription",
			i."bcItemBaseUnitOfMeasure",
			i."bcItemItemCategoryCode",
			i."bcItemUnitPrice"
		FROM "bcProductionOrder" po
		LEFT JOIN "bcItem" i ON i."bcItemNo" = po."bcProductionOrderSourceNo"
	`)
}

// GetItemLedgerEntries returns output and consumption entries linked to production orders.
// Filters to the last 2 years to keep the dataset manageable.
func (s *Store) GetItemLedgerEntries(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			ile."bcItemLedgerEntryEntryType",
			ile."bcItemLedgerEntryItemNo",
			ile."bcItemLedgerEntryQuantityValue",
			ile."bcItemLedgerEntryPostingDate",
			ile."bcItemLedgerEntryOrderNo",
			ile."bcItemLedgerEntryDocumentNo",
			ile."bcItemLedgerEntryDescriptionValue",
			ile."bcItemLedgerEntryGlobalDimension1Code",
			ile."bcItemLedgerEntryGlobalDimension2Code",
			ile."bcItemLedgerEntryItemCategoryCode",
			i."bcItemDescription",
			i."bcItemUnitPrice"
		FROM "bcItemLedgerEntry" ile
		LEFT JOIN "bcItem" i ON i."bcItemNo" = ile."bcItemLedgerEntryItemNo"
		WHERE ile."bcItemLedgerEntryEntryType" IN ('Output', 'Consumption')
		  AND ile."bcItemLedgerEntryOrderNo" IS NOT NULL
		  AND ile."bcItemLedgerEntryOrderNo" != ''
		  AND ile."bcItemLedgerEntryPostingDate" >= CURRENT_DATE - INTERVAL '2 years'
	`)
}

// GetConsumptionCosts returns consumption costs aggregated by order from value entries.
func (s *Store) GetConsumptionCosts(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			ve."bcValueEntryOrderNo",
			ve."bcValueEntryItemNo",
			ve."bcValueEntryPostingDate",
			ve."bcValueEntryGlobalDimension1Code",
			ve."bcValueEntryGlobalDimension2Code",
			ve."bcValueEntryDescriptionValue",
			ABS(ve."bcValueEntryCostPerUnit" * ve."bcValueEntryValuedQuantity") AS "bcValueEntryCostAmountActual",
			ABS(ve."bcValueEntryValuedQuantity")                               AS "bcValueEntryValuedQuantity",
			i."bcItemDescription"
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
			"bcSalesOrderLineNoValue",
			MAX("bcSalesOrderLineUnitPrice") AS "bcSalesOrderLineUnitPrice"
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
			"bcDimensionSetEntryDimensionCode",
			"bcDimensionSetEntryDimensionValueCode",
			"bcDimensionSetEntryDimensionValueName"
		FROM "bcDimensionSetEntry"
		WHERE "bcDimensionSetEntryDimensionCode" IN ('DEPARTMENT', 'PROJECT')
	`)
}

func (s *Store) ListCores(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcItemNo" AS "code", "bcItemDescription" AS "desc",
			"bcItemDescription2" AS "desc2",
			"bcItemUnitCost" AS "unitCost", "bcItemUnitPrice" AS "unitPrice",
			"bcItemInventory" AS "inventory", "bcItemBaseUnitOfMeasure" AS "uom",
			"bcItemItemCategoryCode" AS "category"
		FROM "bcItem"
		WHERE "bcItemGenProdPostingGroup" = 'RM'
			AND ("bcItemNo" LIKE 'RM-16-07%' OR "bcItemNo" LIKE 'RM-16-08%')
		ORDER BY "bcItemNo"
	`)
}

func (s *Store) ListFrames(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcItemNo" AS "code", "bcItemDescription" AS "desc",
			"bcItemDescription2" AS "desc2",
			"bcItemUnitCost" AS "unitCost", "bcItemUnitPrice" AS "unitPrice",
			"bcItemInventory" AS "inventory", "bcItemBaseUnitOfMeasure" AS "uom",
			"bcItemItemCategoryCode" AS "category"
		FROM "bcItem"
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
				"bcSalesOrderLineNoValue",
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
				"bcProductionOrderSourceNo",
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
			i."bcItemNo",
			i."bcItemDescription",
			i."bcItemItemCategoryCode",
			COALESCE(s."soQty", 0) AS "soQty",
			COALESCE(s."shippedQty", 0) AS "shippedQty",
			COALESCE(s."soOutstandingQty", 0) AS "soOutstandingQty",
			(p."bcProductionOrderSourceNo" IS NOT NULL) AS "hasProductionOrder",
			COALESCE(p."poCount", 0) AS "poCount",
			COALESCE(p."poTotalQty", 0) AS "poTotalQty",
			COALESCE(p."poStatuses", '{}') AS "poStatuses",
			COALESCE(p."productionOrders", '[]') AS "productionOrders"
		FROM "bcItem" i
		INNER JOIN so_data s ON s."bcSalesOrderLineNoValue" = i."bcItemNo"
		LEFT JOIN po_data p ON p."bcProductionOrderSourceNo" = i."bcItemNo"
		WHERE i."bcItemGenProdPostingGroup" = 'FG'
		ORDER BY COALESCE(s."soOutstandingQty", 0) DESC
	`)
}
