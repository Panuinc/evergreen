"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
} from "@heroui/react";
import { get } from "@/lib/apiClient";

const STATUS_MAP = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
};

export default function QuotationListPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const url =
          statusFilter === "all"
            ? "/api/marketing/omnichannel/quotations"
            : `/api/marketing/omnichannel/quotations?status=${statusFilter}`;
        const data = await get(url);
        setQuotations(data);
      } catch {
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <h2 className="text-lg font-semibold">ใบเสนอราคา</h2>

      <Tabs
        selectedKey={statusFilter}
        onSelectionChange={setStatusFilter}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="all" title="ทั้งหมด" />
        <Tab key="draft" title="ร่าง" />
        <Tab key="pending_approval" title="รออนุมัติ" />
        <Tab key="approved" title="อนุมัติแล้ว" />
        <Tab key="rejected" title="ไม่อนุมัติ" />
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Spinner />
        </div>
      ) : (
        <Table
          aria-label="Quotations"
          selectionMode="single"
          onRowAction={(key) =>
            router.push(`/marketing/omnichannel/quotations/${key}`)
          }
          classNames={{ tr: "cursor-pointer" }}
        >
          <TableHeader>
            <TableColumn>เลขที่</TableColumn>
            <TableColumn>ลูกค้า</TableColumn>
            <TableColumn>ช่องทาง</TableColumn>
            <TableColumn>สถานะ</TableColumn>
            <TableColumn>วันที่สร้าง</TableColumn>
          </TableHeader>
          <TableBody emptyContent="ไม่มีใบเสนอราคา">
            {quotations.map((q) => {
              const s = STATUS_MAP[q.quotationStatus] || STATUS_MAP.draft;
              return (
                <TableRow key={q.quotationId}>
                  <TableCell>{q.quotationNumber}</TableCell>
                  <TableCell>{q.quotationCustomerName || q.omContacts?.contactDisplayName || "-"}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {q.omContacts?.contactChannelType || "-"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={s.color}>
                      {s.label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(q.quotationCreatedAt).toLocaleDateString("th-TH")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
