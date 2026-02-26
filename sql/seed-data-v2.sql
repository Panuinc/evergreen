-- ============================================================
-- Seed Data V2 — Superadmin role + RBAC permissions
-- Run AFTER create-schema-v2.sql
-- ============================================================

-- 1. Create Superadmin role
INSERT INTO "rbacRole" ("rbacRoleId", "rbacRoleName", "rbacRoleDescription", "rbacRoleIsSuperadmin")
VALUES (uuid_generate_v4(), 'Superadmin', 'Full system access', true);

-- 2. Create actions
INSERT INTO "rbacAction" ("rbacActionName") VALUES ('view'), ('create'), ('update'), ('delete');

-- 3. Create resources (modules)
INSERT INTO "rbacResource" ("rbacResourceName", "rbacResourceModuleId") VALUES
  ('hr', 'hr'),
  ('rbac', 'rbac'),
  ('it', 'it'),
  ('tms', 'tms'),
  ('sales', 'sales'),
  ('marketing', 'marketing'),
  ('warehouse', 'warehouse'),
  ('performance', 'performance'),
  ('production', 'production'),
  ('bc', 'bc'),
  ('bci', 'bci'),
  ('settings', 'settings');

-- 4. Create permissions (resource × action matrix)
INSERT INTO "rbacPermission" ("rbacPermissionResourceId", "rbacPermissionActionId")
SELECT r."rbacResourceId", a."rbacActionId"
FROM "rbacResource" r
CROSS JOIN "rbacAction" a;

-- 5. Assign all permissions to Superadmin
INSERT INTO "rbacRolePermission" ("rbacRolePermissionRoleId", "rbacRolePermissionPermissionId")
SELECT r."rbacRoleId", p."rbacPermissionId"
FROM "rbacRole" r
CROSS JOIN "rbacPermission" p
WHERE r."rbacRoleName" = 'Superadmin';

-- 6. Assign Superadmin to 3 users
INSERT INTO "rbacUserRole" ("rbacUserRoleUserId", "rbacUserRoleRoleId")
SELECT u.uid, r."rbacRoleId"
FROM "rbacRole" r
CROSS JOIN (VALUES
  ('9411904e-037d-4330-b5f4-bfee8c5e0851'::uuid),
  ('74398792-6eaa-4fa3-8995-488378b35d35'::uuid),
  ('f20eff98-36f6-4cde-a7fa-d2897ead0fb0'::uuid)
) AS u(uid)
WHERE r."rbacRoleName" = 'Superadmin';

-- 7. Create storage buckets (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('omnichannel', 'omnichannel', true),
--   ('tms', 'tms', true),
--   ('resumes', 'resumes', true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done! Superadmin role + 48 permissions + 3 users assigned.
-- ============================================================
