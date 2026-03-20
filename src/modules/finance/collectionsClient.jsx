"use client";

import { useState, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import useSWR from "swr";
import { get, post, authFetch } from "@/lib/apiClient";
import CollectionsView from "@/modules/finance/components/collectionsView";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

const initialForm = {
  contactDate: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }),
  contactMethod: "phone",
  reason: "",
  reasonDetail: "",
  note: "",
  promiseDate: "",
  promiseAmount: "",
  status: "pending",
  nextFollowUpDate: "",
};

const fetcher = (url) => get(url);

export default function CollectionsClient() {
  const { data: arRaw, isLoading: arLoading, mutate: mutateAr } = useSWR("/api/finance/agedReceivables", fetcher);
  const { data: fuRaw, isLoading: fuLoading, mutate: mutateFu } = useSWR("/api/finance/collections", fetcher);

  const arData = arRaw || [];
  const followUps = fuRaw || [];
  const loading = arLoading || fuLoading;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const addModal = useDisclosure();
  const historyModal = useDisclosure();

  const [reportSince, setReportSince] = useState(() => {
    const bkDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
    return bkDate.slice(0, 7) + "-01";
  });
  const [reportUntil, setReportUntil] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }));

  const mergedData = useMemo(() => {
    const fuByCustomer = {};
    for (const fu of followUps) {
      if (!fuByCustomer[fu.arFollowUpCustomerNumber]) fuByCustomer[fu.arFollowUpCustomerNumber] = [];
      fuByCustomer[fu.arFollowUpCustomerNumber].push(fu);
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
          lastContactDate: latest?.arFollowUpContactDate,
          lastReason: latest?.arFollowUpReason,
          lastStatus: latest?.arFollowUpStatus,
          lastNote: latest?.arFollowUpNote,
          nextFollowUpDate: latest?.arFollowUpNextFollowUpDate,
          promiseDate: latest?.arFollowUpPromiseDate,
          promiseAmount: latest?.arFollowUpPromiseAmount,
        };
      })
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [arData, followUps]);

  const kpis = useMemo(() => {
    const totalOverdue = mergedData.reduce((s, c) => s + c.balanceDue, 0);
    const contacted = mergedData.filter((c) => c.followUpCount > 0).length;
    const uncontacted = mergedData.filter((c) => c.followUpCount === 0).length;
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
    const dueToday = mergedData.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate <= today).length;
    const promisedTotal = followUps
      .filter((f) => f.arFollowUpStatus === "promised" && f.arFollowUpPromiseAmount)
      .reduce((s, f) => s + Number(f.arFollowUpPromiseAmount), 0);
    return { totalOverdue, contacted, uncontacted, total: mergedData.length, dueToday, promisedTotal };
  }, [mergedData, followUps]);

  const reportData = useMemo(() => {
    const filtered = followUps.filter((f) => {
      if (reportSince && f.arFollowUpContactDate < reportSince) return false;
      if (reportUntil && f.arFollowUpContactDate > reportUntil) return false;
      return true;
    });

    const reasonsMap = {
      cash_flow: "ปัญหาสภาพคล่อง",
      dispute: "ข้อพิพาท/ไม่พอใจสินค้า-บริการ",
      waiting_approval: "รออนุมัติภายใน",
      no_contact: "ติดต่อไม่ได้",
      partial_payment: "จะชำระบางส่วน",
      forgotten: "ลืม/ไม่ทราบยอด",
      bankruptcy: "ปิดกิจการ/ล้มละลาย",
      other: "อื่นๆ",
    };
    const statusesMap = {
      pending: "รอติดตาม",
      promised: "สัญญาจะชำระ",
      partial: "ชำระบางส่วน",
      escalated: "ยกระดับ",
      resolved: "ชำระแล้ว",
      written_off: "ตัดหนี้สูญ",
    };

    const byReason = {};
    for (const f of filtered) {
      const key = f.arFollowUpReason || "other";
      if (!byReason[key]) byReason[key] = { name: reasonsMap[key] || key || "-", value: 0, key };
      byReason[key].value++;
    }

    const byStatus = {};
    for (const f of filtered) {
      const key = f.arFollowUpStatus || "pending";
      if (!byStatus[key]) byStatus[key] = { name: statusesMap[key] || key || "-", value: 0, key };
      byStatus[key].value++;
    }

    const uniqueCustomers = new Set(filtered.map((f) => f.arFollowUpCustomerNumber)).size;
    const totalPromised = filtered
      .filter((f) => f.arFollowUpPromiseAmount)
      .reduce((s, f) => s + Number(f.arFollowUpPromiseAmount), 0);

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
    return followUps.filter((f) => f.arFollowUpCustomerNumber === selectedCustomer.customerNumber);
  }, [followUps, selectedCustomer]);

  const openAdd = useCallback((customer) => {
    setSelectedCustomer(customer);
    setForm({ ...initialForm, contactDate: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }) });
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
      await post("/api/finance/collections", {
        customerNumber: selectedCustomer.customerNumber,
        customerName: selectedCustomer.name,
        ...form,
        promiseAmount: form.promiseAmount ? Number(form.promiseAmount) : null,
      });
      mutateFu();
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

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
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
            `สถานะ: pending=${followUps.filter((f) => f.arFollowUpStatus === "pending").length}, promised=${followUps.filter((f) => f.arFollowUpStatus === "promised").length}, partial=${followUps.filter((f) => f.arFollowUpStatus === "partial").length}, escalated=${followUps.filter((f) => f.arFollowUpStatus === "escalated").length}, resolved=${followUps.filter((f) => f.arFollowUpStatus === "resolved").length}`,
            `สาเหตุที่พบบ่อย: ${[...new Set(followUps.map((f) => f.arFollowUpReason))].filter(Boolean).join(", ")}`,
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
      const res = await authFetch("/api/finance/aiCollections", {
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

  return (
    <CollectionsView
      loading={loading}
      mergedData={mergedData}
      kpis={kpis}
      selectedCustomer={selectedCustomer}
      form={form}
      onFieldChange={setField}
      submitting={submitting}
      onSubmit={handleSubmit}
      addModal={addModal}
      historyModal={historyModal}
      onOpenAdd={openAdd}
      onOpenHistory={openHistory}
      customerHistory={customerHistory}
      reportSince={reportSince}
      onReportSinceChange={setReportSince}
      reportUntil={reportUntil}
      onReportUntilChange={setReportUntil}
      reportData={reportData}
      onReload={() => { mutateAr(); mutateFu(); }}
      followUps={followUps}
      aiAnalysis={aiAnalysis}
      aiLoading={aiLoading}
      runAiAnalysis={runAiAnalysis}
    />
  );
}
