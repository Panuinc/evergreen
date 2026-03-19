package auth

import "github.com/go-chi/chi/v5"

// Routes registers all auth routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	// Public routes (no JWT auth)
	r.Post("/login", h.Login)
	r.Post("/refresh", h.Refresh)
	r.Post("/verify", h.Verify)

	// PIN routes - pin/verify is public, pin GET/POST/DELETE need auth
	r.Post("/pin/verify", h.PINVerify)
	r.Group(func(r chi.Router) {
		r.Use(h.jwtAuth.Authenticate)
		r.Get("/pin", h.PINStatus)
		r.Post("/pin", h.PINSet)
		r.Delete("/pin", h.PINDelete)
	})
	return r
}
