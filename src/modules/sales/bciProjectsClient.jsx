"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/apiClient";
import BciProjectsView from "@/modules/sales/components/bciProjectsView";

export default function BciProjectsClient() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/bci/projects");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการ BCI ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BciProjectsView
      projects={projects}
      loading={loading}
      reload={loadProjects}
    />
  );
}
