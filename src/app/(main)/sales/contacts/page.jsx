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
import { useCrmContacts } from "@/hooks/sales/useCrmContacts";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ผู้ติดต่อ", uid: "crmContactNo", sortable: true },
  { name: "ชื่อ", uid: "crmContactName" },
  { name: "อีเมล", uid: "crmContactEmail" },
  { name: "โทรศัพท์", uid: "crmContactPhone" },
  { name: "ตำแหน่ง", uid: "crmContactPosition" },
  { name: "บัญชี", uid: "crmAccountName" },
  { name: "แท็ก", uid: "crmContactTags" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [];

const INITIAL_VISIBLE_COLUMNS = [
  "crmContactNo",
  "crmContactName",
  "crmContactEmail",
  "crmContactPhone",
  "crmAccountName",
  "actions",
];

export default function ContactsPage() {
  const {
    contacts,
    loading,
    saving,
    editingContact,
    formData,
    validationErrors,
    deletingContact,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useCrmContacts();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmContactNo":
          return <span className="text-default-500">{item.crmContactNo || "-"}</span>;
        case "crmContactName":
          return (
            <span className="font-medium">
              {item.crmContactFirstName} {item.crmContactLastName}
            </span>
          );
        case "crmContactEmail":
          return item.crmContactEmail || "-";
        case "crmContactPhone":
          return item.crmContactPhone || "-";
        case "crmContactPosition":
          return item.crmContactPosition || "-";
        case "crmAccountName":
          return item.crmAccount?.crmAccountName || "-";
        case "crmContactTags":
          return item.crmContactTags ? (
            <Chip variant="bordered" size="md" radius="md" color="primary">
              {item.crmContactTags}
            </Chip>
          ) : (
            "-"
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
        data={contacts}
        renderCell={renderCell}
        enableCardView
        rowKey="crmContactId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาผู้ติดต่อ..."
        searchKeys={[
          "crmContactFirstName",
          "crmContactLastName",
          "crmContactEmail",
          "crmContactPhone",
        ]}
        emptyContent="ไม่พบผู้ติดต่อ"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มผู้ติดต่อ
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
            {editingContact ? "แก้ไขผู้ติดต่อ" : "เพิ่มผู้ติดต่อ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactFirstName}
                    onChange={(e) => updateField("crmContactFirstName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.crmContactFirstName}
                    errorMessage={validationErrors?.crmContactFirstName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="นามสกุล"
                    labelPlacement="outside"
                    placeholder="ใส่นามสกุล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactLastName}
                    onChange={(e) => updateField("crmContactLastName", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="อีเมล"
                    labelPlacement="outside"
                    placeholder="ใส่อีเมล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactEmail}
                    onChange={(e) => updateField("crmContactEmail", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="ใส่โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactPhone}
                    onChange={(e) => updateField("crmContactPhone", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder="ใส่ตำแหน่ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactPosition}
                    onChange={(e) => updateField("crmContactPosition", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="บัญชี"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสบัญชี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmContactAccountId}
                    onChange={(e) => updateField("crmContactAccountId", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ที่อยู่"
                  labelPlacement="outside"
                  placeholder="ใส่ที่อยู่"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.crmContactAddress}
                  onChange={(e) => updateField("crmContactAddress", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="แท็ก"
                  labelPlacement="outside"
                  placeholder="ใส่แท็ก"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.crmContactTags}
                  onChange={(e) => updateField("crmContactTags", e.target.value)}
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
                  value={formData.crmContactNotes}
                  onChange={(e) => updateField("crmContactNotes", e.target.value)}
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
              {editingContact ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบผู้ติดต่อ</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingContact?.crmContactFirstName} {deletingContact?.crmContactLastName}
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
