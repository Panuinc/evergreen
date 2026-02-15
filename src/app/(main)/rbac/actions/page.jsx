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
import { useActions } from "@/hooks/useActions";
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
  const {
    actions,
    loading,
    editingAction,
    formData,
    setFormData,
    isOpen,
    onClose,
    handleOpen,
    handleSave,
    handleDelete,
  } = useActions();

  const renderCell = useCallback(
    (action, columnKey) => {
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
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(action)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleDelete(action)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return action[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={actions}
        renderCell={renderCell}
        enableCardView
        rowKey="actionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, description..."
        searchKeys={["actionName", "actionDescription"]}
        emptyContent="No actions found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
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
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Name"
                  labelPlacement="outside"
                  placeholder="e.g. create, read, update, delete"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.actionName}
                  onChange={(e) =>
                    setFormData({ ...formData, actionName: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe this action..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.actionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actionDescription: e.target.value,
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
            <Button variant="solid" size="md" radius="md" onPress={handleSave}>
              {editingAction ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
