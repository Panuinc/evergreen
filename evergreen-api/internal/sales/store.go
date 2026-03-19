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
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesLead" WHERE "isActive" = true`)
}

func (s *Store) DashboardOpportunities(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesOpportunity" WHERE "isActive" = true`)
}

func (s *Store) DashboardOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesOrder" WHERE "isActive" = true`)
}

func (s *Store) DashboardActivities(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesActivity" WHERE "isActive" = true ORDER BY "crmActivityCreatedAt" DESC LIMIT 10`)
}

func (s *Store) DashboardStages(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesPipelineStage" ORDER BY "crmPipelineStageOrder"`)
}

// ---- Leads ----

func (s *Store) ListLeads(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT * FROM "salesLead" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("crmLeadName" ILIKE $%d OR "crmLeadEmail" ILIKE $%d OR "crmLeadCompany" ILIKE $%d OR "crmLeadPhone" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "crmLeadCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateLead(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesLead" ("crmLeadName","crmLeadEmail","crmLeadPhone","crmLeadCompany","crmLeadPosition","crmLeadSource","crmLeadScore","crmLeadStatus","crmLeadAssignedTo","crmLeadNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmLeadName"], body["crmLeadEmail"], body["crmLeadPhone"], body["crmLeadCompany"],
		body["crmLeadPosition"], body["crmLeadSource"], body["crmLeadScore"], body["crmLeadStatus"],
		body["crmLeadAssignedTo"], body["crmLeadNotes"])
}

func (s *Store) GetLead(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "salesLead" WHERE "crmLeadId" = $1`, id)
}

func (s *Store) UpdateLead(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesLead" SET
			"crmLeadName"=COALESCE($2,"crmLeadName"), "crmLeadEmail"=COALESCE($3,"crmLeadEmail"),
			"crmLeadPhone"=COALESCE($4,"crmLeadPhone"), "crmLeadCompany"=COALESCE($5,"crmLeadCompany"),
			"crmLeadStatus"=COALESCE($6,"crmLeadStatus"), "crmLeadScore"=COALESCE($7,"crmLeadScore"),
			"crmLeadAssignedTo"=COALESCE($8,"crmLeadAssignedTo"), "crmLeadNotes"=COALESCE($9,"crmLeadNotes")
		WHERE "crmLeadId"=$1 RETURNING *
	`, id, body["crmLeadName"], body["crmLeadEmail"], body["crmLeadPhone"], body["crmLeadCompany"],
		body["crmLeadStatus"], body["crmLeadScore"], body["crmLeadAssignedTo"], body["crmLeadNotes"])
}

func (s *Store) InsertLeadContact(ctx context.Context, name, email, phone, position any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesContact" ("crmContactFirstName","crmContactLastName","crmContactEmail","crmContactPhone","crmContactPosition")
		VALUES ($1,'',$2,$3,$4) RETURNING *
	`, name, email, phone, position)
}

func (s *Store) InsertLeadOpportunity(ctx context.Context, company, contactID, source any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOpportunity" ("crmOpportunityName","crmOpportunityContactId","crmOpportunitySource","crmOpportunityStage")
		VALUES ($1,$2,$3,'qualification') RETURNING *
	`, company, contactID, source)
}

func (s *Store) MarkLeadConverted(ctx context.Context, id string, contactID, oppID any) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesLead" SET "crmLeadStatus"='converted',"crmLeadConvertedContactId"=$2,"crmLeadConvertedOpportunityId"=$3 WHERE "crmLeadId"=$1`,
		id, contactID, oppID)
	return err
}

func (s *Store) DeleteLead(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesLead" SET "isActive"=false WHERE "crmLeadId"=$1`, id)
	return err
}

// ---- Contacts ----

func (s *Store) ListContacts(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT c.*, row_to_json(a.*) as "salesAccount" FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."crmAccountId" = c."crmContactAccountId" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND c."isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND (c."crmContactFirstName" ILIKE $%d OR c."crmContactLastName" ILIKE $%d OR c."crmContactEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY c."crmContactCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateContact(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesContact" ("crmContactFirstName","crmContactLastName","crmContactEmail","crmContactPhone","crmContactPosition","crmContactAccountId","crmContactNotes","crmContactAddress")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
	`, body["crmContactFirstName"], body["crmContactLastName"], body["crmContactEmail"], body["crmContactPhone"],
		body["crmContactPosition"], body["crmContactAccountId"], body["crmContactNotes"], body["crmContactAddress"])
}

func (s *Store) GetContact(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT c.*, row_to_json(a.*) as "salesAccount" FROM "salesContact" c LEFT JOIN "salesAccount" a ON a."crmAccountId"=c."crmContactAccountId" WHERE c."crmContactId"=$1`, id)
}

