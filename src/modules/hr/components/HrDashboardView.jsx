import { Card, CardBody, Spinner } from "@heroui/react";
import {
  Users,
  UserCheck,
  Building2,
  Layers,
  Briefcase,
  UserPlus,
} from "lucide-react";
import EmployeeByDivisionChart from "@/modules/hr/components/charts/EmployeeByDivisionChart";
import EmployeeByDepartmentChart from "@/modules/hr/components/charts/EmployeeByDepartmentChart";
import EmployeeStatusChart from "@/modules/hr/components/charts/EmployeeStatusChart";
import NewEmployeeTrendChart from "@/modules/hr/components/charts/NewEmployeeTrendChart";

export default function HrDashboardView({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-default-400 text-center py-10">
        ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
      </p>
    );
  }

  const cards = [
    {
      title: "พนักงานทั้งหมด",
      value: stats.totalEmployees,
      sub: "จำนวนพนักงานในระบบ",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "พนักงาน Active",
      value: stats.activeEmployees,
      sub: "กำลังปฏิบัติงาน",
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "ฝ่ายทั้งหมด",
      value: stats.totalDivisions,
      sub: "จำนวนฝ่าย",
      icon: Building2,
      color: "text-secondary",
    },
    {
      title: "แผนกทั้งหมด",
      value: stats.totalDepartments,
      sub: "จำนวนแผนก",
      icon: Layers,
      color: "text-warning",
    },
    {
      title: "ตำแหน่งทั้งหมด",
      value: stats.totalPositions,
      sub: "จำนวนตำแหน่งงาน",
      icon: Briefcase,
      color: "text-default-500",
    },
    {
      title: "พนักงานใหม่เดือนนี้",
      value: stats.newThisMonth,
      sub: "เข้างานเดือนนี้",
      icon: UserPlus,
      color: "text-success",
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            shadow="none"
            className="border border-default-200"
          >
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
            <p className="text-sm font-semibold mb-3">พนักงานตามฝ่าย</p>
            <EmployeeByDivisionChart data={stats.byDivision} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">พนักงานตามแผนก</p>
            <EmployeeByDepartmentChart data={stats.byDepartment} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สถานะพนักงาน</p>
            <EmployeeStatusChart data={stats.byStatus} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              แนวโน้มพนักงานใหม่ (6 เดือนล่าสุด)
            </p>
            <NewEmployeeTrendChart data={stats.trend} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
