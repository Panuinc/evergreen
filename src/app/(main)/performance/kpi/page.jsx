"use client";

import { Spinner } from "@heroui/react";
import { useKpi } from "@/modules/performance/hooks/useKpi";
import KpiView from "@/modules/performance/components/KpiView";

export default function KpiPage() {
  const hook = useKpi();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <KpiView
      activeTab={hook.activeTab}
      onTabChange={hook.setActiveTab}
      myAssignments={hook.myAssignments}
      loadingAssignments={hook.loadingAssignments}
      filterYear={hook.filterYear}
      onFilterYearChange={hook.setFilterYear}
      dashboardData={hook.dashboardData}
      loadingDashboard={hook.loadingDashboard}
      definitions={hook.definitions}
      loadingDefinitions={hook.loadingDefinitions}
      employees={hook.employees}
      records={hook.selectedRecords}
      loadingRecords={hook.loadingRecords}
      onLoadRecords={hook.loadRecords}
      definitionModal={hook.definitionModal}
      editingDefinition={hook.editingDefinition}
      definitionForm={hook.definitionForm}
      onDefinitionFormChange={hook.setDefinitionForm}
      savingDefinition={hook.savingDefinition}
      onSaveDefinition={hook.handleSaveDefinition}
      onOpenDefinitionForm={hook.handleOpenDefinitionForm}
      onDeleteDefinition={hook.handleDeleteDefinition}
      assignmentModal={hook.assignmentModal}
      assignForm={hook.assignForm}
      onAssignFormChange={hook.setAssignForm}
      savingAssignment={hook.savingAssignment}
      onSaveAssignment={hook.handleSaveAssignment}
      onOpenAssignForm={hook.handleOpenAssignForm}
      recordModal={hook.recordModal}
      recordingAssignment={hook.recordingAssignment}
      recordForm={hook.recordForm}
      onRecordFormChange={hook.setRecordForm}
      savingRecord={hook.savingRecord}
      onSaveRecord={hook.handleSaveRecord}
      onOpenRecordForm={hook.handleOpenRecordForm}
    />
  );
}
