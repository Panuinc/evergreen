import { withAuth } from "@/app/api/_lib/auth";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET — เช็คว่า user มี PIN หรือยัง
export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data: { user } } = await adminClient.auth.admin.getUserById(
    auth.session.user.id
  );

  return Response.json({
    pinEnabled: !!user?.app_metadata?.pinHash,
  });
}

// POST — ตั้ง PIN ใหม่
export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { pin } = await request.json();

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return Response.json(
      { error: "PIN must be exactly 6 digits" },
      { status: 400 }
    );
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const { error } = await adminClient.auth.admin.updateUserById(
    auth.session.user.id,
    {
      app_metadata: {
        pinHash,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

// DELETE — ลบ PIN
export async function DELETE() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { error } = await adminClient.auth.admin.updateUserById(
    auth.session.user.id,
    {
      app_metadata: {
        pinHash: null,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
