import { api } from "@/lib/api.server";
import LabelDesignerClient from "@/modules/marketing/labelDesignerClient";
import type { LabelDesign } from "@/modules/marketing/types";

export default async function LabelDesignerPage() {
  const designs = await api<LabelDesign[]>("/api/marketing/labelDesigns");

  return <LabelDesignerClient initialDesigns={designs || []} />;
}
