package sales

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Dashboard ----

func (s *Store) DashboardLeads(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "salesLeadId", "salesLeadCreatedAt" FROM "salesLead" WHERE "isActive" = true`)
}

func (s *Store) DashboardOpportunities(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "salesOpportunityId", "salesOpportunityStage", "salesOpportunityAmount",
		       "salesOpportunityProbability", "salesOpportunityAssignedTo"
		FROM "salesOpportunity" WHERE "isActive" = true
	`)
}

func (s *Store) DashboardOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "salesOrderId", "salesOrderStatus", "salesOrderTotal",
		       "salesOrderCreatedAt", "salesOrderCreatedBy"
		FROM "salesOrder" WHERE "isActive" = true
	`)
}

func (s *Store) DashboardActivities(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "salesActivityType", "salesActivitySubject", "salesActivityDueDate" FROM "salesActivity" WHERE "isActive" = true ORDER BY "salesActivityCreatedAt" DESC LIMIT 10`)
}

func (s *Store) DashboardStages(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "salesPipelineStageId", "salesPipelineStageName", "salesPipelineStageOrder", "salesPipelineStageColor" FROM "salesPipelineStage" ORDER BY "salesPipelineStageOrder"`)
}

func (s *Store) DashboardPipelineByStage(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			o."salesOpportunityStage",
			COALESCE(SUM(o."salesOpportunityAmount"), 0) AS "salesOpportunityAmount",
			p."salesPipelineStageColor"
		FROM "salesOpportunity" o
		LEFT JOIN "salesPipelineStage" p ON p."salesPipelineStageName" = o."salesOpportunityStage"
		WHERE o."isActive" = true
		  AND o."salesOpportunityStage" NOT IN ('won', 'lost')
		GROUP BY o."salesOpportunityStage", p."salesPipelineStageColor"
		ORDER BY MIN(COALESCE(p."salesPipelineStageOrder", 999))
	`)
}

func (s *Store) DashboardRevenueByMonth(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			to_char("salesOrderCreatedAt", 'YYYY-MM') AS "month",
			COALESCE(SUM("salesOrderTotal"), 0)       AS "revenue"
		FROM "salesOrder"
		WHERE "isActive" = true
		  AND "salesOrderStatus" NOT IN ('cancelled')
		  AND "salesOrderCreatedAt" >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY to_char("salesOrderCreatedAt", 'YYYY-MM')
		ORDER BY "month" ASC
	`)
}

func (s *Store) DashboardTopSalespeople(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT
			"salesOrderCreatedBy",
			COUNT(*) AS "salesOrderCount",
			COALESCE(SUM("salesOrderTotal"), 0) AS "revenue"
		FROM "salesOrder"
		WHERE "isActive" = true
		  AND "salesOrderStatus" NOT IN ('cancelled')
		  AND "salesOrderCreatedBy" IS NOT NULL
		  AND "salesOrderCreatedBy" != ''
		GROUP BY "salesOrderCreatedBy"
		ORDER BY "revenue" DESC
		LIMIT 10
	`)
}

// ---- Leads ----

