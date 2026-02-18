"use client";

import { useCallback } from "react";
import { Card, CardBody, Input, Button, Spinner, Tabs, Tab, Chip } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import { useTmsReports } from "@/hooks/useTmsReports";
import { exportToCsv } from "@/lib/exportCsv";
import DataTable from "@/components/ui/DataTable";

const SHIPMENT_COLUMNS = [
  { name: "Number", uid: "shipmentNumber", sortable: true },
  { name: "Date", uid: "shipmentDate", sortable: true },
  { name: "Customer", uid: "shipmentCustomerName", sortable: true },
  { name: "Destination", uid: "shipmentDestination" },
  { name: "Status", uid: "shipmentStatus", sortable: true },
];

const FUEL_COLUMNS = [
  { name: "Date", uid: "fuelLogDate", sortable: true },
  { name: "Liters", uid: "fuelLogLiters", sortable: true },
  { name: "Price/Liter", uid: "fuelLogPricePerLiter", sortable: true },
  { name: "Total Cost", uid: "fuelLogTotalCost", sortable: true },
  { name: "Station", uid: "fuelLogStation" },
];

const MAINTENANCE_COLUMNS = [
  { name: "Date", uid: "maintenanceDate", sortable: true },
  { name: "Type", uid: "maintenanceType", sortable: true },
  { name: "Description", uid: "maintenanceDescription" },
  { name: "Cost", uid: "maintenanceCost", sortable: true },
  { name: "Status", uid: "maintenanceStatus", sortable: true },
];

const VEHICLE_COLUMNS = [
  { name: "Name", uid: "vehicleName", sortable: true },
  { name: "Plate", uid: "vehiclePlateNumber", sortable: true },
  { name: "Type", uid: "vehicleType", sortable: true },
  { name: "Brand", uid: "vehicleBrand" },
  { name: "Status", uid: "vehicleStatus", sortable: true },
];

const CSV_CONFIGS = {
  shipments: [
    { header: "Number", key: "shipmentNumber" },
    { header: "Date", key: "shipmentDate" },
    { header: "Customer", key: "shipmentCustomerName" },
    { header: "Phone", key: "shipmentCustomerPhone" },
    { header: "Destination", key: "shipmentDestination" },
    { header: "Weight (Kg)", key: "shipmentWeightKg" },
    { header: "Status", key: "shipmentStatus" },
  ],
  fuelLogs: [
    { header: "Date", key: "fuelLogDate" },
    { header: "Liters", key: "fuelLogLiters" },
    { header: "Price/Liter", key: "fuelLogPricePerLiter" },
    { header: "Total Cost", key: "fuelLogTotalCost" },
    { header: "Mileage", key: "fuelLogMileage" },
    { header: "Station", key: "fuelLogStation" },
  ],
  maintenances: [
    { header: "Date", key: "maintenanceDate" },
    { header: "Type", key: "maintenanceType" },
    { header: "Description", key: "maintenanceDescription" },
    { header: "Cost", key: "maintenanceCost" },
    { header: "Vendor", key: "maintenanceVendor" },
    { header: "Status", key: "maintenanceStatus" },
  ],
  vehicles: [
    { header: "Name", key: "vehicleName" },
    { header: "Plate Number", key: "vehiclePlateNumber" },
    { header: "Type", key: "vehicleType" },
    { header: "Brand", key: "vehicleBrand" },
    { header: "Model", key: "vehicleModel" },
    { header: "Fuel Type", key: "vehicleFuelType" },
    { header: "Status", key: "vehicleStatus" },
  ],
};

const TAB_COLUMNS = {
  shipments: SHIPMENT_COLUMNS,
  fuelLogs: FUEL_COLUMNS,
  maintenances: MAINTENANCE_COLUMNS,
  vehicles: VEHICLE_COLUMNS,
};

const ROW_KEYS = {
  shipments: "shipmentId",
  fuelLogs: "fuelLogId",
  maintenances: "maintenanceId",
  vehicles: "vehicleId",
};

export default function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    loading,
    summary,
  } = useTmsReports();

  const handleExport = () => {
    const csvCols = CSV_CONFIGS[activeTab] || [];
    exportToCsv(`tms-${activeTab}-report.csv`, csvCols, data);
  };

  const renderCell = useCallback((item, columnKey) => {
    const value = item[columnKey];
    if (columnKey.includes("Date") || columnKey.includes("date")) {
      return value ? new Date(value).toLocaleDateString("th-TH") : "-";
    }
    if (columnKey.includes("Cost") || columnKey.includes("cost") || columnKey === "fuelLogPricePerLiter") {
      return value ? `฿${Number(value).toLocaleString()}` : "-";
    }
    if (columnKey.includes("Status") || columnKey.includes("status")) {
      return (
        <Chip variant="bordered" size="sm" radius="md">
          {value || "-"}
        </Chip>
      );
    }
    return value ?? "-";
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transportation Reports</h2>
        <div className="flex gap-2">
          <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={handleExport}>
            Export CSV
          </Button>
          <Button variant="bordered" size="md" radius="md" startContent={<Printer size={16} />} onPress={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-end print:hidden">
        <Input type="date" label="Start Date" labelPlacement="outside" variant="bordered" size="md" radius="md" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="max-w-[200px]" />
        <Input type="date" label="End Date" labelPlacement="outside" variant="bordered" size="md" radius="md" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="max-w-[200px]" />
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab} variant="bordered" size="md" radius="md" className="print:hidden">
        <Tab key="shipments" title="Shipments" />
        <Tab key="fuelLogs" title="Fuel Logs" />
        <Tab key="maintenances" title="Maintenance" />
        <Tab key="vehicles" title="Vehicles" />
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Total Records</p>
            <p className="text-xl font-bold">{summary.total}</p>
          </CardBody>
        </Card>
        {activeTab === "fuelLogs" && (
          <>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">Total Liters</p>
                <p className="text-xl font-bold">{Number(summary.totalLiters).toLocaleString()}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">Total Cost</p>
                <p className="text-xl font-bold">฿{Number(summary.totalCost).toLocaleString()}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">Avg Cost/Liter</p>
                <p className="text-xl font-bold">฿{summary.avgCostPerLiter}</p>
              </CardBody>
            </Card>
          </>
        )}
        {activeTab === "maintenances" && (
          <Card shadow="none" className="border border-default-200">
            <CardBody className="p-4">
              <p className="text-xs text-default-500">Total Cost</p>
              <p className="text-xl font-bold">฿{Number(summary.totalCost).toLocaleString()}</p>
            </CardBody>
          </Card>
        )}
        {(activeTab === "shipments" || activeTab === "vehicles") && summary.byStatus && (
          Object.entries(summary.byStatus).map(([status, count]) => (
            <Card key={status} shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500 capitalize">{status.replace(/_/g, " ")}</p>
                <p className="text-xl font-bold">{count}</p>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={TAB_COLUMNS[activeTab] || []}
          data={data}
          renderCell={renderCell}
          rowKey={ROW_KEYS[activeTab] || "id"}
          isLoading={loading}
          initialVisibleColumns={TAB_COLUMNS[activeTab]?.map((c) => c.uid)}
          emptyContent="No data for selected period"
        />
      )}
    </div>
  );
}
