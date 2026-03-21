// ============================================================
// TMS Module Types
// Field names = raw Supabase column names (ไม่มี AS alias)
// Aggregate/computed fields ใช้ชื่อตาม naming rules
// ============================================================

// ──────────────────────────────────────────────
// Core entity types
// ──────────────────────────────────────────────

export interface TmsVehicle {
  tmsVehicleId: string;
  tmsVehiclePlateNumber: string;
  tmsVehicleName: string | null;
  tmsVehicleCapacityKg: number | null;
  tmsVehicleWidth: number | null;
  tmsVehicleLength: number | null;
  tmsVehicleHeight: number | null;
  tmsVehicleFuelType: string | null;
  tmsVehicleFuelConsumptionRate: number | null;
  tmsVehicleStatus: "available" | "in_use" | "maintenance" | "retired";
  tmsVehicleForthtrackRef: string | null;
  isActive: boolean;
}

export interface TmsShipment {
  tmsShipmentId: string;
  tmsShipmentNumber: string;
  tmsShipmentDate: string | null;
  tmsShipmentCustomerName: string;
  tmsShipmentCustomerPhone: string | null;
  tmsShipmentCustomerAddress: string | null;
  tmsShipmentDestination: string;
  tmsShipmentVehicleId: string | null;
  tmsShipmentDriverId: string | null;
  tmsShipmentDriverWage: number | null;
  tmsShipmentAssistantId: string | null;
  tmsShipmentAssistantWage: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tmsShipmentAssistants: { id: string; wage: number }[] | null;
  tmsShipmentSalesOrderRef: string | null;
  tmsShipmentItemsSummary: string | null;
  tmsShipmentDistance: number | null;
  tmsShipmentFuelPricePerLiter: number | null;
  tmsShipmentFuelCost: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tmsShipmentExtras: any[] | null;
  tmsShipmentNotes: string | null;
  tmsShipmentStatus: string;
  tmsShipmentEstimatedArrival: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tmsShipmentStops: any | null;
  isActive: boolean;
}

export interface TmsDelivery {
  tmsDeliveryId: string;
  tmsDeliveryShipmentId: string;
  tmsDeliveryReceiverName: string | null;
  tmsDeliveryReceiverPhone: string | null;
  tmsDeliveryStatus: string;
  tmsDeliveryNotes: string | null;
  tmsDeliverySignatureUrl: string | null;
  tmsDeliveryPhotoUrls: string[] | null;
  tmsDeliveryReceivedAt: string | null;
  tmsShipment?: Pick<TmsShipment, "tmsShipmentId" | "tmsShipmentNumber" | "tmsShipmentCustomerName">;
  tmsDeliveryItem?: TmsDeliveryItem[];
}

export interface TmsDeliveryItem {
  tmsDeliveryItemId?: string;
  tmsDeliveryItemDescription: string;
  tmsDeliveryItemUom: string;
  tmsDeliveryItemSoNo: string;
  tmsDeliveryItemPlannedQty: number;
  tmsDeliveryItemDeliveredQty: number;
  tmsDeliveryItemDamagedQty: number;
  tmsDeliveryItemReturnedQty: number;
  tmsDeliveryItemDamageNotes: string;
}

export interface TmsFuelLog {
  tmsFuelLogId: string;
  tmsFuelLogVehicleId: string;
  tmsFuelLogDate: string | null;
  tmsFuelLogFuelType: string | null;
  tmsFuelLogLiters: number | null;
  tmsFuelLogPricePerLiter: number | null;
  tmsFuelLogTotalCost: number | null;
  tmsFuelLogReceiptUrl: string | null;
  isActive: boolean;
}

export interface TmsDeliveryPlan {
  tmsDeliveryPlanId: string;
  tmsDeliveryPlanDate: string | null;
  tmsDeliveryPlanAddress: string | null;
  tmsDeliveryPlanStatus: string;
  tmsDeliveryPlanPriority: string | null;
  tmsDeliveryPlanShipmentId: string | null;
  tmsDeliveryPlanShipmentNumber: string | null;
  tmsDeliveryPlanItem?: TmsDeliveryPlanItem[];
}

export interface TmsDeliveryPlanItem {
  tmsDeliveryPlanItemId: string;
  tmsDeliveryPlanItemDescription: string | null;
  tmsDeliveryPlanItemUom: string | null;
  tmsDeliveryPlanItemSalesOrderNo: string | null;
  tmsDeliveryPlanItemCustomerName: string | null;
  tmsDeliveryPlanItemCustomerPhone: string | null;
  tmsDeliveryPlanItemPlannedQty: number | null;
}

