"use client";

import { Spinner } from "@heroui/react";
import { useOkr } from "@/modules/performance/hooks/useOkr";
import OkrView from "@/modules/performance/components/OkrView";

export default function OkrPage() {
  const hook = useOkr();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <OkrView
      activeTab={hook.activeTab}
      onTabChange={hook.setActiveTab}
      filterYear={hook.filterYear}
      onFilterYearChange={hook.setFilterYear}
      filterQuarter={hook.filterQuarter}
      onFilterQuarterChange={hook.setFilterQuarter}
      objectives={hook.objectives}
      teamObjectives={hook.teamObjectives}
      companyObjectives={hook.companyObjectives}
      loadingObjectives={hook.loadingObjectives}
      objectiveModal={hook.objectiveModal}
      editingObjective={hook.editingObjective}
      objectiveForm={hook.objectiveForm}
      onObjectiveFormChange={hook.setObjectiveForm}
      savingObjective={hook.savingObjective}
      onSaveObjective={hook.handleSaveObjective}
      onOpenObjectiveForm={hook.handleOpenObjectiveForm}
      onDeleteObjective={hook.handleDeleteObjective}
      onUpdateObjectiveStatus={hook.handleUpdateObjectiveStatus}
      krModal={hook.krModal}
      editingKr={hook.editingKr}
      krForm={hook.krForm}
      onKrFormChange={hook.setKrForm}
      savingKr={hook.savingKr}
      onSaveKr={hook.handleSaveKr}
      onOpenKrForm={hook.handleOpenKrForm}
      onDeleteKr={hook.handleDeleteKr}
      checkinModal={hook.checkinModal}
      checkinKr={hook.checkinKr}
      checkinValue={hook.checkinValue}
      onCheckinValueChange={hook.setCheckinValue}
      checkinNote={hook.checkinNote}
      onCheckinNoteChange={hook.setCheckinNote}
      savingCheckin={hook.savingCheckin}
      onSaveCheckin={hook.handleSaveCheckin}
      onOpenCheckin={hook.handleOpenCheckin}
    />
  );
}
