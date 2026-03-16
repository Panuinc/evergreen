"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getLabelDesigns,
  createLabelDesign,
  updateLabelDesign,
  deleteLabelDesign as deleteLabelDesignAction,
} from "@/modules/marketing/actions";

export function useLabelDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLabelDesigns();
      setDesigns(data);
    } catch {
      toast.error("โหลดแบบฉลากล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (design) => {
    const payload = {
      labelDesignName: design.name,
      labelDesignWidth: design.labelSize.width,
      labelDesignHeight: design.labelSize.height,
      labelDesignPreset: design.labelPreset,
      labelDesignElements: design.elements,
    };

    if (design.id) {
      const result = await updateLabelDesign(design.id, payload);
      setDesigns((prev) =>
        prev.map((d) => (d.labelDesignId === design.id ? result : d)),
      );
      toast.success(`บันทึก "${design.name}" แล้ว`);
      return result;
    } else {
      const result = await createLabelDesign(payload);
      setDesigns((prev) => [result, ...prev]);
      toast.success(`สร้าง "${design.name}" แล้ว`);
      return result;
    }
  };

  const remove = async (id) => {
    await deleteLabelDesignAction(id);
    setDesigns((prev) => prev.filter((d) => d.labelDesignId !== id));
    toast.success("ลบแบบฉลากแล้ว");
  };

  return { designs, loading, reload: load, save, remove };
}
