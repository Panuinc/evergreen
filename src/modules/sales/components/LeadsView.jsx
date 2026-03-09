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
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "เลขที่ลีด", uid: "crmLeadNo", sortable: true },
  { name: "ชื่อ", uid: "crmLeadName", sortable: true },
  { name: "บริษัท", uid: "crmLeadCompany" },
  { name: "อีเมล", uid: "crmLeadEmail" },
  { name: "โทรศัพท์", uid: "crmLeadPhone" },
  { name: "แหล่งที่มา", uid: "crmLeadSource" },
  { name: "คะแนน", uid: "crmLeadScore" },
  { name: "สถานะ", uid: "crmLeadStatus" },
  { name: "ผู้รับผิดชอบ", uid: "crmLeadAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "ใหม่", uid: "new" },
  { name: "ติดต่อแล้ว", uid: "contacted" },
  { name: "ผ่านคุณสมบัติ", uid: "qualified" },
  { name: "แปลงแล้ว", uid: "converted" },
  { name: "สูญเสีย", uid: "lost" },
];

const BASE_VISIBLE_COLUMNS = [
  "crmLeadNo",
  "crmLeadName",
  "crmLeadCompany",
  "crmLeadSource",
  "crmLeadScore",
  "crmLeadStatus",
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
}) {
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
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmLeadNo":
          return <span className="text-muted-foreground">{item.crmLeadNo || "-"}</span>;
        case "crmLeadName":
          return <span className="font-light">{item.crmLeadName}</span>;
        case "crmLeadCompany":
          return item.crmLeadCompany || "-";
        case "crmLeadEmail":
          return item.crmLeadEmail || "-";
        case "crmLeadPhone":
          return item.crmLeadPhone || "-";
        case "crmLeadSource":
          return item.crmLeadSource ? (
            <Chip variant="flat" size="md" radius="md">
              {item.crmLeadSource}
            </Chip>
          ) : (
            "-"
          );
        case "crmLeadScore": {
          const scoreColorMap = {
            hot: "danger",
            warm: "warning",
            cold: "primary",
          };
          return item.crmLeadScore ? (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={scoreColorMap[item.crmLeadScore] || "default"}
            >
              {item.crmLeadScore}
            </Chip>
          ) : (
            "-"
          );
        }
        case "crmLeadStatus": {
          const statusColorMap = {
            new: "primary",
            contacted: "warning",
            qualified: "success",
            converted: "secondary",
            lost: "danger",
          };
          return item.crmLeadStatus ? (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={statusColorMap[item.crmLeadStatus] || "default"}
            >
              {item.crmLeadStatus}
            </Chip>
          ) : (
            "-"
          );
        }
        case "crmLeadAssignedTo":
          return item.crmLeadAssignedTo || "-";
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
              {item.crmLeadStatus === "qualified" && (
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
          return item[columnKey] || "-";
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
        rowKey="crmLeadId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาลีด..."
        searchKeys={[
          "crmLeadName",
          "crmLeadCompany",
          "crmLeadEmail",
          "crmLeadPhone",
        ]}
        statusField="crmLeadStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบลีด"
        actionMenuItems={(item) =>
          [
            item.crmLeadStatus === "qualified" && { key: "convert", label: "แปลงเป็นโอกาสขาย", icon: <ArrowRightLeft />, onPress: () => handleConvert(item) },
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
                    value={formData.crmLeadName}
                    onChange={(e) => updateField("crmLeadName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.crmLeadName}
                    errorMessage={validationErrors?.crmLeadName}
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
                    value={formData.crmLeadEmail}
                    onChange={(e) => updateField("crmLeadEmail", e.target.value)}
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
                    value={formData.crmLeadPhone}
                    onChange={(e) => updateField("crmLeadPhone", e.target.value)}
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
                    value={formData.crmLeadCompany}
                    onChange={(e) => updateField("crmLeadCompany", e.target.value)}
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
                    value={formData.crmLeadPosition}
                    onChange={(e) => updateField("crmLeadPosition", e.target.value)}
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
                    selectedKeys={formData.crmLeadSource ? [formData.crmLeadSource] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmLeadSource", val);
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
                    selectedKeys={formData.crmLeadScore ? [formData.crmLeadScore] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmLeadScore", val);
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
                    selectedKeys={formData.crmLeadStatus ? [formData.crmLeadStatus] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmLeadStatus", val);
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
                    value={formData.crmLeadAssignedTo}
                    onChange={(e) => updateField("crmLeadAssignedTo", e.target.value)}
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
                  value={formData.crmLeadNotes}
                  onChange={(e) => updateField("crmLeadNotes", e.target.value)}
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
                {deletingLead?.crmLeadName}
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
