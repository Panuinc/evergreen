"use client";

import useSWR from "swr";
import { get, post, del } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase/client";

export function usePin() {
  const { data, isLoading: loading, mutate } = useSWR(
    "/api/auth/pin",
    (url) => get<{ pinEnabled: boolean; error?: string }>(url),
    { onError: () => {}, revalidateOnFocus: false },
  );
  const pinEnabled = data?.pinEnabled ?? false;
  const checkPinStatus = mutate;

  const setupPin = async (pin) => {
    const result = await post<{ pinEnabled?: boolean; error?: string }>("/api/auth/pin", { pin });
    if (result?.error) throw new Error(result.error);
    mutate({ pinEnabled: true }, { revalidate: false });
    return result;
  };

  const removePin = async () => {
    const result = await del<{ pinEnabled?: boolean; error?: string }>("/api/auth/pin");
    if (result?.error) throw new Error(result.error);
    mutate({ pinEnabled: false }, { revalidate: false });
    return result;
  };

  const verifyPin = async (email: string, pin: string) => {
    const result = await post<{ token_hash: string }>("/api/auth/pin/verify", { email, pin });

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
