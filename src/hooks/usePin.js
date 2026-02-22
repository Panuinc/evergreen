"use client";

import { useState, useEffect, useCallback } from "react";
import { get, post, del } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase/client";

export function usePin() {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPinStatus = useCallback(async () => {
    try {
      const data = await get("/api/auth/pin");
      setPinEnabled(data.pinEnabled);
    } catch {
      setPinEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  const setupPin = async (pin) => {
    const data = await post("/api/auth/pin", { pin });
    if (data.error) throw new Error(data.error);
    setPinEnabled(true);
    return data;
  };

  const removePin = async () => {
    const data = await del("/api/auth/pin");
    if (data.error) throw new Error(data.error);
    setPinEnabled(false);
    return data;
  };

  const verifyPin = async (email, pin) => {
    const res = await fetch("/api/auth/pin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "การยืนยันล้มเหลว");
    }

    // ใช้ token_hash จาก magiclink เพื่อ verify OTP → ได้ session
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });

    if (error) throw new Error(error.message);

    return { success: true };
  };

  return {
    pinEnabled,
    loading,
    setupPin,
    removePin,
    verifyPin,
    checkPinStatus,
  };
}
