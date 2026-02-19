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
import { useCrmOrders } from "@/hooks/useCrmOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Order No.", uid: "orderNo", sortable: true },
  { name: "Contact", uid: "contact" },
  { name: "Account", uid: "account" },
  { name: "Quotation", uid: "quotation" },
  { name: "Status", uid: "orderStatus" },
  { name: "Total", uid: "orderTotal" },
  { name: "Tracking No.", uid: "orderTrackingNumber" },
  { name: "Delivery Date", uid: "orderDeliveryDate" },
  { name: "Created At", uid: "orderCreatedAt" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "pending" },
  { name: "Confirmed", uid: "confirmed" },
  { name: "Processing", uid: "processing" },
  { name: "Shipped", uid: "shipped" },
  { name: "Delivered", uid: "delivered" },
  { name: "Cancelled", uid: "cancelled" },
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
                size="sm"
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
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="confirmed">Confirmed</SelectItem>
                <SelectItem key="processing">Processing</SelectItem>
                <SelectItem key="shipped">Shipped</SelectItem>
                <SelectItem key="delivered">Delivered</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
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
        searchPlaceholder="Search orders..."
        searchKeys={[
          "orderNo",
          "orderShippingAddress",
          "orderTrackingNumber",
        ]}
        statusField="orderStatus"
        statusOptions={statusOptions}
        emptyContent="No orders found"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Order Details</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Order No.</span>
                    <span className="font-medium">
                      {selectedOrder.orderNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Contact</span>
                    <span className="font-medium">
                      {selectedOrder.crmContacts
                        ? `${selectedOrder.crmContacts.contactFirstName} ${selectedOrder.crmContacts.contactLastName}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Account</span>
                    <span className="font-medium">
                      {selectedOrder.crmAccounts?.accountName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Quotation</span>
                    <span className="font-medium">
                      {selectedOrder.crmQuotations?.quotationNo || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Status</span>
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
                    <span className="text-sm text-default-500">Total</span>
                    <span className="font-medium">
                      {selectedOrder.orderTotal
                        ? `฿${Number(selectedOrder.orderTotal).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      Shipping Address
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderShippingAddress || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      Tracking Number
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderTrackingNumber || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">
                      Delivery Date
                    </span>
                    <span className="font-medium">
                      {selectedOrder.orderDeliveryDate || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-500">Created At</span>
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
                    <span className="text-sm text-default-500">Notes</span>
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
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Order</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingOrder?.orderNo}
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
