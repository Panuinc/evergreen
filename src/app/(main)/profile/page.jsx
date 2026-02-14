"use client";

import { useState, useEffect } from "react";
import { Input, Button, Chip, Spinner } from "@heroui/react";
import { User, Lock, Briefcase, Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getProfile, changePassword } from "@/actions/profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChanging(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const { user, employee, roles } = profile || {};

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <h1 className="text-lg font-semibold">My Profile</h1>

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* User Info */}
        <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
          <div className="flex items-center gap-2">
            <User />
            <h2 className="font-semibold">Account Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-default-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-default-500">Created</span>
              <span className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("th-TH")
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-sm text-default-500">Roles</span>
              <div className="flex flex-wrap gap-1">
                {roles?.length > 0 ? (
                  roles.map((role) => (
                    <Chip
                      key={role.roleId}
                      size="sm"
                      variant="flat"
                      color={role.roleIsSuperadmin ? "danger" : "primary"}
                    >
                      {role.roleName}
                    </Chip>
                  ))
                ) : (
                  <span className="text-default-400">No roles assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        {employee && (
          <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
            <div className="flex items-center gap-2">
              <Briefcase />
              <h2 className="font-semibold">Employee Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-default-500">First Name</span>
                <span className="font-medium">
                  {employee.employeeFirstName}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-default-500">Last Name</span>
                <span className="font-medium">
                  {employee.employeeLastName}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-sm text-default-500">
                  <Mail />
                  <span>Email</span>
                </div>
                <span className="font-medium">
                  {employee.employeeEmail || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-sm text-default-500">
                  <Phone />
                  <span>Phone</span>
                </div>
                <span className="font-medium">
                  {employee.employeePhone || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-sm text-default-500">
                  <Building2 />
                  <span>Department</span>
                </div>
                <span className="font-medium">
                  {employee.employeeDepartment || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-default-500">Position</span>
                <span className="font-medium">
                  {employee.employeePosition || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-default-500">Status</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    employee.employeeStatus === "active"
                      ? "success"
                      : "default"
                  }
                >
                  {employee.employeeStatus}
                </Chip>
              </div>
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
          <div className="flex items-center gap-2">
            <Lock />
            <h2 className="font-semibold">Change Password</h2>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              variant="bordered"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              variant="bordered"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              variant="bordered"
            />
            <div className="flex justify-end">
              <Button
                color="primary"
                onPress={handleChangePassword}
                isLoading={changing}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