export interface TmsGpsLog {
  tmsGpsLogId?: string;
  tmsGpsLogVehicleId: string;
  tmsGpsLogLatitude: number;
  tmsGpsLogLongitude: number;
  tmsGpsLogSpeed: number | null;
  tmsGpsLogRecordedAt: string;
  tmsGpsLogSource: string;
  // Forth Track extended fields (computed/merged at runtime)
  ftGpsId?: string | null;
  ftEngine?: string | null;
  ftDriver?: string | null;
  ftAddress?: string | null;
  ftFuel?: number | null;
  ftTemperature?: number | null;
  ftCOG?: number | null;
  ftPowerStatus?: string | null;
  ftExternalBatt?: string | null;
  ftPositionSource?: string | null;
  ftPoi?: string | null;
  ftGPS?: string | null;
  ftGPRS?: string | null;
  ftVehicleType?: string | null;
  ftVehicleName?: string | null;
  ftPlateNumber?: string | null;
}

// ──────────────────────────────────────────────
// Dashboard types
// Aggregate/computed fields — ใช้ชื่อตาม naming rules
//   simple aggregate → source column name (tmsShipmentCount, tmsShipmentDistance, tmsFuelLogTotalCost)
//   Go computed → descriptive camelCase (estimatedLiters, estimatedFuelCost, actualRate)
//   to_char → descriptive (month)
// ──────────────────────────────────────────────

/** รายการ monthly trend สำหรับ MonthlyShipmentChart */
export interface TmsMonthlyShipment {
  month: string;                 // to_char result — descriptive name
  tmsShipmentCount: number;      // COUNT(*) AS "tmsShipmentCount"
}

/** รายการ fuel cost trend สำหรับ FuelCostChart */
export interface TmsFuelCostTrend {
  month: string;                 // to_char result
  tmsFuelLogTotalCost: number;   // SUM("tmsFuelLogTotalCost") AS "tmsFuelLogTotalCost"
}

/** รายการ status distribution สำหรับ ShipmentStatusChart */
export interface TmsShipmentStatusDist {
  tmsShipmentStatus: string;     // raw column — renamed from "status"
  tmsShipmentCount: number;      // COUNT(*) AS "tmsShipmentCount"
}

/** vehicle utilization (30 วัน) สำหรับ VehicleUtilizationChart */
export interface TmsVehicleUtilization {
  tmsVehicleId: string;
  tmsVehicleName: string | null;
  tmsVehiclePlateNumber: string;
  tmsShipmentCount: number;      // COUNT(DISTINCT shipmentId)
}

/** vehicle performance สำหรับ VehiclePerformanceTable */
export interface TmsVehiclePerformance {
  tmsVehicleId: string;
  tmsVehicleName: string | null;
  tmsVehiclePlateNumber: string;
  tmsVehicleStatus: string;
  tmsVehicleFuelConsumptionRate: number | null;
  tmsShipmentCount: number;               // COUNT trips
  tmsShipmentDistance: number;            // SUM distance
  estimatedLiters: number;                // Go computed
  estimatedFuelCost: number;              // Go computed
  actualFuelLiters: number;               // SUM from fuelLogs
  actualFuelCost: number;                 // SUM from fuelLogs
  actualRate: number | null;              // Go computed km/L
}

/** Dashboard stats object */
export interface TmsDashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  totalShipments: number;
  activeShipments: number;
  completedThisMonth: number;
  totalFuelCostThisMonth: number;
  shipmentStatusDistribution: TmsShipmentStatusDist[];
  monthlyShipmentTrend: TmsMonthlyShipment[];
  fuelCostTrend: TmsFuelCostTrend[];
  vehicleUtilization: TmsVehicleUtilization[];
  vehiclePerformance: TmsVehiclePerformance[];
  compareMode?: string | null;
  labels?: { current: string; previous: string };
  current?: Omit<TmsDashboardStats, "compareMode" | "labels" | "current" | "previous">;
  previous?: Omit<TmsDashboardStats, "compareMode" | "labels" | "current" | "previous">;
  completedInPeriod?: number;
  fuelCostInPeriod?: number;
}

// ──────────────────────────────────────────────
// Form data types
// ──────────────────────────────────────────────

export interface TmsVehicleForm {
  tmsVehiclePlateNumber: string;
  tmsVehicleCapacityKg: string;
  tmsVehicleWidth: string;
  tmsVehicleLength: string;
  tmsVehicleHeight: string;
  tmsVehicleFuelType: string;
  tmsVehicleStatus: string;
  tmsVehicleFuelConsumptionRate: string;
  tmsVehicleForthtrackRef: string;
}

export interface TmsFuelLogForm {
  tmsFuelLogVehicleId: string;
  tmsFuelLogDate: string;
  tmsFuelLogFuelType: string;
  tmsFuelLogLiters: string;
  tmsFuelLogPricePerLiter: string;
  tmsFuelLogReceiptUrl: string;
}

export interface TmsDeliveryForm {
  tmsDeliveryShipmentId: string;
  tmsDeliveryReceiverName: string;
  tmsDeliveryReceiverPhone: string;
  tmsDeliveryStatus: string;
  tmsDeliveryNotes: string;
  tmsDeliverySignatureUrl: string;
  tmsDeliveryPhotoUrls: string[];
}

export interface TmsGpsLogForm {
  tmsGpsLogVehicleId: string;
  tmsGpsLogLatitude: string;
  tmsGpsLogLongitude: string;
  tmsGpsLogSpeed: string;
  tmsGpsLogSource: string;
}

