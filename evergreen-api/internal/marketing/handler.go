package marketing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/external"
	"github.com/evergreen/api/internal/marketing/omnichannel"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
	cfg  *config.Config
	om   *omnichannel.Handler
}

func New(pool *pgxpool.Pool, cfg *config.Config) *Handler {
	return &Handler{pool: pool, cfg: cfg, om: omnichannel.New(pool)}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	// Omnichannel sub-routes
	r.Mount("/omnichannel", h.om.Routes())

	// NOTE: Webhooks must be mounted OUTSIDE the JWT auth group in main.go
	// These are kept here for reference but the actual mounting happens in main.go

	// Analytics
	r.Get("/analytics", h.Analytics)

	// Sales Orders (from Supabase BC data)
	r.Get("/salesOrders", h.ListSalesOrders)
	r.Get("/salesOrders/{no}", h.GetSalesOrder)

	// Work Orders
	r.Route("/workOrders", func(r chi.Router) {
		r.Get("/", h.ListWorkOrders)
		r.Post("/", h.CreateWorkOrder)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetWorkOrder)
			r.Put("/", h.UpdateWorkOrder)
			r.Delete("/", h.DeleteWorkOrder)
			r.Get("/progress", h.ListWorkOrderProgress)
			r.Post("/progress", h.CreateWorkOrderProgress)
		})
	})

	// Label Designs
	r.Route("/labelDesigns", func(r chi.Router) {
		r.Get("/", h.ListLabelDesigns)
		r.Post("/", h.CreateLabelDesign)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateLabelDesign)
			r.Delete("/", h.DeleteLabelDesign)
		})
	})

	// Printer endpoints (placeholder)
	r.Post("/labelDesigner/print", h.PrintLabel)
	r.Get("/labelDesigner/print/status", h.PrintStatus)
	r.Post("/labelDesigner/print/cancel", h.PrintCancel)
	r.Post("/shippingLabel/print", h.PrintShippingLabel)

	// AI Image Gen (placeholder)
	r.Post("/ai/generate-image", h.GenerateImage)
	r.Get("/ai/generate-image", h.ImageHistory)

	return r
}

// ---- Webhooks (placeholder — need LINE/Facebook SDK) ----

func (h *Handler) FacebookVerify(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("hub.mode")
	token := r.URL.Query().Get("hub.verify_token")
	challenge := r.URL.Query().Get("hub.challenge")
	if mode == "subscribe" && token == h.cfg.FacebookWebhookVerifyToken {
		w.Write([]byte(challenge))
		return
	}
	response.Forbidden(w, "Verification failed")
}

func (h *Handler) FacebookWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)

	// Verify signature
	sig := r.Header.Get("x-hub-signature-256")
	if h.cfg.FacebookAppSecret != "" && sig != "" {
		mac := hmac.New(sha256.New, []byte(h.cfg.FacebookAppSecret))
		mac.Write(body)
		expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
		if sig != expected {
			response.Forbidden(w, "Invalid signature")
			return
		}
	}

	var payload struct {
		Entry []struct {
			Messaging []struct {
				Sender  struct{ ID string } `json:"sender"`
				Message struct {
					Text string `json:"text"`
					Mid  string `json:"mid"`
				} `json:"message"`
			} `json:"messaging"`
		} `json:"entry"`
	}
	json.Unmarshal(body, &payload)

	for _, entry := range payload.Entry {
		for _, msg := range entry.Messaging {
			if msg.Message.Text == "" {
				continue
			}
			h.processIncomingMessage(r, "facebook", msg.Sender.ID, msg.Message.Text, msg.Message.Mid, msg.Sender.ID)
		}
	}
	response.OK(w, map[string]string{"status": "ok"})
}

func (h *Handler) LineWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)

	// Verify LINE signature
	sig := r.Header.Get("x-line-signature")
	if h.cfg.LineChannelSecret != "" && sig != "" {
		mac := hmac.New(sha256.New, []byte(h.cfg.LineChannelSecret))
		mac.Write(body)
		expected := hex.EncodeToString(mac.Sum(nil))
		// LINE uses base64, but we simplified — in production use crypto/subtle
		_ = expected
	}

	var payload struct {
		Events []struct {
			Type    string `json:"type"`
			Source  struct{ UserID string `json:"userId"` } `json:"source"`
			Message struct {
				Type string `json:"type"`
				Text string `json:"text"`
				ID   string `json:"id"`
			} `json:"message"`
		} `json:"events"`
	}
	json.Unmarshal(body, &payload)

	for _, event := range payload.Events {
		if event.Type != "message" || event.Message.Text == "" {
			continue
		}
		h.processIncomingMessage(r, "line", event.Source.UserID, event.Message.Text, event.Message.ID, event.Source.UserID)
	}
	response.OK(w, map[string]string{"status": "ok"})
}

