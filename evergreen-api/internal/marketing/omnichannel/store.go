package omnichannel

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

// ---- Conversations ----

func (s *Store) ListConversations(ctx context.Context, status, channel string) ([]map[string]any, error) {
	q := `SELECT c.*, row_to_json(ct.*) as "omContact"
		FROM "omConversation" c
		LEFT JOIN "omContact" ct ON ct."omContactId" = c."omConversationContactId"
		WHERE c."isActive" = true`
	args := []any{}
	argIdx := 1
	if status != "" {
		q += fmt.Sprintf(` AND c."omConversationStatus" = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if channel != "" {
		q += fmt.Sprintf(` AND c."omConversationChannelType" = $%d`, argIdx)
		args = append(args, channel)
	}
	q += ` ORDER BY c."omConversationLastMessageAt" DESC NULLS LAST`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetConversation(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT c.*, row_to_json(ct.*) as "omContact"
		FROM "omConversation" c LEFT JOIN "omContact" ct ON ct."omContactId"=c."omConversationContactId"
		WHERE c."omConversationId"=$1`, id)
}

func (s *Store) UpdateConversation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "omConversation" SET
			"omConversationStatus"=COALESCE($2,"omConversationStatus"),
			"omConversationAssignedTo"=COALESCE($3,"omConversationAssignedTo"),
			"omConversationUnreadCount"=COALESCE($4,"omConversationUnreadCount"),
			"omConversationAiAutoReply"=COALESCE($5,"omConversationAiAutoReply")
		WHERE "omConversationId"=$1 RETURNING *
	`, id, body["omConversationStatus"], body["omConversationAssignedTo"],
		body["omConversationUnreadCount"], body["omConversationAiAutoReply"])
}

func (s *Store) SoftDeleteConversation(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "omConversation" SET "isActive"=false WHERE "omConversationId"=$1`, id)
	s.pool.Exec(ctx, `UPDATE "omMessage" SET "isActive"=false WHERE "omMessageConversationId"=$1`, id)
}

func (s *Store) ListMessages(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "omMessage" WHERE "omMessageConversationId"=$1 AND "isActive"=true
		ORDER BY "omMessageCreatedAt" ASC
	`, id)
}

// ---- Send Message ----

func (s *Store) GetConversationByID(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "omConversation" WHERE "omConversationId"=$1`, id)
}

func (s *Store) GetContactByID(ctx context.Context, contactID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "omContact" WHERE "omContactId"=$1`, contactID)
}

func (s *Store) GetActiveChannel(ctx context.Context, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "omChannel" WHERE "omChannelType"=$1 AND "omChannelStatus"='active' LIMIT 1`, channelType)
}

func (s *Store) InsertAgentMessage(ctx context.Context, conversationID, content, msgType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "omMessage" ("omMessageConversationId","omMessageSenderType","omMessageContent","omMessageType")
		VALUES ($1,'agent',$2,$3) RETURNING *
	`, conversationID, content, msgType)
}

func (s *Store) UpdateConversationAfterSend(ctx context.Context, conversationID, preview string) {
	s.pool.Exec(ctx, `
		UPDATE "omConversation" SET "omConversationLastMessageAt"=now(),"omConversationLastMessagePreview"=$2,"omConversationUnreadCount"=0
		WHERE "omConversationId"=$1
	`, conversationID, preview)
}

// ---- Quotations ----

func (s *Store) ListQuotations(ctx context.Context, convID, status string) ([]map[string]any, error) {
	q := `SELECT q.*, row_to_json(ct.*) as "omContact"
		FROM "omQuotation" q LEFT JOIN "omContact" ct ON ct."omContactId"=q."omQuotationContactId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if convID != "" {
		q += fmt.Sprintf(` AND q."omQuotationConversationId"=$%d`, argIdx)
		args = append(args, convID)
		argIdx++
	}
	if status != "" {
		q += fmt.Sprintf(` AND q."omQuotationStatus"=$%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY q."omQuotationCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetQuotation(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "omQuotation" WHERE "omQuotationId"=$1`, id)
}

