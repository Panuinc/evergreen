// ============================================================
// Marketing Module — Type Definitions
// Field names = raw Supabase column names
// ============================================================

import type React from "react";

// ─── BC Sales Order ─────────────────────────────────────────

export interface MktSalesOrderLine {
  bcSalesOrderLineLineNo: string;
  bcSalesOrderLineLineNoValue: string;
  bcSalesOrderLineDescriptionValue: string;
  bcSalesOrderLineTypeValue: string;
  bcSalesOrderLineNoValue: string;
  bcSalesOrderLineQuantityValue: number;
  bcSalesOrderLineUnitOfMeasureCode: string;
  bcSalesOrderLineUnitPrice: number;
  bcSalesOrderLineLineDiscount: number;
  bcSalesOrderLineAmountIncludingVAT: number;
  bcSalesOrderLineQuantityValueShipped: number;
  bcSalesOrderLineOutstandingQuantity: number;
  _removedProjectName?: string;
}

export interface MktSalesOrder {
  bcSalesOrderNoValue: string;
  bcSalesOrderSellToCustomerNo: string;
  bcSalesOrderSellToCustomerName: string;
  bcSalesOrderSellToAddress: string | null;
  bcSalesOrderSellToCity: string | null;
  bcSalesOrderSellToPostCode: string | null;
  bcSalesOrderShipToName: string | null;
  bcSalesOrderShipToAddress: string | null;
  bcSalesOrderShipToCity: string | null;
  bcSalesOrderShipToPostCode: string | null;
  bcSalesOrderOrderDate: string;
  bcSalesOrderDueDate: string | null;
  bcSalesOrderExternalDocumentNo: string | null;
  bcSalesOrderStatus: string;
  bcSalesOrderCompletelyShipped: boolean;
  bcSalesOrderAmountIncludingVAT: number;
  isActive?: boolean;
  // Computed by backend
  totalAmount?: number;
  lines?: MktSalesOrderLine[];
}

// ─── BC Item (Stock) ────────────────────────────────────────

export interface MktStockItem {
  bcItemNo: string;
  bcItemDescription: string;
  bcItemUnitPrice: number | null;
  bcItemUnitCost: number | null;
  bcItemInventory: number | null;
  customPrice?: number | null;
}

// ─── Analytics ──────────────────────────────────────────────

export interface MktMonthlyTrend {
  month: string;       // "YYYY-MM"
  revenue: number;
  orders: number;
}

export interface MktDailyTrend {
  date: string;        // "YYYY-MM-DD"
  revenue: number;
  orders: number;
}

export interface MktRevenueByDayOfWeek {
  dayName: string;
  revenue: number;
  orders: number;
}

export interface MktTopCustomer {
  name: string;
  revenue: number;
  orders: number;
}

export interface MktTopSku {
  sku: string;
  description: string;
  revenue: number;
  quantity: number;
}

export interface MktOrderStatusDist {
  status: string;
  count: number;
  revenue: number;
}

export interface MktFulfillmentMetrics {
  totalQtyOrdered: number;
  totalQtyShipped: number;
  totalOutstanding: number;
  fulfillmentRate: number;
  ordersWithOutstanding: number;
}

export interface MktLocationDist {
  location: string;
  revenue: number;
  orders: number;
}

export interface MktOrderValueDist {
  label: string;
  count: number;
  revenue: number;
}

