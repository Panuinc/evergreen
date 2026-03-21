"use client";

import {
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/themeProvider";
import { useAuth } from "@/contexts/authContext";

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-row items-center justify-center w-full h-fit gap-2 border-b border-border">
      <div className="flex flex-row items-center justify-start w-full h-full p-2 gap-2">
        {}
        <button
          onClick={onMobileMenuToggle}
          className="flex md:hidden items-center justify-center w-9 h-9 border border-border rounded-full hover:bg-default/50 transition-colors cursor-pointer"
        >
          <Menu />
        </button>
        Evergreen By CHH Industry
      </div>
      <div className="hidden md:flex flex-row items-center justify-center w-full h-full p-2 gap-2">
        {" "}
      </div>
      <div className="flex flex-row items-center justify-end w-full h-full p-2 gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 border border-border rounded-full hover:bg-default/50 transition-colors cursor-pointer"
          title={theme === "light" ? "สลับเป็นโหมดมืด" : "สลับเป็นโหมดสว่าง"}
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </button>

        <button className="relative flex items-center justify-center w-9 h-9 border border-border rounded-full hover:bg-default/50 transition-colors cursor-pointer">
          <Bell />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-xs bg-danger text-background rounded-full px-1">
            3
          </span>
        </button>

        <button className="relative flex items-center justify-center w-9 h-9 border border-border rounded-full hover:bg-default/50 transition-colors cursor-pointer">
          <MessageSquare />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-xs bg-primary text-background rounded-full px-1">
            5
          </span>
        </button>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button className="flex items-center gap-2 h-9 pl-1 pr-3 border border-border rounded-full hover:bg-default/50 transition-colors cursor-pointer">
              <Avatar
                src="https://i.pravatar.cc/150?u=user"
                className="w-7 h-7"
              />
              <span className="hidden md:inline font-light">
                {user?.email?.split("@")[0] || "ผู้ใช้"}
              </span>
              <ChevronDown />
            </button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions">
            <DropdownItem key="profile" onPress={() => router.push("/profile")}>
              โปรไฟล์ของฉัน
            </DropdownItem>
            <DropdownItem key="settings">ตั้งค่า</DropdownItem>
            <DropdownItem key="help">ช่วยเหลือและสนับสนุน</DropdownItem>
            <DropdownItem
              key="logout"
              className="text-danger"
              onPress={signOut}
            >
              ออกจากระบบ
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
