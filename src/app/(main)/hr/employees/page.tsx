import { api } from "@/lib/api.server";
import EmployeesClient from "@/modules/hr/employeesClient";
import type { HrEmployee, HrDivision, HrDepartment, HrPosition } from "@/modules/hr/types";

export default async function EmployeesPage() {
  const [employees, divisions, departments, positions] = await Promise.all([
    api("/api/hr/employees"),
    api("/api/hr/divisions"),
    api("/api/hr/departments"),
    api("/api/hr/positions"),
  ]);

  return (
    <EmployeesClient
      initialEmployees={(employees as HrEmployee[]) || []}
      initialDivisions={(divisions as HrDivision[]) || []}
      initialDepartments={(departments as HrDepartment[]) || []}
      initialPositions={(positions as HrPosition[]) || []}
    />
  );
}
