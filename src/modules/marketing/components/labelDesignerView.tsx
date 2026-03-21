"use client";

import { useState, useRef, useCallback, useEffect, useMemo, type CSSProperties } from "react";
import Image from "next/image";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Slider,
  Divider,
  Tooltip,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Progress,
  Badge,
} from "@heroui/react";
import {
  Type,
  Square,
  Minus,
  BarChart3,
  Trash2,
  Copy,
  Plus,
  Printer,
  Save,
  FolderOpen,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  MoveUp,
  MoveDown,
  Eye,
  Layers,
  ChevronDown,
  Grid3X3,
  Circle,
  Image as ImageIcon,
  ArrowRight,
  ListOrdered,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/apiClient";

// ─── Constants ──────────────────────────────────────────────
const labelPresets = [
  { key: "100x30", name: "100 × 30 mm", width: 100, height: 30 },
  { key: "100x50", name: "100 × 50 mm", width: 100, height: 50 },
  { key: "100x150", name: "100 × 150 mm", width: 100, height: 150 },
  { key: "73x21", name: "73 × 21 mm (RFID)", width: 73, height: 21 },
  { key: "50x30", name: "50 × 30 mm", width: 50, height: 30 },
  { key: "80x50", name: "80 × 50 mm", width: 80, height: 50 },
  { key: "custom", name: "กำหนดเอง", width: 100, height: 50 },
];

const gridSnap = 1; // snap to 1mm grid
const rulerColor = "#94a3b8";
const guideColor = "#3b82f6";

let nextId = 1;
function genId() {
  return `el_${nextId++}_${Date.now()}`;
}

// ─── Default element factories ──────────────────────────────
function createTextElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "text",
    x,
    y,
    width: 40,
    height: 8,
    content: "ข้อความ",
    fontSize: 4,
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    color: "#000000",
    rotation: 0,
    locked: false,
  };
}

function createBarcodeElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "barcode",
    x,
    y,
    width: 40,
    height: 12,
    content: "1234567890",
    barcodeType: "CODE128",
    showText: true,
    color: "#000000",
    rotation: 0,
    locked: false,
  };
}

function createRectElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "rect",
    x,
    y,
    width: 20,
    height: 10,
    borderWidth: 0.5,
    borderColor: "#000000",
    fillColor: "transparent",
    rotation: 0,
    locked: false,
  };
}

function createLineElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "line",
    x,
    y,
    width: 30,
    height: 0,
    lineWidth: 0.5,
    color: "#000000",
    rotation: 0,
    locked: false,
  };
}

function createCircleElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "circle",
    x,
    y,
    width: 10,
    height: 10,
    borderWidth: 0.5,
    borderColor: "#000000",
    fillColor: "transparent",
    rotation: 0,
    locked: false,
  };
}

function createArrowElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "arrow",
    x,
    y,
    width: 30,
    height: 8,
    content: "",
    fontSize: 3,
    fontWeight: "normal",
    color: "#000000",
    lineWidth: 0.5,
    arrowDirection: "right", // left, right, up, down
    rotation: 0,
    locked: false,
  };
}

function createImageElement(x = 10, y = 10) {
  return {
    id: genId(),
    type: "image",
    x,
    y,
    width: 20,
    height: 20,
    src: "",
    rotation: 0,
    locked: false,
  };
}

// ─── Snap helper ────────────────────────────────────────────
function snapToGrid(val, gridSize) {
  return Math.round(val / gridSize) * gridSize;
}

// ─── Ruler Component ────────────────────────────────────────
const rulerH = 24;
const rulerV = 30;

function Ruler({ direction, length, zoom }) {
  const isH = direction === "horizontal";
  const totalPx = length * zoom;
  const majorEvery = length <= 50 ? 5 : 10;
  const minorEvery = 1;
  const size = isH ? rulerH : rulerV;

  const ticks = [];
  for (let mm = 0; mm <= length; mm += minorEvery) {
    const isMajor = mm % majorEvery === 0;
    const pos = mm * zoom;
    ticks.push(
      <g key={mm}>
        {isH ? (
          <>
            <line
              x1={pos}
              y1={isMajor ? 0 : 14}
              x2={pos}
              y2={size}
              stroke={rulerColor}
              strokeWidth={isMajor ? 1 : 0.5}
            />
            {isMajor && (
              <text
                x={pos + 3}
                y={11}
                fill={rulerColor}
                fontSize={10}
                fontFamily="monospace"
              >
                {mm}
              </text>
            )}
          </>
        ) : (
          <>
            <line
              x1={isMajor ? 0 : 18}
              y1={pos}
              x2={size}
              y2={pos}
              stroke={rulerColor}
              strokeWidth={isMajor ? 1 : 0.5}
            />
            {isMajor && (
              <text
                x={13}
                y={pos + 4}
                fill={rulerColor}
                fontSize={10}
                fontFamily="monospace"
                textAnchor="end"
              >
                {mm}
              </text>
            )}
          </>
        )}
      </g>,
    );
  }

  return (
    <svg
      width={isH ? totalPx : size}
      height={isH ? size : totalPx}
      className="select-none shrink-0"
      style={{ background: "#f1f5f9" }}
    >
      {ticks}
    </svg>
  );
}

