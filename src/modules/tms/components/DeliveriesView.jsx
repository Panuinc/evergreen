import { useCallback, useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FileUpload from "@/components/ui/FileUpload";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const columns = [
  { name: "การขนส่ง", uid: "shipment", sortable: true },
  { name: "ชื่อผู้รับ", uid: "tmsDeliveryReceiverName", sortable: true },
  { name: "สถานะ", uid: "tmsDeliveryStatus", sortable: true },
  { name: "รูปภาพ", uid: "tmsDeliveryPhotoUrls" },
  { name: "เวลารับสินค้า", uid: "tmsDeliveryReceivedAt", sortable: true },
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
  "tmsDeliveryReceiverName",
  "tmsDeliveryStatus",
  "tmsDeliveryPhotoUrls",
  "tmsDeliveryReceivedAt",
  "actions",
];

export default function DeliveriesView({
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
  deliveryItems,
  updateDeliveryItem,
}) {
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
          const s = item.tmsShipment || shipments.find(
            (s) => s.tmsShipmentId === item.tmsDeliveryShipmentId,
          );
          return s
            ? `${s.tmsShipmentNumber} - ${s.tmsShipmentCustomerName}`
            : "-";
        }
        case "tmsDeliveryReceiverName":
          return item.tmsDeliveryReceiverName || "-";
        case "tmsDeliveryStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.tmsDeliveryStatus] || "default"}
            >
              {STATUS_LABELS[item.tmsDeliveryStatus] || item.tmsDeliveryStatus}
            </Chip>
          );
        case "tmsDeliveryPhotoUrls":
          return item.tmsDeliveryPhotoUrls?.length > 0 ? (
            <div className="flex gap-1">
              {item.tmsDeliveryPhotoUrls.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`photo-${i}`}
                  className="w-8 h-8 object-cover rounded cursor-pointer border border-default-200"
                  onClick={() => openPreview(item.tmsDeliveryPhotoUrls, i)}
                />
              ))}
              {item.tmsDeliveryPhotoUrls.length > 3 && (
                <span className="text-xs text-default-400 self-center">
                  +{item.tmsDeliveryPhotoUrls.length - 3}
                </span>
              )}
            </div>
          ) : "-";
        case "tmsDeliveryReceivedAt":
          return item.tmsDeliveryReceivedAt
            ? new Date(item.tmsDeliveryReceivedAt).toLocaleString("th-TH")
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
        rowKey="tmsDeliveryId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อผู้รับ, หมายเหตุ..."
        searchKeys={["tmsDeliveryReceiverName", "tmsDeliveryNotes"]}
        statusField="tmsDeliveryStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบการจัดส่ง"
        topEndContent={null}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingDelivery ? "แก้ไขการจัดส่ง" : "บันทึกการส่งมอบ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-4">
              {/* Shipment Info - read-only */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-default-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-default-400">การขนส่ง</p>
                  <p className="text-sm font-medium">
                    {(() => {
                      const s = shipments.find(
                        (s) => String(s.tmsShipmentId) === String(formData.tmsDeliveryShipmentId),
                      );
                      return s ? `${s.tmsShipmentNumber} - ${s.tmsShipmentCustomerName}` : "-";
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-400">ชื่อผู้รับ</p>
                  <p className="text-sm font-medium">{formData.tmsDeliveryReceiverName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-default-400">เบอร์โทรผู้รับ</p>
                  <p className="text-sm font-medium">{formData.tmsDeliveryReceiverPhone || "-"}</p>
                </div>
              </div>

              {/* Delivery Items Table */}
              {deliveryItems.length > 0 && (
                <div className="flex flex-col w-full gap-2">
                  <p className="text-sm font-medium">รายการสินค้า</p>
                  <div className="border border-default-200 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-default-100">
                          <th className="text-left px-3 py-2 font-semibold">รายการ</th>
                          <th className="text-center px-3 py-2 font-semibold w-16">หน่วย</th>
                          <th className="text-center px-3 py-2 font-semibold w-20">แผน</th>
                          <th className="text-center px-3 py-2 font-semibold w-24">ส่งจริง</th>
                          <th className="text-center px-3 py-2 font-semibold w-24">เสียหาย</th>
                          <th className="text-center px-3 py-2 font-semibold w-20">คืน</th>
                          <th className="text-left px-3 py-2 font-semibold min-w-[140px]">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryItems.map((item, idx) => {
                          const planned = item.tmsDeliveryItemPlannedQty;
                          const delivered = parseFloat(item.tmsDeliveryItemDeliveredQty) || 0;
                          const damaged = parseFloat(item.tmsDeliveryItemDamagedQty) || 0;
                          const hasDiscrepancy = delivered < planned || damaged > 0;
                          return (
                            <tr key={idx} className={`border-t border-default-100 ${hasDiscrepancy ? "bg-warning-50" : ""}`}>
                              <td className="px-3 py-2">
                                <p className="font-medium">{item.tmsDeliveryItemDescription}</p>
                                {item.tmsDeliveryItemSoNo && (
                                  <p className="text-default-400">{item.tmsDeliveryItemSoNo}</p>
                                )}
                              </td>
                              <td className="text-center px-3 py-2">{item.tmsDeliveryItemUom}</td>
                              <td className="text-center px-3 py-2 font-medium">{planned}</td>
                              <td className="text-center px-1 py-1">
                                <Input
                                  type="number"
                                  size="sm"
                                  variant="bordered"
                                  radius="md"
                                  min={0}
                                  max={planned}
                                  value={String(delivered)}
                                  onChange={(e) => updateDeliveryItem(idx, "tmsDeliveryItemDeliveredQty", parseFloat(e.target.value) || 0)}
                                  classNames={{ input: "text-center" }}
                                />
                              </td>
                              <td className="text-center px-1 py-1">
                                <Input
                                  type="number"
                                  size="sm"
                                  variant="bordered"
                                  radius="md"
                                  min={0}
                                  value={String(damaged)}
                                  onChange={(e) => updateDeliveryItem(idx, "tmsDeliveryItemDamagedQty", parseFloat(e.target.value) || 0)}
                                  classNames={{ input: "text-center" }}
                                />
                              </td>
                              <td className="text-center px-3 py-2 text-default-500 font-medium">
                                {item.tmsDeliveryItemReturnedQty || 0}
                              </td>
                              <td className="px-1 py-1">
                                <Input
                                  size="sm"
                                  variant="bordered"
                                  radius="md"
                                  placeholder={hasDiscrepancy ? "ระบุเหตุผล *" : ""}
                                  value={item.tmsDeliveryItemDamageNotes || ""}
                                  onChange={(e) => updateDeliveryItem(idx, "tmsDeliveryItemDamageNotes", e.target.value)}
                                  color={hasDiscrepancy && !item.tmsDeliveryItemDamageNotes ? "danger" : "default"}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-default-200 bg-default-50">
                          <td className="px-3 py-2 font-semibold" colSpan={2}>รวม</td>
                          <td className="text-center px-3 py-2 font-semibold">
                            {deliveryItems.reduce((s, i) => s + i.tmsDeliveryItemPlannedQty, 0)}
                          </td>
                          <td className="text-center px-3 py-2 font-semibold">
                            {deliveryItems.reduce((s, i) => s + (parseFloat(i.tmsDeliveryItemDeliveredQty) || 0), 0)}
                          </td>
                          <td className="text-center px-3 py-2 font-semibold">
                            {deliveryItems.reduce((s, i) => s + (parseFloat(i.tmsDeliveryItemDamagedQty) || 0), 0)}
                          </td>
                          <td className="text-center px-3 py-2 font-semibold">
                            {deliveryItems.reduce((s, i) => s + (parseFloat(i.tmsDeliveryItemReturnedQty) || 0), 0)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <Input
                label="หมายเหตุ"
                labelPlacement="outside"
                placeholder="หมายเหตุเพิ่มเติม"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.tmsDeliveryNotes}
                onChange={(e) =>
                  updateField("tmsDeliveryNotes", e.target.value)
                }
              />

              {/* Photos */}
              <FileUpload
                label="รูปภาพการจัดส่ง"
                accept="image/*"
                multiple={true}
                value={formData.tmsDeliveryPhotoUrls}
                onChange={(urls) => updateField("tmsDeliveryPhotoUrls", urls)}
                folder="delivery-photos"
              />
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
              บันทึก
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
                {deletingDelivery?.tmsDeliveryReceiverName}
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
