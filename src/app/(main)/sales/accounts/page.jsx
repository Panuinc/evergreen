import { api } from "@/lib/api.server";
import AccountsClient from "@/modules/sales/accountsClient";

export default async function AccountsPage() {
  const accounts = await api("/api/sales/accounts");

  return <AccountsClient initialAccounts={accounts || []} />;
}
