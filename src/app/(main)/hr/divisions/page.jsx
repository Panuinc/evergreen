import { api } from "@/lib/api.server";
import DivisionsClient from "@/modules/hr/divisionsClient";

export default async function DivisionsPage() {
  const divisions = await api("/api/hr/divisions");

  return <DivisionsClient initialDivisions={divisions || []} />;
}
