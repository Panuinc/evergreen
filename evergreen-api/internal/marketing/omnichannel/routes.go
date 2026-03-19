package omnichannel

import "github.com/go-chi/chi/v5"

// Routes registers all omnichannel routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	r.Route("/conversations", func(r chi.Router) {
		r.Get("/", h.ListConversations)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetConversation)
			r.Put("/", h.UpdateConversation)
			r.Delete("/", h.DeleteConversation)
			r.Get("/messages", h.ListMessages)
		})
	})

	r.Post("/send", h.SendMessage)
	r.Post("/logNote", h.LogNote)

	r.Route("/quotations", func(r chi.Router) {
		r.Get("/", h.ListQuotations)
		r.Post("/createFromChat", h.CreateFromChat)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetQuotation)
			r.Put("/", h.UpdateQuotation)
			r.Patch("/", h.QuotationAction)
			r.Delete("/", h.DeleteQuotation)
		})
	})

	r.Route("/promotions", func(r chi.Router) {
		r.Get("/", h.ListPromotions)
		r.Post("/", h.CreatePromotion)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdatePromotion)
			r.Delete("/", h.DeletePromotion)
		})
	})

	r.Route("/relatedProducts", func(r chi.Router) {
		r.Get("/", h.ListRelatedProducts)
		r.Post("/", h.CreateRelatedProduct)
		r.Delete("/{id}", h.DeleteRelatedProduct)
	})

	r.Get("/stockItems", h.ListStockItems)
	r.Post("/stockItems", h.UpsertPriceItems)
	r.Get("/productInfo", h.ListProductInfo)
	r.Post("/productInfo", h.UpsertProductInfo)

	r.Route("/followUp", func(r chi.Router) {
		r.Get("/", h.ListFollowUps)
		r.Post("/", h.CreateFollowUp)
		r.Post("/process", h.ProcessFollowUps)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateFollowUp)
			r.Delete("/", h.DeleteFollowUp)
		})
	})

	r.Route("/ai", func(r chi.Router) {
		r.Post("/suggest", h.AISuggest)
		r.Post("/reply", h.AIReply)
		r.Get("/settings", h.GetAISettings)
		r.Put("/settings", h.UpdateAISettings)
	})

	return r
}
