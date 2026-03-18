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
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "bcSalesOrderNoValue", sortable: true },
  { name: "วันที่สั่ง", uid: "bcSalesOrderOrderDate", sortable: true },
  { name: "ลูกค้า", uid: "bcSalesOrderSellToCustomerName", sortable: true },
  { name: "สถานะ", uid: "bcSalesOrderStatus", sortable: true },
  { name: "ยอดรวม (รวมภาษี)", uid: "bcSalesOrderAmountIncludingVAT", sortable: true },
  { name: "รายการ", uid: "lineCount" },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcSalesOrderNoValue",
  "bcSalesOrderOrderDate",
  "bcSalesOrderSellToCustomerName",
  "bcSalesOrderStatus",
  "bcSalesOrderAmountIncludingVAT",
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

export default function BcSalesOrdersView({
  salesOrders,
  loading,
  selectedOrder,
  isOpen,
  onClose,
  openLines,
}) {
  const renderCell = useCallback(
    (order, columnKey) => {
      switch (columnKey) {
        case "bcSalesOrderNoValue":
          return <span className="font-light">{order.bcSalesOrderNoValue}</span>;
        case "bcSalesOrderOrderDate":
          return order.bcSalesOrderOrderDate
            ? new Date(order.bcSalesOrderOrderDate).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
            : "-";
        case "bcSalesOrderSellToCustomerName":
          return order.bcSalesOrderSellToCustomerName || "-";
        case "bcSalesOrderStatus":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={statusColorMap[order.bcSalesOrderStatus] || "default"}
            >
              {statusLabelMap[order.bcSalesOrderStatus] || order.bcSalesOrderStatus || "-"}
            </Chip>
          );
        case "bcSalesOrderAmountIncludingVAT":
          return formatNumber(order.bcSalesOrderAmountIncludingVAT);
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
        rowKey="bcSalesOrderId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ลูกค้า..."
        searchKeys={["bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName", "bcSalesOrderStatus"]}
        emptyContent="ไม่พบใบสั่งขาย"
        actionMenuItems={(item) => [
          { key: "view", label: "ดูรายละเอียด", icon: <Eye />, onPress: () => openLines(item) },
        ]}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>รายการสินค้า — {selectedOrder?.bcSalesOrderNoValue}</ModalHeader>
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
                  <TableRow key={line.bcSalesOrderLineId || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-light">
                      {line.bcSalesOrderLineNoValue || "-"}
                    </TableCell>
                    <TableCell>{line.bcSalesOrderLineDescriptionValue || "-"}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      {line.bcSalesOrderLineQuantityValue != null
                        ? Number(line.bcSalesOrderLineQuantityValue).toLocaleString("th-TH")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {line.bcSalesOrderLineUnitPrice != null
                        ? Number(line.bcSalesOrderLineUnitPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {line.bcSalesOrderLineAmountValue != null
                        ? Number(line.bcSalesOrderLineAmountValue).toLocaleString(
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
            <Button variant="flat" size="md" radius="md" onPress={onClose}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