func (s *Store) ListLeads(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT "salesLeadId", "salesLeadNo", "salesLeadName", "salesLeadEmail", "salesLeadPhone",
		"salesLeadCompany", "salesLeadPosition", "salesLeadSource", "salesLeadScore", "salesLeadStatus",
		"salesLeadAssignedTo", "salesLeadNotes", "salesLeadCreatedAt", "isActive"
		FROM "salesLead" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("salesLeadName" ILIKE $%d OR "salesLeadEmail" ILIKE $%d OR "salesLeadCompany" ILIKE $%d OR "salesLeadPhone" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "salesLeadCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateLead(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesLead" ("salesLeadName","salesLeadEmail","salesLeadPhone","salesLeadCompany","salesLeadPosition","salesLeadSource","salesLeadScore","salesLeadStatus","salesLeadAssignedTo","salesLeadNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["salesLeadName"], body["salesLeadEmail"], body["salesLeadPhone"], body["salesLeadCompany"],
		body["salesLeadPosition"], body["salesLeadSource"], body["salesLeadScore"], body["salesLeadStatus"],
		body["salesLeadAssignedTo"], body["salesLeadNotes"])
}

func (s *Store) GetLead(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "salesLeadId", "salesLeadNo", "salesLeadName", "salesLeadEmail", "salesLeadPhone",
		"salesLeadCompany", "salesLeadPosition", "salesLeadSource", "salesLeadScore", "salesLeadStatus",
		"salesLeadAssignedTo", "salesLeadNotes", "salesLeadCreatedAt", "isActive"
		FROM "salesLead" WHERE "salesLeadId" = $1`, id)
}

func (s *Store) UpdateLead(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesLead" SET
			"salesLeadName"=COALESCE($2,"salesLeadName"), "salesLeadEmail"=COALESCE($3,"salesLeadEmail"),
			"salesLeadPhone"=COALESCE($4,"salesLeadPhone"), "salesLeadCompany"=COALESCE($5,"salesLeadCompany"),
			"salesLeadStatus"=COALESCE($6,"salesLeadStatus"), "salesLeadScore"=COALESCE($7,"salesLeadScore"),
			"salesLeadAssignedTo"=COALESCE($8,"salesLeadAssignedTo"), "salesLeadNotes"=COALESCE($9,"salesLeadNotes")
		WHERE "salesLeadId"=$1 RETURNING *
	`, id, body["salesLeadName"], body["salesLeadEmail"], body["salesLeadPhone"], body["salesLeadCompany"],
		body["salesLeadStatus"], body["salesLeadScore"], body["salesLeadAssignedTo"], body["salesLeadNotes"])
}

func (s *Store) InsertLeadContact(ctx context.Context, name, email, phone, position any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesContact" ("salesContactFirstName","salesContactLastName","salesContactEmail","salesContactPhone","salesContactPosition")
		VALUES ($1,'',$2,$3,$4) RETURNING *
	`, name, email, phone, position)
}

func (s *Store) InsertLeadOpportunity(ctx context.Context, company, contactID, source any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOpportunity" ("salesOpportunityName","salesOpportunityContactId","salesOpportunitySource","salesOpportunityStage")
		VALUES ($1,$2,$3,'qualification') RETURNING *
	`, company, contactID, source)
}

func (s *Store) MarkLeadConverted(ctx context.Context, id string, contactID, oppID any) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesLead" SET "salesLeadStatus"='converted',"salesLeadConvertedContactId"=$2,"salesLeadConvertedOpportunityId"=$3 WHERE "salesLeadId"=$1`,
		id, contactID, oppID)
	return err
}

func (s *Store) DeleteLead(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesLead" SET "isActive"=false WHERE "salesLeadId"=$1`, id)
	return err
}

// ---- Contacts ----

func (s *Store) ListContacts(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT c."salesContactId", c."salesContactNo", c."salesContactFirstName", c."salesContactLastName",
		c."salesContactEmail", c."salesContactPhone", c."salesContactPosition", c."salesContactAccountId",
		c."salesContactAddress", c."salesContactTags", c."salesContactNotes", c."salesContactCreatedAt", c."isActive",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."salesAccountId" = c."salesContactAccountId" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND c."isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND (c."salesContactFirstName" ILIKE $%d OR c."salesContactLastName" ILIKE $%d OR c."salesContactEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY c."salesContactCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateContact(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesContact" ("salesContactFirstName","salesContactLastName","salesContactEmail","salesContactPhone","salesContactPosition","salesContactAccountId","salesContactNotes","salesContactAddress")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
	`, body["salesContactFirstName"], body["salesContactLastName"], body["salesContactEmail"], body["salesContactPhone"],
		body["salesContactPosition"], body["salesContactAccountId"], body["salesContactNotes"], body["salesContactAddress"])
}

func (s *Store) GetContact(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT c."salesContactId", c."salesContactNo", c."salesContactFirstName", c."salesContactLastName",
		c."salesContactEmail", c."salesContactPhone", c."salesContactPosition", c."salesContactAccountId",
		c."salesContactAddress", c."salesContactTags", c."salesContactNotes", c."salesContactCreatedAt", c."isActive",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."salesAccountId"=c."salesContactAccountId" WHERE c."salesContactId"=$1`, id)
}

