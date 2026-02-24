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
import { Eye, Trash2 } from "lucide-react";
import { useCrmOrders } from "@/hooks/sales/useCrmOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่คำสั่ง", uid: "orderNo", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "ใบเสนอราคา", uid: "quotation" },
  { name: "สถานะ", uid: "orderStatus" },
  { name: "ยอดรวม", uid: "orderTotal" },
  { name: "เลขติดตาม", uid: "orderTrackingNumber" },
  { name: "วันส่ง", uid: "orderDeliveryDate" },
  { name: "สร้างเมื่อ", uid: "orderCreatedAt" },
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

const INITIAL_VISIBLE_COLUMNS = [
  "orderNo",
  "contact",
  "orderStatus",
  "orderTotal",
  "orderTrackingNumber",
  "orderCreatedAt",
  "actions",
];

export default function OrdersPage() {
  const {
    orders,
    loading,
    saving,
    statusFilter,
    setStatusFilter,
    selectedOrder,
    detailModal,
    deletingOrder,
    deleteModal,
    handleStatusChange,
    handleViewDetail,
    confirmDelete,
    handleDelete,
    reload,
  } = useCrmOrders();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "orderNo":
          return <span className="font-medium">{item.orderNo || "-"}</span>;
        case "contact":
          return item.crmContacts
            ? `${item.crmContacts.contactFirstName} ${item.crmContacts.contactLastName}`
            : "-";
        case "account":
          return item.crmAccounts?.accountName || "-";
        case "quotation":
          return item.crmQuotations?.quotationNo || "-";
        case "orderStatus": {
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
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.orderStatus] || "default"}
            >
              {item.orderStatus}
            </Chip>
          );
        }
        case "orderTotal":
          return item.orderTotal
            ? `฿${Number(item.orderTotal).toLocaleString()}`
            : "-";
        case "orderTrackingNumber":
          return (
            <span className="text-default-500">
              {item.orderTrackingNumber || "-"}
            </span>
          );
        case "orderDeliveryDate":
          return item.orderDeliveryDate || "-";
        case "orderCreatedAt":
          return item.orderCreatedAt
            ? new Date(item.orderCreatedAt).toLocaleDateString()
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
                selectedKeys={[item.orderStatus]}
                className="w-32"
                onSelectionChange={(keys) => {
                  const newStatus = Array.from(keys)[0];
                  if (newStatus && newStatus !== item.orderStatus) {
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
        rowKey="orderId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาคำสั่งซื้อ..."
        searchKeys={[
          "orderNo",
          "orderShippingAddress",
          "orderTrackingNumber",
        ]}
        statusField="orderStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบคำสั่งซื้อ"
      />

      {/* Detail Modal */}
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
                    <span className="text-sm text-default-500">เลขที่คำสั่ง</span>
                    <span className="font-medium">
                      {selectedOrder.orderNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">ผู้ติดต่อ</span>
                    <span className="font-medium">
                      {selectedOrder.crmContacts
                        ? `${selectedOrder.crmContacts.contactFirstName} ${selectedOrder.crmContacts.contactLastName}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">บัญชี</span>
                    <span className="font-medium">
                      {selectedOrder.crmAccounts?.accountName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">ใบเสนอราคา</span>
                    <span className="font-medium">
                      {selectedOrder.crmQuotations?.quotationNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">สถานะ</span>
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
                            variant="bordered"
                            size="md"
                            radius="md"
                            color={
                              colorMap[selectedOrder.orderStatus] || "default"
                            }
                          >
                            {selectedOrder.orderStatus}
                          </Chip>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">ยอดรวม</span>
                    <span className="font-medium">
                      {selectedOrder.orderTotal
                        ? `฿${Number(selectedOrder.orderTotal).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      ที่อยู่จัดส่ง
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderShippingAddress || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      เลขติดตาม
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderTrackingNumber || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      วันส่ง
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderDeliveryDate || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">สร้างเมื่อ</span>
                    <span className="font-medium">
                      {selectedOrder.orderCreatedAt
                        ? new Date(
                            selectedOrder.orderCreatedAt,
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
                {selectedOrder.orderNotes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">หมายเหตุ</span>
                    <span className="font-medium">
                      {selectedOrder.orderNotes}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบคำสั่งซื้อ</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingOrder?.orderNo}
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
