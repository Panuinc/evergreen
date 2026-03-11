"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อโปรเจค", uid: "bciProjectName", sortable: true },
  { name: "รายละเอียด", uid: "bciProjectDescription", sortable: false },
  { name: "สถานที่", uid: "bciProjectCityOrTown", sortable: true },
  { name: "จังหวัด", uid: "bciProjectStateProvince", sortable: true },
  { name: "ที่อยู่", uid: "bciProjectStreetName", sortable: true },
  { name: "ภูมิภาค", uid: "bciProjectRegion", sortable: true },
  { name: "มูลค่า (ล้าน)", uid: "bciProjectValue", sortable: true },
  { name: "ขั้นตอน", uid: "bciProjectStage", sortable: true },
  { name: "สถานะ", uid: "bciProjectStageStatus", sortable: true },
  { name: "หมวดหมู่", uid: "bciProjectCategory", sortable: true },
  { name: "หมวดหมู่ย่อย", uid: "bciProjectSubCategory", sortable: true },
  { name: "ประเภทการพัฒนา", uid: "bciProjectDevelopmentType", sortable: true },
  { name: "ประเภทกรรมสิทธิ์", uid: "bciProjectOwnershipType", sortable: true },
  { name: "เจ้าของ", uid: "bciProjectOwnerCompany", sortable: true },
  { name: "สถาปนิก", uid: "bciProjectArchitectCompany", sortable: true },
  { name: "ผู้รับเหมา", uid: "bciProjectContractorCompany", sortable: true },
  { name: "PM", uid: "bciProjectPmCompany", sortable: true },
  { name: "จำนวนชั้น", uid: "bciProjectStoreys", sortable: true },
  { name: "พื้นที่อาคาร", uid: "bciProjectFloorArea", sortable: true },
  { name: "พื้นที่ดิน", uid: "bciProjectSiteArea", sortable: true },
  { name: "เริ่มก่อสร้าง", uid: "bciProjectConstructionStartDate", sortable: true },
  { name: "สิ้นสุดก่อสร้าง", uid: "bciProjectConstructionEndDate", sortable: true },
  { name: "หมายเหตุ", uid: "bciProjectRemarks", sortable: false },
  { name: "อัปเดต", uid: "bciProjectModifiedDate", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = columns.map((c) => c.uid);

const stageColorMap = {
  "ก่อสร้าง": "success",
  "Construction": "success",
  "ออกแบบและเตรียมเอกสาร": "primary",
  "Design & Documentation": "primary",
  "เตรียมโครงการ": "warning",
  "Pre-Construction": "warning",
  "แนวคิดโครงการ": "secondary",
  "Concept": "secondary",
};

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
  });
}

