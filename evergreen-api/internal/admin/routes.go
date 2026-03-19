package admin

import "github.com/go-chi/chi/v5"

// Routes registers all admin routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Post("/createUser", h.CreateUser)
	r.Post("/resetPassword", h.ResetPassword)
	return r
}
