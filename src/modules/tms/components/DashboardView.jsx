import { Card, CardBody, Spinner } from "@heroui/react";
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";
import ShipmentStatusChart from "@/modules/tms/components/ShipmentStatusChart";
import MonthlyShipmentChart from "@/modules/tms/components/MonthlyShipmentChart";
import FuelCostChart from "@/modules/tms/components/FuelCostChart";
import VehicleUtilizationChart from "@/modules/tms/components/VehicleUtilizationChart";
import MaintenanceCostChart from "@/modules/tms/components/MaintenanceCostChart";

export default function DashboardView({ stats, loading, compareMode, setCompareMode }) {
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
  const mainCostValue = isCompare ? d.maintenanceCostInPeriod : undefined;
  const mainCostPrev = prev ? prev.maintenanceCostInPeriod : undefined;

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
          title="รอซ่อมบำรุง"
          value={d.pendingMaintenance}
          subtitle="นัดหมาย + กำลังดำเนินการ"
          color="default"
        />
        <CompareKpiCard
          title="ยานพาหนะที่ใช้งาน"
          value={d.inUseVehicles}
          subtitle={`จาก ${d.totalVehicles}`}
          color="default"
        />
        {isCompare && mainCostValue != null && (
          <CompareKpiCard
            title="ค่าซ่อมบำรุง (ช่วง)"
            value={`฿${Number(mainCostValue || 0).toLocaleString("th-TH")}`}
            color="warning"
            currentRaw={prev ? mainCostValue : undefined}
            previousRaw={mainCostPrev}
            invertColor
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สถานะการขนส่ง</p>
            <ShipmentStatusChart data={d.shipmentStatusDistribution} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              {isCompare ? "การขนส่งรายเดือน" : "การขนส่งรายเดือน (6 เดือนล่าสุด)"}
            </p>
            <MonthlyShipmentChart data={d.monthlyShipmentTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">แนวโน้มค่าน้ำมัน</p>
            <FuelCostChart data={d.fuelCostTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              {isCompare ? "อัตราการใช้ยานพาหนะ" : "อัตราการใช้ยานพาหนะ (30 วัน)"}
            </p>
            <VehicleUtilizationChart data={d.vehicleUtilization} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 lg:col-span-2">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สรุปค่าซ่อมบำรุง</p>
            <MaintenanceCostChart data={d.maintenanceCostTrend} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
