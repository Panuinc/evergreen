import FinanceDashboardClient from "@/modules/finance/financeDashboardClient";

export default async function FinanceDashboardPage() {
  // Finance dashboard relies heavily on client-side hooks (useFinanceDashboard,
  // useGlMonthlyData) with localStorage, period selectors, and streaming AI.
  // Keep data fetching in the client hooks; this page is a Server Component
  // that renders the client wrapper without "use client" directive.
  return <FinanceDashboardClient />;
}
