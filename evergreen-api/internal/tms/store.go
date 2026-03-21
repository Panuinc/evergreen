package tms

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Vehicles ----

func (s *Store) ListVehicles(ctx context.Context, isSuperAdmin bool, isActive, search string) ([]map[string]any, error) {
	q := `SELECT "tmsVehicleId", "tmsVehiclePlateNumber", "tmsVehicleName",
		"tmsVehicleWidth", "tmsVehicleLength", "tmsVehicleHeight",
		"tmsVehicleCapacityKg", "tmsVehicleFuelType", "tmsVehicleFuelConsumptionRate",
		"tmsVehicleStatus", "tmsVehicleForthtrackRef", "tmsVehicleCreatedAt", "isActive"
		FROM "tmsVehicle" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
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
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetVehicle(ctx context.Context, id string, isSuperAdmin bool) (map[string]any, error) {
	q := `SELECT "tmsVehicleId", "tmsVehiclePlateNumber", "tmsVehicleName",
		"tmsVehicleWidth", "tmsVehicleLength", "tmsVehicleHeight",
		"tmsVehicleCapacityKg", "tmsVehicleFuelType", "tmsVehicleFuelConsumptionRate",
		"tmsVehicleStatus", "tmsVehicleForthtrackRef", "tmsVehicleCreatedAt", "isActive"
		FROM "tmsVehicle" WHERE "tmsVehicleId" = $1`
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) CreateVehicle(ctx context.Context, plateNumber, name, status, capacityKg, fuelType, forthtrackId any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsVehicle" ("tmsVehiclePlateNumber", "tmsVehicleName", "tmsVehicleStatus", "tmsVehicleCapacityKg", "tmsVehicleFuelType", "tmsVehicleForthtrackRef")
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
	`, plateNumber, name, status, capacityKg, fuelType, forthtrackId)
}

func (s *Store) UpdateVehicle(ctx context.Context, id, plateNumber, name, status, capacityKg, fuelType, forthtrackId, isActive any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsVehicle" SET
			"tmsVehiclePlateNumber" = COALESCE($2, "tmsVehiclePlateNumber"),
			"tmsVehicleName" = COALESCE($3, "tmsVehicleName"),
			"tmsVehicleStatus" = COALESCE($4, "tmsVehicleStatus"),
			"tmsVehicleCapacityKg" = COALESCE($5, "tmsVehicleCapacityKg"),
			"tmsVehicleFuelType" = COALESCE($6, "tmsVehicleFuelType"),
			"tmsVehicleForthtrackRef" = COALESCE($7, "tmsVehicleForthtrackRef"),
			"isActive" = COALESCE($8, "isActive")
		WHERE "tmsVehicleId" = $1 RETURNING *
	`, id, plateNumber, name, status, capacityKg, fuelType, forthtrackId, isActive)
}

func (s *Store) SoftDeleteVehicle(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "tmsVehicle" SET "isActive" = false WHERE "tmsVehicleId" = $1`, id)
	return err
}

// ---- Shipments ----

func (s *Store) ListShipments(ctx context.Context, isSuperAdmin bool, status, search string) ([]map[string]any, error) {
	q := `SELECT "tmsShipmentId", "tmsShipmentNumber", "tmsShipmentDate",
		"tmsShipmentCustomerName", "tmsShipmentCustomerPhone", "tmsShipmentCustomerAddress",
		"tmsShipmentDestination", "tmsShipmentVehicleId", "tmsShipmentDriverId",
		"tmsShipmentDriverWage", "tmsShipmentAssistants", "tmsShipmentAssistantId",
		"tmsShipmentAssistantWage", "tmsShipmentSalesOrderRef", "tmsShipmentItemsSummary",
		"tmsShipmentDistance", "tmsShipmentFuelPricePerLiter", "tmsShipmentFuelCost",
		"tmsShipmentExtras", "tmsShipmentNotes", "tmsShipmentStatus", "tmsShipmentStops",
		"tmsShipmentEstimatedArrival", "tmsShipmentCreatedAt", "isActive"
		FROM "tmsShipment" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
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
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetShipment(ctx context.Context, id string, isSuperAdmin bool) (map[string]any, error) {
	q := `SELECT "tmsShipmentId", "tmsShipmentNumber", "tmsShipmentDate",
		"tmsShipmentCustomerName", "tmsShipmentCustomerPhone", "tmsShipmentCustomerAddress",
		"tmsShipmentDestination", "tmsShipmentVehicleId", "tmsShipmentDriverId",
		"tmsShipmentDriverWage", "tmsShipmentAssistants", "tmsShipmentAssistantId",
		"tmsShipmentAssistantWage", "tmsShipmentSalesOrderRef", "tmsShipmentItemsSummary",
		"tmsShipmentDistance", "tmsShipmentFuelPricePerLiter", "tmsShipmentFuelCost",
		"tmsShipmentExtras", "tmsShipmentNotes", "tmsShipmentStatus", "tmsShipmentStops",
		"tmsShipmentEstimatedArrival", "tmsShipmentCreatedAt", "isActive"
		FROM "tmsShipment" WHERE "tmsShipmentId" = $1`
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) CountShipmentsByPrefix(ctx context.Context, prefix string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT COUNT(*) as cnt FROM "tmsShipment" WHERE "tmsShipmentNumber" LIKE $1
	`, prefix+"%")
}

