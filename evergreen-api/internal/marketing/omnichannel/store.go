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
	q := `SELECT c."mktConversationId", c."mktConversationContactId", c."mktConversationChannelType",
			c."mktConversationStatus", c."mktConversationLastMessageAt", c."mktConversationLastMessagePreview",
			c."mktConversationUnreadCount", c."mktConversationAiAutoReply",
			json_build_object(
				'mktContactId', ct."mktContactId",
				'mktContactDisplayName', ct."mktContactDisplayName",
				'mktContactChannelType', ct."mktContactChannelType",
				'mktContactExternalRef', ct."mktContactExternalRef",
				'mktContactAvatarUrl', ct."mktContactAvatarUrl"
			) as "mktContact"
		FROM "mktConversation" c
		LEFT JOIN "mktContact" ct ON ct."mktContactId" = c."mktConversationContactId"
		WHERE c."isActive" = true`
	args := []any{}
	argIdx := 1
	if status != "" {
		q += fmt.Sprintf(` AND c."mktConversationStatus" = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if channel != "" {
		q += fmt.Sprintf(` AND c."mktConversationChannelType" = $%d`, argIdx)
		args = append(args, channel)
	}
	q += ` ORDER BY c."mktConversationLastMessageAt" DESC NULLS LAST LIMIT 500`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetConversation(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT c."mktConversationId", c."mktConversationContactId", c."mktConversationChannelType",
			c."mktConversationStatus", c."mktConversationLastMessageAt", c."mktConversationLastMessagePreview",
			c."mktConversationUnreadCount", c."mktConversationAiAutoReply", c."mktConversationAssignedTo",
			json_build_object(
				'mktContactId', ct."mktContactId",
				'mktContactDisplayName', ct."mktContactDisplayName",
				'mktContactChannelType', ct."mktContactChannelType",
				'mktContactExternalRef', ct."mktContactExternalRef",
				'mktContactAvatarUrl', ct."mktContactAvatarUrl",
				'mktContactTags', ct."mktContactTags",
				'mktContactNotes', ct."mktContactNotes"
			) as "mktContact"
		FROM "mktConversation" c LEFT JOIN "mktContact" ct ON ct."mktContactId"=c."mktConversationContactId"
		WHERE c."mktConversationId"=$1`, id)
}

func (s *Store) UpdateConversation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktConversation" SET
			"mktConversationStatus"=COALESCE($2,"mktConversationStatus"),
			"mktConversationAssignedTo"=COALESCE($3,"mktConversationAssignedTo"),
			"mktConversationUnreadCount"=COALESCE($4,"mktConversationUnreadCount"),
			"mktConversationAiAutoReply"=COALESCE($5,"mktConversationAiAutoReply")
		WHERE "mktConversationId"=$1 RETURNING *
	`, id, body["mktConversationStatus"], body["mktConversationAssignedTo"],
		body["mktConversationUnreadCount"], body["mktConversationAiAutoReply"])
}

func (s *Store) SoftDeleteConversation(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktConversation" SET "isActive"=false WHERE "mktConversationId"=$1`, id); err != nil {
		return err
	}
	if _, err := s.pool.Exec(ctx, `UPDATE "mktMessage" SET "isActive"=false WHERE "mktMessageConversationId"=$1`, id); err != nil {
		return err
	}
	return nil
}

func (s *Store) ListMessages(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktMessageId", "mktMessageConversationId", "mktMessageSenderType", "mktMessageContent",
			"mktMessageType", "mktMessageImageUrl", "mktMessageIsAi", "mktMessageOcrData",
			"mktMessageCreatedAt"
		FROM "mktMessage" WHERE "mktMessageConversationId"=$1 AND "isActive"=true
		ORDER BY "mktMessageCreatedAt" ASC
	`, id)
}

// ---- Send Message ----

func (s *Store) GetConversationByID(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktConversationId", "mktConversationContactId", "mktConversationChannelType",
			"mktConversationStatus", "mktConversationAiAutoReply"
		FROM "mktConversation" WHERE "mktConversationId"=$1
	`, id)
}

