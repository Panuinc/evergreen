"use client";

import { useCallback, useMemo, useState } from "react";
import { Chip, Card, CardBody, Tabs, Tab } from "@heroui/react";
import { Boxes, Package } from "lucide-react";
import { useWarehouseInventory } from "@/hooks/useWarehouseInventory";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "รหัสสินค้า", uid: "number", sortable: true },
  { name: "ชื่อสินค้า", uid: "displayName", sortable: true },
  { name: "ประเภท", uid: "type", sortable: true },
  { name: "คงเหลือ", uid: "inventory", sortable: true },
  { name: "หน่วย", uid: "baseUnitOfMeasure", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "unitPrice", sortable: true },
  { name: "ต้นทุน", uid: "unitCost", sortable: true },
  { name: "หมวดหมู่", uid: "itemCategoryCode", sortable: true },
  {
    name: "Gen. Prod. Posting Group",
    uid: "generalProductPostingGroupCode",
    sortable: true,
  },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "type",
  "inventory",
  "baseUnitOfMeasure",
  "unitPrice",
  "unitCost",
  "itemCategoryCode",
];

export default function WarehouseInventoryPage() {
  const { items, loading } = useWarehouseInventory();
  const [selectedGroup, setSelectedGroup] = useState("all");

  const groupedData = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const group = item.generalProductPostingGroupCode || "ไม่ระบุ";
      if (!groups[group]) {
        groups[group] = { items: [], totalQty: 0, totalValue: 0 };
      }
      groups[group].items.push(item);
      groups[group].totalQty += Number(item.inventory) || 0;
      groups[group].totalValue +=
        (Number(item.inventory) || 0) * (Number(item.unitCost) || 0);
    });
    return groups;
  }, [items]);

  const groupNames = useMemo(
    () => Object.keys(groupedData).sort(),
    [groupedData],
  );

  const displayItems = useMemo(() => {
    if (selectedGroup === "all") return items;
    return groupedData[selectedGroup]?.items || [];
  }, [items, groupedData, selectedGroup]);

  const summaryCards = useMemo(() => {
    const totalItems = items.length;
    const totalQty = items.reduce((s, i) => s + (Number(i.inventory) || 0), 0);
    const totalValue = items.reduce(
      (s, i) =>
        s + (Number(i.inventory) || 0) * (Number(i.unitCost) || 0),
      0,
    );
    const totalGroups = groupNames.length;
    return { totalItems, totalQty, totalValue, totalGroups };
  }, [items, groupNames]);

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
      case "type":
        return (
          <Chip variant="flat" size="sm" color="default">
            {item.type || "-"}
          </Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  const postingGroupOptions = useMemo(() => {
    return groupNames.map((v) => ({ uid: v, name: v }));
  }, [groupNames]);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card shadow="none" className="bg-default-50">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">รายการสินค้าทั้งหมด</p>
            <p className="text-2xl font-bold">
              {summaryCards.totalItems.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="bg-default-50">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">จำนวนคงเหลือรวม</p>
            <p className="text-2xl font-bold text-success">
              {summaryCards.totalQty.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="bg-default-50">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">มูลค่าคลังสินค้า (ต้นทุน)</p>
            <p className="text-2xl font-bold text-primary">
              {summaryCards.totalValue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="bg-default-50">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">กลุ่มสินค้า</p>
            <p className="text-2xl font-bold">
              {summaryCards.totalGroups.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Group Tabs */}
      <div className="w-full overflow-x-auto">
        <Tabs
          selectedKey={selectedGroup}
          onSelectionChange={setSelectedGroup}
          variant="underlined"
          color="primary"
          size="sm"
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center gap-1.5">
                <Boxes size={14} />
                <span>ทั้งหมด</span>
                <Chip size="sm" variant="flat">
                  {items.length}
                </Chip>
              </div>
            }
          />
          {groupNames.map((group) => (
            <Tab
              key={group}
              title={
                <div className="flex items-center gap-1.5">
                  <Package size={14} />
                  <span>{group}</span>
                  <Chip size="sm" variant="flat">
                    {groupedData[group].items.length}
                  </Chip>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Group Summary when a specific group is selected */}
      {selectedGroup !== "all" && groupedData[selectedGroup] && (
        <div className="grid grid-cols-3 gap-3">
          <Card shadow="none" className="bg-default-50">
            <CardBody className="gap-1 py-2">
              <p className="text-xs text-default-500">รายการในกลุ่ม</p>
              <p className="text-lg font-semibold">
                {groupedData[selectedGroup].items.length.toLocaleString("th-TH")}
              </p>
            </CardBody>
          </Card>
          <Card shadow="none" className="bg-default-50">
            <CardBody className="gap-1 py-2">
              <p className="text-xs text-default-500">จำนวนคงเหลือ</p>
              <p className="text-lg font-semibold text-success">
                {groupedData[selectedGroup].totalQty.toLocaleString("th-TH")}
              </p>
            </CardBody>
          </Card>
          <Card shadow="none" className="bg-default-50">
            <CardBody className="gap-1 py-2">
              <p className="text-xs text-default-500">มูลค่า (ต้นทุน)</p>
              <p className="text-lg font-semibold text-primary">
                {groupedData[selectedGroup].totalValue.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={displayItems}
        renderCell={renderCell}
        enableCardView
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusField="generalProductPostingGroupCode"
        statusOptions={postingGroupOptions}
        filterLabel="Posting Group"
        searchPlaceholder="ค้นหาด้วยรหัสหรือชื่อสินค้า..."
        searchKeys={["number", "displayName"]}
        emptyContent="ไม่พบรายการสินค้า"
      />
    </div>
  );
}
