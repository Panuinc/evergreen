"use client";

import { Spinner } from "@heroui/react";
import { useEvaluation } from "@/hooks/performance/useEvaluation";
import EvaluationView from "@/components/performance/EvaluationView";

export default function EvaluationPage() {
  const hook = useEvaluation();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <EvaluationView
      activeTab={hook.activeTab}
      onTabChange={hook.setActiveTab}
      employees={hook.employees}
      selectedEmployee={hook.selectedEmployee}
      onSelectEmployee={hook.setSelectedEmployee}
      quarter={hook.quarter}
      onQuarterChange={hook.setQuarter}
      year={hook.year}
      onYearChange={hook.setYear}
      currentEmployee={hook.currentEmployee}
      perfEvaluationPeriod={hook.perfEvaluationPeriod}
      scores={hook.scores}
      onSetScore={hook.setScore}
      categoryAverages={hook.categoryAverages}
      overallScore={hook.overallScore}
      grade={hook.grade}
      answeredCount={hook.answeredCount}
      totalQuestions={hook.totalQuestions}
      progress={hook.progress}
      comment={hook.comment}
      onCommentChange={hook.setComment}
      onSubmit={hook.handleSubmit}
      saving={hook.saving}
      onClearScores={hook.clearScores}
      myResults={hook.myResults}
      companyAverage={hook.companyAverage}
      loadingResults={hook.loadingResults}
      onLoadCompanyAverage={hook.loadCompanyAverage}
      resultYear={hook.resultYear}
      onResultYearChange={hook.setResultYear}
      aiFeedback={hook.aiFeedback}
      loadingFeedback={hook.loadingFeedback}
      feedbackStale={hook.feedbackStale}
      onLoadAiFeedback={hook.loadAiFeedback}
      onClearAiFeedback={hook.clearAiFeedback}
      adminSummary={hook.adminSummary}
      loadingAdmin={hook.loadingAdmin}
      onLoadAdminSummary={hook.loadAdminSummary}
    />
  );
}
