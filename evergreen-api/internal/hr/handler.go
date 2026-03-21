package hr

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/middleware"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	data, err := h.store.ListEmployees(r.Context(), search, sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateEmployee(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.GetEmployee(r.Context(), id, sa)
	if err != nil {
		response.NotFound(w, "ไม่พบพนักงาน")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateEmployee(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteEmployee(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.ListDepartments(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateDepartment(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateDepartment(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteDepartment(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListDivisions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.ListDivisions(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateDivision(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreateDivision(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateDivision(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdateDivision(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDivision(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteDivision(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListPositions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	data, err := h.store.ListPositions(r.Context(), sa)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreatePosition(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.CreatePosition(r.Context(), body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdatePosition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := h.store.UpdatePosition(r.Context(), id, body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeletePosition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeletePosition(r.Context(), id); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// buildHRStats aggregates employee data into KPI stats for a given reference time (used for both current and previous period).
func buildHRStats(employees []map[string]any, divisions, departments, positions []map[string]any, ref time.Time) map[string]any {
	monthStart := time.Date(ref.Year(), ref.Month(), 1, 0, 0, 0, 0, time.Local)
	sixMonthsAgo := time.Date(ref.Year(), ref.Month()-5, 1, 0, 0, 0, 0, time.Local)

	total := len(employees)
	active := 0
	newThisMonth := 0
	byDiv := map[string]int{}
	byDept := map[string]int{}
	byStatusMap := map[string]int{}
	trendMap := map[string]int{}

	for _, e := range employees {
		isAct := false
		if ia, ok := e["isActive"].(bool); ok && ia {
			active++
			isAct = true
		}
		if isAct {
			byStatusMap["active"]++
		} else {
			byStatusMap["inactive"]++
		}
		if createdAt, ok := e["hrEmployeeCreatedAt"].(time.Time); ok {
			if createdAt.After(monthStart) || createdAt.Equal(monthStart) {
				newThisMonth++
			}
			if !createdAt.Before(sixMonthsAgo) {
				trendMap[createdAt.Format("2006-01")]++
			}
		}
		if name, ok := e["hrDivisionName"].(string); ok && name != "" {
			byDiv[name]++
		}
		if name, ok := e["hrDepartmentName"].(string); ok && name != "" {
			byDept[name]++
		}
	}

	byDivArr := make([]map[string]any, 0, len(byDiv))
	for name, count := range byDiv {
		byDivArr = append(byDivArr, map[string]any{"name": name, "count": count})
	}
	byDeptArr := make([]map[string]any, 0, len(byDept))
	for name, count := range byDept {
		byDeptArr = append(byDeptArr, map[string]any{"name": name, "count": count})
	}
	byStatusArr := make([]map[string]any, 0, len(byStatusMap))
	for status, count := range byStatusMap {
		byStatusArr = append(byStatusArr, map[string]any{"status": status, "count": count})
	}
	trendArr := make([]map[string]any, 0, 6)
	for i := 5; i >= 0; i-- {
		t := time.Date(ref.Year(), ref.Month()-time.Month(i), 1, 0, 0, 0, 0, time.Local)
		key := t.Format("2006-01")
		trendArr = append(trendArr, map[string]any{"month": key, "count": trendMap[key]})
	}

	return map[string]any{
		"totalEmployees":   total,
		"activeEmployees":  active,
		"totalDivisions":   len(divisions),
		"totalDepartments": len(departments),
		"totalPositions":   len(positions),
		"newThisMonth":     newThisMonth,
		"byDivision":       byDivArr,
		"byDepartment":     byDeptArr,
		"byStatus":         byStatusArr,
		"trend":            trendArr,
	}
}

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	compareMode := r.URL.Query().Get("compareMode")

	employees, err := h.store.ListAllEmployees(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	divisions, _ := h.store.ListActiveDivisions(ctx)
	departments, _ := h.store.ListActiveDepartments(ctx)
	positions, _ := h.store.ListActivePositions(ctx)

	now := time.Now()
	current := buildHRStats(employees, divisions, departments, positions, now)

	if compareMode == "" {
		response.OK(w, current)
		return
	}

	// Determine previous reference time based on compareMode
	var prevRef time.Time
	var labelCurrent, labelPrevious string
	switch compareMode {
	case "lastMonth":
		prevRef = time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, time.Local)
		labelCurrent = now.Format("January 2006")
		labelPrevious = prevRef.Format("January 2006")
	case "lastQuarter":
		prevRef = now.AddDate(0, -3, 0)
		labelCurrent = "ไตรมาสนี้"
		labelPrevious = "ไตรมาสที่แล้ว"
	case "lastYear":
		prevRef = now.AddDate(-1, 0, 0)
		labelCurrent = now.Format("2006")
		labelPrevious = prevRef.Format("2006")
	default:
		prevRef = time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, time.Local)
		labelCurrent = now.Format("January 2006")
		labelPrevious = prevRef.Format("January 2006")
	}

	previous := buildHRStats(employees, divisions, departments, positions, prevRef)

	response.OK(w, map[string]any{
		"compareMode": compareMode,
		"current":     current,
		"previous":    previous,
		"labels": map[string]string{
			"current":  labelCurrent,
			"previous": labelPrevious,
		},
	})
}

func (h *Handler) UnlinkedEmployees(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListUnlinkedEmployees(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) UnlinkedUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	users, err := h.store.ListAllUserProfiles(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	linked, err := h.store.ListLinkedEmployees(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	linkedSet := make(map[string]bool)
	for _, l := range linked {
		if uid, ok := l["hrEmployeeUserId"].(string); ok {
			linkedSet[uid] = true
		}
	}
	var result []map[string]any
	for _, u := range users {
		if uid, ok := u["rbacUserProfileId"].(string); ok && !linkedSet[uid] {
			result = append(result, u)
		}
	}
	if result == nil {
		result = []map[string]any{}
	}
	response.OK(w, result)
}
