// Finance module types
// Field names = raw Supabase column names (ตรงกับ Go store.go ที่ไม่มี AS alias สำหรับ simple columns)

// ---- Sales Invoices ----

export interface SalesInvoiceLine {
  lineNo: number;
  type: string;
  itemNo: string | null;
  description: string | null;
  quantity: number | null;
  unitOfMeasure: string | null;
  unitPrice: number | null;
  amountIncludingTax: number | null;
}

export interface SalesInvoice {
  bcPostedSalesInvoiceId: string;
  bcPostedSalesInvoiceNoValue: string;
  bcPostedSalesInvoicePostingDate: string;
  bcPostedSalesInvoiceDueDate: string | null;
  bcPostedSalesInvoiceSellToCustomerNo: string;
  bcPostedSalesInvoiceSellToCustomerName: string;
  bcPostedSalesInvoiceSalespersonCode: string | null;
  bcPostedSalesInvoiceAmountIncludingVAT: number;
  bcPostedSalesInvoiceAmountValue: number;
  totalTaxAmount: number; // computed: AmountIncludingVAT - AmountValue
  bcPostedSalesInvoiceRemainingAmount: number;
  bcPostedSalesInvoiceStatus: string; // computed CASE WHEN: 'Paid' | 'Open'
  daysOverdue: number; // computed CASE WHEN
  lines: SalesInvoiceLine[];
}

// ---- Purchase Invoices ----

export interface PurchaseInvoiceLine {
  lineNo: number;
  type: string;
  itemNo: string | null;
  description: string | null;
  quantity: number | null;
  unitOfMeasure: string | null;
  unitCost: number | null;
  amountIncludingTax: number | null;
}

export interface PurchaseInvoice {
  bcPostedPurchInvoiceId: string;
  bcPostedPurchInvoiceNoValue: string;
  bcPostedPurchInvoiceVendorInvoiceNo: string | null;
  bcPostedPurchInvoicePostingDate: string;
  bcPostedPurchInvoiceDueDate: string | null;
  bcPostedPurchInvoiceBuyFromVendorNo: string;
  bcPostedPurchInvoiceBuyFromVendorName: string;
  bcPostedPurchInvoicePurchaserCode: string | null;
  bcPostedPurchInvoiceAmountIncludingVAT: number;
  bcPostedPurchInvoiceAmountValue: number;
  totalTaxAmount: number; // computed: AmountIncludingVAT - AmountValue
  bcPostedPurchInvoiceStatus: string; // computed CASE WHEN: 'Paid' | 'Open'
  daysOverdue: number; // computed CASE WHEN
  lines: PurchaseInvoiceLine[];
}

// ---- Aged Receivables ----

export interface AgedReceivable {
  bcCustomerLedgerEntryCustomerNo: string;
  bcCustomerNameValue: string; // COALESCE from bcCustomer join
  bcCustomerLedgerEntryCurrencyCode: string | null; // MAX aggregate
  bcCustomerLedgerEntryRemainingAmount: number; // SUM aggregate (total balance due)
  currentAmount: number; // SUM computed: due date >= today
  period1Amount: number; // SUM computed: 1-30 days overdue
  period2Amount: number; // SUM computed: 31-60 days overdue
  period3Amount: number; // SUM computed: 61+ days overdue
}

// ---- Aged Payables ----

export interface AgedPayable {
  bcVendorLedgerEntryVendorNo: string;
  bcVendorLedgerEntryVendorName: string; // MAX aggregate
  bcVendorLedgerEntryCurrencyCode: string | null; // MAX aggregate
  bcVendorLedgerEntryRemainingAmount: number; // SUM aggregate (total balance due)
  currentAmount: number; // SUM computed: due date >= today
  period1Amount: number; // SUM computed: 1-30 days overdue
  period2Amount: number; // SUM computed: 31-60 days overdue
  period3Amount: number; // SUM computed: 61+ days overdue
}

// ---- GL Entry ----

export interface GlEntry {
  bcGLEntryEntryNo: number;
  bcGLEntryGLAccountNo: string;
  bcGLEntryGLAccountName: string;
  bcGLEntryPostingDate: string;
  bcGLEntryDocumentType: string | null;
  bcGLEntryDocumentNo: string | null;
  bcGLEntryDescriptionValue: string | null;
  bcGLEntryAmountValue: number;
  bcGLEntryDebitAmount: number;
  bcGLEntryCreditAmount: number;
  bcGLEntryGlobalDimension1Code: string | null;
  bcGLEntryGlobalDimension2Code: string | null;
  bcGLEntrySourceType: string | null;
  bcGLEntrySourceNo: string | null;
  bcGLEntryDocumentDate: string | null;
  bcGLEntryExternalDocumentNo: string | null;
  bcGLEntryVATAmount: number | null;
}

// ---- Trial Balance ----

