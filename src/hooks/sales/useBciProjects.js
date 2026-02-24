"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useBciProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bci/projects");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการ BCI ได้");
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, reload: loadProjects };
}
