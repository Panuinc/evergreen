// RBAC Module Types
// Field names = raw Supabase column names (no AS alias from Go backend)

// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface RbacRole {
  rbacRoleId: string;
  rbacRoleName: string;
  rbacRoleDescription: string | null;
  rbacRoleIsSuperadmin: boolean;
  isActive: boolean;
  userCount?: number;
  permissionCount?: number;
}

export interface RbacUserProfile {
  rbacUserProfileId: string;
  rbacUserProfileEmail: string;
  rbacUserProfileCreatedAt: string;
  isActive: boolean;
  roles: RbacRole[];
}

export interface RbacAction {
  rbacActionId: string;
  rbacActionName: string;
  rbacActionDescription: string | null;
  rbacActionCreatedAt: string;
  isActive: boolean;
}

export interface RbacResource {
  rbacResourceId: string;
  rbacResourceName: string;
  rbacResourceModuleRef: string | null;
  rbacResourceDescription: string | null;
  isActive: boolean;
}

export interface RbacPermission {
  rbacPermissionId: string;
  rbacPermissionResourceId: string;
  rbacPermissionActionId: string;
  rbacResource?: Pick<RbacResource, "rbacResourceName">;
  rbacAction?: Pick<RbacAction, "rbacActionName">;
}

export interface RbacRolePermission {
  rbacRolePermissionPermissionId: string;
}

export interface RbacAccessLog {
  rbacAccessLogId: string;
  rbacAccessLogCreatedAt: string;
  rbacAccessLogUserId: string;
  rbacAccessLogResource: string;
  rbacAccessLogAction: string;
  rbacAccessLogGranted: boolean;
}

// ─── HR Employee (unlinked) used in CreateUser flow ──────────────────────────

export interface HrEmployee {
  hrEmployeeId: string;
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeEmail: string | null;
}

// ─── Form State Types ─────────────────────────────────────────────────────────

export interface RoleFormData {
  rbacRoleName: string;
  rbacRoleDescription: string;
  rbacRoleIsSuperadmin: boolean;
}

export interface ActionFormData {
  rbacActionName: string;
  rbacActionDescription: string;
}

export interface ResourceFormData {
  rbacResourceName: string;
  rbacResourceModuleRef: string;
  rbacResourceDescription: string;
}

export interface CreateUserFormData {
  email: string;
  password: string;
  employeeId: string;
}

// ─── Grouped Permission Map (used in Roles modal) ────────────────────────────

export type GroupedPermissions = Record<string, RbacPermission[]>;

// ─── Permission Map (used in Permissions matrix) ─────────────────────────────

export type PermissionMap = Record<string, RbacPermission>;

// ─── User Permission (from /api/rbac/userPermissions/:id) ────────────────────

export interface UserPermissionEntry {
  permission: string;
  isSuperadmin: boolean;
}

// ─── Props Interfaces ─────────────────────────────────────────────────────────

export interface UsersClientProps {
  initialUsers: RbacUserProfile[];
  initialRoles: RbacRole[];
}

export interface UsersViewProps {
  users: RbacUserProfile[];
  allRoles: RbacRole[];
  loading: boolean;
  selectedUser: RbacUserProfile | null;
  userRoleIds: string[];
  saving: boolean;
  isOpen: boolean;
  toggleRole: (roleId: string) => void;
  openRoleAssignment: (user: RbacUserProfile) => void;
  handleCloseRoles: () => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  createForm: CreateUserFormData;
  setCreateForm: (form: CreateUserFormData) => void;
  creating: boolean;
  unlinkedEmployees: HrEmployee[];
  openCreateAccount: () => void;
  handleCreateAccount: () => void;
  resetOpen: boolean;
  setResetOpen: (open: boolean) => void;
  resetTarget: RbacUserProfile | null;
  resetPassword: string;
  setResetPassword: (password: string) => void;
  resetting: boolean;
  openResetPassword: (user: RbacUserProfile) => void;
  handleResetPassword: () => void;
  togglingUserId: string | null;
  handleToggleUserStatus: (user: RbacUserProfile) => void;
}

export interface RolesClientProps {
  initialRoles: RbacRole[];
}

export interface RolesViewProps {
  roles: RbacRole[];
  loading: boolean;
  editingRole: RbacRole | null;
  formData: RoleFormData;
  setFormData: (data: RoleFormData) => void;
  isOpen: boolean;
  onClose: () => void;
  handleOpen: (role?: RbacRole | null) => void;
  handleSave: () => void;
  handleDelete: (role: RbacRole) => void;
  permModalOpen: boolean;
  setPermModalOpen: (open: boolean) => void;
  selectedRole: RbacRole | null;
  permLoading: boolean;
  rolePermIds: string[];
  groupedPermissions: GroupedPermissions;
  openPermissions: (role: RbacRole) => void;
  togglePermission: (permissionId: string) => void;
  toggleActive: (role: RbacRole) => void;
}

export interface PermissionsClientProps {
  initialResources: RbacResource[];
  initialActions: RbacAction[];
  initialPermissions: RbacPermission[];
}

export interface PermissionsViewProps {
  resources: RbacResource[];
  actions: RbacAction[];
  loading: boolean;
  toggling: string | null;
  permMap: PermissionMap;
  togglePermission: (resourceId: string, actionId: string) => void;
}

export interface ActionsClientProps {
  initialActions: RbacAction[];
}

export interface ActionsViewProps {
  actions: RbacAction[];
  loading: boolean;
  editingAction: RbacAction | null;
  formData: ActionFormData;
  setFormData: (data: ActionFormData) => void;
  isOpen: boolean;
  onClose: () => void;
  handleOpen: (action?: RbacAction | null) => void;
  handleSave: () => void;
  handleDelete: (action: RbacAction) => void;
  toggleActive: (action: RbacAction) => void;
}

export interface ResourcesClientProps {
  initialResources: RbacResource[];
}

export interface ResourcesViewProps {
  resources: RbacResource[];
  loading: boolean;
  editingResource: RbacResource | null;
  formData: ResourceFormData;
  setFormData: (data: ResourceFormData) => void;
  isOpen: boolean;
  onClose: () => void;
  handleOpen: (resource?: RbacResource | null) => void;
  handleSave: () => void;
  handleDelete: (resource: RbacResource) => void;
  toggleActive: (resource: RbacResource) => void;
}

export interface AccessLogsViewProps {
  logs: RbacAccessLog[];
  loading: boolean;
}
