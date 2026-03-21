import { api } from "@/lib/api.server";
import DivisionsClient from "@/modules/hr/divisionsClient";
import type { HrDivision } from "@/modules/hr/types";

export default async function DivisionsPage() {
  const divisions = await api("/api/hr/divisions");

  return <DivisionsClient initialDivisions={(divisions as HrDivision[]) || []} />;
}
