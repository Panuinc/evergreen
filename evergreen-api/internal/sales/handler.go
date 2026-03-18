package sales

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

	r.Get("/dashboard", h.Dashboard)

	r.Route("/leads", func(r chi.Router) {
		r.Get("/", h.ListLeads)
		r.Post("/", h.CreateLead)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetLead)
			r.Put("/", h.UpdateLead)
			r.Post("/", h.ConvertLead)
			r.Delete("/", h.DeleteLead)
		})
	})

	r.Route("/contacts", func(r chi.Router) {
		r.Get("/", h.ListContacts)
		r.Post("/", h.CreateContact)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetContact)
			r.Put("/", h.UpdateContact)
			r.Delete("/", h.DeleteContact)
		})
	})

	r.Route("/accounts", func(r chi.Router) {
		r.Get("/", h.ListAccounts)
		r.Post("/", h.CreateAccount)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetAccount)
			r.Put("/", h.UpdateAccount)
			r.Delete("/", h.DeleteAccount)
		})
	})

	r.Route("/opportunities", func(r chi.Router) {
		r.Get("/", h.ListOpportunities)
		r.Post("/", h.CreateOpportunity)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetOpportunity)
			r.Put("/", h.UpdateOpportunity)
			r.Delete("/", h.DeleteOpportunity)
		})
	})

	r.Route("/quotations", func(r chi.Router) {
		r.Get("/", h.ListQuotations)
		r.Post("/", h.CreateQuotation)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetQuotation)
			r.Put("/", h.UpdateQuotation)
			r.Post("/", h.QuotationAction)
			r.Delete("/", h.DeleteQuotation)
		})
	})

	r.Route("/orders", func(r chi.Router) {
		r.Get("/", h.ListOrders)
		r.Post("/", h.CreateOrder)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetOrder)
			r.Put("/", h.UpdateOrder)
			r.Delete("/", h.DeleteOrder)
		})
	})

	r.Get("/activities", h.ListActivities)
	r.Post("/activities", h.ManageActivity)
	r.Get("/reports", h.Reports)

	return r
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	leads, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "salesLead" WHERE "isActive" = true`)
	opps, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "salesOpportunity" WHERE "isActive" = true`)
	orders, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "salesOrder" WHERE "isActive" = true`)
	activities, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "salesActivity" WHERE "isActive" = true ORDER BY "crmActivityCreatedAt" DESC LIMIT 10`)
	stages, _ := db.QueryRows(ctx, h.pool, `SELECT * FROM "salesPipelineStage" ORDER BY "crmPipelineStageOrder"`)

	response.OK(w, map[string]any{
		"totalLeads":        len(leads),
		"totalOpportunities": len(opps),
		"totalOrders":       len(orders),
		"recentActivities":  activities,
		"pipelineStages":    stages,
	})
}

// ---- Leads ----

func (h *Handler) ListLeads(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	q := `SELECT * FROM "salesLead" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("crmLeadName" ILIKE $%d OR "crmLeadEmail" ILIKE $%d OR "crmLeadCompany" ILIKE $%d OR "crmLeadPhone" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "crmLeadCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateLead(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesLead" ("crmLeadName","crmLeadEmail","crmLeadPhone","crmLeadCompany","crmLeadPosition","crmLeadSource","crmLeadScore","crmLeadStatus","crmLeadAssignedTo","crmLeadNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmLeadName"], body["crmLeadEmail"], body["crmLeadPhone"], body["crmLeadCompany"],
		body["crmLeadPosition"], body["crmLeadSource"], body["crmLeadScore"], body["crmLeadStatus"],
		body["crmLeadAssignedTo"], body["crmLeadNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesLead" WHERE "crmLeadId" = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Lead")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesLead" SET
			"crmLeadName"=COALESCE($2,"crmLeadName"), "crmLeadEmail"=COALESCE($3,"crmLeadEmail"),
			"crmLeadPhone"=COALESCE($4,"crmLeadPhone"), "crmLeadCompany"=COALESCE($5,"crmLeadCompany"),
			"crmLeadStatus"=COALESCE($6,"crmLeadStatus"), "crmLeadScore"=COALESCE($7,"crmLeadScore"),
			"crmLeadAssignedTo"=COALESCE($8,"crmLeadAssignedTo"), "crmLeadNotes"=COALESCE($9,"crmLeadNotes")
		WHERE "crmLeadId"=$1 RETURNING *
	`, id, body["crmLeadName"], body["crmLeadEmail"], body["crmLeadPhone"], body["crmLeadCompany"],
		body["crmLeadStatus"], body["crmLeadScore"], body["crmLeadAssignedTo"], body["crmLeadNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) ConvertLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	lead, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesLead" WHERE "crmLeadId" = $1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Lead")
		return
	}
	contact, _ := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesContact" ("crmContactFirstName","crmContactLastName","crmContactEmail","crmContactPhone","crmContactPosition")
		VALUES ($1,'',$2,$3,$4) RETURNING *
	`, lead["crmLeadName"], lead["crmLeadEmail"], lead["crmLeadPhone"], lead["crmLeadPosition"])
	opp, _ := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesOpportunity" ("crmOpportunityName","crmOpportunityContactId","crmOpportunitySource","crmOpportunityStage")
		VALUES ($1,$2,$3,'qualification') RETURNING *
	`, lead["crmLeadCompany"], contact["crmContactId"], lead["crmLeadSource"])
	h.pool.Exec(r.Context(), `UPDATE "salesLead" SET "crmLeadStatus"='converted',"crmLeadConvertedContactId"=$2,"crmLeadConvertedOpportunityId"=$3 WHERE "crmLeadId"=$1`,
		id, contact["crmContactId"], opp["crmOpportunityId"])
	response.OK(w, map[string]any{"contact": contact, "opportunity": opp})
}