func (s *Store) GetQuotationLines(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "omQuotationLine" WHERE "omQuotationLineQuotationId"=$1 ORDER BY "omQuotationLineOrder"
	`, id)
}

func (s *Store) UpdateQuotation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "omQuotation" SET
			"omQuotationCustomerName"=COALESCE($2,"omQuotationCustomerName"),
			"omQuotationCustomerPhone"=COALESCE($3,"omQuotationCustomerPhone"),
			"omQuotationCustomerAddress"=COALESCE($4,"omQuotationCustomerAddress"),
			"omQuotationPaymentMethod"=COALESCE($5,"omQuotationPaymentMethod"),
			"omQuotationNotes"=COALESCE($6,"omQuotationNotes"),
			"omQuotationUpdatedAt"=now()
		WHERE "omQuotationId"=$1 RETURNING *
	`, id, body["omQuotationCustomerName"], body["omQuotationCustomerPhone"],
		body["omQuotationCustomerAddress"], body["omQuotationPaymentMethod"], body["omQuotationNotes"])
}

func (s *Store) SubmitQuotation(ctx context.Context, id, userID string) {
	s.pool.Exec(ctx, `UPDATE "omQuotation" SET "omQuotationStatus"='pending_approval',"omQuotationSubmittedBy"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, userID)
}

func (s *Store) ApproveQuotation(ctx context.Context, id, userID string) {
	s.pool.Exec(ctx, `UPDATE "omQuotation" SET "omQuotationStatus"='approved',"omQuotationApprovedBy"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, userID)
}

func (s *Store) RejectQuotation(ctx context.Context, id, note string) {
	s.pool.Exec(ctx, `UPDATE "omQuotation" SET "omQuotationStatus"='rejected',"omQuotationApprovalNote"=$2,"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id, note)
}

func (s *Store) ConfirmPaymentQuotation(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "omQuotation" SET "omQuotationStatus"='paid',"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id)
}

func (s *Store) CancelQuotation(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "omQuotation" SET "omQuotationStatus"='cancelled',"omQuotationUpdatedAt"=now() WHERE "omQuotationId"=$1`, id)
}

// ---- Promotions ----

func (s *Store) ListPromotions(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "omPromotion" ORDER BY "omPromotionCreatedAt" DESC`)
}

func (s *Store) CreatePromotion(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "omPromotion" ("omPromotionName","omPromotionDescription","omPromotionType","omPromotionValue",
			"omPromotionMinQuantity","omPromotionApplicableProducts","omPromotionStartDate","omPromotionEndDate","omPromotionIsActive")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
	`, body["omPromotionName"], body["omPromotionDescription"], body["omPromotionType"], body["omPromotionValue"],
		body["omPromotionMinQuantity"], body["omPromotionApplicableProducts"], body["omPromotionStartDate"],
		body["omPromotionEndDate"], body["omPromotionIsActive"])
}

func (s *Store) UpdatePromotion(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "omPromotion" SET
			"omPromotionName"=COALESCE($2,"omPromotionName"),"omPromotionDescription"=COALESCE($3,"omPromotionDescription"),
			"omPromotionType"=COALESCE($4,"omPromotionType"),"omPromotionValue"=COALESCE($5,"omPromotionValue"),
			"omPromotionIsActive"=COALESCE($6,"omPromotionIsActive"),"omPromotionUpdatedAt"=now()
		WHERE "omPromotionId"=$1 RETURNING *
	`, id, body["omPromotionName"], body["omPromotionDescription"], body["omPromotionType"],
		body["omPromotionValue"], body["omPromotionIsActive"])
}

func (s *Store) DeletePromotion(ctx context.Context, id string) {
	s.pool.Exec(ctx, `DELETE FROM "omPromotion" WHERE "omPromotionId"=$1`, id)
}

// ---- Related Products ----

func (s *Store) ListRelatedProducts(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "omRelatedProduct" ORDER BY "omRelatedProductCreatedAt" DESC`)
}

func (s *Store) CreateRelatedProduct(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "omRelatedProduct" ("omRelatedProductSourceItem","omRelatedProductTargetItem","omRelatedProductType","omRelatedProductReason")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, body["omRelatedProductSourceItem"], body["omRelatedProductTargetItem"], body["omRelatedProductType"], body["omRelatedProductReason"])
}

func (s *Store) DeleteRelatedProduct(ctx context.Context, id string) {
	s.pool.Exec(ctx, `DELETE FROM "omRelatedProduct" WHERE "omRelatedProductId"=$1`, id)
}

// ---- Stock Items & Price Items ----

func (s *Store) ListStockItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "bcItem" WHERE "bcItemNo" LIKE 'FG-%' AND "bcItemBlocked" != 'true' ORDER BY "bcItemNo"
	`)
}

func (s *Store) ListPriceItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "omPriceItem"`)
}