// ─── Element Renderer ───────────────────────────────────────
function DesignElement({
  el,
  zoom,
  selected,
  onSelect,
  onDragStart,
  onResizeStart,
  onUpdate,
}) {
  const [editing, setEditing] = useState(false);
  const editRef = useRef(null);

  const style: CSSProperties = {
    position: "absolute",
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.width * zoom,
    height: el.type === "line" ? Math.max(2, el.lineWidth * zoom) : el.height * zoom,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: "top left",
    cursor: editing ? "text" : el.locked ? "default" : "move",
    boxShadow: selected ? `0 0 0 2px ${guideColor}` : "none",
    zIndex: selected ? 100 : "auto",
    userSelect: editing ? "text" : "none",
  };

  const handleMouseDown = (e) => {
    if (editing) return;
    e.stopPropagation();
    onSelect(el.id);
    if (!el.locked) onDragStart(e, el.id);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (el.type === "text" || el.type === "barcode" || el.type === "arrow") {
      setEditing(true);
      setTimeout(() => editRef.current?.focus(), 0);
    }
  };

  const finishEditing = () => {
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishEditing();
    }
    if (e.key === "Escape") {
      finishEditing();
    }
  };

  const renderContent = () => {
    switch (el.type) {
      case "text":
        return editing ? (
          <textarea
            ref={editRef}
            value={el.content}
            onChange={(e) => onUpdate(el.id, { content: e.target.value })}
            onBlur={finishEditing}
            onKeyDown={handleEditKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              height: "100%",
              fontSize: el.fontSize * zoom,
              fontWeight: el.fontWeight,
              fontStyle: el.fontStyle,
              textAlign: el.textAlign,
              color: el.color,
              lineHeight: 1.2,
              fontFamily: "Tahoma, 'Noto Sans Thai', Arial, sans-serif",
              border: "none",
              outline: "none",
              background: "rgba(255,255,255,0.8)",
              resize: "none",
              padding: 0,
              margin: 0,
              overflow: "hidden",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              fontSize: el.fontSize * zoom,
              fontWeight: el.fontWeight,
              fontStyle: el.fontStyle,
              textAlign: el.textAlign,
              color: el.color,
              lineHeight: 1.2,
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "Tahoma, 'Noto Sans Thai', Arial, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent:
                el.textAlign === "center"
                  ? "center"
                  : el.textAlign === "right"
                    ? "flex-end"
                    : "flex-start",
            }}
          >
            {el.content}
          </div>
        );

      case "barcode": {
        const barH = el.showText ? el.height * 0.7 : el.height;
        return editing ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <input
              ref={editRef}
              value={el.content}
              onChange={(e) => onUpdate(el.id, { content: e.target.value })}
              onBlur={finishEditing}
              onKeyDown={handleEditKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: "90%",
                fontSize: Math.max(12, el.height * 0.25 * zoom),
                fontFamily: "monospace",
                textAlign: "center",
                border: "1px solid #3b82f6",
                borderRadius: 4,
                padding: "2px 4px",
                outline: "none",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "90%",
                height: barH * zoom,
                background: `repeating-linear-gradient(90deg, ${el.color} 0px, ${el.color} 1px, transparent 1px, transparent 3px)`,
              }}
            />
            {el.showText && (
              <div
                style={{
                  fontSize: Math.max(8, el.height * 0.2 * zoom),
                  fontFamily: "monospace",
                  color: el.color,
                  marginTop: 1,
                }}
              >
                {el.content}
              </div>
            )}
          </div>
        );
      }

      case "rect":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              border: `${el.borderWidth * zoom}px solid ${el.borderColor}`,
              backgroundColor: el.fillColor,
              boxSizing: "border-box",
            }}
          />
        );

      case "circle":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              border: `${el.borderWidth * zoom}px solid ${el.borderColor}`,
              backgroundColor: el.fillColor,
              borderRadius: "50%",
              boxSizing: "border-box",
            }}
          />
        );

      case "line":
        return (
          <div
            style={{
              width: "100%",
              height: Math.max(2, el.lineWidth * zoom),
              backgroundColor: el.color,
            }}
          />
        );

      case "image":
        return el.src ? (
          <Image
            src={el.src}
            alt=""
            fill
            unoptimized
            style={{
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              border: `1px dashed #999`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#999",
              backgroundColor: "#f9f9f9",
            }}
          >
            <ImageIcon size={16} />
          </div>
        );

      case "arrow": {
        const arrowSize = Math.max(6, el.height * zoom * 0.5);
        const isHoriz = el.arrowDirection === "left" || el.arrowDirection === "right";
        const rotMap = { right: 0, down: 90, left: 180, up: 270 };
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Arrow line */}
            <div
              style={{
                position: "absolute",
                left: isHoriz ? 0 : "50%",
                top: isHoriz ? "50%" : 0,
                width: isHoriz ? "100%" : Math.max(1, el.lineWidth * zoom),
                height: isHoriz ? Math.max(1, el.lineWidth * zoom) : "100%",
                transform: isHoriz ? "translateY(-50%)" : "translateX(-50%)",
                backgroundColor: el.color,
              }}
            />
            {/* Arrowhead */}
            <div
              style={{
                position: "absolute",
                ...(el.arrowDirection === "right" && { right: 0, top: "50%", transform: "translateY(-50%)" }),
                ...(el.arrowDirection === "left" && { left: 0, top: "50%", transform: "translateY(-50%) rotate(180deg)" }),
                ...(el.arrowDirection === "down" && { bottom: 0, left: "50%", transform: "translateX(-50%) rotate(90deg)" }),
                ...(el.arrowDirection === "up" && { top: 0, left: "50%", transform: "translateX(-50%) rotate(-90deg)" }),
                width: 0,
                height: 0,
                borderTop: `${arrowSize / 2}px solid transparent`,
                borderBottom: `${arrowSize / 2}px solid transparent`,
                borderLeft: `${arrowSize}px solid ${el.color}`,
              }}
            />
            {/* Text label */}
            {el.content && (
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: el.fontSize * zoom,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  backgroundColor: "rgba(255,255,255,0.85)",
                  padding: `0 ${2 * zoom}px`,
                  fontFamily: "Tahoma, 'Noto Sans Thai', Arial, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {el.content}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={style} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
      {renderContent()}
      {/* Resize handles */}
      {selected && !el.locked && el.type !== "line" && (
        <>
          {/* Bottom-right resize */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, el.id, "br");
            }}
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              width: 8,
              height: 8,
              background: guideColor,
              cursor: "nwse-resize",
              borderRadius: 1,
            }}
          />
          {/* Right resize */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, el.id, "r");
            }}
            style={{
              position: "absolute",
              right: -4,
              top: "50%",
              transform: "translateY(-50%)",
              width: 8,
              height: 8,
              background: guideColor,
              cursor: "ew-resize",
              borderRadius: 1,
            }}
          />
          {/* Bottom resize */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, el.id, "b");
            }}
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: 8,
              background: guideColor,
              cursor: "ns-resize",
              borderRadius: 1,
            }}
          />
        </>
      )}
      {/* Line: right resize handle */}
      {selected && !el.locked && el.type === "line" && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, el.id, "r");
          }}
          style={{
            position: "absolute",
            right: -4,
            top: "50%",
            transform: "translateY(-50%)",
            width: 8,
            height: 8,
            background: guideColor,
            cursor: "ew-resize",
            borderRadius: 1,
          }}
        />
      )}
    </div>
  );
}

