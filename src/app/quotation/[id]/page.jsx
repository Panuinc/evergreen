import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import QuotationDocument from "./QuotationDocument";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getQuotation(id) {
  "use cache";
  cacheTag(`quotation-${id}`);
  cacheLife("hours");

  const supabase = getSupabase();
  const { data } = await supabase
    .from("omQuotations")
    .select("*")
    .eq("quotationId", id)
    .single();

  return data;
}

async function getQuotationLines(id) {
  "use cache";
  cacheTag(`quotation-${id}`, "quotation-lines");
  cacheLife("hours");

  const supabase = getSupabase();
  const { data } = await supabase
    .from("omQuotationLines")
    .select("*")
    .eq("lineQuotationId", id)
    .order("lineOrder", { ascending: true });

  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const quotation = await getQuotation(id);

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
