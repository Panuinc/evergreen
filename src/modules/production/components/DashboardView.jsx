"use client";

import { useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import DataTable from "@/components/ui/DataTable";
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";
import OrdersByStatusChart from "@/modules/production/components/OrdersByStatusChart";
import CostByProjectChart from "@/modules/production/components/CostByProjectChart";
import DailyProductionTrendChart from "@/modules/production/components/DailyProductionTrendChart";
import TopOutputItemsChart from "@/modules/production/components/TopOutputItemsChart";
import WipByOrderChart from "@/modules/production/components/WipByOrderChart";
import TopConsumedItemsChart from "@/modules/production/components/TopConsumedItemsChart";
import CostByDepartmentChart from "@/modules/production/components/CostByDepartmentChart";
import OnTimeTrendChart from "@/modules/production/components/OnTimeTrendChart";
import LeadTimeTrendChart from "@/modules/production/components/LeadTimeTrendChart";
import EmployeeSpecializationChart from "@/modules/production/components/EmployeeSpecializationChart";
import FgOutputBreakdownChart from "@/modules/production/components/FgOutputBreakdownChart";
import ProfitByItemChart from "@/modules/production/components/ProfitByItemChart";
import ProfitByProjectSection from "@/modules/production/components/ProfitByProjectSection";
import Loading from "@/components/ui/Loading";


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
    <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
      <CardBody className="gap-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-xs font-light ${colorClass[color] || ""}`}>
            {value}
          </p>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardBody>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
      <CardHeader className="pb-0">
        <p className="text-xs font-light">{title}</p>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}


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


const wipColumns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "orderNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "สินค้า", uid: "sourceNo", sortable: true },
  { name: "หน่วย", uid: "uom", sortable: true },
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
  "uom",
  "plannedQty",
  "outputQty",
  "remainQty",
  "completionPct",
  "consumptionCost",
  "wipValue",
];


