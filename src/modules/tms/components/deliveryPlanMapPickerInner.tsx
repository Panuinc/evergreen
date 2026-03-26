"use client";

import { useEffect, useRef } from "react";
import { MapContainer as _MapContainer, TileLayer as _TileLayer, Marker as _Marker, useMapEvents, useMap } from "react-leaflet";

// react-leaflet v5 restructured types — Leaflet-native props exist at runtime but aren't in TS definitions
const MapContainer = _MapContainer as React.ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const TileLayer = _TileLayer as React.ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const Marker = _Marker as React.ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl; // Leaflet internal property — not exposed in public type definition
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

interface FlyToProps {
  lat: number | null;
  lng: number | null;
}

interface DeliveryPlanMapPickerInnerProps {
  lat: number | null;
  lng: number | null;
  onMapClick: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: FlyToProps) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (lat && lng) {
      const key = `${lat},${lng}`;
      if (key !== prev.current) {
        prev.current = key;
        map.flyTo([lat, lng], 14, { duration: 1 });
      }
    }
  }, [lat, lng, map]);
  return null;
}

export default function DeliveryPlanMapPickerInner({ lat, lng, onMapClick }: DeliveryPlanMapPickerInnerProps) {
  const center = lat && lng ? [lat, lng] : [13.7563, 100.5018];

  return (
    <MapContainer
      center={center}
      zoom={lat && lng ? 14 : 10}
      style={{ height: "220px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <FlyTo lat={lat} lng={lng} />
      {lat && lng && <Marker position={[lat, lng]} />}
    </MapContainer>
  );
}
