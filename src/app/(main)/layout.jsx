"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Drawer,
  DrawerContent,
  DrawerBody,
  useDisclosure,
} from "@heroui/react";
import { menuData, findActiveMenuByPathname } from "@/config/menu";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SubMenuPanel from "@/components/layout/SubMenuPanel";
import ChatBot from "@/components/ui/ChatBot";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    isOpen: isMobileNavOpen,
    onOpen: openMobileNav,
    onClose: closeMobileNav,
  } = useDisclosure();

  const activeMenu = useMemo(() => {
    if (activeMenuId) {
      const manualMenu = menuData.find((m) => m.id === activeMenuId);
      if (manualMenu) return manualMenu;
    }
    return findActiveMenuByPathname(pathname);
  }, [pathname, activeMenuId]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
      <Header onMobileMenuToggle={openMobileNav} />

      <div className="flex flex-row items-center justify-center w-full min-h-0 flex-1 border-t-1 border-foreground/15">
        {/* Desktop sidebar - hidden on mobile */}
        <div
          className={`hidden md:flex flex-row items-center justify-center min-h-0 h-full border-r-1 border-foreground/15 transition-all duration-300 ${
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

        {/* Content area - full width on mobile */}
        <div
          className={`flex flex-col items-center justify-start min-h-0 h-full gap-2 md:border-l-1 border-foreground/15 overflow-hidden transition-all duration-300 w-full ${
            isCollapsed ? "md:w-[85%]" : "md:w-9/12"
          }`}
        >
          <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-foreground/15">
            <Breadcrumbs className="h-[18px]">
              <BreadcrumbItem href="/overview/dashboard">หน้าหลัก</BreadcrumbItem>
              <BreadcrumbItem>{activeMenu.name}</BreadcrumbItem>
            </Breadcrumbs>
          </div>
          <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
        placement="left"
        size="sm"
        hideCloseButton
      >
        <DrawerContent>
          <DrawerBody className="p-0">
            <div className="flex flex-row h-full">
              <Sidebar
                activeMenu={activeMenu}
                isCollapsed={false}
                onMenuSelect={(id) => setActiveMenuId(id)}
                onToggleCollapse={() => {}}
              />
              <SubMenuPanel
                activeMenu={activeMenu}
                isCollapsed={false}
                onSubMenuClick={closeMobileNav}
              />
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ChatBot />
    </div>
  );
}
