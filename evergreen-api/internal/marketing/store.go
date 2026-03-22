package marketing

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
	"github.com/evergreen/api/pkg/logger"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Webhook / processIncomingMessage ----

func (s *Store) UpsertContact(ctx context.Context, channelType, externalID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktContact" ("mktContactChannelType","mktContactExternalRef","mktContactDisplayName")
		VALUES ($1,$2,$2)
		ON CONFLICT ("mktContactChannelType","mktContactExternalRef") DO UPDATE SET "mktContactDisplayName"=EXCLUDED."mktContactDisplayName"
		RETURNING *
	`, channelType, externalID)
}

func (s *Store) FindActiveConversation(ctx context.Context, contactID, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktConversationId", "mktConversationContactId", "mktConversationChannelType",
			"mktConversationStatus", "mktConversationAiAutoReply"
		FROM "mktConversation"
		WHERE "mktConversationContactId"=$1 AND "mktConversationChannelType"=$2 AND "isActive"=true LIMIT 1
	`, contactID, channelType)
}

func (s *Store) CreateConversation(ctx context.Context, contactID, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktConversation" ("mktConversationContactId","mktConversationChannelType","mktConversationStatus","mktConversationAiAutoReply")
		VALUES ($1,$2,'open',true) RETURNING *
	`, contactID, channelType)
}

func (s *Store) InsertIncomingMessage(ctx context.Context, convID, senderID, text, externalMsgID string) {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "mktMessage" ("mktMessageConversationId","mktMessageSenderType","mktMessageSenderRef","mktMessageContent","mktMessageType","mktMessageExternalRef")
		VALUES ($1,'customer',$2,$3,'text',$4)
	`, convID, senderID, text, externalMsgID)
	if err != nil {
		logger.Error("failed to insert incoming message", "convId", convID, "err", err)
	}
}

func (s *Store) UpdateConversationOnIncoming(ctx context.Context, convID, preview string) {
	if _, err := s.pool.Exec(ctx, `
		UPDATE "mktConversation" SET "mktConversationLastMessageAt"=now(),"mktConversationLastMessagePreview"=$2,
			"mktConversationUnreadCount"=COALESCE("mktConversationUnreadCount",0)+1,"mktConversationStatus"='open'
		WHERE "mktConversationId"=$1
	`, convID, preview); err != nil {
		logger.Error("failed to update conversation on incoming", "convId", convID, "err", err)
	}
}

// ---- Analytics ----

func (s *Store) GetOnlineSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcSalesOrderNoValue", "bcSalesOrderAmountIncludingVAT",
			"bcSalesOrderCompletelyShipped", "bcSalesOrderStatus", "bcSalesOrderOrderDate",
			"bcSalesOrderSellToCustomerName", "bcSalesOrderSellToCustomerNo",
			"bcSalesOrderLocationCode"
		FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
		LIMIT 2000
	`)
}

func (s *Store) GetOnlineSalesOrderLines(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT l."bcSalesOrderLineDocumentNo", l."bcSalesOrderLineLineNo",
			l."bcSalesOrderLineQuantityValue", l."bcSalesOrderLineAmountValue",
			l."bcSalesOrderLineNoValue", l."bcSalesOrderLineDescriptionValue"
		FROM "bcSalesOrderLine" l
		JOIN "bcSalesOrder" o ON o."bcSalesOrderNoValue" = l."bcSalesOrderLineDocumentNo"
		WHERE o."bcSalesOrderSalespersonCode" = 'ONLINE'
		LIMIT 20000
	`)
}

// ---- Sales Orders ----

func (s *Store) ListSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName", "bcSalesOrderOrderDate",
			"bcSalesOrderStatus", "bcSalesOrderAmountIncludingVAT", "bcSalesOrderCompletelyShipped"
		FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
	`)
}

func (s *Store) GetSalesOrder(ctx context.Context, no string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName", "bcSalesOrderSellToCustomerNo",
			"bcSalesOrderSellToAddress", "bcSalesOrderSellToCity", "bcSalesOrderSellToPostCode",
			"bcSalesOrderShipToName", "bcSalesOrderShipToAddress", "bcSalesOrderShipToCity", "bcSalesOrderShipToPostCode",
			"bcSalesOrderOrderDate", "bcSalesOrderDueDate", "bcSalesOrderExternalDocumentNo",
			"bcSalesOrderStatus", "bcSalesOrderCompletelyShipped",
			"bcSalesOrderAmountIncludingVAT",
			"bcSalesOrderSalespersonCode"
		FROM "bcSalesOrder" WHERE "bcSalesOrderNoValue"=$1
	`, no)
}