func (s *Store) GetContactByID(ctx context.Context, contactID string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktContactId", "mktContactDisplayName", "mktContactChannelType",
			"mktContactExternalRef", "mktContactAvatarUrl"
		FROM "mktContact" WHERE "mktContactId"=$1
	`, contactID)
}

func (s *Store) UpdateContact(ctx context.Context, contactID string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktContact" SET
			"mktContactName"=COALESCE($2,"mktContactName"),
			"mktContactPhone"=COALESCE($3,"mktContactPhone"),
			"mktContactEmail"=COALESCE($4,"mktContactEmail"),
			"mktContactCompany"=COALESCE($5,"mktContactCompany"),
			"mktContactNotes"=COALESCE($6,"mktContactNotes"),
			"mktContactUpdatedAt"=now()
		WHERE "mktContactId"=$1 RETURNING *
	`, contactID, body["mktContactName"], body["mktContactPhone"],
		body["mktContactEmail"], body["mktContactCompany"], body["mktContactNotes"])
}

func (s *Store) GetActiveChannel(ctx context.Context, channelType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktChannelId", "mktChannelType", "mktChannelAccessToken", "mktChannelPageRef", "mktChannelStatus"
		FROM "mktChannel" WHERE "mktChannelType"=$1 AND "mktChannelStatus"='active' LIMIT 1
	`, channelType)
}

func (s *Store) InsertAgentMessage(ctx context.Context, conversationID, content, msgType string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktMessage" ("mktMessageConversationId","mktMessageSenderType","mktMessageContent","mktMessageType")
		VALUES ($1,'agent',$2,$3) RETURNING *
	`, conversationID, content, msgType)
}

func (s *Store) UpdateConversationAfterSend(ctx context.Context, conversationID, preview string) error {
	if _, err := s.pool.Exec(ctx, `
		UPDATE "mktConversation" SET "mktConversationLastMessageAt"=now(),"mktConversationLastMessagePreview"=$2,"mktConversationUnreadCount"=0
		WHERE "mktConversationId"=$1
	`, conversationID, preview); err != nil {
		return err
	}
	return nil
}

// ---- Quotations ----

func (s *Store) ListQuotations(ctx context.Context, convID, status string) ([]map[string]any, error) {
	q := `SELECT q."mktQuotationId", q."mktQuotationNumber", q."mktQuotationConversationId",
			q."mktQuotationContactId", q."mktQuotationCustomerName", q."mktQuotationStatus",
			q."mktQuotationCreatedAt", q."isActive",
			json_build_object(
				'mktContactId', ct."mktContactId",
				'mktContactDisplayName', ct."mktContactDisplayName",
				'mktContactChannelType', ct."mktContactChannelType"
			) as "mktContact"
		FROM "mktQuotation" q LEFT JOIN "mktContact" ct ON ct."mktContactId"=q."mktQuotationContactId"
		WHERE 1=1`
	args := []any{}
	argIdx := 1
	if convID != "" {
		q += fmt.Sprintf(` AND q."mktQuotationConversationId"=$%d`, argIdx)
		args = append(args, convID)
		argIdx++
	}
	if status != "" {
		q += fmt.Sprintf(` AND q."mktQuotationStatus"=$%d`, argIdx)
		args = append(args, status)
	}
	q += ` ORDER BY q."mktQuotationCreatedAt" DESC LIMIT 500`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) GetQuotation(ctx context.Context, id string) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktQuotationId", "mktQuotationNumber", "mktQuotationConversationId",
			"mktQuotationContactId", "mktQuotationCustomerName", "mktQuotationCustomerPhone",
			"mktQuotationCustomerAddress", "mktQuotationPaymentMethod", "mktQuotationNotes",
			"mktQuotationStatus", "mktQuotationApprovalNote", "mktQuotationSubmittedBy",
			"mktQuotationApprovedBy", "mktQuotationCreatedAt", "mktQuotationUpdatedAt"
		FROM "mktQuotation" WHERE "mktQuotationId"=$1
	`, id)
}

func (s *Store) GetQuotationLines(ctx context.Context, id string) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktQuotationLineId", "mktQuotationLineQuotationId", "mktQuotationLineProductName",
			"mktQuotationLineVariant", "mktQuotationLineQuantity", "mktQuotationLineUnitPrice",
			"mktQuotationLineOrder"
		FROM "mktQuotationLine" WHERE "mktQuotationLineQuotationId"=$1
		ORDER BY "mktQuotationLineOrder"
	`, id)
}