func (s *Store) UpdateContact(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesContact" SET "salesContactFirstName"=COALESCE($2,"salesContactFirstName"),"salesContactLastName"=COALESCE($3,"salesContactLastName"),
			"salesContactEmail"=COALESCE($4,"salesContactEmail"),"salesContactPhone"=COALESCE($5,"salesContactPhone"),
			"salesContactPosition"=COALESCE($6,"salesContactPosition"),"salesContactAccountId"=COALESCE($7,"salesContactAccountId"),
			"salesContactNotes"=COALESCE($8,"salesContactNotes")
		WHERE "salesContactId"=$1 RETURNING *
	`, id, body["salesContactFirstName"], body["salesContactLastName"], body["salesContactEmail"],
		body["salesContactPhone"], body["salesContactPosition"], body["salesContactAccountId"], body["salesContactNotes"])
}

func (s *Store) DeleteContact(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesContact" SET "isActive"=false WHERE "salesContactId"=$1`, id)
	return err
}

// ---- Accounts ----

func (s *Store) ListAccounts(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT "salesAccountId", "salesAccountNo", "salesAccountName", "salesAccountIndustry",
		"salesAccountPhone", "salesAccountEmail", "salesAccountWebsite", "salesAccountEmployees",
		"salesAccountAnnualRevenue", "salesAccountAddress", "salesAccountNotes", "salesAccountCreatedAt", "isActive"
		FROM "salesAccount" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("salesAccountName" ILIKE $%d OR "salesAccountIndustry" ILIKE $%d OR "salesAccountEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY "salesAccountCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateAccount(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesAccount" ("salesAccountName","salesAccountIndustry","salesAccountEmail","salesAccountPhone","salesAccountWebsite","salesAccountAddress","salesAccountNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
	`, body["salesAccountName"], body["salesAccountIndustry"], body["salesAccountEmail"], body["salesAccountPhone"],
		body["salesAccountWebsite"], body["salesAccountAddress"], body["salesAccountNotes"])
}

func (s *Store) GetAccount(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "salesAccountId", "salesAccountNo", "salesAccountName", "salesAccountIndustry",
		"salesAccountPhone", "salesAccountEmail", "salesAccountWebsite", "salesAccountEmployees",
		"salesAccountAnnualRevenue", "salesAccountAddress", "salesAccountNotes", "salesAccountCreatedAt", "isActive"
		FROM "salesAccount" WHERE "salesAccountId"=$1`, id)
}

func (s *Store) UpdateAccount(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesAccount" SET "salesAccountName"=COALESCE($2,"salesAccountName"),"salesAccountIndustry"=COALESCE($3,"salesAccountIndustry"),
			"salesAccountEmail"=COALESCE($4,"salesAccountEmail"),"salesAccountPhone"=COALESCE($5,"salesAccountPhone"),
			"salesAccountWebsite"=COALESCE($6,"salesAccountWebsite"),"salesAccountAddress"=COALESCE($7,"salesAccountAddress"),
			"salesAccountNotes"=COALESCE($8,"salesAccountNotes")
		WHERE "salesAccountId"=$1 RETURNING *
	`, id, body["salesAccountName"], body["salesAccountIndustry"], body["salesAccountEmail"],
		body["salesAccountPhone"], body["salesAccountWebsite"], body["salesAccountAddress"], body["salesAccountNotes"])
}

func (s *Store) DeleteAccount(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesAccount" SET "isActive"=false WHERE "salesAccountId"=$1`, id)
	return err
}

// ---- Opportunities ----

