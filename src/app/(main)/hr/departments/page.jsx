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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/actions/hr";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "departmentName", sortable: true },
  { name: "Description", uid: "departmentDescription" },
  { name: "Created At", uid: "departmentCreatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "departmentName",
  "departmentDescription",
  "departmentCreatedAt",
  "actions",
];

const emptyForm = {
  departmentName: "",
  departmentDescription: "",
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDept, setDeletingDept] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        departmentName: dept.departmentName || "",
        departmentDescription: dept.departmentDescription || "",
      });
    } else {
      setEditingDept(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.departmentName.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, formData);
        toast.success("Department updated");
      } else {
        await createDepartment(formData);
        toast.success("Department created");
      }
      onClose();
      loadDepartments();
    } catch (error) {
      toast.error(error.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dept) => {
    setDeletingDept(dept);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment(deletingDept.departmentId);
      toast.success("Department deleted");
      deleteModal.onClose();
      setDeletingDept(null);
      loadDepartments();
    } catch (error) {
      toast.error(error.message || "Failed to delete department");
    }
  };

  const renderCell = useCallback((dept, columnKey) => {
    switch (columnKey) {
      case "departmentName":
        return <span className="font-medium">{dept.departmentName}</span>;
      case "departmentDescription":
        return (
          <span className="text-default-500">
            {dept.departmentDescription || "-"}
          </span>
        );
      case "departmentCreatedAt":
        return (
          <span className="text-default-500">
            {new Date(dept.departmentCreatedAt).toLocaleDateString("th-TH")}
          </span>
        );
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <Button isIconOnly onPress={() => handleOpen(dept)}>
              <Edit />
            </Button>
            <Button isIconOnly onPress={() => confirmDelete(dept)}>
              <Trash2 />
            </Button>
          </div>
        );
      default:
        return dept[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={departments}
        renderCell={renderCell}
        rowKey="departmentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, description..."
        searchKeys={["departmentName", "departmentDescription"]}
        emptyContent="No departments found"
        topEndContent={
          <Button startContent={<Plus />} onPress={() => handleOpen()}>
            Add Department
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDept ? "Edit Department" : "Add Department"}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Name"
              placeholder="e.g. IT, HR, Finance"
              value={formData.departmentName}
              onChange={(e) =>
                setFormData({ ...formData, departmentName: e.target.value })
              }
              isRequired
            />
            <Textarea
              label="Description"
              placeholder="Describe this department..."
              value={formData.departmentDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  departmentDescription: e.target.value,
                })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>Cancel</Button>
            <Button onPress={handleSave} isLoading={saving}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Department</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingDept?.departmentName}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onPress={deleteModal.onClose}>Cancel</Button>
            <Button onPress={handleDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
