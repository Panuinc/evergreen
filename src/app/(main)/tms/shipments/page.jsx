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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Plus, Edit, Trash2, ChevronDown, Download } from "lucide-react";
import { useShipments } from "@/hooks/useShipments";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const shipmentCsvColumns = [
  { header: "Number", key: "shipmentNumber" },
  { header: "Date", key: "shipmentDate" },
  { header: "Customer", key: "shipmentCustomerName" },
  { header: "Phone", key: "shipmentCustomerPhone" },
  { header: "Destination", key: "shipmentDestination" },
  { header: "Weight (Kg)", key: "shipmentWeightKg" },
  { header: "Status", key: "shipmentStatus" },
];

const columns = [
  { name: "Number", uid: "shipmentNumber", sortable: true },
  { name: "Date", uid: "shipmentDate", sortable: true },
  { name: "Customer", uid: "shipmentCustomerName", sortable: true },
  { name: "Destination", uid: "shipmentDestination", sortable: true },
  { name: "Vehicle", uid: "vehicle" },
  { name: "Driver", uid: "driver" },
  { name: "Status", uid: "shipmentStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Draft", uid: "draft" },
  { name: "Confirmed", uid: "confirmed" },
  { name: "Dispatched", uid: "dispatched" },
  { name: "In Transit", uid: "in_transit" },
  { name: "Arrived", uid: "arrived" },
  { name: "Delivered", uid: "delivered" },
  { name: "POD Confirmed", uid: "pod_confirmed" },
  { name: "Cancelled", uid: "cancelled" },
];

const STATUS_COLORS = {
  draft: "default",
  confirmed: "primary",
  dispatched: "warning",
  in_transit: "secondary",
  arrived: "success",
  delivered: "success",
  pod_confirmed: "success",
  cancelled: "danger",
};

const NEXT_STATUS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["arrived"],
  arrived: ["delivered"],
  delivered: ["pod_confirmed"],
};

const STATUS_LABELS = {
  draft: "Draft",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  arrived: "Arrived",
  delivered: "Delivered",
  pod_confirmed: "POD Confirmed",
  cancelled: "Cancelled",
};

const INITIAL_VISIBLE_COLUMNS = [
  "shipmentNumber",
  "shipmentDate",
  "shipmentCustomerName",
  "shipmentDestination",
  "vehicle",
  "shipmentStatus",
  "actions",
];

