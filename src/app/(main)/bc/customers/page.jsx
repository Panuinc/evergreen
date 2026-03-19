import { api } from "@/lib/api.server";
import BcCustomersView from "@/modules/bc/components/bcCustomersView";

export default async function BcCustomersPage() {
  const customers = await api("/api/bc/customers");

  return <BcCustomersView customers={customers || []} loading={false} />;
}
