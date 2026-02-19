-- ============================================================
-- Migration: IT Development Requests + Progress Logs
-- ระบบแจ้งขอพัฒนาระบบ และติดตามความคืบหน้า
-- ============================================================

-- ===================== 1. DEV REQUESTS =====================

create table if not exists "itDevRequests" (
    "requestId" uuid default gen_random_uuid() primary key,
    "requestNo" text unique,
    "requestTitle" text not null,
    "requestDescription" text,
    "requestedBy" text,
    "requestPriority" text default 'medium',
    "requestStatus" text default 'pending',
    "requestAssignedTo" text,
    "requestProgress" integer default 0,
    "requestStartDate" date,
    "requestDueDate" date,
    "requestCompletedAt" timestamp with time zone,
    "requestNotes" text,
    "requestCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "requestUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto-update updatedAt
create or replace function update_it_dev_request_updated_at()
returns trigger as $$
begin
    new."requestUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_dev_request_updated_at on "itDevRequests";
create trigger trigger_update_it_dev_request_updated_at
    before update on "itDevRequests"
    for each row
    execute function update_it_dev_request_updated_at();

-- Auto-generate requestNo (DR-000001)
create or replace function generate_dev_request_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("requestNo" from 'DR-(\d+)') as integer)), 0) + 1
    into next_num
    from "itDevRequests";
    new."requestNo" = 'DR-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_dev_request_no on "itDevRequests";
create trigger trigger_generate_dev_request_no
    before insert on "itDevRequests"
    for each row
    when (new."requestNo" is null)
    execute function generate_dev_request_no();

alter table "itDevRequests" enable row level security;

drop policy if exists "Allow authenticated read itDevRequests" on "itDevRequests";
create policy "Allow authenticated read itDevRequests"
    on "itDevRequests" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itDevRequests" on "itDevRequests";
create policy "Allow authenticated insert itDevRequests"
    on "itDevRequests" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itDevRequests" on "itDevRequests";
create policy "Allow authenticated update itDevRequests"
    on "itDevRequests" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itDevRequests" on "itDevRequests";
create policy "Allow authenticated delete itDevRequests"
    on "itDevRequests" for delete to authenticated using (true);

-- ===================== 2. PROGRESS LOGS =====================

create table if not exists "itDevProgressLogs" (
    "logId" uuid default gen_random_uuid() primary key,
    "logRequestId" uuid not null references "itDevRequests"("requestId") on delete cascade,
    "logDescription" text not null,
    "logProgress" integer default 0,
    "logCreatedBy" text,
    "logCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table "itDevProgressLogs" enable row level security;

drop policy if exists "Allow authenticated read itDevProgressLogs" on "itDevProgressLogs";
create policy "Allow authenticated read itDevProgressLogs"
    on "itDevProgressLogs" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itDevProgressLogs" on "itDevProgressLogs";
create policy "Allow authenticated insert itDevProgressLogs"
    on "itDevProgressLogs" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated delete itDevProgressLogs" on "itDevProgressLogs";
create policy "Allow authenticated delete itDevProgressLogs"
    on "itDevProgressLogs" for delete to authenticated using (true);
