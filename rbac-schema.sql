-- =====================================================
-- EverGreen Internal - RBAC Schema
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table: resources
-- =====================================================
create table if not exists resources (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    module_id text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: actions
-- =====================================================
create table if not exists actions (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: roles
-- =====================================================
create table if not exists roles (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    is_superadmin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: permissions (resource + action pair)
-- =====================================================
create table if not exists permissions (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid not null references resources(id) on delete cascade,
    action_id uuid not null references actions(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(resource_id, action_id)
);

-- =====================================================
-- Table: role_permissions
-- =====================================================
create table if not exists role_permissions (
    id uuid default gen_random_uuid() primary key,
    role_id uuid not null references roles(id) on delete cascade,
    permission_id uuid not null references permissions(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(role_id, permission_id)
);

-- =====================================================
-- Table: user_roles
-- =====================================================
create table if not exists user_roles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    role_id uuid not null references roles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, role_id)
);

-- =====================================================
-- Table: access_logs
-- =====================================================
create table if not exists access_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    resource text not null,
    action text not null,
    granted boolean not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- View: user_profiles (เพื่อ query auth.users จาก client)
-- =====================================================
create or replace view public.user_profiles as
select id, email, raw_user_meta_data, created_at
from auth.users;

grant select on public.user_profiles to authenticated;

-- =====================================================
-- Enable Row Level Security
-- =====================================================
alter table resources enable row level security;
alter table actions enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table access_logs enable row level security;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Resources: read by all authenticated
create policy "Authenticated can read resources" on resources
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage resources" on resources
    for all using (auth.role() = 'authenticated');

-- Actions: read by all authenticated
create policy "Authenticated can read actions" on actions
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage actions" on actions
    for all using (auth.role() = 'authenticated');

-- Roles: read by all authenticated
create policy "Authenticated can read roles" on roles
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage roles" on roles
    for all using (auth.role() = 'authenticated');

-- Permissions: read by all authenticated
create policy "Authenticated can read permissions" on permissions
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage permissions" on permissions
    for all using (auth.role() = 'authenticated');

-- Role Permissions: read by all authenticated
create policy "Authenticated can read role_permissions" on role_permissions
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage role_permissions" on role_permissions
    for all using (auth.role() = 'authenticated');

-- User Roles: read by all authenticated
create policy "Authenticated can read user_roles" on user_roles
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can manage user_roles" on user_roles
    for all using (auth.role() = 'authenticated');

-- Access Logs: insert by authenticated, read by authenticated
create policy "Authenticated can read access_logs" on access_logs
    for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert access_logs" on access_logs
    for insert with check (auth.role() = 'authenticated');

-- =====================================================
-- Triggers for updated_at (reuse existing function)
-- =====================================================
drop trigger if exists update_resources_updated_at on resources;
create trigger update_resources_updated_at
    before update on resources
    for each row execute function update_updated_at_column();

drop trigger if exists update_actions_updated_at on actions;
create trigger update_actions_updated_at
    before update on actions
    for each row execute function update_updated_at_column();

drop trigger if exists update_roles_updated_at on roles;
create trigger update_roles_updated_at
    before update on roles
    for each row execute function update_updated_at_column();

-- =====================================================
-- Function: get_user_permissions
-- Returns permissions as "resource:action" strings
-- =====================================================
create or replace function public.get_user_permissions(p_user_id uuid)
returns table(permission text, is_superadmin boolean) as $$
begin
    -- Return superadmin flag even if no specific permissions
    if exists (
        select 1 from user_roles ur
        join roles r on r.id = ur.role_id
        where ur.user_id = p_user_id and r.is_superadmin = true
    ) then
        return query
        select
            coalesce(res.name || ':' || act.name, '__superadmin__') as permission,
            true as is_superadmin
        from user_roles ur
        join roles r on r.id = ur.role_id
        left join role_permissions rp on rp.role_id = ur.role_id
        left join permissions p on p.id = rp.permission_id
        left join resources res on res.id = p.resource_id
        left join actions act on act.id = p.action_id
        where ur.user_id = p_user_id;
        return;
    end if;

    return query
    select distinct
        res.name || ':' || act.name as permission,
        false as is_superadmin
    from user_roles ur
    join roles r on r.id = ur.role_id
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    join resources res on res.id = p.resource_id
    join actions act on act.id = p.action_id
    where ur.user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Seed Data
-- =====================================================

-- Default actions
insert into actions (name, description) values
    ('create', 'Create new records'),
    ('read', 'View/read records'),
    ('update', 'Edit/update records'),
    ('delete', 'Delete records')
on conflict (name) do nothing;

-- Resources for each module
insert into resources (name, module_id, description) values
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
on conflict (name) do nothing;

-- Superadmin role
insert into roles (name, description, is_superadmin) values
    ('superadmin', 'Super Administrator - Full access to all modules', true)
on conflict (name) do nothing;

-- Generate all permissions (every resource x every action)
insert into permissions (resource_id, action_id)
select r.id, a.id
from resources r
cross join actions a
on conflict (resource_id, action_id) do nothing;

-- Assign all permissions to superadmin role
insert into role_permissions (role_id, permission_id)
select
    (select id from roles where name = 'superadmin'),
    p.id
from permissions p
on conflict (role_id, permission_id) do nothing;
