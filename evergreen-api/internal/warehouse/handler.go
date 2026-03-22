package warehouse

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"

	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)


type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- Inventory ----

func (h *Handler) ListInventory(w http.ResponseWriter, r *http.Request) {
	group := r.URL.Query().Get("group")
	category := r.URL.Query().Get("category")
	data, err := h.store.ListInventory(r.Context(), group, category)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Orders ----

func (h *Handler) ListOrders(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListOrders(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateOrderMatch(w http.ResponseWriter, r *http.Request) {
	no := chi.URLParam(r, "no")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateOrderMatch(r.Context(), no, body["whOrderMatchItemNo"], body["whOrderMatchQuantity"], middleware.UserID(r.Context()))
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Sessions ----

func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	data, err := h.store.ListSessions(r.Context(), userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	userID := middleware.UserID(r.Context())
	data, err := h.store.CreateSession(r.Context(), body["whScanSessionType"], body["whScanSessionStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetSession(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Session")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateSession(r.Context(), id, body["whScanSessionStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListSessionRecords(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.ListSessionRecords(r.Context(), id)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateSessionRecords(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Records []map[string]any `json:"records"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	var results []map[string]any
	for _, rec := range body.Records {
		data, err := h.store.CreateScanRecord(r.Context(), id, rec["whScanRecordBarcode"], rec["whScanRecordItemNo"], rec["whScanRecordQuantity"])
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		results = append(results, data)
	}
	if results == nil {
		results = []map[string]any{}
	}
	response.Created(w, results)
}

// ---- Transfers ----

func (h *Handler) ListTransfers(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	data, err := h.store.ListTransfers(r.Context(), userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateTransfer(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	userID := middleware.UserID(r.Context())

	// Auto-generate transfer number: TRF-YYYYMMDD-####
	today := time.Now().Format("20060102")
	prefix := "TRF-" + today + "-"
	countRow, err := h.store.CountTransfersByPrefix(r.Context(), prefix)
	seq := 1
	if err == nil {
		if cnt, ok := countRow["cnt"].(int64); ok {
			seq = int(cnt) + 1
		}
	}
	number := fmt.Sprintf("%s%04d", prefix, seq)

	data, err := h.store.CreateTransfer(r.Context(), number, body["whTransferFromLocation"], body["whTransferToLocation"], body["whTransferStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetTransfer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetTransfer(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Transfer")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateTransfer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateTransfer(r.Context(), id, body["whTransferFromLocation"], body["whTransferToLocation"], body["whTransferStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

// ---- RFID ----

func (h *Handler) RfidDecode(w http.ResponseWriter, r *http.Request) {
	var body struct {
		EPC string `json:"epc"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if body.EPC == "" {
		response.BadRequest(w, "กรุณาระบุ EPC")
		return
	}

	// Decode EPC hex → extract RFID code → lookup item
	// EPC format: header(8) + rfidCode(24) + piece(16) + total(16) = 64 bits
	epc := body.EPC
	if len(epc) < 16 {
		response.BadRequest(w, "EPC สั้นเกินไป")
		return
	}

	// Try to find item by rfidCode
	// Simple approach: look up bcItem by rfidCode matching part of EPC
	items, _ := h.store.GetItemsWithRfidCode(r.Context())

	var matched map[string]any
	for _, item := range items {
		if code, ok := item["bcItemRfidCode"].(string); ok && code != "" {
			if len(epc) >= len(code) && epc[2:2+len(code)] == code {
				matched = item
				break
			}
		}
	}

	response.OK(w, map[string]any{"epc": epc, "item": matched})
}

func (h *Handler) RfidAssign(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.RfidAssign(r.Context(), body["whRfidTagCode"], body["whRfidTagItemNo"], middleware.UserID(r.Context()))
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) RfidUnassign(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	if err := h.store.RfidUnassign(r.Context(), body["whRfidTagCode"]); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Print ----

func (h *Handler) Print(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Action     string         `json:"action"`
		ItemNumber string         `json:"itemNumber"` // simple format
		Copies     int            `json:"copies"`
		Item       map[string]any `json:"item"`     // full format from frontend
		Quantity   int            `json:"quantity"` // alias for copies
		Config     map[string]any `json:"config"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	// Resolve item number from either format
	itemNo := body.ItemNumber
	if itemNo == "" && body.Item != nil {
		itemNo, _ = body.Item["bcItemNo"].(string)
	}
	// Resolve copies from either format
	copies := body.Copies
	if copies < 1 {
		copies = body.Quantity
	}
	if copies < 1 {
		copies = 1
	}

	switch body.Action {
	case "testConnection":
		response.OK(w, map[string]any{"success": true, "message": "Printer connection test — use printer IP directly"})
	case "print", "preview":
		if itemNo == "" {
			response.BadRequest(w, "กรุณาระบุ itemNumber")
			return
		}
		// Use provided item data if available, otherwise fetch from DB
		var item map[string]any
		if body.Item != nil {
			item = body.Item
		} else {
			var err error
			item, err = h.store.GetItemByNo(r.Context(), itemNo)
			if err != nil {
				response.NotFound(w, "ไม่พบสินค้า")
				return
			}
		}
		response.OK(w, map[string]any{"success": true, "action": body.Action, "item": item, "copies": copies})
	default:
		response.OK(w, map[string]any{"success": true, "actions": []string{"print", "preview", "testConnection"}})
	}
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var sessions, transfers []map[string]any
	g, gCtx := errgroup.WithContext(ctx)
	g.Go(func() error { var e error; sessions, e = h.store.DashboardSessions(gCtx); return e })
	g.Go(func() error { var e error; transfers, e = h.store.DashboardTransfers(gCtx); return e })
	if err := g.Wait(); err != nil {
		response.InternalError(w, err)
		return
	}

	sessionsByStatus := map[string]int{}
	for _, s := range sessions {
		if st, ok := s["whScanSessionStatus"].(string); ok {
			sessionsByStatus[st]++
		}
	}

	transfersByStatus := map[string]int{}
	for _, t := range transfers {
		if st, ok := t["whTransferStatus"].(string); ok {
			transfersByStatus[st]++
		}
	}

	response.OK(w, map[string]any{
		"totalSessions":     len(sessions),
		"sessionsByStatus":  sessionsByStatus,
		"totalTransfers":    len(transfers),
		"transfersByStatus": transfersByStatus,
	})
}

// ---- App Version ----

func (h *Handler) AppVersion(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.GetLatestAppVersion(r.Context())
	if err != nil {
		response.NotFound(w, "ไม่พบเวอร์ชัน")
		return
	}
	response.OK(w, data)
}
