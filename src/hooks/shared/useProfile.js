"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProfile, changePassword } from "@/actions/profile";

export function useProfile() {
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
      toast.error("โหลดข้อมูลโปรไฟล์ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

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
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
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

  return {
    profile,
    loading,
    passwordForm,
    setPasswordForm,
    changing,
    handleChangePassword,
  };
}
