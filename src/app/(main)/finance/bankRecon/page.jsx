import BankReconClient from "@/modules/finance/BankReconClient";

export default async function BankReconPage() {
  // Bank reconciliation relies on complex client-side state (file uploads,
  // statement selection, auto-match, manual matching, AR comparison, export).
  // Keep data fetching in the client hook; this page is a Server Component.
  return <BankReconClient />;
}
