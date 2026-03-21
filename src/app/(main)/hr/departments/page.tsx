import { api } from "@/lib/api.server";
import DepartmentsClient from "@/modules/hr/departmentsClient";

export default async function DepartmentsPage() {
  const [departments, divisions] = await Promise.all([
    api("/api/hr/departments"),
    api("/api/hr/divisions"),
  ]);

  return (
    <DepartmentsClient
      initialDepartments={departments || []}
      initialDivisions={divisions || []}
    />
  );
}
