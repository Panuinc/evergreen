import { api } from "@/lib/api.server";
import LabelDesignerClient from "@/modules/marketing/LabelDesignerClient";

export default async function LabelDesignerPage() {
  const designs = await api("/api/marketing/labelDesigns");

  return <LabelDesignerClient initialDesigns={designs || []} />;
}
