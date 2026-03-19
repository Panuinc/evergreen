package middleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

// CORS returns configured CORS middleware.
func CORS(appURL string) func(http.Handler) http.Handler {
	origins := []string{"http://localhost:3000"}
	if appURL != "" {
		origins = append(origins, appURL)
	}

	return cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Internal-Secret", "X-Line-Signature", "X-Hub-Signature-256"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
