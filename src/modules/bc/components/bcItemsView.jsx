"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "bcItemNo", sortable: true },
  { name: "ชื่อสินค้า", uid: "bcItemDescription", sortable: true },
  { name: "ประเภท", uid: "bcItemType", sortable: true },
  { name: "คงคลัง", uid: "bcItemInventory", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "bcItemUnitPrice", sortable: true },
  { name: "ต้นทุนต่อหน่วย", uid: "bcItemUnitCost", sortable: true },
  { name: "หมวดหมู่", uid: "bcItemItemCategoryCode", sortable: true },
  {
    name: "กลุ่มการลงบัญชี",
    uid: "bcItemGenProdPostingGroup",
    sortable: true,
  },
  { name: "ถูกบล็อก", uid: "bcItemBlocked", sortable: true },
];

const initialVisibleColumns = [
  "bcItemNo",
  "bcItemDescription",
  "bcItemType",
  "bcItemInventory",
  "bcItemUnitPrice",
  "bcItemUnitCost",
  "bcItemItemCategoryCode",
  "bcItemGenProdPostingGroup",
  "bcItemBlocked",
];

export default function BcItemsView({ items, loading }) {
  const postingGroupOptions = useMemo(() => {
    const unique = [
      ...new Set(
        items.map((i) => i.bcItemGenProdPostingGroup).filter(Boolean),
      ),
    ];
    return unique.map((v) => ({ uid: v, name: v }));
  }, [items]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bcItemDescription":
        return <span className="font-light">{item.bcItemDescription}</span>;
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
            variant="flat"
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
        initialVisibleColumns={initialVisibleColumns}
        statusField="bcItemGenProdPostingGroup"
        statusOptions={postingGroupOptions}
        filterLabel="กลุ่มการลงบัญชี"
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ..."
        searchKeys={["bcItemNo", "bcItemDescription"]}
        emptyContent="ไม่พบสินค้า"
      />
    </div>
  );
}
