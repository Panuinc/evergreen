"use client";

import { useState, useRef, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Chip,
  ScrollShadow,
  Checkbox,
} from "@heroui/react";
import { Bot, Send, Trash2, ImagePlus, X, Sparkles, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
const FIELD_LABELS = {
  doorCode: "รหัสประตู",
  doorName: "ชื่อประตู",
  orderQty: "จำนวน (บาน)",
  doorThickness: "ความหนา (มม.)",
  doorWidth: "ความกว้าง (มม.)",
  doorHeight: "ความสูง (มม.)",
  surfaceMaterial: "วัสดุผิว",
  surfaceThickness: "ความหนาผิว (มม.)",
  coreType: "ไส้ประตู",
  edgeBanding: "ทำขอบ",
  notes: "หมายเหตุ",
};

const CORE_LABELS = {
  foam: "โฟม",
  plywood_strips: "ไม้อัดเส้น",
  particle_solid: "ปาร์ติเคิลแผ่น",
  rockwool: "ร็อควูล",
  honeycomb: "รังผึ้ง",
  particle_strips: "ปาร์ติเคิลเส้น",
};

const APPLY_FIELDS = ["doorCode", "orderQty", "doorThickness", "doorWidth", "doorHeight", "surfaceMaterial", "surfaceThickness", "coreType", "edgeBanding"];

function formatFieldValue(key, val) {
  if (key === "coreType") return CORE_LABELS[val] || val;
  if (key === "edgeBanding") return val ? "ใช่" : "ไม่";
  return String(val ?? "-");
}

function DoorCompareView({ doors, selectedIdx, appliedIdxs, onSelectDoor, onApply, onDismiss, bomState }) {
  const door = doors[selectedIdx] ?? doors[0];
  const [checkedKeys, setCheckedKeys] = useState(APPLY_FIELDS);

  // Reset checkboxes when switching doors
  useEffect(() => {
    setCheckedKeys(APPLY_FIELDS);
  }, [selectedIdx]);

  const toggleKey = (key) => {
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isApplied = appliedIdxs.includes(selectedIdx);
  const remainingCount = doors.length - appliedIdxs.length;

  return (
    <div className="flex flex-col gap-2">
      {/* Header: progress */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-default-700">
          พบ {doors.length} ประตู
          {appliedIdxs.length > 0 && (
            <span className="text-success-600 ml-1">· ใช้แล้ว {appliedIdxs.length}</span>
          )}
          {remainingCount > 0 && (
            <span className="text-default-400 ml-1">· เหลือ {remainingCount}</span>
          )}
        </span>
        <Button size="sm" variant="light" color="default" onPress={onDismiss} className="text-[11px] h-6 min-w-0 px-2">
          ปิด
        </Button>
      </div>

      {/* Door selector tabs */}
      {doors.length > 1 && (
        <div className="flex items-center gap-1">
          <Button
            isIconOnly variant="light" size="sm"
            onPress={() => onSelectDoor(Math.max(0, selectedIdx - 1))}
            isDisabled={selectedIdx === 0}
          >
            <ChevronLeft size={12} />
          </Button>
          <ScrollShadow orientation="horizontal" className="flex-1">
            <div className="flex gap-1">
              {doors.map((d, i) => {
                const done = appliedIdxs.includes(i);
                return (
                  <Chip
                    key={i}
                    size="sm"
                    variant={i === selectedIdx ? "solid" : "flat"}
                    color={done ? "success" : i === selectedIdx ? "primary" : "default"}
                    className="cursor-pointer shrink-0 text-[11px]"
                    onClick={() => onSelectDoor(i)}
                  >
                    {done ? "✓ " : ""}{d.doorCode || `ประตู ${i + 1}`}
                  </Chip>
                );
              })}
            </div>
          </ScrollShadow>
          <Button
            isIconOnly variant="light" size="sm"
            onPress={() => onSelectDoor(Math.min(doors.length - 1, selectedIdx + 1))}
            isDisabled={selectedIdx === doors.length - 1}
          >
            <ChevronRight size={12} />
          </Button>
        </div>
      )}

      {/* Applied banner */}
      {isApplied ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 border border-success-200 text-[12px] text-success-700">
          <CheckCheck size={13} />
          <span>กรอกฟอร์มแล้ว — เลือกประตูถัดไปหรือปิด</span>
        </div>
      ) : (
        <>
          {/* Door name + notes */}
          {(door.doorName || door.notes) && (
            <div className="text-[11px] text-default-500 px-1">
              {door.doorName && <span className="font-medium text-foreground">{door.doorName}</span>}
              {door.notes && <span className="ml-1 text-warning-600">· {door.notes}</span>}
            </div>
          )}

          {/* Field-by-field compare table */}
          <div className="rounded-lg border border-default-200 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr] text-[10px] font-semibold bg-default-100 text-default-500 px-2 py-1">
              <span className="w-4" />
              <span>ฟิลด์</span>
              <span className="text-primary">AI แนะนำ</span>
            </div>
            {APPLY_FIELDS.filter((k) => door[k] !== undefined && door[k] !== null).map((key) => {
              const currentVal = bomState?.[key];
              const aiVal = door[key];
              const isDiff = String(currentVal ?? "") !== String(aiVal ?? "");
              return (
                <div
                  key={key}
                  className={`grid grid-cols-[auto_1fr_1fr] items-center gap-1 px-2 py-1 text-[11px] border-t border-default-100 ${isDiff ? "bg-primary-50/40" : ""}`}
                >
                  <Checkbox
                    size="sm"
                    isSelected={checkedKeys.includes(key)}
                    onValueChange={() => toggleKey(key)}
                    className="min-w-0"
                  />
                  <span className="text-default-600 truncate">{FIELD_LABELS[key] || key}</span>
                  <span className={`font-medium truncate ${isDiff ? "text-primary" : "text-default-700"}`}>
                    {formatFieldValue(key, aiVal)}
                    {isDiff && currentVal != null && currentVal !== "" && (
                      <span className="text-default-400 font-normal ml-1 text-[10px]">
                        (เดิม: {formatFieldValue(key, currentVal)})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Apply action */}
          <Button
            size="sm" color="primary" variant="solid" fullWidth className="text-[12px]"
            startContent={<CheckCheck size={12} />}
            onPress={() => onApply(door, checkedKeys, selectedIdx)}
            isDisabled={checkedKeys.length === 0}
          >
            กรอกฟอร์ม {door.doorCode ? `(${door.doorCode})` : ""} · {checkedKeys.length} ฟิลด์
            {remainingCount > 1 && <span className="ml-1 opacity-70">→ ถัดไป</span>}
          </Button>
        </>
      )}
    </div>
  );
}

export default function BomAIPanel({ bomState, bomAI }) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);        // for upload-first zone (auto-analyze)
  const fileInputRef = useRef(null);   // for chat attach button

  const {
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
  } = bomAI;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingDoors]);

  // Auto-advance to next unapplied door after applying one
  useEffect(() => {
    if (!pendingDoors.length || !appliedDoorIdxs.length) return;
    const nextIdx = pendingDoors.findIndex((_, i) => !appliedDoorIdxs.includes(i));
    if (nextIdx !== -1 && nextIdx !== selectedDoorIdx) {
      selectDoor(nextIdx);
    }
  }, [appliedDoorIdxs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    sendMessage(msg, image);
    setImage(null);
    setImagePreview(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 3.5MB กรุณาบีบอัดก่อนอัปโหลด");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Auto-analyze on file select: if no text in input, send with default prompt
  const handleAutoAnalyze = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 3.5MB กรุณาบีบอัดก่อนอัปโหลด");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // Send immediately with auto-prompt
      sendMessage("อ่านแบบขยายประตูนี้แล้วดึงสเปคมากรอกฟอร์มให้ด้วย", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const hasPendingDoors = pendingDoors.length > 0;

  return (
    <Card shadow="none" className="w-full border border-primary-200 bg-primary-50/30">
      <CardHeader className="border-b border-primary-200 bg-primary-50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="font-semibold text-sm text-primary">AI ช่วยกรอก BOM</span>
            <span className="text-[9px] text-default-400 font-normal">
              {image ? "Gemini + Claude" : "Claude Sonnet"}
            </span>
          </div>
          {messages.length > 0 && (
            <Button isIconOnly variant="light" size="sm" onPress={clearMessages}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody className="gap-3 p-3">
        {/* Upload-first zone (show when no messages) */}
        {messages.length === 0 && !hasPendingDoors && (
          <div className="flex flex-col gap-2">
            {/* Drop zone */}
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 py-4 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={20} className="text-primary-400" />
              <span className="text-[12px] text-primary-600 font-medium">อัปโหลดแบบขยาย / Spec Sheet</span>
              <span className="text-[10px] text-default-400">PDF, JPG, PNG · สูงสุด 3.5MB · วิเคราะห์อัตโนมัติ</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleAutoAnalyze}
            />
            <div className="flex flex-wrap gap-1">
              {[
                { label: "วิเคราะห์ BOM", text: "วิเคราะห์ BOM ปัจจุบันและแนะนำวัสดุที่คุ้มค่าที่สุด" },
                { label: "ราคาต่อบาน", text: "ต้นทุนต่อบานเหมาะสมไหม? อธิบายแต่ละรายการให้ฟัง" },
              ].map((p) => (
                <Chip
                  key={p.label}
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="cursor-pointer text-[11px]"
                  onClick={() => handleSend(p.text)}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <ScrollShadow ref={scrollRef} className="max-h-48 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mr-1 mt-1 shrink-0">
                      <Bot size={11} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[12px] ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-default-100 text-foreground"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">
                      {msg.role === "assistant"
                        ? (msg.content || (isLoading && i === messages.length - 1 ? "▌" : ""))
                        : msg.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollShadow>
        )}

        {/* Compare view: multi-door selector */}
        {hasPendingDoors && (
          <DoorCompareView
            doors={pendingDoors}
            selectedIdx={selectedDoorIdx ?? 0}
            appliedIdxs={appliedDoorIdxs}
            onSelectDoor={selectDoor}
            onApply={applyDoorFields}
            onDismiss={dismissPendingDoors}
            bomState={bomState}
          />
        )}

        {/* Last action badge */}
        {!hasPendingDoors && lastAction && (
          <div className="flex items-center gap-1 flex-wrap">
            <Chip color="success" variant="flat" size="sm">
              ✓ กรอก {lastAction.count} ฟิลด์
            </Chip>
            {Object.keys(lastAction.fields)
              .filter((k) => APPLY_FIELDS.includes(k))
              .map((k) => (
                <Chip key={k} color="default" variant="flat" size="sm" className="text-[10px]">
                  {FIELD_LABELS[k] || k}
                </Chip>
              ))}
          </div>
        )}

        {/* File preview (when attached but not yet sent) */}
        {imagePreview && (
          <div className="relative w-fit">
            {image?.startsWith("data:application/pdf") ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100 border border-default-200 text-[12px]">
                <span>📄</span>
                <span className="text-default-600">PDF พร้อมส่ง</span>
              </div>
            ) : (
              <img
                src={imagePreview}
                alt="preview"
                className="h-16 rounded-lg object-cover border border-default-200"
              />
            )}
            <button
              className="absolute -top-1 -right-1 bg-background rounded-full border border-default-200 p-0.5"
              onClick={removeImage}
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* Input row */}
        {!hasPendingDoors && (
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {messages.length > 0 && (
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                color={imagePreview ? "success" : "default"}
                onPress={() => fileInputRef.current?.click()}
                title="แนบไฟล์"
              >
                <ImagePlus size={14} />
              </Button>
            )}
            <Input
              placeholder='พิมพ์ "45×90×200 ไส้โฟม" หรืออัปโหลดไฟล์'
              variant="bordered"
              size="sm"
              value={input}
              onValueChange={setInput}
              onKeyDown={handleKeyDown}
              isDisabled={isLoading}
              className="flex-1"
            />
            <Button
              isIconOnly
              color="primary"
              size="sm"
              onPress={() => handleSend()}
              isLoading={isLoading}
              isDisabled={!input.trim() && !image}
            >
              <Send size={14} />
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
