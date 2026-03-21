// ─── Settings Module Types ────────────────────────────────────────────────────

// ─── Config Check / System Status ────────────────────────────────────────────

export interface ServiceStatus {
  status: "connected" | "disconnected" | string;
  latency?: number | null;
  detail?: string | null;
  error?: string | null;
}

export interface SystemStatusData {
  supabase?: ServiceStatus;
  bc?: ServiceStatus;
  openrouter?: ServiceStatus;
  line?: ServiceStatus;
  facebook?: ServiceStatus;
}

// ─── Sync BC ─────────────────────────────────────────────────────────────────

export type SyncPhaseStep =
  | "fetching"
  | "saving"
  | "cleaning"
  | "done"
  | "error";

export interface SyncPhaseProgress {
  phase: string;
  step: SyncPhaseStep;
  label?: string;
  count?: number;
  done?: number;
  total?: number;
}

export type SyncPhasesState = Record<string, SyncPhaseProgress>;

export interface SyncBcResult {
  results: Record<string, number | string | Record<string, number>>;
}

// ─── BCI Import ───────────────────────────────────────────────────────────────

export interface BciImportResultDetail {
  totalRows: number;
  imported: number;
  columnsMapped: number;
  skipped: number;
  unmapped?: string[];
  errors?: string[];
}

export interface BciImportResult {
  success: boolean;
  results: BciImportResultDetail;
}

// ─── Props Interfaces ─────────────────────────────────────────────────────────

export interface ConfigCheckClientProps {
  initialStatus: SystemStatusData | null;
}

export interface ConfigCheckViewProps {
  status: SystemStatusData | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface SystemStatusTabProps {
  status: SystemStatusData | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface SyncBcViewProps {
  syncingAll: boolean;
  allResult: SyncBcResult | null;
  allError: string | null;
  phases: SyncPhasesState;
  lastSync: string | null;
  handleSyncAll: () => Promise<void>;
  importing: boolean;
  importResult: BciImportResult | null;
  importError: string | null;
  importFileName: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export interface BcSyncSectionProps {
  syncingAll: boolean;
  allResult: SyncBcResult | null;
  allError: string | null;
  phases: SyncPhasesState;
  lastSync: string | null;
  handleSyncAll: () => Promise<void>;
}

export interface BciImportSectionProps {
  importing: boolean;
  result: BciImportResult | null;
  error: string | null;
  fileName: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export interface SyncProgressPanelProps {
  phases: SyncPhasesState;
}

export interface ResultCardsProps {
  tables: Array<{
    key: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  results: Record<string, number | string | Record<string, number>> | null | undefined;
}
