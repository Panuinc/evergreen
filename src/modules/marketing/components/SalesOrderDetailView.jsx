import { useCallback } from "react";
import { Card, CardBody, Chip, Divider } from "@heroui/react";
import { Button } from "@heroui/react";
import { ArrowLeft, Printer } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import ShippingLabelModal from "@/modules/marketing/components/ShippingLabelModal";
import Loading from "@/components/ui/Loading";

const STATUS_COLORS = {
  Open: "warning",
  Released: "success",
};

const LINE_COLUMNS = [
  { name: "รหัส", uid: "bcSalesOrderLineObjectNumber" },
  { name: "รายละเอียด", uid: "bcSalesOrderLineDescription" },
  { name: "โครงการ", uid: "bcSalesOrderLineProjectName" },
  { name: "จำนวน", uid: "bcSalesOrderLineQuantity", sortable: true },
  { name: "หน่วย", uid: "bcSalesOrderLineUnitOfMeasureCode" },
  { name: "ราคา/หน่วย", uid: "bcSalesOrderLineUnitPrice", sortable: true },
  { name: "ยอดรวม", uid: "bcSalesOrderLineAmount", sortable: true },
  { name: "ส่งแล้ว", uid: "bcSalesOrderLineQuantityShipped" },
  { name: "คงค้าง", uid: "bcSalesOrderLineOutstandingQuantity" },
];

export default function SalesOrderDetailView({
  order,
  customerPhone,
  loading,
  labelModal,
  onBack,
}) {
  const renderLineCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bcSalesOrderLineProjectName":
        return item.bcSalesOrderLineProjectName ? (
          <Chip variant="flat" size="md" radius="md" color="secondary">
            {item.bcSalesOrderLineProjectName}
          </Chip>
        ) : (
          "-"
        );
      case "bcSalesOrderLineQuantity":
      case "bcSalesOrderLineQuantityShipped":
      case "bcSalesOrderLineOutstandingQuantity":
        return <span className="block text-right">{item[columnKey] || 0}</span>;
      case "bcSalesOrderLineUnitPrice":
      case "bcSalesOrderLineAmount":
        return (
          <span className="block text-right font-light">
            {(item[columnKey] || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <p className="text-muted-foreground">ไม่พบออเดอร์</p>
        <Button variant="flat" size="md" radius="md" onPress={onBack}>
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="bordered"
          size="md"
          radius="md"
          onPress={onBack}
        >
          <ArrowLeft size={18} />
        </Button>
        <p className="text-xs font-light">{order.bcSalesOrderNumber}</p>
        <Chip variant="flat" size="md" radius="md" color={STATUS_COLORS[order.bcSalesOrderStatus] || "default"}>
          {order.bcSalesOrderStatus}
        </Chip>
        {order.bcSalesOrderCompletelyShipped ? (
          <Chip variant="flat" size="md" radius="md" color="success">จัดส่งแล้ว</Chip>
        ) : (
          <Chip variant="flat" size="md" radius="md" color="default">รอจัดส่ง</Chip>
        )}
        <div className="flex-1" />
        <Button
          variant="flat"
          size="md"
          radius="md"
          startContent={<Printer size={14} />}
          onPress={labelModal.onOpen}
        >
          พิมพ์ใบปะหน้า
        </Button>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5 gap-3">
            <p className="text-xs font-light">ข้อมูลลูกค้า</p>
            <Divider />
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">ลูกค้า</span>
                <span className="font-light">{order.bcSalesOrderCustomerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">รหัสลูกค้า</span>
                <span>{order.bcSalesOrderCustomerNumber}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-muted-foreground w-24 shrink-0">ที่อยู่</span>
                <span>{order.bcSalesOrderSellToAddress || "-"}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="p-5 gap-3">
            <p className="text-xs font-light">ข้อมูลออเดอร์</p>
            <Divider />
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">วันที่สั่ง</span>
                <span>
                  {order.bcSalesOrderDate
                    ? new Date(order.bcSalesOrderDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">ครบกำหนด</span>
                <span>
                  {order.bcSalesOrderDueDate && order.bcSalesOrderDueDate !== "0001-01-01"
                    ? new Date(order.bcSalesOrderDueDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">เลขที่อ้างอิง</span>
                <span>{order.bcSalesOrderExternalDocumentNumber || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">ยอดรวม</span>
                <span className="text-xs font-light text-primary">
                  ฿{(order.totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lines */}
      <div>
        <p className="font-light mb-2">รายการสินค้า ({order.lines?.length || 0} รายการ)</p>
        <DataTable
          columns={LINE_COLUMNS}
          data={order.lines || []}
          renderCell={renderLineCell}
          rowKey="bcSalesOrderLineNo"
          initialVisibleColumns={["bcSalesOrderLineObjectNumber", "bcSalesOrderLineDescription", "bcSalesOrderLineProjectName", "bcSalesOrderLineQuantity", "bcSalesOrderLineUnitOfMeasureCode", "bcSalesOrderLineUnitPrice", "bcSalesOrderLineAmount", "bcSalesOrderLineQuantityShipped", "bcSalesOrderLineOutstandingQuantity"]}
          emptyContent="ไม่มีรายการ"
          defaultRowsPerPage={20}
        />
        <div className="flex justify-end mt-2 px-2">
          <span className="font-light mr-4">รวมทั้งสิ้น</span>
          <span className="font-light">
            ฿{(order.totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <ShippingLabelModal
        isOpen={labelModal.isOpen}
        onClose={labelModal.onClose}
        order={order}
        customerPhone={customerPhone}
      />
    </div>
  );
}
