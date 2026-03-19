package tms

import "github.com/go-chi/chi/v5"

// Routes registers all tms routes on a new router.
func Routes(h *Handler) chi.Router {
	r := chi.NewRouter()

	r.Route("/vehicles", func(r chi.Router) {
		r.Get("/", h.ListVehicles)
		r.Post("/", h.CreateVehicle)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetVehicle)
			r.Put("/", h.UpdateVehicle)
			r.Delete("/", h.DeleteVehicle)
		})
	})

	r.Route("/shipments", func(r chi.Router) {
		r.Get("/", h.ListShipments)
		r.Post("/", h.CreateShipment)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetShipment)
			r.Put("/", h.UpdateShipment)
			r.Delete("/", h.DeleteShipment)
			r.Put("/status", h.UpdateShipmentStatus)
		})
	})

	r.Route("/deliveries", func(r chi.Router) {
		r.Get("/", h.ListDeliveries)
		r.Post("/", h.CreateDelivery)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetDelivery)
			r.Put("/", h.UpdateDelivery)
			r.Delete("/", h.DeleteDelivery)
		})
	})

	r.Route("/deliveryPlans", func(r chi.Router) {
		r.Get("/", h.ListDeliveryPlans)
		r.Post("/", h.CreateDeliveryPlan)
		r.Get("/salesOrders", h.ListUnshippedSalesOrders)
		r.Get("/salesOrders/{no}/lines", h.GetSalesOrderLines)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetDeliveryPlan)
			r.Put("/", h.UpdateDeliveryPlan)
			r.Delete("/", h.DeleteDeliveryPlan)
		})
	})

	r.Route("/fuelLogs", func(r chi.Router) {
		r.Get("/", h.ListFuelLogs)
		r.Post("/", h.CreateFuelLog)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetFuelLog)
			r.Put("/", h.UpdateFuelLog)
			r.Delete("/", h.DeleteFuelLog)
		})
	})

	r.Route("/gpsLogs", func(r chi.Router) {
		r.Get("/", h.ListGpsLogs)
		r.Post("/", h.CreateGpsLog)
		r.Get("/latest", h.LatestGpsLogs)
	})

	r.Get("/dashboard", h.Dashboard)
	r.Get("/distance", h.Distance)
	r.Post("/routeOptimize", h.RouteOptimize)
	r.Post("/aiAnalysis", h.AiAnalysis)
	r.Get("/forthtrack", h.Forthtrack)

	return r
}
