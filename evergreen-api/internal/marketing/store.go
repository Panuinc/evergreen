package marketing

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/db"
	"github.com/evergreen/api/pkg/logger"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ---- Webhook / processIncomingMessage ----

func (s *Store) UpsertContact(ctx context.Context, channelType, externalID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktContact" ("mktContactChannelType","mktContactExternalRef","mktContactDisplayName")
		VALUES ($1,$2,$2)
		ON CONFLICT ("mktContactChannelType","mktContactExternalRef") DO UPDATE SET "mktContactDisplayName"=EXCLUDED."mktContactDisplayName"
		RETURNING *
	`, channelType, externalID)
}

func (s *Store) FindActiveConversation(ctx context.Context, contactID, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT * FROM "mktConversation" WHERE "mktConversationContactId"=$1 AND "mktConversationChannelType"=$2 AND "isActive"=true LIMIT 1
	`, contactID, channelType)
}

func (s *Store) CreateConversation(ctx context.Context, contactID, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktConversation" ("mktConversationContactId","mktConversationChannelType","mktConversationStatus","mktConversationAiAutoReply")
		VALUES ($1,$2,'open',true) RETURNING *
	`, contactID, channelType)
}

func (s *Store) InsertIncomingMessage(ctx context.Context, convID, senderID, text, externalMsgID string) {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO "mktMessage" ("mktMessageConversationId","mktMessageSenderType","mktMessageSenderRef","mktMessageContent","mktMessageType","mktMessageExternalRef")
		VALUES ($1,'customer',$2,$3,'text',$4)
	`, convID, senderID, text, externalMsgID)
	if err != nil {
		logger.Error("failed to insert incoming message", "convId", convID, "err", err)
	}
}

func (s *Store) UpdateConversationOnIncoming(ctx context.Context, convID, preview string) {
	s.pool.Exec(ctx, `
		UPDATE "mktConversation" SET "mktConversationLastMessageAt"=now(),"mktConversationLastMessagePreview"=$2,
			"mktConversationUnreadCount"=COALESCE("mktConversationUnreadCount",0)+1,"mktConversationStatus"='open'
		WHERE "mktConversationId"=$1
	`, convID, preview)
}

// ---- Analytics ----

func (s *Store) GetOnlineSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
	`)
}

func (s *Store) GetOnlineSalesOrderLines(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT l.* FROM "bcSalesOrderLine" l
		JOIN "bcSalesOrder" o ON o."bcSalesOrderNoValue" = l."bcSalesOrderLineDocumentNo"
		WHERE o."bcSalesOrderSalespersonCode" = 'ONLINE'
	`)
}

// ---- Sales Orders ----

func (s *Store) ListSalesOrders(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderSalespersonCode" = 'ONLINE'
		ORDER BY "bcSalesOrderOrderDate" DESC
	`)
}

func (s *Store) GetSalesOrder(ctx context.Context, no string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "bcSalesOrder" WHERE "bcSalesOrderNoValue"=$1`, no)
}

func (s *Store) GetSalesOrderLines(ctx context.Context, no string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcSalesOrderLine" WHERE "bcSalesOrderLineDocumentNo"=$1 ORDER BY "bcSalesOrderLineLineNo"
	`, no)
}

func (s *Store) GetCustomerPhone(ctx context.Context, custNo string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT "bcCustomerPhoneNo" FROM "bcCustomer" WHERE "bcCustomerNo"=$1`, custNo)
}

// ---- Work Orders ----

func (s *Store) ListWorkOrders(ctx context.Context, isSuperAdmin bool, search string) ([]map[string]any, error) {
	q := `SELECT * FROM "mktWorkOrder" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if !isSuperAdmin {
		q += ` AND "isActive" = true`
	}
	if search != "" {
		q += fmt.Sprintf(` AND ("mktWorkOrderNo" ILIKE $%d OR "mktWorkOrderTitle" ILIKE $%d OR "mktWorkOrderRequestedBy" ILIKE $%d OR "mktWorkOrderAssignedTo" ILIKE $%d)`,
			argIdx, argIdx+1, argIdx+2, argIdx+3)
		p := "%" + search + "%"
		args = append(args, p, p, p, p)
	}
	q += ` ORDER BY "mktWorkOrderCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateWorkOrder(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktWorkOrder" ("mktWorkOrderNo","mktWorkOrderTitle","mktWorkOrderDescription","mktWorkOrderType",
			"mktWorkOrderRequestedBy","mktWorkOrderRequestedDepartment","mktWorkOrderAssignedTo","mktWorkOrderPriority",
			"mktWorkOrderStartDate","mktWorkOrderDueDate","mktWorkOrderNotes")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
	`, body["mktWorkOrderNo"], body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderType"],
		body["mktWorkOrderRequestedBy"], body["mktWorkOrderRequestedDepartment"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStartDate"], body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
}

func (s *Store) GetWorkOrder(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "mktWorkOrder" WHERE id=$1`, id)
}

