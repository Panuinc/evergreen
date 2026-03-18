package hr

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/internal/db"
	"github.com/evergreen/api/internal/middleware"
	"github.com/evergreen/api/internal/response"
)

type Handler struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/employees", func(r chi.Router) {
		r.Get("/", h.ListEmployees)
		r.Post("/", h.CreateEmployee)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetEmployee)
			r.Put("/", h.UpdateEmployee)
			r.Delete("/", h.DeleteEmployee)
		})
	})

	r.Route("/departments", func(r chi.Router) {
		r.Get("/", h.ListDepartments)
		r.Post("/", h.CreateDepartment)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateDepartment)
			r.Delete("/", h.DeleteDepartment)
		})
	})

	r.Route("/divisions", func(r chi.Router) {
		r.Get("/", h.ListDivisions)
		r.Post("/", h.CreateDivision)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateDivision)
			r.Delete("/", h.DeleteDivision)
		})
	})

	r.Route("/positions", func(r chi.Router) {
		r.Get("/", h.ListPositions)
		r.Post("/", h.CreatePosition)
		r.Route("/{id}", func(r chi.Router) {
			r.Put("/", h.UpdatePosition)
			r.Delete("/", h.DeletePosition)
		})
	})

	r.Get("/dashboard", h.Dashboard)
	r.Get("/unlinkedEmployees", h.UnlinkedEmployees)
	r.Get("/unlinkedUsers", h.UnlinkedUsers)

	return r
}

