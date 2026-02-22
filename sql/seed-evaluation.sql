-- Seed Data: CHH² Core Values Evaluation
-- รองรับ auth.users 1-3 คน — ถ้ามีคนเดียวก็ใช้ได้

DO $$
DECLARE
  user_a UUID;
  user_b UUID;
  user_c UUID;
  emp_a  UUID;
  emp_b  UUID;
  emp_c  UUID;
BEGIN
  -- Step 1: ดึง auth.users (ต้องมีอย่างน้อย 1)
  SELECT id INTO user_a FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF user_a IS NULL THEN
    RAISE NOTICE 'No auth.users found — please create at least 1 account first';
    RETURN;
  END IF;

  SELECT id INTO user_b FROM auth.users WHERE id != user_a ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO user_c FROM auth.users WHERE id NOT IN (user_a, COALESCE(user_b, user_a)) ORDER BY created_at ASC LIMIT 1;

  RAISE NOTICE 'Users: a=%, b=%, c=%', user_a, user_b, user_c;

  -- Step 2: ลบ seed data เก่า
  DELETE FROM evaluations WHERE period IN ('Q1-2025', 'Q2-2025');
  DELETE FROM employees WHERE "employeeEmail" IN ('somchai@chh.co.th', 'somying@chh.co.th', 'somsak@chh.co.th');

  -- Step 3: สร้าง 3 employees (link userId เฉพาะคนที่มี user ว่าง)
  INSERT INTO employees ("employeeFirstName", "employeeLastName", "employeeEmail", "employeePhone", "employeeDivision", "employeeDepartment", "employeePosition", "employeeStatus", "employeeUserId")
  VALUES ('สมชาย', 'ใจดี', 'somchai@chh.co.th', '081-111-1111', 'ฝ่ายผลิต', 'แผนกผลิต', 'หัวหน้าแผนก', 'active', user_a)
  RETURNING "employeeId" INTO emp_a;

  INSERT INTO employees ("employeeFirstName", "employeeLastName", "employeeEmail", "employeePhone", "employeeDivision", "employeeDepartment", "employeePosition", "employeeStatus", "employeeUserId")
  VALUES ('สมหญิง', 'รักงาน', 'somying@chh.co.th', '081-222-2222', 'ฝ่ายขาย', 'แผนกขาย', 'พนักงานขาย', 'active', user_b)
  RETURNING "employeeId" INTO emp_b;

  INSERT INTO employees ("employeeFirstName", "employeeLastName", "employeeEmail", "employeePhone", "employeeDivision", "employeeDepartment", "employeePosition", "employeeStatus", "employeeUserId")
  VALUES ('สมศักดิ์', 'ตั้งใจ', 'somsak@chh.co.th', '081-333-3333', 'ฝ่าย IT', 'แผนก IT', 'โปรแกรมเมอร์', 'active', user_c)
  RETURNING "employeeId" INTO emp_c;

  RAISE NOTICE 'Employees: a=%, b=%, c=%', emp_a, emp_b, emp_c;

  -- Step 4: Seed evaluations
  -- user_a ประเมิน emp_b (Q1) — คะแนนดีมาก
  INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
  VALUES (user_a, emp_b, 'Q1-2025', 2025, 1,
    '{"customerCentric": [5, 5, 5, 4, 5], "heartwork": [5, 5, 5, 5, 4], "happyWorkplace": [5, 5, 4, 5, 5], "collaboration": [5, 5, 5, 4, 5], "honestIntegrity": [5, 5, 5, 5, 5], "humble": [5, 4, 5, 5, 5]}',
    '{"customerCentric": 4.8, "heartwork": 4.8, "happyWorkplace": 4.8, "collaboration": 4.8, "honestIntegrity": 5.0, "humble": 4.8}',
    4.83, 'A+');

  -- user_a ประเมิน emp_b (Q2) — ยังดีอยู่
  INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
  VALUES (user_a, emp_b, 'Q2-2025', 2025, 2,
    '{"customerCentric": [4, 5, 4, 5, 5], "heartwork": [5, 4, 5, 4, 5], "happyWorkplace": [4, 5, 5, 4, 4], "collaboration": [5, 4, 5, 5, 4], "honestIntegrity": [5, 4, 5, 5, 4], "humble": [4, 5, 4, 4, 5]}',
    '{"customerCentric": 4.6, "heartwork": 4.6, "happyWorkplace": 4.4, "collaboration": 4.6, "honestIntegrity": 4.6, "humble": 4.4}',
    4.53, 'A+');

  -- user_a ประเมิน emp_c (Q1) — คะแนนต้องปรับปรุง
  INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
  VALUES (user_a, emp_c, 'Q1-2025', 2025, 1,
    '{"customerCentric": [2, 3, 2, 2, 3], "heartwork": [3, 2, 2, 3, 2], "happyWorkplace": [2, 2, 3, 2, 2], "collaboration": [2, 2, 2, 3, 2], "honestIntegrity": [3, 3, 2, 2, 2], "humble": [2, 2, 2, 3, 2]}',
    '{"customerCentric": 2.4, "heartwork": 2.4, "happyWorkplace": 2.2, "collaboration": 2.2, "honestIntegrity": 2.4, "humble": 2.2}',
    2.30, 'C');

  -- user_a ประเมิน emp_c (Q2) — ดีขึ้นเล็กน้อย
  INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
  VALUES (user_a, emp_c, 'Q2-2025', 2025, 2,
    '{"customerCentric": [3, 3, 3, 3, 3], "heartwork": [3, 3, 3, 3, 3], "happyWorkplace": [3, 3, 3, 3, 2], "collaboration": [3, 3, 2, 3, 3], "honestIntegrity": [3, 3, 3, 3, 3], "humble": [3, 3, 3, 3, 3]}',
    '{"customerCentric": 3.0, "heartwork": 3.0, "happyWorkplace": 2.8, "collaboration": 2.8, "honestIntegrity": 3.0, "humble": 3.0}',
    2.93, 'B');

  -- ถ้ามี user_b — เพิ่ม evaluations จาก user_b
  IF user_b IS NOT NULL THEN
    INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
    VALUES (user_b, emp_a, 'Q1-2025', 2025, 1,
      '{"customerCentric": [4, 5, 4, 4, 5], "heartwork": [5, 4, 4, 5, 4], "happyWorkplace": [4, 4, 5, 4, 4], "collaboration": [5, 4, 4, 5, 4], "honestIntegrity": [4, 5, 5, 4, 4], "humble": [4, 4, 4, 5, 4]}',
      '{"customerCentric": 4.4, "heartwork": 4.4, "happyWorkplace": 4.2, "collaboration": 4.4, "honestIntegrity": 4.4, "humble": 4.2}',
      4.33, 'A');

    INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
    VALUES (user_b, emp_a, 'Q2-2025', 2025, 2,
      '{"customerCentric": [5, 5, 4, 5, 5], "heartwork": [5, 5, 4, 5, 5], "happyWorkplace": [5, 4, 5, 5, 4], "collaboration": [5, 5, 5, 5, 4], "honestIntegrity": [5, 5, 5, 4, 5], "humble": [4, 5, 4, 5, 5]}',
      '{"customerCentric": 4.8, "heartwork": 4.8, "happyWorkplace": 4.6, "collaboration": 4.8, "honestIntegrity": 4.8, "humble": 4.6}',
      4.73, 'A+');

    INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
    VALUES (user_b, emp_c, 'Q1-2025', 2025, 1,
      '{"customerCentric": [3, 3, 2, 3, 3], "heartwork": [3, 3, 3, 2, 3], "happyWorkplace": [3, 2, 3, 3, 2], "collaboration": [3, 3, 2, 3, 2], "honestIntegrity": [3, 3, 3, 2, 3], "humble": [2, 3, 3, 3, 2]}',
      '{"customerCentric": 2.8, "heartwork": 2.8, "happyWorkplace": 2.6, "collaboration": 2.6, "honestIntegrity": 2.8, "humble": 2.6}',
      2.70, 'C+');
  END IF;

  -- ถ้ามี user_c — เพิ่มอีก
  IF user_c IS NOT NULL THEN
    INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
    VALUES (user_c, emp_a, 'Q1-2025', 2025, 1,
      '{"customerCentric": [3, 4, 3, 4, 3], "heartwork": [4, 3, 3, 4, 3], "happyWorkplace": [3, 3, 4, 3, 3], "collaboration": [4, 3, 3, 4, 3], "honestIntegrity": [3, 4, 4, 3, 3], "humble": [3, 3, 3, 4, 3]}',
      '{"customerCentric": 3.4, "heartwork": 3.4, "happyWorkplace": 3.2, "collaboration": 3.4, "honestIntegrity": 3.4, "humble": 3.2}',
      3.33, 'B');

    INSERT INTO evaluations ("evaluatorId", "evaluateeEmployeeId", period, year, quarter, scores, "categoryAverages", "overallScore", grade)
    VALUES (user_c, emp_b, 'Q1-2025', 2025, 1,
      '{"customerCentric": [4, 4, 5, 4, 4], "heartwork": [4, 4, 4, 4, 4], "happyWorkplace": [4, 5, 4, 4, 4], "collaboration": [4, 4, 4, 4, 5], "honestIntegrity": [5, 4, 4, 4, 4], "humble": [4, 4, 4, 4, 4]}',
      '{"customerCentric": 4.2, "heartwork": 4.0, "happyWorkplace": 4.2, "collaboration": 4.2, "honestIntegrity": 4.2, "humble": 4.0}',
      4.13, 'A');
  END IF;

  RAISE NOTICE '=== Seed Complete ===';
  RAISE NOTICE 'สมชาย (emp_a): linked to user_a — login แล้วเห็นผลประเมินของตัวเอง';
  RAISE NOTICE 'สมหญิง (emp_b): Q1=4.83(A+), Q2=4.53(A+)';
  RAISE NOTICE 'สมศักดิ์ (emp_c): Q1=2.30(C), Q2=2.93(B)';
END $$;
