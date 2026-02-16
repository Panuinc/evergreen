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
import { useFuelLogs } from "@/hooks/useFuelLogs";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import FileUpload from "@/components/ui/FileUpload";

const fuelCsvColumns = [
  { header: "Date", key: "fuelLogDate" },
  { header: "Liters", key: "fuelLogLiters" },
  { header: "Price/Liter", key: "fuelLogPricePerLiter" },
  { header: "Total Cost", key: "fuelLogTotalCost" },
  { header: "Mileage", key: "fuelLogMileage" },
  { header: "Station", key: "fuelLogStation" },
];

const columns = [
  { name: "Date", uid: "fuelLogDate", sortable: true },
  { name: "Vehicle", uid: "vehicleName", sortable: true },
  { name: "Liters", uid: "fuelLogLiters", sortable: true },
  { name: "Price/Liter", uid: "fuelLogPricePerLiter", sortable: true },
  { name: "Total Cost", uid: "fuelLogTotalCost", sortable: true },
  { name: "Mileage", uid: "fuelLogMileage", sortable: true },
  { name: "Station", uid: "fuelLogStation" },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "fuelLogDate",
  "vehicleName",
  "fuelLogLiters",
  "fuelLogPricePerLiter",
  "fuelLogTotalCost",
  "fuelLogMileage",
  "fuelLogStation",
  "actions",
];

export default function FuelLogsPage() {
  const {
    fuelLogs,
    vehicles,
    drivers,
    loading,
    saving,
    editingFuelLog,
    formData,
    deletingFuelLog,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useFuelLogs();

  const vehicleOptions = vehicles.map((v) => ({
    name: `${v.vehicleName} (${v.vehiclePlateNumber})`,
    uid: v.vehicleId,
  }));

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "fuelLogDate":
          return (
            <span className="text-default-500">
              {item.fuelLogDate
                ? new Date(item.fuelLogDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "vehicleName": {
          const vehicle = vehicles.find(
            (v) => v.vehicleId === item.fuelLogVehicleId,
          );
          return vehicle
            ? `${vehicle.vehicleName} (${vehicle.vehiclePlateNumber})`
            : "-";
        }
        case "fuelLogLiters":
          return item.fuelLogLiters
            ? Number(item.fuelLogLiters).toLocaleString()
            : "-";
        case "fuelLogPricePerLiter":
          return item.fuelLogPricePerLiter
            ? Number(item.fuelLogPricePerLiter).toLocaleString()
            : "-";
        case "fuelLogTotalCost":
          return item.fuelLogTotalCost
            ? Number(item.fuelLogTotalCost).toLocaleString()
            : "-";
        case "fuelLogMileage":
          return item.fuelLogMileage
            ? Number(item.fuelLogMileage).toLocaleString()
            : "-";
        case "fuelLogStation":
          return item.fuelLogStation || "-";
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
        data={fuelLogs}
        renderCell={renderCell}
        enableCardView
        rowKey="fuelLogId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by station..."
        searchKeys={["fuelLogStation"]}
        statusField="fuelLogVehicleId"
        statusOptions={vehicleOptions}
        filterLabel="Vehicle"
        emptyContent="No fuel logs found"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("fuel-logs.csv", fuelCsvColumns, fuelLogs)}>
              Export
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              Add Fuel Log
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
            {editingFuelLog ? "Edit Fuel Log" : "Add Fuel Log"}
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
                      formData.fuelLogVehicleId
                        ? [formData.fuelLogVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogVehicleId", val);
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
                    label="Driver"
                    labelPlacement="outside"
                    placeholder="Select driver"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.fuelLogDriverId
                        ? [formData.fuelLogDriverId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogDriverId", val);
                    }}
                  >
                    {drivers.map((d) => (
                      <SelectItem key={d.driverId}>
                        {d.driverFirstName} {d.driverLastName}
                      </SelectItem>
                    ))}
                  </Select>
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
                    value={formData.fuelLogDate}
                    onChange={(e) =>
                      updateField("fuelLogDate", e.target.value)
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
                      formData.fuelLogFuelType
                        ? [formData.fuelLogFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogFuelType", val);
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
                    label="Liters"
                    labelPlacement="outside"
                    placeholder="Enter liters"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.fuelLogLiters}
                    onChange={(e) =>
                      updateField("fuelLogLiters", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Price/Liter"
                    labelPlacement="outside"
                    placeholder="Enter price per liter"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.fuelLogPricePerLiter}
                    onChange={(e) =>
                      updateField("fuelLogPricePerLiter", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Total Cost"
                    labelPlacement="outside"
                    placeholder="Enter total cost"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.fuelLogTotalCost}
                    onChange={(e) =>
                      updateField("fuelLogTotalCost", e.target.value)
                    }
                    isRequired
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
                    value={formData.fuelLogMileage}
                    onChange={(e) =>
                      updateField("fuelLogMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Station"
                    labelPlacement="outside"
                    placeholder="Enter station name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.fuelLogStation}
                    onChange={(e) =>
                      updateField("fuelLogStation", e.target.value)
                    }
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
                    value={formData.fuelLogNotes}
                    onChange={(e) =>
                      updateField("fuelLogNotes", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="p-2">
                <FileUpload
                  label="Receipt"
                  accept="image/*,.pdf"
                  multiple={false}
                  value={formData.fuelLogReceiptUrl}
                  onChange={(url) => updateField("fuelLogReceiptUrl", url)}
                  folder="fuel-receipts"
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
              {editingFuelLog ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Fuel Log</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this fuel log
              {deletingFuelLog?.fuelLogDate && (
                <>
                  {" "}
                  from{" "}
                  <span className="font-semibold">
                    {new Date(
                      deletingFuelLog.fuelLogDate,
                    ).toLocaleDateString("th-TH")}
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
