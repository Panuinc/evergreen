import { withAuth } from "@/app/api/_lib/auth";

const COMPANY_HQ = { lat: 13.9523, lng: 100.3268 };
const OSRM_BASE = "https://router.project-osrm.org";

const AI_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash-lite";


async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=th`;
  const res = await fetch(url, { headers: { "User-Agent": "EverGreenTMS/1.0" } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}


async function osrmRoute(from, to) {
  const url = `${OSRM_BASE}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) return null;
  return {
    distanceKm: Math.round(data.routes[0].distance / 100) / 10,
    durationMin: Math.round(data.routes[0].duration / 60),
  };
}


async function osrmTrip(coords) {

  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${OSRM_BASE}/trip/v1/driving/${coordStr}?source=first&destination=last&roundtrip=true&overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.trips?.length) return null;
  return data;
}


async function buildDistanceMatrix(points) {
  const coordStr = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE}/table/v1/driving/${coordStr}?annotations=distance,duration`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") return null;
  return {
    distances: data.distances,
    durations: data.durations,
  };
}


const PRIORITY_WEIGHT = { urgent: 100, high: 50, normal: 0, low: -20 };


function priorityAwareTSP(matrix, n, priorities = []) {
  const visited = new Set([0]);
  const order = [0];
  let current = 0;


  const urgentStops = [];
  const highStops = [];
  const normalStops = [];

  for (let i = 1; i < n; i++) {
    const p = priorities[i] || "normal";
    if (p === "urgent") urgentStops.push(i);
    else if (p === "high") highStops.push(i);
    else normalStops.push(i);
  }


  for (const tier of [urgentStops, highStops, normalStops]) {
    const remaining = tier.filter((i) => !visited.has(i));

    while (remaining.length > 0) {
      let nearest = -1;
      let minDist = Infinity;
      for (let j = 0; j < remaining.length; j++) {
        const dist = matrix[current][remaining[j]] || Infinity;
        if (dist < minDist) {
          minDist = dist;
          nearest = j;
        }
      }
      if (nearest === -1) break;
      const nextStop = remaining.splice(nearest, 1)[0];
      visited.add(nextStop);
      order.push(nextStop);
      current = nextStop;
    }
  }

  order.push(0);
  return order;
}


async function callAI(messages) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.3,
      stream: true,
    }),
  });
  if (!res.ok) return null;
  return res;
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { stops, vehicleInfo, usePriority = true } = await request.json();

    if (!stops || !stops.length) {
      return Response.json({ error: "No stops provided" }, { status: 400 });
    }


    const geocoded = [];
    const failedStops = [];

    for (const stop of stops) {
      if (stop.lat && stop.lng) {
        geocoded.push({ ...stop, priority: stop.priority || "normal", coords: { lat: stop.lat, lng: stop.lng } });
      } else if (stop.address) {
        const coords = await geocode(stop.address);
        if (coords) {
          geocoded.push({ ...stop, priority: stop.priority || "normal", coords });
        } else {
          failedStops.push(stop.address);
        }
      }
    }

    if (!geocoded.length) {
      return Response.json({
        error: "ไม่สามารถหาพิกัดจุดส่งได้",
        failedStops,
      }, { status: 400 });
    }


    const allPoints = [
      { ...COMPANY_HQ, name: "โรงงาน (HQ)", priority: "normal" },
      ...geocoded.map((s) => ({ lat: s.coords.lat, lng: s.coords.lng, name: s.name || s.address, priority: s.priority || "normal" })),
    ];
    const priorities = allPoints.map((p) => p.priority || "normal");


    const matrix = await buildDistanceMatrix(allPoints);

    let optimizedOrder;
    let totalDistanceKm = 0;
    let totalDurationMin = 0;
    let routeGeometry = null;


    const tripResult = await osrmTrip(allPoints);


    const hasPriority = usePriority && priorities.some((p) => p === "urgent" || p === "high");

    if (!hasPriority && tripResult && tripResult.waypoints) {

      const waypointOrder = tripResult.waypoints
        .sort((a, b) => a.waypoint_index - b.waypoint_index)
        .map((wp) => wp.waypoint_index);

      optimizedOrder = waypointOrder;
      totalDistanceKm = Math.round(tripResult.trips[0].distance / 100) / 10;
      totalDurationMin = Math.round(tripResult.trips[0].duration / 60);
      routeGeometry = tripResult.trips[0].geometry;
    } else if (matrix) {

      const distMatrix = matrix.distances;
      optimizedOrder = priorityAwareTSP(distMatrix, allPoints.length, priorities);

      for (let i = 0; i < optimizedOrder.length - 1; i++) {
        const from = optimizedOrder[i];
        const to = optimizedOrder[i + 1];
        totalDistanceKm += (distMatrix[from][to] || 0) / 1000;
        totalDurationMin += (matrix.durations[from][to] || 0) / 60;
      }
      totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;
      totalDurationMin = Math.round(totalDurationMin);
    } else {
      return Response.json({ error: "ไม่สามารถคำนวณเส้นทางได้" }, { status: 500 });
    }


    let originalDistanceKm = 0;
    let originalDurationMin = 0;
    if (matrix) {
      const originalOrder = Array.from({ length: allPoints.length }, (_, i) => i);
      originalOrder.push(0);
      for (let i = 0; i < originalOrder.length - 1; i++) {
        const from = originalOrder[i];
        const to = originalOrder[i + 1];
        originalDistanceKm += (matrix.distances[from][to] || 0) / 1000;
        originalDurationMin += (matrix.durations[from][to] || 0) / 60;
      }
      originalDistanceKm = Math.round(originalDistanceKm * 10) / 10;
      originalDurationMin = Math.round(originalDurationMin);
    }


    const optimizedStops = optimizedOrder
      .filter((i) => i !== 0)
      .map((i, seq) => ({
        sequence: seq + 1,
        name: allPoints[i].name,
        lat: allPoints[i].lat,
        lng: allPoints[i].lng,
        priority: allPoints[i].priority || "normal",
      }));


    const uniqueStops = optimizedStops.filter((s, i, arr) =>
      i === 0 || s.name !== arr[i - 1]?.name
    );



    const gmapOrigin = `${COMPANY_HQ.lat},${COMPANY_HQ.lng}`;
    const gmapWaypoints = uniqueStops.map((s) => `${s.lat},${s.lng}`).join("|");
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${gmapOrigin}&destination=${gmapOrigin}&waypoints=${encodeURIComponent(gmapWaypoints)}&travelmode=driving`;


    const legs = [];
    for (let i = 0; i < optimizedOrder.length - 1; i++) {
      const fromIdx = optimizedOrder[i];
      const toIdx = optimizedOrder[i + 1];
      if (matrix) {
        legs.push({
          from: allPoints[fromIdx].name,
          to: allPoints[toIdx].name,
          distanceKm: Math.round((matrix.distances[fromIdx][toIdx] || 0) / 100) / 10,
          durationMin: Math.round((matrix.durations[fromIdx][toIdx] || 0) / 60),
        });
      }
    }

    const saved = originalDistanceKm - totalDistanceKm;


    const systemPrompt = `คุณเป็น AI Route Advisor ของบริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
เชี่ยวชาญการวิเคราะห์เส้นทางขนส่งและให้คำแนะนำการจัดเส้นทางที่ประหยัดเวลาและต้นทุน

## กฎ
- วิเคราะห์จากข้อมูลจริงเท่านั้น
- ตอบเป็นภาษาไทย กระชับ
- ใช้ตาราง Markdown และ **ตัวหนา** สำหรับตัวเลขสำคัญ
- ให้คำแนะนำเชิงปฏิบัติ`;

    const userMessage = `## ผลการจัดเส้นทางที่เหมาะสม

จุดเริ่มต้น: โรงงาน (${COMPANY_HQ.lat}, ${COMPANY_HQ.lng})
จุดส่ง: ${geocoded.length} จุด
${vehicleInfo ? `ยานพาหนะ: ${vehicleInfo}` : ""}

### เส้นทางเดิม (ตามลำดับ)
- ระยะทางรวม: ${originalDistanceKm} กม.
- เวลารวม: ${Math.floor(originalDurationMin / 60)} ชม. ${originalDurationMin % 60} นาที

### เส้นทางที่เหมาะสม (Optimized)
- ระยะทางรวม: ${totalDistanceKm} กม.
- เวลารวม: ${Math.floor(totalDurationMin / 60)} ชม. ${totalDurationMin % 60} นาที
- ประหยัด: ${saved > 0 ? saved.toFixed(1) : 0} กม. (${originalDistanceKm > 0 ? ((saved / originalDistanceKm) * 100).toFixed(1) : 0}%)

### ลำดับจุดส่ง (Optimized)
${legs.map((l, i) => `${i + 1}. ${l.from} → ${l.to}: ${l.distanceKm} กม. (${l.durationMin} นาที)`).join("\n")}

ให้:
1. สรุปผลการ optimize (ประหยัดได้เท่าไหร่ เวลา/ระยะทาง/ต้นทุนน้ำมัน)
2. วิเคราะห์แต่ละ leg ของเส้นทาง
3. คำแนะนำเพิ่มเติม (เวลาออกรถ, ช่วงจราจร, จุดพักรถ)
4. ถ้ามีจุดส่งอยู่ใกล้กันสามารถรวมเที่ยวได้ ให้แนะนำ`;

    const aiRes = await callAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]);

    if (aiRes) {

      const routeData = JSON.stringify({
        optimizedStops: uniqueStops,
        legs,
        totalDistanceKm,
        totalDurationMin,
        originalDistanceKm,
        originalDurationMin,
        savedKm: Math.max(0, saved),
        savedPercent: originalDistanceKm > 0 ? Math.max(0, (saved / originalDistanceKm) * 100) : 0,
        routeGeometry,
        googleMapsUrl,
        failedStops,
      });


      const encoder = new TextEncoder();
      const aiBody = aiRes.body;

      const stream = new ReadableStream({
        async start(controller) {

          controller.enqueue(encoder.encode(`event: routeData\ndata: ${routeData}\n\n`));


          const reader = aiBody.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }


    return Response.json({
      optimizedStops: uniqueStops,
      legs,
      totalDistanceKm,
      totalDurationMin,
      originalDistanceKm,
      originalDurationMin,
      savedKm: Math.max(0, saved),
      savedPercent: originalDistanceKm > 0 ? Math.max(0, (saved / originalDistanceKm) * 100) : 0,
      routeGeometry,
      googleMapsUrl,
      failedStops,
    });
  } catch (error) {
    console.error("Route optimize error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
