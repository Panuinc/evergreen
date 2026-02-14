"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubMenuPanel({ activeMenu, isCollapsed }) {
  const pathname = usePathname();

  return (
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
              <div className="flex items-center justify-start w-full h-full gap-2">
                {subMenu.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
