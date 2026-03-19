package it

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- Assets ----

func (h *Handler) ListAssets(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListAssets(r.Context(), search, sa)
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
	data, err := h.store.CreateAsset(r.Context(),
		body["itAssetName"], body["itAssetTag"], body["itAssetCategory"], body["itAssetBrand"],
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
	data, err := h.store.GetAsset(r.Context(), id, sa)
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
	data, err := h.store.UpdateAsset(r.Context(),
		id, body["itAssetName"], body["itAssetTag"], body["itAssetCategory"], body["itAssetBrand"],
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
	if err := h.store.DeleteAsset(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Dev Requests ----

func (h *Handler) ListDevRequests(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListDevRequests(r.Context(), search, sa)
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
	data, err := h.store.CreateDevRequest(r.Context(),
		body["itDevRequestNo"], body["itDevRequestTitle"], body["itDevRequestDescription"],
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
	data, err := h.store.GetDevRequest(r.Context(), id, sa)
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
	data, err := h.store.UpdateDevRequest(r.Context(),
		id, body["itDevRequestNo"], body["itDevRequestTitle"], body["itDevRequestDescription"],
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
	if err := h.store.DeleteDevRequest(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Progress Logs ----

func (h *Handler) ListProgressLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := h.store.ListProgressLogs(r.Context(), id)
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
	log, err := h.store.CreateProgressLog(r.Context(), id,
		body["itDevProgressLogProgress"], body["itDevProgressLogDescription"], body["itDevProgressLogCreatedBy"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update the parent dev request progress and status
	progress, _ := body["itDevProgressLogProgress"].(float64)
	if progress >= 100 {
		_ = h.store.UpdateDevRequestCompleted(r.Context(), id, body["itDevProgressLogProgress"])
	} else if progress > 0 {
		_ = h.store.UpdateDevRequestInProgress(r.Context(), id, body["itDevProgressLogProgress"])
	} else {
		_ = h.store.UpdateDevRequestProgress(r.Context(), id, body["itDevProgressLogProgress"])
	}

	response.Created(w, log)
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	assets, err := h.store.ListActiveAssets(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	devRequests, err := h.store.ListActiveDevRequests(ctx)
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
