"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import DeliveriesView from "@/modules/tms/components/DeliveriesView";

const emptyForm = {
  tmsDeliveryShipmentId: "",
  tmsDeliveryReceiverName: "",
  tmsDeliveryReceiverPhone: "",
  tmsDeliveryStatus: "pending",
  tmsDeliveryNotes: "",
  tmsDeliverySignatureUrl: "",
  tmsDeliveryPhotoUrls: [],
};

function parseItemsSummary(summary) {
  if (!summary) return [];
  return summary
    .split(",")
    .map((part) => {
      const match = part.trim().match(/^(.+?)\s+x(\d+(?:\.\d+)?)\s*(.*)$/);
      if (!match) return null;
      const qty = parseFloat(match[2]) || 0;
      return {
        tmsDeliveryItemDescription: match[1].trim(),
        tmsDeliveryItemUom: match[3].trim(),
        tmsDeliveryItemSoNo: "",
        tmsDeliveryItemPlannedQty: qty,
        tmsDeliveryItemDeliveredQty: qty,
        tmsDeliveryItemDamagedQty: 0,
        tmsDeliveryItemReturnedQty: 0,
        tmsDeliveryItemDamageNotes: "",
      };
    })
    .filter(Boolean);
}

function determineStatus(items) {
  if (items.length === 0) return "pending";
  const allFull = items.every(
    (i) => parseFloat(i.tmsDeliveryItemDeliveredQty) >= i.tmsDeliveryItemPlannedQty
  );
  if (allFull) return "delivered_ok";
  const allZero = items.every(
    (i) => parseFloat(i.tmsDeliveryItemDeliveredQty) === 0
  );
  if (allZero) return "refused";
  const hasDamage = items.some(
    (i) => parseFloat(i.tmsDeliveryItemDamagedQty) > 0
  );
  if (hasDamage) return "delivered_damaged";
  return "delivered_partial";
}

