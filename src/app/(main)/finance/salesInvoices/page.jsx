"use client";

import { useCallback, useState, useEffect } from "react";
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
  useDisclosure,
} from "@heroui/react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { getSalesInvoices } from "@/actions/finance";
import DataTable from "@/components/ui/DataTable";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d || d === "0001-01-01") return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function calcDaysOverdue(dueDate) {
  if (!dueDate || dueDate === "0001-01-01") return 0;
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return Math.max(0, diff);
}

function daysColor(days) {
  if (days <= 0) return "text-success";
  if (days <= 30) return "text-warning";
  if (days <= 60) return "text-orange-500";
  return "text-danger";
}

const columns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "วันที่ออก", uid: "invoiceDate", sortable: true },
  { name: "วันครบกำหนด", uid: "dueDate", sortable: true },
  { name: "รหัสลูกค้า", uid: "customerNumber", sortable: true },
  { name: "ชื่อลูกค้า", uid: "customerName", sortable: true },
  { name: "พนักงานขาย", uid: "salesperson", sortable: true },
  { name: "ยอดรวม (รวม VAT)", uid: "totalAmountIncludingTax", sortable: true },
  { name: "ยอดค้างชำระ", uid: "remainingAmount", sortable: true },
  { name: "ค้าง (วัน)", uid: "daysOverdue", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "รายการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "invoiceDate",
  "dueDate",
  "customerNumber",
  "customerName",
  "totalAmountIncludingTax",
  "remainingAmount",
  "daysOverdue",
  "status",
  "actions",
];

const statusColorMap = {
  Open: "warning",
  Paid: "success",
  Draft: "default",
  Canceled: "danger",
  Corrective: "secondary",
};

const statusLabelMap = {
  Open: "ค้างชำระ",
  Paid: "ชำระแล้ว",
  Draft: "ร่าง",
  Canceled: "ยกเลิก",
  Corrective: "แก้ไข",
};

export default function SalesInvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    getSalesInvoices("Open")
      .then((rows) =>
        setData(rows.map((r) => ({ ...r, daysOverdue: r.status === "Open" ? calcDaysOverdue(r.dueDate) : 0 })))
      )
      .catch(() => toast.error("โหลดใบแจ้งหนี้ขายล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  const openLines = useCallback((inv) => {
    setSelected(inv);
    onOpen();
  }, [onOpen]);

  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "number":
        return <span className="font-mono font-medium">{item.number}</span>;
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
      case "customerNumber":
        return <span className="font-mono">{item.customerNumber}</span>;
      case "customerName":
        return <span className="font-medium">{item.customerName}</span>;
      case "salesperson":
        return <span className="text-default-500">{item.salesperson || "-"}</span>;
      case "totalAmountIncludingTax":
        return <span>{fmt(item.totalAmountIncludingTax)}</span>;
      case "remainingAmount": {
        const v = item.remainingAmount || 0;
        return <span className={v > 0 ? "font-semibold text-warning" : "text-success"}>{fmt(v)}</span>;
      }
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

  const lines = (selected?.salesInvoiceLines || []).filter((l) => l.lineType !== "Comment");

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาเลขที่ใบแจ้งหนี้, ลูกค้า..."
        searchKeys={["number", "customerNumber", "customerName", "salesperson"]}
        defaultSortDescriptor={{ column: "invoiceDate", direction: "descending" }}
        emptyContent="ไม่พบใบแจ้งหนี้ขาย"
        getRowClassName={(item) =>
          item.daysOverdue > 0 ? "bg-danger-50/50" : undefined
        }
      />

      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>รายการสินค้า — {selected?.number}</span>
            <span className="text-sm font-normal text-default-500">
              {selected?.customerName} | ยอดรวม {fmt(selected?.totalAmountIncludingTax)} | ค้างชำระ {fmt(selected?.remainingAmount)}
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
                    <TableCell>{fmt(line.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{fmt(line.amountIncludingTax)}</TableCell>
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
