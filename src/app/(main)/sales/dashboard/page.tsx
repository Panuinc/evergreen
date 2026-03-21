import { api } from "@/lib/api.server";
import SalesDashboardClient from "@/modules/sales/salesDashboardClient";
import type { SalesDashboardData } from "@/modules/sales/types";

export default async function SalesDashboardPage() {
  const data = await api<SalesDashboardData>("/api/sales/dashboard");

  return <SalesDashboardClient initialData={data} />;
}
