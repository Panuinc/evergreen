import { Card, CardBody, Spinner } from "@heroui/react";
import { Server, HeadphonesIcon, FileText, Globe, Shield, Clock } from "lucide-react";
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";
import TicketTrendChart from "@/modules/it/components/TicketTrendChart";
import AssetByCategoryChart from "@/modules/it/components/AssetByCategoryChart";
import LicenseExpiryChart from "@/modules/it/components/LicenseExpiryChart";

export default function DashboardView({ stats, loading, compareMode, setCompareMode }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground text-center py-10">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>;
  }

  // Handle comparison data shape
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
      // Point-in-time stat — no comparison
    },
    {
      title: "ตั๋วที่เปิดอยู่",
      value: d.openTickets,
      sub: "เปิด / กำลังดำเนินการ",
      icon: HeadphonesIcon,
      color: "warning",
      currentRaw: prev ? d.openTickets : undefined,
      previousRaw: prev?.openTickets,
      invertColor: true,
    },
    {
      title: "ไลเซนส์ที่ใช้งาน",
      value: d.activeLicenses,
      sub: "ไลเซนส์ซอฟต์แวร์",
      icon: FileText,
      color: "success",
      // Point-in-time stat — no comparison
    },
    {
      title: "อุปกรณ์เครือข่าย",
      value: d.totalNetworkDevices,
      sub: `${d.onlineDevices} ออนไลน์`,
      icon: Globe,
      color: "secondary",
      // Point-in-time stat — no comparison
    },
    {
      title: "เหตุการณ์ด้านความปลอดภัย",
      value: d.openIncidents,
      sub: "เปิด / กำลังสอบสวน",
      icon: Shield,
      color: "danger",
      currentRaw: prev ? d.openIncidents : undefined,
      previousRaw: prev?.openIncidents,
      invertColor: true,
    },
    {
      title: "การเข้าถึงที่รอดำเนินการ",
      value: d.pendingAccess,
      sub: "รอการอนุมัติ",
      icon: Clock,
      color: "default",
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && stats.labels && (
              <span className="text-sm text-muted-foreground">
                {stats.labels.current} vs {stats.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
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
            <p className="text-sm font-light mb-3">แนวโน้มตั๋ว (6 เดือนล่าสุด)</p>
            <TicketTrendChart data={d.ticketTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-sm font-light mb-3">ทรัพย์สินตามหมวดหมู่</p>
            <AssetByCategoryChart data={d.assetByCategory} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-sm font-light mb-3">ภาพรวมการหมดอายุไลเซนส์</p>
            <LicenseExpiryChart data={d.licenseExpiry} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