export interface MktSegmentItem {
  label: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface MktCustomerSegmentation {
  totalCustomers: number;
  byChannel: MktSegmentItem[];
  byGroup: MktSegmentItem[];
  byType: MktSegmentItem[];
}

export interface MktCustomerInsights {
  repeatCustomers: number;
  singleOrderCustomers: number;
  repeatCustomerRate: number;
  repeatCustomerRevenue: number;
  singleCustomerRevenue: number;
  top5ConcentrationPct: number;
}

export interface MktPeriodStats {
  revenue: number;
  orders: number;
}

export interface MktMonthlyComparisonMonth {
  month: string;
  revenue: number;
  orders: number;
  avgValue: number;
  shipRate: number;
  uniqueCustomers: number;
}

export interface MktMonthlyComparison {
  current: MktMonthlyComparisonMonth;
  previous: MktMonthlyComparisonMonth;
}

export interface MktYoYComparison {
  monthLabel: string;
  currentRevenue: number;
  previousRevenue: number;
  currentOrders: number;
  previousOrders: number;
}

export interface MktAnalyticsStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  shippedOrders: number;
  pendingOrders: number;
  dtd: MktPeriodStats;
  wtd: MktPeriodStats;
  mtd: MktPeriodStats;
  ytd: MktPeriodStats;
  wowGrowth: number | null;
  mtdGrowth: number | null;
  ytdGrowth: number | null;
  monthlyTrend: MktMonthlyTrend[];
  dailyTrend: MktDailyTrend[];
  revenueByDayOfWeek: MktRevenueByDayOfWeek[];
  orderStatusDist: MktOrderStatusDist[];
  fulfillmentMetrics: MktFulfillmentMetrics;
  locationDist: MktLocationDist[];
  orderValueDist: MktOrderValueDist[];
  monthlyComparison: MktMonthlyComparison;
  customerSegmentation: MktCustomerSegmentation;
  customerInsights: MktCustomerInsights;
  topCustomers: MktTopCustomer[];
  topSkus: MktTopSku[];
  yoyComparison: MktYoYComparison[];
}

// ─── Omnichannel — Contact ───────────────────────────────────

export interface MktContact {
  mktContactId: string;
  mktContactDisplayName: string;
  mktContactChannelType: string;
  mktContactExternalRef: string;
  mktContactAvatarUrl: string | null;
  mktContactTags: string[];
  mktContactNotes: string | null;
}

// ─── Omnichannel — Conversation ──────────────────────────────

export interface MktConversation {
  mktConversationId: string;
  mktConversationChannelType: string;
  mktConversationStatus: string;
  mktConversationLastMessageAt: string | null;
  mktConversationLastMessagePreview: string | null;
  mktConversationUnreadCount: number;
  mktConversationAiAutoReply: boolean;
  mktContact: MktContact;
}

// ─── Omnichannel — Message ───────────────────────────────────

export interface MktOcrData {
  amount?: number;
  fromBank?: string;
  toBank?: string;
  datetime?: string;
  reference?: string;
}

export interface MktMessage {
  mktMessageId: string;
  mktMessageConversationId: string;
  mktMessageSenderType: "agent" | "customer";
  mktMessageContent: string | null;
  mktMessageType: "text" | "image" | "file";
  mktMessageImageUrl: string | null;
  mktMessageIsAi: boolean;
  mktMessageOcrData: MktOcrData | null;
  mktMessageCreatedAt: string;
}

// ─── Omnichannel — Quotation ─────────────────────────────────

export interface MktQuotationLine {
  mktQuotationLineId: string;
  mktQuotationLineProductName: string;
  mktQuotationLineVariant: string | null;
  mktQuotationLineQuantity: number;
  mktQuotationLineUnitPrice: number;
  mktQuotationLineTotal?: number;
}

export interface MktQuotation {
  mktQuotationId: string;
  mktQuotationNumber: string;
  mktQuotationStatus: "draft" | "pending_approval" | "approved" | "rejected" | "paid";
  mktQuotationCustomerName: string | null;
  mktQuotationCustomerPhone: string | null;
  mktQuotationCustomerAddress: string | null;
  mktQuotationPaymentMethod: string | null;
  mktQuotationNotes: string | null;
  mktQuotationApprovalNote: string | null;
  mktQuotationCreatedAt: string;
  mktContact?: MktContact;
  lines?: MktQuotationLine[];
  paymentSlip?: MktMessage | null;
  isActive?: boolean;
}

// ─── Omnichannel — FollowUp ──────────────────────────────────

export interface MktFollowUp {
  mktFollowUpId: string;
  mktFollowUpStatus: "pending" | "done" | "cancelled";
  mktFollowUpScheduledAt: string;
  mktFollowUpMessage: string | null;
}

// ─── Omnichannel — Promotion ─────────────────────────────────

export interface MktPromotion {
  mktPromotionId: string;
  mktPromotionName: string;
  mktPromotionDescription: string | null;
  mktPromotionType: string;
  mktPromotionValue: number;
  mktPromotionMinQuantity: number;
  mktPromotionApplicableProducts: string[];
  mktPromotionStartDate: string | null;
  mktPromotionEndDate: string | null;
  mktPromotionIsActive: boolean;
}