// ─── Properties Panel ───────────────────────────────────────
function PropertiesPanel({ element, onUpdate, onDelete, onDuplicate }) {
  if (!element) {
    return (
      <div className="p-4 text-center text-default-400 text-sm">
        เลือก element เพื่อแก้ไขคุณสมบัติ
      </div>
    );
  }

  const u = (field, value) => onUpdate(element.id, { [field]: value });

  const typeLabels = {
    text: "ข้อความ",
    barcode: "บาร์โค้ด",
    rect: "สี่เหลี่ยม",
    circle: "วงกลม",
    line: "เส้น",
    arrow: "ลูกศร",
    image: "รูปภาพ",
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => u("src", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <Chip size="sm" variant="flat" color="primary">
          {typeLabels[element.type] || element.type}
        </Chip>
        <div className="flex gap-1">
          <Tooltip content="คัดลอก">
            <Button size="sm" isIconOnly variant="light" onPress={() => onDuplicate(element.id)}>
              <Copy size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="ลบ">
            <Button
              size="sm"
              isIconOnly
              variant="light"
              color="danger"
              onPress={() => onDelete(element.id)}
            >
              <Trash2 size={14} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <Divider />

      {/* Position */}
      <p className="text-xs font-semibold text-default-500">ตำแหน่ง (mm)</p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          size="sm"
          label="X"
          type="number"
          step={0.5}
          value={String(element.x)}
          onValueChange={(v) => u("x", parseFloat(v) || 0)}
        />
        <Input
          size="sm"
          label="Y"
          type="number"
          step={0.5}
          value={String(element.y)}
          onValueChange={(v) => u("y", parseFloat(v) || 0)}
        />
      </div>

      {/* Size */}
      <p className="text-xs font-semibold text-default-500">ขนาด (mm)</p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          size="sm"
          label="กว้าง"
          type="number"
          step={0.5}
          min={1}
          value={String(element.width)}
          onValueChange={(v) => u("width", Math.max(1, parseFloat(v) || 1))}
        />
        {element.type !== "line" && (
          <Input
            size="sm"
            label="สูง"
            type="number"
            step={0.5}
            min={1}
            value={String(element.height)}
            onValueChange={(v) => u("height", Math.max(1, parseFloat(v) || 1))}
          />
        )}
      </div>

      {/* Rotation */}
      <Input
        size="sm"
        label="หมุน (องศา)"
        type="number"
        step={90}
        value={String(element.rotation)}
        onValueChange={(v) => u("rotation", parseFloat(v) || 0)}
      />

      <Divider />

      {/* Text specific */}
      {element.type === "text" && (
        <>
          <p className="text-xs font-semibold text-default-500">ข้อความ</p>
          <Input
            size="sm"
            label="เนื้อหา"
            value={element.content}
            onValueChange={(v) => u("content", v)}
          />
          <Input
            size="sm"
            label="ขนาดตัวอักษร (mm)"
            type="number"
            step={0.5}
            min={1}
            value={String(element.fontSize)}
            onValueChange={(v) => u("fontSize", Math.max(1, parseFloat(v) || 3))}
          />
          <div className="flex gap-1">
            <Tooltip content="ตัวหนา">
              <Button
                size="sm"
                isIconOnly
                color={element.fontWeight === "bold" ? "primary" : "default"}
                variant={element.fontWeight === "bold" ? "flat" : "light"}
                onPress={() =>
                  u("fontWeight", element.fontWeight === "bold" ? "normal" : "bold")
                }
              >
                <Bold size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="ตัวเอียง">
              <Button
                size="sm"
                isIconOnly
                color={element.fontStyle === "italic" ? "primary" : "default"}
                variant={element.fontStyle === "italic" ? "flat" : "light"}
                onPress={() =>
                  u("fontStyle", element.fontStyle === "italic" ? "normal" : "italic")
                }
              >
                <Italic size={14} />
              </Button>
            </Tooltip>
            <Divider orientation="vertical" className="h-8" />
            <Tooltip content="ชิดซ้าย">
              <Button
                size="sm"
                isIconOnly
                color={element.textAlign === "left" ? "primary" : "default"}
                variant={element.textAlign === "left" ? "flat" : "light"}
                onPress={() => u("textAlign", "left")}
              >
                <AlignLeft size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="กลาง">
              <Button
                size="sm"
                isIconOnly
                color={element.textAlign === "center" ? "primary" : "default"}
                variant={element.textAlign === "center" ? "flat" : "light"}
                onPress={() => u("textAlign", "center")}
              >
                <AlignCenter size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="ชิดขวา">
              <Button
                size="sm"
                isIconOnly
                color={element.textAlign === "right" ? "primary" : "default"}
                variant={element.textAlign === "right" ? "flat" : "light"}
                onPress={() => u("textAlign", "right")}
              >
                <AlignRight size={14} />
              </Button>
            </Tooltip>
          </div>
          <Input
            size="sm"
            type="color"
            label="สี"
            value={element.color}
            onChange={(e) => u("color", e.target.value)}
          />
        </>
      )}

      {/* Barcode specific */}
      {element.type === "barcode" && (
        <>
          <p className="text-xs font-semibold text-default-500">บาร์โค้ด</p>
          <Input
            size="sm"
            label="ข้อมูล"
            value={element.content}
            onValueChange={(v) => u("content", v)}
          />
          <Select
            size="sm"
            label="ประเภท"
            selectedKeys={[element.barcodeType]}
            onSelectionChange={(keys) => u("barcodeType", [...keys][0])}
          >
            <SelectItem key="CODE128">Code 128</SelectItem>
            <SelectItem key="CODE39">Code 39</SelectItem>
            <SelectItem key="EAN13">EAN-13</SelectItem>
            <SelectItem key="EAN8">EAN-8</SelectItem>
            <SelectItem key="UPC">UPC</SelectItem>
          </Select>
          <Switch
            size="sm"
            isSelected={element.showText}
            onValueChange={(v) => u("showText", v)}
          >
            แสดงตัวเลข
          </Switch>
        </>
      )}

      {/* Rect / Circle specific */}
      {(element.type === "rect" || element.type === "circle") && (
        <>
          <p className="text-xs font-semibold text-default-500">รูปร่าง</p>
          <Input
            size="sm"
            label="ความหนาเส้นขอบ (mm)"
            type="number"
            step={0.1}
            min={0}
            value={String(element.borderWidth)}
            onValueChange={(v) => u("borderWidth", Math.max(0, parseFloat(v) || 0))}
          />
          <Input
            size="sm"
            type="color"
            label="สีเส้นขอบ"
            value={element.borderColor}
            onChange={(e) => u("borderColor", e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Input
              size="sm"
              type="color"
              label="สีพื้น"
              value={element.fillColor === "transparent" ? "#ffffff" : element.fillColor}
              onChange={(e) => u("fillColor", e.target.value)}
            />
            <Button
              size="sm"
              variant="light"
              onPress={() => u("fillColor", "transparent")}
            >
              ไม่มีพื้น
            </Button>
          </div>
        </>
      )}

      {/* Line specific */}
      {element.type === "line" && (
        <>
          <p className="text-xs font-semibold text-default-500">เส้น</p>
          <Input
            size="sm"
            label="ความหนา (mm)"
            type="number"
            step={0.1}
            min={0.1}
            value={String(element.lineWidth)}
            onValueChange={(v) => u("lineWidth", Math.max(0.1, parseFloat(v) || 0.5))}
          />
          <Input
            size="sm"
            type="color"
            label="สี"
            value={element.color}
            onChange={(e) => u("color", e.target.value)}
          />
        </>
      )}

      {/* Arrow specific */}
      {element.type === "arrow" && (
        <>
          <p className="text-xs font-semibold text-default-500">ลูกศร</p>
          <Input
            size="sm"
            label="ข้อความ"
            value={element.content || ""}
            onValueChange={(v) => u("content", v)}
          />
          <Input
            size="sm"
            label="ขนาดตัวอักษร (mm)"
            type="number"
            step={0.5}
            min={1}
            value={String(element.fontSize)}
            onValueChange={(v) => u("fontSize", Math.max(1, parseFloat(v) || 3))}
          />
          <Select
            size="sm"
            label="ทิศทาง"
            selectedKeys={[element.arrowDirection]}
            onSelectionChange={(keys) => u("arrowDirection", [...keys][0])}
          >
            <SelectItem key="right">ขวา →</SelectItem>
            <SelectItem key="left">ซ้าย ←</SelectItem>
            <SelectItem key="up">ขึ้น ↑</SelectItem>
            <SelectItem key="down">ลง ↓</SelectItem>
          </Select>
          <Input
            size="sm"
            label="ความหนาเส้น (mm)"
            type="number"
            step={0.1}
            min={0.1}
            value={String(element.lineWidth)}
            onValueChange={(v) => u("lineWidth", Math.max(0.1, parseFloat(v) || 0.5))}
          />
          <Input
            size="sm"
            type="color"
            label="สี"
            value={element.color}
            onChange={(e) => u("color", e.target.value)}
          />
        </>
      )}

      {/* Image specific */}
      {element.type === "image" && (
        <>
          <p className="text-xs font-semibold text-default-500">รูปภาพ</p>
          <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-default-100 text-sm">
            <ImageIcon size={14} />
            เลือกรูป...
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
          {element.src && (
            <Button size="sm" variant="light" color="danger" onPress={() => u("src", "")}>
              ลบรูป
            </Button>
          )}
        </>
      )}

      <Divider />
      <Switch
        size="sm"
        isSelected={element.locked}
        onValueChange={(v) => u("locked", v)}
      >
        ล็อคตำแหน่ง
      </Switch>
    </div>
  );
}

// ─── Elements List Panel ────────────────────────────────────
function ElementsListPanel({ elements, selectedId, onSelect, onReorder, onDelete }) {
  const typeIcons = {
    text: <Type size={14} />,
    barcode: <BarChart3 size={14} />,
    rect: <Square size={14} />,
    circle: <Circle size={14} />,
    line: <Minus size={14} />,
    arrow: <ArrowRight size={14} />,
    image: <ImageIcon size={14} />,
  };

  const typeLabels = {
    text: "ข้อความ",
    barcode: "บาร์โค้ด",
    rect: "สี่เหลี่ยม",
    circle: "วงกลม",
    line: "เส้น",
    arrow: "ลูกศร",
    image: "รูปภาพ",
  };

  return (
    <div className="flex flex-col gap-1 p-2 overflow-y-auto h-full">
      <p className="text-xs font-semibold text-default-500 px-1 mb-1 flex items-center gap-1">
        <Layers size={12} /> Elements ({elements.length})
      </p>
      {elements.length === 0 && (
        <p className="text-xs text-default-400 px-1">ยังไม่มี element</p>
      )}
      {[...elements].reverse().map((el, idx) => (
        <div
          key={el.id}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
            selectedId === el.id
              ? "bg-primary-100 text-primary-700"
              : "hover:bg-default-100"
          }`}
          onClick={() => onSelect(el.id)}
        >
          {typeIcons[el.type]}
          <span className="flex-1 truncate text-xs">
            {(el.type === "text" || el.type === "arrow")
              ? el.content?.slice(0, 15) || typeLabels[el.type]
              : typeLabels[el.type]}
          </span>
          <div className="flex gap-0.5">
            <button
              className="p-0.5 hover:bg-default-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onReorder(el.id, "up");
              }}
            >
              <MoveUp size={10} />
            </button>
            <button
              className="p-0.5 hover:bg-default-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onReorder(el.id, "down");
              }}
            >
              <MoveDown size={10} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function LabelDesignerView({
  savedDesigns = [],
  designsLoading = false,
  onSaveDesign,
  onDeleteDesign,
}) {
  // ─── State ──────────────────────────────────────────────
  const [labelSize, setLabelSize] = useState({ width: 100, height: 30 });
  const [labelPreset, setLabelPreset] = useState("100x30");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(4); // px per mm
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [designName, setDesignName] = useState("ฉลากใหม่");
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printQty, setPrintQty] = useState(1);
  const [printProgress, setPrintProgress] = useState(null); // { printed, total, jobId }
  const [printQueue, setPrintQueue] = useState({ active: [], history: [] });
  const [queueOpen, setQueueOpen] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedId) || null,
    [elements, selectedId],
  );

  // ─── Auto-fit zoom to screen ──────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // available space minus rulers and padding (40px each side)
    const pad = 80;
    const rulerSize = rulerV;
    const maxW = container.clientWidth - rulerSize - pad;
    const maxH = container.clientHeight - rulerSize - pad;
    if (maxW <= 0 || maxH <= 0) return;
    const fitZoom = Math.min(maxW / labelSize.width, maxH / labelSize.height, 12);
    setZoom(Math.max(2, Math.round(fitZoom)));
  }, [labelSize]);

  // ─── Element CRUD ─────────────────────────────────────
  const addElement = useCallback(
    (factory) => {
      const el = factory(labelSize.width * 0.1, labelSize.height * 0.2);
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
    },
    [labelSize],
  );

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  }, []);

  const deleteElement = useCallback(
    (id) => {
      setElements((prev) => prev.filter((el) => el.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId],
  );

  const duplicateElement = useCallback(
    (id) => {
      const src = elements.find((el) => el.id === id);
      if (!src) return;
      const copy = { ...src, id: genId(), x: src.x + 3, y: src.y + 3 };
      setElements((prev) => [...prev, copy]);
      setSelectedId(copy.id);
    },
    [elements],
  );

  const reorderElement = useCallback((id, direction) => {
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === "up" && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      } else if (direction === "down" && idx > 0) {
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      }
      return next;
    });
  }, []);

  // ─── Drag handling ────────────────────────────────────
  const handleDragStart = useCallback(
    (e, id) => {
      const el = elements.find((x) => x.id === id);
      if (!el || el.locked) return;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
      };
    },
    [elements],
  );

  const handleResizeStart = useCallback(
    (e, id, handle) => {
      const el = elements.find((x) => x.id === id);
      if (!el) return;
      resizeRef.current = {
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origW: el.width,
        origH: el.height,
      };
    },
    [elements],
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        let newX = origX + (e.clientX - startX) / zoom;
        let newY = origY + (e.clientY - startY) / zoom;
        if (snapEnabled) {
          newX = snapToGrid(newX, gridSnap);
          newY = snapToGrid(newY, gridSnap);
        }
        newX = Math.max(0, Math.min(newX, labelSize.width - 1));
        newY = Math.max(0, Math.min(newY, labelSize.height - 1));
        updateElement(id, { x: newX, y: newY });
      }
      if (resizeRef.current) {
        const { id, handle, startX, startY, origW, origH } = resizeRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        const updates: Record<string, any> = {};
        if (handle === "r" || handle === "br") {
          let w = origW + dx;
          if (snapEnabled) w = snapToGrid(w, gridSnap);
          updates.width = Math.max(2, w);
        }
        if (handle === "b" || handle === "br") {
          let h = origH + dy;
          if (snapEnabled) h = snapToGrid(h, gridSnap);
          updates.height = Math.max(2, h);
        }
        updateElement(id, updates);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [zoom, snapEnabled, labelSize, updateElement]);

  // ─── Keyboard shortcuts ───────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) deleteElement(selectedId);
      }
      if (e.key === "Escape") setSelectedId(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) duplicateElement(selectedId);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, deleteElement, duplicateElement]);

  // ─── Label preset change ──────────────────────────────
  const handlePresetChange = (key) => {
    setLabelPreset(key);
    const preset = labelPresets.find((p) => p.key === key);
    if (preset && key !== "custom") {
      setLabelSize({ width: preset.width, height: preset.height });
    }
  };

  // ─── Save / Load designs ──────────────────────────────
  const saveDesign = async () => {
    if (!onSaveDesign) return;
    setSaving(true);
    try {
      const result = await onSaveDesign({
        id: currentDesignId,
        name: designName,
        labelSize,
        labelPreset,
        elements,
      });
      if (result?.labelDesignId) {
        setCurrentDesignId(result.labelDesignId);
      }
    } catch (err) {
      toast.error(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const loadDesign = (design) => {
    setCurrentDesignId(design.labelDesignId);
    setDesignName(design.labelDesignName);
    setLabelSize({
      width: design.labelDesignWidth,
      height: design.labelDesignHeight,
    });
    setLabelPreset(design.labelDesignPreset || "custom");
    setElements(design.labelDesignElements || []);
    setSelectedId(null);
    toast.success(`โหลด "${design.labelDesignName}" แล้ว`);
  };

  const handleNewDesign = () => {
    setCurrentDesignId(null);
    setDesignName("ฉลากใหม่");
    setLabelSize({ width: 100, height: 30 });
    setLabelPreset("100x30");
    setElements([]);
    setSelectedId(null);
  };

  const handleDeleteDesign = async (id) => {
    if (!onDeleteDesign) return;
    try {
      await onDeleteDesign(id);
      if (currentDesignId === id) handleNewDesign();
    } catch (err) {
      toast.error(`ลบไม่สำเร็จ: ${err.message}`);
    }
  };

  // ─── Export to canvas for printing ────────────────────
  const renderToCanvas = useCallback(() => {
    const dpi = 203; // TSC printer DPI (8 dots/mm)
    const dotsPerMm = dpi / 25.4;
    const canvasW = Math.round(labelSize.width * dotsPerMm);
    const canvasH = Math.round(labelSize.height * dotsPerMm);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Render elements in order
    for (const el of elements) {
      ctx.save();
      const ex = el.x * dotsPerMm;
      const ey = el.y * dotsPerMm;
      const ew = el.width * dotsPerMm;
      const eh = el.type === "line" ? Math.max(1, el.lineWidth * dotsPerMm) : el.height * dotsPerMm;

      if (el.rotation) {
        ctx.translate(ex, ey);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-ex, -ey);
      }

      switch (el.type) {
        case "text":
          ctx.fillStyle = el.color;
          ctx.font = `${el.fontStyle === "italic" ? "italic " : ""}${el.fontWeight} ${el.fontSize * dotsPerMm}px Tahoma, "Noto Sans Thai", Arial, sans-serif`;
          ctx.textBaseline = "top";
          ctx.textAlign = el.textAlign || "left";
          {
            let textX = ex;
            if (el.textAlign === "center") textX = ex + ew / 2;
            else if (el.textAlign === "right") textX = ex + ew;
            ctx.fillText(el.content, textX, ey, ew);
          }
          break;

        case "barcode":
          // Simplified barcode rendering with lines
          ctx.fillStyle = el.color;
          {
            const barW = ew * 0.9;
            const barH = el.showText ? eh * 0.7 : eh;
            const startX = ex + ew * 0.05;
            const chars = el.content || "0";
            const barCount = chars.length * 6;
            const singleBar = barW / barCount;
            for (let i = 0; i < barCount; i++) {
              if (i % 2 === 0) {
                const bw = singleBar * (((i * 7 + 3) % 3) + 1);
                ctx.fillRect(startX + i * singleBar, ey, bw, barH);
              }
            }
            if (el.showText) {
              ctx.font = `${eh * 0.18}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(el.content, ex + ew / 2, ey + barH + 2, ew);
            }
          }
          break;

        case "rect":
          if (el.fillColor && el.fillColor !== "transparent") {
            ctx.fillStyle = el.fillColor;
            ctx.fillRect(ex, ey, ew, eh);
          }
          if (el.borderWidth > 0) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = el.borderWidth * dotsPerMm;
            ctx.strokeRect(ex, ey, ew, eh);
          }
          break;

        case "circle":
          ctx.beginPath();
          ctx.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, Math.PI * 2);
          if (el.fillColor && el.fillColor !== "transparent") {
            ctx.fillStyle = el.fillColor;
            ctx.fill();
          }
          if (el.borderWidth > 0) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = el.borderWidth * dotsPerMm;
            ctx.stroke();
          }
          break;

        case "line":
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.lineWidth * dotsPerMm;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex + ew, ey);
          ctx.stroke();
          break;

        case "arrow": {
          ctx.strokeStyle = el.color;
          ctx.fillStyle = el.color;
          ctx.lineWidth = el.lineWidth * dotsPerMm;
          const isH = el.arrowDirection === "left" || el.arrowDirection === "right";
          const headSize = Math.max(4, (isH ? eh : ew) * 0.5);
          // Line
          ctx.beginPath();
          if (isH) {
            ctx.moveTo(ex, ey + eh / 2);
            ctx.lineTo(ex + ew, ey + eh / 2);
          } else {
            ctx.moveTo(ex + ew / 2, ey);
            ctx.lineTo(ex + ew / 2, ey + eh);
          }
          ctx.stroke();
          // Arrowhead
          ctx.beginPath();
          if (el.arrowDirection === "right") {
            ctx.moveTo(ex + ew, ey + eh / 2);
            ctx.lineTo(ex + ew - headSize, ey + eh / 2 - headSize / 2);
            ctx.lineTo(ex + ew - headSize, ey + eh / 2 + headSize / 2);
          } else if (el.arrowDirection === "left") {
            ctx.moveTo(ex, ey + eh / 2);
            ctx.lineTo(ex + headSize, ey + eh / 2 - headSize / 2);
            ctx.lineTo(ex + headSize, ey + eh / 2 + headSize / 2);
          } else if (el.arrowDirection === "down") {
            ctx.moveTo(ex + ew / 2, ey + eh);
            ctx.lineTo(ex + ew / 2 - headSize / 2, ey + eh - headSize);
            ctx.lineTo(ex + ew / 2 + headSize / 2, ey + eh - headSize);
          } else {
            ctx.moveTo(ex + ew / 2, ey);
            ctx.lineTo(ex + ew / 2 - headSize / 2, ey + headSize);
            ctx.lineTo(ex + ew / 2 + headSize / 2, ey + headSize);
          }
          ctx.closePath();
          ctx.fill();
          // Text
          if (el.content) {
            ctx.fillStyle = el.color;
            ctx.font = `${el.fontWeight} ${el.fontSize * dotsPerMm}px Tahoma, "Noto Sans Thai", Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const textW = ctx.measureText(el.content).width;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(ex + ew / 2 - textW / 2 - 2, ey + eh / 2 - el.fontSize * dotsPerMm / 2, textW + 4, el.fontSize * dotsPerMm);
            ctx.fillStyle = el.color;
            ctx.fillText(el.content, ex + ew / 2, ey + eh / 2);
          }
          break;
        }

        case "image":
          // Images are rendered client-side from src
          if (el.src) {
            try {
              const img = new window.Image();
              img.src = el.src;
              ctx.drawImage(img, ex, ey, ew, eh);
            } catch {}
          }
          break;
      }

      ctx.restore();
    }

    return canvas;
  }, [elements, labelSize]);

  // ─── Print handler ────────────────────────────────────
  const handlePrint = async () => {
    if (elements.length === 0) {
      toast.error("ยังไม่มี element บนฉลาก");
      return;
    }

    const jobId = `job_${Date.now()}`;
    setPrinting(true);
    setPrintProgress({ printed: 0, total: printQty, jobId });
    try {
      const canvas = renderToCanvas();
      const base64 = canvas.toDataURL("image/png").split(",")[1];

      const images = [];
      for (let i = 0; i < printQty; i++) {
        images.push(base64);
      }

      const res = await authFetch("/api/marketing/labelDesigner/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          labelWidth: labelSize.width,
          labelHeight: labelSize.height,
          jobId,
          designName,
        }),
      });

      const data = await res.json();
      if (data.cancelled) {
        toast.warning(
          `ยกเลิกงานพิมพ์แล้ว (พิมพ์ไป ${data.data?.summary?.success || 0}/${printQty} แผ่น)`,
        );
      } else if (data.success) {
        toast.success(`พิมพ์สำเร็จ ${printQty} แผ่น`);
      } else {
        toast.error(`พิมพ์ไม่สำเร็จ: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setPrinting(false);
      setPrintProgress(null);
    }
  };

  const handleCancelPrint = async () => {
    if (!printProgress?.jobId) return;
    try {
      await authFetch("/api/marketing/labelDesigner/print/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: printProgress.jobId }),
      });
      toast.info("กำลังยกเลิกงานพิมพ์...");
    } catch (err) {
      toast.error(`ยกเลิกไม่สำเร็จ: ${err.message}`);
    }
  };

  // Poll print progress while printing
  useEffect(() => {
    if (!printing || !printProgress?.jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await authFetch(
          `/api/marketing/labelDesigner/print/status?jobId=${printProgress.jobId}`,
        );
        const data = await res.json();
        if (data.success && data.data) {
          setPrintProgress((prev) =>
            prev ? { ...prev, printed: data.data.printed } : prev,
          );
        }
      } catch {}
    }, 800);
    return () => clearInterval(interval);
  }, [printing, printProgress?.jobId]);

  // Fetch print queue when popover opens or while printing
  const fetchQueue = useCallback(async () => {
    try {
      const res = await authFetch("/api/marketing/labelDesigner/print/status");
      const data = await res.json();
      if (data.success) {
        setPrintQueue(data.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!queueOpen) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 1000);
    return () => clearInterval(interval);
  }, [queueOpen, fetchQueue]);

  // ─── Export as PNG ────────────────────────────────────
  const handleExportPng = () => {
    const canvas = renderToCanvas();
    const link = document.createElement("a");
    link.download = `${designName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ─── Grid pattern ─────────────────────────────────────
  const gridPattern = useMemo(() => {
    if (!showGrid) return "none";
    const s = zoom;
    return `repeating-linear-gradient(0deg, transparent, transparent ${s - 0.5}px, #e2e8f0 ${s - 0.5}px, #e2e8f0 ${s}px), repeating-linear-gradient(90deg, transparent, transparent ${s - 0.5}px, #e2e8f0 ${s - 0.5}px, #e2e8f0 ${s}px)`;
  }, [showGrid, zoom]);

  // ═════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* ─── Top Toolbar ─────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-default-200 bg-default-50 flex-wrap">
        {/* Design name */}
        <Input
          size="sm"
          className="w-40"
          value={designName}
          onValueChange={setDesignName}
          aria-label="ชื่อแบบ"
        />

        <Divider orientation="vertical" className="h-6" />

        {/* Add elements */}
        <Tooltip content="เพิ่มข้อความ">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createTextElement)}
          >
            <Type size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มบาร์โค้ด">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createBarcodeElement)}
          >
            <BarChart3 size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มสี่เหลี่ยม">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createRectElement)}
          >
            <Square size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มวงกลม">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createCircleElement)}
          >
            <Circle size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มเส้น">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createLineElement)}
          >
            <Minus size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มลูกศร">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createArrowElement)}
          >
            <ArrowRight size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="เพิ่มรูปภาพ">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => addElement(createImageElement)}
          >
            <ImageIcon size={16} />
          </Button>
        </Tooltip>

        <Divider orientation="vertical" className="h-6" />

        {/* Label size */}
        <Select
          size="sm"
          className="w-44"
          label="ขนาดฉลาก"
          selectedKeys={[labelPreset]}
          onSelectionChange={(keys) => handlePresetChange([...keys][0])}
        >
          {labelPresets.map((p) => (
            <SelectItem key={p.key}>{p.name}</SelectItem>
          ))}
        </Select>

        {labelPreset === "custom" && (
          <>
            <Input
              size="sm"
              className="w-20"
              type="number"
              label="กว้าง"
              value={String(labelSize.width)}
              onValueChange={(v) =>
                setLabelSize((s) => ({ ...s, width: Math.max(10, parseFloat(v) || 10) }))
              }
            />
            <span className="text-default-400">×</span>
            <Input
              size="sm"
              className="w-20"
              type="number"
              label="สูง"
              value={String(labelSize.height)}
              onValueChange={(v) =>
                setLabelSize((s) => ({ ...s, height: Math.max(10, parseFloat(v) || 10) }))
              }
            />
            <span className="text-xs text-default-400">mm</span>
          </>
        )}

        <Divider orientation="vertical" className="h-6" />

        {/* View controls */}
        <Tooltip content="ซูมออก">
          <Button
            size="sm"
            isIconOnly
            variant="light"
            onPress={() => setZoom((z) => Math.max(1, z - 1))}
          >
            <ZoomOut size={16} />
          </Button>
        </Tooltip>
        <span className="text-xs text-default-500 w-10 text-center">{zoom}x</span>
        <Tooltip content="ซูมเข้า">
          <Button
            size="sm"
            isIconOnly
            variant="light"
            onPress={() => setZoom((z) => Math.min(12, z + 1))}
          >
            <ZoomIn size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={showGrid ? "ซ่อนกริด" : "แสดงกริด"}>
          <Button
            size="sm"
            isIconOnly
            variant={showGrid ? "flat" : "light"}
            onPress={() => setShowGrid((v) => !v)}
          >
            <Grid3X3 size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={snapEnabled ? "ปิด snap" : "เปิด snap"}>
          <Button
            size="sm"
            variant={snapEnabled ? "flat" : "light"}
            onPress={() => setSnapEnabled((v) => !v)}
            className="text-xs"
          >
            Snap
          </Button>
        </Tooltip>

        <div className="flex-1" />

        {/* Save / Load */}
        <Tooltip content="สร้างแบบใหม่">
          <Button size="sm" isIconOnly variant="flat" onPress={handleNewDesign}>
            <Plus size={16} />
          </Button>
        </Tooltip>

        <Tooltip content="บันทึก">
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            color="success"
            onPress={saveDesign}
            isLoading={saving}
          >
            <Save size={16} />
          </Button>
        </Tooltip>

        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="flat"
              startContent={<FolderOpen size={14} />}
              isLoading={designsLoading}
            >
              โหลดแบบ ({savedDesigns.length})
              <ChevronDown size={12} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            emptyContent="ยังไม่มีแบบที่บันทึก"
          >
            {savedDesigns.map((d) => (
              <DropdownItem
                key={d.labelDesignId}
                description={`${d.labelDesignWidth}×${d.labelDesignHeight}mm`}
                onPress={() => loadDesign(d)}
                endContent={
                  <Button
                    size="sm"
                    isIconOnly
                    variant="light"
                    color="danger"
                    onPress={() => handleDeleteDesign(d.labelDesignId)}
                  >
                    <Trash2 size={12} />
                  </Button>
                }
              >
                {d.labelDesignName}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Tooltip content="ส่งออก PNG">
          <Button size="sm" isIconOnly variant="flat" onPress={handleExportPng}>
            <Download size={16} />
          </Button>
        </Tooltip>

        <Divider orientation="vertical" className="h-6" />

        {/* Print */}
        {printing && printProgress ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-default-600">
              <Printer size={14} className="animate-pulse text-primary" />
              <span>
                กำลังพิมพ์ {printProgress.printed}/{printProgress.total}
              </span>
            </div>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={handleCancelPrint}
            >
              ยกเลิก
            </Button>
          </div>
        ) : (
          <>
            <Input
              size="sm"
              className="w-20"
              type="number"
              min={1}
              max={999}
              label="จำนวน"
              value={String(printQty)}
              onValueChange={(v) => setPrintQty(Math.max(1, parseInt(v) || 1))}
            />
            <Button
              size="sm"
              color="primary"
              startContent={<Printer size={16} />}
              onPress={handlePrint}
              isLoading={printing}
            >
              พิมพ์
            </Button>
          </>
        )}

        {/* Queue button */}
        <Popover
          isOpen={queueOpen}
          onOpenChange={setQueueOpen}
          placement="bottom-end"
        >
          <PopoverTrigger>
            <Button size="sm" variant="flat" isIconOnly>
              <Badge
                content={printQueue.active.length || undefined}
                color="danger"
                size="sm"
                isInvisible={printQueue.active.length === 0}
              >
                <ListOrdered size={16} />
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-3">
              <p className="text-sm font-semibold mb-2">คิวงานพิมพ์</p>

              {/* Active jobs */}
              {printQueue.active.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {printQueue.active.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-primary-50 border border-primary-200"
                    >
                      <Printer size={14} className="animate-pulse text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {job.designName}
                        </p>
                        <Progress
                          size="sm"
                          value={(job.printed / job.total) * 100}
                          className="mt-1"
                          color={job.status === "cancelling" ? "warning" : "primary"}
                        />
                        <p className="text-xs text-default-500 mt-0.5">
                          {job.status === "cancelling"
                            ? "กำลังยกเลิก..."
                            : `${job.printed}/${job.total} แผ่น`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        color="danger"
                        onPress={async () => {
                          try {
                            await fetch(
                              "/api/marketing/labelDesigner/print/cancel",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ jobId: job.id }),
                              },
                            );
                            toast.info("กำลังยกเลิก...");
                          } catch {}
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-default-400 mb-3">
                  ไม่มีงานที่กำลังพิมพ์
                </p>
              )}

              {/* History */}
              {printQueue.history.length > 0 && (
                <>
                  <p className="text-xs font-medium text-default-500 mb-1">
                    ประวัติล่าสุด
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {printQueue.history.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                      >
                        {job.cancelled ? (
                          <XCircle size={12} className="text-danger shrink-0" />
                        ) : (
                          <CheckCircle2
                            size={12}
                            className="text-success shrink-0"
                          />
                        )}
                        <span className="truncate flex-1">
                          {job.designName}
                        </span>
                        <span className="text-default-400 shrink-0">
                          {job.cancelled
                            ? `${job.printed}/${job.total}`
                            : `${job.total} แผ่น`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ─── Main Area ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Elements list */}
        <div className="w-48 border-r border-default-200 bg-default-50 shrink-0 overflow-y-auto">
          <ElementsListPanel
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorderElement}
            onDelete={deleteElement}
          />
        </div>

        {/* Center: Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-default-100"
        >
          <div
            className="flex flex-col items-center justify-center"
            style={{ minHeight: "100%", padding: 40 }}
          >
            {/* Horizontal ruler */}
            <div className="flex">
              <div
                style={{ width: rulerV, height: rulerH, background: "#f1f5f9" }}
                className="shrink-0"
              />
              <Ruler
                direction="horizontal"
                length={labelSize.width}
                zoom={zoom}
              />
            </div>

            <div className="flex">
              {/* Vertical ruler */}
              <Ruler
                direction="vertical"
                length={labelSize.height}
                zoom={zoom}
              />

              {/* Label canvas — outer clip wrapper */}
              <div
                style={{
                  width: labelSize.width * zoom,
                  height: labelSize.height * zoom,
                  borderRadius: 2,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  clipPath: "inset(0 round 2px)",
                  WebkitClipPath: "inset(0 round 2px)",
                }}
              >
                <div
                  ref={canvasRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    backgroundImage: gridPattern !== "none" ? gridPattern : "none",
                    backgroundColor: "#ffffff",
                  }}
                  onClick={(e) => {
                    if (e.target === canvasRef.current) setSelectedId(null);
                  }}
                >
                  {elements.map((el) => (
                    <DesignElement
                      key={el.id}
                      el={el}
                      zoom={zoom}
                      selected={selectedId === el.id}
                      onSelect={setSelectedId}
                      onDragStart={handleDragStart}
                      onResizeStart={handleResizeStart}
                      onUpdate={updateElement}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Size info */}
            <div className="mt-3 text-xs text-default-400 text-center">
              {labelSize.width} × {labelSize.height} mm &nbsp;|&nbsp; ซูม {zoom}x
              &nbsp;|&nbsp; {elements.length} element(s)
              {currentDesignId && (
                <span className="text-primary-400"> &nbsp;|&nbsp; บันทึกแล้ว</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="w-60 border-l border-default-200 bg-default-50 shrink-0 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-default-200 shrink-0">
            <p className="text-xs font-semibold text-default-500">คุณสมบัติ</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <PropertiesPanel
              element={selectedElement}
              onUpdate={updateElement}
              onDelete={deleteElement}
              onDuplicate={duplicateElement}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
