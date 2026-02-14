"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/actions/hr";

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

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Departments</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus />}
          onPress={() => handleOpen()}
        >
          Add Department
        </Button>
      </div>

      <Table aria-label="Departments table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Created At</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No departments found"
        >
          {departments.map((dept) => (
            <TableRow key={dept.departmentId}>
              <TableCell className="font-medium">
                {dept.departmentName}
              </TableCell>
              <TableCell className="text-default-500">
                {dept.departmentDescription || "-"}
              </TableCell>
              <TableCell className="text-default-500">
                {new Date(dept.departmentCreatedAt).toLocaleDateString("th-TH")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(dept)}
                  >
                    <Edit />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => confirmDelete(dept)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
              variant="bordered"
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
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm">
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
            <Button variant="flat" onPress={deleteModal.onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
