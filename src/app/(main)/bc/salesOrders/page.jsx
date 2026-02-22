"use client";

import { useCallback } from "react";
import {
  Chip,
  Button,
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
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "วันที่สั่ง", uid: "orderDate", sortable: true },
  { name: "ลูกค้า", uid: "customerName", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "สกุลเงิน", uid: "currencyCode", sortable: true },
  { name: "ยอดรวม (รวมภาษี)", uid: "totalAmountIncludingTax", sortable: true },
  { name: "รายการ", uid: "lineCount" },
  { name: "การดำเนินการ", uid: "actions" },
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

const statusLabelMap = {
  Draft: "ร่าง",
  Open: "เปิด",
  Released: "ปล่อยแล้ว",
  "Pending Approval": "รออนุมัติ",
  "Pending Prepayment": "รอชำระล่วงหน้า",
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
              {statusLabelMap[order.status] || order.status || "-"}
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

  const lines = selectedOrder?.salesOrderLines || [];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={salesOrders}
        renderCell={renderCell}
        enableCardView
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ลูกค้า..."
        searchKeys={["number", "customerName", "status"]}
        emptyContent="ไม่พบใบสั่งขาย"
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>รายการสินค้า — {selectedOrder?.number}</ModalHeader>
          <ModalBody>
            <Table aria-label="รายการสินค้าในใบสั่งขาย" shadow="none">
              <TableHeader>
                <TableColumn>ลำดับ</TableColumn>
                <TableColumn>เลขที่สินค้า</TableColumn>
                <TableColumn>รายละเอียด</TableColumn>
                <TableColumn>โครงการ</TableColumn>
                <TableColumn>จำนวน</TableColumn>
                <TableColumn>ราคาต่อหน่วย</TableColumn>
                <TableColumn>ยอดรวมรายการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่มีรายการ">
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {line.lineObjectNumber || "-"}
                    </TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>
                      {line.projectName ? (
                        <Chip variant="flat" size="sm" color="secondary">
                          {line.projectName}
                        </Chip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
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
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
