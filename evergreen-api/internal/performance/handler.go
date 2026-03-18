package performance

import (
	"encoding/json"
	"fmt"
	"net/http"

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

	// OKR
	r.Route("/okr", func(r chi.Router) {
		r.Get("/", h.ListOKR)
		r.Post("/", h.CreateOKR)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetOKR)
			r.Put("/", h.UpdateOKR)
			r.Delete("/", h.DeleteOKR)
		})
		r.Post("/key-results", h.CreateKeyResult)
		r.Route("/key-results/{id}", func(r chi.Router) {
			r.Put("/", h.UpdateKeyResult)
			r.Delete("/", h.DeleteKeyResult)
		})
		r.Get("/checkins", h.ListCheckins)
		r.Post("/checkins", h.CreateCheckin)
	})

	// KPI
	r.Route("/kpi", func(r chi.Router) {
		r.Get("/dashboard", h.KPIDashboard)
		r.Route("/definitions", func(r chi.Router) {
			r.Get("/", h.ListKPIDefinitions)
			r.Post("/", h.CreateKPIDefinition)
			r.Route("/{id}", func(r chi.Router) {
				r.Put("/", h.UpdateKPIDefinition)
				r.Delete("/", h.DeleteKPIDefinition)
			})
		})
		r.Route("/assignments", func(r chi.Router) {
			r.Get("/", h.ListKPIAssignments)
			r.Post("/", h.CreateKPIAssignment)
			r.Route("/{id}", func(r chi.Router) {
				r.Put("/", h.UpdateKPIAssignment)
				r.Delete("/", h.DeleteKPIAssignment)
			})
		})
		r.Get("/records", h.ListKPIRecords)
		r.Post("/records", h.CreateKPIRecord)
	})

	// 360
	r.Route("/360", func(r chi.Router) {
		r.Route("/cycles", func(r chi.Router) {
			r.Get("/", h.List360Cycles)
			r.Post("/", h.Create360Cycle)
			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", h.Get360Cycle)
				r.Put("/", h.Update360Cycle)
				r.Delete("/", h.Delete360Cycle)
				r.Post("/transition", h.Transition360Cycle)
			})
		})
		r.Get("/competencies", h.List360Competencies)
		r.Post("/competencies", h.Save360Competencies)
		r.Get("/nominations", h.List360Nominations)
		r.Post("/nominations", h.Create360Nomination)
		r.Delete("/nominations", h.Delete360Nomination)
		r.Get("/responses", h.List360Responses)
		r.Post("/responses", h.Create360Response)
		r.Get("/results", h.Get360Results)
	})

	// Evaluation
	r.Route("/evaluation", func(r chi.Router) {
		r.Get("/", h.ListEvaluations)
		r.Post("/", h.CreateEvaluation)
		r.Get("/feedback", h.GetEvaluationFeedback)
		r.Post("/feedback", h.CreateEvaluationFeedback)
		r.Get("/summary", h.GetEvaluationSummary)
	})

	return r
}

// ---- OKR ----

