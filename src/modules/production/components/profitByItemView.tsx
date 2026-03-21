"use client";

import { useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import CompareToggle from "@/components/ui/compareToggle";
import CompareKpiCard from "@/components/ui/compareKpiCard";
import Loading from "@/components/ui/loading";
import type { ProfitByItemViewProps, DashboardCompareResponse, DashboardResponse } from "@/modules/production/types";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

const columns = [
  { name: "รหัสสินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "ประเภท", uid: "category", sortable: true },
  { name: "ราคาขาย/ชิ้น", uid: "sellingPrice", sortable: true },
  { name: "ต้นทุน/ชิ้น", uid: "costPerUnit", sortable: true },
  { name: "กำไร/ชิ้น", uid: "profitPerUnit", sortable: true },
  { name: "จำนวนผลิต", uid: "outputQty", sortable: true },
  { name: "รายได้รวม", uid: "totalRevenue", sortable: true },
  { name: "ต้นทุนรวม", uid: "consumptionCost", sortable: true },
  { name: "กำไร/ขาดทุน", uid: "profitAmount", sortable: true },
  { name: "อัตรากำไร", uid: "profitMargin", sortable: true },
];

const initialColumns = [
  "itemNo",
  "description",
  "category",
  "sellingPrice",
  "costPerUnit",
  "profitPerUnit",
  "outputQty",
  "totalRevenue",
  "consumptionCost",
  "profitAmount",
  "profitMargin",
];

function ProfitContent({ d, prev }) {
  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "itemNo":
        return <span className="font-light text-xs">{item.itemNo}</span>;
      case "description":
        return (
          <span className="max-w-52 truncate block text-xs">
            {item.description || "-"}
          </span>
        );
      case "category":
        return (
          <Chip size="md" variant="flat" color="default">
            {item.category || "-"}
          </Chip>
        );
      case "sellingPrice":
      case "costPerUnit":
        return <span className="text-xs">{fmtCurrency(item[columnKey])}</span>;
      case "profitPerUnit":
        return (
          <span className={`text-xs font-light ${item.profitPerUnit >= 0 ? "text-success" : "text-danger"}`}>
            {fmtCurrency(item.profitPerUnit)}
          </span>
        );
      case "outputQty":
        return <span className="text-xs">{fmt(item.outputQty)}</span>;
      case "totalRevenue":
        return <span className="text-xs">{fmtCurrency(item.totalRevenue)}</span>;
      case "consumptionCost":
        return <span className="text-xs">{fmtCurrency(item.consumptionCost)}</span>;
      case "profitAmount":
        return (
          <span className={`text-xs font-light ${item.profitAmount >= 0 ? "text-success" : "text-danger"}`}>
            {fmtCurrency(item.profitAmount)}
          </span>
        );
      case "profitMargin":
        return item.profitMargin != null ? (
          <Chip
            size="md"
            variant="flat"
            color={
              item.profitMargin >= 20
                ? "success"
                : item.profitMargin >= 0
                  ? "warning"
                  : "danger"
            }
          >
            {item.profitMargin}%
          </Chip>
        ) : (
          "-"
        );
      default:
        return <span className="text-xs">{item[columnKey] || "-"}</span>;
    }
  }, []);

  if (!d) return null;

  const items = (d.profitByItem || []).map((i) => ({
    ...i,
    profitPerUnit: i.sellingPrice - i.costPerUnit,
  }));
  const withRevenue = items.filter((i) => i.totalRevenue > 0);
  const profitItems = withRevenue.filter((i) => i.profitAmount >= 0);
  const lossItems = withRevenue.filter((i) => i.profitAmount < 0);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CompareKpiCard
          title="FG ที่ขายทั้งหมด"
          value={fmt(withRevenue.length)}
          unit="รายการ"
          color="primary"
          currentRaw={prev ? withRevenue.length : undefined}
          previousRaw={prev ? (prev.profitByItem || []).filter((i) => {
            const sp = prev._salesPriceMap?.[i.itemNo] || i.sellingPrice || 0;
            return sp * i.outputQty > 0;
          }).length : undefined}
        />
        <CompareKpiCard
          title="รายได้รวม"
          value={fmtCurrency(d.totalRevenue)}
          color="primary"
          currentRaw={prev ? d.totalRevenue : undefined}
          previousRaw={prev?.totalRevenue}
        />
        <CompareKpiCard
          title="กำไรรวม"
          value={fmtCurrency(d.totalProfit)}
          color={d.totalProfit >= 0 ? "success" : "danger"}
          currentRaw={prev ? d.totalProfit : undefined}
          previousRaw={prev?.totalProfit}
        />
        <CompareKpiCard
          title="อัตรากำไรเฉลี่ย"
          value={d.profitMargin != null ? `${d.profitMargin}%` : "-"}
          color={
            d.profitMargin == null
              ? "default"
              : d.profitMargin >= 20
                ? "success"
                : d.profitMargin >= 0
                  ? "warning"
                  : "danger"
          }
          currentRaw={prev ? d.profitMargin : undefined}
          previousRaw={prev?.profitMargin}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card shadow="none" className="border border-border">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">FG ที่มีกำไร</p>
            <p className="text-xs font-light text-success">{profitItems.length} รายการ</p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">FG ที่ขาดทุน</p>
            <p className="text-xs font-light text-danger">{lossItems.length} รายการ</p>
          </CardBody>
        </Card>
      </div>

      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-light">กำไรราย FG ที่ขาย</p>
            <Chip size="md" color="primary" variant="flat">
              {withRevenue.length} รายการ
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <DataTable
            columns={columns}
            data={withRevenue}
            renderCell={renderCell}
            rowKey="itemNo"
            searchKeys={["itemNo", "description", "category"]}
            searchPlaceholder="ค้นหาสินค้า..."
            initialVisibleColumns={initialColumns}
            defaultSortDescriptor={{ column: "profitAmount", direction: "descending" }}
            defaultRowsPerPage={20}
          />
        </CardBody>
      </Card>
    </div>
  );
}

export default function ProfitByItemView({ data, loading, compareMode, setCompareMode }: ProfitByItemViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (!data) return null;

  const isCompare = !!data.compareMode;
  const compareData = isCompare ? (data as DashboardCompareResponse) : null;
  const normalData = isCompare ? null : (data as DashboardResponse);
  const wpcData = compareData ? compareData.wpc.current : normalData!.wpc;
  const wpcPrev = compareData ? compareData.wpc.previous : null;
  const otherData = compareData ? compareData.other.current : normalData!.other;
  const otherPrev = compareData ? compareData.other.previous : null;

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between">
        <div />
        {setCompareMode && (
          <div className="flex items-center gap-2">
            {isCompare && data.labels && (
              <span className="text-xs text-muted-foreground">
                {data.labels.current} vs {data.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        )}
      </div>
      <Tabs aria-label="แผนก" variant="underlined">
        <Tab
          key="wpc"
          title={`WPC`}
        >
          <ProfitContent d={wpcData} prev={wpcPrev} />
        </Tab>
        <Tab
          key="other"
          title={`อื่นๆ`}
        >
          <ProfitContent d={otherData} prev={otherPrev} />
        </Tab>
      </Tabs>
    </div>
  );
}
