"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
const RoutePlaybackInner = dynamic(() => import("./RoutePlaybackInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <Loading />
    </div>
  ),
});

export default function RoutePlayback(props) {
  return <RoutePlaybackInner {...props} />;
}