func (s *Store) ListOpportunities(ctx context.Context, isSuperAdmin bool, stage string) ([]map[string]any, error) {
	q := `SELECT o."salesOpportunityId", o."salesOpportunityNo", o."salesOpportunityName", o."salesOpportunityStage",
		o."salesOpportunityAmount", o."salesOpportunityProbability", o."salesOpportunityExpectedCloseDate",
		o."salesOpportunityContactId", o."salesOpportunityAccountId", o."salesOpportunityAssignedTo",
		o."salesOpportunitySource", o."salesOpportunityNotes", o."salesOpportunityCreatedAt", o."isActive",
		CASE WHEN c."salesContactId" IS NOT NULL THEN json_build_object('salesContactId', c."salesContactId", 'salesContactFirstName', c."salesContactFirstName", 'salesContactLastName', c."salesContactLastName") ELSE NULL END AS "salesContact",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesOpportunity" o
		LEFT JOIN "salesContact" c ON c."salesContactId"=o."salesOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."salesAccountId"=o."salesOpportunityAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND o."isActive" = true`
	}
	if stage != "" {
		q += fmt.Sprintf(` AND o."salesOpportunityStage" = $%d`, argIdx)
		args = append(args, stage)
	}
	q += ` ORDER BY o."salesOpportunityCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateOpportunity(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOpportunity" ("salesOpportunityName","salesOpportunityStage","salesOpportunityAmount","salesOpportunityProbability",
			"salesOpportunityExpectedCloseDate","salesOpportunityContactId","salesOpportunityAccountId","salesOpportunityAssignedTo","salesOpportunitySource","salesOpportunityNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["salesOpportunityName"], body["salesOpportunityStage"], body["salesOpportunityAmount"], body["salesOpportunityProbability"],
		body["salesOpportunityExpectedCloseDate"], body["salesOpportunityContactId"], body["salesOpportunityAccountId"],
		body["salesOpportunityAssignedTo"], body["salesOpportunitySource"], body["salesOpportunityNotes"])
}

func (s *Store) GetOpportunity(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT o."salesOpportunityId", o."salesOpportunityNo", o."salesOpportunityName", o."salesOpportunityStage",
		o."salesOpportunityAmount", o."salesOpportunityProbability", o."salesOpportunityExpectedCloseDate",
		o."salesOpportunityContactId", o."salesOpportunityAccountId", o."salesOpportunityAssignedTo",
		o."salesOpportunitySource", o."salesOpportunityNotes", o."salesOpportunityCreatedAt", o."isActive",
		CASE WHEN c."salesContactId" IS NOT NULL THEN json_build_object('salesContactId', c."salesContactId", 'salesContactFirstName', c."salesContactFirstName", 'salesContactLastName', c."salesContactLastName") ELSE NULL END AS "salesContact",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesOpportunity" o LEFT JOIN "salesContact" c ON c."salesContactId"=o."salesOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."salesAccountId"=o."salesOpportunityAccountId" WHERE o."salesOpportunityId"=$1`, id)
}

func (s *Store) UpdateOpportunity(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesOpportunity" SET
			"salesOpportunityName"=COALESCE($2,"salesOpportunityName"),"salesOpportunityStage"=COALESCE($3,"salesOpportunityStage"),
			"salesOpportunityAmount"=COALESCE($4,"salesOpportunityAmount"),"salesOpportunityProbability"=COALESCE($5,"salesOpportunityProbability"),
			"salesOpportunityNotes"=COALESCE($6,"salesOpportunityNotes"),"salesOpportunityAssignedTo"=COALESCE($7,"salesOpportunityAssignedTo")
		WHERE "salesOpportunityId"=$1 RETURNING *
	`, id, body["salesOpportunityName"], body["salesOpportunityStage"], body["salesOpportunityAmount"],
		body["salesOpportunityProbability"], body["salesOpportunityNotes"], body["salesOpportunityAssignedTo"])
}

func (s *Store) DeleteOpportunity(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesOpportunity" SET "isActive"=false WHERE "salesOpportunityId"=$1`, id)
	return err
}

