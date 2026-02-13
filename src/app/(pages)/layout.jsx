"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useTheme } from "@/components/ThemeProvider";

const menuData = [
  {
    id: "hr",
    name: "Human Resources",
    icon: User,
    subMenus: [
      { name: "Employee List", icon: Users },
      { name: "Recruitment", icon: Briefcase },
      { name: "Attendance", icon: Calendar },
      { name: "Payroll", icon: Wallet },
      { name: "Performance", icon: Target },
      { name: "Training", icon: Lightbulb },
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
];

function AlertTriangle({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function PagesLayout({ children }) {
  const [activeMenu, setActiveMenu] = useState(menuData[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
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
            className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full hover:bg-default transition-colors cursor-pointer"
            title={
              theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
            }
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            1
          </div>
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            2
          </div>
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            3
          </div>
          <div className="flex items-center justify-center w-40 h-full p-2 gap-2 border-2 border-default rounded-full">
            Name + Avatar
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center w-full min-h-0 flex-1 border-t-1 border-default">
        <div
          className={`flex flex-row items-center justify-center min-h-0 h-full border-r-1 border-default transition-all duration-300 ${isCollapsed ? "w-[15%]" : "w-3/12"}`}
        >
          <div
            className={`flex flex-col items-center justify-center min-h-0 h-full gap-2 border-r-1 border-default transition-all duration-300 ${isCollapsed ? "w-fit" : "w-6/12"}`}
          >
            <div
              className={`flex items-center justify-start w-full h-fit px-4 py-2 gap-2 border-b-2 border-default ${isCollapsed ? "justify-center" : ""}`}
            >
              <LayoutDashboard />
              {!isCollapsed && "Dashboard"}
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              {menuData.map((menu) => {
                const Icon = menu.icon;
                const isActive = activeMenu.id === menu.id;
                return (
                  <div
                    key={menu.id}
                    onClick={() => setActiveMenu(menu)}
                    className={`flex flex-row items-center w-full h-fit p-2 gap-2 rounded-xl cursor-pointer transition-colors ${
                      isCollapsed ? "justify-center" : "justify-start"
                    } ${isActive ? "bg-default" : "hover:bg-default"}`}
                  >
                    <div className="flex items-center justify-center w-fit h-full gap-2">
                      <Icon className={isActive ? "" : ""} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center justify-start w-full h-full gap-2">
                        {menu.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-start w-full h-fit px-4 py-2 gap-2 border-t-2 border-default cursor-pointer"
            >
              <FoldHorizontal className={isCollapsed ? "rotate-180" : ""} />
              {!isCollapsed && "Collapse Menu"}
            </div>
            <div className="flex items-center justify-start w-full h-fit px-4 py-2 gap-2 border-t-2 border-default">
              <Key />
              {!isCollapsed && "Logout"}
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center min-h-0 h-full gap-2 border-l-1 border-default transition-all duration-300 ${isCollapsed ? "flex-1" : "w-6/12"}`}
          >
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-b-2 border-default">
              {activeMenu.name}
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              {activeMenu.subMenus.map((subMenu, index) => {
                const Icon = subMenu.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 rounded-xl cursor-pointer hover:bg-default"
                  >
                    <div className="flex items-center justify-center w-fit h-full gap-2">
                      <Icon />
                    </div>
                    <div className="flex items-center justify-start w-full h-full gap-2">
                      {subMenu.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-start min-h-0 h-full gap-2 border-l-1 border-default overflow-hidden transition-all duration-300 ${isCollapsed ? "w-[85%]" : "w-9/12"}`}
        >
          <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-default">
            <Breadcrumbs className="h-[18px]">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Music</BreadcrumbItem>
              <BreadcrumbItem>Artist</BreadcrumbItem>
              <BreadcrumbItem>Album</BreadcrumbItem>
              <BreadcrumbItem>Song</BreadcrumbItem>
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
