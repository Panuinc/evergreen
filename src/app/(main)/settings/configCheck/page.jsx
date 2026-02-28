"use client";

import { useConfigCheck } from "@/hooks/shared/useConfigCheck";
import ConfigCheckView from "@/modules/settings/components/ConfigCheckView";

export default function ConfigCheckPage() {
  const { status, loading, refetch } = useConfigCheck();

  return (
    <ConfigCheckView status={status} loading={loading} refetch={refetch} />
  );
}
