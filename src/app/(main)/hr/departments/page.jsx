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
  Textarea,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDepartments } from "@/hooks/useDepartments";
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

export default function DepartmentsPage() {
  const {
    departments,
    loading,
    saving,
    editingDept,
    formData,
    setFormData,
    deletingDept,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDepartments();

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
            <Button
              variant="bordered"
              size="md"
              radius="md"
              isIconOnly
              onPress={() => handleOpen(dept)}
            >
              <Edit />
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              isIconOnly
              onPress={() => confirmDelete(dept)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      default:
        return dept[columnKey] || "-";
    }
  }, [handleOpen, confirmDelete]);

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
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
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
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Name"
                  labelPlacement="outside"
                  placeholder="e.g. IT, HR, Finance"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.departmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentName: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe this department..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.departmentDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentDescription: e.target.value,
                    })
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
