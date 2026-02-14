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
  getActions,
  createAction,
  updateAction,
  deleteAction,
} from "@/actions/rbac";

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await getActions();
      setActions(data);
    } catch (error) {
      toast.error("Failed to load actions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (action = null) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        name: action.name,
        description: action.description || "",
      });
    } else {
      setEditingAction(null);
      setFormData({ name: "", description: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Action name is required");
      return;
    }

    try {
      if (editingAction) {
        await updateAction(editingAction.id, formData);
        toast.success("Action updated");
      } else {
        await createAction(formData);
        toast.success("Action created");
      }
      onClose();
      loadActions();
    } catch (error) {
      toast.error(error.message || "Failed to save action");
    }
  };

  const handleDelete = async (action) => {
    try {
      await deleteAction(action.id);
      toast.success("Action deleted");
      loadActions();
    } catch (error) {
      toast.error(error.message || "Failed to delete action");
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Actions</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => handleOpen()}
        >
          Add Action
        </Button>
      </div>

      <Table aria-label="Actions table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Created</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No actions found"
        >
          {actions.map((action) => (
            <TableRow key={action.id}>
              <TableCell className="font-medium">{action.name}</TableCell>
              <TableCell className="text-default-500">
                {action.description || "-"}
              </TableCell>
              <TableCell className="text-default-500">
                {new Date(action.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(action)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => handleDelete(action)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingAction ? "Edit Action" : "Create Action"}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Name"
              placeholder="e.g. create, read, update, delete"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant="bordered"
            />
            <Textarea
              label="Description"
              placeholder="Describe this action..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave}>
              {editingAction ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
