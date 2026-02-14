import { supabase } from "@/lib/supabase/client";

// ==================== Roles ====================

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*, user_roles(count), role_permissions(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRoleById(id) {
  const { data, error } = await supabase
    .from("roles")
    .select("*, role_permissions(*, permissions(*, resources(*), actions(*)))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRole(roleData) {
  const { data, error } = await supabase
    .from("roles")
    .insert([roleData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRole(id, roleData) {
  const { data, error } = await supabase
    .from("roles")
    .update(roleData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRole(id) {
  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== Resources ====================

export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createResource(resourceData) {
  const { data, error } = await supabase
    .from("resources")
    .insert([resourceData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateResource(id, resourceData) {
  const { data, error } = await supabase
    .from("resources")
    .update(resourceData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(id) {
  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== Actions ====================

export async function getActions() {
  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createAction(actionData) {
  const { data, error } = await supabase
    .from("actions")
    .insert([actionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAction(id, actionData) {
  const { data, error } = await supabase
    .from("actions")
    .update(actionData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAction(id) {
  const { error } = await supabase.from("actions").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== Permissions ====================

export async function getPermissions() {
  const { data, error } = await supabase
    .from("permissions")
    .select("*, resources(*), actions(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPermission(permissionData) {
  const { data, error } = await supabase
    .from("permissions")
    .insert([permissionData])
    .select("*, resources(*), actions(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deletePermission(id) {
  const { error } = await supabase.from("permissions").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== Role Permissions ====================

export async function getRolePermissions(roleId) {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("*, permissions(*, resources(*), actions(*))")
    .eq("role_id", roleId);

  if (error) throw error;
  return data;
}

export async function assignPermissionToRole(roleId, permissionId) {
  const { data, error } = await supabase
    .from("role_permissions")
    .insert([{ role_id: roleId, permission_id: permissionId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removePermissionFromRole(roleId, permissionId) {
  const { error } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId)
    .eq("permission_id", permissionId);

  if (error) throw error;
  return true;
}

// ==================== User Roles ====================

export async function getUsersWithRoles() {
  const { data: users, error: usersError } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (usersError) throw usersError;

  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("*, roles(*)");

  if (rolesError) throw rolesError;

  return users.map((user) => ({
    ...user,
    roles: userRoles
      .filter((ur) => ur.user_id === user.id)
      .map((ur) => ur.roles),
    user_roles: userRoles.filter((ur) => ur.user_id === user.id),
  }));
}

export async function getUserRoles(userId) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*, roles(*)")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function assignRoleToUser(userId, roleId) {
  const { data, error } = await supabase
    .from("user_roles")
    .insert([{ user_id: userId, role_id: roleId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeRoleFromUser(userId, roleId) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId);

  if (error) throw error;
  return true;
}

// ==================== Permission Checking ====================

export async function getUserPermissions(userId) {
  const { data, error } = await supabase.rpc("get_user_permissions", {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}

// ==================== Access Logs ====================

export async function getAccessLogs() {
  const { data, error } = await supabase
    .from("access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data;
}

export async function logAccess(userId, resource, action, granted, metadata = null) {
  const { error } = await supabase
    .from("access_logs")
    .insert([{ user_id: userId, resource, action, granted, metadata }]);

  if (error) console.error("Failed to log access:", error);
}
