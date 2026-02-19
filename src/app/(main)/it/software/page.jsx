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
import { useItSoftware } from "@/hooks/useItSoftware";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Software Name", uid: "softwareName", sortable: true },
  { name: "Vendor", uid: "softwareVendor", sortable: true },
  { name: "Version", uid: "softwareVersion" },
  { name: "License Type", uid: "softwareLicenseType" },
  { name: "Licenses", uid: "licenseUsage" },
  { name: "Expiry Date", uid: "softwareExpiryDate", sortable: true },
  { name: "Status", uid: "softwareStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Expired", uid: "expired" },
  { name: "Cancelled", uid: "cancelled" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "softwareName",
  "softwareVendor",
  "softwareLicenseType",
  "licenseUsage",
  "softwareExpiryDate",
  "softwareStatus",
  "actions",
];

export default function SoftwarePage() {
  const {
    software,
    loading,
    saving,
    editingSoftware,
    formData,
    validationErrors,
    deletingSoftware,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSoftware();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "softwareName":
          return <span className="font-medium">{item.softwareName}</span>;
        case "softwareVendor":
          return item.softwareVendor || "-";
        case "softwareVersion":
          return item.softwareVersion || "-";
        case "softwareLicenseType":
          return item.softwareLicenseType || "-";
        case "licenseUsage":
          return `${item.softwareUsedCount || 0} / ${item.softwareLicenseCount || 0}`;
        case "softwareExpiryDate":
          return item.softwareExpiryDate || "-";
        case "softwareStatus": {
          const colorMap = {
            active: "success",
            expired: "danger",
            cancelled: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.softwareStatus] || "default"}
            >
              {item.softwareStatus}
            </Chip>
          );
        }
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
        data={software}
        renderCell={renderCell}
        enableCardView
        rowKey="softwareId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, vendor, license key..."
        searchKeys={[
          "softwareName",
          "softwareVendor",
          "softwareLicenseKey",
          "softwareVersion",
        ]}
        statusField="softwareStatus"
        statusOptions={statusOptions}
        emptyContent="No software found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Software
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
            {editingSoftware ? "Edit Software" : "Add Software"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Software Name"
                    labelPlacement="outside"
                    placeholder="Enter software name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareName}
                    onChange={(e) => updateField("softwareName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.softwareName}
                    errorMessage={validationErrors?.softwareName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Vendor"
                    labelPlacement="outside"
                    placeholder="Enter vendor"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareVendor}
                    onChange={(e) => updateField("softwareVendor", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Version"
                    labelPlacement="outside"
                    placeholder="Enter version"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareVersion}
                    onChange={(e) => updateField("softwareVersion", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="License Key"
                    labelPlacement="outside"
                    placeholder="Enter license key"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareLicenseKey}
                    onChange={(e) => updateField("softwareLicenseKey", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="License Type"
                    labelPlacement="outside"
                    placeholder="Select type"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.softwareLicenseType ? [formData.softwareLicenseType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("softwareLicenseType", val);
                    }}
                  >
                    <SelectItem key="perpetual">Perpetual</SelectItem>
                    <SelectItem key="subscription">Subscription</SelectItem>
                    <SelectItem key="open_source">Open Source</SelectItem>
                    <SelectItem key="trial">Trial</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Total Licenses"
                    labelPlacement="outside"
                    placeholder="Enter total count"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareLicenseCount}
                    onChange={(e) => updateField("softwareLicenseCount", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Used Licenses"
                    labelPlacement="outside"
                    placeholder="Enter used count"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareUsedCount}
                    onChange={(e) => updateField("softwareUsedCount", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Expiry Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareExpiryDate}
                    onChange={(e) => updateField("softwareExpiryDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.softwareStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("softwareStatus", val);
                    }}
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="expired">Expired</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                  </Select>
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="Enter notes"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.softwareNotes}
                  onChange={(e) => updateField("softwareNotes", e.target.value)}
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
              {editingSoftware ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Software</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingSoftware?.softwareName}
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