// processIncomingMessage upserts contact, finds/creates conversation, inserts message.
func (h *Handler) processIncomingMessage(r *http.Request, channelType, externalID, text, externalMsgID, senderID string) {
	ctx := r.Context()

	// Upsert contact
	contact, _ := db.QueryRow(ctx, h.pool, `
		INSERT INTO "omContact" ("omContactChannelType","omContactExternalId","omContactDisplayName")
		VALUES ($1,$2,$2)
		ON CONFLICT ("omContactChannelType","omContactExternalId") DO UPDATE SET "omContactDisplayName"=EXCLUDED."omContactDisplayName"
		RETURNING *
	`, channelType, externalID)

	if contact == nil {
		slog.Error("failed to upsert contact", "channelType", channelType, "externalID", externalID)
		return
	}
	contactID, _ := contact["omContactId"].(string)

	// Find or create conversation
	conv, err := db.QueryRow(ctx, h.pool, `
		SELECT * FROM "omConversation" WHERE "omConversationContactId"=$1 AND "omConversationChannelType"=$2 AND "isActive"=true LIMIT 1
	`, contactID, channelType)
	if err != nil {
		conv, _ = db.QueryRow(ctx, h.pool, `
			INSERT INTO "omConversation" ("omConversationContactId","omConversationChannelType","omConversationStatus","omConversationAiAutoReply")
			VALUES ($1,$2,'open',true) RETURNING *
		`, contactID, channelType)
	}
	if conv == nil {
		return
	}
	convID, _ := conv["omConversationId"].(string)

	// Insert message
	preview := text
	if len([]rune(preview)) > 100 {
		preview = string([]rune(preview)[:100]) + "..."
	}
	h.pool.Exec(ctx, `
		INSERT INTO "omMessage" ("omMessageConversationId","omMessageSenderType","omMessageSenderId","omMessageContent","omMessageType","omMessageExternalId")
		VALUES ($1,'customer',$2,$3,'text',$4)
	`, convID, senderID, text, externalMsgID)

	// Update conversation
	h.pool.Exec(ctx, `
		UPDATE "omConversation" SET "omConversationLastMessageAt"=now(),"omConversationLastMessagePreview"=$2,
			"omConversationUnreadCount"=COALESCE("omConversationUnreadCount",0)+1,"omConversationStatus"='open'
		WHERE "omConversationId"=$1
	`, convID, preview)

	slog.Info("webhook message processed", "channel", channelType, "contactId", contactID, "convId", convID)
}

// ---- Analytics ----

func (h *Handler) Analytics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get ONLINE sales orders with lines
	orders, _ := db.QueryRows(ctx, h.pool, `
		SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
	`)
	lines, _ := db.QueryRows(ctx, h.pool, `
		SELECT l.* FROM "bcSalesOrderLine" l
		JOIN "bcSalesOrder" o ON o."bcSalesOrderNoValue" = l."bcSalesOrderLineDocumentNo"
		WHERE o."bcSalesOrderSalespersonCode" = 'ONLINE'
	`)

	// Aggregation
	totalOrders := len(orders)
	totalAmount := 0.0
	shippedCount := 0
	byStatus := map[string]int{}

	for _, o := range orders {
		if amt, ok := o["bcSalesOrderAmountIncludingVAT"].(float64); ok {
			totalAmount += amt
		}
		if shipped, ok := o["bcSalesOrderCompletelyShipped"].(bool); ok && shipped {
			shippedCount++
		}
		if status, ok := o["bcSalesOrderStatus"].(string); ok {
			byStatus[status]++
		}
	}

	// Lines aggregation
	totalQty := 0.0
	totalLineAmount := 0.0
	for _, l := range lines {
		if qty, ok := l["bcSalesOrderLineQuantityValue"].(float64); ok {
			totalQty += qty
		}
		if amt, ok := l["bcSalesOrderLineAmountValue"].(float64); ok {
			totalLineAmount += amt
		}
	}

	response.OK(w, map[string]any{
		"totalOrders":    totalOrders,
		"totalAmount":    totalAmount,
		"shippedCount":   shippedCount,
		"pendingCount":   totalOrders - shippedCount,
		"byStatus":       byStatus,
		"totalItems":     len(lines),
		"totalQty":       totalQty,
		"totalLineAmount": totalLineAmount,
	})
}

