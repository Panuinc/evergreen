-- =====================================================
-- SEED ALL DATA - บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด
-- รัน Supabase SQL Editor
-- ครอบคลุม: RBAC, HR, TMS, Omnichannel AI Settings
-- =====================================================


-- =====================================================
-- PART 1: RBAC
-- =====================================================

-- 1.1 Actions
INSERT INTO actions ("actionName", "actionDescription") VALUES
    ('create', 'Create new records'),
    ('read',   'View/read records'),
    ('update', 'Edit/update records'),
    ('delete', 'Delete records')
ON CONFLICT ("actionName") DO NOTHING;

-- 1.2 Resources
INSERT INTO resources ("resourceName", "resourceModuleId", "resourceDescription") VALUES
    ('overview',     'overview',     'Overview & Dashboard'),
    ('hr',           'hr',           'Human Resources'),
    ('it',           'it',           'Information Technology'),
    ('finance',      'finance',      'Finance & Accounting'),
    ('sales',        'sales',        'Sales'),
    ('marketing',    'marketing',    'Marketing'),
    ('operations',   'operations',   'Operations'),
    ('procurement',  'procurement',  'Procurement'),
    ('production',   'production',   'Production'),
    ('qa',           'qa',           'Quality Assurance'),
    ('rnd',          'rnd',          'R&D'),
    ('cs',           'cs',           'Customer Service'),
    ('logistics',    'logistics',    'Logistics'),
    ('warehouse',    'warehouse',    'Warehouse'),
    ('legal',        'legal',        'Legal & Compliance'),
    ('rbac',         'rbac',         'Access Control')
ON CONFLICT ("resourceName") DO NOTHING;

-- 1.3 Roles
INSERT INTO roles ("roleName", "roleDescription", "roleIsSuperadmin") VALUES
    ('superadmin',          'Super Administrator - Full access to all modules', true),
    ('HR Manager',          'Full access to Human Resources module',            false),
    ('HR Staff',            'View and update HR data',                          false),
    ('IT Admin',            'Full access to IT and Access Control modules',     false),
    ('Finance Manager',     'Full access to Finance & Accounting module',       false),
    ('Sales Manager',       'Full access to Sales module',                      false),
    ('Operations Manager',  'Full access to Operations module',                 false),
    ('Employee',            'Basic access - view overview and own data',        false),
    ('Viewer',              'Read-only access to all modules',                  false)
ON CONFLICT ("roleName") DO NOTHING;

-- 1.4 Permissions (cross join resources × actions)
INSERT INTO permissions ("permissionResourceId", "permissionActionId")
SELECT r."resourceId", a."actionId"
FROM resources r
CROSS JOIN actions a
ON CONFLICT ("permissionResourceId", "permissionActionId") DO NOTHING;

-- 1.5 Role Permissions

