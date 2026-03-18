package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	// Server
	Port string `envconfig:"PORT" default:"8080"`

	// Supabase
	SupabaseURL        string `envconfig:"NEXT_PUBLIC_SUPABASE_URL" required:"true"`
	SupabaseAnonKey    string `envconfig:"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" required:"true"`
	SupabaseServiceKey string `envconfig:"SUPABASE_SERVICE_ROLE_KEY" required:"true"`
	DatabaseURL        string `envconfig:"DATABASE_URL" required:"true"`

	// Business Central
	BCAuthURL     string `envconfig:"BC_AUTH_URL" required:"true"`
	BCClientID    string `envconfig:"BC_CLIENT_ID" required:"true"`
	BCClientSecret string `envconfig:"BC_CLIENT_SECRET" required:"true"`
	BCScope       string `envconfig:"BC_SCOPE" required:"true"`
	BCTenantID    string `envconfig:"BC_TENANT_ID" required:"true"`
	BCEnvironment string `envconfig:"BC_ENVIRONMENT" required:"true"`
	BCCompanyID   string `envconfig:"BC_COMPANY_ID" default:"a407ba9f-2151-ec11-9f09-000d3ac85269"`
	BCCompanyName string `envconfig:"BC_COMPANY_NAME" default:"C.H.H._Go-Live"`

	// AI
	OpenRouterAPIKey string `envconfig:"OPENROUTER_API_KEY"`

	// Omnichannel - LINE
	LineChannelSecret string `envconfig:"LINE_CHANNEL_SECRET"`

	// Omnichannel - Facebook
	FacebookWebhookVerifyToken string `envconfig:"FACEBOOK_WEBHOOK_VERIFY_TOKEN"`
	FacebookAppSecret          string `envconfig:"FACEBOOK_APP_SECRET"`

	// App
	AppURL            string `envconfig:"NEXT_PUBLIC_APP_URL"`
	InternalAPISecret string `envconfig:"INTERNAL_API_SECRET"`
	CronSecret        string `envconfig:"CRON_SECRET"`

	// ForthTrack GPS
	ForthTrackLoginURL    string `envconfig:"FORTHTRACK_LOGIN_URL"`
	ForthTrackAPIBase     string `envconfig:"FORTHTRACK_API_BASE"`
	ForthTrackClientID    string `envconfig:"FORTHTRACK_CLIENT_ID"`
	ForthTrackClientSecret string `envconfig:"FORTHTRACK_CLIENT_SECRET"`
	ForthTrackUsername    string `envconfig:"FORTHTRACK_USERNAME"`
	ForthTrackPassword    string `envconfig:"FORTHTRACK_PASSWORD"`
}

// JWKSURL returns the JWKS endpoint for Supabase JWT validation.
func (c *Config) JWKSURL() string {
	return fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", c.SupabaseURL)
}

// SupabaseAuthURL returns the Supabase Auth base URL.
func (c *Config) SupabaseAuthURL() string {
	return fmt.Sprintf("%s/auth/v1", c.SupabaseURL)
}

// SupabaseStorageURL returns the Supabase Storage base URL.
func (c *Config) SupabaseStorageURL() string {
	return fmt.Sprintf("%s/storage/v1", c.SupabaseURL)
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, fmt.Errorf("loading config: %w", err)
	}
	return &cfg, nil
}