// ─── Omnichannel — Related Products ─────────────────────────

export interface MktRelatedProduct {
  mktRelatedProductId: string;
  mktRelatedProductSourceItem: string;
  mktRelatedProductTargetItem: string;
  mktRelatedProductType: "cross_sell" | "upsell";
  mktRelatedProductReason: string | null;
}

// ─── Omnichannel — Product Info ─────────────────────────────

export interface MktProductInfo {
  mktProductInfoItemNumber: string;
  mktProductInfoDescription: string | null;
  mktProductInfoHighlights: string | null;
  mktProductInfoCategory: string | null;
}

// ─── AI Setting ─────────────────────────────────────────────

export interface MktAiSetting {
  mktAiSettingSystemPrompt: string | null;
  mktAiSettingMaxHistoryMessages: number | null;
  mktAiSettingBankAccountInfo: string | null;
  mktAiSettingShippingInfo: string | null;
  mktAiSettingAfterSalesInfo: string | null;
  mktAiSettingBrandStory: string | null;
}

// ─── Work Order ─────────────────────────────────────────────

export interface MktWorkOrder {
  mktWorkOrderId: string;
  mktWorkOrderNo: string;
  mktWorkOrderTitle: string;
  mktWorkOrderDescription: string | null;
  mktWorkOrderType: string;
  mktWorkOrderRequestedBy: string;
  mktWorkOrderAssignedTo: string | null;
  mktWorkOrderPriority: "low" | "medium" | "high" | "critical";
  mktWorkOrderStatus: "pending" | "approved" | "in_progress" | "review" | "completed" | "cancelled";
  mktWorkOrderProgress: number;
  mktWorkOrderStartDate: string | null;
  mktWorkOrderDueDate: string | null;
  mktWorkOrderNotes: string | null;
  isActive: boolean;
}

export interface MktWorkOrderProgressLog {
  id: string;
  mktWorkOrderProgressLogDescription: string;
  mktWorkOrderProgressLogProgress: number;
  mktWorkOrderProgressLogCreatedBy: string;
  mktWorkOrderProgressLogCreatedAt: string;
}

// ─── Props Interfaces ────────────────────────────────────────

export interface SalesOrdersClientProps {
  initialOrders: MktSalesOrder[];
}

export interface SalesOrdersViewProps {
  orders: MktSalesOrder[];
  loading: boolean;
  shipFilter: string;
  setShipFilter: (v: string) => void;
  reload: () => void;
  onNavigateToOrder: (no: string) => void;
}

export interface SalesOrderDetailViewProps {
  order: MktSalesOrder | null;
  customerPhone: string;
  loading: boolean;
  labelModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  onBack: () => void;
}

export interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: MktSalesOrder | null;
  customerPhone: string;
}

export interface AnalyticsClientProps {
  initialData: { stats: MktAnalyticsStats } | null;
}

export interface AnalyticsViewProps {
  stats: MktAnalyticsStats | null;
  loading: boolean;
  reload: () => void;
  period: string;
  setPeriod: (p: string) => void;
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  searchCustomRange: () => void;
}

export interface RevenueTrendChartProps {
  data: MktMonthlyTrend[];
}

export interface MonthlySalesChartProps {
  data: MktMonthlyTrend[];
}

export interface DailyTrendChartProps {
  data: MktDailyTrend[];
}

export interface RevenueByDayChartProps {
  data: MktRevenueByDayOfWeek[];
}

export interface TopCustomersChartProps {
  data: MktTopCustomer[];
}

export interface TopSkuChartProps {
  data: MktTopSku[];
}

export interface OrderStatusChartProps {
  data: MktOrderStatusDist[];
}

export interface FulfillmentChartProps {
  data: MktFulfillmentMetrics | null;
}

export interface LocationDistChartProps {
  data: MktLocationDist[];
}

export interface OrderValueDistChartProps {
  data: MktOrderValueDist[];
}

export interface MonthlyComparisonTableProps {
  data: MktMonthlyComparison | null;
}

export interface CustomerInsightsCardProps {
  data: MktCustomerInsights | null;
}

export interface ChannelDistChartProps {
  data: MktSegmentItem[];
}

export interface CustomerGroupChartProps {
  data: MktSegmentItem[];
}

export interface ProjectTypeChartProps {
  data: MktSegmentItem[];
}

