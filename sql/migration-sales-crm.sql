-- ============================================================
-- Migration: Sales CRM Enterprise Module
-- ระบบ CRM สำหรับจัดการการขายครบวงจร
-- ============================================================

-- ===================== 1. CRM ACCOUNTS =====================

create table if not exists "crmAccounts" (
    "accountId" uuid default gen_random_uuid() primary key,
    "accountNo" text unique,
    "accountName" text not null,
    "accountIndustry" text,
    "accountWebsite" text,
    "accountPhone" text,
    "accountEmail" text,
    "accountEmployees" integer,
    "accountAnnualRevenue" numeric,
    "accountAddress" text,
    "accountNotes" text,
    "accountCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "accountUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_account_updated_at()
returns trigger as $$
begin
    new."accountUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_account_updated_at on "crmAccounts";
create trigger trigger_update_crm_account_updated_at
    before update on "crmAccounts"
    for each row
    execute function update_crm_account_updated_at();

create or replace function generate_crm_account_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("accountNo" from 'AC-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmAccounts";
    new."accountNo" = 'AC-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_account_no on "crmAccounts";
create trigger trigger_generate_crm_account_no
    before insert on "crmAccounts"
    for each row
    when (new."accountNo" is null)
    execute function generate_crm_account_no();

alter table "crmAccounts" enable row level security;

drop policy if exists "Allow authenticated read crmAccounts" on "crmAccounts";
create policy "Allow authenticated read crmAccounts"
    on "crmAccounts" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmAccounts" on "crmAccounts";
create policy "Allow authenticated insert crmAccounts"
    on "crmAccounts" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmAccounts" on "crmAccounts";
create policy "Allow authenticated update crmAccounts"
    on "crmAccounts" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmAccounts" on "crmAccounts";
create policy "Allow authenticated delete crmAccounts"
    on "crmAccounts" for delete to authenticated using (true);

-- ===================== 2. CRM CONTACTS =====================

create table if not exists "crmContacts" (
    "contactId" uuid default gen_random_uuid() primary key,
    "contactNo" text unique,
    "contactFirstName" text not null,
    "contactLastName" text,
    "contactEmail" text,
    "contactPhone" text,
    "contactPosition" text,
    "contactAccountId" uuid references "crmAccounts"("accountId") on delete set null,
    "contactAddress" text,
    "contactTags" text,
    "contactNotes" text,
    "contactCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "contactUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_contact_updated_at()
returns trigger as $$
begin
    new."contactUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_contact_updated_at on "crmContacts";
create trigger trigger_update_crm_contact_updated_at
    before update on "crmContacts"
    for each row
    execute function update_crm_contact_updated_at();

create or replace function generate_crm_contact_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("contactNo" from 'CT-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmContacts";
    new."contactNo" = 'CT-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_contact_no on "crmContacts";
create trigger trigger_generate_crm_contact_no
    before insert on "crmContacts"
    for each row
    when (new."contactNo" is null)
    execute function generate_crm_contact_no();

alter table "crmContacts" enable row level security;

drop policy if exists "Allow authenticated read crmContacts" on "crmContacts";
create policy "Allow authenticated read crmContacts"
    on "crmContacts" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmContacts" on "crmContacts";
create policy "Allow authenticated insert crmContacts"
    on "crmContacts" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmContacts" on "crmContacts";
create policy "Allow authenticated update crmContacts"
    on "crmContacts" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmContacts" on "crmContacts";
create policy "Allow authenticated delete crmContacts"
    on "crmContacts" for delete to authenticated using (true);

-- ===================== 3. CRM PIPELINE STAGES =====================

create table if not exists "crmPipelineStages" (
    "stageId" uuid default gen_random_uuid() primary key,
    "stageName" text not null,
    "stageOrder" integer not null,
    "stageProbability" integer default 0,
    "stageColor" text default '#3b82f6',
    "stageCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table "crmPipelineStages" enable row level security;

drop policy if exists "Allow authenticated read crmPipelineStages" on "crmPipelineStages";
create policy "Allow authenticated read crmPipelineStages"
    on "crmPipelineStages" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmPipelineStages" on "crmPipelineStages";
create policy "Allow authenticated insert crmPipelineStages"
    on "crmPipelineStages" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmPipelineStages" on "crmPipelineStages";
create policy "Allow authenticated update crmPipelineStages"
    on "crmPipelineStages" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmPipelineStages" on "crmPipelineStages";
create policy "Allow authenticated delete crmPipelineStages"
    on "crmPipelineStages" for delete to authenticated using (true);

-- Seed pipeline stages
insert into "crmPipelineStages" ("stageName", "stageOrder", "stageProbability", "stageColor") values
    ('Prospecting', 1, 10, '#6366f1'),
    ('Qualification', 2, 25, '#3b82f6'),
    ('Proposal', 3, 50, '#f59e0b'),
    ('Negotiation', 4, 75, '#f97316'),
    ('Closed Won', 5, 100, '#22c55e'),
    ('Closed Lost', 6, 0, '#ef4444')
on conflict do nothing;

-- ===================== 4. CRM OPPORTUNITIES =====================

create table if not exists "crmOpportunities" (
    "opportunityId" uuid default gen_random_uuid() primary key,
    "opportunityNo" text unique,
    "opportunityName" text not null,
    "opportunityStage" text default 'prospecting',
    "opportunityAmount" numeric default 0,
    "opportunityProbability" integer default 10,
    "opportunityExpectedCloseDate" date,
    "opportunityActualCloseDate" date,
    "opportunityContactId" uuid references "crmContacts"("contactId") on delete set null,
    "opportunityAccountId" uuid references "crmAccounts"("accountId") on delete set null,
    "opportunityAssignedTo" text,
    "opportunitySource" text,
    "opportunityLostReason" text,
    "opportunityNotes" text,
    "opportunityCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "opportunityUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_opportunity_updated_at()
returns trigger as $$
begin
    new."opportunityUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_opportunity_updated_at on "crmOpportunities";
create trigger trigger_update_crm_opportunity_updated_at
    before update on "crmOpportunities"
    for each row
    execute function update_crm_opportunity_updated_at();

create or replace function generate_crm_opportunity_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("opportunityNo" from 'OP-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmOpportunities";
    new."opportunityNo" = 'OP-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_opportunity_no on "crmOpportunities";
create trigger trigger_generate_crm_opportunity_no
    before insert on "crmOpportunities"
    for each row
    when (new."opportunityNo" is null)
    execute function generate_crm_opportunity_no();

alter table "crmOpportunities" enable row level security;

drop policy if exists "Allow authenticated read crmOpportunities" on "crmOpportunities";
create policy "Allow authenticated read crmOpportunities"
    on "crmOpportunities" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmOpportunities" on "crmOpportunities";
create policy "Allow authenticated insert crmOpportunities"
    on "crmOpportunities" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmOpportunities" on "crmOpportunities";
create policy "Allow authenticated update crmOpportunities"
    on "crmOpportunities" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmOpportunities" on "crmOpportunities";
create policy "Allow authenticated delete crmOpportunities"
    on "crmOpportunities" for delete to authenticated using (true);

-- ===================== 5. CRM LEADS =====================

create table if not exists "crmLeads" (
    "leadId" uuid default gen_random_uuid() primary key,
    "leadNo" text unique,
    "leadName" text not null,
    "leadEmail" text,
    "leadPhone" text,
    "leadCompany" text,
    "leadPosition" text,
    "leadSource" text default 'website',
    "leadScore" text default 'warm',
    "leadStatus" text default 'new',
    "leadAssignedTo" text,
    "leadNotes" text,
    "leadConvertedOpportunityId" uuid references "crmOpportunities"("opportunityId") on delete set null,
    "leadConvertedContactId" uuid references "crmContacts"("contactId") on delete set null,
    "leadCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "leadUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_lead_updated_at()
returns trigger as $$
begin
    new."leadUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_lead_updated_at on "crmLeads";
create trigger trigger_update_crm_lead_updated_at
    before update on "crmLeads"
    for each row
    execute function update_crm_lead_updated_at();

create or replace function generate_crm_lead_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("leadNo" from 'LD-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmLeads";
    new."leadNo" = 'LD-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_lead_no on "crmLeads";
create trigger trigger_generate_crm_lead_no
    before insert on "crmLeads"
    for each row
    when (new."leadNo" is null)
    execute function generate_crm_lead_no();

alter table "crmLeads" enable row level security;

drop policy if exists "Allow authenticated read crmLeads" on "crmLeads";
create policy "Allow authenticated read crmLeads"
    on "crmLeads" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmLeads" on "crmLeads";
create policy "Allow authenticated insert crmLeads"
    on "crmLeads" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmLeads" on "crmLeads";
create policy "Allow authenticated update crmLeads"
    on "crmLeads" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmLeads" on "crmLeads";
create policy "Allow authenticated delete crmLeads"
    on "crmLeads" for delete to authenticated using (true);

-- ===================== 6. CRM QUOTATIONS =====================

create table if not exists "crmQuotations" (
    "quotationId" uuid default gen_random_uuid() primary key,
    "quotationNo" text unique,
    "quotationOpportunityId" uuid references "crmOpportunities"("opportunityId") on delete set null,
    "quotationContactId" uuid references "crmContacts"("contactId") on delete set null,
    "quotationAccountId" uuid references "crmAccounts"("accountId") on delete set null,
    "quotationStatus" text default 'draft',
    "quotationSubtotal" numeric default 0,
    "quotationDiscount" numeric default 0,
    "quotationTax" numeric default 0,
    "quotationTotal" numeric default 0,
    "quotationValidUntil" date,
    "quotationNotes" text,
    "quotationTerms" text,
    "quotationApprovedBy" text,
    "quotationApprovalNote" text,
    "quotationCreatedBy" text,
    "quotationCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "quotationUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_quotation_updated_at()
returns trigger as $$
begin
    new."quotationUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_quotation_updated_at on "crmQuotations";
create trigger trigger_update_crm_quotation_updated_at
    before update on "crmQuotations"
    for each row
    execute function update_crm_quotation_updated_at();

create or replace function generate_crm_quotation_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("quotationNo" from 'QT-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmQuotations";
    new."quotationNo" = 'QT-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_quotation_no on "crmQuotations";
create trigger trigger_generate_crm_quotation_no
    before insert on "crmQuotations"
    for each row
    when (new."quotationNo" is null)
    execute function generate_crm_quotation_no();

alter table "crmQuotations" enable row level security;

drop policy if exists "Allow authenticated read crmQuotations" on "crmQuotations";
create policy "Allow authenticated read crmQuotations"
    on "crmQuotations" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmQuotations" on "crmQuotations";
create policy "Allow authenticated insert crmQuotations"
    on "crmQuotations" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmQuotations" on "crmQuotations";
create policy "Allow authenticated update crmQuotations"
    on "crmQuotations" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmQuotations" on "crmQuotations";
create policy "Allow authenticated delete crmQuotations"
    on "crmQuotations" for delete to authenticated using (true);

-- ===================== 7. CRM QUOTATION LINES =====================

create table if not exists "crmQuotationLines" (
    "lineId" uuid default gen_random_uuid() primary key,
    "lineQuotationId" uuid not null references "crmQuotations"("quotationId") on delete cascade,
    "lineOrder" integer default 0,
    "lineProductName" text not null,
    "lineDescription" text,
    "lineQuantity" numeric default 1,
    "lineUnitPrice" numeric default 0,
    "lineDiscount" numeric default 0,
    "lineAmount" numeric default 0,
    "lineCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table "crmQuotationLines" enable row level security;

drop policy if exists "Allow authenticated read crmQuotationLines" on "crmQuotationLines";
create policy "Allow authenticated read crmQuotationLines"
    on "crmQuotationLines" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmQuotationLines" on "crmQuotationLines";
create policy "Allow authenticated insert crmQuotationLines"
    on "crmQuotationLines" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmQuotationLines" on "crmQuotationLines";
create policy "Allow authenticated update crmQuotationLines"
    on "crmQuotationLines" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmQuotationLines" on "crmQuotationLines";
create policy "Allow authenticated delete crmQuotationLines"
    on "crmQuotationLines" for delete to authenticated using (true);

-- ===================== 8. CRM ORDERS =====================

create table if not exists "crmOrders" (
    "orderId" uuid default gen_random_uuid() primary key,
    "orderNo" text unique,
    "orderQuotationId" uuid references "crmQuotations"("quotationId") on delete set null,
    "orderOpportunityId" uuid references "crmOpportunities"("opportunityId") on delete set null,
    "orderContactId" uuid references "crmContacts"("contactId") on delete set null,
    "orderAccountId" uuid references "crmAccounts"("accountId") on delete set null,
    "orderStatus" text default 'pending',
    "orderSubtotal" numeric default 0,
    "orderDiscount" numeric default 0,
    "orderTax" numeric default 0,
    "orderTotal" numeric default 0,
    "orderShippingAddress" text,
    "orderTrackingNumber" text,
    "orderDeliveryDate" date,
    "orderNotes" text,
    "orderCreatedBy" text,
    "orderCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "orderUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_order_updated_at()
returns trigger as $$
begin
    new."orderUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_order_updated_at on "crmOrders";
create trigger trigger_update_crm_order_updated_at
    before update on "crmOrders"
    for each row
    execute function update_crm_order_updated_at();

create or replace function generate_crm_order_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("orderNo" from 'SO-(\d+)') as integer)), 0) + 1
    into next_num
    from "crmOrders";
    new."orderNo" = 'SO-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_crm_order_no on "crmOrders";
create trigger trigger_generate_crm_order_no
    before insert on "crmOrders"
    for each row
    when (new."orderNo" is null)
    execute function generate_crm_order_no();

alter table "crmOrders" enable row level security;

drop policy if exists "Allow authenticated read crmOrders" on "crmOrders";
create policy "Allow authenticated read crmOrders"
    on "crmOrders" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmOrders" on "crmOrders";
create policy "Allow authenticated insert crmOrders"
    on "crmOrders" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmOrders" on "crmOrders";
create policy "Allow authenticated update crmOrders"
    on "crmOrders" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmOrders" on "crmOrders";
create policy "Allow authenticated delete crmOrders"
    on "crmOrders" for delete to authenticated using (true);

-- ===================== 9. CRM ACTIVITIES =====================

create table if not exists "crmActivities" (
    "activityId" uuid default gen_random_uuid() primary key,
    "activityType" text not null default 'task',
    "activitySubject" text not null,
    "activityDescription" text,
    "activityStatus" text default 'pending',
    "activityPriority" text default 'medium',
    "activityDueDate" timestamp with time zone,
    "activityCompletedAt" timestamp with time zone,
    "activityContactId" uuid references "crmContacts"("contactId") on delete set null,
    "activityOpportunityId" uuid references "crmOpportunities"("opportunityId") on delete set null,
    "activityAccountId" uuid references "crmAccounts"("accountId") on delete set null,
    "activityAssignedTo" text,
    "activityCreatedBy" text,
    "activityCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "activityUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_crm_activity_updated_at()
returns trigger as $$
begin
    new."activityUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_crm_activity_updated_at on "crmActivities";
create trigger trigger_update_crm_activity_updated_at
    before update on "crmActivities"
    for each row
    execute function update_crm_activity_updated_at();

alter table "crmActivities" enable row level security;

drop policy if exists "Allow authenticated read crmActivities" on "crmActivities";
create policy "Allow authenticated read crmActivities"
    on "crmActivities" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert crmActivities" on "crmActivities";
create policy "Allow authenticated insert crmActivities"
    on "crmActivities" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update crmActivities" on "crmActivities";
create policy "Allow authenticated update crmActivities"
    on "crmActivities" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete crmActivities" on "crmActivities";
create policy "Allow authenticated delete crmActivities"
    on "crmActivities" for delete to authenticated using (true);
