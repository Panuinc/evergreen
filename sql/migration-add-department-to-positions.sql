-- =====================================================
-- Migration: Add positionDepartment to positions table
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

alter table positions add column if not exists "positionDepartment" text;

-- Update existing positions with default department mapping
update positions set "positionDepartment" = 'IT' where "positionTitle" in ('CTO', 'Software Engineer', 'Senior Software Engineer', 'Frontend Developer', 'Backend Developer', 'IT Manager');
update positions set "positionDepartment" = 'HR' where "positionTitle" in ('HR Manager');
update positions set "positionDepartment" = 'Finance' where "positionTitle" in ('CFO', 'Accountant');
update positions set "positionDepartment" = 'Sales' where "positionTitle" in ('Sales Manager', 'Sales Executive');
update positions set "positionDepartment" = 'Marketing' where "positionTitle" in ('Marketing Manager');
update positions set "positionDepartment" = 'QA' where "positionTitle" in ('QA Engineer');
update positions set "positionDepartment" = 'Production' where "positionTitle" in ('Production Operator');
update positions set "positionDepartment" = 'Warehouse' where "positionTitle" in ('Warehouse Staff');
update positions set "positionDepartment" = 'Operations' where "positionTitle" in ('CEO', 'Project Manager', 'Product Manager');
update positions set "positionDepartment" = 'R&D' where "positionTitle" in ('UX/UI Designer', 'Data Analyst');
