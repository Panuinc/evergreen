"use client";

import { Tabs, Tab, Select, SelectItem } from "@heroui/react";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function buildYearOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const opts = [];
  for (let y = currentYear; y >= currentYear - 4; y--) {
    opts.push({ key: String(y), label: `${y + 543} (${y})` });
  }
  return opts;
}

function buildQuarterOptions(year) {
  const be = year + 543;
  return [
    { key: "1", label: `Q1/${be} (ม.ค.–มี.ค.)` },
    { key: "2", label: `Q2/${be} (เม.ย.–มิ.ย.)` },
    { key: "3", label: `Q3/${be} (ก.ค.–ก.ย.)` },
    { key: "4", label: `Q4/${be} (ต.ค.–ธ.ค.)` },
  ];
}

function buildMonthOptions(year) {
  const be = year + 543;
  return THAI_MONTHS.map((name, i) => ({
    key: String(i + 1),
    label: `${name} ${be}`,
  }));
}


export default function FinancePeriodSelector({
  periodType,
  onPeriodTypeChange,
  selectedYear,
  onYearChange,
  selectedQuarter,
  onQuarterChange,
  selectedMonth,
  onMonthChange,
  compareEnabled,
  onCompareToggle,
}) {
  const yearOptions = buildYearOptions();
  const quarterOptions = buildQuarterOptions(selectedYear);
  const monthOptions = buildMonthOptions(selectedYear);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {}
      <Tabs
        size="md"
        variant="bordered"
        selectedKey={periodType}
        onSelectionChange={onPeriodTypeChange}
      >
        <Tab key="year" title="ปี" />
        <Tab key="quarter" title="ไตรมาส" />
        <Tab key="month" title="เดือน" />
      </Tabs>

      {}
      <Select
        size="md"
        variant="bordered"
        className="w-40"
        aria-label="เลือกปี"
        selectedKeys={[String(selectedYear)]}
        onSelectionChange={(keys) => {
          const val = [...keys][0];
          if (val) onYearChange(Number(val));
        }}
      >
        {yearOptions.map((opt) => (
          <SelectItem key={opt.key}>{opt.label}</SelectItem>
        ))}
      </Select>

      {}
      {periodType === "quarter" && (
        <Select
          size="md"
          variant="bordered"
          className="w-48"
          aria-label="เลือกไตรมาส"
          selectedKeys={[String(selectedQuarter)]}
          onSelectionChange={(keys) => {
            const val = [...keys][0];
            if (val) onQuarterChange(Number(val));
          }}
        >
          {quarterOptions.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
      )}

      {}
      {periodType === "month" && (
        <Select
          size="md"
          variant="bordered"
          className="w-44"
          aria-label="เลือกเดือน"
          selectedKeys={[String(selectedMonth)]}
          onSelectionChange={(keys) => {
            const val = [...keys][0];
            if (val) onMonthChange(Number(val));
          }}
        >
          {monthOptions.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
      )}

      {}
      <Tabs
        size="md"
        variant="bordered"
        selectedKey={compareEnabled ? "on" : "off"}
        onSelectionChange={(key) => onCompareToggle(key === "on")}
      >
        <Tab key="off" title="ปกติ" />
        <Tab key="on" title="เปรียบเทียบ YoY" />
      </Tabs>
    </div>
  );
}