export interface YoYComparisonChartProps {
  data: MktYoYComparison[];
}

export interface OmnichannelClientProps {
  // No initial data — all fetched client-side
}

export interface OmnichannelViewProps {
  conversations: MktConversation[];
  selectedConversation: MktConversation | null;
  messages: MktMessage[];
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  statusFilter: string;
  channelFilter: string;
  searchQuery: string;
  setStatusFilter: (v: string) => void;
  setChannelFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
  selectConversation: (conv: MktConversation | null) => void;
  sendMessage: (content: string) => void;
  updateStatus: (conversationId: string, status: string) => void;
  updateContact: (contactId: string, updates: Partial<MktContact>) => void;
  deleteConversation: (conversationId: string) => void;
  suggestLoading: boolean;
  suggestedText: string;
  toggleAiAutoReply: (conversationId: string, enabled: boolean) => void;
  suggestReply: () => void;
  logNote: (content: string) => void;
}

export interface ConversationListProps {
  conversations: MktConversation[];
  selectedConversation: MktConversation | null;
  loading: boolean;
  statusFilter: string;
  channelFilter: string;
  searchQuery: string;
  onStatusFilterChange: (v: string) => void;
  onChannelFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onSelect: (conv: MktConversation) => void;
}

export interface ConversationDetailProps {
  conversation: MktConversation;
  onUpdateContact: (contactId: string, updates: Partial<MktContact>) => void;
  onClose: () => void;
}

export interface ChatWindowProps {
  conversation: MktConversation;
  messages: MktMessage[];
  messagesLoading: boolean;
  sending: boolean;
  onSendMessage: (content: string) => void;
  onUpdateStatus: (conversationId: string, status: string) => void;
  onDelete: (conversationId: string) => void;
  onBack?: () => void;
  onToggleDetail: () => void;
  onToggleAiAutoReply: (conversationId: string, enabled: boolean) => void;
  onSuggestReply: () => void;
  suggestLoading: boolean;
  suggestedText: string;
  onLogNote: (content: string) => void;
}

export interface MessageInputProps {
  onSend: (content: string) => void;
  onSuggest?: () => void;
  sending: boolean;
  suggestLoading: boolean;
  disabled: boolean;
  suggestedText: string;
}

export interface ChannelBadgeProps {
  channelType: string;
  size?: "sm" | "md" | "lg";
}

export interface ChannelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface QuotationsClientProps {
  initialQuotations: MktQuotation[];
}

export interface OmnichannelQuotationsViewProps {
  quotations: MktQuotation[];
  loading: boolean;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onNavigateToQuotation: (id: string) => void;
}

export interface OmnichannelQuotationEditorViewProps {
  id: string | string[];
  quotation: MktQuotation | null;
  setQuotation: React.Dispatch<React.SetStateAction<MktQuotation | null>>;
  lines: MktQuotationLine[];
  loading: boolean;
  saving: boolean;
  updateLine: (index: number, field: keyof MktQuotationLine, value: string | number) => void;
  calcTotal: () => number;
  handleSave: () => void;
  handleAction: (action: string, note?: string) => void;
  onBack: () => void;
}

export interface StockItemsClientProps {
  initialItems: MktStockItem[];
  initialProductInfo: MktProductInfo[];
  initialPromotions: MktPromotion[];
}

export interface StockItemsViewProps {
  items: MktStockItem[];
  loading: boolean;
  prices: Record<string, string | number>;
  updatePrice: (number: string, value: string) => void;
  productInfoMap: Record<string, { category?: string; highlights?: string; description?: string }>;
  updateProductInfo: (number: string, field: string, value: string) => void;
  saveAllProductInfo?: () => Promise<void>;
  promotions?: MktPromotion[];
}

export interface PromotionsClientProps {
  initialPromotions: MktPromotion[];
  initialStockItems: MktStockItem[];
}

export interface PromotionsViewProps {
  promotions: MktPromotion[];
  loading: boolean;
  stockItems: MktStockItem[];
  onAdd: (data: Omit<MktPromotion, "mktPromotionId">) => Promise<MktPromotion>;
  onUpdate: (id: string, data: Partial<MktPromotion>) => Promise<MktPromotion>;
  onDelete: (id: string) => Promise<void>;
}

