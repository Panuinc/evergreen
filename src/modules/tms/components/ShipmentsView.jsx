import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_HQ } from "@/modules/tms/constants";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, ChevronDown, Download, ClipboardCheck } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import { useRBAC } from "@/contexts/RBACContext";

const shipmentCsvColumns = [
  { header: "เลขที่", key: "tmsShipmentNumber" },
  { header: "วันที่", key: "tmsShipmentDate" },
  { header: "ลูกค้า", key: "tmsShipmentCustomerName" },
  { header: "โทรศัพท์", key: "tmsShipmentCustomerPhone" },
  { header: "ปลายทาง", key: "tmsShipmentDestination" },
  { header: "น้ำหนัก (กก.)", key: "tmsShipmentWeightKg" },
  { header: "สถานะ", key: "tmsShipmentStatus" },
];

const baseColumns = [
  { name: "เลขที่", uid: "tmsShipmentNumber", sortable: true },
  { name: "วันที่", uid: "tmsShipmentDate", sortable: true },
  { name: "ลูกค้า", uid: "tmsShipmentCustomerName", sortable: true },
  { name: "ปลายทาง", uid: "tmsShipmentDestination", sortable: true },
  { name: "ยานพาหนะ", uid: "vehicle" },
  { name: "พนักงานขับรถ", uid: "driver" },
  { name: "สถานะ", uid: "tmsShipmentStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "แบบร่าง", uid: "draft" },
  { name: "ยืนยันแล้ว", uid: "confirmed" },
  { name: "จัดส่งแล้ว", uid: "dispatched" },
  { name: "กำลังขนส่ง", uid: "in_transit" },
  { name: "ถึงแล้ว", uid: "arrived" },
  { name: "ส่งแล้ว", uid: "delivered" },
  { name: "ยืนยัน POD แล้ว", uid: "pod_confirmed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const STATUS_COLORS = {
  draft: "default",
  confirmed: "primary",
  dispatched: "warning",
  in_transit: "secondary",
  arrived: "success",
  delivered: "success",
  pod_confirmed: "success",
  cancelled: "danger",
};

const NEXT_STATUS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["arrived"],
  arrived: ["delivered"],
  delivered: ["pod_confirmed"],
};

const STATUS_LABELS = {
  draft: "แบบร่าง",
  confirmed: "ยืนยันแล้ว",
  dispatched: "จัดส่งแล้ว",
  in_transit: "กำลังขนส่ง",
  arrived: "ถึงแล้ว",
  delivered: "ส่งแล้ว",
  pod_confirmed: "ยืนยัน POD แล้ว",
  cancelled: "ยกเลิก",
};

const BASE_VISIBLE_COLUMNS = [
  "tmsShipmentNumber",
  "tmsShipmentDate",
  "tmsShipmentCustomerName",
  "tmsShipmentDestination",
  "vehicle",
  "tmsShipmentStatus",
  "actions",
];

export default function ShipmentsView({
  shipments,
  vehicles,
  drivers,
  routes,
  loading,
  saving,
  editingShipment,
  formData,
  deletingShipment,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  handleStatusChange,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();
  const router = useRouter();

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
  }, [isSuperAdmin]);

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      const actionsCol = baseColumns[baseColumns.length - 1];
      return [
        ...baseColumns.slice(0, -1),
        { name: "สถานะใช้งาน", uid: "isActive" },
        actionsCol,
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "tmsShipmentNumber":
          return <span className="font-medium">{item.tmsShipmentNumber}</span>;
        case "tmsShipmentDate":
          return item.tmsShipmentDate
            ? new Date(item.tmsShipmentDate).toLocaleDateString("th-TH")
            : "-";
        case "tmsShipmentCustomerName":
          return item.tmsShipmentCustomerName || "-";
        case "tmsShipmentDestination":
          return item.tmsShipmentDestination || "-";
        case "vehicle": {
          const v = vehicles.find((v) => v.tmsVehicleId === item.tmsShipmentVehicleId);
          return v ? v.tmsVehiclePlateNumber : "-";
        }
        case "driver": {
          const d = drivers.find((d) => d.tmsDriverId === item.tmsShipmentDriverId);
          return d ? `${d.tmsDriverFirstName} ${d.tmsDriverLastName}` : "-";
        }
        case "tmsShipmentStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.tmsShipmentStatus] || "default"}
            >
              {STATUS_LABELS[item.tmsShipmentStatus] || item.tmsShipmentStatus}
            </Chip>
          );
        case "isActive":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={item.isActive ? "success" : "danger"}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        case "actions": {
          const nextStatuses = NEXT_STATUS[item.tmsShipmentStatus] || [];
          return (
            <div className="flex items-center gap-1">
              {nextStatuses.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="bordered" size="md" radius="md" isIconOnly>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => handleStatusChange(item.tmsShipmentId, key)}
                  >
                    {nextStatuses.map((s) => (
                      <DropdownItem key={s}>
                        {STATUS_LABELS[s] || s}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {!["pod_confirmed", "cancelled", "draft"].includes(item.tmsShipmentStatus) && (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  color="success"
                  isIconOnly
                  onPress={() => router.push(`/tms/deliveries?shipmentId=${item.tmsShipmentId}`)}
                >
                  <ClipboardCheck size={16} />
                </Button>
              )}
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit size={16} />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="sm"
                  isSelected={item.isActive}
                  onValueChange={() => toggleActive(item)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(item)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [vehicles, drivers, handleOpen, confirmDelete, handleStatusChange, toggleActive, isSuperAdmin, router],
  );

  const availableVehicles = vehicles.filter((v) => v.tmsVehicleStatus === "available");
  const availableDrivers = drivers.filter((d) => d.tmsDriverStatus === "available" && d.tmsDriverRole === "driver");
  const availableAssistants = drivers.filter((d) => d.tmsDriverStatus === "available" && d.tmsDriverRole === "assistant");

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={shipments}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsShipmentId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยเลขที่, ลูกค้า..."
        searchKeys={["tmsShipmentNumber", "tmsShipmentCustomerName", "tmsShipmentDestination"]}
        statusField="tmsShipmentStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบการขนส่ง"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("shipments.csv", shipmentCsvColumns, shipments)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus size={16} />} onPress={() => handleOpen()}>
              สร้างการขนส่ง
            </Button>
          </div>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingShipment ? "แก้ไขการขนส่ง" : "สร้างการขนส่ง"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="ชื่อลูกค้า" labelPlacement="outside" placeholder="กรอกชื่อลูกค้า" variant="bordered" size="md" radius="md" value={formData.tmsShipmentCustomerName} onChange={(e) => updateField("tmsShipmentCustomerName", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="เบอร์โทรลูกค้า" labelPlacement="outside" placeholder="กรอกเบอร์โทร" variant="bordered" size="md" radius="md" value={formData.tmsShipmentCustomerPhone} onChange={(e) => updateField("tmsShipmentCustomerPhone", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="ที่อยู่ลูกค้า" labelPlacement="outside" placeholder="กรอกที่อยู่" variant="bordered" size="md" radius="md" value={formData.tmsShipmentCustomerAddress} onChange={(e) => updateField("tmsShipmentCustomerAddress", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="จุดเริ่มต้น" labelPlacement="outside" variant="bordered" size="md" radius="md" value={COMPANY_HQ.address} isReadOnly />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="ปลายทาง" labelPlacement="outside" placeholder="กรอกปลายทาง" variant="bordered" size="md" radius="md" value={formData.tmsShipmentDestination} onChange={(e) => updateField("tmsShipmentDestination", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="date" label="วันที่ส่ง" labelPlacement="outside" variant="bordered" size="md" radius="md" value={formData.tmsShipmentDate} onChange={(e) => updateField("tmsShipmentDate", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="เส้นทาง" labelPlacement="outside" placeholder="เลือกเส้นทาง" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentRouteId ? [formData.tmsShipmentRouteId] : []} onSelectionChange={(keys) => updateField("tmsShipmentRouteId", Array.from(keys)[0] || "")}>
                    {routes.map((r) => (<SelectItem key={r.tmsRouteId}>{r.tmsRouteName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="ยานพาหนะ" labelPlacement="outside" placeholder="เลือกยานพาหนะ" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentVehicleId ? [formData.tmsShipmentVehicleId] : []} onSelectionChange={(keys) => updateField("tmsShipmentVehicleId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? vehicles : availableVehicles).map((v) => (<SelectItem key={v.tmsVehicleId}>{v.tmsVehicleName} ({v.tmsVehiclePlateNumber})</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="พนักงานขับรถ" labelPlacement="outside" placeholder="เลือกพนักงานขับรถ" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentDriverId ? [formData.tmsShipmentDriverId] : []} onSelectionChange={(keys) => updateField("tmsShipmentDriverId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.tmsDriverRole === "driver") : availableDrivers).map((d) => (<SelectItem key={d.tmsDriverId}>{d.tmsDriverFirstName} {d.tmsDriverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="ผู้ช่วย" labelPlacement="outside" placeholder="เลือกผู้ช่วย" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentAssistantId ? [formData.tmsShipmentAssistantId] : []} onSelectionChange={(keys) => updateField("tmsShipmentAssistantId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.tmsDriverRole === "assistant") : availableAssistants).map((d) => (<SelectItem key={d.tmsDriverId}>{d.tmsDriverFirstName} {d.tmsDriverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="อ้างอิงใบสั่งขาย" labelPlacement="outside" placeholder="เลขที่ใบสั่ง BC" variant="bordered" size="md" radius="md" value={formData.tmsShipmentSalesOrderRef} onChange={(e) => updateField("tmsShipmentSalesOrderRef", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="number" label="น้ำหนัก (กก.)" labelPlacement="outside" placeholder="กรอกน้ำหนัก" variant="bordered" size="md" radius="md" value={formData.tmsShipmentWeightKg} onChange={(e) => updateField("tmsShipmentWeightKg", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="รายการสินค้า" labelPlacement="outside" placeholder="รายละเอียดสินค้า" variant="bordered" size="md" radius="md" value={formData.tmsShipmentItemsSummary} onChange={(e) => updateField("tmsShipmentItemsSummary", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="หมายเหตุ" labelPlacement="outside" placeholder="หมายเหตุเพิ่มเติม" variant="bordered" size="md" radius="md" value={formData.tmsShipmentNotes} onChange={(e) => updateField("tmsShipmentNotes", e.target.value)} />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleSave} isLoading={saving}>{editingShipment ? "อัปเดต" : "สร้าง"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบการขนส่ง</ModalHeader>
          <ModalBody>
            <p>คุณต้องการลบการขนส่ง <span className="font-semibold">{deletingShipment?.tmsShipmentNumber}</span> หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={deleteModal.onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleDelete}>ลบ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
