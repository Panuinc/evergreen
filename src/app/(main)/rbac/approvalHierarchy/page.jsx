"use client";

import { GitBranch } from "lucide-react";

export default function ApprovalHierarchyPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-default-100">
        <GitBranch className="w-8 h-8 text-default-500" />
      </div>
      <h1 className="text-lg font-semibold">Approval Hierarchy</h1>
      <p className="text-default-400">Coming Soon</p>
    </div>
  );
}
