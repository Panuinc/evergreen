"use client";

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
} from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";

export default function PagesLayout({ children }) {
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
        <div className="flex flex-row items-center justify-center w-3/12 min-h-0 h-full border-r-1 border-default">
          <div className="flex flex-col items-center justify-center w-6/12 min-h-0 h-full gap-2 border-r-1 border-default">
            <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-default">
              <LayoutDashboard /> Dashboard
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <User />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Human Resources
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Computer />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Information Technology
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <DollarSign />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Finance & Accounting
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <TrendingUp />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Sales
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Megaphone />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Marketing
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Settings />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Operations
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <ShoppingCart />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Procurement
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Factory />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Production
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <BadgeCheck />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Quality Assurance
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Lightbulb />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  R&D
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <HeadphonesIcon />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Customer Service
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Truck />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Logistics
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <Package />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Warehouse
                </div>
              </div>
              <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                <div className="flex items-center justify-center w-fit h-full gap-2">
                  <FileText />
                </div>
                <div className="flex items-center justify-start w-full h-full gap-2">
                  Legal & Compliance
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-t-2 border-default">
              <FoldHorizontal /> Collapse Menu
            </div>
            <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-t-2 border-default">
              <Key /> Logout
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-6/12 min-h-0 h-full gap-2 border-l-1 border-default">
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-b-2 border-default">
              4
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                Sub Menu 1
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                Sub Menu 2
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                Sub Menu 3
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-default rounded-xl">
                Sub Menu 4
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start w-9/12 min-h-0 h-full gap-2 border-l-1 border-default overflow-hidden">
          <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-default">
            <Breadcrumbs className="h-[21px]">
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
