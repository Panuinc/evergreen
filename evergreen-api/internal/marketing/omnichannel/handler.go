package omnichannel

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

var (
	lineClient     = clients.NewLINEClient()
	facebookClient = clients.NewFacebookClient()
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- Conversations ----

func (h *Handler) ListConversations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	channel := r.URL.Query().Get("channel")
	data, err := h.store.ListConversations(r.Context(), status, channel)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetConversation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetConversation(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบการสนทนา")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateConversation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateConversation(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.SoftDeleteConversation(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListMessages(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.ListMessages(r.Context(), id)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Send Message ----

func (h *Handler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ConversationID string `json:"conversationId"`
		Content        string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if body.ConversationID == "" || body.Content == "" || len(body.Content) > 5000 {
		response.BadRequest(w, "กรุณาระบุ conversationId และ content (ไม่เกิน 5000 ตัวอักษร)")
		return
	}

	conv, err := h.store.GetConversationByID(r.Context(), body.ConversationID)
	if err != nil {
		response.NotFound(w, "ไม่พบการสนทนา")
		return
	}
	contactID, _ := conv["mktConversationContactId"].(string)
	contact, _ := h.store.GetContactByID(r.Context(), contactID)
	channelType, _ := conv["mktConversationChannelType"].(string)

	channel, _ := h.store.GetActiveChannel(r.Context(), channelType)

	if contact != nil && channel != nil {
		externalID, _ := contact["mktContactExternalRef"].(string)
		accessToken, _ := channel["mktChannelAccessToken"].(string)

		switch channelType {
		case "line":
			lineClient.SendPushMessage(accessToken, externalID, body.Content)
		case "facebook":
			facebookClient.SendMessage(accessToken, externalID, body.Content)
		}
	}

	data, err := h.store.InsertAgentMessage(r.Context(), body.ConversationID, body.Content, "text")
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	h.store.UpdateConversationAfterSend(r.Context(), body.ConversationID, truncate(body.Content, 100))

	response.Created(w, data)
}

func (h *Handler) LogNote(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ConversationID string `json:"conversationId"`
		Content        string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.InsertAgentMessage(r.Context(), body.ConversationID, body.Content, "note")
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Quotations ----

func (h *Handler) ListQuotations(w http.ResponseWriter, r *http.Request) {
	convId := r.URL.Query().Get("conversationId")
	status := r.URL.Query().Get("status")
	data, err := h.store.ListQuotations(r.Context(), convId, status)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	q, err := h.store.GetQuotation(r.Context(), id)
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
	response.OK(w, data)
}

func (h *Handler) QuotationAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := middleware.UserID(r.Context())
	var body struct {
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	switch body.Action {
	case "submit":
		h.store.SubmitQuotation(r.Context(), id, userID)
	case "approve":
		h.store.ApproveQuotation(r.Context(), id, userID)
	case "reject":
		h.store.RejectQuotation(r.Context(), id, body.Note)
	case "confirm_payment":
		h.store.ConfirmPaymentQuotation(r.Context(), id)
	default:
		response.BadRequest(w, "action ไม่ถูกต้อง")
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.CancelQuotation(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) CreateFromChat(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement AI extraction from chat messages
	response.OK(w, map[string]string{"status": "not_implemented_yet"})
}

// ---- Promotions ----

func (h *Handler) ListPromotions(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListPromotions(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreatePromotion(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreatePromotion(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdatePromotion(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdatePromotion(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeletePromotion(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeletePromotion(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Related Products ----

func (h *Handler) ListRelatedProducts(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListRelatedProducts(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateRelatedProduct(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateRelatedProduct(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) DeleteRelatedProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteRelatedProduct(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Stock Items & Price Items ----

func (h *Handler) ListStockItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.store.ListStockItems(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	prices, _ := h.store.ListPriceItems(r.Context())
	response.OK(w, map[string]any{"items": items, "prices": prices})
}

func (h *Handler) UpsertPriceItems(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body []map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	for _, item := range body {
		h.store.UpsertPriceItem(r.Context(), item, userID)
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListProductInfo(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListProductInfo(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpsertProductInfo(w http.ResponseWriter, r *http.Request) {
	var body []map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	for _, item := range body {
		h.store.UpsertProductInfo(r.Context(), item)
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Follow-ups ----

func (h *Handler) ListFollowUps(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	convId := r.URL.Query().Get("conversationId")
	data, err := h.store.ListFollowUps(r.Context(), status, convId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateFollowUp(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateFollowUp(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateFollowUp(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateFollowUp(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteFollowUp(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.CancelFollowUp(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ProcessFollowUps(w http.ResponseWriter, r *http.Request) {
	followUps, err := h.store.ListPendingFollowUps(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	processed := 0
	for _, fu := range followUps {
		// TODO: Send via LINE/Facebook API
		if fuID, ok := fu["mktFollowUpId"].(string); ok {
			h.store.MarkFollowUpSent(r.Context(), fuID)
			processed++
		}
	}
	response.OK(w, map[string]int{"processed": processed})
}

// ---- AI ----

func (h *Handler) AISuggest(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "ai_not_implemented_yet"})
}

func (h *Handler) AIReply(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "ai_not_implemented_yet"})
}

func (h *Handler) GetAISettings(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.GetAISettings(r.Context())
	if err != nil {
		response.OK(w, map[string]any{})
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateAISettings(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.UpdateAISettings(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func truncate(s string, max int) string {
	r := []rune(s)
	if len(r) > max {
		return string(r[:max]) + "..."
	}
	return s
}
