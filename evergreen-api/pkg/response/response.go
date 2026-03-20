package response

import (
	"encoding/json"
	"net/http"

	"github.com/evergreen/api/pkg/logger"
)

// JSON writes a JSON response with the given status code.
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			logger.Error("failed to encode response", "error", err)
		}
	}
}

// OK writes a 200 JSON response.
func OK(w http.ResponseWriter, data any) {
	JSON(w, http.StatusOK, data)
}

// Created writes a 201 JSON response.
func Created(w http.ResponseWriter, data any) {
	JSON(w, http.StatusCreated, data)
}

// Error writes an error JSON response.
func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, map[string]string{"error": message})
}

// BadRequest writes a 400 error.
func BadRequest(w http.ResponseWriter, message string) {
	Error(w, http.StatusBadRequest, message)
}

// Unauthorized writes a 401 error.
func Unauthorized(w http.ResponseWriter, message string) {
	Error(w, http.StatusUnauthorized, message)
}

// Forbidden writes a 403 error.
func Forbidden(w http.ResponseWriter, message string) {
	Error(w, http.StatusForbidden, message)
}

// NotFound writes a 404 error.
func NotFound(w http.ResponseWriter, message string) {
	Error(w, http.StatusNotFound, message)
}

// InternalError writes a 500 error (logs the real error, returns generic message).
func InternalError(w http.ResponseWriter, err error) {
	// context canceled = browser closed connection, not a real error
	if err != nil && err.Error() == "context canceled" {
		return
	}
	logger.Error("internal server error", "error", err)
	Error(w, http.StatusInternalServerError, "เกิดข้อผิดพลาดภายใน")
}

// TooManyRequests writes a 429 error.
func TooManyRequests(w http.ResponseWriter) {
	Error(w, http.StatusTooManyRequests, "คำขอมากเกินไป กรุณาลองใหม่อีกครั้ง")
}
