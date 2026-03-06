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
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "เลขที่บัญชี", uid: "crmAccountNo", sortable: true },
  { name: "ชื่อบัญชี", uid: "crmAccountName", sortable: true },
  { name: "อุตสาหกรรม", uid: "crmAccountIndustry" },
  { name: "โทรศัพท์", uid: "crmAccountPhone" },
  { name: "อีเมล", uid: "crmAccountEmail" },
  { name: "จำนวนพนักงาน", uid: "crmAccountEmployees" },
  { name: "รายได้ต่อปี", uid: "crmAccountAnnualRevenue" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [];

const BASE_VISIBLE_COLUMNS = [
  "crmAccountNo",
  "crmAccountName",
  "crmAccountIndustry",
  "crmAccountPhone",
  "crmAccountAnnualRevenue",
  "actions",
];

export default function AccountsView({
  accounts,
  loading,
  saving,
  editingAccount,
  formData,
  validationErrors,
  deletingAccount,
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
        case "crmAccountNo":
          return <span className="text-muted-foreground">{item.crmAccountNo || "-"}</span>;
        case "crmAccountName":
          return <span className="font-medium">{item.crmAccountName}</span>;
        case "crmAccountIndustry":
          return item.crmAccountIndustry || "-";
        case "crmAccountPhone":
          return item.crmAccountPhone || "-";
        case "crmAccountEmail":
          return item.crmAccountEmail || "-";
        case "crmAccountEmployees":
          return item.crmAccountEmployees
            ? Number(item.crmAccountEmployees).toLocaleString()
            : "-";
        case "crmAccountAnnualRevenue":
          return item.crmAccountAnnualRevenue
            ? Number(item.crmAccountAnnualRevenue).toLocaleString("th-TH")
            : "-";
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
    [handleOpen, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={accounts}
        renderCell={renderCell}
        enableCardView
        rowKey="crmAccountId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาบัญชี..."
        searchKeys={[
          "crmAccountName",
          "crmAccountIndustry",
          "crmAccountEmail",
          "crmAccountPhone",
        ]}
        emptyContent="ไม่พบบัญชี"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มบัญชี
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
            {editingAccount ? "แก้ไขบัญชี" : "เพิ่มบัญชี"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อบัญชี"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อบัญชี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmAccountName}
                    onChange={(e) => updateField("crmAccountName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.crmAccountName}
                    errorMessage={validationErrors?.crmAccountName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="อุตสาหกรรม"
                    labelPlacement="outside"
                    placeholder="เลือกอุตสาหกรรม"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.crmAccountIndustry ? [formData.crmAccountIndustry] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmAccountIndustry", val);
                    }}
                  >
                    <SelectItem key="technology">เทคโนโลยี</SelectItem>
                    <SelectItem key="manufacturing">อุตสาหกรรมการผลิต</SelectItem>
                    <SelectItem key="retail">ค้าปลีก</SelectItem>
                    <SelectItem key="services">บริการ</SelectItem>
                    <SelectItem key="healthcare">สาธารณสุข</SelectItem>
                    <SelectItem key="finance">การเงิน</SelectItem>
                    <SelectItem key="education">การศึกษา</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เว็บไซต์"
                    labelPlacement="outside"
                    placeholder="ใส่เว็บไซต์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmAccountWebsite}
                    onChange={(e) => updateField("crmAccountWebsite", e.target.value)}
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
                    value={formData.crmAccountPhone}
                    onChange={(e) => updateField("crmAccountPhone", e.target.value)}
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
                    value={formData.crmAccountEmail}
                    onChange={(e) => updateField("crmAccountEmail", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="จำนวนพนักงาน"
                    labelPlacement="outside"
                    placeholder="ใส่จำนวนพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmAccountEmployees}
                    onChange={(e) => updateField("crmAccountEmployees", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="รายได้ต่อปี"
                    labelPlacement="outside"
                    placeholder="ใส่รายได้ต่อปี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmAccountAnnualRevenue}
                    onChange={(e) => updateField("crmAccountAnnualRevenue", e.target.value)}
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
                  value={formData.crmAccountAddress}
                  onChange={(e) => updateField("crmAccountAddress", e.target.value)}
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
                  value={formData.crmAccountNotes}
                  onChange={(e) => updateField("crmAccountNotes", e.target.value)}
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
              {editingAccount ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบบัญชี</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingAccount?.crmAccountName}
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
