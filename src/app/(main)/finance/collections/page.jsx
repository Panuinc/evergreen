"use client";

import { useCollections } from "@/modules/finance/hooks/useCollections";
import CollectionsView from "@/modules/finance/components/CollectionsView";

export default function CollectionsPage() {
  const hook = useCollections();

  return (
    <CollectionsView
      loading={hook.loading}
      mergedData={hook.mergedData}
      kpis={hook.kpis}
      selectedCustomer={hook.selectedCustomer}
      form={hook.form}
      onFieldChange={hook.setField}
      submitting={hook.submitting}
      onSubmit={hook.handleSubmit}
      addModal={hook.addModal}
      historyModal={hook.historyModal}
      onOpenAdd={hook.openAdd}
      onOpenHistory={hook.openHistory}
      customerHistory={hook.customerHistory}
      reportSince={hook.reportSince}
      onReportSinceChange={hook.setReportSince}
      reportUntil={hook.reportUntil}
      onReportUntilChange={hook.setReportUntil}
      reportData={hook.reportData}
      onReload={hook.loadData}
      followUps={hook.followUps}
    />
  );
}
