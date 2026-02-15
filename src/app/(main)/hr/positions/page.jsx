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
import { Card, CardBody, CardFooter } from "@heroui/react";
import { usePositions } from "@/hooks/usePositions";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Title", uid: "positionTitle", sortable: true },
  { name: "Description", uid: "positionDescription" },
  { name: "Created At", uid: "positionCreatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "positionTitle",
  "positionDescription",
  "positionCreatedAt",
  "actions",
];

export default function PositionsPage() {
  const {
    positions,
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

  const renderCell = useCallback(
    (pos, columnKey) => {
      switch (columnKey) {
        case "positionTitle":
          return <span className="font-medium">{pos.positionTitle}</span>;
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

  const renderCard = useCallback(
    (pos) => (
      <Card
        key={pos.positionId}
        variant="bordered"
        radius="md"
        shadow="none"
        className="border-2 border-default"
      >
        <CardBody className="gap-3">
          <span className="font-semibold text-lg">{pos.positionTitle}</span>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-default-400">Description</span>
              <span className="text-default-500">
                {pos.positionDescription || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Created</span>
              <span className="text-default-500">
                {new Date(pos.positionCreatedAt).toLocaleDateString("th-TH")}
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
        </CardFooter>
      </Card>
    ),
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={positions}
        renderCell={renderCell}
        renderCard={renderCard}
        rowKey="positionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by title, description..."
        searchKeys={["positionTitle", "positionDescription"]}
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
