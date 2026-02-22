import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { email, pin } = await request.json();

  if (!email || !pin) {
    return Response.json(
      { error: "กรุณาระบุอีเมลและ PIN" },
      { status: 400 }
    );
  }

  // หา user จาก email
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    return Response.json({ error: "ข้อผิดพลาดของเซิร์ฟเวอร์" }, { status: 500 });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return Response.json({ error: "อีเมลหรือ PIN ไม่ถูกต้อง" }, { status: 401 });
  }

  const meta = user.app_metadata || {};

  // เช็คว่ามี PIN หรือยัง
  if (!meta.pinHash) {
    return Response.json(
      { error: "บัญชีนี้ยังไม่ได้ตั้ง PIN" },
      { status: 400 }
    );
  }

  // เช็ค lockout
  if (meta.pinLockedUntil) {
    const lockedUntil = new Date(meta.pinLockedUntil);
    if (lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((lockedUntil - new Date()) / 60000);
      return Response.json(
        { error: `บัญชีถูกล็อก กรุณาลองอีกครั้งใน ${minutesLeft} นาที`, locked: true },
        { status: 429 }
      );
    }
  }

  // เทียบ PIN
  const isMatch = await bcrypt.compare(pin, meta.pinHash);

  if (!isMatch) {
    const attempts = (meta.pinFailedAttempts || 0) + 1;
    const updateData = { pinFailedAttempts: attempts };

    if (attempts >= MAX_ATTEMPTS) {
      updateData.pinLockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      updateData.pinFailedAttempts = 0;
    }

    await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: { ...meta, ...updateData },
    });

    if (attempts >= MAX_ATTEMPTS) {
      return Response.json(
        { error: "ใส่ผิดหลายครั้งเกินไป บัญชีถูกล็อก 15 นาที", locked: true },
        { status: 429 }
      );
    }

    return Response.json(
      { error: "อีเมลหรือ PIN ไม่ถูกต้อง", attemptsLeft: MAX_ATTEMPTS - attempts },
      { status: 401 }
    );
  }

  // PIN ถูกต้อง — reset failed attempts
  await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: { ...meta, pinFailedAttempts: 0, pinLockedUntil: null },
  });

  // สร้าง magic link สำหรับ auto sign-in
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });

  if (linkError) {
    return Response.json({ error: "สร้างเซสชันล้มเหลว" }, { status: 500 });
  }

  // ส่ง hashed_token + verification_type กลับให้ client ใช้ verifyOtp
  return Response.json({
    success: true,
    token_hash: linkData.properties.hashed_token,
    email: user.email,
  });
}
