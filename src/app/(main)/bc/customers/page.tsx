import { api } from "@/lib/api.server";
import BcCustomersView from "@/modules/bc/components/bcCustomersView";
import type { BcCustomer } from "@/modules/bc/types";

export default async function BcCustomersPage() {
  const customers = await api<BcCustomer[]>("/api/bc/customers");

  return <BcCustomersView customers={customers || []} loading={false} />;
}
