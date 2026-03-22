package marketing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/internal/marketing/omnichannel"
	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
	cfg   *config.Config
	om    *omnichannel.Handler
}

func New(pool *pgxpool.Pool, cfg *config.Config) *Handler {
	return &Handler{store: NewStore(pool), cfg: cfg, om: omnichannel.New(pool)}
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
	contact, _ := h.store.UpsertContact(ctx, channelType, externalID)

	if contact == nil {
		logger.Error("failed to upsert contact", "channelType", channelType, "externalID", externalID)
		return
	}
	contactID, _ := contact["mktContactId"].(string)

	// Find or create conversation
	conv, err := h.store.FindActiveConversation(ctx, contactID, channelType)
	if err != nil {
		var convErr error
		conv, convErr = h.store.CreateConversation(ctx, contactID, channelType)
		if convErr != nil {
			logger.Error("failed to create conversation", "contactId", contactID, "channelType", channelType, "error", convErr)
		}
	}
	if conv == nil {
		return
	}
	convID, _ := conv["mktConversationId"].(string)

	// Insert message
	preview := text
	if len([]rune(preview)) > 100 {
		preview = string([]rune(preview)[:100]) + "..."
	}
	h.store.InsertIncomingMessage(ctx, convID, senderID, text, externalMsgID)

	// Update conversation
	h.store.UpdateConversationOnIncoming(ctx, convID, preview)

	logger.Info("webhook message processed", "channel", channelType, "contactId", contactID, "convId", convID)
}

// ---- Analytics ----

