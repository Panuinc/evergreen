"use client";

import { useCallback } from "react";
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
} from "@heroui/react";
import { Plus, Edit, Trash2, ChevronDown, Download } from "lucide-react";
import { useShipments } from "@/hooks/tms/useShipments";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const shipmentCsvColumns = [
  { header: "เลขที่", key: "shipmentNumber" },
  { header: "วันที่", key: "shipmentDate" },
  { header: "ลูกค้า", key: "shipmentCustomerName" },
  { header: "โทรศัพท์", key: "shipmentCustomerPhone" },
  { header: "ปลายทาง", key: "shipmentDestination" },
  { header: "น้ำหนัก (กก.)", key: "shipmentWeightKg" },
  { header: "สถานะ", key: "shipmentStatus" },
];

const columns = [
  { name: "เลขที่", uid: "shipmentNumber", sortable: true },
  { name: "วันที่", uid: "shipmentDate", sortable: true },
  { name: "ลูกค้า", uid: "shipmentCustomerName", sortable: true },
  { name: "ปลายทาง", uid: "shipmentDestination", sortable: true },
  { name: "ยานพาหนะ", uid: "vehicle" },
  { name: "พนักงานขับรถ", uid: "driver" },
  { name: "สถานะ", uid: "shipmentStatus", sortable: true },
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

const INITIAL_VISIBLE_COLUMNS = [
  "shipmentNumber",
  "shipmentDate",
  "shipmentCustomerName",
  "shipmentDestination",
  "vehicle",
  "shipmentStatus",
  "actions",
];

export default function ShipmentsPage() {
  const {
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
  } = useShipments();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "shipmentNumber":
          return <span className="font-medium">{item.shipmentNumber}</span>;
        case "shipmentDate":
          return item.shipmentDate
            ? new Date(item.shipmentDate).toLocaleDateString("th-TH")
            : "-";
        case "shipmentCustomerName":
          return item.shipmentCustomerName || "-";
        case "shipmentDestination":
          return item.shipmentDestination || "-";
        case "vehicle": {
          const v = vehicles.find((v) => v.vehicleId === item.shipmentVehicleId);
          return v ? v.vehiclePlateNumber : "-";
        }
        case "driver": {
          const d = drivers.find((d) => d.driverId === item.shipmentDriverId);
          return d ? `${d.driverFirstName} ${d.driverLastName}` : "-";
        }
        case "shipmentStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.shipmentStatus] || "default"}
            >
              {STATUS_LABELS[item.shipmentStatus] || item.shipmentStatus}
            </Chip>
          );
        case "actions": {
          const nextStatuses = NEXT_STATUS[item.shipmentStatus] || [];
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
                    onAction={(key) => handleStatusChange(item.shipmentId, key)}
                  >
                    {nextStatuses.map((s) => (
                      <DropdownItem key={s}>
                        {STATUS_LABELS[s] || s}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
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
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [vehicles, drivers, handleOpen, confirmDelete, handleStatusChange],
  );

  const availableVehicles = vehicles.filter((v) => v.vehicleStatus === "available");
  const availableDrivers = drivers.filter((d) => d.driverStatus === "available" && d.driverRole === "driver");
  const availableAssistants = drivers.filter((d) => d.driverStatus === "available" && d.driverRole === "assistant");

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={shipments}
        renderCell={renderCell}
        enableCardView
        rowKey="shipmentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ลูกค้า..."
        searchKeys={["shipmentNumber", "shipmentCustomerName", "shipmentDestination"]}
        statusField="shipmentStatus"
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
                  <Input label="ชื่อลูกค้า" labelPlacement="outside" placeholder="กรอกชื่อลูกค้า" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerName} onChange={(e) => updateField("shipmentCustomerName", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="เบอร์โทรลูกค้า" labelPlacement="outside" placeholder="กรอกเบอร์โทร" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerPhone} onChange={(e) => updateField("shipmentCustomerPhone", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="ที่อยู่ลูกค้า" labelPlacement="outside" placeholder="กรอกที่อยู่" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerAddress} onChange={(e) => updateField("shipmentCustomerAddress", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="ปลายทาง" labelPlacement="outside" placeholder="กรอกปลายทาง" variant="bordered" size="md" radius="md" value={formData.shipmentDestination} onChange={(e) => updateField("shipmentDestination", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="เส้นทาง" labelPlacement="outside" placeholder="เลือกเส้นทาง" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentRouteId ? [formData.shipmentRouteId] : []} onSelectionChange={(keys) => updateField("shipmentRouteId", Array.from(keys)[0] || "")}>
                    {routes.map((r) => (<SelectItem key={r.routeId}>{r.routeName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="ยานพาหนะ" labelPlacement="outside" placeholder="เลือกยานพาหนะ" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentVehicleId ? [formData.shipmentVehicleId] : []} onSelectionChange={(keys) => updateField("shipmentVehicleId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? vehicles : availableVehicles).map((v) => (<SelectItem key={v.vehicleId}>{v.vehicleName} ({v.vehiclePlateNumber})</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="พนักงานขับรถ" labelPlacement="outside" placeholder="เลือกพนักงานขับรถ" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentDriverId ? [formData.shipmentDriverId] : []} onSelectionChange={(keys) => updateField("shipmentDriverId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.driverRole === "driver") : availableDrivers).map((d) => (<SelectItem key={d.driverId}>{d.driverFirstName} {d.driverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="ผู้ช่วย" labelPlacement="outside" placeholder="เลือกผู้ช่วย" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentAssistantId ? [formData.shipmentAssistantId] : []} onSelectionChange={(keys) => updateField("shipmentAssistantId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.driverRole === "assistant") : availableAssistants).map((d) => (<SelectItem key={d.driverId}>{d.driverFirstName} {d.driverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="อ้างอิงใบสั่งขาย" labelPlacement="outside" placeholder="เลขที่ใบสั่ง BC" variant="bordered" size="md" radius="md" value={formData.shipmentSalesOrderRef} onChange={(e) => updateField("shipmentSalesOrderRef", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="number" label="น้ำหนัก (กก.)" labelPlacement="outside" placeholder="กรอกน้ำหนัก" variant="bordered" size="md" radius="md" value={formData.shipmentWeightKg} onChange={(e) => updateField("shipmentWeightKg", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="รายการสินค้า" labelPlacement="outside" placeholder="รายละเอียดสินค้า" variant="bordered" size="md" radius="md" value={formData.shipmentItemsSummary} onChange={(e) => updateField("shipmentItemsSummary", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="หมายเหตุ" labelPlacement="outside" placeholder="หมายเหตุเพิ่มเติม" variant="bordered" size="md" radius="md" value={formData.shipmentNotes} onChange={(e) => updateField("shipmentNotes", e.target.value)} />
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
            <p>คุณต้องการลบการขนส่ง <span className="font-semibold">{deletingShipment?.shipmentNumber}</span> หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
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
