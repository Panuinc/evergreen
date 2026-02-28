import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";

const STATUS_MAP = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
  paid: { label: "ชำระแล้ว", color: "primary" },
};

const COLUMNS = [
  { name: "เลขที่", uid: "omQuotationNumber", sortable: true },
  { name: "ลูกค้า", uid: "customerName", sortable: true },
  { name: "ช่องทาง", uid: "channelType", sortable: true },
  { name: "สถานะ", uid: "omQuotationStatus", sortable: true },
  { name: "วันที่สร้าง", uid: "omQuotationCreatedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "omQuotationNumber",
  "customerName",
  "channelType",
  "omQuotationStatus",
  "omQuotationCreatedAt",
];

export default function OmnichannelQuotationsView({
  quotations,
  loading,
  statusFilter,
  setStatusFilter,
  onNavigateToQuotation,
}) {
  const tableData = useMemo(
    () =>
      quotations.map((q) => ({
        ...q,
        customerName:
          q.omQuotationCustomerName ||
          q.omContact?.omContactDisplayName ||
          "-",
        channelType: q.omContact?.omContactChannelType || "-",
      })),
    [quotations]
  );

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "omQuotationNumber":
        return (
          <span
            className="text-primary cursor-pointer"
            onClick={() => onNavigateToQuotation(item.omQuotationId)}
          >
            {item.omQuotationNumber}
          </span>
        );
      case "channelType":
        return (
          <Chip variant="bordered" size="md" radius="md">
            {item.channelType}
          </Chip>
        );
      case "omQuotationStatus": {
        const s = STATUS_MAP[item.omQuotationStatus] || STATUS_MAP.draft;
        return (
          <Chip variant="bordered" size="md" radius="md" color={s.color}>
            {s.label}
          </Chip>
        );
      }
      case "omQuotationCreatedAt":
        return new Date(item.omQuotationCreatedAt).toLocaleDateString("th-TH");
      default:
        return item[columnKey] || "-";
    }
  }, [onNavigateToQuotation]);

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
        columns={COLUMNS}
        data={tableData}
        renderCell={renderCell}
        rowKey="omQuotationId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อลูกค้า..."
        searchKeys={["omQuotationNumber", "customerName"]}
        emptyContent="ไม่มีใบเสนอราคา"
      />
    </div>
  );
}