// ---- Quotations ----

func (s *Store) ListQuotations(ctx context.Context, isSuperAdmin bool, status string) ([]map[string]any, error) {
	q := `SELECT q."salesQuotationId", q."salesQuotationNo", q."salesQuotationStatus", q."salesQuotationTotal",
		q."salesQuotationValidUntil", q."salesQuotationCreatedAt", q."salesQuotationContactId", q."salesQuotationAccountId",
		q."salesQuotationOpportunityId", q."isActive",
		CASE WHEN c."salesContactId" IS NOT NULL THEN json_build_object('salesContactId', c."salesContactId", 'salesContactFirstName', c."salesContactFirstName", 'salesContactLastName', c."salesContactLastName") ELSE NULL END AS "salesContact",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesQuotation" q
		LEFT JOIN "salesContact" c ON c."salesContactId"=q."salesQuotationContactId"
		LEFT JOIN "salesAccount" a ON a."salesAccountId"=q."salesQuotationAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND q."isActive" = true`
	}
	if status != "" {
		q += fmt.Sprintf(` AND q."salesQuotationStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY q."salesQuotationCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateQuotation(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesQuotation" ("salesQuotationOpportunityId","salesQuotationContactId","salesQuotationAccountId",
			"salesQuotationSubtotal","salesQuotationDiscount","salesQuotationTax","salesQuotationTotal","salesQuotationNotes",
			"salesQuotationTerms","salesQuotationValidUntil")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["salesQuotationOpportunityId"], body["salesQuotationContactId"], body["salesQuotationAccountId"],
		body["salesQuotationSubtotal"], body["salesQuotationDiscount"], body["salesQuotationTax"], body["salesQuotationTotal"],
		body["salesQuotationNotes"], body["salesQuotationTerms"], body["salesQuotationValidUntil"])
}

func (s *Store) GetQuotationByID(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "salesQuotationId", "salesQuotationNo", "salesQuotationStatus",
		"salesQuotationSubtotal", "salesQuotationDiscount", "salesQuotationTax", "salesQuotationTotal",
		"salesQuotationValidUntil", "salesQuotationContactId", "salesQuotationAccountId", "salesQuotationOpportunityId",
		"salesQuotationNotes", "salesQuotationTerms", "salesQuotationApprovalNote", "salesQuotationApprovedBy",
		"salesQuotationCreatedAt", "isActive"
		FROM "salesQuotation" WHERE "salesQuotationId"=$1`, id)
}

func (s *Store) GetQuotationLines(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT "salesQuotationLineId", "salesQuotationLineQuotationId", "salesQuotationLineOrder",
		"salesQuotationLineProductName", "salesQuotationLineDescription", "salesQuotationLineQuantity",
		"salesQuotationLineUnitPrice", "salesQuotationLineDiscount", "salesQuotationLineAmount"
		FROM "salesQuotationLine" WHERE "salesQuotationLineQuotationId"=$1 AND "isActive"=true ORDER BY "salesQuotationLineOrder"`, id)
}

func (s *Store) UpdateQuotation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesQuotation" SET
			"salesQuotationSubtotal"=COALESCE($2,"salesQuotationSubtotal"),"salesQuotationDiscount"=COALESCE($3,"salesQuotationDiscount"),
			"salesQuotationTax"=COALESCE($4,"salesQuotationTax"),"salesQuotationTotal"=COALESCE($5,"salesQuotationTotal"),
			"salesQuotationNotes"=COALESCE($6,"salesQuotationNotes"),"salesQuotationTerms"=COALESCE($7,"salesQuotationTerms"),
			"salesQuotationValidUntil"=COALESCE($8,"salesQuotationValidUntil")
		WHERE "salesQuotationId"=$1 RETURNING *
	`, id, body["salesQuotationSubtotal"], body["salesQuotationDiscount"], body["salesQuotationTax"],
		body["salesQuotationTotal"], body["salesQuotationNotes"], body["salesQuotationTerms"], body["salesQuotationValidUntil"])
}

