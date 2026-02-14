"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
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
