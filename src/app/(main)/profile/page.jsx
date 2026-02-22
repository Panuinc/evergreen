"use client";

import { useState } from "react";
import { Input, Button, Chip, Spinner } from "@heroui/react";
import { User, Lock, Briefcase, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { usePin } from "@/hooks/usePin";
import PinSetupModal from "@/components/auth/PinSetupModal";

export default function ProfilePage() {
  const {
    profile,
    loading,
    passwordForm,
    setPasswordForm,
    changing,
    handleChangePassword,
  } = useProfile();

  const { pinEnabled, loading: pinLoading, setupPin, removePin } = usePin();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [removingPin, setRemovingPin] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  const { user, employee, roles } = profile || {};

  const handleRemovePin = async () => {
    setRemovingPin(true);
    try {
      await removePin();
      toast.success("PIN removed successfully");
    } catch (err) {
      toast.error(err.message || "Failed to remove PIN");
    } finally {
      setRemovingPin(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-6">
      {/* Account Information */}
      <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <User />
          Account Information
        </div>

        <div className="flex flex-col w-full gap-2">
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-default-500 w-20">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-default-500 w-20">Created</span>
            <span className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("th-TH")
                : "-"}
            </span>
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-default-500 w-20">Roles</span>
            <div className="flex flex-wrap gap-1">
              {roles?.length > 0 ? (
                roles.map((role) => (
                  <Chip
                    key={role.roleId}
                    variant="bordered"
                    size="md"
                    radius="md"
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

      {/* Employee Information */}
      <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <Briefcase />
          Employee Information
        </div>

        {employee ? (
          <div className="flex flex-col w-full gap-2">
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">First Name</span>
              <span className="font-medium">
                {employee.employeeFirstName}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Last Name</span>
              <span className="font-medium">
                {employee.employeeLastName}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Email</span>
              <span className="font-medium">
                {employee.employeeEmail || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Phone</span>
              <span className="font-medium">
                {employee.employeePhone || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Department</span>
              <span className="font-medium">
                {employee.employeeDepartment || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Position</span>
              <span className="font-medium">
                {employee.employeePosition || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-default-500 w-24">Status</span>
              <Chip
                variant="bordered"
                size="md"
                radius="md"
                color={
                  employee.employeeStatus === "active" ? "success" : "default"
                }
              >
                {employee.employeeStatus}
              </Chip>
            </div>
          </div>
        ) : (
          <div className="flex items-center w-full h-fit p-2 gap-2 text-default-400">
            No employee record linked to this account
          </div>
        )}
      </div>

      {/* Quick Unlock PIN */}
      <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
        <div className="flex items-center justify-between w-full h-fit p-2">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound />
            Quick Unlock PIN
          </div>
          {!pinLoading && (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={pinEnabled ? "success" : "default"}
            >
              {pinEnabled ? "Enabled" : "Disabled"}
            </Chip>
          )}
        </div>

        <div className="flex flex-col w-full gap-2">
          <p className="text-default-500 p-2">
            Set a 6-digit PIN for quick sign in instead of entering your password every time.
          </p>
          <div className="flex items-center justify-end w-full h-fit p-2 gap-2">
            {pinEnabled ? (
              <>
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  onPress={() => setShowPinSetup(true)}
                >
                  Change PIN
                </Button>
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  color="danger"
                  onPress={handleRemovePin}
                  isLoading={removingPin}
                >
                  Remove PIN
                </Button>
              </>
            ) : (
              <Button
                variant="bordered"
                size="md"
                radius="md"
                onPress={() => setShowPinSetup(true)}
              >
                Set PIN
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="flex flex-col gap-4 p-4 border border-default rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <Lock />
          Change Password
        </div>

        <div className="flex flex-col w-full gap-2">
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <Input
              label="Current Password"
              labelPlacement="outside"
              type="password"
              placeholder="Enter current password"
              variant="bordered"
              size="md"
              radius="md"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <Input
              label="New Password"
              labelPlacement="outside"
              type="password"
              placeholder="At least 6 characters"
              variant="bordered"
              size="md"
              radius="md"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <Input
              label="Confirm New Password"
              labelPlacement="outside"
              type="password"
              placeholder="Re-enter new password"
              variant="bordered"
              size="md"
              radius="md"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center justify-end w-full h-fit p-2 gap-2">
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleChangePassword}
              isLoading={changing}
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSetup={setupPin}
      />
    </div>
  );
}
