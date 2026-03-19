package chat

import "github.com/go-chi/chi/v5"

// Routes registers all chat routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Chat)
	return r
}
