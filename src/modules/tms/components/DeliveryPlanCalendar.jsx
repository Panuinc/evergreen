"use client";

import { Tabs, Tab, Button, Chip} from "@heroui/react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useDeliveryPlans } from "@/modules/tms/hooks/useDeliveryPlans";
import DeliveryPlanModal from "./DeliveryPlanModal";
import Loading from "@/components/ui/Loading";

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const STATUS_COLORS = {
  planned: "primary",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
};

const PRIORITY_DOT = {
  urgent: "bg-danger-500",
  high: "bg-warning-500",
  normal: "bg-primary-400",
  low: "bg-default-400",
};

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isToday(date) {
  const t = new Date();
  return (
    date.getFullYear() === t.getFullYear() &&
    date.getMonth() === t.getMonth() &&
    date.getDate() === t.getDate()
  );
}

// --- Month View ---
function MonthView({ currentDate, getPlansForDate, onDateClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 min-w-125">
        {DAYS_TH.map((d, i) => (
          <div
            key={d}
            className={`text-center text-sm font-light py-2 ${
              i === 0 ? "text-danger-500" : i === 6 ? "text-primary-500" : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Rows */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 gap-1 min-w-125">
          {row.map((date, ci) => {
            if (!date)
              return <div key={ci} className="h-24 rounded-xl" />;
            const dateStr = toDateString(date);
            const plans = getPlansForDate(dateStr);
            const today = isToday(date);
            return (
              <button
                key={ci}
                onClick={() => onDateClick(date)}
                className={`h-24 rounded-xl border p-1.5 flex flex-col gap-0.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 overflow-hidden ${
                  today
                    ? "border-primary-400 bg-primary-50"
                    : plans.length > 0
                    ? "border-border"
                    : "border-border"
                }`}
              >
                <span
                  className={`text-sm font-light w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                    today
                      ? "bg-primary text-white"
                      : ci === 0
                      ? "text-danger-500"
                      : ci === 6
                      ? "text-primary-500"
                      : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                  {plans.slice(0, 2).map((p) => (
                    <div
                      key={p.tmsDeliveryPlanId}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-light flex items-center gap-1 ${
                        p.tmsDeliveryPlanStatus === "planned"
                          ? "bg-primary-100 text-primary-700"
                          : p.tmsDeliveryPlanStatus === "in_progress"
                          ? "bg-warning-100 text-warning-700"
                          : p.tmsDeliveryPlanStatus === "completed"
                          ? "bg-success-100 text-success-700"
                          : "bg-default-100 text-foreground"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          PRIORITY_DOT[p.tmsDeliveryPlanPriority] || PRIORITY_DOT.normal
                        }`}
                      />
                      <span className="truncate">
                        {p.tmsDeliveryPlanItem?.[0]?.tmsDeliveryPlanItemSalesOrderNo || "แผนส่ง"}
                      </span>
                    </div>
                  ))}
                  {plans.length > 2 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{plans.length - 2} อื่นๆ
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Week View ---
function WeekView({ currentDate, getPlansForDate, onDateClick }) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-2 min-w-125">
        {days.map((date, i) => {
          const dateStr = toDateString(date);
          const plans = getPlansForDate(dateStr);
          const today = isToday(date);
          return (
            <div key={i} className="flex flex-col gap-2">
              {/* Day header */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`text-sm font-light ${
                    i === 0 ? "text-danger-500" : i === 6 ? "text-primary-500" : "text-muted-foreground"
                  }`}
                >
                  {DAYS_TH[i]}
                </span>
                <span
                  className={`text-sm font-light w-8 h-8 flex items-center justify-center rounded-full ${
                    today ? "bg-primary text-white" : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              {/* Plans */}
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                {plans.map((p) => (
                  <div
                    key={p.tmsDeliveryPlanId}
                    className={`p-2 rounded-xl border-l-4 border text-sm cursor-pointer hover:opacity-80 shrink-0 ${
                      p.tmsDeliveryPlanStatus === "planned"
                        ? "bg-primary-50 border-primary-200"
                        : p.tmsDeliveryPlanStatus === "in_progress"
                        ? "bg-warning-50 border-warning-200"
                        : p.tmsDeliveryPlanStatus === "completed"
                        ? "bg-success-50 border-success-200"
                        : "bg-default-50 border-border"
                    } ${
                      p.tmsDeliveryPlanPriority === "urgent"
                        ? "border-l-danger-500"
                        : p.tmsDeliveryPlanPriority === "high"
                        ? "border-l-warning-500"
                        : p.tmsDeliveryPlanPriority === "low"
                        ? "border-l-default-400"
                        : "border-l-primary-400"
                    }`}
                    onClick={() => onDateClick(date)}
                  >
                    <p className="font-light truncate">
                      {p.tmsDeliveryPlanItem?.[0]?.tmsDeliveryPlanItemSalesOrderNo || "แผนส่ง"}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {p.tmsDeliveryPlanItem?.[0]?.tmsDeliveryPlanItemCustomerName}
                    </p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Chip
                        size="sm"
                        color={STATUS_COLORS[p.tmsDeliveryPlanStatus]}
                        variant="flat"
                      >
                        {p.tmsDeliveryPlanItem?.length || 0} รายการ
                      </Chip>
                      {p.tmsDeliveryPlanPriority && p.tmsDeliveryPlanPriority !== "normal" && (
                        <Chip
                          size="sm"
                          color={
                            p.tmsDeliveryPlanPriority === "urgent"
                              ? "danger"
                              : p.tmsDeliveryPlanPriority === "high"
                              ? "warning"
                              : "default"
                          }
                          variant="flat"
                        >
                          {p.tmsDeliveryPlanPriority === "urgent"
                            ? "ด่วนมาก"
                            : p.tmsDeliveryPlanPriority === "high"
                            ? "ด่วน"
                            : "ต่ำ"}
                        </Chip>
                      )}
                    </div>
                  </div>
                ))}
                {/* Add button */}
                <button
                  onClick={() => onDateClick(date)}
                  className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary-300 hover:text-primary-500 transition-colors shrink-0"
                >
                  + เพิ่มแผน
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function DeliveryPlanCalendar() {
  const {
    loading,
    saving,
    currentDate,
    viewMode,
    setViewMode,
    selectedDate,
    isModalOpen,
    editingPlan,
    salesOrders,
    soLoading,
    selectedSO,
    soLines,
    soLinesLoading,
    goToPrev,
    goToNext,
    goToToday,
    handleDateClick,
    handleEditPlan,
    closeModal,
    searchSalesOrders,
    selectSalesOrder,
    handleSave,
    handleDelete,
    getPlansForDate,
  } = useDeliveryPlans();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Title for week view
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const title =
    viewMode === "month"
      ? `${MONTHS_TH[month]} ${year + 543}`
      : `${startOfWeek.getDate()} – ${endOfWeek.getDate()} ${MONTHS_TH[endOfWeek.getMonth()]} ${endOfWeek.getFullYear() + 543}`;

  // Plans on selected date
  const dateStr = editingPlan
    ? editingPlan.tmsDeliveryPlanDate
    : selectedDate
    ? toDateString(selectedDate)
    : "";
  const plansOnDate = dateStr ? getPlansForDate(dateStr) : [];

  return (
    <div className="flex flex-col w-full gap-4 p-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-primary" />
          <p className="text-sm font-light">แผนส่งของ</p>
        </div>
        <Tabs
          selectedKey={viewMode}
          onSelectionChange={(k) => setViewMode(k)}
          size="sm"
          variant="flat"
        >
          <Tab key="month" title="รายเดือน" />
          <Tab key="week" title="รายสัปดาห์" />
        </Tabs>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" isIconOnly onPress={goToPrev}>
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" variant="flat" isIconOnly onPress={goToNext}>
            <ChevronRight size={16} />
          </Button>
          <Button size="sm" variant="flat" onPress={goToToday}>
            วันนี้
          </Button>
        </div>
        <p className="text-sm font-light">{title}</p>
        {loading && <Loading />}
      </div>

      {/* Calendar */}
      {viewMode === "month" ? (
        <MonthView
          currentDate={currentDate}
          getPlansForDate={getPlansForDate}
          onDateClick={handleDateClick}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          getPlansForDate={getPlansForDate}
          onDateClick={handleDateClick}
        />
      )}

      {/* Modal */}
      <DeliveryPlanModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedDate={selectedDate}
        editingPlan={editingPlan}
        plansOnDate={plansOnDate}
        salesOrders={salesOrders}
        soLoading={soLoading}
        selectedSO={selectedSO}
        soLines={soLines}
        soLinesLoading={soLinesLoading}
        saving={saving}
        onSearchSO={searchSalesOrders}
        onSelectSO={selectSalesOrder}
        onSave={handleSave}
        onDelete={handleDelete}
        onEditPlan={handleEditPlan}
      />
    </div>
  );
}
