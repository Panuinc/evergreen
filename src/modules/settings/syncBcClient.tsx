"use client";

import React, { useState, useCallback, useRef } from "react";
import { authFetch } from "@/lib/apiClient";
import SyncBcView from "@/modules/settings/components/syncBcView";
import type {
  SyncBcResult,
  SyncPhasesState,
  BciImportResult,
} from "@/modules/settings/types";

export default function SyncBcClient() {
  /* ── Sync BC state ── */
  const [syncingMode, setSyncingMode] = useState<"full" | "incremental" | null>(null);
  const [allResult, setAllResult] = useState<SyncBcResult | null>(null);
  const [allError, setAllError] = useState<string | null>(null);
  const [phases, setPhases] = useState<SyncPhasesState>({});
  const [lastSync, setLastSync] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSync = useCallback(async (mode: "full" | "incremental") => {
    setSyncingMode(mode);
    setAllError(null);
    setAllResult(null);
    setPhases({});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authFetch(`/api/sync/bc?stream=1&mode=${mode}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent: string | null = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress") {
                setPhases((prev) => ({
                  ...prev,
                  [data.phase]: data,
                }));
              } else if (currentEvent === "done") {
                setAllResult(data);
                setLastSync(new Date().toLocaleString("th-TH"));
              } else if (currentEvent === "error") {
                setAllError(data.message);
              }
            } catch {}
            currentEvent = null;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setAllError((e as Error).message);
      }
    } finally {
      setSyncingMode(null);
      abortRef.current = null;
    }
  }, []);

  /* ── BCI Import state ── */
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BciImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch("/api/bci/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, []);

  return (
    <SyncBcView
      syncingMode={syncingMode}
      allResult={allResult}
      allError={allError}
      phases={phases}
      lastSync={lastSync}
      handleSync={handleSync}
      importing={importing}
      importResult={importResult}
      importError={importError}
      importFileName={importFileName}
      handleFileChange={handleFileChange}
    />
  );
}
