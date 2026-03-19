package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// LINEClient sends messages via LINE Messaging API.
type LINEClient struct {
	httpClient *http.Client
}

func NewLINEClient() *LINEClient {
	return &LINEClient{httpClient: &http.Client{}}
}

// SendPushMessage sends a text message to a LINE user.
func (c *LINEClient) SendPushMessage(accessToken, to, text string) (string, error) {
	body := map[string]any{
		"to": to,
		"messages": []map[string]string{
			{"type": "text", "text": text},
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "https://api.line.me/v2/bot/message/push", bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("LINE push failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("LINE error %d: %s", resp.StatusCode, string(respBody))
	}
	return "sent", nil
}

// GetProfile fetches a LINE user's profile.
func (c *LINEClient) GetProfile(accessToken, userId string) (map[string]any, error) {
	req, _ := http.NewRequest("GET", "https://api.line.me/v2/bot/profile/"+userId, nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
