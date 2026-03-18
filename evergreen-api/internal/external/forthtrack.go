package external

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// ForthTrackClient handles ForthTrack GPS API communication.
type ForthTrackClient struct {
	loginURL     string
	apiBase      string
	clientID     string
	clientSecret string
	username     string
	password     string
	httpClient   *http.Client

	mu    sync.Mutex
	token string
}

func NewForthTrackClient(loginURL, apiBase, clientID, clientSecret, username, password string) *ForthTrackClient {
	return &ForthTrackClient{
		loginURL:     loginURL,
		apiBase:      apiBase,
		clientID:     clientID,
		clientSecret: clientSecret,
		username:     username,
		password:     password,
		httpClient:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *ForthTrackClient) getToken() (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.token != "" {
		return c.token, nil
	}

	body := map[string]string{
		"grant_type":    "password",
		"client_id":     c.clientID,
		"client_secret": c.clientSecret,
		"username":      c.username,
		"password":      c.password,
	}
	jsonBody, _ := json.Marshal(body)

	resp, err := c.httpClient.Post(c.loginURL, "application/json", bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("ForthTrack login failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("ForthTrack login error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		AccessToken string `json:"access_token"`
	}
	json.Unmarshal(respBody, &result)
	c.token = result.AccessToken
	return c.token, nil
}

// FetchTracking fetches current GPS tracking data from ForthTrack.
func (c *ForthTrackClient) FetchTracking() ([]map[string]any, error) {
	token, err := c.getToken()
	if err != nil {
		return nil, err
	}

	req, _ := http.NewRequest("GET", c.apiBase+"/api/tracking", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Retry on 401 (token expired)
	if resp.StatusCode == 401 {
		c.mu.Lock()
		c.token = ""
		c.mu.Unlock()
		token, err = c.getToken()
		if err != nil {
			return nil, err
		}
		req, _ = http.NewRequest("GET", c.apiBase+"/api/tracking", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		resp, err = c.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
	}

	var data []map[string]any
	json.NewDecoder(resp.Body).Decode(&data)
	return data, nil
}
