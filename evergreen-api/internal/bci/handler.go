package bci

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"github.com/evergreen/api/pkg/logger"
	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	data, err := h.store.ListProjects(r.Context(), search)
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
	data, err := h.store.CreateProject(r.Context(), body)
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
	logger.Info("BCI import started", "filename", header.Filename, "size", header.Size)

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
	for i, hdr := range headerRow {
		key := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(hdr), " ", ""))
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

		if err := h.store.UpsertProjectRecord(ctx, record); err != nil {
			logger.Warn("BCI import row error", "row", rowIdx+1, "error", err)
			errors++
		} else {
			imported++
		}
	}

	logger.Info("BCI import completed", "imported", imported, "errors", errors, "total", len(rows)-1)
	response.OK(w, map[string]any{
		"ok":       true,
		"imported": imported,
		"errors":   errors,
		"total":    len(rows) - 1,
		"mapped":   mapped,
	})
}
