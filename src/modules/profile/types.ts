// Profile module types
// Field names match raw Supabase column names returned by Go backend (no AS aliases)

export interface ProfileUser {
  id: string;
  email: string | null;
  createdAt?: string | null;
}

export interface ProfileEmployee {
  hrEmployeeId: string;
  hrEmployeeFirstName: string;
  hrEmployeeLastName: string;
  hrEmployeeEmail: string | null;
  hrEmployeePhone: string | null;
  isActive: boolean;
  hrDivisionName: string | null;
  hrDepartmentName: string | null;
  hrPositionTitle: string | null;
}

export interface ProfileRole {
  rbacRoleId: string;
  rbacRoleName: string;
  rbacRoleIsSuperadmin: boolean;
}

export interface ProfileData {
  user: ProfileUser;
  employee: ProfileEmployee | null;
  roles: ProfileRole[];
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileClientProps {
  initialProfile: ProfileData | null;
}

export interface ProfileViewProps {
  user: ProfileUser | undefined;
  employee: ProfileEmployee | null | undefined;
  roles: ProfileRole[] | undefined;
  loading: boolean;
  passwordForm: PasswordForm;
  setPasswordForm: (form: PasswordForm) => void;
  changing: boolean;
  handleChangePassword: () => Promise<void>;
  pinEnabled: boolean;
  pinLoading: boolean;
  setupPin: (pin: string) => Promise<unknown>;
  showPinSetup: boolean;
  setShowPinSetup: (show: boolean) => void;
  removingPin: boolean;
  handleRemovePin: () => Promise<void>;
}
