// ============================================================
// Production Module Types
// Field names = raw Supabase column names (no AS aliases)
// Go computed fields use descriptive camelCase
// ============================================================

// ---- Production Orders (from /api/production/orders) ----

export interface ProductionOrder {
  bcProductionOrderNo: string;
  bcProductionOrderStatus: string;
  bcProductionOrderDescription: string | null;
  bcProductionOrderDescription2: string | null;
  bcProductionOrderSourceNo: string | null;
  bcProductionOrderRoutingNo: string | null;
  bcProductionOrderQuantity: number;
  bcProductionOrderDueDate: string | null;
  bcProductionOrderFinishedDate: string | null;
  bcProductionOrderStartingDateTime: string | null;
  bcProductionOrderEndingDateTime: string | null;
  bcProductionOrderShortcutDimension1Code: string | null;
  bcProductionOrderShortcutDimension2Code: string | null;
  bcProductionOrderLocationCode: string | null;
  bcProductionOrderAssignedUserID: string | null;
  bcProductionOrderSearchDescription: string | null;
  // Go computed fields
  outputQty: number;
  consumptionCost: number;
  unitPrice: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  dimension1Name: string;
  dimension2Name: string;
  // Virtual field computed on frontend
  durationDays?: number | null;
}

// ---- Item Ledger Entries (from /api/bc/production — Supabase direct fields) ----

export interface ItemLedgerEntry {
  bcItemLedgerEntryEntryNo: string;
  bcItemLedgerEntryPostingDate: string | null;
  bcItemLedgerEntryDocumentDate: string | null;
  bcItemLedgerEntryEntryType: string;
  bcItemLedgerEntryDocumentType: string | null;
  bcItemLedgerEntryDocumentNo: string | null;
  bcItemLedgerEntryItemNo: string;
  bcItemLedgerEntryItemDescription: string | null;
  bcItemLedgerEntryLocationCode: string | null;
  bcItemLedgerEntryLotNo: string | null;
  bcItemLedgerEntrySerialNo: string | null;
  bcItemLedgerEntryExpirationDate: string | null;
  bcItemLedgerEntryQuantityValue: number;
  bcItemLedgerEntryUnitOfMeasureCode: string | null;
  bcItemLedgerEntryRemainingQuantity: number | null;
  bcItemLedgerEntryInvoicedQuantity: number | null;
  bcItemLedgerEntryCompletelyInvoiced: boolean | string | null;
  bcItemLedgerEntryOpenValue: boolean | string | null;
  bcItemLedgerEntryGlobalDimension1Code: string | null;
  bcItemLedgerEntryGlobalDimension2Code: string | null;
  bcItemLedgerEntryOrderType: string | null;
  bcItemLedgerEntryOrderNo: string | null;
  bcItemLedgerEntryOrderLineNo: number | null;
  bcItemLedgerEntryDocumentLineNo: number | null;
  bcItemLedgerEntryVariantCode: string | null;
  bcSyncedAt: string | null;
}

// ---- BOM Item (from /api/production/cores and /api/production/frames) ----

export interface BomItem {
  bcItemNo: string;
  bcItemDescription: string | null;
  bcItemDescription2: string | null;
  bcItemUnitCost: number;
  bcItemUnitPrice: number;
  bcItemInventory: number;
  bcItemBaseUnitOfMeasure: string | null;
  bcItemItemCategoryCode: string | null;
}

// ---- FG Coverage (from /api/production/fgCoverage) ----

export interface FgCoverageProductionOrder {
  orderNo: string;
  status: string;
  quantity: number;
  dueDate: string | null;
}

export interface FgCoverageItem {
  bcItemNo: string;
  bcItemDescription: string | null;
  bcItemItemCategoryCode: string | null;
  soQty: number;
  shippedQty: number;
  soOutstandingQty: number;
  hasProductionOrder: boolean;
  poCount: number;
  poTotalQty: number;
  poStatuses: string[];
  productionOrders: FgCoverageProductionOrder[];
}

export interface FgCoverageResponse {
  fgCoverage: FgCoverageItem[];
}

// ---- Dashboard (from /api/production/dashboard) ----

export interface DashboardOverdueOrder {
  bcProductionOrderNo: string;
  bcProductionOrderDescription: string | null;
  bcProductionOrderSourceNo: string | null;
  bcProductionOrderQuantity: number;
  bcProductionOrderDueDate: string;
  bcProductionOrderStartingDateTime: string | null;
  bcProductionOrderLocationCode: string | null;
  overdueDays: number;
  dimension1Name: string;
  dimension2Name: string;
}

export interface DashboardWipDetail {
  _key: string;
  orderNo: string;
  description: string | null;
  sourceNo: string | null;
  uom: string | null;
  plannedQty: number;
  outputQty: number;
  remainQty: number;
  completionPct: number;
  consumptionCost: number;
  revenue: number;
  wipValue: number;
  dueDate: string | null;
}

export interface DashboardWipByOrder {
  orderNo: string;
  description: string | null;
  consumptionCost: number;
  revenue: number;
  wipValue: number;
}

export interface DashboardOrdersByStatus {
  status: string;
  count: number;
}

export interface DashboardCostByProject {
  project: string;
  consumptionCost: number;
  revenue: number;
}

export interface DashboardDailyTrend {
  date: string;
  consumption: number;
  revenue: number;
}

export interface DashboardTopOutputItem {
  itemNo: string;
  description: string | null;
  quantity: number;
}

