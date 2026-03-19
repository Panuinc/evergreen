package sales

import "github.com/go-chi/chi/v5"

// Routes registers all sales routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	r.Get("/dashboard", h.Dashboard)

	r.Route("/leads", func(r chi.Router) {
		r.Get("/", h.ListLeads)
		r.Post("/", h.CreateLead)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetLead)
			r.Put("/", h.UpdateLead)
			r.Post("/", h.ConvertLead)
			r.Delete("/", h.DeleteLead)
		})
	})

	r.Route("/contacts", func(r chi.Router) {
		r.Get("/", h.ListContacts)
		r.Post("/", h.CreateContact)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetContact)
			r.Put("/", h.UpdateContact)
			r.Delete("/", h.DeleteContact)
		})
	})

	r.Route("/accounts", func(r chi.Router) {
		r.Get("/", h.ListAccounts)
		r.Post("/", h.CreateAccount)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetAccount)
			r.Put("/", h.UpdateAccount)
			r.Delete("/", h.DeleteAccount)
		})
	})

	r.Route("/opportunities", func(r chi.Router) {
		r.Get("/", h.ListOpportunities)
		r.Post("/", h.CreateOpportunity)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetOpportunity)
			r.Put("/", h.UpdateOpportunity)
			r.Delete("/", h.DeleteOpportunity)
		})
	})

	r.Route("/quotations", func(r chi.Router) {
		r.Get("/", h.ListQuotations)
		r.Post("/", h.CreateQuotation)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetQuotation)
			r.Put("/", h.UpdateQuotation)
			r.Post("/", h.QuotationAction)
			r.Delete("/", h.DeleteQuotation)
		})
	})

	r.Route("/orders", func(r chi.Router) {
		r.Get("/", h.ListOrders)
		r.Post("/", h.CreateOrder)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetOrder)
			r.Put("/", h.UpdateOrder)
			r.Delete("/", h.DeleteOrder)
		})
	})

	r.Get("/activities", h.ListActivities)
	r.Post("/activities", h.ManageActivity)
	r.Get("/reports", h.Reports)

	return r
}
