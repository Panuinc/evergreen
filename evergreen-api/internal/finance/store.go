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
			CASE WHEN i."bcPostedSalesInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "status",
			CASE WHEN i."bcPostedSalesInvoiceClosedValue" = 'true' OR i."bcPostedSalesInvoiceDueDate" IS NULL
				THEN 0
				ELSE GREATEST(0, CURRENT_DATE - i."bcPostedSalesInvoiceDueDate")
			END AS "daysOverdue",
			COALESCE(lines.data, '[]') AS "salesInvoiceLines"
		FROM "bcPostedSalesInvoice" i
		LEFT JOIN LATERAL (
			SELECT json_agg(to_json(l.*) ORDER BY l."bcPostedSalesInvoiceLineLineNo") AS data
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
			CASE WHEN i."bcPostedPurchInvoiceClosedValue" = 'true' THEN 'Paid' ELSE 'Open' END AS "status",
			CASE WHEN i."bcPostedPurchInvoiceClosedValue" = 'true' OR i."bcPostedPurchInvoiceDueDate" IS NULL
				THEN 0
				ELSE GREATEST(0, CURRENT_DATE - i."bcPostedPurchInvoiceDueDate")
			END AS "daysOverdue",
			COALESCE(lines.data, '[]') AS "purchaseInvoiceLines"
		FROM "bcPostedPurchInvoice" i
		LEFT JOIN LATERAL (
			SELECT json_agg(to_json(l.*) ORDER BY l."bcPostedPurchInvoiceLineLineNo") AS data
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
			"bcCustomerLedgerEntryCustomerNo",
			"bcCustomerLedgerEntryCustomerName",
			MAX("bcCustomerLedgerEntryCurrencyCode") AS "bcCustomerLedgerEntryCurrencyCode",
			SUM(CASE WHEN "bcCustomerLedgerEntryRemainingAmount" != 0 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "totalRemaining",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "current",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE AND "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "days1to30",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "days31to60",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 60 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "days61plus"
		FROM "bcCustomerLedgerEntry"
		WHERE "bcCustomerLedgerEntryOpenValue" = 'true'
		GROUP BY "bcCustomerLedgerEntryCustomerNo", "bcCustomerLedgerEntryCustomerName"
		HAVING SUM("bcCustomerLedgerEntryRemainingAmount") != 0
		ORDER BY SUM("bcCustomerLedgerEntryRemainingAmount") DESC
	`)
}

// ---- Aged Payables ----

func (s *Store) AgedPayables(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"bcVendorLedgerEntryVendorNo",
			MAX("bcVendorLedgerEntryVendorName") AS "bcVendorLedgerEntryVendorName",
			MAX("bcVendorLedgerEntryCurrencyCode") AS "bcVendorLedgerEntryCurrencyCode",
			SUM(CASE WHEN "bcVendorLedgerEntryRemainingAmount" != 0 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "totalRemaining",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" >= CURRENT_DATE THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "current",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "days1to30",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "days31to60",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) AS "days61plus"
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

// ---- Trial Balance ----

func (s *Store) TrialBalance(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcGLAccount"
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

// ---- Bank Statements ----

func (s *Store) ListBankStatements(ctx context.Context, status string) ([]map[string]any, error) {
	if status != "" {
		return db.QueryRows(ctx, s.pool, `SELECT * FROM "bankStatement" WHERE "status" = $1 ORDER BY "createdAt" DESC`, status)
	}
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bankStatement" ORDER BY "createdAt" DESC`)
}

func (s *Store) CreateBankStatement(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "bankStatement" ("fileName","fileUrl","bankCode","createdBy")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, body["fileName"], body["fileUrl"], body["bankCode"], userID)
}

