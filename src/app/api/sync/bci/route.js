import { createClient } from "@supabase/supabase-js";
import { searchProjects, getProjectCount } from "@/lib/bciClient";

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseCategory(val) {
  if (!val) return null;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.join(", ") : val;
  } catch {
    return val;
  }
}

function mapProject(p) {
  return {
    projectId: p.PROJECT_ID,
    projectName: p.NAME || null,
    projectType: p.TYPE || null,
    projectDescription: p.PROJECT_DESCRIPTION || p.REMARKS || null,
    streetName: p.STREET_NAME || null,
    cityOrTown: p.CITYORTOWN || null,
    stateProvince: p.STATE_PROVINCE || null,
    region: p.REGION || null,
    country: p.COUNTRY || null,
    value: p.VALUE || null,
    currency: p.CURRENCY || "THB",
    projectStage: p.PROJECT_STAGE || null,
    projectStageStatus: p.PROJECT_STAGE_STATUS || null,
    developmentType: p.DEVELOPMENT_TYPE || null,
    ownershipType: p.OWNERSHIP_TYPE || null,
    category: parseCategory(p.CATEGORY),
    subCategory: parseCategory(p.SUB_CATEGORY),
    storeys: p.STOREY || null,
    floorArea: p.FLOOR_AREA || null,
    siteArea: p.SITE_AREA || null,
    lat: p.LAT ? parseFloat(p.LAT) : null,
    lon: p.LON ? parseFloat(p.LON) : null,
    constructionStartDate: parseDate(p.CONSTRUCTION_START_DATE),
    constructionEndDate: parseDate(p.CONSTRUCTION_END_DATE),
    constructionStartString: p.CONSTRUCTION_START_DATE_STRING || null,
    constructionEndString: p.CONSTRUCTION_END_DATE_STRING || null,
    remarks: p.REMARKS || null,
    statusText: p.STATUS_TEXT || null,
    sourceText: p.SOURCE_TEXT || null,
    bciResearcher: p.BCI_RESEARCHER || null,
    versionNumber: p.VERSION_NUMBER || null,
    publishedDate: parseDate(p.PUBLISHED_DATE),
    modifiedDate: parseDate(p.MODIFIED_DATE),
    stageId: p.STAGE_ID || null,
    statusId: p.STATUS_ID || null,
    categoryId: p.CATEGORY_ID || null,
    developmentTypeId: p.DEVELOPMENT_TYPE_ID || null,
    mainContractorMethod: p.MAIN_CONTRACTOR_APPOINTMENT_METHOD || null,
    syncedAt: new Date().toISOString(),
  };
}

export async function GET(request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const results = {};

  try {
    // 1. Get count first
    const countInfo = await getProjectCount();
    results.totalAvailable = countInfo.totalMatchedProjectFounds;
    results.totalValue = countInfo.totalMatchedProjectValue;

    // 2. Fetch projects (published since 2024)
    const projects = await searchProjects({
      lastUpdate: "2024-01-01",
      maxResults: 10000,
      onPage: (page, count, total) => {
        console.log(`[BCI Sync] Page ${page}: +${count} items (${total} total)`);
      },
    });
    results.projectsFetched = projects.length;

    // 3. Map and upsert to Supabase
    if (projects.length > 0) {
      const mapped = projects.map(mapProject).filter((p) => p.projectId);
      let upserted = 0;

      // Upsert in batches of 500
      for (let i = 0; i < mapped.length; i += 500) {
        const batch = mapped.slice(i, i + 500);
        const { error } = await supabase
          .from("bciProjects")
          .upsert(batch, { onConflict: "projectId" });
        if (error) throw error;
        upserted += batch.length;
      }
      results.projectsUpserted = upserted;
    }
  } catch (e) {
    results.error = e.message;
    console.error("[BCI Sync] Error:", e);
  }

  return Response.json({ success: !results.error, results });
}
