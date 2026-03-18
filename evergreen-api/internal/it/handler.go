package it

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

	r.Route("/assets", func(r chi.Router) {
		r.Get("/", h.ListAssets)
		r.Post("/", h.CreateAsset)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetAsset)
			r.Put("/", h.UpdateAsset)
			r.Delete("/", h.DeleteAsset)
		})
	})

	r.Route("/devRequests", func(r chi.Router) {
		r.Get("/", h.ListDevRequests)
		r.Post("/", h.CreateDevRequest)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetDevRequest)
			r.Put("/", h.UpdateDevRequest)
			r.Delete("/", h.DeleteDevRequest)
			r.Route("/progress", func(r chi.Router) {
				r.Get("/", h.ListProgressLogs)
				r.Post("/", h.CreateProgressLog)
			})
		})
	})

	r.Get("/dashboard", h.Dashboard)

	return r
}

// ---- Assets ----

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")

	q := `SELECT * FROM "itAsset" WHERE 1=1`
	var args []any
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("itAssetName" ILIKE $%d OR "itAssetTag" ILIKE $%d OR "itAssetBrand" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	q += ` ORDER BY "itAssetCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "itAsset" ("itAssetName", "itAssetTag", "itAssetCategory", "itAssetBrand", "itAssetModel", "itAssetSerialNumber", "itAssetStatus", "itAssetAssignedTo", "itAssetPurchaseDate", "itAssetWarrantyExpiry", "itAssetLocation", "itAssetNotes")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
	`, body["itAssetName"], body["itAssetTag"], body["itAssetCategory"], body["itAssetBrand"],
		body["itAssetModel"], body["itAssetSerialNumber"], body["itAssetStatus"], body["itAssetAssignedTo"],
		body["itAssetPurchaseDate"], body["itAssetWarrantyExpiry"], body["itAssetLocation"], body["itAssetNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetAsset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "itAsset" WHERE "itAssetId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
	if err != nil {
		response.NotFound(w, "ไม่พบอุปกรณ์")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateAsset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "itAsset" SET
			"itAssetName" = COALESCE($2, "itAssetName"),
			"itAssetTag" = COALESCE($3, "itAssetTag"),
			"itAssetCategory" = COALESCE($4, "itAssetCategory"),
			"itAssetBrand" = COALESCE($5, "itAssetBrand"),
			"itAssetModel" = COALESCE($6, "itAssetModel"),
			"itAssetSerialNumber" = COALESCE($7, "itAssetSerialNumber"),
			"itAssetStatus" = COALESCE($8, "itAssetStatus"),
			"itAssetAssignedTo" = COALESCE($9, "itAssetAssignedTo"),
			"itAssetPurchaseDate" = COALESCE($10, "itAssetPurchaseDate"),
			"itAssetWarrantyExpiry" = COALESCE($11, "itAssetWarrantyExpiry"),
			"itAssetLocation" = COALESCE($12, "itAssetLocation"),
			"itAssetNotes" = COALESCE($13, "itAssetNotes")
		WHERE "itAssetId" = $1 RETURNING *
	`, id, body["itAssetName"], body["itAssetTag"], body["itAssetCategory"], body["itAssetBrand"],
		body["itAssetModel"], body["itAssetSerialNumber"], body["itAssetStatus"], body["itAssetAssignedTo"],
		body["itAssetPurchaseDate"], body["itAssetWarrantyExpiry"], body["itAssetLocation"], body["itAssetNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteAsset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "itAsset" SET "isActive" = false WHERE "itAssetId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Dev Requests ----

func (h *Handler) ListDevRequests(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")

	q := `SELECT * FROM "itDevRequest" WHERE 1=1`
	var args []any
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("itDevRequestNo" ILIKE $%d OR "itDevRequestTitle" ILIKE $%d OR "itDevRequestRequestedBy" ILIKE $%d OR "itDevRequestAssignedTo" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2, argIdx+3)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}
	q += ` ORDER BY "itDevRequestCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateDevRequest(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "itDevRequest" ("itDevRequestNo", "itDevRequestTitle", "itDevRequestDescription", "itDevRequestRequestedBy", "itDevRequestAssignedTo", "itDevRequestStatus", "itDevRequestPriority", "itDevRequestDueDate", "itDevRequestStartDate", "itDevRequestNotes")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
	`, body["itDevRequestNo"], body["itDevRequestTitle"], body["itDevRequestDescription"],
		body["itDevRequestRequestedBy"], body["itDevRequestAssignedTo"], body["itDevRequestStatus"],
		body["itDevRequestPriority"], body["itDevRequestDueDate"], body["itDevRequestStartDate"], body["itDevRequestNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetDevRequest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "itDevRequest" WHERE "itDevRequestId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
	if err != nil {
		response.NotFound(w, "ไม่พบคำขอพัฒนา")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateDevRequest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "itDevRequest" SET
			"itDevRequestNo" = COALESCE($2, "itDevRequestNo"),
			"itDevRequestTitle" = COALESCE($3, "itDevRequestTitle"),
			"itDevRequestDescription" = COALESCE($4, "itDevRequestDescription"),
			"itDevRequestRequestedBy" = COALESCE($5, "itDevRequestRequestedBy"),
			"itDevRequestAssignedTo" = COALESCE($6, "itDevRequestAssignedTo"),
			"itDevRequestStatus" = COALESCE($7, "itDevRequestStatus"),
			"itDevRequestPriority" = COALESCE($8, "itDevRequestPriority"),
			"itDevRequestDueDate" = COALESCE($9, "itDevRequestDueDate"),
			"itDevRequestStartDate" = COALESCE($10, "itDevRequestStartDate"),
			"itDevRequestNotes" = COALESCE($11, "itDevRequestNotes")
		WHERE "itDevRequestId" = $1 RETURNING *
	`, id, body["itDevRequestNo"], body["itDevRequestTitle"], body["itDevRequestDescription"],
		body["itDevRequestRequestedBy"], body["itDevRequestAssignedTo"], body["itDevRequestStatus"],
		body["itDevRequestPriority"], body["itDevRequestDueDate"], body["itDevRequestStartDate"], body["itDevRequestNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDevRequest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "itDevRequest" SET "isActive" = false WHERE "itDevRequestId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Progress Logs ----

func (h *Handler) ListProgressLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "itDevProgressLog"
		WHERE "itDevProgressLogRequestId" = $1
		ORDER BY "itDevProgressLogCreatedAt" DESC
	`, id)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateProgressLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	// Insert the progress log
	log, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "itDevProgressLog" ("itDevProgressLogRequestId", "itDevProgressLogProgress", "itDevProgressLogDescription", "itDevProgressLogCreatedBy")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, id, body["itDevProgressLogProgress"], body["itDevProgressLogDescription"], body["itDevProgressLogCreatedBy"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update the parent dev request progress and status
	progress, _ := body["itDevProgressLogProgress"].(float64)
	if progress >= 100 {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE "itDevRequest" SET "itDevRequestProgress" = $2, "itDevRequestStatus" = 'completed', "itDevRequestCompletedAt" = now()
			WHERE "itDevRequestId" = $1
		`, id, body["itDevProgressLogProgress"])
	} else if progress > 0 {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE "itDevRequest" SET "itDevRequestProgress" = $2, "itDevRequestStatus" = 'in_progress'
			WHERE "itDevRequestId" = $1
		`, id, body["itDevProgressLogProgress"])
	} else {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE "itDevRequest" SET "itDevRequestProgress" = $2
			WHERE "itDevRequestId" = $1
		`, id, body["itDevProgressLogProgress"])
	}

	response.Created(w, log)
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	assets, err := db.QueryRows(ctx, h.pool, `SELECT * FROM "itAsset" WHERE "isActive" = true`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	devRequests, err := db.QueryRows(ctx, h.pool, `SELECT * FROM "itDevRequest" WHERE "isActive" = true`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	// Asset aggregations
	totalAssets := len(assets)
	assetByCategory := map[string]int{}
	for _, a := range assets {
		cat := "other"
		if c, ok := a["itAssetCategory"].(string); ok && c != "" {
			cat = c
		}
		assetByCategory[cat]++
	}

	// Dev request aggregations
	totalDevRequests := len(devRequests)
	devByStatus := map[string]int{}
	newThisMonth := 0
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)

	for _, d := range devRequests {
		status := "pending"
		if s, ok := d["itDevRequestStatus"].(string); ok && s != "" {
			status = s
		}
		devByStatus[status]++
		if createdAt, ok := d["itDevRequestCreatedAt"].(time.Time); ok && createdAt.After(monthStart) {
			newThisMonth++
		}
	}

	categoryList := make([]map[string]any, 0, len(assetByCategory))
	for cat, count := range assetByCategory {
		categoryList = append(categoryList, map[string]any{"category": cat, "count": count})
	}

	response.OK(w, map[string]any{
		"totalAssets":      totalAssets,
		"assetByCategory":  categoryList,
		"totalDevRequests": totalDevRequests,
		"devByStatus":      devByStatus,
		"newThisMonth":     newThisMonth,
	})
}
