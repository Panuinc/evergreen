import { api } from "@/lib/api.server";
import SalesDashboardClient from "@/modules/sales/SalesDashboardClient";

export default async function SalesDashboardPage() {
  const data = await api("/api/sales/dashboard");

  return <SalesDashboardClient initialData={data} />;
}
