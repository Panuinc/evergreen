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
import { Plus, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Lead No", uid: "leadNo", sortable: true },
  { name: "Name", uid: "leadName", sortable: true },
  { name: "Company", uid: "leadCompany" },
  { name: "Email", uid: "leadEmail" },
  { name: "Phone", uid: "leadPhone" },
  { name: "Source", uid: "leadSource" },
  { name: "Score", uid: "leadScore" },
  { name: "Status", uid: "leadStatus" },
  { name: "Assigned To", uid: "leadAssignedTo" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "New", uid: "new" },
  { name: "Contacted", uid: "contacted" },
  { name: "Qualified", uid: "qualified" },
  { name: "Converted", uid: "converted" },
  { name: "Lost", uid: "lost" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "leadNo",
  "leadName",
  "leadCompany",
  "leadSource",
  "leadScore",
  "leadStatus",
  "actions",
];

export default function LeadsPage() {
  const {
    leads,
    loading,
    saving,
    editingLead,
    formData,
    validationErrors,
    deletingLead,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleConvert,
  } = useCrmLeads();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "leadNo":
          return <span className="text-default-500">{item.leadNo || "-"}</span>;
        case "leadName":
          return <span className="font-medium">{item.leadName}</span>;
        case "leadCompany":
          return item.leadCompany || "-";
        case "leadEmail":
          return item.leadEmail || "-";
        case "leadPhone":
          return item.leadPhone || "-";
        case "leadSource":
          return item.leadSource ? (
            <Chip variant="flat" size="sm">
              {item.leadSource}
            </Chip>
          ) : (
            "-"
          );
        case "leadScore": {
          const scoreColorMap = {
            hot: "danger",
            warm: "warning",
            cold: "primary",
          };
          return item.leadScore ? (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={scoreColorMap[item.leadScore] || "default"}
            >
              {item.leadScore}
            </Chip>
          ) : (
            "-"
          );
        }
        case "leadStatus": {
          const statusColorMap = {
            new: "primary",
            contacted: "warning",
            qualified: "success",
            converted: "secondary",
            lost: "danger",
          };
          return item.leadStatus ? (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={statusColorMap[item.leadStatus] || "default"}
            >
              {item.leadStatus}
            </Chip>
          ) : (
            "-"
          );
        }
        case "leadAssignedTo":
          return item.leadAssignedTo || "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              {item.leadStatus === "qualified" && (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleConvert(item)}
                >
                  <ArrowRightLeft />
                </Button>
              )}
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
    [handleOpen, confirmDelete, handleConvert],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={leads}
        renderCell={renderCell}
        enableCardView
        rowKey="leadId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search leads..."
        searchKeys={[
          "leadName",
          "leadCompany",
          "leadEmail",
          "leadPhone",
        ]}
        statusField="leadStatus"
        statusOptions={statusOptions}
        emptyContent="No leads found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Lead
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
            {editingLead ? "Edit Lead" : "Add Lead"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Name"
                    labelPlacement="outside"
                    placeholder="Enter name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadName}
                    onChange={(e) => updateField("leadName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.leadName}
                    errorMessage={validationErrors?.leadName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Email"
                    labelPlacement="outside"
                    placeholder="Enter email"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadEmail}
                    onChange={(e) => updateField("leadEmail", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Phone"
                    labelPlacement="outside"
                    placeholder="Enter phone"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadPhone}
                    onChange={(e) => updateField("leadPhone", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Company"
                    labelPlacement="outside"
                    placeholder="Enter company"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadCompany}
                    onChange={(e) => updateField("leadCompany", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Position"
                    labelPlacement="outside"
                    placeholder="Enter position"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadPosition}
                    onChange={(e) => updateField("leadPosition", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Source"
                    labelPlacement="outside"
                    placeholder="Select source"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadSource ? [formData.leadSource] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadSource", val);
                    }}
                  >
                    <SelectItem key="website">Website</SelectItem>
                    <SelectItem key="referral">Referral</SelectItem>
                    <SelectItem key="social">Social</SelectItem>
                    <SelectItem key="event">Event</SelectItem>
                    <SelectItem key="cold_call">Cold Call</SelectItem>
                    <SelectItem key="advertisement">Advertisement</SelectItem>
                    <SelectItem key="partner">Partner</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Score"
                    labelPlacement="outside"
                    placeholder="Select score"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadScore ? [formData.leadScore] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadScore", val);
                    }}
                  >
                    <SelectItem key="hot">Hot</SelectItem>
                    <SelectItem key="warm">Warm</SelectItem>
                    <SelectItem key="cold">Cold</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    placeholder="Select status"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadStatus ? [formData.leadStatus] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadStatus", val);
                    }}
                  >
                    <SelectItem key="new">New</SelectItem>
                    <SelectItem key="contacted">Contacted</SelectItem>
                    <SelectItem key="qualified">Qualified</SelectItem>
                    <SelectItem key="converted">Converted</SelectItem>
                    <SelectItem key="lost">Lost</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="Enter assigned to"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadAssignedTo}
                    onChange={(e) => updateField("leadAssignedTo", e.target.value)}
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
                  value={formData.leadNotes}
                  onChange={(e) => updateField("leadNotes", e.target.value)}
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
              {editingLead ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Lead</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingLead?.leadName}
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