func (s *Store) DeactivateQuotationLines(ctx context.Context, quotationID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotationLine" SET "isActive"=false WHERE "salesQuotationLineQuotationId"=$1`, quotationID)
	return err
}

func (s *Store) InsertQuotationLine(ctx context.Context, quotationID string, order int, line map[string]any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "salesQuotationLine" ("salesQuotationLineQuotationId","salesQuotationLineOrder","salesQuotationLineProductName",
			"salesQuotationLineDescription","salesQuotationLineQuantity","salesQuotationLineUnitPrice","salesQuotationLineDiscount","salesQuotationLineAmount")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, quotationID, order, line["salesQuotationLineProductName"], line["salesQuotationLineDescription"],
		line["salesQuotationLineQuantity"], line["salesQuotationLineUnitPrice"], line["salesQuotationLineDiscount"], line["salesQuotationLineAmount"])
	return err
}

func (s *Store) SubmitQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "salesQuotationStatus"='submitted' WHERE "salesQuotationId"=$1`, id)
	return err
}

func (s *Store) ApproveQuotation(ctx context.Context, id, userID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "salesQuotationStatus"='approved',"salesQuotationApprovedBy"=$2 WHERE "salesQuotationId"=$1`, id, userID)
	return err
}

func (s *Store) RejectQuotation(ctx context.Context, id, note string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "salesQuotationStatus"='rejected',"salesQuotationApprovalNote"=$2 WHERE "salesQuotationId"=$1`, id, note)
	return err
}

func (s *Store) CreateOrderFromQuotation(ctx context.Context, quotationID, userID string, q map[string]any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "salesOrder" ("salesOrderQuotationId","salesOrderContactId","salesOrderAccountId","salesOrderSubtotal","salesOrderDiscount","salesOrderTax","salesOrderTotal","salesOrderCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, quotationID, q["salesQuotationContactId"], q["salesQuotationAccountId"], q["salesQuotationSubtotal"],
		q["salesQuotationDiscount"], q["salesQuotationTax"], q["salesQuotationTotal"], userID)
	return err
}

func (s *Store) ConvertQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "salesQuotationStatus"='converted' WHERE "salesQuotationId"=$1`, id)
	return err
}

func (s *Store) DeleteQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "isActive"=false WHERE "salesQuotationId"=$1`, id)
	return err
}

// ---- Orders ----

func (s *Store) ListOrders(ctx context.Context, isSuperAdmin bool, status string) ([]map[string]any, error) {
	q := `SELECT o."salesOrderId", o."salesOrderNo", o."salesOrderStatus", o."salesOrderTotal",
		o."salesOrderTrackingNumber", o."salesOrderDeliveryDate", o."salesOrderShippingAddress",
		o."salesOrderNotes", o."salesOrderQuotationId", o."salesOrderCreatedAt", o."isActive",
		CASE WHEN c."salesContactId" IS NOT NULL THEN json_build_object('salesContactId', c."salesContactId", 'salesContactFirstName', c."salesContactFirstName", 'salesContactLastName', c."salesContactLastName") ELSE NULL END AS "salesContact",
		CASE WHEN a."salesAccountId" IS NOT NULL THEN json_build_object('salesAccountId', a."salesAccountId", 'salesAccountName', a."salesAccountName") ELSE NULL END AS "salesAccount"
		FROM "salesOrder" o
		LEFT JOIN "salesContact" c ON c."salesContactId"=o."salesOrderContactId"
		LEFT JOIN "salesAccount" a ON a."salesAccountId"=o."salesOrderAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND o."isActive" = true`
	}
	if status != "" {
		q += fmt.Sprintf(` AND o."salesOrderStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY o."salesOrderCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateOrder(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOrder" ("salesOrderQuotationId","salesOrderContactId","salesOrderAccountId","salesOrderStatus",
			"salesOrderSubtotal","salesOrderDiscount","salesOrderTax","salesOrderTotal","salesOrderShippingAddress","salesOrderNotes","salesOrderCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["salesOrderQuotationId"], body["salesOrderContactId"], body["salesOrderAccountId"], body["salesOrderStatus"],
		body["salesOrderSubtotal"], body["salesOrderDiscount"], body["salesOrderTax"], body["salesOrderTotal"],
		body["salesOrderShippingAddress"], body["salesOrderNotes"], userID)
}

func (s *Store) GetOrder(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "salesOrderId", "salesOrderNo", "salesOrderStatus", "salesOrderTotal",
		"salesOrderTrackingNumber", "salesOrderDeliveryDate", "salesOrderShippingAddress",
		"salesOrderNotes", "salesOrderQuotationId", "salesOrderContactId", "salesOrderAccountId",
		"salesOrderCreatedAt", "salesOrderCreatedBy", "isActive"
		FROM "salesOrder" WHERE "salesOrderId"=$1`, id)
}

