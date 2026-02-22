"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useCrmQuotations } from "@/hooks/useCrmQuotations";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ใบเสนอราคา", uid: "quotationNo", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "โอกาสขาย", uid: "opportunity" },
  { name: "สถานะ", uid: "quotationStatus" },
  { name: "ยอดรวม", uid: "quotationTotal" },
  { name: "ใช้ได้ถึง", uid: "quotationValidUntil" },
  { name: "สร้างเมื่อ", uid: "quotationCreatedAt" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { uid: "draft", name: "ฉบับร่าง" },
  { uid: "submitted", name: "ส่งแล้ว" },
  { uid: "approved", name: "อนุมัติ" },
  { uid: "rejected", name: "ปฏิเสธ" },
  { uid: "converted", name: "แปลงแล้ว" },
];

const STATUS_COLOR_MAP = {
  draft: "default",
  submitted: "primary",
  approved: "success",
  rejected: "danger",
  converted: "secondary",
};

const INITIAL_VISIBLE_COLUMNS = [
  "quotationNo",
  "contact",
  "quotationStatus",
  "quotationTotal",
  "quotationCreatedAt",
  "actions",
];

export default function QuotationsPage() {
  const router = useRouter();
  const {
    quotations,
    loading,
    statusFilter,
    setStatusFilter,
    deletingQuotation,
    deleteModal,
    confirmDelete,
    handleDelete,
    reload,
  } = useCrmQuotations();

  const handleNew = async () => {
    try {
      const { createQuotation } = await import("@/actions/sales");
      const newQ = await createQuotation({});
      router.push(`/sales/quotations/${newQ.quotationId}`);
    } catch (error) {
      toast.error("ไม่สามารถสร้างใบเสนอราคาได้");
    }
  };

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "quotationNo":
          return (
            <span
              className="text-primary cursor-pointer"
              onClick={() =>
                router.push(`/sales/quotations/${item.quotationId}`)
              }
            >
              {item.quotationNo}
            </span>
          );
        case "contact":
          return item.crmContacts
            ? `${item.crmContacts.contactFirstName} ${item.crmContacts.contactLastName}`
            : "-";
        case "account":
          return item.crmAccounts?.accountName || "-";
        case "opportunity":
          return item.crmOpportunities?.opportunityName || "-";
        case "quotationStatus": {
          const color = STATUS_COLOR_MAP[item.quotationStatus] || "default";
          return (
            <Chip variant="bordered" size="md" radius="md" color={color}>
              {item.quotationStatus}
            </Chip>
          );
        }
        case "quotationTotal":
          return item.quotationTotal != null
            ? `฿${Number(item.quotationTotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
            : "-";
        case "quotationValidUntil":
          return item.quotationValidUntil
            ? new Date(item.quotationValidUntil).toLocaleDateString("th-TH")
            : "-";
        case "quotationCreatedAt":
          return item.quotationCreatedAt
            ? new Date(item.quotationCreatedAt).toLocaleDateString("th-TH")
            : "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() =>
                  router.push(`/sales/quotations/${item.quotationId}`)
                }
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
    [router, confirmDelete],
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
        rowKey="quotationId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาใบเสนอราคา..."
        searchKeys={["quotationNo"]}
        emptyContent="ไม่พบใบเสนอราคา"
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบใบเสนอราคา</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingQuotation?.quotationNo}
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
