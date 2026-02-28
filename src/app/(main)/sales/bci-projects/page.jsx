"use client";

import { useBciProjects } from "@/hooks/sales/useBciProjects";
import BciProjectsView from "@/components/sales/BciProjectsView";

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
