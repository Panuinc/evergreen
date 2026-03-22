// Sales Module — TypeScript type definitions
// Field names = raw Supabase column names (no AS alias)
// Computed aggregates use descriptive camelCase names

// ─── bciProject ───────────────────────────────────────────────────────────────
export interface BciProject {
  bciProjectId: string;
  bciProjectExternalRef: string | null;
  bciProjectName: string;
  bciProjectType: string | null;
  bciProjectDescription: string | null;
  bciProjectStreetName: string | null;
  bciProjectCityOrTown: string | null;
  bciProjectStateProvince: string | null;
  bciProjectRegion: string | null;
  bciProjectCountry: string | null;
  bciProjectValue: number | null;
  bciProjectCurrency: string | null;
  bciProjectStage: string | null;
  bciProjectStageStatus: string | null;
  bciProjectCategory: string | null;
  bciProjectSubCategory: string | null;
  bciProjectDevelopmentType: string | null;
  bciProjectOwnershipType: string | null;
  bciProjectOwnerCompany: string | null;
  bciProjectOwnerContact: string | null;
  bciProjectOwnerPhone: string | null;
  bciProjectOwnerEmail: string | null;
  bciProjectArchitectCompany: string | null;
  bciProjectArchitectContact: string | null;
  bciProjectArchitectPhone: string | null;
  bciProjectArchitectEmail: string | null;
  bciProjectContractorCompany: string | null;
  bciProjectContractorContact: string | null;
  bciProjectContractorPhone: string | null;
  bciProjectContractorEmail: string | null;
  bciProjectPmCompany: string | null;
  bciProjectPmContact: string | null;
  bciProjectPmPhone: string | null;
  bciProjectPmEmail: string | null;
  bciProjectStoreys: number | null;
  bciProjectFloorArea: number | null;
  bciProjectSiteArea: number | null;
  bciProjectConstructionStartDate: string | null;
  bciProjectConstructionStartString: string | null;
  bciProjectConstructionEndDate: string | null;
  bciProjectConstructionEndString: string | null;
  bciProjectRemarks: string | null;
  bciProjectModifiedDate: string | null;
}

// ─── Import response ──────────────────────────────────────────────────────────
export interface BciImportResult {
  ok: boolean;
  imported: number;
  errors: number;
  total: number;
  mapped: number;
}

// ─── salesLead ────────────────────────────────────────────────────────────────
export interface SalesLead {
  salesLeadId: string;
  salesLeadNo: string | null;
  salesLeadName: string;
  salesLeadEmail: string | null;
  salesLeadPhone: string | null;
  salesLeadCompany: string | null;
  salesLeadPosition: string | null;
  salesLeadSource: string | null;
  salesLeadScore: string | null;
  salesLeadStatus: string;
  salesLeadAssignedTo: string | null;
  salesLeadNotes: string | null;
  salesLeadCreatedAt: string | null;
  isActive: boolean;
}

// ─── salesAccount ─────────────────────────────────────────────────────────────
export interface SalesAccount {
  salesAccountId: string;
  salesAccountNo: string | null;
  salesAccountName: string;
  salesAccountIndustry: string | null;
  salesAccountPhone: string | null;
  salesAccountEmail: string | null;
  salesAccountWebsite: string | null;
  salesAccountEmployees: number | null;
  salesAccountAnnualRevenue: number | null;
  salesAccountAddress: string | null;
  salesAccountNotes: string | null;
  salesAccountCreatedAt: string | null;
  isActive: boolean;
}

// ─── salesContact ─────────────────────────────────────────────────────────────
export interface SalesContact {
  salesContactId: string;
  salesContactNo: string | null;
  salesContactFirstName: string;
  salesContactLastName: string | null;
  salesContactEmail: string | null;
  salesContactPhone: string | null;
  salesContactPosition: string | null;
  salesContactAccountId: string | null;
  salesContactAddress: string | null;
  salesContactTags: string | null;
  salesContactNotes: string | null;
  salesContactCreatedAt: string | null;
  isActive: boolean;
  salesAccount: { salesAccountId: string; salesAccountName: string } | null;
}

