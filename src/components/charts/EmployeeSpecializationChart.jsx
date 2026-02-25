"use client";

import { Chip } from "@heroui/react";
import { Crown, Medal, Trophy, Star, Flame, Zap } from "lucide-react";

const COLORS = [
  "primary",
  "success",
  "warning",
  "danger",
  "secondary",
];

const BAR_GRADIENTS = [
  "from-blue-500 to-blue-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
  "from-rose-500 to-rose-400",
  "from-violet-500 to-violet-400",
];

const BG_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-danger",
  "bg-secondary",
];

function fmtNum(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

function getLevel(qty) {
  if (qty >= 500) return { label: "ปรมาจารย์", icon: Flame, color: "text-red-500" };
  if (qty >= 200) return { label: "ผู้เชี่ยวชาญ", icon: Zap, color: "text-amber-500" };
  if (qty >= 100) return { label: "มือโปร", icon: Star, color: "text-blue-500" };
  if (qty >= 50) return { label: "ชำนาญ", icon: Star, color: "text-emerald-500" };
  return { label: "มือใหม่", icon: Star, color: "text-default-400" };
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
        <div className="absolute inset-0 bg-linear-to-br from-gray-300 to-gray-400 rounded-xl shadow-md" />
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
      <span className="text-sm font-bold text-default-400">#{rank}</span>
    </div>
  );
}

export default function EmployeeSpecializationChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
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
    catColorMap[cat] = i % COLORS.length;
  });

  const maxQty = data[0]?.totalQty || 1;

  return (
    <div className="flex flex-col gap-1">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2 px-1">
        {categories.map((cat, i) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${BG_COLORS[i % BG_COLORS.length]}`} />
            <span className="text-xs text-default-500">{cat}</span>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {data.map((emp, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const barWidth = Math.max(10, (emp.totalQty / maxQty) * 100);
        const level = getLevel(emp.totalQty);
        const LevelIcon = level.icon;

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
            {/* Rank Badge */}
            <RankBadge rank={rank} />

            {/* Player Info */}
            <div className="shrink-0 w-28">
              <div className="truncate">
                <span className={`text-sm font-semibold ${isTop3 ? "text-foreground" : "text-default-600"}`}>
                  {emp.employee}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <LevelIcon className={`w-3 h-3 ${level.color}`} />
                <span className={`text-[10px] font-medium ${level.color}`}>
                  {level.label}
                </span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-default-400 font-medium">
                  ผลงานรวม
                </span>
                <span className={`text-xs font-bold ${isTop3 ? "text-foreground" : "text-default-500"}`}>
                  {fmtNum(emp.totalQty)} ชิ้น
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
                        className={`bg-linear-to-b ${BAR_GRADIENTS[colorIdx]} h-full`}
                        style={{ width: `${pct}%` }}
                        title={`${c.category}: ${fmtNum(c.quantity)} ชิ้น`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Specialty Badge */}
            <div className="shrink-0">
              <Chip
                size="sm"
                variant={isTop3 ? "solid" : "flat"}
                color={COLORS[catColorMap[emp.topCategory] ?? 0]}
                className={isTop3 ? "shadow-sm" : ""}
              >
                {emp.topCategory}
              </Chip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
