"use client";

import { useCallback } from "react";
import { Chip, Card, CardBody } from "@heroui/react";
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

  const renderCard = useCallback((item) => (
    <Card key={item.id} variant="bordered" radius="md" shadow="none">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{item.displayName}</span>
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={!item.blocked ? "success" : "danger"}
          >
            {item.blocked ? "Yes" : "No"}
          </Chip>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-default-400">Number</span>
            <span>{item.number || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Type</span>
            <span>{item.type || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Category</span>
            <span>{item.itemCategoryCode || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Inventory</span>
            <span>{item.inventory != null ? Number(item.inventory).toLocaleString("th-TH") : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Unit Price</span>
            <span className="font-semibold">
              {item.unitPrice != null
                ? Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Unit Cost</span>
            <span>
              {item.unitCost != null
                ? Number(item.unitCost).toLocaleString("th-TH", { minimumFractionDigits: 2 })
                : "-"}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  ), []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={items}
        renderCell={renderCell}
        renderCard={renderCard}
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
