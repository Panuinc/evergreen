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
import { useMaintenance } from "@/hooks/useMaintenance";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const maintenanceCsvColumns = [
  { header: "Date", key: "maintenanceDate" },
  { header: "Type", key: "maintenanceType" },
  { header: "Description", key: "maintenanceDescription" },
  { header: "Cost", key: "maintenanceCost" },
  { header: "Vendor", key: "maintenanceVendor" },
  { header: "Status", key: "maintenanceStatus" },
];

const columns = [
  { name: "Date", uid: "maintenanceDate", sortable: true },
  { name: "Vehicle", uid: "vehicleName", sortable: true },
  { name: "Type", uid: "maintenanceType", sortable: true },
  { name: "Description", uid: "maintenanceDescription" },
  { name: "Cost", uid: "maintenanceCost", sortable: true },
  { name: "Status", uid: "maintenanceStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Scheduled", uid: "scheduled" },
  { name: "In Progress", uid: "in_progress" },
  { name: "Completed", uid: "completed" },
  { name: "Cancelled", uid: "cancelled" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "maintenanceDate",
  "vehicleName",
  "maintenanceType",
  "maintenanceDescription",
  "maintenanceCost",
  "maintenanceStatus",
  "actions",
];

export default function MaintenancePage() {
  const {
    maintenance,
    vehicles,
    loading,
    saving,
    editingMaintenance,
    formData,
    deletingMaintenance,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useMaintenance();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "maintenanceDate":
          return (
            <span className="text-default-500">
              {item.maintenanceDate
                ? new Date(item.maintenanceDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "vehicleName": {
          const vehicle = vehicles.find(
            (v) => v.vehicleId === item.maintenanceVehicleId,
          );
          return vehicle
            ? `${vehicle.vehicleName} (${vehicle.vehiclePlateNumber})`
            : "-";
        }
        case "maintenanceType":
          return item.maintenanceType
            ? item.maintenanceType.charAt(0).toUpperCase() +
                item.maintenanceType.slice(1).replace(/_/g, " ")
            : "-";
        case "maintenanceDescription":
          return (
            <span className="text-default-500">
              {item.maintenanceDescription || "-"}
            </span>
          );
        case "maintenanceCost":
          return item.maintenanceCost
            ? `฿${Number(item.maintenanceCost).toLocaleString()}`
            : "-";
        case "maintenanceStatus": {
          const colorMap = {
            scheduled: "primary",
            in_progress: "warning",
            completed: "success",
            cancelled: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.maintenanceStatus] || "default"}
            >
              {item.maintenanceStatus}
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
    [handleOpen, confirmDelete, vehicles],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={maintenance}
        renderCell={renderCell}
        enableCardView
        rowKey="maintenanceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by description, vendor..."
        searchKeys={[
          "maintenanceDescription",
          "maintenanceVendor",
        ]}
        statusField="maintenanceStatus"
        statusOptions={statusOptions}
        emptyContent="No maintenance records found"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("maintenance.csv", maintenanceCsvColumns, maintenance)}>
              Export
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              Add Maintenance
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
            {editingMaintenance ? "Edit Maintenance" : "Add Maintenance"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Vehicle"
                    labelPlacement="outside"
                    placeholder="Select vehicle"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.maintenanceVehicleId
                        ? [formData.maintenanceVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("maintenanceVehicleId", val);
                    }}
                    isRequired
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.vehicleId}>
                        {v.vehicleName} ({v.vehiclePlateNumber})
                      </SelectItem>
                    ))}
                  </Select>
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
                      formData.maintenanceType
                        ? [formData.maintenanceType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("maintenanceType", val);
                    }}
                  >
                    <SelectItem key="preventive">Preventive</SelectItem>
                    <SelectItem key="repair">Repair</SelectItem>
                    <SelectItem key="inspection">Inspection</SelectItem>
                    <SelectItem key="tire">Tire</SelectItem>
                    <SelectItem key="oil_change">Oil Change</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Description"
                    labelPlacement="outside"
                    placeholder="Enter description"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceDescription}
                    onChange={(e) =>
                      updateField("maintenanceDescription", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceDate}
                    onChange={(e) =>
                      updateField("maintenanceDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Completed Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceCompletedDate}
                    onChange={(e) =>
                      updateField("maintenanceCompletedDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Mileage"
                    labelPlacement="outside"
                    placeholder="Enter mileage"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceMileage}
                    onChange={(e) =>
                      updateField("maintenanceMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Cost"
                    labelPlacement="outside"
                    placeholder="Enter cost"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceCost}
                    onChange={(e) =>
                      updateField("maintenanceCost", e.target.value)
                    }
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
                    value={formData.maintenanceVendor}
                    onChange={(e) =>
                      updateField("maintenanceVendor", e.target.value)
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
                    selectedKeys={[formData.maintenanceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "scheduled";
                      updateField("maintenanceStatus", val);
                    }}
                  >
                    <SelectItem key="scheduled">Scheduled</SelectItem>
                    <SelectItem key="in_progress">In Progress</SelectItem>
                    <SelectItem key="completed">Completed</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Next Due Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceNextDueDate}
                    onChange={(e) =>
                      updateField("maintenanceNextDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Next Due Mileage"
                    labelPlacement="outside"
                    placeholder="Enter next due mileage"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceNextDueMileage}
                    onChange={(e) =>
                      updateField("maintenanceNextDueMileage", e.target.value)
                    }
                  />
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
                  value={formData.maintenanceNotes}
                  onChange={(e) =>
                    updateField("maintenanceNotes", e.target.value)
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
              {editingMaintenance ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Maintenance</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this maintenance record
              {deletingMaintenance?.maintenanceDescription && (
                <>
                  {" "}
                  <span className="font-semibold">
                    ({deletingMaintenance.maintenanceDescription})
                  </span>
                </>
              )}
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
