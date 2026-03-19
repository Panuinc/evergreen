package logger

import (
	"log/slog"
	"os"
)

// Init configures the global structured JSON logger.
func Init() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))
}

// Info logs at INFO level.
func Info(msg string, args ...any) { slog.Info(msg, args...) }

// Warn logs at WARN level.
func Warn(msg string, args ...any) { slog.Warn(msg, args...) }

// Error logs at ERROR level.
func Error(msg string, args ...any) { slog.Error(msg, args...) }

// Debug logs at DEBUG level.
func Debug(msg string, args ...any) { slog.Debug(msg, args...) }
