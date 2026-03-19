"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export function useSignIn() {
  const { user, loading } = useAuth();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const [mode, setMode] = useState("password");
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);


  const lastEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("lastSignInEmail") || ""
      : "";


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


      try {
        localStorage.setItem("lastSignInEmail", email);
      } catch {}

      window.location.href = "/overview/dashboard";
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      setIsLoading(false);
    }
  };


  const handlePinVerify = async (pinValue) => {
    const currentPin = pinValue || pin;
    if (!lastEmail) {
      toast.error(
        "ไม่พบการลงชื่อเข้าใช้ก่อนหน้า กรุณาลงชื่อเข้าใช้ด้วยรหัสผ่านก่อน",
      );
      setMode("password");
      return;
    }
    if (currentPin.length !== 6) {
      toast.error("กรุณาใส่ PIN 6 หลัก");
      return;
    }

    setPinLoading(true);
    setPinError(false);

    try {
      const res = await fetch("/api/auth/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastEmail, pin: currentPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPinError(true);
        setPin("");
        if (data.attemptsLeft !== undefined) {
          toast.error(`${data.error} (เหลืออีก ${data.attemptsLeft} ครั้ง)`);
        } else {
          toast.error(data.error);
        }
        setPinLoading(false);
        return;
      }


      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (error) {
        toast.error(error.message);
        setPinLoading(false);
        return;
      }

      window.location.href = "/overview/dashboard";
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      setPinLoading(false);
    }
  };


  const switchToPin = () => setMode("pin");
  const switchToPassword = () => {
    setMode("password");
    setPin("");
    setPinError(false);
  };

  return {

    user,
    loading,
    mode,
    lastEmail,


    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSignIn,


    pin,
    setPin,
    pinLoading,
    pinError,
    handlePinVerify,


    switchToPin,
    switchToPassword,
  };
}