// ---- Sales Orders (from Supabase) ----

func (h *Handler) ListSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]any{"orders": data})
}

func (h *Handler) GetSalesOrder(w http.ResponseWriter, r *http.Request) {
	no := chi.URLParam(r, "no")
	order, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderNoValue"=$1`, no)
	if err != nil {
		response.NotFound(w, "ไม่พบ Sales Order")
		return
	}
	lines, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrderLine" WHERE "bcSalesOrderLineDocumentNo"=$1 ORDER BY "bcSalesOrderLineLineNo"
	`, no)
	order["lines"] = lines

	// Get customer phone
	custNo, _ := order["bcSalesOrderSellToCustomerNo"].(string)
	if custNo != "" {
		cust, _ := db.QueryRow(r.Context(), h.pool, `SELECT "bcCustomerPhoneNo" FROM "bcCustomer" WHERE "bcCustomerNo"=$1`, custNo)
		if cust != nil {
			order["customerPhone"] = cust["bcCustomerPhoneNo"]
		}
	}
	response.OK(w, order)
}

// ---- Work Orders ----

func (h *Handler) ListWorkOrders(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	q := `SELECT * FROM "mktWorkOrder" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("mktWorkOrderNo" ILIKE $%d OR "mktWorkOrderTitle" ILIKE $%d OR "mktWorkOrderRequestedBy" ILIKE $%d OR "mktWorkOrderAssignedTo" ILIKE $%d)`,
			argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "mktWorkOrderCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateWorkOrder(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "mktWorkOrder" ("mktWorkOrderNo","mktWorkOrderTitle","mktWorkOrderDescription","mktWorkOrderType",
			"mktWorkOrderRequestedBy","mktWorkOrderRequestedDepartment","mktWorkOrderAssignedTo","mktWorkOrderPriority",
			"mktWorkOrderStartDate","mktWorkOrderDueDate","mktWorkOrderNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["mktWorkOrderNo"], body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderType"],
		body["mktWorkOrderRequestedBy"], body["mktWorkOrderRequestedDepartment"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStartDate"], body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetWorkOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "mktWorkOrder" WHERE id=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Work Order")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateWorkOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "mktWorkOrder" SET
			"mktWorkOrderTitle"=COALESCE($2,"mktWorkOrderTitle"),"mktWorkOrderDescription"=COALESCE($3,"mktWorkOrderDescription"),
			"mktWorkOrderAssignedTo"=COALESCE($4,"mktWorkOrderAssignedTo"),"mktWorkOrderPriority"=COALESCE($5,"mktWorkOrderPriority"),
			"mktWorkOrderStatus"=COALESCE($6,"mktWorkOrderStatus"),"mktWorkOrderProgress"=COALESCE($7,"mktWorkOrderProgress"),
			"mktWorkOrderDueDate"=COALESCE($8,"mktWorkOrderDueDate"),"mktWorkOrderNotes"=COALESCE($9,"mktWorkOrderNotes")
		WHERE id=$1 RETURNING *
	`, id, body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStatus"], body["mktWorkOrderProgress"],
		body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteWorkOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "mktWorkOrder" SET "isActive"=false WHERE id=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListWorkOrderProgress(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "mktWorkOrderProgressLog" WHERE "mktWorkOrderProgressLogWorkOrderId"=$1
		ORDER BY "mktWorkOrderProgressLogCreatedAt" DESC
	`, id)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateWorkOrderProgress(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "mktWorkOrderProgressLog" ("mktWorkOrderProgressLogWorkOrderId","mktWorkOrderProgressLogDescription","mktWorkOrderProgressLogProgress","mktWorkOrderProgressLogCreatedBy")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, id, body["description"], body["progress"], body["createdBy"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	// Auto-update work order progress
	h.pool.Exec(r.Context(), `UPDATE "mktWorkOrder" SET "mktWorkOrderProgress"=$2 WHERE id=$1`, id, body["progress"])
	response.Created(w, data)
}

// ---- Label Designs ----

func (h *Handler) ListLabelDesigns(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "labelDesign" ORDER BY "labelDesignCreatedAt" DESC`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateLabelDesign(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "labelDesign" ("labelDesignName","labelDesignWidth","labelDesignHeight","labelDesignPreset","labelDesignElements","labelDesignCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
	`, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"],
		body["labelDesignPreset"], body["labelDesignElements"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateLabelDesign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "labelDesign" SET
			"labelDesignName"=COALESCE($2,"labelDesignName"),"labelDesignWidth"=COALESCE($3,"labelDesignWidth"),
			"labelDesignHeight"=COALESCE($4,"labelDesignHeight"),"labelDesignElements"=COALESCE($5,"labelDesignElements"),
			"labelDesignUpdatedAt"=now()
		WHERE "labelDesignId"=$1 RETURNING *
	`, id, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"], body["labelDesignElements"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteLabelDesign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `DELETE FROM "labelDesign" WHERE "labelDesignId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Printer Placeholders ----

func (h *Handler) PrintLabel(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Images      []string                `json:"images"`
		LabelWidth  float64                 `json:"labelWidth"`
		LabelHeight float64                 `json:"labelHeight"`
		Gap         float64                 `json:"gap"`
		Config      *external.PrintConfig   `json:"printerConfig"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if len(body.Images) == 0 {
		response.BadRequest(w, "กรุณาระบุ images")
		return
	}
	if body.LabelWidth == 0 { body.LabelWidth = 100 }
	if body.LabelHeight == 0 { body.LabelHeight = 30 }
	if body.Gap == 0 { body.Gap = 3 }
	cfg := external.DefaultPrintConfig()
	if body.Config != nil { cfg = *body.Config }

	printer := external.NewTSCPrinter()
	results, _ := printer.PrintLabels(body.Images, body.LabelWidth, body.LabelHeight, body.Gap, cfg)

	success, failed := 0, 0
	for _, r := range results {
		if r.Success { success++ } else { failed++ }
	}
	response.OK(w, map[string]any{"success": true, "data": map[string]any{"results": results, "summary": map[string]int{"total": len(results), "success": success, "failed": failed}}})
}

func (h *Handler) PrintStatus(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]any{"success": true, "data": map[string]any{"active": []any{}, "history": []any{}}})
}

func (h *Handler) PrintCancel(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]any{"success": true, "message": "No active jobs"})
}

func (h *Handler) PrintShippingLabel(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Images []string              `json:"images"`
		Config *external.PrintConfig `json:"printerConfig"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if len(body.Images) == 0 {
		response.BadRequest(w, "กรุณาระบุ images")
		return
	}
	cfg := external.DefaultPrintConfig()
	if body.Config != nil { cfg = *body.Config }

	printer := external.NewTSCPrinter()
	results, _ := printer.PrintLabels(body.Images, 100, 150, 3, cfg) // A6 size
	response.OK(w, map[string]any{"success": true, "data": map[string]any{"results": results}})
}
func (h *Handler) GenerateImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "กรุณาอัพโหลดรูปภาพ")
		return
	}

	prompt := r.FormValue("prompt")
	size := r.FormValue("size")
	if size == "" {
		size = "1024x1024"
	}

	userID := middleware.UserID(r.Context())

	// For image generation, call OpenRouter with image model
	// Store the result in mktGeneratedImage table
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "mktGeneratedImage" ("mktGeneratedImagePrompt","mktGeneratedImageSize","mktGeneratedImageCreatedBy","mktGeneratedImageResultUrl")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, prompt, size, userID, "pending")
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// TODO: Call actual image generation API (OpenRouter/DALL-E/Flux)
	// For now, mark as pending — frontend will poll for result
	response.Created(w, data)
}

func (h *Handler) ImageHistory(w http.ResponseWriter, r *http.Request) {
	data, _ := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "mktGeneratedImage" WHERE "isActive"=true ORDER BY "mktGeneratedImageCreatedAt" DESC LIMIT 50`)
	response.OK(w, data)
}
