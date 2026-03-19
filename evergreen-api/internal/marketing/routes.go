package marketing

import (
	"github.com/go-chi/chi/v5"

	"github.com/evergreen/api/internal/marketing/omnichannel"
)

// Routes registers all marketing routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	// Omnichannel sub-routes
	r.Mount("/omnichannel", omnichannel.Routes(h.om))

	// NOTE: Webhooks must be mounted OUTSIDE the JWT auth group in main.go
	// These are kept here for reference but the actual mounting happens in main.go

	// Analytics
	r.Get("/analytics", h.Analytics)

	// Sales Orders (from Supabase BC data)
	r.Get("/salesOrders", h.ListSalesOrders)
	r.Get("/salesOrders/{no}", h.GetSalesOrder)

	// Work Orders
	r.Route("/workOrders", func(r chi.Router) {
		r.Get("/", h.ListWorkOrders)
		r.Post("/", h.CreateWorkOrder)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetWorkOrder)
			r.Put("/", h.UpdateWorkOrder)
			r.Delete("/", h.DeleteWorkOrder)
			r.Get("/progress", h.ListWorkOrderProgress)
			r.Post("/progress", h.CreateWorkOrderProgress)
		})
	})

	// Label Designs
	r.Route("/labelDesigns", func(r chi.Router) {
		r.Get("/", h.ListLabelDesigns)
		r.Post("/", h.CreateLabelDesign)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateLabelDesign)
			r.Delete("/", h.DeleteLabelDesign)
		})
	})

	// Printer endpoints (placeholder)
	r.Post("/labelDesigner/print", h.PrintLabel)
	r.Get("/labelDesigner/print/status", h.PrintStatus)
	r.Post("/labelDesigner/print/cancel", h.PrintCancel)
	r.Post("/shippingLabel/print", h.PrintShippingLabel)

	// AI Image Gen (placeholder)
	r.Post("/ai/generate-image", h.GenerateImage)
	r.Get("/ai/generate-image", h.ImageHistory)

	return r
}
