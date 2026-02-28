"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuotationEditor } from "@/hooks/marketing/useQuotationEditor";
import OmnichannelQuotationEditorView from "@/components/marketing/OmnichannelQuotationEditorView";

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
  } = useQuotationEditor(id);

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