func (s *Store) GetSalesOrderLines(ctx context.Context, no string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT l."bcSalesOrderLineLineNo",
			l."bcSalesOrderLineNoValue",
			l."bcSalesOrderLineDescriptionValue", l."bcSalesOrderLineTypeValue",
			l."bcSalesOrderLineQuantityValue", l."bcSalesOrderLineUnitOfMeasureCode",
			l."bcSalesOrderLineUnitPrice", l."bcSalesOrderLineLineDiscount",
			l."bcSalesOrderLineAmountValue",
			l."bcSalesOrderLineAmountIncludingVAT",
			l."bcSalesOrderLineQuantityShipped",
			l."bcSalesOrderLineOutstandingQuantity",
			l."bcSalesOrderLineShortcutDimension1Code",
			COALESCE(d."bcDimensionSetEntryDimensionValueName", '') AS "bcDimensionSetEntryDimensionValueName"
		FROM "bcSalesOrderLine" l
		LEFT JOIN (
			SELECT DISTINCT ON ("bcDimensionSetEntryDimensionValueCode")
				"bcDimensionSetEntryDimensionValueCode",
				"bcDimensionSetEntryDimensionValueName"
			FROM "bcDimensionSetEntry"
			WHERE "bcDimensionSetEntryDimensionCode" = 'PROJECT'
			ORDER BY "bcDimensionSetEntryDimensionValueCode"
		) d ON d."bcDimensionSetEntryDimensionValueCode" = COALESCE(
			NULLIF(SPLIT_PART(l."bcSalesOrderLineNoValue", '-', 2), ''),
			NULLIF(l."bcSalesOrderLineShortcutDimension1Code", '')
		)
		WHERE l."bcSalesOrderLineDocumentNo"=$1
		ORDER BY l."bcSalesOrderLineLineNo"
	`, no)
}

func (s *Store) GetCustomerPhone(ctx context.Context, custNo string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "bcCustomerPhoneNo" FROM "bcCustomer" WHERE "bcCustomerNo"=$1`, custNo)
}

// ---- Work Orders ----

func (s *Store) ListWorkOrders(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT "mktWorkOrderId", "mktWorkOrderNo", "mktWorkOrderTitle", "mktWorkOrderType",
			"mktWorkOrderRequestedBy", "mktWorkOrderAssignedTo", "mktWorkOrderPriority",
			"mktWorkOrderProgress", "mktWorkOrderStatus", "mktWorkOrderDueDate",
			"mktWorkOrderCreatedAt", "isActive"
		FROM "mktWorkOrder" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("mktWorkOrderNo" ILIKE $%d OR "mktWorkOrderTitle" ILIKE $%d OR "mktWorkOrderRequestedBy" ILIKE $%d OR "mktWorkOrderAssignedTo" ILIKE $%d)`,
			argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "mktWorkOrderCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateWorkOrder(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktWorkOrder" ("mktWorkOrderNo","mktWorkOrderTitle","mktWorkOrderDescription","mktWorkOrderType",
			"mktWorkOrderRequestedBy","mktWorkOrderRequestedDepartment","mktWorkOrderAssignedTo","mktWorkOrderPriority",
			"mktWorkOrderStartDate","mktWorkOrderDueDate","mktWorkOrderNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["mktWorkOrderNo"], body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderType"],
		body["mktWorkOrderRequestedBy"], body["mktWorkOrderRequestedDepartment"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStartDate"], body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
}

func (s *Store) GetWorkOrder(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktWorkOrderId", "mktWorkOrderNo", "mktWorkOrderTitle", "mktWorkOrderDescription",
			"mktWorkOrderType", "mktWorkOrderRequestedBy", "mktWorkOrderRequestedDepartment",
			"mktWorkOrderAssignedTo", "mktWorkOrderPriority", "mktWorkOrderProgress",
			"mktWorkOrderStatus", "mktWorkOrderStartDate", "mktWorkOrderDueDate",
			"mktWorkOrderNotes", "mktWorkOrderCreatedAt", "isActive"
		FROM "mktWorkOrder" WHERE "mktWorkOrderId"=$1
	`, id)
}

