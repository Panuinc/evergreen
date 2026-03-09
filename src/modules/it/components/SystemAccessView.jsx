"use client";

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
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ระบบ", uid: "itSystemAccessSystem", sortable: true },
  { name: "ประเภท", uid: "itSystemAccessType", sortable: true },
  { name: "ร้องขอสำหรับ", uid: "itSystemAccessRequestedFor" },
  { name: "ร้องขอโดย", uid: "itSystemAccessRequestedBy" },
  { name: "สถานะ", uid: "itSystemAccessStatus", sortable: true },
  { name: "อนุมัติโดย", uid: "itSystemAccessApprovedBy" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "อนุมัติแล้ว", uid: "approved" },
  { name: "ปฏิเสธ", uid: "rejected" },
  { name: "เสร็จสิ้น", uid: "completed" },
];

const BASE_VISIBLE_COLUMNS = [
  "itSystemAccessSystem",
  "itSystemAccessType",
  "itSystemAccessRequestedFor",
  "itSystemAccessStatus",
  "itSystemAccessApprovedBy",
  "actions",
];

export default function SystemAccessView({
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
        case "itSystemAccessSystem":
          return <span className="font-light">{item.itSystemAccessSystem}</span>;
        case "itSystemAccessType": {
          const colorMap = {
            grant: "success",
            revoke: "danger",
            modify: "warning",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.itSystemAccessType] || "default"}
            >
              {item.itSystemAccessType}
            </Chip>
          );
        }
        case "itSystemAccessRequestedFor":
          return item.itSystemAccessRequestedFor || "-";
        case "itSystemAccessRequestedBy":
          return item.itSystemAccessRequestedBy || "-";
        case "itSystemAccessStatus": {
          const colorMap = {
            pending: "warning",
            approved: "success",
            rejected: "danger",
            completed: "default",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.itSystemAccessStatus] || "default"}
            >
              {item.itSystemAccessStatus}
            </Chip>
          );
        }
        case "itSystemAccessApprovedBy":
          return item.itSystemAccessApprovedBy || "-";
        case "isActive":
          return (
            <Chip
              variant="flat"
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
    [handleOpen, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={accessRequests}
        renderCell={renderCell}
        enableCardView
        rowKey="itSystemAccessId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามระบบ, ร้องขอสำหรับ, ร้องขอโดย..."
        searchKeys={[
          "itSystemAccessSystem",
          "itSystemAccessRequestedFor",
          "itSystemAccessRequestedBy",
          "itSystemAccessApprovedBy",
        ]}
        statusField="itSystemAccessStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบคำขอเข้าถึง"
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power size={16} />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
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
                    value={formData.itSystemAccessSystem}
                    onChange={(e) => updateField("itSystemAccessSystem", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itSystemAccessSystem}
                    errorMessage={validationErrors?.itSystemAccessSystem}
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
                    selectedKeys={formData.itSystemAccessType ? [formData.itSystemAccessType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itSystemAccessType", val);
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
                    value={formData.itSystemAccessRequestedFor}
                    onChange={(e) => updateField("itSystemAccessRequestedFor", e.target.value)}
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
                    value={formData.itSystemAccessRequestedBy}
                    onChange={(e) => updateField("itSystemAccessRequestedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.itSystemAccessStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("itSystemAccessStatus", val);
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
                    value={formData.itSystemAccessApprovedBy}
                    onChange={(e) => updateField("itSystemAccessApprovedBy", e.target.value)}
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
                  value={formData.itSystemAccessNotes}
                  onChange={(e) => updateField("itSystemAccessNotes", e.target.value)}
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
              <span className="font-light">
                {deletingAccess?.itSystemAccessSystem} ({deletingAccess?.itSystemAccessRequestedFor})
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
