import { Card, CardBody, Spinner } from "@heroui/react";
import { Truck, Package, Fuel, Wrench, CheckCircle, Clock } from "lucide-react";
import ShipmentStatusChart from "@/components/charts/ShipmentStatusChart";
import MonthlyShipmentChart from "@/components/charts/MonthlyShipmentChart";
import FuelCostChart from "@/components/charts/FuelCostChart";
import VehicleUtilizationChart from "@/components/charts/VehicleUtilizationChart";
import MaintenanceCostChart from "@/components/charts/MaintenanceCostChart";

const buildCards = (stats) => [
  { title: "ยานพาหนะทั้งหมด", value: stats.totalVehicles, sub: `${stats.availableVehicles} พร้อมใช้งาน`, icon: Truck, color: "text-primary" },
  { title: "การขนส่งที่ดำเนินการ", value: stats.activeShipments, sub: `${stats.totalShipments} รายการ`, icon: Package, color: "text-warning" },
  { title: "สำเร็จเดือนนี้", value: stats.completedThisMonth, sub: "รายการ", icon: CheckCircle, color: "text-success" },
  { title: "ค่าน้ำมัน (เดือน)", value: `฿${Number(stats.totalFuelCostThisMonth || 0).toLocaleString("th-TH")}`, sub: "เดือนนี้", icon: Fuel, color: "text-danger" },
  { title: "รอซ่อมบำรุง", value: stats.pendingMaintenance, sub: "นัดหมาย + กำลังดำเนินการ", icon: Wrench, color: "text-secondary" },
  { title: "ยานพาหนะที่ใช้งาน", value: stats.inUseVehicles, sub: `จาก ${stats.totalVehicles}`, icon: Clock, color: "text-default-500" },
];

export default function DashboardView({ stats, loading }) {
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

  const cards = buildCards(stats);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} shadow="none" className="border border-default-200">
            <CardBody className="p-5 gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">{card.title}</p>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-default-400">{card.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สถานะการขนส่ง</p>
            <ShipmentStatusChart data={stats.shipmentStatusDistribution} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">การขนส่งรายเดือน (6 เดือนล่าสุด)</p>
            <MonthlyShipmentChart data={stats.monthlyShipmentTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">แนวโน้มค่าน้ำมัน</p>
            <FuelCostChart data={stats.fuelCostTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">อัตราการใช้ยานพาหนะ (30 วัน)</p>
            <VehicleUtilizationChart data={stats.vehicleUtilization} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 lg:col-span-2">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สรุปค่าซ่อมบำรุง</p>
            <MaintenanceCostChart data={stats.maintenanceCostTrend} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
