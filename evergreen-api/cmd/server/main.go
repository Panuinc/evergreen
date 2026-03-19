package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/admin"
	"github.com/evergreen/api/internal/auth"
	"github.com/evergreen/api/internal/bc"
	"github.com/evergreen/api/internal/bci"
	"github.com/evergreen/api/internal/chat"
	"github.com/evergreen/api/internal/config"
	cronpkg "github.com/evergreen/api/internal/cron"
	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/internal/finance"
	"github.com/evergreen/api/internal/hr"
	"github.com/evergreen/api/internal/it"
	"github.com/evergreen/api/internal/marketing"
	"github.com/evergreen/api/internal/production"
	"github.com/evergreen/api/internal/profile"
	"github.com/evergreen/api/internal/rbac"
	"github.com/evergreen/api/internal/sales"
	"github.com/evergreen/api/pkg/db"
	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
	syncpkg "github.com/evergreen/api/internal/sync"
	"github.com/evergreen/api/internal/tms"
	"github.com/evergreen/api/internal/warehouse"
)

func main() {
	// Structured logging
	logger.Init()

	if err := run(); err != nil {
		logger.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	// Load config
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}
	logger.Info("config loaded", "port", cfg.Port, "supabaseURL", cfg.SupabaseURL)

	// Database pool
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("creating database pool: %w", err)
	}
	defer pool.Close()
	logger.Info("database connected")

	// Auth middleware (JWKS)
	auth, err := middleware.NewAuth(cfg, pool)
	if err != nil {
		return fmt.Errorf("creating auth middleware: %w", err)
	}
	logger.Info("JWKS auth initialized")

	// Router
	r := newRouter(cfg, pool, auth)

	// HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 300 * time.Second, // Long for SSE/sync endpoints
		IdleTimeout:  120 * time.Second,
	}

	// Start server in goroutine
	errCh := make(chan error, 1)
	go func() {
		logger.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	// Wait for shutdown signal or error
	select {
	case err := <-errCh:
		return fmt.Errorf("server error: %w", err)
	case <-ctx.Done():
		logger.Info("shutting down gracefully...")
	}

	// Graceful shutdown with 30s timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server shutdown: %w", err)
	}

	logger.Info("server stopped")
	return nil
}

func newRouter(cfg *config.Config, pool *pgxpool.Pool, jwtAuth *middleware.Auth) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware stack
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.AppURL))
	r.Use(httprate.LimitByIP(100, time.Minute))

	// Supabase Auth client (for login, admin ops)
	supaAuth := clients.NewSupabaseAuth(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey)

	// Phase 1 handlers
	authHandler := auth.New(pool, supaAuth, jwtAuth)
	adminHandler := admin.New(pool, supaAuth)
	profileHandler := profile.New(pool, supaAuth)
	rbacHandler := rbac.New(pool)

	// Phase 2 handlers
	hrHandler := hr.New(pool)

	// Phase 3 handlers
	bcClient := bc.NewClient(cfg)
	bcHandler := bc.NewHandler(pool)
	syncHandler := syncpkg.NewHandler(syncpkg.NewSyncEngine(pool, bcClient), cfg, pool)

	// Shared AI client
	aiClient := clients.NewOpenRouterClient(cfg.OpenRouterAPIKey)

	// Phase 4 handlers
	salesHandler := sales.New(pool)
	financeHandler := finance.New(pool, cfg, aiClient)

	// Phase 5 handlers
	marketingHandler := marketing.New(pool, cfg)

	// Phase 6 handlers
	tmsHandler := tms.New(pool, aiClient)
	warehouseHandler := warehouse.New(pool)
	productionHandler := production.New(pool)

	// Phase 7 handlers
	chatHandler := chat.New(pool, aiClient)
	itHandler := it.New(pool)
	bciHandler := bci.New(pool)

	// Start cron scheduler
	cronScheduler := cronpkg.NewScheduler(cfg, pool, bcClient)
	defer cronScheduler.Stop()

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Health check (no auth)
		r.Get("/configCheck", configCheckHandler(cfg, pool))

		// Public auth routes (no JWT required)
		r.Mount("/auth", auth.Routes(authHandler))

		// Webhook routes (signature auth, no JWT)
		r.Get("/marketing/omnichannel/webhooks/facebook", marketingHandler.FacebookVerify)
		r.Post("/marketing/omnichannel/webhooks/facebook", marketingHandler.FacebookWebhook)
		r.Post("/marketing/omnichannel/webhooks/line", marketingHandler.LineWebhook)

		// Cron routes (bearer CRON_SECRET)
		r.Group(func(r chi.Router) {
			r.Use(middleware.CronAuth(cfg.CronSecret))
			r.Mount("/sync", syncpkg.Routes(syncHandler))
		})

		// Authenticated routes (JWT auth)
		r.Group(func(r chi.Router) {
			r.Use(jwtAuth.Authenticate)

			// Phase 1
			r.Mount("/admin", admin.Routes(adminHandler))
			r.Mount("/profile", profile.Routes(profileHandler))
			r.Mount("/rbac", rbac.Routes(rbacHandler))

			r.Mount("/hr", hr.Routes(hrHandler))
			r.Mount("/bc", bc.Routes(bcHandler))
			r.Mount("/sales", sales.Routes(salesHandler))
			r.Mount("/finance", finance.Routes(financeHandler))
			r.Mount("/marketing", marketing.Routes(marketingHandler))
			r.Mount("/tms", tms.Routes(tmsHandler))
			r.Mount("/warehouse", warehouse.Routes(warehouseHandler))
			r.Mount("/production", production.Routes(productionHandler))
			r.Mount("/chat", chat.Routes(chatHandler))
			r.Mount("/it", it.Routes(itHandler))
			r.Mount("/bci", bci.Routes(bciHandler))
		})
	})

	return r
}

// configCheckHandler returns a health check handler.
func configCheckHandler(cfg *config.Config, pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		result := map[string]any{}

		// Check Supabase/PostgreSQL
		start := time.Now()
		var count int
		err := pool.QueryRow(ctx, `SELECT count(*) FROM "rbacRole"`).Scan(&count)
		dbLatency := time.Since(start)
		if err != nil {
			result["supabase"] = map[string]any{"status": "error", "error": err.Error(), "latency": dbLatency.String()}
		} else {
			result["supabase"] = map[string]any{"status": "ok", "latency": dbLatency.String(), "roles": count}
		}

		// Server info
		result["server"] = map[string]any{
			"status":  "ok",
			"runtime": "go",
			"port":    cfg.Port,
		}

		response.OK(w, result)
	}
}
