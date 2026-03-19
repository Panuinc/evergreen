"use client";

import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { Eye, Trash2, Edit } from "lucide-react";
import DataTable from "@/components/ui/dataTable";

const columns = [
  { name: "เลขที่คำสั่ง", uid: "crmOrderNo", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "ใบเสนอราคา", uid: "quotation" },
  { name: "สถานะ", uid: "crmOrderStatus" },
  { name: "ยอดรวม", uid: "crmOrderTotal" },
  { name: "เลขติดตาม", uid: "crmOrderTrackingNumber" },
  { name: "วันส่ง", uid: "crmOrderDeliveryDate" },
  { name: "สร้างเมื่อ", uid: "crmOrderCreatedAt" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "ยืนยันแล้ว", uid: "confirmed" },
  { name: "กำลังดำเนินการ", uid: "processing" },
  { name: "จัดส่งแล้ว", uid: "shipped" },
  { name: "ส่งถึงแล้ว", uid: "delivered" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const initialVisibleColumns = [
  "crmOrderNo",
  "contact",
  "crmOrderStatus",
  "crmOrderTotal",
  "crmOrderTrackingNumber",
  "crmOrderCreatedAt",
  "actions",
];

export default function OrdersView({
  orders,
  loading,
  saving,
  selectedOrder,
  detailModal,
  deletingOrder,
  deleteModal,
  handleStatusChange,
  handleViewDetail,
  confirmDelete,
  handleDelete,
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmOrderNo":
          return <span className="font-light">{item.crmOrderNo || "-"}</span>;
        case "contact":
          return item.crmContact
            ? `${item.crmContact.crmContactFirstName} ${item.crmContact.crmContactLastName}`
            : "-";
        case "account":
          return item.salesAccount?.crmAccountName || "-";
        case "quotation":
          return item.salesQuotation?.crmQuotationNo || "-";
        case "crmOrderStatus": {
          const colorMap = {
            pending: "default",
            confirmed: "primary",
            processing: "warning",
            shipped: "secondary",
            delivered: "success",
            cancelled: "danger",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.crmOrderStatus] || "default"}
            >
              {item.crmOrderStatus}
            </Chip>
          );
        }
        case "crmOrderTotal":
          return item.crmOrderTotal
            ? `฿${Number(item.crmOrderTotal).toLocaleString()}`
            : "-";
        case "crmOrderTrackingNumber":
          return (
            <span className="text-muted-foreground">
              {item.crmOrderTrackingNumber || "-"}
            </span>
          );
        case "crmOrderDeliveryDate":
          return item.crmOrderDeliveryDate || "-";
        case "crmOrderCreatedAt":
          return item.crmOrderCreatedAt
            ? new Date(item.crmOrderCreatedAt).toLocaleDateString()
            : "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleViewDetail(item)}
              >
                <Eye />
              </Button>
              <Select
                size="md"
                variant="bordered"
                radius="md"
                aria-label="Change status"
                selectedKeys={[item.crmOrderStatus]}
                className="w-32"
                onSelectionChange={(keys) => {
                  const newStatus = Array.from(keys)[0];
                  if (newStatus && newStatus !== item.crmOrderStatus) {
                    handleStatusChange(item, newStatus);
                  }
                }}
              >
                <SelectItem key="pending">รอดำเนินการ</SelectItem>
                <SelectItem key="confirmed">ยืนยันแล้ว</SelectItem>
                <SelectItem key="processing">กำลังดำเนินการ</SelectItem>
                <SelectItem key="shipped">จัดส่งแล้ว</SelectItem>
                <SelectItem key="delivered">ส่งถึงแล้ว</SelectItem>
                <SelectItem key="cancelled">ยกเลิก</SelectItem>
              </Select>
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
    [handleViewDetail, handleStatusChange, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={orders}
        renderCell={renderCell}
        enableCardView
        rowKey="crmOrderId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาคำสั่งซื้อ..."
        searchKeys={[
          "crmOrderNo",
          "crmOrderShippingAddress",
          "crmOrderTrackingNumber",
        ]}
        statusField="crmOrderStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบคำสั่งซื้อ"
        actionMenuItems={(item) => [
          { key: "view", label: "ดูรายละเอียด", icon: <Eye />, onPress: () => handleViewDetail(item) },
          { key: "status-pending", label: "สถานะ: รอดำเนินการ", icon: <Edit />, onPress: () => handleStatusChange(item, "pending") },
          { key: "status-confirmed", label: "สถานะ: ยืนยันแล้ว", icon: <Edit />, onPress: () => handleStatusChange(item, "confirmed") },
          { key: "status-processing", label: "สถานะ: กำลังดำเนินการ", icon: <Edit />, onPress: () => handleStatusChange(item, "processing") },
          { key: "status-shipped", label: "สถานะ: จัดส่งแล้ว", icon: <Edit />, onPress: () => handleStatusChange(item, "shipped") },
          { key: "status-delivered", label: "สถานะ: ส่งถึงแล้ว", icon: <Edit />, onPress: () => handleStatusChange(item, "delivered") },
          { key: "status-cancelled", label: "สถานะ: ยกเลิก", icon: <Edit />, onPress: () => handleStatusChange(item, "cancelled") },
          { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ]}
      />

      {}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>รายละเอียดคำสั่งซื้อ</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">เลขที่คำสั่ง</span>
                    <span className="font-light">
                      {selectedOrder.crmOrderNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">ผู้ติดต่อ</span>
                    <span className="font-light">
                      {selectedOrder.crmContact
                        ? `${selectedOrder.crmContact.crmContactFirstName} ${selectedOrder.crmContact.crmContactLastName}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">บัญชี</span>
                    <span className="font-light">
                      {selectedOrder.salesAccount?.crmAccountName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">ใบเสนอราคา</span>
                    <span className="font-light">
                      {selectedOrder.salesQuotation?.crmQuotationNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">สถานะ</span>
                    <div>
                      {(() => {
                        const colorMap = {
                          pending: "default",
                          confirmed: "primary",
                          processing: "warning",
                          shipped: "secondary",
                          delivered: "success",
                          cancelled: "danger",
                        };
                        return (
                          <Chip
                            variant="flat"
                            size="md"
                            radius="md"
                            color={
                              colorMap[selectedOrder.crmOrderStatus] || "default"
                            }
                          >
                            {selectedOrder.crmOrderStatus}
                          </Chip>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">ยอดรวม</span>
                    <span className="font-light">
                      {selectedOrder.crmOrderTotal
                        ? `฿${Number(selectedOrder.crmOrderTotal).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      ที่อยู่จัดส่ง
                    </span>
                    <span className="font-light">
                      {selectedOrder.crmOrderShippingAddress || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      เลขติดตาม
                    </span>
                    <span className="font-light">
                      {selectedOrder.crmOrderTrackingNumber || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      วันส่ง
                    </span>
                    <span className="font-light">
                      {selectedOrder.crmOrderDeliveryDate || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">สร้างเมื่อ</span>
                    <span className="font-light">
                      {selectedOrder.crmOrderCreatedAt
                        ? new Date(
                            selectedOrder.crmOrderCreatedAt,
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
                {selectedOrder.crmOrderNotes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">หมายเหตุ</span>
                    <span className="font-light">
                      {selectedOrder.crmOrderNotes}
                    </span>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={detailModal.onClose}
            >
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบคำสั่งซื้อ</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingOrder?.crmOrderNo}
              </span>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
    </div>
  );
}
