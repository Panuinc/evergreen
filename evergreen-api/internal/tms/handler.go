package tms

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
	ai    *clients.OpenRouterClient
}

func New(pool *pgxpool.Pool, ai *clients.OpenRouterClient) *Handler {
	return &Handler{store: NewStore(pool), ai: ai}
}

// ---- Vehicles ----

func (h *Handler) ListVehicles(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	isActive := r.URL.Query().Get("isActive")
	data, err := h.store.ListVehicles(r.Context(), sa, isActive, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateVehicle(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateVehicle(r.Context(),
		body["tmsVehiclePlateNumber"], body["tmsVehicleName"], body["tmsVehicleStatus"],
		body["tmsVehicleCapacityKg"], body["tmsVehicleFuelType"], body["tmsVehicleForthtrackId"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.GetVehicle(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบยานพาหนะ")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateVehicle(r.Context(),
		id, body["tmsVehiclePlateNumber"], body["tmsVehicleName"], body["tmsVehicleStatus"],
		body["tmsVehicleCapacityKg"], body["tmsVehicleFuelType"], body["tmsVehicleForthtrackId"], body["isActive"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.SoftDeleteVehicle(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Shipments ----

func (h *Handler) ListShipments(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	status := r.URL.Query().Get("status")
	data, err := h.store.ListShipments(r.Context(), sa, status, search)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateShipment(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	userID := middleware.UserID(r.Context())

	// Auto-generate shipment number: SHP-YYMMDD-###
	today := time.Now().Format("060102")
	prefix := "SHP-" + today + "-"
	countRow, err := h.store.CountShipmentsByPrefix(r.Context(), prefix)
	seq := 1
	if err == nil {
		if cnt, ok := countRow["cnt"].(int64); ok {
			seq = int(cnt) + 1
		}
	}
	number := fmt.Sprintf("%s%03d", prefix, seq)

	data, err := h.store.CreateShipment(r.Context(),
		number, body["tmsShipmentCustomerName"], body["tmsShipmentCustomerPhone"], body["tmsShipmentStatus"],
		body["tmsShipmentDate"], body["tmsShipmentVehicleId"], body["tmsShipmentDriverId"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetShipment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.GetShipment(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบการจัดส่ง")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateShipment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateShipment(r.Context(),
		id, body["tmsShipmentCustomerName"], body["tmsShipmentCustomerPhone"], body["tmsShipmentStatus"],
		body["tmsShipmentDate"], body["tmsShipmentVehicleId"], body["tmsShipmentDriverId"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteShipment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.SoftDeleteShipment(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) UpdateShipmentStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateShipmentStatus(r.Context(), id, body["tmsShipmentStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

// ---- Deliveries ----

func (h *Handler) ListDeliveries(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	shipmentId := r.URL.Query().Get("shipmentId")
	data, err := h.store.ListDeliveries(r.Context(), sa, shipmentId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateDelivery(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateDelivery(r.Context(), body["tmsDeliveryShipmentId"], body["tmsDeliveryStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.GetDelivery(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบการจัดส่ง")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateDelivery(r.Context(), id, body["tmsDeliveryShipmentId"], body["tmsDeliveryStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.SoftDeleteDelivery(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Delivery Plans ----

func (h *Handler) ListDeliveryPlans(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	data, err := h.store.ListDeliveryPlans(r.Context(), month)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	userID := middleware.UserID(r.Context())
	data, err := h.store.CreateDeliveryPlan(r.Context(), body["tmsDeliveryPlanDate"], body["tmsDeliveryPlanStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.GetDeliveryPlan(r.Context(), id)
	if err != nil {
		response.NotFound(w, "ไม่พบแผนจัดส่ง")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateDeliveryPlan(r.Context(), id, body["tmsDeliveryPlanDate"], body["tmsDeliveryPlanStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteDeliveryPlan(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListUnshippedSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListUnshippedSalesOrders(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetSalesOrderLines(w http.ResponseWriter, r *http.Request) {
	no := chi.URLParam(r, "no")
	data, err := h.store.GetSalesOrderLines(r.Context(), no)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Fuel Logs ----

func (h *Handler) ListFuelLogs(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	vehicleId := r.URL.Query().Get("vehicleId")
	data, err := h.store.ListFuelLogs(r.Context(), sa, vehicleId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateFuelLog(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateFuelLog(r.Context(),
		body["tmsFuelLogVehicleId"], body["tmsFuelLogDate"], body["tmsFuelLogLiters"],
		body["tmsFuelLogPricePerLiter"], body["tmsFuelLogTotalCost"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetFuelLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.GetFuelLog(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบบันทึกเชื้อเพลิง")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateFuelLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateFuelLog(r.Context(),
		id, body["tmsFuelLogVehicleId"], body["tmsFuelLogDate"], body["tmsFuelLogLiters"],
		body["tmsFuelLogPricePerLiter"], body["tmsFuelLogTotalCost"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteFuelLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.SoftDeleteFuelLog(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- GPS Logs ----

func (h *Handler) ListGpsLogs(w http.ResponseWriter, r *http.Request) {
	vehicleId := r.URL.Query().Get("vehicleId")
	date := r.URL.Query().Get("date")
	data, err := h.store.ListGpsLogs(r.Context(), vehicleId, date)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateGpsLog(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateGpsLog(r.Context(),
		body["tmsGpsLogVehicleId"], body["tmsGpsLogLatitude"], body["tmsGpsLogLongitude"],
		body["tmsGpsLogSpeed"], body["tmsGpsLogRecordedAt"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) LatestGpsLogs(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.LatestGpsLogs(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	vehicles, _ := h.store.DashboardVehicles(ctx)
	shipments, _ := h.store.DashboardShipments(ctx)
	fuelLogs, _ := h.store.DashboardFuelLogs(ctx)

	byStatus := map[string]int{}
	for _, s := range shipments {
		if st, ok := s["tmsShipmentStatus"].(string); ok {
			byStatus[st]++
		}
	}

	totalFuelCost := 0.0
	for _, f := range fuelLogs {
		if cost, ok := f["tmsFuelLogTotalCost"].(float64); ok {
			totalFuelCost += cost
		}
	}

	response.OK(w, map[string]any{
		"totalVehicles":     len(vehicles),
		"totalShipments":    len(shipments),
		"shipmentsByStatus": byStatus,
		"totalFuelCost":     totalFuelCost,
	})
}

// ---- Distance (OSRM / Nominatim) ----

func (h *Handler) Distance(w http.ResponseWriter, r *http.Request) {
	origin := r.URL.Query().Get("origin")
	dest := r.URL.Query().Get("destination")
	if origin == "" || dest == "" {
		response.BadRequest(w, "กรุณาระบุ origin และ destination")
		return
	}

	// Use OSRM demo server for routing
	url := fmt.Sprintf("https://router.project-osrm.org/route/v1/driving/%s;%s?overview=false", origin, dest)
	resp, err := http.Get(url)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)
	response.OK(w, result)
}

// ---- Route Optimization ----

func (h *Handler) RouteOptimize(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Stops []struct {
			Lat     float64 `json:"lat"`
			Lng     float64 `json:"lng"`
			Name    string  `json:"name"`
			OrderNo string  `json:"orderNo"`
		} `json:"stops"`
		DepotLat float64 `json:"depotLat"`
		DepotLng float64 `json:"depotLng"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if len(body.Stops) == 0 {
		response.BadRequest(w, "กรุณาระบุจุดส่ง")
		return
	}

	// Build OSRM trip request (TSP solver)
	coords := fmt.Sprintf("%f,%f", body.DepotLng, body.DepotLat)
	for _, s := range body.Stops {
		coords += fmt.Sprintf(";%f,%f", s.Lng, s.Lat)
	}
	url := fmt.Sprintf("https://router.project-osrm.org/trip/v1/driving/%s?roundtrip=true&source=first", coords)

	resp, err := http.Get(url)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)
	response.OK(w, result)
}

// ---- AI Analysis (streaming) ----

func (h *Handler) AiAnalysis(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Snapshot any `json:"snapshot"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	// Get fleet summary for AI context
	vehicles, _ := h.store.AiVehicleSummary(r.Context())
	shipments, _ := h.store.AiShipmentSummary(r.Context())

	snapshot, _ := json.Marshal(map[string]any{"vehicles": vehicles, "shipments": shipments, "custom": body.Snapshot})

	flusher, ok := w.(http.Flusher)
	if !ok {
		response.Error(w, 500, "streaming not supported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")

	// TODO: need AI client passed to TMS handler — for now return snapshot
	fmt.Fprintf(w, "data: วิเคราะห์ข้อมูลขนส่ง: %s\n\n", string(snapshot))
	flusher.Flush()
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// ---- ForthTrack (direct API call) ----

func (h *Handler) Forthtrack(w http.ResponseWriter, r *http.Request) {
	// This endpoint is for authenticated users to trigger manual sync
	// The actual sync is in /api/sync/forthtrack (cron-based)
	response.OK(w, map[string]string{"message": "Use /api/sync/forthtrack for GPS sync (cron-based)"})
}
