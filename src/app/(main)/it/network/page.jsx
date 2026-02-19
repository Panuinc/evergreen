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
import { useItNetwork } from "@/hooks/useItNetwork";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Device Name", uid: "deviceName", sortable: true },
  { name: "Type", uid: "deviceType", sortable: true },
  { name: "IP Address", uid: "deviceIpAddress" },
  { name: "MAC Address", uid: "deviceMacAddress" },
  { name: "Location", uid: "deviceLocation" },
  { name: "Manufacturer", uid: "deviceManufacturer" },
  { name: "Status", uid: "deviceStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Online", uid: "online" },
  { name: "Offline", uid: "offline" },
  { name: "Maintenance", uid: "maintenance" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "deviceName",
  "deviceType",
  "deviceIpAddress",
  "deviceLocation",
  "deviceStatus",
  "actions",
];

export default function NetworkPage() {
  const {
    devices,
    loading,
    saving,
    editingDevice,
    formData,
    validationErrors,
    deletingDevice,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItNetwork();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "deviceName":
          return <span className="font-medium">{item.deviceName}</span>;
        case "deviceType":
          return item.deviceType || "-";
        case "deviceIpAddress":
          return <span className="text-default-500">{item.deviceIpAddress || "-"}</span>;
        case "deviceMacAddress":
          return <span className="text-default-500">{item.deviceMacAddress || "-"}</span>;
        case "deviceLocation":
          return item.deviceLocation || "-";
        case "deviceManufacturer":
          return item.deviceManufacturer || "-";
        case "deviceStatus": {
          const colorMap = {
            online: "success",
            offline: "danger",
            maintenance: "warning",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.deviceStatus] || "default"}
            >
              {item.deviceStatus}
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
        data={devices}
        renderCell={renderCell}
        enableCardView
        rowKey="deviceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, IP, location..."
        searchKeys={[
          "deviceName",
          "deviceIpAddress",
          "deviceMacAddress",
          "deviceLocation",
          "deviceManufacturer",
        ]}
        statusField="deviceStatus"
        statusOptions={statusOptions}
        emptyContent="No network devices found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Device
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
            {editingDevice ? "Edit Device" : "Add Device"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Device Name"
                    labelPlacement="outside"
                    placeholder="Enter device name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceName}
                    onChange={(e) => updateField("deviceName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.deviceName}
                    errorMessage={validationErrors?.deviceName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Type"
                    labelPlacement="outside"
                    placeholder="Select type"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.deviceType ? [formData.deviceType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("deviceType", val);
                    }}
                  >
                    <SelectItem key="router">Router</SelectItem>
                    <SelectItem key="switch">Switch</SelectItem>
                    <SelectItem key="ap">Access Point</SelectItem>
                    <SelectItem key="firewall">Firewall</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="IP Address"
                    labelPlacement="outside"
                    placeholder="e.g. 192.168.1.1"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceIpAddress}
                    onChange={(e) => updateField("deviceIpAddress", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="MAC Address"
                    labelPlacement="outside"
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceMacAddress}
                    onChange={(e) => updateField("deviceMacAddress", e.target.value)}
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
                    value={formData.deviceLocation}
                    onChange={(e) => updateField("deviceLocation", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Manufacturer"
                    labelPlacement="outside"
                    placeholder="Enter manufacturer"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceManufacturer}
                    onChange={(e) => updateField("deviceManufacturer", e.target.value)}
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
                    value={formData.deviceModel}
                    onChange={(e) => updateField("deviceModel", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.deviceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "online";
                      updateField("deviceStatus", val);
                    }}
                  >
                    <SelectItem key="online">Online</SelectItem>
                    <SelectItem key="offline">Offline</SelectItem>
                    <SelectItem key="maintenance">Maintenance</SelectItem>
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
                  value={formData.deviceNotes}
                  onChange={(e) => updateField("deviceNotes", e.target.value)}
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
              {editingDevice ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Device</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingDevice?.deviceName}
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
