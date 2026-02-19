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
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Phone,
  Calendar,
  Mail,
  ClipboardList,
} from "lucide-react";
import { useCrmActivities } from "@/hooks/useCrmActivities";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Type", uid: "activityType" },
  { name: "Subject", uid: "activitySubject", sortable: true },
  { name: "Contact", uid: "contact" },
  { name: "Opportunity", uid: "opportunity" },
  { name: "Priority", uid: "activityPriority" },
  { name: "Status", uid: "activityStatus" },
  { name: "Due Date", uid: "activityDueDate" },
  { name: "Assigned To", uid: "activityAssignedTo" },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "activityType",
  "activitySubject",
  "contact",
  "activityPriority",
  "activityStatus",
  "activityDueDate",
  "actions",
];

const TYPE_ICON_MAP = {
  task: ClipboardList,
  call: Phone,
  meeting: Calendar,
  email: Mail,
};

const PRIORITY_COLOR_MAP = {
  low: "default",
  medium: "warning",
  high: "danger",
};

const STATUS_COLOR_MAP = {
  pending: "primary",
  completed: "success",
  overdue: "danger",
};

export default function ActivitiesPage() {
  const {
    activities,
    loading,
    saving,
    editingActivity,
    formData,
    validationErrors,
    deletingActivity,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleToggleComplete,
    confirmDelete,
    handleDelete,
  } = useCrmActivities();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "activityType": {
          const Icon = TYPE_ICON_MAP[item.activityType] || ClipboardList;
          return (
            <div className="flex items-center gap-2">
              <Icon size={16} />
              <span className="capitalize">{item.activityType}</span>
            </div>
          );
        }
        case "activitySubject":
          return (
            <span className="font-medium">{item.activitySubject || "-"}</span>
          );
        case "contact":
          return item.crmContacts
            ? `${item.crmContacts.contactFirstName} ${item.crmContacts.contactLastName}`
            : "-";
        case "opportunity":
          return item.crmOpportunities?.opportunityName || "-";
        case "activityPriority": {
          const color =
            PRIORITY_COLOR_MAP[item.activityPriority] || "default";
          return (
            <Chip variant="bordered" size="md" radius="md" color={color}>
              {item.activityPriority}
            </Chip>
          );
        }
        case "activityStatus": {
          const color =
            STATUS_COLOR_MAP[item.activityStatus] || "default";
          return (
            <Chip variant="bordered" size="md" radius="md" color={color}>
              {item.activityStatus}
            </Chip>
          );
        }
        case "activityDueDate": {
          if (!item.activityDueDate) return "-";
          const dueDate = new Date(item.activityDueDate);
          const isOverdue =
            dueDate < new Date() && item.activityStatus !== "completed";
          return (
            <span className={isOverdue ? "text-danger font-medium" : ""}>
              {dueDate.toLocaleString("th-TH")}
            </span>
          );
        }
        case "activityAssignedTo":
          return item.activityAssignedTo || "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleToggleComplete(item)}
              >
                <CheckCircle
                  size={16}
                  className={
                    item.activityStatus === "completed"
                      ? "text-success"
                      : ""
                  }
                />
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
    [handleOpen, handleToggleComplete, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs
        selectedKey={typeFilter}
        onSelectionChange={setTypeFilter}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="" title="All" />
        <Tab key="task" title="Tasks" />
        <Tab key="call" title="Calls" />
        <Tab key="meeting" title="Meetings" />
        <Tab key="email" title="Emails" />
      </Tabs>

      <DataTable
        columns={columns}
        data={activities}
        renderCell={renderCell}
        enableCardView
        rowKey="activityId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search activities..."
        searchKeys={["activitySubject", "activityAssignedTo"]}
        emptyContent="No activities found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Activity
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
            {editingActivity ? "Edit Activity" : "Add Activity"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Type"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.activityType]}
                    onChange={(e) => updateField("activityType", e.target.value)}
                  >
                    <SelectItem key="task">Task</SelectItem>
                    <SelectItem key="call">Call</SelectItem>
                    <SelectItem key="meeting">Meeting</SelectItem>
                    <SelectItem key="email">Email</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Subject"
                    labelPlacement="outside"
                    placeholder="Enter subject"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activitySubject}
                    onChange={(e) =>
                      updateField("activitySubject", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.activitySubject}
                    errorMessage={validationErrors?.activitySubject}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Enter description"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.activityDescription}
                  onChange={(e) =>
                    updateField("activityDescription", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Priority"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.activityPriority]}
                    onChange={(e) =>
                      updateField("activityPriority", e.target.value)
                    }
                  >
                    <SelectItem key="low">Low</SelectItem>
                    <SelectItem key="medium">Medium</SelectItem>
                    <SelectItem key="high">High</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.activityStatus]}
                    onChange={(e) =>
                      updateField("activityStatus", e.target.value)
                    }
                  >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="completed">Completed</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Due Date"
                    labelPlacement="outside"
                    type="datetime-local"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activityDueDate}
                    onChange={(e) =>
                      updateField("activityDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Contact"
                    labelPlacement="outside"
                    placeholder="Enter contact ID"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activityContactId}
                    onChange={(e) =>
                      updateField("activityContactId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Opportunity"
                    labelPlacement="outside"
                    placeholder="Enter opportunity ID"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activityOpportunityId}
                    onChange={(e) =>
                      updateField("activityOpportunityId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Account"
                    labelPlacement="outside"
                    placeholder="Enter account ID"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activityAccountId}
                    onChange={(e) =>
                      updateField("activityAccountId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="Enter assignee"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.activityAssignedTo}
                    onChange={(e) =>
                      updateField("activityAssignedTo", e.target.value)
                    }
                  />
                </div>
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
              {editingActivity ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Activity</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingActivity?.activitySubject}
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
