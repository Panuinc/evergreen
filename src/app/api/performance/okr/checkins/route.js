import { withAuth } from "@/app/api/_lib/auth";
import { computeObjectiveProgress, autoKrStatus } from "@/lib/performance/okrConstants";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const keyResultId = searchParams.get("keyResultId");

  if (!keyResultId) {
    return Response.json({ error: "กรุณาระบุ keyResultId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("okr_checkins")
    .select("*")
    .eq("keyResultId", keyResultId)
    .order("createdAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { keyResultId, newValue, note } = body;

  if (!keyResultId || newValue === undefined) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  // Get current key result
  const { data: kr, error: krError } = await supabase
    .from("okr_key_results")
    .select("*")
    .eq("id", keyResultId)
    .single();

  if (krError || !kr) {
    return Response.json({ error: "ไม่พบ Key Result" }, { status: 404 });
  }

  // Create check-in record
  const { data: checkin, error: checkinError } = await supabase
    .from("okr_checkins")
    .insert([{
      keyResultId,
      previousValue: kr.currentValue,
      newValue: parseFloat(newValue),
      note: note || null,
      createdBy: session.user.id,
    }])
    .select()
    .single();

  if (checkinError) return Response.json({ error: checkinError.message }, { status: 400 });

  // Update key result currentValue and status
  const updatedKr = { ...kr, currentValue: parseFloat(newValue) };
  const newStatus = autoKrStatus(updatedKr);

  await supabase
    .from("okr_key_results")
    .update({
      currentValue: parseFloat(newValue),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", keyResultId);

  // Update objective progress
  const { data: allKrs } = await supabase
    .from("okr_key_results")
    .select("*")
    .eq("objectiveId", kr.objectiveId);

  // Replace the updated KR in the list for accurate calculation
  const krsForCalc = (allKrs || []).map((k) =>
    k.id === keyResultId ? { ...k, currentValue: parseFloat(newValue) } : k,
  );
  const progress = computeObjectiveProgress(krsForCalc);

  await supabase
    .from("okr_objectives")
    .update({ progress, updatedAt: new Date().toISOString() })
    .eq("id", kr.objectiveId);

  return Response.json(checkin, { status: 201 });
}
