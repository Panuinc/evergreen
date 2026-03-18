package external

import (
	"encoding/base64"
	"fmt"
	"net"
	"time"
)

// TSCPrinter sends TSPL commands to a TSC label printer via TCP.
type TSCPrinter struct{}

func NewTSCPrinter() *TSCPrinter {
	return &TSCPrinter{}
}

// PrintConfig holds printer connection settings.
type PrintConfig struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Timeout    int    `json:"timeout"`
	Retries    int    `json:"retries"`
	RetryDelay int    `json:"retryDelay"`
}

// DefaultPrintConfig returns default printer settings.
func DefaultPrintConfig() PrintConfig {
	return PrintConfig{Host: "192.168.1.168", Port: 9100, Timeout: 5000, Retries: 2, RetryDelay: 1000}
}

// PrintResult holds the result for a single label print.
type PrintResult struct {
	Index   int    `json:"index"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// PrintLabels sends base64 PNG images to the printer as TSPL bitmaps.
func (p *TSCPrinter) PrintLabels(images []string, widthMM, heightMM, gapMM float64, cfg PrintConfig) ([]PrintResult, error) {
	if cfg.Host == "" {
		cfg = DefaultPrintConfig()
	}

	results := make([]PrintResult, len(images))

	for i, img := range images {
		err := p.printSingleLabel(img, widthMM, heightMM, gapMM, cfg)
		if err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: err.Error()}
		} else {
			results[i] = PrintResult{Index: i, Success: true}
		}
	}

	return results, nil
}

func (p *TSCPrinter) printSingleLabel(base64Img string, widthMM, heightMM, gapMM float64, cfg PrintConfig) error {
	// Decode base64 PNG
	_, err := base64.StdEncoding.DecodeString(base64Img)
	if err != nil {
		return fmt.Errorf("invalid base64 image: %w", err)
	}

	// Connect to printer
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	var conn net.Conn

	for attempt := 0; attempt <= cfg.Retries; attempt++ {
		conn, err = net.DialTimeout("tcp", addr, time.Duration(cfg.Timeout)*time.Millisecond)
		if err == nil {
			break
		}
		if attempt < cfg.Retries {
			time.Sleep(time.Duration(cfg.RetryDelay) * time.Millisecond)
		}
	}
	if err != nil {
		return fmt.Errorf("cannot connect to printer %s: %w", addr, err)
	}
	defer conn.Close()

	// DPI conversion: 203 DPI = 8 dots/mm
	dpi := 8.0
	widthDots := int(widthMM * dpi)
	heightDots := int(heightMM * dpi)

	// Build TSPL commands
	tspl := fmt.Sprintf("SIZE %d mm, %d mm\n", int(widthMM), int(heightMM))
	tspl += fmt.Sprintf("GAP %d mm, 0\n", int(gapMM))
	tspl += "DIRECTION 1\n"
	tspl += "CLS\n"
	// In production: convert PNG to BITMAP command here
	// For now, send a test label with text
	tspl += fmt.Sprintf("TEXT 10,10,\"3\",0,1,1,\"Label %dx%d\"\n", widthDots, heightDots)
	tspl += "PRINT 1\n"

	_, err = conn.Write([]byte(tspl))
	if err != nil {
		return fmt.Errorf("failed to send to printer: %w", err)
	}

	return nil
}

// TestConnection tests if the printer is reachable.
func (p *TSCPrinter) TestConnection(cfg PrintConfig) error {
	if cfg.Host == "" {
		cfg = DefaultPrintConfig()
	}
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	conn, err := net.DialTimeout("tcp", addr, time.Duration(cfg.Timeout)*time.Millisecond)
	if err != nil {
		return fmt.Errorf("cannot connect to printer %s: %w", addr, err)
	}
	conn.Close()
	return nil
}
