"use client";

import { useParams, useRouter } from "next/navigation";
import { useCrmQuotationEditor } from "@/modules/sales/hooks/useCrmQuotationEditor";
import QuotationEditorView from "@/modules/sales/components/QuotationEditorView";

export default function QuotationEditorPage() {
  const params = useParams();
  const quotationId = params.id;
  const router = useRouter();
  const {
    quotation,
    lines,
    loading,
    saving,
    discount,
    tax,
    setDiscount,
    setTax,
    addLine,
    removeLine,
    updateLine,
    calcSubtotal,
    calcTotal,
    handleSave,
    handleAction,
    updateQuotationField,
  } = useCrmQuotationEditor(quotationId);

  const onNavigateBack = () => {
    router.push("/sales/quotations");
  };

  return (
    <QuotationEditorView
      quotation={quotation}
      lines={lines}
      loading={loading}
      saving={saving}
      discount={discount}
      tax={tax}
      setDiscount={setDiscount}
      setTax={setTax}
      addLine={addLine}
      removeLine={removeLine}
      updateLine={updateLine}
      calcSubtotal={calcSubtotal}
      calcTotal={calcTotal}
      handleSave={handleSave}
      handleAction={handleAction}
      updateQuotationField={updateQuotationField}
      onNavigateBack={onNavigateBack}
    />
  );
}
