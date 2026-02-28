import { Card, CardBody, Spinner } from "@heroui/react";
import { Server, HeadphonesIcon, FileText, Globe, Shield, Clock } from "lucide-react";
import TicketTrendChart from "@/components/charts/TicketTrendChart";
import AssetByCategoryChart from "@/components/charts/AssetByCategoryChart";
import LicenseExpiryChart from "@/components/charts/LicenseExpiryChart";

export default function DashboardView({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</p>;
  }

  const cards = [
    { title: "ทรัพย์สินทั้งหมด", value: stats.totalAssets, sub: "ทรัพย์สิน IT ที่ติดตาม", icon: Server, color: "text-primary" },
    { title: "ตั๋วที่เปิดอยู่", value: stats.openTickets, sub: "เปิด / กำลังดำเนินการ", icon: HeadphonesIcon, color: "text-warning" },
    { title: "ไลเซนส์ที่ใช้งาน", value: stats.activeLicenses, sub: "ไลเซนส์ซอฟต์แวร์", icon: FileText, color: "text-success" },
    { title: "อุปกรณ์เครือข่าย", value: stats.totalNetworkDevices, sub: `${stats.onlineDevices} ออนไลน์`, icon: Globe, color: "text-secondary" },
    { title: "เหตุการณ์ด้านความปลอดภัย", value: stats.openIncidents, sub: "เปิด / กำลังสอบสวน", icon: Shield, color: "text-danger" },
    { title: "การเข้าถึงที่รอดำเนินการ", value: stats.pendingAccess, sub: "รอการอนุมัติ", icon: Clock, color: "text-default-500" },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} shadow="none" className="border border-default-200">
            <CardBody className="p-5 gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">{card.title}</p>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-default-400">{card.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">แนวโน้มตั๋ว (6 เดือนล่าสุด)</p>
            <TicketTrendChart data={stats.ticketTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ทรัพย์สินตามหมวดหมู่</p>
            <AssetByCategoryChart data={stats.assetByCategory} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ภาพรวมการหมดอายุไลเซนส์</p>
            <LicenseExpiryChart data={stats.licenseExpiry} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
