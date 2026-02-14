"use client";

import { FoldHorizontal, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { menuData } from "@/config/menu";

export default function Sidebar({
  activeMenu,
  isCollapsed,
  onMenuSelect,
  onToggleCollapse,
}) {
  const { signOut } = useAuth();

  return (
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
              onClick={() => onMenuSelect(menu.id)}
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
        onClick={onToggleCollapse}
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
  );
}