// ──────────────────────────────────────────────
// Component Props interfaces
// ──────────────────────────────────────────────

export interface DashboardViewProps {
  stats: TmsDashboardStats | null;
  loading: boolean;
  compareMode: string | null;
  setCompareMode: (mode: string | null) => void;
  aiAnalysis: string;
  aiLoading: boolean;
  runAiAnalysis: () => void;
}

export interface VehiclesViewProps {
  vehicles: TmsVehicle[];
  loading: boolean;
  saving: boolean;
  editingVehicle: TmsVehicle | null;
  formData: TmsVehicleForm;
  validationErrors: Record<string, string>;
  deletingVehicle: TmsVehicle | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (vehicle?: TmsVehicle | null) => void;
  handleSave: () => void;
  confirmDelete: (vehicle: TmsVehicle) => void;
  handleDelete: () => void;
  toggleActive: (item: TmsVehicle) => void;
}

export interface ShipmentsViewProps {
  shipments: TmsShipment[];
  vehicles: TmsVehicle[];
  employees: unknown[];
  loading: boolean;
  saving: boolean;
  editingShipment: TmsShipment | null;
  formData: Partial<TmsShipment> & Record<string, unknown>;
  deletingShipment: TmsShipment | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onClose: () => void };
  updateField: (field: string, value: unknown) => void;
  handleOpen: (shipment?: TmsShipment | null) => void;
  handleSave: () => void;
  confirmDelete: (shipment: TmsShipment) => void;
  handleDelete: () => void;
  handleStatusChange: (id: string, status: string) => void;
  toggleActive: (item: TmsShipment) => void;
  deliveryPlans: TmsDeliveryPlan[];
  plansLoading: boolean;
  selectedPlanIds: string[];
  togglePlanSelection: (planId: string) => void;
  shipmentStops: unknown[];
  shipmentItems: unknown[];
  updateItemActualQty: (itemId: string, value: string) => void;
  distanceLoading: boolean;
  addExtra: () => void;
  updateExtra: (index: number, field: string, value: unknown) => void;
  removeExtra: (index: number) => void;
  routeResult: unknown | null;
  routeAiAnalysis: string;
  routeLoading: boolean;
  optimizeRoute: () => void;
  clearRouteResult: () => void;
}

export interface FuelLogsViewProps {
  fuelLogs: TmsFuelLog[];
  vehicles: TmsVehicle[];
  loading: boolean;
  saving: boolean;
  editingFuelLog: TmsFuelLog | null;
  formData: TmsFuelLogForm;
  deletingFuelLog: TmsFuelLog | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onClose: () => void };
  updateField: (field: string, value: string) => void;
  handleOpen: (fuelLog?: TmsFuelLog | null) => void;
  handleSave: () => void;
  confirmDelete: (fuelLog: TmsFuelLog) => void;
  handleDelete: () => void;
  toggleActive: (item: TmsFuelLog) => void;
}

export interface DeliveriesViewProps {
  deliveries: TmsDelivery[];
  shipments: TmsShipment[];
  loading: boolean;
  saving: boolean;
  editingDelivery: TmsDelivery | null;
  formData: TmsDeliveryForm;
  deletingDelivery: TmsDelivery | null;
  isOpen: boolean;
  onClose: () => void;
  deleteModal: { isOpen: boolean; onClose: () => void };
  updateField: (field: string, value: unknown) => void;
  handleOpen: (delivery?: TmsDelivery | null) => void;
  handleSave: () => void;
  confirmDelete: (delivery: TmsDelivery) => void;
  handleDelete: () => void;
  deliveryItems: TmsDeliveryItem[];
  updateDeliveryItem: (index: number, field: string, value: unknown) => void;
}

export interface VehiclePerformanceTableProps {
  data: TmsVehiclePerformance[];
}

export interface VehicleUtilizationChartProps {
  data: TmsVehicleUtilization[];
}

export interface MonthlyShipmentChartProps {
  data: TmsMonthlyShipment[];
}

export interface FuelCostChartProps {
  data: TmsFuelCostTrend[];
}

export interface ShipmentStatusChartProps {
  data: TmsShipmentStatusDist[];
}

export interface TrackingViewProps {
  positions: TmsGpsLog[];
  vehicles: TmsVehicle[];
  loading: boolean;
  saving: boolean;
  selectedVehicle: TmsVehicle | null;
  formData: TmsGpsLogForm;
  validationErrors: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  updateField: (field: string, value: string) => void;
  handleOpenManualUpdate: (vehicle?: TmsVehicle | null) => void;
  handleSavePosition: () => void;
  loadData: () => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  routeHistory: TmsGpsLog[];
  loadingRoute: boolean;
  routeModal: { isOpen: boolean; onClose: () => void; onOpen: () => void };
  loadRouteHistory: (vehicleId: string, date?: string) => void;
  selectedDate: string;
  handleDateChange: (date: string) => void;
}
