// HR module types
// Field names match raw Supabase column names (no AS alias)

// ─── Entity Interfaces ────────────────────────────────────────────────────────

export interface HrDivision {
  hrDivisionId: string;
  hrDivisionName: string;
  hrDivisionDescription: string | null;
  hrDivisionCreatedAt: string;
  isActive: boolean;
}

export interface HrDepartment {
  hrDepartmentId: string;
  hrDepartmentName: string;
  hrDepartmentDescription: string | null;
  hrDepartmentHrDivisionId: string;
  hrDepartmentCreatedAt: string;
  isActive: boolean;
}

export interface HrPosition {
  hrPositionId: string;
  hrPositionTitle: string;
  hrPositionDescription: string | null;
  hrPositionHrDepartmentId: string;
  hrPositionCreatedAt: string;
  isActive: boolean;
}

// Employee includes JOIN columns from hrDivision, hrDepartment, hrPosition
// JOIN columns use the source table's raw column name (no alias)
export interface HrEmployee {
  hrEmployeeId: string;
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeEmail: string | null;
  hrEmployeePhone: string | null;
  hrEmployeeHrDivisionId: string | null;
  hrEmployeeHrDepartmentId: string | null;
  hrEmployeeHrPositionId: string | null;
  hrEmployeeCreatedAt: string;
  isActive: boolean;
  // JOIN columns — raw column names from source tables
  hrDivisionName: string | null;
  hrDepartmentName: string | null;
  hrPositionTitle: string | null;
}

// ─── Dashboard Interfaces ─────────────────────────────────────────────────────

export interface HrDivisionStat {
  hrDivisionName: string;
  count: number;
}

export interface HrDepartmentStat {
  hrDepartmentName: string;
  count: number;
}

export interface HrStatusStat {
  status: string;
  count: number;
}

export interface HrTrendEntry {
  month: string;
  count: number;
}

export interface HrDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDivisions: number;
  totalDepartments: number;
  totalPositions: number;
  newThisMonth: number;
  byDivision: HrDivisionStat[];
  byDepartment: HrDepartmentStat[];
  byStatus: HrStatusStat[];
  trend: HrTrendEntry[];
}

export interface HrDashboardCompareStats {
  compareMode: string;
  current: HrDashboardStats;
  previous: HrDashboardStats;
  labels: {
    current: string;
    previous: string;
  };
}

export type HrDashboardResponse = HrDashboardStats | HrDashboardCompareStats;

// ─── Form Interfaces ──────────────────────────────────────────────────────────

export interface EmployeeFormData {
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeEmail: string;
  hrEmployeePhone: string;
  hrEmployeeHrDivisionId: string;
  hrEmployeeHrDepartmentId: string;
  hrEmployeeHrPositionId: string;
}

export interface DivisionFormData {
  hrDivisionName: string;
  hrDivisionDescription: string;
}

export interface DepartmentFormData {
  hrDepartmentName: string;
  hrDepartmentDescription: string;
  hrDepartmentHrDivisionId: string;
}

export interface PositionFormData {
  hrPositionTitle: string;
  hrPositionDescription: string;
  hrPositionHrDepartmentId: string;
}

// ─── Component Props Interfaces ───────────────────────────────────────────────

export interface EmployeesClientProps {
  initialEmployees: HrEmployee[];
  initialDivisions: HrDivision[];
  initialDepartments: HrDepartment[];
  initialPositions: HrPosition[];
}

export interface DivisionsClientProps {
  initialDivisions: HrDivision[];
}

export interface DepartmentsClientProps {
  initialDepartments: HrDepartment[];
  initialDivisions: HrDivision[];
}

export interface PositionsClientProps {
  initialPositions: HrPosition[];
  initialDepartments: HrDepartment[];
}

export interface HrDashboardClientProps {
  initialStats: HrDashboardResponse | null;
}

export interface EmployeeByDivisionChartProps {
  data: HrDivisionStat[];
}

export interface EmployeeByDepartmentChartProps {
  data: HrDepartmentStat[];
}

export interface EmployeeStatusChartProps {
  data: HrStatusStat[];
}

export interface NewEmployeeTrendChartProps {
  data: HrTrendEntry[];
}
