"use client";

import { useParams, useRouter } from "next/navigation";
import { useOmQuotationEditor } from "@/modules/marketing/hooks/useOmQuotationEditor";
import OmnichannelQuotationEditorView from "@/modules/marketing/components/OmnichannelQuotationEditorView";

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    quotation,
    setQuotation,
    lines,
    loading,
    saving,
    updateLine,
    calcTotal,
    handleSave,
    handleAction,
  } = useOmQuotationEditor(id);

  return (
    <OmnichannelQuotationEditorView
      id={id}
      quotation={quotation}
      setQuotation={setQuotation}
      lines={lines}
      loading={loading}
      saving={saving}
      updateLine={updateLine}
      calcTotal={calcTotal}
      handleSave={handleSave}
      handleAction={handleAction}
      onBack={() => router.push("/marketing/omnichannel/quotations")}
    />
  );
}
