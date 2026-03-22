"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import BciProjectsView from "@/modules/sales/components/bciProjectsView";
import type { BciProject } from "@/modules/sales/types";

export default function BciProjectsClient() {
  const { data, isLoading: loading, mutate } = useSWR<BciProject[]>(
    "/api/bci/projects",
    (url: string) => get(url),
    { revalidateOnFocus: false, onError: () => toast.error("ไม่สามารถโหลดข้อมูลโครงการ BCI ได้") },
  );
  const projects: BciProject[] = data || [];

  return (
    <BciProjectsView
      projects={projects}
      loading={loading ?? false}
      reload={mutate}
    />
  );
}
