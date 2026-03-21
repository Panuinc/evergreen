import { createClient } from "@supabase/supabase-js";
import QuotationDocument from "./quotationDocument";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getQuotation(id) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("mktQuotation")
    .select("*")
    .eq("mktQuotationId", id)
    .single();

  return data;
}

async function getQuotationLines(id) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("mktQuotationLine")
    .select("*")
    .eq("mktQuotationLineQuotationId", id)
    .order("mktQuotationLineOrder", { ascending: true });

  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    return { title: "ไม่พบใบเสนอราคา" };
  }

  return {
    title: `ใบเสนอราคา ${quotation.mktQuotationNumber || id}`,
    description: `ใบเสนอราคาสำหรับ ${quotation.mktQuotationCustomerName || ""}`,
  };
}

export default async function QuotationPage({ params }) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xs text-muted-foreground">ไม่พบใบเสนอราคา</p>
      </div>
    );
  }

  const lines = await getQuotationLines(id);

  return <QuotationDocument quotation={quotation} lines={lines || []} />;
}
