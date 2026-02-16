-- =====================================================
-- EverGreen Internal - Database Schema (prefixed camelCase)
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

-- Enable Row Level Security
alter table if exists employees enable row level security;
alter table if exists departments enable row level security;

-- =====================================================
-- Table: departments
-- =====================================================
create table if not exists departments (
    "departmentId" uuid default gen_random_uuid() primary key,
    "departmentName" text not null unique,
    "departmentDescription" text,
    "departmentCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "departmentUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: positions
-- =====================================================
create table if not exists positions (
    "positionId" uuid default gen_random_uuid() primary key,
    "positionTitle" text not null unique,
    "positionDescription" text,
    "positionCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "positionUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table: employees
-- =====================================================
create table if not exists employees (
    "employeeId" uuid default gen_random_uuid() primary key,
    "employeeUserId" uuid references auth.users(id) on delete set null unique,
    "employeeFirstName" text not null,
    "employeeLastName" text not null,
    "employeeEmail" text unique,
    "employeePhone" text,
    "employeeDepartment" text,
    "employeePosition" text,
    "employeeSalary" numeric(10,2),
    "employeeStatus" text default 'active' check ("employeeStatus" in ('active', 'inactive')),
    "employeeCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "employeeUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

create policy "Enable read access for all users" on departments
    for select using (true);
create policy "Enable insert for authenticated users" on departments
    for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on departments
    for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on departments
    for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on positions
    for select using (true);
create policy "Enable insert for authenticated users" on positions
    for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on positions
    for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on positions
    for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on employees
    for select using (true);
create policy "Enable insert for authenticated users" on employees
    for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on employees
    for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on employees
    for delete using (auth.role() = 'authenticated');

-- =====================================================
-- Triggers for updatedAt
-- =====================================================
create or replace function update_department_updated_at()
returns trigger as $$
begin
    new."departmentUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create or replace function update_position_updated_at()
returns trigger as $$
begin
    new."positionUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create or replace function update_employee_updated_at()
returns trigger as $$
begin
    new."employeeUpdatedAt" = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_departments_updated_at on departments;
create trigger update_departments_updated_at
    before update on departments
    for each row
    execute function update_department_updated_at();

drop trigger if exists update_positions_updated_at on positions;
create trigger update_positions_updated_at
    before update on positions
    for each row
    execute function update_position_updated_at();

drop trigger if exists update_employees_updated_at on employees;
create trigger update_employees_updated_at
    before update on employees
    for each row
    execute function update_employee_updated_at();

-- =====================================================
-- Sample Data (Optional)
-- =====================================================
insert into departments ("departmentName", "departmentDescription") values
    ('HR', 'Human Resources Department'),
    ('IT', 'Information Technology Department'),
    ('Sales', 'Sales and Marketing Department'),
    ('Production', 'Production and Manufacturing Department'),
    ('Warehouse', 'Warehouse and Logistics Department'),
    ('Finance', 'Finance and Accounting Department'),
    ('Marketing', 'Marketing Department'),
    ('Operations', 'Operations Department'),
    ('QA', 'Quality Assurance Department'),
    ('R&D', 'Research and Development Department')
on conflict ("departmentName") do nothing;

insert into positions ("positionTitle", "positionDescription") values
    ('CEO', 'Chief Executive Officer'),
    ('CTO', 'Chief Technology Officer'),
    ('CFO', 'Chief Financial Officer'),
    ('HR Manager', 'Human Resources Manager'),
    ('IT Manager', 'Information Technology Manager'),
    ('Sales Manager', 'Sales Department Manager'),
    ('Marketing Manager', 'Marketing Department Manager'),
    ('Software Engineer', 'Software Developer / Engineer'),
    ('Senior Software Engineer', 'Senior Software Developer'),
    ('Frontend Developer', 'Frontend Web Developer'),
    ('Backend Developer', 'Backend Web Developer'),
    ('QA Engineer', 'Quality Assurance Engineer'),
    ('Project Manager', 'Project Manager'),
    ('Product Manager', 'Product Manager'),
    ('UX/UI Designer', 'User Experience / User Interface Designer'),
    ('Data Analyst', 'Data Analyst'),
    ('Accountant', 'Accountant'),
    ('Sales Executive', 'Sales Executive'),
    ('Warehouse Staff', 'Warehouse Staff'),
    ('Production Operator', 'Production Line Operator')
on conflict ("positionTitle") do nothing;

insert into employees ("employeeFirstName", "employeeLastName", "employeeEmail", "employeePhone", "employeeDepartment", "employeePosition", "employeeSalary", "employeeStatus") values
    ('สมชาย', 'ใจดี', 'somchai@evergreen.co.th', '081-111-1111', 'IT', 'CTO', 120000.00, 'active'),
    ('สมหญิง', 'รักดี', 'somying@evergreen.co.th', '081-222-2222', 'HR', 'HR Manager', 85000.00, 'active'),
    ('วิชัย', 'สุขสันต์', 'wichai@evergreen.co.th', '081-333-3333', 'IT', 'Senior Software Engineer', 75000.00, 'active'),
    ('นภา', 'แสงทอง', 'napa@evergreen.co.th', '081-444-4444', 'IT', 'Software Engineer', 55000.00, 'active'),
    ('ประเสริฐ', 'มั่นคง', 'prasert@evergreen.co.th', '081-555-5555', 'Finance', 'CFO', 110000.00, 'active'),
    ('จิราภรณ์', 'วงศ์ทอง', 'jiraporn@evergreen.co.th', '081-666-6666', 'Sales', 'Sales Manager', 80000.00, 'active'),
    ('ธนกร', 'พัฒนา', 'thanakorn@evergreen.co.th', '081-777-7777', 'IT', 'Frontend Developer', 50000.00, 'active'),
    ('พิมพ์ใจ', 'สว่างจิต', 'pimjai@evergreen.co.th', '081-888-8888', 'Marketing', 'Marketing Manager', 78000.00, 'active'),
    ('อนุชา', 'ทองคำ', 'anucha@evergreen.co.th', '081-999-9999', 'Production', 'Production Operator', 25000.00, 'active'),
    ('กัญญา', 'ดวงใจ', 'kanya@evergreen.co.th', '082-111-1111', 'Warehouse', 'Warehouse Staff', 22000.00, 'active');
