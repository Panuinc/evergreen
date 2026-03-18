package omnichannel

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/external"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

var (
	lineClient     = external.NewLINEClient()
	facebookClient = external.NewFacebookClient()
)

type Handler struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/conversations", func(r chi.Router) {
		r.Get("/", h.ListConversations)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetConversation)
			r.Put("/", h.UpdateConversation)
			r.Delete("/", h.DeleteConversation)
			r.Get("/messages", h.ListMessages)
		})
	})

	r.Post("/send", h.SendMessage)
	r.Post("/logNote", h.LogNote)

	r.Route("/quotations", func(r chi.Router) {
		r.Get("/", h.ListQuotations)
		r.Post("/createFromChat", h.CreateFromChat)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetQuotation)
			r.Put("/", h.UpdateQuotation)
			r.Patch("/", h.QuotationAction)
			r.Delete("/", h.DeleteQuotation)
		})
	})

	r.Route("/promotions", func(r chi.Router) {
		r.Get("/", h.ListPromotions)
		r.Post("/", h.CreatePromotion)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdatePromotion)
			r.Delete("/", h.DeletePromotion)
		})
	})

	r.Route("/relatedProducts", func(r chi.Router) {
		r.Get("/", h.ListRelatedProducts)
		r.Post("/", h.CreateRelatedProduct)
		r.Delete("/{id}", h.DeleteRelatedProduct)
	})

	r.Get("/stockItems", h.ListStockItems)
	r.Post("/stockItems", h.UpsertPriceItems)
	r.Get("/productInfo", h.ListProductInfo)
	r.Post("/productInfo", h.UpsertProductInfo)

	r.Route("/followUp", func(r chi.Router) {
		r.Get("/", h.ListFollowUps)
		r.Post("/", h.CreateFollowUp)
		r.Post("/process", h.ProcessFollowUps)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateFollowUp)
			r.Delete("/", h.DeleteFollowUp)
		})
	})

	r.Route("/ai", func(r chi.Router) {
		r.Post("/suggest", h.AISuggest)
		r.Post("/reply", h.AIReply)
		r.Get("/settings", h.GetAISettings)
		r.Put("/settings", h.UpdateAISettings)
	})

	return r
}

// ---- Conversations ----