func (h *Handler) DeleteLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesLead" SET "isActive"=false WHERE "crmLeadId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Contacts ----

func (h *Handler) ListContacts(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	q := `SELECT c.*, row_to_json(a.*) as "salesAccount" FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."crmAccountId" = c."crmContactAccountId" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !sa {
		q += ` AND c."isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND (c."crmContactFirstName" ILIKE $%d OR c."crmContactLastName" ILIKE $%d OR c."crmContactEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY c."crmContactCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateContact(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesContact" ("crmContactFirstName","crmContactLastName","crmContactEmail","crmContactPhone","crmContactPosition","crmContactAccountId","crmContactNotes","crmContactAddress")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
	`, body["crmContactFirstName"], body["crmContactLastName"], body["crmContactEmail"], body["crmContactPhone"],
		body["crmContactPosition"], body["crmContactAccountId"], body["crmContactNotes"], body["crmContactAddress"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT c.*, row_to_json(a.*) as "salesAccount" FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."crmAccountId"=c."crmContactAccountId" WHERE c."crmContactId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Contact")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesContact" SET "crmContactFirstName"=COALESCE($2,"crmContactFirstName"),"crmContactLastName"=COALESCE($3,"crmContactLastName"),
			"crmContactEmail"=COALESCE($4,"crmContactEmail"),"crmContactPhone"=COALESCE($5,"crmContactPhone"),
			"crmContactPosition"=COALESCE($6,"crmContactPosition"),"crmContactAccountId"=COALESCE($7,"crmContactAccountId"),
			"crmContactNotes"=COALESCE($8,"crmContactNotes")
		WHERE "crmContactId"=$1 RETURNING *
	`, id, body["crmContactFirstName"], body["crmContactLastName"], body["crmContactEmail"],
		body["crmContactPhone"], body["crmContactPosition"], body["crmContactAccountId"], body["crmContactNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesContact" SET "isActive"=false WHERE "crmContactId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Accounts ----

func (h *Handler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	search := r.URL.Query().Get("search")
	q := `SELECT * FROM "salesAccount" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !sa {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("crmAccountName" ILIKE $%d OR "crmAccountIndustry" ILIKE $%d OR "crmAccountEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY "crmAccountCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesAccount" ("crmAccountName","crmAccountIndustry","crmAccountEmail","crmAccountPhone","crmAccountWebsite","crmAccountAddress","crmAccountNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
	`, body["crmAccountName"], body["crmAccountIndustry"], body["crmAccountEmail"], body["crmAccountPhone"],
		body["crmAccountWebsite"], body["crmAccountAddress"], body["crmAccountNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesAccount" WHERE "crmAccountId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Account")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesAccount" SET "crmAccountName"=COALESCE($2,"crmAccountName"),"crmAccountIndustry"=COALESCE($3,"crmAccountIndustry"),
			"crmAccountEmail"=COALESCE($4,"crmAccountEmail"),"crmAccountPhone"=COALESCE($5,"crmAccountPhone"),
			"crmAccountWebsite"=COALESCE($6,"crmAccountWebsite"),"crmAccountAddress"=COALESCE($7,"crmAccountAddress"),
			"crmAccountNotes"=COALESCE($8,"crmAccountNotes")
		WHERE "crmAccountId"=$1 RETURNING *
	`, id, body["crmAccountName"], body["crmAccountIndustry"], body["crmAccountEmail"],
		body["crmAccountPhone"], body["crmAccountWebsite"], body["crmAccountAddress"], body["crmAccountNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesAccount" SET "isActive"=false WHERE "crmAccountId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Opportunities ----

func (h *Handler) ListOpportunities(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOpportunity" o
		LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOpportunityAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !sa {
		q += ` AND o."isActive" = true`
	}
	if stage := r.URL.Query().Get("stage"); stage != "" {
		q += fmt.Sprintf(` AND o."crmOpportunityStage" = $%d`, argIdx)
		args = append(args, stage)
	}
	q += ` ORDER BY o."crmOpportunityCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q, args...)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateOpportunity(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesOpportunity" ("crmOpportunityName","crmOpportunityStage","crmOpportunityAmount","crmOpportunityProbability",
			"crmOpportunityExpectedCloseDate","crmOpportunityContactId","crmOpportunityAccountId","crmOpportunityAssignedTo","crmOpportunitySource","crmOpportunityNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmOpportunityName"], body["crmOpportunityStage"], body["crmOpportunityAmount"], body["crmOpportunityProbability"],
		body["crmOpportunityExpectedCloseDate"], body["crmOpportunityContactId"], body["crmOpportunityAccountId"],
		body["crmOpportunityAssignedTo"], body["crmOpportunitySource"], body["crmOpportunityNotes"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOpportunity" o LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOpportunityAccountId" WHERE o."crmOpportunityId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Opportunity")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesOpportunity" SET
			"crmOpportunityName"=COALESCE($2,"crmOpportunityName"),"crmOpportunityStage"=COALESCE($3,"crmOpportunityStage"),
			"crmOpportunityAmount"=COALESCE($4,"crmOpportunityAmount"),"crmOpportunityProbability"=COALESCE($5,"crmOpportunityProbability"),
			"crmOpportunityNotes"=COALESCE($6,"crmOpportunityNotes"),"crmOpportunityAssignedTo"=COALESCE($7,"crmOpportunityAssignedTo")
		WHERE "crmOpportunityId"=$1 RETURNING *
	`, id, body["crmOpportunityName"], body["crmOpportunityStage"], body["crmOpportunityAmount"],
		body["crmOpportunityProbability"], body["crmOpportunityNotes"], body["crmOpportunityAssignedTo"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteOpportunity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesOpportunity" SET "isActive"=false WHERE "crmOpportunityId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Quotations ----

func (h *Handler) ListQuotations(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT q.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesQuotation" q
		LEFT JOIN "salesContact" c ON c."crmContactId"=q."crmQuotationContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=q."crmQuotationAccountId"
		WHERE 1=1`
	if !sa {
		q += ` AND q."isActive" = true`
	}
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` AND q."crmQuotationStatus" = '%s'`, status) // safe: enum value
	}
	q += ` ORDER BY q."crmQuotationCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateQuotation(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesQuotation" ("crmQuotationOpportunityId","crmQuotationContactId","crmQuotationAccountId",
			"crmQuotationSubtotal","crmQuotationDiscount","crmQuotationTax","crmQuotationTotal","crmQuotationNotes",
			"crmQuotationTerms","crmQuotationValidUntil")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmQuotationOpportunityId"], body["crmQuotationContactId"], body["crmQuotationAccountId"],
		body["crmQuotationSubtotal"], body["crmQuotationDiscount"], body["crmQuotationTax"], body["crmQuotationTotal"],
		body["crmQuotationNotes"], body["crmQuotationTerms"], body["crmQuotationValidUntil"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	q, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesQuotation" WHERE "crmQuotationId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบใบเสนอราคา")
		return
	}
	lines, _ := db.QueryRows(r.Context(), h.pool, `SELECT * FROM "salesQuotationLine" WHERE "crmQuotationLineQuotationId"=$1 AND "isActive"=true ORDER BY "crmQuotationLineOrder"`, id)
	q["lines"] = lines
	response.OK(w, q)
}

func (h *Handler) UpdateQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)

	// Update quotation
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesQuotation" SET
			"crmQuotationSubtotal"=COALESCE($2,"crmQuotationSubtotal"),"crmQuotationDiscount"=COALESCE($3,"crmQuotationDiscount"),
			"crmQuotationTax"=COALESCE($4,"crmQuotationTax"),"crmQuotationTotal"=COALESCE($5,"crmQuotationTotal"),
			"crmQuotationNotes"=COALESCE($6,"crmQuotationNotes"),"crmQuotationTerms"=COALESCE($7,"crmQuotationTerms"),
			"crmQuotationValidUntil"=COALESCE($8,"crmQuotationValidUntil")
		WHERE "crmQuotationId"=$1 RETURNING *
	`, id, body["crmQuotationSubtotal"], body["crmQuotationDiscount"], body["crmQuotationTax"],
		body["crmQuotationTotal"], body["crmQuotationNotes"], body["crmQuotationTerms"], body["crmQuotationValidUntil"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update lines if provided
	if lines, ok := body["lines"].([]any); ok {
		h.pool.Exec(r.Context(), `UPDATE "salesQuotationLine" SET "isActive"=false WHERE "crmQuotationLineQuotationId"=$1`, id)
		for i, l := range lines {
			lm, _ := l.(map[string]any)
			if lm == nil {
				continue
			}
			h.pool.Exec(r.Context(), `
				INSERT INTO "salesQuotationLine" ("crmQuotationLineQuotationId","crmQuotationLineOrder","crmQuotationLineProductName",
					"crmQuotationLineDescription","crmQuotationLineQuantity","crmQuotationLineUnitPrice","crmQuotationLineDiscount","crmQuotationLineAmount")
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			`, id, i, lm["crmQuotationLineProductName"], lm["crmQuotationLineDescription"],
				lm["crmQuotationLineQuantity"], lm["crmQuotationLineUnitPrice"], lm["crmQuotationLineDiscount"], lm["crmQuotationLineAmount"])
		}
	}
	response.OK(w, data)
}

func (h *Handler) QuotationAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	userID := middleware.UserID(r.Context())

	switch body.Action {
	case "submit":
		h.pool.Exec(r.Context(), `UPDATE "salesQuotation" SET "crmQuotationStatus"='submitted' WHERE "crmQuotationId"=$1`, id)
	case "approve":
		h.pool.Exec(r.Context(), `UPDATE "salesQuotation" SET "crmQuotationStatus"='approved',"crmQuotationApprovedBy"=$2 WHERE "crmQuotationId"=$1`, id, userID)
	case "reject":
		h.pool.Exec(r.Context(), `UPDATE "salesQuotation" SET "crmQuotationStatus"='rejected',"crmQuotationApprovalNote"=$2 WHERE "crmQuotationId"=$1`, id, body.Note)
	case "convert_order":
		// Create order from quotation
		q, _ := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesQuotation" WHERE "crmQuotationId"=$1`, id)
		if q != nil {
			h.pool.Exec(r.Context(), `
				INSERT INTO "salesOrder" ("crmOrderQuotationId","crmOrderContactId","crmOrderAccountId","crmOrderSubtotal","crmOrderDiscount","crmOrderTax","crmOrderTotal","crmOrderCreatedBy")
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			`, id, q["crmQuotationContactId"], q["crmQuotationAccountId"], q["crmQuotationSubtotal"],
				q["crmQuotationDiscount"], q["crmQuotationTax"], q["crmQuotationTotal"], userID)
			h.pool.Exec(r.Context(), `UPDATE "salesQuotation" SET "crmQuotationStatus"='converted' WHERE "crmQuotationId"=$1`, id)
		}
	default:
		response.BadRequest(w, "action ไม่ถูกต้อง")
		return
	}
	response.OK(w, map[string]bool{"success": true})
}