func (s *Store) UpdateContact(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesContact" SET "crmContactFirstName"=COALESCE($2,"crmContactFirstName"),"crmContactLastName"=COALESCE($3,"crmContactLastName"),
			"crmContactEmail"=COALESCE($4,"crmContactEmail"),"crmContactPhone"=COALESCE($5,"crmContactPhone"),
			"crmContactPosition"=COALESCE($6,"crmContactPosition"),"crmContactAccountId"=COALESCE($7,"crmContactAccountId"),
			"crmContactNotes"=COALESCE($8,"crmContactNotes")
		WHERE "crmContactId"=$1 RETURNING *
	`, id, body["crmContactFirstName"], body["crmContactLastName"], body["crmContactEmail"],
		body["crmContactPhone"], body["crmContactPosition"], body["crmContactAccountId"], body["crmContactNotes"])
}

func (s *Store) DeleteContact(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesContact" SET "isActive"=false WHERE "crmContactId"=$1`, id)
	return err
}

// ---- Accounts ----

func (s *Store) ListAccounts(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT * FROM "salesAccount" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("crmAccountName" ILIKE $%d OR "crmAccountIndustry" ILIKE $%d OR "crmAccountEmail" ILIKE $%d)`, argIdx, argIdx+1, argIdx+2)
		p := "%" + search + "%"
		args = append(args, p, p, p)
	}
	q += ` ORDER BY "crmAccountCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateAccount(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesAccount" ("crmAccountName","crmAccountIndustry","crmAccountEmail","crmAccountPhone","crmAccountWebsite","crmAccountAddress","crmAccountNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
	`, body["crmAccountName"], body["crmAccountIndustry"], body["crmAccountEmail"], body["crmAccountPhone"],
		body["crmAccountWebsite"], body["crmAccountAddress"], body["crmAccountNotes"])
}

func (s *Store) GetAccount(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "salesAccount" WHERE "crmAccountId"=$1`, id)
}

func (s *Store) UpdateAccount(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesAccount" SET "crmAccountName"=COALESCE($2,"crmAccountName"),"crmAccountIndustry"=COALESCE($3,"crmAccountIndustry"),
			"crmAccountEmail"=COALESCE($4,"crmAccountEmail"),"crmAccountPhone"=COALESCE($5,"crmAccountPhone"),
			"crmAccountWebsite"=COALESCE($6,"crmAccountWebsite"),"crmAccountAddress"=COALESCE($7,"crmAccountAddress"),
			"crmAccountNotes"=COALESCE($8,"crmAccountNotes")
		WHERE "crmAccountId"=$1 RETURNING *
	`, id, body["crmAccountName"], body["crmAccountIndustry"], body["crmAccountEmail"],
		body["crmAccountPhone"], body["crmAccountWebsite"], body["crmAccountAddress"], body["crmAccountNotes"])
}

func (s *Store) DeleteAccount(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesAccount" SET "isActive"=false WHERE "crmAccountId"=$1`, id)
	return err
}

// ---- Opportunities ----

func (s *Store) ListOpportunities(ctx context.Context, isSuperAdmin bool, stage string) ([]map[string]any, error) {
	q := `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOpportunity" o
		LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOpportunityAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND o."isActive" = true`
	}
	if stage != "" {
		q += fmt.Sprintf(` AND o."crmOpportunityStage" = $%d`, argIdx)
		args = append(args, stage)
	}
	q += ` ORDER BY o."crmOpportunityCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateOpportunity(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOpportunity" ("crmOpportunityName","crmOpportunityStage","crmOpportunityAmount","crmOpportunityProbability",
			"crmOpportunityExpectedCloseDate","crmOpportunityContactId","crmOpportunityAccountId","crmOpportunityAssignedTo","crmOpportunitySource","crmOpportunityNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmOpportunityName"], body["crmOpportunityStage"], body["crmOpportunityAmount"], body["crmOpportunityProbability"],
		body["crmOpportunityExpectedCloseDate"], body["crmOpportunityContactId"], body["crmOpportunityAccountId"],
		body["crmOpportunityAssignedTo"], body["crmOpportunitySource"], body["crmOpportunityNotes"])
}

func (s *Store) GetOpportunity(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOpportunity" o LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOpportunityContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOpportunityAccountId" WHERE o."crmOpportunityId"=$1`, id)
}