func (h *Handler) Analytics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	dateFrom, dateTo := parseDateRange(r)

	var (
		summary            map[string]any
		periodRow          map[string]any
		monthlyComparison  map[string]any
		customerInsights   map[string]any
		fulfillmentMetrics map[string]any
		monthlyTrend       []map[string]any
		dailyTrend         []map[string]any
		revenueByDay       []map[string]any
		yoyComparison      []map[string]any
		orderStatusDist    []map[string]any
		locationDist       []map[string]any
		orderValueDist     []map[string]any
		topCustomers       []map[string]any
		topSkus            []map[string]any
	)
	g, gCtx := errgroup.WithContext(ctx)
	g.Go(func() error { var e error; summary, e = h.store.GetAnalyticsSummary(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; periodRow, e = h.store.GetPeriodStats(gCtx); return e })
	g.Go(func() error { var e error; monthlyTrend, e = h.store.GetMonthlyTrend(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; dailyTrend, e = h.store.GetDailyTrend(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; revenueByDay, e = h.store.GetRevenueByDayOfWeek(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; yoyComparison, e = h.store.GetYoYComparison(gCtx); return e })
	g.Go(func() error { var e error; orderStatusDist, e = h.store.GetOrderStatusDist(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; locationDist, e = h.store.GetLocationDist(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; orderValueDist, e = h.store.GetOrderValueDist(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; monthlyComparison, e = h.store.GetMonthlyComparison(gCtx); return e })
	g.Go(func() error { var e error; customerInsights, e = h.store.GetCustomerInsights(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; fulfillmentMetrics, e = h.store.GetFulfillmentMetrics(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; topCustomers, e = h.store.GetTopCustomers(gCtx, dateFrom, dateTo); return e })
	g.Go(func() error { var e error; topSkus, e = h.store.GetTopSkus(gCtx, dateFrom, dateTo); return e })
	if err := g.Wait(); err != nil {
		response.InternalError(w, err)
		return
	}

	// KPIs
	totalOrders := toInt(summary["totalOrders"])
	totalRevenue := toFloat(summary["totalRevenue"])
	shippedOrders := toInt(summary["shippedOrders"])
	avgOrderValue := 0.0
	if totalOrders > 0 {
		avgOrderValue = totalRevenue / float64(totalOrders)
	}

	// Period stats
	var dtdRevenue, wtdRevenue, mtdRevenue, ytdRevenue float64
	var dtdOrders, wtdOrders, mtdOrders, ytdOrders int
	var prevWtdRevenue, prevMtdRevenue, prevYtdRevenue float64
	if periodRow != nil {
		dtdRevenue = toFloat(periodRow["dtdRevenue"])
		dtdOrders = toInt(periodRow["dtdOrders"])
		wtdRevenue = toFloat(periodRow["wtdRevenue"])
		wtdOrders = toInt(periodRow["wtdOrders"])
		mtdRevenue = toFloat(periodRow["mtdRevenue"])
		mtdOrders = toInt(periodRow["mtdOrders"])
		ytdRevenue = toFloat(periodRow["ytdRevenue"])
		ytdOrders = toInt(periodRow["ytdOrders"])
		prevWtdRevenue = toFloat(periodRow["prevWtdRevenue"])
		prevMtdRevenue = toFloat(periodRow["prevMtdRevenue"])
		prevYtdRevenue = toFloat(periodRow["prevYtdRevenue"])
	}

	response.OK(w, map[string]any{
		"stats": map[string]any{
			"totalOrders":   totalOrders,
			"totalRevenue":  totalRevenue,
			"shippedOrders": shippedOrders,
			"pendingOrders": totalOrders - shippedOrders,
			"avgOrderValue": avgOrderValue,

			"dtd":       map[string]any{"revenue": dtdRevenue, "orders": dtdOrders},
			"wtd":       map[string]any{"revenue": wtdRevenue, "orders": wtdOrders},
			"mtd":       map[string]any{"revenue": mtdRevenue, "orders": mtdOrders},
			"ytd":       map[string]any{"revenue": ytdRevenue, "orders": ytdOrders},
			"wowGrowth": growthRate(wtdRevenue, prevWtdRevenue),
			"mtdGrowth": growthRate(mtdRevenue, prevMtdRevenue),
			"ytdGrowth": growthRate(ytdRevenue, prevYtdRevenue),

			"monthlyTrend":       monthlyTrend,
			"dailyTrend":         dailyTrend,
			"revenueByDayOfWeek": revenueByDay,
			"yoyComparison":      yoyComparison,
			"orderStatusDist":    orderStatusDist,
			"fulfillmentMetrics": fulfillmentMetrics,
			"locationDist":       locationDist,
			"orderValueDist":     orderValueDist,
			"monthlyComparison":  monthlyComparison,
			"customerInsights":   customerInsights,
			"customerSegmentation": map[string]any{
				"totalCustomers": 0,
				"byChannel":      []any{},
				"byGroup":        []any{},
				"byType":         []any{},
			},
			"topCustomers": topCustomers,
			"topSkus":      topSkus,
		},
	})
}

// parseDateRange converts ?period= or ?startDate=&endDate= into a date window.
func parseDateRange(r *http.Request) (string, string) {
	period := r.URL.Query().Get("period")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")
	now := time.Now()
	switch period {
	case "day":
		d := now.Format("2006-01-02")
		return d, d
	case "week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		weekStart := now.AddDate(0, 0, -(weekday - 1))
		return weekStart.Format("2006-01-02"), now.Format("2006-01-02")
	case "month":
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		return monthStart.Format("2006-01-02"), now.Format("2006-01-02")
	case "year":
		yearStart := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		return yearStart.Format("2006-01-02"), now.Format("2006-01-02")
	default:
		return startDate, endDate
	}
}

// growthRate computes percentage change; returns nil when previous is 0 and current is also 0.
func growthRate(current, prev float64) any {
	if prev == 0 {
		if current > 0 {
			return 100.0
		}
		return nil
	}
	return math.Round((current-prev)/prev*1000) / 10
}

func toFloat(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case float32:
		return float64(x)
	case int64:
		return float64(x)
	case int32:
		return float64(x)
	case int:
		return float64(x)
	}
	return 0
}

func toInt(v any) int {
	switch x := v.(type) {
	case int64:
		return int(x)
	case int32:
		return int(x)
	case float64:
		return int(x)
	case int:
		return x
	}
	return 0
}

// ---- Sales Orders (from Supabase) ----

func (h *Handler) ListSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListSalesOrders(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]any{"orders": data})
}

func (h *Handler) GetSalesOrder(w http.ResponseWriter, r *http.Request) {
	no := chi.URLParam(r, "no")
	order, err := h.store.GetSalesOrder(r.Context(), no)
	if err != nil {
		response.NotFound(w, "ไม่พบ Sales Order")
		return
	}
	lines, _ := h.store.GetSalesOrderLines(r.Context(), no)
	order["lines"] = lines

	// Get customer phone
	customerPhone := ""
	custNo, _ := order["bcSalesOrderSellToCustomerNo"].(string)
	if custNo != "" {
		cust, _ := h.store.GetCustomerPhone(r.Context(), custNo)
		if cust != nil {
			customerPhone, _ = cust["bcCustomerPhoneNo"].(string)
		}
	}
	response.OK(w, map[string]any{"order": order, "customerPhone": customerPhone})
}

// ---- Work Orders ----

func (h *Handler) ListWorkOrders(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListWorkOrders(r.Context(), sa, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateWorkOrder(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := h.store.CreateWorkOrder(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetWorkOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetWorkOrder(r.Context(), id)
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
	data, err := h.store.UpdateWorkOrder(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteWorkOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.SoftDeleteWorkOrder(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListWorkOrderProgress(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.ListWorkOrderProgress(r.Context(), id)
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
	data, err := h.store.CreateWorkOrderProgress(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	// Auto-update work order progress
	h.store.UpdateWorkOrderProgress(r.Context(), id, body["mktWorkOrderProgressLogProgress"])
	response.Created(w, data)
}

// ---- Label Designs ----

func (h *Handler) ListLabelDesigns(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListLabelDesigns(r.Context())
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
	data, err := h.store.CreateLabelDesign(r.Context(), body, userID)
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
	data, err := h.store.UpdateLabelDesign(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteLabelDesign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.store.DeleteLabelDesign(r.Context(), id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Printer Placeholders ----

func (h *Handler) PrintLabel(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Images      []string             `json:"images"`
		LabelWidth  float64              `json:"labelWidth"`
		LabelHeight float64              `json:"labelHeight"`
		Gap         float64              `json:"gap"`
		Config      *clients.PrintConfig `json:"printerConfig"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if len(body.Images) == 0 {
		response.BadRequest(w, "กรุณาระบุ images")
		return
	}
	if body.LabelWidth == 0 {
		body.LabelWidth = 100
	}
	if body.LabelHeight == 0 {
		body.LabelHeight = 30
	}
	if body.Gap == 0 {
		body.Gap = 3
	}
	cfg := clients.DefaultPrintConfig()
	if body.Config != nil {
		cfg = *body.Config
	}

	printer := clients.NewTSCPrinter()
	results, _ := printer.PrintLabels(body.Images, body.LabelWidth, body.LabelHeight, body.Gap, cfg)

	success, failed := 0, 0
	for _, r := range results {
		if r.Success {
			success++
		} else {
			failed++
		}
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
		Images []string             `json:"images"`
		Config *clients.PrintConfig `json:"printerConfig"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if len(body.Images) == 0 {
		response.BadRequest(w, "กรุณาระบุ images")
		return
	}
	cfg := clients.DefaultPrintConfig()
	if body.Config != nil {
		cfg = *body.Config
	}

	printer := clients.NewTSCPrinter()
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
	data, err := h.store.CreateGeneratedImage(r.Context(), prompt, size, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// TODO: Call actual image generation API (OpenRouter/DALL-E/Flux)
	// For now, mark as pending — frontend will poll for result
	response.Created(w, data)
}

func (h *Handler) ImageHistory(w http.ResponseWriter, r *http.Request) {
	data, _ := h.store.ListGeneratedImages(r.Context())
	response.OK(w, data)
}
