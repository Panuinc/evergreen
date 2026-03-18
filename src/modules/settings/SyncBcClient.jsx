"use client";

import { useSyncBc } from "@/modules/settings/useSyncBc";
import { useBciImport } from "@/modules/settings/useBciImport";
import SyncBcView from "@/modules/settings/components/SyncBcView";

export default function SyncBcClient() {
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
