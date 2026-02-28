"use client";

import { useBciProjects } from "@/modules/sales/hooks/useBciProjects";
import BciProjectsView from "@/modules/sales/components/BciProjectsView";

export default function BciProjectsPage() {
  const { projects, loading, reload } = useBciProjects();

  return (
    <BciProjectsView
      projects={projects}
      loading={loading}
      reload={reload}
    />
  );
}