export interface DashboardTopConsumedItem {
  itemNo: string;
  description: string | null;
  cost: number;
  quantity: number;
}

export interface DashboardCostByDepartment {
  department: string;
  cost: number;
}

export interface DashboardOnTimeTrend {
  month: string;
  rate: number;
}

export interface DashboardLeadTimeTrend {
  month: string;
  avgDays: number;
  count: number;
}

export interface DashboardFgByProductType {
  category: string;
  quantity: number;
  revenue: number;
  count: number;
}

export interface DashboardProfitByItem {
  itemNo: string;
  description: string | null;
  category: string | null;
  sellingPrice: number;
  costPerUnit: number;
  outputQty: number;
  totalRevenue: number;
  consumptionCost: number;
  profitAmount: number;
  profitMargin: number | null;
}

export interface DashboardProfitByProjectItem {
  itemNo: string;
  description: string | null;
  category: string | null;
  outputQty: number;
  soQty: number;
  shippedQty: number;
  unitPrice: number;
  costPerUnit: number;
  revenue: number;
  totalCost: number;
  profit: number;
  margin: number | null;
}

export interface DashboardProfitByProject {
  projectCode: string;
  projectName: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  margin: number | null;
  items: DashboardProfitByProjectItem[];
}

export interface DashboardEmployeeCategory {
  category: string;
  quantity: number;
  orders: number;
  avgDays?: number;
}

export interface DashboardEmployee {
  employee: string;
  totalQty: number;
  orderCount: number;
  topCategory: string;
  categories: DashboardEmployeeCategory[];
  avgLeadTime?: number;
}

export interface DashboardTabData {
  totalOrders: number;
  releasedOrders: number;
  finishedOrders: number;
  onTimeRate: number | null;
  avgLeadTime: number | null;
  totalConsumptionCost: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number | null;
  wipValue: number;
  totalOutputQty: number;
  overdueCount: number;
  overdueOrders: DashboardOverdueOrder[];
  ordersByStatus: DashboardOrdersByStatus[];
  costByProject: DashboardCostByProject[];
  dailyTrend: DashboardDailyTrend[];
  topOutputItems: DashboardTopOutputItem[];
  topConsumedItems: DashboardTopConsumedItem[];
  costByDepartment: DashboardCostByDepartment[];
  onTimeTrend: DashboardOnTimeTrend[];
  leadTimeTrend: DashboardLeadTimeTrend[];
  wipByOrder: DashboardWipByOrder[];
  wipDetail: DashboardWipDetail[];
  fgByProductType: DashboardFgByProductType[];
  profitByItem: DashboardProfitByItem[];
  profitByProject: DashboardProfitByProject[];
  employeeSpecialization: DashboardEmployee[];
}

export interface DashboardResponse {
  wpc: DashboardTabData;
  other: DashboardTabData;
  compareMode?: string;
  labels?: { current: string; previous: string };
}

export interface DashboardCompareResponse {
  compareMode: string;
  wpc: { current: DashboardTabData; previous: DashboardTabData };
  other: { current: DashboardTabData; previous: DashboardTabData };
  labels: { current: string; previous: string };
}

// ---- Props Interfaces ----

export interface OrdersViewProps {
  data: ProductionOrder[];
  loading: boolean;
}

export interface OrdersClientProps {
  initialData: ProductionOrder[];
}

export interface EntriesViewProps {
  data: ItemLedgerEntry[];
  loading: boolean;
}

export interface EntriesClientProps {
  initialData: ItemLedgerEntry[];
}

export interface DashboardViewProps {
  data: DashboardResponse | DashboardCompareResponse | null;
  loading: boolean;
  compareMode: string | null;
  setCompareMode: (mode: string | null) => void;
}

export interface DashboardClientProps {
  initialData: DashboardResponse | null;
}

export interface FgCoverageViewProps {
  initialData: FgCoverageResponse | null;
}

export interface FgCoverageClientProps {
  initialData: FgCoverageResponse | null;
}

export interface ProfitByItemViewProps {
  data: DashboardResponse | DashboardCompareResponse | null;
  loading: boolean;
  compareMode: string | null;
  setCompareMode: (mode: string | null) => void;
}

export interface ProfitClientProps {
  initialData: DashboardResponse | null;
}

// ---- Chart / Section Component Props ----

export interface OrdersByStatusChartProps {
  data: DashboardOrdersByStatus[];
}

export interface TopOutputItemsChartProps {
  data: DashboardTopOutputItem[];
}

export interface TopConsumedItemsChartProps {
  data: DashboardTopConsumedItem[];
}

export interface CostByProjectChartProps {
  data: DashboardCostByProject[];
}

export interface CostByDepartmentChartProps {
  data: DashboardCostByDepartment[];
}

export interface DailyProductionTrendChartProps {
  data: DashboardDailyTrend[];
}

export interface WipByOrderChartProps {
  data: DashboardWipByOrder[];
}

export interface OnTimeTrendChartProps {
  data: DashboardOnTimeTrend[];
}

export interface LeadTimeTrendChartProps {
  data: DashboardLeadTimeTrend[];
}

export interface FgOutputBreakdownChartProps {
  data: DashboardFgByProductType[];
}

export interface ProfitByItemChartProps {
  data: DashboardProfitByItem[];
}

export interface ProfitByProjectSectionProps {
  data: DashboardProfitByProject[];
}

export interface EmployeeSpecializationChartProps {
  data: DashboardEmployee[];
}
