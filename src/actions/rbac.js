import { supabase } from "@/lib/supabase/client";

// ==================== Roles ====================

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*, userRoles:userRoles(count), rolePermissions:rolePermissions(count)")
    .order("roleCreatedAt", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRoleById(id) {
  const { data, error } = await supabase
    .from("roles")
    .select("*, rolePermissions:rolePermissions(*, permissions(*, resources(*), actions(*)))")
    .eq("roleId", id)
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
    .eq("roleId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRole(id) {
  const { error } = await supabase.from("roles").delete().eq("roleId", id);

  if (error) throw error;
  return true;
}

// ==================== Resources ====================

export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("resourceName");

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
    .eq("resourceId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(id) {
  const { error } = await supabase.from("resources").delete().eq("resourceId", id);

  if (error) throw error;
  return true;
}

// ==================== Actions ====================

export async function getActions() {
  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .order("actionName");

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
    .eq("actionId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAction(id) {
  const { error } = await supabase.from("actions").delete().eq("actionId", id);

  if (error) throw error;
  return true;
}

// ==================== Permissions ====================

export async function getPermissions() {
  const { data, error } = await supabase
    .from("permissions")
    .select("*, resources(*), actions(*)")
    .order("permissionCreatedAt", { ascending: false });

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
  const { error } = await supabase.from("permissions").delete().eq("permissionId", id);

  if (error) throw error;
  return true;
}

// ==================== Role Permissions ====================

export async function getRolePermissions(roleId) {
  const { data, error } = await supabase
    .from("rolePermissions")
    .select("*, permissions(*, resources(*), actions(*))")
    .eq("rolePermissionRoleId", roleId);

  if (error) throw error;
  return data;
}

export async function assignPermissionToRole(roleId, permissionId) {
  const { data, error } = await supabase
    .from("rolePermissions")
    .insert([{ rolePermissionRoleId: roleId, rolePermissionPermissionId: permissionId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removePermissionFromRole(roleId, permissionId) {
  const { error } = await supabase
    .from("rolePermissions")
    .delete()
    .eq("rolePermissionRoleId", roleId)
    .eq("rolePermissionPermissionId", permissionId);

  if (error) throw error;
  return true;
}

// ==================== User Roles ====================

export async function getUsersWithRoles() {
  const { data: users, error: usersError } = await supabase
    .from("userProfiles")
    .select("*")
    .order("userProfileCreatedAt", { ascending: false });

  if (usersError) throw usersError;

  const { data: allUserRoles, error: rolesError } = await supabase
    .from("userRoles")
    .select("*, roles(*)");

  if (rolesError) throw rolesError;

  return users.map((user) => ({
    ...user,
    roles: allUserRoles
      .filter((ur) => ur.userRoleUserId === user.userProfileId)
      .map((ur) => ur.roles),
    userRoles: allUserRoles.filter((ur) => ur.userRoleUserId === user.userProfileId),
  }));
}

export async function getUserRoles(userId) {
  const { data, error } = await supabase
    .from("userRoles")
    .select("*, roles(*)")
    .eq("userRoleUserId", userId);

  if (error) throw error;
  return data;
}

export async function assignRoleToUser(userId, roleId) {
  const { data, error } = await supabase
    .from("userRoles")
    .insert([{ userRoleUserId: userId, userRoleRoleId: roleId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeRoleFromUser(userId, roleId) {
  const { error } = await supabase
    .from("userRoles")
    .delete()
    .eq("userRoleUserId", userId)
    .eq("userRoleRoleId", roleId);

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
    .from("accessLogs")
    .select("*")
    .order("accessLogCreatedAt", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data;
}

export async function logAccess(userId, resource, action, granted, metadata = null) {
  const { error } = await supabase
    .from("accessLogs")
    .insert([{
      accessLogUserId: userId,
      accessLogResource: resource,
      accessLogAction: action,
      accessLogGranted: granted,
      accessLogMetadata: metadata,
    }]);

  if (error) console.error("Failed to log access:", error);
}