func (s *Store) CreateShipment(ctx context.Context, number, customerName, customerPhone, status, date, vehicleId, driverId, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsShipment" ("tmsShipmentNumber", "tmsShipmentCustomerName", "tmsShipmentCustomerPhone", "tmsShipmentStatus",
			"tmsShipmentDate", "tmsShipmentVehicleId", "tmsShipmentDriverId", "tmsShipmentCreatedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
	`, number, customerName, customerPhone, status, date, vehicleId, driverId, createdBy)
}

func (s *Store) UpdateShipment(ctx context.Context, id, customerName, customerPhone, status, date, vehicleId, driverId any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsShipment" SET
			"tmsShipmentCustomerName" = COALESCE($2, "tmsShipmentCustomerName"),
			"tmsShipmentCustomerPhone" = COALESCE($3, "tmsShipmentCustomerPhone"),
			"tmsShipmentStatus" = COALESCE($4, "tmsShipmentStatus"),
			"tmsShipmentDate" = COALESCE($5, "tmsShipmentDate"),
			"tmsShipmentVehicleId" = COALESCE($6, "tmsShipmentVehicleId"),
			"tmsShipmentDriverId" = COALESCE($7, "tmsShipmentDriverId")
		WHERE "tmsShipmentId" = $1 RETURNING *
	`, id, customerName, customerPhone, status, date, vehicleId, driverId)
}

func (s *Store) UpdateShipmentStatus(ctx context.Context, id, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsShipment" SET "tmsShipmentStatus" = $2
		WHERE "tmsShipmentId" = $1 RETURNING *
	`, id, status)
}

func (s *Store) SoftDeleteShipment(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "tmsShipment" SET "isActive" = false WHERE "tmsShipmentId" = $1`, id)
	return err
}

// ---- Deliveries ----

func (s *Store) ListDeliveries(ctx context.Context, isSuperAdmin bool, shipmentId string) ([]map[string]any, error) {
	q := `SELECT "tmsDeliveryId", "tmsDeliveryShipmentId", "tmsDeliveryReceiverName",
		"tmsDeliveryReceiverPhone", "tmsDeliveryStatus", "tmsDeliveryNotes",
		"tmsDeliverySignatureUrl", "tmsDeliveryPhotoUrls", "tmsDeliveryReceivedAt",
		"tmsDeliveryItem", "tmsDeliveryCreatedAt", "isActive"
		FROM "tmsDelivery" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if shipmentId != "" {
		q += fmt.Sprintf(` AND "tmsDeliveryShipmentId" = $%d`, argIdx)
		args = append(args, shipmentId)
	}
	q += ` ORDER BY "tmsDeliveryCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetDelivery(ctx context.Context, id string, isSuperAdmin bool) (map[string]any, error) {
	q := `SELECT "tmsDeliveryId", "tmsDeliveryShipmentId", "tmsDeliveryReceiverName",
		"tmsDeliveryReceiverPhone", "tmsDeliveryStatus", "tmsDeliveryNotes",
		"tmsDeliverySignatureUrl", "tmsDeliveryPhotoUrls", "tmsDeliveryReceivedAt",
		"tmsDeliveryItem", "tmsDeliveryCreatedAt", "isActive"
		FROM "tmsDelivery" WHERE "tmsDeliveryId" = $1`
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) CreateDelivery(ctx context.Context, shipmentId, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsDelivery" ("tmsDeliveryShipmentId", "tmsDeliveryStatus")
		VALUES ($1, $2) RETURNING *
	`, shipmentId, status)
}

func (s *Store) UpdateDelivery(ctx context.Context, id, shipmentId, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsDelivery" SET
			"tmsDeliveryShipmentId" = COALESCE($2, "tmsDeliveryShipmentId"),
			"tmsDeliveryStatus" = COALESCE($3, "tmsDeliveryStatus")
		WHERE "tmsDeliveryId" = $1 RETURNING *
	`, id, shipmentId, status)
}

