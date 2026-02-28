"use client";

import { useSyncBc } from "@/hooks/settings/useSyncBc";
import { useBciImport } from "@/hooks/settings/useBciImport";
import SyncBcView from "@/components/settings/SyncBcView";

export default function SyncPage() {
  const { syncingAll, allResult, allError, phases, lastSync, handleSyncAll } =
    useSyncBc();
  const {
    importing,
    result: importResult,
    error: importError,
    fileName: importFileName,
    handleFileChange,
  } = useBciImport();

  return (
    <SyncBcView
      syncingAll={syncingAll}
      allResult={allResult}
      allError={allError}
      phases={phases}
      lastSync={lastSync}
      handleSyncAll={handleSyncAll}
      importing={importing}
      importResult={importResult}
      importError={importError}
      importFileName={importFileName}
      handleFileChange={handleFileChange}
    />
  );
}