func (s *Store) UpdateWorkOrder(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktWorkOrder" SET
			"mktWorkOrderTitle"=COALESCE($2,"mktWorkOrderTitle"),"mktWorkOrderDescription"=COALESCE($3,"mktWorkOrderDescription"),
			"mktWorkOrderAssignedTo"=COALESCE($4,"mktWorkOrderAssignedTo"),"mktWorkOrderPriority"=COALESCE($5,"mktWorkOrderPriority"),
			"mktWorkOrderStatus"=COALESCE($6,"mktWorkOrderStatus"),"mktWorkOrderProgress"=COALESCE($7,"mktWorkOrderProgress"),
			"mktWorkOrderDueDate"=COALESCE($8,"mktWorkOrderDueDate"),"mktWorkOrderNotes"=COALESCE($9,"mktWorkOrderNotes")
		WHERE id=$1 RETURNING *
	`, id, body["mktWorkOrderTitle"], body["mktWorkOrderDescription"], body["mktWorkOrderAssignedTo"],
		body["mktWorkOrderPriority"], body["mktWorkOrderStatus"], body["mktWorkOrderProgress"],
		body["mktWorkOrderDueDate"], body["mktWorkOrderNotes"])
}

func (s *Store) SoftDeleteWorkOrder(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "mktWorkOrder" SET "isActive"=false WHERE id=$1`, id)
}

// ---- Work Order Progress ----

func (s *Store) ListWorkOrderProgress(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "mktWorkOrderProgressLog" WHERE "mktWorkOrderProgressLogWorkOrderId"=$1
		ORDER BY "mktWorkOrderProgressLogCreatedAt" DESC
	`, id)
}

func (s *Store) CreateWorkOrderProgress(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktWorkOrderProgressLog" ("mktWorkOrderProgressLogWorkOrderId","mktWorkOrderProgressLogDescription","mktWorkOrderProgressLogProgress","mktWorkOrderProgressLogCreatedBy")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, id, body["mktWorkOrderProgressLogDescription"], body["mktWorkOrderProgressLogProgress"], body["mktWorkOrderProgressLogCreatedBy"])
}

func (s *Store) UpdateWorkOrderProgress(ctx context.Context, id string, progress any) {
	s.pool.Exec(ctx, `UPDATE "mktWorkOrder" SET "mktWorkOrderProgress"=$2 WHERE id=$1`, id, progress)
}

// ---- Label Designs ----

func (s *Store) ListLabelDesigns(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "labelDesign" ORDER BY "labelDesignCreatedAt" DESC`)
}

func (s *Store) CreateLabelDesign(ctx context.Context, body map[string]any, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "labelDesign" ("labelDesignName","labelDesignWidth","labelDesignHeight","labelDesignPreset","labelDesignElements","labelDesignCreatedBy")
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
	`, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"],
		body["labelDesignPreset"], body["labelDesignElements"], userID)
}

func (s *Store) UpdateLabelDesign(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "labelDesign" SET
			"labelDesignName"=COALESCE($2,"labelDesignName"),"labelDesignWidth"=COALESCE($3,"labelDesignWidth"),
			"labelDesignHeight"=COALESCE($4,"labelDesignHeight"),"labelDesignElements"=COALESCE($5,"labelDesignElements"),
			"labelDesignUpdatedAt"=now()
		WHERE "labelDesignId"=$1 RETURNING *
	`, id, body["labelDesignName"], body["labelDesignWidth"], body["labelDesignHeight"], body["labelDesignElements"])
}

func (s *Store) DeleteLabelDesign(ctx context.Context, id string) {
	s.pool.Exec(ctx, `DELETE FROM "labelDesign" WHERE "labelDesignId"=$1`, id)
}

// ---- Image Generation ----

func (s *Store) CreateGeneratedImage(ctx context.Context, prompt, size, userID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktGeneratedImage" ("mktGeneratedImagePrompt","mktGeneratedImageSize","mktGeneratedImageCreatedBy","mktGeneratedImageResultUrl")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, prompt, size, userID, "pending")
}

func (s *Store) ListGeneratedImages(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "mktGeneratedImage" WHERE "isActive"=true ORDER BY "mktGeneratedImageCreatedAt" DESC LIMIT 50`)
}
