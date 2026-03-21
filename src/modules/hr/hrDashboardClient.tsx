"use client";

import React, { useState, useCallback } from "react";
import { Card, CardBody } from "@heroui/react";
import {
  Users,
  UserCheck,
  Building2,
  Layers,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import CompareToggle from "@/components/ui/compareToggle";
import CompareKpiCard from "@/components/ui/compareKpiCard";
import EmployeeByDivisionChart from "@/modules/hr/components/employeeByDivisionChart";
import EmployeeByDepartmentChart from "@/modules/hr/components/employeeByDepartmentChart";
import EmployeeStatusChart from "@/modules/hr/components/employeeStatusChart";
import NewEmployeeTrendChart from "@/modules/hr/components/newEmployeeTrendChart";
import { get } from "@/lib/apiClient";
import type {
  HrDashboardClientProps,
  HrDashboardStats,
  HrDashboardCompareStats,
  HrDashboardResponse,
} from "./types";

type KpiColor = "primary" | "success" | "warning" | "danger" | "default";

function isCompareStats(stats: HrDashboardResponse): stats is HrDashboardCompareStats {
  return "compareMode" in stats;
}

export default function HrDashboardClient({ initialStats }: HrDashboardClientProps) {
  const [stats, setStats] = useState<HrDashboardResponse | null>(initialStats);
  const [compareMode, setCompareMode] = useState<string | null>(null);

  const handleCompareModeChange = useCallback(async (mode: string | null) => {
    setCompareMode(mode);
    try {
      const params = mode ? `?compareMode=${mode}` : "";
      const data = await get(`/api/hr/dashboard${params}`);
      setStats(data as HrDashboardResponse);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    }
  }, []);

  if (!stats) {
    return (
      <p className="text-muted-foreground text-center py-10">
        ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
      </p>
    );
  }

  const isCompare = isCompareStats(stats);
  const d: HrDashboardStats = isCompare ? stats.current : stats;
  const prev: HrDashboardStats | null = isCompare ? stats.previous : null;

  const cards: Array<{
    title: string;
    value: number;
    sub: string;
    icon: React.ElementType;
    color: KpiColor;
    currentRaw?: number;
    previousRaw?: number;
  }> = [
    {
      title: "พนักงานทั้งหมด",
      value: d.totalEmployees,
      sub: "จำนวนพนักงานในระบบ",
      icon: Users,
      color: "primary",
      currentRaw: prev ? d.totalEmployees : undefined,
      previousRaw: prev?.totalEmployees,
    },
    {
      title: "พนักงาน Active",
      value: d.activeEmployees,
      sub: "กำลังปฏิบัติงาน",
      icon: UserCheck,
      color: "success",
      currentRaw: prev ? d.activeEmployees : undefined,
      previousRaw: prev?.activeEmployees,
    },
    {
      title: "ฝ่ายทั้งหมด",
      value: d.totalDivisions,
      sub: "จำนวนฝ่าย",
      icon: Building2,
      color: "default",
    },
    {
      title: "แผนกทั้งหมด",
      value: d.totalDepartments,
      sub: "จำนวนแผนก",
      icon: Layers,
      color: "warning",
    },
    {
      title: "ตำแหน่งทั้งหมด",
      value: d.totalPositions,
      sub: "จำนวนตำแหน่งงาน",
      icon: Briefcase,
      color: "default",
    },
    {
      title: "พนักงานใหม่เดือนนี้",
      value: d.newThisMonth,
      sub: "เข้างานเดือนนี้",
      icon: UserPlus,
      color: "success",
      currentRaw: prev ? d.newThisMonth : undefined,
      previousRaw: prev?.newThisMonth,
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          {isCompare && stats.labels && (
            <span className="text-xs text-muted-foreground">
              {stats.labels.current} vs {stats.labels.previous}
            </span>
          )}
          <CompareToggle value={compareMode} onChange={handleCompareModeChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <CompareKpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            color={card.color}
            subtitle={card.sub}
            currentRaw={card.currentRaw}
            previousRaw={card.previousRaw}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">พนักงานตามฝ่าย</p>
            <EmployeeByDivisionChart data={d.byDivision || []} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">พนักงานตามแผนก</p>
            <EmployeeByDepartmentChart data={d.byDepartment || []} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">สถานะพนักงาน</p>
            <EmployeeStatusChart data={d.byStatus || []} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">
              แนวโน้มพนักงานใหม่ (6 เดือนล่าสุด)
            </p>
            <NewEmployeeTrendChart data={d.trend || []} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
