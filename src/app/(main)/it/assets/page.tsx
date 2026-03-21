import { api } from "@/lib/api.server";
import AssetsClient from "@/modules/it/assetsClient";
import type { ItAsset, HrEmployeeBasic } from "@/modules/it/types";

export default async function AssetsPage() {
  const [assets, employees] = await Promise.all([
    api<ItAsset[]>("/api/it/assets"),
    api<HrEmployeeBasic[]>("/api/hr/employees"),
  ]);

  return (
    <AssetsClient
      initialAssets={assets || []}
      initialEmployees={employees || []}
    />
  );
}
