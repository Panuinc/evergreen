"use client";

import { Card, CardBody, Chip, Spinner, Button } from "@heroui/react";
import { AlertTriangle, AlertCircle, RefreshCw, Truck, User, Wrench } from "lucide-react";
import { useTmsAlerts } from "@/hooks/tms/useTmsAlerts";

const TYPE_ICONS = {
  vehicle_registration: Truck,
  vehicle_insurance: Truck,
  vehicle_act: Truck,
  driver_license: User,
  maintenance_due: Wrench,
  maintenance_mileage: Wrench,
};

const TYPE_LABELS = {
  vehicle_registration: "ทะเบียนยานพาหนะ",
  vehicle_insurance: "ประกันภัยยานพาหนะ",
  vehicle_act: "พ.ร.บ. ยานพาหนะ",
  driver_license: "ใบขับขี่",
  maintenance_due: "ครบกำหนดซ่อมบำรุง",
  maintenance_mileage: "เลขไมล์ครบกำหนดซ่อม",
};

const FILTER_OPTIONS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "critical", label: "วิกฤต" },
  { key: "warning", label: "เตือน" },
  { key: "vehicle_registration", label: "ทะเบียน" },
  { key: "vehicle_insurance", label: "ประกันภัย" },
  { key: "driver_license", label: "ใบขับขี่" },
  { key: "maintenance_due", label: "ซ่อมบำรุง" },
];

export default function AlertsPage() {
  const {
    alerts,
    alertCount,
    criticalCount,
    warningCount,
    loading,
    filter,
    setFilter,
    loadAlerts,
  } = useTmsAlerts();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
        <Button variant="bordered" size="md" radius="md" startContent={<RefreshCw size={16} />} onPress={loadAlerts}>
          รีเฟรช
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <AlertTriangle size={24} className="text-danger" />
            <div>
              <p className="text-2xl font-bold">{criticalCount}</p>
              <p className="text-xs text-default-500">วิกฤต</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <AlertCircle size={24} className="text-warning" />
            <div>
              <p className="text-2xl font-bold">{warningCount}</p>
              <p className="text-xs text-default-500">เตือน</p>
            </div>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200 flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <div>
              <p className="text-2xl font-bold">{alertCount}</p>
              <p className="text-xs text-default-500">แจ้งเตือนทั้งหมด</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            variant={filter === opt.key ? "solid" : "bordered"}
            color={opt.key === "critical" ? "danger" : opt.key === "warning" ? "warning" : "default"}
            className="cursor-pointer"
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <p className="text-default-400 text-center py-10">ไม่พบการแจ้งเตือน</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, i) => {
            const Icon = TYPE_ICONS[alert.type] || AlertCircle;
            return (
              <Card key={i} shadow="none" className="border border-default-200">
                <CardBody className="p-4 flex-row items-start gap-4">
                  <div className={`mt-1 ${alert.severity === "critical" ? "text-danger" : "text-warning"}`}>
                    {alert.severity === "critical" ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <Chip
                        variant="bordered"
                        size="md"
                        radius="md"
                        color={alert.severity === "critical" ? "danger" : "warning"}
                      >
                        {alert.severity === "critical" ? "วิกฤต" : "เตือน"}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-500">{alert.detail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Chip variant="bordered" size="md" radius="md" startContent={<Icon size={12} />}>
                        {TYPE_LABELS[alert.type] || alert.type}
                      </Chip>
                      {alert.date && (
                        <span className="text-xs text-default-400">
                          {new Date(alert.date).toLocaleDateString("th-TH")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
