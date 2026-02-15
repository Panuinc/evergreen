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
import { Card, CardBody, CardFooter } from "@heroui/react";
import { useEmployees } from "@/hooks/useEmployees";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "name", sortable: true },
  { name: "Email", uid: "employeeEmail", sortable: true },
  { name: "Phone", uid: "employeePhone" },
  { name: "Department", uid: "employeeDepartment", sortable: true },
  { name: "Position", uid: "employeePosition", sortable: true },
  { name: "Salary", uid: "employeeSalary", sortable: true },
  { name: "Status", uid: "employeeStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Inactive", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "employeeEmail",
  "employeeDepartment",
  "employeePosition",
  "employeeSalary",
  "employeeStatus",
  "actions",
];

export default function EmployeesPage() {
  const {
    employees,
    departments,
    positions,
    loading,
    saving,
    editingEmployee,
    formData,
    deletingEmployee,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useEmployees();

  const renderCell = useCallback(
    (emp, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-medium">
              {emp.employeeFirstName} {emp.employeeLastName}
            </span>
          );
        case "employeeEmail":
          return (
            <span className="text-default-500">{emp.employeeEmail || "-"}</span>
          );
        case "employeePhone":
          return (
            <span className="text-default-500">{emp.employeePhone || "-"}</span>
          );
        case "employeeDepartment":
          return emp.employeeDepartment || "-";
        case "employeePosition":
          return emp.employeePosition || "-";
        case "employeeSalary":
          return emp.employeeSalary
            ? Number(emp.employeeSalary).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })
            : "-";
        case "employeeStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={emp.employeeStatus === "active" ? "success" : "default"}
            >
              {emp.employeeStatus}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(emp)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(emp)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return emp[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  const renderCard = useCallback(
    (emp) => (
      <Card
        key={emp.employeeId}
        variant="bordered"
        radius="md"
        shadow="none"
        className="border-2 border-default"
      >
        <CardBody className="gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">
              {emp.employeeFirstName} {emp.employeeLastName}
            </span>
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={emp.employeeStatus === "active" ? "success" : "default"}
            >
              {emp.employeeStatus}
            </Chip>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-default-400">Email</span>
              <span className="text-default-500">
                {emp.employeeEmail || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Phone</span>
              <span className="text-default-500">
                {emp.employeePhone || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Department</span>
              <span>{emp.employeeDepartment || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Position</span>
              <span>{emp.employeePosition || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Salary</span>
              <span className="font-semibold">
                {emp.employeeSalary
                  ? Number(emp.employeeSalary).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })
                  : "-"}
              </span>
            </div>
          </div>
        </CardBody>
        <CardFooter className="gap-1 justify-end">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            isIconOnly
            onPress={() => handleOpen(emp)}
          >
            <Edit />
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            isIconOnly
            onPress={() => confirmDelete(emp)}
          >
            <Trash2 />
          </Button>
        </CardFooter>
      </Card>
    ),
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={employees}
        renderCell={renderCell}
        renderCard={renderCard}
        rowKey="employeeId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, email, department, position..."
        searchKeys={[
          "employeeFirstName",
          "employeeLastName",
          "employeeEmail",
          "employeePhone",
          "employeeDepartment",
          "employeePosition",
        ]}
        statusField="employeeStatus"
        statusOptions={statusOptions}
        emptyContent="No employees found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Employee
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
            {editingEmployee ? "Edit Employee" : "Add Employee"}
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
                    value={formData.employeeFirstName}
                    onChange={(e) =>
                      updateField("employeeFirstName", e.target.value)
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
                    value={formData.employeeLastName}
                    onChange={(e) =>
                      updateField("employeeLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="email"
                    label="Email"
                    labelPlacement="outside"
                    placeholder="Enter email"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeeEmail}
                    onChange={(e) =>
                      updateField("employeeEmail", e.target.value)
                    }
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
                    value={formData.employeePhone}
                    onChange={(e) =>
                      updateField("employeePhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Department"
                    labelPlacement="outside"
                    placeholder="Select department"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.employeeDepartment
                        ? [formData.employeeDepartment]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("employeeDepartment", val);
                    }}
                  >
                    {departments.map((dept) => (
                      <SelectItem key={dept.departmentName}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Position"
                    labelPlacement="outside"
                    placeholder="Select position"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.employeePosition
                        ? [formData.employeePosition]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("employeePosition", val);
                    }}
                  >
                    {positions.map((pos) => (
                      <SelectItem key={pos.positionTitle}>
                        {pos.positionTitle}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Salary"
                    labelPlacement="outside"
                    placeholder="Enter salary"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeeSalary}
                    onChange={(e) =>
                      updateField("employeeSalary", e.target.value)
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
                    selectedKeys={[formData.employeeStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("employeeStatus", val);
                    }}
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="inactive">Inactive</SelectItem>
                  </Select>
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
              {editingEmployee ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Employee</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingEmployee?.employeeFirstName}{" "}
                {deletingEmployee?.employeeLastName}
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