func (s *Store) UpdateQuotation(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktQuotation" SET
			"mktQuotationCustomerName"=COALESCE($2,"mktQuotationCustomerName"),
			"mktQuotationCustomerPhone"=COALESCE($3,"mktQuotationCustomerPhone"),
			"mktQuotationCustomerAddress"=COALESCE($4,"mktQuotationCustomerAddress"),
			"mktQuotationPaymentMethod"=COALESCE($5,"mktQuotationPaymentMethod"),
			"mktQuotationNotes"=COALESCE($6,"mktQuotationNotes"),
			"mktQuotationUpdatedAt"=now()
		WHERE "mktQuotationId"=$1 RETURNING *
	`, id, body["mktQuotationCustomerName"], body["mktQuotationCustomerPhone"],
		body["mktQuotationCustomerAddress"], body["mktQuotationPaymentMethod"], body["mktQuotationNotes"])
}

func (s *Store) SubmitQuotation(ctx context.Context, id, userID string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktQuotation" SET "mktQuotationStatus"='pending_approval',"mktQuotationSubmittedBy"=$2,"mktQuotationUpdatedAt"=now() WHERE "mktQuotationId"=$1`, id, userID); err != nil {
		return err
	}
	return nil
}

func (s *Store) ApproveQuotation(ctx context.Context, id, userID string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktQuotation" SET "mktQuotationStatus"='approved',"mktQuotationApprovedBy"=$2,"mktQuotationUpdatedAt"=now() WHERE "mktQuotationId"=$1`, id, userID); err != nil {
		return err
	}
	return nil
}

func (s *Store) RejectQuotation(ctx context.Context, id, note string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktQuotation" SET "mktQuotationStatus"='rejected',"mktQuotationApprovalNote"=$2,"mktQuotationUpdatedAt"=now() WHERE "mktQuotationId"=$1`, id, note); err != nil {
		return err
	}
	return nil
}

func (s *Store) ConfirmPaymentQuotation(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktQuotation" SET "mktQuotationStatus"='paid',"mktQuotationUpdatedAt"=now() WHERE "mktQuotationId"=$1`, id); err != nil {
		return err
	}
	return nil
}

func (s *Store) CancelQuotation(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktQuotation" SET "mktQuotationStatus"='cancelled',"mktQuotationUpdatedAt"=now() WHERE "mktQuotationId"=$1`, id); err != nil {
		return err
	}
	return nil
}

// ---- Promotions ----

func (s *Store) ListPromotions(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktPromotionId", "mktPromotionName", "mktPromotionDescription", "mktPromotionType",
			"mktPromotionValue", "mktPromotionMinQuantity", "mktPromotionApplicableProducts",
			"mktPromotionStartDate", "mktPromotionEndDate", "mktPromotionIsActive", "mktPromotionCreatedAt"
		FROM "mktPromotion" ORDER BY "mktPromotionCreatedAt" DESC LIMIT 200
	`)
}

func (s *Store) CreatePromotion(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktPromotion" ("mktPromotionName","mktPromotionDescription","mktPromotionType","mktPromotionValue",
			"mktPromotionMinQuantity","mktPromotionApplicableProducts","mktPromotionStartDate","mktPromotionEndDate","mktPromotionIsActive")
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
	`, body["mktPromotionName"], body["mktPromotionDescription"], body["mktPromotionType"], body["mktPromotionValue"],
		body["mktPromotionMinQuantity"], body["mktPromotionApplicableProducts"], body["mktPromotionStartDate"],
		body["mktPromotionEndDate"], body["mktPromotionIsActive"])
}

