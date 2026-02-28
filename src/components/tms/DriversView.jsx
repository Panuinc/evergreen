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
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "โทรศัพท์", uid: "tmsDriverPhone" },
  { name: "ตำแหน่ง", uid: "tmsDriverRole", sortable: true },
  { name: "ประเภทใบขับขี่", uid: "tmsDriverLicenseType", sortable: true },
  { name: "วันหมดอายุใบขับขี่", uid: "tmsDriverLicenseExpiry", sortable: true },
  { name: "สถานะ", uid: "tmsDriverStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "พร้อม", uid: "available" },
  { name: "ปฏิบัติงาน", uid: "on_duty" },
  { name: "ลา", uid: "on_leave" },
  { name: "ไม่ใช้งาน", uid: "inactive" },
];

const ROLE_COLORS = {
  driver: "primary",
  assistant: "secondary",
};

const STATUS_COLORS = {
  available: "success",
  on_duty: "warning",
  on_leave: "danger",
  inactive: "default",
};

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "tmsDriverPhone",
  "tmsDriverRole",
  "tmsDriverLicenseType",
  "tmsDriverLicenseExpiry",
  "tmsDriverStatus",
  "actions",
];

export default function DriversView({
  drivers,
  employees,
  loading,
  saving,
  editingDriver,
  formData,
  deletingDriver,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-medium">
              {item.tmsDriverFirstName} {item.tmsDriverLastName}
            </span>
          );
        case "tmsDriverPhone":
          return (
            <span className="text-default-500">{item.tmsDriverPhone || "-"}</span>
          );
        case "tmsDriverRole":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={ROLE_COLORS[item.tmsDriverRole] || "default"}
            >
              {item.tmsDriverRole}
            </Chip>
          );
        case "tmsDriverLicenseType":
          return item.tmsDriverLicenseType || "-";
        case "tmsDriverLicenseExpiry":
          return (
            <span className="text-default-500">
              {item.tmsDriverLicenseExpiry
                ? new Date(item.tmsDriverLicenseExpiry).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "tmsDriverStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.tmsDriverStatus] || "default"}
            >
              {item.tmsDriverStatus}
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
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={drivers}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsDriverId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อ, เบอร์โทร..."
        searchKeys={[
          "tmsDriverFirstName",
          "tmsDriverLastName",
          "tmsDriverPhone",
        ]}
        statusField="tmsDriverStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบพนักงานขับรถ"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มพนักงานขับรถ
          </Button>
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
            {editingDriver ? "แก้ไขพนักงานขับรถ" : "เพิ่มพนักงานขับรถ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverFirstName}
                    onChange={(e) =>
                      updateField("tmsDriverFirstName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="นามสกุล"
                    labelPlacement="outside"
                    placeholder="กรอกนามสกุล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverLastName}
                    onChange={(e) =>
                      updateField("tmsDriverLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverPhone}
                    onChange={(e) =>
                      updateField("tmsDriverPhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder="เลือกตำแหน่ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsDriverRole ? [formData.tmsDriverRole] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsDriverRole", val);
                    }}
                  >
                    <SelectItem key="driver">พนักงานขับรถ</SelectItem>
                    <SelectItem key="assistant">ผู้ช่วย</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เลขใบขับขี่"
                    labelPlacement="outside"
                    placeholder="กรอกเลขใบขับขี่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverLicenseNumber}
                    onChange={(e) =>
                      updateField("tmsDriverLicenseNumber", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภทใบขับขี่"
                    labelPlacement="outside"
                    placeholder="เลือกประเภทใบขับขี่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsDriverLicenseType
                        ? [formData.tmsDriverLicenseType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsDriverLicenseType", val);
                    }}
                  >
                    <SelectItem key="type1">ประเภท 1</SelectItem>
                    <SelectItem key="type2">ประเภท 2</SelectItem>
                    <SelectItem key="type3">ประเภท 3</SelectItem>
                    <SelectItem key="type4">ประเภท 4</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุใบขับขี่"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverLicenseExpiry}
                    onChange={(e) =>
                      updateField("tmsDriverLicenseExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="เชื่อมโยงพนักงาน"
                    labelPlacement="outside"
                    placeholder="เลือกพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsDriverEmployeeId
                        ? [formData.tmsDriverEmployeeId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsDriverEmployeeId", val);
                    }}
                  >
                    {employees.map((emp) => (
                      <SelectItem key={emp.hrEmployeeId}>
                        {emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.tmsDriverStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "available";
                      updateField("tmsDriverStatus", val);
                    }}
                  >
                    <SelectItem key="available">พร้อม</SelectItem>
                    <SelectItem key="on_duty">ปฏิบัติงาน</SelectItem>
                    <SelectItem key="on_leave">ลา</SelectItem>
                    <SelectItem key="inactive">ไม่ใช้งาน</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="หมายเหตุ"
                    labelPlacement="outside"
                    placeholder="กรอกหมายเหตุ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsDriverNotes}
                    onChange={(e) =>
                      updateField("tmsDriverNotes", e.target.value)
                    }
                  />
                </div>
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
              {editingDriver ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบพนักงานขับรถ</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบ{" "}
              <span className="font-semibold">
                {deletingDriver?.tmsDriverFirstName}{" "}
                {deletingDriver?.tmsDriverLastName}
              </span>
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
