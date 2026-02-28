"use client";

import { MessageCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-default-400">
      <MessageCircle size={48} />
      <p className="text-lg">เลือกการสนทนาจากรายการด้านซ้าย</p>
      <p className="text-sm">ข้อความจาก Facebook และ LINE จะแสดงที่นี่</p>
    </div>
  );
}
