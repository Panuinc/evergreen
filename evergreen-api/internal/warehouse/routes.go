package warehouse

import "github.com/go-chi/chi/v5"

// Routes registers all warehouse routes on a new router.
func Routes(h *Handler) chi.Router {
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
