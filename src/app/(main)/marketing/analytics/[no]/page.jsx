"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, Chip, Spinner, Divider } from "@heroui/react";
import { Button } from "@heroui/react";
import { ArrowLeft, MapPin, Phone, Mail, Calendar, FileText } from "lucide-react";
import { getMarketingAnalytics } from "@/actions/marketing";
import DataTable from "@/components/ui/DataTable";
import { useCallback } from "react";

const STATUS_COLORS = {
  Open: "warning",
  Released: "success",
};

const LINE_COLUMNS = [
  { name: "รหัส", uid: "No" },
  { name: "รายละเอียด", uid: "Description" },
  { name: "จำนวน", uid: "Quantity", sortable: true },
  { name: "หน่วย", uid: "Unit_of_Measure_Code" },
  { name: "ราคา/หน่วย", uid: "Unit_Price", sortable: true },
  { name: "ยอดรวม", uid: "Line_Amount", sortable: true },
  { name: "ส่งแล้ว", uid: "Quantity_Shipped" },
  { name: "คงค้าง", uid: "BWK_Outstanding_Quantity" },
];

export default function SalesOrderDetailPage() {
  const { no } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [no]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await getMarketingAnalytics();
      const found = data.orders?.find((o) => o.No === decodeURIComponent(no));
      setOrder(found || null);
    } finally {
      setLoading(false);
    }
  };

  const renderLineCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "Quantity":
      case "Quantity_Shipped":
      case "BWK_Outstanding_Quantity":
        return <span className="block text-right">{item[columnKey] || 0}</span>;
      case "Unit_Price":
      case "Line_Amount":
        return (
          <span className="block text-right font-medium">
            {(item[columnKey] || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-default-400">ไม่พบออเดอร์</p>
        <Button variant="bordered" radius="md" onPress={() => router.push("/marketing/analytics")}>
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          radius="md"
          onPress={() => router.push("/marketing/analytics")}
        >
          <ArrowLeft size={18} />
        </Button>
        <h2 className="text-lg font-semibold">{order.No}</h2>
        <Chip size="sm" variant="flat" color={STATUS_COLORS[order.Status] || "default"}>
          {order.Status}
        </Chip>
        {order.Completely_Shipped ? (
          <Chip size="sm" variant="flat" color="success">จัดส่งแล้ว</Chip>
        ) : (
          <Chip size="sm" variant="flat" color="default">รอจัดส่ง</Chip>
        )}
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="sm">
          <CardBody className="p-5 gap-3">
            <p className="text-sm font-semibold">ข้อมูลลูกค้า</p>
            <Divider />
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">ลูกค้า</span>
                <span className="font-medium">{order.Sell_to_Customer_Name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">รหัสลูกค้า</span>
                <span>{order.Sell_to_Customer_No}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-default-400 w-24 shrink-0">ที่อยู่</span>
                <span>{order.Sell_to_Address || "-"}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-5 gap-3">
            <p className="text-sm font-semibold">ข้อมูลออเดอร์</p>
            <Divider />
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">วันที่สั่ง</span>
                <span>
                  {order.Order_Date
                    ? new Date(order.Order_Date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">ครบกำหนด</span>
                <span>
                  {order.Due_Date && order.Due_Date !== "0001-01-01"
                    ? new Date(order.Due_Date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">เลขที่อ้างอิง</span>
                <span>{order.External_Document_No || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-default-400 w-24 shrink-0">ยอดรวม</span>
                <span className="text-lg font-bold text-primary">
                  ฿{(order.totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lines */}
      <div>
        <p className="font-semibold mb-2">รายการสินค้า ({order.lines?.length || 0} รายการ)</p>
        <DataTable
          columns={LINE_COLUMNS}
          data={order.lines || []}
          renderCell={renderLineCell}
          rowKey="Line_No"
          initialVisibleColumns={["No", "Description", "Quantity", "Unit_of_Measure_Code", "Unit_Price", "Line_Amount", "Quantity_Shipped", "BWK_Outstanding_Quantity"]}
          emptyContent="ไม่มีรายการ"
          defaultRowsPerPage={20}
        />
        <div className="flex justify-end mt-2 px-2">
          <span className="font-semibold mr-4">รวมทั้งสิ้น</span>
          <span className="font-bold">
            ฿{(order.totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
