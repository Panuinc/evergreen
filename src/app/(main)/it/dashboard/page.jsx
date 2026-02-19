"use client";

import { Card, CardBody, Spinner } from "@heroui/react";
import { Server, HeadphonesIcon, FileText, Globe, Shield, Clock } from "lucide-react";
import { useItDashboard } from "@/hooks/useItDashboard";
import TicketTrendChart from "@/components/charts/TicketTrendChart";
import AssetByCategoryChart from "@/components/charts/AssetByCategoryChart";
import LicenseExpiryChart from "@/components/charts/LicenseExpiryChart";

export default function ITDashboardPage() {
  const { stats, loading } = useItDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">Failed to load dashboard data</p>;
  }

  const cards = [
    { title: "Total Assets", value: stats.totalAssets, sub: "IT assets tracked", icon: Server, color: "text-primary" },
    { title: "Open Tickets", value: stats.openTickets, sub: "open / in progress", icon: HeadphonesIcon, color: "text-warning" },
    { title: "Active Licenses", value: stats.activeLicenses, sub: "software licenses", icon: FileText, color: "text-success" },
    { title: "Network Devices", value: stats.totalNetworkDevices, sub: `${stats.onlineDevices} online`, icon: Globe, color: "text-secondary" },
    { title: "Security Incidents", value: stats.openIncidents, sub: "open / investigating", icon: Shield, color: "text-danger" },
    { title: "Pending Access", value: stats.pendingAccess, sub: "awaiting approval", icon: Clock, color: "text-default-500" },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <h2 className="text-lg font-semibold">IT Dashboard</h2>

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
            <p className="text-sm font-semibold mb-3">Ticket Trend (Last 6 Months)</p>
            <TicketTrendChart data={stats.ticketTrend} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Assets by Category</p>
            <AssetByCategoryChart data={stats.assetByCategory} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">License Expiry Overview</p>
            <LicenseExpiryChart data={stats.licenseExpiry} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
