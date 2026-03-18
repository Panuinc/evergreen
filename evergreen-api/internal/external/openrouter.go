package external

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// OpenRouterClient calls the OpenRouter API for AI completions.
type OpenRouterClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewOpenRouterClient creates a new OpenRouter client.
func NewOpenRouterClient(apiKey string) *OpenRouterClient {
	return &OpenRouterClient{
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}
}

// Message represents a chat message.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest is the request payload for chat completions.
type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream,omitempty"`
	Tools       []any     `json:"tools,omitempty"`
}

// ChatResponse is the non-streaming response.
type ChatResponse struct {
	Choices []struct {
		Message struct {
			Role      string `json:"role"`
			Content   string `json:"content"`
			ToolCalls []struct {
				ID       string `json:"id"`
				Type     string `json:"type"`
				Function struct {
					Name      string `json:"name"`
					Arguments string `json:"arguments"`
				} `json:"function"`
			} `json:"tool_calls"`
		} `json:"message"`
	} `json:"choices"`
}

// Chat sends a non-streaming chat completion request.
func (c *OpenRouterClient) Chat(req ChatRequest) (*ChatResponse, error) {
	req.Stream = false
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("OpenRouter error %d: %s", resp.StatusCode, string(respBody))
	}

	var result ChatResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parsing response: %w", err)
	}
	return &result, nil
}

// ChatStream sends a streaming chat completion and calls onChunk for each SSE data chunk.
func (c *OpenRouterClient) ChatStream(req ChatRequest, onChunk func(content string)) error {
	req.Stream = true
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("OpenRouter error %d: %s", resp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			onChunk(chunk.Choices[0].Delta.Content)
		}
	}

	return scanner.Err()
}

// StreamToSSE is a helper that streams OpenRouter response as SSE to an HTTP response writer.
func (c *OpenRouterClient) StreamToSSE(w http.ResponseWriter, req ChatRequest) error {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("streaming not supported")
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	err := c.ChatStream(req, func(content string) {
		fmt.Fprintf(w, "data: %s\n\n", content)
		flusher.Flush()
	})

	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
	return err
}