func (s *Store) SoftDeleteDelivery(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "tmsDelivery" SET "isActive" = false WHERE "tmsDeliveryId" = $1`, id)
	return err
}

// ---- Delivery Plans ----

func (s *Store) ListDeliveryPlans(ctx context.Context, month string) ([]map[string]any, error) {
	q := `SELECT "tmsDeliveryPlanId", "tmsDeliveryPlanDate", "tmsDeliveryPlanStatus",
		"tmsDeliveryPlanPriority", "tmsDeliveryPlanNotes", "tmsDeliveryPlanAddress",
		"tmsDeliveryPlanLat", "tmsDeliveryPlanLng", "tmsDeliveryPlanItem",
		"tmsDeliveryPlanShipmentId", "tmsDeliveryPlanShipmentNumber", "tmsDeliveryPlanCreatedBy"
		FROM "tmsDeliveryPlan" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if month != "" {
		q += fmt.Sprintf(` AND to_char("tmsDeliveryPlanDate", 'YYYY-MM') = $%d`, argIdx)
		args = append(args, month)
	}
	q += ` ORDER BY "tmsDeliveryPlanDate" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateDeliveryPlan(ctx context.Context, date, status, createdBy any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsDeliveryPlan" ("tmsDeliveryPlanDate", "tmsDeliveryPlanStatus", "tmsDeliveryPlanCreatedBy")
		VALUES ($1, $2, $3) RETURNING *
	`, date, status, createdBy)
}

func (s *Store) GetDeliveryPlan(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "tmsDeliveryPlanId", "tmsDeliveryPlanDate", "tmsDeliveryPlanStatus",
		"tmsDeliveryPlanPriority", "tmsDeliveryPlanNotes", "tmsDeliveryPlanAddress",
		"tmsDeliveryPlanLat", "tmsDeliveryPlanLng", "tmsDeliveryPlanItem",
		"tmsDeliveryPlanShipmentId", "tmsDeliveryPlanShipmentNumber", "tmsDeliveryPlanCreatedBy"
		FROM "tmsDeliveryPlan" WHERE "tmsDeliveryPlanId" = $1`, id)
}

func (s *Store) UpdateDeliveryPlan(ctx context.Context, id, date, status any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsDeliveryPlan" SET
			"tmsDeliveryPlanDate" = COALESCE($2, "tmsDeliveryPlanDate"),
			"tmsDeliveryPlanStatus" = COALESCE($3, "tmsDeliveryPlanStatus")
		WHERE "tmsDeliveryPlanId" = $1 RETURNING *
	`, id, date, status)
}

func (s *Store) DeleteDeliveryPlan(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM "tmsDeliveryPlan" WHERE "tmsDeliveryPlanId" = $1`, id)
	return err
}

func (s *Store) ListUnshippedSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName", "bcSalesOrderCompletelyShipped"
		FROM "bcSalesOrder"
		WHERE "bcSalesOrderCompletelyShipped" IS DISTINCT FROM 'true'
		ORDER BY "bcSalesOrderNoValue"
	`)
}

