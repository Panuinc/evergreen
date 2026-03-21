import { api } from "@/lib/api.server";
import FgCoverageClient from "@/modules/production/fgCoverageClient";
import type { FgCoverageResponse } from "@/modules/production/types";

export default async function FgCoveragePage() {
  const data = await api<FgCoverageResponse>("/api/production/fgCoverage");

  return <FgCoverageClient initialData={data} />;
}
