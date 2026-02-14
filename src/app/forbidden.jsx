"use client";

import Link from "next/link";
import { ShieldAlert, Home, Lock, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-2">
        <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-danger-100">
          <ShieldAlert className="w-12 h-12 text-danger" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-6xl text-foreground">403</h1>
          <h2 className="text-xl text-foreground">
            Access Forbidden
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-default-500">
            Sorry, you don&apos;t have permission to access this page. This area
            is restricted and requires additional privileges.
          </p>
          <div className="flex items-center justify-center gap-2 text-danger">
            <Lock className="w-3 h-3" />
            <span>Restricted Access</span>
          </div>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 mt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-default-200 hover:bg-default-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/overview/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
