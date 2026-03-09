"use client";

import { usePerf360 } from "@/modules/performance/hooks/usePerf360";
import Feedback360View from "@/modules/performance/components/Feedback360View";
import Loading from "@/components/ui/Loading";

export default function Feedback360Page() {
  const hook = usePerf360();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <Feedback360View
      activeTab={hook.activeTab}
      onTabChange={hook.setActiveTab}
      pendingReviews={hook.pendingReviews}
      loadingPending={hook.loadingPending}
      cycles={hook.cycles}
      loadingCycles={hook.loadingCycles}
      selectedCycle={hook.selectedCycle}
      onSelectCycle={hook.setSelectedCycle}
      competencies={hook.competencies}
      loadingCompetencies={hook.loadingCompetencies}
      savingCompetencies={hook.savingCompetencies}
      onSaveCompetencies={hook.handleSaveCompetencies}
      nominations={hook.nominations}
      loadingNominations={hook.loadingNominations}
      onDeleteNomination={hook.handleDeleteNomination}
      onOpenNominationForm={hook.handleOpenNominationForm}
      resultCycleId={hook.resultCycleId}
      onResultCycleIdChange={hook.setResultCycleId}
      myResults={hook.myResults}
      loadingResults={hook.loadingResults}
      onLoadMyResults={hook.loadMyResults}
      employees={hook.employees}
      cycleModal={hook.cycleModal}
      editingCycle={hook.editingCycle}
      cycleForm={hook.cycleForm}
      onCycleFormChange={hook.setCycleForm}
      savingCycle={hook.savingCycle}
      onSaveCycle={hook.handleSaveCycle}
      onOpenCycleForm={hook.handleOpenCycleForm}
      onDeleteCycle={hook.handleDeleteCycle}
      onTransition={hook.handleTransition}
      nominationModal={hook.nominationModal}
      nominationForm={hook.nominationForm}
      onNominationFormChange={hook.setNominationForm}
      savingNomination={hook.savingNomination}
      onSaveNomination={hook.handleSaveNomination}
      reviewModal={hook.reviewModal}
      activeReview={hook.activeReview}
      reviewCompetencies={hook.reviewCompetencies}
      reviewScores={hook.reviewScores}
      onSetReviewScore={hook.setReviewScore}
      reviewComments={hook.reviewComments}
      onReviewCommentsChange={hook.setReviewComments}
      submittingReview={hook.submittingReview}
      onSubmitReview={hook.handleSubmitReview}
      onOpenReview={hook.handleOpenReview}
    />
  );
}
