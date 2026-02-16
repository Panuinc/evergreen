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
import { useRoutes } from "@/hooks/useRoutes";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Route Name", uid: "routeName", sortable: true },
  { name: "Origin", uid: "routeOrigin", sortable: true },
  { name: "Destination", uid: "routeDestination", sortable: true },
  { name: "Distance", uid: "routeDistanceKm", sortable: true },
  { name: "Estimated Time", uid: "routeEstimatedMinutes", sortable: true },
  { name: "Status", uid: "routeStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Inactive", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "routeName",
  "routeOrigin",
  "routeDestination",
  "routeDistanceKm",
  "routeEstimatedMinutes",
  "routeStatus",
  "actions",
];

export default function RoutesPage() {
  const {
    routes,
    loading,
    saving,
    editingRoute,
    formData,
    deletingRoute,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useRoutes();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "routeName":
          return <span className="font-medium">{item.routeName}</span>;
        case "routeOrigin":
          return item.routeOrigin || "-";
        case "routeDestination":
          return item.routeDestination || "-";
        case "routeDistanceKm":
          return item.routeDistanceKm
            ? `${Number(item.routeDistanceKm).toLocaleString()} km`
            : "-";
        case "routeEstimatedMinutes": {
          if (!item.routeEstimatedMinutes) return "-";
          const mins = Number(item.routeEstimatedMinutes);
          const hours = Math.floor(mins / 60);
          const remaining = mins % 60;
          if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
          if (hours > 0) return `${hours}h`;
          return `${remaining}m`;
        }
        case "routeStatus": {
          const colorMap = {
            active: "success",
            inactive: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.routeStatus] || "default"}
            >
              {item.routeStatus}
            </Chip>
          );
        }
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
        data={routes}
        renderCell={renderCell}
        enableCardView
        rowKey="routeId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by route name, destination..."
        searchKeys={[
          "routeName",
          "routeDestination",
        ]}
        statusField="routeStatus"
        statusOptions={statusOptions}
        emptyContent="No routes found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Route
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
            {editingRoute ? "Edit Route" : "Add Route"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Route Name"
                    labelPlacement="outside"
                    placeholder="Enter route name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.routeName}
                    onChange={(e) =>
                      updateField("routeName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Origin"
                    labelPlacement="outside"
                    placeholder="Enter origin"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.routeOrigin}
                    onChange={(e) =>
                      updateField("routeOrigin", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Destination"
                    labelPlacement="outside"
                    placeholder="Enter destination"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.routeDestination}
                    onChange={(e) =>
                      updateField("routeDestination", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Distance (km)"
                    labelPlacement="outside"
                    placeholder="Enter distance"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.routeDistanceKm}
                    onChange={(e) =>
                      updateField("routeDistanceKm", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Estimated Time (minutes)"
                    labelPlacement="outside"
                    placeholder="Enter estimated time"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.routeEstimatedMinutes}
                    onChange={(e) =>
                      updateField("routeEstimatedMinutes", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.routeStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("routeStatus", val);
                    }}
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="inactive">Inactive</SelectItem>
                  </Select>
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
                  value={formData.routeNotes}
                  onChange={(e) =>
                    updateField("routeNotes", e.target.value)
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
              {editingRoute ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Route</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingRoute?.routeName}
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
