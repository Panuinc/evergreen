-- ============================================================
-- Omnichannel Seed Data
-- Run this AFTER omnichannel-schema.sql in Supabase SQL Editor
-- ============================================================

-- 1. Channels
INSERT INTO "omChannels" ("channelType", "channelName", "channelAccessToken", "channelSecret", "channelPageId", "channelStatus")
VALUES
  ('facebook', 'EverGreen Facebook Page', 'EAAxxxxxxxx_FB_ACCESS_TOKEN', 'fb_app_secret_here', '123456789012345', 'active'),
  ('line', 'EverGreen LINE OA', 'LINE_CHANNEL_ACCESS_TOKEN_HERE', 'line_channel_secret_here', NULL, 'active');

-- 2. Contacts
INSERT INTO "omContacts" ("contactChannelType", "contactExternalId", "contactDisplayName", "contactAvatarUrl", "contactTags", "contactNotes")
VALUES
  ('facebook', 'fb_psid_001', 'สมชาย ใจดี', NULL, ARRAY['VIP', 'ลูกค้าประจำ'], 'ลูกค้าเก่าแก่ ซื้อสินค้าบ่อย'),
  ('facebook', 'fb_psid_002', 'สมหญิง รักสวย', NULL, ARRAY['สนใจโปรโมชัน'], NULL),
  ('line', 'line_uid_001', 'วิชัย มั่งมี', NULL, ARRAY['B2B', 'ตัวแทนจำหน่าย'], 'ตัวแทนจำหน่ายภาคเหนือ'),
  ('line', 'line_uid_002', 'นภา สดใส', NULL, NULL, NULL),
  ('facebook', 'fb_psid_003', 'ธนกร เจริญสุข', NULL, ARRAY['ร้องเรียน'], 'มีปัญหาเรื่องการจัดส่ง');

-- 3. Conversations (using subquery to get contactId)
INSERT INTO "omConversations" ("conversationContactId", "conversationChannelType", "conversationStatus", "conversationLastMessageAt", "conversationLastMessagePreview", "conversationUnreadCount")
VALUES
  (
    (SELECT "contactId" FROM "omContacts" WHERE "contactExternalId" = 'fb_psid_001'),
    'facebook', 'open',
    NOW() - INTERVAL '5 minutes',
    'ขอบคุณครับ รอสินค้าอยู่นะครับ',
    2
  ),
  (
    (SELECT "contactId" FROM "omContacts" WHERE "contactExternalId" = 'fb_psid_002'),
    'facebook', 'waiting',
    NOW() - INTERVAL '1 hour',
    'โปรโมชันนี้ถึงเมื่อไหร่คะ?',
    1
  ),
  (
    (SELECT "contactId" FROM "omContacts" WHERE "contactExternalId" = 'line_uid_001'),
    'line', 'open',
    NOW() - INTERVAL '30 minutes',
    'ส่ง invoice มาได้เลยครับ',
    0
  ),
  (
    (SELECT "contactId" FROM "omContacts" WHERE "contactExternalId" = 'line_uid_002'),
    'line', 'closed',
    NOW() - INTERVAL '2 days',
    'ได้รับสินค้าแล้วค่ะ ขอบคุณมากค่ะ',
    0
  ),
  (
    (SELECT "contactId" FROM "omContacts" WHERE "contactExternalId" = 'fb_psid_003'),
    'facebook', 'open',
    NOW() - INTERVAL '15 minutes',
    'ยังไม่ได้รับสินค้าเลยครับ สั่งไปตั้งแต่อาทิตย์ที่แล้ว',
    3
  );

-- 4. Messages
-- Conversation 1: สมชาย (Facebook, open)
INSERT INTO "omMessages" ("messageConversationId", "messageSenderType", "messageSenderId", "messageContent", "messageType", "messageCreatedAt")
VALUES
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_001'),
    'customer', 'fb_psid_001',
    'สวัสดีครับ สนใจสินค้ารุ่นใหม่ครับ',
    'text', NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_001'),
    'agent', NULL,
    'สวัสดีครับคุณสมชาย ยินดีให้บริการครับ สินค้ารุ่นใหม่มีหลายแบบเลยครับ',
    'text', NOW() - INTERVAL '1 hour 50 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_001'),
    'customer', 'fb_psid_001',
    'รุ่น A500 ราคาเท่าไหร่ครับ?',
    'text', NOW() - INTERVAL '1 hour 45 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_001'),
    'agent', NULL,
    'รุ่น A500 ราคา 15,900 บาทครับ ตอนนี้มีโปรลด 10% ด้วยครับ เหลือ 14,310 บาท',
    'text', NOW() - INTERVAL '1 hour 40 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_001'),
    'customer', 'fb_psid_001',
    'ขอบคุณครับ รอสินค้าอยู่นะครับ',
    'text', NOW() - INTERVAL '5 minutes'
  );

