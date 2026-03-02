import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { token_hash, type } = await request.json();

    if (!token_hash || !type) {
      return Response.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (e) {
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
