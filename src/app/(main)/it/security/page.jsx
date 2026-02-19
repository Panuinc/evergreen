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
import { useItSecurity } from "@/hooks/useItSecurity";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Title", uid: "incidentTitle", sortable: true },
  { name: "Type", uid: "incidentType", sortable: true },
  { name: "Severity", uid: "incidentSeverity", sortable: true },
  { name: "Status", uid: "incidentStatus", sortable: true },
  { name: "Reported By", uid: "incidentReportedBy" },
  { name: "Assigned To", uid: "incidentAssignedTo" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Open", uid: "open" },
  { name: "Investigating", uid: "investigating" },
  { name: "Resolved", uid: "resolved" },
  { name: "Closed", uid: "closed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "incidentTitle",
  "incidentType",
  "incidentSeverity",
  "incidentStatus",
  "incidentAssignedTo",
  "actions",
];

export default function SecurityPage() {
  const {
    incidents,
    loading,
    saving,
    editingIncident,
    formData,
    validationErrors,
    deletingIncident,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSecurity();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "incidentTitle":
          return <span className="font-medium">{item.incidentTitle}</span>;
        case "incidentType":
          return item.incidentType || "-";
        case "incidentSeverity": {
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
              color={colorMap[item.incidentSeverity] || "default"}
            >
              {item.incidentSeverity}
            </Chip>
          );
        }
        case "incidentStatus": {
          const colorMap = {
            open: "warning",
            investigating: "primary",
            resolved: "success",
            closed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.incidentStatus] || "default"}
            >
              {item.incidentStatus}
            </Chip>
          );
        }
        case "incidentReportedBy":
          return item.incidentReportedBy || "-";
        case "incidentAssignedTo":
          return item.incidentAssignedTo || "-";
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
        data={incidents}
        renderCell={renderCell}
        enableCardView
        rowKey="incidentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by title, reported by, assigned to..."
        searchKeys={[
          "incidentTitle",
          "incidentReportedBy",
          "incidentAssignedTo",
        ]}
        statusField="incidentStatus"
        statusOptions={statusOptions}
        emptyContent="No security incidents found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Report Incident
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
            {editingIncident ? "Edit Incident" : "Report Incident"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="Title"
                    labelPlacement="outside"
                    placeholder="Enter incident title"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.incidentTitle}
                    onChange={(e) => updateField("incidentTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.incidentTitle}
                    errorMessage={validationErrors?.incidentTitle}
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
                    selectedKeys={formData.incidentType ? [formData.incidentType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("incidentType", val);
                    }}
                  >
                    <SelectItem key="malware">Malware</SelectItem>
                    <SelectItem key="phishing">Phishing</SelectItem>
                    <SelectItem key="unauthorized_access">Unauthorized Access</SelectItem>
                    <SelectItem key="data_breach">Data Breach</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Severity"
                    labelPlacement="outside"
                    placeholder="Select severity"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.incidentSeverity ? [formData.incidentSeverity] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("incidentSeverity", val);
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
                    selectedKeys={[formData.incidentStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "open";
                      updateField("incidentStatus", val);
                    }}
                  >
                    <SelectItem key="open">Open</SelectItem>
                    <SelectItem key="investigating">Investigating</SelectItem>
                    <SelectItem key="resolved">Resolved</SelectItem>
                    <SelectItem key="closed">Closed</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Reported By"
                    labelPlacement="outside"
                    placeholder="Enter reporter name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.incidentReportedBy}
                    onChange={(e) => updateField("incidentReportedBy", e.target.value)}
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
                    value={formData.incidentAssignedTo}
                    onChange={(e) => updateField("incidentAssignedTo", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe the incident..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.incidentDescription}
                  onChange={(e) => updateField("incidentDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Resolution"
                  labelPlacement="outside"
                  placeholder="Describe the resolution..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.incidentResolution}
                  onChange={(e) => updateField("incidentResolution", e.target.value)}
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
              {editingIncident ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Incident</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingIncident?.incidentTitle}
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
