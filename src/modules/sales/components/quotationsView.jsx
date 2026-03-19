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

const columns = [
  { name: "เลขที่ใบเสนอราคา", uid: "crmQuotationNo", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "โอกาสขาย", uid: "opportunity" },
  { name: "สถานะ", uid: "crmQuotationStatus" },
  { name: "ยอดรวม", uid: "crmQuotationTotal" },
  { name: "ใช้ได้ถึง", uid: "crmQuotationValidUntil" },
  { name: "สร้างเมื่อ", uid: "crmQuotationCreatedAt" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { uid: "draft", name: "ฉบับร่าง" },
  { uid: "submitted", name: "ส่งแล้ว" },
  { uid: "approved", name: "อนุมัติ" },
  { uid: "rejected", name: "ปฏิเสธ" },
  { uid: "converted", name: "แปลงแล้ว" },
];

const statusColorMap = {
  draft: "default",
  submitted: "primary",
  approved: "success",
  rejected: "danger",
  converted: "secondary",
};

const initialVisibleColumns = [
  "crmQuotationNo",
  "contact",
  "crmQuotationStatus",
  "crmQuotationTotal",
  "crmQuotationCreatedAt",
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
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmQuotationNo":
          return (
            <span
              className="text-primary cursor-pointer"
              onClick={() => onNavigateToQuotation(item.crmQuotationId)}
            >
              {item.crmQuotationNo}
            </span>
          );
        case "contact":
          return item.crmContact
            ? `${item.crmContact.crmContactFirstName} ${item.crmContact.crmContactLastName}`
            : "-";
        case "account":
          return item.salesAccount?.crmAccountName || "-";
        case "opportunity":
          return item.salesOpportunity?.crmOpportunityName || "-";
        case "crmQuotationStatus": {
          const color = statusColorMap[item.crmQuotationStatus] || "default";
          return (
            <Chip variant="flat" size="md" radius="md" color={color}>
              {item.crmQuotationStatus}
            </Chip>
          );
        }
        case "crmQuotationTotal":
          return item.crmQuotationTotal != null
            ? `฿${Number(item.crmQuotationTotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
            : "-";
        case "crmQuotationValidUntil":
          return item.crmQuotationValidUntil
            ? new Date(item.crmQuotationValidUntil).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
            : "-";
        case "crmQuotationCreatedAt":
          return item.crmQuotationCreatedAt
            ? new Date(item.crmQuotationCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
            : "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="flat"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => onNavigateToQuotation(item.crmQuotationId)}
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
          return item[columnKey] || "-";
      }
    },
    [onNavigateToQuotation, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs
        selectedKey={statusFilter}
        onSelectionChange={setStatusFilter}
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
        rowKey="crmQuotationId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาใบเสนอราคา..."
        searchKeys={["crmQuotationNo"]}
        emptyContent="ไม่พบใบเสนอราคา"
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => onNavigateToQuotation(item.crmQuotationId) },
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
                {deletingQuotation?.crmQuotationNo}
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
