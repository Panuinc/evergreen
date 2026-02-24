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
import { useCrmAccounts } from "@/hooks/sales/useCrmAccounts";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่บัญชี", uid: "accountNo", sortable: true },
  { name: "ชื่อบัญชี", uid: "accountName", sortable: true },
  { name: "อุตสาหกรรม", uid: "accountIndustry" },
  { name: "โทรศัพท์", uid: "accountPhone" },
  { name: "อีเมล", uid: "accountEmail" },
  { name: "จำนวนพนักงาน", uid: "accountEmployees" },
  { name: "รายได้ต่อปี", uid: "accountAnnualRevenue" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [];

const INITIAL_VISIBLE_COLUMNS = [
  "accountNo",
  "accountName",
  "accountIndustry",
  "accountPhone",
  "accountAnnualRevenue",
  "actions",
];

export default function AccountsPage() {
  const {
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
  } = useCrmAccounts();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "accountNo":
          return <span className="text-default-500">{item.accountNo || "-"}</span>;
        case "accountName":
          return <span className="font-medium">{item.accountName}</span>;
        case "accountIndustry":
          return item.accountIndustry || "-";
        case "accountPhone":
          return item.accountPhone || "-";
        case "accountEmail":
          return item.accountEmail || "-";
        case "accountEmployees":
          return item.accountEmployees
            ? Number(item.accountEmployees).toLocaleString()
            : "-";
        case "accountAnnualRevenue":
          return item.accountAnnualRevenue
            ? Number(item.accountAnnualRevenue).toLocaleString("th-TH")
            : "-";
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
        data={accounts}
        renderCell={renderCell}
        enableCardView
        rowKey="accountId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาบัญชี..."
        searchKeys={[
          "accountName",
          "accountIndustry",
          "accountEmail",
          "accountPhone",
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
                    value={formData.accountName}
                    onChange={(e) => updateField("accountName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.accountName}
                    errorMessage={validationErrors?.accountName}
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
                    selectedKeys={formData.accountIndustry ? [formData.accountIndustry] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("accountIndustry", val);
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
                    value={formData.accountWebsite}
                    onChange={(e) => updateField("accountWebsite", e.target.value)}
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
                    value={formData.accountPhone}
                    onChange={(e) => updateField("accountPhone", e.target.value)}
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
                    value={formData.accountEmail}
                    onChange={(e) => updateField("accountEmail", e.target.value)}
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
                    value={formData.accountEmployees}
                    onChange={(e) => updateField("accountEmployees", e.target.value)}
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
                    value={formData.accountAnnualRevenue}
                    onChange={(e) => updateField("accountAnnualRevenue", e.target.value)}
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
                  value={formData.accountAddress}
                  onChange={(e) => updateField("accountAddress", e.target.value)}
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
                  value={formData.accountNotes}
                  onChange={(e) => updateField("accountNotes", e.target.value)}
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
                {deletingAccount?.accountName}
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