-- Conversation 2: สมหญิง (Facebook, waiting)
INSERT INTO "omMessages" ("messageConversationId", "messageSenderType", "messageSenderId", "messageContent", "messageType", "messageCreatedAt")
VALUES
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_002'),
    'customer', 'fb_psid_002',
    'สวัสดีค่ะ เห็นโปรโมชันวันแม่ในเพจ สนใจค่ะ',
    'text', NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_002'),
    'agent', NULL,
    'สวัสดีค่ะ โปรโมชันวันแม่ลด 20% ทุกชิ้นค่ะ ตั้งแต่วันนี้ถึงสิ้นเดือนค่ะ',
    'text', NOW() - INTERVAL '1 hour 55 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_002'),
    'customer', 'fb_psid_002',
    'โปรโมชันนี้ถึงเมื่อไหร่คะ?',
    'text', NOW() - INTERVAL '1 hour'
  );

-- Conversation 3: วิชัย (LINE, open)
INSERT INTO "omMessages" ("messageConversationId", "messageSenderType", "messageSenderId", "messageContent", "messageType", "messageCreatedAt")
VALUES
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_001'),
    'customer', 'line_uid_001',
    'สวัสดีครับ ผมวิชัยจากเชียงใหม่ครับ อยากสั่งสินค้า lot ใหญ่',
    'text', NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_001'),
    'agent', NULL,
    'สวัสดีครับคุณวิชัย ยินดีครับ ต้องการสินค้าตัวไหนบ้างครับ?',
    'text', NOW() - INTERVAL '1 hour 50 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_001'),
    'customer', 'line_uid_001',
    'รุ่น B200 จำนวน 100 ชิ้น กับ C300 จำนวน 50 ชิ้นครับ',
    'text', NOW() - INTERVAL '1 hour 40 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_001'),
    'agent', NULL,
    'รับทราบครับ จะจัดทำใบเสนอราคาให้ภายในวันนี้ครับ',
    'text', NOW() - INTERVAL '1 hour 30 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_001'),
    'customer', 'line_uid_001',
    'ส่ง invoice มาได้เลยครับ',
    'text', NOW() - INTERVAL '30 minutes'
  );

-- Conversation 4: นภา (LINE, closed)
INSERT INTO "omMessages" ("messageConversationId", "messageSenderType", "messageSenderId", "messageContent", "messageType", "messageCreatedAt")
VALUES
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_002'),
    'customer', 'line_uid_002',
    'สวัสดีค่ะ สั่งซื้อสินค้าไปเมื่อวาน อยากถามว่าจัดส่งเมื่อไหร่คะ',
    'text', NOW() - INTERVAL '3 days'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_002'),
    'agent', NULL,
    'สวัสดีค่ะ เช็คให้แล้ว สินค้าจัดส่งวันนี้ค่ะ เลข tracking: TH12345678',
    'text', NOW() - INTERVAL '3 days' + INTERVAL '10 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'line_uid_002'),
    'customer', 'line_uid_002',
    'ได้รับสินค้าแล้วค่ะ ขอบคุณมากค่ะ',
    'text', NOW() - INTERVAL '2 days'
  );

-- Conversation 5: ธนกร (Facebook, open - complaint)
INSERT INTO "omMessages" ("messageConversationId", "messageSenderType", "messageSenderId", "messageContent", "messageType", "messageCreatedAt")
VALUES
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_003'),
    'customer', 'fb_psid_003',
    'สวัสดีครับ สั่งสินค้าไปอาทิตย์ที่แล้ว ยังไม่ได้รับเลยครับ',
    'text', NOW() - INTERVAL '1 hour'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_003'),
    'agent', NULL,
    'ขออภัยครับ ขอเลข order ด้วยครับ จะเช็คให้ทันทีครับ',
    'text', NOW() - INTERVAL '55 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_003'),
    'customer', 'fb_psid_003',
    'เลข order ORD-2024-00891 ครับ',
    'text', NOW() - INTERVAL '50 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_003'),
    'agent', NULL,
    'เช็คแล้วครับ สินค้าอยู่ระหว่างจัดส่ง คาดว่าจะถึงภายใน 1-2 วันครับ ขออภัยที่ล่าช้าครับ',
    'text', NOW() - INTERVAL '45 minutes'
  ),
  (
    (SELECT "conversationId" FROM "omConversations" c JOIN "omContacts" ct ON c."conversationContactId" = ct."contactId" WHERE ct."contactExternalId" = 'fb_psid_003'),
    'customer', 'fb_psid_003',
    'ยังไม่ได้รับสินค้าเลยครับ สั่งไปตั้งแต่อาทิตย์ที่แล้ว',
    'text', NOW() - INTERVAL '15 minutes'
  );
