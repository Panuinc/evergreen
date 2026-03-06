import { Card, CardBody, CardHeader, Spinner, Chip, Button } from "@heroui/react";
import { BotMessageSquare, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";
import ShipmentStatusChart from "@/modules/tms/components/ShipmentStatusChart";
import MonthlyShipmentChart from "@/modules/tms/components/MonthlyShipmentChart";
import FuelCostChart from "@/modules/tms/components/FuelCostChart";
import VehicleUtilizationChart from "@/modules/tms/components/VehicleUtilizationChart";
import VehiclePerformanceTable from "@/modules/tms/components/VehiclePerformanceTable";

export default function DashboardView({ stats, loading, compareMode, setCompareMode, aiAnalysis, aiLoading, runAiAnalysis }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>;
  }

  // Handle comparison data shape
  const isCompare = !!stats.compareMode;
  const d = isCompare ? stats.current : stats;
  const prev = isCompare ? stats.previous : null;

  // Map field names for backward compatibility
  // Non-compare mode uses: completedThisMonth, totalFuelCostThisMonth
  // Compare mode uses: completedInPeriod, fuelCostInPeriod
  const completedValue = isCompare ? d.completedInPeriod : d.completedThisMonth;
  const completedPrev = prev ? prev.completedInPeriod : undefined;
  const fuelCostValue = isCompare ? d.fuelCostInPeriod : d.totalFuelCostThisMonth;
  const fuelCostPrev = prev ? prev.fuelCostInPeriod : undefined;

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Compare Toggle */}
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && stats.labels && (
              <span className="text-xs text-default-400">
                {stats.labels.current} vs {stats.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CompareKpiCard
          title="ยานพาหนะทั้งหมด"
          value={d.totalVehicles}
          subtitle={`${d.availableVehicles} พร้อมใช้งาน`}
          color="primary"
        />
        <CompareKpiCard
          title="การขนส่งที่ดำเนินการ"
          value={d.activeShipments}
          unit="รายการ"
          subtitle={`${d.totalShipments} รายการทั้งหมด`}
          color="warning"
          currentRaw={prev ? d.activeShipments : undefined}
          previousRaw={prev?.activeShipments}
        />
        <CompareKpiCard
          title={isCompare ? "สำเร็จในช่วง" : "สำเร็จเดือนนี้"}
          value={completedValue}
          unit="รายการ"
          color="success"
          currentRaw={prev ? completedValue : undefined}
          previousRaw={completedPrev}
        />
        <CompareKpiCard
          title={isCompare ? "ค่าน้ำมัน (ช่วง)" : "ค่าน้ำมัน (เดือน)"}
          value={`฿${Number(fuelCostValue || 0).toLocaleString("th-TH")}`}
          color="danger"
          currentRaw={prev ? fuelCostValue : undefined}
          previousRaw={fuelCostPrev}
          invertColor
        />
        <CompareKpiCard
          title="ยานพาหนะที่ใช้งาน"
          value={d.inUseVehicles}
          subtitle={`จาก ${d.totalVehicles}`}
          color="default"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-foreground/15">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สถานะการขนส่ง</p>
            <ShipmentStatusChart data={d.shipmentStatusDistribution} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-foreground/15">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              {isCompare ? "การขนส่งรายเดือน" : "การขนส่งรายเดือน (6 เดือนล่าสุด)"}
            </p>
            <MonthlyShipmentChart data={d.monthlyShipmentTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-foreground/15">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">แนวโน้มค่าน้ำมัน</p>
            <FuelCostChart data={d.fuelCostTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-foreground/15">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              {isCompare ? "อัตราการใช้ยานพาหนะ" : "อัตราการใช้ยานพาหนะ (30 วัน)"}
            </p>
            <VehicleUtilizationChart data={d.vehicleUtilization} />
          </CardBody>
        </Card>
      </div>

      {/* Vehicle Performance */}
      {stats.vehiclePerformance && (
        <div>
          <p className="text-sm font-semibold mb-3">สรุปประสิทธิภาพยานพาหนะ</p>
          <VehiclePerformanceTable data={stats.vehiclePerformance} />
        </div>
      )}

      {/* AI Analysis */}
      <Card shadow="none" className="border border-foreground/15">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare size={18} className="text-primary" />
            <p className="text-sm font-semibold">AI วิเคราะห์ระบบขนส่ง</p>
            <Chip size="sm" variant="flat" color="secondary">TMS Advisor</Chip>
          </div>
          <Button
            variant={aiAnalysis ? "bordered" : "solid"}
            color="primary"
            size="sm"
            isLoading={aiLoading}
            isDisabled={!stats || aiLoading}
            onPress={runAiAnalysis}
            startContent={!aiLoading && (aiAnalysis ? <RefreshCw size={14} /> : <BotMessageSquare size={14} />)}
          >
            {aiAnalysis ? "วิเคราะห์ใหม่" : "เริ่มวิเคราะห์"}
          </Button>
        </CardHeader>
        <CardBody>
          {aiLoading && !aiAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Spinner size="sm" />
              <span className="text-sm text-default-500">AI กำลังวิเคราะห์ข้อมูลขนส่ง...</span>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="text-sm text-default-400 py-4 text-center">
              กดปุ่ม &quot;เริ่มวิเคราะห์&quot; เพื่อให้ AI วิเคราะห์ประสิทธิภาพขนส่ง ต้นทุนน้ำมัน และคำแนะนำลดค่าใช้จ่าย
            </p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="border-collapse w-full text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-default-100">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-foreground/15 px-3 py-1.5 text-left font-semibold text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-foreground/15 px-3 py-1.5 text-foreground">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="even:bg-default-50">{children}</tr>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-default-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
                    ) : (
                      <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    ),
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
              {aiLoading && <Spinner size="sm" className="mt-2" />}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
