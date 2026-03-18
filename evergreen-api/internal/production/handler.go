package production

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
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

	r.Get("/dashboard", h.Dashboard)
	r.Get("/cores", h.ListCores)
	r.Get("/frames", h.ListFrames)
	r.Get("/fgCoverage", h.FgCoverage)
	r.Post("/bom/ai", h.BomAi)

	return r
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	prodOrders, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "bcProductionOrder"`)

	byStatus := map[string]int{}
	for _, po := range prodOrders {
		if st, ok := po["bcProductionOrderStatus"].(string); ok {
			byStatus[st]++
		}
	}

	outputQty, _ := db.QueryRows(ctx, h.pool, `
		SELECT COALESCE(SUM("bcItemLedgerEntryQuantity"), 0) as "totalOutput"
		FROM "bcItemLedgerEntry"
		WHERE "bcItemLedgerEntryEntryType" = 'Output'
	`)

	totalOutput := 0.0
	if len(outputQty) > 0 {
		if val, ok := outputQty[0]["totalOutput"].(float64); ok {
			totalOutput = val
		}
	}

	response.OK(w, map[string]any{
		"totalProductionOrders": len(prodOrders),
		"byStatus":             byStatus,
		"totalOutputQty":       totalOutput,
	})
}

// ---- Cores ----

func (h *Handler) ListCores(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItem"
		WHERE "bcItemGenProdPostingGroup" = 'RM'
			AND ("bcItemNo" LIKE 'RM-16-07%' OR "bcItemNo" LIKE 'RM-16-08%')
		ORDER BY "bcItemNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Frames ----

func (h *Handler) ListFrames(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItem"
		WHERE "bcItemNo" LIKE 'RM-14-01%'
			OR "bcItemNo" LIKE 'RM-14-04%'
			OR "bcItemNo" LIKE 'RM-16-19%'
		ORDER BY "bcItemNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- FG Coverage ----

func (h *Handler) FgCoverage(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT
			i."bcItemNo",
			i."bcItemDescription",
			i."bcItemInventory",
			COALESCE(so."totalOrdered", 0) as "totalOrdered",
			COALESCE(po."totalProduction", 0) as "totalProduction"
		FROM "bcItem" i
		LEFT JOIN (
			SELECT "bcSalesOrderLineNoValue", SUM("bcSalesOrderLineOutstandingQuantity") as "totalOrdered"
			FROM "bcSalesOrderLine"
			WHERE "bcSalesOrderLineOutstandingQuantity" > 0
			GROUP BY "bcSalesOrderLineNoValue"
		) so ON so."bcSalesOrderLineNoValue" = i."bcItemNo"
		LEFT JOIN (
			SELECT "bcProductionOrderSourceNo", SUM("bcProductionOrderQuantity") as "totalProduction"
			FROM "bcProductionOrder"
			WHERE "bcProductionOrderStatus" IN ('Planned', 'Firm_x0020_Planned', 'Released')
			GROUP BY "bcProductionOrderSourceNo"
		) po ON po."bcProductionOrderSourceNo" = i."bcItemNo"
		WHERE i."bcItemGenProdPostingGroup" = 'FG'
		ORDER BY i."bcItemNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- BOM AI ----

func (h *Handler) BomAi(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "coming_soon"})
}
