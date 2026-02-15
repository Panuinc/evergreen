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
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/actions/hr";
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

const emptyForm = {
  positionTitle: "",
  positionDescription: "",
};

export default function PositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingPos, setDeletingPos] = useState(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await getPositions();
      setPositions(data);
    } catch (error) {
      toast.error("Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        positionTitle: pos.positionTitle || "",
        positionDescription: pos.positionDescription || "",
      });
    } else {
      setEditingPos(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.positionTitle.trim()) {
      toast.error("Position title is required");
      return;
    }

    try {
      setSaving(true);
      if (editingPos) {
        await updatePosition(editingPos.positionId, formData);
        toast.success("Position updated");
      } else {
        await createPosition(formData);
        toast.success("Position created");
      }
      onClose();
      loadPositions();
    } catch (error) {
      toast.error(error.message || "Failed to save position");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (pos) => {
    setDeletingPos(pos);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingPos) return;
    try {
      await deletePosition(deletingPos.positionId);
      toast.success("Position deleted");
      deleteModal.onClose();
      setDeletingPos(null);
      loadPositions();
    } catch (error) {
      toast.error(error.message || "Failed to delete position");
    }
  };

  const renderCell = useCallback((pos, columnKey) => {
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
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={positions}
        renderCell={renderCell}
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
