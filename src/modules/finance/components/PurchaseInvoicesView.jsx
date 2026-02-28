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

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d || d === "0001-01-01") return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function daysColor(days) {
  if (days <= 0) return "text-success";
  if (days <= 30) return "text-warning";
  if (days <= 60) return "text-orange-500";
  return "text-danger";
}

const columns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "เลขที่ใบแจ้งหนี้ผู้ขาย", uid: "vendorInvoiceNumber", sortable: true },
  { name: "วันที่ออก", uid: "invoiceDate", sortable: true },
  { name: "วันครบกำหนด", uid: "dueDate", sortable: true },
  { name: "รหัสเจ้าหนี้", uid: "vendorNumber", sortable: true },
  { name: "ชื่อเจ้าหนี้", uid: "vendorName", sortable: true },
  { name: "ผู้จัดซื้อ", uid: "purchaser", sortable: true },
  { name: "ยอดรวม (รวม VAT)", uid: "totalAmountIncludingTax", sortable: true },
  { name: "ค้าง (วัน)", uid: "daysOverdue", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "รายการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "invoiceDate",
  "dueDate",
  "vendorNumber",
  "vendorName",
  "totalAmountIncludingTax",
  "daysOverdue",
  "status",
  "actions",
];

const statusColorMap = {
  Open: "warning",
  Paid: "success",
  Draft: "default",
  Canceled: "danger",
};

const statusLabelMap = {
  Open: "ค้างชำระ",
  Paid: "ชำระแล้ว",
  Draft: "ร่าง",
  Canceled: "ยกเลิก",
};

export default function PurchaseInvoicesView({ data, loading, selected, isOpen, onClose, openLines }) {
  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "number":
        return <span className="font-mono font-medium">{item.number}</span>;
      case "vendorInvoiceNumber":
        return <span className="text-default-500">{item.vendorInvoiceNumber || "-"}</span>;
      case "invoiceDate":
        return fmtDate(item.invoiceDate);
      case "dueDate": {
        const days = item.daysOverdue || 0;
        return (
          <span className={days > 0 ? "font-medium text-danger" : ""}>
            {fmtDate(item.dueDate)}
          </span>
        );
      }
      case "vendorNumber":
        return <span className="font-mono">{item.vendorNumber}</span>;
      case "vendorName":
        return <span className="font-medium">{item.vendorName}</span>;
      case "purchaser":
        return <span className="text-default-500">{item.purchaser || "-"}</span>;
      case "totalAmountIncludingTax":
        return <span>{fmt(item.totalAmountIncludingTax)}</span>;
      case "daysOverdue": {
        const days = item.daysOverdue || 0;
        if (item.status !== "Open") return <span className="text-default-400">-</span>;
        return (
          <span className={`font-semibold ${daysColor(days)}`}>
            {days > 0 ? `${days} วัน` : "ยังไม่ถึง"}
          </span>
        );
      }
      case "status":
        return (
          <Chip size="sm" variant="flat" color={statusColorMap[item.status] || "default"}>
            {statusLabelMap[item.status] || item.status}
          </Chip>
        );
      case "actions":
        return (
          <Button variant="bordered" size="sm" isIconOnly onPress={() => openLines(item)}>
            <Eye size={16} />
          </Button>
        );
      default:
        return item[key] || "-";
    }
  }, [openLines]);

  const lines = (selected?.purchaseInvoiceLines || []).filter((l) => l.lineType !== "Comment");

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาเลขที่ใบแจ้งหนี้, เจ้าหนี้..."
        searchKeys={["number", "vendorInvoiceNumber", "vendorNumber", "vendorName", "purchaser"]}
        defaultSortDescriptor={{ column: "invoiceDate", direction: "descending" }}
        emptyContent="ไม่พบใบแจ้งหนี้ซื้อ"
        getRowClassName={(item) =>
          item.daysOverdue > 0 ? "bg-danger-50/50" : undefined
        }
      />

      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>รายการสินค้า — {selected?.number}</span>
            <span className="text-sm font-normal text-default-500">
              {selected?.vendorName} | {selected?.vendorInvoiceNumber ? `Ref: ${selected.vendorInvoiceNumber} | ` : ""}
              ยอดรวม {fmt(selected?.totalAmountIncludingTax)}
            </span>
          </ModalHeader>
          <ModalBody>
            <Table aria-label="รายการในใบแจ้งหนี้ซื้อ" shadow="none">
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
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color={line.lineType === "Item" ? "primary" : "default"}>
                        {line.lineType}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-mono">{line.lineObjectNumber || "-"}</TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>{line.quantity ? Number(line.quantity).toLocaleString("th-TH") : "-"}</TableCell>
                    <TableCell className="text-default-500">{line.unitOfMeasureCode || "-"}</TableCell>
                    <TableCell>{fmt(line.unitCost)}</TableCell>
                    <TableCell className="font-medium">{fmt(line.netAmountIncludingTax)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-4 text-sm text-default-500">
              <span>ก่อน VAT: {fmt(selected?.totalAmountExcludingTax)}</span>
              <span>VAT: {fmt(selected?.totalTaxAmount)}</span>
              <span className="font-semibold text-foreground">รวม: {fmt(selected?.totalAmountIncludingTax)}</span>
            </div>
            <Button variant="bordered" size="md" onPress={onClose}>ปิด</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
