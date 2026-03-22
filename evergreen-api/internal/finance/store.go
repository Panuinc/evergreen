package finance

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

// ---- Sales Invoices ----

func (s *Store) ListSalesInvoices(ctx context.Context, status string, limit, offset int) ([]map[string]any, error) {
	if limit <= 0 {
		limit = 200
	}
	where := ""
	if status == "Open" {
		where = `WHERE i."bcPostedSalesInvoiceClosedValue" = 'false'`
	} else if status != "all" && status != "" {
		where = `WHERE i."bcPostedSalesInvoiceClosedValue" = 'true'`
	}
	q := fmt.Sprintf(`
		SELECT
			i."bcPostedSalesInvoiceId",
			i."bcPostedSalesInvoiceNoValue",
			i."bcPostedSalesInvoicePostingDate",
			i."bcPostedSalesInvoiceDueDate",
			i."bcPostedSalesInvoiceSellToCustomerNo",
			i."bcPostedSalesInvoiceSellToCustomerName",
			i."bcPostedSalesInvoiceSalespersonCode",
			i."bcPostedSalesInvoiceAmountIncludingVAT",
			i."bcPostedSalesInvoiceAmountValue",
			(i."bcPostedSalesInvoiceAmountIncludingVAT" - i."bcPostedSalesInvoiceAmountValue") AS "totalTaxAmount",
			i."bcPostedSalesInvoiceRemainingAmount",
			CASE WHEN i."bcPostedSalesInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "bcPostedSalesInvoiceStatus",
			CASE WHEN i."bcPostedSalesInvoiceClosedValue" = 'true' OR i."bcPostedSalesInvoiceDueDate" IS NULL
				THEN 0
				ELSE GREATEST(0, CURRENT_DATE - i."bcPostedSalesInvoiceDueDate")
			END AS "daysOverdue",
			COALESCE(lines.data, '[]') AS "lines"
		FROM "bcPostedSalesInvoice" i
		LEFT JOIN LATERAL (
			SELECT json_agg(json_build_object(
				'lineNo', l."bcPostedSalesInvoiceLineLineNo",
				'type', l."bcPostedSalesInvoiceLineTypeValue",
				'itemNo', l."bcPostedSalesInvoiceLineNoValue",
				'description', l."bcPostedSalesInvoiceLineDescriptionValue",
				'quantity', l."bcPostedSalesInvoiceLineQuantityValue",
				'unitOfMeasure', l."bcPostedSalesInvoiceLineUnitOfMeasureCode",
				'unitPrice', l."bcPostedSalesInvoiceLineUnitPrice",
				'amountIncludingTax', l."bcPostedSalesInvoiceLineAmountIncludingVAT"
			) ORDER BY l."bcPostedSalesInvoiceLineLineNo") AS data
			FROM "bcPostedSalesInvoiceLine" l
			WHERE l."bcPostedSalesInvoiceLineDocumentNo" = i."bcPostedSalesInvoiceNoValue"
		) lines ON true
		%s
		ORDER BY i."bcPostedSalesInvoicePostingDate" DESC
		LIMIT %d OFFSET %d
	`, where, limit, offset)
	return db.QueryRows(ctx, s.pool, q)
}

// ---- Purchase Invoices ----

