import { api } from "@/lib/api.server";
import DepartmentsClient from "@/modules/hr/departmentsClient";
import type { HrDepartment, HrDivision } from "@/modules/hr/types";

export default async function DepartmentsPage() {
  const [departments, divisions] = await Promise.all([
    api("/api/hr/departments", 86400),
    api("/api/hr/divisions", 86400),
  ]);

  return (
    <DepartmentsClient
      initialDepartments={(departments as HrDepartment[]) || []}
      initialDivisions={(divisions as HrDivision[]) || []}
    />
  );
}
