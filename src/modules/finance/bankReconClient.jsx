"use client";

import { useState, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import useSWR from "swr";
import { get, post, put, del } from "@/lib/apiClient";
import BankReconView from "@/modules/finance/components/bankReconView";

const fetcher = (url) => get(url);

export default function BankReconClient() {
  const { data: statementsData, isLoading: statementsLoading, mutate: mutateStatements } = useSWR("/api/finance/bankRecon", fetcher);
  const statements = statementsData || [];

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const loading = statementsLoading || detailLoading;
  const [openInvoices, setOpenInvoices] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [filter, setFilter] = useState("all");

  const [arData, setArData] = useState([]);
  const [arLoading, setArLoading] = useState(false);

  const matchModal = useDisclosure();
  const [matchEntry, setMatchEntry] = useState(null);

  const selectStatement = useCallback(async (id) => {
    setSelectedId(id);
    if (!id) {
      setDetail(null);
      return;
    }
    try {
      setDetailLoading(true);
      const data = await get(`/api/finance/bankRecon/${id}`);
      setDetail(data);
    } catch (err) {
      console.error("Load detail error:", err);
      toast.error("โหลดรายละเอียดล้มเหลว");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleUpload = useCallback(
    async (fileUrl, fileName, bankCode = "KBANK") => {
      try {
        const stmt = await post("/api/finance/bankRecon", { fileUrl, fileName, bankCode });
        mutateStatements();
        toast.success("อัพโหลดสำเร็จ");
        return stmt;
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("อัพโหลดล้มเหลว: " + err.message);
      }
    },
    [],
  );

  const handleParse = useCallback(
    async (id) => {
      setParsing(true);
      try {
        const result = await post(`/api/finance/bankRecon/${id}/parse`);
        toast.success(`แยกข้อมูลสำเร็จ ${result.entryCount} รายการ`);
        await selectStatement(id);
        mutateStatements();
      } catch (err) {
        console.error("Parse error:", err);
        toast.error("แยกข้อมูลล้มเหลว: " + err.message);
      } finally {
        setParsing(false);
      }
    },
    [selectStatement, mutateStatements],
  );

  const handleAutoMatch = useCallback(
    async () => {
      if (!selectedId) return;
      setMatching(true);
      try {
        const result = await post(`/api/finance/bankRecon/${selectedId}/match`);
        toast.success(
          `Match สำเร็จ: ${result.matchCount} รายการ` +
            (result.suggestedCount ? `, แนะนำ ${result.suggestedCount} รายการ` : ""),
        );
        await selectStatement(selectedId);
        mutateStatements();
      } catch (err) {
        console.error("Auto match error:", err);
        toast.error("Auto Match ล้มเหลว: " + err.message);
      } finally {
        setMatching(false);
      }
    },
    [selectedId, selectStatement, mutateStatements],
  );

  const handleManualMatch = useCallback(
    async (entryId, invoiceData) => {
      if (!selectedId) return;
      try {
        await put(`/api/finance/bankRecon/${selectedId}/match`, {
          action: "match",
          entryId,
          ...invoiceData,
        });
        toast.success("Match สำเร็จ");
        matchModal.onClose();
        await selectStatement(selectedId);
      } catch (err) {
        toast.error("Match ล้มเหลว: " + err.message);
      }
    },
    [selectedId, selectStatement, matchModal],
  );

  const handleUnmatch = useCallback(
    async (entryId) => {
      if (!selectedId) return;
      try {
        await put(`/api/finance/bankRecon/${selectedId}/match`, { action: "unmatch", entryId });
        toast.success("ยกเลิก Match สำเร็จ");
        await selectStatement(selectedId);
      } catch (err) {
        toast.error("ยกเลิก Match ล้มเหลว: " + err.message);
      }
    },
    [selectedId, selectStatement],
  );

  const handleExclude = useCallback(
    async (entryId, note) => {
      if (!selectedId) return;
      try {
        await put(`/api/finance/bankRecon/${selectedId}/match`, { action: "exclude", entryId, note });
        toast.success("ยกเว้นรายการสำเร็จ");
        await selectStatement(selectedId);
      } catch (err) {
        toast.error("ยกเว้นล้มเหลว: " + err.message);
      }
    },
    [selectedId, selectStatement],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await del(`/api/finance/bankRecon/${id}`);
        mutateStatements();
        if (selectedId === id) {
          setSelectedId(null);
          setDetail(null);
        }
        toast.success("ลบสำเร็จ");
      } catch (err) {
        toast.error("ลบล้มเหลว: " + err.message);
      }
    },
    [selectedId],
  );

  const openMatchModal = useCallback(
    async (entry) => {
      setMatchEntry(entry);

      if (openInvoices.length === 0) {
        try {
          const invs = await get("/api/finance/salesInvoices?status=Open&expand=false");
          setOpenInvoices(invs || []);
        } catch (err) {
          console.error("Load invoices error:", err);
        }
      }
      matchModal.onOpen();
    },
    [openInvoices.length, matchModal],
  );

  const loadArData = useCallback(async () => {
    setArLoading(true);
    try {
      const rows = await get("/api/finance/agedReceivables");
      setArData((rows || []).filter((r) => r.customerNumber && Number(r.balanceDue) !== 0));
    } catch (err) {
      console.error("Load AR data error:", err);
      toast.error("โหลดข้อมูล AR ล้มเหลว");
    } finally {
      setArLoading(false);
    }
  }, []);

  const arComparison = useMemo(() => {
    if (!detail?.entries || arData.length === 0) return [];

    const matchedByCustomer = new Map();
    for (const entry of detail.entries) {
      if (entry.direction !== "credit" || !entry.bankMatch?.length) continue;
      for (const m of entry.bankMatch) {
        const key = m.customerNumber || m.customerName;
        if (!key) continue;
        if (!matchedByCustomer.has(key)) {
          matchedByCustomer.set(key, {
            customerNumber: m.customerNumber,
            customerName: m.customerName,
            matchedTotal: 0,
            invoiceCount: 0,
          });
        }
        const row = matchedByCustomer.get(key);
        row.matchedTotal += Number(m.matchedAmount || 0);
        row.invoiceCount++;
      }
    }

    const arMap = new Map();
    for (const ar of arData) {
      arMap.set(ar.customerNumber, ar);
    }

    const result = [];
    const seen = new Set();

    for (const ar of arData) {
      const matched = matchedByCustomer.get(ar.customerNumber);
      const matchedTotal = matched?.matchedTotal || 0;
      const arBalance = Number(ar.balanceDue || 0);
      const difference = arBalance - matchedTotal;

      let status;
      if (Math.abs(difference) < 0.01) status = "จ่ายครบ";
      else if (difference > 0) status = "ยังค้าง";
      else status = "จ่ายเกิน";

      result.push({
        customerNumber: ar.customerNumber,
        customerName: matched?.customerName || ar.name,
        matchedTotal,
        invoiceCount: matched?.invoiceCount || 0,
        arBalanceDue: arBalance,
        arCurrent: Number(ar.currentAmount || 0),
        arPeriod1: Number(ar.period1Amount || 0),
        arPeriod2: Number(ar.period2Amount || 0),
        arPeriod3: Number(ar.period3Amount || 0),
        difference,
        status,
      });
      seen.add(ar.customerNumber);
    }

    for (const [key, matched] of matchedByCustomer) {
      if (seen.has(key)) continue;
      result.push({
        customerNumber: matched.customerNumber,
        customerName: matched.customerName,
        matchedTotal: matched.matchedTotal,
        invoiceCount: matched.invoiceCount,
        arBalanceDue: 0,
        arCurrent: 0,
        arPeriod1: 0,
        arPeriod2: 0,
        arPeriod3: 0,
        difference: -matched.matchedTotal,
        status: "ไม่พบใน AR",
      });
    }

    return result.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [detail?.entries, arData]);

  const handleExport = useCallback(async () => {
    if (!selectedId) return;
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      const res = await fetch(`/api/finance/bankRecon/${selectedId}/export`, { headers });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bank-recon-${detail?.bankCode || "export"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export สำเร็จ");
    } catch (err) {
      toast.error("Export ล้มเหลว: " + err.message);
    }
  }, [selectedId, detail?.bankCode]);

  const kpis = useMemo(() => {
    const entries = detail?.entries || [];
    const credits = entries.filter((e) => e.direction === "credit");
    const debits = entries.filter((e) => e.direction === "debit");

    const totalDeposit = credits.reduce((s, e) => s + Number(e.amount), 0);
    const totalWithdraw = debits.reduce((s, e) => s + Number(e.amount), 0);

    const matched = credits.filter((e) => e.matchStatus === "matched");
    const suggested = credits.filter((e) => e.matchStatus === "suggested");
    const unmatched = credits.filter((e) => e.matchStatus === "unmatched");
    const excluded = credits.filter((e) => e.matchStatus === "excluded");

    const matchedAmount = matched.reduce((s, e) => s + Number(e.amount), 0);
    const unmatchedAmount = unmatched.reduce((s, e) => s + Number(e.amount), 0);

    return {
      totalEntries: entries.length,
      creditCount: credits.length,
      debitCount: debits.length,
      totalDeposit,
      totalWithdraw,
      matchedCount: matched.length,
      suggestedCount: suggested.length,
      unmatchedCount: unmatched.length,
      excludedCount: excluded.length,
      matchedAmount,
      unmatchedAmount,
      matchRate: credits.length > 0
        ? ((matched.length / credits.length) * 100).toFixed(1)
        : "0.0",
    };
  }, [detail?.entries]);

  const filteredEntries = useMemo(() => {
    const entries = detail?.entries || [];
    if (filter === "all") return entries;
    if (filter === "credit") return entries.filter((e) => e.direction === "credit");
    if (filter === "debit") return entries.filter((e) => e.direction === "debit");
    return entries.filter((e) => e.matchStatus === filter);
  }, [detail?.entries, filter]);

  return (
    <BankReconView
      {...{
        statements,
        selectedId,
        detail,
        loading,
        parsing,
        matching,
        filter,
        setFilter,
        kpis,
        filteredEntries,
        openInvoices,
        matchModal,
        matchEntry,
        loadStatements: mutateStatements,
        selectStatement,
        handleUpload,
        handleParse,
        handleAutoMatch,
        handleManualMatch,
        handleUnmatch,
        handleExclude,
        handleDelete,
        handleExport,
        openMatchModal,
        arData,
        arLoading,
        arComparison,
        loadArData,
      }}
    />
  );
}
