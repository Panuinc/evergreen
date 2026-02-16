-- =====================================================
-- Seed: Additional Roles & Permissions
-- รันใน Supabase SQL Editor (หลังจากรัน rbac-schema.sql แล้ว)
-- =====================================================

-- 1) เพิ่ม Roles
insert into roles ("roleName", "roleDescription", "roleIsSuperadmin") values
    ('HR Manager', 'Full access to Human Resources module', false),
    ('HR Staff', 'View and update HR data', false),
    ('IT Admin', 'Full access to IT and Access Control modules', false),
    ('Finance Manager', 'Full access to Finance & Accounting module', false),
    ('Sales Manager', 'Full access to Sales module', false),
    ('Operations Manager', 'Full access to Operations module', false),
    ('Employee', 'Basic access - view overview and own data', false),
    ('Viewer', 'Read-only access to all modules', false)
on conflict ("roleName") do nothing;

-- 2) HR Manager → hr:* + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'HR Manager'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where r."resourceName" = 'hr'
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 3) HR Staff → hr:read, hr:update + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'HR Staff'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where (r."resourceName" = 'hr' and a."actionName" in ('read', 'update'))
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 4) IT Admin → it:* + rbac:* + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'IT Admin'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where r."resourceName" in ('it', 'rbac')
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 5) Finance Manager → finance:* + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'Finance Manager'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where r."resourceName" = 'finance'
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 6) Sales Manager → sales:* + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'Sales Manager'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where r."resourceName" = 'sales'
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 7) Operations Manager → operations:* + overview:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'Operations Manager'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where r."resourceName" = 'operations'
   or (r."resourceName" = 'overview' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 8) Employee → overview:read + hr:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'Employee'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where (r."resourceName" = 'overview' and a."actionName" = 'read')
   or (r."resourceName" = 'hr' and a."actionName" = 'read')
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;

-- 9) Viewer → ทุก resource:read
insert into "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
select
    (select "roleId" from roles where "roleName" = 'Viewer'),
    p."permissionId"
from permissions p
join resources r on r."resourceId" = p."permissionResourceId"
join actions a on a."actionId" = p."permissionActionId"
where a."actionName" = 'read'
on conflict ("rolePermissionRoleId", "rolePermissionPermissionId") do nothing;