export default function ShipmentsPage() {
  const {
    shipments,
    vehicles,
    drivers,
    routes,
    loading,
    saving,
    editingShipment,
    formData,
    deletingShipment,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleStatusChange,
  } = useShipments();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "shipmentNumber":
          return <span className="font-medium">{item.shipmentNumber}</span>;
        case "shipmentDate":
          return item.shipmentDate
            ? new Date(item.shipmentDate).toLocaleDateString("th-TH")
            : "-";
        case "shipmentCustomerName":
          return item.shipmentCustomerName || "-";
        case "shipmentDestination":
          return item.shipmentDestination || "-";
        case "vehicle": {
          const v = vehicles.find((v) => v.vehicleId === item.shipmentVehicleId);
          return v ? v.vehiclePlateNumber : "-";
        }
        case "driver": {
          const d = drivers.find((d) => d.driverId === item.shipmentDriverId);
          return d ? `${d.driverFirstName} ${d.driverLastName}` : "-";
        }
        case "shipmentStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.shipmentStatus] || "default"}
            >
              {STATUS_LABELS[item.shipmentStatus] || item.shipmentStatus}
            </Chip>
          );
        case "actions": {
          const nextStatuses = NEXT_STATUS[item.shipmentStatus] || [];
          return (
            <div className="flex items-center gap-1">
              {nextStatuses.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="bordered" size="md" radius="md" isIconOnly>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => handleStatusChange(item.shipmentId, key)}
                  >
                    {nextStatuses.map((s) => (
                      <DropdownItem key={s}>
                        {STATUS_LABELS[s] || s}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [vehicles, drivers, handleOpen, confirmDelete, handleStatusChange],
  );

  const availableVehicles = vehicles.filter((v) => v.vehicleStatus === "available");
  const availableDrivers = drivers.filter((d) => d.driverStatus === "available" && d.driverRole === "driver");
  const availableAssistants = drivers.filter((d) => d.driverStatus === "available" && d.driverRole === "assistant");

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={shipments}
        renderCell={renderCell}
        enableCardView
        rowKey="shipmentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by number, customer..."
        searchKeys={["shipmentNumber", "shipmentCustomerName", "shipmentDestination"]}
        statusField="shipmentStatus"
        statusOptions={statusOptions}
        emptyContent="No shipments found"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("shipments.csv", shipmentCsvColumns, shipments)}>
              Export
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus size={16} />} onPress={() => handleOpen()}>
              New Shipment
            </Button>
          </div>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingShipment ? "Edit Shipment" : "New Shipment"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="Customer Name" labelPlacement="outside" placeholder="Enter customer name" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerName} onChange={(e) => updateField("shipmentCustomerName", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="Customer Phone" labelPlacement="outside" placeholder="Enter phone" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerPhone} onChange={(e) => updateField("shipmentCustomerPhone", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 col-span-2">
                  <Input label="Customer Address" labelPlacement="outside" placeholder="Enter address" variant="bordered" size="md" radius="md" value={formData.shipmentCustomerAddress} onChange={(e) => updateField("shipmentCustomerAddress", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="Destination" labelPlacement="outside" placeholder="Enter destination" variant="bordered" size="md" radius="md" value={formData.shipmentDestination} onChange={(e) => updateField("shipmentDestination", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="Route" labelPlacement="outside" placeholder="Select route" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentRouteId ? [formData.shipmentRouteId] : []} onSelectionChange={(keys) => updateField("shipmentRouteId", Array.from(keys)[0] || "")}>
                    {routes.map((r) => (<SelectItem key={r.routeId}>{r.routeName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="Vehicle" labelPlacement="outside" placeholder="Select vehicle" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentVehicleId ? [formData.shipmentVehicleId] : []} onSelectionChange={(keys) => updateField("shipmentVehicleId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? vehicles : availableVehicles).map((v) => (<SelectItem key={v.vehicleId}>{v.vehicleName} ({v.vehiclePlateNumber})</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="Driver" labelPlacement="outside" placeholder="Select driver" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentDriverId ? [formData.shipmentDriverId] : []} onSelectionChange={(keys) => updateField("shipmentDriverId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.driverRole === "driver") : availableDrivers).map((d) => (<SelectItem key={d.driverId}>{d.driverFirstName} {d.driverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="Assistant" labelPlacement="outside" placeholder="Select assistant" variant="bordered" size="md" radius="md" selectedKeys={formData.shipmentAssistantId ? [formData.shipmentAssistantId] : []} onSelectionChange={(keys) => updateField("shipmentAssistantId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? drivers.filter(d => d.driverRole === "assistant") : availableAssistants).map((d) => (<SelectItem key={d.driverId}>{d.driverFirstName} {d.driverLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="Sales Order Ref" labelPlacement="outside" placeholder="BC order number" variant="bordered" size="md" radius="md" value={formData.shipmentSalesOrderRef} onChange={(e) => updateField("shipmentSalesOrderRef", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="number" label="Weight (Kg)" labelPlacement="outside" placeholder="Enter weight" variant="bordered" size="md" radius="md" value={formData.shipmentWeightKg} onChange={(e) => updateField("shipmentWeightKg", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 col-span-2">
                  <Input label="Items Summary" labelPlacement="outside" placeholder="Description of items" variant="bordered" size="md" radius="md" value={formData.shipmentItemsSummary} onChange={(e) => updateField("shipmentItemsSummary", e.target.value)} />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 col-span-2">
                  <Input label="Notes" labelPlacement="outside" placeholder="Additional notes" variant="bordered" size="md" radius="md" value={formData.shipmentNotes} onChange={(e) => updateField("shipmentNotes", e.target.value)} />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>Cancel</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleSave} isLoading={saving}>{editingShipment ? "Update" : "Create"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Shipment</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete shipment <span className="font-semibold">{deletingShipment?.shipmentNumber}</span>? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={deleteModal.onClose}>Cancel</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
