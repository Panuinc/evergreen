-- ============================================================
-- Seed: Superadmin Setup
-- สร้าง RBAC พื้นฐาน + superadmin role เพื่อให้ระบบทำงานได้
-- ============================================================

-- 1. ACTIONS (CRUD)
INSERT INTO actions ("actionName", "actionDescription") VALUES
    ('create', 'Create new records'),
    ('read',   'View/read records'),
    ('update', 'Edit/update records'),
    ('delete', 'Delete records')
ON CONFLICT ("actionName") DO NOTHING;

-- 2. RESOURCES (modules ตาม menu)
INSERT INTO resources ("resourceName", "resourceModuleId", "resourceDescription") VALUES
    ('overview',    'overview',    'Overview & Dashboard'),
    ('hr',          'hr',          'Human Resources'),
    ('it',          'it',          'Information Technology'),
    ('finance',     'finance',     'Finance & Accounting'),
    ('sales',       'sales',       'Sales'),
    ('marketing',   'marketing',   'Marketing'),
    ('operations',  'operations',  'Operations'),
    ('procurement', 'procurement', 'Procurement'),
    ('production',  'production',  'Production'),
    ('qa',          'qa',          'Quality Assurance'),
    ('rnd',         'rnd',         'R&D'),
    ('cs',          'cs',          'Customer Service'),
    ('logistics',   'logistics',   'Transportation & Logistics'),
    ('warehouse',   'warehouse',   'Warehouse'),
    ('legal',       'legal',       'Legal & Compliance'),
    ('bc',          'bc',          '365 Business Central'),
    ('settings',    'settings',    'Settings'),
    ('rbac',        'rbac',        'Access Control')
ON CONFLICT ("resourceName") DO NOTHING;

-- 3. PERMISSIONS (resource x action cross product)
INSERT INTO permissions ("permissionResourceId", "permissionActionId")
SELECT r."resourceId", a."actionId"
FROM resources r
CROSS JOIN actions a
ON CONFLICT DO NOTHING;

-- 4. SUPERADMIN ROLE
INSERT INTO roles ("roleName", "roleDescription", "roleIsSuperadmin") VALUES
    ('superadmin', 'Super Administrator - Full access to all modules', true)
ON CONFLICT ("roleName") DO NOTHING;

-- 5. DB FUNCTION: get_user_permissions
-- ใช้ใน RBACContext เพื่อตรวจสอบ permissions ของ user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE (
    permission text,
    "isSuperadmin" boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        r."resourceName" || ':' || a."actionName" AS permission,
        ro."roleIsSuperadmin" AS "isSuperadmin"
    FROM "userRoles" ur
    JOIN roles ro ON ro."roleId" = ur."userRoleRoleId"
    LEFT JOIN "rolePermissions" rp ON rp."rolePermissionRoleId" = ro."roleId"
    LEFT JOIN permissions p ON p."permissionId" = rp."rolePermissionPermissionId"
    LEFT JOIN resources r ON r."resourceId" = p."permissionResourceId"
    LEFT JOIN actions a ON a."actionId" = p."permissionActionId"
    WHERE ur."userRoleUserId" = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- หลังรัน seed นี้แล้ว ให้ assign superadmin role ให้ user:
--
-- INSERT INTO "userRoles" ("userRoleUserId", "userRoleRoleId")
-- SELECT 'YOUR_USER_UUID_HERE', "roleId"
-- FROM roles WHERE "roleName" = 'superadmin';
-- ============================================================
