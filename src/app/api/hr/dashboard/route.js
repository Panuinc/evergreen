import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildDashboard(employees, divisions, departments, positions) {
  // KPI Stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.isActive).length;
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
  const statusCounts = { active: 0, inactive: 0 };
  employees.forEach((e) => {
    statusCounts[e.isActive ? "active" : "inactive"]++;
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

  return {
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
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode"); // "ytm" | "yty" | null

  const [employeesRes, divisionsRes, departmentsRes, positionsRes] =
    await Promise.all([
      supabase
        .from("hrEmployee")
        .select(
          "hrEmployeeId, hrEmployeeDivision, hrEmployeeDepartment, hrEmployeePosition, isActive, hrEmployeeCreatedAt",
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

  const allEmployees = employeesRes.data || [];
  const divisions = divisionsRes.data || [];
  const departments = departmentsRes.data || [];
  const positions = positionsRes.data || [];

  // ── No comparison mode: return as before ──
  if (!compareMode) {
    return Response.json(buildDashboard(allEmployees, divisions, departments, positions));
  }

  // ── Comparison mode: filter employees by creation date ──
  const ranges = getComparisonRanges(compareMode);

  const curEmployees = filterByDateRange(allEmployees, "hrEmployeeCreatedAt", ranges.current.start, ranges.current.end);
  const prevEmployees = filterByDateRange(allEmployees, "hrEmployeeCreatedAt", ranges.previous.start, ranges.previous.end);

  const current = buildDashboard(curEmployees, divisions, departments, positions);
  const previous = buildDashboard(prevEmployees, divisions, departments, positions);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current,
    previous,
  });
}
