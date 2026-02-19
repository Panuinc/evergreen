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
import { useCrmAccounts } from "@/hooks/useCrmAccounts";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Account No", uid: "accountNo", sortable: true },
  { name: "Account Name", uid: "accountName", sortable: true },
  { name: "Industry", uid: "accountIndustry" },
  { name: "Phone", uid: "accountPhone" },
  { name: "Email", uid: "accountEmail" },
  { name: "Employees", uid: "accountEmployees" },
  { name: "Annual Revenue", uid: "accountAnnualRevenue" },
  { name: "Actions", uid: "actions" },
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
        searchPlaceholder="Search accounts..."
        searchKeys={[
          "accountName",
          "accountIndustry",
          "accountEmail",
          "accountPhone",
        ]}
        emptyContent="No accounts found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Account
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
            {editingAccount ? "Edit Account" : "Add Account"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Account Name"
                    labelPlacement="outside"
                    placeholder="Enter account name"
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
                    label="Industry"
                    labelPlacement="outside"
                    placeholder="Select industry"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.accountIndustry ? [formData.accountIndustry] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("accountIndustry", val);
                    }}
                  >
                    <SelectItem key="technology">Technology</SelectItem>
                    <SelectItem key="manufacturing">Manufacturing</SelectItem>
                    <SelectItem key="retail">Retail</SelectItem>
                    <SelectItem key="services">Services</SelectItem>
                    <SelectItem key="healthcare">Healthcare</SelectItem>
                    <SelectItem key="finance">Finance</SelectItem>
                    <SelectItem key="education">Education</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Website"
                    labelPlacement="outside"
                    placeholder="Enter website"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accountWebsite}
                    onChange={(e) => updateField("accountWebsite", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Phone"
                    labelPlacement="outside"
                    placeholder="Enter phone"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accountPhone}
                    onChange={(e) => updateField("accountPhone", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Email"
                    labelPlacement="outside"
                    placeholder="Enter email"
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
                    label="Employees"
                    labelPlacement="outside"
                    placeholder="Enter number of employees"
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
                    label="Annual Revenue"
                    labelPlacement="outside"
                    placeholder="Enter annual revenue"
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
                  label="Address"
                  labelPlacement="outside"
                  placeholder="Enter address"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.accountAddress}
                  onChange={(e) => updateField("accountAddress", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="Enter notes"
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
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              {editingAccount ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Account</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingAccount?.accountName}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
