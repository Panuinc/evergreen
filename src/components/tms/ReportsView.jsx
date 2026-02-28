import { useCallback } from "react";
import { Card, CardBody, Input, Button, Spinner, Tabs, Tab, Chip } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import DataTable from "@/components/ui/DataTable";

const SHIPMENT_COLUMNS = [
  { name: "เลขที่", uid: "tmsShipmentNumber", sortable: true },
  { name: "วันที่", uid: "tmsShipmentDate", sortable: true },
  { name: "ลูกค้า", uid: "tmsShipmentCustomerName", sortable: true },
  { name: "ปลายทาง", uid: "tmsShipmentDestination" },
  { name: "สถานะ", uid: "tmsShipmentStatus", sortable: true },
];

const FUEL_COLUMNS = [
  { name: "วันที่", uid: "tmsFuelLogDate", sortable: true },
  { name: "ลิตร", uid: "tmsFuelLogLiters", sortable: true },
  { name: "ราคา/ลิตร", uid: "tmsFuelLogPricePerLiter", sortable: true },
  { name: "ค่าใช้จ่ายรวม", uid: "tmsFuelLogTotalCost", sortable: true },
  { name: "สถานี", uid: "tmsFuelLogStation" },
];

const MAINTENANCE_COLUMNS = [
  { name: "วันที่", uid: "tmsMaintenanceDate", sortable: true },
  { name: "ประเภท", uid: "tmsMaintenanceType", sortable: true },
  { name: "รายละเอียด", uid: "tmsMaintenanceDescription" },
  { name: "ค่าใช้จ่าย", uid: "tmsMaintenanceCost", sortable: true },
  { name: "สถานะ", uid: "tmsMaintenanceStatus", sortable: true },
];

const VEHICLE_COLUMNS = [
  { name: "ชื่อ", uid: "tmsVehicleName", sortable: true },
  { name: "ทะเบียน", uid: "tmsVehiclePlateNumber", sortable: true },
  { name: "ประเภท", uid: "tmsVehicleType", sortable: true },
  { name: "ยี่ห้อ", uid: "tmsVehicleBrand" },
  { name: "สถานะ", uid: "tmsVehicleStatus", sortable: true },
];

const CSV_CONFIGS = {
  shipments: [
    { header: "เลขที่", key: "tmsShipmentNumber" },
    { header: "วันที่", key: "tmsShipmentDate" },
    { header: "ลูกค้า", key: "tmsShipmentCustomerName" },
    { header: "โทรศัพท์", key: "tmsShipmentCustomerPhone" },
    { header: "ปลายทาง", key: "tmsShipmentDestination" },
    { header: "น้ำหนัก (กก.)", key: "tmsShipmentWeightKg" },
    { header: "สถานะ", key: "tmsShipmentStatus" },
  ],
  fuelLogs: [
    { header: "วันที่", key: "tmsFuelLogDate" },
    { header: "ลิตร", key: "tmsFuelLogLiters" },
    { header: "ราคา/ลิตร", key: "tmsFuelLogPricePerLiter" },
    { header: "ค่าใช้จ่ายรวม", key: "tmsFuelLogTotalCost" },
    { header: "เลขไมล์", key: "tmsFuelLogMileage" },
    { header: "สถานี", key: "tmsFuelLogStation" },
  ],
  maintenances: [
    { header: "วันที่", key: "tmsMaintenanceDate" },
    { header: "ประเภท", key: "tmsMaintenanceType" },
    { header: "รายละเอียด", key: "tmsMaintenanceDescription" },
    { header: "ค่าใช้จ่าย", key: "tmsMaintenanceCost" },
    { header: "ผู้ให้บริการ", key: "tmsMaintenanceVendor" },
    { header: "สถานะ", key: "tmsMaintenanceStatus" },
  ],
  vehicles: [
    { header: "ชื่อ", key: "tmsVehicleName" },
    { header: "ทะเบียนรถ", key: "tmsVehiclePlateNumber" },
    { header: "ประเภท", key: "tmsVehicleType" },
    { header: "ยี่ห้อ", key: "tmsVehicleBrand" },
    { header: "รุ่น", key: "tmsVehicleModel" },
    { header: "ชนิดเชื้อเพลิง", key: "tmsVehicleFuelType" },
    { header: "สถานะ", key: "tmsVehicleStatus" },
  ],
};

const TAB_COLUMNS = {
  shipments: SHIPMENT_COLUMNS,
  fuelLogs: FUEL_COLUMNS,
  maintenances: MAINTENANCE_COLUMNS,
  vehicles: VEHICLE_COLUMNS,
};

const ROW_KEYS = {
  shipments: "tmsShipmentId",
  fuelLogs: "tmsFuelLogId",
  maintenances: "tmsMaintenanceId",
  vehicles: "tmsVehicleId",
};

export default function ReportsView({
  activeTab,
  setActiveTab,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  data,
  loading,
  summary,
}) {
  const handleExport = () => {
    const csvCols = CSV_CONFIGS[activeTab] || [];
    exportToCsv(`tms-${activeTab}-report.csv`, csvCols, data);
  };

  const renderCell = useCallback((item, columnKey) => {
    const value = item[columnKey];
    if (columnKey.includes("Date") || columnKey.includes("date")) {
      return value ? new Date(value).toLocaleDateString("th-TH") : "-";
    }
    if (columnKey.includes("Cost") || columnKey.includes("cost") || columnKey === "tmsFuelLogPricePerLiter") {
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
