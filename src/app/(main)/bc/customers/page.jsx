"use client";

import { useCallback } from "react";
import { Chip, Card, CardBody } from "@heroui/react";
import { useBcCustomers } from "@/hooks/useBcCustomers";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Display Name", uid: "displayName", sortable: true },
  { name: "Type", uid: "type", sortable: true },
  { name: "Email", uid: "email", sortable: true },
  { name: "Phone", uid: "phoneNumber" },
  { name: "City", uid: "city", sortable: true },
  { name: "Balance Due", uid: "balanceDue", sortable: true },
  { name: "Blocked", uid: "blocked", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "type",
  "email",
  "city",
  "balanceDue",
  "blocked",
];

export default function BcCustomersPage() {
  const { customers, loading } = useBcCustomers();

  const renderCell = useCallback((customer, columnKey) => {
    switch (columnKey) {
      case "displayName":
        return <span className="font-medium">{customer.displayName}</span>;
      case "email":
        return (
          <span className="text-default-500">{customer.email || "-"}</span>
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
      case "blocked":
        return (
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={customer.blocked === " " || !customer.blocked ? "success" : "danger"}
          >
            {customer.blocked === " " || !customer.blocked ? "No" : customer.blocked}
          </Chip>
        );
      default:
        return customer[columnKey] || "-";
    }
  }, []);

  const renderCard = useCallback((customer) => (
    <Card key={customer.id} variant="bordered" radius="md" shadow="none">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{customer.displayName}</span>
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={customer.blocked === " " || !customer.blocked ? "success" : "danger"}
          >
            {customer.blocked === " " || !customer.blocked ? "No" : customer.blocked}
          </Chip>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-default-400">Number</span>
            <span>{customer.number || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Type</span>
            <span>{customer.type || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Email</span>
            <span className="text-default-500">{customer.email || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Phone</span>
            <span className="text-default-500">{customer.phoneNumber || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">City</span>
            <span>{customer.city || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Balance Due</span>
            <span className="font-semibold">
              {customer.balanceDue != null
                ? Number(customer.balanceDue).toLocaleString("th-TH", { minimumFractionDigits: 2 })
                : "-"}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  ), []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={customers}
        renderCell={renderCell}
        renderCard={renderCard}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, email, city..."
        searchKeys={["number", "displayName", "email", "city"]}
        emptyContent="No customers found"
      />
    </div>
  );
}
