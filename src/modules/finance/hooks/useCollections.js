"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { getAgedReceivables, getCollections, createFollowUp } from "@/modules/finance/actions";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}


function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

const INITIAL_FORM = {
  contactDate: new Date().toISOString().slice(0, 10),
  contactMethod: "phone",
  reason: "",
  reasonDetail: "",
  note: "",
  promiseDate: "",
  promiseAmount: "",
  status: "pending",
  nextFollowUpDate: "",
};

export function useCollections() {
  const [arData, setArData] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const addModal = useDisclosure();
  const historyModal = useDisclosure();


  const [reportSince, setReportSince] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reportUntil, setReportUntil] = useState(() => new Date().toISOString().slice(0, 10));


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, fu] = await Promise.all([getAgedReceivables(), getCollections()]);
      setArData(ar || []);
      setFollowUps(fu || []);
    } catch (err) {
      console.error("Error loading collections data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  const mergedData = useMemo(() => {
    const fuByCustomer = {};
    for (const fu of followUps) {
      if (!fuByCustomer[fu.customerNumber]) fuByCustomer[fu.customerNumber] = [];
      fuByCustomer[fu.customerNumber].push(fu);
    }

    return arData
      .filter((c) => c.customerNumber && parseNum(c.balanceDue) > 0)
      .map((c) => {
        const fus = fuByCustomer[c.customerNumber] || [];
        const latest = fus[0];
        return {
          customerNumber: c.customerNumber,
          name: c.name || c.customerNumber,
          balanceDue: parseNum(c.balanceDue),
          current: parseNum(c.currentAmount),
          period1: parseNum(c.period1Amount),
          period2: parseNum(c.period2Amount),
          period3: parseNum(c.period3Amount),
          followUpCount: fus.length,
          lastContactDate: latest?.contactDate,
          lastReason: latest?.reason,
          lastStatus: latest?.status,
          lastNote: latest?.note,
          nextFollowUpDate: latest?.nextFollowUpDate,
          promiseDate: latest?.promiseDate,
          promiseAmount: latest?.promiseAmount,
        };
      })
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [arData, followUps]);


  const kpis = useMemo(() => {
    const totalOverdue = mergedData.reduce((s, c) => s + c.balanceDue, 0);
    const contacted = mergedData.filter((c) => c.followUpCount > 0).length;
    const uncontacted = mergedData.filter((c) => c.followUpCount === 0).length;
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = mergedData.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate <= today).length;
    const promisedTotal = followUps
      .filter((f) => f.status === "promised" && f.promiseAmount)
      .reduce((s, f) => s + Number(f.promiseAmount), 0);
    return { totalOverdue, contacted, uncontacted, total: mergedData.length, dueToday, promisedTotal };
  }, [mergedData, followUps]);


  const reportData = useMemo(() => {
    const filtered = followUps.filter((f) => {
      if (reportSince && f.contactDate < reportSince) return false;
      if (reportUntil && f.contactDate > reportUntil) return false;
      return true;
    });




    const REASONS_MAP = {
      cash_flow: "ปัญหาสภาพคล่อง",
      dispute: "ข้อพิพาท/ไม่พอใจสินค้า-บริการ",
      waiting_approval: "รออนุมัติภายใน",
      no_contact: "ติดต่อไม่ได้",
      partial_payment: "จะชำระบางส่วน",
      forgotten: "ลืม/ไม่ทราบยอด",
      bankruptcy: "ปิดกิจการ/ล้มละลาย",
      other: "อื่นๆ",
    };
    const STATUSES_MAP = {
      pending: "รอติดตาม",
      promised: "สัญญาจะชำระ",
      partial: "ชำระบางส่วน",
      escalated: "ยกระดับ",
      resolved: "ชำระแล้ว",
      written_off: "ตัดหนี้สูญ",
    };

    const byReason = {};
    for (const f of filtered) {
      const key = f.reason || "other";
      if (!byReason[key]) byReason[key] = { name: REASONS_MAP[key] || key || "-", value: 0, key };
      byReason[key].value++;
    }

    const byStatus = {};
    for (const f of filtered) {
      const key = f.status || "pending";
      if (!byStatus[key]) byStatus[key] = { name: STATUSES_MAP[key] || key || "-", value: 0, key };
      byStatus[key].value++;
    }

    const uniqueCustomers = new Set(filtered.map((f) => f.customerNumber)).size;
    const totalPromised = filtered
      .filter((f) => f.promiseAmount)
      .reduce((s, f) => s + Number(f.promiseAmount), 0);

    return {
      filtered,
      reasonChart: Object.values(byReason).sort((a, b) => b.value - a.value),
      statusChart: Object.values(byStatus),
      total: filtered.length,
      uniqueCustomers,
      totalPromised,
    };
  }, [followUps, reportSince, reportUntil]);


  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return followUps.filter((f) => f.customerNumber === selectedCustomer.customerNumber);
  }, [followUps, selectedCustomer]);


  const openAdd = useCallback((customer) => {
    setSelectedCustomer(customer);
    setForm({ ...INITIAL_FORM, contactDate: new Date().toISOString().slice(0, 10) });
    addModal.onOpen();
  }, [addModal]);

  const openHistory = useCallback((customer) => {
    setSelectedCustomer(customer);
    historyModal.onOpen();
  }, [historyModal]);

  const handleSubmit = useCallback(async () => {
    if (!form.reason || !selectedCustomer) return;
    setSubmitting(true);
    try {
      const result = await createFollowUp({
        customerNumber: selectedCustomer.customerNumber,
        customerName: selectedCustomer.name,
        ...form,
        promiseAmount: form.promiseAmount ? Number(form.promiseAmount) : null,
      });
      setFollowUps((prev) => [result, ...prev]);
      addModal.onClose();
    } catch (err) {
      console.error("Error creating follow-up:", err);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedCustomer, addModal]);

  const setField = useCallback((key, val) => setForm((prev) => ({ ...prev, [key]: val })), []);


  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const runAiAnalysis = useCallback(async () => {
    if (!mergedData.length) return;
    setAiLoading(true);
    setAiAnalysis("");

    const today = new Date().toISOString().slice(0, 10);
    const uncontacted = mergedData.filter((c) => c.followUpCount === 0);
    const dueItems = mergedData.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate <= today);

    const snapshot = {
      kpis: [
        `ลูกหนี้ค้างชำระรวม: ${fmt(kpis.totalOverdue)} บาท (${kpis.total} ราย)`,
        `ติดต่อแล้ว: ${kpis.contacted} ราย, ยังไม่ติดต่อ: ${kpis.uncontacted} ราย`,
        `ครบกำหนดติดตามวันนี้: ${kpis.dueToday} ราย`,
        `ยอดที่สัญญาจะชำระ: ${fmt(kpis.promisedTotal)} บาท`,
      ].join("\n"),

      customers: mergedData.length
        ? [
            "| ลูกค้า | รหัส | ยอดค้าง | ปัจจุบัน | 1-30วัน | 31-60วัน | 60+วัน | ติดตามแล้ว | สถานะล่าสุด | นัดติดตาม |",
            "|---|---|---|---|---|---|---|---|---|---|",
            ...mergedData.slice(0, 30).map((c) =>
              `| ${c.name} | ${c.customerNumber} | ${fmt(c.balanceDue)} | ${fmt(c.current)} | ${fmt(c.period1)} | ${fmt(c.period2)} | ${fmt(c.period3)} | ${c.followUpCount} ครั้ง | ${c.lastStatus || "-"} | ${c.nextFollowUpDate || "-"} |`
            ),
          ].join("\n")
        : "ไม่มีข้อมูล",

      followUpSummary: followUps.length
        ? [
            `จำนวนการติดตามทั้งหมด: ${followUps.length} ครั้ง`,
            `สถานะ: pending=${followUps.filter((f) => f.status === "pending").length}, promised=${followUps.filter((f) => f.status === "promised").length}, partial=${followUps.filter((f) => f.status === "partial").length}, escalated=${followUps.filter((f) => f.status === "escalated").length}, resolved=${followUps.filter((f) => f.status === "resolved").length}`,
            `สาเหตุที่พบบ่อย: ${[...new Set(followUps.map((f) => f.reason))].filter(Boolean).join(", ")}`,
          ].join("\n")
        : "ยังไม่มีประวัติติดตาม",

      uncontacted: uncontacted.length
        ? uncontacted.slice(0, 15).map((c) => `- ${c.name} (${c.customerNumber}): ค้าง ${fmt(c.balanceDue)} บาท (60+ วัน: ${fmt(c.period3)})`).join("\n")
        : "ไม่มี",

      dueToday: dueItems.length
        ? dueItems.map((c) => `- ${c.name} (${c.customerNumber}): ค้าง ${fmt(c.balanceDue)} บาท, นัด ${c.nextFollowUpDate}, สถานะ: ${c.lastStatus || "-"}`).join("\n")
        : "ไม่มี",
    };

    try {
      const res = await fetch("/api/finance/aiCollections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) setAiAnalysis((prev) => prev + content);
          } catch {}
        }
      }
    } catch (err) {
      setAiAnalysis(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [mergedData, kpis, followUps]);

  return {
    loading,
    mergedData,
    kpis,
    selectedCustomer,
    form,
    setField,
    submitting,
    handleSubmit,
    addModal,
    historyModal,
    openAdd,
    openHistory,
    customerHistory,
    reportSince,
    setReportSince,
    reportUntil,
    setReportUntil,
    reportData,
    loadData,
    followUps,
    aiAnalysis,
    aiLoading,
    runAiAnalysis,
  };
}
