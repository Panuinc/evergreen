import { api } from "@/lib/api.server";
import EmployeesClient from "@/modules/hr/EmployeesClient";

export default async function EmployeesPage() {
  const [employees, divisions, departments, positions] = await Promise.all([
    api("/api/hr/employees"),
    api("/api/hr/divisions"),
    api("/api/hr/departments"),
    api("/api/hr/positions"),
  ]);

  return (
    <EmployeesClient
      initialEmployees={employees || []}
      initialDivisions={divisions || []}
      initialDepartments={departments || []}
      initialPositions={positions || []}
    />
  );
}
