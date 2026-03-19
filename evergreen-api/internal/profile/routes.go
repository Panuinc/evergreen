package profile

import "github.com/go-chi/chi/v5"

// Routes registers all profile routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetProfile)
	r.Put("/changePassword", h.ChangePassword)
	return r
}
