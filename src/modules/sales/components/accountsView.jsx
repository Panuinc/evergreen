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
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";

const baseColumns = [
  { name: "เลขที่บัญชี", uid: "salesAccountNo", sortable: true },
  { name: "ชื่อบัญชี", uid: "salesAccountName", sortable: true },
  { name: "อุตสาหกรรม", uid: "salesAccountIndustry" },
  { name: "โทรศัพท์", uid: "salesAccountPhone" },
  { name: "อีเมล", uid: "salesAccountEmail" },
  { name: "จำนวนพนักงาน", uid: "salesAccountEmployees" },
  { name: "รายได้ต่อปี", uid: "salesAccountAnnualRevenue" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [];

const baseVisibleColumns = [
  "salesAccountNo",
  "salesAccountName",
  "salesAccountIndustry",
  "salesAccountPhone",
  "salesAccountAnnualRevenue",
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
      return [...baseVisibleColumns, "isActive"];
    }
    return baseVisibleColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "salesAccountNo":
          return <span className="text-muted-foreground">{item.salesAccountNo || "-"}</span>;
        case "salesAccountName":
          return <span className="font-light">{item.salesAccountName}</span>;
        case "salesAccountIndustry":
          return item.salesAccountIndustry || "-";
        case "salesAccountPhone":
          return item.salesAccountPhone || "-";
        case "salesAccountEmail":
          return item.salesAccountEmail || "-";
        case "salesAccountEmployees":
          return item.salesAccountEmployees
            ? Number(item.salesAccountEmployees).toLocaleString()
            : "-";
        case "salesAccountAnnualRevenue":
          return item.salesAccountAnnualRevenue
            ? Number(item.salesAccountAnnualRevenue).toLocaleString("th-TH")
            : "-";
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
        rowKey="salesAccountId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาบัญชี..."
        searchKeys={[
          "salesAccountName",
          "salesAccountIndustry",
          "salesAccountEmail",
          "salesAccountPhone",
        ]}
        emptyContent="ไม่พบบัญชี"
        actionMenuItems={(item) =>
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
            เพิ่มบัญชี
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
                    value={formData.salesAccountName}
                    onChange={(e) => updateField("salesAccountName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.salesAccountName}
                    errorMessage={validationErrors?.salesAccountName}
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
                    selectedKeys={formData.salesAccountIndustry ? [formData.salesAccountIndustry] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesAccountIndustry", val);
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
                    value={formData.salesAccountWebsite}
                    onChange={(e) => updateField("salesAccountWebsite", e.target.value)}
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
                    value={formData.salesAccountPhone}
                    onChange={(e) => updateField("salesAccountPhone", e.target.value)}
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
                    value={formData.salesAccountEmail}
                    onChange={(e) => updateField("salesAccountEmail", e.target.value)}
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
                    value={formData.salesAccountEmployees}
                    onChange={(e) => updateField("salesAccountEmployees", e.target.value)}
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
                    value={formData.salesAccountAnnualRevenue}
                    onChange={(e) => updateField("salesAccountAnnualRevenue", e.target.value)}
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
                  value={formData.salesAccountAddress}
                  onChange={(e) => updateField("salesAccountAddress", e.target.value)}
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
                  value={formData.salesAccountNotes}
                  onChange={(e) => updateField("salesAccountNotes", e.target.value)}
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

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบบัญชี</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingAccount?.salesAccountName}
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
