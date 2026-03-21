"use client";

import { Tabs, Tab } from "@heroui/react";


export default function CompareToggle({ value, onChange }) {
  return (
    <Tabs
      size="md"
      variant="bordered"
      selectedKey={value || "off"}
      onSelectionChange={(key) => onChange(key === "off" ? null : key)}
    >
      <Tab key="off" title="ปกติ" />
      <Tab key="ytm" title="YTM" />
      <Tab key="yty" title="YTY" />
    </Tabs>
  );
}
