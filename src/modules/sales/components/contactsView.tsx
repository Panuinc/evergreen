import { useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import type { ContactsViewProps, SalesContact } from "@/modules/sales/types";

const baseColumns = [
  { name: "เลขที่ผู้ติดต่อ", uid: "salesContactNo", sortable: true },
  { name: "ชื่อ", uid: "salesContactName" },
  { name: "อีเมล", uid: "salesContactEmail" },
  { name: "โทรศัพท์", uid: "salesContactPhone" },
  { name: "ตำแหน่ง", uid: "salesContactPosition" },
  { name: "บัญชี", uid: "salesAccountName" },
  { name: "แท็ก", uid: "salesContactTags" },
  { name: "การดำเนินการ", uid: "actions" },
];

const baseVisibleColumns = [
  "salesContactNo",
  "salesContactName",
  "salesContactEmail",
  "salesContactPhone",
  "salesAccountName",
  "actions",
];

export default function ContactsView({
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
  toggleActive,
}: ContactsViewProps) {
  const { isSuperAdmin } = useRBAC();

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

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...baseVisibleColumns, "isActive"];
    }
    return baseVisibleColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item: SalesContact, columnKey: string) => {
      switch (columnKey) {
        case "salesContactNo":
          return <span className="text-muted-foreground">{item.salesContactNo || "-"}</span>;
        case "salesContactName":
          return (
            <span className="font-light">
              {item.salesContactFirstName} {item.salesContactLastName}
            </span>
          );
        case "salesContactEmail":
          return item.salesContactEmail || "-";
        case "salesContactPhone":
          return item.salesContactPhone || "-";
        case "salesContactPosition":
          return item.salesContactPosition || "-";
        case "salesAccountName":
          return item.salesAccount?.salesAccountName || "-";
        case "salesContactTags":
          return item.salesContactTags ? (
            <Chip variant="flat" size="md" radius="md" color="primary">
              {item.salesContactTags}
            </Chip>
          ) : (
            "-"
          );
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
                  size="md"
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
          return (item as unknown as Record<string, unknown>)[columnKey]?.toString() || "-";
      }
    },
    [handleOpen, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={contacts}
        renderCell={renderCell}
        enableCardView
        rowKey="salesContactId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาผู้ติดต่อ..."
        searchKeys={[
          "salesContactFirstName",
          "salesContactLastName",
          "salesContactEmail",
          "salesContactPhone",
        ]}
        emptyContent="ไม่พบผู้ติดต่อ"
        actionMenuItems={(item: SalesContact) =>
          [
            { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
            isSuperAdmin
              ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
              : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
          ].filter(Boolean)
        }
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

      {}
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
                    value={formData.salesContactFirstName || ""}
                    onChange={(e) => updateField("salesContactFirstName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.salesContactFirstName}
                    errorMessage={validationErrors?.salesContactFirstName}
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
                    value={formData.salesContactLastName || ""}
                    onChange={(e) => updateField("salesContactLastName", e.target.value)}
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
                    value={formData.salesContactEmail || ""}
                    onChange={(e) => updateField("salesContactEmail", e.target.value)}
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
                    value={formData.salesContactPhone || ""}
                    onChange={(e) => updateField("salesContactPhone", e.target.value)}
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
                    value={formData.salesContactPosition || ""}
                    onChange={(e) => updateField("salesContactPosition", e.target.value)}
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
                    value={formData.salesContactAccountId || ""}
                    onChange={(e) => updateField("salesContactAccountId", e.target.value)}
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
                  value={formData.salesContactAddress || ""}
                  onChange={(e) => updateField("salesContactAddress", e.target.value)}
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
                  value={formData.salesContactTags || ""}
                  onChange={(e) => updateField("salesContactTags", e.target.value)}
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
                  value={formData.salesContactNotes || ""}
                  onChange={(e) => updateField("salesContactNotes", e.target.value)}
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

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบผู้ติดต่อ</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingContact?.salesContactFirstName} {deletingContact?.salesContactLastName}
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
