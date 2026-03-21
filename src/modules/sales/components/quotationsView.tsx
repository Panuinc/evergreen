"use client";

import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import type { QuotationsViewProps, SalesQuotation } from "@/modules/sales/types";

const columns = [
  { name: "เลขที่ใบเสนอราคา", uid: "salesQuotationNo", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "โอกาสขาย", uid: "opportunity" },
  { name: "สถานะ", uid: "salesQuotationStatus" },
  { name: "ยอดรวม", uid: "salesQuotationTotal" },
  { name: "ใช้ได้ถึง", uid: "salesQuotationValidUntil" },
  { name: "สร้างเมื่อ", uid: "salesQuotationCreatedAt" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusColorMap: Record<string, "default" | "primary" | "success" | "danger" | "secondary"> = {
  draft: "default",
  submitted: "primary",
  approved: "success",
  rejected: "danger",
  converted: "secondary",
};

const initialVisibleColumns = [
  "salesQuotationNo",
  "contact",
  "salesQuotationStatus",
  "salesQuotationTotal",
  "salesQuotationCreatedAt",
  "actions",
];

export default function QuotationsView({
  quotations,
  loading,
  statusFilter,
  setStatusFilter,
  deletingQuotation,
  deleteModal,
  confirmDelete,
  handleDelete,
  handleNew,
  onNavigateToQuotation,
}: QuotationsViewProps) {
  const renderCell = useCallback(
    (item: SalesQuotation, columnKey: string) => {
      switch (columnKey) {
        case "salesQuotationNo":
          return (
            <span
              className="text-primary cursor-pointer"
              onClick={() => onNavigateToQuotation(item.salesQuotationId)}
            >
              {item.salesQuotationNo}
            </span>
          );
        case "contact":
          return item.salesContact
            ? `${item.salesContact.salesContactFirstName} ${item.salesContact.salesContactLastName}`
            : "-";
        case "account":
          return item.salesAccount?.salesAccountName || "-";
        case "opportunity":
          return item.salesQuotationOpportunityId || "-";
        case "salesQuotationStatus": {
          const color = statusColorMap[item.salesQuotationStatus] || "default";
          return (
            <Chip variant="flat" size="md" radius="md" color={color}>
              {item.salesQuotationStatus}
            </Chip>
          );
        }
        case "salesQuotationTotal":
          return item.salesQuotationTotal != null
            ? `฿${Number(item.salesQuotationTotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
            : "-";
        case "salesQuotationValidUntil":
          return item.salesQuotationValidUntil
            ? new Date(item.salesQuotationValidUntil).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
            : "-";
        case "salesQuotationCreatedAt":
          return item.salesQuotationCreatedAt
            ? new Date(item.salesQuotationCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
            : "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="flat"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => onNavigateToQuotation(item.salesQuotationId)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return (item as unknown as Record<string, unknown>)[columnKey]?.toString() || "-";
      }
    },
    [onNavigateToQuotation, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs
        selectedKey={statusFilter}
        onSelectionChange={(k) => setStatusFilter(k as string)}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="" title="ทั้งหมด" />
        <Tab key="draft" title="ฉบับร่าง" />
        <Tab key="submitted" title="ส่งแล้ว" />
        <Tab key="approved" title="อนุมัติ" />
        <Tab key="rejected" title="ปฏิเสธ" />
      </Tabs>

      <DataTable
        columns={columns}
        data={quotations}
        renderCell={renderCell}
        enableCardView
        rowKey="salesQuotationId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาใบเสนอราคา..."
        searchKeys={["salesQuotationNo"]}
        emptyContent="ไม่พบใบเสนอราคา"
        actionMenuItems={(item: SalesQuotation) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => onNavigateToQuotation(item.salesQuotationId) },
          { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ]}
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={handleNew}
          >
            สร้างใบเสนอราคาใหม่
          </Button>
        }
      />

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบใบเสนอราคา</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingQuotation?.salesQuotationNo}
              </span>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
