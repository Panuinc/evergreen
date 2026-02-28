"use client";

import { useBcCustomers } from "@/modules/bc/hooks/useBcCustomers";
import BcCustomersView from "@/modules/bc/components/BcCustomersView";

export default function BcCustomersPage() {
  const { customers, loading } = useBcCustomers();

  return <BcCustomersView customers={customers} loading={loading} />;
}
