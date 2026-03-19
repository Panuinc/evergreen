package production

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

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

	prodOrders, _ := h.store.GetProductionOrders(ctx)

	byStatus := map[string]int{}
	for _, po := range prodOrders {
		if st, ok := po["bcProductionOrderStatus"].(string); ok {
			byStatus[st]++
		}
	}

	outputQty, _ := h.store.GetOutputQty(ctx)

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
	data, err := h.store.ListCores(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Frames ----

func (h *Handler) ListFrames(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListFrames(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- FG Coverage ----

func (h *Handler) FgCoverage(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.FgCoverage(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]any{"fgCoverage": data})
}

// ---- BOM AI ----

func (h *Handler) BomAi(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "coming_soon"})
}
