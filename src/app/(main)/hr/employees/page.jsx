"use client";

import { useState, useEffect, useCallback } from "react";
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
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getPositions,
} from "@/actions/hr";
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

const emptyForm = {
  employeeFirstName: "",
  employeeLastName: "",
  employeeEmail: "",
  employeePhone: "",
  employeeDepartment: "",
  employeePosition: "",
  employeeSalary: "",
  employeeStatus: "active",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, deptData, posData] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getPositions(),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setPositions(posData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeFirstName: employee.employeeFirstName || "",
        employeeLastName: employee.employeeLastName || "",
        employeeEmail: employee.employeeEmail || "",
        employeePhone: employee.employeePhone || "",
        employeeDepartment: employee.employeeDepartment || "",
        employeePosition: employee.employeePosition || "",
        employeeSalary: employee.employeeSalary?.toString() || "",
        employeeStatus: employee.employeeStatus || "active",
      });
    } else {
      setEditingEmployee(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.employeeFirstName.trim() ||
      !formData.employeeLastName.trim()
    ) {
      toast.error("First name and last name are required");
      return;
    }

    const payload = {
      ...formData,
      employeeSalary: formData.employeeSalary
        ? parseFloat(formData.employeeSalary)
        : null,
    };

    try {
      setSaving(true);
      if (editingEmployee) {
        await updateEmployee(editingEmployee.employeeId, payload);
        toast.success("Employee updated");
      } else {
        await createEmployee(payload);
        toast.success("Employee created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (employee) => {
    setDeletingEmployee(employee);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee(deletingEmployee.employeeId);
      toast.success("Employee deleted");
      deleteModal.onClose();
      setDeletingEmployee(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderCell = useCallback((emp, columnKey) => {
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
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={employees}
        renderCell={renderCell}
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
            <div className="grid grid-cols-2 gap-4">
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
              <Input
                type="email"
                label="Email"
                labelPlacement="outside"
                placeholder="Enter email"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.employeeEmail}
                onChange={(e) => updateField("employeeEmail", e.target.value)}
              />
              <Input
                label="Phone"
                labelPlacement="outside"
                placeholder="Enter phone number"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.employeePhone}
                onChange={(e) => updateField("employeePhone", e.target.value)}
              />
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
              <Select
                label="Position"
                labelPlacement="outside"
                placeholder="Select position"
                variant="bordered"
                size="md"
                radius="md"
                selectedKeys={
                  formData.employeePosition ? [formData.employeePosition] : []
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
              <Input
                type="number"
                label="Salary"
                labelPlacement="outside"
                placeholder="Enter salary"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.employeeSalary}
                onChange={(e) => updateField("employeeSalary", e.target.value)}
              />
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