func (s *Store) GetSalesOrderLines(ctx context.Context, no string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcSalesOrderLineLineNo", "bcSalesOrderLineDocumentNo",
		"bcSalesOrderLineNoValue", "bcSalesOrderLineDescriptionValue",
		"bcSalesOrderLineUnitOfMeasureCode", "bcSalesOrderLineQuantityValue",
		"bcSalesOrderLineQuantityShipped", "bcSalesOrderLineOutstandingQuantity"
		FROM "bcSalesOrderLine"
		WHERE "bcSalesOrderLineDocumentNo" = $1 AND "bcSalesOrderLineOutstandingQuantity" > 0
		ORDER BY "bcSalesOrderLineLineNo"
	`, no)
}

// ---- Fuel Logs ----

func (s *Store) ListFuelLogs(ctx context.Context, isSuperAdmin bool, vehicleId string) ([]map[string]any, error) {
	q := `SELECT "tmsFuelLogId", "tmsFuelLogVehicleId", "tmsFuelLogDate",
		"tmsFuelLogFuelType", "tmsFuelLogLiters", "tmsFuelLogPricePerLiter",
		"tmsFuelLogTotalCost", "tmsFuelLogReceiptUrl", "tmsFuelLogCreatedAt", "isActive"
		FROM "tmsFuelLog" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if vehicleId != "" {
		q += fmt.Sprintf(` AND "tmsFuelLogVehicleId" = $%d`, argIdx)
		args = append(args, vehicleId)
	}
	q += ` ORDER BY "tmsFuelLogDate" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetFuelLog(ctx context.Context, id string, isSuperAdmin bool) (map[string]any, error) {
	q := `SELECT "tmsFuelLogId", "tmsFuelLogVehicleId", "tmsFuelLogDate",
		"tmsFuelLogFuelType", "tmsFuelLogLiters", "tmsFuelLogPricePerLiter",
		"tmsFuelLogTotalCost", "tmsFuelLogReceiptUrl", "tmsFuelLogCreatedAt", "isActive"
		FROM "tmsFuelLog" WHERE "tmsFuelLogId" = $1`
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	return db.QueryRow(ctx, s.pool, q, id)
}

func (s *Store) CreateFuelLog(ctx context.Context, vehicleId, date, liters, pricePerLiter, totalCost any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsFuelLog" ("tmsFuelLogVehicleId", "tmsFuelLogDate", "tmsFuelLogLiters", "tmsFuelLogPricePerLiter", "tmsFuelLogTotalCost")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, vehicleId, date, liters, pricePerLiter, totalCost)
}

func (s *Store) UpdateFuelLog(ctx context.Context, id, vehicleId, date, liters, pricePerLiter, totalCost any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "tmsFuelLog" SET
			"tmsFuelLogVehicleId" = COALESCE($2, "tmsFuelLogVehicleId"),
			"tmsFuelLogDate" = COALESCE($3, "tmsFuelLogDate"),
			"tmsFuelLogLiters" = COALESCE($4, "tmsFuelLogLiters"),
			"tmsFuelLogPricePerLiter" = COALESCE($5, "tmsFuelLogPricePerLiter"),
			"tmsFuelLogTotalCost" = COALESCE($6, "tmsFuelLogTotalCost")
		WHERE "tmsFuelLogId" = $1 RETURNING *
	`, id, vehicleId, date, liters, pricePerLiter, totalCost)
}

func (s *Store) SoftDeleteFuelLog(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "tmsFuelLog" SET "isActive" = false WHERE "tmsFuelLogId" = $1`, id)
	return err
}

// ---- GPS Logs ----

func (s *Store) ListGpsLogs(ctx context.Context, vehicleId, date string) ([]map[string]any, error) {
	q := `SELECT "tmsGpsLogId", "tmsGpsLogVehicleId", "tmsGpsLogLatitude",
		"tmsGpsLogLongitude", "tmsGpsLogSpeed", "tmsGpsLogRecordedAt", "tmsGpsLogSource"
		FROM "tmsGpsLog" WHERE 1=1`
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
	}
	q += ` ORDER BY "tmsGpsLogRecordedAt" DESC LIMIT 1000`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateGpsLog(ctx context.Context, vehicleId, latitude, longitude, speed, recordedAt any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "tmsGpsLog" ("tmsGpsLogVehicleId", "tmsGpsLogLatitude", "tmsGpsLogLongitude", "tmsGpsLogSpeed", "tmsGpsLogRecordedAt")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, vehicleId, latitude, longitude, speed, recordedAt)
}

func (s *Store) LatestGpsLogs(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT DISTINCT ON ("tmsGpsLogVehicleId")
		"tmsGpsLogId", "tmsGpsLogVehicleId", "tmsGpsLogLatitude",
		"tmsGpsLogLongitude", "tmsGpsLogSpeed", "tmsGpsLogRecordedAt", "tmsGpsLogSource"
		FROM "tmsGpsLog"
		ORDER BY "tmsGpsLogVehicleId", "tmsGpsLogRecordedAt" DESC
	`)
}

// ---- Dashboard ----

func (s *Store) DashboardVehicles(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "tmsVehicleId", "tmsVehicleName", "tmsVehiclePlateNumber", "tmsVehicleStatus" FROM "tmsVehicle" WHERE "isActive" = true`)
}

func (s *Store) DashboardShipments(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "tmsShipmentId", "tmsShipmentStatus", "tmsShipmentVehicleId", "tmsShipmentDate" FROM "tmsShipment" WHERE "isActive" = true`)
}

