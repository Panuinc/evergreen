package finance

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
	ai    *clients.OpenRouterClient
	cfg   *config.Config
}

func New(pool *pgxpool.Pool, cfg *config.Config, ai *clients.OpenRouterClient) *Handler {
	return &Handler{store: NewStore(pool), ai: ai, cfg: cfg}
}

// ---- Sales Invoices (from Supabase instead of BC API) ----

func (h *Handler) SalesInvoices(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "Open"
	}

	data, err := h.store.ListSalesInvoices(r.Context(), status)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Purchase Invoices (from Supabase) ----

func (h *Handler) PurchaseInvoices(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListPurchaseInvoices(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Aged Receivables (calculated from bcCustomerLedgerEntry) ----

func (h *Handler) AgedReceivables(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.AgedReceivables(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Aged Payables (calculated from bcVendorLedgerEntry) ----

func (h *Handler) AgedPayables(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.AgedPayables(r.Context())
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

	data, err := h.store.ListGLEntries(r.Context(), start, end)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Trial Balance (from bcGLAccount) ----

func (h *Handler) TrialBalance(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.TrialBalance(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Collections (arFollowUp) ----

func (h *Handler) ListCollections(w http.ResponseWriter, r *http.Request) {
	cust := r.URL.Query().Get("customerNumber")
	status := r.URL.Query().Get("status")
	since := r.URL.Query().Get("since")
	until := r.URL.Query().Get("until")

	data, err := h.store.ListCollections(r.Context(), cust, status, since, until)
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
	data, err := h.store.CreateCollection(r.Context(), body, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Bank Recon ----

func (h *Handler) ListBankStatements(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	data, err := h.store.ListBankStatements(r.Context(), status)
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
	data, err := h.store.CreateBankStatement(r.Context(), body, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	stmt, entries, err := h.store.GetBankStatementWithEntries(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Bank Statement")
		return
	}
	stmt["entries"] = entries
	response.OK(w, stmt)
}

func (h *Handler) DeleteBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteBankStatement(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ParseBankStatement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()

	// Get statement
	stmt, err := h.store.GetBankStatementByID(ctx, id)
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
	aiResp, err := h.ai.Chat(clients.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []clients.Message{
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
		h.store.UpdateBankStatementError(ctx, id, err.Error())
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
	h.store.DeleteBankEntries(ctx, id)

	// Insert entries
	entryCount := 0
	for _, entry := range entries {
		if err := h.store.InsertBankEntry(ctx, id, entry); err == nil {
			entryCount++
		}
	}

	// Update statement
	h.store.UpdateBankStatementParsed(ctx, id, entryCount)

	response.OK(w, map[string]any{"ok": true, "entryCount": entryCount})
}

func (h *Handler) AutoMatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Auto-match using Supabase data instead of BC API
	entries, _ := h.store.GetUnmatchedCreditEntries(r.Context(), id)

	// Get open invoices from synced data
	invoices, _ := h.store.GetOpenSalesInvoices(r.Context())

	customers, _ := h.store.GetAllCustomers(r.Context())

	matchCount := 0
	for _, entry := range entries {
		amount, _ := entry["amount"].(float64)
		for _, inv := range invoices {
			remaining, _ := inv["bcPostedSalesInvoiceRemainingAmount"].(float64)
			if amount == remaining {
				// Exact match
				h.store.InsertBankMatch(r.Context(),
					entry["id"], inv["bcPostedSalesInvoiceNoValue"], inv["bcPostedSalesInvoiceSellToCustomerNo"],
					inv["bcPostedSalesInvoiceSellToCustomerName"], inv["bcPostedSalesInvoiceAmountIncludingVAT"],
					remaining, amount)
				entryID, _ := entry["id"].(string)
				h.store.UpdateBankEntryMatched(r.Context(), entryID, 1, "exact_amount")
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
		Action  string  `json:"action"`
		EntryID string  `json:"entryId"`
		Invoice string  `json:"invoiceNumber"`
		Amount  float64 `json:"matchedAmount"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	userID := middleware.UserID(r.Context())

	switch body.Action {
	case "match":
		h.store.ManualMatchEntry(r.Context(), body.EntryID, body.Invoice, body.Amount)
		h.store.SetBankEntryMatchedManual(r.Context(), body.EntryID, userID)
	case "unmatch":
		h.store.UnmatchEntry(r.Context(), body.EntryID)
	case "exclude":
		h.store.ExcludeEntry(r.Context(), body.EntryID, userID)
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
	h.ai.StreamToSSE(w, clients.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []clients.Message{
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
	h.ai.StreamToSSE(w, clients.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []clients.Message{
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
	h.ai.StreamToSSE(w, clients.ChatRequest{
		Model: "google/gemini-2.5-flash-lite",
		Messages: []clients.Message{
			{Role: "system", Content: "คุณเป็นผู้เชี่ยวชาญด้านการติดตามหนี้ วิเคราะห์สถานะลูกหนี้และแนะนำกลยุทธ์การเก็บหนี้เป็นภาษาไทย ตอบในรูปแบบ markdown"},
			{Role: "user", Content: "วิเคราะห์สถานะการติดตามหนี้จากข้อมูลนี้:\n" + string(snapshotJSON)},
		},
		Temperature: 0.3,
	})
}
