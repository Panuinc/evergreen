"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import LabelDesignerView from "@/modules/marketing/components/labelDesignerView";

export default function LabelDesignerClient({ initialDesigns }) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [loading, setLoading] = useState(false);

  const save = async (design) => {
    const payload = {
      labelDesignName: design.name,
      labelDesignWidth: design.labelSize.width,
      labelDesignHeight: design.labelSize.height,
      labelDesignPreset: design.labelPreset,
      labelDesignElements: design.elements,
    };

    if (design.id) {
      const result = await put(`/api/marketing/labelDesigns/${design.id}`, payload);
      setDesigns((prev) =>
        prev.map((d) => (d.labelDesignId === design.id ? result : d)),
      );
      toast.success(`บันทึก "${design.name}" แล้ว`);
      return result;
    } else {
      const result = await post("/api/marketing/labelDesigns", payload);
      setDesigns((prev) => [result, ...prev]);
      toast.success(`สร้าง "${design.name}" แล้ว`);
      return result;
    }
  };

  const remove = async (id) => {
    await del(`/api/marketing/labelDesigns/${id}`);
    setDesigns((prev) => prev.filter((d) => d.labelDesignId !== id));
    toast.success("ลบแบบฉลากแล้ว");
  };

  return (
    <LabelDesignerView
      savedDesigns={designs}
      designsLoading={loading}
      onSaveDesign={save}
      onDeleteDesign={remove}
    />
  );
}
