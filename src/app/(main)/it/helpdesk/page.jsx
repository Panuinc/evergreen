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
  Textarea,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useItTickets } from "@/hooks/useItTickets";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Ticket No", uid: "ticketNo", sortable: true },
  { name: "Title", uid: "ticketTitle", sortable: true },
  { name: "Category", uid: "ticketCategory", sortable: true },
  { name: "Priority", uid: "ticketPriority", sortable: true },
  { name: "Status", uid: "ticketStatus", sortable: true },
  { name: "Requested By", uid: "ticketRequestedBy" },
  { name: "Assigned To", uid: "ticketAssignedTo" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Open", uid: "open" },
  { name: "In Progress", uid: "in_progress" },
  { name: "Resolved", uid: "resolved" },
  { name: "Closed", uid: "closed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "ticketNo",
  "ticketTitle",
  "ticketCategory",
  "ticketPriority",
  "ticketStatus",
  "ticketAssignedTo",
  "actions",
];

export default function HelpDeskPage() {
  const {
    tickets,
    loading,
    saving,
    editingTicket,
    formData,
    validationErrors,
    deletingTicket,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItTickets();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "ticketNo":
          return <span className="font-medium">{item.ticketNo || "-"}</span>;
        case "ticketTitle":
          return <span className="font-medium">{item.ticketTitle}</span>;
        case "ticketCategory":
          return item.ticketCategory || "-";
        case "ticketPriority": {
          const colorMap = {
            low: "default",
            medium: "primary",
            high: "warning",
            critical: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.ticketPriority] || "default"}
            >
              {item.ticketPriority}
            </Chip>
          );
        }
        case "ticketStatus": {
          const colorMap = {
            open: "warning",
            in_progress: "primary",
            resolved: "success",
            closed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.ticketStatus] || "default"}
            >
              {item.ticketStatus}
            </Chip>
          );
        }
        case "ticketRequestedBy":
          return item.ticketRequestedBy || "-";
        case "ticketAssignedTo":
          return item.ticketAssignedTo || "-";
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
        data={tickets}
        renderCell={renderCell}
        enableCardView
        rowKey="ticketId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by ticket no, title, requested by..."
        searchKeys={[
          "ticketNo",
          "ticketTitle",
          "ticketRequestedBy",
          "ticketAssignedTo",
        ]}
        statusField="ticketStatus"
        statusOptions={statusOptions}
        emptyContent="No tickets found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            New Ticket
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
            {editingTicket ? `Edit Ticket ${editingTicket.ticketNo || ""}` : "New Ticket"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="Title"
                    labelPlacement="outside"
                    placeholder="Enter ticket title"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketTitle}
                    onChange={(e) => updateField("ticketTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.ticketTitle}
                    errorMessage={validationErrors?.ticketTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Category"
                    labelPlacement="outside"
                    placeholder="Select category"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.ticketCategory ? [formData.ticketCategory] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("ticketCategory", val);
                    }}
                  >
                    <SelectItem key="hardware">Hardware</SelectItem>
                    <SelectItem key="software">Software</SelectItem>
                    <SelectItem key="network">Network</SelectItem>
                    <SelectItem key="access">Access</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Priority"
                    labelPlacement="outside"
                    placeholder="Select priority"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.ticketPriority ? [formData.ticketPriority] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("ticketPriority", val);
                    }}
                  >
                    <SelectItem key="low">Low</SelectItem>
                    <SelectItem key="medium">Medium</SelectItem>
                    <SelectItem key="high">High</SelectItem>
                    <SelectItem key="critical">Critical</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.ticketStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "open";
                      updateField("ticketStatus", val);
                    }}
                  >
                    <SelectItem key="open">Open</SelectItem>
                    <SelectItem key="in_progress">In Progress</SelectItem>
                    <SelectItem key="resolved">Resolved</SelectItem>
                    <SelectItem key="closed">Closed</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Requested By"
                    labelPlacement="outside"
                    placeholder="Enter requester name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketRequestedBy}
                    onChange={(e) => updateField("ticketRequestedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="Enter assignee name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.ticketAssignedTo}
                    onChange={(e) => updateField("ticketAssignedTo", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe the issue..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.ticketDescription}
                  onChange={(e) => updateField("ticketDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="Enter notes"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.ticketNotes}
                  onChange={(e) => updateField("ticketNotes", e.target.value)}
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
              {editingTicket ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Ticket</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingTicket?.ticketNo} - {deletingTicket?.ticketTitle}
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
