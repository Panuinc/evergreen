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
import { useItAssets } from "@/hooks/useItAssets";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Asset Name", uid: "assetName", sortable: true },
  { name: "Asset Tag", uid: "assetTag", sortable: true },
  { name: "Category", uid: "assetCategory", sortable: true },
  { name: "Brand", uid: "assetBrand" },
  { name: "Model", uid: "assetModel" },
  { name: "Assigned To", uid: "assetAssignedTo" },
  { name: "Location", uid: "assetLocation" },
  { name: "Status", uid: "assetStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Maintenance", uid: "maintenance" },
  { name: "Retired", uid: "retired" },
  { name: "Disposed", uid: "disposed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "assetName",
  "assetTag",
  "assetCategory",
  "assetBrand",
  "assetAssignedTo",
  "assetStatus",
  "actions",
];

export default function AssetsPage() {
  const {
    assets,
    loading,
    saving,
    editingAsset,
    formData,
    validationErrors,
    deletingAsset,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItAssets();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "assetName":
          return <span className="font-medium">{item.assetName}</span>;
        case "assetTag":
          return <span className="text-default-500">{item.assetTag || "-"}</span>;
        case "assetCategory":
          return item.assetCategory || "-";
        case "assetBrand":
          return item.assetBrand || "-";
        case "assetModel":
          return item.assetModel || "-";
        case "assetAssignedTo":
          return item.assetAssignedTo || "-";
        case "assetLocation":
          return item.assetLocation || "-";
        case "assetStatus": {
          const colorMap = {
            active: "success",
            maintenance: "warning",
            retired: "default",
            disposed: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.assetStatus] || "default"}
            >
              {item.assetStatus}
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
        data={assets}
        renderCell={renderCell}
        enableCardView
        rowKey="assetId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, tag, brand, location..."
        searchKeys={[
          "assetName",
          "assetTag",
          "assetBrand",
          "assetModel",
          "assetAssignedTo",
          "assetLocation",
        ]}
        statusField="assetStatus"
        statusOptions={statusOptions}
        emptyContent="No assets found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Asset
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
            {editingAsset ? "Edit Asset" : "Add Asset"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Asset Name"
                    labelPlacement="outside"
                    placeholder="Enter asset name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetName}
                    onChange={(e) => updateField("assetName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.assetName}
                    errorMessage={validationErrors?.assetName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Asset Tag"
                    labelPlacement="outside"
                    placeholder="Enter asset tag"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetTag}
                    onChange={(e) => updateField("assetTag", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Category"
                    labelPlacement="outside"
                    placeholder="Select category"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.assetCategory ? [formData.assetCategory] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("assetCategory", val);
                    }}
                  >
                    <SelectItem key="computer">Computer</SelectItem>
                    <SelectItem key="server">Server</SelectItem>
                    <SelectItem key="printer">Printer</SelectItem>
                    <SelectItem key="network">Network</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Brand"
                    labelPlacement="outside"
                    placeholder="Enter brand"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetBrand}
                    onChange={(e) => updateField("assetBrand", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Model"
                    labelPlacement="outside"
                    placeholder="Enter model"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetModel}
                    onChange={(e) => updateField("assetModel", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Serial Number"
                    labelPlacement="outside"
                    placeholder="Enter serial number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetSerialNumber}
                    onChange={(e) => updateField("assetSerialNumber", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="Enter employee name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetAssignedTo}
                    onChange={(e) => updateField("assetAssignedTo", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Location"
                    labelPlacement="outside"
                    placeholder="Enter location"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetLocation}
                    onChange={(e) => updateField("assetLocation", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Purchase Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetPurchaseDate}
                    onChange={(e) => updateField("assetPurchaseDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Warranty Expiry"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetWarrantyExpiry}
                    onChange={(e) => updateField("assetWarrantyExpiry", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.assetStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("assetStatus", val);
                    }}
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="maintenance">Maintenance</SelectItem>
                    <SelectItem key="retired">Retired</SelectItem>
                    <SelectItem key="disposed">Disposed</SelectItem>
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
                  value={formData.assetNotes}
                  onChange={(e) => updateField("assetNotes", e.target.value)}
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
              {editingAsset ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Asset</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingAsset?.assetName}
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
