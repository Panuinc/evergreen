import { withAuth } from "@/app/api/_lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function PUT(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { session } = auth;
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return Response.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const verifyClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );

  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: session.user.email,
    password: currentPassword,
  });

  if (signInError) {
    return Response.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    session.user.id,
    { password: newPassword }
  );

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
