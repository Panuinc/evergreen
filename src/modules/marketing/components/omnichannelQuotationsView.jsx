import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";

const statusMap = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
  paid: { label: "ชำระแล้ว", color: "primary" },
};

const baseColumns = [
  { name: "เลขที่", uid: "mktQuotationNumber", sortable: true },
  { name: "ลูกค้า", uid: "customerName", sortable: true },
  { name: "ช่องทาง", uid: "channelType", sortable: true },
  { name: "สถานะ", uid: "mktQuotationStatus", sortable: true },
  { name: "วันที่สร้าง", uid: "mktQuotationCreatedAt", sortable: true },
];

const initialVisibleColumns = [
  "mktQuotationNumber",
  "customerName",
  "channelType",
  "mktQuotationStatus",
  "mktQuotationCreatedAt",
];

export default function OmnichannelQuotationsView({
  quotations,
  loading,
  statusFilter,
  setStatusFilter,
  onNavigateToQuotation,
}) {
  const { isSuperAdmin } = useRBAC();

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...baseColumns,
        { name: "สถานะใช้งาน", uid: "isActive" },
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const tableData = useMemo(
    () =>
      quotations.map((q) => ({
        ...q,
        customerName:
          q.mktQuotationCustomerName ||
          q.mktContact?.mktContactDisplayName ||
          "-",
        channelType: q.mktContact?.mktContactChannelType || "-",
      })),
    [quotations]
  );

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "mktQuotationNumber":
        return (
          <span
            className="text-primary cursor-pointer"
            onClick={() => onNavigateToQuotation(item.mktQuotationId)}
          >
            {item.mktQuotationNumber}
          </span>
        );
      case "channelType":
        return (
          <Chip variant="flat" size="md" radius="md">
            {item.channelType}
          </Chip>
        );
      case "mktQuotationStatus": {
        const s = statusMap[item.mktQuotationStatus] || statusMap.draft;
        return (
          <Chip variant="flat" size="md" radius="md" color={s.color}>
            {s.label}
          </Chip>
        );
      }
      case "mktQuotationCreatedAt":
        return new Date(item.mktQuotationCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" });
      case "isActive":
        return (
          <Chip
            variant="flat"
            size="md"
            radius="md"
            color={item.isActive ? "success" : "danger"}
          >
            {item.isActive ? "Active" : "Inactive"}
          </Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, [onNavigateToQuotation]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">ใบเสนอราคา</p>

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
        rowKey="mktQuotationId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อลูกค้า..."
        searchKeys={["mktQuotationNumber", "customerName"]}
        emptyContent="ไม่มีใบเสนอราคา"
        enableCardView
      />
    </div>
  );
}
