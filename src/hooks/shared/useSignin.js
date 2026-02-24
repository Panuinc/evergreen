"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export function useSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("กรุณาใส่อีเมลและรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          toast.error(error.message || "การยืนยันตัวตนล้มเหลว");
        }
        setIsLoading(false);
        return;
      }

      // จำ email ไว้สำหรับ PIN quick unlock
      try { localStorage.setItem("lastSignInEmail", email); } catch {}

      window.location.href = "/overview/dashboard";
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    user,
    loading,
    handleSignIn,
  };
}
