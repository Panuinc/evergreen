"use client";

import { useState } from "react";
import {
  Card, CardBody, CardHeader, Spinner, Button, Chip,
  Popover, PopoverTrigger, PopoverContent, Input,
} from "@heroui/react";
import { Download, Pencil, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { exportToExcel } from "@/lib/exportExcel";
import { CAL_MONTHS, CAL_MONTHS_SHORT, calMonthBE } from "@/modules/finance/glAccountMap";

function fmt(v) {
  if (v === 0 || v == null) return "-";
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtShort(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function getRowClass(row) {
  switch (row.type) {
    case "subtotal": return "bg-default-100 font-semibold";
    case "grandTotal": return "bg-primary-50 font-bold text-primary";
    case "deduction": return "text-danger";
    default: return "";
  }
}

function parseLocaleNum(str) {
  if (!str) return 0;
  return Number(String(str).replace(/,/g, "")) || 0;
}

function fmtInput(v) {
  if (!v && v !== 0) return "";
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default function CogsDetailTable({
  data, chartData, loading, year, compYears = [],
  inventoryOverride, onSaveInventoryOverride, onClearInventoryOverride,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [beginInput, setBeginInput] = useState("");
  const [endInput, setEndInput] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>;
  }

  const beYear = (year || 0) + 543;
  const beYear2 = beYear % 100;

  const handleOpenPopover = () => {
    setBeginInput(inventoryOverride ? fmtInput(inventoryOverride.beginningInventory) : "");
    setEndInput(inventoryOverride ? fmtInput(inventoryOverride.endingInventory) : "");
    setIsPopoverOpen(true);
  };

  const handleSave = () => {
    const b = parseLocaleNum(beginInput);
    const e = parseLocaleNum(endInput);
    onSaveInventoryOverride?.({ beginningInventory: b, endingInventory: e });
    setIsPopoverOpen(false);
  };

  const handleClear = () => {
    onClearInventoryOverride?.();
    setIsPopoverOpen(false);
  };

  const handleExport = () => {
    const columns = [
      { header: "รายการ", key: "label", width: 30 },
      ...CAL_MONTHS.map((m, i) => ({
        header: `${CAL_MONTHS_SHORT[i]} ${calMonthBE(i, year)}`,
        key: `m_${m}`,
        width: 15,
      })),
      { header: `รวม ${beYear}`, key: "total", width: 18 },
      ...compYears.map((cy) => ({
        header: `รวม ${cy.year + 543}`,
        key: `comp_${cy.year}`,
        width: 18,
      })),
    ];
    const exportData = data.map((r) => {
      const row = { label: r.label || r.labelEn, total: r.total || 0 };
      CAL_MONTHS.forEach((m) => { row[`m_${m}`] = r.months?.[m] || 0; });
      compYears.forEach((cy) => { row[`comp_${cy.year}`] = cy.cogs[r.key] || 0; });
      return row;
    });
    exportToExcel(`ต้นทุนขาย-${beYear}.xlsx`, columns, exportData);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* COGS Composition Chart */}
      {chartData && chartData.length > 0 && (
        <Card shadow="none" className="border border-foreground/15">
          <CardHeader className="pb-0">
            <h3 className="text-sm font-semibold">องค์ประกอบต้นทุนรายเดือน</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  formatter={(v, name) => [fmt(v), name]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="วัตถุดิบ" stackId="a" fill="#006FEE" />
                <Bar dataKey="แรงงาน" stackId="a" fill="#17C964" />
                <Bar dataKey="โสหุ้ยการผลิต" stackId="a" fill="#F5A524" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* COGS Detail Table */}
      <Card shadow="none" className="border border-foreground/15">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">รายละเอียดต้นทุนขาย</h3>
            <Chip size="sm" variant="flat" color="warning">ปี {beYear}</Chip>
            {inventoryOverride && (
              <Chip size="sm" variant="flat" color="success">ปรับปรุงสินค้าคงเหลือแล้ว</Chip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  size="sm"
                  variant={inventoryOverride ? "flat" : "bordered"}
                  color={inventoryOverride ? "success" : "default"}
                  startContent={<Pencil size={14} />}
                  onPress={handleOpenPopover}
                >
                  ปรับปรุงสินค้าคงเหลือ
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold">ปรับปรุงสินค้าคงเหลือ (Manual Override)</h4>
                  <p className="text-xs text-default-500">
                    กรอกค่าจาก Excel ของ Manager Account เพื่อปรับปรุงต้นทุนขาย
                  </p>
                  <Input
                    label="สินค้าคงเหลือต้นงวด"
                    placeholder="เช่น 9,896,091.35"
                    size="sm"
                    value={beginInput}
                    onValueChange={setBeginInput}
                    description="51200-00 Beginning Inventory"
                  />
                  <Input
                    label="สินค้าคงเหลือปลายงวด"
                    placeholder="เช่น 22,278,335.58"
                    size="sm"
                    value={endInput}
                    onValueChange={setEndInput}
                    description="115xx Ending Inventory (รวม วัตถุดิบ+WIP+สำเร็จรูป)"
                  />
                  <div className="flex justify-between gap-2 mt-1">
                    {inventoryOverride && (
                      <Button size="sm" color="danger" variant="flat" startContent={<Trash2 size={14} />} onPress={handleClear}>
                        ล้าง (ใช้ค่า BC)
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button size="sm" variant="flat" onPress={() => setIsPopoverOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button size="sm" color="primary" onPress={handleSave}>
                      บันทึก
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="flat" startContent={<Download size={14} />} onPress={handleExport}>
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-default-100 border-b border-foreground/15">
                <th className="sticky left-0 z-10 bg-default-100 text-left px-3 py-2 min-w-[220px] font-semibold">รายการ</th>
                {CAL_MONTHS.map((m, i) => (
                  <th key={m} className="text-right px-2 py-2 min-w-[90px] font-semibold">
                    {`${CAL_MONTHS_SHORT[i]} ${calMonthBE(i, year)}`}
                  </th>
                ))}
                <th className="text-right px-3 py-2 min-w-[110px] font-bold bg-default-200">รวม {beYear}</th>
                {compYears.map((cy) => (
                  <th key={cy.year} className="text-right px-3 py-2 min-w-[110px] font-semibold bg-warning-50 text-warning-700">
                    {cy.year + 543}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.key} className={`border-b border-foreground/15 ${getRowClass(row)}`}>
                  <td className="sticky left-0 z-10 bg-background px-3 py-1.5">
                    {row.label}
                    {row.labelEn && <span className="text-default-400 ml-1">({row.labelEn})</span>}
                  </td>
                  {CAL_MONTHS.map((m) => {
                    const val = row.months?.[m];
                    return (
                      <td key={m} className={`text-right font-mono text-xs px-2 ${val < 0 ? "text-danger" : ""}`}>
                        {fmt(val)}
                      </td>
                    );
                  })}
                  <td className={`text-right font-mono text-xs px-3 bg-default-50 font-semibold ${row.total < 0 ? "text-danger" : ""}`}>
                    {fmt(row.total)}
                  </td>
                  {compYears.map((cy) => {
                    const val = cy.cogs[row.key] || 0;
                    return (
                      <td key={cy.year} className={`text-right font-mono text-xs px-3 bg-warning-50/50 ${val < 0 ? "text-danger" : ""}`}>
                        {fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
