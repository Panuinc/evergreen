"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Chip, Tabs, Tab } from "@heroui/react";
import { useQuotations } from "@/hooks/useQuotations";
import DataTable from "@/components/ui/DataTable";

const STATUS_MAP = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
  paid: { label: "ชำระแล้ว", color: "primary" },
};

const columns = [
  { name: "เลขที่", uid: "quotationNumber", sortable: true },
  { name: "ลูกค้า", uid: "customerName", sortable: true },
  { name: "ช่องทาง", uid: "channelType", sortable: true },
  { name: "สถานะ", uid: "quotationStatus", sortable: true },
  { name: "วันที่สร้าง", uid: "quotationCreatedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "quotationNumber",
  "customerName",
  "channelType",
  "quotationStatus",
  "quotationCreatedAt",
];

export default function QuotationListPage() {
  const router = useRouter();
  const { quotations, loading, statusFilter, setStatusFilter } = useQuotations();

  const tableData = useMemo(
    () =>
      quotations.map((q) => ({
        ...q,
        customerName:
          q.quotationCustomerName ||
          q.omContacts?.contactDisplayName ||
          "-",
        channelType: q.omContacts?.contactChannelType || "-",
      })),
    [quotations]
  );

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "quotationNumber":
        return (
          <span
            className="text-primary cursor-pointer"
            onClick={() =>
              router.push(`/marketing/omnichannel/quotations/${item.quotationId}`)
            }
          >
            {item.quotationNumber}
          </span>
        );
      case "channelType":
        return (
          <Chip size="sm" variant="flat">
            {item.channelType}
          </Chip>
        );
      case "quotationStatus": {
        const s = STATUS_MAP[item.quotationStatus] || STATUS_MAP.draft;
        return (
          <Chip size="sm" variant="flat" color={s.color}>
            {s.label}
          </Chip>
        );
      }
      case "quotationCreatedAt":
        return new Date(item.quotationCreatedAt).toLocaleDateString("th-TH");
      default:
        return item[columnKey] || "-";
    }
  }, [router]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <h2 className="text-lg font-semibold">ใบเสนอราคา</h2>

      <Tabs
        selectedKey={statusFilter}
        onSelectionChange={setStatusFilter}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="all" title="ทั้งหมด" />
        <Tab key="draft" title="ร่าง" />
        <Tab key="pending_approval" title="รออนุมัติ" />
        <Tab key="approved" title="อนุมัติแล้ว" />
        <Tab key="paid" title="ชำระแล้ว" />
        <Tab key="rejected" title="ไม่อนุมัติ" />
      </Tabs>

      <DataTable
        columns={columns}
        data={tableData}
        renderCell={renderCell}
        rowKey="quotationId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อลูกค้า..."
        searchKeys={["quotationNumber", "customerName"]}
        emptyContent="ไม่มีใบเสนอราคา"
      />
    </div>
  );
}
