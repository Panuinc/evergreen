package sync

import "github.com/go-chi/chi/v5"

// Routes registers all sync routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Get("/bc", h.handleBCSync)
	r.Get("/status", h.handleStatus)
	r.Get("/forthtrack", h.handleForthTrackSync)
	return r
}
