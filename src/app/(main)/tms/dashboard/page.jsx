"use client";

import { Card, CardBody, Spinner } from "@heroui/react";
import { Truck, Package, Fuel, Wrench, CheckCircle, Clock } from "lucide-react";
import { useTmsDashboard } from "@/hooks/useTmsDashboard";
import ShipmentStatusChart from "@/components/charts/ShipmentStatusChart";
import MonthlyShipmentChart from "@/components/charts/MonthlyShipmentChart";
import FuelCostChart from "@/components/charts/FuelCostChart";
import VehicleUtilizationChart from "@/components/charts/VehicleUtilizationChart";
import MaintenanceCostChart from "@/components/charts/MaintenanceCostChart";

export default function TmsDashboardPage() {
  const { stats, loading } = useTmsDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">Failed to load dashboard data</p>;
  }

  const cards = [
    { title: "Total Vehicles", value: stats.totalVehicles, sub: `${stats.availableVehicles} available`, icon: Truck, color: "text-primary" },
    { title: "Active Shipments", value: stats.activeShipments, sub: `${stats.totalShipments} total`, icon: Package, color: "text-warning" },
    { title: "Completed This Month", value: stats.completedThisMonth, sub: "shipments", icon: CheckCircle, color: "text-success" },
    { title: "Fuel Cost (Month)", value: `฿${Number(stats.totalFuelCostThisMonth || 0).toLocaleString("th-TH")}`, sub: "this month", icon: Fuel, color: "text-danger" },
    { title: "Pending Maintenance", value: stats.pendingMaintenance, sub: "scheduled + in progress", icon: Wrench, color: "text-secondary" },
    { title: "In-Use Vehicles", value: stats.inUseVehicles, sub: `of ${stats.totalVehicles}`, icon: Clock, color: "text-default-500" },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <h2 className="text-lg font-semibold">Transportation Dashboard</h2>

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
            <p className="text-sm font-semibold mb-3">Shipment Status Distribution</p>
            <ShipmentStatusChart data={stats.shipmentStatusDistribution} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Monthly Shipments (Last 6 Months)</p>
            <MonthlyShipmentChart data={stats.monthlyShipmentTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Fuel Cost Trend</p>
            <FuelCostChart data={stats.fuelCostTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Vehicle Utilization (30 Days)</p>
            <VehicleUtilizationChart data={stats.vehicleUtilization} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 lg:col-span-2">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Maintenance Cost Summary</p>
            <MaintenanceCostChart data={stats.maintenanceCostTrend} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
