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
  Textarea,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useItTickets } from "@/hooks/useItTickets";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ตั๋ว", uid: "ticketNo", sortable: true },
  { name: "หัวข้อ", uid: "ticketTitle", sortable: true },
  { name: "หมวดหมู่", uid: "ticketCategory", sortable: true },
  { name: "ความสำคัญ", uid: "ticketPriority", sortable: true },
  { name: "สถานะ", uid: "ticketStatus", sortable: true },
  { name: "ร้องขอโดย", uid: "ticketRequestedBy" },
  { name: "ผู้รับผิดชอบ", uid: "ticketAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิด", uid: "open" },
  { name: "กำลังดำเนินการ", uid: "in_progress" },
  { name: "แก้ไขแล้ว", uid: "resolved" },
  { name: "ปิด", uid: "closed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "ticketNo",
  "ticketTitle",
  "ticketCategory",
  "ticketPriority",
  "ticketStatus",
  "ticketAssignedTo",
  "actions",
];

export default function HelpDeskPage() {
  const {
    tickets,
    loading,
    saving,
    editingTicket,
    formData,
    validationErrors,
    deletingTicket,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItTickets();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "ticketNo":
          return <span className="font-medium">{item.ticketNo || "-"}</span>;
        case "ticketTitle":
          return <span className="font-medium">{item.ticketTitle}</span>;
        case "ticketCategory":
          return item.ticketCategory || "-";
        case "ticketPriority": {
          const colorMap = {
            low: "default",
            medium: "primary",
            high: "warning",
            critical: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.ticketPriority] || "default"}
            >
              {item.ticketPriority}
            </Chip>
          );
        }
        case "ticketStatus": {
          const colorMap = {
            open: "warning",
            in_progress: "primary",
            resolved: "success",
            closed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.ticketStatus] || "default"}
            >
              {item.ticketStatus}
            </Chip>
          );
        }
        case "ticketRequestedBy":
          return item.ticketRequestedBy || "-";
        case "ticketAssignedTo":
          return item.ticketAssignedTo || "-";
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
        data={tickets}
        renderCell={renderCell}
        enableCardView
        rowKey="ticketId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามเลขที่ตั๋ว, หัวข้อ, ผู้ร้องขอ..."
        searchKeys={[
          "ticketNo",
          "ticketTitle",
          "ticketRequestedBy",
          "ticketAssignedTo",
        ]}
        statusField="ticketStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบตั๋ว"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            สร้างตั๋วใหม่
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
            {editingTicket ? `แก้ไขตั๋ว ${editingTicket.ticketNo || ""}` : "สร้างตั๋วใหม่"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="หัวข้อ"
                    labelPlacement="outside"
                    placeholder="ใส่หัวข้อตั๋ว"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketTitle}
                    onChange={(e) => updateField("ticketTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.ticketTitle}
                    errorMessage={validationErrors?.ticketTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="หมวดหมู่"
                    labelPlacement="outside"
                    placeholder="เลือกหมวดหมู่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.ticketCategory ? [formData.ticketCategory] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("ticketCategory", val);
                    }}
                  >
                    <SelectItem key="hardware">ฮาร์ดแวร์</SelectItem>
                    <SelectItem key="software">ซอฟต์แวร์</SelectItem>
                    <SelectItem key="network">เครือข่าย</SelectItem>
                    <SelectItem key="access">การเข้าถึง</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ความสำคัญ"
                    labelPlacement="outside"
                    placeholder="เลือกความสำคัญ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.ticketPriority ? [formData.ticketPriority] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("ticketPriority", val);
                    }}
                  >
                    <SelectItem key="low">ต่ำ</SelectItem>
                    <SelectItem key="medium">ปานกลาง</SelectItem>
                    <SelectItem key="high">สูง</SelectItem>
                    <SelectItem key="critical">วิกฤต</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.ticketStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "open";
                      updateField("ticketStatus", val);
                    }}
                  >
                    <SelectItem key="open">เปิด</SelectItem>
                    <SelectItem key="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem key="resolved">แก้ไขแล้ว</SelectItem>
                    <SelectItem key="closed">ปิด</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ร้องขอโดย"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้ร้องขอ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketRequestedBy}
                    onChange={(e) => updateField("ticketRequestedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้รับผิดชอบ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketAssignedTo}
                    onChange={(e) => updateField("ticketAssignedTo", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายปัญหา..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.ticketDescription}
                  onChange={(e) => updateField("ticketDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="ใส่หมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.ticketNotes}
                  onChange={(e) => updateField("ticketNotes", e.target.value)}
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
              {editingTicket ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบตั๋ว</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingTicket?.ticketNo} - {deletingTicket?.ticketTitle}
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
