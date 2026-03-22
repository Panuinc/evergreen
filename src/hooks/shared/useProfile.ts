"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get, put } from "@/lib/apiClient";

export function useProfile() {
  const { data: profile, isLoading: loading } = useSWR("/api/profile", (url) => get(url), {
    onError: () => toast.error("โหลดข้อมูลโปรไฟล์ล้มเหลว"),
    revalidateOnFocus: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changing, setChanging] = useState(false);

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

  return {
    profile,
    loading,
    passwordForm,
    setPasswordForm,
    changing,
    handleChangePassword,
  };
}
