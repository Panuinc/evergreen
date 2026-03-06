"use client";

import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-default-100">
        <BarChart3 className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold">วิเคราะห์ข้อมูล</h1>
      <p className="text-muted-foreground">เร็ว ๆ นี้</p>
    </div>
  );
}
