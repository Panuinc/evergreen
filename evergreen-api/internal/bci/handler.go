package bci

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"github.com/evergreen/api/internal/db"
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
	r.Route("/projects", func(r chi.Router) {
		r.Get("/", h.ListProjects)
		r.Post("/", h.CreateProject)
	})
	r.Post("/import", h.ImportExcel)
	return r
}

func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	q := `SELECT * FROM "bciProject" WHERE 1=1`
	var args []any
	argIdx := 1
	if search != "" {
		q += fmt.Sprintf(` AND ("bciProjectName" ILIKE $%d OR "bciProjectOwnerCompany" ILIKE $%d OR "bciProjectContractorCompany" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	q += ` ORDER BY "bciProjectModifiedDate" DESC NULLS LAST`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "ข้อมูลไม่ถูกต้อง")
		return
	}
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "bciProject" ("bciProjectName","bciProjectType","bciProjectDescription","bciProjectStreetName",
			"bciProjectCityOrTown","bciProjectStateProvince","bciProjectRegion","bciProjectCountry",
			"bciProjectValue","bciProjectCurrency","bciProjectStage","bciProjectStageStatus",
			"bciProjectCategory","bciProjectSubCategory","bciProjectOwnerCompany")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
	`, body["bciProjectName"], body["bciProjectType"], body["bciProjectDescription"],
		body["bciProjectStreetName"], body["bciProjectCityOrTown"], body["bciProjectStateProvince"],
		body["bciProjectRegion"], body["bciProjectCountry"], body["bciProjectValue"],
		body["bciProjectCurrency"], body["bciProjectStage"], body["bciProjectStageStatus"],
		body["bciProjectCategory"], body["bciProjectSubCategory"], body["bciProjectOwnerCompany"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

// columnMap maps Excel header names (case-insensitive) to DB column names.
var columnMap = map[string]string{
	"externalid":        "bciProjectExternalId",
	"name":              "bciProjectName",
	"type":              "bciProjectType",
	"description":       "bciProjectDescription",
	"streetname":        "bciProjectStreetName",
	"cityortown":        "bciProjectCityOrTown",
	"stateprovince":     "bciProjectStateProvince",
	"region":            "bciProjectRegion",
	"country":           "bciProjectCountry",
	"value":             "bciProjectValue",
	"currency":          "bciProjectCurrency",
	"stage":             "bciProjectStage",
	"stagestatus":       "bciProjectStageStatus",
	"category":          "bciProjectCategory",
	"categoryid":        "bciProjectCategoryId",
	"subcategory":       "bciProjectSubCategory",
	"ownercompany":      "bciProjectOwnerCompany",
	"ownercontact":      "bciProjectOwnerContact",
	"owneremail":        "bciProjectOwnerEmail",
	"ownerphone":        "bciProjectOwnerPhone",
	"contractorcompany": "bciProjectContractorCompany",
	"contractorcontact": "bciProjectContractorContact",
	"contractoremail":   "bciProjectContractorEmail",
	"contractorphone":   "bciProjectContractorPhone",
	"architectcompany":  "bciProjectArchitectCompany",
	"architectcontact":  "bciProjectArchitectContact",
	"architectemail":    "bciProjectArchitectEmail",
	"architectphone":    "bciProjectArchitectPhone",
	"launchdate":        "bciProjectLaunchDate",
	"completiondate":    "bciProjectCompletionDate",
	"modifieddate":      "bciProjectModifiedDate",
}

func (h *Handler) ImportExcel(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 50MB)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		response.BadRequest(w, "ไม่สามารถอ่านไฟล์: "+err.Error())
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "กรุณาอัพโหลดไฟล์ Excel")
		return
	}
	defer file.Close()
	slog.Info("BCI import started", "filename", header.Filename, "size", header.Size)

	// Read Excel
	data, _ := io.ReadAll(file)
	f, err := excelize.OpenReader(strings.NewReader(string(data)))
	if err != nil {
		response.BadRequest(w, "ไม่สามารถอ่านไฟล์ Excel: "+err.Error())
		return
	}
	defer f.Close()

	// Get first sheet
	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		response.BadRequest(w, "ไฟล์ว่างหรืออ่านไม่ได้")
		return
	}

	// Map headers
	headerRow := rows[0]
	colMapping := make([]string, len(headerRow)) // index → db column name
	mapped := 0
	for i, h := range headerRow {
		key := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(h), " ", ""))
		if dbCol, ok := columnMap[key]; ok {
			colMapping[i] = dbCol
			mapped++
		}
	}

	if mapped == 0 {
		response.BadRequest(w, "ไม่พบคอลัมน์ที่ตรงกัน กรุณาตรวจสอบ header")
		return
	}

	// Process rows
	ctx := r.Context()
	imported := 0
	errors := 0

	for rowIdx := 1; rowIdx < len(rows); rowIdx++ {
		row := rows[rowIdx]
		record := map[string]any{}
		for colIdx, val := range row {
			if colIdx < len(colMapping) && colMapping[colIdx] != "" {
				trimmed := strings.TrimSpace(val)
				if trimmed != "" {
					record[colMapping[colIdx]] = trimmed
				}
			}
		}

		// Must have externalId
		extID, ok := record["bciProjectExternalId"].(string)
		if !ok || extID == "" {
			errors++
			continue
		}

		// Build upsert
		cols := []string{}
		vals := []any{}
		placeholders := []string{}
		updates := []string{}
		idx := 1
		for col, val := range record {
			cols = append(cols, fmt.Sprintf(`"%s"`, col))
			vals = append(vals, val)
			placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
			if col != "bciProjectExternalId" {
				updates = append(updates, fmt.Sprintf(`"%s"=EXCLUDED."%s"`, col, col))
			}
			idx++
		}

		q := fmt.Sprintf(`INSERT INTO "bciProject" (%s) VALUES (%s) ON CONFLICT ("bciProjectExternalId") DO UPDATE SET %s`,
			strings.Join(cols, ","), strings.Join(placeholders, ","), strings.Join(updates, ","))

		_, err := h.pool.Exec(ctx, q, vals...)
		if err != nil {
			slog.Warn("BCI import row error", "row", rowIdx+1, "error", err)
			errors++
		} else {
			imported++
		}
	}

	slog.Info("BCI import completed", "imported", imported, "errors", errors, "total", len(rows)-1)
	response.OK(w, map[string]any{
		"ok":       true,
		"imported": imported,
		"errors":   errors,
		"total":    len(rows) - 1,
		"mapped":   mapped,
	})
}
