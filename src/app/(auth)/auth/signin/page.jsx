"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import Loading from "@/components/ui/Loading";
import Image from "next/image";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useSignIn } from "@/hooks/useSignin";
import PinInput from "@/components/auth/PinInput";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    user,
    loading,
    handleSignIn,
  } = useSignIn();

  const [mode, setMode] = useState("password"); // "password" | "pin"
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);

  // ดึง email จาก localStorage ที่จำไว้ตอน login ครั้งก่อน
  const lastEmail = typeof window !== "undefined"
    ? localStorage.getItem("lastSignInEmail") || ""
    : "";

  if (loading || user) {
    return <Loading />;
  }

  const handlePinVerify = async () => {
    if (!lastEmail) {
      toast.error("No previous sign-in found. Please sign in with password first.");
      setMode("password");
      return;
    }
    if (pin.length !== 6) {
      toast.error("Please enter 6-digit PIN");
      return;
    }

    setPinLoading(true);
    setPinError(false);

    try {
      const res = await fetch("/api/auth/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastEmail, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPinError(true);
        setPin("");
        if (data.attemptsLeft !== undefined) {
          toast.error(`${data.error} (${data.attemptsLeft} attempts left)`);
        } else {
          toast.error(data.error);
        }
        setPinLoading(false);
        return;
      }

      // Verify OTP to get session
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
      toast.error("An unexpected error occurred");
      setPinLoading(false);
    }
  };

  if (mode === "pin") {
    return (
      <>
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-[16px] font-semibold">
          <Image
            src="/logo/logo-01.png"
            width={50}
            height={50}
            alt="logo"
            className="border-2 border-default rounded-full"
          />
          Quick Unlock
        </div>
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
          Enter your PIN to sign in
        </div>

        <div className="flex flex-col items-center w-full gap-2">
          <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-default-500">
            {lastEmail}
          </div>

          <div className="flex items-center justify-center w-10/12 h-fit p-4 gap-2">
            <PinInput
              value={pin}
              onChange={setPin}
              error={pinError}
              disabled={pinLoading}
            />
          </div>

          <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
            <Button
              variant="bordered"
              size="md"
              radius="md"
              className="w-full"
              isLoading={pinLoading}
              onPress={handlePinVerify}
              isDisabled={pin.length !== 6}
            >
              Unlock
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Button
            variant="light"
            size="sm"
            onPress={() => {
              setMode("password");
              setPin("");
              setPinError(false);
            }}
          >
            Sign in with password instead
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-[16px] font-semibold">
        <Image
          src="/logo/logo-01.png"
          width={50}
          height={50}
          alt="logo"
          className="border-2 border-default rounded-full"
        />
        Welcome back
      </div>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
        Sign in to your account
      </div>

      <div className="flex flex-col items-center w-full gap-2">
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="email"
            type="email"
            label="Email"
            labelPlacement="outside"
            placeholder="Please enter your email"
            variant="bordered"
            size="md"
            radius="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="password"
            type="password"
            label="Password"
            labelPlacement="outside"
            placeholder="Please enter your password"
            variant="bordered"
            size="md"
            radius="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            className="w-full"
            isLoading={isLoading}
            onPress={handleSignIn}
          >
            Sign In
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-10/12 h-fit p-2 gap-2">
        {lastEmail && (
          <Button
            variant="light"
            size="sm"
            startContent={<KeyRound className="w-4 h-4" />}
            onPress={() => setMode("pin")}
          >
            Unlock with PIN
          </Button>
        )}
        <span className="text-default-400">
          Contact your administrator for account access
        </span>
      </div>
    </>
  );
}
