"use client";

import { MessageCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <MessageCircle />
      <p className="text-xs">เลือกการสนทนาจากรายการด้านซ้าย</p>
      <p className="text-xs">ข้อความจาก Facebook และ LINE จะแสดงที่นี่</p>
    </div>
  );
}
