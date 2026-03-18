package finance

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/external"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
	ai   *external.OpenRouterClient
	cfg  *config.Config
}

func New(pool *pgxpool.Pool, cfg *config.Config, ai *external.OpenRouterClient) *Handler {
	return &Handler{pool: pool, ai: ai, cfg: cfg}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	// Now reading from Supabase instead of BC API
	r.Get("/salesInvoices", h.SalesInvoices)
	r.Get("/purchaseInvoices", h.PurchaseInvoices)
	r.Get("/agedReceivables", h.AgedReceivables)
	r.Get("/agedPayables", h.AgedPayables)
	r.Get("/glEntries", h.GLEntries)
	r.Get("/trialBalance", h.TrialBalance)

	r.Route("/collections", func(r chi.Router) {
		r.Get("/", h.ListCollections)
		r.Post("/", h.CreateCollection)
	})

	r.Route("/bankRecon", func(r chi.Router) {
		r.Get("/", h.ListBankStatements)
		r.Post("/", h.CreateBankStatement)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetBankStatement)
			r.Delete("/", h.DeleteBankStatement)
			r.Post("/parse", h.ParseBankStatement)
			r.Post("/match", h.AutoMatch)
			r.Put("/match", h.ManualMatch)
			r.Get("/export", h.ExportBankRecon)
		})
	})

	// AI endpoints (pass-through to OpenRouter)
	r.Post("/aiAnalysis", h.AIAnalysis)
	r.Post("/aiCashFlow", h.AICashFlow)
	r.Post("/aiCollections", h.AICollections)

	return r
}

// ---- Sales Invoices (from Supabase instead of BC API) ----

func (h *Handler) SalesInvoices(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "Open"
	}

	// Read from synced bcSalesInvoice + bcPostedSalesInvoice tables
	q := `SELECT * FROM "bcPostedSalesInvoice" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if status != "all" {
		q += fmt.Sprintf(` AND "bcPostedSalesInvoiceClosedValue" = $%d`, argIdx)
		if status == "Open" {
			args = append(args, "false")
		} else {
			args = append(args, "true")
		}
	}
	q += ` ORDER BY "bcPostedSalesInvoicePostingDate" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Purchase Invoices (from Supabase) ----

