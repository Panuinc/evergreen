import { createClient } from "@supabase/supabase-js";
import QuotationDocument from "./QuotationDocument";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data: quotation } = await supabase
    .from("omQuotations")
    .select("quotationNo, customerName")
    .eq("quotationId", id)
    .single();

  if (!quotation) {
    return { title: "ไม่พบใบเสนอราคา" };
  }

  return {
    title: `ใบเสนอราคา ${quotation.quotationNo || id}`,
    description: `ใบเสนอราคาสำหรับ ${quotation.customerName || ""}`,
  };
}

export default async function QuotationPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: quotation } = await supabase
    .from("omQuotations")
    .select("*")
    .eq("quotationId", id)
    .single();

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-default-500">ไม่พบใบเสนอราคา</p>
      </div>
    );
  }

  const { data: lines } = await supabase
    .from("omQuotationLines")
    .select("*")
    .eq("lineQuotationId", id)
    .order("lineOrder", { ascending: true });

  return <QuotationDocument quotation={quotation} lines={lines || []} />;
}
