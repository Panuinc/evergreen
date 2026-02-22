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
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useItSystemAccess } from "@/hooks/useItSystemAccess";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ระบบ", uid: "accessSystem", sortable: true },
  { name: "ประเภท", uid: "accessType", sortable: true },
  { name: "ร้องขอสำหรับ", uid: "accessRequestedFor" },
  { name: "ร้องขอโดย", uid: "accessRequestedBy" },
  { name: "สถานะ", uid: "accessStatus", sortable: true },
  { name: "อนุมัติโดย", uid: "accessApprovedBy" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "อนุมัติแล้ว", uid: "approved" },
  { name: "ปฏิเสธ", uid: "rejected" },
  { name: "เสร็จสิ้น", uid: "completed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "accessSystem",
  "accessType",
  "accessRequestedFor",
  "accessStatus",
  "accessApprovedBy",
  "actions",
];

export default function SystemAccessPage() {
  const {
    accessRequests,
    loading,
    saving,
    editingAccess,
    formData,
    validationErrors,
    deletingAccess,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSystemAccess();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "accessSystem":
          return <span className="font-medium">{item.accessSystem}</span>;
        case "accessType": {
          const colorMap = {
            grant: "success",
            revoke: "danger",
            modify: "warning",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.accessType] || "default"}
            >
              {item.accessType}
            </Chip>
          );
        }
        case "accessRequestedFor":
          return item.accessRequestedFor || "-";
        case "accessRequestedBy":
          return item.accessRequestedBy || "-";
        case "accessStatus": {
          const colorMap = {
            pending: "warning",
            approved: "success",
            rejected: "danger",
            completed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.accessStatus] || "default"}
            >
              {item.accessStatus}
            </Chip>
          );
        }
        case "accessApprovedBy":
          return item.accessApprovedBy || "-";
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
        data={accessRequests}
        renderCell={renderCell}
        enableCardView
        rowKey="accessId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามระบบ, ร้องขอสำหรับ, ร้องขอโดย..."
        searchKeys={[
          "accessSystem",
          "accessRequestedFor",
          "accessRequestedBy",
          "accessApprovedBy",
        ]}
        statusField="accessStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบคำขอเข้าถึง"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            คำขอใหม่
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
            {editingAccess ? "แก้ไขคำขอเข้าถึง" : "คำขอเข้าถึงใหม่"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ระบบ"
                    labelPlacement="outside"
                    placeholder="เช่น ERP, อีเมล, VPN"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessSystem}
                    onChange={(e) => updateField("accessSystem", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.accessSystem}
                    errorMessage={validationErrors?.accessSystem}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภท"
                    labelPlacement="outside"
                    placeholder="เลือกประเภท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.accessType ? [formData.accessType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("accessType", val);
                    }}
                  >
                    <SelectItem key="grant">ให้สิทธิ์</SelectItem>
                    <SelectItem key="revoke">เพิกถอน</SelectItem>
                    <SelectItem key="modify">แก้ไข</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ร้องขอสำหรับ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessRequestedFor}
                    onChange={(e) => updateField("accessRequestedFor", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ร้องขอโดย"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้ร้องขอ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessRequestedBy}
                    onChange={(e) => updateField("accessRequestedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.accessStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("accessStatus", val);
                    }}
                  >
                    <SelectItem key="pending">รอดำเนินการ</SelectItem>
                    <SelectItem key="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem key="rejected">ปฏิเสธ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="อนุมัติโดย"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้อนุมัติ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessApprovedBy}
                    onChange={(e) => updateField("accessApprovedBy", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="ใส่หมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.accessNotes}
                  onChange={(e) => updateField("accessNotes", e.target.value)}
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
              {editingAccess ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบคำขอเข้าถึง</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบคำขอเข้าถึงสำหรับ{" "}
              <span className="font-semibold">
                {deletingAccess?.accessSystem} ({deletingAccess?.accessRequestedFor})
              </span>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