func (s *Store) ListPurchaseInvoices(ctx context.Context, limit, offset int) ([]map[string]any, error) {
	if limit <= 0 {
		limit = 200
	}
	return db.QueryRows(ctx, s.pool, fmt.Sprintf(`
		SELECT
			i."bcPostedPurchInvoiceId",
			i."bcPostedPurchInvoiceNoValue",
			i."bcPostedPurchInvoiceVendorInvoiceNo",
			i."bcPostedPurchInvoicePostingDate",
			i."bcPostedPurchInvoiceDueDate",
			i."bcPostedPurchInvoiceBuyFromVendorNo",
			i."bcPostedPurchInvoiceBuyFromVendorName",
			i."bcPostedPurchInvoicePurchaserCode",
			i."bcPostedPurchInvoiceAmountIncludingVAT",
			i."bcPostedPurchInvoiceAmountValue",
			(i."bcPostedPurchInvoiceAmountIncludingVAT" - i."bcPostedPurchInvoiceAmountValue") AS "totalTaxAmount",
			CASE WHEN i."bcPostedPurchInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "bcPostedPurchInvoiceStatus",
			CASE WHEN i."bcPostedPurchInvoiceClosedValue" = 'true' OR i."bcPostedPurchInvoiceDueDate" IS NULL
				THEN 0
				ELSE GREATEST(0, CURRENT_DATE - i."bcPostedPurchInvoiceDueDate")
			END AS "daysOverdue",
			COALESCE(lines.data, '[]') AS "lines"
		FROM "bcPostedPurchInvoice" i
		LEFT JOIN LATERAL (
			SELECT json_agg(json_build_object(
				'lineNo', l."bcPostedPurchInvoiceLineLineNo",
				'type', l."bcPostedPurchInvoiceLineTypeValue",
				'itemNo', l."bcPostedPurchInvoiceLineNoValue",
				'description', l."bcPostedPurchInvoiceLineDescriptionValue",
				'quantity', l."bcPostedPurchInvoiceLineQuantityValue",
				'unitOfMeasure', l."bcPostedPurchInvoiceLineUnitOfMeasureCode",
				'unitCost', l."bcPostedPurchInvoiceLineDirectUnitCost",
				'amountIncludingTax', l."bcPostedPurchInvoiceLineAmountIncludingVAT"
			) ORDER BY l."bcPostedPurchInvoiceLineLineNo") AS data
			FROM "bcPostedPurchInvoiceLine" l
			WHERE l."bcPostedPurchInvoiceLineDocumentNo" = i."bcPostedPurchInvoiceNoValue"
		) lines ON true
		ORDER BY i."bcPostedPurchInvoicePostingDate" DESC
		LIMIT %d OFFSET %d
	`, limit, offset))
}

// ---- Aged Receivables ----

func (s *Store) AgedReceivables(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			e."bcCustomerLedgerEntryCustomerNo",
			COALESCE(c."bcCustomerNameValue", e."bcCustomerLedgerEntryCustomerNo") AS "bcCustomerNameValue",
			MAX(e."bcCustomerLedgerEntryCurrencyCode") AS "bcCustomerLedgerEntryCurrencyCode",
			SUM(CASE WHEN e."bcCustomerLedgerEntryRemainingAmount" != 0 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "bcCustomerLedgerEntryRemainingAmount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period1Amount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 30 AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period2Amount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period3Amount"
		FROM "bcCustomerLedgerEntry" e
		LEFT JOIN "bcCustomer" c ON c."bcCustomerNo" = e."bcCustomerLedgerEntryCustomerNo"
		WHERE e."bcCustomerLedgerEntryOpenValue" = 'true'
			AND e."bcCustomerLedgerEntryCustomerNo" != 'CTD-0049'
		GROUP BY e."bcCustomerLedgerEntryCustomerNo", c."bcCustomerNameValue"
		HAVING SUM(e."bcCustomerLedgerEntryRemainingAmount") != 0
		ORDER BY SUM(e."bcCustomerLedgerEntryRemainingAmount") DESC
		LIMIT 2000
	`)
}

// ---- Aged Payables ----

func (s *Store) AgedPayables(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcVendorLedgerEntryVendorNo",
			MAX("bcVendorLedgerEntryVendorName") AS "bcVendorLedgerEntryVendorName",
			MAX("bcVendorLedgerEntryCurrencyCode") AS "bcVendorLedgerEntryCurrencyCode",
			SUM(CASE WHEN "bcVendorLedgerEntryRemainingAmount" != 0 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "bcVendorLedgerEntryRemainingAmount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" >= CURRENT_DATE THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period1Amount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period2Amount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period3Amount"
		FROM "bcVendorLedgerEntry"
		WHERE "bcVendorLedgerEntryOpenValue" = 'true'
		GROUP BY "bcVendorLedgerEntryVendorNo"
		HAVING SUM("bcVendorLedgerEntryRemainingAmount") != 0
		ORDER BY SUM("bcVendorLedgerEntryRemainingAmount") ASC
		LIMIT 2000
	`)
}

// ---- GL Entries ----

func (s *Store) ListGLEntries(ctx context.Context, start, end string) ([]map[string]any, error) {
	q := `SELECT
			"bcGLEntryEntryNo",
			"bcGLEntryGLAccountNo",
			"bcGLEntryGLAccountName",
			"bcGLEntryPostingDate",
			"bcGLEntryDocumentType",
			"bcGLEntryDocumentNo",
			"bcGLEntryDescriptionValue",
			"bcGLEntryAmountValue",
			"bcGLEntryDebitAmount",
			"bcGLEntryCreditAmount",
			"bcGLEntryGlobalDimension1Code",
			"bcGLEntryGlobalDimension2Code",
			"bcGLEntrySourceType",
			"bcGLEntrySourceNo",
			"bcGLEntryDocumentDate",
			"bcGLEntryExternalDocumentNo",
			"bcGLEntryVATAmount"
		FROM "bcGLEntry" WHERE 1=1`
	var args []any
	idx := 1
	if start != "" {
		q += fmt.Sprintf(` AND "bcGLEntryPostingDate" >= $%d`, idx)
		args = append(args, start)
		idx++
	}
	if end != "" {
		q += fmt.Sprintf(` AND "bcGLEntryPostingDate" <= $%d`, idx)
		args = append(args, end)
	}
	q += ` ORDER BY "bcGLEntryEntryNo" DESC LIMIT 5000`
	return db.QueryRows(ctx, s.pool, q, args...)
}

