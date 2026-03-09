import { Card, CardBody} from "@heroui/react";
import {
  Users,
  UserCheck,
  Building2,
  Layers,
  Briefcase,
  UserPlus,
} from "lucide-react";
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";
import EmployeeByDivisionChart from "@/modules/hr/components/EmployeeByDivisionChart";
import EmployeeByDepartmentChart from "@/modules/hr/components/EmployeeByDepartmentChart";
import EmployeeStatusChart from "@/modules/hr/components/EmployeeStatusChart";
import NewEmployeeTrendChart from "@/modules/hr/components/NewEmployeeTrendChart";
import Loading from "@/components/ui/Loading";

export default function HrDashboardView({ stats, loading, compareMode, setCompareMode }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-muted-foreground text-center py-10">
        ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
      </p>
    );
  }


  const isCompare = !!stats.compareMode;
  const d = isCompare ? stats.current : stats;
  const prev = isCompare ? stats.previous : null;

  const cards = [
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
      color: "secondary",

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
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">พนักงานตามฝ่าย</p>
            <EmployeeByDivisionChart data={d.byDivision} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">พนักงานตามแผนก</p>
            <EmployeeByDepartmentChart data={d.byDepartment} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">สถานะพนักงาน</p>
            <EmployeeStatusChart data={d.byStatus} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5">
            <p className="text-xs font-light mb-3">
              แนวโน้มพนักงานใหม่ (6 เดือนล่าสุด)
            </p>
            <NewEmployeeTrendChart data={d.trend} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
