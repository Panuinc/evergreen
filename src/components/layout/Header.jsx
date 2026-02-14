"use client";

import {
  Settings,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-row items-center justify-center w-full h-fit gap-2 border-b-1 border-default">
      <div className="flex flex-row items-center justify-start w-full h-full p-2 gap-2">
        Evergreen By CHH Industry
      </div>
      <div className="flex flex-row items-center justify-center w-full h-full p-2 gap-2">
        {" "}
      </div>
      <div className="flex flex-row items-center justify-end w-full h-full p-2 gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 border border-default rounded-full hover:bg-default/50 transition-colors cursor-pointer"
          title={
            theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
          }
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </button>

        <button className="relative flex items-center justify-center w-9 h-9 border border-default rounded-full hover:bg-default/50 transition-colors cursor-pointer">
          <Bell />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-danger text-background rounded-full px-1">
            3
          </span>
        </button>

        <button className="relative flex items-center justify-center w-9 h-9 border border-default rounded-full hover:bg-default/50 transition-colors cursor-pointer">
          <MessageSquare />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-primary text-background rounded-full px-1">
            5
          </span>
        </button>

        <button className="flex items-center justify-center w-9 h-9 border border-default rounded-full hover:bg-default/50 transition-colors cursor-pointer">
          <Settings />
        </button>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button className="flex items-center gap-2 h-9 pl-1 pr-3 border border-default rounded-full hover:bg-default/50 transition-colors cursor-pointer">
              <Avatar
                size="sm"
                src="https://i.pravatar.cc/150?u=user"
                className="w-7 h-7"
              />
              <span className="font-medium">
                {user?.email?.split("@")[0] || "User"}
              </span>
              <ChevronDown />
            </button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions">
            <DropdownItem key="profile" onPress={() => router.push("/profile")}>My Profile</DropdownItem>
            <DropdownItem key="settings">Settings</DropdownItem>
            <DropdownItem key="help">Help & Support</DropdownItem>
            <DropdownItem
              key="logout"
              className="text-danger"
              color="danger"
              onPress={signOut}
            >
              Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