// ---- Employees ----

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")

	q := `SELECT * FROM "hrEmployee" WHERE 1=1`
	var args []any
	argIdx := 1

	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("hrEmployeeFirstName" ILIKE $%d OR "hrEmployeeLastName" ILIKE $%d OR "hrEmployeeEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	q += ` ORDER BY "hrEmployeeCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "hrEmployee" ("hrEmployeeFirstName", "hrEmployeeLastName", "hrEmployeeEmail", "hrEmployeePhone", "hrEmployeeDivision", "hrEmployeeDepartment", "hrEmployeePosition")
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
	`, body["hrEmployeeFirstName"], body["hrEmployeeLastName"], body["hrEmployeeEmail"],
		body["hrEmployeePhone"], body["hrEmployeeDivision"], body["hrEmployeeDepartment"], body["hrEmployeePosition"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "hrEmployee" WHERE "hrEmployeeId" = $1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	data, err := db.QueryRow(r.Context(), h.pool, q, id)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "hrEmployee" SET
			"hrEmployeeFirstName" = COALESCE($2, "hrEmployeeFirstName"),
			"hrEmployeeLastName" = COALESCE($3, "hrEmployeeLastName"),
			"hrEmployeeEmail" = COALESCE($4, "hrEmployeeEmail"),
			"hrEmployeePhone" = COALESCE($5, "hrEmployeePhone"),
			"hrEmployeeDivision" = COALESCE($6, "hrEmployeeDivision"),
			"hrEmployeeDepartment" = COALESCE($7, "hrEmployeeDepartment"),
			"hrEmployeePosition" = COALESCE($8, "hrEmployeePosition")
		WHERE "hrEmployeeId" = $1 RETURNING *
	`, id, body["hrEmployeeFirstName"], body["hrEmployeeLastName"], body["hrEmployeeEmail"],
		body["hrEmployeePhone"], body["hrEmployeeDivision"], body["hrEmployeeDepartment"], body["hrEmployeePosition"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "hrEmployee" SET "isActive" = false WHERE "hrEmployeeId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Departments ----

func (h *Handler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "hrDepartment"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrDepartmentName"`
	data, err := db.QueryRows(r.Context(), h.pool, q)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "hrDepartment" ("hrDepartmentName", "hrDepartmentDescription", "hrDepartmentDivision")
		VALUES ($1, $2, $3) RETURNING *
	`, body["hrDepartmentName"], body["hrDepartmentDescription"], body["hrDepartmentDivision"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "hrDepartment" SET
			"hrDepartmentName" = COALESCE($2, "hrDepartmentName"),
			"hrDepartmentDescription" = COALESCE($3, "hrDepartmentDescription"),
			"hrDepartmentDivision" = COALESCE($4, "hrDepartmentDivision")
		WHERE "hrDepartmentId" = $1 RETURNING *
	`, id, body["hrDepartmentName"], body["hrDepartmentDescription"], body["hrDepartmentDivision"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "hrDepartment" SET "isActive" = false WHERE "hrDepartmentId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Divisions ----

func (h *Handler) ListDivisions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "hrDivision"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrDivisionName"`
	data, err := db.QueryRows(r.Context(), h.pool, q)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "hrDivision" ("hrDivisionName", "hrDivisionDescription")
		VALUES ($1, $2) RETURNING *
	`, body["hrDivisionName"], body["hrDivisionDescription"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "hrDivision" SET
			"hrDivisionName" = COALESCE($2, "hrDivisionName"),
			"hrDivisionDescription" = COALESCE($3, "hrDivisionDescription")
		WHERE "hrDivisionId" = $1 RETURNING *
	`, id, body["hrDivisionName"], body["hrDivisionDescription"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteDivision(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "hrDivision" SET "isActive" = false WHERE "hrDivisionId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Positions ----

func (h *Handler) ListPositions(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "hrPosition"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "hrPositionTitle"`
	data, err := db.QueryRows(r.Context(), h.pool, q)
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "hrPosition" ("hrPositionTitle", "hrPositionDescription", "hrPositionDepartment")
		VALUES ($1, $2, $3) RETURNING *
	`, body["hrPositionTitle"], body["hrPositionDescription"], body["hrPositionDepartment"])
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
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "hrPosition" SET
			"hrPositionTitle" = COALESCE($2, "hrPositionTitle"),
			"hrPositionDescription" = COALESCE($3, "hrPositionDescription"),
			"hrPositionDepartment" = COALESCE($4, "hrPositionDepartment")
		WHERE "hrPositionId" = $1 RETURNING *
	`, id, body["hrPositionTitle"], body["hrPositionDescription"], body["hrPositionDepartment"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeletePosition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "hrPosition" SET "isActive" = false WHERE "hrPositionId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	employees, err := db.QueryRows(ctx, h.pool, `SELECT * FROM "hrEmployee"`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	divisions, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "hrDivision" WHERE "isActive" = true`)
	departments, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "hrDepartment" WHERE "isActive" = true`)
	positions, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "hrPosition" WHERE "isActive" = true`)

	// Build division/department name maps
	divMap := make(map[string]string)
	for _, d := range divisions {
		if id, ok := d["hrDivisionId"].(string); ok {
			if name, ok := d["hrDivisionName"].(string); ok {
				divMap[id] = name
			}
		}
	}
	deptMap := make(map[string]string)
	for _, d := range departments {
		if id, ok := d["hrDepartmentId"].(string); ok {
			if name, ok := d["hrDepartmentName"].(string); ok {
				deptMap[id] = name
			}
		}
	}

	// Aggregations
	total := len(employees)
	active := 0
	newThisMonth := 0
	byDiv := map[string]int{}
	byDept := map[string]int{}
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)

	for _, e := range employees {
		if isActive, ok := e["isActive"].(bool); ok && isActive {
			active++
		}
		if createdAt, ok := e["hrEmployeeCreatedAt"].(time.Time); ok && createdAt.After(monthStart) {
			newThisMonth++
		}
		if div, ok := e["hrEmployeeDivision"].(string); ok && div != "" {
			name := divMap[div]
			if name == "" {
				name = div
			}
			byDiv[name]++
		}
		if dept, ok := e["hrEmployeeDepartment"].(string); ok && dept != "" {
			name := deptMap[dept]
			if name == "" {
				name = dept
			}
			byDept[name]++
		}
	}

	response.OK(w, map[string]any{
		"totalEmployees":   total,
		"activeEmployees":  active,
		"totalDivisions":   len(divisions),
		"totalDepartments": len(departments),
		"totalPositions":   len(positions),
		"newThisMonth":     newThisMonth,
		"byDivision":       byDiv,
		"byDepartment":     byDept,
	})
}

// ---- Unlinked ----

func (h *Handler) UnlinkedEmployees(w http.ResponseWriter, r *http.Request) {
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "hrEmployee"
		WHERE "isActive" = true AND "hrEmployeeUserId" IS NULL
		ORDER BY "hrEmployeeFirstName"
	`)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) UnlinkedUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	users, err := db.QueryRows(ctx, h.pool, `SELECT * FROM "rbacUserProfile"`)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	linked, err := db.QueryRows(ctx, h.pool, `
		SELECT * FROM "hrEmployee"
		WHERE "isActive" = true AND "hrEmployeeUserId" IS NOT NULL
	`)
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
