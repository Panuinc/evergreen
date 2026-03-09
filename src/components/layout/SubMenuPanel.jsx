"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "@heroui/react";
import { useMenuBadges } from "@/hooks/shared/useMenuBadges";

export default function SubMenuPanel({ activeMenu, isCollapsed, onSubMenuClick }) {
  const pathname = usePathname();
  const badges = useMenuBadges();

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-0 h-full gap-2 transition-all duration-300 ${
        isCollapsed ? "flex-1" : "w-6/12"
      }`}
    >
      <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-b border-border font-light">
        {activeMenu.name}
      </div>
      <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
        {activeMenu.subMenus?.map((subMenu, index) => {
          const Icon = subMenu.icon;
          const href = subMenu.href || "#";
          const isSubActive =
            subMenu.href &&
            pathname.startsWith(subMenu.href) &&
            !activeMenu.subMenus.some(
              (other) =>
                other.href &&
                other.href !== subMenu.href &&
                other.href.startsWith(subMenu.href) &&
                pathname.startsWith(other.href)
            );
          const badgeCount = subMenu.badgeKey ? badges[subMenu.badgeKey] : 0;
          return (
            <Link
              key={index}
              href={href}
              onClick={onSubMenuClick}
              className={`flex flex-row items-center justify-start w-full h-fit p-2 gap-2 rounded-xl cursor-pointer transition-colors ${
                isSubActive
                  ? "border border-border font-light"
                  : "hover:bg-default"
              }`}
            >
              <div className="flex items-center justify-center w-fit h-full gap-2">
                <Icon />
              </div>
              <div className="flex items-center justify-start w-full h-full gap-2">
                {subMenu.name}
              </div>
              {badgeCount > 0 && (
                <Chip size="md" color="danger" variant="solid" className="ml-auto min-w-6 h-5 text-sm">
                  {badgeCount}
                </Chip>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
