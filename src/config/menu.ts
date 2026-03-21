import type React from "react";
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
  Truck,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Calendar,
  CalendarDays,
  Receipt,
  BarChart3,
  Target,
  Boxes,
  ClipboardList,
  MessageCircle,
  MapPin,
  FileCheck,
  List,
  CreditCard,
  Server,
  Shield,
  Lock,
  Zap,
  GitBranch,
  Workflow,
  Home,
  Activity,
  Building2,
  RefreshCw,
  Landmark,
  ImagePlus,
  Tag,
  ArrowLeftRight,
  PenTool,
} from "lucide-react";

export interface SubMenuItem {
  name: string;
  icon: React.ElementType;
  href?: string;
  badgeKey?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  icon: React.ElementType;
  href?: string;
  subMenus?: SubMenuItem[];
}

export const menuData: MenuItem[] = [
  {
    id: "overview",
    name: "ภาพรวม",
    icon: LayoutDashboard,
    href: "/overview/dashboard",
    subMenus: [
      { name: "ภาพรวม", icon: Home, href: "/overview/dashboard" },
    ],
  },
  {
    id: "hr",
    name: "ทรัพยากรบุคคล",
    icon: User,
    href: "/hr/employees",
    subMenus: [
      { name: "ทรัพยากรบุคคล", icon: LayoutDashboard, href: "/hr/dashboard" },
      { name: "รายชื่อพนักงาน", icon: Users, href: "/hr/employees" },
      { name: "ฝ่าย", icon: Building2, href: "/hr/divisions" },
      { name: "แผนก", icon: Building2, href: "/hr/departments" },
      { name: "ตำแหน่ง", icon: Briefcase, href: "/hr/positions" },
    ],
  },
  {
    id: "it",
    name: "เทคโนโลยีสารสนเทศ",
    icon: Computer,
    href: "/it/dashboard",
    subMenus: [
      { name: "แดชบอร์ด IT", icon: LayoutDashboard, href: "/it/dashboard" },
      { name: "ทรัพย์สิน", icon: Server, href: "/it/assets" },
      { name: "พัฒนาระบบ", icon: GitBranch, href: "/it/devRequests" },
    ],
  },
  {
    id: "finance",
    name: "การเงินและบัญชี",
    icon: DollarSign,
    href: "/finance/dashboard",
    subMenus: [
      { name: "แดชบอร์ด", icon: LayoutDashboard, href: "/finance/dashboard" },
      { name: "งบทดลอง", icon: FileText, href: "/finance/trialBalance" },
      { name: "ลูกหนี้", icon: Receipt, href: "/finance/agedReceivables" },
      { name: "เจ้าหนี้", icon: CreditCard, href: "/finance/agedPayables" },
      { name: "ใบแจ้งหนี้ขาย", icon: FileText, href: "/finance/salesInvoices" },
      {
        name: "ใบแจ้งหนี้ซื้อ",
        icon: FileCheck,
        href: "/finance/purchaseInvoices",
      },
      {
        name: "ติดตามลูกหนี้",
        icon: ClipboardList,
        href: "/finance/collections",
      },
    ],
  },
  {
    id: "sales",
    name: "การขาย",
    icon: TrendingUp,
    href: "/sales/dashboard",
    subMenus: [
      { name: "แดชบอร์ด", icon: LayoutDashboard, href: "/sales/dashboard" },
      { name: "ลีด", icon: Target, href: "/sales/leads" },
      { name: "ผู้ติดต่อ", icon: Users, href: "/sales/contacts" },
      { name: "บัญชีลูกค้า", icon: Building2, href: "/sales/accounts" },
      { name: "โอกาสขาย", icon: Briefcase, href: "/sales/opportunities" },
      { name: "ใบเสนอราคา", icon: FileText, href: "/sales/quotations" },
      { name: "คำสั่งซื้อ", icon: ShoppingCart, href: "/sales/orders" },
      { name: "กิจกรรม", icon: Calendar, href: "/sales/activities" },
      { name: "รายงาน", icon: BarChart3, href: "/sales/reports" },
      { name: "โปรเจค BCI", icon: Landmark, href: "/sales/bci-projects" },
    ],
  },
  {
    id: "marketing",
    name: "การตลาด",
    icon: Megaphone,
    href: "/marketing/omnichannel",
    subMenus: [
      { name: "วิเคราะห์", icon: BarChart3, href: "/marketing/analytics" },
      {
        name: "คำสั่งขาย",
        icon: ShoppingCart,
        href: "/marketing/salesOrders",
      },
      {
        name: "ใบเสนอราคา",
        icon: FileText,
        href: "/marketing/omnichannel/quotations",
      },
      {
        name: "รายการราคา",
        icon: Package,
        href: "/marketing/omnichannel/stockItems",
      },
      {
        name: "โปรโมชั่น",
        icon: Tag,
        href: "/marketing/omnichannel/promotions",
      },
      {
        name: "สินค้าที่เกี่ยวข้อง",
        icon: ArrowLeftRight,
        href: "/marketing/omnichannel/relatedProducts",
      },
      {
        name: "แชทรวมช่องทาง",
        icon: MessageCircle,
        href: "/marketing/omnichannel",
      },
      {
        name: "AI สร้างรูปภาพ",
        icon: ImagePlus,
        href: "/marketing/imageGen",
      },
      {
        name: "ออกแบบฉลาก",
        icon: PenTool,
        href: "/marketing/labelDesigner",
      },
      {
        name: "ใบสั่งงาน",
        icon: ClipboardList,
        href: "/marketing/workOrders",
      },
    ],
  },

  {
    id: "production",
    name: "การผลิต",
    icon: Factory,
    href: "/production/dashboard",
    subMenus: [
      {
        name: "แดชบอร์ด",
        icon: LayoutDashboard,
        href: "/production/dashboard",
      },
      { name: "ใบสั่งผลิต", icon: FileText, href: "/production/orders" },
      {
        name: "รายการเคลื่อนไหว",
        icon: ClipboardList,
        href: "/production/entries",
      },
      { name: "กำไรราย FG", icon: BarChart3, href: "/production/profit" },
      { name: "สถานะตั๋วผลิต", icon: ClipboardList, href: "/production/fgCoverage" },
      { name: "BOM", icon: List, href: "/production/bom" },
    ],
  },

  {
    id: "logistics",
    name: "ระบบขนส่ง",
    icon: Truck,
    href: "/tms/dashboard",
    subMenus: [
      { name: "แดชบอร์ด", icon: LayoutDashboard, href: "/tms/dashboard" },

      { name: "แผนส่งของ", icon: CalendarDays, href: "/tms/deliveryPlans" },
      { name: "การขนส่ง", icon: Package, href: "/tms/shipments" },
      { name: "การจัดส่ง", icon: FileCheck, href: "/tms/deliveries" },
      { name: "ติดตาม GPS", icon: MapPin, href: "/tms/tracking" },

      { name: "ยานพาหนะ", icon: Truck, href: "/tms/vehicles" },

      { name: "บันทึกน้ำมัน", icon: Boxes, href: "/tms/fuelLogs" },
    ],
  },
  {
    id: "warehouse",
    name: "คลังสินค้า",
    icon: Package,
    href: "/warehouse/inventory",
    subMenus: [
      { name: "ภาพรวมคลัง", icon: Boxes, href: "/warehouse/inventory" },
    ],
  },
  {
    id: "bc",
    name: "365 Business Central",
    icon: Building2,
    href: "/bc/customers",
    subMenus: [
      { name: "ลูกค้า", icon: Users, href: "/bc/customers" },
      { name: "สินค้า", icon: Package, href: "/bc/items" },
      { name: "คำสั่งขาย", icon: ShoppingCart, href: "/bc/salesOrders" },
    ],
  },
  {
    id: "settings",
    name: "ตั้งค่า",
    icon: Settings,
    href: "/settings/configCheck",
    subMenus: [
      {
        name: "ตั้งค่าระบบ",
        icon: Activity,
        href: "/settings/configCheck",
      },
      { name: "ซิงค์ BC", icon: RefreshCw, href: "/settings/sync-bc" },
    ],
  },
  {
    id: "rbac",
    name: "ควบคุมการเข้าถึง",
    icon: Shield,
    href: "/rbac/roles",
    subMenus: [
      { name: "บทบาท", icon: Key, href: "/rbac/roles" },
      { name: "ผู้ใช้", icon: Users, href: "/rbac/users" },
      { name: "ทรัพยากร", icon: Server, href: "/rbac/resources" },
      { name: "การดำเนินการ", icon: Zap, href: "/rbac/actions" },
      { name: "สิทธิ์", icon: Lock, href: "/rbac/permissions" },
      {
        name: "ลำดับการอนุมัติ",
        icon: GitBranch,
        href: "/rbac/approvalHierarchy",
      },
      {
        name: "เวิร์กโฟลว์อนุมัติ",
        icon: Workflow,
        href: "/rbac/approvalWorkflows",
      },
      { name: "บันทึกการเข้าถึง", icon: FileText, href: "/rbac/accessLogs" },
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
