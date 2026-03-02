"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

/**
 * useBomAI — AI assistant hook for the BOM form.
 *
 * @param {object} params
 * @param {object} params.bomState   – current form values to send as context
 * @param {object} params.setters    – { setCustomerPO, setOrderQty, setDoorThickness, ... }
 */
export function useBomAI({ bomState, setters }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [pendingDoors, setPendingDoors] = useState([]); // extracted doors from file
  const [selectedDoorIdx, setSelectedDoorIdx] = useState(null); // index in pendingDoors for compare
  const [appliedDoorIdxs, setAppliedDoorIdxs] = useState([]); // which doors have been applied
  const abortRef = useRef(null);

  const applyFormFields = useCallback(
    (fields) => {
      if (!setters) return 0;
      const map = {
        customerPO: setters.setCustomerPO,
        orderQty: setters.setOrderQty,
        doorCode: setters.setDoorType,   // D18, D22 → "ประเภทประตู" field
        doorThickness: setters.setDoorThickness,
        doorWidth: setters.setDoorWidth,
        doorHeight: setters.setDoorHeight,
        surfaceMaterial: setters.setSurfaceMaterial,
        surfacePrice: setters.setSurfacePrice,
        surfaceThickness: setters.setSurfaceThickness,
        coreType: setters.setCoreType,
        edgeBanding: setters.setEdgeBanding,
      };
      let count = 0;
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined && val !== null && map[key]) {
          map[key](typeof val === "boolean" ? val : String(val));
          count++;
        }
      }
      return count;
    },
    [setters],
  );

  // Apply only selected fields from a pending door — keeps remaining doors active
  const applyDoorFields = useCallback(
    (door, selectedKeys, doorIdx) => {
      if (!door) return;
      const fieldsToApply = selectedKeys
        ? Object.fromEntries(Object.entries(door).filter(([k]) => selectedKeys.includes(k)))
        : door;
      applyFormFields(fieldsToApply);
      setLastAction({ fields: fieldsToApply, count: Object.keys(fieldsToApply).length });

      // Mark this door as applied, move to next unapplied door
      setAppliedDoorIdxs((prev) => {
        const next = [...prev, doorIdx];
        return next;
      });
      setSelectedDoorIdx((prev) => {
        // Find next unapplied door after current
        return prev; // will be recalculated in the component via effect
      });
    },
    [applyFormFields],
  );

  // Select a pending door for compare view
  const selectDoor = useCallback((idx) => {
    setSelectedDoorIdx(idx);
  }, []);

  // Dismiss all pending doors
  const dismissPendingDoors = useCallback(() => {
    setPendingDoors([]);
    setSelectedDoorIdx(null);
    setAppliedDoorIdxs([]);
  }, []);

  const sendMessage = useCallback(
    async (content, image = null) => {
      const userMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];

      setMessages([...updatedMessages, { role: "assistant", content: "" }]);
      setIsLoading(true);
      setLastAction(null);

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/production/bom/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            bomState,
            image,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `ส่งข้อความล้มเหลว (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);

              // Multi-door extraction from file
              if (parsed.type === "bom_action" && parsed.action?.type === "extract_doors") {
                const doors = parsed.action.doors || [];
                if (doors.length === 1) {
                  // Single door — apply directly
                  const count = applyFormFields(doors[0]);
                  setLastAction({ fields: doors[0], count });
                } else if (doors.length > 1) {
                  // Multiple doors — show selector
                  setPendingDoors(doors);
                  setSelectedDoorIdx(0);
                }
                continue;
              }

              // Single door fill from text
              if (parsed.type === "bom_action" && parsed.action?.type === "fill_form") {
                const count = applyFormFields(parsed.action.fields);
                setLastAction({ fields: parsed.action.fields, count });
                continue;
              }

              // Content delta
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages([
                  ...updatedMessages,
                  { role: "assistant", content: assistantContent },
                ]);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        setMessages([
          ...updatedMessages,
          { role: "assistant", content: assistantContent },
        ]);
      } catch (error) {
        if (error.name === "AbortError") return;
        toast.error("AI ไม่สามารถตอบได้ในขณะนี้");
        setMessages(updatedMessages);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, bomState, applyFormFields],
  );

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
    setLastAction(null);
    setPendingDoors([]);
    setSelectedDoorIdx(null);
    setAppliedDoorIdxs([]);
  }, []);

  return {
    messages,
    isLoading,
    lastAction,
    pendingDoors,
    selectedDoorIdx,
    appliedDoorIdxs,
    sendMessage,
    selectDoor,
    applyDoorFields,
    dismissPendingDoors,
    clearMessages,
  };
}