// ─── salesOpportunity ─────────────────────────────────────────────────────────
export interface SalesOpportunity {
  salesOpportunityId: string;
  salesOpportunityNo: string | null;
  salesOpportunityName: string;
  salesOpportunityStage: string;
  salesOpportunityAmount: number | null;
  salesOpportunityProbability: number | null;
  salesOpportunityExpectedCloseDate: string | null;
  salesOpportunityContactId: string | null;
  salesOpportunityAccountId: string | null;
  salesOpportunityAssignedTo: string | null;
  salesOpportunitySource: string | null;
  salesOpportunityNotes: string | null;
  salesOpportunityCreatedAt: string | null;
  isActive: boolean;
  salesContact: { salesContactId: string; salesContactFirstName: string; salesContactLastName: string } | null;
  salesAccount: { salesAccountId: string; salesAccountName: string } | null;
}

// ─── salesQuotation ───────────────────────────────────────────────────────────
export interface SalesQuotation {
  salesQuotationId: string;
  salesQuotationNo: string | null;
  salesQuotationStatus: string;
  salesQuotationSubtotal: number | null;
  salesQuotationDiscount: number | null;
  salesQuotationTax: number | null;
  salesQuotationTotal: number | null;
  salesQuotationValidUntil: string | null;
  salesQuotationContactId: string | null;
  salesQuotationAccountId: string | null;
  salesQuotationOpportunityId: string | null;
  salesQuotationNotes: string | null;
  salesQuotationTerms: string | null;
  salesQuotationApprovalNote: string | null;
  salesQuotationApprovedBy: string | null;
  salesQuotationCreatedAt: string | null;
  isActive: boolean;
  salesContact?: { salesContactId: string; salesContactFirstName: string; salesContactLastName: string } | null;
  salesAccount?: { salesAccountId: string; salesAccountName: string } | null;
}

// ─── salesQuotationLine ───────────────────────────────────────────────────────
export interface SalesQuotationLine {
  salesQuotationLineId?: string;
  salesQuotationLineQuotationId?: string;
  salesQuotationLineOrder: number;
  salesQuotationLineProductName: string;
  salesQuotationLineDescription: string | null;
  salesQuotationLineQuantity: number;
  salesQuotationLineUnitPrice: number;
  salesQuotationLineDiscount: number;
  salesQuotationLineAmount: number;
}

// ─── salesOrder ───────────────────────────────────────────────────────────────
export interface SalesOrder {
  salesOrderId: string;
  salesOrderNo: string | null;
  salesOrderStatus: string;
  salesOrderTotal: number | null;
  salesOrderTrackingNumber: string | null;
  salesOrderDeliveryDate: string | null;
  salesOrderShippingAddress: string | null;
  salesOrderNotes: string | null;
  salesOrderQuotationId: string | null;
  salesOrderContactId: string | null;
  salesOrderAccountId: string | null;
  salesOrderCreatedAt: string | null;
  salesOrderCreatedBy: string | null;
  isActive: boolean;
  salesContact: { salesContactId: string; salesContactFirstName: string; salesContactLastName: string } | null;
  salesAccount: { salesAccountId: string; salesAccountName: string } | null;
}

// ─── salesActivity ────────────────────────────────────────────────────────────
export interface SalesActivity {
  salesActivityId: string;
  salesActivityType: string;
  salesActivitySubject: string;
  salesActivityDescription: string | null;
  salesActivityStatus: string;
  salesActivityPriority: string | null;
  salesActivityDueDate: string | null;
  salesActivityContactId: string | null;
  salesActivityOpportunityId: string | null;
  salesActivityAccountId: string | null;
  salesActivityAssignedTo: string | null;
  salesActivityCreatedAt: string | null;
  isActive: boolean;
}

// ─── Dashboard types ──────────────────────────────────────────────────────────

// Pipeline by stage — computed aggregate (no AS alias on simple columns)
export interface SalesPipelineStageRow {
  salesOpportunityStage: string;
  salesOpportunityAmount: number;          // COALESCE(SUM(...)) AS "salesOpportunityAmount"
  salesPipelineStageColor: string | null;
}

// Revenue by month — computed aggregate
export interface SalesRevenueByMonthRow {
  month: string;      // to_char(...) AS "month"
  revenue: number;    // COALESCE(SUM(...)) AS "revenue"
}

// Top salespeople — computed aggregate
export interface SalesTopSalespersonRow {
  salesOrderCreatedBy: string;
  salesOrderCount: number;   // COUNT(*) AS "salesOrderCount"
  revenue: number;            // COALESCE(SUM(...)) AS "revenue"
}

export interface SalesKPIs {
  totalLeads: number;
  openOpportunities: number;
  wonDeals: number;
  totalRevenue: number;
  pipelineValue: number;
  weightedPipeline: number;
  winRate: number;
  newLeads: number;
}

