package production

import "github.com/go-chi/chi/v5"

// Routes registers all production routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Get("/dashboard", h.Dashboard)
	r.Get("/cores", h.ListCores)
	r.Get("/frames", h.ListFrames)
	r.Get("/fgCoverage", h.FgCoverage)
	r.Post("/bom/ai", h.BomAi)
	return r
}
