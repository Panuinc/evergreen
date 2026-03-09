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
const COLORS = ["#006FEE", "#17C964", "#F5A524", "#F31260", "#9353D3", "#00B8D9", "#FF6B35", "#7C3AED"];

function fmt(v) {
  if (v === 0 || v == null) return "-";
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default function RevenueDetailTable({ data, loading, year, compYears = [] }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-xs text-muted-foreground">ไม่มีข้อมูล</p>;
  }

  const beYear = (year || 0) + 543;
  const beYear2 = beYear % 100;

  // Pie chart from item rows (excluding total)
  const pieData = data
    .filter((r) => r.type === "item" && r.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((r) => ({ name: r.label.substring(0, 30), value: r.total }));

  const handleExport = () => {
    const columns = [
      { header: "บัญชี", key: "account", width: 12 },
      { header: "รายการ", key: "label", width: 40 },
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
      compYears.forEach((cy) => { row[`comp_${cy.year}`] = cy.revenue[r.key] || 0; });
      return row;
    });
    exportToExcel(`รายได้-${beYear}.xlsx`, columns, exportData);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Revenue Pie Chart */}
      {pieData.length > 0 && (
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardHeader className="pb-0">
            <p className="text-xs font-light">สัดส่วนรายได้</p>
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Revenue Detail Table */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-xs font-light">รายละเอียดรายได้</p>
            <Chip size="md" variant="flat" color="success">ปี {beYear}</Chip>
          </div>
          <Button size="md" variant="flat" startContent={<Download size={14} />} onPress={handleExport}>
            Export Excel
          </Button>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-default-100 border-b border-border">
                <th className="sticky left-0 z-10 bg-default-100 text-left px-3 py-2 min-w-[280px] font-light">รายการ</th>
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
                  <tr key={row.key} className={`border-b border-border ${isTotal ? "bg-success-50 font-light text-success-700" : ""}`}>
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5">
                      {row.account && <span className="text-muted-foreground mr-1">{row.account}</span>}
                      {row.label}
                    </td>
                    {CAL_MONTHS.map((m) => {
                      const val = row.months?.[m];
                      return (
                        <td key={m} className={`text-right font-mono text-xs px-2 ${val < 0 ? "text-danger" : ""}`}>
                          {fmt(val)}
                        </td>
                      );
                    })}
                    <td className={`text-right font-mono text-xs px-3 bg-default-50 font-light ${row.total < 0 ? "text-danger" : ""}`}>
                      {fmt(row.total)}
                    </td>
                    {compYears.map((cy) => {
                      const val = cy.revenue[row.key] || 0;
                      return (
                        <td key={cy.year} className={`text-right font-mono text-xs px-3 bg-warning-50/50 ${val < 0 ? "text-danger" : ""}`}>
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
