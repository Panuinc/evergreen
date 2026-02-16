-- =====================================================
-- Migration: CHH Organization Structure Data
-- บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด
-- รันใน Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Clear existing dummy data
-- =====================================================
TRUNCATE employees, positions, departments CASCADE;

-- =====================================================
-- 2. Departments (7 ฝ่าย)
-- =====================================================
INSERT INTO departments ("departmentName", "departmentDescription") VALUES
    ('Executive Office',  'สำนักกรรมการผู้จัดการ'),
    ('Marketing',         'ฝ่ายการตลาด'),
    ('Sales',             'ฝ่ายขาย'),
    ('Production',        'ฝ่ายผลิต'),
    ('IT',                'ฝ่าย IT'),
    ('HR',                'ฝ่ายบุคคล'),
    ('Accounting',        'ฝ่ายบัญชี');

-- =====================================================
-- 3. Positions (~35 ตำแหน่ง พร้อม positionDepartment)
-- =====================================================

-- Executive Office
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Managing Director',       'กรรมการผู้จัดการ',       'Executive Office'),
    ('Assistant MD',            'ผู้ช่วยกรรมการผู้จัดการ', 'Executive Office');

-- Marketing
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Marketing Manager',           'ผจก.Marketing',               'Marketing'),
    ('Digital Marketing Specialist','Digital Mkt. Content Creator', 'Marketing'),
    ('Graphic Designer',            'Graphic Designer',             'Marketing');

-- Sales
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Sales Director',              'ผอ.ฝ่ายขาย',                   'Sales'),
    ('Project Sales Manager',       'ผจก.ฝ่ายขายโครงการ',           'Sales'),
    ('Dealer Sales Manager',        'ผจก.ฝ่ายขาย Dealer',           'Sales'),
    ('Sales Specialist',            'Sale Spec',                     'Sales'),
    ('Sales Representative',        'Sale',                          'Sales'),
    ('Sales Admin Officer',         'จนท.ธุรการฝ่ายขาย',            'Sales');

-- Production
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Factory Manager',                     'ผจก.โรงงาน',                          'Production'),
    ('Assistant Factory Manager',           'ผช.ผจก.โรงงาน',                       'Production'),
    ('Project Planning Supervisor',         'หน.แผนกวางแผน Project',               'Production'),
    ('Warehouse Supervisor',                'หน.แผนกคลังสินค้า RM/FG',             'Production'),
    ('Logistics Supervisor',                'หน.แผนกขนส่ง',                        'Production'),
    ('Design & CNC Supervisor',             'หน.แผนกแบบ/CNC',                      'Production'),
    ('Production Supervisor',               'หน.แผนกผลิต',                         'Production'),
    ('Painting Supervisor',                 'หน.แผนกพ่นสี',                        'Production'),
    ('QC Supervisor',                       'หน.แผนกตรวจสอบคุณภาพ',                'Production'),
    ('Grading & Packing Supervisor',        'หน.แผนกคัดเกรด/Packing',              'Production'),
    ('WPC Production Supervisor',           'หน.แผนกผลิต WPC',                     'Production'),
    ('Maintenance Supervisor',              'หน.แผนกซ่อมบำรุง',                    'Production'),
    ('Assistant Production Supervisor',     'ผช.หัวหน้าแผนกผลิต',                  'Production'),
    ('Production Coordinator',              'จนท.ประสานงานฝ่ายผลิต/จัดส่ง',        'Production'),
    ('Procurement Officer',                 'จนท.จัดซื้อ',                         'Production'),
    ('Warehouse Officer',                   'จนท.คลังสินค้า RM/FG',                'Production'),
    ('Production Admin Officer',            'จนท.ธุรการผลิต',                      'Production'),
    ('CAD Operator',                        'จนท.เขียนแบบ',                        'Production'),
    ('Painting Unit Leader',                'หัวหน้าหน่วยพ่นสี',                   'Production'),
    ('WPC Shift Leader',                    'หัวหน้ากะ WPC',                        'Production'),
    ('Forklift Operator',                   'พนง.ขับรถโฟล์คลิฟท์',                 'Production'),
    ('Truck Driver',                        'พนง.ขับรถ',                           'Production'),
    ('Truck Assistant',                     'พนง.เด็กรถ',                          'Production'),
    ('CNC Operator',                        'พนง.CNC',                             'Production'),
    ('Production Worker',                   'พนง.ผลิต',                            'Production'),
    ('Painter',                             'พนง.พ่นสี',                           'Production'),
    ('QC Inspector',                        'พนง.QC',                              'Production'),
    ('Grading & Packing Worker',            'พนง.คัดเกรด/Packing',                 'Production'),
    ('WPC Production Worker',               'พนง.ผลิต WPC',                        'Production'),
    ('Door Frame Assembler',                'พนง.ประกอบวงกบ',                      'Production'),
    ('Maintenance Technician',              'ช่างซ่อมบำรุง',                       'Production'),
    ('Outsourced Technician',               'ช่างเหมา',                            'Production');

-- IT
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Programmer',  'Programmer', 'IT');

-- HR
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('HR Manager',          'ผจก.ฝ่ายบุคคล',       'HR'),
    ('HR Officer',          'จนท.ฝ่ายบุคคล',       'HR'),
    ('Housekeeper',         'พนง.แม่บ้าน',         'HR');

-- Accounting
INSERT INTO positions ("positionTitle", "positionDescription", "positionDepartment") VALUES
    ('Accounting Manager',      'ผจก.ฝ่ายบัญชี',       'Accounting'),
    ('Accounts Receivable',     'จนท.บัญชีรับ',        'Accounting'),
    ('Accounts Payable',        'จนท.บัญชีจ่าย',       'Accounting');
