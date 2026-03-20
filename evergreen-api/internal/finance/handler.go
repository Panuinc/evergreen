package finance

import (
	"encoding/json"
	"net/http"

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
	summarize := r.URL.Query().Get("summarize")

	if summarize == "monthly" && start != "" && end != "" {
		data, err := h.store.GLEntriesMonthly(r.Context(), start, end)
		if err != nil {
			response.InternalError(w, err)
			return
		}
		response.OK(w, data)
		return
	}

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
