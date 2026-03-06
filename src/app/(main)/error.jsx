"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import Link from "next/link";

export default function MainError({ error, reset }) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-2">
        <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-danger-100">
          <CircleAlert className="w-12 h-12 text-danger" />
        </div>
        <h2 className="text-[20px] text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground">
          An error occurred while loading this page.
        </p>
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-600"
          >
            Try again
          </button>
          <Link
            href="/overview/dashboard"
            className="px-4 py-2 rounded-xl border border-border hover:bg-default-100 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
