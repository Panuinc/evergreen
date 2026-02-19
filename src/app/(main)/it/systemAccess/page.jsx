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
  Chip,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useItSystemAccess } from "@/hooks/useItSystemAccess";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "System", uid: "accessSystem", sortable: true },
  { name: "Type", uid: "accessType", sortable: true },
  { name: "Requested For", uid: "accessRequestedFor" },
  { name: "Requested By", uid: "accessRequestedBy" },
  { name: "Status", uid: "accessStatus", sortable: true },
  { name: "Approved By", uid: "accessApprovedBy" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "pending" },
  { name: "Approved", uid: "approved" },
  { name: "Rejected", uid: "rejected" },
  { name: "Completed", uid: "completed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "accessSystem",
  "accessType",
  "accessRequestedFor",
  "accessStatus",
  "accessApprovedBy",
  "actions",
];

export default function SystemAccessPage() {
  const {
    accessRequests,
    loading,
    saving,
    editingAccess,
    formData,
    validationErrors,
    deletingAccess,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSystemAccess();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "accessSystem":
          return <span className="font-medium">{item.accessSystem}</span>;
        case "accessType": {
          const colorMap = {
            grant: "success",
            revoke: "danger",
            modify: "warning",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.accessType] || "default"}
            >
              {item.accessType}
            </Chip>
          );
        }
        case "accessRequestedFor":
          return item.accessRequestedFor || "-";
        case "accessRequestedBy":
          return item.accessRequestedBy || "-";
        case "accessStatus": {
          const colorMap = {
            pending: "warning",
            approved: "success",
            rejected: "danger",
            completed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.accessStatus] || "default"}
            >
              {item.accessStatus}
            </Chip>
          );
        }
        case "accessApprovedBy":
          return item.accessApprovedBy || "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={accessRequests}
        renderCell={renderCell}
        enableCardView
        rowKey="accessId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by system, requested for, requested by..."
        searchKeys={[
          "accessSystem",
          "accessRequestedFor",
          "accessRequestedBy",
          "accessApprovedBy",
        ]}
        statusField="accessStatus"
        statusOptions={statusOptions}
        emptyContent="No access requests found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            New Request
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingAccess ? "Edit Access Request" : "New Access Request"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="System"
                    labelPlacement="outside"
                    placeholder="e.g. ERP, Email, VPN"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessSystem}
                    onChange={(e) => updateField("accessSystem", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.accessSystem}
                    errorMessage={validationErrors?.accessSystem}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Type"
                    labelPlacement="outside"
                    placeholder="Select type"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.accessType ? [formData.accessType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("accessType", val);
                    }}
                  >
                    <SelectItem key="grant">Grant</SelectItem>
                    <SelectItem key="revoke">Revoke</SelectItem>
                    <SelectItem key="modify">Modify</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Requested For"
                    labelPlacement="outside"
                    placeholder="Enter employee name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessRequestedFor}
                    onChange={(e) => updateField("accessRequestedFor", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Requested By"
                    labelPlacement="outside"
                    placeholder="Enter requester name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessRequestedBy}
                    onChange={(e) => updateField("accessRequestedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.accessStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("accessStatus", val);
                    }}
                  >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="approved">Approved</SelectItem>
                    <SelectItem key="rejected">Rejected</SelectItem>
                    <SelectItem key="completed">Completed</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Approved By"
                    labelPlacement="outside"
                    placeholder="Enter approver name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.accessApprovedBy}
                    onChange={(e) => updateField("accessApprovedBy", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="Enter notes"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.accessNotes}
                  onChange={(e) => updateField("accessNotes", e.target.value)}
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
              {editingAccess ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Access Request</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the access request for{" "}
              <span className="font-semibold">
                {deletingAccess?.accessSystem} ({deletingAccess?.accessRequestedFor})
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
