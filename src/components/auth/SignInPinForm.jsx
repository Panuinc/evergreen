import { Button } from "@heroui/react";
import Image from "next/image";
import PinInput from "@/components/auth/PinInput";

export default function SignInPinForm({
  lastEmail,
  pin,
  onPinChange,
  onPinVerify,
  pinLoading,
  pinError,
  onSwitchToPassword,
}) {
  return (
    <>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-xs font-light">
        <Image
          src="/logo/logo-01.png"
          width={50}
          height={50}
          alt="logo"
          className="border-2 border-border rounded-full"
        />
        ปลดล็อกด่วน
      </div>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-light">
        ใส่ PIN เพื่อลงชื่อเข้าใช้
      </div>

      <div className="flex flex-col items-center w-full gap-2">
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-muted-foreground">
          {lastEmail}
        </div>

        <div className="flex items-center justify-center w-10/12 h-fit p-4 gap-2">
          <PinInput
            value={pin}
            onChange={onPinChange}
            onComplete={onPinVerify}
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
            onPress={onPinVerify}
            isDisabled={pin.length !== 6}
          >
            ปลดล็อก
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
        <Button variant="light" size="md" onPress={onSwitchToPassword}>
          ลงชื่อเข้าใช้ด้วยรหัสผ่านแทน
        </Button>
      </div>
    </>
  );
}
