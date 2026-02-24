"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useBciProjects } from "@/hooks/useBciProjects";
import { exportToExcel } from "@/lib/exportExcel";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อโปรเจค", uid: "projectName", sortable: true },
  { name: "รายละเอียด", uid: "projectDescription", sortable: false },
  { name: "สถานที่", uid: "cityOrTown", sortable: true },
  { name: "จังหวัด", uid: "stateProvince", sortable: true },
  { name: "ที่อยู่", uid: "streetName", sortable: true },
  { name: "ภูมิภาค", uid: "region", sortable: true },
  { name: "มูลค่า (ล้าน)", uid: "value", sortable: true },
  { name: "ขั้นตอน", uid: "projectStage", sortable: true },
  { name: "สถานะ", uid: "projectStageStatus", sortable: true },
  { name: "หมวดหมู่", uid: "category", sortable: true },
  { name: "หมวดหมู่ย่อย", uid: "subCategory", sortable: true },
  { name: "ประเภทการพัฒนา", uid: "developmentType", sortable: true },
  { name: "ประเภทกรรมสิทธิ์", uid: "ownershipType", sortable: true },
  { name: "เจ้าของ", uid: "ownerCompany", sortable: true },
  { name: "สถาปนิก", uid: "architectCompany", sortable: true },
  { name: "ผู้รับเหมา", uid: "contractorCompany", sortable: true },
  { name: "PM", uid: "pmCompany", sortable: true },
  { name: "จำนวนชั้น", uid: "storeys", sortable: true },
  { name: "พื้นที่อาคาร", uid: "floorArea", sortable: true },
  { name: "พื้นที่ดิน", uid: "siteArea", sortable: true },
  { name: "เริ่มก่อสร้าง", uid: "constructionStartDate", sortable: true },
  { name: "สิ้นสุดก่อสร้าง", uid: "constructionEndDate", sortable: true },
  { name: "หมายเหตุ", uid: "remarks", sortable: false },
  { name: "อัปเดต", uid: "modifiedDate", sortable: true },
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

