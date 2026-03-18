package warehouse

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/inventory", h.ListInventory)

	r.Route("/orders", func(r chi.Router) {
		r.Get("/", h.ListOrders)
		r.Route("/{no}", func(r chi.Router) {
			r.Post("/match", h.CreateOrderMatch)
		})
	})

	r.Route("/sessions", func(r chi.Router) {
		r.Get("/", h.ListSessions)
		r.Post("/", h.CreateSession)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetSession)
			r.Put("/", h.UpdateSession)
			r.Get("/records", h.ListSessionRecords)
			r.Post("/records", h.CreateSessionRecords)
		})
	})

	r.Route("/transfers", func(r chi.Router) {
		r.Get("/", h.ListTransfers)
		r.Post("/", h.CreateTransfer)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetTransfer)
			r.Put("/", h.UpdateTransfer)
		})
	})

	r.Route("/rfid", func(r chi.Router) {
		r.Post("/decode", h.RfidDecode)
		r.Post("/assign", h.RfidAssign)
		r.Delete("/assign", h.RfidUnassign)
	})

	r.Post("/print", h.Print)
	r.Get("/dashboard", h.Dashboard)
	r.Get("/app-version", h.AppVersion)

	return r
}

// ---- Inventory ----

func (h *Handler) ListInventory(w http.ResponseWriter, r *http.Request) {
	group := r.URL.Query().Get("group")
	category := r.URL.Query().Get("category")

	q := `SELECT * FROM "bcItem" WHERE ("bcItemBlocked" IS NULL OR "bcItemBlocked" != 'true') AND "bcItemInventory" > 0`
	args := []any{}
	argIdx := 1

	if group != "" {
		q += fmt.Sprintf(` AND "bcItemItemCategoryCode" = $%d`, argIdx)
		args = append(args, group)
		argIdx++
	}
	if category != "" {
		q += fmt.Sprintf(` AND "bcItemGenProdPostingGroup" = $%d`, argIdx)
		args = append(args, category)
		argIdx++
	}
	q += ` ORDER BY "bcItemNo"`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Orders ----

func (h *Handler) ListOrders(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrder" ORDER BY "bcSalesOrderNo" DESC
	`)
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
	body["whOrderMatchOrderNo"] = no
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "whOrderMatch" ("whOrderMatchOrderNo", "whOrderMatchItemNo", "whOrderMatchQuantity", "whOrderMatchCreatedBy")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, no, body["whOrderMatchItemNo"], body["whOrderMatchQuantity"], middleware.UserID(r.Context()))
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- Sessions ----

func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "whScanSession"
		WHERE "whScanSessionCreatedBy" = $1
		ORDER BY "whScanSessionCreatedAt" DESC
	`, userID)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "whScanSession" ("whScanSessionType", "whScanSessionStatus", "whScanSessionCreatedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, body["whScanSessionType"], body["whScanSessionStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "whScanSession" WHERE "whScanSessionId" = $1`, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "whScanSession" SET
			"whScanSessionStatus" = COALESCE($2, "whScanSessionStatus")
		WHERE "whScanSessionId" = $1 RETURNING *
	`, id, body["whScanSessionStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListSessionRecords(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "whScanRecord"
		WHERE "whScanRecordSessionId" = $1
		ORDER BY "whScanRecordCreatedAt" DESC
	`, id)
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
		data, err := db.QueryRow(r.Context(), h.pool, `
			INSERT INTO "whScanRecord" ("whScanRecordSessionId", "whScanRecordBarcode", "whScanRecordItemNo", "whScanRecordQuantity")
			VALUES ($1, $2, $3, $4) RETURNING *
		`, id, rec["whScanRecordBarcode"], rec["whScanRecordItemNo"], rec["whScanRecordQuantity"])
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
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "whTransfer"
		WHERE "whTransferCreatedBy" = $1
		ORDER BY "whTransferCreatedAt" DESC
	`, userID)
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
	countRow, err := db.QueryRow(r.Context(), h.pool, `
		SELECT COUNT(*) as cnt FROM "whTransfer" WHERE "whTransferNumber" LIKE $1
	`, prefix+"%")
	seq := 1
	if err == nil {
		if cnt, ok := countRow["cnt"].(int64); ok {
			seq = int(cnt) + 1
		}
	}
	number := fmt.Sprintf("%s%04d", prefix, seq)

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "whTransfer" ("whTransferNumber", "whTransferFromLocation", "whTransferToLocation", "whTransferStatus", "whTransferCreatedBy")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, number, body["whTransferFromLocation"], body["whTransferToLocation"], body["whTransferStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetTransfer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "whTransfer" WHERE "whTransferId" = $1`, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "whTransfer" SET
			"whTransferFromLocation" = COALESCE($2, "whTransferFromLocation"),
			"whTransferToLocation" = COALESCE($3, "whTransferToLocation"),
			"whTransferStatus" = COALESCE($4, "whTransferStatus")
		WHERE "whTransferId" = $1 RETURNING *
	`, id, body["whTransferFromLocation"], body["whTransferToLocation"], body["whTransferStatus"])
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
	items, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItem" WHERE "bcItemRfidCode" IS NOT NULL
	`)

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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "whRfidTag" ("whRfidTagCode", "whRfidTagItemNo", "whRfidTagAssignedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, body["whRfidTagCode"], body["whRfidTagItemNo"], middleware.UserID(r.Context()))
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
	_, err := h.pool.Exec(r.Context(), `DELETE FROM "whRfidTag" WHERE "whRfidTagCode" = $1`, body["whRfidTagCode"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Print ----

func (h *Handler) Print(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Action     string `json:"action"`
		ItemNumber string `json:"itemNumber"`
		Copies     int    `json:"copies"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	switch body.Action {
	case "testConnection":
		response.OK(w, map[string]any{"success": true, "message": "Printer connection test — use printer IP directly"})
	case "print", "preview":
		if body.ItemNumber == "" {
			response.BadRequest(w, "กรุณาระบุ itemNumber")
			return
		}
		item, err := db.QueryRow(r.Context(), h.pool, `
			SELECT * FROM "bcItem" WHERE "bcItemNo"=$1
		`, body.ItemNumber)
		if err != nil {
			response.NotFound(w, "ไม่พบสินค้า")
			return
		}
		if body.Copies < 1 {
			body.Copies = 1
		}
		response.OK(w, map[string]any{"success": true, "action": body.Action, "item": item, "copies": body.Copies})
	default:
		response.OK(w, map[string]any{"success": true, "actions": []string{"print", "preview", "testConnection"}})
	}
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	sessions, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "whScanSession"`)
	transfers, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "whTransfer"`)

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
	data, err := db.QueryRow(r.Context(), h.pool, `
		SELECT * FROM "whAppVersion" ORDER BY "whAppVersionCreatedAt" DESC LIMIT 1
	`)
	if err != nil {
		response.NotFound(w, "ไม่พบเวอร์ชัน")
		return
	}
	response.OK(w, data)
}
