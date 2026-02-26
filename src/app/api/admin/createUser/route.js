import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request) {
  // ตรวจสอบว่า user ที่เรียกเป็น authenticated
  const supabaseServer = await createServerClient();
  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ตรวจสอบว่า user มี rbac permission (superadmin หรือ rbac:create)
  const { data: permissions } = await supabaseServer.rpc(
    "get_user_permissions",
    { p_user_id: session.user.id },
  );

  const isSuperAdmin = permissions?.some((p) => p.isSuperadmin);
  const hasRbacCreate = permissions?.some(
    (p) => p.permission === "rbac:create",
  );

  if (!isSuperAdmin && !hasRbacCreate) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse request body
  const { email, password, employeeId } = await request.json();

  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  // สร้าง admin client ด้วย service_role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // สร้าง user ใหม่
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    return Response.json({ error: createError.message }, { status: 400 });
  }

  // ถ้ามี employeeId ให้ผูก user กับ employee
  if (employeeId && newUser.user) {
    const { error: linkError } = await supabaseAdmin
      .from("hrEmployee")
      .update({ hrEmployeeUserId: newUser.user.id })
      .eq("hrEmployeeId", employeeId);

    if (linkError) {
      return Response.json(
        {
          user: newUser.user,
          warning: "User created but failed to link to employee: " + linkError.message,
        },
        { status: 201 },
      );
    }
  }

  return Response.json({ user: newUser.user }, { status: 201 });
}