func (s *Store) GetBankStatementWithEntries(ctx context.Context, id string) (map[string]any, []map[string]any, error) {
	stmt, err := db.QueryRow(ctx, s.pool, `SELECT * FROM "bankStatement" WHERE id = $1`, id)
	if err != nil {
		return nil, nil, err
	}
	entries, _ := db.QueryRows(ctx, s.pool, `
		SELECT e.*, json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as matches
		FROM "bankEntry" e LEFT JOIN "bankMatch" m ON m."entryId" = e.id
		WHERE e."statementId" = $1
		GROUP BY e.id ORDER BY e."lineNumber"
	`, id)
	return stmt, entries, nil
}

func (s *Store) DeleteBankStatement(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM "bankStatement" WHERE id = $1`, id)
	return err
}

// ---- Parse Bank Statement ----

func (s *Store) GetBankStatementByID(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "bankStatement" WHERE id = $1`, id)
}

func (s *Store) UpdateBankStatementError(ctx context.Context, id, errMsg string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "bankStatement" SET "status"='error',"parseError"=$2 WHERE id=$1`, id, errMsg)
	return err
}

func (s *Store) DeleteBankEntries(ctx context.Context, statementID string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM "bankEntry" WHERE "statementId" = $1`, statementID)
	return err
}

func (s *Store) InsertBankEntry(ctx context.Context, statementID string, entry map[string]any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "bankEntry" ("statementId","lineNumber","txDate","txTime","description","amount","direction","balance","matchStatus")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'unmatched')
	`, statementID, entry["lineNumber"], entry["txDate"], entry["txTime"], entry["description"],
		entry["amount"], entry["direction"], entry["balance"])
	return err
}

func (s *Store) UpdateBankStatementParsed(ctx context.Context, id string, entryCount int) error {
	_, err := s.pool.Exec(ctx, `UPDATE "bankStatement" SET "status"='parsed',"entryCount"=$2 WHERE id=$1`, id, entryCount)
	return err
}

// ---- Auto Match ----

func (s *Store) GetUnmatchedCreditEntries(ctx context.Context, statementID string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bankEntry" WHERE "statementId" = $1 AND "matchStatus" = 'unmatched' AND "direction" = 'credit'
	`, statementID)
}

func (s *Store) GetOpenSalesInvoices(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcPostedSalesInvoice" WHERE "bcPostedSalesInvoiceRemainingAmount" > 0
	`)
}

func (s *Store) GetAllCustomers(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "bcCustomer"`)
}

func (s *Store) InsertBankMatch(ctx context.Context, entryID, invoiceNumber, custNo, custName, invoiceAmt, remaining, matched any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "bankMatch" ("entryId","invoiceNumber","customerNumber","customerName","invoiceAmount","remainingAmount","matchedAmount")
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, entryID, invoiceNumber, custNo, custName, invoiceAmt, remaining, matched)
	return err
}

func (s *Store) UpdateBankEntryMatched(ctx context.Context, entryID string, confidence float64, method string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "bankEntry" SET "matchStatus"='matched',"matchConfidence"=$2,"matchMethod"=$3 WHERE id=$1`, entryID, confidence, method)
	return err
}

// ---- Manual Match ----

func (s *Store) ManualMatchEntry(ctx context.Context, entryID, invoiceNumber string, amount float64) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "bankMatch" ("entryId","invoiceNumber","matchedAmount") VALUES ($1,$2,$3)
	`, entryID, invoiceNumber, amount)
	return err
}

func (s *Store) SetBankEntryMatchedManual(ctx context.Context, entryID, userID string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE "bankEntry" SET "matchStatus"='matched',"matchMethod"='manual',"matchedBy"=$2,"matchedAt"=now() WHERE id=$1
	`, entryID, userID)
	return err
}

func (s *Store) UnmatchEntry(ctx context.Context, entryID string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM "bankMatch" WHERE "entryId"=$1`, entryID)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `UPDATE "bankEntry" SET "matchStatus"='unmatched',"matchMethod"=null,"matchedBy"=null,"matchedAt"=null WHERE id=$1`, entryID)
	return err
}

func (s *Store) ExcludeEntry(ctx context.Context, entryID, userID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "bankEntry" SET "matchStatus"='excluded',"matchedBy"=$2,"matchedAt"=now() WHERE id=$1`, entryID, userID)
	return err
}
