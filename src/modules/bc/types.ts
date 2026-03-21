// BC Module — TypeScript type definitions
// Field names = raw Supabase column names (no AS alias)

// ─── bcCustomer ──────────────────────────────────────────────────────────────
export interface BcCustomer {
  bcCustomerId: string;
  bcCustomerNo: string;
  bcCustomerNameValue: string;
  bcCustomerContact: string | null;
  bcCustomerPhoneNo: string | null;
  bcCustomerSalespersonCode: string | null;
  bcCustomerBalanceDueLCY: number | null;
}

// ─── bcItem ───────────────────────────────────────────────────────────────────
export interface BcItem {
  bcItemId: string;
  bcItemNo: string;
  bcItemDescription: string;
  bcItemType: string | null;
  bcItemInventory: number | null;
  bcItemUnitPrice: number | null;
  bcItemUnitCost: number | null;
  bcItemItemCategoryCode: string | null;
  bcItemGenProdPostingGroup: string | null;
  bcItemBlocked: boolean | null;
}

// ─── bcSalesOrderLine (nested in bcSalesOrder) ────────────────────────────────
export interface BcSalesOrderLine {
  bcSalesOrderLineId: string;
  bcSalesOrderLineLineNo: number;
  bcSalesOrderLineNoValue: string | null;
  bcSalesOrderLineDescriptionValue: string | null;
  bcSalesOrderLineQuantityValue: number | null;
  bcSalesOrderLineUnitPrice: number | null;
  bcSalesOrderLineAmountValue: number | null;
}

// ─── bcSalesOrder ─────────────────────────────────────────────────────────────
// salesOrderLines = LATERAL json_agg computed field (no raw column → descriptive camelCase)
export interface BcSalesOrder {
  bcSalesOrderId: string;
  bcSalesOrderNoValue: string;
  bcSalesOrderOrderDate: string | null;
  bcSalesOrderSellToCustomerName: string | null;
  bcSalesOrderStatus: string | null;
  bcSalesOrderAmountIncludingVAT: number | null;
  salesOrderLines: BcSalesOrderLine[];
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface BcCustomersViewProps {
  customers: BcCustomer[];
  loading: boolean;
}

export interface BcItemsViewProps {
  items: BcItem[];
  loading: boolean;
}

export interface BcSalesOrdersViewProps {
  salesOrders: BcSalesOrder[];
  loading: boolean;
  selectedOrder: BcSalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  openLines: (order: BcSalesOrder) => void;
}

export interface BcSalesOrdersClientProps {
  initialSalesOrders: BcSalesOrder[];
}
