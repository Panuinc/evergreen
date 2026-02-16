"use client";

import { useCallback, useState } from "react";
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
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDeliveries } from "@/hooks/useDeliveries";
import DataTable from "@/components/ui/DataTable";
import FileUpload from "@/components/ui/FileUpload";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const columns = [
  { name: "Shipment", uid: "shipment", sortable: true },
  { name: "Receiver Name", uid: "deliveryReceiverName", sortable: true },
  { name: "Status", uid: "deliveryStatus", sortable: true },
  { name: "Signature", uid: "deliverySignatureUrl" },
  { name: "Photos", uid: "deliveryPhotoUrls" },
  { name: "Received At", uid: "deliveryReceivedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "pending" },
  { name: "Delivered OK", uid: "delivered_ok" },
  { name: "Delivered Partial", uid: "delivered_partial" },
  { name: "Delivered Damaged", uid: "delivered_damaged" },
  { name: "Refused", uid: "refused" },
  { name: "Returned", uid: "returned" },
];

const STATUS_COLORS = {
  pending: "warning",
  delivered_ok: "success",
  delivered_partial: "primary",
  delivered_damaged: "danger",
  refused: "danger",
  returned: "default",
};

const STATUS_LABELS = {
  pending: "Pending",
  delivered_ok: "Delivered OK",
  delivered_partial: "Delivered Partial",
  delivered_damaged: "Delivered Damaged",
  refused: "Refused",
  returned: "Returned",
};

const INITIAL_VISIBLE_COLUMNS = [
  "shipment",
  "deliveryReceiverName",
  "deliveryStatus",
  "deliverySignatureUrl",
  "deliveryPhotoUrls",
  "deliveryReceivedAt",
  "actions",
];

export default function DeliveriesPage() {
  const {
    deliveries,
    shipments,
    loading,
    saving,
    editingDelivery,
    formData,
    deletingDelivery,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDeliveries();

  const previewModal = useDisclosure();
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = (images, index = 0) => {
    setPreviewImages(Array.isArray(images) ? images : [images]);
    setPreviewIndex(index);
    previewModal.onOpen();
  };

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "shipment": {
          const s = shipments.find(
            (s) => s.shipmentId === item.deliveryShipmentId,
          );
          return s
            ? `${s.shipmentNumber} - ${s.shipmentCustomerName}`
            : "-";
        }
        case "deliveryReceiverName":
          return item.deliveryReceiverName || "-";
        case "deliveryStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.deliveryStatus] || "default"}
            >
              {STATUS_LABELS[item.deliveryStatus] || item.deliveryStatus}
            </Chip>
          );
        case "deliverySignatureUrl":
          return item.deliverySignatureUrl ? (
            <img
              src={item.deliverySignatureUrl}
              alt="signature"
              className="w-10 h-10 object-cover rounded cursor-pointer border border-default-200"
              onClick={() => openPreview(item.deliverySignatureUrl)}
            />
          ) : "-";
        case "deliveryPhotoUrls":
          return item.deliveryPhotoUrls?.length > 0 ? (
            <div className="flex gap-1">
              {item.deliveryPhotoUrls.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`photo-${i}`}
                  className="w-8 h-8 object-cover rounded cursor-pointer border border-default-200"
                  onClick={() => openPreview(item.deliveryPhotoUrls, i)}
                />
              ))}
              {item.deliveryPhotoUrls.length > 3 && (
                <span className="text-xs text-default-400 self-center">
                  +{item.deliveryPhotoUrls.length - 3}
                </span>
              )}
            </div>
          ) : "-";
        case "deliveryReceivedAt":
          return item.deliveryReceivedAt
            ? new Date(item.deliveryReceivedAt).toLocaleString("th-TH")
            : "-";
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
                <Edit size={16} />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [shipments, handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={deliveries}
        renderCell={renderCell}
        enableCardView
        rowKey="deliveryId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by receiver, notes..."
        searchKeys={["deliveryReceiverName", "deliveryNotes"]}
        statusField="deliveryStatus"
        statusOptions={statusOptions}
        emptyContent="No deliveries found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus size={16} />}
            onPress={() => handleOpen()}
          >
            New Delivery
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
            {editingDelivery ? "Edit Delivery" : "New Delivery"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Select
                    label="Shipment"
                    labelPlacement="outside"
                    placeholder="Select shipment"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.deliveryShipmentId
                        ? [formData.deliveryShipmentId]
                        : []
                    }
                    onSelectionChange={(keys) =>
                      updateField(
                        "deliveryShipmentId",
                        Array.from(keys)[0] || "",
                      )
                    }
                    isRequired
                  >
                    {shipments.map((s) => (
                      <SelectItem key={s.shipmentId}>
                        {s.shipmentNumber} - {s.shipmentCustomerName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Receiver Name"
                    labelPlacement="outside"
                    placeholder="Enter receiver name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deliveryReceiverName}
                    onChange={(e) =>
                      updateField("deliveryReceiverName", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Receiver Phone"
                    labelPlacement="outside"
                    placeholder="Enter receiver phone"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deliveryReceiverPhone}
                    onChange={(e) =>
                      updateField("deliveryReceiverPhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Status"
                    labelPlacement="outside"
                    placeholder="Select status"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.deliveryStatus ? [formData.deliveryStatus] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("deliveryStatus", val);
                    }}
                  >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="delivered_ok">Delivered OK</SelectItem>
                    <SelectItem key="delivered_partial">
                      Delivered Partial
                    </SelectItem>
                    <SelectItem key="delivered_damaged">
                      Delivered Damaged
                    </SelectItem>
                    <SelectItem key="refused">Refused</SelectItem>
                    <SelectItem key="returned">Returned</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Damage Notes"
                    labelPlacement="outside"
                    placeholder="Enter damage notes"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deliveryDamageNotes}
                    onChange={(e) =>
                      updateField("deliveryDamageNotes", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="Notes"
                    labelPlacement="outside"
                    placeholder="Additional notes"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deliveryNotes}
                    onChange={(e) =>
                      updateField("deliveryNotes", e.target.value)
                    }
                  />
                </div>
                <div className="p-2 md:col-span-2">
                  <FileUpload
                    label="Signature"
                    accept="image/*"
                    multiple={false}
                    value={formData.deliverySignatureUrl}
                    onChange={(url) => updateField("deliverySignatureUrl", url)}
                    folder="delivery-signatures"
                  />
                </div>
                <div className="p-2 md:col-span-2">
                  <FileUpload
                    label="Delivery Photos"
                    accept="image/*"
                    multiple={true}
                    value={formData.deliveryPhotoUrls}
                    onChange={(urls) => updateField("deliveryPhotoUrls", urls)}
                    folder="delivery-photos"
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
              {editingDelivery ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Delivery</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this delivery for{" "}
              <span className="font-semibold">
                {deletingDelivery?.deliveryReceiverName}
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen}
        onClose={previewModal.onClose}
        images={previewImages}
        initialIndex={previewIndex}
      />
    </div>
  );
}
