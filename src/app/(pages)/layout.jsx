"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Key,
  LayoutDashboard,
  FoldHorizontal,
  User,
  Computer,
  DollarSign,
  ShoppingCart,
  Megaphone,
  Settings,
  Package,
  Factory,
  BadgeCheck,
  Lightbulb,
  HeadphonesIcon,
  Truck,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Wallet,
  Receipt,
  BarChart3,
  Target,
  Mail,
  Globe,
  Boxes,
  ClipboardList,
  Wrench,
  Phone,
  MessageCircle,
  MapPin,
  Scale,
  FileCheck,
  Plus,
  List,
  Search,
  PieChart,
  CreditCard,
  Server,
  Shield,
  FlaskConical,
  TrendingDown,
  ScanLine,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ChevronDown,
  Lock,
  Zap,
  GitBranch,
  Workflow,
  LogOut,
  Home,
  Activity,
  Clock,
  Star,
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
import { Building2, AlertTriangle } from "lucide-react";

const menuData = [
  {
    id: "overview",
    name: "Overview",
    icon: LayoutDashboard,
    href: "/overview/dashboard",
    subMenus: [
      { name: "Overview", icon: Home, href: "/overview/dashboard" },
      { name: "Analytics", icon: BarChart3, href: "/overview/analytics" },
      { name: "Activities", icon: Activity, href: "/overview/activities" },
      { name: "Recent Updates", icon: Clock, href: "/overview/updates" },
      { name: "Favorites", icon: Star, href: "/overview/favorites" },
      { name: "Reports", icon: FileText, href: "/overview/reports" },
    ],
  },
  {
    id: "hr",
    name: "Human Resources",
    icon: User,
    href: "/hr/employees",
    subMenus: [
      { name: "Employee List", icon: Users, href: "/hr/employees" },
      { name: "Departments", icon: Building2, href: "/hr/departments" },
      { name: "Recruitment", icon: Briefcase },
      { name: "Attendance", icon: Calendar },
      { name: "Payroll", icon: Wallet },
      { name: "Performance", icon: Target },
    ],
  },
  {
    id: "it",
    name: "Information Technology",
    icon: Computer,
    subMenus: [
      { name: "Assets", icon: Server },
      { name: "Help Desk", icon: HeadphonesIcon },
      { name: "System Access", icon: Shield },
      { name: "Network", icon: Globe },
      { name: "Software", icon: FileText },
      { name: "Security", icon: Shield },
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    icon: DollarSign,
    subMenus: [
      { name: "General Ledger", icon: FileText },
      { name: "Accounts Payable", icon: Receipt },
      { name: "Accounts Receivable", icon: CreditCard },
      { name: "Budget", icon: PieChart },
      { name: "Financial Reports", icon: BarChart3 },
      { name: "Tax", icon: FileCheck },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: TrendingUp,
    subMenus: [
      { name: "Leads", icon: Target },
      { name: "Opportunities", icon: Briefcase },
      { name: "Quotations", icon: FileText },
      { name: "Orders", icon: ShoppingCart },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: BarChart3 },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: Megaphone,
    subMenus: [
      { name: "Campaigns", icon: Target },
      { name: "Social Media", icon: Globe },
      { name: "Email Marketing", icon: Mail },
      { name: "Events", icon: Calendar },
      { name: "Analytics", icon: BarChart3 },
      { name: "Content", icon: FileText },
    ],
  },
  {
    id: "operations",
    name: "Operations",
    icon: Settings,
    subMenus: [
      { name: "Process Management", icon: ClipboardList },
      { name: "Resource Planning", icon: Calendar },
      { name: "KPI Dashboard", icon: BarChart3 },
      { name: "Workflow", icon: List },
      { name: "Reports", icon: FileText },
      { name: "Audit", icon: FileCheck },
    ],
  },
  {
    id: "procurement",
    name: "Procurement",
    icon: ShoppingCart,
    subMenus: [
      { name: "Purchase Requests", icon: FileText },
      { name: "Purchase Orders", icon: ClipboardList },
      { name: "Vendors", icon: Users },
      { name: "Contracts", icon: FileCheck },
      { name: "Negotiations", icon: Target },
      { name: "Spend Analysis", icon: PieChart },
    ],
  },
  {
    id: "production",
    name: "Production",
    icon: Factory,
    subMenus: [
      { name: "Production Plan", icon: Calendar },
      { name: "Work Orders", icon: ClipboardList },
      { name: "BOM", icon: List },
      { name: "Machine Status", icon: Settings },
      { name: "Efficiency", icon: TrendingUp },
      { name: "Maintenance", icon: Wrench },
    ],
  },
  {
    id: "qa",
    name: "Quality Assurance",
    icon: BadgeCheck,
    subMenus: [
      { name: "Inspections", icon: ScanLine },
      { name: "Test Reports", icon: FileText },
      { name: "NCR", icon: AlertTriangle },
      { name: "CAPA", icon: Target },
      { name: "Standards", icon: FileCheck },
      { name: "Audits", icon: Shield },
    ],
  },
  {
    id: "rnd",
    name: "R&D",
    icon: Lightbulb,
    subMenus: [
      { name: "Projects", icon: Briefcase },
      { name: "Experiments", icon: FlaskConical },
      { name: "Prototypes", icon: Settings },
      { name: "Patents", icon: FileCheck },
      { name: "Research", icon: Search },
      { name: "Innovation", icon: Lightbulb },
    ],
  },
  {
    id: "cs",
    name: "Customer Service",
    icon: HeadphonesIcon,
    subMenus: [
      { name: "Tickets", icon: ClipboardList },
      { name: "Call Center", icon: Phone },
      { name: "Live Chat", icon: MessageCircle },
      { name: "Feedback", icon: FileText },
      { name: "FAQ", icon: List },
      { name: "SLA", icon: Target },
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    icon: Truck,
    subMenus: [
      { name: "Shipments", icon: Truck },
      { name: "Tracking", icon: MapPin },
      { name: "Carriers", icon: Users },
      { name: "Routes", icon: MapPin },
      { name: "Delivery", icon: Package },
      { name: "Freight", icon: Boxes },
    ],
  },
  {
    id: "warehouse",
    name: "Warehouse",
    icon: Package,
    subMenus: [
      { name: "Inventory", icon: Boxes },
      { name: "Receiving", icon: Plus },
      { name: "Picking", icon: List },
      { name: "Stock Check", icon: Search },
      { name: "Locations", icon: MapPin },
      { name: "Transfers", icon: Truck },
    ],
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    icon: FileText,
    subMenus: [
      { name: "Contracts", icon: FileCheck },
      { name: "Regulations", icon: Scale },
      { name: "Policies", icon: FileText },
      { name: "Litigation", icon: Shield },
      { name: "Compliance", icon: BadgeCheck },
      { name: "Risk", icon: TrendingDown },
    ],
  },
  {
    id: "rbac",
    name: "Access Control",
    icon: Shield,
    subMenus: [
      { name: "Roles", icon: Key },
      { name: "Users", icon: Users },
      { name: "Resources", icon: Server },
      { name: "Actions", icon: Zap },
      { name: "Permissions", icon: Lock },
      { name: "Approval Hierarchy", icon: GitBranch },
      { name: "Approval Workflows", icon: Workflow },
      { name: "Access Logs", icon: FileText },
    ],
  },
];

function findActiveMenuByPathname(pathname) {
  return (
    menuData.find((menu) => {
      if (menu.href && pathname.startsWith(menu.href)) return true;
      if (menu.subMenus) {
        return menu.subMenus.some(
          (sub) => sub.href && pathname.startsWith(sub.href),
        );
      }
      return false;
    }) || menuData[0]
  );
}

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
              <FoldHorizontal
                className={isCollapsed ? "rotate-180" : ""}
              />
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
              <BreadcrumbItem href="/dashboard">Home</BreadcrumbItem>
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
