"use client";

import { useCallback } from "react";
import { Card, CardBody, Input, Button, Spinner, Tabs, Tab, Chip } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import { useTmsReports } from "@/hooks/useTmsReports";
import { exportToCsv } from "@/lib/exportCsv";
import DataTable from "@/components/ui/DataTable";

const SHIPMENT_COLUMNS = [
  { name: "เลขที่", uid: "shipmentNumber", sortable: true },
  { name: "วันที่", uid: "shipmentDate", sortable: true },
  { name: "ลูกค้า", uid: "shipmentCustomerName", sortable: true },
  { name: "ปลายทาง", uid: "shipmentDestination" },
  { name: "สถานะ", uid: "shipmentStatus", sortable: true },
];

const FUEL_COLUMNS = [
  { name: "วันที่", uid: "fuelLogDate", sortable: true },
  { name: "ลิตร", uid: "fuelLogLiters", sortable: true },
  { name: "ราคา/ลิตร", uid: "fuelLogPricePerLiter", sortable: true },
  { name: "ค่าใช้จ่ายรวม", uid: "fuelLogTotalCost", sortable: true },
  { name: "สถานี", uid: "fuelLogStation" },
];

const MAINTENANCE_COLUMNS = [
  { name: "วันที่", uid: "maintenanceDate", sortable: true },
  { name: "ประเภท", uid: "maintenanceType", sortable: true },
  { name: "รายละเอียด", uid: "maintenanceDescription" },
  { name: "ค่าใช้จ่าย", uid: "maintenanceCost", sortable: true },
  { name: "สถานะ", uid: "maintenanceStatus", sortable: true },
];

const VEHICLE_COLUMNS = [
  { name: "ชื่อ", uid: "vehicleName", sortable: true },
  { name: "ทะเบียน", uid: "vehiclePlateNumber", sortable: true },
  { name: "ประเภท", uid: "vehicleType", sortable: true },
  { name: "ยี่ห้อ", uid: "vehicleBrand" },
  { name: "สถานะ", uid: "vehicleStatus", sortable: true },
];

const CSV_CONFIGS = {
  shipments: [
    { header: "เลขที่", key: "shipmentNumber" },
    { header: "วันที่", key: "shipmentDate" },
    { header: "ลูกค้า", key: "shipmentCustomerName" },
    { header: "โทรศัพท์", key: "shipmentCustomerPhone" },
    { header: "ปลายทาง", key: "shipmentDestination" },
    { header: "น้ำหนัก (กก.)", key: "shipmentWeightKg" },
    { header: "สถานะ", key: "shipmentStatus" },
  ],
  fuelLogs: [
    { header: "วันที่", key: "fuelLogDate" },
    { header: "ลิตร", key: "fuelLogLiters" },
    { header: "ราคา/ลิตร", key: "fuelLogPricePerLiter" },
    { header: "ค่าใช้จ่ายรวม", key: "fuelLogTotalCost" },
    { header: "เลขไมล์", key: "fuelLogMileage" },
    { header: "สถานี", key: "fuelLogStation" },
  ],
  maintenances: [
    { header: "วันที่", key: "maintenanceDate" },
    { header: "ประเภท", key: "maintenanceType" },
    { header: "รายละเอียด", key: "maintenanceDescription" },
    { header: "ค่าใช้จ่าย", key: "maintenanceCost" },
    { header: "ผู้ให้บริการ", key: "maintenanceVendor" },
    { header: "สถานะ", key: "maintenanceStatus" },
  ],
  vehicles: [
    { header: "ชื่อ", key: "vehicleName" },
    { header: "ทะเบียนรถ", key: "vehiclePlateNumber" },
    { header: "ประเภท", key: "vehicleType" },
    { header: "ยี่ห้อ", key: "vehicleBrand" },
    { header: "รุ่น", key: "vehicleModel" },
    { header: "ชนิดเชื้อเพลิง", key: "vehicleFuelType" },
    { header: "สถานะ", key: "vehicleStatus" },
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
        <Chip variant="bordered" size="md" radius="md">
          {value || "-"}
        </Chip>
      );
    }
    return value ?? "-";
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">รายงานระบบขนส่ง</h2>
        <div className="flex gap-2">
          <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={handleExport}>
            ส่งออก CSV
          </Button>
          <Button variant="bordered" size="md" radius="md" startContent={<Printer size={16} />} onPress={() => window.print()}>
            พิมพ์
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-end print:hidden">
        <Input type="date" label="วันที่เริ่มต้น" labelPlacement="outside" variant="bordered" size="md" radius="md" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="max-w-[200px]" />
        <Input type="date" label="วันที่สิ้นสุด" labelPlacement="outside" variant="bordered" size="md" radius="md" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="max-w-[200px]" />
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab} variant="bordered" size="md" radius="md" className="print:hidden">
        <Tab key="shipments" title="การขนส่ง" />
        <Tab key="fuelLogs" title="บันทึกน้ำมัน" />
        <Tab key="maintenances" title="ซ่อมบำรุง" />
        <Tab key="vehicles" title="ยานพาหนะ" />
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-4">
            <p className="text-xs text-default-500">จำนวนทั้งหมด</p>
            <p className="text-xl font-bold">{summary.total}</p>
          </CardBody>
        </Card>
        {activeTab === "fuelLogs" && (
          <>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">ลิตรทั้งหมด</p>
                <p className="text-xl font-bold">{Number(summary.totalLiters).toLocaleString()}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">ค่าใช้จ่ายรวม</p>
                <p className="text-xl font-bold">฿{Number(summary.totalCost).toLocaleString()}</p>
              </CardBody>
            </Card>
            <Card shadow="none" className="border border-default-200">
              <CardBody className="p-4">
                <p className="text-xs text-default-500">เฉลี่ยต่อลิตร</p>
                <p className="text-xl font-bold">฿{summary.avgCostPerLiter}</p>
              </CardBody>
            </Card>
          </>
        )}
        {activeTab === "maintenances" && (
          <Card shadow="none" className="border border-default-200">
            <CardBody className="p-4">
              <p className="text-xs text-default-500">ค่าใช้จ่ายรวม</p>
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
          emptyContent="ไม่มีข้อมูลในช่วงเวลาที่เลือก"
        />
      )}
    </div>
  );
}
