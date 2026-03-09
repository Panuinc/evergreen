"use client";

import Link from "next/link";
import { ShieldAlert, Home, Lock, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-2">
        <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-danger-100">
          <ShieldAlert />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">403</p>
          <p className="text-[20px] text-foreground">
            Access Forbidden
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">
            Sorry, you don&apos;t have permission to access this page. This area
            is restricted and requires additional privileges.
          </p>
          <div className="flex items-center justify-center gap-2 text-danger">
            <Lock />
            <span>Restricted Access</span>
          </div>
        </div>

        <div className="flex flex-row items-center justify-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-default-100 transition-colors"
          >
            <ArrowLeft />
            Go Back
          </button>
          <Link
            href="/overview/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
          >
            <Home />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
