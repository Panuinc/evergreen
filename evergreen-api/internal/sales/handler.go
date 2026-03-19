package sales

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	leads, _ := h.store.DashboardLeads(ctx)
	opps, _ := h.store.DashboardOpportunities(ctx)
	orders, _ := h.store.DashboardOrders(ctx)
	activities, _ := h.store.DashboardActivities(ctx)
	stages, _ := h.store.DashboardStages(ctx)

	response.OK(w, map[string]any{
		"totalLeads":         len(leads),
		"totalOpportunities": len(opps),
		"totalOrders":        len(orders),
		"recentActivities":   activities,
		"pipelineStages":     stages,
	})
}

// ---- Leads ----

func (h *Handler) ListLeads(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListLeads(r.Context(), sa, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateLead(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateLead(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetLead(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Lead")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateLead(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) ConvertLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	lead, err := h.store.GetLead(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Lead")
		return
	}
	contact, _ := h.store.InsertLeadContact(r.Context(), lead["crmLeadName"], lead["crmLeadEmail"], lead["crmLeadPhone"], lead["crmLeadPosition"])
	opp, _ := h.store.InsertLeadOpportunity(r.Context(), lead["crmLeadCompany"], contact["crmContactId"], lead["crmLeadSource"])
	h.store.MarkLeadConverted(r.Context(), id, contact["crmContactId"], opp["crmOpportunityId"])
	response.OK(w, map[string]any{"contact": contact, "opportunity": opp})
}

func (h *Handler) DeleteLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteLead(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Contacts ----

func (h *Handler) ListContacts(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListContacts(r.Context(), sa, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateContact(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateContact(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetContact(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Contact")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateContact(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteContact(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Accounts ----

func (h *Handler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListAccounts(r.Context(), sa, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateAccount(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetAccount(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Account")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateAccount(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteAccount(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Opportunities ----

func (h *Handler) ListOpportunities(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	stage := r.URL.Query().Get("stage")
	data, err := h.store.ListOpportunities(r.Context(), sa, stage)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateOpportunity(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateOpportunity(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetOpportunity(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Opportunity")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateOpportunity(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteOpportunity(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Quotations ----

func (h *Handler) ListQuotations(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	status := r.URL.Query().Get("status")
	data, err := h.store.ListQuotations(r.Context(), sa, status)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateQuotation(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateQuotation(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	q, err := h.store.GetQuotationByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบใบเสนอราคา")
		return
	}
	lines, _ := h.store.GetQuotationLines(r.Context(), id)
	q["lines"] = lines
	response.OK(w, q)
}

func (h *Handler) UpdateQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)

	data, err := h.store.UpdateQuotation(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	if lines, ok := body["lines"].([]any); ok {
		h.store.DeactivateQuotationLines(r.Context(), id)
		for i, l := range lines {
			lm, _ := l.(map[string]any)
			if lm == nil {
				continue
			}
			h.store.InsertQuotationLine(r.Context(), id, i, lm)
		}
	}
	response.OK(w, data)
}

func (h *Handler) QuotationAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	userID := middleware.UserID(r.Context())

	switch body.Action {
	case "submit":
		h.store.SubmitQuotation(r.Context(), id)
	case "approve":
		h.store.ApproveQuotation(r.Context(), id, userID)
	case "reject":
		h.store.RejectQuotation(r.Context(), id, body.Note)
	case "convert_order":
		q, _ := h.store.GetQuotationByID(r.Context(), id)
		if q != nil {
			h.store.CreateOrderFromQuotation(r.Context(), id, userID, q)
			h.store.ConvertQuotation(r.Context(), id)
		}
	default:
		response.BadRequest(w, "action ไม่ถูกต้อง")
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteQuotation(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Orders ----

func (h *Handler) ListOrders(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	status := r.URL.Query().Get("status")
	data, err := h.store.ListOrders(r.Context(), sa, status)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateOrder(r.Context(), body, middleware.UserID(r.Context()))
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetOrder(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Order")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateOrder(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteOrder(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Activities ----

func (h *Handler) ListActivities(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	actType := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")
	data, err := h.store.ListActivities(r.Context(), sa, actType, status)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ManageActivity(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)

	if deleteID, ok := body["deleteId"].(string); ok && deleteID != "" {
		h.store.DeleteActivity(r.Context(), deleteID)
		response.OK(w, map[string]bool{"success": true})
		return
	}

	if actID, ok := body["crmActivityId"].(string); ok && actID != "" {
		data, err := h.store.UpdateActivity(r.Context(), actID, body)
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.OK(w, data)
		return
	}

	data, err := h.store.CreateActivity(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) Reports(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "coming_soon"})
}
