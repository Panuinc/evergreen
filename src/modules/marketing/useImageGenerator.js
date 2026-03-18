"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { get, authFetch } from "@/lib/apiClient";

export function useImageGenerator() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  // Batch state
  const [batchResults, setBatchResults] = useState([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Single image generation
  const generate = async (imageFile, prompt, size = "1024x1024") => {
    if (!imageFile) {
      toast.error("กรุณาเลือกรูปภาพ");
      return null;
    }
    if (!prompt?.trim()) {
      toast.error("กรุณาใส่ prompt");
      return null;
    }

    try {
      setGenerating(true);
      setResult(null);
      setBatchResults([]);
      const form = new FormData();
      form.append("image", imageFile);
      form.append("prompt", prompt);
      form.append("size", size);
      const res = await authFetch("/api/marketing/ai/generate-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      setResult(data);
      toast.success("สร้างรูปภาพสำเร็จ");
      return data;
    } catch (error) {
      toast.error(error.message || "สร้างรูปภาพล้มเหลว");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  // Batch generation: multiple files, one prompt
  const generateBatch = useCallback(async (imageFiles, prompt, size = "1024x1024") => {
    if (!imageFiles || imageFiles.length === 0) {
      toast.error("กรุณาเลือกรูปภาพ");
      return;
    }
    if (!prompt?.trim()) {
      toast.error("กรุณาใส่ prompt");
      return;
    }

    setGenerating(true);
    setResult(null);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: imageFiles.length });

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      setBatchProgress({ current: i + 1, total: imageFiles.length });

      try {
        const batchForm = new FormData();
        batchForm.append("image", imageFiles[i]);
        batchForm.append("prompt", prompt);
        batchForm.append("size", size);
        const batchRes = await authFetch("/api/marketing/ai/generate-image", { method: "POST", body: batchForm });
        const data = await batchRes.json();
        if (!batchRes.ok) throw new Error(data.error || "Image generation failed");
        results.push({ file: imageFiles[i].name, ...data, status: "success" });
        successCount++;
      } catch (error) {
        results.push({ file: imageFiles[i].name, status: "error", error: error.message });
        failCount++;
      }

      // Update results progressively
      setBatchResults([...results]);
    }

    setGenerating(false);
    setBatchProgress({ current: 0, total: 0 });

    if (failCount === 0) {
      toast.success(`สร้างรูปภาพสำเร็จทั้งหมด ${successCount} รูป`);
    } else {
      toast.warning(`สำเร็จ ${successCount} รูป, ล้มเหลว ${failCount} รูป`);
    }
  }, []);

  const loadHistory = async (limit = 50) => {
    try {
      setLoadingHistory(true);
      const data = await get(`/api/marketing/ai/generate-image?limit=${limit}`);
      setHistory(data);
    } catch (error) {
      toast.error("โหลดประวัติล้มเหลว");
    } finally {
      setLoadingHistory(false);
    }
  };

  const reset = () => {
    setResult(null);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: 0 });
  };

  return {
    generate,
    generateBatch,
    generating,
    result,
    batchResults,
    batchProgress,
    reset,
    history,
    loadHistory,
    loadingHistory,
  };
}
