"use client";

import {
  Card, CardBody, CardHeader, Button, Chip,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
} from "@heroui/react";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { exportToExcel } from "@/lib/exportExcel";
import { CAL_MONTHS, CAL_MONTHS_SHORT, calMonthBE } from "@/modules/finance/glAccountMap";
import Loading from "@/components/ui/Loading";

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
    case "subtotal": return "bg-default-100 font-light";
    case "grandTotal": return "bg-primary-50 font-light text-primary";
    case "separator": return "h-2";
    default: return "";
  }
}

function getCellClass(val, row) {
  let cls = "text-right font-mono text-sm";
  if (row.type === "subtotal" || row.type === "grandTotal") cls += " font-light";
  if (val < 0) cls += " text-danger";
  return cls;
}

export default function MonthlyPnLTable({ data, chartData, loading, year, compYears = [] }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>;
  }

  const beYear = (year || 0) + 543;
  const beYear2 = beYear % 100;

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
    const exportData = data
      .filter((r) => r.type !== "separator")
      .map((r) => {
        const row = { label: r.label, total: r.total || 0 };
        CAL_MONTHS.forEach((m) => { row[`m_${m}`] = r.months?.[m] || 0; });
        compYears.forEach((cy) => { row[`comp_${cy.year}`] = cy.pnl[r.key] || 0; });
        return row;
      });
    exportToExcel(`งบกำไรขาดทุน-${beYear}.xlsx`, columns, exportData);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Monthly Trend Chart */}
      {chartData && chartData.length > 0 && (
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardHeader className="pb-0">
            <p className="text-sm font-light">แนวโน้มรายเดือน ปี {beYear}</p>
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
                <Bar dataKey="revenue" name="รายได้" fill="#006FEE" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cogs" name="ต้นทุนขาย" fill="#F5A524" radius={[2, 2, 0, 0]} />
                <Bar dataKey="netProfit" name="กำไรสุทธิ" fill="#17C964" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* P&L Table */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-sm font-light">งบกำไรขาดทุนรายเดือน</p>
            <Chip size="md" variant="flat" color="primary">ปี {beYear}</Chip>
          </div>
          <Button size="md" variant="flat" startContent={<Download size={14} />} onPress={handleExport}>
            Export Excel
          </Button>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-default-100 border-b border-border">
                <th className="sticky left-0 z-10 bg-default-100 text-left px-3 py-2 min-w-[200px] font-light">รายการ</th>
                {CAL_MONTHS.map((m, i) => (
                  <th key={m} className="text-right px-2 py-2 min-w-[90px] font-light">
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
                if (row.type === "separator") {
                  return <tr key={row.key} className="h-1"><td colSpan={14 + compYears.length}></td></tr>;
                }
                return (
                  <tr key={row.key} className={`border-b border-border ${getRowClass(row)}`}>
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5">
                      {row.label}
                    </td>
                    {CAL_MONTHS.map((m) => (
                      <td key={m} className={getCellClass(row.months?.[m], row)}>
                        <span className="px-2">{fmt(row.months?.[m])}</span>
                      </td>
                    ))}
                    <td className={`${getCellClass(row.total, row)} bg-default-50 font-light`}>
                      <span className="px-3">{fmt(row.total)}</span>
                    </td>
                    {compYears.map((cy) => {
                      const val = cy.pnl[row.key] || 0;
                      return (
                        <td key={cy.year} className={`${getCellClass(val, row)} bg-warning-50/50`}>
                          <span className="px-3">{fmt(val)}</span>
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