func (s *Store) UpdatePromotion(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktPromotion" SET
			"mktPromotionName"=COALESCE($2,"mktPromotionName"),"mktPromotionDescription"=COALESCE($3,"mktPromotionDescription"),
			"mktPromotionType"=COALESCE($4,"mktPromotionType"),"mktPromotionValue"=COALESCE($5,"mktPromotionValue"),
			"mktPromotionIsActive"=COALESCE($6,"mktPromotionIsActive"),"mktPromotionUpdatedAt"=now()
		WHERE "mktPromotionId"=$1 RETURNING *
	`, id, body["mktPromotionName"], body["mktPromotionDescription"], body["mktPromotionType"],
		body["mktPromotionValue"], body["mktPromotionIsActive"])
}

func (s *Store) DeletePromotion(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `DELETE FROM "mktPromotion" WHERE "mktPromotionId"=$1`, id); err != nil {
		return err
	}
	return nil
}

// ---- Related Products ----

func (s *Store) ListRelatedProducts(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktRelatedProductId", "mktRelatedProductSourceItem", "mktRelatedProductTargetItem",
			"mktRelatedProductType", "mktRelatedProductReason", "mktRelatedProductCreatedAt"
		FROM "mktRelatedProduct" ORDER BY "mktRelatedProductCreatedAt" DESC LIMIT 500
	`)
}

func (s *Store) CreateRelatedProduct(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktRelatedProduct" ("mktRelatedProductSourceItem","mktRelatedProductTargetItem","mktRelatedProductType","mktRelatedProductReason")
		VALUES ($1,$2,$3,$4) RETURNING *
	`, body["sourceItem"], body["targetItem"], body["type"], body["reason"])
}

func (s *Store) DeleteRelatedProduct(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `DELETE FROM "mktRelatedProduct" WHERE "mktRelatedProductId"=$1`, id); err != nil {
		return err
	}
	return nil
}

// ---- Stock Items & Price Items ----

func (s *Store) ListStockItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "bcItemNo", "bcItemDescription", "bcItemInventory", "bcItemUnitPrice", "bcItemUnitCost"
		FROM "bcItem" WHERE "bcItemNo" LIKE 'FG-00003%' AND "bcItemBlocked" != 'true'
		ORDER BY "bcItemNo"
		LIMIT 10000
	`)
}

func (s *Store) ListPriceItems(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktPriceItemNumber", "mktPriceItemName", "mktPriceItemUnitPrice"
		FROM "mktPriceItem"
	`)
}

func (s *Store) UpsertPriceItem(ctx context.Context, item map[string]any, userID string) error {
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO "mktPriceItem" ("mktPriceItemNumber","mktPriceItemName","mktPriceItemUnitPrice","mktPriceItemUpdatedBy")
		VALUES ($1,$2,$3,$4)
		ON CONFLICT ("mktPriceItemNumber") DO UPDATE SET "mktPriceItemName"=$2,"mktPriceItemUnitPrice"=$3,"mktPriceItemUpdatedBy"=$4,"mktPriceItemUpdatedAt"=now()
	`, item["mktPriceItemNumber"], item["mktPriceItemName"], item["mktPriceItemUnitPrice"], userID); err != nil {
		return err
	}
	return nil
}

func (s *Store) ListProductInfo(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktProductInfoItemNumber", "mktProductInfoDescription", "mktProductInfoHighlights",
			"mktProductInfoCategory", "mktProductInfoImageUrl"
		FROM "mktProductInfo" ORDER BY "mktProductInfoItemNumber"
		LIMIT 5000
	`)
}

func (s *Store) UpsertProductInfo(ctx context.Context, item map[string]any) error {
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO "mktProductInfo" ("mktProductInfoItemNumber","mktProductInfoDescription","mktProductInfoHighlights","mktProductInfoCategory","mktProductInfoImageUrl")
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT ("mktProductInfoItemNumber") DO UPDATE SET "mktProductInfoDescription"=$2,"mktProductInfoHighlights"=$3,"mktProductInfoCategory"=$4,"mktProductInfoImageUrl"=$5,"mktProductInfoUpdatedAt"=now()
	`, item["itemNumber"], item["description"], item["highlights"], item["category"], item["imageUrl"]); err != nil {
		return err
	}
	return nil
}

// ---- Follow-ups ----

