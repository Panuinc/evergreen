-- =====================================================
-- Omnichannel Chat - Database Schema
-- บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด
-- รันใน Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table 1: omChannels - ช่องทางการสื่อสาร
-- =====================================================
create table if not exists "omChannels" (
    "channelId" uuid default gen_random_uuid() primary key,
    "channelType" text not null check ("channelType" in ('facebook', 'line')),
    "channelName" text not null,
    "channelAccessToken" text,
    "channelSecret" text,
    "channelPageId" text,
    "channelStatus" text not null default 'active' check ("channelStatus" in ('active', 'inactive')),
    "channelCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "channelUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists "omChannels_channelType_idx"
    on "omChannels" ("channelType");

-- =====================================================
-- Table 2: omContacts - ลูกค้าจากทุกช่องทาง
-- =====================================================
create table if not exists "omContacts" (
    "contactId" uuid default gen_random_uuid() primary key,
    "contactChannelType" text not null check ("contactChannelType" in ('facebook', 'line')),
    "contactExternalId" text not null,
    "contactDisplayName" text,
    "contactAvatarUrl" text,
    "contactTags" text[] default '{}',
    "contactNotes" text,
    "contactCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "contactUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists "omContacts_channel_external_idx"
    on "omContacts" ("contactChannelType", "contactExternalId");

-- =====================================================
-- Table 3: omConversations - สนทนา
-- =====================================================
create table if not exists "omConversations" (
    "conversationId" uuid default gen_random_uuid() primary key,
    "conversationContactId" uuid not null references "omContacts"("contactId") on delete cascade,
    "conversationChannelType" text not null check ("conversationChannelType" in ('facebook', 'line')),
    "conversationStatus" text not null default 'open' check ("conversationStatus" in ('open', 'waiting', 'closed')),
    "conversationAssignedTo" uuid,
    "conversationLastMessageAt" timestamp with time zone,
    "conversationLastMessagePreview" text,
    "conversationUnreadCount" integer default 0,
    "conversationCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "conversationUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists "omConversations_contact_idx"
    on "omConversations" ("conversationContactId");
create index if not exists "omConversations_status_idx"
    on "omConversations" ("conversationStatus");

-- =====================================================
-- Table 4: omMessages - ข้อความ
-- =====================================================
create table if not exists "omMessages" (
    "messageId" uuid default gen_random_uuid() primary key,
    "messageConversationId" uuid not null references "omConversations"("conversationId") on delete cascade,
    "messageSenderType" text not null check ("messageSenderType" in ('customer', 'agent')),
    "messageSenderId" text,
    "messageContent" text not null,
    "messageType" text not null default 'text' check ("messageType" in ('text', 'image', 'sticker', 'file')),
    "messageExternalId" text,
    "messageMetadata" jsonb,
    "messageCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists "omMessages_conversation_idx"
    on "omMessages" ("messageConversationId", "messageCreatedAt");

-- =====================================================
-- RLS Policies
-- =====================================================
alter table "omChannels" enable row level security;
alter table "omContacts" enable row level security;
alter table "omConversations" enable row level security;
alter table "omMessages" enable row level security;

create policy "Enable read for authenticated users" on "omChannels"
    for select using (auth.role() = 'authenticated');
create policy "Enable write for authenticated users" on "omChannels"
    for all using (auth.role() = 'authenticated');

create policy "Enable read for authenticated users" on "omContacts"
    for select using (auth.role() = 'authenticated');
create policy "Enable write for authenticated users" on "omContacts"
    for all using (auth.role() = 'authenticated');

create policy "Enable read for authenticated users" on "omConversations"
    for select using (auth.role() = 'authenticated');
create policy "Enable write for authenticated users" on "omConversations"
    for all using (auth.role() = 'authenticated');

create policy "Enable read for authenticated users" on "omMessages"
    for select using (auth.role() = 'authenticated');
create policy "Enable write for authenticated users" on "omMessages"
    for all using (auth.role() = 'authenticated');

-- =====================================================
-- Auto-update triggers
-- =====================================================
create or replace function update_om_channel_updated_at()
returns trigger as $$
begin
    new."channelUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger trigger_update_om_channel_updated_at
    before update on "omChannels"
    for each row execute function update_om_channel_updated_at();

create or replace function update_om_contact_updated_at()
returns trigger as $$
begin
    new."contactUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger trigger_update_om_contact_updated_at
    before update on "omContacts"
    for each row execute function update_om_contact_updated_at();

create or replace function update_om_conversation_updated_at()
returns trigger as $$
begin
    new."conversationUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger trigger_update_om_conversation_updated_at
    before update on "omConversations"
    for each row execute function update_om_conversation_updated_at();

-- =====================================================
-- Enable Realtime
-- =====================================================
alter publication supabase_realtime add table "omMessages";
alter publication supabase_realtime add table "omConversations";
