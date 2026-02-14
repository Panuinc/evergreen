-- =====================================================
-- EverGreen Internal - Database Schema
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

-- Enable Row Level Security
alter table if exists employees enable row level security;
alter table if exists departments enable row level security;

-- Drop existing tables if needed (ระวัง: ข้อมูลจะหาย)
-- drop table if exists employees;
-- drop table if exists departments;

-- =====================================================
-- Table: departments
-- =====================================================
create table if not exists departments (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: employees
-- =====================================================
create table if not exists employees (
    id uuid default gen_random_uuid() primary key,
    first_name text not null,
    last_name text not null,
    email text unique,
    phone text,
    department text,
    position text,
    salary numeric(10,2),
    status text default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Departments policies
create policy "Enable read access for all users" on departments
    for select using (true);

create policy "Enable insert for authenticated users" on departments
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on departments
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on departments
    for delete using (auth.role() = 'authenticated');

-- Employees policies
create policy "Enable read access for all users" on employees
    for select using (true);

create policy "Enable insert for authenticated users" on employees
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on employees
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on employees
    for delete using (auth.role() = 'authenticated');

-- =====================================================
-- Functions for updated_at
-- =====================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
drop trigger if exists update_departments_updated_at on departments;
create trigger update_departments_updated_at
    before update on departments
    for each row
    execute function update_updated_at_column();

drop trigger if exists update_employees_updated_at on employees;
create trigger update_employees_updated_at
    before update on employees
    for each row
    execute function update_updated_at_column();

-- =====================================================
-- Sample Data (Optional)
-- =====================================================
insert into departments (name, description) values
    ('HR', 'Human Resources Department'),
    ('IT', 'Information Technology Department'),
    ('Sales', 'Sales and Marketing Department'),
    ('Production', 'Production and Manufacturing Department'),
    ('Warehouse', 'Warehouse and Logistics Department')
on conflict (name) do nothing;
