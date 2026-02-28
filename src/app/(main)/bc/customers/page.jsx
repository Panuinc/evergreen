"use client";

import { useBcCustomers } from "@/hooks/bc/useBcCustomers";
import BcCustomersView from "@/components/bc/BcCustomersView";

export default function BcCustomersPage() {
  const { customers, loading } = useBcCustomers();

  return <BcCustomersView customers={customers} loading={loading} />;
}
