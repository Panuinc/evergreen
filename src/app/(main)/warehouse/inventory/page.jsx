"use client";

import { useMemo } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Package } from "lucide-react";
import Link from "next/link";
import { useWarehouseInventory } from "@/hooks/useWarehouseInventory";

const GROUP_ORDER = [
  "Ap", "Bp", "Fa", "Fg", "Is", "Pk", "Rm", "Sm",
  "Sp", "Sv-Buy", "Sv-Buy1", "Sv-Buy2", "Sv-Buy3", "Sv-Sell", "Tr", "Wp",
];

export default function WarehouseInventoryPage() {
  const { items, loading } = useWarehouseInventory();

  const groupedData = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const group = item.generalProductPostingGroupCode || "ไม่ระบุ";
      if (!groups[group]) {
        groups[group] = { count: 0, totalQty: 0, totalValue: 0 };
      }
      groups[group].count += 1;
      groups[group].totalQty += Number(item.inventory) || 0;
      groups[group].totalValue +=
        (Number(item.inventory) || 0) * (Number(item.unitCost) || 0);
    });
    return groups;
  }, [items]);

  const sortedGroups = useMemo(() => {
    const all = Object.keys(groupedData);
    const ordered = GROUP_ORDER.filter((g) => all.includes(g));
    const rest = all.filter((g) => !GROUP_ORDER.includes(g)).sort();
    return [...ordered, ...rest];
  }, [groupedData]);

  const totalSummary = useMemo(() => {
    const totalItems = items.length;
    const totalQty = items.reduce((s, i) => s + (Number(i.inventory) || 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (Number(i.inventory) || 0) * (Number(i.unitCost) || 0),
      0,
    );
    return { totalItems, totalQty, totalValue };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner size="lg" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Total Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card shadow="none" className="bg-default-50 border-2 border-default">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">รายการสินค้าทั้งหมด</p>
            <p className="text-2xl font-bold">
              {totalSummary.totalItems.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="bg-default-50 border-2 border-default">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">จำนวนคงเหลือรวม</p>
            <p className="text-2xl font-bold text-success">
              {totalSummary.totalQty.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="bg-default-50 border-2 border-default">
          <CardBody className="gap-1">
            <p className="text-xs text-default-500">มูลค่าคลังสินค้า (ต้นทุน)</p>
            <p className="text-2xl font-bold text-primary">
              {totalSummary.totalValue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedGroups.map((group) => (
          <Link key={group} href={`/warehouse/inventory/${encodeURIComponent(group)}`}>
            <Card shadow="none" className="bg-default-50 hover:bg-default-100 border-2 border-default transition-colors cursor-pointer h-full">
              <CardBody className="gap-2">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-default-500" />
                  <p className="font-semibold">{group}</p>
                </div>
                <div className="flex flex-col gap-0.5 text-sm">
                  <p className="text-default-500">
                    {groupedData[group].count.toLocaleString("th-TH")} รายการ
                  </p>
                  <p className="text-success">
                    คงเหลือ {groupedData[group].totalQty.toLocaleString("th-TH")}
                  </p>
                  <p className="text-primary">
                    {groupedData[group].totalValue.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })} ฿
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
