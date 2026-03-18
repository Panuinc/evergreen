package external

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// FacebookClient sends messages via Facebook Graph API.
type FacebookClient struct {
	httpClient *http.Client
}

func NewFacebookClient() *FacebookClient {
	return &FacebookClient{httpClient: &http.Client{}}
}

// SendMessage sends a text message to a Facebook user.
func (c *FacebookClient) SendMessage(accessToken, recipientID, text string) (string, error) {
	body := map[string]any{
		"recipient": map[string]string{"id": recipientID},
		"message":   map[string]string{"text": text},
	}
	jsonBody, _ := json.Marshal(body)

	url := fmt.Sprintf("https://graph.facebook.com/v21.0/me/messages?access_token=%s", accessToken)
	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("Facebook send failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Facebook error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		MessageID string `json:"message_id"`
	}
	json.Unmarshal(respBody, &result)
	return result.MessageID, nil
}
