import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import {
  AlertTriangle,
  AlertCircle,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";

const TYPE_LABELS = {
  vehicle_registration: "ทะเบียนยานพาหนะ",
  vehicle_insurance: "ประกันภัยยานพาหนะ",
  vehicle_act: "พ.ร.บ. ยานพาหนะ",
  driver_license: "ใบขับขี่",
  maintenance_due: "ครบกำหนดซ่อมบำรุง",
  maintenance_mileage: "เลขไมล์ครบกำหนดซ่อม",
};

const TYPE_ICONS = {
  vehicle_registration: Truck,
  vehicle_insurance: Truck,
  vehicle_act: Truck,
  driver_license: User,
  maintenance_due: Wrench,
  maintenance_mileage: Wrench,
};

const columns = [
  { name: "ระดับ", uid: "severity", sortable: true },
  { name: "หัวข้อ", uid: "title", sortable: true },
  { name: "รายละเอียด", uid: "detail" },
  { name: "ประเภท", uid: "type", sortable: true },
  { name: "วันที่", uid: "date", sortable: true },
];

const VISIBLE_COLUMNS = ["severity", "title", "detail", "type", "date"];

const STATUS_OPTIONS = [
  { name: "วิกฤต", uid: "critical" },
  { name: "เตือน", uid: "warning" },
];

export default function AlertsView({
  alerts,
  alertCount,
  criticalCount,
  warningCount,
  loading,
}) {
  const renderCell = (item, columnKey) => {
    switch (columnKey) {
      case "severity":
        return (
          <Chip
            variant="flat"
            size="sm"
            color={item.severity === "critical" ? "danger" : "warning"}
            startContent={
              item.severity === "critical" ? (
                <AlertTriangle size={12} />
              ) : (
                <AlertCircle size={12} />
              )
            }
          >
            {item.severity === "critical" ? "วิกฤต" : "เตือน"}
          </Chip>
        );
      case "title":
        return <span className="font-medium">{item.title}</span>;
      case "detail":
        return (
          <span className="text-sm text-default-500">{item.detail}</span>
        );
      case "type": {
        const Icon = TYPE_ICONS[item.type] || AlertCircle;
        return (
          <Chip variant="bordered" size="sm" startContent={<Icon size={12} />}>
            {TYPE_LABELS[item.type] || item.type}
          </Chip>
        );
      }
      case "date":
        return item.date
          ? new Date(item.date).toLocaleDateString("th-TH")
          : "-";
      default:
        return item[columnKey] ?? "-";
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Summary Cards */}
      <div className="flex gap-4">
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <AlertTriangle size={24} className="text-danger" />
            <div>
              <p className="text-2xl font-bold">{criticalCount}</p>
              <p className="text-xs text-default-500">วิกฤต</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <AlertCircle size={24} className="text-warning" />
            <div>
              <p className="text-2xl font-bold">{warningCount}</p>
              <p className="text-xs text-default-500">เตือน</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <div>
              <p className="text-2xl font-bold">{alertCount}</p>
              <p className="text-xs text-default-500">แจ้งเตือนทั้งหมด</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={alerts}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาแจ้งเตือน..."
        searchKeys={["title", "detail"]}
        statusField="severity"
        statusOptions={STATUS_OPTIONS}
        filterLabel="ระดับ"
        emptyContent="ไม่พบการแจ้งเตือน"
        enableCardView
      />
    </div>
  );
}
