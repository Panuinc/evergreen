"use client";

import { useState } from "react";
import { toast } from "sonner";
import { put } from "@/lib/apiClient";
import { usePin } from "@/hooks/shared/usePin";
import ProfileView from "@/modules/profile/components/ProfileView";

export default function ProfileClient({ initialProfile }) {
  const { user, employee, roles } = initialProfile || {};

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changing, setChanging] = useState(false);

  const { pinEnabled, loading: pinLoading, setupPin, removePin } = usePin();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [removingPin, setRemovingPin] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("กรุณากรอกรหัสผ่านให้ครบทุกช่อง");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setChanging(true);
    try {
      await put("/api/profile/changePassword", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "เปลี่ยนรหัสผ่านล้มเหลว");
    } finally {
      setChanging(false);
    }
  };

  const handleRemovePin = async () => {
    setRemovingPin(true);
    try {
      await removePin();
      toast.success("ลบ PIN สำเร็จ");
    } catch (err) {
      toast.error(err.message || "ลบ PIN ล้มเหลว");
    } finally {
      setRemovingPin(false);
    }
  };

  return (
    <ProfileView
      user={user}
      employee={employee}
      roles={roles}
      loading={false}
      passwordForm={passwordForm}
      setPasswordForm={setPasswordForm}
      changing={changing}
      handleChangePassword={handleChangePassword}
      pinEnabled={pinEnabled}
      pinLoading={pinLoading}
      setupPin={setupPin}
      showPinSetup={showPinSetup}
      setShowPinSetup={setShowPinSetup}
      removingPin={removingPin}
      handleRemovePin={handleRemovePin}
    />
  );
}