func (h *Handler) ListConversations(w http.ResponseWriter, r *http.Request) {
	q := `SELECT c.*, row_to_json(ct.*) as "omContact"
		FROM "omConversation" c
		LEFT JOIN "omContact" ct ON ct."omContactId" = c."omConversationContactId"
		WHERE c."isActive" = true`
	args := []any{}
	argIdx := 1
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` AND c."omConversationStatus" = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if channel := r.URL.Query().Get("channel"); channel != "" {
		q += fmt.Sprintf(` AND c."omConversationChannelType" = $%d`, argIdx)
		args = append(args, channel)
	}
	q += ` ORDER BY c."omConversationLastMessageAt" DESC NULLS LAST`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetConversation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `
		SELECT c.*, row_to_json(ct.*) as "omContact"
		FROM "omConversation" c LEFT JOIN "omContact" ct ON ct."omContactId"=c."omConversationContactId"
		WHERE c."omConversationId"=$1`, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "omConversation" SET
			"omConversationStatus"=COALESCE($2,"omConversationStatus"),
			"omConversationAssignedTo"=COALESCE($3,"omConversationAssignedTo"),
			"omConversationUnreadCount"=COALESCE($4,"omConversationUnreadCount"),
			"omConversationAiAutoReply"=COALESCE($5,"omConversationAiAutoReply")
		WHERE "omConversationId"=$1 RETURNING *
	`, id, body["omConversationStatus"], body["omConversationAssignedTo"],
		body["omConversationUnreadCount"], body["omConversationAiAutoReply"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "omConversation" SET "isActive"=false WHERE "omConversationId"=$1`, id)
	h.pool.Exec(r.Context(), `UPDATE "omMessage" SET "isActive"=false WHERE "omMessageConversationId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListMessages(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "omMessage" WHERE "omMessageConversationId"=$1 AND "isActive"=true
		ORDER BY "omMessageCreatedAt" ASC
	`, id)
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

	// Get conversation + contact + channel
	conv, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "omConversation" WHERE "omConversationId"=$1`, body.ConversationID)
	if err != nil {
		response.NotFound(w, "ไม่พบการสนทนา")
		return
	}
	contactID, _ := conv["omConversationContactId"].(string)
	contact, _ := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "omContact" WHERE "omContactId"=$1`, contactID)
	channelType, _ := conv["omConversationChannelType"].(string)

	// Get channel access token
	channel, _ := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "omChannel" WHERE "omChannelType"=$1 AND "omChannelStatus"='active' LIMIT 1`, channelType)

	// Send to external platform
	if contact != nil && channel != nil {
		externalID, _ := contact["omContactExternalId"].(string)
		accessToken, _ := channel["omChannelAccessToken"].(string)

		switch channelType {
		case "line":
			lineClient.SendPushMessage(accessToken, externalID, body.Content)
		case "facebook":
			facebookClient.SendMessage(accessToken, externalID, body.Content)
		}
	}

	// Save message
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "omMessage" ("omMessageConversationId","omMessageSenderType","omMessageContent","omMessageType")
		VALUES ($1,'agent',$2,'text') RETURNING *
	`, body.ConversationID, body.Content)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update conversation
	h.pool.Exec(r.Context(), `
		UPDATE "omConversation" SET "omConversationLastMessageAt"=now(),"omConversationLastMessagePreview"=$2,"omConversationUnreadCount"=0
		WHERE "omConversationId"=$1
	`, body.ConversationID, truncate(body.Content, 100))

	response.Created(w, data)
}

func (h *Handler) LogNote(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ConversationID string `json:"conversationId"`
		Content        string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "omMessage" ("omMessageConversationId","omMessageSenderType","omMessageContent","omMessageType")
		VALUES ($1,'agent',$2,'note') RETURNING *
	`, body.ConversationID, body.Content)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Quotations ----

func (h *Handler) ListQuotations(w http.ResponseWriter, r *http.Request) {
	q := `SELECT q.*, row_to_json(ct.*) as "omContact"
		FROM "omQuotation" q LEFT JOIN "omContact" ct ON ct."omContactId"=q."omQuotationContactId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if convId := r.URL.Query().Get("conversationId"); convId != "" {
		q += fmt.Sprintf(` AND q."omQuotationConversationId"=$%d`, argIdx)
		args = append(args, convId)
		argIdx++
	}
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` AND q."omQuotationStatus"=$%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY q."omQuotationCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	q, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "omQuotation" WHERE "omQuotationId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบใบเสนอราคา")
		return
	}
	lines, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "omQuotationLine" WHERE "omQuotationLineQuotationId"=$1 ORDER BY "omQuotationLineOrder"
	`, id)
	q["lines"] = lines
	response.OK(w, q)
}

func (h *Handler) UpdateQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "omQuotation" SET
			"omQuotationCustomerName"=COALESCE($2,"omQuotationCustomerName"),
			"omQuotationCustomerPhone"=COALESCE($3,"omQuotationCustomerPhone"),
			"omQuotationCustomerAddress"=COALESCE($4,"omQuotationCustomerAddress"),
			"omQuotationPaymentMethod"=COALESCE($5,"omQuotationPaymentMethod"),
			"omQuotationNotes"=COALESCE($6,"omQuotationNotes"),
			"omQuotationUpdatedAt"=now()
		WHERE "omQuotationId"=$1 RETURNING *
	`, id, body["omQuotationCustomerName"], body["omQuotationCustomerPhone"],
		body["omQuotationCustomerAddress"], body["omQuotationPaymentMethod"], body["omQuotationNotes"])
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
		h.pool.Exec(r.Context(), `UPDATE "omQuotation" SET "omQuotationStatus"='pending_approval',"omQuotationSubmittedBy"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, userID)
	case "approve":
		h.pool.Exec(r.Context(), `UPDATE "omQuotation" SET "omQuotationStatus"='approved',"omQuotationApprovedBy"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, userID)
	case "reject":
		h.pool.Exec(r.Context(), `UPDATE "omQuotation" SET "omQuotationStatus"='rejected',"omQuotationApprovalNote"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, body.Note)
	case "confirm_payment":
		h.pool.Exec(r.Context(), `UPDATE "omQuotation" SET "omQuotationStatus"='paid',"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id)
	default:
		response.BadRequest(w, "action ไม่ถูกต้อง")
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "omQuotation" SET "omQuotationStatus"='cancelled',"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) CreateFromChat(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement AI extraction from chat messages
	response.OK(w, map[string]string{"status": "not_implemented_yet"})
}