func (s *Store) DashboardFuelLogs(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "tmsFuelLogId", "tmsFuelLogTotalCost", "tmsFuelLogVehicleId", "tmsFuelLogDate" FROM "tmsFuelLog" WHERE "isActive" = true`)
}

func (s *Store) DashboardMonthlyShipments(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			to_char("tmsShipmentDate", 'YYYY-MM') AS "month",
			COUNT(*) AS "tmsShipmentCount"
		FROM "tmsShipment"
		WHERE "isActive" = true
		  AND "tmsShipmentDate" >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY to_char("tmsShipmentDate", 'YYYY-MM')
		ORDER BY "month" ASC
	`)
}

func (s *Store) DashboardFuelTrend(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			to_char("tmsFuelLogDate", 'YYYY-MM') AS "month",
			SUM("tmsFuelLogTotalCost") AS "tmsFuelLogTotalCost"
		FROM "tmsFuelLog"
		WHERE "isActive" = true
		  AND "tmsFuelLogDate" >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY to_char("tmsFuelLogDate", 'YYYY-MM')
		ORDER BY "month" ASC
	`)
}

func (s *Store) DashboardVehicleUtilization(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			v."tmsVehicleId",
			v."tmsVehicleName",
			v."tmsVehiclePlateNumber",
			COUNT(s."tmsShipmentId") AS "tmsShipmentCount"
		FROM "tmsVehicle" v
		LEFT JOIN "tmsShipment" s ON s."tmsShipmentVehicleId" = v."tmsVehicleId" AND s."isActive" = true
		WHERE v."isActive" = true
		GROUP BY v."tmsVehicleId", v."tmsVehicleName", v."tmsVehiclePlateNumber"
		ORDER BY "tmsShipmentCount" DESC
		LIMIT 10
	`)
}

func (s *Store) DashboardVehiclePerformance(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			v."tmsVehicleId",
			v."tmsVehicleName",
			v."tmsVehiclePlateNumber",
			v."tmsVehicleStatus",
			v."tmsVehicleFuelConsumptionRate",
			COALESCE(SUM(s."tmsShipmentDistance"), 0)       AS "tmsShipmentDistance",
			COUNT(DISTINCT s."tmsShipmentId")               AS "tmsShipmentCount",
			COALESCE(SUM(f."tmsFuelLogLiters"), 0)          AS "actualFuelLiters",
			COALESCE(SUM(f."tmsFuelLogTotalCost"), 0)       AS "actualFuelCost",
			CASE
				WHEN COALESCE(SUM(f."tmsFuelLogLiters"), 0) > 0
				THEN ROUND((COALESCE(SUM(s."tmsShipmentDistance"), 0) / COALESCE(SUM(f."tmsFuelLogLiters"), 1))::numeric, 2)
				ELSE NULL
			END                                             AS "actualRate",
			CASE
				WHEN COALESCE(v."tmsVehicleFuelConsumptionRate", 0) > 0
				THEN ROUND((COALESCE(SUM(s."tmsShipmentDistance"), 0) / v."tmsVehicleFuelConsumptionRate")::numeric, 2)
				ELSE 0
			END                                             AS "estimatedLiters",
			CASE
				WHEN COALESCE(v."tmsVehicleFuelConsumptionRate", 0) > 0
				     AND COALESCE(SUM(f."tmsFuelLogLiters"), 0) > 0
				THEN ROUND(
					(COALESCE(SUM(s."tmsShipmentDistance"), 0) / v."tmsVehicleFuelConsumptionRate")
					* (COALESCE(SUM(f."tmsFuelLogTotalCost"), 0) / COALESCE(SUM(f."tmsFuelLogLiters"), 1))::numeric, 2)
				ELSE 0
			END                                             AS "estimatedFuelCost"
		FROM "tmsVehicle" v
		LEFT JOIN "tmsShipment" s ON s."tmsShipmentVehicleId" = v."tmsVehicleId" AND s."isActive" = true
		LEFT JOIN "tmsFuelLog" f ON f."tmsFuelLogVehicleId" = v."tmsVehicleId" AND f."isActive" = true
		WHERE v."isActive" = true
		GROUP BY v."tmsVehicleId", v."tmsVehicleName", v."tmsVehiclePlateNumber", v."tmsVehicleStatus", v."tmsVehicleFuelConsumptionRate"
		ORDER BY "tmsShipmentCount" DESC
	`)
}

// ---- AI Analysis ----

func (s *Store) AiVehicleSummary(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT count(*) as total, count(*) FILTER (WHERE "tmsVehicleStatus"='available') as available FROM "tmsVehicle" WHERE "isActive"=true`)
}

func (s *Store) AiShipmentSummary(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "tmsShipmentStatus", count(*) as cnt FROM "tmsShipment" WHERE "isActive"=true GROUP BY "tmsShipmentStatus"`)
}
