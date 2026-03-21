import { api } from "@/lib/api.server";
import AccountsClient from "@/modules/sales/accountsClient";
import type { SalesAccount } from "@/modules/sales/types";

export default async function AccountsPage() {
  const accounts = await api<SalesAccount[]>("/api/sales/accounts");

  return <AccountsClient initialAccounts={accounts || []} />;
}
