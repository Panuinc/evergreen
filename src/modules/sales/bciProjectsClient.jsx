"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { authFetch } from "@/lib/apiClient";
import BciProjectsView from "@/modules/sales/components/bciProjectsView";

const fetcher = async (url) => {
  const res = await authFetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function BciProjectsClient() {
  const { data, isLoading: loading, mutate } = useSWR(
    "/api/bci/projects",
    fetcher,
    { onError: () => toast.error("ไม่สามารถโหลดข้อมูลโครงการ BCI ได้") },
  );
  const projects = data || [];

  return (
    <BciProjectsView
      projects={projects}
      loading={loading}
      reload={mutate}
    />
  );
}
