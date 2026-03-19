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
  { name: "เลขที่", uid: "bcPostedPurchInvoiceNoValue", sortable: true },
  { name: "เลขที่ใบแจ้งหนี้ผู้ขาย", uid: "bcPostedPurchInvoiceVendorInvoiceNo", sortable: true },
  { name: "วันที่ออก", uid: "bcPostedPurchInvoicePostingDate", sortable: true },
  { name: "วันครบกำหนด", uid: "bcPostedPurchInvoiceDueDate", sortable: true },
  { name: "รหัสเจ้าหนี้", uid: "bcPostedPurchInvoiceBuyFromVendorNo", sortable: true },
  { name: "ชื่อเจ้าหนี้", uid: "bcPostedPurchInvoiceBuyFromVendorName", sortable: true },
  { name: "ผู้จัดซื้อ", uid: "bcPostedPurchInvoicePurchaserCode", sortable: true },
  { name: "ยอดรวม (รวม VAT)", uid: "bcPostedPurchInvoiceAmountIncludingVAT", sortable: true },
  { name: "ค้าง (วัน)", uid: "daysOverdue", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "รายการ", uid: "actions" },
];

const initialVisibleColumns = [
  "bcPostedPurchInvoiceNoValue",
  "bcPostedPurchInvoicePostingDate",
  "bcPostedPurchInvoiceDueDate",
  "bcPostedPurchInvoiceBuyFromVendorNo",
  "bcPostedPurchInvoiceBuyFromVendorName",
  "bcPostedPurchInvoiceAmountIncludingVAT",
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
      case "bcPostedPurchInvoiceNoValue":
        return <span className="font-mono font-light">{item.bcPostedPurchInvoiceNoValue}</span>;
      case "bcPostedPurchInvoiceVendorInvoiceNo":
        return <span className="text-muted-foreground">{item.bcPostedPurchInvoiceVendorInvoiceNo || "-"}</span>;
      case "bcPostedPurchInvoicePostingDate":
        return fmtDate(item.bcPostedPurchInvoicePostingDate);
      case "bcPostedPurchInvoiceDueDate": {
        const days = item.daysOverdue || 0;
        return (
          <span className={days > 0 ? "font-light text-danger" : ""}>
            {fmtDate(item.bcPostedPurchInvoiceDueDate)}
          </span>
        );
      }
      case "bcPostedPurchInvoiceBuyFromVendorNo":
        return <span className="font-mono">{item.bcPostedPurchInvoiceBuyFromVendorNo}</span>;
      case "bcPostedPurchInvoiceBuyFromVendorName":
        return <span className="font-light">{item.bcPostedPurchInvoiceBuyFromVendorName}</span>;
      case "bcPostedPurchInvoicePurchaserCode":
        return <span className="text-muted-foreground">{item.bcPostedPurchInvoicePurchaserCode || "-"}</span>;
      case "bcPostedPurchInvoiceAmountIncludingVAT":
        return <span>{fmt(item.bcPostedPurchInvoiceAmountIncludingVAT)}</span>;
      case "daysOverdue": {
        const days = item.daysOverdue || 0;
        if (item.status !== "Open") return <span className="text-muted-foreground">-</span>;
        return (
          <span className={`font-light ${daysColor(days)}`}>
            {days > 0 ? `${days} วัน` : "ยังไม่ถึง"}
          </span>
        );
      }
      case "status":
        return (
          <Chip size="md" variant="flat" color={statusColorMap[item.status] || "default"}>
            {statusLabelMap[item.status] || item.status}
          </Chip>
        );
      case "actions":
        return (
          <Button variant="flat" size="md" isIconOnly onPress={() => openLines(item)}>
            <Eye />
          </Button>
        );
      default:
        return item[key] || "-";
    }
  }, [openLines]);

  const lines = (selected?.purchaseInvoiceLines || []).filter(
    (l) => l.bcPostedPurchInvoiceLineTypeValue !== "Comment"
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาเลขที่ใบแจ้งหนี้, เจ้าหนี้..."
        searchKeys={["bcPostedPurchInvoiceNoValue", "bcPostedPurchInvoiceVendorInvoiceNo", "bcPostedPurchInvoiceBuyFromVendorNo", "bcPostedPurchInvoiceBuyFromVendorName", "bcPostedPurchInvoicePurchaserCode"]}
        defaultSortDescriptor={{ column: "bcPostedPurchInvoicePostingDate", direction: "descending" }}
        emptyContent="ไม่พบใบแจ้งหนี้ซื้อ"
        getRowClassName={(item) =>
          item.daysOverdue > 0 ? "bg-danger-50/50" : undefined
        }
        enableCardView
        actionMenuItems={(item) => [
          { key: "view", label: "ดูรายละเอียด", icon: <Eye />, onPress: () => openLines(item) },
        ]}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>รายการสินค้า — {selected?.bcPostedPurchInvoiceNoValue}</span>
            <span className="text-xs font-light text-muted-foreground">
              {selected?.bcPostedPurchInvoiceBuyFromVendorName} | {selected?.bcPostedPurchInvoiceVendorInvoiceNo ? `Ref: ${selected.bcPostedPurchInvoiceVendorInvoiceNo} | ` : ""}
              ยอดรวม {fmt(selected?.bcPostedPurchInvoiceAmountIncludingVAT)}
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
                      <Chip size="md" variant="flat" color={line.bcPostedPurchInvoiceLineTypeValue === "Item" ? "primary" : "default"}>
                        {line.bcPostedPurchInvoiceLineTypeValue}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-mono">{line.bcPostedPurchInvoiceLineNoValue || "-"}</TableCell>
                    <TableCell>{line.bcPostedPurchInvoiceLineDescriptionValue || "-"}</TableCell>
                    <TableCell>{line.bcPostedPurchInvoiceLineQuantityValue ? Number(line.bcPostedPurchInvoiceLineQuantityValue).toLocaleString("th-TH") : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{line.bcPostedPurchInvoiceLineUnitOfMeasureCode || "-"}</TableCell>
                    <TableCell>{fmt(line.bcPostedPurchInvoiceLineDirectUnitCost)}</TableCell>
                    <TableCell className="font-light">{fmt(line.bcPostedPurchInvoiceLineAmountIncludingVAT)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>ก่อน VAT: {fmt(selected?.bcPostedPurchInvoiceAmountValue)}</span>
              <span>VAT: {fmt(selected?.totalTaxAmount)}</span>
              <span className="font-light text-foreground">รวม: {fmt(selected?.bcPostedPurchInvoiceAmountIncludingVAT)}</span>
            </div>
            <Button variant="flat" size="md" onPress={onClose}>ปิด</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