func (s *Store) UpdateWorkOrder(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktWorkOrder" SET
			"mktWorkOrderTitle"=COALESCE($2,"mktWorkOrderTitle"),"mktWorkOrderDescription"=COALESCE($3,"mktWorkOrderDescription"),
			"mktWorkOrderAssignedTo"=COALESCE($4,"mktWorkOrderAssignedTo"),"mktWorkOrderPriority"=COALESCE($5,"mktWorkOrderPriority"),
			"mktWorkOrderStatus"=COALESCE($6,"mktWorkOrderStatus"),"mktWorkOrderProgress"=COALESCE($7,"mktWorkOrderProgress"),
			"mktWorkOrderDueDate"=COALESCE($8,"mktWorkOrderDueDate"),"mktWorkOrderNotes"=COALESCE($9,"mktWorkOrderNotes")
		WHERE "mktWorkOrderId"=$1 RETURNING *
	`, id, body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStatus"], body["mktWorkOrderProgress"],
		body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
}

func (s *Store) SoftDeleteWorkOrder(ctx context.Context, id string) {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktWorkOrder" SET "isActive"=false WHERE "mktWorkOrderId"=$1`, id); err != nil {
		logger.Error("failed to soft delete work order", "id", id, "err", err)
	}
}

// ---- Work Order Progress ----

func (s *Store) ListWorkOrderProgress(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktWorkOrderProgressLogId", "mktWorkOrderProgressLogDescription",
			"mktWorkOrderProgressLogProgress", "mktWorkOrderProgressLogCreatedBy",
			"mktWorkOrderProgressLogCreatedAt"
		FROM "mktWorkOrderProgressLog" WHERE "mktWorkOrderProgressLogWorkOrderId"=$1
		ORDER BY "mktWorkOrderProgressLogCreatedAt" DESC
	`, id)
}

func (s *Store) CreateWorkOrderProgress(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktWorkOrderProgressLog" ("mktWorkOrderProgressLogWorkOrderId","mktWorkOrderProgressLogDescription","mktWorkOrderProgressLogProgress","mktWorkOrderProgressLogCreatedBy")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, id, body["mktWorkOrderProgressLogDescription"], body["mktWorkOrderProgressLogProgress"], body["mktWorkOrderProgressLogCreatedBy"])
}

func (s *Store) UpdateWorkOrderProgress(ctx context.Context, id string, progress any) {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktWorkOrder" SET "mktWorkOrderProgress"=$2 WHERE "mktWorkOrderId"=$1`, id, progress); err != nil {
		logger.Error("failed to update work order progress", "id", id, "err", err)
	}
}

// ---- Label Designs ----

func (s *Store) ListLabelDesigns(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "labelDesignId", "labelDesignName", "labelDesignWidth", "labelDesignHeight",
			"labelDesignPreset", "labelDesignElements", "labelDesignCreatedAt"
		FROM "labelDesign" ORDER BY "labelDesignCreatedAt" DESC
	`)
}

func (s *Store) CreateLabelDesign(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "labelDesign" ("labelDesignName","labelDesignWidth","labelDesignHeight","labelDesignPreset","labelDesignElements","labelDesignCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
	`, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"],
		body["labelDesignPreset"], body["labelDesignElements"], userID)
}

func (s *Store) UpdateLabelDesign(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "labelDesign" SET
			"labelDesignName"=COALESCE($2,"labelDesignName"),"labelDesignWidth"=COALESCE($3,"labelDesignWidth"),
			"labelDesignHeight"=COALESCE($4,"labelDesignHeight"),"labelDesignElements"=COALESCE($5,"labelDesignElements"),
			"labelDesignUpdatedAt"=now()
		WHERE "labelDesignId"=$1 RETURNING *
	`, id, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"], body["labelDesignElements"])
}

func (s *Store) DeleteLabelDesign(ctx context.Context, id string) {
	if _, err := s.pool.Exec(ctx, `DELETE FROM "labelDesign" WHERE "labelDesignId"=$1`, id); err != nil {
		logger.Error("failed to delete label design", "id", id, "err", err)
	}
}

// ---- Image Generation ----

func (s *Store) CreateGeneratedImage(ctx context.Context, prompt, size, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktGeneratedImage" ("mktGeneratedImagePrompt","mktGeneratedImageSize","mktGeneratedImageCreatedBy","mktGeneratedImageResultUrl")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, prompt, size, userID, "pending")
}

func (s *Store) ListGeneratedImages(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktGeneratedImageId", "mktGeneratedImagePrompt", "mktGeneratedImageSize",
			"mktGeneratedImageOriginalUrl", "mktGeneratedImageResultUrl", "mktGeneratedImageCreatedAt"
		FROM "mktGeneratedImage" WHERE "isActive"=true
		ORDER BY "mktGeneratedImageCreatedAt" DESC LIMIT 50
	`)
}

