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
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcCustomerId",
			"bcCustomerNo",
			"bcCustomerNameValue",
			"bcCustomerContact",
			"bcCustomerPhoneNo",
			"bcCustomerSalespersonCode",
			"bcCustomerBalanceDueLCY"
		FROM "bcCustomer"
		ORDER BY "bcCustomerNo"
	`)
}

func (s *Store) ListItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcItemId",
			"bcItemNo",
			"bcItemDescription",
			"bcItemType",
			"bcItemInventory",
			"bcItemUnitPrice",
			"bcItemUnitCost",
			"bcItemItemCategoryCode",
			"bcItemGenProdPostingGroup",
			"bcItemBlocked"
		FROM "bcItem"
		ORDER BY "bcItemNo"
	`)
}

func (s *Store) ListSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			so."bcSalesOrderId",
			so."bcSalesOrderNoValue",
			so."bcSalesOrderOrderDate",
			so."bcSalesOrderSellToCustomerName",
			so."bcSalesOrderStatus",
			so."bcSalesOrderAmountIncludingVAT",
			COALESCE(lines.data, '[]') AS "salesOrderLines"
		FROM "bcSalesOrder" so
		LEFT JOIN LATERAL (
			SELECT json_agg(json_build_object(
				'bcSalesOrderLineId', l."bcSalesOrderLineId",
				'bcSalesOrderLineLineNo', l."bcSalesOrderLineLineNo",
				'bcSalesOrderLineNoValue', l."bcSalesOrderLineNoValue",
				'bcSalesOrderLineDescriptionValue', l."bcSalesOrderLineDescriptionValue",
				'bcSalesOrderLineQuantityValue', l."bcSalesOrderLineQuantityValue",
				'bcSalesOrderLineUnitPrice', l."bcSalesOrderLineUnitPrice",
				'bcSalesOrderLineAmountValue', l."bcSalesOrderLineAmountValue"
			) ORDER BY l."bcSalesOrderLineLineNo") AS data
			FROM "bcSalesOrderLine" l
			WHERE l."bcSalesOrderLineDocumentNo" = so."bcSalesOrderNoValue"
		) lines ON true
		ORDER BY so."bcSalesOrderNoValue" DESC
	`)
}

func (s *Store) ListProduction(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcItemLedgerEntryId",
			"bcItemLedgerEntryEntryNo",
			"bcItemLedgerEntryPostingDate",
			"bcItemLedgerEntryDocumentDate",
			"bcItemLedgerEntryEntryType",
			"bcItemLedgerEntryDocumentType",
			"bcItemLedgerEntryDocumentNo",
			"bcItemLedgerEntryItemNo",
			"bcItemLedgerEntryItemDescription",
			"bcItemLedgerEntryDescriptionValue",
			"bcItemLedgerEntryLocationCode",
			"bcItemLedgerEntryLotNo",
			"bcItemLedgerEntrySerialNo",
			"bcItemLedgerEntryExpirationDate",
			"bcItemLedgerEntryQuantityValue",
			"bcItemLedgerEntryUnitOfMeasureCode",
			"bcItemLedgerEntryRemainingQuantity",
			"bcItemLedgerEntryInvoicedQuantity",
			"bcItemLedgerEntryCompletelyInvoiced",
			"bcItemLedgerEntryOpenValue",
			"bcItemLedgerEntryGlobalDimension1Code",
			"bcItemLedgerEntryGlobalDimension2Code",
			"bcItemLedgerEntryOrderType",
			"bcItemLedgerEntryOrderNo",
			"bcItemLedgerEntryOrderLineNo",
			"bcItemLedgerEntryDocumentLineNo",
			"bcItemLedgerEntryVariantCode",
			"bcItemLedgerEntryItemCategoryCode",
			"bcItemLedgerEntrySourceNo",
			"bcItemLedgerEntryCreatedAt",
			"bcItemLedgerEntryLastModifiedDateTime",
			"bcSyncedAt"
		FROM "bcItemLedgerEntry"
		ORDER BY "bcItemLedgerEntryEntryNo" DESC
		LIMIT 1000
	`)
}

func (s *Store) ListProductionOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcProductionOrderId",
			"bcProductionOrderNo",
			"bcProductionOrderStatus",
			"bcProductionOrderDescription",
			"bcProductionOrderDescription2",
			"bcProductionOrderSourceNo",
			"bcProductionOrderRoutingNo",
			"bcProductionOrderQuantity",
			"bcProductionOrderShortcutDimension1Code",
			"bcProductionOrderShortcutDimension2Code",
			"bcProductionOrderLocationCode",
			"bcProductionOrderDueDate",
			"bcProductionOrderFinishedDate",
			"bcProductionOrderStartingDateTime",
			"bcProductionOrderEndingDateTime",
			"bcProductionOrderAssignedUserID",
			"bcProductionOrderSearchDescription",
			"bcProductionOrderCostAmount",
			"bcProductionOrderUnitCost",
			"bcSyncedAt"
		FROM "bcProductionOrder"
		ORDER BY "bcProductionOrderNo" DESC
	`)
}