-- superadmin → all permissions
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'superadmin'), p."permissionId"
FROM permissions p
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- HR Manager → hr:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'HR Manager'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" = 'hr'
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- HR Staff → hr:read, hr:update + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'HR Staff'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE (r."resourceName" = 'hr'       AND a."actionName" IN ('read','update'))
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- IT Admin → it:* + rbac:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'IT Admin'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" IN ('it','rbac')
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- Finance Manager → finance:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Finance Manager'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" = 'finance'
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- Sales Manager → sales:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Sales Manager'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" = 'sales'
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- Operations Manager → operations:* + logistics:* + warehouse:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Operations Manager'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" IN ('operations','logistics','warehouse')
   OR (r."resourceName" = 'overview' AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- Employee → overview:read + hr:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Employee'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE (r."resourceName" = 'overview' AND a."actionName" = 'read')
   OR (r."resourceName" = 'hr'       AND a."actionName" = 'read')
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;

-- Viewer → all resources:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Viewer'), p."permissionId"
FROM permissions p
JOIN actions a ON a."actionId" = p."permissionActionId"
WHERE a."actionName" = 'read'
ON CONFLICT ("rolePermissionRoleId", "rolePermissionPermissionId") DO NOTHING;


-- =====================================================
-- PART 2: HR DATA
-- =====================================================

-- 2.1 Departments (12 แผนก)
INSERT INTO departments ("departmentName", "departmentDescription") VALUES
    ('ผู้บริหาร',                              'ทีมผู้บริหารระดับสูงของบริษัท'),
    ('ฝ่ายการเงินและบัญชี',                   'ดูแลการเงิน บัญชี และงบประมาณ'),
    ('ฝ่ายการตลาด',                           'ดูแลการตลาด Digital Marketing และ Social Media'),
    ('ฝ่ายวิศวกรรม (CAD/CNC)',               'ออกแบบและผลิตงาน CAD/CNC'),
    ('ฝ่ายทรัพยากรบุคคล',                    'บริหารบุคลากรและสวัสดิการ'),
    ('ฝ่ายเทคโนโลยีสารสนเทศ',               'ดูแลระบบ IT โครงสร้างพื้นฐาน และซอฟต์แวร์'),
    ('ฝ่ายซ่อมบำรุง',                         'ซ่อมบำรุงเครื่องจักรและอุปกรณ์'),
    ('ฝ่ายผลิต',                              'ดำเนินการผลิตสินค้า WPC และผลิตภัณฑ์อื่นๆ'),
    ('ฝ่ายจัดซื้อ',                           'จัดซื้อวัตถุดิบและสินค้า'),
    ('ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',       'ควบคุมคุณภาพและการบรรจุภัณฑ์'),
    ('ฝ่ายขาย',                               'บริหารการขายและความสัมพันธ์ลูกค้า'),
    ('ฝ่ายคลังสินค้าและโลจิสติกส์',          'ดูแลคลังสินค้าและการจัดส่ง')
ON CONFLICT ("departmentName") DO NOTHING;

-- 2.2 Positions (32 ตำแหน่ง)
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    -- ผู้บริหาร
    ('กรรมการผู้จัดการ',                                      'Managing Director',                          'ผู้บริหาร'),
    -- ฝ่ายการเงินและบัญชี
    ('ผู้จัดการฝ่ายการเงินและบัญชี',                         'Accounting and Finance Manager',             'ฝ่ายการเงินและบัญชี'),
    ('เจ้าหน้าที่การเงินและบัญชี',                           'Accounting and Finance Officer',             'ฝ่ายการเงินและบัญชี'),
    -- ฝ่ายการตลาด
    ('ผู้จัดการฝ่ายการตลาด',                                 'Digital Marketing Manager',                  'ฝ่ายการตลาด'),
    ('เจ้าหน้าที่การตลาด',                                   'Marketing Officer',                          'ฝ่ายการตลาด'),
    -- ฝ่ายวิศวกรรม (CAD/CNC)
    ('หัวหน้างาน CAD/CNC',                                   'Drawing and CNC Supervisor',                 'ฝ่ายวิศวกรรม (CAD/CNC)'),
    ('เจ้าหน้าที่ CAD/CNC',                                  'Drawing and CNC Officer',                    'ฝ่ายวิศวกรรม (CAD/CNC)'),
    ('ช่างเทคนิค CAD/CNC',                                   'Drawing and CNC Staff',                      'ฝ่ายวิศวกรรม (CAD/CNC)'),
    -- ฝ่ายทรัพยากรบุคคล
    ('เจ้าหน้าที่ทรัพยากรบุคคล',                            'Human Resources Officer',                    'ฝ่ายทรัพยากรบุคคล'),
    ('ผู้ช่วยฝ่ายทรัพยากรบุคคล',                            'Human Resources Staff',                      'ฝ่ายทรัพยากรบุคคล'),
    -- ฝ่ายเทคโนโลยีสารสนเทศ
    ('เจ้าหน้าที่เทคโนโลยีสารสนเทศ',                        'Information Technology Officer',             'ฝ่ายเทคโนโลยีสารสนเทศ'),
    -- ฝ่ายซ่อมบำรุง
    ('หัวหน้างานซ่อมบำรุง',                                  'Maintenance Supervisor',                     'ฝ่ายซ่อมบำรุง'),
    -- ฝ่ายผลิต
    ('ผู้จัดการฝ่ายผลิต',                                    'Production Manager',                         'ฝ่ายผลิต'),
    ('ผู้ช่วยผู้จัดการฝ่ายผลิต',                             'Assistant Production Manager',               'ฝ่ายผลิต'),
    ('ผู้ช่วยหัวหน้างานผลิต',                                'Assistant Production Supervisor',            'ฝ่ายผลิต'),
    ('หัวหน้ากลุ่มงานผลิต',                                  'Production Supervisor Leader',               'ฝ่ายผลิต'),
    ('หัวหน้ากะผลิต WPC',                                    'Production WPC Shift Supervisor',            'ฝ่ายผลิต'),
    ('หัวหน้ากลุ่มงานพ่นสี',                                 'Production Spray Painting Leader',           'ฝ่ายผลิต'),
    ('เจ้าหน้าที่ธุรการฝ่ายผลิต',                           'Production Administrative Officer',          'ฝ่ายผลิต'),
    ('พนักงานผลิต WPC',                                      'Production WPC Staff',                       'ฝ่ายผลิต'),
    ('พนักงานผลิต',                                          'Production Staff',                           'ฝ่ายผลิต'),
    ('พนักงานพ่นสี',                                         'Production Spray Painting Staff',            'ฝ่ายผลิต'),
    -- ฝ่ายจัดซื้อ
    ('เจ้าหน้าที่จัดซื้อ',                                   'Purchasing Officer',                         'ฝ่ายจัดซื้อ'),
    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์
    ('หัวหน้างานควบคุมคุณภาพและบรรจุภัณฑ์',                 'Quality and Packing Supervisor',             'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    ('หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์',           'Quality and Packing Leader',                 'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    ('พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',                    'Quality and Packing Staff',                  'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    -- ฝ่ายขาย
    ('ผู้จัดการฝ่ายขาย',                                     'Sales Manager',                              'ฝ่ายขาย'),
    ('เจ้าหน้าที่ขาย',                                       'Sales Officer',                              'ฝ่ายขาย'),
    ('เจ้าหน้าที่ธุรการฝ่ายขาย',                            'Sales Administrative Officer',               'ฝ่ายขาย'),
    ('ผู้ประสานงานฝ่ายขาย',                                  'Sales Coordinator',                          'ฝ่ายขาย'),
    -- ฝ่ายคลังสินค้าและโลจิสติกส์
    ('หัวหน้างานคลังสินค้าและโลจิสติกส์',                   'Warehouse and Logistics Supervisor',         'ฝ่ายคลังสินค้าและโลจิสติกส์'),
    ('พนักงานคลังสินค้าและโลจิสติกส์',                      'Warehouse and Logistics Staff',              'ฝ่ายคลังสินค้าและโลจิสติกส์')
ON CONFLICT ("positionTitle") DO NOTHING;

-- 2.3 Employees (86 คน จาก Excel staff_thai_standard.xlsx)
INSERT INTO employees (
    "employeeFirstName", "employeeLastName", "employeeEmail",
    "employeeDepartment", "employeePosition", "employeeStatus"
) VALUES
    -- ผู้บริหาร
    ('จงคม',       'ชูชัยศรี',              'jongkhom.c@chhindustry.com',             'ผู้บริหาร',                         'กรรมการผู้จัดการ',                          'active'),
    -- ฝ่ายการเงินและบัญชี
    ('ไพโรจน์',    'พรมจีน',                'phairote.p@chhindustry.com',             'ฝ่ายการเงินและบัญชี',               'ผู้จัดการฝ่ายการเงินและบัญชี',             'active'),
    ('ภาวิตา',     'คุ้มด้วง',              'pavita.a@chhindustry.com',               'ฝ่ายการเงินและบัญชี',               'เจ้าหน้าที่การเงินและบัญชี',               'active'),
    ('พรพิมล',     'ดาวลอย',               'pornpimol.d@chhindustry.com',            'ฝ่ายการเงินและบัญชี',               'เจ้าหน้าที่การเงินและบัญชี',               'active'),
    -- ฝ่ายการตลาด
    ('ภัทรชนน',   'จันทะ',                 'phattharachanon.c@chhindustry.com',      'ฝ่ายการตลาด',                       'ผู้จัดการฝ่ายการตลาด',                     'active'),
    ('อาชวิน',    'วาณิชวัฒนะสกุล',        'adam.a@chhindustry.com',                 'ฝ่ายการตลาด',                       'เจ้าหน้าที่การตลาด',                       'active'),
    ('ชนากานต์',  'ศิริแส',                'chanakan.s@chhindustry.com',             'ฝ่ายการตลาด',                       'เจ้าหน้าที่การตลาด',                       'active'),
    ('ธมลวรรณ',   'ษัษฐชาคร',             'tamonwan.s@chhindustry.com',             'ฝ่ายการตลาด',                       'เจ้าหน้าที่การตลาด',                       'active'),
    -- ฝ่ายวิศวกรรม (CAD/CNC)
    ('สุทัศน์',   'ใจเอี่ยม',              'sutad.j@chhindustry.com',                'ฝ่ายวิศวกรรม (CAD/CNC)',             'หัวหน้างาน CAD/CNC',                       'active'),
    ('รัฐศาสตร์', 'แสงสุวรรณ์',            'ratthasat.s@chhindustry.com',            'ฝ่ายวิศวกรรม (CAD/CNC)',             'เจ้าหน้าที่ CAD/CNC',                      'active'),
    ('Soe',        'Khaing',                NULL,                                      'ฝ่ายวิศวกรรม (CAD/CNC)',             'ช่างเทคนิค CAD/CNC',                       'active'),
    ('Aung',       'Thu',                   NULL,                                      'ฝ่ายวิศวกรรม (CAD/CNC)',             'ช่างเทคนิค CAD/CNC',                       'active'),
    -- ฝ่ายทรัพยากรบุคคล
    ('สุเมธ',     'นุ่มทอง',               'sumeth.n@chhindustry.com',               'ฝ่ายทรัพยากรบุคคล',                 'เจ้าหน้าที่ทรัพยากรบุคคล',                'active'),
    ('นันทา',     'นิ่มนวล',               NULL,                                      'ฝ่ายทรัพยากรบุคคล',                 'ผู้ช่วยฝ่ายทรัพยากรบุคคล',                'active'),
    -- ฝ่ายเทคโนโลยีสารสนเทศ
    ('ปาณัสม์',   'เตียวนะ',               'panut.t@chhindustry.com',                'ฝ่ายเทคโนโลยีสารสนเทศ',             'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',            'active'),
    ('ภาณุวัต',   'แจ้งชัดใจ',             'panuwat.j@chhindustry.com',              'ฝ่ายเทคโนโลยีสารสนเทศ',             'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',            'active'),
    ('วิภวา',     'จันทร์แสงวัฒนา',        'wipawa.c@chhindustry.com',               'ฝ่ายเทคโนโลยีสารสนเทศ',             'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',            'active'),
    -- ฝ่ายซ่อมบำรุง
    ('ขวัญชัย',   'กลิ่นประทุม',           'kwanchai.k@chhindustry.com',             'ฝ่ายซ่อมบำรุง',                     'หัวหน้างานซ่อมบำรุง',                      'active'),
    -- ฝ่ายผลิต - ผู้บริหาร/หัวหน้า
    ('วชิรศักดิ์', 'พึ่งอัน',              'wachirasak.p@chhindustry.com',           'ฝ่ายผลิต',                           'ผู้จัดการฝ่ายผลิต',                        'active'),
    ('กันตพัฒน์', 'ตรีพิริยะมงคล',         'guntaphat.t@chhindustry.com',            'ฝ่ายผลิต',                           'ผู้ช่วยผู้จัดการฝ่ายผลิต',                 'active'),
    ('อมรเทพ',    'นพศรี',                 'amorntep.n@chhindustry.com',             'ฝ่ายผลิต',                           'ผู้ช่วยหัวหน้างานผลิต',                    'active'),
    ('พัชรี',     'สุขพลอย',               'phatcharee.s@chhindustry.com',           'ฝ่ายผลิต',                           'เจ้าหน้าที่ธุรการฝ่ายผลิต',               'active'),
    ('สมพร',      'เรืองศรี',              'somporn20021970@gmail.com',              'ฝ่ายผลิต',                           'หัวหน้ากลุ่มงานผลิต',                      'active'),
    -- ฝ่ายผลิต - หัวหน้ากะ WPC
    ('Tin',        'Tun',                   NULL,                                      'ฝ่ายผลิต',                           'หัวหน้ากะผลิต WPC',                        'active'),
    ('Soe',        'Win',                   NULL,                                      'ฝ่ายผลิต',                           'หัวหน้ากะผลิต WPC',                        'active'),
    -- ฝ่ายผลิต - หัวหน้าพ่นสี
    ('พยุง',      'ขาวกลาง',               NULL,                                      'ฝ่ายผลิต',                           'หัวหน้ากลุ่มงานพ่นสี',                     'active'),
    -- ฝ่ายผลิต - พนักงานผลิต WPC
    ('Nน',         'Zin Tun',               NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('เซียง',     'โก อู',                 NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('Aung',       'Htet Oo',               NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('หลิน',      'ไม่มีนามสกุล',          NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('Yin',        'Maung Htay',            NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('Aung',       'Phyo Lin Htet',         NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('Min',        'Ko Ko',                 NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    ('Phyo',       'Chit Aung',             NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต WPC',                          'active'),
    -- ฝ่ายผลิต - พนักงานผลิต (general)
    ('Aung',       'Kyaw Kyow',             NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Zaw',        'Zaw',                   NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Sai',        'Kyaw Zin',              NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Kaung',      'Myat Maung',            NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Nay',        'Lin Tun',               NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Mi',         'Mi Wi',                 NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Nay',        'Lin Oo',                NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Zaw',        'Htet Aung',             NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Shin',       'Min Tun',               NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Saw',        'Htay',                  NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Phyo',       'Thet Paing',            NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Zaw',        'Hlaing Oo',             NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Htay',       'Htay Win',              NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Thay',       'Seu Seu',               NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Moa',        'Ko Oo',                 NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Lin',        'Lin',                   NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    ('Si',         'Thu Phyo',              NULL,                                      'ฝ่ายผลิต',                           'พนักงานผลิต',                               'active'),
    -- ฝ่ายผลิต - พนักงานพ่นสี
    ('Thein',      'Zaw',                   NULL,                                      'ฝ่ายผลิต',                           'พนักงานพ่นสี',                              'active'),
    ('Yin',        'Mar Aung',              NULL,                                      'ฝ่ายผลิต',                           'พนักงานพ่นสี',                              'active'),
    ('Mee',        'Zaw Htay',              NULL,                                      'ฝ่ายผลิต',                           'พนักงานพ่นสี',                              'active'),
    -- ฝ่ายจัดซื้อ
    ('เพลินตา',   'วงศ์ประเสริฐ',           'plearnta.w@chhindustry.com',             'ฝ่ายจัดซื้อ',                       'เจ้าหน้าที่จัดซื้อ',                       'active'),
    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์ - หัวหน้า
    ('พีระยุทธ',  'หม่องวิลัย',            'peerayut.m@chhindustry.com',             'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'หัวหน้างานควบคุมคุณภาพและบรรจุภัณฑ์',   'active'),
    ('Aye',        'Thidar San',            NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์','active'),
    ('เหมรัศมิ์', 'วงศ์โพธิ์',             'moment.ta.2409@gmail.com',               'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์','active'),
    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์ - พนักงาน
    ('สมหมาย',    'บัวแย้ม',               NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('ไค',         'วิน ไม่มีนามสกุล',     NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('สุเตียน',   'ไม่มีนามสกุล',          NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('Ma',         'Mon',                   NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('Ni',         'Ni Win',                NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('Zin',        'Min Hlaing',            NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('Zar',        'Zi Ho',                 NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('Hnin',       'Thwe Aye',              NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    ('มาลี',      'เทศแก้ว',               NULL,                                      'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',   'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',       'active'),
    -- ฝ่ายขาย
    ('นวพล',      'ชูเกียรติ',             'nawapol.c@chhindustry.com',              'ฝ่ายขาย',                           'ผู้จัดการฝ่ายขาย',                         'active'),
    ('พิชฌาภา',  'วัดอิ่ม',               'pitchapa.w@chhindustry.com',             'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('ดวงมณี',   'ตั้งสุขศรี',             'duangmanee.t@chhindustry.com',           'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('ปิยะพงศ์', 'วรรณภาพรรณ์',           'piyapong.w@chhindustry.com',             'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('รัชพล',    'สังขวรรณ',              'ratchapol.s@chhindustry.com',            'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('มัทนา',    'บานเย็น',               'muttana.b@chhindustry.com',              'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('เกสรา',    'ภัทรนวงษ์',             'gassara.p@chhindustry.com',              'ฝ่ายขาย',                           'เจ้าหน้าที่ขาย',                           'active'),
    ('อรวรรณ',   'อมรปิยะกิจ',            'orawan.a@chhindustry.com',               'ฝ่ายขาย',                           'เจ้าหน้าที่ธุรการฝ่ายขาย',                'active'),
    ('ธีรชัย',   'เมฆแก้ว',               'theerachai.mekkaew@chhindustry.com',     'ฝ่ายขาย',                           'ผู้ประสานงานฝ่ายขาย',                      'active'),
    -- ฝ่ายคลังสินค้าและโลจิสติกส์
    ('จตุพร',    'ทองงาม',                'jatuporn.t@chhindustry.com',             'ฝ่ายคลังสินค้าและโลจิสติกส์',      'หัวหน้างานคลังสินค้าและโลจิสติกส์',      'active'),
    ('นลธวัช',   'พรหมยิ้มแย้ม',          NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('Aung',      'Zaw Tun',               NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('ธรรมนูญ',  'ไชยแก้ว',               NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('Naing',     'Zaw Oo',                NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('Than',      'Htike Aung',            NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('อนุสรณ์',  'ยิ้มดี',                NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('Min',       'Khant Kyaw',            NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('Kyaw',      'Kyaw Htwe',             NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active'),
    ('ปาน',      'ออระอ่อน',              NULL,                                      'ฝ่ายคลังสินค้าและโลจิสติกส์',      'พนักงานคลังสินค้าและโลจิสติกส์',          'active')
ON CONFLICT ("employeeEmail") DO NOTHING;


-- =====================================================
-- PART 3: TMS DATA
-- =====================================================

-- 3.1 Vehicles (8 คัน)
INSERT INTO vehicles (
    "vehicleId", "vehiclePlateNumber", "vehicleName", "vehicleType",
    "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor",
    "vehicleVinNumber", "vehicleRegistrationExpiry", "vehicleInsuranceExpiry",
    "vehicleInsurancePolicy", "vehicleActExpiry", "vehicleCapacityKg",
    "vehicleFuelType", "vehicleCurrentMileage", "vehicleStatus", "vehicleNotes"
) VALUES
    ('a0000001-0000-0000-0000-000000000001','1ก-1234 กทม','รถบรรทุก 1 (ISUZU FRR)','truck',
     'ISUZU','FRR 210',2021,'ขาว','JALFRD21C10000001','2026-06-15','2026-08-20',
     'POL-INS-2024-001','2026-07-10',8000,'diesel',85200,'available','รถหลักสายกรุงเทพ-สมุทรปราการ'),

    ('a0000001-0000-0000-0000-000000000002','2ก-5678 กทม','รถบรรทุก 2 (ISUZU NQR)','truck',
     'ISUZU','NQR 150',2022,'ขาว','JALFRD21C10000002','2026-09-20','2026-10-15',
     'POL-INS-2024-002','2026-09-01',6000,'diesel',62300,'in_use','สภาพดี เพิ่งเปลี่ยนยาง'),

    ('a0000001-0000-0000-0000-000000000003','3ก-9012 กทม','รถบรรทุก 3 (HINO 500)','truck',
     'HINO','500 FC9J',2020,'ขาว','JHDGH8J1XC0000003','2026-03-10','2026-04-05',
     'POL-INS-2024-003','2026-03-25',12000,'diesel',120500,'available','รถบรรทุกหนัก สายไกล'),

    ('a0000001-0000-0000-0000-000000000004','4ก-3456 กทม','รถบรรทุก 4 (HINO 300)','truck',
     'HINO','300 XZU710',2023,'ฟ้า','JHDGH8J1XC0000004','2027-01-20','2027-02-15',
     'POL-INS-2024-004','2027-01-10',8000,'diesel',31000,'available',NULL),

    ('a0000001-0000-0000-0000-000000000005','5ข-7890 กทม','รถกระบะ 1 (Toyota Hilux)','pickup',
     'Toyota','Hilux Revo',2023,'เทา','MROER12G9N0000005','2027-03-01','2027-04-10',
     'POL-INS-2024-005','2027-03-15',1500,'diesel',28500,'available','สำหรับส่งของชิ้นเล็ก'),

    ('a0000001-0000-0000-0000-000000000006','6ข-2345 กทม','รถตู้ 1 (Toyota Commuter)','van',
     'Toyota','Commuter',2022,'ขาว','MROER12G9N0000006','2026-05-20','2026-06-10',
     'POL-INS-2024-006','2026-05-01',1200,'diesel',55800,'in_use','รถตู้ส่งสินค้าเบา'),

    ('a0000001-0000-0000-0000-000000000007','7ค-6789 กทม','รถบรรทุก 5 (ISUZU GXZ)','trailer',
     'ISUZU','GXZ 360',2019,'ขาว','JALFRD21C10000007','2026-02-28','2026-03-15',
     'POL-INS-2024-007','2026-02-20',20000,'diesel',198000,'maintenance','อยู่ระหว่างซ่อมเบรก'),

    ('a0000001-0000-0000-0000-000000000008','8ค-1122 กทม','รถบรรทุก 6 (Mitsubishi Canter)','truck',
     'Mitsubishi','Canter FE85',2018,'ขาว','MMBJNK6508D000008','2025-12-01','2025-11-15',
     'POL-INS-2024-008','2025-11-30',7000,'diesel',210000,'retired','ปลดระวาง - สภาพเครื่องยนต์เสื่อม')
ON CONFLICT ("vehicleId") DO NOTHING;


-- 3.2 Drivers (8 คน)
INSERT INTO drivers (
    "driverId", "driverFirstName", "driverLastName", "driverPhone",
    "driverLicenseNumber", "driverLicenseType", "driverLicenseExpiry",
    "driverRole", "driverStatus", "driverNotes"
) VALUES
    ('b0000001-0000-0000-0000-000000000001','สมชาย','รักษาดี','081-234-5678',
     'DL-50100001','type2','2027-05-15','driver','available','ประสบการณ์ขับรถบรรทุก 10 ปี'),

    ('b0000001-0000-0000-0000-000000000002','วิชัย','ใจดี','082-345-6789',
     'DL-50100002','type2','2026-11-20','driver','on_duty','สายกรุงเทพ-ชลบุรี'),

    ('b0000001-0000-0000-0000-000000000003','ประยุทธ์','มานะ','083-456-7890',
     'DL-50100003','type3','2027-08-10','driver','available','ใบขับขี่ประเภท 3 - ขับรถพ่วงได้'),

    ('b0000001-0000-0000-0000-000000000004','สุรชัย','แสงทอง','084-567-8901',
     'DL-50100004','type2','2026-03-05','driver','available','ใบขับขี่ใกล้หมดอายุ!'),

    ('b0000001-0000-0000-0000-000000000005','อนันต์','วงษ์สุวรรณ','085-678-9012',
     'DL-50100005','type2','2027-02-28','driver','on_leave','ลาพักร้อน 15-28 ก.พ.'),

    ('b0000001-0000-0000-0000-000000000006','พิชัย','สมบูรณ์','086-789-0123',
     'DL-50100006','type1','2027-06-15','assistant','available','ผู้ช่วยคนขับ ช่วยยกของ'),

    ('b0000001-0000-0000-0000-000000000007','ธนา','เจริญผล','087-890-1234',
     'DL-50100007','type1','2026-09-30','assistant','on_duty','ผู้ช่วยคนขับ'),

    ('b0000001-0000-0000-0000-000000000008','กิตติ','พงษ์พิพัฒน์','088-901-2345',
     'DL-50100008','type2','2025-12-31','driver','inactive','ลาออก ธ.ค. 2025')
ON CONFLICT ("driverId") DO NOTHING;


-- 3.3 Routes (8 เส้นทาง)
INSERT INTO routes (
    "routeId", "routeName", "routeOrigin",
    "routeOriginLat", "routeOriginLng",
    "routeDestination", "routeDestinationLat", "routeDestinationLng",
    "routeDistanceKm", "routeEstimatedMinutes", "routeNotes", "routeStatus"
) VALUES
    ('c0000001-0000-0000-0000-000000000001','กรุงเทพ → สมุทรปราการ','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     45,60,'เส้นทางบางนา-ตราด ไม่ผ่านด่าน','active'),

    ('c0000001-0000-0000-0000-000000000002','กรุงเทพ → นนทบุรี','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'ศูนย์กระจายสินค้า นนทบุรี',13.8621,100.5144,
     30,45,'ผ่านทางด่วนศรีรัช','active'),

    ('c0000001-0000-0000-0000-000000000003','กรุงเทพ → ปทุมธานี','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'โรงงานลูกค้า คลองหลวง',14.0655,100.6452,
     40,50,'ผ่านทางด่วนรามอินทรา','active'),

    ('c0000001-0000-0000-0000-000000000004','กรุงเทพ → ชลบุรี','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'นิคมอุตสาหกรรม อมตะนคร',13.2340,101.0000,
     120,150,'มอเตอร์เวย์ 7 - ระวังรถติดช่วงเช้า','active'),

    ('c0000001-0000-0000-0000-000000000005','กรุงเทพ → อยุธยา','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'นิคมอุตสาหกรรม ไฮเทค',14.3520,100.5686,
     85,100,'ถนนสายเอเชีย (ทล.1)','active'),

    ('c0000001-0000-0000-0000-000000000006','กรุงเทพ → สมุทรสาคร','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'โรงงานลูกค้า มหาชัย',13.5475,100.2741,
     55,70,'ผ่านพระราม 2','active'),

    ('c0000001-0000-0000-0000-000000000007','กรุงเทพ → ระยอง','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'นิคมอุตสาหกรรม มาบตาพุด',12.6800,101.1550,
     200,180,'มอเตอร์เวย์ 7 ต่อ 36','active'),

    ('c0000001-0000-0000-0000-000000000008','กรุงเทพ → นครปฐม','โรงงาน CHH (บางนา)',
     13.6700,100.6400,'ตลาดกลาง นครปฐม',13.8197,100.0620,
     65,80,'ผ่านถนนเพชรเกษม','inactive')
ON CONFLICT ("routeId") DO NOTHING;


-- 3.4 Shipments (20 รายการ - ย้อนหลัง 6 เดือน)
INSERT INTO shipments (
    "shipmentId", "shipmentNumber", "shipmentDate",
    "shipmentCustomerName", "shipmentCustomerPhone", "shipmentCustomerAddress",
    "shipmentOrigin", "shipmentDestination",
    "shipmentDestinationLat", "shipmentDestinationLng",
    "shipmentRouteId", "shipmentVehicleId", "shipmentDriverId", "shipmentAssistantId",
    "shipmentSalesOrderRef", "shipmentItemsSummary", "shipmentWeightKg",
    "shipmentStatus", "shipmentDispatchedAt", "shipmentDeliveredAt", "shipmentNotes"
) VALUES
    -- ก.ย. 2025
    ('d0000001-0000-0000-0000-000000000001','SH-2025-001','2025-09-05',
     'บริษัท สยามซีเมนต์ จำกัด','02-111-2222','123 ถ.สุขุมวิท สมุทรปราการ',
     'โรงงาน CHH','นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     'c0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000006',
     'SO-2025-0901','ท่อ PVC 4นิ้ว x200, ข้อต่อ x500',3200,
     'pod_confirmed','2025-09-05 08:30:00+07','2025-09-05 10:45:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000002','SH-2025-002','2025-09-12',
     'บริษัท ไทยพลาสติก จำกัด','02-222-3333','456 ถ.แจ้งวัฒนะ นนทบุรี',
     'โรงงาน CHH','ศูนย์กระจายสินค้า นนทบุรี',13.8621,100.5144,
     'c0000001-0000-0000-0000-000000000002',
     'a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000002',NULL,
     'SO-2025-0902','แผ่นพลาสติก PE x100, ถุง HD x2000',1800,
     'pod_confirmed','2025-09-12 07:00:00+07','2025-09-12 09:30:00+07',NULL),

    -- ต.ค. 2025
    ('d0000001-0000-0000-0000-000000000003','SH-2025-003','2025-10-03',
     'บริษัท อมตะ อิเล็กทรอนิกส์ จำกัด','038-111-222','789 นิคมอมตะนคร ชลบุรี',
     'โรงงาน CHH','นิคมอุตสาหกรรม อมตะนคร',13.2340,101.0000,
     'c0000001-0000-0000-0000-000000000004',
     'a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000007',
     'SO-2025-1001','อะไหล่เครื่องจักร x50, น็อต x10000',5500,
     'pod_confirmed','2025-10-03 06:00:00+07','2025-10-03 11:30:00+07','ส่งถึงเร็วกว่ากำหนด'),

    ('d0000001-0000-0000-0000-000000000004','SH-2025-004','2025-10-15',
     'บริษัท ไทยซัมมิท จำกัด','02-333-4444','321 ถ.รังสิต-นครนายก คลองหลวง',
     'โรงงาน CHH','โรงงานลูกค้า คลองหลวง',14.0655,100.6452,
     'c0000001-0000-0000-0000-000000000003',
     'a0000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000006',
     'SO-2025-1002','ชิ้นส่วนยานยนต์ x300',4200,
     'pod_confirmed','2025-10-15 08:00:00+07','2025-10-15 10:15:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000005','SH-2025-005','2025-10-22',
     'บริษัท เอส.พี.เมทัล จำกัด','02-444-5555','55/1 ถ.สุขุมวิท สมุทรปราการ',
     'โรงงาน CHH','นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     'c0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000002',NULL,
     'SO-2025-1003','เหล็กแผ่น x80, ท่อเหล็ก x150',6800,
     'delivered','2025-10-22 07:30:00+07','2025-10-22 09:45:00+07',NULL),

    -- พ.ย. 2025
    ('d0000001-0000-0000-0000-000000000006','SH-2025-006','2025-11-02',
     'บริษัท เจริญโภคภัณฑ์ จำกัด','02-555-6666','888 ถ.สีลม กรุงเทพ',
     'โรงงาน CHH','ศูนย์กระจายสินค้า นนทบุรี',13.8621,100.5144,
     'c0000001-0000-0000-0000-000000000002',
     'a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000007',
     'SO-2025-1101','บรรจุภัณฑ์ x5000, กล่อง x3000',2500,
     'pod_confirmed','2025-11-02 08:00:00+07','2025-11-02 10:00:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000007','SH-2025-007','2025-11-10',
     'บริษัท ไทยออยล์ จำกัด','038-222-333','999 นิคมมาบตาพุด ระยอง',
     'โรงงาน CHH','นิคมอุตสาหกรรม มาบตาพุด',12.6800,101.1550,
     'c0000001-0000-0000-0000-000000000007',
     'a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000006',
     'SO-2025-1102','วาล์วอุตสาหกรรม x200, ท่อสแตนเลส x100',7800,
     'pod_confirmed','2025-11-10 05:30:00+07','2025-11-10 10:00:00+07','ระยองต้องออกเช้า'),

    ('d0000001-0000-0000-0000-000000000008','SH-2025-008','2025-11-18',
     'บริษัท โรจนะ อุตสาหกรรม จำกัด','035-111-222','100 นิคมโรจนะ อยุธยา',
     'โรงงาน CHH','นิคมอุตสาหกรรม ไฮเทค',14.3520,100.5686,
     'c0000001-0000-0000-0000-000000000005',
     'a0000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001',NULL,
     'SO-2025-1103','แม่พิมพ์พลาสติก x20',3500,
     'pod_confirmed','2025-11-18 07:00:00+07','2025-11-18 10:30:00+07',NULL),

    -- ธ.ค. 2025
    ('d0000001-0000-0000-0000-000000000009','SH-2025-009','2025-12-05',
     'บริษัท สยามซีเมนต์ จำกัด','02-111-2222','123 ถ.สุขุมวิท สมุทรปราการ',
     'โรงงาน CHH','นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     'c0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000007',
     'SO-2025-1201','ท่อ PVC 6นิ้ว x150, ข้อต่อ x800',4100,
     'pod_confirmed','2025-12-05 08:00:00+07','2025-12-05 10:30:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000010','SH-2025-010','2025-12-12',
     'บริษัท มิตซูบิชิ อีเลคทริค จำกัด','02-666-7777','50 ถ.รามคำแหง กรุงเทพ',
     'โรงงาน CHH','โรงงานลูกค้า คลองหลวง',14.0655,100.6452,
     'c0000001-0000-0000-0000-000000000003',
     'a0000001-0000-0000-0000-000000000005','b0000001-0000-0000-0000-000000000004',NULL,
     'SO-2025-1202','อุปกรณ์ไฟฟ้า x1000',1200,
     'pod_confirmed','2025-12-12 09:00:00+07','2025-12-12 11:00:00+07','ส่งด้วยรถกระบะ'),

    ('d0000001-0000-0000-0000-000000000011','SH-2025-011','2025-12-20',
     'บริษัท ไทยพลาสติก จำกัด','02-222-3333','456 ถ.แจ้งวัฒนะ นนทบุรี',
     'โรงงาน CHH','ศูนย์กระจายสินค้า นนทบุรี',13.8621,100.5144,
     'c0000001-0000-0000-0000-000000000002',
     'a0000001-0000-0000-0000-000000000006','b0000001-0000-0000-0000-000000000001',NULL,
     'SO-2025-1203','เม็ดพลาสติก PP x50ถุง',900,
     'cancelled',NULL,NULL,'ลูกค้ายกเลิก - เลื่อนส่งเดือนหน้า'),

    -- ม.ค. 2026
    ('d0000001-0000-0000-0000-000000000012','SH-2026-001','2026-01-08',
     'บริษัท ไทยซัมมิท จำกัด','02-333-4444','321 ถ.รังสิต-นครนายก คลองหลวง',
     'โรงงาน CHH','โรงงานลูกค้า คลองหลวง',14.0655,100.6452,
     'c0000001-0000-0000-0000-000000000003',
     'a0000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000006',
     'SO-2026-0101','ชิ้นส่วนยานยนต์ x500, แหวน x2000',5100,
     'pod_confirmed','2026-01-08 07:30:00+07','2026-01-08 10:00:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000013','SH-2026-002','2026-01-15',
     'บริษัท เอส.พี.เมทัล จำกัด','02-444-5555','55/1 ถ.สุขุมวิท สมุทรปราการ',
     'โรงงาน CHH','นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     'c0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000007',
     'SO-2026-0102','เหล็กแผ่น x120, สลักเกลียว x5000',8200,
     'pod_confirmed','2026-01-15 06:30:00+07','2026-01-15 09:00:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000014','SH-2026-003','2026-01-22',
     'บริษัท เจริญโภคภัณฑ์ จำกัด','02-555-6666','888 ถ.สีลม กรุงเทพ',
     'โรงงาน CHH','โรงงานลูกค้า มหาชัย',13.5475,100.2741,
     'c0000001-0000-0000-0000-000000000006',
     'a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000003',NULL,
     'SO-2026-0103','วัตถุดิบอาหารสัตว์ x200ถุง',6000,
     'delivered','2026-01-22 07:00:00+07','2026-01-22 09:30:00+07',NULL),

    -- ก.พ. 2026
    ('d0000001-0000-0000-0000-000000000015','SH-2026-004','2026-02-03',
     'บริษัท อมตะ อิเล็กทรอนิกส์ จำกัด','038-111-222','789 นิคมอมตะนคร ชลบุรี',
     'โรงงาน CHH','นิคมอุตสาหกรรม อมตะนคร',13.2340,101.0000,
     'c0000001-0000-0000-0000-000000000004',
     'a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000007',
     'SO-2026-0201','อะไหล่เครื่องจักร x80, มอเตอร์ x5',7200,
     'delivered','2026-02-03 06:00:00+07','2026-02-03 11:00:00+07',NULL),

    ('d0000001-0000-0000-0000-000000000016','SH-2026-005','2026-02-07',
     'บริษัท สยามซีเมนต์ จำกัด','02-111-2222','123 ถ.สุขุมวิท สมุทรปราการ',
     'โรงงาน CHH','นิคมอุตสาหกรรม บางปู',13.5150,100.6670,
     'c0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000006',
     'SO-2026-0202','ข้อต่อทองเหลือง x2000, ท่อ PVC 2นิ้ว x500',2800,
     'in_transit','2026-02-07 08:00:00+07',NULL,'กำลังจัดส่ง'),

    ('d0000001-0000-0000-0000-000000000017','SH-2026-006','2026-02-10',
     'บริษัท ไทยออยล์ จำกัด','038-222-333','999 นิคมมาบตาพุด ระยอง',
     'โรงงาน CHH','นิคมอุตสาหกรรม มาบตาพุด',12.6800,101.1550,
     'c0000001-0000-0000-0000-000000000007',
     'a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000006',
     'SO-2026-0203','ปั๊มอุตสาหกรรม x10, วาล์ว x100',9500,
     'dispatched','2026-02-10 05:00:00+07',NULL,'ออกจากโรงงานแล้ว'),

    ('d0000001-0000-0000-0000-000000000018','SH-2026-007','2026-02-14',
     'บริษัท โรจนะ อุตสาหกรรม จำกัด','035-111-222','100 นิคมโรจนะ อยุธยา',
     'โรงงาน CHH','นิคมอุตสาหกรรม ไฮเทค',14.3520,100.5686,
     'c0000001-0000-0000-0000-000000000005',
     'a0000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000004',NULL,
     'SO-2026-0204','เครื่องมือวัด x50, เซ็นเซอร์ x200',1500,
     'confirmed',NULL,NULL,'รอจัดส่ง 17 ก.พ.'),

    ('d0000001-0000-0000-0000-000000000019','SH-2026-008','2026-02-16',
     'บริษัท มิตซูบิชิ อีเลคทริค จำกัด','02-666-7777','50 ถ.รามคำแหง กรุงเทพ',
     'โรงงาน CHH','โรงงานลูกค้า คลองหลวง',14.0655,100.6452,
     'c0000001-0000-0000-0000-000000000003',
     'a0000001-0000-0000-0000-000000000005','b0000001-0000-0000-0000-000000000001',NULL,
     'SO-2026-0205','ตู้ควบคุมไฟฟ้า x10',800,
     'draft',NULL,NULL,'รอยืนยันจากลูกค้า'),

    ('d0000001-0000-0000-0000-000000000020','SH-2026-009','2026-02-18',
     'บริษัท ไทยพลาสติก จำกัด','02-222-3333','456 ถ.แจ้งวัฒนะ นนทบุรี',
     'โรงงาน CHH','ศูนย์กระจายสินค้า นนทบุรี',13.8621,100.5144,
     'c0000001-0000-0000-0000-000000000002',
     NULL,NULL,NULL,
     'SO-2026-0206','เม็ดพลาสติก ABS x30ถุง, PE x20ถุง',1100,
     'draft',NULL,NULL,'ยังไม่ได้จัดรถ')
ON CONFLICT ("shipmentId") DO NOTHING;


-- 3.5 Deliveries - POD สำหรับ shipments สถานะ pod_confirmed
INSERT INTO deliveries (
    "deliveryId", "deliveryShipmentId", "deliveryReceiverName", "deliveryReceiverPhone",
    "deliveryStatus", "deliveryReceivedAt", "deliveryNotes"
) VALUES
    ('e0000001-0000-0000-0000-000000000001','d0000001-0000-0000-0000-000000000001',
     'คุณสมศักดิ์ ภักดี','089-111-2222','delivered_ok','2025-09-05 10:45:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000002','d0000001-0000-0000-0000-000000000002',
     'คุณวิไล รุ่งเรือง','089-222-3333','delivered_ok','2025-09-12 09:30:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000003','d0000001-0000-0000-0000-000000000003',
     'คุณประเสริฐ ศักดิ์สิทธิ์','089-333-4444','delivered_ok','2025-10-03 11:30:00+07','สินค้าครบ ตรวจรับแล้ว'),

    ('e0000001-0000-0000-0000-000000000004','d0000001-0000-0000-0000-000000000004',
     'คุณกนกวรรณ มีสุข','089-444-5555','delivered_ok','2025-10-15 10:15:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000006','d0000001-0000-0000-0000-000000000006',
     'คุณทวีศักดิ์ รุ่งโรจน์','089-666-7777','delivered_ok','2025-11-02 10:00:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000007','d0000001-0000-0000-0000-000000000007',
     'คุณพิมพ์ใจ นาคดี','089-777-8888','delivered_ok','2025-11-10 10:00:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000008','d0000001-0000-0000-0000-000000000008',
     'คุณวรพจน์ เจริญสุข','089-888-9999','delivered_ok','2025-11-18 10:30:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000009','d0000001-0000-0000-0000-000000000009',
     'คุณสมศักดิ์ ภักดี','089-111-2222','delivered_ok','2025-12-05 10:30:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000010','d0000001-0000-0000-0000-000000000010',
     'คุณอรพินท์ มหาชัย','089-999-0000','delivered_ok','2025-12-12 11:00:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000012','d0000001-0000-0000-0000-000000000012',
     'คุณกนกวรรณ มีสุข','089-444-5555','delivered_ok','2026-01-08 10:00:00+07',NULL),

    ('e0000001-0000-0000-0000-000000000013','d0000001-0000-0000-0000-000000000013',
     'คุณวีระ พลแสน','089-100-2000','delivered_ok','2026-01-15 09:00:00+07',NULL)
ON CONFLICT ("deliveryId") DO NOTHING;


-- 3.6 Fuel Logs (รายการเติมน้ำมัน ย้อนหลัง 3 เดือน)
INSERT INTO "fuelLogs" (
    "fuelLogId", "fuelLogVehicleId", "fuelLogDriverId",
    "fuelLogDate", "fuelLogFuelType", "fuelLogLiters",
    "fuelLogPricePerLiter", "fuelLogTotalCost", "fuelLogMileage",
    "fuelLogStation", "fuelLogNotes"
) VALUES
    ('f0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001',
     '2025-12-10','diesel',80,29.69,2375.20,84500,'ปั๊ม PTT บางนา',NULL),

    ('f0000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000002',
     '2025-12-12','diesel',70,29.69,2078.30,61800,'ปั๊ม Shell สุขุมวิท',NULL),

    ('f0000001-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003',
     '2025-12-15','diesel',120,29.69,3562.80,119800,'ปั๊ม Caltex พระราม 2',NULL),

    ('f0000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001',
     '2025-12-18','diesel',90,29.69,2672.10,30200,'ปั๊ม PTT รังสิต',NULL),

    ('f0000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001',
     '2026-01-08','diesel',75,29.89,2241.75,85100,'ปั๊ม PTT บางนา',NULL),

    ('f0000001-0000-0000-0000-000000000006','a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000002',
     '2026-01-15','diesel',65,29.89,1942.85,62100,'ปั๊ม Shell สุขุมวิท',NULL),

    ('f0000001-0000-0000-0000-000000000007','a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003',
     '2026-01-20','diesel',110,29.89,3287.90,120200,'ปั๊ม Esso บางนา-ตราด',NULL),

    ('f0000001-0000-0000-0000-000000000008','a0000001-0000-0000-0000-000000000005','b0000001-0000-0000-0000-000000000004',
     '2026-01-22','diesel',45,29.89,1345.05,28200,'ปั๊ม PTT บางนา','รถกระบะ'),

    ('f0000001-0000-0000-0000-000000000009','a0000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001',
     '2026-02-03','diesel',80,30.09,2407.20,85000,'ปั๊ม PTT บางนา',NULL),

    ('f0000001-0000-0000-0000-000000000010','a0000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003',
     '2026-02-10','diesel',130,30.09,3911.70,120400,'ปั๊ม PTT มาบตาพุด','เติมที่ระยอง'),

    ('f0000001-0000-0000-0000-000000000011','a0000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000002',
     '2026-02-12','diesel',70,30.09,2106.30,62200,'ปั๊ม Caltex ชลบุรี',NULL),

    ('f0000001-0000-0000-0000-000000000012','a0000001-0000-0000-0000-000000000006','b0000001-0000-0000-0000-000000000004',
     '2026-02-14','diesel',50,30.09,1504.50,55600,'ปั๊ม Shell พระราม 2','รถตู้')
ON CONFLICT ("fuelLogId") DO NOTHING;


-- 3.7 Maintenances (ประวัติการซ่อมบำรุง)
INSERT INTO maintenances (
    "maintenanceId", "maintenanceVehicleId", "maintenanceType",
    "maintenanceDescription", "maintenanceDate", "maintenanceCompletedDate",
    "maintenanceMileage", "maintenanceCost", "maintenanceVendor",
    "maintenanceStatus", "maintenanceNextDueDate", "maintenanceNextDueMileage",
    "maintenanceNotes"
) VALUES
    ('10000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','oil_change',
     'เปลี่ยนถ่ายน้ำมันเครื่อง + กรองน้ำมัน','2025-12-01','2025-12-01',
     84000,2500,'ศูนย์บริการ ISUZU บางนา','completed',
     '2026-03-01',94000,'ใช้น้ำมัน Castrol 15W-40 8L'),

    ('10000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000002','tire',
     'เปลี่ยนยางคู่หน้า 4 เส้น','2025-11-20','2025-11-20',
     62000,18000,'ร้านยาง พงษ์ศักดิ์ บางนา','completed',
     '2026-11-20',92000,'ยาง Bridgestone R611 295/80R22.5'),

    ('10000001-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000003','preventive',
     'ตรวจสภาพ 120,000 กม. - เปลี่ยนสายพาน+หัวเทียน','2025-10-15','2025-10-16',
     120000,8500,'ศูนย์บริการ HINO สาขาบางนา','completed',
     '2026-04-15',130000,NULL),

    ('10000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000007','repair',
     'ซ่อมระบบเบรก - เปลี่ยนผ้าเบรก+ลูกสูบเบรก','2026-02-10',NULL,
     197500,25000,'อู่ ช.เจริญยนต์ บางนา','in_progress',
     NULL,NULL,'รอชิ้นส่วน คาดว่าเสร็จ 20 ก.พ. 2026'),

    ('10000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000001','inspection',
     'ตรวจสภาพประจำปี (ต่อทะเบียน)','2026-05-01',NULL,
     NULL,3500,'กรมการขนส่งทางบก','scheduled',
     NULL,NULL,'นัด 1 พ.ค. 2026'),

    ('10000001-0000-0000-0000-000000000006','a0000001-0000-0000-0000-000000000004','oil_change',
     'เปลี่ยนถ่ายน้ำมันเครื่อง','2026-01-15','2026-01-15',
     30000,2500,'ศูนย์บริการ HINO','completed',
     '2026-04-15',40000,NULL),

    ('10000001-0000-0000-0000-000000000007','a0000001-0000-0000-0000-000000000005','preventive',
     'ตรวจสภาพทั่วไป + เปลี่ยนน้ำมันเครื่อง','2026-02-01','2026-02-01',
     28000,3200,'ศูนย์บริการ Toyota','completed',
     '2026-05-01',38000,NULL),

    ('10000001-0000-0000-0000-000000000008','a0000001-0000-0000-0000-000000000006','oil_change',
     'เปลี่ยนน้ำมันเครื่อง + กรองแอร์','2025-12-20','2025-12-20',
     55500,2800,'ศูนย์บริการ Toyota','completed',
     '2026-03-20',60500,NULL)
ON CONFLICT ("maintenanceId") DO NOTHING;


-- =====================================================
-- PART 4: OMNICHANNEL AI SETTINGS
-- =====================================================
INSERT INTO "omAiSettings" (
    "aiSystemPrompt", "aiModel", "aiTemperature",
    "aiMaxHistoryMessages", "aiBankAccountInfo"
) VALUES (
    'คุณคือผู้ช่วย AI ของบริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด (CHH) ผู้ผลิตผลิตภัณฑ์ WPC (Wood-Plastic Composite) และวัสดุก่อสร้าง

บทบาทของคุณ:
- ตอบคำถามเกี่ยวกับสินค้า ราคา และการสั่งซื้อ
- ช่วยสร้างใบเสนอราคาเบื้องต้น
- แนะนำผลิตภัณฑ์ที่เหมาะสมกับความต้องการของลูกค้า
- ส่งต่อให้ทีมขายเมื่อลูกค้าพร้อมจะสั่งซื้อ

หลักการตอบ:
- ใช้ภาษาสุภาพและเป็นมิตร
- ตอบกระชับและตรงประเด็น
- หากไม่ทราบข้อมูล ให้แจ้งว่าจะประสานงานกับทีมขาย
- ไม่เปิดเผยข้อมูลภายในบริษัท',
    'moonshotai/kimi-k2.5',
    0.3,
    20,
    ''
);
