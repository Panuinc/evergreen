package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SupabaseAuth is a client for Supabase Auth REST API.
type SupabaseAuth struct {
	baseURL    string
	anonKey    string
	serviceKey string
	httpClient *http.Client
}

// NewSupabaseAuth creates a new Supabase Auth client.
func NewSupabaseAuth(supabaseURL, anonKey, serviceKey string) *SupabaseAuth {
	return &SupabaseAuth{
		baseURL:    supabaseURL + "/auth/v1",
		anonKey:    anonKey,
		serviceKey: serviceKey,
		httpClient: &http.Client{},
	}
}

// SignInWithPassword authenticates with email/password.
func (s *SupabaseAuth) SignInWithPassword(email, password string) (map[string]any, error) {
	body := map[string]string{"email": email, "password": password}
	return s.post("/token?grant_type=password", body, false)
}

// RefreshSession refreshes tokens using a refresh token.
func (s *SupabaseAuth) RefreshSession(refreshToken string) (map[string]any, error) {
	body := map[string]string{"refresh_token": refreshToken}
	return s.post("/token?grant_type=refresh_token", body, false)
}

// VerifyOTP verifies a one-time token.
func (s *SupabaseAuth) VerifyOTP(tokenHash, otpType string) (map[string]any, error) {
	body := map[string]string{"token_hash": tokenHash, "type": otpType}
	return s.post("/verify", body, false)
}

// AdminGetUser gets a user by ID (service role).
func (s *SupabaseAuth) AdminGetUser(userID string) (map[string]any, error) {
	return s.adminGet("/admin/users/" + userID)
}

// AdminCreateUser creates a user (service role).
func (s *SupabaseAuth) AdminCreateUser(email, password string) (map[string]any, error) {
	body := map[string]any{
		"email":         email,
		"password":      password,
		"email_confirm": true,
	}
	return s.adminPost("/admin/users", body)
}

// AdminUpdateUser updates a user by ID (service role).
func (s *SupabaseAuth) AdminUpdateUser(userID string, updates map[string]any) (map[string]any, error) {
	return s.adminPut("/admin/users/"+userID, updates)
}

// AdminListUsers lists all users (service role).
func (s *SupabaseAuth) AdminListUsers() ([]map[string]any, error) {
	resp, err := s.adminGet("/admin/users?per_page=1000")
	if err != nil {
		return nil, err
	}
	users, ok := resp["users"].([]any)
	if !ok {
		return nil, fmt.Errorf("unexpected users format")
	}
	result := make([]map[string]any, 0, len(users))
	for _, u := range users {
		if m, ok := u.(map[string]any); ok {
			result = append(result, m)
		}
	}
	return result, nil
}

// AdminGenerateLink generates a magic link (service role).
func (s *SupabaseAuth) AdminGenerateLink(linkType, email string) (map[string]any, error) {
	body := map[string]string{"type": linkType, "email": email}
	return s.adminPost("/admin/generate_link", body)
}

func (s *SupabaseAuth) post(path string, body any, useServiceKey bool) (map[string]any, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", s.baseURL+path, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.anonKey)
	if useServiceKey {
		req.Header.Set("Authorization", "Bearer "+s.serviceKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+s.anonKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	if resp.StatusCode >= 400 {
		msg, _ := result["error_description"].(string)
		if msg == "" {
			msg, _ = result["msg"].(string)
		}
		if msg == "" {
			msg, _ = result["error"].(string)
		}
		return nil, fmt.Errorf("%s", msg)
	}

	return result, nil
}

func (s *SupabaseAuth) adminPost(path string, body any) (map[string]any, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return s.adminRequest("POST", path, bytes.NewReader(jsonBody))
}

func (s *SupabaseAuth) adminPut(path string, body any) (map[string]any, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return s.adminRequest("PUT", path, bytes.NewReader(jsonBody))
}

func (s *SupabaseAuth) adminGet(path string) (map[string]any, error) {
	return s.adminRequest("GET", path, nil)
}

func (s *SupabaseAuth) adminRequest(method, path string, body io.Reader) (map[string]any, error) {
	req, err := http.NewRequest(method, s.baseURL+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.serviceKey)
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	if resp.StatusCode >= 400 {
		msg, _ := result["msg"].(string)
		if msg == "" {
			msg, _ = result["error"].(string)
		}
		return nil, fmt.Errorf("%s", msg)
	}

	return result, nil
}
