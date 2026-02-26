import { createClient } from "@supabase/supabase-js";
import { withAuth } from "@/app/api/_lib/auth";
import * as XLSX from "xlsx";

/**
 * Column mapping: BCI LeadManager export headers → Supabase bciProject columns.
 * Keys are lowercased + trimmed for flexible matching.
 */
const COLUMN_MAP = {
  // Project ID (required)
  "project id": "bciProjectExternalId",
  "project_id": "bciProjectExternalId",
  "projectid": "bciProjectExternalId",
  "id": "bciProjectExternalId",
  // Project info
  "project name": "bciProjectName",
  "name": "bciProjectName",
  "project type": "bciProjectType",
  "type": "bciProjectType",
  "description": "bciProjectDescription",
  "project description": "bciProjectDescription",
  // Location
  "street": "bciProjectStreetName",
  "street name": "bciProjectStreetName",
  "address": "bciProjectStreetName",
  "city": "bciProjectCityOrTown",
  "city or town": "bciProjectCityOrTown",
  "city/town": "bciProjectCityOrTown",
  "province": "bciProjectStateProvince",
  "state": "bciProjectStateProvince",
  "state/province": "bciProjectStateProvince",
  "state province": "bciProjectStateProvince",
  "region": "bciProjectRegion",
  "country": "bciProjectCountry",
  // Value
  "value": "bciProjectValue",
  "project value": "bciProjectValue",
  "currency": "bciProjectCurrency",
  // Stage & Status
  "stage": "bciProjectStage",
  "project stage": "bciProjectStage",
  "status": "bciProjectStageStatus",
  "stage status": "bciProjectStageStatus",
  "project stage status": "bciProjectStageStatus",
  // Type & Category
  "development type": "bciProjectDevelopmentType",
  "dev type": "bciProjectDevelopmentType",
  "ownership type": "bciProjectOwnershipType",
  "ownership": "bciProjectOwnershipType",
  "category": "bciProjectCategory",
  "sub category": "bciProjectSubCategory",
  "subcategory": "bciProjectSubCategory",
  // Building info
  "storeys": "bciProjectStoreys",
  "storey": "bciProjectStoreys",
  "floors": "bciProjectStoreys",
  "floor area": "bciProjectFloorArea",
  "site area": "bciProjectSiteArea",
  // Dates
  "construction start": "bciProjectConstructionStartDate",
  "construction start date": "bciProjectConstructionStartDate",
  "con. start": "bciProjectConstructionStartDate",
  "construction end": "bciProjectConstructionEndDate",
  "construction end date": "bciProjectConstructionEndDate",
  "con. end": "bciProjectConstructionEndDate",
  "modified": "bciProjectModifiedDate",
  "modified date": "bciProjectModifiedDate",
  "updated": "bciProjectModifiedDate",
  "last updated": "bciProjectModifiedDate",
  "published date": "bciProjectPublishedDate",
  // Contacts - Owner
  "owner": "bciProjectOwnerCompany",
  "owner company": "bciProjectOwnerCompany",
  "owner/developer": "bciProjectOwnerCompany",
  "owner contact": "bciProjectOwnerContact",
  "owner phone": "bciProjectOwnerPhone",
  "owner email": "bciProjectOwnerEmail",
  // Contacts - Architect
  "architect": "bciProjectArchitectCompany",
  "architect company": "bciProjectArchitectCompany",
  "architect contact": "bciProjectArchitectContact",
  "architect phone": "bciProjectArchitectPhone",
  "architect email": "bciProjectArchitectEmail",
  // Contacts - Contractor
  "contractor": "bciProjectContractorCompany",
  "contractor company": "bciProjectContractorCompany",
  "main contractor": "bciProjectContractorCompany",
  "contractor contact": "bciProjectContractorContact",
  "contractor phone": "bciProjectContractorPhone",
  "contractor email": "bciProjectContractorEmail",
  // Contacts - PM
  "pm": "bciProjectPmCompany",
  "pm company": "bciProjectPmCompany",
  "consultant": "bciProjectPmCompany",
  "pm contact": "bciProjectPmContact",
  "pm phone": "bciProjectPmPhone",
  "pm email": "bciProjectPmEmail",
  // Other
  "remarks": "bciProjectRemarks",
  "main contractor method": "bciProjectMainContractorMethod",
};

