package chat

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/clients"
	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
	ai    *clients.OpenRouterClient
}

func New(pool *pgxpool.Pool, ai *clients.OpenRouterClient) *Handler {
	return &Handler{store: NewStore(pool), ai: ai}
}

// Chat handles POST /api/chat — orchestrator with specialist agents.
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []clients.Message `json:"messages"`
		Message  string            `json:"message"` // shorthand
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	if h.ai == nil {
		response.Error(w, http.StatusServiceUnavailable, "AI ยังไม่ได้ตั้งค่า")
		return
	}

	// Build messages
	messages := body.Messages
	if body.Message != "" && len(messages) == 0 {
		messages = []clients.Message{{Role: "user", Content: body.Message}}
	}
	if len(messages) == 0 {
		response.BadRequest(w, "กรุณาระบุข้อความ")
		return
	}

	// Fetch context data for the orchestrator
	ctx := r.Context()
	hrCount := h.store.CountEmployees(ctx)
	custCount := h.store.CountCustomers(ctx)

	systemPrompt := fmt.Sprintf(`คุณเป็น AI ผู้ช่วยของบริษัท C.H.H. Industries (โรงงานผลิตประตู)
ตอบเป็นภาษาไทย ใช้ markdown formatting
ข้อมูลเบื้องต้น: พนักงาน %d คน, ลูกค้า %d ราย
คุณสามารถตอบคำถามเกี่ยวกับ HR, การขาย, การเงิน, การผลิต, คลังสินค้า, และขนส่ง`, hrCount, custCount)

	// Prepend system message
	fullMessages := append([]clients.Message{{Role: "system", Content: systemPrompt}}, messages...)

	// First try: non-streaming call to check if tools needed
	aiResp, err := h.ai.Chat(clients.ChatRequest{
		Model:       "google/gemini-2.5-flash-lite",
		Messages:    fullMessages,
		Temperature: 0.5,
	})
	if err != nil {
		logger.Error("AI chat error", "error", err)
		response.InternalError(w, err)
		return
	}

	if len(aiResp.Choices) == 0 {
		response.Error(w, http.StatusBadGateway, "AI ไม่มีคำตอบ")
		return
	}

	content := aiResp.Choices[0].Message.Content
	toolCalls := aiResp.Choices[0].Message.ToolCalls

	// If no tool calls, stream the direct response
	if len(toolCalls) == 0 {
		// Stream response via SSE
		flusher, ok := w.(http.Flusher)
		if !ok {
			response.OK(w, map[string]string{"response": content})
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		h.ai.ChatStream(clients.ChatRequest{
			Model:       "google/gemini-2.5-flash-lite",
			Messages:    fullMessages,
			Temperature: 0.5,
		}, func(chunk string) {
			fmt.Fprintf(w, "data: %s\n\n", chunk)
			flusher.Flush()
		})

		fmt.Fprintf(w, "data: [DONE]\n\n")
		flusher.Flush()
		return
	}

	// Handle tool calls (agent routing)
	var agentResults []string
	for _, tc := range toolCalls {
		agentName := tc.Function.Name
		var query string
		json.Unmarshal([]byte(tc.Function.Arguments), &struct{ Query *string }{&query})

		logger.Info("agent called", "agent", agentName, "query", query)
		result := h.runAgent(r, agentName, query)
		agentResults = append(agentResults, fmt.Sprintf("[%s]: %s", agentName, result))
	}

	// Send agent results back to AI for final answer
	agentMsg := "ข้อมูลจาก agents:\n" + fmt.Sprintf("%v", agentResults)
	finalMessages := append(fullMessages, clients.Message{Role: "assistant", Content: content})
	finalMessages = append(finalMessages, clients.Message{Role: "user", Content: agentMsg})

	// Stream final response
	flusher, ok := w.(http.Flusher)
	if !ok {
		resp, _ := h.ai.Chat(clients.ChatRequest{Model: "google/gemini-2.5-flash-lite", Messages: finalMessages})
		if resp != nil && len(resp.Choices) > 0 {
			response.OK(w, map[string]string{"response": resp.Choices[0].Message.Content})
		}
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	h.ai.ChatStream(clients.ChatRequest{
		Model:       "google/gemini-2.5-flash-lite",
		Messages:    finalMessages,
		Temperature: 0.5,
	}, func(chunk string) {
		fmt.Fprintf(w, "data: %s\n\n", chunk)
		flusher.Flush()
	})

	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// runAgent queries the database based on agent type and returns results as a string.
func (h *Handler) runAgent(r *http.Request, agent, query string) string {
	ctx := r.Context()
	var data []map[string]any
	var err error

	switch agent {
	case "ask_hr_agent":
		data, err = h.store.GetHRAgentData(ctx)
	case "ask_sales_agent":
		data, err = h.store.GetSalesAgentData(ctx)
	case "ask_tms_agent":
		data, err = h.store.GetTMSAgentData(ctx)
	case "ask_finance_agent":
		data, err = h.store.GetFinanceAgentData(ctx)
	default:
		return "Unknown agent: " + agent
	}

	if err != nil {
		return "Error: " + err.Error()
	}
	result, _ := json.Marshal(data)
	return string(result)
}
