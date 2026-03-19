package rbac

import "github.com/go-chi/chi/v5"

// Routes registers all rbac routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	r.Route("/roles", func(r chi.Router) {
		r.Get("/", h.ListRoles)
		r.Post("/", h.CreateRole)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetRole)
			r.Put("/", h.UpdateRole)
			r.Delete("/", h.DeleteRole)
		})
	})

	r.Route("/permissions", func(r chi.Router) {
		r.Get("/", h.ListPermissions)
		r.Post("/", h.CreatePermission)
		r.Delete("/{id}", h.DeletePermission)
	})

	r.Route("/resources", func(r chi.Router) {
		r.Get("/", h.ListResources)
		r.Post("/", h.CreateResource)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateResource)
			r.Delete("/", h.DeleteResource)
		})
	})

	r.Route("/actions", func(r chi.Router) {
		r.Get("/", h.ListActions)
		r.Post("/", h.CreateAction)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateAction)
			r.Delete("/", h.DeleteAction)
		})
	})

	r.Route("/rolePermissions/{roleId}", func(r chi.Router) {
		r.Get("/", h.ListRolePermissions)
		r.Post("/", h.AddRolePermission)
		r.Delete("/", h.RemoveRolePermission)
	})

	r.Get("/userRoles", h.ListUserRoles)
	r.Route("/userRoles/{userId}", func(r chi.Router) {
		r.Get("/", h.GetUserRoles)
		r.Post("/", h.AssignUserRole)
		r.Patch("/", h.ToggleUserActive)
		r.Delete("/", h.RemoveUserRole)
	})

	r.Get("/userPermissions/{userId}", h.GetUserPermissions)

	r.Route("/accessLogs", func(r chi.Router) {
		r.Get("/", h.ListAccessLogs)
		r.Post("/", h.CreateAccessLog)
	})

	return r
}
