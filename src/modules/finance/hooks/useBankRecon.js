"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getBankStatements,
  createBankStatement,
  getBankStatementDetail,
  parseBankStatement,
  runAutoMatch,
  manualMatchEntry,
  deleteBankStatement,
} from "@/modules/finance/actions";
import { getSalesInvoices } from "@/modules/finance/actions";

export function useBankRecon() {
  // ─── Data State ───
  const [statements, setStatements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [openInvoices, setOpenInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [filter, setFilter] = useState("all");

  // ─── Modal State ───
  const matchModal = useDisclosure();
  const [matchEntry, setMatchEntry] = useState(null);

  // ─── Load Statements ───
  const loadStatements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBankStatements();
      setStatements(data || []);
    } catch (err) {
      console.error("Load statements error:", err);
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  // ─── Select Statement ───
  const selectStatement = useCallback(async (id) => {
    setSelectedId(id);
    if (!id) {
      setDetail(null);
      return;
    }
    try {
      setLoading(true);
      const data = await getBankStatementDetail(id);
      setDetail(data);
    } catch (err) {
      console.error("Load detail error:", err);
      toast.error("โหลดรายละเอียดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Upload ───
  const handleUpload = useCallback(
    async (fileUrl, fileName, bankCode = "KBANK") => {
      try {
        const stmt = await createBankStatement({ fileUrl, fileName, bankCode });
        setStatements((prev) => [stmt, ...prev]);
        toast.success("อัพโหลดสำเร็จ");
        return stmt;
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("อัพโหลดล้มเหลว: " + err.message);
      }
    },
    [],
  );

  // ─── Parse ───
  const handleParse = useCallback(
    async (id) => {
      setParsing(true);
      try {
        const result = await parseBankStatement(id);
        toast.success(`แยกข้อมูลสำเร็จ ${result.entryCount} รายการ`);
        await selectStatement(id);
        await loadStatements();
      } catch (err) {
        console.error("Parse error:", err);
        toast.error("แยกข้อมูลล้มเหลว: " + err.message);
      } finally {
        setParsing(false);
      }
    },
    [selectStatement, loadStatements],
  );

  // ─── Auto Match ───
  const handleAutoMatch = useCallback(
    async () => {
      if (!selectedId) return;
      setMatching(true);
      try {
        const result = await runAutoMatch(selectedId);
        toast.success(
          `Match สำเร็จ: ${result.matchCount} รายการ` +
            (result.suggestedCount ? `, แนะนำ ${result.suggestedCount} รายการ` : ""),
        );
        await selectStatement(selectedId);
        await loadStatements();
      } catch (err) {
        console.error("Auto match error:", err);
        toast.error("Auto Match ล้มเหลว: " + err.message);
      } finally {
        setMatching(false);
      }
    },
    [selectedId, selectStatement, loadStatements],
  );

  // ─── Manual Match ───
  const handleManualMatch = useCallback(
    async (entryId, invoiceData) => {
      if (!selectedId) return;
      try {
        await manualMatchEntry(selectedId, {
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

  // ─── Unmatch ───
  const handleUnmatch = useCallback(
    async (entryId) => {
      if (!selectedId) return;
      try {
        await manualMatchEntry(selectedId, { action: "unmatch", entryId });
        toast.success("ยกเลิก Match สำเร็จ");
        await selectStatement(selectedId);
      } catch (err) {
        toast.error("ยกเลิก Match ล้มเหลว: " + err.message);
      }
    },
    [selectedId, selectStatement],
  );

  // ─── Exclude ───
  const handleExclude = useCallback(
    async (entryId, note) => {
      if (!selectedId) return;
      try {
        await manualMatchEntry(selectedId, { action: "exclude", entryId, note });
        toast.success("ยกเว้นรายการสำเร็จ");
        await selectStatement(selectedId);
      } catch (err) {
        toast.error("ยกเว้นล้มเหลว: " + err.message);
      }
    },
    [selectedId, selectStatement],
  );

  // ─── Delete Statement ───
  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteBankStatement(id);
        setStatements((prev) => prev.filter((s) => s.id !== id));
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

  // ─── Open Match Modal ───
  const openMatchModal = useCallback(
    async (entry) => {
      setMatchEntry(entry);
      // Load open invoices if not loaded
      if (openInvoices.length === 0) {
        try {
          const invs = await getSalesInvoices("Open", false);
          setOpenInvoices(invs || []);
        } catch (err) {
          console.error("Load invoices error:", err);
        }
      }
      matchModal.onOpen();
    },
    [openInvoices.length, matchModal],
  );

  // ─── Export ───
  const handleExport = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/finance/bankRecon/${selectedId}/export`);
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

  // ─── Computed: KPIs ───
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

  // ─── Filtered Entries ───
  const filteredEntries = useMemo(() => {
    const entries = detail?.entries || [];
    if (filter === "all") return entries;
    if (filter === "credit") return entries.filter((e) => e.direction === "credit");
    if (filter === "debit") return entries.filter((e) => e.direction === "debit");
    return entries.filter((e) => e.matchStatus === filter);
  }, [detail?.entries, filter]);

  return {
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
    loadStatements,
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
  };
}