// ---- Analytics Store Functions ----
// Index requirements (run once):
//   CREATE INDEX IF NOT EXISTS idx_bcsalesorder_salesperson ON "bcSalesOrder" ("bcSalesOrderSalespersonCode");
//   CREATE INDEX IF NOT EXISTS idx_bcsalesorder_orderdate   ON "bcSalesOrder" ("bcSalesOrderOrderDate");
//   CREATE INDEX IF NOT EXISTS idx_bcsalesorder_customer    ON "bcSalesOrder" ("bcSalesOrderSellToCustomerNo");
//   CREATE INDEX IF NOT EXISTS idx_bcsalesorderline_docno   ON "bcSalesOrderLine" ("bcSalesOrderLineDocumentNo");
//   CREATE INDEX IF NOT EXISTS idx_bcsalesorderline_type    ON "bcSalesOrderLine" ("bcSalesOrderLineTypeValue");

// dateFilter builds a date-range WHERE clause for bcSalesOrderOrderDate.
// argIdx is the starting $N parameter index. Returns empty string + nil when no filter needed.
func dateFilter(dateFrom, dateTo string, argIdx int) (string, []any) {
	if dateFrom == "" || dateTo == "" {
		return "", nil
	}
	return fmt.Sprintf(` AND "bcSalesOrderOrderDate"::date BETWEEN $%d AND $%d`, argIdx, argIdx+1),
		[]any{dateFrom, dateTo}
}

// GetAnalyticsSummary returns total orders, revenue, and shipped count for a given date range.
func (s *Store) GetAnalyticsSummary(ctx context.Context, dateFrom, dateTo string) (map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRow(ctx, s.pool, `
		SELECT
			COUNT(*) AS "totalOrders",
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS "totalRevenue",
			COUNT(*) FILTER (WHERE "bcSalesOrderCompletelyShipped" = 'true') AS "shippedOrders"
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond, args...)
}

// GetPeriodStats returns DTD/WTD/MTD/YTD totals and prior-period revenues for growth calculation.
// No date filter — always computed over the full dataset.
func (s *Store) GetPeriodStats(ctx context.Context) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT
			COUNT(*) FILTER (WHERE "bcSalesOrderOrderDate"::date = CURRENT_DATE)
				AS "dtdOrders",
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (WHERE "bcSalesOrderOrderDate"::date = CURRENT_DATE), 0)
				AS "dtdRevenue",

			COUNT(*) FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('week', CURRENT_DATE)::date)
				AS "wtdOrders",
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('week', CURRENT_DATE)::date), 0)
				AS "wtdRevenue",

			COUNT(*) FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('month', CURRENT_DATE)::date)
				AS "mtdOrders",
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('month', CURRENT_DATE)::date), 0)
				AS "mtdRevenue",

			COUNT(*) FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('year', CURRENT_DATE)::date)
				AS "ytdOrders",
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('year', CURRENT_DATE)::date), 0)
				AS "ytdRevenue",

			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (
				WHERE "bcSalesOrderOrderDate"::date >= (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week')::date
				  AND "bcSalesOrderOrderDate"::date <  DATE_TRUNC('week', CURRENT_DATE)::date
			), 0) AS "prevWtdRevenue",

			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (
				WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date
				  AND "bcSalesOrderOrderDate"::date <  DATE_TRUNC('month', CURRENT_DATE)::date
			), 0) AS "prevMtdRevenue",

			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") FILTER (
				WHERE "bcSalesOrderOrderDate"::date >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')::date
				  AND "bcSalesOrderOrderDate"::date <  DATE_TRUNC('year', CURRENT_DATE)::date
			), 0) AS "prevYtdRevenue"
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
	`)
}

