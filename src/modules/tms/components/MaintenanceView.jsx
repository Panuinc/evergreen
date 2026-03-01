import { useCallback, useMemo } from "react";
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
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import { useRBAC } from "@/contexts/RBACContext";

const maintenanceCsvColumns = [
  { header: "วันที่", key: "tmsMaintenanceDate" },
  { header: "ประเภท", key: "tmsMaintenanceType" },
  { header: "รายละเอียด", key: "tmsMaintenanceDescription" },
  { header: "ค่าใช้จ่าย", key: "tmsMaintenanceCost" },
  { header: "ผู้ให้บริการ", key: "tmsMaintenanceVendor" },
  { header: "สถานะ", key: "tmsMaintenanceStatus" },
];

const baseColumns = [
  { name: "วันที่", uid: "tmsMaintenanceDate", sortable: true },
  { name: "ยานพาหนะ", uid: "tmsVehicleName", sortable: true },
  { name: "ประเภท", uid: "tmsMaintenanceType", sortable: true },
  { name: "รายละเอียด", uid: "tmsMaintenanceDescription" },
  { name: "ค่าใช้จ่าย", uid: "tmsMaintenanceCost", sortable: true },
  { name: "สถานะ", uid: "tmsMaintenanceStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "นัดหมาย", uid: "scheduled" },
  { name: "กำลังดำเนินการ", uid: "in_progress" },
  { name: "เสร็จสิ้น", uid: "completed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const BASE_VISIBLE_COLUMNS = [
  "tmsMaintenanceDate",
  "tmsVehicleName",
  "tmsMaintenanceType",
  "tmsMaintenanceDescription",
  "tmsMaintenanceCost",
  "tmsMaintenanceStatus",
  "actions",
];

const statusColorMap = {
  scheduled: "primary",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
};

export default function MaintenanceView({
  maintenance,
  vehicles,
  loading,
  saving,
  editingMaintenance,
  formData,
  deletingMaintenance,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();

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
        case "tmsMaintenanceDate":
          return (
            <span className="text-default-500">
              {item.tmsMaintenanceDate
                ? new Date(item.tmsMaintenanceDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "tmsVehicleName": {
          const vehicle = vehicles.find(
            (v) => v.tmsVehicleId === item.tmsMaintenanceVehicleId,
          );
          return vehicle
            ? `${vehicle.tmsVehicleName} (${vehicle.tmsVehiclePlateNumber})`
            : "-";
        }
        case "tmsMaintenanceType":
          return item.tmsMaintenanceType
            ? item.tmsMaintenanceType.charAt(0).toUpperCase() +
                item.tmsMaintenanceType.slice(1).replace(/_/g, " ")
            : "-";
        case "tmsMaintenanceDescription":
          return (
            <span className="text-default-500">
              {item.tmsMaintenanceDescription || "-"}
            </span>
          );
        case "tmsMaintenanceCost":
          return item.tmsMaintenanceCost
            ? `฿${Number(item.tmsMaintenanceCost).toLocaleString()}`
            : "-";
        case "tmsMaintenanceStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={statusColorMap[item.tmsMaintenanceStatus] || "default"}
            >
              {item.tmsMaintenanceStatus}
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
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit />
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
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete, toggleActive, isSuperAdmin, vehicles],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={maintenance}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsMaintenanceId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยรายละเอียด, ผู้ให้บริการ..."
        searchKeys={[
          "tmsMaintenanceDescription",
          "tmsMaintenanceVendor",
        ]}
        statusField="tmsMaintenanceStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบรายการซ่อมบำรุง"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("maintenance.csv", maintenanceCsvColumns, maintenance)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              เพิ่มรายการซ่อมบำรุง
            </Button>
          </div>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingMaintenance ? "แก้ไขรายการซ่อมบำรุง" : "เพิ่มรายการซ่อมบำรุง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ยานพาหนะ"
                    labelPlacement="outside"
                    placeholder="เลือกยานพาหนะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsMaintenanceVehicleId
                        ? [formData.tmsMaintenanceVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsMaintenanceVehicleId", val);
                    }}
                    isRequired
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.tmsVehicleId}>
                        {v.tmsVehicleName} ({v.tmsVehiclePlateNumber})
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภท"
                    labelPlacement="outside"
                    placeholder="เลือกประเภท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsMaintenanceType
                        ? [formData.tmsMaintenanceType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsMaintenanceType", val);
                    }}
                  >
                    <SelectItem key="preventive">ป้องกัน</SelectItem>
                    <SelectItem key="repair">ซ่อม</SelectItem>
                    <SelectItem key="inspection">ตรวจสภาพ</SelectItem>
                    <SelectItem key="tire">ยาง</SelectItem>
                    <SelectItem key="oil_change">เปลี่ยนถ่ายน้ำมัน</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รายละเอียด"
                    labelPlacement="outside"
                    placeholder="กรอกรายละเอียด"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceDescription}
                    onChange={(e) =>
                      updateField("tmsMaintenanceDescription", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceDate}
                    onChange={(e) =>
                      updateField("tmsMaintenanceDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่เสร็จ"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceCompletedDate}
                    onChange={(e) =>
                      updateField("tmsMaintenanceCompletedDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceMileage}
                    onChange={(e) =>
                      updateField("tmsMaintenanceMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ค่าใช้จ่าย"
                    labelPlacement="outside"
                    placeholder="กรอกค่าใช้จ่าย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceCost}
                    onChange={(e) =>
                      updateField("tmsMaintenanceCost", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้ให้บริการ"
                    labelPlacement="outside"
                    placeholder="กรอกผู้ให้บริการ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceVendor}
                    onChange={(e) =>
                      updateField("tmsMaintenanceVendor", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.tmsMaintenanceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "scheduled";
                      updateField("tmsMaintenanceStatus", val);
                    }}
                  >
                    <SelectItem key="scheduled">นัดหมาย</SelectItem>
                    <SelectItem key="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem key="cancelled">ยกเลิก</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันนัดครั้งถัดไป"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceNextDueDate}
                    onChange={(e) =>
                      updateField("tmsMaintenanceNextDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์ครั้งถัดไป"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์ครั้งถัดไป"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsMaintenanceNextDueMileage}
                    onChange={(e) =>
                      updateField("tmsMaintenanceNextDueMileage", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="กรอกหมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.tmsMaintenanceNotes}
                  onChange={(e) =>
                    updateField("tmsMaintenanceNotes", e.target.value)
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              {editingMaintenance ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบรายการซ่อมบำรุง</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบรายการซ่อมบำรุงนี้
              {deletingMaintenance?.tmsMaintenanceDescription && (
                <>
                  {" "}
                  <span className="font-semibold">
                    ({deletingMaintenance.tmsMaintenanceDescription})
                  </span>
                </>
              )}
              หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