func (s *Store) UpsertPriceItem(ctx context.Context, item map[string]any, userID string) {
	s.pool.Exec(ctx, `
		INSERT INTO "omPriceItem" ("omPriceItemNumber","omPriceItemName","omPriceItemUnitPrice","omPriceItemUpdatedBy")
		VALUES ($1,$2,$3,$4)
		ON CONFLICT ("omPriceItemNumber") DO UPDATE SET "omPriceItemName"=$2,"omPriceItemUnitPrice"=$3,"omPriceItemUpdatedBy"=$4,"omPriceItemUpdatedAt"=now()
	`, item["omPriceItemNumber"], item["omPriceItemName"], item["omPriceItemUnitPrice"], userID)
}

func (s *Store) ListProductInfo(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `SELECT * FROM "omProductInfo" ORDER BY "omProductInfoItemNumber"`)
}

func (s *Store) UpsertProductInfo(ctx context.Context, item map[string]any) {
	s.pool.Exec(ctx, `
		INSERT INTO "omProductInfo" ("omProductInfoItemNumber","omProductInfoDescription","omProductInfoHighlights","omProductInfoCategory","omProductInfoImageUrl")
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT ("omProductInfoItemNumber") DO UPDATE SET "omProductInfoDescription"=$2,"omProductInfoHighlights"=$3,"omProductInfoCategory"=$4,"omProductInfoImageUrl"=$5,"omProductInfoUpdatedAt"=now()
	`, item["itemNumber"], item["description"], item["highlights"], item["category"], item["imageUrl"])
}

// ---- Follow-ups ----

func (s *Store) ListFollowUps(ctx context.Context, status, convID string) ([]map[string]any, error) {
	q := `SELECT * FROM "omFollowUp" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if status != "" {
		q += fmt.Sprintf(` AND "omFollowUpStatus"=$%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if convID != "" {
		q += fmt.Sprintf(` AND "omFollowUpConversationId"=$%d`, argIdx)
		args = append(args, convID)
	}
	q += ` ORDER BY "omFollowUpCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateFollowUp(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "omFollowUp" ("omFollowUpConversationId","omFollowUpScheduledAt","omFollowUpMessage")
		VALUES ($1,$2,$3) RETURNING *
	`, body["omFollowUpConversationId"], body["omFollowUpScheduledAt"], body["omFollowUpMessage"])
}

func (s *Store) UpdateFollowUp(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "omFollowUp" SET
			"omFollowUpStatus"=COALESCE($2,"omFollowUpStatus"),
			"omFollowUpScheduledAt"=COALESCE($3,"omFollowUpScheduledAt"),
			"omFollowUpMessage"=COALESCE($4,"omFollowUpMessage")
		WHERE "omFollowUpId"=$1 RETURNING *
	`, id, body["omFollowUpStatus"], body["omFollowUpScheduledAt"], body["omFollowUpMessage"])
}

func (s *Store) CancelFollowUp(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "omFollowUp" SET "omFollowUpStatus"='cancelled' WHERE "omFollowUpId"=$1`, id)
}

func (s *Store) ListPendingFollowUps(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT * FROM "omFollowUp" WHERE "omFollowUpStatus"='pending' AND "omFollowUpScheduledAt" <= now() LIMIT 20
	`)
}

func (s *Store) MarkFollowUpSent(ctx context.Context, id string) {
	s.pool.Exec(ctx, `UPDATE "omFollowUp" SET "omFollowUpStatus"='sent',"omFollowUpSentAt"=now() WHERE "omFollowUpId"=$1`, id)
}

// ---- AI Settings ----

func (s *Store) GetAISettings(ctx context.Context) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `SELECT * FROM "omAiSetting" LIMIT 1`)
}

func (s *Store) UpdateAISettings(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "omAiSetting" SET
			"omAiSettingSystemPrompt"=COALESCE($1,"omAiSettingSystemPrompt"),
			"omAiSettingModel"=COALESCE($2,"omAiSettingModel"),
			"omAiSettingTemperature"=COALESCE($3,"omAiSettingTemperature"),
			"omAiSettingMaxHistoryMessages"=COALESCE($4,"omAiSettingMaxHistoryMessages"),
			"omAiSettingBankAccountInfo"=COALESCE($5,"omAiSettingBankAccountInfo"),
			"omAiSettingUpdatedAt"=now()
		WHERE true RETURNING *
	`, body["omAiSettingSystemPrompt"], body["omAiSettingModel"], body["omAiSettingTemperature"],
		body["omAiSettingMaxHistoryMessages"], body["omAiSettingBankAccountInfo"])
}
