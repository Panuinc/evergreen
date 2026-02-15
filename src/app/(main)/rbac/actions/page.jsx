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
  getActions,
  createAction,
  updateAction,
  deleteAction,
} from "@/actions/rbac";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "actionName", sortable: true },
  { name: "Description", uid: "actionDescription" },
  { name: "Created", uid: "actionCreatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "actionName",
  "actionDescription",
  "actionCreatedAt",
  "actions",
];

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    actionName: "",
    actionDescription: "",
  });
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
        actionName: action.actionName,
        actionDescription: action.actionDescription || "",
      });
    } else {
      setEditingAction(null);
      setFormData({ actionName: "", actionDescription: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.actionName.trim()) {
      toast.error("Action name is required");
      return;
    }

    try {
      if (editingAction) {
        await updateAction(editingAction.actionId, formData);
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
      await deleteAction(action.actionId);
      toast.success("Action deleted");
      loadActions();
    } catch (error) {
      toast.error(error.message || "Failed to delete action");
    }
  };

  const renderCell = useCallback((action, columnKey) => {
    switch (columnKey) {
      case "actionName":
        return <span className="font-medium">{action.actionName}</span>;
      case "actionDescription":
        return (
          <span className="text-default-500">
            {action.actionDescription || "-"}
          </span>
        );
      case "actionCreatedAt":
        return (
          <span className="text-default-500">
            {new Date(action.actionCreatedAt).toLocaleDateString()}
          </span>
        );
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <Button isIconOnly onPress={() => handleOpen(action)}>
              <Edit />
            </Button>
            <Button isIconOnly onPress={() => handleDelete(action)}>
              <Trash2 />
            </Button>
          </div>
        );
      default:
        return action[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={actions}
        renderCell={renderCell}
        rowKey="actionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, description..."
        searchKeys={["actionName", "actionDescription"]}
        emptyContent="No actions found"
        topEndContent={
          <Button startContent={<Plus />} onPress={() => handleOpen()}>
            Add Action
          </Button>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingAction ? "Edit Action" : "Create Action"}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Name"
              placeholder="e.g. create, read, update, delete"
              value={formData.actionName}
              onChange={(e) =>
                setFormData({ ...formData, actionName: e.target.value })
              }
            />
            <Textarea
              label="Description"
              placeholder="Describe this action..."
              value={formData.actionDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actionDescription: e.target.value,
                })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>Cancel</Button>
            <Button onPress={handleSave}>
              {editingAction ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
