-- =====================================================
-- SEED: HR + RBAC
-- บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด
-- ข้อมูลจาก staff_thai_standard.xlsx
-- รัน Supabase SQL Editor
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
    ('logistics',   'logistics',   'Logistics'),
    ('warehouse',   'warehouse',   'Warehouse'),
    ('legal',       'legal',       'Legal & Compliance'),
    ('rbac',        'rbac',        'Access Control')
ON CONFLICT ("resourceName") DO NOTHING;

-- 1.3 Roles
INSERT INTO roles ("roleName", "roleDescription", "roleIsSuperadmin") VALUES
    ('superadmin',         'Super Administrator - Full access to all modules', true),
    ('HR Manager',         'Full access to Human Resources module',            false),
    ('HR Staff',           'View and update HR data',                          false),
    ('IT Admin',           'Full access to IT and Access Control modules',     false),
    ('Finance Manager',    'Full access to Finance & Accounting module',       false),
    ('Sales Manager',      'Full access to Sales module',                      false),
    ('Operations Manager', 'Full access to Operations module',                 false),
    ('Employee',           'Basic access - view overview and own data',        false),
    ('Viewer',             'Read-only access to all modules',                  false)
ON CONFLICT ("roleName") DO NOTHING;

-- 1.4 Permissions (cross join resources × actions)
INSERT INTO permissions ("permissionResourceId", "permissionActionId")
SELECT r."resourceId", a."actionId"
FROM resources r
CROSS JOIN actions a
ON CONFLICT ("permissionResourceId", "permissionActionId") DO NOTHING;

-- 1.5 Role Permissions

-- superadmin → all
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

-- HR Staff → hr:read + hr:update + overview:read
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

-- Operations Manager → operations:* + logistics:* + warehouse:* + production:* + overview:read
INSERT INTO "rolePermissions" ("rolePermissionRoleId", "rolePermissionPermissionId")
SELECT (SELECT "roleId" FROM roles WHERE "roleName" = 'Operations Manager'), p."permissionId"
FROM permissions p
JOIN resources r ON r."resourceId" = p."permissionResourceId"
JOIN actions   a ON a."actionId"   = p."permissionActionId"
WHERE r."resourceName" IN ('operations','logistics','warehouse','production')
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
-- PART 2: DEPARTMENTS (12 แผนก)
-- =====================================================
INSERT INTO departments ("departmentName", "departmentDescription") VALUES
    ('ผู้บริหาร',                           'ทีมผู้บริหารระดับสูงของบริษัท'),
    ('ฝ่ายการเงินและบัญชี',                'ดูแลการเงิน บัญชี และงบประมาณ'),
    ('ฝ่ายการตลาด',                        'ดูแลการตลาด Digital Marketing และ Social Media'),
    ('ฝ่ายวิศวกรรม (CAD/CNC)',            'ออกแบบและผลิตงาน CAD/CNC'),
    ('ฝ่ายทรัพยากรบุคคล',                 'บริหารบุคลากรและสวัสดิการ'),
    ('ฝ่ายเทคโนโลยีสารสนเทศ',            'ดูแลระบบ IT โครงสร้างพื้นฐาน และซอฟต์แวร์'),
    ('ฝ่ายซ่อมบำรุง',                      'ซ่อมบำรุงเครื่องจักรและอุปกรณ์'),
    ('ฝ่ายผลิต',                           'ดำเนินการผลิตสินค้า WPC และผลิตภัณฑ์อื่นๆ'),
    ('ฝ่ายจัดซื้อ',                        'จัดซื้อวัตถุดิบและสินค้า'),
    ('ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',    'ควบคุมคุณภาพและการบรรจุภัณฑ์'),
    ('ฝ่ายขาย',                            'บริหารการขายและความสัมพันธ์ลูกค้า'),
    ('ฝ่ายคลังสินค้าและโลจิสติกส์',       'ดูแลคลังสินค้าและการจัดส่ง')
ON CONFLICT ("departmentName") DO NOTHING;