function parseDate(val) {
  if (!val) return null;
  // Handle Excel serial dates
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d).toISOString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseNumber(val) {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

const DATE_FIELDS = new Set([
  "bciProjectConstructionStartDate",
  "bciProjectConstructionEndDate",
  "bciProjectModifiedDate",
  "bciProjectPublishedDate",
]);

const NUMBER_FIELDS = new Set([
  "bciProjectValue",
  "bciProjectStoreys",
  "bciProjectFloorArea",
  "bciProjectSiteArea",
  "bciProjectLat",
  "bciProjectLon",
]);

/**
 * POST: Import BCI projects from Excel/CSV file upload.
 * Accepts multipart form data with a 'file' field.
 */
export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return Response.json({ error: "File is empty" }, { status: 400 });
    }

    // Build column mapping from file headers
    const fileHeaders = Object.keys(rows[0]);
    const mapping = {};
    const unmapped = [];

    for (const header of fileHeaders) {
      const key = header.toLowerCase().trim();
      if (COLUMN_MAP[key]) {
        mapping[header] = COLUMN_MAP[key];
      } else {
        // Try partial match
        const match = Object.entries(COLUMN_MAP).find(([k]) => key.includes(k) || k.includes(key));
        if (match) {
          mapping[header] = match[1];
        } else {
          unmapped.push(header);
        }
      }
    }

    // Check if bciProjectExternalId is mapped
    const hasProjectId = Object.values(mapping).includes("bciProjectExternalId");
    if (!hasProjectId) {
      return Response.json({
        error: "Cannot find Project ID column. Available columns: " + fileHeaders.join(", "),
        mapping,
        unmapped,
      }, { status: 400 });
    }

    // Map rows to Supabase format
    const now = new Date().toISOString();
    const mapped = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const record = { bciProjectSyncedAt: now };

      for (const [header, dbCol] of Object.entries(mapping)) {
        let val = row[header];
        if (val == null || val === "") {
          record[dbCol] = null;
          continue;
        }
        if (DATE_FIELDS.has(dbCol)) {
          record[dbCol] = parseDate(val);
        } else if (NUMBER_FIELDS.has(dbCol)) {
          record[dbCol] = parseNumber(val);
        } else {
          record[dbCol] = String(val).trim() || null;
        }
      }

      // bciProjectExternalId must be a number for BCI
      if (record.bciProjectExternalId) {
        const pid = parseNumber(record.bciProjectExternalId);
        if (pid) {
          record.bciProjectExternalId = pid;
          mapped.push(record);
        } else {
          errors.push(`Row ${i + 2}: Invalid bciProjectExternalId "${record.bciProjectExternalId}"`);
        }
      } else {
        errors.push(`Row ${i + 2}: Missing bciProjectExternalId`);
      }
    }

    if (mapped.length === 0) {
      return Response.json({
        error: "No valid rows to import",
        parseErrors: errors.slice(0, 10),
      }, { status: 400 });
    }

    // Upsert in batches of 500
    let upserted = 0;
    for (let i = 0; i < mapped.length; i += 500) {
      const batch = mapped.slice(i, i + 500);
      const { error: upsertErr } = await supabase
        .from("bciProject")
        .upsert(batch, { onConflict: "bciProjectExternalId" });
      if (upsertErr) throw upsertErr;
      upserted += batch.length;
    }

    return Response.json({
      success: true,
      results: {
        totalRows: rows.length,
        imported: upserted,
        skipped: rows.length - mapped.length,
        parseErrors: errors.length,
        columnsMapped: Object.keys(mapping).length,
        columnsUnmapped: unmapped.length,
        mapping,
        unmapped: unmapped.length > 0 ? unmapped : undefined,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
    });
  } catch (e) {
    console.error("[BCI Import] Error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
