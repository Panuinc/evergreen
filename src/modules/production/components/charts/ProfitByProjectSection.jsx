"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Chip,
  Accordion,
  AccordionItem,
  Pagination,
  Input,
} from "@heroui/react";
import { Search } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function fmtNum(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

const itemColumns = [
  { name: "รหัสสินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "ประเภท", uid: "category", sortable: true },
  { name: "ผลิตได้", uid: "outputQty", sortable: true },
  { name: "สั่งซื้อ (SO)", uid: "soQty", sortable: true },
  { name: "ส่งแล้ว", uid: "shippedQty", sortable: true },
  { name: "ราคาขาย/ชิ้น", uid: "unitPrice", sortable: true },
  { name: "ต้นทุน/ชิ้น", uid: "costPerUnit", sortable: true },
  { name: "รายได้รวม", uid: "revenue", sortable: true },
  { name: "ต้นทุนรวม", uid: "totalCost", sortable: true },
  { name: "กำไร/ขาดทุน", uid: "profit", sortable: true },
  { name: "Margin", uid: "margin", sortable: true },
];

const initialVisibleColumns = [
  "itemNo",
  "description",
  "category",
  "outputQty",
  "unitPrice",
  "costPerUnit",
  "revenue",
  "totalCost",
  "profit",
  "margin",
];

const PROJECTS_PER_PAGE = 5;

function MarginChip({ margin }) {
  if (margin == null) return <span className="text-default-400">-</span>;
  const color = margin >= 20 ? "success" : margin >= 0 ? "warning" : "danger";
  return (
    <Chip size="sm" color={color} variant="flat">
      {margin}%
    </Chip>
  );
}

export default function ProfitByProjectSection({ data = [] }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "itemNo":
        return <span className="font-medium text-xs">{item.itemNo}</span>;
      case "description":
        return (
          <span className="max-w-48 truncate block text-xs">
            {item.description || "-"}
          </span>
        );
      case "outputQty":
      case "soQty":
      case "shippedQty":
        return <span className="text-xs">{fmtNum(item[columnKey])}</span>;
      case "unitPrice":
        return (
          <span className="text-xs">
            {item.unitPrice > 0 ? fmtCurrency(item.unitPrice) : "-"}
          </span>
        );
      case "costPerUnit":
        return <span className="text-xs">{fmtCurrency(item.costPerUnit)}</span>;
      case "revenue":
        return <span className="text-xs">{fmtCurrency(item.revenue)}</span>;
      case "totalCost":
        return <span className="text-xs">{fmtCurrency(item.totalCost)}</span>;
      case "profit":
        return (
          <span
            className={`text-xs font-semibold ${item.profit >= 0 ? "text-success" : "text-danger"}`}
          >
            {fmtCurrency(item.profit)}
          </span>
        );
      case "margin":
        return <MarginChip margin={item.margin} />;
      default:
        return <span className="text-xs">{item[columnKey] || "-"}</span>;
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        (p.projectName || "").toLowerCase().includes(q) ||
        (p.projectCode || "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
  const paged = filtered.slice(
    (page - 1) * PROJECTS_PER_PAGE,
    page * PROJECTS_PER_PAGE,
  );

  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Input
          size="sm"
          className="max-w-xs"
          placeholder="ค้นหาโครงการ..."
          startContent={<Search className="w-4 h-4 text-default-400" />}
          value={search}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <span className="text-xs text-default-400">
          {filtered.length} โครงการ
        </span>
      </div>

      <Accordion variant="splitted" selectionMode="multiple">
        {paged.map((proj) => (
          <AccordionItem
            key={proj.projectCode}
            aria-label={proj.projectName}
            title={
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-sm">
                  {proj.projectName || proj.projectCode}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-default-400">
                    รายได้ {fmtCurrency(proj.totalRevenue)}
                  </span>
                  <span className="text-default-400">|</span>
                  <span className="text-default-400">
                    ต้นทุน {fmtCurrency(proj.totalCost)}
                  </span>
                  <span className="text-default-400">|</span>
                  <span
                    className={
                      proj.totalProfit >= 0 ? "text-success font-semibold" : "text-danger font-semibold"
                    }
                  >
                    กำไร {fmtCurrency(proj.totalProfit)}
                  </span>
                  <MarginChip margin={proj.margin} />
                </div>
              </div>
            }
          >
            <DataTable
              columns={itemColumns}
              data={proj.items}
              renderCell={renderCell}
              rowKey="itemNo"
              searchKeys={["itemNo", "description", "category"]}
              searchPlaceholder="ค้นหาสินค้า..."
              initialVisibleColumns={initialVisibleColumns}
              defaultSortDescriptor={{ column: "revenue", direction: "descending" }}
              defaultRowsPerPage={10}
            />
          </AccordionItem>
        ))}
      </Accordion>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            size="sm"
            showControls
          />
        </div>
      )}
    </div>
  );
}
