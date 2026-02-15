"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import { useBcItems } from "@/hooks/useBcItems";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Display Name", uid: "displayName", sortable: true },
  { name: "Type", uid: "type", sortable: true },
  { name: "Inventory", uid: "inventory", sortable: true },
  { name: "Unit Price", uid: "unitPrice", sortable: true },
  { name: "Unit Cost", uid: "unitCost", sortable: true },
  { name: "Category", uid: "itemCategoryCode", sortable: true },
  {
    name: "Gen. Prod. Posting Group",
    uid: "generalProductPostingGroupCode",
    sortable: true,
  },
  { name: "Blocked", uid: "blocked", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
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
            {item.blocked ? "Yes" : "No"}
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
        filterLabel="Posting Group"
        searchPlaceholder="Search by number, name..."
        searchKeys={["number", "displayName"]}
        emptyContent="No items found"
      />
    </div>
  );
}
