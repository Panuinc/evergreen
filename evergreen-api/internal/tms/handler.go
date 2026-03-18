package tms

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func (h *Handler) Routes() chi.Router {
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

// ---- Vehicles ----

func (h *Handler) ListVehicles(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	isActive := r.URL.Query().Get("isActive")

	q := `SELECT * FROM "tmsVehicle" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if isActive != "" {
		q += fmt.Sprintf(` AND "isActive" = $%d`, argIdx)
		args = append(args, isActive == "true")
		argIdx++
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("tmsVehiclePlateNumber" ILIKE $%d OR "tmsVehicleName" ILIKE $%d)`, argIdx, argIdx+1)
		p := "%" + search + "%"
		args = append(args, p, p)
	}
	q += ` ORDER BY "tmsVehicleCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsVehicle" ("tmsVehiclePlateNumber", "tmsVehicleName", "tmsVehicleStatus", "tmsVehicleCapacityKg", "tmsVehicleFuelType", "tmsVehicleForthtrackId")
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
	`, body["tmsVehiclePlateNumber"], body["tmsVehicleName"], body["tmsVehicleStatus"],
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
	q := `SELECT * FROM "tmsVehicle" WHERE "tmsVehicleId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsVehicle" SET
			"tmsVehiclePlateNumber" = COALESCE($2, "tmsVehiclePlateNumber"),
			"tmsVehicleName" = COALESCE($3, "tmsVehicleName"),
			"tmsVehicleStatus" = COALESCE($4, "tmsVehicleStatus"),
			"tmsVehicleCapacityKg" = COALESCE($5, "tmsVehicleCapacityKg"),
			"tmsVehicleFuelType" = COALESCE($6, "tmsVehicleFuelType"),
			"tmsVehicleForthtrackId" = COALESCE($7, "tmsVehicleForthtrackId"),
			"isActive" = COALESCE($8, "isActive")
		WHERE "tmsVehicleId" = $1 RETURNING *
	`, id, body["tmsVehiclePlateNumber"], body["tmsVehicleName"], body["tmsVehicleStatus"],
		body["tmsVehicleCapacityKg"], body["tmsVehicleFuelType"], body["tmsVehicleForthtrackId"], body["isActive"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "tmsVehicle" SET "isActive" = false WHERE "tmsVehicleId" = $1`, id)
	if err != nil {
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

	q := `SELECT * FROM "tmsShipment" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if status != "" {
		q += fmt.Sprintf(` AND "tmsShipmentStatus" = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("tmsShipmentNumber" ILIKE $%d OR "tmsShipmentCustomerName" ILIKE $%d)`, argIdx, argIdx+1)
		p := "%" + search + "%"
		args = append(args, p, p)
	}
	q += ` ORDER BY "tmsShipmentCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	countRow, err := db.QueryRow(r.Context(), h.pool, `
		SELECT COUNT(*) as cnt FROM "tmsShipment" WHERE "tmsShipmentNumber" LIKE $1
	`, prefix+"%")
	seq := 1
	if err == nil {
		if cnt, ok := countRow["cnt"].(int64); ok {
			seq = int(cnt) + 1
		}
	}
	number := fmt.Sprintf("%s%03d", prefix, seq)

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsShipment" ("tmsShipmentNumber", "tmsShipmentCustomerName", "tmsShipmentCustomerPhone", "tmsShipmentStatus",
			"tmsShipmentDate", "tmsShipmentVehicleId", "tmsShipmentDriverId", "tmsShipmentCreatedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
	`, number, body["tmsShipmentCustomerName"], body["tmsShipmentCustomerPhone"], body["tmsShipmentStatus"],
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
	q := `SELECT * FROM "tmsShipment" WHERE "tmsShipmentId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsShipment" SET
			"tmsShipmentCustomerName" = COALESCE($2, "tmsShipmentCustomerName"),
			"tmsShipmentCustomerPhone" = COALESCE($3, "tmsShipmentCustomerPhone"),
			"tmsShipmentStatus" = COALESCE($4, "tmsShipmentStatus"),
			"tmsShipmentDate" = COALESCE($5, "tmsShipmentDate"),
			"tmsShipmentVehicleId" = COALESCE($6, "tmsShipmentVehicleId"),
			"tmsShipmentDriverId" = COALESCE($7, "tmsShipmentDriverId")
		WHERE "tmsShipmentId" = $1 RETURNING *
	`, id, body["tmsShipmentCustomerName"], body["tmsShipmentCustomerPhone"], body["tmsShipmentStatus"],
		body["tmsShipmentDate"], body["tmsShipmentVehicleId"], body["tmsShipmentDriverId"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteShipment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "tmsShipment" SET "isActive" = false WHERE "tmsShipmentId" = $1`, id)
	if err != nil {
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsShipment" SET "tmsShipmentStatus" = $2
		WHERE "tmsShipmentId" = $1 RETURNING *
	`, id, body["tmsShipmentStatus"])
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

	q := `SELECT * FROM "tmsDelivery" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if shipmentId != "" {
		q += fmt.Sprintf(` AND "tmsDeliveryShipmentId" = $%d`, argIdx)
		args = append(args, shipmentId)
		argIdx++
	}
	q += ` ORDER BY "tmsDeliveryCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsDelivery" ("tmsDeliveryShipmentId", "tmsDeliveryStatus")
		VALUES ($1, $2) RETURNING *
	`, body["tmsDeliveryShipmentId"], body["tmsDeliveryStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "tmsDelivery" WHERE "tmsDeliveryId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsDelivery" SET
			"tmsDeliveryShipmentId" = COALESCE($2, "tmsDeliveryShipmentId"),
			"tmsDeliveryStatus" = COALESCE($3, "tmsDeliveryStatus")
		WHERE "tmsDeliveryId" = $1 RETURNING *
	`, id, body["tmsDeliveryShipmentId"], body["tmsDeliveryStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "tmsDelivery" SET "isActive" = false WHERE "tmsDeliveryId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Delivery Plans ----

func (h *Handler) ListDeliveryPlans(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")

	q := `SELECT * FROM "tmsDeliveryPlan" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if month != "" {
		q += fmt.Sprintf(` AND to_char("tmsDeliveryPlanDate", 'YYYY-MM') = $%d`, argIdx)
		args = append(args, month)
		argIdx++
	}
	q += ` ORDER BY "tmsDeliveryPlanDate" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsDeliveryPlan" ("tmsDeliveryPlanDate", "tmsDeliveryPlanStatus", "tmsDeliveryPlanCreatedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, body["tmsDeliveryPlanDate"], body["tmsDeliveryPlanStatus"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "tmsDeliveryPlan" WHERE "tmsDeliveryPlanId" = $1`, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsDeliveryPlan" SET
			"tmsDeliveryPlanDate" = COALESCE($2, "tmsDeliveryPlanDate"),
			"tmsDeliveryPlanStatus" = COALESCE($3, "tmsDeliveryPlanStatus")
		WHERE "tmsDeliveryPlanId" = $1 RETURNING *
	`, id, body["tmsDeliveryPlanDate"], body["tmsDeliveryPlanStatus"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDeliveryPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `DELETE FROM "tmsDeliveryPlan" WHERE "tmsDeliveryPlanId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListUnshippedSalesOrders(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrder"
		WHERE "bcSalesOrderStatus" != 'shipped'
		ORDER BY "bcSalesOrderNo"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) GetSalesOrderLines(w http.ResponseWriter, r *http.Request) {
	no := chi.URLParam(r, "no")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "bcSalesOrderLine"
		WHERE "bcSalesOrderLineDocumentNo" = $1 AND "bcSalesOrderLineOutstandingQuantity" > 0
		ORDER BY "bcSalesOrderLineLineNo"
	`, no)
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

	q := `SELECT * FROM "tmsFuelLog" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if vehicleId != "" {
		q += fmt.Sprintf(` AND "tmsFuelLogVehicleId" = $%d`, argIdx)
		args = append(args, vehicleId)
		argIdx++
	}
	q += ` ORDER BY "tmsFuelLogDate" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsFuelLog" ("tmsFuelLogVehicleId", "tmsFuelLogDate", "tmsFuelLogLiters", "tmsFuelLogPricePerLiter", "tmsFuelLogTotalCost")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, body["tmsFuelLogVehicleId"], body["tmsFuelLogDate"], body["tmsFuelLogLiters"],
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
	q := `SELECT * FROM "tmsFuelLog" WHERE "tmsFuelLogId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "tmsFuelLog" SET
			"tmsFuelLogVehicleId" = COALESCE($2, "tmsFuelLogVehicleId"),
			"tmsFuelLogDate" = COALESCE($3, "tmsFuelLogDate"),
			"tmsFuelLogLiters" = COALESCE($4, "tmsFuelLogLiters"),
			"tmsFuelLogPricePerLiter" = COALESCE($5, "tmsFuelLogPricePerLiter"),
			"tmsFuelLogTotalCost" = COALESCE($6, "tmsFuelLogTotalCost")
		WHERE "tmsFuelLogId" = $1 RETURNING *
	`, id, body["tmsFuelLogVehicleId"], body["tmsFuelLogDate"], body["tmsFuelLogLiters"],
		body["tmsFuelLogPricePerLiter"], body["tmsFuelLogTotalCost"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteFuelLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "tmsFuelLog" SET "isActive" = false WHERE "tmsFuelLogId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- GPS Logs ----

func (h *Handler) ListGpsLogs(w http.ResponseWriter, r *http.Request) {
	vehicleId := r.URL.Query().Get("vehicleId")
	date := r.URL.Query().Get("date")

	q := `SELECT * FROM "tmsGpsLog" WHERE 1=1`
	args := []any{}
	argIdx := 1

	if vehicleId != "" {
		q += fmt.Sprintf(` AND "tmsGpsLogVehicleId" = $%d`, argIdx)
		args = append(args, vehicleId)
		argIdx++
	}
	if date != "" {
		q += fmt.Sprintf(` AND "tmsGpsLogRecordedAt"::date = $%d`, argIdx)
		args = append(args, date)
		argIdx++
	}
	q += ` ORDER BY "tmsGpsLogRecordedAt" DESC LIMIT 1000`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "tmsGpsLog" ("tmsGpsLogVehicleId", "tmsGpsLogLatitude", "tmsGpsLogLongitude", "tmsGpsLogSpeed", "tmsGpsLogRecordedAt")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, body["tmsGpsLogVehicleId"], body["tmsGpsLogLatitude"], body["tmsGpsLogLongitude"],
		body["tmsGpsLogSpeed"], body["tmsGpsLogRecordedAt"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) LatestGpsLogs(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT DISTINCT ON ("tmsGpsLogVehicleId") *
		FROM "tmsGpsLog"
		ORDER BY "tmsGpsLogVehicleId", "tmsGpsLogRecordedAt" DESC
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	vehicles, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "tmsVehicle" WHERE "isActive" = true`)
	shipments, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "tmsShipment" WHERE "isActive" = true`)
	fuelLogs, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "tmsFuelLog" WHERE "isActive" = true`)

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
	vehicles, _ := db.QueryRows(r.Context(), h.pool, `SELECT count(*) as total, count(*) FILTER (WHERE "tmsVehicleStatus"='available') as available FROM "tmsVehicle" WHERE "isActive"=true`)
	shipments, _ := db.QueryRows(r.Context(), h.pool, `SELECT "tmsShipmentStatus", count(*) as cnt FROM "tmsShipment" WHERE "isActive"=true GROUP BY "tmsShipmentStatus"`)

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