export interface SalesDashboardData {
  kpis: SalesKPIs;
  pipelineByStage: SalesPipelineStageRow[];
  revenueByMonth: SalesRevenueByMonthRow[];
  topSalespeople: SalesTopSalespersonRow[];
  recentActivities: SalesActivity[];
}

export interface SalesDashboardCompareData {
  compareMode: string;
  current: SalesDashboardData;
  previous: { kpis: SalesKPIs };
  labels: { current: string; previous: string };
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface BciProjectsViewProps {
  projects: BciProject[];
  loading: boolean;
  reload: () => void;
}

export interface DashboardViewProps {
  data: SalesDashboardData | SalesDashboardCompareData | null;
  loading: boolean;
  compareMode: string | null;
  setCompareMode: (mode: string | null) => void;
}

export interface DashboardClientProps {
  initialData: SalesDashboardData | SalesDashboardCompareData | null;
}

export interface LeadsViewProps {
  leads: SalesLead[];
  loading: boolean;
  saving: boolean;
  editingLead: SalesLead | null;
  formData: Partial<SalesLead>;
  validationErrors: Record<string, string>;
  deletingLead: SalesLead | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (lead?: SalesLead | null) => void;
  handleSave: () => void;
  confirmDelete: (lead: SalesLead) => void;
  handleDelete: () => void;
  handleConvert: (lead: SalesLead) => void;
  toggleActive: (item: SalesLead) => void;
}

export interface LeadsClientProps {
  initialLeads: SalesLead[];
}

export interface AccountsViewProps {
  accounts: SalesAccount[];
  loading: boolean;
  saving: boolean;
  editingAccount: SalesAccount | null;
  // salesAccountEmployees and salesAccountAnnualRevenue are strings in form (input values)
  formData: Omit<Partial<SalesAccount>, "salesAccountEmployees" | "salesAccountAnnualRevenue"> & {
    salesAccountEmployees?: string;
    salesAccountAnnualRevenue?: string;
  };
  validationErrors: Record<string, string>;
  deletingAccount: SalesAccount | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (account?: SalesAccount | null) => void;
  handleSave: () => void;
  confirmDelete: (account: SalesAccount) => void;
  handleDelete: () => void;
  toggleActive: (item: SalesAccount) => void;
}

export interface AccountsClientProps {
  initialAccounts: SalesAccount[];
}

export interface ContactsViewProps {
  contacts: SalesContact[];
  loading: boolean;
  saving: boolean;
  editingContact: SalesContact | null;
  formData: Partial<SalesContact>;
  validationErrors: Record<string, string>;
  deletingContact: SalesContact | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (contact?: SalesContact | null) => void;
  handleSave: () => void;
  confirmDelete: (contact: SalesContact) => void;
  handleDelete: () => void;
  toggleActive: (item: SalesContact) => void;
}

export interface OrdersViewProps {
  orders: SalesOrder[];
  loading: boolean;
  saving: boolean;
  selectedOrder: SalesOrder | null;
  detailModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  deletingOrder: SalesOrder | null;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  handleStatusChange: (order: SalesOrder, newStatus: string) => void;
  handleViewDetail: (order: SalesOrder) => void;
  confirmDelete: (order: SalesOrder) => void;
  handleDelete: () => void;
}

export interface OrdersClientProps {
  initialOrders: SalesOrder[];
}

export interface QuotationEditorViewProps {
  quotation: SalesQuotation | null;
  lines: SalesQuotationLine[];
  loading: boolean;
  saving: boolean;
  discount: number;
  tax: number;
  setDiscount: (v: number) => void;
  setTax: (v: number) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  updateLine: (index: number, field: string, value: string | number) => void;
  calcSubtotal: () => number;
  calcTotal: () => number;
  handleSave: () => void;
  handleAction: (action: string, note?: string) => Promise<void>;
  updateQuotationField: (field: string, value: string) => void;
  onNavigateBack: () => void;
}

export interface ReportsViewProps {
  data: SalesDashboardData | null;
  loading: boolean;
}

export interface QuotationsViewProps {
  quotations: SalesQuotation[];
  loading: boolean;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  deletingQuotation: SalesQuotation | null;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  confirmDelete: (quotation: SalesQuotation) => void;
  handleDelete: () => void;
  handleNew: () => void;
  onNavigateToQuotation: (quotationId: string) => void;
}

export interface QuotationsClientProps {
  initialQuotations: SalesQuotation[];
}

export interface OpportunitiesClientProps {
  initialOpportunities: SalesOpportunity[];
}

export interface ActivitiesClientProps {
  initialActivities: SalesActivity[];
}
