"use client";

import { Card, CardBody } from "@heroui/react";
import { Server } from "lucide-react";
import CompareToggle from "@/components/ui/compareToggle";
import CompareKpiCard from "@/components/ui/compareKpiCard";
import AssetByCategoryChart from "@/modules/it/components/assetByCategoryChart";
import Loading from "@/components/ui/loading";

export default function DashboardView({ stats, loading, compareMode, setCompareMode }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground text-center py-10">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>;
  }


  const isCompare = !!stats.compareMode;
  const d = isCompare ? stats.current : stats;
  const prev = isCompare ? stats.previous : null;

  const cards = [
    {
      title: "ทรัพย์สินทั้งหมด",
      value: d.totalAssets,
      sub: "ทรัพย์สิน IT ที่ติดตาม",
      icon: Server,
      color: "primary",
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && stats.labels && (
              <span className="text-xs text-muted-foreground">
                {stats.labels.current} vs {stats.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card: any) => (
          <CompareKpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            unit={card.unit}
            color={card.color}
            subtitle={card.sub}
            currentRaw={card.currentRaw}
            previousRaw={card.previousRaw}
            invertColor={card.invertColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">ทรัพย์สินตามหมวดหมู่</p>
            <AssetByCategoryChart data={d.assetByCategory} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
