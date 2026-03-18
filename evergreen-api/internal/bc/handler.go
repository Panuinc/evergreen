package bc

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/response"
)

// Handler serves BC data read endpoints.
type Handler struct {
	pool *pgxpool.Pool
}

// NewHandler creates a new BC data handler.
func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

// Routes returns BC data routes.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/customers", h.ListCustomers)
	r.Get("/items", h.ListItems)
	r.Get("/salesOrders", h.ListSalesOrders)
	r.Get("/production", h.ListProduction)
	r.Get("/productionOrders", h.ListProductionOrders)
	return r
}

func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "bcCustomer" ORDER BY "bcCustomerNo"`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListItems(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItem" ORDER BY "bcItemNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrder" ORDER BY "bcSalesOrderNoValue" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListProduction(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcItemLedgerEntry" ORDER BY "bcItemLedgerEntryEntryNo" DESC LIMIT 1000
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListProductionOrders(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcProductionOrder" ORDER BY "bcProductionOrderNo" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}
