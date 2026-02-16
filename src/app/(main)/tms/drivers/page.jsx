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
import { useDrivers } from "@/hooks/useDrivers";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "name", sortable: true },
  { name: "Phone", uid: "driverPhone" },
  { name: "Role", uid: "driverRole", sortable: true },
  { name: "License Type", uid: "driverLicenseType", sortable: true },
  { name: "License Expiry", uid: "driverLicenseExpiry", sortable: true },
  { name: "Status", uid: "driverStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Available", uid: "available" },
  { name: "On Duty", uid: "on_duty" },
  { name: "On Leave", uid: "on_leave" },
  { name: "Inactive", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "driverPhone",
  "driverRole",
  "driverLicenseType",
  "driverLicenseExpiry",
  "driverStatus",
  "actions",
];

export default function DriversPage() {
  const {
    drivers,
    employees,
    loading,
    saving,
    editingDriver,
    formData,
    deletingDriver,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDrivers();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-medium">
              {item.driverFirstName} {item.driverLastName}
            </span>
          );
        case "driverPhone":
          return (
            <span className="text-default-500">{item.driverPhone || "-"}</span>
          );
        case "driverRole": {
          const roleColor = {
            driver: "primary",
            assistant: "secondary",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={roleColor[item.driverRole] || "default"}
            >
              {item.driverRole}
            </Chip>
          );
        }
        case "driverLicenseType":
          return item.driverLicenseType || "-";
        case "driverLicenseExpiry":
          return (
            <span className="text-default-500">
              {item.driverLicenseExpiry
                ? new Date(item.driverLicenseExpiry).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "driverStatus": {
          const colorMap = {
            available: "success",
            on_duty: "warning",
            on_leave: "danger",
            inactive: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.driverStatus] || "default"}
            >
              {item.driverStatus}
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
        data={drivers}
        renderCell={renderCell}
        enableCardView
        rowKey="driverId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, phone..."
        searchKeys={[
          "driverFirstName",
          "driverLastName",
          "driverPhone",
        ]}
        statusField="driverStatus"
        statusOptions={statusOptions}
        emptyContent="No drivers found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Driver
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
            {editingDriver ? "Edit Driver" : "Add Driver"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="First Name"
                    labelPlacement="outside"
                    placeholder="Enter first name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverFirstName}
                    onChange={(e) =>
                      updateField("driverFirstName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Last Name"
                    labelPlacement="outside"
                    placeholder="Enter last name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLastName}
                    onChange={(e) =>
                      updateField("driverLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Phone"
                    labelPlacement="outside"
                    placeholder="Enter phone number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverPhone}
                    onChange={(e) =>
                      updateField("driverPhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Role"
                    labelPlacement="outside"
                    placeholder="Select role"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverRole ? [formData.driverRole] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverRole", val);
                    }}
                  >
                    <SelectItem key="driver">Driver</SelectItem>
                    <SelectItem key="assistant">Assistant</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="License Number"
                    labelPlacement="outside"
                    placeholder="Enter license number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLicenseNumber}
                    onChange={(e) =>
                      updateField("driverLicenseNumber", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="License Type"
                    labelPlacement="outside"
                    placeholder="Select license type"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverLicenseType
                        ? [formData.driverLicenseType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverLicenseType", val);
                    }}
                  >
                    <SelectItem key="type1">Type 1</SelectItem>
                    <SelectItem key="type2">Type 2</SelectItem>
                    <SelectItem key="type3">Type 3</SelectItem>
                    <SelectItem key="type4">Type 4</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="License Expiry"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLicenseExpiry}
                    onChange={(e) =>
                      updateField("driverLicenseExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Employee Link"
                    labelPlacement="outside"
                    placeholder="Select employee"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverEmployeeId
                        ? [formData.driverEmployeeId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverEmployeeId", val);
                    }}
                  >
                    {employees.map((emp) => (
                      <SelectItem key={emp.employeeId}>
                        {emp.employeeFirstName} {emp.employeeLastName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.driverStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "available";
                      updateField("driverStatus", val);
                    }}
                  >
                    <SelectItem key="available">Available</SelectItem>
                    <SelectItem key="on_duty">On Duty</SelectItem>
                    <SelectItem key="on_leave">On Leave</SelectItem>
                    <SelectItem key="inactive">Inactive</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Notes"
                    labelPlacement="outside"
                    placeholder="Enter notes"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverNotes}
                    onChange={(e) =>
                      updateField("driverNotes", e.target.value)
                    }
                  />
                </div>
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
              {editingDriver ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Driver</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingDriver?.driverFirstName}{" "}
                {deletingDriver?.driverLastName}
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
