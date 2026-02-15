import { get, post, put, del } from "@/lib/apiClient";

// ==================== Roles ====================

export async function getRoles() {
  return get("/api/rbac/roles");
}

export async function getRoleById(id) {
  return get(`/api/rbac/roles/${id}`);
}

export async function createRole(roleData) {
  return post("/api/rbac/roles", roleData);
}

export async function updateRole(id, roleData) {
  return put(`/api/rbac/roles/${id}`, roleData);
}

export async function deleteRole(id) {
  return del(`/api/rbac/roles/${id}`);
}

// ==================== Resources ====================

export async function getResources() {
  return get("/api/rbac/resources");
}

export async function createResource(resourceData) {
  return post("/api/rbac/resources", resourceData);
}

export async function updateResource(id, resourceData) {
  return put(`/api/rbac/resources/${id}`, resourceData);
}

export async function deleteResource(id) {
  return del(`/api/rbac/resources/${id}`);
}

// ==================== Actions ====================

export async function getActions() {
  return get("/api/rbac/actions");
}

export async function createAction(actionData) {
  return post("/api/rbac/actions", actionData);
}

export async function updateAction(id, actionData) {
  return put(`/api/rbac/actions/${id}`, actionData);
}

export async function deleteAction(id) {
  return del(`/api/rbac/actions/${id}`);
}

// ==================== Permissions ====================

export async function getPermissions() {
  return get("/api/rbac/permissions");
}

export async function createPermission(permissionData) {
  return post("/api/rbac/permissions", permissionData);
}

export async function deletePermission(id) {
  return del(`/api/rbac/permissions/${id}`);
}

// ==================== Role Permissions ====================

export async function getRolePermissions(roleId) {
  return get(`/api/rbac/rolePermissions/${roleId}`);
}

export async function assignPermissionToRole(roleId, permissionId) {
  return post(`/api/rbac/rolePermissions/${roleId}`, { permissionId });
}

export async function removePermissionFromRole(roleId, permissionId) {
  return del(
    `/api/rbac/rolePermissions/${roleId}?permissionId=${permissionId}`
  );
}

// ==================== User Roles ====================

export async function getUsersWithRoles() {
  return get("/api/rbac/userRoles");
}

export async function getUserRoles(userId) {
  return get(`/api/rbac/userRoles/${userId}`);
}

export async function assignRoleToUser(userId, roleId) {
  return post(`/api/rbac/userRoles/${userId}`, { roleId });
}

export async function removeRoleFromUser(userId, roleId) {
  return del(`/api/rbac/userRoles/${userId}?roleId=${roleId}`);
}

// ==================== Permission Checking ====================

export async function getUserPermissions(userId) {
  return get(`/api/rbac/userPermissions/${userId}`);
}

// ==================== Access Logs ====================

export async function getAccessLogs() {
  return get("/api/rbac/accessLogs");
}

export async function logAccess(
  userId,
  resource,
  action,
  granted,
  metadata = null
) {
  try {
    await post("/api/rbac/accessLogs", {
      userId,
      resource,
      action,
      granted,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log access:", error);
  }
}
