-- =====================================================
-- EverGreen Internal - RBAC Schema (prefixed camelCase)
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table: resources
-- =====================================================
create table if not exists resources (
    "resourceId" uuid default gen_random_uuid() primary key,
    "resourceName" text not null unique,
    "resourceModuleId" text,
    "resourceDescription" text,
    "resourceCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "resourceUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: actions
-- =====================================================
create table if not exists actions (
    "actionId" uuid default gen_random_uuid() primary key,
    "actionName" text not null unique,
    "actionDescription" text,
    "actionCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "actionUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: roles
-- =====================================================
create table if not exists roles (
    "roleId" uuid default gen_random_uuid() primary key,
    "roleName" text not null unique,
    "roleDescription" text,
    "roleIsSuperadmin" boolean default false,
    "roleCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "roleUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: permissions (resource + action pair)
-- =====================================================
create table if not exists permissions (
    "permissionId" uuid default gen_random_uuid() primary key,
    "permissionResourceId" uuid not null references resources("resourceId") on delete cascade,
    "permissionActionId" uuid not null references actions("actionId") on delete cascade,
    "permissionCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    unique("permissionResourceId", "permissionActionId")
);

-- =====================================================
-- Table: rolePermissions
-- =====================================================
create table if not exists "rolePermissions" (
    "rolePermissionId" uuid default gen_random_uuid() primary key,
    "rolePermissionRoleId" uuid not null references roles("roleId") on delete cascade,
    "rolePermissionPermissionId" uuid not null references permissions("permissionId") on delete cascade,
    "rolePermissionCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    unique("rolePermissionRoleId", "rolePermissionPermissionId")
);

-- =====================================================
-- Table: userRoles
-- =====================================================
create table if not exists "userRoles" (
    "userRoleId" uuid default gen_random_uuid() primary key,
    "userRoleUserId" uuid not null references auth.users(id) on delete cascade,
    "userRoleRoleId" uuid not null references roles("roleId") on delete cascade,
    "userRoleCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    unique("userRoleUserId", "userRoleRoleId")
);

-- =====================================================
-- Table: accessLogs
-- =====================================================
create table if not exists "accessLogs" (
    "accessLogId" uuid default gen_random_uuid() primary key,
    "accessLogUserId" uuid references auth.users(id),
    "accessLogResource" text not null,
    "accessLogAction" text not null,
    "accessLogGranted" boolean not null,
    "accessLogMetadata" jsonb,
    "accessLogCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- View: userProfiles (เพื่อ query auth.users จาก client)
-- =====================================================
create or replace view public."userProfiles" as
select
    id as "userProfileId",
    email as "userProfileEmail",
    raw_user_meta_data as "userProfileRawUserMetaData",
    created_at as "userProfileCreatedAt"
from auth.users;

grant select on public."userProfiles" to authenticated;

-- =====================================================
-- Enable Row Level Security
-- =====================================================
alter table resources enable row level security;
alter table actions enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table "rolePermissions" enable row level security;
alter table "userRoles" enable row level security;
alter table "accessLogs" enable row level security;

-- =====================================================
-- RLS Policies
-- =====================================================

create policy "Authenticated can read resources" on resources
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage resources" on resources
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read actions" on actions
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage actions" on actions
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read roles" on roles
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage roles" on roles
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read permissions" on permissions
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage permissions" on permissions
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read rolePermissions" on "rolePermissions"
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage rolePermissions" on "rolePermissions"
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read userRoles" on "userRoles"
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage userRoles" on "userRoles"
    for all using (auth.role() = 'authenticated');

create policy "Authenticated can read accessLogs" on "accessLogs"
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert accessLogs" on "accessLogs"
    for insert with check (auth.role() = 'authenticated');

-- =====================================================
-- Triggers for updatedAt
-- =====================================================
create or replace function update_resource_updated_at()
returns trigger as $$
begin
    new."resourceUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create or replace function update_action_updated_at()
returns trigger as $$
begin
    new."actionUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create or replace function update_role_updated_at()
returns trigger as $$
begin
    new."roleUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_resources_updated_at on resources;
create trigger update_resources_updated_at
    before update on resources
    for each row execute function update_resource_updated_at();

drop trigger if exists update_actions_updated_at on actions;
create trigger update_actions_updated_at
    before update on actions
    for each row execute function update_action_updated_at();

drop trigger if exists update_roles_updated_at on roles;
create trigger update_roles_updated_at
    before update on roles
    for each row execute function update_role_updated_at();

-- =====================================================
-- Function: get_user_permissions
-- =====================================================
create or replace function public.get_user_permissions(p_user_id uuid)
returns table(permission text, "isSuperadmin" boolean) as $$
begin
    if exists (
        select 1 from "userRoles" ur
        join roles r on r."roleId" = ur."userRoleRoleId"
        where ur."userRoleUserId" = p_user_id and r."roleIsSuperadmin" = true
    ) then
        return query
        select
            coalesce(res."resourceName" || ':' || act."actionName", '__superadmin__') as permission,
            true as "isSuperadmin"
        from "userRoles" ur
        join roles r on r."roleId" = ur."userRoleRoleId"
        left join "rolePermissions" rp on rp."rolePermissionRoleId" = ur."userRoleRoleId"
        left join permissions p on p."permissionId" = rp."rolePermissionPermissionId"
        left join resources res on res."resourceId" = p."permissionResourceId"
        left join actions act on act."actionId" = p."permissionActionId"
        where ur."userRoleUserId" = p_user_id;
        return;
    end if;

    return query
    select distinct
        res."resourceName" || ':' || act."actionName" as permission,
        false as "isSuperadmin"
    from "userRoles" ur
    join roles r on r."roleId" = ur."userRoleRoleId"
    join "rolePermissions" rp on rp."rolePermissionRoleId" = ur."userRoleRoleId"
    join permissions p on p."permissionId" = rp."rolePermissionPermissionId"
    join resources res on res."resourceId" = p."permissionResourceId"
    join actions act on act."actionId" = p."permissionActionId"
    where ur."userRoleUserId" = p_user_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Seed Data
-- =====================================================

insert into actions ("actionName", "actionDescription") values
    ('create', 'Create new records'),
    ('read', 'View/read records'),
    ('update', 'Edit/update records'),
    ('delete', 'Delete records')
on conflict ("actionName") do nothing;

insert into resources ("resourceName", "resourceModuleId", "resourceDescription") values
    ('overview', 'overview', 'Overview & Dashboard'),
    ('hr', 'hr', 'Human Resources'),
    ('it', 'it', 'Information Technology'),
    ('finance', 'finance', 'Finance & Accounting'),
    ('sales', 'sales', 'Sales'),
    ('marketing', 'marketing', 'Marketing'),
    ('operations', 'operations', 'Operations'),
    ('procurement', 'procurement', 'Procurement'),
    ('production', 'production', 'Production'),
    ('qa', 'qa', 'Quality Assurance'),
    ('rnd', 'rnd', 'R&D'),
    ('cs', 'cs', 'Customer Service'),
    ('logistics', 'logistics', 'Logistics'),
    ('warehouse', 'warehouse', 'Warehouse'),
    ('legal', 'legal', 'Legal & Compliance'),
    ('rbac', 'rbac', 'Access Control')
on conflict ("resourceName") do nothing;

insert into roles ("roleName", "roleDescription", "roleIsSuperadmin") values
    ('superadmin', 'Super Administrator - Full access to all modules', true)
on conflict ("roleName") do nothing;

insert into permissions ("permissionResourceId", "permissionActionId")
select r."resourceId", a."actionId"
from resources r
cross join actions a
on conflict ("permissionResourceId", "permissionActionId") do nothing;

insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'superadmin'),
    p."permissionId"
from permissions p
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;
