import { api } from "@/lib/api.server";
import FgCoverageClient from "@/modules/production/FgCoverageClient";

export default async function FgCoveragePage() {
  const data = await api("/api/production/fgCoverage");

  return <FgCoverageClient initialData={data} />;
}
