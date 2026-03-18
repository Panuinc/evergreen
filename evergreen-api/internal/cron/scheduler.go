package cron

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	robfigcron "github.com/robfig/cron/v3"

	"github.com/evergreen/api/internal/bc"
	"github.com/evergreen/api/internal/config"
	syncpkg "github.com/evergreen/api/internal/sync"
)

// Scheduler manages background cron jobs.
type Scheduler struct {
	cron *robfigcron.Cron
}

// NewScheduler creates and starts the cron scheduler.
func NewScheduler(cfg *config.Config, pool *pgxpool.Pool, bcClient *bc.Client) *Scheduler {
	c := robfigcron.New()

	syncEngine := syncpkg.NewSyncEngine(pool, bcClient)

	// BC incremental sync every 5 minutes
	_, _ = c.AddFunc("@every 5m", func() {
		slog.Info("cron: starting BC incremental sync")
		ctx := context.Background()
		syncEngine.RunSync(ctx, "incremental", func(event, data string) {
			slog.Info("bc-sync", "event", event, "data", data)
		})
		slog.Info("cron: BC sync completed")
	})

	// ForthTrack GPS sync every 1 minute
	// _, _ = c.AddFunc("@every 1m", func() { ... }) // Phase 3 later

	// Follow-up processing every 10 minutes
	// _, _ = c.AddFunc("@every 10m", func() { ... }) // Phase 5 later

	c.Start()
	slog.Info("cron scheduler started", "jobs", len(c.Entries()))

	return &Scheduler{cron: c}
}

// Stop gracefully stops the scheduler.
func (s *Scheduler) Stop() {
	s.cron.Stop()
	slog.Info("cron scheduler stopped")
}
