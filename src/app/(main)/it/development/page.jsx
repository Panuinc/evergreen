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
  Progress,
  Spinner,
  Divider,
} from "@heroui/react";
import { Plus, Edit, Trash2, GitBranch, Clock } from "lucide-react";
import { useItDevRequests } from "@/hooks/useItDevRequests";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Request No", uid: "requestNo", sortable: true },
  { name: "Title", uid: "requestTitle", sortable: true },
  { name: "Requested By", uid: "requestedBy" },
  { name: "Priority", uid: "requestPriority", sortable: true },
  { name: "Assigned To", uid: "requestAssignedTo" },
  { name: "Progress", uid: "requestProgress", sortable: true },
  { name: "Status", uid: "requestStatus", sortable: true },
  { name: "Due Date", uid: "requestDueDate", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "pending" },
  { name: "Approved", uid: "approved" },
  { name: "In Progress", uid: "in_progress" },
  { name: "Testing", uid: "testing" },
  { name: "Completed", uid: "completed" },
  { name: "Cancelled", uid: "cancelled" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "requestNo",
  "requestTitle",
  "requestedBy",
  "requestPriority",
  "requestAssignedTo",
  "requestProgress",
  "requestStatus",
  "actions",
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DevelopmentPage() {
  const {
    requests,
    loading,
    saving,
    editingRequest,
    formData,
    validationErrors,
    deletingRequest,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    // Progress
    progressModal,
    selectedRequest,
    progressLogs,
    progressLoading,
    progressSaving,
    progressForm,
    openProgress,
    handleAddProgress,
    updateProgressField,
  } = useItDevRequests();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "requestNo":
          return <span className="font-medium">{item.requestNo || "-"}</span>;
        case "requestTitle":
          return <span className="font-medium">{item.requestTitle}</span>;
        case "requestedBy":
          return item.requestedBy || "-";
        case "requestPriority": {
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
              color={colorMap[item.requestPriority] || "default"}
            >
              {item.requestPriority}
            </Chip>
          );
        }
        case "requestAssignedTo":
          return item.requestAssignedTo || "-";
        case "requestProgress": {
          const progress = item.requestProgress || 0;
          const color =
            progress >= 100
              ? "success"
              : progress >= 50
                ? "primary"
                : progress > 0
                  ? "warning"
                  : "default";
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <Progress
                size="sm"
                value={progress}
                color={color}
                className="flex-1"
              />
              <span className="text-xs text-default-500 w-8 text-right">
                {progress}%
              </span>
            </div>
          );
        }
        case "requestStatus": {
          const colorMap = {
            pending: "default",
            approved: "primary",
            in_progress: "warning",
            testing: "secondary",
            completed: "success",
            cancelled: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.requestStatus] || "default"}
            >
              {item.requestStatus}
            </Chip>
          );
        }
        case "requestDueDate":
          return formatDate(item.requestDueDate);
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => openProgress(item)}
                title="Update Progress"
              >
                <GitBranch />
              </Button>
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
    [handleOpen, confirmDelete, openProgress],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={requests}
        renderCell={renderCell}
        enableCardView
        rowKey="requestId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by request no, title, requested by..."
        searchKeys={[
          "requestNo",
          "requestTitle",
          "requestedBy",
          "requestAssignedTo",
        ]}
        statusField="requestStatus"
        statusOptions={statusOptions}
        emptyContent="No development requests found"
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
            {editingRequest
              ? `Edit ${editingRequest.requestNo || "Request"}`
              : "New Development Request"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="Title"
                    labelPlacement="outside"
                    placeholder="ชื่อระบบหรือฟีเจอร์ที่ต้องการพัฒนา"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.requestTitle}
                    onChange={(e) => updateField("requestTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.requestTitle}
                    errorMessage={validationErrors?.requestTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Requested By"
                    labelPlacement="outside"
                    placeholder="ชื่อผู้แจ้ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.requestedBy}
                    onChange={(e) =>
                      updateField("requestedBy", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Priority"
                    labelPlacement="outside"
                    placeholder="Select priority"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.requestPriority
                        ? [formData.requestPriority]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("requestPriority", val);
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
                    selectedKeys={[formData.requestStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("requestStatus", val);
                    }}
                  >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="approved">Approved</SelectItem>
                    <SelectItem key="in_progress">In Progress</SelectItem>
                    <SelectItem key="testing">Testing</SelectItem>
                    <SelectItem key="completed">Completed</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="ชื่อ Developer"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.requestAssignedTo}
                    onChange={(e) =>
                      updateField("requestAssignedTo", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Start Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.requestStartDate}
                    onChange={(e) =>
                      updateField("requestStartDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Due Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.requestDueDate}
                    onChange={(e) =>
                      updateField("requestDueDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="อธิบายรายละเอียดของระบบที่ต้องการพัฒนา..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  minRows={3}
                  value={formData.requestDescription}
                  onChange={(e) =>
                    updateField("requestDescription", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="หมายเหตุเพิ่มเติม"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.requestNotes}
                  onChange={(e) => updateField("requestNotes", e.target.value)}
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
              {editingRequest ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Modal */}
      <Modal
        isOpen={progressModal.isOpen}
        onClose={progressModal.onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>
              {selectedRequest?.requestNo} - {selectedRequest?.requestTitle}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                size="md"
                value={selectedRequest?.requestProgress || 0}
                color={
                  (selectedRequest?.requestProgress || 0) >= 100
                    ? "success"
                    : (selectedRequest?.requestProgress || 0) >= 50
                      ? "primary"
                      : "warning"
                }
                className="flex-1"
              />
              <span className="text-sm font-normal text-default-500">
                {selectedRequest?.requestProgress || 0}%
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {/* Add Progress Form */}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-default-200 bg-default-50">
                <p className="text-sm font-semibold">Add Progress Update</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Textarea
                      placeholder="อธิบายสิ่งที่ทำ..."
                      variant="bordered"
                      size="md"
                      radius="md"
                      minRows={2}
                      value={progressForm.logDescription}
                      onChange={(e) =>
                        updateProgressField("logDescription", e.target.value)
                      }
                    />
                  </div>
                  <Input
                    type="number"
                    label="Progress %"
                    labelPlacement="outside"
                    placeholder="0-100"
                    variant="bordered"
                    size="md"
                    radius="md"
                    min={0}
                    max={100}
                    value={progressForm.logProgress}
                    onChange={(e) =>
                      updateProgressField("logProgress", e.target.value)
                    }
                  />
                  <Input
                    label="Updated By"
                    labelPlacement="outside"
                    placeholder="ชื่อ Developer"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={progressForm.logCreatedBy}
                    onChange={(e) =>
                      updateProgressField("logCreatedBy", e.target.value)
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="bordered"
                    size="md"
                    radius="md"
                    onPress={handleAddProgress}
                    isLoading={progressSaving}
                  >
                    Add Update
                  </Button>
                </div>
              </div>

              <Divider />

              {/* Progress History */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">Progress History</p>
                {progressLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : progressLogs.length === 0 ? (
                  <p className="text-sm text-default-400 text-center py-6">
                    No progress updates yet
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    {progressLogs.map((log) => (
                      <div
                        key={log.logId}
                        className="flex gap-3 p-3 rounded-lg border border-default-200"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <GitBranch size={14} className="text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {log.logCreatedBy || "Unknown"}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-default-400">
                              <Clock size={12} />
                              {formatDateTime(log.logCreatedAt)}
                            </div>
                          </div>
                          <p className="text-sm text-default-600 mt-1 whitespace-pre-wrap">
                            {log.logDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              size="sm"
                              value={log.logProgress || 0}
                              color={
                                (log.logProgress || 0) >= 100
                                  ? "success"
                                  : "primary"
                              }
                              className="flex-1 max-w-[200px]"
                            />
                            <span className="text-xs text-default-500">
                              {log.logProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={progressModal.onClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Request</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingRequest?.requestNo} - {deletingRequest?.requestTitle}
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
