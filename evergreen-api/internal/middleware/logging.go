package middleware

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	bytes  int
	body   *bytes.Buffer // capture response body on error
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	// Capture error response bodies for debugging
	if rw.status >= 400 && rw.body != nil && rw.body.Len() < 1000 {
		rw.body.Write(b)
	}
	return n, err
}

// Logger logs HTTP requests with detailed error info.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK, body: &bytes.Buffer{}}

		// Log request body for POST/PUT/PATCH (for debugging)
		var reqBody string
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" {
			if r.Body != nil && !strings.Contains(r.Header.Get("Content-Type"), "multipart") {
				bodyBytes, _ := io.ReadAll(r.Body)
				r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
				reqBody = string(bodyBytes)
				if len(reqBody) > 500 {
					reqBody = reqBody[:500] + "..."
				}
			}
		}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)

		if rw.status >= 400 {
			// Error: log with full detail
			attrs := []any{
				"method", r.Method,
				"path", r.URL.Path,
				"query", r.URL.RawQuery,
				"status", rw.status,
				"duration", duration.String(),
				"ip", r.RemoteAddr,
			}
			if reqBody != "" {
				attrs = append(attrs, "requestBody", reqBody)
			}
			if rw.body.Len() > 0 {
				attrs = append(attrs, "responseBody", rw.body.String())
			}
			if rw.status >= 500 {
				slog.Error("❌ API ERROR", attrs...)
			} else {
				slog.Warn("⚠️ API FAIL", attrs...)
			}
		} else {
			// Success: compact log
			slog.Info("✅",
				"method", r.Method,
				"path", r.URL.Path,
				"status", rw.status,
				"duration", duration.String(),
				"bytes", rw.bytes,
			)
		}
	})
}

// Recoverer catches panics and returns 500.
func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("🔥 PANIC", "panic", rec, "path", r.URL.Path, "method", r.Method)
				http.Error(w, `{"error":"เกิดข้อผิดพลาดภายใน"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
