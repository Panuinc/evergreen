import { createClient } from "@supabase/supabase-js";
import { withAuth } from "@/app/api/_lib/auth";
import * as XLSX from "xlsx";

/**
 * Column mapping: BCI LeadManager export headers → Supabase bciProjects columns.
 * Keys are lowercased + trimmed for flexible matching.
 */
const COLUMN_MAP = {
  // Project ID (required)
  "project id": "projectId",
  "project_id": "projectId",
  "projectid": "projectId",
  "id": "projectId",
  // Project info
  "project name": "projectName",
  "name": "projectName",
  "project type": "projectType",
  "type": "projectType",
  "description": "projectDescription",
  "project description": "projectDescription",
  // Location
  "street": "streetName",
  "street name": "streetName",
  "address": "streetName",
  "city": "cityOrTown",
  "city or town": "cityOrTown",
  "city/town": "cityOrTown",
  "province": "stateProvince",
  "state": "stateProvince",
  "state/province": "stateProvince",
  "state province": "stateProvince",
  "region": "region",
  "country": "country",
  // Value
  "value": "value",
  "project value": "value",
  "currency": "currency",
  // Stage & Status
  "stage": "projectStage",
  "project stage": "projectStage",
  "status": "projectStageStatus",
  "stage status": "projectStageStatus",
  "project stage status": "projectStageStatus",
  // Type & Category
  "development type": "developmentType",
  "dev type": "developmentType",
  "ownership type": "ownershipType",
  "ownership": "ownershipType",
  "category": "category",
  "sub category": "subCategory",
  "subcategory": "subCategory",
  // Building info
  "storeys": "storeys",
  "storey": "storeys",
  "floors": "storeys",
  "floor area": "floorArea",
  "site area": "siteArea",
  // Dates
  "construction start": "constructionStartDate",
  "construction start date": "constructionStartDate",
  "con. start": "constructionStartDate",
  "construction end": "constructionEndDate",
  "construction end date": "constructionEndDate",
  "con. end": "constructionEndDate",
  "modified": "modifiedDate",
  "modified date": "modifiedDate",
  "updated": "modifiedDate",
  "last updated": "modifiedDate",
  "published date": "publishedDate",
  // Contacts - Owner
  "owner": "ownerCompany",
  "owner company": "ownerCompany",
  "owner/developer": "ownerCompany",
  "owner contact": "ownerContact",
  "owner phone": "ownerPhone",
  "owner email": "ownerEmail",
  // Contacts - Architect
  "architect": "architectCompany",
  "architect company": "architectCompany",
  "architect contact": "architectContact",
  "architect phone": "architectPhone",
  "architect email": "architectEmail",
  // Contacts - Contractor
  "contractor": "contractorCompany",
  "contractor company": "contractorCompany",
  "main contractor": "contractorCompany",
  "contractor contact": "contractorContact",
  "contractor phone": "contractorPhone",
  "contractor email": "contractorEmail",
  // Contacts - PM
  "pm": "pmCompany",
  "pm company": "pmCompany",
  "consultant": "pmCompany",
  "pm contact": "pmContact",
  "pm phone": "pmPhone",
  "pm email": "pmEmail",
  // Other
  "remarks": "remarks",
  "main contractor method": "mainContractorMethod",
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
  "constructionStartDate",
  "constructionEndDate",
  "modifiedDate",
  "publishedDate",
]);

const NUMBER_FIELDS = new Set([
  "value",
  "storeys",
  "floorArea",
  "siteArea",
  "lat",
  "lon",
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

    // Check if projectId is mapped
    const hasProjectId = Object.values(mapping).includes("projectId");
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
      const record = { syncedAt: now };

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

      // projectId must be a number for BCI
      if (record.projectId) {
        const pid = parseNumber(record.projectId);
        if (pid) {
          record.projectId = pid;
          mapped.push(record);
        } else {
          errors.push(`Row ${i + 2}: Invalid projectId "${record.projectId}"`);
        }
      } else {
        errors.push(`Row ${i + 2}: Missing projectId`);
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
        .from("bciProjects")
        .upsert(batch, { onConflict: "projectId" });
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
