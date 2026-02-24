"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import { useBcItems } from "@/hooks/bc/useBcItems";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "ชื่อสินค้า", uid: "displayName", sortable: true },
  { name: "โครงการ", uid: "projectName", sortable: true },
  { name: "ประเภท", uid: "type", sortable: true },
  { name: "คงคลัง", uid: "inventory", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "unitPrice", sortable: true },
  { name: "ต้นทุนต่อหน่วย", uid: "unitCost", sortable: true },
  { name: "หมวดหมู่", uid: "itemCategoryCode", sortable: true },
  {
    name: "กลุ่มการลงบัญชี",
    uid: "generalProductPostingGroupCode",
    sortable: true,
  },
  { name: "ถูกบล็อก", uid: "blocked", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "projectName",
  "type",
  "inventory",
  "unitPrice",
  "unitCost",
  "itemCategoryCode",
  "generalProductPostingGroupCode",
  "blocked",
];

export default function BcItemsPage() {
  const { items, loading } = useBcItems();

  const postingGroupOptions = useMemo(() => {
    const unique = [
      ...new Set(
        items.map((i) => i.generalProductPostingGroupCode).filter(Boolean),
      ),
    ];
    return unique.map((v) => ({ uid: v, name: v }));
  }, [items]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "displayName":
        return <span className="font-medium">{item.displayName}</span>;
      case "projectName":
        return item.projectName ? (
          <Chip variant="bordered" size="md" radius="md" color="secondary">
            {item.projectName}
          </Chip>
        ) : (
          <span className="text-default-300">-</span>
        );
      case "inventory": {
        const inv = Number(item.inventory);
        return (
          <span className={inv > 0 ? "text-success" : "text-danger"}>
            {item.inventory != null ? inv.toLocaleString("th-TH") : "-"}
          </span>
        );
      }
      case "unitPrice":
        return item.unitPrice != null
          ? Number(item.unitPrice).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "unitCost": {
        const hasCost = item.unitCost != null && Number(item.unitCost) > 0;
        return (
          <span className={hasCost ? "text-primary" : "text-danger"}>
            {item.unitCost != null
              ? Number(item.unitCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })
              : "-"}
          </span>
        );
      }
      case "blocked":
        return (
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={!item.blocked ? "success" : "danger"}
          >
            {item.blocked ? "ใช่" : "ไม่"}
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
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusField="generalProductPostingGroupCode"
        statusOptions={postingGroupOptions}
        filterLabel="กลุ่มการลงบัญชี"
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ..."
        searchKeys={["number", "displayName", "projectName"]}
        emptyContent="ไม่พบสินค้า"
      />
    </div>
  );
}
