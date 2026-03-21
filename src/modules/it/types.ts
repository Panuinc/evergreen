// ─── IT Module Types ─────────────────────────────────────────────────────────
// Field names = raw Supabase column names (no AS alias)

// ─── itAsset ─────────────────────────────────────────────────────────────────

export interface ItAsset {
  itAssetId: string;
  itAssetName: string;
  itAssetTag: string | null;
  itAssetCategory: string | null;
  itAssetBrand: string | null;
  itAssetModel: string | null;
  itAssetSerialNumber: string | null;
  itAssetStatus: "active" | "maintenance" | "retired" | "disposed";
  itAssetAssignedTo: string | null;
  itAssetLocation: string | null;
  itAssetPurchaseDate: string | null;
  itAssetWarrantyExpiry: string | null;
  itAssetNotes: string | null;
  isActive: boolean;
}

export type ItAssetFormData = {
  itAssetName: string;
  itAssetTag: string;
  itAssetCategory: string;
  itAssetBrand: string;
  itAssetModel: string;
  itAssetSerialNumber: string;
  itAssetStatus: string;
  itAssetAssignedTo: string;
  itAssetLocation: string;
  itAssetPurchaseDate: string;
  itAssetWarrantyExpiry: string;
  itAssetNotes: string;
};

// ─── itDevRequest ─────────────────────────────────────────────────────────────

export type ItDevRequestStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "testing"
  | "completed"
  | "cancelled";

export type ItDevRequestPriority = "low" | "medium" | "high" | "critical";

export interface ItDevRequest {
  itDevRequestId: string;
  itDevRequestNo: string | null;
  itDevRequestTitle: string;
  itDevRequestDescription: string | null;
  itDevRequestRequestedBy: string | null;
  itDevRequestPriority: ItDevRequestPriority;
  itDevRequestStatus: ItDevRequestStatus;
  itDevRequestAssignedTo: string | null;
  itDevRequestProgress: number;
  itDevRequestStartDate: string | null;
  itDevRequestDueDate: string | null;
  itDevRequestNotes: string | null;
  isActive: boolean;
}

export type ItDevRequestFormData = {
  itDevRequestTitle: string;
  itDevRequestDescription: string;
  itDevRequestRequestedBy: string;
  itDevRequestPriority: string;
  itDevRequestStatus: string;
  itDevRequestAssignedTo: string;
  itDevRequestProgress: string;
  itDevRequestStartDate: string;
  itDevRequestDueDate: string;
  itDevRequestNotes: string;
};

// ─── itDevProgressLog ─────────────────────────────────────────────────────────

export interface ItDevProgressLog {
  itDevProgressLogId: string;
  itDevProgressLogDescription: string;
  itDevProgressLogProgress: number;
  itDevProgressLogCreatedBy: string | null;
  itDevProgressLogCreatedAt: string | null;
}

export type ItDevProgressLogFormData = {
  itDevProgressLogDescription: string;
  itDevProgressLogProgress: string;
  itDevProgressLogCreatedBy: string;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface ItAssetByCategoryItem {
  /** itAsset.itAssetCategory value */
  category: string;
  /** COUNT(*) aggregate */
  count: number;
}

export interface ItDashboardData {
  /** Total asset count */
  totalAssets: number;
  /** Assets grouped by category */
  assetByCategory: ItAssetByCategoryItem[];
}

export interface ItDashboardCompareData {
  compareMode: string;
  current: ItDashboardData;
  previous: ItDashboardData;
  labels: {
    current: string;
    previous: string;
  };
}

/** Union: plain stats or compare stats from /api/it/dashboard */
export type ItDashboardStats = ItDashboardData | ItDashboardCompareData;

// ─── HR Employee (used in IT selects) ────────────────────────────────────────

export interface HrEmployeeBasic {
  hrEmployeeId: string;
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeUserId: string | null;
}

// ─── Props Interfaces ─────────────────────────────────────────────────────────

export interface ItDashboardClientProps {
  initialStats: ItDashboardStats | null;
}

export interface DashboardViewProps {
  stats: ItDashboardStats | null;
  loading: boolean;
  compareMode: string | null;
  setCompareMode: (mode: string | null) => void;
}

export interface AssetByCategoryChartProps {
  data?: ItAssetByCategoryItem[];
}

// ── Disclosure shape (from HeroUI useDisclosure) ─────────────────────────────
export interface DisclosureState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export interface AssetsViewProps {
  assets: ItAsset[];
  employees: HrEmployeeBasic[];
  loading: boolean;
  saving: boolean;
  editingAsset: ItAsset | null;
  formData: ItAssetFormData;
  validationErrors: Record<string, string>;
  deletingAsset: ItAsset | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: DisclosureState;
  updateField: (field: keyof ItAssetFormData, value: string) => void;
  handleOpen: (asset?: ItAsset | null) => void;
  handleSave: () => Promise<void>;
  confirmDelete: (asset: ItAsset) => void;
  handleDelete: () => Promise<void>;
  toggleActive: (item: ItAsset) => Promise<void>;
}

export interface AssetsClientProps {
  initialAssets: ItAsset[];
  initialEmployees: HrEmployeeBasic[];
}

export interface DevelopmentViewProps {
  requests: ItDevRequest[];
  employees: HrEmployeeBasic[];
  loading: boolean;
  saving: boolean;
  editingRequest: ItDevRequest | null;
  formData: ItDevRequestFormData;
  validationErrors: Record<string, string>;
  deletingRequest: ItDevRequest | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: DisclosureState;
  updateField: (field: keyof ItDevRequestFormData, value: string) => void;
  handleOpen: (request?: ItDevRequest | null) => void;
  handleSave: () => Promise<void>;
  confirmDelete: (request: ItDevRequest) => void;
  handleDelete: () => Promise<void>;
  progressModal: DisclosureState;
  selectedRequest: ItDevRequest | null;
  progressLogs: ItDevProgressLog[];
  progressLoading: boolean;
  progressSaving: boolean;
  progressForm: ItDevProgressLogFormData;
  openProgress: (request: ItDevRequest) => Promise<void>;
  handleAddProgress: () => Promise<void>;
  updateProgressField: (field: keyof ItDevProgressLogFormData, value: string) => void;
  toggleActive: (item: ItDevRequest) => Promise<void>;
}

export interface DevRequestsClientProps {
  initialRequests: ItDevRequest[];
  initialEmployees: HrEmployeeBasic[];
}