func (h *Handler) ListOKR(w http.ResponseWriter, r *http.Request) {
	q := `SELECT * FROM "perfOkrObjective" WHERE "isActive" = true`
	args := []any{}
	argIdx := 1

	if year := r.URL.Query().Get("year"); year != "" {
		q += fmt.Sprintf(` AND "perfOkrObjectiveYear" = $%d`, argIdx)
		args = append(args, year)
		argIdx++
	}
	if quarter := r.URL.Query().Get("quarter"); quarter != "" {
		q += fmt.Sprintf(` AND "perfOkrObjectiveQuarter" = $%d`, argIdx)
		args = append(args, quarter)
		argIdx++
	}
	if empId := r.URL.Query().Get("employeeId"); empId != "" {
		q += fmt.Sprintf(` AND "perfOkrObjectiveEmployeeId" = $%d`, argIdx)
		args = append(args, empId)
	}
	q += ` ORDER BY "perfOkrObjectiveCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	// Enrich with key results
	for i, obj := range data {
		if objId, ok := obj["perfOkrObjectiveId"].(string); ok {
			krs, _ := db.QueryRows(r.Context(), h.pool, `
				SELECT * FROM "perfOkrKeyResult" WHERE "perfOkrKeyResultObjectiveId" = $1 AND "isActive" = true
				ORDER BY "perfOkrKeyResultSortOrder"
			`, objId)
			data[i]["keyResults"] = krs
		}
	}
	response.OK(w, data)
}

func (h *Handler) CreateOKR(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	period := fmt.Sprintf("Q%v-%v", body["quarter"], body["year"])
	obj, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfOkrObjective" ("perfOkrObjectiveEmployeeId", "perfOkrObjectiveTitle", "perfOkrObjectiveDescription",
			"perfOkrObjectiveYear", "perfOkrObjectiveQuarter", "perfOkrObjectivePeriod",
			"perfOkrObjectiveVisibility", "perfOkrObjectiveParentObjectiveId", "perfOkrObjectiveCreatedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
	`, body["employeeId"], body["title"], body["description"],
		body["year"], body["quarter"], period,
		body["visibility"], body["parentObjectiveId"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Insert key results if provided
	if krs, ok := body["keyResults"].([]any); ok && len(krs) > 0 {
		objId := obj["perfOkrObjectiveId"]
		for i, kr := range krs {
			krMap, _ := kr.(map[string]any)
			if krMap == nil {
				continue
			}
			_, _ = h.pool.Exec(r.Context(), `
				INSERT INTO "perfOkrKeyResult" ("perfOkrKeyResultObjectiveId", "perfOkrKeyResultTitle",
					"perfOkrKeyResultMetricType", "perfOkrKeyResultStartValue", "perfOkrKeyResultTargetValue",
					"perfOkrKeyResultUnit", "perfOkrKeyResultWeight", "perfOkrKeyResultSortOrder")
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, objId, krMap["title"], krMap["metricType"], krMap["startValue"], krMap["targetValue"],
				krMap["unit"], krMap["weight"], i)
		}
	}

	response.Created(w, obj)
}

func (h *Handler) GetOKR(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	obj, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "perfOkrObjective" WHERE "perfOkrObjectiveId" = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ OKR")
		return
	}
	krs, _ := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perfOkrKeyResult" WHERE "perfOkrKeyResultObjectiveId" = $1 AND "isActive" = true
		ORDER BY "perfOkrKeyResultSortOrder"
	`, id)
	obj["keyResults"] = krs
	response.OK(w, obj)
}

func (h *Handler) UpdateOKR(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "perfOkrObjective" SET
			"perfOkrObjectiveTitle" = COALESCE($2, "perfOkrObjectiveTitle"),
			"perfOkrObjectiveDescription" = COALESCE($3, "perfOkrObjectiveDescription"),
			"perfOkrObjectiveStatus" = COALESCE($4, "perfOkrObjectiveStatus"),
			"perfOkrObjectiveVisibility" = COALESCE($5, "perfOkrObjectiveVisibility"),
			"perfOkrObjectiveProgress" = COALESCE($6, "perfOkrObjectiveProgress"),
			"perfOkrObjectiveUpdatedAt" = now()
		WHERE "perfOkrObjectiveId" = $1 RETURNING *
	`, id, body["title"], body["description"], body["status"], body["visibility"], body["progress"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteOKR(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perfOkrObjective" SET "isActive" = false WHERE "perfOkrObjectiveId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) CreateKeyResult(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfOkrKeyResult" ("perfOkrKeyResultObjectiveId", "perfOkrKeyResultTitle",
			"perfOkrKeyResultMetricType", "perfOkrKeyResultStartValue", "perfOkrKeyResultTargetValue",
			"perfOkrKeyResultUnit", "perfOkrKeyResultWeight",
			"perfOkrKeyResultSortOrder")
		VALUES ($1, $2, $3, $4, $5, $6, $7,
			COALESCE((SELECT max("perfOkrKeyResultSortOrder") + 1 FROM "perfOkrKeyResult" WHERE "perfOkrKeyResultObjectiveId" = $1), 0))
		RETURNING *
	`, body["objectiveId"], body["title"], body["metricType"], body["startValue"], body["targetValue"],
		body["unit"], body["weight"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateKeyResult(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "perfOkrKeyResult" SET
			"perfOkrKeyResultTitle" = COALESCE($2, "perfOkrKeyResultTitle"),
			"perfOkrKeyResultMetricType" = COALESCE($3, "perfOkrKeyResultMetricType"),
			"perfOkrKeyResultStartValue" = COALESCE($4, "perfOkrKeyResultStartValue"),
			"perfOkrKeyResultTargetValue" = COALESCE($5, "perfOkrKeyResultTargetValue"),
			"perfOkrKeyResultCurrentValue" = COALESCE($6, "perfOkrKeyResultCurrentValue"),
			"perfOkrKeyResultUnit" = COALESCE($7, "perfOkrKeyResultUnit"),
			"perfOkrKeyResultWeight" = COALESCE($8, "perfOkrKeyResultWeight"),
			"perfOkrKeyResultUpdatedAt" = now()
		WHERE "perfOkrKeyResultId" = $1 RETURNING *
	`, id, body["title"], body["metricType"], body["startValue"], body["targetValue"],
		body["currentValue"], body["unit"], body["weight"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteKeyResult(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perfOkrKeyResult" SET "isActive" = false WHERE "perfOkrKeyResultId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListCheckins(w http.ResponseWriter, r *http.Request) {
	krId := r.URL.Query().Get("keyResultId")
	if krId == "" {
		response.BadRequest(w, "กรุณาระบุ keyResultId")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perfOkrCheckin" WHERE "perfOkrCheckinKeyResultId" = $1
		ORDER BY "perfOkrCheckinCreatedAt" DESC
	`, krId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateCheckin(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body struct {
		KeyResultID string  `json:"keyResultId"`
		NewValue    float64 `json:"newValue"`
		Note        string  `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}

	// Get current value
	var prevValue float64
	_ = h.pool.QueryRow(r.Context(), `SELECT COALESCE("perfOkrKeyResultCurrentValue", 0) FROM "perfOkrKeyResult" WHERE "perfOkrKeyResultId" = $1`, body.KeyResultID).Scan(&prevValue)

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfOkrCheckin" ("perfOkrCheckinKeyResultId", "perfOkrCheckinPreviousValue", "perfOkrCheckinNewValue", "perfOkrCheckinNote", "perfOkrCheckinCreatedBy")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, body.KeyResultID, prevValue, body.NewValue, body.Note, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update key result current value
	_, _ = h.pool.Exec(r.Context(), `
		UPDATE "perfOkrKeyResult" SET "perfOkrKeyResultCurrentValue" = $2, "perfOkrKeyResultUpdatedAt" = now()
		WHERE "perfOkrKeyResultId" = $1
	`, body.KeyResultID, body.NewValue)

	response.Created(w, data)
}

// ---- KPI ----

func (h *Handler) ListKPIDefinitions(w http.ResponseWriter, r *http.Request) {
	q := `SELECT * FROM "perfKpiDefinition" WHERE "isActive" = true`
	args := []any{}
	argIdx := 1
	if cat := r.URL.Query().Get("category"); cat != "" {
		q += fmt.Sprintf(` AND "perfKpiDefinitionCategory" = $%d`, argIdx)
		args = append(args, cat)
	}
	q += ` ORDER BY "perfKpiDefinitionCategory", "perfKpiDefinitionName"`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateKPIDefinition(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfKpiDefinition" ("perfKpiDefinitionName", "perfKpiDefinitionDescription",
			"perfKpiDefinitionCategory", "perfKpiDefinitionUnit", "perfKpiDefinitionFrequency",
			"perfKpiDefinitionTargetValue", "perfKpiDefinitionWarningThreshold", "perfKpiDefinitionCriticalThreshold",
			"perfKpiDefinitionHigherIsBetter", "perfKpiDefinitionCreatedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
	`, body["name"], body["description"], body["category"], body["unit"], body["frequency"],
		body["targetValue"], body["warningThreshold"], body["criticalThreshold"],
		body["higherIsBetter"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateKPIDefinition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "perfKpiDefinition" SET
			"perfKpiDefinitionName" = COALESCE($2, "perfKpiDefinitionName"),
			"perfKpiDefinitionDescription" = COALESCE($3, "perfKpiDefinitionDescription"),
			"perfKpiDefinitionCategory" = COALESCE($4, "perfKpiDefinitionCategory"),
			"perfKpiDefinitionUnit" = COALESCE($5, "perfKpiDefinitionUnit"),
			"perfKpiDefinitionTargetValue" = COALESCE($6, "perfKpiDefinitionTargetValue"),
			"perfKpiDefinitionUpdatedAt" = now()
		WHERE "perfKpiDefinitionId" = $1 RETURNING *
	`, id, body["name"], body["description"], body["category"], body["unit"], body["targetValue"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteKPIDefinition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perfKpiDefinition" SET "isActive" = false WHERE "perfKpiDefinitionId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) ListKPIAssignments(w http.ResponseWriter, r *http.Request) {
	q := `SELECT a.*, row_to_json(d.*) as definition
		FROM "perfKpiAssignment" a
		LEFT JOIN "perfKpiDefinition" d ON d."perfKpiDefinitionId" = a."perfKpiAssignmentDefinitionId"
		WHERE a."isActive" = true`
	args := []any{}
	argIdx := 1
	if year := r.URL.Query().Get("year"); year != "" {
		q += fmt.Sprintf(` AND a."perfKpiAssignmentYear" = $%d`, argIdx)
		args = append(args, year)
		argIdx++
	}
	if empId := r.URL.Query().Get("employeeId"); empId != "" {
		q += fmt.Sprintf(` AND a."perfKpiAssignmentEmployeeId" = $%d`, argIdx)
		args = append(args, empId)
	}
	q += ` ORDER BY a."perfKpiAssignmentCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateKPIAssignment(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfKpiAssignment" ("perfKpiAssignmentDefinitionId", "perfKpiAssignmentEmployeeId",
			"perfKpiAssignmentYear", "perfKpiAssignmentTargetValue", "perfKpiAssignmentWeight")
		VALUES ($1, $2, $3, $4, $5) RETURNING *
	`, body["definitionId"], body["employeeId"], body["year"], body["targetValue"], body["weight"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) UpdateKPIAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "perfKpiAssignment" SET
			"perfKpiAssignmentTargetValue" = COALESCE($2, "perfKpiAssignmentTargetValue"),
			"perfKpiAssignmentWeight" = COALESCE($3, "perfKpiAssignmentWeight")
		WHERE "perfKpiAssignmentId" = $1 RETURNING *
	`, id, body["targetValue"], body["weight"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteKPIAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perfKpiAssignment" SET "isActive" = false WHERE "perfKpiAssignmentId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) KPIDashboard(w http.ResponseWriter, r *http.Request) {
	year := r.URL.Query().Get("year")
	if year == "" {
		year = "2026"
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT a.*, row_to_json(d.*) as definition
		FROM "perfKpiAssignment" a
		LEFT JOIN "perfKpiDefinition" d ON d."perfKpiDefinitionId" = a."perfKpiAssignmentDefinitionId"
		WHERE a."isActive" = true AND a."perfKpiAssignmentYear" = $1
	`, year)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ListKPIRecords(w http.ResponseWriter, r *http.Request) {
	assignmentId := r.URL.Query().Get("assignmentId")
	if assignmentId == "" {
		response.BadRequest(w, "กรุณาระบุ assignmentId")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perfKpiRecord" WHERE "perfKpiRecordAssignmentId" = $1
		ORDER BY "perfKpiRecordPeriodLabel"
	`, assignmentId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateKPIRecord(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfKpiRecord" ("perfKpiRecordAssignmentId", "perfKpiRecordPeriodLabel",
			"perfKpiRecordActualValue", "perfKpiRecordNote", "perfKpiRecordRecordedBy")
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ("perfKpiRecordAssignmentId", "perfKpiRecordPeriodLabel") DO UPDATE SET
			"perfKpiRecordActualValue" = EXCLUDED."perfKpiRecordActualValue",
			"perfKpiRecordNote" = EXCLUDED."perfKpiRecordNote",
			"perfKpiRecordRecordedBy" = EXCLUDED."perfKpiRecordRecordedBy"
		RETURNING *
	`, body["assignmentId"], body["periodLabel"], body["actualValue"], body["note"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// ---- 360 ----

func (h *Handler) List360Cycles(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "perf360Cycle"`
	if !sa {
		q += ` WHERE "isActive" = true`
	}
	q += ` ORDER BY "perf360CycleCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) Create360Cycle(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perf360Cycle" ("perf360CycleName", "perf360CycleDescription",
			"perf360CycleYear", "perf360CycleQuarter", "perf360CycleResponseDeadline",
			"perf360CycleAnonymousToReviewee", "perf360CycleCreatedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
	`, body["name"], body["description"], body["year"], body["quarter"],
		body["responseDeadline"], body["anonymousToReviewee"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) Get360Cycle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "perf360Cycle" WHERE "perf360CycleId" = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Cycle")
		return
	}
	response.OK(w, data)
}

func (h *Handler) Update360Cycle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "perf360Cycle" SET
			"perf360CycleName" = COALESCE($2, "perf360CycleName"),
			"perf360CycleDescription" = COALESCE($3, "perf360CycleDescription"),
			"perf360CycleYear" = COALESCE($4, "perf360CycleYear"),
			"perf360CycleQuarter" = COALESCE($5, "perf360CycleQuarter"),
			"perf360CycleResponseDeadline" = COALESCE($6, "perf360CycleResponseDeadline"),
			"perf360CycleAnonymousToReviewee" = COALESCE($7, "perf360CycleAnonymousToReviewee"),
			"perf360CycleUpdatedAt" = now()
		WHERE "perf360CycleId" = $1 RETURNING *
	`, id, body["name"], body["description"], body["year"], body["quarter"],
		body["responseDeadline"], body["anonymousToReviewee"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) Delete360Cycle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perf360Cycle" SET "isActive" = false WHERE "perf360CycleId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) Transition360Cycle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	_, err := h.pool.Exec(r.Context(), `
		UPDATE "perf360Cycle" SET "perf360CycleStatus" = $2, "perf360CycleUpdatedAt" = now()
		WHERE "perf360CycleId" = $1
	`, id, body.Status)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) List360Competencies(w http.ResponseWriter, r *http.Request) {
	cycleId := r.URL.Query().Get("cycleId")
	if cycleId == "" {
		response.BadRequest(w, "กรุณาระบุ cycleId")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perf360Competency" WHERE "perf360CompetencyCycleId" = $1
		ORDER BY "perf360CompetencySortOrder"
	`, cycleId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) Save360Competencies(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CycleID      string           `json:"cycleId"`
		Competencies []map[string]any `json:"competencies"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	// Delete existing
	_, _ = h.pool.Exec(r.Context(), `DELETE FROM "perf360Competency" WHERE "perf360CompetencyCycleId" = $1`, body.CycleID)
	// Insert new
	for i, c := range body.Competencies {
		_, _ = h.pool.Exec(r.Context(), `
			INSERT INTO "perf360Competency" ("perf360CompetencyCycleId", "perf360CompetencyName",
				"perf360CompetencyDescription", "perf360CompetencyQuestions", "perf360CompetencyWeight", "perf360CompetencySortOrder")
			VALUES ($1, $2, $3, $4, $5, $6)
		`, body.CycleID, c["name"], c["description"], c["questions"], c["weight"], i)
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) List360Nominations(w http.ResponseWriter, r *http.Request) {
	cycleId := r.URL.Query().Get("cycleId")
	if cycleId == "" {
		response.BadRequest(w, "กรุณาระบุ cycleId")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perf360Nomination"
		WHERE "perf360NominationCycleId" = $1 AND "isActive" = true
		ORDER BY "perf360NominationCreatedAt" DESC
	`, cycleId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) Create360Nomination(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perf360Nomination" ("perf360NominationCycleId", "perf360NominationRevieweeEmployeeId",
			"perf360NominationReviewerEmployeeId", "perf360NominationRelationshipType")
		VALUES ($1, $2, $3, $4) RETURNING *
	`, body["cycleId"], body["revieweeEmployeeId"], body["reviewerEmployeeId"], body["relationshipType"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) Delete360Nomination(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	_, err := h.pool.Exec(r.Context(), `UPDATE "perf360Nomination" SET "isActive" = false WHERE "perf360NominationId" = $1`, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) List360Responses(w http.ResponseWriter, r *http.Request) {
	cycleId := r.URL.Query().Get("cycleId")
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perf360Response" WHERE "perf360ResponseCycleId" = $1
	`, cycleId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) Create360Response(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perf360Response" ("perf360ResponseNominationId", "perf360ResponseCycleId",
			"perf360ResponseRevieweeEmployeeId", "perf360ResponseReviewerEmployeeId",
			"perf360ResponseRelationshipType", "perf360ResponseScores",
			"perf360ResponseOverallScore", "perf360ResponseStrengthComment",
			"perf360ResponseImprovementComment", "perf360ResponseComment")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
	`, body["nominationId"], body["cycleId"], body["revieweeEmployeeId"], body["reviewerEmployeeId"],
		body["relationshipType"], body["scores"], body["overallScore"],
		body["strengthComment"], body["improvementComment"], body["comment"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update nomination status
	if nomId, ok := body["nominationId"].(string); ok && nomId != "" {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE "perf360Nomination" SET "perf360NominationStatus" = 'completed', "perf360NominationCompletedAt" = now()
			WHERE "perf360NominationId" = $1
		`, nomId)
	}

	response.Created(w, data)
}

func (h *Handler) Get360Results(w http.ResponseWriter, r *http.Request) {
	cycleId := r.URL.Query().Get("cycleId")
	if cycleId == "" {
		response.BadRequest(w, "กรุณาระบุ cycleId")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perf360Response" WHERE "perf360ResponseCycleId" = $1
	`, cycleId)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Evaluation ----

func (h *Handler) ListEvaluations(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	q := `SELECT * FROM "perfEvaluation" WHERE "perfEvaluationEvaluatorId" = $1 ORDER BY "perfEvaluationCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, userID)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateEvaluation(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfEvaluation" ("perfEvaluationEvaluatorId", "perfEvaluationEvaluateeEmployeeId",
			"perfEvaluationPeriod", "perfEvaluationYear", "perfEvaluationQuarter",
			"perfEvaluationScores", "perfEvaluationCategoryAverages", "perfEvaluationOverallScore",
			"perfEvaluationGrade", "perfEvaluationComment")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
	`, userID, body["evaluateeEmployeeId"], body["period"], body["year"], body["quarter"],
		body["scores"], body["categoryAverages"], body["overallScore"], body["grade"], body["comment"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetEvaluationFeedback(w http.ResponseWriter, r *http.Request) {
	empId := r.URL.Query().Get("employeeId")
	period := r.URL.Query().Get("period")
	q := `SELECT * FROM "perfEvaluationFeedback" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if empId != "" {
		q += fmt.Sprintf(` AND "perfEvaluationFeedbackEmployeeId" = $%d`, argIdx)
		args = append(args, empId)
		argIdx++
	}
	if period != "" {
		q += fmt.Sprintf(` AND "perfEvaluationFeedbackPeriod" = $%d`, argIdx)
		args = append(args, period)
	}
	q += ` ORDER BY "perfEvaluationFeedbackCreatedAt" DESC`

	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateEvaluationFeedback(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "perfEvaluationFeedback" ("perfEvaluationFeedbackEmployeeId", "perfEvaluationFeedbackPeriod",
			"perfEvaluationFeedbackCategoryAverages", "perfEvaluationFeedbackOverallScore",
			"perfEvaluationFeedbackGrade", "perfEvaluationFeedbackCompanyAverages",
			"perfEvaluationFeedbackEvaluatorCount", "perfEvaluationFeedbackFeedback", "perfEvaluationFeedbackGeneratedBy")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
	`, body["employeeId"], body["period"], body["categoryAverages"], body["overallScore"],
		body["grade"], body["companyAverages"], body["evaluatorCount"], body["feedback"], userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetEvaluationSummary(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		response.BadRequest(w, "กรุณาระบุ period")
		return
	}
	data, err := db.QueryRows(r.Context(), h.pool, `
		SELECT * FROM "perfEvaluation" WHERE "perfEvaluationPeriod" = $1
		ORDER BY "perfEvaluationCreatedAt" DESC
	`, period)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}
