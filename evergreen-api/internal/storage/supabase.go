package storage

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
)

// Client handles Supabase Storage operations.
type Client struct {
	baseURL    string
	serviceKey string
	httpClient *http.Client
}

// NewClient creates a new Supabase Storage client.
func NewClient(supabaseURL, serviceKey string) *Client {
	return &Client{
		baseURL:    supabaseURL + "/storage/v1",
		serviceKey: serviceKey,
		httpClient: &http.Client{},
	}
}

// Upload uploads a file to a Supabase Storage bucket.
func (c *Client) Upload(bucket, path string, data []byte, contentType string) (string, error) {
	url := fmt.Sprintf("%s/object/%s/%s", c.baseURL, bucket, path)

	req, err := http.NewRequest("POST", url, bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage upload failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage error %d: %s", resp.StatusCode, string(body))
	}

	return c.GetPublicURL(bucket, path), nil
}

// UploadMultipart uploads a multipart file to Supabase Storage.
func (c *Client) UploadMultipart(bucket, path string, file multipart.File, header *multipart.FileHeader) (string, error) {
	data, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}
	ct := header.Header.Get("Content-Type")
	if ct == "" {
		ct = detectContentType(header.Filename)
	}
	return c.Upload(bucket, path, data, ct)
}

// Download downloads a file from Supabase Storage.
func (c *Client) Download(bucket, path string) ([]byte, string, error) {
	url := fmt.Sprintf("%s/object/%s/%s", c.baseURL, bucket, path)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	return data, resp.Header.Get("Content-Type"), nil
}

// DownloadURL downloads a file from any URL.
func (c *Client) DownloadURL(url string) ([]byte, string, error) {
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return data, resp.Header.Get("Content-Type"), nil
}

// Delete removes a file from Supabase Storage.
func (c *Client) Delete(bucket, path string) error {
	url := fmt.Sprintf("%s/object/%s/%s", c.baseURL, bucket, path)
	req, _ := http.NewRequest("DELETE", url, nil)
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

// GetPublicURL returns the public URL for a stored file.
func (c *Client) GetPublicURL(bucket, path string) string {
	return fmt.Sprintf("%s/object/public/%s/%s", c.baseURL, bucket, path)
}

func detectContentType(filename string) string {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".pdf":
		return "application/pdf"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".csv":
		return "text/csv"
	default:
		return "application/octet-stream"
	}
}