func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesQuotation" SET "isActive"=false WHERE "crmQuotationId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Orders ----

func (h *Handler) ListOrders(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOrder" o
		LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOrderContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOrderAccountId"
		WHERE 1=1`
	if !sa {
		q += ` AND o."isActive" = true`
	}
	if status := r.URL.Query().Get("status"); status != "" {
		q += fmt.Sprintf(` AND o."crmOrderStatus" = '%s'`, status)
	}
	q += ` ORDER BY o."crmOrderCreatedAt" DESC`
	data, err := db.QueryRows(r.Context(), h.pool, q)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesOrder" ("crmOrderQuotationId","crmOrderContactId","crmOrderAccountId","crmOrderStatus",
			"crmOrderSubtotal","crmOrderDiscount","crmOrderTax","crmOrderTotal","crmOrderShippingAddress","crmOrderNotes","crmOrderCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["crmOrderQuotationId"], body["crmOrderContactId"], body["crmOrderAccountId"], body["crmOrderStatus"],
		body["crmOrderSubtotal"], body["crmOrderDiscount"], body["crmOrderTax"], body["crmOrderTotal"],
		body["crmOrderShippingAddress"], body["crmOrderNotes"], middleware.UserID(r.Context()))
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	data, err := db.QueryRow(r.Context(), h.pool, `SELECT * FROM "salesOrder" WHERE "crmOrderId"=$1`, id)
	if err != nil {
		response.NotFound(w, "ไม่พบ Order")
		return
	}
	response.OK(w, data)
}

func (h *Handler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)
	data, err := db.QueryRow(r.Context(), h.pool, `
		UPDATE "salesOrder" SET "crmOrderStatus"=COALESCE($2,"crmOrderStatus"),"crmOrderShippingAddress"=COALESCE($3,"crmOrderShippingAddress"),
			"crmOrderTrackingNumber"=COALESCE($4,"crmOrderTrackingNumber"),"crmOrderNotes"=COALESCE($5,"crmOrderNotes"),
			"crmOrderDeliveryDate"=COALESCE($6,"crmOrderDeliveryDate")
		WHERE "crmOrderId"=$1 RETURNING *
	`, id, body["crmOrderStatus"], body["crmOrderShippingAddress"], body["crmOrderTrackingNumber"],
		body["crmOrderNotes"], body["crmOrderDeliveryDate"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, data)
}

func (h *Handler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.pool.Exec(r.Context(), `UPDATE "salesOrder" SET "isActive"=false WHERE "crmOrderId"=$1`, id)
	response.OK(w, map[string]bool{"success": true})
}

// ---- Activities ----

func (h *Handler) ListActivities(w http.ResponseWriter, r *http.Request) {
	sa := middleware.IsSuperAdmin(r.Context())
	q := `SELECT * FROM "salesActivity" WHERE 1=1`
	if !sa {
		q += ` AND "isActive" = true`
	}
	if t := r.URL.Query().Get("type"); t != "" {
		q += fmt.Sprintf(` AND "crmActivityType" = '%s'`, t)
	}
	if s := r.URL.Query().Get("status"); s != "" {
		q += fmt.Sprintf(` AND "crmActivityStatus" = '%s'`, s)
	}
	q += ` ORDER BY "crmActivityDueDate" ASC NULLS LAST`
	data, err := db.QueryRows(r.Context(), h.pool, q)
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

func (h *Handler) ManageActivity(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	json.NewDecoder(r.Body).Decode(&body)

	if deleteID, ok := body["deleteId"].(string); ok && deleteID != "" {
		h.pool.Exec(r.Context(), `UPDATE "salesActivity" SET "isActive"=false WHERE "crmActivityId"=$1`, deleteID)
		response.OK(w, map[string]bool{"success": true})
		return
	}

	if actID, ok := body["crmActivityId"].(string); ok && actID != "" {
		data, err := db.QueryRow(r.Context(), h.pool, `
			UPDATE "salesActivity" SET "crmActivitySubject"=COALESCE($2,"crmActivitySubject"),
				"crmActivityStatus"=COALESCE($3,"crmActivityStatus"),"crmActivityDueDate"=COALESCE($4,"crmActivityDueDate"),
				"crmActivityDescription"=COALESCE($5,"crmActivityDescription")
			WHERE "crmActivityId"=$1 RETURNING *
		`, actID, body["crmActivitySubject"], body["crmActivityStatus"], body["crmActivityDueDate"], body["crmActivityDescription"])
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.OK(w, data)
		return
	}

	data, err := db.QueryRow(r.Context(), h.pool, `
		INSERT INTO "salesActivity" ("crmActivityType","crmActivityStatus","crmActivitySubject","crmActivityDueDate",
			"crmActivityContactId","crmActivityOpportunityId","crmActivityAccountId","crmActivityAssignedTo","crmActivityDescription","crmActivityPriority")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmActivityType"], body["crmActivityStatus"], body["crmActivitySubject"], body["crmActivityDueDate"],
		body["crmActivityContactId"], body["crmActivityOpportunityId"], body["crmActivityAccountId"],
		body["crmActivityAssignedTo"], body["crmActivityDescription"], body["crmActivityPriority"])
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Created(w, data)
}

func (h *Handler) Reports(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "coming_soon"})
}