-- =====================================================
-- PART 3: POSITIONS (32 ตำแหน่ง)
-- =====================================================
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    -- ผู้บริหาร
    ('กรรมการผู้จัดการ',                                   'Managing Director',                           'ผู้บริหาร'),
    -- ฝ่ายการเงินและบัญชี
    ('ผู้จัดการฝ่ายการเงินและบัญชี',                      'Accounting and Finance Manager',              'ฝ่ายการเงินและบัญชี'),
    ('เจ้าหน้าที่การเงินและบัญชี',                        'Accounting and Finance Officer',              'ฝ่ายการเงินและบัญชี'),
    -- ฝ่ายการตลาด
    ('ผู้จัดการฝ่ายการตลาด',                              'Digital Marketing Manager',                   'ฝ่ายการตลาด'),
    ('เจ้าหน้าที่การตลาด',                                'Marketing Officer',                           'ฝ่ายการตลาด'),
    -- ฝ่ายวิศวกรรม (CAD/CNC)
    ('หัวหน้างาน CAD/CNC',                                'Drawing and CNC Supervisor',                  'ฝ่ายวิศวกรรม (CAD/CNC)'),
    ('เจ้าหน้าที่ CAD/CNC',                               'Drawing and CNC Officer',                     'ฝ่ายวิศวกรรม (CAD/CNC)'),
    ('ช่างเทคนิค CAD/CNC',                                'Drawing and CNC Staff',                       'ฝ่ายวิศวกรรม (CAD/CNC)'),
    -- ฝ่ายทรัพยากรบุคคล
    ('เจ้าหน้าที่ทรัพยากรบุคคล',                         'Human Resources Officer',                     'ฝ่ายทรัพยากรบุคคล'),
    ('ผู้ช่วยฝ่ายทรัพยากรบุคคล',                         'Human Resources Staff',                       'ฝ่ายทรัพยากรบุคคล'),
    -- ฝ่ายเทคโนโลยีสารสนเทศ
    ('เจ้าหน้าที่เทคโนโลยีสารสนเทศ',                     'Information Technology Officer',              'ฝ่ายเทคโนโลยีสารสนเทศ'),
    -- ฝ่ายซ่อมบำรุง
    ('หัวหน้างานซ่อมบำรุง',                               'Maintenance Supervisor',                      'ฝ่ายซ่อมบำรุง'),
    -- ฝ่ายผลิต
    ('ผู้จัดการฝ่ายผลิต',                                 'Production Manager',                          'ฝ่ายผลิต'),
    ('ผู้ช่วยผู้จัดการฝ่ายผลิต',                          'Assistant Production Manager',                'ฝ่ายผลิต'),
    ('ผู้ช่วยหัวหน้างานผลิต',                             'Assistant Production Supervisor',             'ฝ่ายผลิต'),
    ('หัวหน้ากลุ่มงานผลิต',                               'Production Supervisor Leader',                'ฝ่ายผลิต'),
    ('หัวหน้ากะผลิต WPC',                                 'Production WPC Shift Supervisor',             'ฝ่ายผลิต'),
    ('หัวหน้ากลุ่มงานพ่นสี',                              'Production Spray Painting Leader',            'ฝ่ายผลิต'),
    ('เจ้าหน้าที่ธุรการฝ่ายผลิต',                        'Production Administrative Officer',           'ฝ่ายผลิต'),
    ('พนักงานผลิต WPC',                                   'Production WPC Staff',                        'ฝ่ายผลิต'),
    ('พนักงานผลิต',                                       'Production Staff',                            'ฝ่ายผลิต'),
    ('พนักงานพ่นสี',                                      'Production Spray Painting Staff',             'ฝ่ายผลิต'),
    -- ฝ่ายจัดซื้อ
    ('เจ้าหน้าที่จัดซื้อ',                                'Purchasing Officer',                          'ฝ่ายจัดซื้อ'),
    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์
    ('หัวหน้างานควบคุมคุณภาพและบรรจุภัณฑ์',              'Quality and Packing Supervisor',              'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    ('หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์',        'Quality and Packing Leader',                  'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    ('พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',                 'Quality and Packing Staff',                   'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์'),
    -- ฝ่ายขาย
    ('ผู้จัดการฝ่ายขาย',                                  'Sales Manager',                               'ฝ่ายขาย'),
    ('เจ้าหน้าที่ขาย',                                    'Sales Officer',                               'ฝ่ายขาย'),
    ('เจ้าหน้าที่ธุรการฝ่ายขาย',                         'Sales Administrative Officer',                'ฝ่ายขาย'),
    ('ผู้ประสานงานฝ่ายขาย',                               'Sales Coordinator',                           'ฝ่ายขาย'),
    -- ฝ่ายคลังสินค้าและโลจิสติกส์
    ('หัวหน้างานคลังสินค้าและโลจิสติกส์',                'Warehouse and Logistics Supervisor',          'ฝ่ายคลังสินค้าและโลจิสติกส์'),
    ('พนักงานคลังสินค้าและโลจิสติกส์',                   'Warehouse and Logistics Staff',               'ฝ่ายคลังสินค้าและโลจิสติกส์')
ON CONFLICT ("positionTitle") DO NOTHING;


-- =====================================================
-- PART 4: EMPLOYEES (86 คน จาก staff_thai_standard.xlsx)
-- หมายเหตุ: พนักงานที่ไม่มี Email (รายวัน) ใส่ NULL
-- ON CONFLICT จับที่ employeeEmail (NULL ไม่นับว่า conflict)
-- =====================================================
INSERT INTO employees (
    "employeeFirstName", "employeeLastName", "employeeEmail",
    "employeeDepartment", "employeePosition", "employeeStatus"
) VALUES
    -- ผู้บริหาร
    ('จงคม',       'ชูชัยศรี',           'jongkhom.c@chhindustry.com',            'ผู้บริหาร',                        'กรรมการผู้จัดการ',                         'active'),

    -- ฝ่ายการเงินและบัญชี
    ('ไพโรจน์',    'พรมจีน',             'phairote.p@chhindustry.com',            'ฝ่ายการเงินและบัญชี',              'ผู้จัดการฝ่ายการเงินและบัญชี',            'active'),
    ('ภาวิตา',     'คุ้มด้วง',           'pavita.a@chhindustry.com',              'ฝ่ายการเงินและบัญชี',              'เจ้าหน้าที่การเงินและบัญชี',              'active'),
    ('พรพิมล',     'ดาวลอย',             'pornpimol.d@chhindustry.com',           'ฝ่ายการเงินและบัญชี',              'เจ้าหน้าที่การเงินและบัญชี',              'active'),

    -- ฝ่ายการตลาด
    ('ภัทรชนน',   'จันทะ',               'phattharachanon.c@chhindustry.com',     'ฝ่ายการตลาด',                      'ผู้จัดการฝ่ายการตลาด',                    'active'),
    ('อาชวิน',    'วาณิชวัฒนะสกุล',      'adam.a@chhindustry.com',                'ฝ่ายการตลาด',                      'เจ้าหน้าที่การตลาด',                      'active'),
    ('ชนากานต์',  'ศิริแส',              'chanakan.s@chhindustry.com',            'ฝ่ายการตลาด',                      'เจ้าหน้าที่การตลาด',                      'active'),
    ('ธมลวรรณ',   'ษัษฐชาคร',           'tamonwan.s@chhindustry.com',            'ฝ่ายการตลาด',                      'เจ้าหน้าที่การตลาด',                      'active'),

    -- ฝ่ายวิศวกรรม (CAD/CNC)
    ('สุทัศน์',   'ใจเอี่ยม',            'sutad.j@chhindustry.com',               'ฝ่ายวิศวกรรม (CAD/CNC)',            'หัวหน้างาน CAD/CNC',                      'active'),
    ('รัฐศาสตร์', 'แสงสุวรรณ์',          'ratthasat.s@chhindustry.com',           'ฝ่ายวิศวกรรม (CAD/CNC)',            'เจ้าหน้าที่ CAD/CNC',                     'active'),
    ('Soe',        'Khaing',              NULL,                                     'ฝ่ายวิศวกรรม (CAD/CNC)',            'ช่างเทคนิค CAD/CNC',                      'active'),
    ('Aung',       'Thu',                 NULL,                                     'ฝ่ายวิศวกรรม (CAD/CNC)',            'ช่างเทคนิค CAD/CNC',                      'active'),

    -- ฝ่ายทรัพยากรบุคคล
    ('สุเมธ',     'นุ่มทอง',             'sumeth.n@chhindustry.com',              'ฝ่ายทรัพยากรบุคคล',                'เจ้าหน้าที่ทรัพยากรบุคคล',               'active'),
    ('นันทา',     'นิ่มนวล',             NULL,                                     'ฝ่ายทรัพยากรบุคคล',                'ผู้ช่วยฝ่ายทรัพยากรบุคคล',               'active'),

    -- ฝ่ายเทคโนโลยีสารสนเทศ
    ('ปาณัสม์',   'เตียวนะ',             'panut.t@chhindustry.com',               'ฝ่ายเทคโนโลยีสารสนเทศ',            'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',           'active'),
    ('ภาณุวัต',   'แจ้งชัดใจ',           'panuwat.j@chhindustry.com',             'ฝ่ายเทคโนโลยีสารสนเทศ',            'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',           'active'),
    ('วิภวา',     'จันทร์แสงวัฒนา',      'wipawa.c@chhindustry.com',              'ฝ่ายเทคโนโลยีสารสนเทศ',            'เจ้าหน้าที่เทคโนโลยีสารสนเทศ',           'active'),

    -- ฝ่ายซ่อมบำรุง
    ('ขวัญชัย',   'กลิ่นประทุม',         'kwanchai.k@chhindustry.com',            'ฝ่ายซ่อมบำรุง',                    'หัวหน้างานซ่อมบำรุง',                     'active'),

    -- ฝ่ายผลิต - ผู้บริหาร/หัวหน้า
    ('วชิรศักดิ์', 'พึ่งอัน',            'wachirasak.p@chhindustry.com',          'ฝ่ายผลิต',                          'ผู้จัดการฝ่ายผลิต',                       'active'),
    ('กันตพัฒน์', 'ตรีพิริยะมงคล',       'guntaphat.t@chhindustry.com',           'ฝ่ายผลิต',                          'ผู้ช่วยผู้จัดการฝ่ายผลิต',                'active'),
    ('อมรเทพ',    'นพศรี',               'amorntep.n@chhindustry.com',            'ฝ่ายผลิต',                          'ผู้ช่วยหัวหน้างานผลิต',                   'active'),
    ('พัชรี',     'สุขพลอย',             'phatcharee.s@chhindustry.com',          'ฝ่ายผลิต',                          'เจ้าหน้าที่ธุรการฝ่ายผลิต',              'active'),
    ('สมพร',      'เรืองศรี',            'somporn20021970@gmail.com',             'ฝ่ายผลิต',                          'หัวหน้ากลุ่มงานผลิต',                     'active'),

    -- ฝ่ายผลิต - หัวหน้ากะ WPC
    ('Tin',        'Tun',                 NULL,                                     'ฝ่ายผลิต',                          'หัวหน้ากะผลิต WPC',                       'active'),
    ('Soe',        'Win',                 NULL,                                     'ฝ่ายผลิต',                          'หัวหน้ากะผลิต WPC',                       'active'),

    -- ฝ่ายผลิต - หัวหน้าพ่นสี
    ('พยุง',      'ขาวกลาง',             NULL,                                     'ฝ่ายผลิต',                          'หัวหน้ากลุ่มงานพ่นสี',                    'active'),

    -- ฝ่ายผลิต - พนักงานผลิต WPC
    ('Nน',         'Zin Tun',             NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('เซียง',     'โก อู',               NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('Aung',       'Htet Oo',             NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('หลิน',      'ไม่มีนามสกุล',        NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('Yin',        'Maung Htay',          NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('Aung',       'Phyo Lin Htet',       NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('Min',        'Ko Ko',               NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),
    ('Phyo',       'Chit Aung',           NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต WPC',                         'active'),

    -- ฝ่ายผลิต - พนักงานผลิต (general)
    ('Aung',       'Kyaw Kyow',           NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Zaw',        'Zaw',                 NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Sai',        'Kyaw Zin',            NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Kaung',      'Myat Maung',          NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Nay',        'Lin Tun',             NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Mi',         'Mi Wi',               NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Nay',        'Lin Oo',              NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Zaw',        'Htet Aung',           NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Shin',       'Min Tun',             NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Saw',        'Htay',                NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Phyo',       'Thet Paing',          NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Zaw',        'Hlaing Oo',           NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Htay',       'Htay Win',            NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Thay',       'Seu Seu',             NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Moa',        'Ko Oo',               NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Lin',        'Lin',                 NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),
    ('Si',         'Thu Phyo',            NULL,                                     'ฝ่ายผลิต',                          'พนักงานผลิต',                              'active'),

    -- ฝ่ายผลิต - พนักงานพ่นสี
    ('Thein',      'Zaw',                 NULL,                                     'ฝ่ายผลิต',                          'พนักงานพ่นสี',                             'active'),
    ('Yin',        'Mar Aung',            NULL,                                     'ฝ่ายผลิต',                          'พนักงานพ่นสี',                             'active'),
    ('Mee',        'Zaw Htay',            NULL,                                     'ฝ่ายผลิต',                          'พนักงานพ่นสี',                             'active'),

    -- ฝ่ายจัดซื้อ
    ('เพลินตา',   'วงศ์ประเสริฐ',        'plearnta.w@chhindustry.com',            'ฝ่ายจัดซื้อ',                      'เจ้าหน้าที่จัดซื้อ',                      'active'),

    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์ - หัวหน้า
    ('พีระยุทธ',  'หม่องวิลัย',          'peerayut.m@chhindustry.com',            'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'หัวหน้างานควบคุมคุณภาพและบรรจุภัณฑ์',  'active'),
    ('Aye',        'Thidar San',          NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์', 'active'),
    ('เหมรัศมิ์', 'วงศ์โพธิ์',           'moment.ta.2409@gmail.com',              'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'หัวหน้ากลุ่มงานควบคุมคุณภาพและบรรจุภัณฑ์', 'active'),

    -- ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์ - พนักงาน
    ('สมหมาย',    'บัวแย้ม',             NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('ไค',         'วิน ไม่มีนามสกุล',   NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('สุเตียน',   'ไม่มีนามสกุล',        NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('Ma',         'Mon',                 NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('Ni',         'Ni Win',              NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('Zin',        'Min Hlaing',          NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('Zar',        'Zi Ho',               NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('Hnin',       'Thwe Aye',            NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),
    ('มาลี',      'เทศแก้ว',             NULL,                                     'ฝ่ายควบคุมคุณภาพและบรรจุภัณฑ์',  'พนักงานควบคุมคุณภาพและบรรจุภัณฑ์',      'active'),

    -- ฝ่ายขาย
    ('นวพล',      'ชูเกียรติ',           'nawapol.c@chhindustry.com',             'ฝ่ายขาย',                          'ผู้จัดการฝ่ายขาย',                        'active'),
    ('พิชฌาภา',  'วัดอิ่ม',             'pitchapa.w@chhindustry.com',            'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('ดวงมณี',   'ตั้งสุขศรี',           'duangmanee.t@chhindustry.com',          'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('ปิยะพงศ์', 'วรรณภาพรรณ์',         'piyapong.w@chhindustry.com',            'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('รัชพล',    'สังขวรรณ',            'ratchapol.s@chhindustry.com',           'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('มัทนา',    'บานเย็น',             'muttana.b@chhindustry.com',             'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('เกสรา',    'ภัทรนวงษ์',           'gassara.p@chhindustry.com',             'ฝ่ายขาย',                          'เจ้าหน้าที่ขาย',                          'active'),
    ('อรวรรณ',   'อมรปิยะกิจ',          'orawan.a@chhindustry.com',              'ฝ่ายขาย',                          'เจ้าหน้าที่ธุรการฝ่ายขาย',               'active'),
    ('ธีรชัย',   'เมฆแก้ว',             'theerachai.mekkaew@chhindustry.com',    'ฝ่ายขาย',                          'ผู้ประสานงานฝ่ายขาย',                     'active'),

    -- ฝ่ายคลังสินค้าและโลจิสติกส์
    ('จตุพร',    'ทองงาม',              'jatuporn.t@chhindustry.com',            'ฝ่ายคลังสินค้าและโลจิสติกส์',     'หัวหน้างานคลังสินค้าและโลจิสติกส์',     'active'),
    ('นลธวัช',   'พรหมยิ้มแย้ม',        NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('Aung',      'Zaw Tun',             NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('ธรรมนูญ',  'ไชยแก้ว',             NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('Naing',     'Zaw Oo',              NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('Than',      'Htike Aung',          NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('อนุสรณ์',  'ยิ้มดี',              NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('Min',       'Khant Kyaw',          NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('Kyaw',      'Kyaw Htwe',           NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active'),
    ('ปาน',      'ออระอ่อน',            NULL,                                     'ฝ่ายคลังสินค้าและโลจิสติกส์',     'พนักงานคลังสินค้าและโลจิสติกส์',         'active')

ON CONFLICT ("employeeEmail") DO NOTHING;