export interface TrialBalanceAccount {
  bcGLAccountNo: string;
  bcGLAccountNameValue: string;
  bcGLAccountAccountType: string;
  bcGLAccountAccountCategory: string | null;
  bcGLAccountIndentation: number;
  balanceAtDateDebit: number; // computed CASE WHEN balance >= 0
  balanceAtDateCredit: number; // computed CASE WHEN balance < 0
  bcGLAccountBalance: number;
  bcGLAccountNetChange: number;
}

// ---- Collections (arFollowUp) ----

export interface ArFollowUp {
  arFollowUpId: string;
  arFollowUpCustomerNumber: string;
  arFollowUpCustomerName: string;
  arFollowUpInvoiceNumber: string | null;
  arFollowUpContactDate: string;
  arFollowUpContactMethod: string;
  arFollowUpReason: string;
  arFollowUpReasonDetail: string | null;
  arFollowUpNote: string | null;
  arFollowUpPromiseDate: string | null;
  arFollowUpPromiseAmount: number | null;
  arFollowUpStatus: string;
  arFollowUpNextFollowUpDate: string | null;
  arFollowUpCreatedByName: string | null;
}

// ---- Merged Collections (frontend computed) ----

export interface MergedCollectionRow {
  customerNumber: string; // = bcCustomerLedgerEntryCustomerNo
  name: string;           // = bcCustomerNameValue
  balanceDue: number;
  current: number;
  period1: number;
  period2: number;
  period3: number;
  followUpCount: number;
  lastContactDate: string | null;
  lastReason: string | null;
  lastStatus: string | null;
  lastNote: string | null;
  nextFollowUpDate: string | null;
  promiseDate: string | null;
  promiseAmount: number | null;
}

export interface CollectionsKpis {
  totalOverdue: number;
  contacted: number;
  uncontacted: number;
  total: number;
  dueToday: number;
  promisedTotal: number;
}

export interface ReportChartItem {
  name: string;
  value: number;
  key: string;
}

export interface ReportData {
  filtered: ArFollowUp[];
  reasonChart: ReportChartItem[];
  statusChart: ReportChartItem[];
  total: number;
  uniqueCustomers: number;
  totalPromised: number;
}

export interface CollectionForm {
  contactDate: string;
  contactMethod: string;
  reason: string;
  reasonDetail: string;
  note: string;
  promiseDate: string;
  promiseAmount: string;
  status: string;
  nextFollowUpDate: string;
}

// ---- Component Props ----

export interface SalesInvoicesClientProps {
  initialData: SalesInvoice[];
}

export interface SalesInvoicesViewProps {
  data: SalesInvoice[];
  loading: boolean;
  selected: SalesInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  openLines: (inv: SalesInvoice) => void;
}

export interface PurchaseInvoicesClientProps {
  initialData: PurchaseInvoice[];
}

export interface PurchaseInvoicesViewProps {
  data: PurchaseInvoice[];
  loading: boolean;
  selected: PurchaseInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  openLines: (inv: PurchaseInvoice) => void;
}

export interface AgedReceivablesClientProps {
  initialData: AgedReceivable[];
}

export interface AgedReceivablesViewProps {
  data: AgedReceivable[];
  loading: boolean;
}

export interface AgedPayablesClientProps {
  initialData: AgedPayable[];
}

export interface AgedPayablesViewProps {
  data: AgedPayable[];
  loading: boolean;
}

export interface TrialBalanceClientProps {
  initialData: TrialBalanceAccount[];
}

export interface TrialBalanceViewProps {
  data: TrialBalanceAccount[];
  loading: boolean;
}

export interface CollectionsClientProps {
  initialAr?: AgedReceivable[];
  initialFu?: ArFollowUp[];
}

export interface DisclosureHandle {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: () => void;
}

export interface CollectionsViewProps {
  loading: boolean;
  mergedData: MergedCollectionRow[];
  kpis: CollectionsKpis;
  selectedCustomer: MergedCollectionRow | null;
  form: CollectionForm;
  onFieldChange: (key: string, val: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  addModal: DisclosureHandle;
  historyModal: DisclosureHandle;
  onOpenAdd: (customer: MergedCollectionRow) => void;
  onOpenHistory: (customer: MergedCollectionRow) => void;
  customerHistory: ArFollowUp[];
  reportSince: string;
  onReportSinceChange: (val: string) => void;
  reportUntil: string;
  onReportUntilChange: (val: string) => void;
  reportData: ReportData;
  onReload: () => void;
  followUps: ArFollowUp[];
  aiAnalysis: string;
  aiLoading: boolean;
  runAiAnalysis: () => void;
}

export interface FinanceDashboardClientProps {
  initialTb: TrialBalanceAccount[];
  initialAr: AgedReceivable[];
  initialAp: AgedPayable[];
  initialSi: SalesInvoice[];
  initialPi: PurchaseInvoice[];
}