export default function BciProjectsPage() {
  const { projects, loading, reload } = useBciProjects();
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
      ...new Set(projects.map((p) => p.projectStage).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const statusOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.projectStageStatus).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const categoryOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.category).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const devTypeOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.developmentType).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const regionOptions = useMemo(() => {
    const unique = [
      ...new Set(projects.map((p) => p.region).filter(Boolean)),
    ];
    return unique.sort().map((v) => ({ uid: v, name: v }));
  }, [projects]);

  const handleExport = useCallback(() => {
    const excelColumns = [
      { header: "ชื่อโครงการ", key: "projectName", width: 40 },
      { header: "ประเภทโครงการ", key: "projectType", width: 20 },
      { header: "เมือง", key: "cityOrTown", width: 20 },
      { header: "จังหวัด", key: "stateProvince", width: 15 },
      { header: "ที่อยู่", key: "streetName", width: 30 },
      { header: "มูลค่า (บาท)", key: "value", width: 15 },
      { header: "ขั้นตอน", key: "projectStage", width: 20 },
      { header: "สถานะ", key: "projectStageStatus", width: 20 },
      { header: "หมวดหมู่", key: "category", width: 20 },
      { header: "ประเภทการพัฒนา", key: "developmentType", width: 20 },
      { header: "บริษัทเจ้าของ", key: "ownerCompany", width: 30 },
      { header: "ผู้ติดต่อ (เจ้าของ)", key: "ownerContact", width: 20 },
      { header: "โทร (เจ้าของ)", key: "ownerPhone", width: 20 },
      { header: "อีเมล (เจ้าของ)", key: "ownerEmail", width: 25 },
      { header: "บริษัทสถาปนิก", key: "architectCompany", width: 30 },
      { header: "ผู้ติดต่อ (สถาปนิก)", key: "architectContact", width: 20 },
      { header: "โทร (สถาปนิก)", key: "architectPhone", width: 20 },
      { header: "อีเมล (สถาปนิก)", key: "architectEmail", width: 25 },
      { header: "บริษัทผู้รับเหมา", key: "contractorCompany", width: 30 },
      { header: "ผู้ติดต่อ (ผู้รับเหมา)", key: "contractorContact", width: 20 },
      { header: "โทร (ผู้รับเหมา)", key: "contractorPhone", width: 20 },
      { header: "อีเมล (ผู้รับเหมา)", key: "contractorEmail", width: 25 },
      { header: "บริษัท PM", key: "pmCompany", width: 30 },
      { header: "ผู้ติดต่อ (PM)", key: "pmContact", width: 20 },
      { header: "โทร (PM)", key: "pmPhone", width: 20 },
      { header: "อีเมล (PM)", key: "pmEmail", width: 25 },
      { header: "จำนวนชั้น", key: "storeys", width: 10 },
      { header: "เริ่มก่อสร้าง", key: "constructionStartDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH") : "" },
      { header: "สิ้นสุดก่อสร้าง", key: "constructionEndDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH") : "" },
      { header: "อัปเดตล่าสุด", key: "modifiedDate", width: 15, formatter: (v) => v ? new Date(v).toLocaleDateString("th-TH") : "" },
      { header: "หมายเหตุ", key: "remarks", width: 30 },
    ];
    exportToExcel("bci-projects.xlsx", excelColumns, projects);
  }, [projects]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "projectName":
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {item.projectName || "-"}
            </span>
            {item.projectType && (
              <span className="text-xs text-default-400">
                {item.projectType}
              </span>
            )}
          </div>
        );
      case "cityOrTown":
        return (
          <div className="flex flex-col">
            <span className="text-sm">{item.cityOrTown || "-"}</span>
            {item.stateProvince && (
              <span className="text-xs text-default-400">
                {item.stateProvince}
              </span>
            )}
          </div>
        );
      case "value":
        return item.value ? (
          <span className="font-medium">
            {(item.value / 1_000_000).toLocaleString("th-TH", {
              maximumFractionDigits: 1,
            })}
            M
          </span>
        ) : (
          <span className="text-default-300">-</span>
        );
      case "projectStage": {
        const color = stageColorMap[item.projectStage] || "default";
        return item.projectStage ? (
          <Chip variant="bordered" size="md" radius="md" color={color}>
            {item.projectStage}
          </Chip>
        ) : (
          "-"
        );
      }
      case "projectStageStatus":
        return item.projectStageStatus ? (
          <Chip variant="bordered" size="md" radius="md" color="primary">
            {item.projectStageStatus}
          </Chip>
        ) : (
          "-"
        );
      case "category":
        return item.category ? (
          <Chip variant="bordered" size="md" radius="md" color="secondary">
            {item.category}
          </Chip>
        ) : (
          "-"
        );
      case "ownerCompany":
      case "architectCompany":
      case "contractorCompany":
      case "pmCompany": {
        const prefix = columnKey.replace("Company", "");
        const company = item[`${prefix}Company`];
        const contact = item[`${prefix}Contact`];
        const phone = item[`${prefix}Phone`];
        const email = item[`${prefix}Email`];
        return company ? (
          <div className="flex flex-col">
            <span className="text-sm">{company}</span>
            {contact && (
              <span className="text-xs text-default-400">{contact}</span>
            )}
            {phone && (
              <span className="text-xs text-default-400">{phone}</span>
            )}
            {email && (
              <span className="text-xs text-default-400">{email}</span>
            )}
          </div>
        ) : (
          <span className="text-default-300">-</span>
        );
      }
      case "projectDescription":
      case "remarks":
        return item[columnKey] ? (
          <span className="text-sm line-clamp-2">{item[columnKey]}</span>
        ) : (
          <span className="text-default-300">-</span>
        );
      case "storeys":
        return item.storeys || "-";
      case "floorArea":
      case "siteArea":
        return item[columnKey] ? (
          <span className="text-sm">
            {Number(item[columnKey]).toLocaleString("th-TH")} m²
          </span>
        ) : (
          <span className="text-default-300">-</span>
        );
      case "constructionStartDate":
        return item.constructionStartString || formatDate(item.constructionStartDate);
      case "constructionEndDate":
        return item.constructionEndString || formatDate(item.constructionEndDate);
      case "modifiedDate":
        return formatDate(item.modifiedDate);
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
        "projectName",
        "projectDescription",
        "cityOrTown",
        "stateProvince",
        "streetName",
        "region",
        "category",
        "subCategory",
        "developmentType",
        "projectType",
        "ownerCompany",
        "ownerContact",
        "architectCompany",
        "architectContact",
        "contractorCompany",
        "contractorContact",
        "pmCompany",
        "pmContact",
        "remarks",
      ]}
      isLoading={loading}
      topEndContent={
        <div className="flex gap-2">
          <Button
            as="label"
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Upload size={16} />}
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
            startContent={<Download size={16} />}
            onPress={handleExport}
            isDisabled={projects.length === 0}
          >
            ส่งออก Excel
          </Button>
        </div>
      }
      filterColumns={[
        {
          uid: "projectStage",
          name: "ขั้นตอน",
          options: stageOptions,
        },
        {
          uid: "projectStageStatus",
          name: "สถานะ",
          options: statusOptions,
        },
        {
          uid: "category",
          name: "หมวดหมู่",
          options: categoryOptions,
        },
        {
          uid: "developmentType",
          name: "ประเภทการพัฒนา",
          options: devTypeOptions,
        },
        {
          uid: "region",
          name: "ภูมิภาค",
          options: regionOptions,
        },
      ]}
    />
  );
}
