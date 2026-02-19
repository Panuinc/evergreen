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
import { useCrmContacts } from "@/hooks/useCrmContacts";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Contact No", uid: "contactNo", sortable: true },
  { name: "Name", uid: "contactName" },
  { name: "Email", uid: "contactEmail" },
  { name: "Phone", uid: "contactPhone" },
  { name: "Position", uid: "contactPosition" },
  { name: "Account", uid: "accountName" },
  { name: "Tags", uid: "contactTags" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [];

const INITIAL_VISIBLE_COLUMNS = [
  "contactNo",
  "contactName",
  "contactEmail",
  "contactPhone",
  "accountName",
  "actions",
];

export default function ContactsPage() {
  const {
    contacts,
    loading,
    saving,
    editingContact,
    formData,
    validationErrors,
    deletingContact,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useCrmContacts();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "contactNo":
          return <span className="text-default-500">{item.contactNo || "-"}</span>;
        case "contactName":
          return (
            <span className="font-medium">
              {item.contactFirstName} {item.contactLastName}
            </span>
          );
        case "contactEmail":
          return item.contactEmail || "-";
        case "contactPhone":
          return item.contactPhone || "-";
        case "contactPosition":
          return item.contactPosition || "-";
        case "accountName":
          return item.crmAccounts?.accountName || "-";
        case "contactTags":
          return item.contactTags ? (
            <Chip variant="bordered" size="md" radius="md" color="primary">
              {item.contactTags}
            </Chip>
          ) : (
            "-"
          );
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
        data={contacts}
        renderCell={renderCell}
        enableCardView
        rowKey="contactId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search contacts..."
        searchKeys={[
          "contactFirstName",
          "contactLastName",
          "contactEmail",
          "contactPhone",
        ]}
        emptyContent="No contacts found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Contact
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
            {editingContact ? "Edit Contact" : "Add Contact"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="First Name"
                    labelPlacement="outside"
                    placeholder="Enter first name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.contactFirstName}
                    onChange={(e) => updateField("contactFirstName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.contactFirstName}
                    errorMessage={validationErrors?.contactFirstName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Last Name"
                    labelPlacement="outside"
                    placeholder="Enter last name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.contactLastName}
                    onChange={(e) => updateField("contactLastName", e.target.value)}
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
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
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
                    value={formData.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
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
                    value={formData.contactPosition}
                    onChange={(e) => updateField("contactPosition", e.target.value)}
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
                    value={formData.contactAccountId}
                    onChange={(e) => updateField("contactAccountId", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Address"
                  labelPlacement="outside"
                  placeholder="Enter address"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.contactAddress}
                  onChange={(e) => updateField("contactAddress", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Tags"
                  labelPlacement="outside"
                  placeholder="Enter tags"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.contactTags}
                  onChange={(e) => updateField("contactTags", e.target.value)}
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
                  value={formData.contactNotes}
                  onChange={(e) => updateField("contactNotes", e.target.value)}
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
              {editingContact ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Contact</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingContact?.contactFirstName} {deletingContact?.contactLastName}
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
