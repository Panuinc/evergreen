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
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/actions/hr";

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

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Positions</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus />}
          onPress={() => handleOpen()}
        >
          Add Position
        </Button>
      </div>

      <Table aria-label="Positions table">
        <TableHeader>
          <TableColumn>Title</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Created At</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No positions found"
        >
          {positions.map((pos) => (
            <TableRow key={pos.positionId}>
              <TableCell className="font-medium">
                {pos.positionTitle}
              </TableCell>
              <TableCell className="text-default-500">
                {pos.positionDescription || "-"}
              </TableCell>
              <TableCell className="text-default-500">
                {new Date(pos.positionCreatedAt).toLocaleDateString("th-TH")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(pos)}
                  >
                    <Edit />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => confirmDelete(pos)}
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
            {editingPos ? "Edit Position" : "Add Position"}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Title"
              placeholder="e.g. Software Engineer, HR Manager"
              value={formData.positionTitle}
              onChange={(e) =>
                setFormData({ ...formData, positionTitle: e.target.value })
              }
              variant="bordered"
              isRequired
            />
            <Textarea
              label="Description"
              placeholder="Describe this position..."
              value={formData.positionDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  positionDescription: e.target.value,
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
              {editingPos ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm">
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