export interface RelatedProductsClientProps {
  initialRelatedProducts: MktRelatedProduct[];
  initialStockItems: MktStockItem[];
}

export interface RelatedProductsViewProps {
  relatedProducts: MktRelatedProduct[];
  loading: boolean;
  stockItems: MktStockItem[];
  onAdd: (data: { sourceItem: string; targetItem: string; type: string; reason: string | null }) => Promise<MktRelatedProduct>;
  onDelete: (id: string) => Promise<void>;
}

export type WorkOrderFormData = {
  mktWorkOrderTitle: string;
  mktWorkOrderDescription: string;
  mktWorkOrderType: string;
  mktWorkOrderRequestedBy: string;
  mktWorkOrderAssignedTo: string;
  mktWorkOrderPriority: string;
  mktWorkOrderStatus: string;
  mktWorkOrderProgress: string;
  mktWorkOrderStartDate: string;
  mktWorkOrderDueDate: string;
  mktWorkOrderNotes: string;
};

export type WorkOrderProgressForm = {
  mktWorkOrderProgressLogDescription: string;
  mktWorkOrderProgressLogProgress: string;
  mktWorkOrderProgressLogCreatedBy: string;
};

export interface HrEmployee {
  hrEmployeeId: string;
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeUserId: string | null;
  hrEmployeeEmail: string | null;
}

export interface WorkOrdersViewProps {
  workOrders: MktWorkOrder[];
  employees: HrEmployee[];
  loading: boolean;
  saving: boolean;
  editingWorkOrder: MktWorkOrder | null;
  formData: WorkOrderFormData;
  validationErrors: Record<string, string>;
  deletingWorkOrder: MktWorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (workOrder?: MktWorkOrder | null) => void;
  handleSave: () => void;
  confirmDelete: (workOrder: MktWorkOrder) => void;
  handleDelete: () => void;
  progressModal: { isOpen: boolean; onOpen: () => void; onClose: () => void };
  selectedWorkOrder: MktWorkOrder | null;
  progressLogs: MktWorkOrderProgressLog[];
  progressLoading: boolean;
  progressSaving: boolean;
  progressForm: WorkOrderProgressForm;
  openProgress: (workOrder: MktWorkOrder) => void;
  handleAddProgress: () => void;
  updateProgressField: (field: string, value: string) => void;
  toggleActive: (item: MktWorkOrder) => void;
}

export interface ImageGenResult {
  generatedImageUrl: string;
}

export interface ImageGenBatchResult {
  file: string;
  status: "success" | "error";
  generatedImageUrl?: string;
  error?: string;
}

export interface ImageGenHistoryItem {
  mktGeneratedImageId: string;
  mktGeneratedImageOriginalUrl: string;
  mktGeneratedImageResultUrl: string;
  mktGeneratedImagePrompt: string;
  mktGeneratedImageCreatedAt: string;
}

export interface ImageGeneratorViewProps {
  generate: (imageFile: File, prompt: string, size?: string) => Promise<ImageGenResult | null>;
  generateBatch: (imageFiles: File[], prompt: string, size?: string) => Promise<void>;
  generating: boolean;
  result: ImageGenResult | null;
  batchResults: ImageGenBatchResult[];
  batchProgress: { current: number; total: number };
  reset: () => void;
  history: ImageGenHistoryItem[];
  loadHistory: (limit?: number) => Promise<void>;
  loadingHistory: boolean;
}

// ─── Label Designer ──────────────────────────────────────────

export interface LabelDesign {
  labelDesignId?: string;
  labelDesignName: string;
  labelDesignWidth: number;
  labelDesignHeight: number;
  labelDesignPreset: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelDesignElements: any[];
}

export interface LabelDesignerClientProps {
  initialDesigns: LabelDesign[];
}

export interface LabelDesignerViewProps {
  savedDesigns: LabelDesign[];
  designsLoading: boolean;
  onSaveDesign: (design: {
    id?: string;
    name: string;
    labelSize: { width: number; height: number };
    labelPreset: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[];
  }) => Promise<LabelDesign>;
  onDeleteDesign: (id: string) => Promise<void>;
}

// ─── Shipping Label ──────────────────────────────────────────

export interface ShippingLabelClientProps {
  orderNo: string;
}

export interface ShippingLabelDocumentProps {
  orderNo: string;
}
