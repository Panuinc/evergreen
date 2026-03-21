// Warehouse Module Types
// Field names = raw Supabase column names (no AS alias from Go backend)

// ─── bcItem (Inventory) ───────────────────────────────────────────────────────

export interface BcItem {
  bcItemNo: string;
  bcItemDescription: string | null;
  bcItemType: string | null;
  bcItemInventory: number | null;
  bcItemBaseUnitOfMeasure: string | null;
  bcItemUnitPrice: number | null;
  bcItemUnitCost: number | null;
  bcItemItemCategoryCode: string | null;
  bcItemGenProdPostingGroup: string | null;
  bcItemGlobalDimension1Code: string | null;
  bcItemRfidCode: string | null;
  projectName: string | null;
}

// ─── bcSalesOrder ─────────────────────────────────────────────────────────────

export interface BcSalesOrder {
  bcSalesOrderId: string;
  bcSalesOrderNoValue: string;
  bcSalesOrderSellToCustomerNo: string;
  bcSalesOrderSellToCustomerName: string;
  bcSalesOrderStatus: string;
  bcSalesOrderOrderDate: string | null;
}

// ─── whScanSession ────────────────────────────────────────────────────────────

export interface WhScanSession {
  whScanSessionId: string;
  whScanSessionType: string;
  whScanSessionStatus: string;
  whScanSessionCreatedBy: string;
  whScanSessionStartedAt: string | null;
  whScanSessionUserId: string;
}

// ─── whScanRecord ─────────────────────────────────────────────────────────────

export interface WhScanRecord {
  whScanRecordId: string;
  whScanRecordSessionId: string;
  whScanRecordBarcode: string | null;
  whScanRecordItemNo: string | null;
  whScanRecordQuantity: number | null;
  whScanRecordCreatedAt: string;
}

// ─── whTransfer ───────────────────────────────────────────────────────────────

export interface WhTransfer {
  whTransferId: string;
  whTransferNumber: string;
  whTransferFromLocation: string | null;
  whTransferToLocation: string | null;
  whTransferStatus: string;
  whTransferCreatedBy: string;
  whTransferCreatedAt: string;
  whTransferUserId: string;
}

// ─── whAppVersion ─────────────────────────────────────────────────────────────

export interface WhAppVersion {
  whAppVersionId: string;
  whAppVersionNumber: string;
  whAppVersionNotes: string | null;
  whAppVersionUrl: string | null;
  whAppVersionCreatedAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface WarehouseDashboard {
  totalSessions: number;
  sessionsByStatus: Record<string, number>;
  totalTransfers: number;
  transfersByStatus: Record<string, number>;
}

// ─── Props Interfaces ─────────────────────────────────────────────────────────

export interface InventoryClientProps {
  initialItems: BcItem[];
}

export interface WarehouseInventoryViewProps {
  items: BcItem[];
  loading: boolean;
}

export interface WarehouseInventoryGroupViewProps {
  items: BcItem[];
  loading: boolean;
}

export interface PrintRfidModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BcItem | null;
}
