import { createClient } from "@supabase/supabase-js";
import { withAuth } from "@/app/api/_lib/auth";

export async function POST(request) {
  // ตรวจสอบว่า user ที่เรียกเป็น authenticated (ใช้ getUser() ที่ verify กับ Auth server)
  const { supabase, session, error: authError } = await withAuth();

  if (authError) return authError;

  // ตรวจสอบว่า user มี rbac permission (superadmin หรือ rbac:create)
  const { data: permissions } = await supabase.rpc(
    "get_user_permissions",
    { p_user_id: session.user.id },
  );

  const isSuperAdmin = permissions?.some((p) => p.is_superadmin);
  const hasRbacCreate = permissions?.some(
    (p) => `${p.resource_name}:${p.action_name}` === "rbac:create",
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

  // สร้าง record ใน rbacUserProfile เพื่อให้แสดงในหน้า users
  if (newUser.user) {
    await supabaseAdmin.from("rbacUserProfile").insert({
      rbacUserProfileId: newUser.user.id,
      rbacUserProfileEmail: newUser.user.email,
    });
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
