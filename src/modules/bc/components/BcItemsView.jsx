"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "bcItemNumber", sortable: true },
  { name: "ชื่อสินค้า", uid: "bcItemDisplayName", sortable: true },
  { name: "โครงการ", uid: "bcItemProjectName", sortable: true },
  { name: "ประเภท", uid: "bcItemType", sortable: true },
  { name: "คงคลัง", uid: "bcItemInventory", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "bcItemUnitPrice", sortable: true },
  { name: "ต้นทุนต่อหน่วย", uid: "bcItemUnitCost", sortable: true },
  { name: "หมวดหมู่", uid: "bcItemCategoryCode", sortable: true },
  {
    name: "กลุ่มการลงบัญชี",
    uid: "bcItemGeneralProductPostingGroupCode",
    sortable: true,
  },
  { name: "ถูกบล็อก", uid: "bcItemBlocked", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcItemNumber",
  "bcItemDisplayName",
  "bcItemProjectName",
  "bcItemType",
  "bcItemInventory",
  "bcItemUnitPrice",
  "bcItemUnitCost",
  "bcItemCategoryCode",
  "bcItemGeneralProductPostingGroupCode",
  "bcItemBlocked",
];

export default function BcItemsView({ items, loading }) {
  const postingGroupOptions = useMemo(() => {
    const unique = [
      ...new Set(
        items.map((i) => i.bcItemGeneralProductPostingGroupCode).filter(Boolean),
      ),
    ];
    return unique.map((v) => ({ uid: v, name: v }));
  }, [items]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bcItemDisplayName":
        return <span className="font-light">{item.bcItemDisplayName}</span>;
      case "bcItemProjectName":
        return item.bcItemProjectName ? (
          <Chip variant="shadow" size="md" radius="md" color="secondary">
            {item.bcItemProjectName}
          </Chip>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "bcItemInventory": {
        const inv = Number(item.bcItemInventory);
        return (
          <span className={inv > 0 ? "text-success" : "text-danger"}>
            {item.bcItemInventory != null ? inv.toLocaleString("th-TH") : "-"}
          </span>
        );
      }
      case "bcItemUnitPrice":
        return item.bcItemUnitPrice != null
          ? Number(item.bcItemUnitPrice).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "bcItemUnitCost": {
        const hasCost = item.bcItemUnitCost != null && Number(item.bcItemUnitCost) > 0;
        return (
          <span className={hasCost ? "text-primary" : "text-danger"}>
            {item.bcItemUnitCost != null
              ? Number(item.bcItemUnitCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })
              : "-"}
          </span>
        );
      }
      case "bcItemBlocked":
        return (
          <Chip
            variant="shadow"
            size="md"
            radius="md"
            color={!item.bcItemBlocked ? "success" : "danger"}
          >
            {item.bcItemBlocked ? "ใช่" : "ไม่"}
          </Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={items}
        renderCell={renderCell}
        enableCardView
        rowKey="bcItemId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusField="bcItemGeneralProductPostingGroupCode"
        statusOptions={postingGroupOptions}
        filterLabel="กลุ่มการลงบัญชี"
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ..."
        searchKeys={["bcItemNumber", "bcItemDisplayName", "bcItemProjectName"]}
        emptyContent="ไม่พบสินค้า"
      />
    </div>
  );
}
