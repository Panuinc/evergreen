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
import { useDeliveries } from "@/hooks/tms/useDeliveries";
import DataTable from "@/components/ui/DataTable";
import FileUpload from "@/components/ui/FileUpload";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const columns = [
  { name: "การขนส่ง", uid: "shipment", sortable: true },
  { name: "ชื่อผู้รับ", uid: "deliveryReceiverName", sortable: true },
  { name: "สถานะ", uid: "deliveryStatus", sortable: true },
  { name: "ลายเซ็น", uid: "deliverySignatureUrl" },
  { name: "รูปภาพ", uid: "deliveryPhotoUrls" },
  { name: "เวลารับสินค้า", uid: "deliveryReceivedAt", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "ส่งสำเร็จ", uid: "delivered_ok" },
  { name: "ส่งบางส่วน", uid: "delivered_partial" },
  { name: "ส่งชำรุด", uid: "delivered_damaged" },
  { name: "ปฏิเสธ", uid: "refused" },
  { name: "ส่งคืน", uid: "returned" },
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
  pending: "รอดำเนินการ",
  delivered_ok: "ส่งสำเร็จ",
  delivered_partial: "ส่งบางส่วน",
  delivered_damaged: "ส่งชำรุด",
  refused: "ปฏิเสธ",
  returned: "ส่งคืน",
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
        searchPlaceholder="ค้นหาด้วยชื่อผู้รับ, หมายเหตุ..."
        searchKeys={["deliveryReceiverName", "deliveryNotes"]}
        statusField="deliveryStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบการจัดส่ง"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus size={16} />}
            onPress={() => handleOpen()}
          >
            สร้างการจัดส่ง
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
            {editingDelivery ? "แก้ไขการจัดส่ง" : "สร้างการจัดส่ง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Select
                    label="การขนส่ง"
                    labelPlacement="outside"
                    placeholder="เลือกการขนส่ง"
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
                    label="ชื่อผู้รับ"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อผู้รับ"
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
                    label="เบอร์โทรผู้รับ"
                    labelPlacement="outside"
                    placeholder="กรอกเบอร์โทรผู้รับ"
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
                    label="สถานะ"
                    labelPlacement="outside"
                    placeholder="เลือกสถานะ"
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
                    <SelectItem key="pending">รอดำเนินการ</SelectItem>
                    <SelectItem key="delivered_ok">ส่งสำเร็จ</SelectItem>
                    <SelectItem key="delivered_partial">
                      ส่งบางส่วน
                    </SelectItem>
                    <SelectItem key="delivered_damaged">
                      ส่งชำรุด
                    </SelectItem>
                    <SelectItem key="refused">ปฏิเสธ</SelectItem>
                    <SelectItem key="returned">ส่งคืน</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="หมายเหตุความเสียหาย"
                    labelPlacement="outside"
                    placeholder="กรอกหมายเหตุความเสียหาย"
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
                    label="หมายเหตุ"
                    labelPlacement="outside"
                    placeholder="หมายเหตุเพิ่มเติม"
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
                    label="ลายเซ็น"
                    accept="image/*"
                    multiple={false}
                    value={formData.deliverySignatureUrl}
                    onChange={(url) => updateField("deliverySignatureUrl", url)}
                    folder="delivery-signatures"
                  />
                </div>
                <div className="p-2 md:col-span-2">
                  <FileUpload
                    label="รูปภาพการจัดส่ง"
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
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              {editingDelivery ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบการจัดส่ง</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบการจัดส่งของ{" "}
              <span className="font-semibold">
                {deletingDelivery?.deliveryReceiverName}
              </span>
              {" "}หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              ลบ
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
