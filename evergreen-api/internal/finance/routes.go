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

	r.Get("/collectionsMerged", h.CollectionsMerged)

	r.Route("/collections", func(r chi.Router) {
		r.Get("/", h.ListCollections)
		r.Post("/", h.CreateCollection)
	})

	// AI endpoints (pass-through to OpenRouter)
	r.Post("/aiAnalysis", h.AIAnalysis)
	r.Post("/aiCashFlow", h.AICashFlow)
	r.Post("/aiCollections", h.AICollections)

	return r
}