func (h *Handler) PurchaseInvoices(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcPostedPurchInvoice"
		ORDER BY "bcPostedPurchInvoicePostingDate" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Aged Receivables (calculated from bcCustomerLedgerEntry) ----

func (h *Handler) AgedReceivables(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT
			"bcCustomerLedgerEntryCustomerNo" as "customerNo",
			"bcCustomerLedgerEntryCustomerName" as "customerName",
			SUM(CASE WHEN "bcCustomerLedgerEntryRemainingAmount" != 0 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "totalRemaining",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "current",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE AND "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "days1to30",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "days31to60",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 60 AND "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE - 90 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "days61to90",
			SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" < CURRENT_DATE - 90 THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) as "over90"
		FROM "bcCustomerLedgerEntry"
		WHERE "bcCustomerLedgerEntryOpenValue" = 'true'
		GROUP BY "bcCustomerLedgerEntryCustomerNo", "bcCustomerLedgerEntryCustomerName"
		HAVING SUM("bcCustomerLedgerEntryRemainingAmount") != 0
		ORDER BY SUM("bcCustomerLedgerEntryRemainingAmount") DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Aged Payables (calculated from bcVendorLedgerEntry) ----

func (h *Handler) AgedPayables(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT
			"bcVendorLedgerEntryVendorNo" as "vendorNo",
			MAX("bcVendorLedgerEntryDescription") as "vendorName",
			SUM(CASE WHEN "bcVendorLedgerEntryRemainingAmount" != 0 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "totalRemaining",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" >= CURRENT_DATE THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "current",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 30 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "days1to30",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 30 AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 60 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "days31to60",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 60 AND "bcVendorLedgerEntryDueDate" >= CURRENT_DATE - 90 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "days61to90",
			SUM(CASE WHEN "bcVendorLedgerEntryDueDate" < CURRENT_DATE - 90 THEN "bcVendorLedgerEntryRemainingAmount" ELSE 0 END) as "over90"
		FROM "bcVendorLedgerEntry"
		WHERE "bcVendorLedgerEntryOpenValue" = 'true'
		GROUP BY "bcVendorLedgerEntryVendorNo"
		HAVING SUM("bcVendorLedgerEntryRemainingAmount") != 0
		ORDER BY SUM("bcVendorLedgerEntryRemainingAmount") ASC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- GL Entries (from Supabase) ----

func (h *Handler) GLEntries(w http.ResponseWriter, r *http.Request) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")

	q := `SELECT * FROM "bcGLEntry" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if start != "" {
		q += fmt.Sprintf(` AND "bcGLEntryPostingDate" >= $%d`, argIdx)
		args = append(args, start)
		argIdx++
	}
	if end != "" {
		q += fmt.Sprintf(` AND "bcGLEntryPostingDate" <= $%d`, argIdx)
		args = append(args, end)
	}
	q += ` ORDER BY "bcGLEntryEntryNo" DESC LIMIT 5000`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Trial Balance (from bcGLAccount) ----

func (h *Handler) TrialBalance(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcGLAccount"
		ORDER BY "bcGLAccountNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Collections (arFollowUp) ----

func (h *Handler) ListCollections(w http.ResponseWriter, r *http.Request) {
	q := `SELECT * FROM "arFollowUp" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if cust := r.URL.Query().Get("customerNumber"); cust != "" {
		q += fmt.Sprintf(` AND "customerNumber" = $%d`, argIdx)
		args = append(args, cust)
		argIdx++
	}
	if status := r.URL.Query().Get("status"); status != "" && status != "all" {
		q += fmt.Sprintf(` AND "status" = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if since := r.URL.Query().Get("since"); since != "" {
		q += fmt.Sprintf(` AND "contactDate" >= $%d`, argIdx)
		args = append(args, since)
		argIdx++
	}
	if until := r.URL.Query().Get("until"); until != "" {
		q += fmt.Sprintf(` AND "contactDate" <= $%d`, argIdx)
		args = append(args, until)
	}
	q += ` ORDER BY "contactDate" DESC, "createdAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	if body["customerNumber"] == nil || body["reason"] == nil {
		response.BadRequest(w, "กรุณาระบุ customerNumber และ reason")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "arFollowUp" ("customerNumber","customerName","invoiceNumber","contactDate","contactMethod",
			"reason","reasonDetail","note","promiseDate","promiseAmount","status","nextFollowUpDate","assignedTo","createdBy","createdByName")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
	`, body["customerNumber"], body["customerName"], body["invoiceNumber"], body["contactDate"],
		body["contactMethod"], body["reason"], body["reasonDetail"], body["note"],
		body["promiseDate"], body["promiseAmount"], body["status"], body["nextFollowUpDate"],
		body["assignedTo"], userID, body["createdByName"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Bank Recon ----

func (h *Handler) ListBankStatements(w http.ResponseWriter, r *http.Request) {
	q := `SELECT * FROM "bankStatement"`
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` WHERE "status" = '%s'`, status)
	}
	q += ` ORDER BY "createdAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateBankStatement(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "bankStatement" ("fileName","fileUrl","bankCode","createdBy")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, body["fileName"], body["fileUrl"], body["bankCode"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	stmt, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "bankStatement" WHERE id = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Bank Statement")
		return
	}
	entries, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT e.*, json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as matches
		FROM "bankEntry" e LEFT JOIN "bankMatch" m ON m."entryId" = e.id
		WHERE e."statementId" = $1
		GROUP BY e.id ORDER BY e."lineNumber"
	`, id)
	stmt["entries"] = entries
	response.OK(w, stmt)
}

func (h *Handler) DeleteBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `DELETE FROM "bankStatement" WHERE id = $1`, id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ParseBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()

	// Get statement
	stmt, err := db.QueryRow(ctx, h.pool, `SELECT * FROM "bankStatement" WHERE id = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Bank Statement")
		return
	}

	fileUrl, _ := stmt["fileUrl"].(string)
	bankCode, _ := stmt["bankCode"].(string)
	if bankCode == "" {
		bankCode = "KBANK"
	}

	// Download PDF
	httpResp, err := http.Get(fileUrl)
	if err != nil {
		response.Error(w, http.StatusBadGateway, "ไม่สามารถดาวน์โหลดไฟล์ PDF: "+err.Error())
		return
	}
	defer httpResp.Body.Close()
	pdfData, _ := io.ReadAll(httpResp.Body)

	// Use AI to parse the PDF text (send raw text to OpenRouter for extraction)
	pdfText := string(pdfData) // simplified — in production use pdf-parse lib
	if len(pdfText) > 50000 {
		pdfText = pdfText[:50000]
	}

	if h.ai == nil {
		response.Error(w, http.StatusServiceUnavailable, "AI ยังไม่ได้ตั้งค่า")
		return
	}

	// Use AI to extract bank statement entries
	aiResp, err := h.ai.Chat(external.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []external.Message{
			{Role: "system", Content: fmt.Sprintf(`คุณเป็นผู้เชี่ยวชาญในการอ่าน bank statement ของธนาคาร %s
ให้แยกรายการทุกรายการจาก statement แล้วตอบกลับเป็น JSON array:
[{"lineNumber":1,"txDate":"YYYY-MM-DD","txTime":"HH:MM","description":"...","amount":1234.56,"direction":"credit/debit","balance":5678.90}]
ถ้ามี metadata เช่น accountNumber, periodStart, periodEnd, openingBalance, closingBalance ให้ใส่ใน field "metadata" ด้วย
ตอบ JSON เท่านั้น ไม่ต้องอธิบาย`, bankCode)},
			{Role: "user", Content: "Parse this bank statement:\n" + pdfText},
		},
		Temperature: 0,
	})
	if err != nil {
		h.pool.Exec(ctx, `UPDATE "bankStatement" SET "status"='error',"parseError"=$2 WHERE id=$1`, id, err.Error())
		response.InternalError(w, err)
		return
	}

	if len(aiResp.Choices) == 0 {
		response.Error(w, http.StatusBadGateway, "AI ไม่สามารถ parse ได้")
		return
	}

	// Parse AI response
	content := aiResp.Choices[0].Message.Content
	var entries []map[string]any
	if err := json.Unmarshal([]byte(content), &entries); err != nil {
		// Try to extract JSON from markdown code block
		response.OK(w, map[string]any{"ok": true, "raw": content, "note": "AI response needs manual parsing"})
		return
	}

	// Delete existing entries
	h.pool.Exec(ctx, `DELETE FROM "bankEntry" WHERE "statementId" = $1`, id)

	// Insert entries
	entryCount := 0
	for _, entry := range entries {
		_, err := h.pool.Exec(ctx, `
			INSERT INTO "bankEntry" ("statementId","lineNumber","txDate","txTime","description","amount","direction","balance","matchStatus")
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'unmatched')
		`, id, entry["lineNumber"], entry["txDate"], entry["txTime"], entry["description"],
			entry["amount"], entry["direction"], entry["balance"])
		if err == nil {
			entryCount++
		}
	}

	// Update statement
	h.pool.Exec(ctx, `UPDATE "bankStatement" SET "status"='parsed',"entryCount"=$2 WHERE id=$1`, id, entryCount)

	response.OK(w, map[string]any{"ok": true, "entryCount": entryCount})
}

func (h *Handler) AutoMatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Auto-match using Supabase data instead of BC API
	entries, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bankEntry" WHERE "statementId" = $1 AND "matchStatus" = 'unmatched' AND "direction" = 'credit'
	`, id)

	// Get open invoices from synced data
	invoices, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcPostedSalesInvoice" WHERE "bcPostedSalesInvoiceRemainingAmount" > 0
	`)

	customers, _ := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "bcCustomer"`)

	matchCount := 0
	for _, entry := range entries {
		amount, _ := entry["amount"].(float64)
		for _, inv := range invoices {
			remaining, _ := inv["bcPostedSalesInvoiceRemainingAmount"].(float64)
			if amount == remaining {
				// Exact match
				h.pool.Exec(r.Context(), `
					INSERT INTO "bankMatch" ("entryId","invoiceNumber","customerNumber","customerName","invoiceAmount","remainingAmount","matchedAmount")
					VALUES ($1,$2,$3,$4,$5,$6,$7)
				`, entry["id"], inv["bcPostedSalesInvoiceNoValue"], inv["bcPostedSalesInvoiceSellToCustomerNo"],
					inv["bcPostedSalesInvoiceSellToCustomerName"], inv["bcPostedSalesInvoiceAmountIncludingVAT"],
					remaining, amount)
				h.pool.Exec(r.Context(), `UPDATE "bankEntry" SET "matchStatus"='matched',"matchConfidence"=1,"matchMethod"='exact_amount' WHERE id=$1`, entry["id"])
				matchCount++
				break
			}
		}
	}
	_ = customers // used for advanced matching in future

	response.OK(w, map[string]any{"ok": true, "matchCount": matchCount, "entries": len(entries)})
}

func (h *Handler) ManualMatch(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Action  string `json:"action"`
		EntryID string `json:"entryId"`
		Invoice string `json:"invoiceNumber"`
		Amount  float64 `json:"matchedAmount"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	userID := middleware.UserID(r.Context())

	switch body.Action {
	case "match":
		h.pool.Exec(r.Context(), `
			INSERT INTO "bankMatch" ("entryId","invoiceNumber","matchedAmount") VALUES ($1,$2,$3)
		`, body.EntryID, body.Invoice, body.Amount)
		h.pool.Exec(r.Context(), `
			UPDATE "bankEntry" SET "matchStatus"='matched',"matchMethod"='manual',"matchedBy"=$2,"matchedAt"=now() WHERE id=$1
		`, body.EntryID, userID)
	case "unmatch":
		h.pool.Exec(r.Context(), `DELETE FROM "bankMatch" WHERE "entryId"=$1`, body.EntryID)
		h.pool.Exec(r.Context(), `UPDATE "bankEntry" SET "matchStatus"='unmatched',"matchMethod"=null,"matchedBy"=null,"matchedAt"=null WHERE id=$1`, body.EntryID)
	case "exclude":
		h.pool.Exec(r.Context(), `UPDATE "bankEntry" SET "matchStatus"='excluded',"matchedBy"=$2,"matchedAt"=now() WHERE id=$1`, body.EntryID, userID)
	}
	response.OK(w, map[string]bool{"ok": true})
}

