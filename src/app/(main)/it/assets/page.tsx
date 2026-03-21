import { api } from "@/lib/api.server";
import AssetsClient from "@/modules/it/assetsClient";

export default async function AssetsPage() {
  const [assets, employees] = await Promise.all([
    api("/api/it/assets"),
    api("/api/hr/employees"),
  ]);

  return (
    <AssetsClient
      initialAssets={assets || []}
      initialEmployees={employees || []}
    />
  );
}