func (s *Store) UpdateOpportunity(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesOpportunity" SET
			"crmOpportunityName"=COALESCE($2,"crmOpportunityName"),"crmOpportunityStage"=COALESCE($3,"crmOpportunityStage"),
			"crmOpportunityAmount"=COALESCE($4,"crmOpportunityAmount"),"crmOpportunityProbability"=COALESCE($5,"crmOpportunityProbability"),
			"crmOpportunityNotes"=COALESCE($6,"crmOpportunityNotes"),"crmOpportunityAssignedTo"=COALESCE($7,"crmOpportunityAssignedTo")
		WHERE "crmOpportunityId"=$1 RETURNING *
	`, id, body["crmOpportunityName"], body["crmOpportunityStage"], body["crmOpportunityAmount"],
		body["crmOpportunityProbability"], body["crmOpportunityNotes"], body["crmOpportunityAssignedTo"])
}

func (s *Store) DeleteOpportunity(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesOpportunity" SET "isActive"=false WHERE "crmOpportunityId"=$1`, id)
	return err
}

// ---- Quotations ----

func (s *Store) ListQuotations(ctx context.Context, isSuperAdmin bool, status string) ([]map[string]any, error) {
	q := `SELECT q.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesQuotation" q
		LEFT JOIN "salesContact" c ON c."crmContactId"=q."crmQuotationContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=q."crmQuotationAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND q."isActive" = true`
	}
	if status != "" {
		q += fmt.Sprintf(` AND q."crmQuotationStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY q."crmQuotationCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateQuotation(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesQuotation" ("crmQuotationOpportunityId","crmQuotationContactId","crmQuotationAccountId",
			"crmQuotationSubtotal","crmQuotationDiscount","crmQuotationTax","crmQuotationTotal","crmQuotationNotes",
			"crmQuotationTerms","crmQuotationValidUntil")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmQuotationOpportunityId"], body["crmQuotationContactId"], body["crmQuotationAccountId"],
		body["crmQuotationSubtotal"], body["crmQuotationDiscount"], body["crmQuotationTax"], body["crmQuotationTotal"],
		body["crmQuotationNotes"], body["crmQuotationTerms"], body["crmQuotationValidUntil"])
}

func (s *Store) GetQuotationByID(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "salesQuotation" WHERE "crmQuotationId"=$1`, id)
}

func (s *Store) GetQuotationLines(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "salesQuotationLine" WHERE "crmQuotationLineQuotationId"=$1 AND "isActive"=true ORDER BY "crmQuotationLineOrder"`, id)
}

func (s *Store) UpdateQuotation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesQuotation" SET
			"crmQuotationSubtotal"=COALESCE($2,"crmQuotationSubtotal"),"crmQuotationDiscount"=COALESCE($3,"crmQuotationDiscount"),
			"crmQuotationTax"=COALESCE($4,"crmQuotationTax"),"crmQuotationTotal"=COALESCE($5,"crmQuotationTotal"),
			"crmQuotationNotes"=COALESCE($6,"crmQuotationNotes"),"crmQuotationTerms"=COALESCE($7,"crmQuotationTerms"),
			"crmQuotationValidUntil"=COALESCE($8,"crmQuotationValidUntil")
		WHERE "crmQuotationId"=$1 RETURNING *
	`, id, body["crmQuotationSubtotal"], body["crmQuotationDiscount"], body["crmQuotationTax"],
		body["crmQuotationTotal"], body["crmQuotationNotes"], body["crmQuotationTerms"], body["crmQuotationValidUntil"])
}

func (s *Store) DeactivateQuotationLines(ctx context.Context, quotationID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotationLine" SET "isActive"=false WHERE "crmQuotationLineQuotationId"=$1`, quotationID)
	return err
}

func (s *Store) InsertQuotationLine(ctx context.Context, quotationID string, order int, line map[string]any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "salesQuotationLine" ("crmQuotationLineQuotationId","crmQuotationLineOrder","crmQuotationLineProductName",
			"crmQuotationLineDescription","crmQuotationLineQuantity","crmQuotationLineUnitPrice","crmQuotationLineDiscount","crmQuotationLineAmount")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, quotationID, order, line["crmQuotationLineProductName"], line["crmQuotationLineDescription"],
		line["crmQuotationLineQuantity"], line["crmQuotationLineUnitPrice"], line["crmQuotationLineDiscount"], line["crmQuotationLineAmount"])
	return err
}

func (s *Store) SubmitQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "crmQuotationStatus"='submitted' WHERE "crmQuotationId"=$1`, id)
	return err
}

func (s *Store) ApproveQuotation(ctx context.Context, id, userID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "crmQuotationStatus"='approved',"crmQuotationApprovedBy"=$2 WHERE "crmQuotationId"=$1`, id, userID)
	return err
}

func (s *Store) RejectQuotation(ctx context.Context, id, note string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "crmQuotationStatus"='rejected',"crmQuotationApprovalNote"=$2 WHERE "crmQuotationId"=$1`, id, note)
	return err
}

func (s *Store) CreateOrderFromQuotation(ctx context.Context, quotationID, userID string, q map[string]any) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "salesOrder" ("crmOrderQuotationId","crmOrderContactId","crmOrderAccountId","crmOrderSubtotal","crmOrderDiscount","crmOrderTax","crmOrderTotal","crmOrderCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, quotationID, q["crmQuotationContactId"], q["crmQuotationAccountId"], q["crmQuotationSubtotal"],
		q["crmQuotationDiscount"], q["crmQuotationTax"], q["crmQuotationTotal"], userID)
	return err
}

func (s *Store) ConvertQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "crmQuotationStatus"='converted' WHERE "crmQuotationId"=$1`, id)
	return err
}