func (h *Handler) ExportBankRecon(w http.ResponseWriter, r *http.Request) {
	// XLSX export requires external lib — placeholder
	response.OK(w, map[string]string{"status": "export_not_implemented_yet"})
}

// ---- AI Endpoints (streaming via OpenRouter) ----

func (h *Handler) AIAnalysis(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Snapshot any `json:"snapshot"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	snapshotJSON, _ := json.Marshal(body.Snapshot)
	h.ai.StreamToSSE(w, external.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []external.Message{
			{Role: "system", Content: "คุณเป็นผู้เชี่ยวชาญด้านการเงิน วิเคราะห์ข้อมูลทางการเงินและให้คำแนะนำเป็นภาษาไทย ตอบในรูปแบบ markdown"},
			{Role: "user", Content: "วิเคราะห์สถานะทางการเงินจากข้อมูลนี้:\n" + string(snapshotJSON)},
		},
		Temperature: 0.3,
	})
}

func (h *Handler) AICashFlow(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Snapshot any `json:"snapshot"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	snapshotJSON, _ := json.Marshal(body.Snapshot)
	h.ai.StreamToSSE(w, external.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []external.Message{
			{Role: "system", Content: "คุณเป็นผู้เชี่ยวชาญด้านการบริหารกระแสเงินสด วิเคราะห์และพยากรณ์กระแสเงินสดเป็นภาษาไทย ตอบในรูปแบบ markdown"},
			{Role: "user", Content: "วิเคราะห์กระแสเงินสดจากข้อมูลนี้:\n" + string(snapshotJSON)},
		},
		Temperature: 0.3,
	})
}

func (h *Handler) AICollections(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Snapshot any `json:"snapshot"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	snapshotJSON, _ := json.Marshal(body.Snapshot)
	h.ai.StreamToSSE(w, external.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []external.Message{
			{Role: "system", Content: "คุณเป็นผู้เชี่ยวชาญด้านการติดตามหนี้ วิเคราะห์สถานะลูกหนี้และแนะนำกลยุทธ์การเก็บหนี้เป็นภาษาไทย ตอบในรูปแบบ markdown"},
			{Role: "user", Content: "วิเคราะห์สถานะการติดตามหนี้จากข้อมูลนี้:\n" + string(snapshotJSON)},
		},
		Temperature: 0.3,
	})
}
