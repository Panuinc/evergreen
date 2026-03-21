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
import DataTable from "@/components/ui/dataTable";
import type { SalesInvoice, SalesInvoicesViewProps } from "@/modules/finance/types";

function fmt(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined) {
  if (!d || d === "0001-01-01") return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function daysColor(days: number) {
  if (days <= 0) return "text-success";
  if (days <= 30) return "text-warning";
  if (days <= 60) return "text-orange-500";
  return "text-danger";
}

const columns = [
  { name: "เลขที่", uid: "bcPostedSalesInvoiceNoValue", sortable: true },
  { name: "วันที่ออก", uid: "bcPostedSalesInvoicePostingDate", sortable: true },
  { name: "วันครบกำหนด", uid: "bcPostedSalesInvoiceDueDate", sortable: true },
  { name: "รหัสลูกค้า", uid: "bcPostedSalesInvoiceSellToCustomerNo", sortable: true },
  { name: "ชื่อลูกค้า", uid: "bcPostedSalesInvoiceSellToCustomerName", sortable: true },
  { name: "พนักงานขาย", uid: "bcPostedSalesInvoiceSalespersonCode", sortable: true },
  { name: "ยอดรวม (รวม VAT)", uid: "bcPostedSalesInvoiceAmountIncludingVAT", sortable: true },
  { name: "ยอดค้างชำระ", uid: "bcPostedSalesInvoiceRemainingAmount", sortable: true },
  { name: "ค้าง (วัน)", uid: "daysOverdue", sortable: true },
  { name: "สถานะ", uid: "bcPostedSalesInvoiceStatus", sortable: true },
  { name: "รายการ", uid: "actions" },
];

const initialVisibleColumns = [
  "bcPostedSalesInvoiceNoValue",
  "bcPostedSalesInvoicePostingDate",
  "bcPostedSalesInvoiceDueDate",
  "bcPostedSalesInvoiceSellToCustomerNo",
  "bcPostedSalesInvoiceSellToCustomerName",
  "bcPostedSalesInvoiceAmountIncludingVAT",
  "bcPostedSalesInvoiceRemainingAmount",
  "daysOverdue",
  "bcPostedSalesInvoiceStatus",
  "actions",
];

const statusColorMap: Record<string, "warning" | "success" | "default" | "danger" | "secondary"> = {
  Open: "warning",
  Paid: "success",
  Draft: "default",
  Canceled: "danger",
  Corrective: "secondary",
};

const statusLabelMap: Record<string, string> = {
  Open: "ค้างชำระ",
  Paid: "ชำระแล้ว",
  Draft: "ร่าง",
  Canceled: "ยกเลิก",
  Corrective: "แก้ไข",
};

export default function SalesInvoicesView({ data, loading, selected, isOpen, onClose, openLines }: SalesInvoicesViewProps) {
  const renderCell = useCallback((item: SalesInvoice, key: string) => {
    switch (key) {
      case "bcPostedSalesInvoiceNoValue":
        return <span className="font-mono font-light">{item.bcPostedSalesInvoiceNoValue}</span>;
      case "bcPostedSalesInvoicePostingDate":
        return fmtDate(item.bcPostedSalesInvoicePostingDate);
      case "bcPostedSalesInvoiceDueDate": {
        const days = item.daysOverdue || 0;
        return (
          <span className={days > 0 ? "font-light text-danger" : ""}>
            {fmtDate(item.bcPostedSalesInvoiceDueDate)}
          </span>
        );
      }
      case "bcPostedSalesInvoiceSellToCustomerNo":
        return <span className="font-mono">{item.bcPostedSalesInvoiceSellToCustomerNo}</span>;
      case "bcPostedSalesInvoiceSellToCustomerName":
        return <span className="font-light">{item.bcPostedSalesInvoiceSellToCustomerName}</span>;
      case "bcPostedSalesInvoiceSalespersonCode":
        return <span className="text-muted-foreground">{item.bcPostedSalesInvoiceSalespersonCode || "-"}</span>;
      case "bcPostedSalesInvoiceAmountIncludingVAT":
        return <span>{fmt(item.bcPostedSalesInvoiceAmountIncludingVAT)}</span>;
      case "bcPostedSalesInvoiceRemainingAmount": {
        const v = item.bcPostedSalesInvoiceRemainingAmount || 0;
        return <span className={v > 0 ? "font-light text-warning" : "text-success"}>{fmt(v)}</span>;
      }
      case "daysOverdue": {
        const days = item.daysOverdue || 0;
        if (item.bcPostedSalesInvoiceStatus !== "Open") return <span className="text-muted-foreground">-</span>;
        return (
          <span className={`font-light ${daysColor(days)}`}>
            {days > 0 ? `${days} วัน` : "ยังไม่ถึง"}
          </span>
        );
      }
      case "bcPostedSalesInvoiceStatus":
        return (
          <Chip size="md" variant="flat" color={statusColorMap[item.bcPostedSalesInvoiceStatus] || "default"}>
            {statusLabelMap[item.bcPostedSalesInvoiceStatus] || item.bcPostedSalesInvoiceStatus}
          </Chip>
        );
      case "actions":
        return (
          <Button variant="flat" size="md" isIconOnly onPress={() => openLines(item)}>
            <Eye />
          </Button>
        );
      default:
        return (item as unknown as Record<string, unknown>)[key]?.toString() || "-";
    }
  }, [openLines]);

  const lines = (selected?.lines || []).filter(
    (l) => l.type !== "Comment"
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="bcPostedSalesInvoiceId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาเลขที่ใบแจ้งหนี้, ลูกค้า..."
        searchKeys={["bcPostedSalesInvoiceNoValue", "bcPostedSalesInvoiceSellToCustomerNo", "bcPostedSalesInvoiceSellToCustomerName", "bcPostedSalesInvoiceSalespersonCode"]}
        defaultSortDescriptor={{ column: "bcPostedSalesInvoicePostingDate", direction: "descending" }}
        emptyContent="ไม่พบใบแจ้งหนี้ขาย"
        getRowClassName={(item: SalesInvoice) =>
          item.daysOverdue > 0 ? "bg-danger-50/50" : undefined
        }
        enableCardView
        actionMenuItems={(item: SalesInvoice) => [
          { key: "view", label: "ดูรายละเอียด", icon: <Eye />, onPress: () => openLines(item) },
        ]}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>รายการสินค้า — {selected?.bcPostedSalesInvoiceNoValue}</span>
            <span className="text-xs font-light text-muted-foreground">
              {selected?.bcPostedSalesInvoiceSellToCustomerName} | ยอดรวม {fmt(selected?.bcPostedSalesInvoiceAmountIncludingVAT)} | ค้างชำระ {fmt(selected?.bcPostedSalesInvoiceRemainingAmount)}
            </span>
          </ModalHeader>
          <ModalBody>
            <Table aria-label="รายการในใบแจ้งหนี้ขาย" shadow="none">
              <TableHeader>
                <TableColumn>ลำดับ</TableColumn>
                <TableColumn>ประเภท</TableColumn>
                <TableColumn>รหัสสินค้า</TableColumn>
                <TableColumn>รายละเอียด</TableColumn>
                <TableColumn>จำนวน</TableColumn>
                <TableColumn>หน่วย</TableColumn>
                <TableColumn>ราคา/หน่วย</TableColumn>
                <TableColumn>ยอดรวม</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่มีรายการ">
                {lines.map((line, idx) => (
                  <TableRow key={line.lineNo ?? idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Chip size="md" variant="flat" color={line.type === "Item" ? "primary" : "default"}>
                        {line.type}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-mono">{line.itemNo || "-"}</TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>{line.quantity ? Number(line.quantity).toLocaleString("th-TH") : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{line.unitOfMeasure || "-"}</TableCell>
                    <TableCell>{fmt(line.unitPrice)}</TableCell>
                    <TableCell className="font-light">{fmt(line.amountIncludingTax)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>ก่อน VAT: {fmt(selected?.bcPostedSalesInvoiceAmountValue)}</span>
              <span>VAT: {fmt(selected?.totalTaxAmount)}</span>
              <span className="font-light text-foreground">รวม: {fmt(selected?.bcPostedSalesInvoiceAmountIncludingVAT)}</span>
            </div>
            <Button variant="flat" size="md" onPress={onClose}>ปิด</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
