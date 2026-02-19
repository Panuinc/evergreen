"use client";

import { useCallback } from "react";
import { useBcCustomers } from "@/hooks/useBcCustomers";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Display Name", uid: "displayName", sortable: true },
  { name: "Contact", uid: "contact", sortable: true },
  { name: "Phone", uid: "phoneNumber" },
  { name: "Salesperson", uid: "salespersonCode", sortable: true },
  { name: "Balance Due", uid: "balanceDue", sortable: true },
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
        searchPlaceholder="Search by number, name, contact..."
        searchKeys={["number", "displayName", "contact", "salespersonCode"]}
        emptyContent="No customers found"
      />
    </div>
  );
}