// GetMonthlyTrend returns monthly revenue and order count.
// Defaults to the last 12 months when no date range is given.
func (s *Store) GetMonthlyTrend(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	defaultCond := ""
	if cond == "" {
		defaultCond = ` AND "bcSalesOrderOrderDate"::date >= CURRENT_DATE - INTERVAL '12 months'`
	}
	return db.QueryRows(ctx, s.pool, `
		SELECT
			TO_CHAR(DATE_TRUNC('month', "bcSalesOrderOrderDate"::date), 'YYYY-MM') AS month,
			COUNT(*) AS orders,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+defaultCond+`
		GROUP BY DATE_TRUNC('month', "bcSalesOrderOrderDate"::date)
		ORDER BY 1`, args...)
}

// GetDailyTrend returns daily revenue and order count.
// Defaults to the last 30 days when no date range is given.
func (s *Store) GetDailyTrend(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	defaultCond := ""
	if cond == "" {
		defaultCond = ` AND "bcSalesOrderOrderDate"::date >= CURRENT_DATE - INTERVAL '30 days'`
	}
	return db.QueryRows(ctx, s.pool, `
		SELECT
			TO_CHAR("bcSalesOrderOrderDate"::date, 'YYYY-MM-DD') AS date,
			COUNT(*) AS orders,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+defaultCond+`
		GROUP BY "bcSalesOrderOrderDate"::date
		ORDER BY 1`, args...)
}

// GetRevenueByDayOfWeek returns revenue and order count grouped by day of week.
func (s *Store) GetRevenueByDayOfWeek(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRows(ctx, s.pool, `
		SELECT
			EXTRACT(DOW FROM "bcSalesOrderOrderDate"::date)::int AS dow,
			CASE EXTRACT(DOW FROM "bcSalesOrderOrderDate"::date)
				WHEN 0 THEN 'อา.' WHEN 1 THEN 'จ.'  WHEN 2 THEN 'อ.'
				WHEN 3 THEN 'พ.'  WHEN 4 THEN 'พฤ.' WHEN 5 THEN 'ศ.'
				WHEN 6 THEN 'ส.'
			END AS "dayName",
			COUNT(*) AS orders,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
		GROUP BY EXTRACT(DOW FROM "bcSalesOrderOrderDate"::date)
		ORDER BY dow`, args...)
}

