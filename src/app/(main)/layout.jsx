"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { menuData, findActiveMenuByPathname } from "@/config/menu";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SubMenuPanel from "@/components/layout/SubMenuPanel";
import ChatBot from "@/components/ui/ChatBot";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeMenu = useMemo(() => {
    if (activeMenuId) {
      const manualMenu = menuData.find((m) => m.id === activeMenuId);
      if (manualMenu) return manualMenu;
    }
    return findActiveMenuByPathname(pathname);
  }, [pathname, activeMenuId]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
      <Header />

      <div className="flex flex-row items-center justify-center w-full min-h-0 flex-1 border-t-1 border-default">
        <div
          className={`flex flex-row items-center justify-center min-h-0 h-full border-r-1 border-default transition-all duration-300 ${
            isCollapsed ? "w-[15%]" : "w-3/12"
          }`}
        >
          <Sidebar
            activeMenu={activeMenu}
            isCollapsed={isCollapsed}
            onMenuSelect={setActiveMenuId}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
          <SubMenuPanel activeMenu={activeMenu} isCollapsed={isCollapsed} />
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
      <ChatBot />
    </div>
  );
}
