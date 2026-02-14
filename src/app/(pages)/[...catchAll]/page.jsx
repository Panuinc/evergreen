"use client";

import Link from "next/link";

export default function CatchAllPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800">
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
            className="text-gray-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        {/* Error Code */}
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Page Not Found
          </h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>

        {/* Actions */}
        <div className="flex flex-row items-center justify-center gap-3 mt-4">
          <Link
            href="/overview/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