func (s *Store) ListFollowUps(ctx context.Context, status, convID string) ([]map[string]any, error) {
	q := `SELECT "mktFollowUpId", "mktFollowUpConversationId", "mktFollowUpScheduledAt",
			"mktFollowUpMessage", "mktFollowUpStatus", "mktFollowUpSentAt", "mktFollowUpCreatedAt"
		FROM "mktFollowUp" WHERE 1=1`
	args := []any{}
	argIdx := 1
	if status != "" {
		q += fmt.Sprintf(` AND "mktFollowUpStatus"=$%d`, argIdx)
		args = append(args, status)
		argIdx++
	}
	if convID != "" {
		q += fmt.Sprintf(` AND "mktFollowUpConversationId"=$%d`, argIdx)
		args = append(args, convID)
	}
	q += ` ORDER BY "mktFollowUpCreatedAt" DESC`
	return db.QueryRows(ctx, s.pool, q, args...)
}

func (s *Store) CreateFollowUp(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		INSERT INTO "mktFollowUp" ("mktFollowUpConversationId","mktFollowUpScheduledAt","mktFollowUpMessage")
		VALUES ($1,$2,$3) RETURNING *
	`, body["conversationId"], body["scheduledAt"], body["message"])
}

func (s *Store) UpdateFollowUp(ctx context.Context, id string, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktFollowUp" SET
			"mktFollowUpStatus"=COALESCE($2,"mktFollowUpStatus"),
			"mktFollowUpScheduledAt"=COALESCE($3,"mktFollowUpScheduledAt"),
			"mktFollowUpMessage"=COALESCE($4,"mktFollowUpMessage")
		WHERE "mktFollowUpId"=$1 RETURNING *
	`, id, body["mktFollowUpStatus"], body["mktFollowUpScheduledAt"], body["mktFollowUpMessage"])
}

func (s *Store) CancelFollowUp(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktFollowUp" SET "mktFollowUpStatus"='cancelled' WHERE "mktFollowUpId"=$1`, id); err != nil {
		return err
	}
	return nil
}

func (s *Store) ListPendingFollowUps(ctx context.Context) ([]map[string]any, error) {
	return db.QueryRows(ctx, s.pool, `
		SELECT "mktFollowUpId", "mktFollowUpConversationId", "mktFollowUpScheduledAt",
			"mktFollowUpMessage", "mktFollowUpStatus"
		FROM "mktFollowUp" WHERE "mktFollowUpStatus"='pending' AND "mktFollowUpScheduledAt" <= now() LIMIT 20
	`)
}

func (s *Store) MarkFollowUpSent(ctx context.Context, id string) error {
	if _, err := s.pool.Exec(ctx, `UPDATE "mktFollowUp" SET "mktFollowUpStatus"='sent',"mktFollowUpSentAt"=now() WHERE "mktFollowUpId"=$1`, id); err != nil {
		return err
	}
	return nil
}

// ---- AI Settings ----

func (s *Store) GetAISettings(ctx context.Context) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		SELECT "mktAiSettingId", "mktAiSettingSystemPrompt", "mktAiSettingModel",
			"mktAiSettingTemperature", "mktAiSettingMaxHistoryMessages",
			"mktAiSettingBankAccountInfo", "mktAiSettingShippingInfo",
			"mktAiSettingAfterSalesInfo", "mktAiSettingBrandStory"
		FROM "mktAiSetting" LIMIT 1
	`)
}

func (s *Store) UpdateAISettings(ctx context.Context, body map[string]any) (map[string]any, error) {
	return db.QueryRow(ctx, s.pool, `
		UPDATE "mktAiSetting" SET
			"mktAiSettingSystemPrompt"=COALESCE($1,"mktAiSettingSystemPrompt"),
			"mktAiSettingModel"=COALESCE($2,"mktAiSettingModel"),
			"mktAiSettingTemperature"=COALESCE($3,"mktAiSettingTemperature"),
			"mktAiSettingMaxHistoryMessages"=COALESCE($4,"mktAiSettingMaxHistoryMessages"),
			"mktAiSettingBankAccountInfo"=COALESCE($5,"mktAiSettingBankAccountInfo"),
			"mktAiSettingUpdatedAt"=now()
		WHERE true RETURNING *
	`, body["mktAiSettingSystemPrompt"], body["mktAiSettingModel"], body["mktAiSettingTemperature"],
		body["mktAiSettingMaxHistoryMessages"], body["mktAiSettingBankAccountInfo"])
}
