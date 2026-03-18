import { api } from "@/lib/api.server";
import ConfigCheckClient from "@/modules/settings/ConfigCheckClient";

export default async function ConfigCheckPage() {
  const status = await api("/api/configCheck");

  return <ConfigCheckClient initialStatus={status} />;
}
