package bc

import "github.com/go-chi/chi/v5"

// Routes registers all bc routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Get("/customers", h.ListCustomers)
	r.Get("/items", h.ListItems)
	r.Get("/salesOrders", h.ListSalesOrders)
	r.Get("/production", h.ListProduction)
	r.Get("/productionOrders", h.ListProductionOrders)
	return r
}
