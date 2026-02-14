import Link from "next/link";
import { CircleHelp, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800">
          <CircleHelp className="w-12 h-12 text-gray-500" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Page Not Found
          </h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
          moved, deleted, or you entered the wrong URL.
        </p>

        <div className="flex flex-row items-center justify-center gap-3 mt-4">
          <Link
            href="/overview/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Home />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
