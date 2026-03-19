"use client";

import useSWR from "swr";
import { get, post, del } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase/client";

export function usePin() {
  const { data, isLoading: loading, mutate } = useSWR(
    "/api/auth/pin",
    (url) => get(url),
    { onError: () => {} },
  );
  const pinEnabled = data?.pinEnabled ?? false;
  const checkPinStatus = mutate;

  const setupPin = async (pin) => {
    const result = await post("/api/auth/pin", { pin });
    if (result.error) throw new Error(result.error);
    mutate({ pinEnabled: true }, { revalidate: false });
    return result;
  };

  const removePin = async () => {
    const result = await del("/api/auth/pin");
    if (result.error) throw new Error(result.error);
    mutate({ pinEnabled: false }, { revalidate: false });
    return result;
  };

  const verifyPin = async (email, pin) => {
    const res = await fetch("/api/auth/pin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "การยืนยันล้มเหลว");
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
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
