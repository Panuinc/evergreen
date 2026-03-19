package hr

import "github.com/go-chi/chi/v5"

// Routes registers all hr routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()
	r.Route("/employees", func(r chi.Router) {
		r.Get("/", h.ListEmployees)
		r.Post("/", h.CreateEmployee)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetEmployee)
			r.Put("/", h.UpdateEmployee)
			r.Delete("/", h.DeleteEmployee)
		})
	})
	r.Route("/departments", func(r chi.Router) {
		r.Get("/", h.ListDepartments)
		r.Post("/", h.CreateDepartment)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateDepartment)
			r.Delete("/", h.DeleteDepartment)
		})
	})
	r.Route("/divisions", func(r chi.Router) {
		r.Get("/", h.ListDivisions)
		r.Post("/", h.CreateDivision)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateDivision)
			r.Delete("/", h.DeleteDivision)
		})
	})
	r.Route("/positions", func(r chi.Router) {
		r.Get("/", h.ListPositions)
		r.Post("/", h.CreatePosition)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdatePosition)
			r.Delete("/", h.DeletePosition)
		})
	})
	r.Get("/dashboard", h.Dashboard)
	r.Get("/unlinkedEmployees", h.UnlinkedEmployees)
	r.Get("/unlinkedUsers", h.UnlinkedUsers)
	return r
}
