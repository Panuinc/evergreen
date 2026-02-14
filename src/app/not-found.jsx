"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-default-100">
          <FileQuestion className="w-12 h-12 text-default-500" />
        </div>

        {/* Error Code */}
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">
            Page Not Found
          </h2>
        </div>

        {/* Message */}
        <p className="text-sm text-default-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
          moved, deleted, or you entered the wrong URL.
        </p>

        {/* Actions */}
        <div className="flex flex-row items-center justify-center gap-3 mt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/overview/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
