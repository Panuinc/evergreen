"use client";

import { useState, useCallback } from "react";

export function useBciImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bci/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, []);

  return {
    importing,
    result,
    error,
    fileName,
    handleFileChange,
  };
}