export default function BciProjectsView({ projects, loading, reload }) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/bci/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(`นำเข้าสำเร็จ ${data.results.imported} โครงการ`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, [reload]);

  const stageOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.bciProjectStage).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const statusOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.bciProjectStageStatus).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const categoryOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.bciProjectCategory).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const devTypeOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.bciProjectDevelopmentType).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const regionOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.bciProjectRegion).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const handleExport = useCallback(() => {
    const excelColumns = [
      { header: "ชื่อโครงการ", key: "bciProjectName", width: 40 },
      { header: "ประเภทโครงการ", key: "bciProjectType", width: 20 },
      { header: "เมือง", key: "bciProjectCityOrTown", width: 20 },
      { header: "จังหวัด", key: "bciProjectStateProvince", width: 15 },
      { header: "ที่อยู่", key: "bciProjectStreetName", width: 30 },
      { header: "มูลค่า (บาท)", key: "bciProjectValue", width: 15 },
      { header: "ขั้นตอน", key: "bciProjectStage", width: 20 },
      { header: "สถานะ", key: "bciProjectStageStatus", width: 20 },
      { header: "หมวดหมู่", key: "bciProjectCategory", width: 20 },
      { header: "ประเภทการพัฒนา", key: "bciProjectDevelopmentType", width: 20 },
      { header: "บริษัทเจ้าของ", key: "bciProjectOwnerCompany", width: 30 },
      { header: "ผู้ติดต่อ (เจ้าของ)", key: "bciProjectOwnerContact", width: 20 },
      { header: "โทร (เจ้าของ)", key: "bciProjectOwnerPhone", width: 20 },
      { header: "อีเมล (เจ้าของ)", key: "bciProjectOwnerEmail", width: 25 },
      { header: "บริษัทสถาปนิก", key: "bciProjectArchitectCompany", width: 30 },
      { header: "ผู้ติดต่อ (สถาปนิก)", key: "bciProjectArchitectContact", width: 20 },
      { header: "โทร (สถาปนิก)", key: "bciProjectArchitectPhone", width: 20 },
      { header: "อีเมล (สถาปนิก)", key: "bciProjectArchitectEmail", width: 25 },
      { header: "บริษัทผู้รับเหมา", key: "bciProjectContractorCompany", width: 30 },
      { header: "ผู้ติดต่อ (ผู้รับเหมา)", key: "bciProjectContractorContact", width: 20 },
      { header: "โทร (ผู้รับเหมา)", key: "bciProjectContractorPhone", width: 20 },
      { header: "อีเมล (ผู้รับเหมา)", key: "bciProjectContractorEmail", width: 25 },
      { header: "บริษัท PM", key: "bciProjectPmCompany", width: 30 },
      { header: "ผู้ติดต่อ (PM)", key: "bciProjectPmContact", width: 20 },
      { header: "โทร (PM)", key: "bciProjectPmPhone", width: 20 },
      { header: "อีเมล (PM)", key: "bciProjectPmEmail", width: 25 },
      { header: "จำนวนชั้น", key: "bciProjectStoreys", width: 10 },
      { header: "เริ่มก่อสร้าง", key: "bciProjectConstructionStartDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "" },
      { header: "สิ้นสุดก่อสร้าง", key: "bciProjectConstructionEndDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "" },
      { header: "อัปเดตล่าสุด", key: "bciProjectModifiedDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "" },
      { header: "หมายเหตุ", key: "bciProjectRemarks", width: 30 },
    ];
    exportToExcel("bci-projects.xlsx", excelColumns, projects);
  }, [projects]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bciProjectName":
        return (
          <div className="flex flex-col">
            <span className="font-light text-xs">
              {item.bciProjectName || "-"}
            </span>
            {item.bciProjectType && (
              <span className="text-xs text-muted-foreground">
                {item.bciProjectType}
              </span>
            )}
          </div>
        );
      case "bciProjectCityOrTown":
        return (
          <div className="flex flex-col">
            <span className="text-xs">{item.bciProjectCityOrTown || "-"}</span>
            {item.bciProjectStateProvince && (
              <span className="text-xs text-muted-foreground">
                {item.bciProjectStateProvince}
              </span>
            )}
          </div>
        );
      case "bciProjectValue":
        return item.bciProjectValue ? (
          <span className="font-light">
            {(item.bciProjectValue / 1_000_000).toLocaleString("th-TH", {
              maximumFractionDigits: 1,
            })}
            M
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "bciProjectStage": {
        const color = stageColorMap[item.bciProjectStage] || "default";
        return item.bciProjectStage ? (
          <Chip variant="flat" size="md" radius="md" color={color}>
            {item.bciProjectStage}
          </Chip>
        ) : (
          "-"
        );
      }
      case "bciProjectStageStatus":
        return item.bciProjectStageStatus ? (
          <Chip variant="flat" size="md" radius="md" color="primary">
            {item.bciProjectStageStatus}
          </Chip>
        ) : (
          "-"
        );
      case "bciProjectCategory":
        return item.bciProjectCategory ? (
          <Chip variant="flat" size="md" radius="md" color="secondary">
            {item.bciProjectCategory}
          </Chip>
        ) : (
          "-"
        );
      case "bciProjectOwnerCompany":
      case "bciProjectArchitectCompany":
      case "bciProjectContractorCompany":
      case "bciProjectPmCompany": {
        const prefix = columnKey.replace("Company", "");
        const company = item[columnKey];
        const contact = item[`${prefix}Contact`];
        const phone = item[`${prefix}Phone`];
        const email = item[`${prefix}Email`];
        return company ? (
          <div className="flex flex-col">
            <span className="text-xs">{company}</span>
            {contact && (
              <span className="text-xs text-muted-foreground">{contact}</span>
            )}
            {phone && (
              <span className="text-xs text-muted-foreground">{phone}</span>
            )}
            {email && (
              <span className="text-xs text-muted-foreground">{email}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      }
      case "bciProjectDescription":
      case "bciProjectRemarks":
        return item[columnKey] ? (
          <span className="text-xs line-clamp-2">{item[columnKey]}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "bciProjectStoreys":
        return item.bciProjectStoreys || "-";
      case "bciProjectFloorArea":
      case "bciProjectSiteArea":
        return item[columnKey] ? (
          <span className="text-xs">
            {Number(item[columnKey]).toLocaleString("th-TH")} m²
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "bciProjectConstructionStartDate":
        return item.bciProjectConstructionStartString || formatDate(item.bciProjectConstructionStartDate);
      case "bciProjectConstructionEndDate":
        return item.bciProjectConstructionEndString || formatDate(item.bciProjectConstructionEndDate);
      case "bciProjectModifiedDate":
        return formatDate(item.bciProjectModifiedDate);
      default:
        return item[columnKey] ?? "-";
    }
  }, []);

  return (
    <DataTable
      title="โครงการ BCI"
      description="โครงการก่อสร้างจาก BCI Central (LeadManager)"
      columns={columns}
      data={projects}
      initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
      renderCell={renderCell}
      searchKeys={[
        "bciProjectName",
        "bciProjectDescription",
        "bciProjectCityOrTown",
        "bciProjectStateProvince",
        "bciProjectStreetName",
        "bciProjectRegion",
        "bciProjectCategory",
        "bciProjectSubCategory",
        "bciProjectDevelopmentType",
        "bciProjectType",
        "bciProjectOwnerCompany",
        "ownerContact",
        "bciProjectArchitectCompany",
        "architectContact",
        "bciProjectContractorCompany",
        "contractorContact",
        "bciProjectPmCompany",
        "pmContact",
        "bciProjectRemarks",
      ]}
      isLoading={loading}
      topEndContent={
        <div className="flex gap-2">
          <Button
            as="label"
            variant="flat"
            size="md"
            radius="md"
            startContent={<Upload />}
            isDisabled={importing}
            className="cursor-pointer"
          >
            {importing ? "กำลังนำเข้า..." : "นำเข้า"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Download />}
            onPress={handleExport}
            isDisabled={projects.length === 0}
          >
            ส่งออก Excel
          </Button>
        </div>
      }
      enableCardView
      filterColumns={[
        {
          uid: "bciProjectStage",
          name: "ขั้นตอน",
          options: stageOptions,
        },
        {
          uid: "bciProjectStageStatus",
          name: "สถานะ",
          options: statusOptions,
        },
        {
          uid: "bciProjectCategory",
          name: "หมวดหมู่",
          options: categoryOptions,
        },
        {
          uid: "bciProjectDevelopmentType",
          name: "ประเภทการพัฒนา",
          options: devTypeOptions,
        },
        {
          uid: "bciProjectRegion",
          name: "ภูมิภาค",
          options: regionOptions,
        },
      ]}
    />
  );
}