function DashboardContent({ d, prev, renderOverdueCell, renderWipCell }) {
  if (!d) return null;

  return (
    <div className="flex flex-col w-full gap-4">
      {}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <CompareKpiCard
          title="ใบสั่งผลิตทั้งหมด"
          value={fmt(d.totalOrders)}
          unit="ใบ"
          subtitle={`Released ${fmt(d.releasedOrders)} / Finished ${fmt(d.finishedOrders)}`}
          currentRaw={prev ? d.totalOrders : undefined}
          previousRaw={prev?.totalOrders}
        />
        <CompareKpiCard
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
          currentRaw={prev ? d.onTimeRate : undefined}
          previousRaw={prev?.onTimeRate}
        />
        <CompareKpiCard
          title="ระยะเวลาผลิตเฉลี่ย"
          value={d.avgLeadTime != null ? d.avgLeadTime : "-"}
          unit="วัน"
          color="primary"
          subtitle="เฉลี่ยใบที่เสร็จแล้ว"
          currentRaw={prev ? d.avgLeadTime : undefined}
          previousRaw={prev?.avgLeadTime}
          invertColor
        />
        <CompareKpiCard
          title="ต้นทุนวัตถุดิบ"
          value={fmtCurrency(d.totalConsumptionCost)}
          color="warning"
          currentRaw={prev ? d.totalConsumptionCost : undefined}
          previousRaw={prev?.totalConsumptionCost}
          invertColor
        />
        <CompareKpiCard
          title="รายได้จากการขาย"
          value={fmtCurrency(d.totalRevenue)}
          color="primary"
          subtitle={`ราคาขาย × ผลผลิต`}
          currentRaw={prev ? d.totalRevenue : undefined}
          previousRaw={prev?.totalRevenue}
        />
        <CompareKpiCard
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
          currentRaw={prev ? d.totalProfit : undefined}
          previousRaw={prev?.totalProfit}
        />
        <CompareKpiCard
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
          currentRaw={prev ? d.profitMargin : undefined}
          previousRaw={prev?.profitMargin}
        />
        <CompareKpiCard
          title="WIP"
          value={fmtCurrency(d.wipValue)}
          color="danger"
          subtitle="ใบสั่งผลิตค้างอยู่"
          currentRaw={prev ? d.wipValue : undefined}
          previousRaw={prev?.wipValue}
          invertColor
        />
        <CompareKpiCard
          title="ผลผลิต FG"
          value={fmt(d.totalOutputQty)}
          unit="ชิ้น"
          color="success"
          currentRaw={prev ? d.totalOutputQty : undefined}
          previousRaw={prev?.totalOutputQty}
        />
        <CompareKpiCard
          title="เกินกำหนดส่ง"
          value={fmt(d.overdueCount)}
          unit="ใบ"
          color={d.overdueCount > 0 ? "danger" : "success"}
          subtitle="Released & เลยกำหนด"
          currentRaw={prev ? d.overdueCount : undefined}
          previousRaw={prev?.overdueCount}
          invertColor
        />
      </div>

      {}
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

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="ผลผลิต FG ตามประเภท (ประตู, วงกบ, ...)">
          <FgOutputBreakdownChart data={d.fgByProductType} />
        </ChartCard>
        <ChartCard title="สถานะใบสั่งผลิต">
          <OrdersByStatusChart data={d.ordersByStatus} />
        </ChartCard>
      </div>

      {}
      <ChartCard title="กำไร/ขาดทุนต่อสินค้า (เขียว: กำไร / แดง: ขาดทุน)">
        <ProfitByItemChart data={d.profitByItem} />
      </ChartCard>

      {}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <p className="text-xs font-light">วิเคราะห์กำไรตามโครงการ (ละเอียดรายสินค้า)</p>
        </CardHeader>
        <CardBody>
          <ProfitByProjectSection data={d.profitByProject} />
        </CardBody>
      </Card>

      {}
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

      {}
      <ChartCard title="ช่างเก่งด้านไหน (ผลผลิตตามประเภทสินค้า)">
        <EmployeeSpecializationChart data={d.employeeSpecialization} />
      </ChartCard>

      {}
      <ChartCard title="WIP รายใบสั่งผลิต (Released — แดง: ต้นทุน>รายได้ / เขียว: กำไร)">
        <WipByOrderChart data={d.wipByOrder} />
      </ChartCard>

      {}
      {d.wipDetail?.length > 0 && (
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-light">
                ความคืบหน้าใบสั่งผลิต (Released)
              </p>
              <Chip size="md" color="warning" variant="flat">
                {d.wipDetail.length} ใบ
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={wipColumns}
              data={d.wipDetail}
              renderCell={renderWipCell}
              rowKey="_key"
              searchKeys={["orderNo", "description", "sourceNo", "uom"]}
              searchPlaceholder="ค้นหาใบสั่งผลิต..."
              initialVisibleColumns={wipInitialColumns}
              defaultSortDescriptor={{ column: "completionPct", direction: "ascending" }}
              defaultRowsPerPage={10}
            />
          </CardBody>
        </Card>
      )}

      {}
      {d.overdueOrders?.length > 0 && (
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-light text-danger">
                ใบสั่งผลิตเกินกำหนดส่ง
              </p>
              <Chip size="md" color="danger" variant="flat">
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

      {}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <p className="text-xs font-light">คำอธิบาย Dashboard</p>
        </CardHeader>
        <CardBody className="text-xs text-muted-foreground leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {}
            <div>
              <p className="font-light text-foreground mb-2">KPI Cards</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-light text-foreground">ใบสั่งผลิตทั้งหมด</span> — จำนวนใบสั่งผลิตในระบบ แยก Released / Finished</li>
                <li><span className="font-light text-foreground">อัตราส่งตรงเวลา</span> — % ใบที่เสร็จก่อนหรือตรงกำหนด (finishedDate ≤ dueDate)</li>
                <li><span className="font-light text-foreground">ระยะเวลาผลิตเฉลี่ย</span> — เฉลี่ยกี่วันจากเริ่มผลิตจนเสร็จ</li>
                <li><span className="font-light text-foreground">ต้นทุนวัตถุดิบ</span> — มูลค่าวัตถุดิบที่เบิกใช้ทั้งหมด (Consumption entries)</li>
                <li><span className="font-light text-foreground">รายได้จากการขาย</span> — ราคาขาย/ชิ้น x จำนวนที่ผลิตได้ (ราคาขายจาก Sales Order)</li>
                <li><span className="font-light text-foreground">กำไร/ขาดทุน</span> — รายได้ - ต้นทุนวัตถุดิบ</li>
                <li><span className="font-light text-foreground">อัตรากำไร</span> — กำไร / รายได้ x 100</li>
                <li><span className="font-light text-foreground">WIP (Work In Progress)</span> — ต้นทุนวัตถุดิบที่เบิกไปแล้วในใบที่ยัง Released (เงินจมในงานที่ยังไม่เสร็จ)</li>
                <li><span className="font-light text-foreground">ผลผลิต FG</span> — จำนวนสินค้าสำเร็จรูปที่ผลิตได้ทั้งหมด</li>
                <li><span className="font-light text-foreground">เกินกำหนดส่ง</span> — ใบ Released ที่เลยกำหนดส่งแล้ว</li>
              </ul>
            </div>

            {}
            <div>
              <p className="font-light text-foreground mb-2">กราฟและตาราง</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-light text-foreground">แนวโน้มรายวัน</span> — ต้นทุนวัตถุดิบ vs รายได้ รายวัน (เขียวสูงกว่าเหลือง = กำไร)</li>
                <li><span className="font-light text-foreground">อัตราส่งตรงเวลา/ระยะเวลาเฉลี่ย รายเดือน</span> — แนวโน้มประสิทธิภาพการผลิต</li>
                <li><span className="font-light text-foreground">ผลผลิต FG ตามประเภท</span> — จำนวนผลิตแยกตามประเภทสินค้า (ประตู, วงกบ, ...)</li>
                <li><span className="font-light text-foreground">กำไร/ขาดทุนต่อสินค้า</span> — เขียว = กำไร, แดง = ขาดทุน แต่ละรายการ</li>
                <li><span className="font-light text-foreground">วิเคราะห์กำไรตามโครงการ</span> — กดเปิดดูรายละเอียดสินค้าในแต่ละโครงการ</li>
                <li><span className="font-light text-foreground">Top 10 วัตถุดิบต้นทุนสูงสุด</span> — วัตถุดิบที่เปลืองเงินมากที่สุด</li>
                <li><span className="font-light text-foreground">ต้นทุน vs รายได้ ตามโครงการ</span> — เปรียบเทียบต้นทุนกับรายได้แต่ละโครงการ</li>
                <li><span className="font-light text-foreground">ช่างเก่งด้านไหน</span> — จัดอันดับช่างตามผลงาน + ความเร็วผลิต (วัน/ใบ) แยกตามประเภทสินค้า</li>
                <li><span className="font-light text-foreground">WIP รายใบสั่งผลิต</span> — แดง = ต้นทุนสูงกว่ารายได้, เขียว = มีกำไร</li>
                <li><span className="font-light text-foreground">ความคืบหน้าใบสั่งผลิต</span> — แผนผลิต vs ผลิตแล้ว vs คงเหลือ พร้อม % ความคืบหน้า</li>
              </ul>
            </div>

            {}
            <div>
              <p className="font-light text-foreground mb-2">แหล่งข้อมูล</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-light text-foreground">bcProductionOrders</span> — ใบสั่งผลิต, สถานะ, วันกำหนดส่ง, วันเริ่ม/เสร็จ, แผนก, โครงการ</li>
                <li><span className="font-light text-foreground">bcItemLedgerEntries</span> — รายการเบิกวัตถุดิบ (Consumption) + ผลผลิต (Output), ชื่อช่าง</li>
                <li><span className="font-light text-foreground">bcSalesOrderLines</span> — ราคาขาย/ชิ้น สำหรับคำนวณรายได้</li>
                <li><span className="font-light text-foreground">bcItems</span> — ประเภทสินค้า (itemCategoryCode)</li>
              </ul>
            </div>

            {}
            <div>
              <p className="font-light text-foreground mb-2">หมายเหตุ</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Dashboard แบ่งเป็น 2 Tab: <span className="font-light">WPC</span> (แผนก WPC) และ <span className="font-light">อื่นๆ</span></li>
                <li>ทุก KPI และกราฟคำนวณแยกตาม Tab</li>
                <li>ราคาขายดึงจาก Sales Order Lines ถ้าไม่มีจะเป็น 0</li>
                <li>ช่างที่ชื่อคั่นด้วย / (เช่น ป.เสริฐ/สีมาซู) จะแยกเครดิตให้แต่ละคน</li>
                <li>ระดับความเร็วช่าง: สายฟ้า (≤3 วัน), เร็ว (≤7 วัน), ปกติ (≤14 วัน), ช้า (&gt;14 วัน)</li>
                <li>สีเขียว = ดี/กำไร, สีแดง = ต้องระวัง/ขาดทุน, สีเหลือง = ปานกลาง</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


export default function DashboardView({ data, loading, compareMode, setCompareMode }) {
  const renderOverdueCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "id":
        return <span className="font-light">{item.id}</span>;
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
          ? new Date(item.dueDate).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
          : "-";
      case "startingDateTime":
        return item.startingDateTime
          ? new Date(item.startingDateTime).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
          : "-";
      case "overdueDays":
        return (
          <Chip size="md" color="danger" variant="flat">
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
        return <span className="font-light text-xs">{item.orderNo}</span>;
      case "description":
        return (
          <span className="max-w-48 truncate block text-xs">
            {item.description || "-"}
          </span>
        );
      case "sourceNo":
        return <span className="text-xs">{item.sourceNo || "-"}</span>;
      case "uom":
        return (
          <Chip size="md" variant="flat" color="default">
            {item.uom || "-"}
          </Chip>
        );
      case "plannedQty":
      case "outputQty":
        return <span className="text-xs">{fmt(item[columnKey])}</span>;
      case "remainQty":
        return (
          <span className={`text-xs font-light ${
            item.remainQty < 0
              ? "text-primary"
              : item.remainQty === 0
                ? "text-success"
                : "text-foreground"
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
            <Chip size="md" variant="flat" color={color}>
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
          <span className={`text-xs font-light ${item.wipValue > 0 ? "text-danger" : "text-success"}`}>
            {fmtCurrency(item.wipValue)}
          </span>
        );
      case "dueDate":
        return item.dueDate
          ? <span className="text-xs">{new Date(item.dueDate).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}</span>
          : "-";
      default:
        return <span className="text-xs">{item[columnKey] || "-"}</span>;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (!data) return null;


  const isCompare = !!data.compareMode;
  const wpcData = isCompare ? data.wpc?.current : data.wpc;
  const wpcPrev = isCompare ? data.wpc?.previous : null;
  const otherData = isCompare ? data.other?.current : data.other;
  const otherPrev = isCompare ? data.other?.previous : null;

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between">
        <div />
        {setCompareMode && (
          <div className="flex items-center gap-2">
            {isCompare && data.labels && (
              <span className="text-xs text-muted-foreground">
                {data.labels.current} vs {data.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        )}
      </div>
      <Tabs aria-label="แผนก" variant="underlined">
        <Tab
          key="wpc"
          title={`WPC (${fmt(wpcData?.totalOrders || 0)})`}
        >
          <DashboardContent d={wpcData} prev={wpcPrev} renderOverdueCell={renderOverdueCell} renderWipCell={renderWipCell} />
        </Tab>
        <Tab
          key="other"
          title={`อื่นๆ (${fmt(otherData?.totalOrders || 0)})`}
        >
          <DashboardContent d={otherData} prev={otherPrev} renderOverdueCell={renderOverdueCell} renderWipCell={renderWipCell} />
        </Tab>
      </Tabs>
    </div>
  );
}
