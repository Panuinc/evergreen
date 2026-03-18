"use client";

import { useState, useCallback, useRef } from "react";
import { authFetch } from "@/lib/apiClient";

export function useSyncBc() {
  const [syncingAll, setSyncingAll] = useState(false);
  const [allResult, setAllResult] = useState(null);
  const [allError, setAllError] = useState(null);
  const [phases, setPhases] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const abortRef = useRef(null);

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setAllError(null);
    setAllResult(null);
    setPhases({});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authFetch("/api/sync/bc?stream=1", {
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

        let currentEvent = null;
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
      if (e.name !== "AbortError") {
        setAllError(e.message);
      }
    } finally {
      setSyncingAll(false);
      abortRef.current = null;
    }
  }, []);

  return {
    syncingAll,
    allResult,
    allError,
    phases,
    lastSync,
    handleSyncAll,
  };
}
