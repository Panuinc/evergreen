import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "กรุณาระบุอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    // Check if user account is active
    const { data: profile } = await supabase
      .from("rbacUserProfile")
      .select("isActive")
      .eq("rbacUserProfileId", data.user.id)
      .single();

    if (profile && profile.isActive === false) {
      await supabase.auth.signOut();
      return Response.json(
        { error: "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      );
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
