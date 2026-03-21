"use client";

import { Chip } from "@heroui/react";
import { Crown, Medal, Trophy, Star, Flame, Zap, Clock, Timer } from "lucide-react";

const barGradients = [
  "from-blue-500 to-blue-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
  "from-rose-500 to-rose-400",
  "from-violet-500 to-violet-400",
  "from-cyan-500 to-cyan-400",
  "from-lime-500 to-lime-400",
  "from-orange-500 to-orange-400",
  "from-pink-500 to-pink-400",
  "from-teal-500 to-teal-400",
];

const bgColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

const chipColors = [
  "primary",
  "success",
  "warning",
  "danger",
  "secondary",
];

const textColors = [
  "text-blue-500",
  "text-emerald-500",
  "text-amber-500",
  "text-rose-500",
  "text-violet-500",
  "text-cyan-500",
  "text-lime-500",
  "text-orange-500",
  "text-pink-500",
  "text-teal-500",
];

function fmtNum(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

function getLevel(qty) {
  if (qty >= 500) return { label: "ปรมาจารย์", icon: Flame, color: "text-red-500" };
  if (qty >= 200) return { label: "ผู้เชี่ยวชาญ", icon: Zap, color: "text-amber-500" };
  if (qty >= 100) return { label: "มือโปร", icon: Star, color: "text-blue-500" };
  if (qty >= 50) return { label: "ชำนาญ", icon: Star, color: "text-emerald-500" };
  return { label: "มือใหม่", icon: Star, color: "text-muted-foreground" };
}

function getSpeedLabel(avgDays) {
  if (avgDays == null) return null;
  if (avgDays <= 3) return { label: "สายฟ้า", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" };
  if (avgDays <= 7) return { label: "เร็ว", color: "text-success", bg: "bg-success-50 dark:bg-success-950/30" };
  if (avgDays <= 14) return { label: "ปกติ", color: "text-primary", bg: "bg-primary-50 dark:bg-primary-950/30" };
  return { label: "ช้า", color: "text-muted-foreground", bg: "" };
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 bg-linear-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/30 animate-pulse" />
        <Crown className="relative w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 bg-linear-to-br from-default-300 to-default-400 rounded-xl shadow-md" />
        <Medal className="relative w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 bg-linear-to-br from-amber-600 to-amber-800 rounded-xl shadow-md" />
        <Trophy className="relative w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-default-100">
      <span className="text-xs font-light text-muted-foreground">#{rank}</span>
    </div>
  );
}

export default function EmployeeSpecializationChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const allCategories = new Set();
  for (const emp of data) {
    for (const c of emp.categories) {
      allCategories.add(c.category);
    }
  }
  const categories = [...allCategories];
  const catColorMap = {};
  categories.forEach((cat, i) => {
    catColorMap[cat as string] = i % barGradients.length;
  });

  const maxQty = data[0]?.totalQty || 1;

  return (
    <div className="flex flex-col gap-1">
      {}
      <div className="flex flex-wrap gap-2 mb-2 px-1">
        {categories.map((cat, i) => (
          <div key={cat as string} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${bgColors[i % bgColors.length]}`} />
            <span className="text-xs text-muted-foreground">{cat as string}</span>
          </div>
        ))}
      </div>

      {}
      {data.map((emp, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const barWidth = Math.max(10, (emp.totalQty / maxQty) * 100);
        const level = getLevel(emp.totalQty);
        const LevelIcon = level.icon;
        const speed = getSpeedLabel(emp.avgLeadTime);

        return (
          <div
            key={emp.employee}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              rank === 1
                ? "bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800/50"
                : rank === 2
                  ? "bg-linear-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/20 border border-gray-200 dark:border-gray-700/50"
                  : rank === 3
                    ? "bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/15 border border-amber-300 dark:border-amber-800/40"
                    : "hover:bg-default-50 border border-transparent"
            }`}
          >
            {}
            <RankBadge rank={rank} />

            {}
            <div className="shrink-0 w-28">
              <div className="truncate">
                <span className={`text-xs font-light ${isTop3 ? "text-foreground" : "text-foreground"}`}>
                  {emp.employee}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <LevelIcon className={`w-3 h-3 ${level.color}`} />
                <span className={`text-xs font-light ${level.color}`}>
                  {level.label}
                </span>
              </div>
            </div>

            {}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-light">
                    ผลงานรวม
                  </span>
                  {emp.avgLeadTime != null && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Timer className="w-3 h-3" />
                      เฉลี่ย {emp.avgLeadTime} วัน/ใบ
                      {speed && (
                        <span className={`font-light ${speed.color}`}>
                          ({speed.label})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-light ${isTop3 ? "text-foreground" : "text-muted-foreground"}`}>
                  {fmtNum(emp.totalQty)} ชิ้น
                  {emp.orderCount > 0 && (
                    <span className="text-xs font-light text-muted-foreground ml-1">
                      ({emp.orderCount} ใบ)
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-5 bg-default-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full overflow-hidden flex"
                  style={{ width: `${barWidth}%` }}
                >
                  {emp.categories.map((c) => {
                    const pct = (c.quantity / emp.totalQty) * 100;
                    const colorIdx = catColorMap[c.category] ?? 0;
                    return (
                      <div
                        key={c.category}
                        className={`bg-linear-to-b ${barGradients[colorIdx]} h-full`}
                        style={{ width: `${pct}%` }}
                        title={`${c.category}: ${fmtNum(c.quantity)} ชิ้น${c.avgDays != null ? ` | เฉลี่ย ${c.avgDays} วัน/ใบ (${c.orders} ใบ)` : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
              {}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {emp.categories.slice(0, 4).map((c) => {
                  const colorIdx = catColorMap[c.category] ?? 0;
                  const catSpeed = getSpeedLabel(c.avgDays);
                  return (
                    <span key={c.category} className="text-xs text-muted-foreground">
                      <span className={`font-light ${textColors[colorIdx]}`}>{c.category}</span>
                      {" "}{fmtNum(c.quantity)}
                      {c.avgDays != null && (
                        <span className={catSpeed?.color || ""}>
                          {" "}({c.avgDays}วัน)
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <Chip
                size="md"
                variant={isTop3 ? "solid" : "flat"}
                color={chipColors[(catColorMap[emp.topCategory] ?? 0) % chipColors.length] as any}
                className={isTop3 ? "shadow-sm" : ""}
              >
                {emp.topCategory}
              </Chip>
              {emp.avgLeadTime != null && speed && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-light ${speed.color} ${speed.bg}`}>
                  <Clock className="w-3 h-3" />
                  {emp.avgLeadTime}วัน
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
