"use client";

import { useCallback } from "react";
import { useBcCustomers } from "@/hooks/useBcCustomers";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "ชื่อลูกค้า", uid: "displayName", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact", sortable: true },
  { name: "โทรศัพท์", uid: "phoneNumber" },
  { name: "พนักงานขาย", uid: "salespersonCode", sortable: true },
  { name: "ยอดค้างชำระ", uid: "balanceDue", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "contact",
  "phoneNumber",
  "salespersonCode",
  "balanceDue",
];

export default function BcCustomersPage() {
  const { customers, loading } = useBcCustomers();

  const renderCell = useCallback((customer, columnKey) => {
    switch (columnKey) {
      case "displayName":
        return <span className="font-medium">{customer.displayName}</span>;
      case "contact":
        return (
          <span className="text-default-500">{customer.contact || "-"}</span>
        );
      case "phoneNumber":
        return (
          <span className="text-default-500">
            {customer.phoneNumber || "-"}
          </span>
        );
      case "balanceDue":
        return customer.balanceDue != null
          ? Number(customer.balanceDue).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      default:
        return customer[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={customers}
        renderCell={renderCell}
        enableCardView
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ, ผู้ติดต่อ..."
        searchKeys={["number", "displayName", "contact", "salespersonCode"]}
        emptyContent="ไม่พบลูกค้า"
      />
    </div>
  );
}
