"use client";

import { useMemo } from "react";
import { Card, CardBody} from "@heroui/react";
import { Package } from "lucide-react";
import Link from "next/link";
import Loading from "@/components/ui/loading";
import type { BcItem, WarehouseInventoryViewProps } from "@/modules/warehouse/types";

const groupOrder = [
  "Ap", "Bp", "Fa", "Fg", "Is", "Pk", "Rm", "Sm",
  "Sp", "Sv-Buy", "Sv-Buy1", "Sv-Buy2", "Sv-Buy3", "Sv-Sell", "Tr", "Wp",
];

type GroupData = Record<string, { count: number; totalQty: number; totalValue: number }>;

export default function WarehouseInventoryView({ items, loading }: WarehouseInventoryViewProps) {
  const groupedData = useMemo<GroupData>(() => {
    const groups: GroupData = {};
    items.forEach((item: BcItem) => {
      const group = item.bcItemGenProdPostingGroup || "ไม่ระบุ";
      if (!groups[group]) {
        groups[group] = { count: 0, totalQty: 0, totalValue: 0 };
      }
      groups[group].count += 1;
      groups[group].totalQty += Number(item.bcItemInventory) || 0;
      groups[group].totalValue +=
        (Number(item.bcItemInventory) || 0) * (Number(item.bcItemUnitCost) || 0);
    });
    return groups;
  }, [items]);

  const sortedGroups = useMemo(() => {
    const all = Object.keys(groupedData);
    const ordered = groupOrder.filter((g) => all.includes(g));
    const rest = all.filter((g) => !groupOrder.includes(g)).sort();
    return [...ordered, ...rest];
  }, [groupedData]);

  const totalSummary = useMemo(() => {
    const totalItems = items.length;
    const totalQty = items.reduce((s, i) => s + (Number(i.bcItemInventory) || 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (Number(i.bcItemInventory) || 0) * (Number(i.bcItemUnitCost) || 0),
      0,
    );
    return { totalItems, totalQty, totalValue };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {}
      <div className="grid grid-cols-3 gap-3">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">รายการสินค้าทั้งหมด</p>
            <p className="text-xs font-light">
              {totalSummary.totalItems.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">จำนวนคงเหลือรวม</p>
            <p className="text-xs font-light text-success">
              {totalSummary.totalQty.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">มูลค่าคลังสินค้า (ต้นทุน)</p>
            <p className="text-xs font-light text-primary">
              {totalSummary.totalValue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardBody>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedGroups.map((group) => (
          <Link key={group} href={`/warehouse/inventory/${encodeURIComponent(group)}`}>
            <Card shadow="none" className="border border-border hover:bg-default-100 transition-colors cursor-pointer h-full">
              <CardBody className="gap-2">
                <div className="flex items-center gap-2">
                  <Package className="text-muted-foreground" />
                  <p className="font-light">{group}</p>
                </div>
                <div className="flex flex-col gap-0.5 text-xs">
                  <p className="text-muted-foreground">
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
