"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";

const columns = [
  { name: "เลขที่", uid: "bcCustomerNo", sortable: true },
  { name: "ชื่อลูกค้า", uid: "bcCustomerNameValue", sortable: true },
  { name: "ผู้ติดต่อ", uid: "bcCustomerContact", sortable: true },
  { name: "โทรศัพท์", uid: "bcCustomerPhoneNo" },
  { name: "พนักงานขาย", uid: "bcCustomerSalespersonCode", sortable: true },
  { name: "ยอดค้างชำระ", uid: "bcCustomerBalanceDueLCY", sortable: true },
];

const initialVisibleColumns = [
  "bcCustomerNo",
  "bcCustomerNameValue",
  "bcCustomerContact",
  "bcCustomerPhoneNo",
  "bcCustomerSalespersonCode",
  "bcCustomerBalanceDueLCY",
];

export default function BcCustomersView({ customers, loading }) {
  const renderCell = useCallback((customer, columnKey) => {
    switch (columnKey) {
      case "bcCustomerNameValue":
        return <span className="font-light">{customer.bcCustomerNameValue}</span>;
      case "bcCustomerContact":
        return (
          <span className="text-muted-foreground">{customer.bcCustomerContact || "-"}</span>
        );
      case "bcCustomerPhoneNo":
        return (
          <span className="text-muted-foreground">
            {customer.bcCustomerPhoneNo || "-"}
          </span>
        );
      case "bcCustomerBalanceDueLCY":
        return customer.bcCustomerBalanceDueLCY != null
          ? Number(customer.bcCustomerBalanceDueLCY).toLocaleString("th-TH", {
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
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยเลขที่, ชื่อ, ผู้ติดต่อ..."
        searchKeys={["bcCustomerNo", "bcCustomerNameValue", "bcCustomerContact", "bcCustomerSalespersonCode"]}
        emptyContent="ไม่พบลูกค้า"
      />
    </div>
  );
}