function DeliveriesInner() {
  const searchParams = useSearchParams();
  const fromShipmentId = searchParams.get("shipmentId") || null;

  const [deliveries, setDeliveries] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDelivery, setDeletingDelivery] = useState(null);
  const [deliveryItems, setDeliveryItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!fromShipmentId) return;
    get(`/api/tms/shipments/${fromShipmentId}`)
      .then(async (shipment) => {
        if (!shipment) return;
        setFormData({
          ...emptyForm,
          tmsDeliveryShipmentId: String(shipment.tmsShipmentId),
          tmsDeliveryReceiverName: shipment.tmsShipmentCustomerName || "",
          tmsDeliveryReceiverPhone: shipment.tmsShipmentCustomerPhone || "",
        });

        try {
          const plans = await get(`/api/tms/deliveryPlans?shipmentId=${fromShipmentId}`);
          const plan = plans?.[0];
          if (plan?.tmsDeliveryPlanItem?.length > 0) {
            setDeliveryItems(
              plan.tmsDeliveryPlanItem.map((i) => ({
                tmsDeliveryItemDescription: i.tmsDeliveryPlanItemDescription || "",
                tmsDeliveryItemUom: i.tmsDeliveryPlanItemUom || "",
                tmsDeliveryItemSoNo: i.tmsDeliveryPlanItemSalesOrderNo || "",
                tmsDeliveryItemPlannedQty: parseFloat(i.tmsDeliveryPlanItemPlannedQty) || 0,
                tmsDeliveryItemDeliveredQty: parseFloat(i.tmsDeliveryPlanItemPlannedQty) || 0,
                tmsDeliveryItemDamagedQty: 0,
                tmsDeliveryItemReturnedQty: 0,
                tmsDeliveryItemDamageNotes: "",
              }))
            );
          } else {
            setDeliveryItems(parseItemsSummary(shipment.tmsShipmentItemsSummary));
          }
        } catch {
          setDeliveryItems(parseItemsSummary(shipment.tmsShipmentItemsSummary));
        }

        setEditingDelivery(null);
        onOpen();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromShipmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [delData, shipData] = await Promise.all([
        get("/api/tms/deliveries"),
        get("/api/tms/shipments"),
      ]);
      setDeliveries(delData);
      setShipments(shipData);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (delivery = null) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        tmsDeliveryShipmentId: delivery.tmsDeliveryShipmentId?.toString() || "",
        tmsDeliveryReceiverName: delivery.tmsDeliveryReceiverName || "",
        tmsDeliveryReceiverPhone: delivery.tmsDeliveryReceiverPhone || "",
        tmsDeliveryStatus: delivery.tmsDeliveryStatus || "pending",
        tmsDeliveryNotes: delivery.tmsDeliveryNotes || "",
        tmsDeliverySignatureUrl: delivery.tmsDeliverySignatureUrl || "",
        tmsDeliveryPhotoUrls: delivery.tmsDeliveryPhotoUrls || [],
      });
      setDeliveryItems(delivery.tmsDeliveryItem || []);
    } else {
      setEditingDelivery(null);
      setFormData(emptyForm);
      setDeliveryItems([]);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.tmsDeliveryShipmentId) {
      toast.error("กรุณาระบุการจัดส่ง");
      return;
    }

    if (deliveryItems.length > 0) {
      const hasUndocumented = deliveryItems.some((item) => {
        const delivered = parseFloat(item.tmsDeliveryItemDeliveredQty) || 0;
        const damaged = parseFloat(item.tmsDeliveryItemDamagedQty) || 0;
        const hasDiscrepancy = delivered < item.tmsDeliveryItemPlannedQty || damaged > 0;
        return hasDiscrepancy && !item.tmsDeliveryItemDamageNotes?.trim();
      });
      if (hasUndocumented) {
        toast.error("กรุณาระบุหมายเหตุสำหรับรายการที่ส่งไม่ครบหรือเสียหาย");
        return;
      }
    }

    try {
      setSaving(true);

      const autoStatus = deliveryItems.length > 0
        ? determineStatus(deliveryItems)
        : formData.tmsDeliveryStatus;

      const payload = {
        ...formData,
        tmsDeliveryStatus: autoStatus,
        items: deliveryItems,
      };

      if (editingDelivery) {
        await put(`/api/tms/deliveries/${editingDelivery.tmsDeliveryId}`, payload);
        toast.success("อัปเดตการส่งมอบสำเร็จ");
      } else {
        await post("/api/tms/deliveries", payload);
        toast.success("สร้างการส่งมอบสำเร็จ");
      }

      const shipmentId = fromShipmentId || formData.tmsDeliveryShipmentId;
      if (shipmentId) {
        try {
          const targetStatus =
            autoStatus === "delivered_ok" ? "pod_confirmed" : "delivered";
          await put(`/api/tms/shipments/${shipmentId}/status`, { tmsShipmentStatus: targetStatus });
        } catch {}
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกการส่งมอบล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (delivery) => {
    setDeletingDelivery(delivery);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDelivery) return;
    try {
      await del(`/api/tms/deliveries/${deletingDelivery.tmsDeliveryId}`);
      toast.success("ลบการส่งมอบสำเร็จ");
      deleteModal.onClose();
      setDeletingDelivery(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบการส่งมอบล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDeliveryItem = (index, field, value) => {
    setDeliveryItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (
          field === "tmsDeliveryItemDeliveredQty" ||
          field === "tmsDeliveryItemDamagedQty"
        ) {
          const planned = updated.tmsDeliveryItemPlannedQty;
          const delivered = parseFloat(updated.tmsDeliveryItemDeliveredQty) || 0;
          const damaged = parseFloat(updated.tmsDeliveryItemDamagedQty) || 0;
          updated.tmsDeliveryItemReturnedQty = Math.max(0, planned - delivered - damaged);
        }
        return updated;
      })
    );
  };

  return (
    <DeliveriesView
      deliveries={deliveries}
      shipments={shipments}
      loading={loading}
      saving={saving}
      editingDelivery={editingDelivery}
      formData={formData}
      deletingDelivery={deletingDelivery}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      deliveryItems={deliveryItems}
      updateDeliveryItem={updateDeliveryItem}
    />
  );
}

export default function DeliveriesClient() {
  return (
    <Suspense>
      <DeliveriesInner />
    </Suspense>
  );
}
