import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );

  const { data, error } = await supabase
    .from("whAppVersion")
    .select("*")
    .order("whAppVersionCode", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.whAppVersionId,
    version_code: data.whAppVersionCode,
    version_name: data.whAppVersionName,
    apk_url: data.whAppVersionDownloadUrl,
    release_notes: data.whAppVersionReleaseNotes,
    is_mandatory: data.whAppVersionIsMandatory || false,
    created_at: data.whAppVersionCreatedAt,
  });
}
