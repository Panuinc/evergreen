-- ============================================================
-- Migration: Add Divisions
-- Division > Department hierarchy
-- ============================================================

-- 1. Create divisions table
create table if not exists divisions (
    "divisionId" uuid default gen_random_uuid() primary key,
    "divisionName" text not null unique,
    "divisionDescription" text,
    "divisionCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "divisionUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Auto-update divisionUpdatedAt trigger
create or replace function update_division_updated_at()
returns trigger as $$
begin
    new."divisionUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_division_updated_at on divisions;
create trigger trigger_update_division_updated_at
    before update on divisions
    for each row
    execute function update_division_updated_at();

-- 3. RLS policies for divisions
alter table divisions enable row level security;

drop policy if exists "Allow authenticated read divisions" on divisions;
create policy "Allow authenticated read divisions"
    on divisions for select
    to authenticated
    using (true);

drop policy if exists "Allow authenticated insert divisions" on divisions;
create policy "Allow authenticated insert divisions"
    on divisions for insert
    to authenticated
    with check (true);

drop policy if exists "Allow authenticated update divisions" on divisions;
create policy "Allow authenticated update divisions"
    on divisions for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "Allow authenticated delete divisions" on divisions;
create policy "Allow authenticated delete divisions"
    on divisions for delete
    to authenticated
    using (true);

-- 4. Add departmentDivision column to departments table
alter table departments add column if not exists "departmentDivision" text;

-- 5. Add employeeDivision column to employees table
alter table employees add column if not exists "employeeDivision" text;