func (s *Store) DeleteQuotation(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesQuotation" SET "isActive"=false WHERE "crmQuotationId"=$1`, id)
	return err
}

// ---- Orders ----

func (s *Store) ListOrders(ctx context.Context, isSuperAdmin bool, status string) ([]map[string]any, error) {
	q := `SELECT o.*, row_to_json(c.*) as "salesContact", row_to_json(a.*) as "salesAccount"
		FROM "salesOrder" o
		LEFT JOIN "salesContact" c ON c."crmContactId"=o."crmOrderContactId"
		LEFT JOIN "salesAccount" a ON a."crmAccountId"=o."crmOrderAccountId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND o."isActive" = true`
	}
	if status != "" {
		q += fmt.Sprintf(` AND o."crmOrderStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY o."crmOrderCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateOrder(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesOrder" ("crmOrderQuotationId","crmOrderContactId","crmOrderAccountId","crmOrderStatus",
			"crmOrderSubtotal","crmOrderDiscount","crmOrderTax","crmOrderTotal","crmOrderShippingAddress","crmOrderNotes","crmOrderCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["crmOrderQuotationId"], body["crmOrderContactId"], body["crmOrderAccountId"], body["crmOrderStatus"],
		body["crmOrderSubtotal"], body["crmOrderDiscount"], body["crmOrderTax"], body["crmOrderTotal"],
		body["crmOrderShippingAddress"], body["crmOrderNotes"], userID)
}

func (s *Store) GetOrder(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "salesOrder" WHERE "crmOrderId"=$1`, id)
}

func (s *Store) UpdateOrder(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesOrder" SET "crmOrderStatus"=COALESCE($2,"crmOrderStatus"),"crmOrderShippingAddress"=COALESCE($3,"crmOrderShippingAddress"),
			"crmOrderTrackingNumber"=COALESCE($4,"crmOrderTrackingNumber"),"crmOrderNotes"=COALESCE($5,"crmOrderNotes"),
			"crmOrderDeliveryDate"=COALESCE($6,"crmOrderDeliveryDate")
		WHERE "crmOrderId"=$1 RETURNING *
	`, id, body["crmOrderStatus"], body["crmOrderShippingAddress"], body["crmOrderTrackingNumber"],
		body["crmOrderNotes"], body["crmOrderDeliveryDate"])
}

func (s *Store) DeleteOrder(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesOrder" SET "isActive"=false WHERE "crmOrderId"=$1`, id)
	return err
}

// ---- Activities ----

func (s *Store) ListActivities(ctx context.Context, isSuperAdmin bool, actType, status string) ([]map[string]any, error) {
	q := `SELECT * FROM "salesActivity" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if actType != "" {
		q += fmt.Sprintf(` AND "crmActivityType" = $%d`, argIdx)
		args = append(args, actType)
		argIdx++
	}
	if status != "" {
		q += fmt.Sprintf(` AND "crmActivityStatus" = $%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY "crmActivityDueDate" ASC NULLS LAST`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) DeleteActivity(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE "salesActivity" SET "isActive"=false WHERE "crmActivityId"=$1`, id)
	return err
}

func (s *Store) UpdateActivity(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "salesActivity" SET "crmActivitySubject"=COALESCE($2,"crmActivitySubject"),
			"crmActivityStatus"=COALESCE($3,"crmActivityStatus"),"crmActivityDueDate"=COALESCE($4,"crmActivityDueDate"),
			"crmActivityDescription"=COALESCE($5,"crmActivityDescription")
		WHERE "crmActivityId"=$1 RETURNING *
	`, id, body["crmActivitySubject"], body["crmActivityStatus"], body["crmActivityDueDate"], body["crmActivityDescription"])
}

func (s *Store) CreateActivity(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "salesActivity" ("crmActivityType","crmActivityStatus","crmActivitySubject","crmActivityDueDate",
			"crmActivityContactId","crmActivityOpportunityId","crmActivityAccountId","crmActivityAssignedTo","crmActivityDescription","crmActivityPriority")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
	`, body["crmActivityType"], body["crmActivityStatus"], body["crmActivitySubject"], body["crmActivityDueDate"],
		body["crmActivityContactId"], body["crmActivityOpportunityId"], body["crmActivityAccountId"],
		body["crmActivityAssignedTo"], body["crmActivityDescription"], body["crmActivityPriority"])
}
