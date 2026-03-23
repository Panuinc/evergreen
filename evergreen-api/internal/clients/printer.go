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
func (p *TSCPrinter) PrintLabels(images []string, widthMM, heightMM, gapMM float64, cfg PrintConfig) ([]PrintResult, error) {
	if cfg.Host == "" {
		cfg = DefaultPrintConfig()
	}

	results := make([]PrintResult, len(images))

	for i, img := range images {
		err := p.printSingleLabel(img, widthMM, heightMM, gapMM, cfg)
		if err != nil {
			results[i] = PrintResult{Index: i, Success: false, Error: err.Error()}
			// ถ้า label แรกเชื่อมต่อไม่ได้ → return error ทันที ไม่ต้องลองที่เหลือ
			if i == 0 {
				return results, err
			}
		} else {
			results[i] = PrintResult{Index: i, Success: true}
		}
	}

	return results, nil
}

func (p *TSCPrinter) printSingleLabel(base64Img string, widthMM, heightMM, gapMM float64, cfg PrintConfig) error {
	// Decode base64 PNG
	imgData, err := base64.StdEncoding.DecodeString(base64Img)
	if err != nil {
		return fmt.Errorf("invalid base64 image: %w", err)
	}

	// Decode PNG to image
	src, err := png.Decode(bytes.NewReader(imgData))
	if err != nil {
		return fmt.Errorf("invalid PNG image: %w", err)
	}

	// 203 DPI = 8 dots/mm
	dpi := 8.0
	widthDots := int(widthMM * dpi)
	heightDots := int(heightMM * dpi)

	// Resize image to fit label dimensions
	resized := image.NewRGBA(image.Rect(0, 0, widthDots, heightDots))
	draw.BiLinear.Scale(resized, resized.Bounds(), src, src.Bounds(), draw.Over, nil)

	// Convert to monochrome 1-bit bitmap (TSPL format)
	// TSPL BITMAP: each byte = 8 pixels, 0=black, 1=white
	widthBytes := (widthDots + 7) / 8
	bitmapData := make([]byte, widthBytes*heightDots)

	for y := 0; y < heightDots; y++ {
		for x := 0; x < widthDots; x++ {
			r, g, b, a := resized.At(x, y).RGBA()
			// Compute grayscale luminance (BT.601)
			gray := (r*299 + g*587 + b*114) / 1000
			// Threshold: light pixels = white (1), dark pixels = black (0)
			// Also treat transparent pixels as white
			byteIdx := y*widthBytes + x/8
			bitIdx := uint(7 - x%8)
			if a < 0x8000 || gray > 0x8000 {
				bitmapData[byteIdx] |= 1 << bitIdx // white
			}
			// black pixels stay 0 (default)
		}
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

	// Build TSPL commands
	header := fmt.Sprintf("SIZE %d mm, %d mm\n", int(widthMM), int(heightMM))
	header += fmt.Sprintf("GAP %d mm, 0\n", int(gapMM))
	header += "DIRECTION 1\n"
	header += "CLS\n"
	// BITMAP x, y, width_bytes, height, mode, data
	// mode 0 = overwrite
	header += fmt.Sprintf("BITMAP 0,0,%d,%d,0,", widthBytes, heightDots)

	footer := "\nPRINT 1\n"

	// Send: header + raw bitmap data + footer
	if _, err = conn.Write([]byte(header)); err != nil {
		return fmt.Errorf("failed to send header to printer: %w", err)
	}
	if _, err = conn.Write(bitmapData); err != nil {
		return fmt.Errorf("failed to send bitmap to printer: %w", err)
	}
	if _, err = conn.Write([]byte(footer)); err != nil {
		return fmt.Errorf("failed to send footer to printer: %w", err)
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
