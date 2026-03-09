import { Button, Input } from "@heroui/react";
import Image from "next/image";
import { KeyRound } from "lucide-react";

export default function SignInPasswordForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isLoading,
  onSignIn,
  lastEmail,
  onSwitchToPin,
}) {
  return (
    <>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-[16px] font-light">
        <Image
          src="/logo/logo-01.png"
          width={50}
          height={50}
          alt="logo"
          className="border-2 border-border rounded-full"
        />
        ยินดีต้อนรับกลับ
      </div>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-light">
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
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSignIn()}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSignIn()}
          />
        </div>

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            className="w-full"
            isLoading={isLoading}
            onPress={onSignIn}
          >
            ลงชื่อเข้าใช้
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-10/12 h-fit p-2 gap-2">
        {lastEmail && (
          <Button
            variant="light"
            size="md"
            startContent={<KeyRound className="w-4 h-4" />}
            onPress={onSwitchToPin}
          >
            ปลดล็อกด้วย PIN
          </Button>
        )}
        <span className="text-muted-foreground">
          ติดต่อผู้ดูแลระบบเพื่อขอเข้าถึงบัญชี
        </span>
      </div>
    </>
  );
}