// ---- Promotions ----

func (h *Handler) ListPromotions(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "omPromotion" ORDER BY "omPromotionCreatedAt" DESC`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreatePromotion(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "omPromotion" ("omPromotionName","omPromotionDescription","omPromotionType","omPromotionValue",
			"omPromotionMinQuantity","omPromotionApplicableProducts","omPromotionStartDate","omPromotionEndDate","omPromotionIsActive")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
	`, body["omPromotionName"], body["omPromotionDescription"], body["omPromotionType"], body["omPromotionValue"],
		body["omPromotionMinQuantity"], body["omPromotionApplicableProducts"], body["omPromotionStartDate"],
		body["omPromotionEndDate"], body["omPromotionIsActive"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "omPromotion" SET
			"omPromotionName"=COALESCE($2,"omPromotionName"),"omPromotionDescription"=COALESCE($3,"omPromotionDescription"),
			"omPromotionType"=COALESCE($4,"omPromotionType"),"omPromotionValue"=COALESCE($5,"omPromotionValue"),
			"omPromotionIsActive"=COALESCE($6,"omPromotionIsActive"),"omPromotionUpdatedAt"=now()
		WHERE "omPromotionId"=$1 RETURNING *
	`, id, body["omPromotionName"], body["omPromotionDescription"], body["omPromotionType"],
		body["omPromotionValue"], body["omPromotionIsActive"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeletePromotion(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `DELETE FROM "omPromotion" WHERE "omPromotionId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Related Products ----

func (h *Handler) ListRelatedProducts(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "omRelatedProduct" ORDER BY "omRelatedProductCreatedAt" DESC`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateRelatedProduct(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "omRelatedProduct" ("omRelatedProductSourceItem","omRelatedProductTargetItem","omRelatedProductType","omRelatedProductReason")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, body["omRelatedProductSourceItem"], body["omRelatedProductTargetItem"], body["omRelatedProductType"], body["omRelatedProductReason"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) DeleteRelatedProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `DELETE FROM "omRelatedProduct" WHERE "omRelatedProductId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Stock Items & Price Items ----

func (h *Handler) ListStockItems(w http.ResponseWriter, r *http.Request) {
	items, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItem" WHERE "bcItemNo" LIKE 'FG-%' AND "bcItemBlocked" != 'true' ORDER BY "bcItemNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	prices, _ := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "omPriceItem"`)
	response.OK(w, map[string]any{"items": items, "prices": prices})
}

func (h *Handler) UpsertPriceItems(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body []map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	for _, item := range body {
		h.pool.Exec(r.Context(), `
			INSERT INTO "omPriceItem" ("omPriceItemNumber","omPriceItemName","omPriceItemUnitPrice","omPriceItemUpdatedBy")
			VALUES ($1,$2,$3,$4)
			ON CONFLICT ("omPriceItemNumber") DO UPDATE SET "omPriceItemName"=$2,"omPriceItemUnitPrice"=$3,"omPriceItemUpdatedBy"=$4,"omPriceItemUpdatedAt"=now()
		`, item["omPriceItemNumber"], item["omPriceItemName"], item["omPriceItemUnitPrice"], userID)
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListProductInfo(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "omProductInfo" ORDER BY "omProductInfoItemNumber"`)
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
		h.pool.Exec(r.Context(), `
			INSERT INTO "omProductInfo" ("omProductInfoItemNumber","omProductInfoDescription","omProductInfoHighlights","omProductInfoCategory","omProductInfoImageUrl")
			VALUES ($1,$2,$3,$4,$5)
			ON CONFLICT ("omProductInfoItemNumber") DO UPDATE SET "omProductInfoDescription"=$2,"omProductInfoHighlights"=$3,"omProductInfoCategory"=$4,"omProductInfoImageUrl"=$5,"omProductInfoUpdatedAt"=now()
		`, item["itemNumber"], item["description"], item["highlights"], item["category"], item["imageUrl"])
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Follow-ups ----

func (h *Handler) ListFollowUps(w http.ResponseWriter, r *http.Request) {
	q := `SELECT * FROM "omFollowUp" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` AND "omFollowUpStatus"=$%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if convId := r.URL.Query().Get("conversationId"); convId != "" {
		q += fmt.Sprintf(` AND "omFollowUpConversationId"=$%d`, argIdx)
		args = append(args, convId)
	}
	q += ` ORDER BY "omFollowUpCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateFollowUp(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "omFollowUp" ("omFollowUpConversationId","omFollowUpScheduledAt","omFollowUpMessage")
		VALUES ($1,$2,$3) RETURNING *
	`, body["omFollowUpConversationId"], body["omFollowUpScheduledAt"], body["omFollowUpMessage"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "omFollowUp" SET
			"omFollowUpStatus"=COALESCE($2,"omFollowUpStatus"),
			"omFollowUpScheduledAt"=COALESCE($3,"omFollowUpScheduledAt"),
			"omFollowUpMessage"=COALESCE($4,"omFollowUpMessage")
		WHERE "omFollowUpId"=$1 RETURNING *
	`, id, body["omFollowUpStatus"], body["omFollowUpScheduledAt"], body["omFollowUpMessage"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteFollowUp(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "omFollowUp" SET "omFollowUpStatus"='cancelled' WHERE "omFollowUpId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ProcessFollowUps(w http.ResponseWriter, r *http.Request) {
	// Process pending follow-ups
	followUps, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "omFollowUp" WHERE "omFollowUpStatus"='pending' AND "omFollowUpScheduledAt" <= now() LIMIT 20
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	processed := 0
	for _, fu := range followUps {
		// TODO: Send via LINE/Facebook API
		if fuID, ok := fu["omFollowUpId"].(string); ok {
			h.pool.Exec(r.Context(), `UPDATE "omFollowUp" SET "omFollowUpStatus"='sent',"omFollowUpSentAt"=now() WHERE "omFollowUpId"=$1`, fuID)
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
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "omAiSetting" LIMIT 1`)
	if err != nil {
		response.OK(w, map[string]any{})
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateAISettings(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "omAiSetting" SET
			"omAiSettingSystemPrompt"=COALESCE($1,"omAiSettingSystemPrompt"),
			"omAiSettingModel"=COALESCE($2,"omAiSettingModel"),
			"omAiSettingTemperature"=COALESCE($3,"omAiSettingTemperature"),
			"omAiSettingMaxHistoryMessages"=COALESCE($4,"omAiSettingMaxHistoryMessages"),
			"omAiSettingBankAccountInfo"=COALESCE($5,"omAiSettingBankAccountInfo"),
			"omAiSettingUpdatedAt"=now()
		WHERE true RETURNING *
	`, body["omAiSettingSystemPrompt"], body["omAiSettingModel"], body["omAiSettingTemperature"],
		body["omAiSettingMaxHistoryMessages"], body["omAiSettingBankAccountInfo"])
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
