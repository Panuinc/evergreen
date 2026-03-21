"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { Search, MapPin, X } from "lucide-react";

const MapInner = dynamic(() => import("./deliveryPlanMapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full rounded-xl bg-default-100 flex items-center justify-center">
      <span className="text-xs text-muted-foreground">กำลังโหลดแผนที่...</span>
    </div>
  ),
});

export default function DeliveryPlanMapPicker({ lat, lng, address, onLocationChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=th`,
        { headers: { "Accept-Language": "th" } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat: newLat, lon: newLng, display_name } = results[0];
        onLocationChange(parseFloat(newLat), parseFloat(newLng), display_name);
      }
    } catch {

    } finally {
      setSearching(false);
    }
  };

  const handleMapClick = async (clickLat, clickLng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json&accept-language=th`
      );
      const result = await res.json();
      onLocationChange(clickLat, clickLng, result.display_name || `${clickLat}, ${clickLng}`);
    } catch {
      onLocationChange(clickLat, clickLng, `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`);
    }
  };

  const handleClear = () => {
    onLocationChange(null, null, "");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      {}
      <div className="flex gap-2">
        <Input
          placeholder="ค้นหาสถานที่..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<MapPin className="text-muted-foreground" />}
          size="md"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button
          size="md"
          variant="flat"
          isIconOnly
          onPress={handleSearch}
          isLoading={searching}
        >
          <Search />
        </Button>
        {(lat || address) && (
          <Button size="md" variant="flat" color="danger" isIconOnly onPress={handleClear}>
            <X />
          </Button>
        )}
      </div>

      {}
      {address && (
        <p className="text-xs text-muted-foreground truncate px-1">{address}</p>
      )}

      {}
      <MapInner lat={lat} lng={lng} onMapClick={handleMapClick} />

      <p className="text-xs text-muted-foreground text-center">
        คลิกบนแผนที่เพื่อกำหนดจุดส่ง หรือค้นหาด้วยชื่อสถานที่
      </p>
    </div>
  );
}
