package sync

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/evergreen/api/internal/config"
	"github.com/evergreen/api/internal/external"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler serves the /sync routes.
type Handler struct {
	engine     *SyncEngine
	cfg        *config.Config
	pool       *pgxpool.Pool
	forthtrack *external.ForthTrackClient

	mu       sync.Mutex
	lockTime *time.Time
}

const lockTTL = 5 * time.Minute

// NewHandler creates a new sync Handler.
func NewHandler(engine *SyncEngine, cfg *config.Config, pool *pgxpool.Pool) *Handler {
	var ft *external.ForthTrackClient
	if cfg.ForthTrackLoginURL != "" {
		ft = external.NewForthTrackClient(cfg.ForthTrackLoginURL, cfg.ForthTrackAPIBase,
			cfg.ForthTrackClientID, cfg.ForthTrackClientSecret, cfg.ForthTrackUsername, cfg.ForthTrackPassword)
	}
	return &Handler{engine: engine, cfg: cfg, pool: pool, forthtrack: ft}
}

// Routes returns a chi.Router mounted under /sync.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/bc", h.handleBCSync)
	r.Get("/forthtrack", h.handleForthTrackSync)
	return r
}

// handleBCSync validates auth, manages the sync lock, and runs the sync.
func (h *Handler) handleBCSync(w http.ResponseWriter, r *http.Request) {
	// Auth check
	isDev := h.cfg.Port == "3001" // simple dev heuristic; adjust as needed
	if !isDev {
		authHeader := r.Header.Get("Authorization")
		expected := "Bearer " + h.cfg.CronSecret
		if authHeader != expected {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}
	}

	// Lock check
	h.mu.Lock()
	if h.lockTime != nil && time.Since(*h.lockTime) < lockTTL {
		lockedSince := h.lockTime.Format(time.RFC3339)
		h.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusTooManyRequests)
		fmt.Fprintf(w, `{"error":"Sync is already running","lockedSince":%q}`, lockedSince)
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
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
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
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "ForthTrack not configured"})
		return
	}

	data, err := h.forthtrack.FetchTracking()
	if err != nil {
		slog.Error("ForthTrack fetch failed", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": err.Error()})
		return
	}

	// Get vehicle mapping (forthtrackId/plateNumber → vehicleId)
	vehicles, _ := h.pool.Query(r.Context(), `SELECT "tmsVehicleId","tmsVehicleForthtrackId","tmsVehiclePlateNumber" FROM "tmsVehicle" WHERE "isActive"=true`)
	vehicleMap := map[string]string{} // forthtrackId → vehicleId
	plateMap := map[string]string{}   // plateNumber → vehicleId
	if vehicles != nil {
		defer vehicles.Close()
		for vehicles.Next() {
			var vid, ftid, plate *string
			vehicles.Scan(&vid, &ftid, &plate)
			if vid != nil && ftid != nil && *ftid != "" {
				vehicleMap[*ftid] = *vid
			}
			if vid != nil && plate != nil && *plate != "" {
				plateMap[*plate] = *vid
			}
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

		_, err := h.pool.Exec(r.Context(), `
			INSERT INTO "tmsGpsLog" ("tmsGpsLogVehicleId","tmsGpsLogLatitude","tmsGpsLogLongitude","tmsGpsLogSpeed",
				"tmsGpsLogEngine","tmsGpsLogDriver","tmsGpsLogAddress","tmsGpsLogFuel","tmsGpsLogForthtrackId","tmsGpsLogSource","tmsGpsLogRecordedAt")
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'forthtrack',now())
			ON CONFLICT ("tmsGpsLogForthtrackId","tmsGpsLogRecordedAt") DO NOTHING
		`, vehicleID, lat, lng, speed, d["engine"], d["driver"], d["address"], d["fuel"], gpsID)
		if err == nil {
			synced++
		}
	}

	slog.Info("ForthTrack sync completed", "fetched", len(data), "synced", synced)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"ok": true, "vehicles": len(data), "synced": synced})
}
