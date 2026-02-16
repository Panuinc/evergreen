import {
  Key,
  LayoutDashboard,
  User,
  Computer,
  DollarSign,
  ShoppingCart,
  Megaphone,
  Settings,
  Package,
  Factory,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Wallet,
  Receipt,
  BarChart3,
  Target,
  Globe,
  ClipboardList,
  Wrench,
  CreditCard,
  Server,
  Shield,
  Lock,
  Zap,
  GitBranch,
  Workflow,
  Home,
  Activity,
  Clock,
  Star,
  Building2,
  Truck,
  Boxes,
  Paintbrush,
  CheckCircle,
  PackageCheck,
  Cog,
  PenTool,
} from "lucide-react";

export const menuData = [
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
      { name: "Human Resources", icon: LayoutDashboard, href: "/hr/dashboard" },
      { name: "Employee List", icon: Users, href: "/hr/employees" },
      { name: "Departments", icon: Building2, href: "/hr/departments" },
      { name: "Positions", icon: Briefcase, href: "/hr/positions" },
      { name: "Recruitment", icon: Briefcase, href: "/hr/recruitment" },
      { name: "Candidates", icon: Users, href: "/hr/candidates" },
      { name: "Attendance", icon: Calendar },
      { name: "Payroll", icon: Wallet },
      { name: "Performance", icon: Target },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: TrendingUp,
    subMenus: [
      { name: "Project Sales", icon: Briefcase },
      { name: "Dealer Sales", icon: ShoppingCart },
      { name: "Quotations", icon: FileText },
      { name: "Orders", icon: ClipboardList },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: BarChart3 },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: Megaphone,
    subMenus: [
      { name: "Digital Marketing", icon: Globe },
      { name: "Graphic Design", icon: PenTool },
      { name: "Campaigns", icon: Target },
      { name: "Analytics", icon: BarChart3 },
      { name: "Content", icon: FileText },
    ],
  },
  {
    id: "production",
    name: "Production",
    icon: Factory,
    subMenus: [
      { name: "Planning", icon: Calendar },
      { name: "Warehouse", icon: Boxes },
      { name: "Logistics", icon: Truck },
      { name: "Design & CNC", icon: Cog },
      { name: "Production Line", icon: ClipboardList },
      { name: "Painting", icon: Paintbrush },
      { name: "QC", icon: CheckCircle },
      { name: "Grading & Packing", icon: PackageCheck },
      { name: "WPC Production", icon: Factory },
      { name: "Maintenance", icon: Wrench },
    ],
  },
  {
    id: "it",
    name: "Information Technology",
    icon: Computer,
    subMenus: [
      { name: "Development", icon: Server },
      { name: "System Access", icon: Shield },
      { name: "Software", icon: FileText },
    ],
  },
  {
    id: "accounting",
    name: "Accounting",
    icon: DollarSign,
    subMenus: [
      { name: "Accounts Receivable", icon: CreditCard },
      { name: "Accounts Payable", icon: Receipt },
      { name: "General Ledger", icon: FileText },
      { name: "Financial Reports", icon: BarChart3 },
    ],
  },
  {
    id: "bc",
    name: "365 Business Central",
    icon: Building2,
    href: "/bc/customers",
    subMenus: [
      { name: "Customers", icon: Users, href: "/bc/customers" },
      { name: "Items", icon: Package, href: "/bc/items" },
      { name: "Sales Orders", icon: ShoppingCart, href: "/bc/salesOrders" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    href: "/settings/configCheck",
    subMenus: [
      { name: "Config Check", icon: Activity, href: "/settings/configCheck" },
    ],
  },
  {
    id: "rbac",
    name: "Access Control",
    icon: Shield,
    href: "/rbac/roles",
    subMenus: [
      { name: "Roles", icon: Key, href: "/rbac/roles" },
      { name: "Users", icon: Users, href: "/rbac/users" },
      { name: "Resources", icon: Server, href: "/rbac/resources" },
      { name: "Actions", icon: Zap, href: "/rbac/actions" },
      { name: "Permissions", icon: Lock, href: "/rbac/permissions" },
      {
        name: "Approval Hierarchy",
        icon: GitBranch,
        href: "/rbac/approvalHierarchy",
      },
      {
        name: "Approval Workflows",
        icon: Workflow,
        href: "/rbac/approvalWorkflows",
      },
      { name: "Access Logs", icon: FileText, href: "/rbac/accessLogs" },
    ],
  },
];

export function findActiveMenuByPathname(pathname) {
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
