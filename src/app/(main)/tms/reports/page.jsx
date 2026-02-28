"use client";

import { useTmsReports } from "@/modules/tms/hooks/useTmsReports";
import ReportsView from "@/modules/tms/components/ReportsView";

export default function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    loading,
    summary,
  } = useTmsReports();

  return (
    <ReportsView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      data={data}
      loading={loading}
      summary={summary}
    />
  );
}
