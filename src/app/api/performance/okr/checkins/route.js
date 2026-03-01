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
    .from("perfOkrCheckin")
    .select("*")
    .eq("perfOkrCheckinKeyResultId", keyResultId)
    .order("perfOkrCheckinCreatedAt", { ascending: false });

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
    .from("perfOkrKeyResult")
    .select("*")
    .eq("perfOkrKeyResultId", keyResultId)
    .single();

  if (krError || !kr) {
    return Response.json({ error: "ไม่พบ Key Result" }, { status: 404 });
  }

  // Create check-in record
  const { data: checkin, error: checkinError } = await supabase
    .from("perfOkrCheckin")
    .insert([{
      perfOkrCheckinKeyResultId: keyResultId,
      perfOkrCheckinPreviousValue: kr.perfOkrKeyResultCurrentValue,
      perfOkrCheckinNewValue: parseFloat(newValue),
      perfOkrCheckinNote: note || null,
      perfOkrCheckinCreatedBy: session.user.id,
    }])
    .select()
    .single();

  if (checkinError) return Response.json({ error: checkinError.message }, { status: 400 });

  // Update key result currentValue and status
  const updatedKr = { ...kr, perfOkrKeyResultCurrentValue: parseFloat(newValue) };
  const newStatus = autoKrStatus(updatedKr);

  await supabase
    .from("perfOkrKeyResult")
    .update({
      perfOkrKeyResultCurrentValue: parseFloat(newValue),
      perfOkrKeyResultStatus: newStatus,
      perfOkrKeyResultUpdatedAt: new Date().toISOString(),
    })
    .eq("perfOkrKeyResultId", keyResultId);

  // Update objective progress
  const { data: allKrs } = await supabase
    .from("perfOkrKeyResult")
    .select("*")
    .eq("perfOkrKeyResultObjectiveId", kr.perfOkrKeyResultObjectiveId)
    .eq("isActive", true);

  // Replace the updated KR in the list for accurate calculation
  const krsForCalc = (allKrs || []).map((k) =>
    k.perfOkrKeyResultId === keyResultId ? { ...k, perfOkrKeyResultCurrentValue: parseFloat(newValue) } : k,
  );
  const progress = computeObjectiveProgress(krsForCalc);

  await supabase
    .from("perfOkrObjective")
    .update({ perfOkrObjectiveProgress: progress, perfOkrObjectiveUpdatedAt: new Date().toISOString() })
    .eq("perfOkrObjectiveId", kr.perfOkrKeyResultObjectiveId);

  return Response.json(checkin, { status: 201 });
}
