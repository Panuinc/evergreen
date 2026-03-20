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

func (s *Store) ListSalesInvoices(ctx context.Context, status string) ([]map[string]any, error) {
	where := ""
	if status == "Open" {
		where = `WHERE i."bcPostedSalesInvoiceClosedValue" = 'false'`
	} else if status != "all" && status != "" {
		where = `WHERE i."bcPostedSalesInvoiceClosedValue" = 'true'`
	}
	q := fmt.Sprintf(`
		SELECT
			i.id,
			i."bcPostedSalesInvoiceNoValue" AS "invoiceNumber",
			i."bcPostedSalesInvoicePostingDate" AS "invoiceDate",
			i."bcPostedSalesInvoiceDueDate" AS "dueDate",
			i."bcPostedSalesInvoiceSellToCustomerNo" AS "customerNumber",
			i."bcPostedSalesInvoiceSellToCustomerName" AS "customerName",
			i."bcPostedSalesInvoiceSalespersonCode" AS "salespersonCode",
			i."bcPostedSalesInvoiceAmountIncludingVAT" AS "totalAmountIncludingTax",
			i."bcPostedSalesInvoiceAmountValue" AS "amount",
			(i."bcPostedSalesInvoiceAmountIncludingVAT" - i."bcPostedSalesInvoiceAmountValue") AS "totalTaxAmount",
			i."bcPostedSalesInvoiceRemainingAmount" AS "remainingAmount",
			CASE WHEN i."bcPostedSalesInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "status",
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
	`, where)
	return db.QueryRows(ctx, s.pool, q)
}

// ---- Purchase Invoices ----

func (s *Store) ListPurchaseInvoices(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			i.id,
			i."bcPostedPurchInvoiceNoValue" AS "invoiceNumber",
			i."bcPostedPurchInvoiceVendorInvoiceNo" AS "vendorInvoiceNumber",
			i."bcPostedPurchInvoicePostingDate" AS "invoiceDate",
			i."bcPostedPurchInvoiceDueDate" AS "dueDate",
			i."bcPostedPurchInvoiceBuyFromVendorNo" AS "vendorNumber",
			i."bcPostedPurchInvoiceBuyFromVendorName" AS "vendorName",
			i."bcPostedPurchInvoicePurchaserCode" AS "purchaserCode",
			i."bcPostedPurchInvoiceAmountIncludingVAT" AS "totalAmountIncludingTax",
			i."bcPostedPurchInvoiceAmountValue" AS "amount",
			(i."bcPostedPurchInvoiceAmountIncludingVAT" - i."bcPostedPurchInvoiceAmountValue") AS "totalTaxAmount",
			CASE WHEN i."bcPostedPurchInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "status",
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
	`)
}

// ---- Aged Receivables ----

func (s *Store) AgedReceivables(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			e."bcCustomerLedgerEntryCustomerNo" AS "customerNumber",
			COALESCE(c."bcCustomerNameValue", e."bcCustomerLedgerEntryCustomerNo") AS "name",
			MAX(e."bcCustomerLedgerEntryCurrencyCode") AS "currencyCode",
			SUM(CASE WHEN e."bcCustomerLedgerEntryRemainingAmount" != 0 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "balanceDue",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period1Amount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 30 AND e."bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period2Amount",
			SUM(CASE WHEN e."bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 60 THEN e."bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "period3Amount"
		FROM "bcCustomerLedgerEntry" e
		LEFT JOIN "bcCustomer" c ON c."bcCustomerNo" = e."bcCustomerLedgerEntryCustomerNo"
		WHERE e."bcCustomerLedgerEntryOpenValue" = 'true'
		GROUP BY e."bcCustomerLedgerEntryCustomerNo", c."bcCustomerNameValue"
		HAVING SUM(e."bcCustomerLedgerEntryRemainingAmount") != 0
		ORDER BY SUM(e."bcCustomerLedgerEntryRemainingAmount") DESC
	`)
}

// ---- Aged Payables ----

