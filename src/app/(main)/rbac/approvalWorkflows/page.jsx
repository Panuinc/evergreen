"use client";

import { Workflow } from "lucide-react";

export default function ApprovalWorkflowsPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-default-100">
        <Workflow className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold">เวิร์กโฟลว์อนุมัติ</h1>
      <p className="text-muted-foreground">เร็ว ๆ นี้</p>
    </div>
  );
}
