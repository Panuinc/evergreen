"use client";

import { Card, CardBody, Chip, Progress } from "@heroui/react";
import { Truck, Fuel, Route, Gauge } from "lucide-react";

const STATUS_COLORS = {
  available: "success",
  in_use: "primary",
  maintenance: "warning",
  retired: "default",
};

const STATUS_LABELS = {
  available: "ว่าง",
  in_use: "ใช้งาน",
  maintenance: "ซ่อม",
  retired: "ปลด",
};

function fmt(n) {
  if (n == null || n === 0) return "-";
  return Number(n).toLocaleString("th-TH");
}

function fmtBaht(n) {
  if (n == null || n === 0) return "-";
  return `฿${Number(n).toLocaleString("th-TH")}`;
}

function StatItem({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-2">
      <div className="p-1.5 rounded-md bg-default-100 mt-0.5">
        <Icon size={14} className="text-default-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-default-400">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
        {sub && <p className="text-xs text-default-400">{sub}</p>}
      </div>
    </div>
  );
}

function FuelDiffBadge({ estimated, actual }) {
  if (!actual || !estimated) return null;
  const diff = actual - estimated;
  const pct = Math.round((diff / estimated) * 100);
  if (pct === 0) return <Chip size="sm" variant="flat" color="default">0%</Chip>;
  const isOver = pct > 0;
  return (
    <Chip size="sm" variant="flat" color={isOver ? "danger" : "success"}>
      {isOver ? "เกิน" : "ประหยัด"} {Math.abs(pct)}%
    </Chip>
  );
}

export default function VehiclePerformanceTable({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  const sorted = [...data].sort((a, b) => b.totalDistanceKm - a.totalDistanceKm);
  const maxDistance = Math.max(...sorted.map((v) => v.totalDistanceKm), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sorted.map((v) => (
        <Card key={v.vehicleId} shadow="none" className="border border-foreground/15">
          <CardBody className="p-4 gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-default-500" />
                <div>
                  <p className="text-sm font-semibold">{v.vehicleName || v.plateNumber}</p>
                  {v.vehicleName && (
                    <p className="text-xs text-default-400">{v.plateNumber}</p>
                  )}
                </div>
              </div>
              <Chip size="sm" variant="flat" color={STATUS_COLORS[v.status] || "default"}>
                {STATUS_LABELS[v.status] || v.status}
              </Chip>
            </div>

            {/* Distance bar */}
            {v.totalDistanceKm > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-default-400">ระยะทาง</span>
                  <span className="text-xs font-medium">{fmt(v.totalDistanceKm)} กม.</span>
                </div>
                <Progress
                  size="sm"
                  value={(v.totalDistanceKm / maxDistance) * 100}
                  color="primary"
                  className="max-w-full"
                />
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                icon={Route}
                label="จำนวนเที่ยว"
                value={fmt(v.tripCount)}
              />
              <StatItem
                icon={Gauge}
                label="อัตราจริง"
                value={v.actualRate != null ? `${v.actualRate} กม./ลิตร` : "-"}
                sub={v.fuelConsumptionRate ? `ค่าตั้ง: ${v.fuelConsumptionRate} กม./ลิตร` : undefined}
              />
              <StatItem
                icon={Fuel}
                label="น้ำมัน (ควรใช้ / จริง)"
                value={`${fmt(v.estimatedLiters)} / ${fmt(v.actualFuelLiters)} ลิตร`}
              />
              <StatItem
                icon={Fuel}
                label="ค่าน้ำมัน (คำนวณ / จริง)"
                value={`${fmtBaht(v.estimatedFuelCost)} / ${fmtBaht(v.actualFuelCost)}`}
              />
            </div>

            {/* Diff badge */}
            <div className="flex justify-end">
              <FuelDiffBadge estimated={v.estimatedLiters} actual={v.actualFuelLiters} />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
