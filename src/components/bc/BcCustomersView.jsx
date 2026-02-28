"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่", uid: "bcCustomerNumber", sortable: true },
  { name: "ชื่อลูกค้า", uid: "bcCustomerDisplayName", sortable: true },
  { name: "ผู้ติดต่อ", uid: "bcCustomerContact", sortable: true },
  { name: "โทรศัพท์", uid: "bcCustomerPhoneNumber" },
  { name: "พนักงานขาย", uid: "bcCustomerSalespersonCode", sortable: true },
  { name: "ยอดค้างชำระ", uid: "bcCustomerBalanceDue", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcCustomerNumber",
  "bcCustomerDisplayName",
  "bcCustomerContact",
  "bcCustomerPhoneNumber",
  "bcCustomerSalespersonCode",
  "bcCustomerBalanceDue",
];

export default function BcCustomersView({ customers, loading }) {
  const renderCell = useCallback((customer, columnKey) => {
    switch (columnKey) {
      case "bcCustomerDisplayName":
        return <span className="font-medium">{customer.bcCustomerDisplayName}</span>;
      case "bcCustomerContact":
        return (
          <span className="text-default-500">{customer.bcCustomerContact || "-"}</span>
        );
      case "bcCustomerPhoneNumber":
        return (
          <span className="text-default-500">
            {customer.bcCustomerPhoneNumber || "-"}
          </span>
        );
      case "bcCustomerBalanceDue":
        return customer.bcCustomerBalanceDue != null
          ? Number(customer.bcCustomerBalanceDue).toLocaleString("th-TH", {
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
        rowKey="bcCustomerId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ, ผู้ติดต่อ..."
        searchKeys={["bcCustomerNumber", "bcCustomerDisplayName", "bcCustomerContact", "bcCustomerSalespersonCode"]}
        emptyContent="ไม่พบลูกค้า"
      />
    </div>
  );
}
