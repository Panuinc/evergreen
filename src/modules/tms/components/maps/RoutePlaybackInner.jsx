"use client";

import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@heroui/react";
import { Play, Pause, SkipBack } from "lucide-react";

function FitRoute({ points }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [points, map]);

  return null;
}

export default function RoutePlaybackInner({ gpsLogs = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);

  const points = gpsLogs.map((l) => [
    Number(l.gpsLogLatitude),
    Number(l.gpsLogLongitude),
  ]);

  useEffect(() => {
    if (playing && currentIndex < points.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= points.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, points.length, currentIndex]);

  const handleReset = () => {
    setPlaying(false);
    setCurrentIndex(0);
  };

  if (points.length === 0) {
    return <p className="text-sm text-default-400 text-center py-8">No route data available</p>;
  }

  const traveled = points.slice(0, currentIndex + 1);
  const currentLog = gpsLogs[currentIndex];

  return (
    <div className="flex flex-col gap-3">
      <MapContainer
        center={points[0]}
        zoom={12}
        style={{ height: "350px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute points={points} />

        {/* Full route path (light) */}
        <Polyline positions={points} color="#94a3b8" weight={2} dashArray="5,5" />

        {/* Traveled path */}
        <Polyline positions={traveled} color="#3b82f6" weight={3} />

        {/* Current position */}
        <CircleMarker
          center={points[currentIndex]}
          radius={8}
          fillColor="#3b82f6"
          fillOpacity={1}
          color="white"
          weight={3}
        >
          <Popup>
            <div className="text-sm">
              {currentLog?.gpsLogSpeed && <p>Speed: {currentLog.gpsLogSpeed} km/h</p>}
              {currentLog?.gpsLogRecordedAt && (
                <p>{new Date(currentLog.gpsLogRecordedAt).toLocaleString("th-TH")}</p>
              )}
            </div>
          </Popup>
        </CircleMarker>

        {/* Start marker */}
        <CircleMarker center={points[0]} radius={6} fillColor="#22c55e" fillOpacity={1} color="white" weight={2} />

        {/* End marker */}
        {points.length > 1 && (
          <CircleMarker center={points[points.length - 1]} radius={6} fillColor="#ef4444" fillOpacity={1} color="white" weight={2} />
        )}
      </MapContainer>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="bordered"
          size="md"
          radius="md"
          onPress={handleReset}
        >
          <SkipBack size={14} />
        </Button>
        <Button
          isIconOnly
          variant="bordered"
          size="md"
          radius="md"
          onPress={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </Button>
        <div className="flex gap-1">
          {[1, 2, 5, 10].map((s) => (
            <Button
              key={s}
              variant={speed === s ? "solid" : "bordered"}
              size="md"
              radius="md"
              onPress={() => setSpeed(s)}
              className="min-w-8"
            >
              {s}x
            </Button>
          ))}
        </div>
        <span className="text-xs text-default-400 ml-auto">
          {currentIndex + 1} / {points.length} points
        </span>
      </div>

      {/* Timeline slider */}
      <input
        type="range"
        min={0}
        max={points.length - 1}
        value={currentIndex}
        onChange={(e) => {
          setPlaying(false);
          setCurrentIndex(Number(e.target.value));
        }}
        className="w-full"
      />
    </div>
  );
}