// GLEntriesMonthly returns GL entries aggregated by account+month.
// Result: { "acctNo": { "name": "...", "months": { "01": { "debit": x, "credit": y }, ... } } }
func (s *Store) GLEntriesMonthly(ctx context.Context, start, end string) (map[string]any, error) {
	rows, err := db.QueryRows(ctx, s.pool, `
		SELECT
			"bcGLEntryGLAccountNo",
			MAX("bcGLEntryGLAccountName") AS "bcGLEntryGLAccountName",
			TO_CHAR("bcGLEntryPostingDate", 'MM') AS "month",
			SUM(COALESCE("bcGLEntryDebitAmount", 0)) AS "bcGLEntryDebitAmount",
			SUM(COALESCE("bcGLEntryCreditAmount", 0)) AS "bcGLEntryCreditAmount"
		FROM "bcGLEntry"
		WHERE "bcGLEntryPostingDate" >= $1 AND "bcGLEntryPostingDate" <= $2
			AND "bcGLEntryDescriptionValue" NOT LIKE 'Close Income Statement%'
		GROUP BY "bcGLEntryGLAccountNo", TO_CHAR("bcGLEntryPostingDate", 'MM')
		ORDER BY "bcGLEntryGLAccountNo", "month"
	`, start, end)
	if err != nil {
		return nil, err
	}

	result := map[string]any{}
	for _, row := range rows {
		acct, _ := row["bcGLEntryGLAccountNo"].(string)
		name, _ := row["bcGLEntryGLAccountName"].(string)
		month, _ := row["month"].(string)

		if _, exists := result[acct]; !exists {
			result[acct] = map[string]any{
				"name":   name,
				"months": map[string]any{},
			}
		}
		acctData := result[acct].(map[string]any)
		months := acctData["months"].(map[string]any)
		months[month] = map[string]any{
			"debit":  row["bcGLEntryDebitAmount"],
			"credit": row["bcGLEntryCreditAmount"],
		}
	}
	return result, nil
}

// ---- Trial Balance ----

