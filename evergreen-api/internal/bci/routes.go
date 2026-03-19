package bci

import "github.com/go-chi/chi/v5"

// Routes registers all bci routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Route("/projects", func(r chi.Router) {
		r.Get("/", h.ListProjects)
		r.Post("/", h.CreateProject)
	})
	r.Post("/import", h.ImportExcel)
	return r
}
