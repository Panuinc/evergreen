"use client";

import { useCallback } from "react";
import {
  Chip,
  Button,
  Card,
  CardBody,
  CardFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Eye } from "lucide-react";
import { useBcSalesOrders } from "@/hooks/useBcSalesOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Order Date", uid: "orderDate", sortable: true },
  { name: "Customer", uid: "customerName", sortable: true },
  { name: "Status", uid: "status", sortable: true },
  { name: "Currency", uid: "currencyCode", sortable: true },
  { name: "Total (incl. Tax)", uid: "totalAmountIncludingTax", sortable: true },
  { name: "Lines", uid: "lineCount" },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "orderDate",
  "customerName",
  "status",
  "totalAmountIncludingTax",
  "lineCount",
  "actions",
];

const statusColorMap = {
  Draft: "default",
  Open: "primary",
  Released: "success",
  "Pending Approval": "warning",
  "Pending Prepayment": "warning",
};

function formatNumber(value) {
  return value != null
    ? Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 })
    : "-";
}

export default function BcSalesOrdersPage() {
  const { salesOrders, loading, selectedOrder, isOpen, onClose, openLines } =
    useBcSalesOrders();

  const renderCell = useCallback(
    (order, columnKey) => {
      switch (columnKey) {
        case "number":
          return <span className="font-medium">{order.number}</span>;
        case "orderDate":
          return order.orderDate
            ? new Date(order.orderDate).toLocaleDateString("th-TH")
            : "-";
        case "customerName":
          return order.customerName || "-";
        case "status":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={statusColorMap[order.status] || "default"}
            >
              {order.status || "-"}
            </Chip>
          );
        case "currencyCode":
          return order.currencyCode || "THB";
        case "totalAmountIncludingTax":
          return formatNumber(order.totalAmountIncludingTax);
        case "lineCount":
          return order.salesOrderLines?.length ?? "-";
        case "actions":
          return (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              isIconOnly
              onPress={() => openLines(order)}
            >
              <Eye />
            </Button>
          );
        default:
          return order[columnKey] || "-";
      }
    },
    [openLines],
  );

  const renderCard = useCallback(
    (order) => (
      <Card key={order.id} variant="bordered" radius="md" shadow="none">
        <CardBody className="gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{order.number}</span>
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={statusColorMap[order.status] || "default"}
            >
              {order.status || "-"}
            </Chip>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-default-400">Customer</span>
              <span>{order.customerName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Order Date</span>
              <span>
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString("th-TH")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Currency</span>
              <span>{order.currencyCode || "THB"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Total (incl. Tax)</span>
              <span className="font-semibold">
                {formatNumber(order.totalAmountIncludingTax)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-400">Lines</span>
              <span>{order.salesOrderLines?.length ?? "-"}</span>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            className="w-full"
            startContent={<Eye size={16} />}
            onPress={() => openLines(order)}
          >
            View Lines
          </Button>
        </CardFooter>
      </Card>
    ),
    [openLines],
  );

  const lines = selectedOrder?.salesOrderLines || [];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={salesOrders}
        renderCell={renderCell}
        renderCard={renderCard}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by number, customer..."
        searchKeys={["number", "customerName", "status"]}
        emptyContent="No sales orders found"
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Order Lines — {selectedOrder?.number}</ModalHeader>
          <ModalBody>
            <Table aria-label="Sales order lines" shadow="none">
              <TableHeader>
                <TableColumn>No.</TableColumn>
                <TableColumn>Item No.</TableColumn>
                <TableColumn>Description</TableColumn>
                <TableColumn>Quantity</TableColumn>
                <TableColumn>Unit Price</TableColumn>
                <TableColumn>Line Amount</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No lines">
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {line.lineObjectNumber || "-"}
                    </TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>
                      {line.quantity != null
                        ? Number(line.quantity).toLocaleString("th-TH")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {line.unitPrice != null
                        ? Number(line.unitPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {line.amountIncludingTax != null
                        ? Number(line.amountIncludingTax).toLocaleString(
                            "th-TH",
                            { minimumFractionDigits: 2 },
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
