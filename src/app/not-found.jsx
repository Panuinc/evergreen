import Link from "next/link";
import { CircleHelp, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-2">
        <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-default-100">
          <CircleHelp />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">404</p>
          <p className="text-[20px] text-foreground">
            Page Not Found
          </p>
        </div>

        <p className="text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
          moved, deleted, or you entered the wrong URL.
        </p>

        <div className="flex flex-row items-center justify-center gap-2">
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
