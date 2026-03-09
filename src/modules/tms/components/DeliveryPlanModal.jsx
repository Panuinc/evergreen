"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip,
  Spinner,
} from "@heroui/react";
import { Plus, Trash2, Search } from "lucide-react";
import DeliveryPlanMapPicker from "./DeliveryPlanMapPicker";

const STATUS_COLORS = {
  planned: "primary",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
};

const STATUS_LABELS = {
  planned: "วางแผนแล้ว",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const PRIORITY_COLORS = {
  urgent: "danger",
  high: "warning",
  normal: "primary",
  low: "default",
};

const PRIORITY_LABELS = {
  urgent: "ด่วนมาก",
  high: "ด่วน",
  normal: "ปกติ",
  low: "ต่ำ",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDateString(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DeliveryPlanModal({
  isOpen,
  onClose,
  selectedDate,
  editingPlan,
  plansOnDate,
  salesOrders,
  soLoading,
  selectedSO,
  soLines,
  soLinesLoading,
  saving,
  onSearchSO,
  onSelectSO,
  onSave,
  onDelete,
  onEditPlan,
}) {
  const [showForm, setShowForm] = useState(false);
  const [soSearch, setSoSearch] = useState("");
  const [checkedLines, setCheckedLines] = useState({});
  const [plannedQtys, setPlannedQtys] = useState({});
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("planned");
  const [priority, setPriority] = useState("normal");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const dateStr = editingPlan
    ? editingPlan.tmsDeliveryPlanDate
    : toDateString(selectedDate);

  useEffect(() => {
    if (editingPlan) {
      setShowForm(true);
      setNotes(editingPlan.tmsDeliveryPlanNotes || "");
      setStatus(editingPlan.tmsDeliveryPlanStatus || "planned");
      setPriority(editingPlan.tmsDeliveryPlanPriority || "normal");
      setAddress(editingPlan.tmsDeliveryPlanAddress || "");
      setLat(editingPlan.tmsDeliveryPlanLat || null);
      setLng(editingPlan.tmsDeliveryPlanLng || null);
    } else {
      setShowForm(false);
      resetForm();
    }
  }, [editingPlan, isOpen]);

  const resetForm = () => {
    setSoSearch("");
    setCheckedLines({});
    setPlannedQtys({});
    setNotes("");
    setStatus("planned");
    setPriority("normal");
    setAddress("");
    setLat(null);
    setLng(null);
    onSelectSO(null);
  };

  const handleSOSearch = (val) => {
    setSoSearch(val);
    onSearchSO(val);
  };

  const toggleLine = (lineNo) => {
    setCheckedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));
    if (!plannedQtys[lineNo]) {
      const line = soLines.find((l) => l.bcSalesOrderLineNo === lineNo);
      setPlannedQtys((prev) => ({
        ...prev,
        [lineNo]: line?.bcSalesOrderLineOutstandingQuantity || 0,
      }));
    }
  };

  const handleQtyChange = (lineNo, val) => {
    setPlannedQtys((prev) => ({ ...prev, [lineNo]: val }));
  };

  const handleLocationChange = (newLat, newLng, newAddress) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress || "");
  };

  const handleSave = () => {
    if (editingPlan) {
      // Edit mode: only update location
      onSave({
        tmsDeliveryPlanAddress: address || null,
        tmsDeliveryPlanLat: lat || null,
        tmsDeliveryPlanLng: lng || null,
      });
      return;
    }

    const selectedLines = soLines.filter(
      (l) => checkedLines[l.bcSalesOrderLineNo]
    );

    if (selectedLines.length === 0) {
      return;
    }

    const items = selectedLines.map((l) => ({
      tmsDeliveryPlanItemSalesOrderNo: selectedSO?.bcSalesOrderNumber,
      tmsDeliveryPlanItemCustomerName: selectedSO?.bcSalesOrderCustomerName,
      tmsDeliveryPlanItemSalesOrderLineNo: l.bcSalesOrderLineNo,
      tmsDeliveryPlanItemItemNo: l.bcSalesOrderLineObjectNumber,
      tmsDeliveryPlanItemDescription: l.bcSalesOrderLineDescription,
      tmsDeliveryPlanItemUom: l.bcSalesOrderLineUnitOfMeasureCode,
      tmsDeliveryPlanItemOrderedQty: l.bcSalesOrderLineQuantity,
      tmsDeliveryPlanItemShippedQty: l.bcSalesOrderLineQuantityShipped,
      tmsDeliveryPlanItemOutstandingQty: l.bcSalesOrderLineOutstandingQuantity,
      tmsDeliveryPlanItemPlannedQty:
        parseFloat(plannedQtys[l.bcSalesOrderLineNo]) || 0,
    }));

    onSave({
      tmsDeliveryPlanDate: dateStr,
      tmsDeliveryPlanStatus: status,
      tmsDeliveryPlanPriority: priority,
      tmsDeliveryPlanNotes: notes || null,
      tmsDeliveryPlanAddress: address || null,
      tmsDeliveryPlanLat: lat || null,
      tmsDeliveryPlanLng: lng || null,
      items,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-sm font-light">แผนส่งของ</p>
          <p className="text-sm text-muted-foreground font-light">
            {formatDate(dateStr)}
          </p>
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Plans on this date */}
          {plansOnDate.length > 0 && !showForm && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-light text-muted-foreground">
                แผนที่มีอยู่ ({plansOnDate.length})
              </p>
              {plansOnDate.map((plan) => (
                <div
                  key={plan.tmsDeliveryPlanId}
                  className={`flex items-start justify-between p-3 rounded-xl border gap-2 border-l-4 ${
                    plan.tmsDeliveryPlanPriority === "urgent"
                      ? "border-l-danger-400"
                      : plan.tmsDeliveryPlanPriority === "high"
                      ? "border-l-warning-400"
                      : plan.tmsDeliveryPlanPriority === "low"
                      ? "border-l-default-300"
                      : "border-l-primary-400"
                  } border-border`}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip
                        size="sm"
                        color={STATUS_COLORS[plan.tmsDeliveryPlanStatus]}
                        variant="flat"
                      >
                        {STATUS_LABELS[plan.tmsDeliveryPlanStatus]}
                      </Chip>
                      <Chip
                        size="sm"
                        color={PRIORITY_COLORS[plan.tmsDeliveryPlanPriority] || "primary"}
                        variant="dot"
                      >
                        {PRIORITY_LABELS[plan.tmsDeliveryPlanPriority] || "ปกติ"}
                      </Chip>
                      <span className="text-sm text-muted-foreground">
                        {plan.tmsDeliveryPlanItem?.length || 0} รายการ
                      </span>
                    </div>
                    {plan.tmsDeliveryPlanItem?.slice(0, 3).map((item) => (
                      <p
                        key={item.tmsDeliveryPlanItemId}
                        className="text-sm text-foreground truncate"
                      >
                        {item.tmsDeliveryPlanItemSalesOrderNo} ·{" "}
                        {item.tmsDeliveryPlanItemDescription} ×{" "}
                        {item.tmsDeliveryPlanItemPlannedQty}{" "}
                        {item.tmsDeliveryPlanItemUom}
                      </p>
                    ))}
                    {plan.tmsDeliveryPlanItem?.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{plan.tmsDeliveryPlanItem.length - 3} รายการอื่นๆ
                      </p>
                    )}
                    {plan.tmsDeliveryPlanAddress && (
                      <p className="text-sm text-muted-foreground truncate">
                        📍 {plan.tmsDeliveryPlanAddress}
                      </p>
                    )}
                    {plan.tmsDeliveryPlanNotes && (
                      <p className="text-sm text-muted-foreground italic">
                        {plan.tmsDeliveryPlanNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 items-start">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => onEditPlan(plan)}
                    >
                      แก้ไข
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isIconOnly
                      onPress={() => onDelete(plan.tmsDeliveryPlanId)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new plan button */}
          {!showForm && (
            <Button
              variant="flat"
              color="primary"
              startContent={<Plus size={16} />}
              onPress={() => {
                setShowForm(true);
                onSearchSO("");
              }}
            >
              เพิ่มแผนส่งของ
            </Button>
          )}

          {/* Plan Form */}
          {showForm && (
            <div className="flex flex-col gap-4">
              {editingPlan ? (
                <>
                  {/* Edit mode: show details (read-only) + map */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Chip
                      size="sm"
                      color={STATUS_COLORS[editingPlan.tmsDeliveryPlanStatus]}
                      variant="flat"
                    >
                      {STATUS_LABELS[editingPlan.tmsDeliveryPlanStatus]}
                    </Chip>
                    <Chip
                      size="sm"
                      color={PRIORITY_COLORS[editingPlan.tmsDeliveryPlanPriority] || "primary"}
                      variant="dot"
                    >
                      {PRIORITY_LABELS[editingPlan.tmsDeliveryPlanPriority] || "ปกติ"}
                    </Chip>
                  </div>

                  {editingPlan.tmsDeliveryPlanItem?.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-light text-muted-foreground">
                        รายการสินค้า ({editingPlan.tmsDeliveryPlanItem.length})
                      </p>
                      {editingPlan.tmsDeliveryPlanItem.map((item) => (
                        <div
                          key={item.tmsDeliveryPlanItemId}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-sm font-light">
                              {item.tmsDeliveryPlanItemSalesOrderNo}
                              {item.tmsDeliveryPlanItemCustomerName && (
                                <span className="font-light text-muted-foreground">
                                  {" · "}{item.tmsDeliveryPlanItemCustomerName}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-foreground truncate">
                              {item.tmsDeliveryPlanItemDescription}
                            </p>
                          </div>
                          <p className="text-sm font-light text-primary whitespace-nowrap pl-2">
                            {item.tmsDeliveryPlanItemPlannedQty} {item.tmsDeliveryPlanItemUom}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {editingPlan.tmsDeliveryPlanNotes && (
                    <p className="text-sm text-muted-foreground italic">
                      {editingPlan.tmsDeliveryPlanNotes}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-light">สถานที่ส่ง</p>
                    <DeliveryPlanMapPicker
                      lat={lat}
                      lng={lng}
                      address={address}
                      onLocationChange={handleLocationChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Create mode: full form */}
                  {/* Status selector */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-light text-muted-foreground">สถานะ</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <Chip
                          key={key}
                          color={STATUS_COLORS[key]}
                          variant={status === key ? "solid" : "bordered"}
                          className="cursor-pointer"
                          onClick={() => setStatus(key)}
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Priority selector */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-light text-muted-foreground">ความสำคัญ</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <Chip
                          key={key}
                          color={PRIORITY_COLORS[key]}
                          variant={priority === key ? "solid" : "bordered"}
                          className="cursor-pointer"
                          onClick={() => setPriority(key)}
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* SO Search */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-light">เลือก Sales Order</p>
                    <Input
                      placeholder="ค้นหาเลขที่ SO หรือชื่อลูกค้า..."
                      value={soSearch}
                      onValueChange={handleSOSearch}
                      startContent={<Search size={14} />}
                      size="sm"
                    />
                    {soLoading && <Spinner size="sm" />}
                    {!soLoading && salesOrders.length > 0 && !selectedSO && (
                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-border rounded-xl p-1">
                        {salesOrders.map((so) => (
                          <button
                            key={so.bcSalesOrderNumber}
                            className="flex flex-col items-start px-3 py-2 rounded-lg hover:bg-default-100 text-left"
                            onClick={() => onSelectSO(so)}
                          >
                            <span className="text-sm font-light">
                              {so.bcSalesOrderNumber}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {so.bcSalesOrderCustomerName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSO && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 border border-primary-200">
                        <div>
                          <p className="text-sm font-light text-primary">
                            {selectedSO.bcSalesOrderNumber}
                          </p>
                          <p className="text-sm text-foreground">
                            {selectedSO.bcSalesOrderCustomerName}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => onSelectSO(null)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* SO Lines */}
                  {selectedSO && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-light">เลือกรายการสินค้า</p>
                      {soLinesLoading && <Spinner size="sm" />}
                      {!soLinesLoading && soLines.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          ไม่มีรายการที่ค้างส่ง
                        </p>
                      )}
                      {!soLinesLoading &&
                        soLines.map((line) => (
                          <div
                            key={line.bcSalesOrderLineNo}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              checkedLines[line.bcSalesOrderLineNo]
                                ? "border-primary-300 bg-primary-50"
                                : "border-border hover:border-border"
                            }`}
                            onClick={() => toggleLine(line.bcSalesOrderLineNo)}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedLines[line.bcSalesOrderLineNo]}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-light truncate">
                                {line.bcSalesOrderLineDescription}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                สั่ง {line.bcSalesOrderLineQuantity} · ส่งแล้ว{" "}
                                {line.bcSalesOrderLineQuantityShipped} · คงเหลือ{" "}
                                <span className="text-warning-600 font-light">
                                  {line.bcSalesOrderLineOutstandingQuantity}
                                </span>{" "}
                                {line.bcSalesOrderLineUnitOfMeasureCode}
                              </p>
                            </div>
                            {checkedLines[line.bcSalesOrderLineNo] && (
                              <Input
                                size="sm"
                                type="number"
                                label="จำนวนที่ส่ง"
                                className="w-28"
                                value={String(
                                  plannedQtys[line.bcSalesOrderLineNo] || ""
                                )}
                                onValueChange={(v) =>
                                  handleQtyChange(line.bcSalesOrderLineNo, v)
                                }
                                onClick={(e) => e.stopPropagation()}
                                min={0}
                                max={line.bcSalesOrderLineOutstandingQuantity}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Location / Map */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-light">สถานที่ส่ง</p>
                    <DeliveryPlanMapPicker
                      lat={lat}
                      lng={lng}
                      address={address}
                      onLocationChange={handleLocationChange}
                    />
                  </div>

                  {/* Notes */}
                  <Textarea
                    label="หมายเหตุ"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={notes}
                    onValueChange={setNotes}
                    minRows={2}
                    size="sm"
                  />
                </>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            ปิด
          </Button>
          {showForm && (
            <>
              <Button
                variant="flat"
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={saving}
                isDisabled={
                  !editingPlan &&
                  Object.values(checkedLines).filter(Boolean).length === 0
                }
              >
                บันทึก
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