func (s *Store) UpdateOrder(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesOrder" SET "salesOrderStatus"=COALESCE($2,"salesOrderStatus"),"salesOrderShippingAddress"=COALESCE($3,"salesOrderShippingAddress"),
			"salesOrderTrackingNumber"=COALESCE($4,"salesOrderTrackingNumber"),"salesOrderNotes"=COALESCE($5,"salesOrderNotes"),
			"salesOrderDeliveryDate"=COALESCE($6,"salesOrderDeliveryDate")
		WHERE "salesOrderId"=$1 RETURNING *
	`, id, body["salesOrderStatus"], body["salesOrderShippingAddress"], body["salesOrderTrackingNumber"],
		body["salesOrderNotes"], body["salesOrderDeliveryDate"])
}

func (s *Store) DeleteOrder(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesOrder" SET "isActive"=false WHERE "salesOrderId"=$1`, id)
	return err
}

// ---- Activities ----

func (s *Store) ListActivities(ctx context.Context, isSuperAdmin bool, actType, status string) ([]map[string]any, error) {
	q := `SELECT "salesActivityId", "salesActivityType", "salesActivitySubject", "salesActivityDescription",
		"salesActivityStatus", "salesActivityPriority", "salesActivityDueDate", "salesActivityContactId",
		"salesActivityOpportunityId", "salesActivityAccountId", "salesActivityAssignedTo", "salesActivityCreatedAt", "isActive"
		FROM "salesActivity" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if actType != "" {
		q += fmt.Sprintf(` AND "salesActivityType" = $%d`, argIdx)
		args = append(args, actType)
		argIdx++
	}
	if status != "" {
		q += fmt.Sprintf(` AND "salesActivityStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY "salesActivityDueDate" ASC NULLS LAST`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) DeleteActivity(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesActivity" SET "isActive"=false WHERE "salesActivityId"=$1`, id)
	return err
}

func (s *Store) UpdateActivity(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesActivity" SET "salesActivitySubject"=COALESCE($2,"salesActivitySubject"),
			"salesActivityStatus"=COALESCE($3,"salesActivityStatus"),"salesActivityDueDate"=COALESCE($4,"salesActivityDueDate"),
			"salesActivityDescription"=COALESCE($5,"salesActivityDescription")
		WHERE "salesActivityId"=$1 RETURNING *
	`, id, body["salesActivitySubject"], body["salesActivityStatus"], body["salesActivityDueDate"], body["salesActivityDescription"])
}

func (s *Store) CreateActivity(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesActivity" ("salesActivityType","salesActivityStatus","salesActivitySubject","salesActivityDueDate",
			"salesActivityContactId","salesActivityOpportunityId","salesActivityAccountId","salesActivityAssignedTo","salesActivityDescription","salesActivityPriority")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["salesActivityType"], body["salesActivityStatus"], body["salesActivitySubject"], body["salesActivityDueDate"],
		body["salesActivityContactId"], body["salesActivityOpportunityId"], body["salesActivityAccountId"],
		body["salesActivityAssignedTo"], body["salesActivityDescription"], body["salesActivityPriority"])
}
