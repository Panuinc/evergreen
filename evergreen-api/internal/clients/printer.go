package clients

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/png"
	"net"
	"time"

	"golang.org/x/image/draw"
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
	return PrintConfig{Host: "192.168.1.117", Port: 9100, Timeout: 3000, Retries: 1, RetryDelay: 500}
}

// PrintResult holds the result for a single label print.
type PrintResult struct {
	Index   int    `json:"index"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// PrintLabels sends base64 PNG images to the printer as TSPL bitmaps.
// Uses a single TCP connection for all labels to prevent dropped prints.
func (p *TSCPrinter) PrintLabels(images []string, widthMM, heightMM, gapMM float64, cfg PrintConfig) ([]PrintResult, error) {
	if cfg.Host == "" {
		cfg = DefaultPrintConfig()
	}

	results := make([]PrintResult, len(images))

	// Pre-process: decode all images before connecting
	type preparedLabel struct {
		widthBytes int
		heightDots int
		bitmap     []byte
	}
	prepared := make([]preparedLabel, len(images))

	dpi := 8.0
	widthDots := int(widthMM * dpi)
	heightDots := int(heightMM * dpi)

	for i, img := range images {
		bitmap, wb, hd, err := p.decodeToBitmap(img, widthDots, heightDots)
		if err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: err.Error()}
			if i == 0 {
				return results, err
			}
			continue
		}
		prepared[i] = preparedLabel{widthBytes: wb, heightDots: hd, bitmap: bitmap}
	}

	// Connect to printer — single connection for all labels
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	var conn net.Conn
	var err error

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
		return results, fmt.Errorf("cannot connect to printer %s: %w", addr, err)
	}
	defer conn.Close()

	// Set write deadline for entire batch
	totalTimeout := time.Duration(len(images)*10) * time.Second
	if totalTimeout < 30*time.Second {
		totalTimeout = 30 * time.Second
	}
	conn.SetWriteDeadline(time.Now().Add(totalTimeout))

	// Send each label over the same connection with delay between prints
	for i, p := range prepared {
		if p.bitmap == nil {
			// Already failed during decode
			continue
		}

		// Build TSPL commands for this label
		header := fmt.Sprintf("SIZE %d mm, %d mm\n", int(widthMM), int(heightMM))
		header += fmt.Sprintf("GAP %d mm, 0\n", int(gapMM))
		header += "DIRECTION 1\n"
		header += "CLS\n"
		header += fmt.Sprintf("BITMAP 0,0,%d,%d,0,", p.widthBytes, p.heightDots)

		footer := "\nPRINT 1\n"

		// Send header + bitmap + footer
		if _, err := conn.Write([]byte(header)); err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: fmt.Sprintf("send header failed: %v", err)}
			continue
		}
		if _, err := conn.Write(p.bitmap); err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: fmt.Sprintf("send bitmap failed: %v", err)}
			continue
		}
		if _, err := conn.Write([]byte(footer)); err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: fmt.Sprintf("send footer failed: %v", err)}
			continue
		}

		results[i] = PrintResult{Index: i, Success: true}

		// Wait between labels so printer has time to process
		if i < len(prepared)-1 {
			time.Sleep(800 * time.Millisecond)
		}
	}

	return results, nil
}

// decodeToBitmap converts a base64 PNG to monochrome 1-bit TSPL bitmap data.
func (p *TSCPrinter) decodeToBitmap(base64Img string, widthDots, heightDots int) ([]byte, int, int, error) {
	imgData, err := base64.StdEncoding.DecodeString(base64Img)
	if err != nil {
		return nil, 0, 0, fmt.Errorf("invalid base64 image: %w", err)
	}

	src, err := png.Decode(bytes.NewReader(imgData))
	if err != nil {
		return nil, 0, 0, fmt.Errorf("invalid PNG image: %w", err)
	}

	// Resize image to fit label dimensions
	resized := image.NewRGBA(image.Rect(0, 0, widthDots, heightDots))
	draw.BiLinear.Scale(resized, resized.Bounds(), src, src.Bounds(), draw.Over, nil)

	// Convert to monochrome 1-bit bitmap (TSPL format)
	// Each byte = 8 pixels, 0=black, 1=white
	widthBytes := (widthDots + 7) / 8
	bitmapData := make([]byte, widthBytes*heightDots)

	for y := 0; y < heightDots; y++ {
		for x := 0; x < widthDots; x++ {
			r, g, b, a := resized.At(x, y).RGBA()
			gray := (r*299 + g*587 + b*114) / 1000
			byteIdx := y*widthBytes + x/8
			bitIdx := uint(7 - x%8)
			if a < 0x8000 || gray > 0x8000 {
				bitmapData[byteIdx] |= 1 << bitIdx // white
			}
		}
	}

	return bitmapData, widthBytes, heightDots, nil
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
