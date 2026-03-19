package it

import "github.com/go-chi/chi/v5"

// Routes registers all it routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	r.Route("/assets", func(r chi.Router) {
		r.Get("/", h.ListAssets)
		r.Post("/", h.CreateAsset)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetAsset)
			r.Put("/", h.UpdateAsset)
			r.Delete("/", h.DeleteAsset)
		})
	})

	r.Route("/devRequests", func(r chi.Router) {
		r.Get("/", h.ListDevRequests)
		r.Post("/", h.CreateDevRequest)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetDevRequest)
			r.Put("/", h.UpdateDevRequest)
			r.Delete("/", h.DeleteDevRequest)
			r.Route("/progress", func(r chi.Router) {
				r.Get("/", h.ListProgressLogs)
				r.Post("/", h.CreateProgressLog)
			})
		})
	})

	r.Get("/dashboard", h.Dashboard)

	return r
}
