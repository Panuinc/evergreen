package sync

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/response"
)

// Handler serves the /sync routes.
type Handler struct {
	engine     *SyncEngine
	cfg        *config.Config
	store      *Store
	forthtrack *clients.ForthTrackClient

	mu       sync.Mutex
	lockTime *time.Time
}

const lockTTL = 5 * time.Minute

// NewHandler creates a new sync Handler.
func NewHandler(engine *SyncEngine, cfg *config.Config, pool *pgxpool.Pool) *Handler {
	var ft *clients.ForthTrackClient
	if cfg.ForthTrackLoginURL != "" {
		ft = clients.NewForthTrackClient(cfg.ForthTrackLoginURL, cfg.ForthTrackAPIBase,
			cfg.ForthTrackClientID, cfg.ForthTrackClientSecret, cfg.ForthTrackUsername, cfg.ForthTrackPassword)
	}
	return &Handler{engine: engine, cfg: cfg, store: NewStore(pool), forthtrack: ft}
}

// handleBCSync validates auth, manages the sync lock, and runs the sync.
func (h *Handler) handleBCSync(w http.ResponseWriter, r *http.Request) {
	// Auth check
	isDev := h.cfg.Port == "3001" // simple dev heuristic; adjust as needed
	if !isDev {
		authHeader := r.Header.Get("Authorization")
		expected := "Bearer " + h.cfg.CronSecret
		if authHeader != expected {
			response.Unauthorized(w, "Unauthorized")
			return
		}
	}

	// Lock check
	h.mu.Lock()
	if h.lockTime != nil && time.Since(*h.lockTime) < lockTTL {
		lockedSince := h.lockTime.Format(time.RFC3339)
		h.mu.Unlock()
		response.Error(w, http.StatusTooManyRequests, "Sync is already running: "+lockedSince)
		return
	}
	now := time.Now()
	h.lockTime = &now
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		h.lockTime = nil
		h.mu.Unlock()
	}()

	// Query params
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "incremental"
	}
	stream := r.URL.Query().Get("stream") != "0"

	if !stream {
		// Non-streaming: collect result and return JSON
		var result string
		h.engine.RunSync(r.Context(), mode, func(event, data string) {
			if event == "done" {
				result = data
			}
		})
		w.Header().Set("Content-Type", "application/json")
		if result == "" {
			result = `{"ok":true}`
		}
		w.Write([]byte(result))
		return
	}

	// SSE streaming
	flusher, ok := w.(http.Flusher)
	if !ok {
		response.Error(w, http.StatusInternalServerError, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	h.engine.RunSync(r.Context(), mode, func(event, data string) {
		// data is already JSON from RunSync
		fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, data)
		flusher.Flush()
	})
}

// handleForthTrackSync is a placeholder for ForthTrack GPS sync.
func (h *Handler) handleForthTrackSync(w http.ResponseWriter, r *http.Request) {
	if h.forthtrack == nil {
		response.OK(w, map[string]any{"ok": false, "error": "ForthTrack not configured"})
		return
	}

	data, err := h.forthtrack.FetchTracking()
	if err != nil {
		logger.Error("ForthTrack fetch failed", "error", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get vehicle mapping (forthtrackId/plateNumber → vehicleId)
	mappings, _ := h.store.GetActiveVehicles(r.Context())
	vehicleMap := map[string]string{} // forthtrackId → vehicleId
	plateMap := map[string]string{}   // plateNumber → vehicleId
	for _, m := range mappings {
		if m.ForthtrackID != "" {
			vehicleMap[m.ForthtrackID] = m.VehicleID
		}
		if m.PlateNumber != "" {
			plateMap[m.PlateNumber] = m.VehicleID
		}
	}

	synced := 0
	for _, d := range data {
		gpsID, _ := d["gpsID"].(string)
		plate, _ := d["plateNumber"].(string)

		vehicleID := vehicleMap[gpsID]
		if vehicleID == "" {
			vehicleID = plateMap[plate]
		}
		if vehicleID == "" {
			continue
		}

		lat, _ := d["latitude"].(float64)
		lng, _ := d["longitude"].(float64)
		speed, _ := d["speed"].(float64)

		err := h.store.UpsertGpsLog(r.Context(), vehicleID, lat, lng, speed, d["engine"], d["driver"], d["address"], d["fuel"], gpsID)
		if err == nil {
			synced++
		}
	}

	logger.Info("ForthTrack sync completed", "fetched", len(data), "synced", synced)
	response.OK(w, map[string]any{"ok": true, "vehicles": len(data), "synced": synced})
}
