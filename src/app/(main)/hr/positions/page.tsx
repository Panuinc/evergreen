import { api } from "@/lib/api.server";
import PositionsClient from "@/modules/hr/positionsClient";
import type { HrPosition, HrDepartment } from "@/modules/hr/types";

export default async function PositionsPage() {
  const [positions, departments] = await Promise.all([
    api("/api/hr/positions"),
    api("/api/hr/departments"),
  ]);

  return (
    <PositionsClient
      initialPositions={(positions as HrPosition[]) || []}
      initialDepartments={(departments as HrDepartment[]) || []}
    />
  );
}
