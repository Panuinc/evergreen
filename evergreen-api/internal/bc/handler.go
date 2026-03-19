package bc

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/response"
)

// Handler serves BC data read endpoints.
type Handler struct {
	store *Store
}

// NewHandler creates a new BC data handler.
func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListCustomers(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListItems(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListItems(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListSalesOrders(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListProduction(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListProduction(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListProductionOrders(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListProductionOrders(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}
