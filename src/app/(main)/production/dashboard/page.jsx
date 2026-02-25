"use client";

import { useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import { useProductionDashboard } from "@/hooks/production/useProductionDashboard";
import DataTable from "@/components/ui/DataTable";
import OrdersByStatusChart from "@/components/charts/OrdersByStatusChart";
import CostByProjectChart from "@/components/charts/CostByProjectChart";
import DailyProductionTrendChart from "@/components/charts/DailyProductionTrendChart";
import TopOutputItemsChart from "@/components/charts/TopOutputItemsChart";
import WipByOrderChart from "@/components/charts/WipByOrderChart";
import TopConsumedItemsChart from "@/components/charts/TopConsumedItemsChart";
import CostByDepartmentChart from "@/components/charts/CostByDepartmentChart";
import OnTimeTrendChart from "@/components/charts/OnTimeTrendChart";
import LeadTimeTrendChart from "@/components/charts/LeadTimeTrendChart";
import EmployeeSpecializationChart from "@/components/charts/EmployeeSpecializationChart";
import FgOutputBreakdownChart from "@/components/charts/FgOutputBreakdownChart";
import ProfitByItemChart from "@/components/charts/ProfitByItemChart";
import ProfitByProjectSection from "@/components/charts/ProfitByProjectSection";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function KpiCard({ title, value, unit, color = "default", subtitle }) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    default: "",
  };
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="gap-1">
        <p className="text-xs text-default-500">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-bold ${colorClass[color] || ""}`}>
            {value}
          </p>
          {unit && <span className="text-xs text-default-400">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-default-400">{subtitle}</p>
        )}
      </CardBody>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="pb-0">
        <p className="text-sm font-semibold">{title}</p>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ── Overdue Orders DataTable config ──
const overdueColumns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "id", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "สินค้า (Source No)", uid: "sourceNo", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "กำหนดส่ง", uid: "dueDate", sortable: true },
  { name: "เริ่มผลิต", uid: "startingDateTime", sortable: true },
  { name: "เกินกำหนด", uid: "overdueDays", sortable: true },
  { name: "แผนก", uid: "dimension1Name", sortable: true },
  { name: "โครงการ", uid: "dimension2Name", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
];

const overdueInitialColumns = [
  "id",
  "description",
  "sourceNo",
  "quantity",
  "dueDate",
  "overdueDays",
  "dimension1Name",
  "dimension2Name",
];

// ── WIP Detail DataTable config ──
const wipColumns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "orderNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "สินค้า", uid: "sourceNo", sortable: true },
  { name: "แผนผลิต", uid: "plannedQty", sortable: true },
  { name: "ผลิตแล้ว", uid: "outputQty", sortable: true },
  { name: "คงเหลือ", uid: "remainQty", sortable: true },
  { name: "ความคืบหน้า", uid: "completionPct", sortable: true },
  { name: "ต้นทุนวัตถุดิบ", uid: "consumptionCost", sortable: true },
  { name: "รายได้", uid: "revenue", sortable: true },
  { name: "WIP", uid: "wipValue", sortable: true },
  { name: "กำหนดส่ง", uid: "dueDate", sortable: true },
];

const wipInitialColumns = [
  "orderNo",
  "description",
  "sourceNo",
  "plannedQty",
  "outputQty",
  "remainQty",
  "completionPct",
  "consumptionCost",
  "wipValue",
];

// ── Dashboard content for a single tab ──
function DashboardContent({ d, renderOverdueCell, renderWipCell }) {
  if (!d) return null;

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ══ KPI Cards ══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="ใบสั่งผลิตทั้งหมด"
          value={fmt(d.totalOrders)}
          unit="ใบ"
          subtitle={`Released ${fmt(d.releasedOrders)} / Finished ${fmt(d.finishedOrders)}`}
        />
        <KpiCard
          title="อัตราส่งตรงเวลา"
          value={d.onTimeRate != null ? `${d.onTimeRate}%` : "-"}
          color={
            d.onTimeRate == null
              ? "default"
              : d.onTimeRate >= 90
                ? "success"
                : d.onTimeRate >= 70
                  ? "warning"
                  : "danger"
          }
          subtitle="เสร็จตามกำหนด"
        />
        <KpiCard
          title="ระยะเวลาผลิตเฉลี่ย"
          value={d.avgLeadTime != null ? d.avgLeadTime : "-"}
          unit="วัน"
          color="primary"
          subtitle="เฉลี่ยใบที่เสร็จแล้ว"
        />
        <KpiCard
          title="ต้นทุนวัตถุดิบ"
          value={fmtCurrency(d.totalConsumptionCost)}
          color="warning"
        />
        <KpiCard
          title="รายได้จากการขาย"
          value={fmtCurrency(d.totalRevenue)}
          color="primary"
          subtitle={`ราคาขาย × ผลผลิต`}
        />
        <KpiCard
          title="กำไร/ขาดทุน"
          value={fmtCurrency(d.totalProfit)}
          color={
            d.totalProfit == null
              ? "default"
              : d.totalProfit >= 0
                ? "success"
                : "danger"
          }
          subtitle={`รายได้ - ต้นทุนวัตถุดิบ`}
        />
        <KpiCard
          title="อัตรากำไร"
          value={d.profitMargin != null ? `${d.profitMargin}%` : "-"}
          color={
            d.profitMargin == null
              ? "default"
              : d.profitMargin >= 20
                ? "success"
                : d.profitMargin >= 0
                  ? "warning"
                  : "danger"
          }
          subtitle="กำไร ÷ รายได้"
        />
        <KpiCard
          title="WIP"
          value={fmtCurrency(d.wipValue)}
          color="danger"
          subtitle="ใบสั่งผลิตค้างอยู่"
        />
        <KpiCard
          title="ผลผลิต FG"
          value={fmt(d.totalOutputQty)}
          unit="ชิ้น"
          color="success"
        />
        <KpiCard
          title="เกินกำหนดส่ง"
          value={fmt(d.overdueCount)}
          unit="ใบ"
          color={d.overdueCount > 0 ? "danger" : "success"}
          subtitle="Released & เลยกำหนด"
        />
      </div>

      {/* Section 1: แนวโน้มภาพรวม */}
      <ChartCard title="แนวโน้มการผลิตรายวัน (ต้นทุนวัตถุดิบ vs รายได้จากการขาย)">
        <DailyProductionTrendChart data={d.dailyTrend} />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="อัตราส่งตรงเวลา (รายเดือน)">
          <OnTimeTrendChart data={d.onTimeTrend} />
        </ChartCard>
        <ChartCard title="ระยะเวลาผลิตเฉลี่ย (รายเดือน)">
          <LeadTimeTrendChart data={d.leadTimeTrend} />
        </ChartCard>
      </div>

      {/* Section 2: สัดส่วนผลผลิต & สถานะ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="ผลผลิต FG ตามประเภท (ประตู, วงกบ, ...)">
          <FgOutputBreakdownChart data={d.fgByProductType} />
        </ChartCard>
        <ChartCard title="สถานะใบสั่งผลิต">
          <OrdersByStatusChart data={d.ordersByStatus} />
        </ChartCard>
      </div>

      {/* Section 3: กำไร/ขาดทุน */}
      <ChartCard title="กำไร/ขาดทุนต่อสินค้า (เขียว: กำไร / แดง: ขาดทุน)">
        <ProfitByItemChart data={d.profitByItem} />
      </ChartCard>

      {/* Section 3.5: กำไรตามโครงการ (ละเอียด) */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="pb-0">
          <p className="text-sm font-semibold">วิเคราะห์กำไรตามโครงการ (ละเอียดรายสินค้า)</p>
        </CardHeader>
        <CardBody>
          <ProfitByProjectSection data={d.profitByProject} />
        </CardBody>
      </Card>

      {/* Section 4: วิเคราะห์ต้นทุน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Top 10 วัตถุดิบต้นทุนสูงสุด">
          <TopConsumedItemsChart data={d.topConsumedItems} />
        </ChartCard>
        <ChartCard title="ต้นทุน vs รายได้ ตามโครงการ">
          <CostByProjectChart data={d.costByProject} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="ต้นทุนวัตถุดิบตามแผนก">
          <CostByDepartmentChart data={d.costByDepartment} />
        </ChartCard>
        <ChartCard title="Top 10 สินค้าผลผลิต (จำนวน)">
          <TopOutputItemsChart data={d.topOutputItems} />
        </ChartCard>
      </div>

      {/* Section 5: ช่าง & ทักษะ */}
      <ChartCard title="ช่างเก่งด้านไหน (ผลผลิตตามประเภทสินค้า)">
        <EmployeeSpecializationChart data={d.employeeSpecialization} />
      </ChartCard>

      {/* Section 6: WIP */}
      <ChartCard title="WIP รายใบสั่งผลิต (Released — แดง: ต้นทุน>รายได้ / เขียว: กำไร)">
        <WipByOrderChart data={d.wipByOrder} />
      </ChartCard>

      {/* Section 6.5: WIP Detail Table */}
      {d.wipDetail?.length > 0 && (
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                ความคืบหน้าใบสั่งผลิต (Released)
              </p>
              <Chip size="sm" color="warning" variant="flat">
                {d.wipDetail.length} ใบ
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={wipColumns}
              data={d.wipDetail}
              renderCell={renderWipCell}
              rowKey="orderNo"
              searchKeys={["orderNo", "description", "sourceNo"]}
              searchPlaceholder="ค้นหาใบสั่งผลิต..."
              initialVisibleColumns={wipInitialColumns}
              defaultSortDescriptor={{ column: "completionPct", direction: "ascending" }}
              defaultRowsPerPage={10}
            />
          </CardBody>
        </Card>
      )}

      {/* Section 7: ใบสั่งผลิตเกินกำหนด */}
      {d.overdueOrders?.length > 0 && (
        <Card shadow="none" className="border border-danger-200">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-danger">
                ใบสั่งผลิตเกินกำหนดส่ง
              </p>
              <Chip size="sm" color="danger" variant="flat">
                {d.overdueOrders.length}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={overdueColumns}
              data={d.overdueOrders}
              renderCell={renderOverdueCell}
              searchKeys={["id", "description", "sourceNo", "dimension1Name", "dimension2Name"]}
              searchPlaceholder="ค้นหาใบสั่งผลิต..."
              initialVisibleColumns={overdueInitialColumns}
              defaultSortDescriptor={{ column: "overdueDays", direction: "descending" }}
              defaultRowsPerPage={10}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function ProductionDashboardPage() {
  const { data, loading } = useProductionDashboard();

  const renderOverdueCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "id":
        return <span className="font-medium">{item.id}</span>;
      case "description":
        return (
          <span className="max-w-48 truncate block">
            {item.description || "-"}
          </span>
        );
      case "quantity":
        return Number(item.quantity || 0).toLocaleString("th-TH");
      case "dueDate":
        return item.dueDate
          ? new Date(item.dueDate).toLocaleDateString("th-TH")
          : "-";
      case "startingDateTime":
        return item.startingDateTime
          ? new Date(item.startingDateTime).toLocaleDateString("th-TH")
          : "-";
      case "overdueDays":
        return (
          <Chip size="sm" color="danger" variant="flat">
            {item.overdueDays} วัน
          </Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  const renderWipCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "orderNo":
        return <span className="font-medium text-xs">{item.orderNo}</span>;
      case "description":
        return (
          <span className="max-w-48 truncate block text-xs">
            {item.description || "-"}
          </span>
        );
      case "sourceNo":
        return <span className="text-xs">{item.sourceNo || "-"}</span>;
      case "plannedQty":
      case "outputQty":
        return <span className="text-xs">{fmt(item[columnKey])}</span>;
      case "remainQty":
        return (
          <span className={`text-xs font-medium ${
            item.remainQty < 0
              ? "text-primary"
              : item.remainQty === 0
                ? "text-success"
                : "text-default-600"
          }`}>
            {item.remainQty < 0
              ? `เกิน ${fmt(Math.abs(item.remainQty))}`
              : fmt(item.remainQty)}
          </span>
        );
      case "completionPct": {
        const isOver = item.completionPct > 100;
        const color = isOver
          ? "primary"
          : item.completionPct >= 100
            ? "success"
            : item.completionPct >= 50
              ? "primary"
              : "warning";
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-default-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isOver ? "bg-primary" : `bg-${color}`
                }`}
                style={{ width: `${Math.min(100, item.completionPct)}%` }}
              />
            </div>
            <Chip size="sm" variant="flat" color={color}>
              {item.completionPct}%
              {isOver ? " เกิน" : ""}
            </Chip>
          </div>
        );
      }
      case "consumptionCost":
      case "revenue":
        return <span className="text-xs">{fmtCurrency(item[columnKey])}</span>;
      case "wipValue":
        return (
          <span className={`text-xs font-semibold ${item.wipValue > 0 ? "text-danger" : "text-success"}`}>
            {fmtCurrency(item.wipValue)}
          </span>
        );
      case "dueDate":
        return item.dueDate
          ? <span className="text-xs">{new Date(item.dueDate).toLocaleDateString("th-TH")}</span>
          : "-";
      default:
        return <span className="text-xs">{item[columnKey] || "-"}</span>;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col w-full gap-4">
      <Tabs aria-label="แผนก" variant="underlined">
        <Tab
          key="wpc"
          title={`WPC (${fmt(data.wpc?.totalOrders || 0)})`}
        >
          <DashboardContent d={data.wpc} renderOverdueCell={renderOverdueCell} renderWipCell={renderWipCell} />
        </Tab>
        <Tab
          key="other"
          title={`อื่นๆ (${fmt(data.other?.totalOrders || 0)})`}
        >
          <DashboardContent d={data.other} renderOverdueCell={renderOverdueCell} renderWipCell={renderWipCell} />
        </Tab>
      </Tabs>
    </div>
  );
}
