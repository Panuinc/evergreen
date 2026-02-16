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
  Textarea,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { usePositions } from "@/hooks/usePositions";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Title", uid: "positionTitle", sortable: true },
  { name: "Department", uid: "positionDepartment", sortable: true },
  { name: "Description", uid: "positionDescription" },
  { name: "Created At", uid: "positionCreatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "positionTitle",
  "positionDepartment",
  "positionDescription",
  "actions",
];

export default function PositionsPage() {
  const {
    positions,
    departments,
    loading,
    saving,
    editingPos,
    formData,
    setFormData,
    deletingPos,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = usePositions();

  const deptOptions = departments.map((d) => ({
    name: d.departmentName,
    uid: d.departmentName,
  }));

  const renderCell = useCallback(
    (pos, columnKey) => {
      switch (columnKey) {
        case "positionTitle":
          return <span className="font-medium">{pos.positionTitle}</span>;
        case "positionDepartment":
          return pos.positionDepartment || "-";
        case "positionDescription":
          return (
            <span className="text-default-500">
              {pos.positionDescription || "-"}
            </span>
          );
        case "positionCreatedAt":
          return (
            <span className="text-default-500">
              {new Date(pos.positionCreatedAt).toLocaleDateString("th-TH")}
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
                onPress={() => handleOpen(pos)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(pos)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return pos[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={positions}
        renderCell={renderCell}
        enableCardView
        rowKey="positionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by title, department, description..."
        searchKeys={[
          "positionTitle",
          "positionDepartment",
          "positionDescription",
        ]}
        statusField="positionDepartment"
        statusOptions={deptOptions}
        filterLabel="Department"
        emptyContent="No positions found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Position
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingPos ? "Edit Position" : "Add Position"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="Department"
                  labelPlacement="outside"
                  placeholder="Select department"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.positionDepartment
                      ? [formData.positionDepartment]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "";
                    setFormData({ ...formData, positionDepartment: val });
                  }}
                  isRequired
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept.departmentName}>
                      {dept.departmentName}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Title"
                  labelPlacement="outside"
                  placeholder="e.g. Software Engineer, HR Manager"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.positionTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, positionTitle: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe this position..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.positionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      positionDescription: e.target.value,
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
              {editingPos ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Position</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingPos?.positionTitle}
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
