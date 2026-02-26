-- Add 2 users as Superadmin
INSERT INTO "userRoles" ("id", "userId", "roleId")
SELECT uuid_generate_v4(), u.uid, r."roleId"
FROM "roles" r
CROSS JOIN (VALUES
  ('74398792-6eaa-4fa3-8995-488378b35d35'::uuid),
  ('f20eff98-36f6-4cde-a7fa-d2897ead0fb0'::uuid)
) AS u(uid)
WHERE r."roleName" = 'Superadmin';
