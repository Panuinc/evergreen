"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@heroui/react";

const VehicleMapInner = dynamic(() => import("./VehicleMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Spinner />
    </div>
  ),
});

export default function VehicleMap(props) {
  return <VehicleMapInner {...props} />;
}
