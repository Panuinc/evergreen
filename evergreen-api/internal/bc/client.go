package bc

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/evergreen/api/internal/config"
)

// Client is a Business Central API client with OAuth2 token caching and retry.
type Client struct {
	cfg        *config.Config
	httpClient *http.Client

	mu        sync.Mutex
	token     string
	expiresAt time.Time
}

// NewClient creates a new BC API client.
func NewClient(cfg *config.Config) *Client {
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 180 * time.Second},
	}
}

// getToken returns a cached or fresh OAuth2 access token.
func (c *Client) getToken() (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.token != "" && time.Now().Add(60*time.Second).Before(c.expiresAt) {
		return c.token, nil
	}

	data := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {c.cfg.BCClientID},
		"client_secret": {c.cfg.BCClientSecret},
		"scope":         {c.cfg.BCScope},
	}

	req, err := http.NewRequest("POST", c.cfg.BCAuthURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("creating token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("BC token error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parsing token response: %w", err)
	}

	c.token = result.AccessToken
	c.expiresAt = time.Now().Add(time.Duration(result.ExpiresIn) * time.Second)

	slog.Info("BC token refreshed", "expiresIn", result.ExpiresIn)
	return c.token, nil
}

// fetchWithRetry performs an HTTP request with retry logic.
func (c *Client) fetchWithRetry(url string, timeout time.Duration, maxRetries int) ([]byte, error) {
	token, err := c.getToken()
	if err != nil {
		return nil, err
	}

	for attempt := 0; attempt <= maxRetries; attempt++ {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Prefer", "odata.maxpagesize=5000")

		client := &http.Client{Timeout: timeout}
		resp, err := client.Do(req)
		if err != nil {
			if attempt < maxRetries {
				sleep := time.Duration(math.Pow(2, float64(attempt))) * 2 * time.Second
				slog.Warn("BC request error, retrying", "attempt", attempt, "sleep", sleep, "error", err)
				time.Sleep(sleep)
				continue
			}
			return nil, fmt.Errorf("BC request failed after %d retries: %w", maxRetries, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == 429 {
			retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
			if retryAfter < 1 {
				retryAfter = 5
			}
			slog.Warn("BC rate limited", "retryAfter", retryAfter)
			time.Sleep(time.Duration(retryAfter) * time.Second)
			continue
		}

		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 500 && attempt < maxRetries {
			sleep := time.Duration(math.Pow(2, float64(attempt))) * 2 * time.Second
			slog.Warn("BC server error, retrying", "status", resp.StatusCode, "attempt", attempt)
			time.Sleep(sleep)
			continue
		}

		if resp.StatusCode >= 400 {
			return nil, fmt.Errorf("BC API error %d: %s", resp.StatusCode, string(body))
		}

		return body, nil
	}
	return nil, fmt.Errorf("BC request exhausted retries")
}

// bcURLs returns the base URLs for different BC API types.
func (c *Client) bcURLs() (apiURL, customAPIURL, odataURL, prodODataURL string) {
	t := c.cfg.BCTenantID
	e := c.cfg.BCEnvironment
	cid := c.cfg.BCCompanyID
	cn := c.cfg.BCCompanyName
	base := fmt.Sprintf("https://api.businesscentral.dynamics.com/v2.0/%s/%s", t, e)
	prodBase := fmt.Sprintf("https://api.businesscentral.dynamics.com/v2.0/%s/Production", t)

	apiURL = fmt.Sprintf("%s/api/v2.0/companies(%s)", base, cid)
	customAPIURL = fmt.Sprintf("%s/api/evergreen/erp/v1.0/companies(%s)", prodBase, cid)
	odataURL = fmt.Sprintf("%s/ODataV4/Company('%s')", base, cn)
	prodODataURL = fmt.Sprintf("%s/ODataV4/Company('%s')", prodBase, cn)
	return
}

// fetchAllPages fetches all pages from a BC API endpoint.
func (c *Client) fetchAllPages(startURL string, timeout time.Duration) ([]map[string]any, error) {
	var allValues []map[string]any
	nextURL := startURL

	for nextURL != "" {
		body, err := c.fetchWithRetry(nextURL, timeout, 3)
		if err != nil {
			return allValues, err
		}

		var result struct {
			Value    []map[string]any `json:"value"`
			NextLink string           `json:"@odata.nextLink"`
		}
		if err := json.Unmarshal(body, &result); err != nil {
			return allValues, fmt.Errorf("parsing BC response: %w", err)
		}

		allValues = append(allValues, result.Value...)
		nextURL = result.NextLink
	}

	return allValues, nil
}

// buildURL constructs a URL with OData params.
func buildURL(base, endpoint string, params map[string]string) string {
	u := base + "/" + endpoint
	var odataParts []string
	var queryParts []string

	for k, v := range params {
		if strings.HasPrefix(k, "$") {
			odataParts = append(odataParts, k+"="+v)
		} else {
			queryParts = append(queryParts, k+"="+url.QueryEscape(v))
		}
	}

	allParts := append(odataParts, queryParts...)
	if len(allParts) > 0 {
		u += "?" + strings.Join(allParts, "&")
	}
	return u
}

// ApiGet fetches from the standard BC API endpoint.
func (c *Client) ApiGet(endpoint string, params map[string]string, timeout time.Duration) ([]map[string]any, error) {
	apiURL, _, _, _ := c.bcURLs()
	u := buildURL(apiURL, endpoint, params)
	return c.fetchAllPages(u, timeout)
}

// CustomApiGet fetches from the custom BC API endpoint (api/evergreen/erp/v1.0).
func (c *Client) CustomApiGet(endpoint string, params map[string]string, timeout time.Duration) ([]map[string]any, error) {
	_, customURL, _, _ := c.bcURLs()
	u := buildURL(customURL, endpoint, params)
	return c.fetchAllPages(u, timeout)
}

// ODataGet fetches from the OData v4 endpoint.
func (c *Client) ODataGet(entity string, params map[string]string, timeout time.Duration) ([]map[string]any, error) {
	_, _, odataURL, _ := c.bcURLs()
	u := buildURL(odataURL, entity, params)
	return c.fetchAllPages(u, timeout)
}

// ProductionODataGet fetches from the Production OData v4 endpoint.
func (c *Client) ProductionODataGet(entity string, params map[string]string, timeout time.Duration) ([]map[string]any, error) {
	_, _, _, prodURL := c.bcURLs()
	u := buildURL(prodURL, entity, params)
	return c.fetchAllPages(u, timeout)
}
