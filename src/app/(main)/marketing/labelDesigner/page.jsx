"use client";

import { useLabelDesigns } from "@/modules/marketing/hooks/useLabelDesigns";
import LabelDesignerView from "@/modules/marketing/components/LabelDesignerView";

export default function LabelDesignerPage() {
  const { designs, loading, save, remove } = useLabelDesigns();

  return (
    <LabelDesignerView
      savedDesigns={designs}
      designsLoading={loading}
      onSaveDesign={save}
      onDeleteDesign={remove}
    />
  );
}
