import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const [employeesRes, divisionsRes, departmentsRes, positionsRes] =
    await Promise.all([
      supabase
        .from("hrEmployee")
        .select(
          "hrEmployeeId, hrEmployeeDivision, hrEmployeeDepartment, hrEmployeePosition, hrEmployeeStatus, hrEmployeeCreatedAt",
        )
        .eq("isActive", true),
      supabase
        .from("hrDivision")
        .select("hrDivisionId, hrDivisionName")
        .eq("isActive", true),
      supabase
        .from("hrDepartment")
        .select("hrDepartmentId, hrDepartmentName")
        .eq("isActive", true),
      supabase
        .from("hrPosition")
        .select("hrPositionId, hrPositionTitle")
        .eq("isActive", true),
    ]);

  if (
    employeesRes.error ||
    divisionsRes.error ||
    departmentsRes.error ||
    positionsRes.error
  ) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }

  const employees = employeesRes.data || [];
  const divisions = divisionsRes.data || [];
  const departments = departmentsRes.data || [];
  const positions = positionsRes.data || [];

  // KPI Stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (e) => e.hrEmployeeStatus === "active",
  ).length;
  const totalDivisions = divisions.length;
  const totalDepartments = departments.length;
  const totalPositions = positions.length;

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const newThisMonth = employees.filter(
    (e) =>
      e.hrEmployeeCreatedAt && e.hrEmployeeCreatedAt.startsWith(thisMonthKey),
  ).length;

  // Chart: Employees by Division
  const divisionMap = {};
  divisions.forEach((d) => {
    divisionMap[d.hrDivisionId] = d.hrDivisionName;
  });
  const divCounts = {};
  employees.forEach((e) => {
    const name = divisionMap[e.hrEmployeeDivision] || "ไม่ระบุ";
    divCounts[name] = (divCounts[name] || 0) + 1;
  });
  const byDivision = Object.entries(divCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Chart: Employees by Department
  const deptMap = {};
  departments.forEach((d) => {
    deptMap[d.hrDepartmentId] = d.hrDepartmentName;
  });
  const deptCounts = {};
  employees.forEach((e) => {
    const name = deptMap[e.hrEmployeeDepartment] || "ไม่ระบุ";
    deptCounts[name] = (deptCounts[name] || 0) + 1;
  });
  const byDepartment = Object.entries(deptCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Chart: Employees by Status
  const statusCounts = {};
  employees.forEach((e) => {
    const status = e.hrEmployeeStatus || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Chart: New Employee Trend (last 6 months)
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = employees.filter(
      (e) => e.hrEmployeeCreatedAt && e.hrEmployeeCreatedAt.startsWith(monthKey),
    ).length;
    trend.push({ month: monthKey, count });
  }

  return Response.json({
    totalEmployees,
    activeEmployees,
    totalDivisions,
    totalDepartments,
    totalPositions,
    newThisMonth,
    byDivision,
    byDepartment,
    byStatus,
    trend,
  });
}
