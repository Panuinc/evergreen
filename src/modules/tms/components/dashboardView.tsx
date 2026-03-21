import { Card, CardBody, CardHeader, Chip, Button } from "@heroui/react";
import { BotMessageSquare, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CompareToggle from "@/components/ui/compareToggle";
import CompareKpiCard from "@/components/ui/compareKpiCard";
import ShipmentStatusChart from "@/modules/tms/components/shipmentStatusChart";
import MonthlyShipmentChart from "@/modules/tms/components/monthlyShipmentChart";
import FuelCostChart from "@/modules/tms/components/fuelCostChart";
import VehicleUtilizationChart from "@/modules/tms/components/vehicleUtilizationChart";
import VehiclePerformanceTable from "@/modules/tms/components/vehiclePerformanceTable";
import Loading from "@/components/ui/loading";
import type { DashboardViewProps } from "@/modules/tms/types";

export default function DashboardView({ stats, loading, compareMode, setCompareMode, aiAnalysis, aiLoading, runAiAnalysis }: DashboardViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground text-center py-10">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>;
  }


  const isCompare = !!stats.compareMode;
  const d = isCompare ? stats.current : stats;
  const prev = isCompare ? stats.previous : null;




  const completedValue = isCompare ? d.completedInPeriod : d.completedThisMonth;
  const completedPrev = prev ? prev.completedInPeriod : undefined;
  const fuelCostValue = isCompare ? d.fuelCostInPeriod : d.totalFuelCostThisMonth;
  const fuelCostPrev = prev ? prev.fuelCostInPeriod : undefined;

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {}
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && stats.labels && (
              <span className="text-xs text-muted-foreground">
                {stats.labels.current} vs {stats.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      {}
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

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">สถานะการขนส่ง</p>
            <ShipmentStatusChart data={d.shipmentStatusDistribution} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">
              {isCompare ? "การขนส่งรายเดือน" : "การขนส่งรายเดือน (6 เดือนล่าสุด)"}
            </p>
            <MonthlyShipmentChart data={d.monthlyShipmentTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">แนวโน้มค่าน้ำมัน</p>
            <FuelCostChart data={d.fuelCostTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">
              {isCompare ? "อัตราการใช้ยานพาหนะ" : "อัตราการใช้ยานพาหนะ (30 วัน)"}
            </p>
            <VehicleUtilizationChart data={d.vehicleUtilization} />
          </CardBody>
        </Card>
      </div>

      {}
      {stats.vehiclePerformance && (
        <div>
          <p className="text-xs font-light mb-3">สรุปประสิทธิภาพยานพาหนะ</p>
          <VehiclePerformanceTable data={stats.vehiclePerformance} />
        </div>
      )}

      {}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="text-primary" />
            <p className="text-xs font-light">AI วิเคราะห์ระบบขนส่ง</p>
            <Chip size="md" variant="flat" color="secondary">TMS Advisor</Chip>
          </div>
          <Button
            variant={aiAnalysis ? "bordered" : "solid"}
            color="primary"
            size="md"
            isLoading={aiLoading}
            isDisabled={!stats || aiLoading}
            onPress={runAiAnalysis}
            startContent={!aiLoading && (aiAnalysis ? <RefreshCw /> : <BotMessageSquare />)}
          >
            {aiAnalysis ? "วิเคราะห์ใหม่" : "เริ่มวิเคราะห์"}
          </Button>
        </CardHeader>
        <CardBody>
          {aiLoading && !aiAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loading />
              <span className="text-xs text-muted-foreground">AI กำลังวิเคราะห์ข้อมูลขนส่ง...</span>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              กดปุ่ม &quot;เริ่มวิเคราะห์&quot; เพื่อให้ AI วิเคราะห์ประสิทธิภาพขนส่ง ต้นทุนน้ำมัน และคำแนะนำลดค่าใช้จ่าย
            </p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-xs leading-relaxed">
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
                    <th className="border border-border px-3 py-1.5 text-left font-light text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-1.5 text-foreground">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="even:bg-default-50">{children}</tr>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-light text-foreground">{children}</strong>,
                  code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
                    inline ? (
                      <code className="bg-default-100 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
                    ) : (
                      <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs font-mono" {...props}>{children}</code>
                      </pre>
                    ),
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
              {aiLoading && <Loading />}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
