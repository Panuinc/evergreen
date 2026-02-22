import { createClient } from "@supabase/supabase-js";
import { searchProjects, getProjectCount, getProjectDetail } from "@/lib/bciClient";

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

// Role group IDs from BCI: 5=Owner/Developer, 2=Architect, 1=Contractor, 6=Engineer/PM
function extractContacts(contactArray) {
  if (!Array.isArray(contactArray) || contactArray.length === 0) return {};

  const findByRoleGroup = (groupId) =>
    contactArray.find((c) => c.role_group_id === groupId);
  const findByRoleId = (roleId) =>
    contactArray.find((c) => c.role_id === roleId);

  // Owner/Developer (role_group_id=5, role_id=4=Developer or 3=Owner)
  const owner = findByRoleId(4) || findByRoleId(3) || findByRoleGroup(5);
  // Architect (role_group_id=2, role_id=7=Architect)
  const architect = findByRoleId(7) || findByRoleGroup(2);
  // Main Contractor (role_group_id=1)
  const contractor = findByRoleGroup(1);
  // PM / Consultant (role_group_id=5, role_id=16111=PM Consultant)
  const pm = findByRoleId(16111) || findByRoleGroup(6);

  const map = (c, prefix) => {
    if (!c) return {};
    const name = [c.first_name, c.surname].filter(Boolean).join(" ").trim();
    return {
      [`${prefix}Company`]: c.company_name || null,
      [`${prefix}Contact`]: name || null,
      [`${prefix}Phone`]: c.landline || c.mobile || null,
      [`${prefix}Email`]: c.email_address || null,
    };
  };

  return {
    ...map(owner, "owner"),
    ...map(architect, "architect"),
    ...map(contractor, "contractor"),
    ...map(pm, "pm"),
  };
}

function mapProject(p, now) {
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
    ...extractContacts(p.CONTACT),
    syncedAt: now,
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

  const now = new Date().toISOString();
  const results = {};

  try {
    // 1. Get count first
    const countInfo = await getProjectCount();
    results.totalAvailable = countInfo.totalMatchedProjectFounds;
    results.totalValue = countInfo.totalMatchedProjectValue;

    // 2. Fetch projects (published since 2024)
    const projects = await searchProjects({
      lastUpdate: "2025-01-01",
      maxResults: 10000,
      onPage: (page, count, total) => {
        console.log(`[BCI Sync] Page ${page}: +${count} items (${total} total)`);
      },
    });
    results.projectsFetched = projects.length;

    // 3. Map and upsert to Supabase
    if (projects.length > 0) {
      const mapped = projects.map((p) => mapProject(p, now)).filter((p) => p.projectId);
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

      // Cleanup stale projects ที่ไม่มีใน source แล้ว
      const { count: cleanedUp, error: cleanupErr } = await supabase
        .from("bciProjects")
        .delete({ count: "exact" })
        .lt("syncedAt", now);

      if (cleanupErr) {
        results.cleanupError = cleanupErr.message;
      } else {
        results.projectsCleaned = cleanedUp || 0;
      }
    }
  } catch (e) {
    results.error = e.message;
    console.error("[BCI Sync] Error:", e);
  }

  return Response.json({ success: !results.error, results });
}

/**
 * POST: Sync contacts for projects that don't have contact data yet.
 * Fetches project detail one by one (rate-limited).
 */
export async function POST(request) {
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

  const body = await request.json().catch(() => ({}));
  const limit = body.limit || 500; // Process N projects per call

  const results = { updated: 0, errors: 0, skipped: 0 };

  try {
    // Get projects without contact data
    const { data: projects, error: fetchErr } = await supabase
      .from("bciProjects")
      .select("projectId")
      .is("ownerCompany", null)
      .order("modifiedDate", { ascending: false })
      .limit(limit);

    if (fetchErr) throw fetchErr;
    results.total = projects?.length || 0;

    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    for (const proj of projects || []) {
      // Abort early if too many consecutive failures (likely auth issue)
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        results.aborted = true;
        results.abortReason = `Stopped after ${MAX_CONSECUTIVE_ERRORS} consecutive errors (likely auth expired)`;
        console.warn(`[BCI Contacts] Aborting: ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
        break;
      }

      try {
        const detail = await getProjectDetail(proj.projectId);
        const contacts = extractContacts(detail?.CONTACT);
        consecutiveErrors = 0; // Reset on success

        if (Object.values(contacts).some(Boolean)) {
          const { error } = await supabase
            .from("bciProjects")
            .update(contacts)
            .eq("projectId", proj.projectId);

          if (error) {
            results.errors++;
          } else {
            results.updated++;
          }
        } else {
          // Mark as checked (set empty string so we skip next time)
          await supabase
            .from("bciProjects")
            .update({ ownerCompany: "" })
            .eq("projectId", proj.projectId);
          results.skipped++;
        }

        // Rate limit: 500ms between requests
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        console.error(`[BCI Contacts] Error for ${proj.projectId}:`, e.message);
        results.errors++;
        consecutiveErrors++;
      }
    }
  } catch (e) {
    results.error = e.message;
    console.error("[BCI Contacts Sync] Error:", e);
  }

  return Response.json({ success: !results.error, results });
}
