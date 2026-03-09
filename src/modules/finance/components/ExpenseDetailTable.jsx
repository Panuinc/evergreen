"use client";

import {
  Card, CardBody, CardHeader, Button, Chip,
} from "@heroui/react";
import { Download } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { exportToExcel } from "@/lib/exportExcel";
import { CAL_MONTHS, CAL_MONTHS_SHORT, calMonthBE } from "@/modules/finance/glAccountMap";
import Loading from "@/components/ui/Loading";
const COLORS = ["#006FEE", "#17C964", "#F5A524", "#F31260", "#9353D3", "#00B8D9", "#FF6B35", "#7C3AED", "#EC4899", "#06B6D4", "#84CC16", "#EAB308"];

function fmt(v) {
  if (v === 0 || v == null) return "-";
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtPie(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

function ExpenseTable({ title, data, year, color, chipLabel, compYears = [], compKey = "selling" }) {
  if (!data || data.length === 0) return null;

  const beYear = (year || 0) + 543;
  const beYear2 = beYear % 100;

  // Pie chart from item rows (excluding total)
  const pieData = data
    .filter((r) => r.type === "item" && r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((r) => ({ name: r.label.substring(0, 25), value: r.total }));

  const handleExport = () => {
    const columns = [
      { header: "บัญชี", key: "account", width: 12 },
      { header: "รายการ", key: "label", width: 35 },
      ...CAL_MONTHS.map((m, i) => ({
        header: `${CAL_MONTHS_SHORT[i]} ${calMonthBE(i, year)}`,
        key: `m_${m}`,
        width: 14,
      })),
      { header: `รวม ${beYear}`, key: "total", width: 18 },
      ...compYears.map((cy) => ({
        header: `รวม ${cy.year + 543}`,
        key: `comp_${cy.year}`,
        width: 18,
      })),
    ];
    const exportData = data.map((r) => {
      const row = { account: r.account || "", label: r.label, total: r.total || 0 };
      CAL_MONTHS.forEach((m) => { row[`m_${m}`] = r.months?.[m] || 0; });
      compYears.forEach((cy) => { row[`comp_${cy.year}`] = cy[compKey][r.key] || 0; });
      return row;
    });
    exportToExcel(`${chipLabel}-${beYear}.xlsx`, columns, exportData);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Pie Chart - Top expenses */}
      {pieData.length > 0 && (
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardHeader className="pb-0">
            <p className="text-sm font-light">สัดส่วน{title} (Top 10)</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${fmtPie(value)}`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Detail Table */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-sm font-light">{title}</p>
            <Chip size="sm" variant="flat" color={color}>{chipLabel}</Chip>
          </div>
          <Button size="sm" variant="flat" startContent={<Download size={14} />} onPress={handleExport}>
            Export Excel
          </Button>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-default-100 border-b border-border">
                <th className="sticky left-0 z-10 bg-default-100 text-left px-3 py-2 min-w-[250px] font-light">รายการ</th>
                {CAL_MONTHS.map((m, i) => (
                  <th key={m} className="text-right px-2 py-2 min-w-[85px] font-light">
                    {CAL_MONTHS_SHORT[i]} {calMonthBE(i, year)}
                  </th>
                ))}
                <th className="text-right px-3 py-2 min-w-[110px] font-light bg-default-200">รวม {beYear}</th>
                {compYears.map((cy) => (
                  <th key={cy.year} className="text-right px-3 py-2 min-w-[110px] font-light bg-warning-50 text-warning-700">
                    {cy.year + 543}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const isTotal = row.type === "grandTotal";
                return (
                  <tr key={row.key} className={`border-b border-border ${isTotal ? "bg-primary-50 font-light text-primary" : ""}`}>
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5">
                      {row.account && <span className="text-muted-foreground mr-1">{row.account}</span>}
                      {row.label}
                    </td>
                    {CAL_MONTHS.map((m) => {
                      const val = row.months?.[m];
                      return (
                        <td key={m} className={`text-right font-mono text-sm px-2 ${val < 0 ? "text-danger" : ""}`}>
                          {fmt(val)}
                        </td>
                      );
                    })}
                    <td className={`text-right font-mono text-sm px-3 bg-default-50 font-light ${row.total < 0 ? "text-danger" : ""}`}>
                      {fmt(row.total)}
                    </td>
                    {compYears.map((cy) => {
                      const val = cy[compKey][row.key] || 0;
                      return (
                        <td key={cy.year} className={`text-right font-mono text-sm px-3 bg-warning-50/50 ${val < 0 ? "text-danger" : ""}`}>
                          {fmt(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ExpenseDetailTable({ sellingDetail, adminDetail, interestDetail, loading, year, compYears = [] }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ExpenseTable
        title="ค่าใช้จ่ายในการขาย"
        data={sellingDetail}
        year={year}
        color="warning"
        chipLabel="ค่าใช้จ่ายขาย"
        compYears={compYears}
        compKey="selling"
      />
      <ExpenseTable
        title="ค่าใช้จ่ายในการบริหาร"
        data={adminDetail}
        year={year}
        color="secondary"
        chipLabel="ค่าใช้จ่ายบริหาร"
        compYears={compYears}
        compKey="admin"
      />
      <ExpenseTable
        title="ต้นทุนทางการเงิน"
        data={interestDetail}
        year={year}
        color="danger"
        chipLabel="ดอกเบี้ยจ่าย"
        compYears={compYears}
        compKey="interest"
      />
    </div>
  );
}
