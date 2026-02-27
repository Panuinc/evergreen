"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import Loading from "@/components/ui/Loading";
import Image from "next/image";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useSignIn } from "@/hooks/shared/useSignin";
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
  const lastEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("lastSignInEmail") || ""
      : "";

  if (loading || user) {
    return <Loading />;
  }

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
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
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
          ปลดล็อกด่วน
        </div>
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
          ใส่ PIN เพื่อลงชื่อเข้าใช้
        </div>

        <div className="flex flex-col items-center w-full gap-2">
          <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-default-500">
            {lastEmail}
          </div>

          <div className="flex items-center justify-center w-10/12 h-fit p-4 gap-2">
            <PinInput
              value={pin}
              onChange={setPin}
              onComplete={handlePinVerify}
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
              ปลดล็อก
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
            ลงชื่อเข้าใช้ด้วยรหัสผ่านแทน
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
        ยินดีต้อนรับกลับ
      </div>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
        ลงชื่อเข้าใช้บัญชีของคุณ
      </div>

      <div className="flex flex-col items-center w-full gap-2">
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="email"
            type="email"
            label="อีเมล"
            labelPlacement="outside"
            placeholder="กรุณาใส่อีเมลของคุณ"
            variant="bordered"
            size="md"
            radius="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="password"
            type="password"
            label="รหัสผ่าน"
            labelPlacement="outside"
            placeholder="กรุณาใส่รหัสผ่านของคุณ"
            variant="bordered"
            size="md"
            radius="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
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
            ลงชื่อเข้าใช้
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
            ปลดล็อกด้วย PIN
          </Button>
        )}
        <span className="text-default-400">
          ติดต่อผู้ดูแลระบบเพื่อขอเข้าถึงบัญชี
        </span>
      </div>
    </>
  );
}
