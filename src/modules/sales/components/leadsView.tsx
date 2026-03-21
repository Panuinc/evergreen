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
import { Plus, Edit, Trash2, ArrowRightLeft, Power } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import type { LeadsViewProps, SalesLead } from "@/modules/sales/types";

const baseColumns = [
  { name: "เลขที่ลีด", uid: "salesLeadNo", sortable: true },
  { name: "ชื่อ", uid: "salesLeadName", sortable: true },
  { name: "บริษัท", uid: "salesLeadCompany" },
  { name: "อีเมล", uid: "salesLeadEmail" },
  { name: "โทรศัพท์", uid: "salesLeadPhone" },
  { name: "แหล่งที่มา", uid: "salesLeadSource" },
  { name: "คะแนน", uid: "salesLeadScore" },
  { name: "สถานะ", uid: "salesLeadStatus" },
  { name: "ผู้รับผิดชอบ", uid: "salesLeadAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "ใหม่", uid: "new" },
  { name: "ติดต่อแล้ว", uid: "contacted" },
  { name: "ผ่านคุณสมบัติ", uid: "qualified" },
  { name: "แปลงแล้ว", uid: "converted" },
  { name: "สูญเสีย", uid: "lost" },
];

const baseVisibleColumns = [
  "salesLeadNo",
  "salesLeadName",
  "salesLeadCompany",
  "salesLeadSource",
  "salesLeadScore",
  "salesLeadStatus",
  "actions",
];

export default function LeadsView({
  leads,
  loading,
  saving,
  editingLead,
  formData,
  validationErrors,
  deletingLead,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  handleConvert,
  toggleActive,
}: LeadsViewProps) {
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
    (item: SalesLead, columnKey: string) => {
      switch (columnKey) {
        case "salesLeadNo":
          return <span className="text-muted-foreground">{item.salesLeadNo || "-"}</span>;
        case "salesLeadName":
          return <span className="font-light">{item.salesLeadName}</span>;
        case "salesLeadCompany":
          return item.salesLeadCompany || "-";
        case "salesLeadEmail":
          return item.salesLeadEmail || "-";
        case "salesLeadPhone":
          return item.salesLeadPhone || "-";
        case "salesLeadSource":
          return item.salesLeadSource ? (
            <Chip variant="flat" size="md" radius="md">
              {item.salesLeadSource}
            </Chip>
          ) : (
            "-"
          );
        case "salesLeadScore": {
          const scoreColorMap: Record<string, "danger" | "warning" | "primary"> = {
            hot: "danger",
            warm: "warning",
            cold: "primary",
          };
          return item.salesLeadScore ? (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={scoreColorMap[item.salesLeadScore] || "default"}
            >
              {item.salesLeadScore}
            </Chip>
          ) : (
            "-"
          );
        }
        case "salesLeadStatus": {
          const statusColorMap: Record<string, "primary" | "warning" | "success" | "secondary" | "danger"> = {
            new: "primary",
            contacted: "warning",
            qualified: "success",
            converted: "secondary",
            lost: "danger",
          };
          return item.salesLeadStatus ? (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={statusColorMap[item.salesLeadStatus] || "default"}
            >
              {item.salesLeadStatus}
            </Chip>
          ) : (
            "-"
          );
        }
        case "salesLeadAssignedTo":
          return item.salesLeadAssignedTo || "-";
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
              {item.salesLeadStatus === "qualified" && (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleConvert(item)}
                >
                  <ArrowRightLeft />
                </Button>
              )}
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
    [handleOpen, confirmDelete, handleConvert, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={leads}
        renderCell={renderCell}
        enableCardView
        rowKey="salesLeadId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาลีด..."
        searchKeys={[
          "salesLeadName",
          "salesLeadCompany",
          "salesLeadEmail",
          "salesLeadPhone",
        ]}
        statusField="salesLeadStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบลีด"
        actionMenuItems={(item: SalesLead) =>
          [
            item.salesLeadStatus === "qualified" && { key: "convert", label: "แปลงเป็นโอกาสขาย", icon: <ArrowRightLeft />, onPress: () => handleConvert(item) },
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
            เพิ่มลีด
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
            {editingLead ? "แก้ไขลีด" : "เพิ่มลีด"}
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
                    value={formData.salesLeadName || ""}
                    onChange={(e) => updateField("salesLeadName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.salesLeadName}
                    errorMessage={validationErrors?.salesLeadName}
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
                    value={formData.salesLeadEmail || ""}
                    onChange={(e) => updateField("salesLeadEmail", e.target.value)}
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
                    value={formData.salesLeadPhone || ""}
                    onChange={(e) => updateField("salesLeadPhone", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="บริษัท"
                    labelPlacement="outside"
                    placeholder="ใส่บริษัท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.salesLeadCompany || ""}
                    onChange={(e) => updateField("salesLeadCompany", e.target.value)}
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
                    value={formData.salesLeadPosition || ""}
                    onChange={(e) => updateField("salesLeadPosition", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="แหล่งที่มา"
                    labelPlacement="outside"
                    placeholder="เลือกแหล่งที่มา"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.salesLeadSource ? [formData.salesLeadSource] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesLeadSource", val as string);
                    }}
                  >
                    <SelectItem key="website">เว็บไซต์</SelectItem>
                    <SelectItem key="referral">แนะนำ</SelectItem>
                    <SelectItem key="social">โซเชียล</SelectItem>
                    <SelectItem key="event">อีเวนต์</SelectItem>
                    <SelectItem key="cold_call">โทรเสนอ</SelectItem>
                    <SelectItem key="advertisement">โฆษณา</SelectItem>
                    <SelectItem key="partner">พาร์ทเนอร์</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="คะแนน"
                    labelPlacement="outside"
                    placeholder="เลือกคะแนน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.salesLeadScore ? [formData.salesLeadScore] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesLeadScore", val as string);
                    }}
                  >
                    <SelectItem key="hot">ร้อน</SelectItem>
                    <SelectItem key="warm">อุ่น</SelectItem>
                    <SelectItem key="cold">เย็น</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    placeholder="เลือกสถานะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.salesLeadStatus ? [formData.salesLeadStatus] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesLeadStatus", val as string);
                    }}
                  >
                    <SelectItem key="new">ใหม่</SelectItem>
                    <SelectItem key="contacted">ติดต่อแล้ว</SelectItem>
                    <SelectItem key="qualified">ผ่านคุณสมบัติ</SelectItem>
                    <SelectItem key="converted">แปลงแล้ว</SelectItem>
                    <SelectItem key="lost">สูญเสีย</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ผู้รับผิดชอบ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.salesLeadAssignedTo || ""}
                    onChange={(e) => updateField("salesLeadAssignedTo", e.target.value)}
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
                  value={formData.salesLeadNotes || ""}
                  onChange={(e) => updateField("salesLeadNotes", e.target.value)}
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
              {editingLead ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบลีด</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingLead?.salesLeadName}
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
