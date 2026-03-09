import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_HQ } from "@/modules/tms/constants";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,} from "@heroui/react";
import { Plus, Edit, Trash2, ChevronDown, Download, ClipboardCheck, CalendarDays, Route, Sparkles, X, MapPin, ExternalLink, Power } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import { useRBAC } from "@/contexts/RBACContext";
import Loading from "@/components/ui/Loading";

const shipmentCsvColumns = [
  { header: "เลขที่", key: "tmsShipmentNumber" },
  { header: "วันที่", key: "tmsShipmentDate" },
  { header: "ลูกค้า", key: "tmsShipmentCustomerName" },
  { header: "โทรศัพท์", key: "tmsShipmentCustomerPhone" },
  { header: "ปลายทาง", key: "tmsShipmentDestination" },

  { header: "สถานะ", key: "tmsShipmentStatus" },
];

const baseColumns = [
  { name: "เลขที่", uid: "tmsShipmentNumber", sortable: true },
  { name: "วันที่", uid: "tmsShipmentDate", sortable: true },
  { name: "ลูกค้า", uid: "tmsShipmentCustomerName", sortable: true },
  { name: "ปลายทาง", uid: "tmsShipmentDestination", sortable: true },
  { name: "ยานพาหนะ", uid: "vehicle" },
  { name: "สถานะ", uid: "tmsShipmentStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "แบบร่าง", uid: "draft" },
  { name: "ยืนยันแล้ว", uid: "confirmed" },
  { name: "จัดส่งแล้ว", uid: "dispatched" },
  { name: "กำลังขนส่ง", uid: "in_transit" },
  { name: "ถึงแล้ว", uid: "arrived" },
  { name: "ส่งแล้ว", uid: "delivered" },
  { name: "ยืนยัน POD แล้ว", uid: "pod_confirmed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const STATUS_COLORS = {
  draft: "default",
  confirmed: "primary",
  dispatched: "warning",
  in_transit: "secondary",
  arrived: "success",
  delivered: "success",
  pod_confirmed: "success",
  cancelled: "danger",
};

const NEXT_STATUS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["arrived"],
  arrived: ["delivered"],
  delivered: ["pod_confirmed"],
};

const STATUS_LABELS = {
  draft: "แบบร่าง",
  confirmed: "ยืนยันแล้ว",
  dispatched: "จัดส่งแล้ว",
  in_transit: "กำลังขนส่ง",
  arrived: "ถึงแล้ว",
  delivered: "ส่งแล้ว",
  pod_confirmed: "ยืนยัน POD แล้ว",
  cancelled: "ยกเลิก",
};

const BASE_VISIBLE_COLUMNS = [
  "tmsShipmentNumber",
  "tmsShipmentDate",
  "tmsShipmentCustomerName",
  "tmsShipmentDestination",
  "vehicle",
  "tmsShipmentStatus",
  "actions",
];

export default function ShipmentsView({
  shipments,
  vehicles,
  employees,
  loading,
  saving,
  editingShipment,
  formData,
  deletingShipment,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  handleStatusChange,
  toggleActive,
  deliveryPlans,
  plansLoading,
  selectedPlanIds,
  togglePlanSelection,
  shipmentStops,
  shipmentItems,
  updateItemActualQty,
  distanceLoading,
  addExtra,
  updateExtra,
  removeExtra,
  routeResult,
  routeAiAnalysis,
  routeLoading,
  optimizeRoute,
  clearRouteResult,
}) {
  const { isSuperAdmin } = useRBAC();
  const router = useRouter();

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
  }, [isSuperAdmin]);

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      const actionsCol = baseColumns[baseColumns.length - 1];
      return [
        ...baseColumns.slice(0, -1),
        { name: "สถานะใช้งาน", uid: "isActive" },
        actionsCol,
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "tmsShipmentNumber":
          return <span className="font-light">{item.tmsShipmentNumber}</span>;
        case "tmsShipmentDate":
          return item.tmsShipmentDate
            ? new Date(item.tmsShipmentDate).toLocaleDateString("th-TH")
            : "-";
        case "tmsShipmentCustomerName":
          return item.tmsShipmentCustomerName || "-";
        case "tmsShipmentDestination":
          return item.tmsShipmentDestination || "-";
        case "vehicle": {
          const v = vehicles.find((v) => v.tmsVehicleId === item.tmsShipmentVehicleId);
          return v ? v.tmsVehiclePlateNumber : "-";
        }
        case "tmsShipmentStatus":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.tmsShipmentStatus] || "default"}
            >
              {STATUS_LABELS[item.tmsShipmentStatus] || item.tmsShipmentStatus}
            </Chip>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={item.isActive ? "success" : "danger"}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        case "actions": {
          const nextStatuses = NEXT_STATUS[item.tmsShipmentStatus] || [];
          const stopsData = item.tmsShipmentStops;
          const mapsUrl = stopsData?.googleMapsUrl;
          return (
            <div className="flex items-center gap-1">
              {mapsUrl && (
                <Button
                  as="a"
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="bordered"
                  size="md"
                  radius="md"
                  color="primary"
                  isIconOnly
                  title="เปิด Google Maps"
                >
                  <MapPin size={16} />
                </Button>
              )}
              {nextStatuses.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="bordered" size="md" radius="md" isIconOnly>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => handleStatusChange(item.tmsShipmentId, key)}
                  >
                    {nextStatuses.map((s) => (
                      <DropdownItem key={s}>
                        {STATUS_LABELS[s] || s}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {!["pod_confirmed", "cancelled", "draft"].includes(item.tmsShipmentStatus) && (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  color="success"
                  isIconOnly
                  onPress={() => router.push(`/tms/deliveries?shipmentId=${item.tmsShipmentId}`)}
                >
                  <ClipboardCheck size={16} />
                </Button>
              )}
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit size={16} />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={item.isActive}
                  onValueChange={() => toggleActive(item)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(item)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [vehicles, handleOpen, confirmDelete, handleStatusChange, toggleActive, isSuperAdmin, router],
  );

  const availableVehicles = vehicles.filter((v) => v.tmsVehicleStatus === "available");
  const activeEmployees = (employees || []).filter((e) => e.isActive);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={shipments}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsShipmentId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยเลขที่, ลูกค้า..."
        searchKeys={["tmsShipmentNumber", "tmsShipmentCustomerName", "tmsShipmentDestination"]}
        statusField="tmsShipmentStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบการขนส่ง"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("shipments.csv", shipmentCsvColumns, shipments)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus size={16} />} onPress={() => handleOpen()}>
              สร้างการขนส่ง
            </Button>
          </div>
        }
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power size={16} />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingShipment ? "แก้ไขการขนส่ง" : "สร้างการขนส่ง"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              {/* Delivery Plan Selector */}
              {!editingShipment && (
                <div className="flex flex-col w-full p-2 gap-3">
                  {/* Dropdown to add plans */}
                  <Select
                    label="เลือกแผนส่งของ"
                    labelPlacement="outside"
                    placeholder={plansLoading ? "กำลังโหลด..." : "เลือกแผนส่งของเพื่อเติมข้อมูล"}
                    variant="bordered"
                    size="md"
                    radius="md"
                    startContent={<CalendarDays size={16} className="text-primary" />}
                    selectedKeys={[]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0];
                      if (key) togglePlanSelection(key);
                    }}
                    isLoading={plansLoading}
                  >
                    {deliveryPlans.filter((p) => !selectedPlanIds.includes(String(p.tmsDeliveryPlanId))).map((plan) => {
                      const firstItem = plan.tmsDeliveryPlanItem?.[0];
                      const dateLabel = plan.tmsDeliveryPlanDate
                        ? new Date(plan.tmsDeliveryPlanDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })
                        : "";
                      const pLabel = plan.tmsDeliveryPlanPriority === "urgent" ? " [ด่วนมาก]" : plan.tmsDeliveryPlanPriority === "high" ? " [ด่วน]" : "";
                      return (
                        <SelectItem key={String(plan.tmsDeliveryPlanId)} textValue={`${firstItem?.tmsDeliveryPlanItemSalesOrderNo || ""} ${firstItem?.tmsDeliveryPlanItemCustomerName || ""}`}>
                          <div className="flex flex-col">
                            <span className="text-xs font-light">
                              {dateLabel} · {firstItem?.tmsDeliveryPlanItemSalesOrderNo || "แผนส่ง"} · {firstItem?.tmsDeliveryPlanItemCustomerName || "-"}{pLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {plan.tmsDeliveryPlanItem?.length || 0} รายการ
                              {plan.tmsDeliveryPlanAddress ? ` · ${plan.tmsDeliveryPlanAddress}` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>

                  {/* Selected plans as removable chips */}
                  {selectedPlanIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPlanIds.map((pid) => {
                        const plan = deliveryPlans.find((p) => String(p.tmsDeliveryPlanId) === pid);
                        if (!plan) return null;
                        const firstItem = plan.tmsDeliveryPlanItem?.[0];
                        const pColor = plan.tmsDeliveryPlanPriority === "urgent" ? "danger" : plan.tmsDeliveryPlanPriority === "high" ? "warning" : "primary";
                        return (
                          <Chip
                            key={pid}
                            variant="flat"
                            color={pColor}
                            size="md"
                            onClose={() => togglePlanSelection(pid)}
                            endContent={<X size={12} />}
                          >
                            {firstItem?.tmsDeliveryPlanItemCustomerName || plan.tmsDeliveryPlanAddress || "แผนส่ง"}
                          </Chip>
                        );
                      })}
                    </div>
                  )}

                  {/* Route Optimize button + result (only when 2+ plans) */}
                  {selectedPlanIds.length >= 2 && (
                    <div className="flex flex-col gap-2 border border-border rounded-xl p-3 bg-default-50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{selectedPlanIds.length} จุดส่ง — กดจัดเส้นทางเพื่อหาเส้นทางที่ดีที่สุด</p>
                        <Button
                          variant="flat"
                          size="md"
                          radius="md"
                          color="secondary"
                          startContent={<Route size={14} />}
                          onPress={optimizeRoute}
                          isLoading={routeLoading}
                        >
                          AI จัดเส้นทาง
                        </Button>
                      </div>

                      {/* Compact route result */}
                      {routeLoading && !routeResult && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                          <Loading /> กำลังคำนวณเส้นทาง...
                        </div>
                      )}
                      {routeResult && (
                        <div className="flex flex-col gap-2">
                          {/* Stop order */}
                          <div className="flex items-center gap-1 flex-wrap text-xs">
                            <span className="text-muted-foreground">โรงงาน</span>
                            {routeResult.optimizedStops?.map((stop, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <span className="text-muted-foreground">→</span>
                                <span className="font-light">{stop.name}</span>
                                {stop.priority !== "normal" && (
                                  <Chip size="md" variant="flat" color={stop.priority === "urgent" ? "danger" : "warning"} className="h-4" />
                                )}
                              </span>
                            ))}
                            <span className="text-muted-foreground">→</span>
                            <span className="text-muted-foreground">โรงงาน</span>
                          </div>
                          {/* Stats row */}
                          <div className="flex items-center gap-4 text-xs flex-wrap">
                            <span><span className="text-muted-foreground">รวม:</span> <span className="font-light">{routeResult.totalDistanceKm} กม.</span></span>
                            <span><span className="text-muted-foreground">เวลา:</span> <span className="font-light">{Math.floor(routeResult.totalDurationMin / 60)} ชม. {routeResult.totalDurationMin % 60} น.</span></span>
                            {routeResult.savedKm > 0 && (
                              <span className="text-success-600 font-light">ประหยัด {routeResult.savedKm.toFixed(1)} กม.</span>
                            )}
                          </div>
                          {/* Google Maps link */}
                          {routeResult.googleMapsUrl && (
                            <a
                              href={routeResult.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-light text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors w-fit"
                            >
                              <MapPin size={14} />
                              เปิด Google Maps
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      )}
                      {/* AI analysis (collapsible) */}
                      {routeAiAnalysis && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-secondary-600 font-light flex items-center gap-1">
                            <Sparkles size={12} /> ดูวิเคราะห์ AI
                          </summary>
                          <div className="prose prose-sm max-w-none mt-2 bg-content2 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{routeAiAnalysis}</ReactMarkdown>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Multi-stop: show stops table */}
                {shipmentStops.length > 1 ? (
                  <div className="flex flex-col w-full p-2 gap-2 md:col-span-2">
                    <p className="text-xs font-light">จุดส่งของ ({shipmentStops.length} จุด)</p>
                    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-default-100">
                            <th className="text-center px-2 py-2 font-light w-10">ลำดับ</th>
                            <th className="text-left px-3 py-2 font-light">ลูกค้า</th>
                            <th className="text-left px-3 py-2 font-light">ที่อยู่/ปลายทาง</th>
                            <th className="text-left px-3 py-2 font-light w-24">SO</th>
                            <th className="text-center px-2 py-2 font-light w-16">ความสำคัญ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentStops
                            .sort((a, b) => a.seq - b.seq)
                            .map((stop, i) => {
                              const letter = String.fromCharCode(65 + i);
                              const pColor = stop.priority === "urgent" ? "danger" : stop.priority === "high" ? "warning" : "default";
                              return (
                                <tr key={stop.planId || i} className="border-t border-border">
                                  <td className="text-center px-2 py-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-light text-xs">{letter}</span>
                                  </td>
                                  <td className="px-3 py-2 font-light">{stop.customerName || "-"}</td>
                                  <td className="px-3 py-2 text-foreground max-w-50 truncate">{stop.address || "-"}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{stop.soRef || "-"}</td>
                                  <td className="text-center px-2 py-2">
                                    {stop.priority !== "normal" ? (
                                      <Chip size="md" variant="flat" color={pColor}>
                                        {stop.priority === "urgent" ? "ด่วนมาก" : "ด่วน"}
                                      </Chip>
                                    ) : (
                                      <span className="text-muted-foreground">ปกติ</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    {/* Google Maps link for saved shipments */}
                    {routeResult?.googleMapsUrl && (
                      <a
                        href={routeResult.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-light text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors w-fit"
                      >
                        <MapPin size={14} />
                        เปิด Google Maps — เส้นทางจุด A→B→C
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Single stop: original fields */}
                    <div className="flex items-center w-full h-fit p-2 gap-2">
                      <Input label="ชื่อลูกค้า" labelPlacement="outside" placeholder="กรอกชื่อลูกค้า" variant="flat" size="md" radius="md" value={formData.tmsShipmentCustomerName} onChange={(e) => updateField("tmsShipmentCustomerName", e.target.value)} isRequired />
                    </div>
                    <div className="flex items-center w-full h-fit p-2 gap-2">
                      <Input label="เบอร์โทรลูกค้า" labelPlacement="outside" placeholder="กรอกเบอร์โทร" variant="bordered" size="md" radius="md" value={formData.tmsShipmentCustomerPhone} onChange={(e) => updateField("tmsShipmentCustomerPhone", e.target.value)} />
                    </div>
                    <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                      <Input label="ที่อยู่ลูกค้า" labelPlacement="outside" placeholder="กรอกที่อยู่" variant="bordered" size="md" radius="md" value={formData.tmsShipmentCustomerAddress} onChange={(e) => updateField("tmsShipmentCustomerAddress", e.target.value)} />
                    </div>
                    <div className="flex items-center w-full h-fit p-2 gap-2">
                      <Input label="จุดเริ่มต้น" labelPlacement="outside" variant="bordered" size="md" radius="md" value={COMPANY_HQ.address} isReadOnly />
                    </div>
                    <div className="flex items-center w-full h-fit p-2 gap-2">
                      <Input label="ปลายทาง" labelPlacement="outside" placeholder="กรอกปลายทาง" variant="bordered" size="md" radius="md" value={formData.tmsShipmentDestination} onChange={(e) => updateField("tmsShipmentDestination", e.target.value)} isRequired />
                    </div>
                  </>
                )}
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="date" label="วันที่ส่ง" labelPlacement="outside" variant="bordered" size="md" radius="md" value={formData.tmsShipmentDate} onChange={(e) => updateField("tmsShipmentDate", e.target.value)} isRequired />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="ยานพาหนะ" labelPlacement="outside" placeholder="เลือกยานพาหนะ" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentVehicleId ? [formData.tmsShipmentVehicleId] : []} onSelectionChange={(keys) => updateField("tmsShipmentVehicleId", Array.from(keys)[0] || "")}>
                    {(editingShipment ? vehicles : availableVehicles).map((v) => (<SelectItem key={v.tmsVehicleId}>{v.tmsVehiclePlateNumber}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select label="คนขับรถ" labelPlacement="outside" placeholder="เลือกคนขับรถ" variant="bordered" size="md" radius="md" selectedKeys={formData.tmsShipmentDriverId ? [formData.tmsShipmentDriverId] : []} onSelectionChange={(keys) => updateField("tmsShipmentDriverId", Array.from(keys)[0] || "")}>
                    {activeEmployees.map((e) => (<SelectItem key={String(e.hrEmployeeId)} textValue={`${e.hrEmployeeFirstName} ${e.hrEmployeeLastName}`}>{e.hrEmployeeFirstName} {e.hrEmployeeLastName}</SelectItem>))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input type="number" label="ค่าแรงคนขับ (บาท)" labelPlacement="outside" placeholder="กรอกค่าแรง" variant="bordered" size="md" radius="md" value={formData.tmsShipmentDriverWage} onChange={(e) => updateField("tmsShipmentDriverWage", e.target.value)} />
                </div>
                {/* เด็กติดรถ สูงสุด 3 คน */}
                <div className="flex flex-col w-full p-2 gap-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-light">เด็กติดรถ</p>
                    {(formData.tmsShipmentAssistants || []).length < 3 && (
                      <Button
                        variant="bordered"
                        size="md"
                        radius="md"
                        onPress={() => updateField("tmsShipmentAssistants", [...(formData.tmsShipmentAssistants || []), { id: "", wage: "" }])}
                      >
                        + เพิ่มเด็กติดรถ
                      </Button>
                    )}
                  </div>
                  {(formData.tmsShipmentAssistants || []).map((assistant, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                      <Select
                        label={`เด็กติดรถ ${idx + 1}`}
                        labelPlacement="outside"
                        placeholder="เลือกเด็กติดรถ"
                        variant="bordered"
                        size="md"
                        radius="md"
                        selectedKeys={assistant.id ? [assistant.id] : []}
                        onSelectionChange={(keys) => {
                          const updated = [...(formData.tmsShipmentAssistants || [])];
                          updated[idx] = { ...updated[idx], id: Array.from(keys)[0] || "" };
                          updateField("tmsShipmentAssistants", updated);
                        }}
                      >
                        {activeEmployees.map((e) => (
                          <SelectItem key={String(e.hrEmployeeId)} textValue={`${e.hrEmployeeFirstName} ${e.hrEmployeeLastName}`}>
                            {e.hrEmployeeFirstName} {e.hrEmployeeLastName}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        type="number"
                        label="ค่าแรง (บาท)"
                        labelPlacement="outside"
                        placeholder="กรอกค่าแรง"
                        variant="bordered"
                        size="md"
                        radius="md"
                        value={assistant.wage}
                        onChange={(e) => {
                          const updated = [...(formData.tmsShipmentAssistants || [])];
                          updated[idx] = { ...updated[idx], wage: e.target.value };
                          updateField("tmsShipmentAssistants", updated);
                        }}
                      />
                      {(formData.tmsShipmentAssistants || []).length > 1 && (
                        <Button
                          variant="bordered"
                          size="md"
                          radius="md"
                          isIconOnly
                          onPress={() => {
                            const updated = (formData.tmsShipmentAssistants || []).filter((_, i) => i !== idx);
                            updateField("tmsShipmentAssistants", updated);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {/* รายการพิเศษ */}
                <div className="flex flex-col w-full p-2 gap-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-light">รายการพิเศษ</p>
                    <Button variant="bordered" size="md" radius="md" onPress={addExtra}>
                      + เพิ่มรายการ
                    </Button>
                  </div>
                  {(formData.tmsShipmentExtras || []).length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-default-100">
                            <th className="text-left px-3 py-2 font-light w-36">คน</th>
                            <th className="text-left px-3 py-2 font-light w-32">ประเภท</th>
                            <th className="text-center px-3 py-2 font-light w-20">ชม.</th>
                            <th className="text-center px-3 py-2 font-light w-20">เรท</th>
                            <th className="text-left px-3 py-2 font-light">รายละเอียด</th>
                            <th className="text-right px-3 py-2 font-light w-28">จำนวนเงิน</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.tmsShipmentExtras || []).map((ex, idx) => {
                            const personOptions = [
                              { key: "driver", label: "คนขับ" },
                              ...(formData.tmsShipmentAssistants || [])
                                .map((a, i) => a.id ? { key: `assistant-${i}`, label: `เด็กติดรถ ${i + 1}` } : null)
                                .filter(Boolean),
                            ];
                            return (
                              <tr key={idx} className="border-t border-border">
                                <td className="px-1 py-1">
                                  <Select
                                    size="md" variant="bordered" radius="md" aria-label="คน"
                                    selectedKeys={ex.person ? [ex.person] : []}
                                    onSelectionChange={(keys) => updateExtra(idx, "person", Array.from(keys)[0] || "driver")}
                                  >
                                    {personOptions.map((o) => <SelectItem key={o.key}>{o.label}</SelectItem>)}
                                  </Select>
                                </td>
                                <td className="px-1 py-1">
                                  <Select
                                    size="md" variant="bordered" radius="md" aria-label="ประเภท"
                                    selectedKeys={ex.type ? [ex.type] : []}
                                    onSelectionChange={(keys) => updateExtra(idx, "type", Array.from(keys)[0] || "ot")}
                                  >
                                    <SelectItem key="ot">OT</SelectItem>
                                    <SelectItem key="trip_allowance">ค่าเที่ยว</SelectItem>
                                    <SelectItem key="other">อื่นๆ</SelectItem>
                                  </Select>
                                </td>
                                <td className="px-1 py-1">
                                  {ex.type === "ot" ? (
                                    <Input
                                      type="number" size="md" variant="bordered" radius="md"
                                      min={0} value={String(ex.hours || "")}
                                      onChange={(e) => updateExtra(idx, "hours", e.target.value)}
                                      classNames={{ input: "text-center" }}
                                    />
                                  ) : <span className="text-muted-foreground text-center block">-</span>}
                                </td>
                                <td className="px-1 py-1">
                                  {ex.type === "ot" ? (
                                    <Input
                                      type="number" size="md" variant="bordered" radius="md"
                                      min={0} step={0.5} value={String(ex.rate || "1.5")}
                                      onChange={(e) => updateExtra(idx, "rate", e.target.value)}
                                      classNames={{ input: "text-center" }}
                                    />
                                  ) : <span className="text-muted-foreground text-center block">-</span>}
                                </td>
                                <td className="px-1 py-1">
                                  {ex.type === "other" ? (
                                    <Input
                                      size="md" variant="bordered" radius="md"
                                      placeholder="ระบุรายละเอียด"
                                      value={ex.label || ""}
                                      onChange={(e) => updateExtra(idx, "label", e.target.value)}
                                    />
                                  ) : <span className="text-muted-foreground text-xs px-2">{ex.type === "ot" ? "ค่าแรง/8 × เรท × ชม." : "ค่าเที่ยว"}</span>}
                                </td>
                                <td className="px-1 py-1">
                                  {ex.type === "ot" ? (
                                    <span className="text-xs font-light block text-right px-2">
                                      {ex.amount ? Number(ex.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}
                                    </span>
                                  ) : (
                                    <Input
                                      type="number" size="md" variant="bordered" radius="md"
                                      min={0} value={String(ex.amount || "")}
                                      onChange={(e) => updateExtra(idx, "amount", e.target.value)}
                                      classNames={{ input: "text-right" }}
                                    />
                                  )}
                                </td>
                                <td className="px-1 py-1">
                                  <Button size="md" variant="light" isIconOnly onPress={() => removeExtra(idx)}>
                                    <Trash2 size={14} />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-default-50">
                            <td colSpan={5} className="px-3 py-2 font-light text-right">รวมรายการพิเศษ</td>
                            <td className="px-3 py-2 font-light text-right">
                              {(formData.tmsShipmentExtras || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                {/* ค่าน้ำมัน - คำนวณอัตโนมัติ */}
                <div className="flex flex-col w-full p-2 gap-3 md:col-span-2">
                  <p className="text-xs font-light">ค่าน้ำมันโดยประมาณ</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      label="ระยะทาง (กม.)"
                      labelPlacement="outside"
                      placeholder={distanceLoading ? "กำลังคำนวณ..." : "คำนวณจากปลายทาง"}
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsShipmentDistance}
                      onChange={(e) => updateField("tmsShipmentDistance", e.target.value)}
                      isDisabled={distanceLoading}
                    />
                    <Input
                      type="number"
                      label="ราคาน้ำมัน (บาท/ลิตร)"
                      labelPlacement="outside"
                      placeholder="ราคาน้ำมัน"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsShipmentFuelPricePerLiter}
                      onChange={(e) => updateField("tmsShipmentFuelPricePerLiter", e.target.value)}
                    />
                    {(() => {
                      const selectedVehicle = vehicles.find((v) => String(v.tmsVehicleId) === String(formData.tmsShipmentVehicleId));
                      const rate = parseFloat(selectedVehicle?.tmsVehicleFuelConsumptionRate) || 0;
                      const distance = parseFloat(formData.tmsShipmentDistance) || 0;
                      const price = parseFloat(formData.tmsShipmentFuelPricePerLiter) || 0;
                      const liters = rate > 0 ? distance / rate : 0;
                      const cost = liters * price;
                      return (
                        <Input
                          type="number"
                          label={`ค่าน้ำมัน (${rate > 0 && distance > 0 ? `${liters.toFixed(1)} ลิตร` : "เลือกรถก่อน"})`}
                          labelPlacement="outside"
                          variant="bordered"
                          size="md"
                          radius="md"
                          value={cost > 0 ? cost.toFixed(2) : ""}
                          placeholder="คำนวณอัตโนมัติ"
                          isReadOnly
                        />
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input label="อ้างอิงใบสั่งขาย" labelPlacement="outside" placeholder="เลขที่ใบสั่ง BC" variant="bordered" size="md" radius="md" value={formData.tmsShipmentSalesOrderRef} onChange={(e) => updateField("tmsShipmentSalesOrderRef", e.target.value)} />
                </div>

                {/* Items table or fallback input */}
                {shipmentItems.length > 0 ? (
                  <div className="flex flex-col w-full p-2 gap-2 md:col-span-2">
                    <p className="text-xs font-light">รายการสินค้า</p>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-default-100">
                            <th className="text-left px-3 py-2 font-light">รายการ</th>
                            <th className="text-center px-3 py-2 font-light w-20">หน่วย</th>
                            <th className="text-center px-3 py-2 font-light w-24">แผน</th>
                            <th className="text-center px-3 py-2 font-light w-28">ส่งจริง</th>
                            <th className="text-center px-3 py-2 font-light w-20">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentItems.map((item) => {
                            const pct = item.plannedQty > 0 ? Math.round((item.actualQty / item.plannedQty) * 100) : 0;
                            return (
                              <tr key={item.id} className="border-t border-border">
                                <td className="px-3 py-2">
                                  <p className="font-light">{item.description}</p>
                                  <p className="text-muted-foreground">{item.soNo}</p>
                                </td>
                                <td className="text-center px-3 py-2">{item.uom}</td>
                                <td className="text-center px-3 py-2 font-light">{item.plannedQty}</td>
                                <td className="text-center px-1 py-1">
                                  <Input
                                    type="number"
                                    size="md"
                                    variant="bordered"
                                    radius="md"
                                    min={0}
                                    max={item.plannedQty}
                                    value={String(item.actualQty)}
                                    onChange={(e) => updateItemActualQty(item.id, e.target.value)}
                                    classNames={{ input: "text-center" }}
                                  />
                                </td>
                                <td className="text-center px-3 py-2">
                                  <Chip
                                    size="md"
                                    variant="flat"
                                    color={pct >= 100 ? "success" : pct >= 50 ? "warning" : "danger"}
                                  >
                                    {pct}%
                                  </Chip>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-default-50">
                            <td className="px-3 py-2 font-light" colSpan={2}>รวม</td>
                            <td className="text-center px-3 py-2 font-light">{shipmentItems.reduce((s, i) => s + i.plannedQty, 0)}</td>
                            <td className="text-center px-3 py-2 font-light">{shipmentItems.reduce((s, i) => s + i.actualQty, 0)}</td>
                            <td className="text-center px-3 py-2">
                              {(() => {
                                const totalPlan = shipmentItems.reduce((s, i) => s + i.plannedQty, 0);
                                const totalActual = shipmentItems.reduce((s, i) => s + i.actualQty, 0);
                                const totalPct = totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0;
                                return (
                                  <Chip size="md" variant="flat" color={totalPct >= 100 ? "success" : totalPct >= 50 ? "warning" : "danger"}>
                                    {totalPct}%
                                  </Chip>
                                );
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                    <Input label="รายการสินค้า" labelPlacement="outside" placeholder="รายละเอียดสินค้า" variant="flat" size="md" radius="md" value={formData.tmsShipmentItemsSummary} onChange={(e) => updateField("tmsShipmentItemsSummary", e.target.value)} />
                  </div>
                )}
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input label="หมายเหตุ" labelPlacement="outside" placeholder="หมายเหตุเพิ่มเติม" variant="bordered" size="md" radius="md" value={formData.tmsShipmentNotes} onChange={(e) => updateField("tmsShipmentNotes", e.target.value)} />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleSave} isLoading={saving}>{editingShipment ? "อัปเดต" : "สร้าง"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบการขนส่ง</ModalHeader>
          <ModalBody>
            <p>คุณต้องการลบการขนส่ง <span className="font-light">{deletingShipment?.tmsShipmentNumber}</span> หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={deleteModal.onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleDelete}>ลบ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
