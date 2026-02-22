"use client";

import { useCallback, useMemo } from "react";
import { Button, Chip } from "@heroui/react";
import { Download } from "lucide-react";
import { useBciProjects } from "@/hooks/useBciProjects";
import { exportToExcel } from "@/lib/exportExcel";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Project Name", uid: "projectName", sortable: true },
  { name: "Location", uid: "cityOrTown", sortable: true },
  { name: "Province", uid: "stateProvince", sortable: true },
  { name: "Value (M)", uid: "value", sortable: true },
  { name: "Stage", uid: "projectStage", sortable: true },
  { name: "Status", uid: "projectStageStatus", sortable: true },
  { name: "Category", uid: "category", sortable: true },
  { name: "Dev Type", uid: "developmentType", sortable: true },
  { name: "Owner", uid: "ownershipType", sortable: true },
  { name: "Storeys", uid: "storeys", sortable: true },
  { name: "Con. Start", uid: "constructionStartDate", sortable: true },
  { name: "Updated", uid: "modifiedDate", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "projectName",
  "cityOrTown",
  "value",
  "projectStage",
  "projectStageStatus",
  "category",
  "developmentType",
  "constructionStartDate",
  "modifiedDate",
];

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
  const { projects, loading } = useBciProjects();

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
      { header: "ความเป็นเจ้าของ", key: "ownershipType", width: 15 },
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
          <Chip variant="flat" size="sm" color={color}>
            {item.projectStage}
          </Chip>
        ) : (
          "-"
        );
      }
      case "projectStageStatus":
        return item.projectStageStatus ? (
          <Chip variant="dot" size="sm" color="primary">
            {item.projectStageStatus}
          </Chip>
        ) : (
          "-"
        );
      case "category":
        return item.category ? (
          <Chip variant="flat" size="sm" color="secondary">
            {item.category}
          </Chip>
        ) : (
          "-"
        );
      case "storeys":
        return item.storeys || "-";
      case "constructionStartDate":
        return item.constructionStartString || formatDate(item.constructionStartDate);
      case "modifiedDate":
        return formatDate(item.modifiedDate);
      default:
        return item[columnKey] ?? "-";
    }
  }, []);

  return (
    <DataTable
      title="BCI Projects"
      description="โครงการก่อสร้างจาก BCI Central (LeadManager)"
      columns={columns}
      data={projects}
      initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
      renderCell={renderCell}
      searchKeys={[
        "projectName",
        "cityOrTown",
        "stateProvince",
        "streetName",
        "category",
        "developmentType",
        "projectType",
      ]}
      isLoading={loading}
      topEndContent={
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
      }
      filterColumns={[
        {
          uid: "projectStage",
          name: "Stage",
          options: stageOptions,
        },
        {
          uid: "projectStageStatus",
          name: "Status",
          options: statusOptions,
        },
        {
          uid: "category",
          name: "Category",
          options: categoryOptions,
        },
      ]}
    />
  );
}
