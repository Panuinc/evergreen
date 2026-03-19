"use client";

import { useState } from "react";
import FgCoverageView from "@/modules/production/components/fgCoverageView";

export default function FgCoverageClient({ initialData }) {
  return <FgCoverageView initialData={initialData} />;
}
