"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useBcItems } from "@/hooks/useBcItems";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Display Name", uid: "displayName", sortable: true },
  { name: "Type", uid: "type", sortable: true },
  { name: "Category", uid: "itemCategoryCode", sortable: true },
  { name: "Inventory", uid: "inventory", sortable: true },
  { name: "Unit Price", uid: "unitPrice", sortable: true },
  { name: "Unit Cost", uid: "unitCost", sortable: true },
  { name: "Blocked", uid: "blocked", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "type",
  "itemCategoryCode",
  "inventory",
  "unitPrice",
  "unitCost",
  "blocked",
];

export default function BcItemsPage() {
  const { items, loading } = useBcItems();

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "displayName":
        return <span className="font-medium">{item.displayName}</span>;
      case "inventory":
        return item.inventory != null
          ? Number(item.inventory).toLocaleString("th-TH")
          : "-";
      case "unitPrice":
        return item.unitPrice != null
          ? Number(item.unitPrice).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "unitCost":
        return item.unitCost != null
          ? Number(item.unitCost).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
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
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by number, name, category..."
        searchKeys={["number", "displayName", "itemCategoryCode"]}
        emptyContent="No items found"
      />
    </div>
  );
}
