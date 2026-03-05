import { NextResponse } from "next/server";

// Geocode address to lat/lng using Nominatim (free, OpenStreetMap)
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=th`;
  const res = await fetch(url, {
    headers: { "User-Agent": "EverGreenTMS/1.0" },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Get driving distance using OSRM (free, open source)
async function getRouteDistance(originCoords, destCoords) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) return null;
  return {
    distanceMeters: data.routes[0].distance,
    durationSeconds: data.routes[0].duration,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");

  if (!destination) {
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 }
    );
  }

  try {
    // Use provided origin coords or geocode origin address
    let originCoords;
    if (originLat && originLng) {
      originCoords = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    } else if (origin) {
      originCoords = await geocode(origin);
    }

    if (!originCoords) {
      return NextResponse.json(
        { error: "ไม่สามารถหาพิกัดจุดเริ่มต้นได้" },
        { status: 400 }
      );
    }

    // Geocode destination
    const destCoords = await geocode(destination);
    if (!destCoords) {
      return NextResponse.json(
        { error: "ไม่สามารถหาพิกัดปลายทางได้" },
        { status: 400 }
      );
    }

    // Get route distance via OSRM
    const route = await getRouteDistance(originCoords, destCoords);
    if (!route) {
      return NextResponse.json(
        { error: "ไม่สามารถคำนวณเส้นทางได้" },
        { status: 400 }
      );
    }

    const distanceKm = parseFloat((route.distanceMeters / 1000).toFixed(1));
    const durationMin = Math.round(route.durationSeconds / 60);

    return NextResponse.json({
      distanceKm,
      distanceText: `${distanceKm} กม.`,
      durationText: `${Math.floor(durationMin / 60)} ชม. ${durationMin % 60} นาที`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}