func (s *Store) TrialBalance(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcGLAccountNo",
			"bcGLAccountNameValue",
			"bcGLAccountAccountType",
			"bcGLAccountAccountCategory",
			"bcGLAccountIndentation",
			CASE WHEN "bcGLAccountBalance" >= 0 THEN "bcGLAccountBalance" ELSE 0 END AS "balanceAtDateDebit",
			CASE WHEN "bcGLAccountBalance" < 0 THEN ABS("bcGLAccountBalance") ELSE 0 END AS "balanceAtDateCredit",
			"bcGLAccountBalance",
			"bcGLAccountNetChange"
		FROM "bcGLAccount"
		ORDER BY "bcGLAccountNo"
	`)
}

// ---- Collections ----

func (s *Store) ListCollections(ctx context.Context, customerNumber, status, since, until string) ([]map[string]any, error) {
	q := `SELECT
			"arFollowUpId",
			"arFollowUpCustomerNumber",
			"arFollowUpCustomerName",
			"arFollowUpInvoiceNumber",
			"arFollowUpContactDate",
			"arFollowUpContactMethod",
			"arFollowUpReason",
			"arFollowUpReasonDetail",
			"arFollowUpNote",
			"arFollowUpPromiseDate",
			"arFollowUpPromiseAmount",
			"arFollowUpStatus",
			"arFollowUpNextFollowUpDate",
			"arFollowUpCreatedByName"
		FROM "arFollowUp" WHERE 1=1`
	var args []any
	idx := 1
	if customerNumber != "" {
		q += fmt.Sprintf(` AND "arFollowUpCustomerNumber" = $%d`, idx)
		args = append(args, customerNumber)
		idx++
	}
	if status != "" && status != "all" {
		q += fmt.Sprintf(` AND "arFollowUpStatus" = $%d`, idx)
		args = append(args, status)
		idx++
	}
	if since != "" {
		q += fmt.Sprintf(` AND "arFollowUpContactDate" >= $%d`, idx)
		args = append(args, since)
		idx++
	}
	if until != "" {
		q += fmt.Sprintf(` AND "arFollowUpContactDate" <= $%d`, idx)
		args = append(args, until)
	}
	q += ` ORDER BY "arFollowUpContactDate" DESC, "arFollowUpCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

// ListCollectionsMerged returns aged receivables merged with the latest follow-up per customer.
// This replaces the two-endpoint fetch (agedReceivables + collections) done in the frontend.
func (s *Store) ListCollectionsMerged(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		WITH ar AS (
			SELECT
				e."bcCustomerLedgerEntryCustomerNo",
				COALESCE(c."bcCustomerNameValue", e."bcCustomerLedgerEntryCustomerNo") AS "bcCustomerNameValue",
				MAX(e."bcCustomerLedgerEntryCurrencyCode") AS "bcCustomerLedgerEntryCurrencyCode",
				SUM(CASE WHEN e."bcCustomerLedgerEntryRemainingAmount" != 0 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "bcCustomerLedgerEntryRemainingAmount",
				SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount",
				SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period1Amount",
				SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 30 AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period2Amount",
				SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period3Amount"
			FROM "bcCustomerLedgerEntry" e
			LEFT JOIN "bcCustomer" c ON c."bcCustomerNo" = e."bcCustomerLedgerEntryCustomerNo"
			WHERE e."bcCustomerLedgerEntryOpenValue" = 'true'
				AND e."bcCustomerLedgerEntryCustomerNo" != 'CTD-0049'
			GROUP BY e."bcCustomerLedgerEntryCustomerNo", c."bcCustomerNameValue"
			HAVING SUM(e."bcCustomerLedgerEntryRemainingAmount") != 0
		),
		fu_latest AS (
			SELECT DISTINCT ON ("arFollowUpCustomerNumber")
				"arFollowUpCustomerNumber",
				"arFollowUpContactDate",
				"arFollowUpReason",
				"arFollowUpStatus",
				"arFollowUpNote",
				"arFollowUpNextFollowUpDate",
				"arFollowUpPromiseDate",
				"arFollowUpPromiseAmount"
			FROM "arFollowUp"
			ORDER BY "arFollowUpCustomerNumber", "arFollowUpContactDate" DESC, "arFollowUpCreatedAt" DESC
		),
		fu_count AS (
			SELECT "arFollowUpCustomerNumber", COUNT(*) AS "followUpCount"
			FROM "arFollowUp"
			GROUP BY "arFollowUpCustomerNumber"
		)
		SELECT
			ar."bcCustomerLedgerEntryCustomerNo",
			ar."bcCustomerNameValue",
			ar."bcCustomerLedgerEntryCurrencyCode",
			ar."bcCustomerLedgerEntryRemainingAmount",
			ar."currentAmount",
			ar."period1Amount",
			ar."period2Amount",
			ar."period3Amount",
			COALESCE(fc."followUpCount", 0) AS "followUpCount",
			fl."arFollowUpContactDate",
			fl."arFollowUpReason",
			fl."arFollowUpStatus",
			fl."arFollowUpNote",
			fl."arFollowUpNextFollowUpDate",
			fl."arFollowUpPromiseDate",
			fl."arFollowUpPromiseAmount"
		FROM ar
		LEFT JOIN fu_latest fl ON fl."arFollowUpCustomerNumber" = ar."bcCustomerLedgerEntryCustomerNo"
		LEFT JOIN fu_count fc ON fc."arFollowUpCustomerNumber" = ar."bcCustomerLedgerEntryCustomerNo"
		ORDER BY ar."bcCustomerLedgerEntryRemainingAmount" DESC
		LIMIT 2000
	`)
}

func (s *Store) CreateCollection(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "arFollowUp" ("arFollowUpCustomerNumber","arFollowUpCustomerName","arFollowUpInvoiceNumber","arFollowUpContactDate","arFollowUpContactMethod",
			"arFollowUpReason","arFollowUpReasonDetail","arFollowUpNote","arFollowUpPromiseDate","arFollowUpPromiseAmount","arFollowUpStatus","arFollowUpNextFollowUpDate","arFollowUpAssignedTo","arFollowUpCreatedBy","arFollowUpCreatedByName")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
	`, body["customerNumber"], body["customerName"], body["invoiceNumber"], body["contactDate"],
		body["contactMethod"], body["reason"], body["reasonDetail"], body["note"],
		body["promiseDate"], body["promiseAmount"], body["status"], body["nextFollowUpDate"],
		body["assignedTo"], userID, body["createdByName"])
}
