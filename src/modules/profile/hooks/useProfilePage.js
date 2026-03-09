"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/shared/useProfile";
import { usePin } from "@/hooks/shared/usePin";

export function useProfilePage() {
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

  const { user, employee, roles } = profile || {};

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

  return {

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
  };
}
