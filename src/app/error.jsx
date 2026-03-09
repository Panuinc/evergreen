"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-2">
        <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-danger-100">
          <CircleAlert className="w-12 h-12 text-danger" />
        </div>
        <p className="text-[20px] text-foreground">Something went wrong</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
