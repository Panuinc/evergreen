"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { EVALUATION_CATEGORIES } from "@/lib/evaluationCriteria";

const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function SpiderChart({
  datasets = [],
  height = 350,
  showLegend = true,
}) {
  if (!datasets.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">
        ยังไม่มีข้อมูล
      </p>
    );
  }

  // Transform data for Recharts RadarChart format
  const radarData = EVALUATION_CATEGORIES.map((cat) => {
    const point = {
      label: `${cat.emoji} ${cat.name}`,
      shortLabel: cat.name,
    };
    datasets.forEach((ds) => {
      point[ds.label] = ds.data?.[cat.key] || 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid strokeOpacity={0.3} />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#888" }}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tickCount={6}
          tick={{ fontSize: 10 }}
          axisLine={false}
        />
        {datasets.map((ds, i) => (
          <Radar
            key={ds.label}
            name={ds.label}
            dataKey={ds.label}
            stroke={ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            fill={ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            fillOpacity={ds.fillOpacity ?? 0.15}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
        <Tooltip
          formatter={(value) => [parseFloat(value).toFixed(2), null]}
          contentStyle={{
            backgroundColor: "rgba(0,0,0,0.8)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