func (s *Store) AgedPayables(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcVendorLedgerEntryVendorNo" AS "vendorNumber",
			MAX("bcVendorLedgerEntryVendorName") AS "name",
			MAX("bcVendorLedgerEntryCurrencyCode") AS "currencyCode",
			SUM(CASE WHEN "bcVendorLedgerEntryRemainingAmount" != 0 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "balanceDue",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" >= CURRENT_DATE THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period1Amount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period2Amount",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "period3Amount"
		FROM "bcVendorLedgerEntry"
		WHERE "bcVendorLedgerEntryOpenValue" = 'true'
		GROUP BY "bcVendorLedgerEntryVendorNo"
		HAVING SUM("bcVendorLedgerEntryRemainingAmount") != 0
		ORDER BY SUM("bcVendorLedgerEntryRemainingAmount") ASC
	`)
}

// ---- GL Entries ----

func (s *Store) ListGLEntries(ctx context.Context, start, end string) ([]map[string]any, error) {
	q := `SELECT * FROM "bcGLEntry" WHERE 1=1`
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
			"bcGLEntryGLAccountNo" AS "accountNo",
			MAX("bcGLEntryGLAccountName") AS "name",
			TO_CHAR("bcGLEntryPostingDate", 'MM') AS "month",
			SUM(COALESCE("bcGLEntryDebitAmount", 0)) AS "debit",
			SUM(COALESCE("bcGLEntryCreditAmount", 0)) AS "credit"
		FROM "bcGLEntry"
		WHERE "bcGLEntryPostingDate" >= $1 AND "bcGLEntryPostingDate" <= $2
		GROUP BY "bcGLEntryGLAccountNo", TO_CHAR("bcGLEntryPostingDate", 'MM')
		ORDER BY "bcGLEntryGLAccountNo", "month"
	`, start, end)
	if err != nil {
		return nil, err
	}

	result := map[string]any{}
	for _, row := range rows {
		acct, _ := row["accountNo"].(string)
		name, _ := row["name"].(string)
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
			"debit":  row["debit"],
			"credit": row["credit"],
		}
	}
	return result, nil
}

// ---- Trial Balance ----

func (s *Store) TrialBalance(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcGLAccountNo" AS "number",
			"bcGLAccountNameValue" AS "display",
			"bcGLAccountAccountType" AS "accountType",
			"bcGLAccountAccountCategory" AS "accountCategory",
			"bcGLAccountIndentation" AS "indentation",
			CASE WHEN "bcGLAccountBalance" >= 0 THEN "bcGLAccountBalance" ELSE 0 END AS "balanceAtDateDebit",
			CASE WHEN "bcGLAccountBalance" < 0 THEN ABS("bcGLAccountBalance") ELSE 0 END AS "balanceAtDateCredit",
			"bcGLAccountBalance" AS "balance",
			"bcGLAccountNetChange" AS "netChange"
		FROM "bcGLAccount"
		ORDER BY "bcGLAccountNo"
	`)
}

// ---- Collections ----

func (s *Store) ListCollections(ctx context.Context, customerNumber, status, since, until string) ([]map[string]any, error) {
	q := `SELECT * FROM "arFollowUp" WHERE 1=1`
	var args []any
	idx := 1
	if customerNumber != "" {
		q += fmt.Sprintf(` AND "customerNumber" = $%d`, idx)
		args = append(args, customerNumber)
		idx++
	}
	if status != "" && status != "all" {
		q += fmt.Sprintf(` AND "status" = $%d`, idx)
		args = append(args, status)
		idx++
	}
	if since != "" {
		q += fmt.Sprintf(` AND "contactDate" >= $%d`, idx)
		args = append(args, since)
		idx++
	}
	if until != "" {
		q += fmt.Sprintf(` AND "contactDate" <= $%d`, idx)
		args = append(args, until)
	}
	q += ` ORDER BY "contactDate" DESC, "createdAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateCollection(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "arFollowUp" ("customerNumber","customerName","invoiceNumber","contactDate","contactMethod",
			"reason","reasonDetail","note","promiseDate","promiseAmount","status","nextFollowUpDate","assignedTo","createdBy","createdByName")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
	`, body["customerNumber"], body["customerName"], body["invoiceNumber"], body["contactDate"],
		body["contactMethod"], body["reason"], body["reasonDetail"], body["note"],
		body["promiseDate"], body["promiseAmount"], body["status"], body["nextFollowUpDate"],
		body["assignedTo"], userID, body["createdByName"])
}