// GetYoYComparison returns current-year vs previous-year revenue/orders by month.
func (s *Store) GetYoYComparison(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		WITH monthly AS (
			SELECT
				EXTRACT(MONTH FROM "bcSalesOrderOrderDate"::date)::int AS month,
				EXTRACT(YEAR  FROM "bcSalesOrderOrderDate"::date)::int AS year,
				COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue,
				COUNT(*) AS orders
			FROM "bcSalesOrder"
			WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
			  AND "bcSalesOrderOrderDate"::date >= (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')::date
			GROUP BY month, year
		)
		SELECT
			m.month,
			CASE m.month
				WHEN 1  THEN 'ม.ค.'  WHEN 2  THEN 'ก.พ.'  WHEN 3  THEN 'มี.ค.'
				WHEN 4  THEN 'เม.ย.' WHEN 5  THEN 'พ.ค.'  WHEN 6  THEN 'มิ.ย.'
				WHEN 7  THEN 'ก.ค.'  WHEN 8  THEN 'ส.ค.'  WHEN 9  THEN 'ก.ย.'
				WHEN 10 THEN 'ต.ค.'  WHEN 11 THEN 'พ.ย.'  WHEN 12 THEN 'ธ.ค.'
			END AS "monthLabel",
			COALESCE(MAX(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) THEN revenue END), 0)          AS "currentRevenue",
			COALESCE(MAX(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) THEN orders  END), 0)::int     AS "currentOrders",
			COALESCE(MAX(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 THEN revenue END), 0)      AS "previousRevenue",
			COALESCE(MAX(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 THEN orders  END), 0)::int AS "previousOrders"
		FROM monthly m
		GROUP BY m.month
		ORDER BY m.month
	`)
}

// GetOrderStatusDist returns order count and revenue grouped by BC status.
func (s *Store) GetOrderStatusDist(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRows(ctx, s.pool, `
		SELECT
			COALESCE(NULLIF("bcSalesOrderStatus", ''), 'Unknown') AS status,
			COUNT(*) AS count,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
		GROUP BY "bcSalesOrderStatus"
		ORDER BY count DESC`, args...)
}

// GetLocationDist returns order count and revenue grouped by warehouse location.
func (s *Store) GetLocationDist(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRows(ctx, s.pool, `
		SELECT
			COALESCE(NULLIF("bcSalesOrderLocationCode", ''), 'N/A') AS location,
			COUNT(*) AS count,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
		GROUP BY "bcSalesOrderLocationCode"
		ORDER BY count DESC`, args...)
}

// GetOrderValueDist returns order count bucketed into value ranges.
func (s *Store) GetOrderValueDist(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRows(ctx, s.pool, `
		SELECT
			CASE
				WHEN "bcSalesOrderAmountIncludingVAT" < 1000  THEN '<1K'
				WHEN "bcSalesOrderAmountIncludingVAT" < 5000  THEN '1K-5K'
				WHEN "bcSalesOrderAmountIncludingVAT" < 10000 THEN '5K-10K'
				WHEN "bcSalesOrderAmountIncludingVAT" < 50000 THEN '10K-50K'
				ELSE '50K+'
			END AS label,
			MIN("bcSalesOrderAmountIncludingVAT") AS "minVal",
			COUNT(*) AS count
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
		GROUP BY label
		ORDER BY "minVal"`, args...)
}

// GetMonthlyComparison returns this month and previous month summary side-by-side.
func (s *Store) GetMonthlyComparison(ctx context.Context) (map[string]any, error) {
	rows, err := db.QueryRows(ctx, s.pool, `
		SELECT
			TO_CHAR(DATE_TRUNC('month', "bcSalesOrderOrderDate"::date), 'YYYY-MM') AS month,
			COUNT(*) AS orders,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT") / NULLIF(COUNT(*)::float8, 0), 0) AS "avgValue",
			COUNT(DISTINCT "bcSalesOrderSellToCustomerNo") AS "uniqueCustomers",
			COALESCE(
				COUNT(*) FILTER (WHERE "bcSalesOrderCompletelyShipped" = 'true')::float8
				/ NULLIF(COUNT(*)::float8, 0) * 100,
				0
			) AS "shipRate"
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		  AND "bcSalesOrderOrderDate"::date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date
		GROUP BY DATE_TRUNC('month', "bcSalesOrderOrderDate"::date)
		ORDER BY 1 DESC
		LIMIT 2
	`)
	if err != nil {
		return nil, err
	}
	result := map[string]any{"current": nil, "previous": nil}
	if len(rows) >= 1 {
		result["current"] = rows[0]
	}
	if len(rows) >= 2 {
		result["previous"] = rows[1]
	}
	return result, nil
}

// GetCustomerInsights returns repeat vs single-order customer breakdown.
func (s *Store) GetCustomerInsights(ctx context.Context, dateFrom, dateTo string) (map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRow(ctx, s.pool, `
		WITH customer_orders AS (
			SELECT
				"bcSalesOrderSellToCustomerNo",
				COUNT(*) AS order_count,
				COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
			FROM "bcSalesOrder"
			WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
			GROUP BY "bcSalesOrderSellToCustomerNo"
		),
		top5_rev AS (
			SELECT COALESCE(SUM(revenue), 0) AS total
			FROM (SELECT revenue FROM customer_orders ORDER BY revenue DESC LIMIT 5) t
		),
		totals AS (
			SELECT
				COUNT(*)                                                   AS "totalCustomers",
				COUNT(*) FILTER (WHERE order_count > 1)                    AS "repeatCustomers",
				COUNT(*) FILTER (WHERE order_count = 1)                    AS "singleOrderCustomers",
				COALESCE(SUM(revenue), 0)                                  AS "totalRevenue",
				COALESCE(SUM(revenue) FILTER (WHERE order_count > 1), 0)   AS "repeatRevenue",
				COALESCE(SUM(revenue) FILTER (WHERE order_count = 1), 0)   AS "singleRevenue"
			FROM customer_orders
		)
		SELECT
			t."repeatCustomers",
			t."singleOrderCustomers",
			COALESCE(t."repeatCustomers"::float8 / NULLIF(t."totalCustomers"::float8, 0) * 100, 0) AS "repeatCustomerRate",
			COALESCE(tp.total / NULLIF(t."totalRevenue", 0) * 100, 0)                              AS "top5ConcentrationPct",
			t."repeatRevenue"  AS "repeatCustomerRevenue",
			t."singleRevenue"  AS "singleCustomerRevenue"
		FROM totals t, top5_rev tp
	`, args...)
}

// GetFulfillmentMetrics returns quantity shipped vs outstanding across all order lines.
func (s *Store) GetFulfillmentMetrics(ctx context.Context, dateFrom, dateTo string) (map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	// Adjust arg index: the JOIN condition is on o."bcSalesOrderSalespersonCode" first, then date filter on o.
	return db.QueryRow(ctx, s.pool, `
		SELECT
			COALESCE(SUM(l."bcSalesOrderLineQuantityValue"), 0)        AS "totalQtyOrdered",
			COALESCE(SUM(l."bcSalesOrderLineQuantityShipped"), 0) AS "totalQtyShipped",
			COALESCE(SUM(l."bcSalesOrderLineOutstandingQuantity"), 0)  AS "totalOutstanding",
			COALESCE(
				SUM(l."bcSalesOrderLineQuantityShipped")
				/ NULLIF(SUM(l."bcSalesOrderLineQuantityValue"), 0) * 100,
				0
			) AS "fulfillmentRate",
			COUNT(DISTINCT CASE WHEN l."bcSalesOrderLineOutstandingQuantity" > 0 THEN l."bcSalesOrderLineDocumentNo" END)
				AS "ordersWithOutstanding"
		FROM "bcSalesOrderLine" l
		JOIN "bcSalesOrder" o ON o."bcSalesOrderNoValue" = l."bcSalesOrderLineDocumentNo"
		WHERE o."bcSalesOrderSalespersonCode" = 'ONLINE'
		  AND l."bcSalesOrderLineTypeValue" = 'Item'`+cond, args...)
}

// GetTopCustomers returns top 10 customers by revenue.
func (s *Store) GetTopCustomers(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	return db.QueryRows(ctx, s.pool, `
		SELECT
			COALESCE(NULLIF("bcSalesOrderSellToCustomerName", ''), "bcSalesOrderSellToCustomerNo") AS name,
			COUNT(*) AS orders,
			COALESCE(SUM("bcSalesOrderAmountIncludingVAT"), 0) AS revenue
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'`+cond+`
		GROUP BY "bcSalesOrderSellToCustomerNo", "bcSalesOrderSellToCustomerName"
		ORDER BY revenue DESC
		LIMIT 10`, args...)
}

// GetTopSkus returns top 10 SKUs by revenue.
func (s *Store) GetTopSkus(ctx context.Context, dateFrom, dateTo string) ([]map[string]any, error) {
	cond, args := dateFilter(dateFrom, dateTo, 1)
	// Date filter applies to the parent order's date via JOIN.
	// Rebuild cond referencing o. prefix since we have a JOIN.
	var joinCond string
	if dateFrom != "" && dateTo != "" {
		joinCond = fmt.Sprintf(` AND o."bcSalesOrderOrderDate"::date BETWEEN $%d AND $%d`, 1, 2)
	}
	_ = cond // replaced by joinCond
	return db.QueryRows(ctx, s.pool, `
		SELECT
			l."bcSalesOrderLineNoValue" AS sku,
			COALESCE(NULLIF(l."bcSalesOrderLineDescriptionValue", ''), l."bcSalesOrderLineNoValue") AS description,
			COALESCE(SUM(l."bcSalesOrderLineAmountValue"), 0)    AS revenue,
			COALESCE(SUM(l."bcSalesOrderLineQuantityValue"), 0)  AS quantity
		FROM "bcSalesOrderLine" l
		JOIN "bcSalesOrder" o ON o."bcSalesOrderNoValue" = l."bcSalesOrderLineDocumentNo"
		WHERE o."bcSalesOrderSalespersonCode" = 'ONLINE'
		  AND l."bcSalesOrderLineTypeValue" = 'Item'`+joinCond+`
		GROUP BY l."bcSalesOrderLineNoValue", l."bcSalesOrderLineDescriptionValue"
		ORDER BY revenue DESC
		LIMIT 10`, args...)
}
