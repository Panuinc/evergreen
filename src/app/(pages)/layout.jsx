"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  FoldHorizontal,
  Settings,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { menuData, findActiveMenuByPathname } from "@/config/menu";

export default function PagesLayout({ children }) {
  const pathname = usePathname();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Compute activeMenu from pathname using useMemo to avoid setState in effect
  const activeMenu = useMemo(() => {
    // If user manually selected a menu, use that
    if (activeMenuId) {
      const manualMenu = menuData.find((m) => m.id === activeMenuId);
      if (manualMenu) return manualMenu;
    }
    // Otherwise derive from pathname
    return findActiveMenuByPathname(pathname);
  }, [pathname, activeMenuId]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
      <div className="flex flex-row items-center justify-center w-full h-fit gap-2 border-b-1 border-default">
        <div className="flex flex-row items-center justify-start w-full h-full p-2 gap-2">
          Evergreen By CHH Industry
        </div>
        <div className="flex flex-row items-center justify-center w-full h-full p-2 gap-2">
          {" "}
        </div>
        <div className="flex flex-row items-center justify-end w-full h-full p-2 gap-3">
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
                <span className="text-xs font-medium">
                  {user?.email?.split("@")[0] || "User"}
                </span>
                <ChevronDown />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions">
              <DropdownItem key="profile">My Profile</DropdownItem>
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

      <div className="flex flex-row items-center justify-center w-full min-h-0 flex-1 border-t-1 border-default">
        <div
          className={`flex flex-row items-center justify-center min-h-0 h-full border-r-1 border-default transition-all duration-300 ${
            isCollapsed ? "w-[15%]" : "w-3/12"
          }`}
        >
          <div
            className={`flex flex-col items-center justify-center min-h-0 h-full gap-2 border-r-1 border-default transition-all duration-300 ${
              isCollapsed ? "w-fit" : "w-6/12"
            }`}
          >
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              {menuData.map((menu) => {
                const Icon = menu.icon;
                const isActive = activeMenu.id === menu.id;
                return (
                  <div
                    key={menu.id}
                    onClick={() => setActiveMenuId(menu.id)}
                    className={`flex flex-row items-center w-full h-fit p-2 gap-2 rounded-xl cursor-pointer transition-colors ${
                      isCollapsed ? "justify-center" : "justify-start"
                    } ${isActive ? "bg-default" : "hover:bg-default"}`}
                  >
                    <div className="flex items-center justify-center w-fit h-full gap-2">
                      <Icon />
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center justify-start w-full h-full gap-2 text-xs">
                        {menu.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-start w-full h-fit px-4 py-2 gap-2 border-t-2 border-default cursor-pointer hover:bg-default/50"
            >
              <FoldHorizontal className={isCollapsed ? "rotate-180" : ""} />
              {!isCollapsed && "Collapse Menu"}
            </div>
            <div
              onClick={signOut}
              className="flex items-center justify-start w-full h-fit px-4 py-2 gap-2 border-t-2 border-default cursor-pointer hover:bg-danger/20 text-danger"
            >
              <LogOut />
              {!isCollapsed && "Logout"}
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center min-h-0 h-full gap-2 border-l-1 border-default transition-all duration-300 ${
              isCollapsed ? "flex-1" : "w-6/12"
            }`}
          >
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-b-2 border-default font-semibold">
              {activeMenu.name}
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              {activeMenu.subMenus?.map((subMenu, index) => {
                const Icon = subMenu.icon;
                const href = subMenu.href || "#";
                const isSubActive =
                  subMenu.href && pathname.startsWith(subMenu.href);
                return (
                  <Link
                    key={index}
                    href={href}
                    className={`flex flex-row items-center justify-start w-full h-fit p-2 gap-2 rounded-xl cursor-pointer transition-colors ${
                      isSubActive
                        ? "bg-default font-medium"
                        : "hover:bg-default"
                    }`}
                  >
                    <div className="flex items-center justify-center w-fit h-full gap-2">
                      <Icon />
                    </div>
                    <div className="flex items-center justify-start w-full h-full gap-2 text-xs">
                      {subMenu.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-start min-h-0 h-full gap-2 border-l-1 border-default overflow-hidden transition-all duration-300 ${
            isCollapsed ? "w-[85%]" : "w-9/12"
          }`}
        >
          <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-default">
            <Breadcrumbs className="h-[18px]">
              <BreadcrumbItem href="/overview/dashboard">Home</BreadcrumbItem>
              <BreadcrumbItem>{activeMenu.name}</BreadcrumbItem>
            </Breadcrumbs>
          </div>
          <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
