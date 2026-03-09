"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
const VehicleMapInner = dynamic(() => import("./VehicleMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loading />
    </div>
  ),
});

export default function VehicleMap(props) {
  return <VehicleMapInner {...props} />;
}
