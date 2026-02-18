"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@heroui/react";

const RoutePlaybackInner = dynamic(() => import("./RoutePlaybackInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <Spinner />
    </div>
  ),
});

export default function RoutePlayback(props) {
  return <RoutePlaybackInner {...props} />;
}
