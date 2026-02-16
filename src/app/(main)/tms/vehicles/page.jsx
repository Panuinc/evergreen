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
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const vehicleCsvColumns = [
  { header: "Plate Number", key: "vehiclePlateNumber" },
  { header: "Name", key: "vehicleName" },
  { header: "Type", key: "vehicleType" },
  { header: "Brand", key: "vehicleBrand" },
  { header: "Model", key: "vehicleModel" },
  { header: "Fuel Type", key: "vehicleFuelType" },
  { header: "Capacity (Kg)", key: "vehicleCapacityKg" },
  { header: "Mileage", key: "vehicleCurrentMileage" },
  { header: "Status", key: "vehicleStatus" },
];

const columns = [
  { name: "Name", uid: "vehicleName", sortable: true },
  { name: "Plate Number", uid: "vehiclePlateNumber", sortable: true },
  { name: "Type", uid: "vehicleType", sortable: true },
  { name: "Brand", uid: "vehicleBrand", sortable: true },
  { name: "Status", uid: "vehicleStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Available", uid: "available" },
  { name: "In Use", uid: "in_use" },
  { name: "Maintenance", uid: "maintenance" },
  { name: "Retired", uid: "retired" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "vehicleName",
  "vehiclePlateNumber",
  "vehicleType",
  "vehicleBrand",
  "vehicleStatus",
  "actions",
];

export default function VehiclesPage() {
  const {
    vehicles,
    loading,
    saving,
    editingVehicle,
    formData,
    validationErrors,
    deletingVehicle,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useVehicles();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "vehicleName":
          return <span className="font-medium">{item.vehicleName}</span>;
        case "vehiclePlateNumber":
          return (
            <span className="text-default-500">
              {item.vehiclePlateNumber || "-"}
            </span>
          );
        case "vehicleType":
          return item.vehicleType || "-";
        case "vehicleBrand":
          return item.vehicleBrand || "-";
        case "vehicleStatus": {
          const colorMap = {
            available: "success",
            in_use: "warning",
            maintenance: "danger",
            retired: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.vehicleStatus] || "default"}
            >
              {item.vehicleStatus}
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
        data={vehicles}
        renderCell={renderCell}
        enableCardView
        rowKey="vehicleId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by plate number, name, brand, model..."
        searchKeys={[
          "vehiclePlateNumber",
          "vehicleName",
          "vehicleBrand",
          "vehicleModel",
        ]}
        statusField="vehicleStatus"
        statusOptions={statusOptions}
        emptyContent="No vehicles found"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("vehicles.csv", vehicleCsvColumns, vehicles)}>
              Export
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              Add Vehicle
            </Button>
          </div>
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
            {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Plate Number"
                    labelPlacement="outside"
                    placeholder="Enter plate number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehiclePlateNumber}
                    onChange={(e) =>
                      updateField("vehiclePlateNumber", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.vehiclePlateNumber}
                    errorMessage={validationErrors?.vehiclePlateNumber}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Name"
                    labelPlacement="outside"
                    placeholder="Enter vehicle name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleName}
                    onChange={(e) =>
                      updateField("vehicleName", e.target.value)
                    }
                    isInvalid={!!validationErrors?.vehicleName}
                    errorMessage={validationErrors?.vehicleName}
                    isRequired
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
                    selectedKeys={
                      formData.vehicleType ? [formData.vehicleType] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("vehicleType", val);
                    }}
                  >
                    <SelectItem key="truck">Truck</SelectItem>
                    <SelectItem key="pickup">Pickup</SelectItem>
                    <SelectItem key="van">Van</SelectItem>
                    <SelectItem key="trailer">Trailer</SelectItem>
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
                    value={formData.vehicleBrand}
                    onChange={(e) =>
                      updateField("vehicleBrand", e.target.value)
                    }
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
                    value={formData.vehicleModel}
                    onChange={(e) =>
                      updateField("vehicleModel", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Year"
                    labelPlacement="outside"
                    placeholder="Enter year"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleYear}
                    onChange={(e) =>
                      updateField("vehicleYear", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Color"
                    labelPlacement="outside"
                    placeholder="Enter color"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleColor}
                    onChange={(e) =>
                      updateField("vehicleColor", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="VIN Number"
                    labelPlacement="outside"
                    placeholder="Enter VIN number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleVin}
                    onChange={(e) =>
                      updateField("vehicleVin", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Fuel Type"
                    labelPlacement="outside"
                    placeholder="Select fuel type"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.vehicleFuelType
                        ? [formData.vehicleFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("vehicleFuelType", val);
                    }}
                  >
                    <SelectItem key="diesel">Diesel</SelectItem>
                    <SelectItem key="gasoline">Gasoline</SelectItem>
                    <SelectItem key="ngv">NGV</SelectItem>
                    <SelectItem key="electric">Electric</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Capacity (Kg)"
                    labelPlacement="outside"
                    placeholder="Enter capacity"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleCapacity}
                    onChange={(e) =>
                      updateField("vehicleCapacity", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Current Mileage"
                    labelPlacement="outside"
                    placeholder="Enter current mileage"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleMileage}
                    onChange={(e) =>
                      updateField("vehicleMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Registration Expiry"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleRegistrationExpiry}
                    onChange={(e) =>
                      updateField("vehicleRegistrationExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Insurance Expiry"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleInsuranceExpiry}
                    onChange={(e) =>
                      updateField("vehicleInsuranceExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Act Expiry"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.vehicleActExpiry}
                    onChange={(e) =>
                      updateField("vehicleActExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.vehicleStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "available";
                      updateField("vehicleStatus", val);
                    }}
                  >
                    <SelectItem key="available">Available</SelectItem>
                    <SelectItem key="in_use">In Use</SelectItem>
                    <SelectItem key="maintenance">Maintenance</SelectItem>
                    <SelectItem key="retired">Retired</SelectItem>
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
                  value={formData.vehicleNotes}
                  onChange={(e) =>
                    updateField("vehicleNotes", e.target.value)
                  }
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
              {editingVehicle ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Vehicle</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingVehicle?.vehicleName} ({deletingVehicle?.vehiclePlateNumber})
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
