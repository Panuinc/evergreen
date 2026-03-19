package finance

import "github.com/go-chi/chi/v5"

// Routes registers all finance routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	// Now reading from Supabase instead of BC API
	r.Get("/salesInvoices", h.SalesInvoices)
	r.Get("/purchaseInvoices", h.PurchaseInvoices)
	r.Get("/agedReceivables", h.AgedReceivables)
	r.Get("/agedPayables", h.AgedPayables)
	r.Get("/glEntries", h.GLEntries)
	r.Get("/trialBalance", h.TrialBalance)

	r.Route("/collections", func(r chi.Router) {
		r.Get("/", h.ListCollections)
		r.Post("/", h.CreateCollection)
	})

	r.Route("/bankRecon", func(r chi.Router) {
		r.Get("/", h.ListBankStatements)
		r.Post("/", h.CreateBankStatement)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetBankStatement)
			r.Delete("/", h.DeleteBankStatement)
			r.Post("/parse", h.ParseBankStatement)
			r.Post("/match", h.AutoMatch)
			r.Put("/match", h.ManualMatch)
			r.Get("/export", h.ExportBankRecon)
		})
	})

	// AI endpoints (pass-through to OpenRouter)
	r.Post("/aiAnalysis", h.AIAnalysis)
	r.Post("/aiCashFlow", h.AICashFlow)
	r.Post("/aiCollections", h.AICollections)

	return r
}
