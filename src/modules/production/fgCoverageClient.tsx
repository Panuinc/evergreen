"use client";

import FgCoverageView from "@/modules/production/components/fgCoverageView";
import type { FgCoverageClientProps } from "@/modules/production/types";

export default function FgCoverageClient({ initialData }: FgCoverageClientProps) {
  return <FgCoverageView initialData={initialData} />;
}
