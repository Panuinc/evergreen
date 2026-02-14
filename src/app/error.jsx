"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-100">
          <CircleAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
