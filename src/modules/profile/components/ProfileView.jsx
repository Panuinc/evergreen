"use client";

import { Input, Button, Chip, Spinner } from "@heroui/react";
import { User, Lock, Briefcase, KeyRound } from "lucide-react";
import PinSetupModal from "@/components/auth/PinSetupModal";

export default function ProfileView({
  user,
  employee,
  roles,
  loading,
  passwordForm,
  setPasswordForm,
  changing,
  handleChangePassword,
  pinEnabled,
  pinLoading,
  setupPin,
  showPinSetup,
  setShowPinSetup,
  removingPin,
  handleRemovePin,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-6">
      {/* ข้อมูลบัญชี */}
      <div className="flex flex-col gap-4 p-4 border border-border rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <User />
          ข้อมูลบัญชี
        </div>

        <div className="flex flex-col w-full gap-2">
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-muted-foreground w-20">อีเมล</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-muted-foreground w-20">สร้างเมื่อ</span>
            <span className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("th-TH")
                : "-"}
            </span>
          </div>
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <span className="text-sm text-muted-foreground w-20">สิทธิ์</span>
            <div className="flex flex-wrap gap-1">
              {roles?.length > 0 ? (
                roles.map((role) => (
                  <Chip
                    key={role.rbacRoleId}
                    variant="bordered"
                    size="md"
                    radius="md"
                    color={role.rbacRoleIsSuperadmin ? "danger" : "primary"}
                  >
                    {role.rbacRoleName}
                  </Chip>
                ))
              ) : (
                <span className="text-muted-foreground">ยังไม่ได้กำหนดสิทธิ์</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ข้อมูลพนักงาน */}
      <div className="flex flex-col gap-4 p-4 border border-border rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <Briefcase />
          ข้อมูลพนักงาน
        </div>

        {employee ? (
          <div className="flex flex-col w-full gap-2">
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">ชื่อ</span>
              <span className="font-medium">
                {employee.hrEmployeeFirstName}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">นามสกุล</span>
              <span className="font-medium">
                {employee.hrEmployeeLastName}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">อีเมล</span>
              <span className="font-medium">
                {employee.hrEmployeeEmail || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">โทรศัพท์</span>
              <span className="font-medium">
                {employee.hrEmployeePhone || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">แผนก</span>
              <span className="font-medium">
                {employee.hrEmployeeDepartment || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">ตำแหน่ง</span>
              <span className="font-medium">
                {employee.hrEmployeePosition || "-"}
              </span>
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <span className="text-sm text-muted-foreground w-24">สถานะ</span>
              <Chip
                variant="bordered"
                size="md"
                radius="md"
                color={
                  employee.hrEmployeeStatus === "active" ? "success" : "default"
                }
              >
                {employee.hrEmployeeStatus}
              </Chip>
            </div>
          </div>
        ) : (
          <div className="flex items-center w-full h-fit p-2 gap-2 text-muted-foreground">
            ไม่มีข้อมูลพนักงานเชื่อมกับบัญชีนี้
          </div>
        )}
      </div>

      {/* PIN ปลดล็อกด่วน */}
      <div className="flex flex-col gap-4 p-4 border border-border rounded-xl">
        <div className="flex items-center justify-between w-full h-fit p-2">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound />
            PIN ปลดล็อกด่วน
          </div>
          {!pinLoading && (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={pinEnabled ? "success" : "default"}
            >
              {pinEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Chip>
          )}
        </div>

        <div className="flex flex-col w-full gap-2">
          <p className="text-muted-foreground p-2">
            ตั้ง PIN 6 หลักเพื่อลงชื่อเข้าใช้ด่วน แทนการใส่รหัสผ่านทุกครั้ง
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
                  เปลี่ยน PIN
                </Button>
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  color="danger"
                  onPress={handleRemovePin}
                  isLoading={removingPin}
                >
                  ลบ PIN
                </Button>
              </>
            ) : (
              <Button
                variant="bordered"
                size="md"
                radius="md"
                onPress={() => setShowPinSetup(true)}
              >
                ตั้ง PIN
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="flex flex-col gap-4 p-4 border border-border rounded-xl">
        <div className="flex items-center justify-start w-full h-fit p-2 gap-2 font-semibold">
          <Lock />
          เปลี่ยนรหัสผ่าน
        </div>

        <div className="flex flex-col w-full gap-2">
          <div className="flex items-center w-full h-fit p-2 gap-2">
            <Input
              label="รหัสผ่านปัจจุบัน"
              labelPlacement="outside"
              type="password"
              placeholder="ใส่รหัสผ่านปัจจุบัน"
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
              label="รหัสผ่านใหม่"
              labelPlacement="outside"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
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
              label="ยืนยันรหัสผ่านใหม่"
              labelPlacement="outside"
              type="password"
              placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
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
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </div>
      </div>

      {/* โมดอลตั้ง PIN */}
      <PinSetupModal
        isOpen={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSetup={setupPin}
      />
    </div>
  );
}
