"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Color by real-time engine/speed state (Forth Track) or DB status fallback
function getMarkerColor(pos, dbStatus) {
  const engine = pos?.tmsGpsLogEngine ?? pos?.ftEngine;
  const speed = Number(pos?.tmsGpsLogSpeed ?? pos?.gpsLogSpeed ?? 0);
  if (engine === "ON" && speed > 0) return "#f59e0b"; // moving → orange
  if (engine === "ON" && speed === 0) return "#3b82f6"; // idle → blue
  if (engine === "OFF") return "#a1a1aa";              // off → gray
  // fallback to DB status
  const STATUS_COLORS = { available: "#22c55e", in_use: "#f59e0b", maintenance: "#ef4444", retired: "#a1a1aa" };
  return STATUS_COLORS[dbStatus] || "#a1a1aa";
}

function createColoredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (positions.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(
        positions.map((p) => [p.lat, p.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [positions, map]);

  return null;
}

function FlyToVehicle({ selectedVehicleId, positions }) {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicleId) {
      const pos = positions.find((p) => p.vehicleId === selectedVehicleId);
      if (pos) {
        map.flyTo([pos.lat, pos.lng], 15, { duration: 1 });
      }
    }
  }, [selectedVehicleId, positions, map]);

  return null;
}

export default function VehicleMapInner({
  positions = [],
  vehicles = [],
  selectedVehicleId,
  onVehicleClick,
}) {
  const markerData = vehicles
    .map((v) => {
      const vId = v.tmsVehicleId ?? v.vehicleId;
      const pos = positions.find(
        (p) => (p.tmsGpsLogVehicleId ?? p.gpsLogVehicleId) === vId
      );
      if (!pos) return null;
      return {
        vehicleId: vId,
        lat: Number(pos.tmsGpsLogLatitude ?? pos.gpsLogLatitude),
        lng: Number(pos.tmsGpsLogLongitude ?? pos.gpsLogLongitude),
        speed: pos.tmsGpsLogSpeed ?? pos.gpsLogSpeed,
        updatedAt: pos.tmsGpsLogRecordedAt ?? pos.gpsLogRecordedAt,
        name: v.tmsVehicleName ?? v.vehicleName,
        plate: v.tmsVehiclePlateNumber ?? v.vehiclePlateNumber,
        color: getMarkerColor(pos, v.tmsVehicleStatus ?? v.vehicleStatus),
      };
    })
    .filter(Boolean);

  const center = markerData.length > 0
    ? [markerData[0].lat, markerData[0].lng]
    : [13.7563, 100.5018];

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: "100%", width: "100%", minHeight: "400px", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={markerData} />
      <FlyToVehicle selectedVehicleId={selectedVehicleId} positions={markerData} />

      {markerData.map((m) => (
        <Marker
          key={m.vehicleId}
          position={[m.lat, m.lng]}
          icon={createColoredIcon(m.color)}
          eventHandlers={{
            click: () => onVehicleClick?.(m.vehicleId),
          }}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-light">{m.name}</p>
              <p className="text-muted-foreground">{m.plate}</p>
              {m.speed && <p>Speed: {m.speed} km/h</p>}
              {m.updatedAt && (
                <p className="text-muted-foreground text-xs">
                  Updated: {new Date(m.updatedAt).toLocaleString("th-TH")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
