"use client";

import { Tabs, Tab } from "@heroui/react";

/**
 * Toggle between normal / YTM / YTY comparison modes
 * @param {{ value: string|null, onChange: (mode: string|null) => void }} props
 */
export default function CompareToggle({ value, onChange }) {
  return (
    <Tabs
      size="sm"
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
