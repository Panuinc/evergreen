import { api } from "@/lib/api.server";
import PositionsClient from "@/modules/hr/positionsClient";

export default async function PositionsPage() {
  const [positions, departments] = await Promise.all([
    api("/api/hr/positions"),
    api("/api/hr/departments"),
  ]);

  return (
    <PositionsClient
      initialPositions={positions || []}
      initialDepartments={departments || []}
    />
  );
}
