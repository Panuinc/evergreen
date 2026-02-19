-- ============================================================
-- Migration: IT Module Tables
-- Assets, Help Desk Tickets, System Access, Network Devices,
-- Software Licenses, Security Incidents
-- ============================================================

-- ===================== 1. IT ASSETS =====================

create table if not exists "itAssets" (
    "assetId" uuid default gen_random_uuid() primary key,
    "assetName" text not null,
    "assetTag" text unique,
    "assetCategory" text default 'other',
    "assetBrand" text,
    "assetModel" text,
    "assetSerialNumber" text,
    "assetStatus" text default 'active',
    "assetAssignedTo" text,
    "assetLocation" text,
    "assetPurchaseDate" date,
    "assetWarrantyExpiry" date,
    "assetNotes" text,
    "assetCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "assetUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_asset_updated_at()
returns trigger as $$
begin
    new."assetUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_asset_updated_at on "itAssets";
create trigger trigger_update_it_asset_updated_at
    before update on "itAssets"
    for each row
    execute function update_it_asset_updated_at();

alter table "itAssets" enable row level security;

drop policy if exists "Allow authenticated read itAssets" on "itAssets";
create policy "Allow authenticated read itAssets"
    on "itAssets" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itAssets" on "itAssets";
create policy "Allow authenticated insert itAssets"
    on "itAssets" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itAssets" on "itAssets";
create policy "Allow authenticated update itAssets"
    on "itAssets" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itAssets" on "itAssets";
create policy "Allow authenticated delete itAssets"
    on "itAssets" for delete to authenticated using (true);

-- ===================== 2. HELP DESK TICKETS =====================

create table if not exists "itTickets" (
    "ticketId" uuid default gen_random_uuid() primary key,
    "ticketNo" text unique,
    "ticketTitle" text not null,
    "ticketDescription" text,
    "ticketCategory" text default 'other',
    "ticketPriority" text default 'medium',
    "ticketStatus" text default 'open',
    "ticketRequestedBy" text,
    "ticketAssignedTo" text,
    "ticketResolvedAt" timestamp with time zone,
    "ticketNotes" text,
    "ticketCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "ticketUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_ticket_updated_at()
returns trigger as $$
begin
    new."ticketUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_ticket_updated_at on "itTickets";
create trigger trigger_update_it_ticket_updated_at
    before update on "itTickets"
    for each row
    execute function update_it_ticket_updated_at();

-- Auto-generate ticketNo on insert
create or replace function generate_ticket_no()
returns trigger as $$
declare
    next_num integer;
begin
    select coalesce(max(cast(substring("ticketNo" from 'TK-(\d+)') as integer)), 0) + 1
    into next_num
    from "itTickets";
    new."ticketNo" = 'TK-' || lpad(next_num::text, 6, '0');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_ticket_no on "itTickets";
create trigger trigger_generate_ticket_no
    before insert on "itTickets"
    for each row
    when (new."ticketNo" is null)
    execute function generate_ticket_no();

alter table "itTickets" enable row level security;

drop policy if exists "Allow authenticated read itTickets" on "itTickets";
create policy "Allow authenticated read itTickets"
    on "itTickets" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itTickets" on "itTickets";
create policy "Allow authenticated insert itTickets"
    on "itTickets" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itTickets" on "itTickets";
create policy "Allow authenticated update itTickets"
    on "itTickets" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itTickets" on "itTickets";
create policy "Allow authenticated delete itTickets"
    on "itTickets" for delete to authenticated using (true);

-- ===================== 3. SYSTEM ACCESS =====================

create table if not exists "itSystemAccess" (
    "accessId" uuid default gen_random_uuid() primary key,
    "accessSystem" text not null,
    "accessType" text default 'grant',
    "accessRequestedFor" text,
    "accessRequestedBy" text,
    "accessStatus" text default 'pending',
    "accessApprovedBy" text,
    "accessNotes" text,
    "accessCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "accessUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_access_updated_at()
returns trigger as $$
begin
    new."accessUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_access_updated_at on "itSystemAccess";
create trigger trigger_update_it_access_updated_at
    before update on "itSystemAccess"
    for each row
    execute function update_it_access_updated_at();

alter table "itSystemAccess" enable row level security;

drop policy if exists "Allow authenticated read itSystemAccess" on "itSystemAccess";
create policy "Allow authenticated read itSystemAccess"
    on "itSystemAccess" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itSystemAccess" on "itSystemAccess";
create policy "Allow authenticated insert itSystemAccess"
    on "itSystemAccess" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itSystemAccess" on "itSystemAccess";
create policy "Allow authenticated update itSystemAccess"
    on "itSystemAccess" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itSystemAccess" on "itSystemAccess";
create policy "Allow authenticated delete itSystemAccess"
    on "itSystemAccess" for delete to authenticated using (true);

-- ===================== 4. NETWORK DEVICES =====================

create table if not exists "itNetworkDevices" (
    "deviceId" uuid default gen_random_uuid() primary key,
    "deviceName" text not null,
    "deviceType" text default 'other',
    "deviceIpAddress" text,
    "deviceMacAddress" text,
    "deviceLocation" text,
    "deviceStatus" text default 'online',
    "deviceManufacturer" text,
    "deviceModel" text,
    "deviceNotes" text,
    "deviceCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "deviceUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_device_updated_at()
returns trigger as $$
begin
    new."deviceUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_device_updated_at on "itNetworkDevices";
create trigger trigger_update_it_device_updated_at
    before update on "itNetworkDevices"
    for each row
    execute function update_it_device_updated_at();

alter table "itNetworkDevices" enable row level security;

drop policy if exists "Allow authenticated read itNetworkDevices" on "itNetworkDevices";
create policy "Allow authenticated read itNetworkDevices"
    on "itNetworkDevices" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itNetworkDevices" on "itNetworkDevices";
create policy "Allow authenticated insert itNetworkDevices"
    on "itNetworkDevices" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itNetworkDevices" on "itNetworkDevices";
create policy "Allow authenticated update itNetworkDevices"
    on "itNetworkDevices" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itNetworkDevices" on "itNetworkDevices";
create policy "Allow authenticated delete itNetworkDevices"
    on "itNetworkDevices" for delete to authenticated using (true);

-- ===================== 5. SOFTWARE LICENSES =====================

create table if not exists "itSoftware" (
    "softwareId" uuid default gen_random_uuid() primary key,
    "softwareName" text not null,
    "softwareVendor" text,
    "softwareVersion" text,
    "softwareLicenseKey" text,
    "softwareLicenseType" text default 'perpetual',
    "softwareLicenseCount" integer default 0,
    "softwareUsedCount" integer default 0,
    "softwareExpiryDate" date,
    "softwareStatus" text default 'active',
    "softwareNotes" text,
    "softwareCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "softwareUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_software_updated_at()
returns trigger as $$
begin
    new."softwareUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_software_updated_at on "itSoftware";
create trigger trigger_update_it_software_updated_at
    before update on "itSoftware"
    for each row
    execute function update_it_software_updated_at();

alter table "itSoftware" enable row level security;

drop policy if exists "Allow authenticated read itSoftware" on "itSoftware";
create policy "Allow authenticated read itSoftware"
    on "itSoftware" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itSoftware" on "itSoftware";
create policy "Allow authenticated insert itSoftware"
    on "itSoftware" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itSoftware" on "itSoftware";
create policy "Allow authenticated update itSoftware"
    on "itSoftware" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itSoftware" on "itSoftware";
create policy "Allow authenticated delete itSoftware"
    on "itSoftware" for delete to authenticated using (true);

-- ===================== 6. SECURITY INCIDENTS =====================

create table if not exists "itSecurityIncidents" (
    "incidentId" uuid default gen_random_uuid() primary key,
    "incidentTitle" text not null,
    "incidentType" text default 'other',
    "incidentSeverity" text default 'medium',
    "incidentStatus" text default 'open',
    "incidentReportedBy" text,
    "incidentAssignedTo" text,
    "incidentDescription" text,
    "incidentResolution" text,
    "incidentResolvedAt" timestamp with time zone,
    "incidentCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "incidentUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function update_it_incident_updated_at()
returns trigger as $$
begin
    new."incidentUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_it_incident_updated_at on "itSecurityIncidents";
create trigger trigger_update_it_incident_updated_at
    before update on "itSecurityIncidents"
    for each row
    execute function update_it_incident_updated_at();

alter table "itSecurityIncidents" enable row level security;

drop policy if exists "Allow authenticated read itSecurityIncidents" on "itSecurityIncidents";
create policy "Allow authenticated read itSecurityIncidents"
    on "itSecurityIncidents" for select to authenticated using (true);

drop policy if exists "Allow authenticated insert itSecurityIncidents" on "itSecurityIncidents";
create policy "Allow authenticated insert itSecurityIncidents"
    on "itSecurityIncidents" for insert to authenticated with check (true);

drop policy if exists "Allow authenticated update itSecurityIncidents" on "itSecurityIncidents";
create policy "Allow authenticated update itSecurityIncidents"
    on "itSecurityIncidents" for update to authenticated using (true) with check (true);

drop policy if exists "Allow authenticated delete itSecurityIncidents" on "itSecurityIncidents";
create policy "Allow authenticated delete itSecurityIncidents"
    on "itSecurityIncidents" for delete to authenticated using (true);
