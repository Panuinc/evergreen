"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────
const LABEL_PRESETS = [
  { key: "100x30", name: "100 × 30 mm", width: 100, height: 30 },
  { key: "100x50", name: "100 × 50 mm", width: 100, height: 50 },
  { key: "100x150", name: "100 × 150 mm", width: 100, height: 150 },
  { key: "73x21", name: "73 × 21 mm (RFID)", width: 73, height: 21 },
  { key: "50x30", name: "50 × 30 mm", width: 50, height: 30 },
  { key: "80x50", name: "80 × 50 mm", width: 80, height: 50 },
  { key: "custom", name: "กำหนดเอง", width: 100, height: 50 },
];

const STORAGE_KEY = "label-designer-designs";
const GRID_SNAP = 1; // snap to 1mm grid
const RULER_COLOR = "#94a3b8";
const GUIDE_COLOR = "#3b82f6";

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
const RULER_H = 24;
const RULER_V = 30;

function Ruler({ direction, length, zoom }) {
  const isH = direction === "horizontal";
  const totalPx = length * zoom;
  const majorEvery = length <= 50 ? 5 : 10;
  const minorEvery = 1;
  const size = isH ? RULER_H : RULER_V;

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
              stroke={RULER_COLOR}
              strokeWidth={isMajor ? 1 : 0.5}
            />
            {isMajor && (
              <text
                x={pos + 3}
                y={11}
                fill={RULER_COLOR}
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
              stroke={RULER_COLOR}
              strokeWidth={isMajor ? 1 : 0.5}
            />
            {isMajor && (
              <text
                x={13}
                y={pos + 4}
                fill={RULER_COLOR}
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

  const style = {
    position: "absolute",
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.width * zoom,
    height: el.type === "line" ? Math.max(2, el.lineWidth * zoom) : el.height * zoom,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: "top left",
    cursor: editing ? "text" : el.locked ? "default" : "move",
    boxShadow: selected ? `0 0 0 2px ${GUIDE_COLOR}` : "none",
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
    if (el.type === "text" || el.type === "barcode") {
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
          <img
            src={el.src}
            alt=""
            style={{
              width: "100%",
              height: "100%",
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
              background: GUIDE_COLOR,
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
              background: GUIDE_COLOR,
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
              background: GUIDE_COLOR,
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
            background: GUIDE_COLOR,
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
    image: <ImageIcon size={14} />,
  };

  const typeLabels = {
    text: "ข้อความ",
    barcode: "บาร์โค้ด",
    rect: "สี่เหลี่ยม",
    circle: "วงกลม",
    line: "เส้น",
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
            {el.type === "text"
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
export default function LabelDesignerView() {
  // ─── State ──────────────────────────────────────────────
  const [labelSize, setLabelSize] = useState({ width: 100, height: 30 });
  const [labelPreset, setLabelPreset] = useState("100x30");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(4); // px per mm
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [designName, setDesignName] = useState("ฉลากใหม่");
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [printQty, setPrintQty] = useState(1);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedId) || null,
    [elements, selectedId],
  );

  // ─── Load saved designs from localStorage ─────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedDesigns(JSON.parse(saved));
    } catch {}
  }, []);

  // ─── Auto-fit zoom to screen ──────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // available space minus rulers and padding (40px each side)
    const pad = 80;
    const rulerSize = RULER_V;
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
          newX = snapToGrid(newX, GRID_SNAP);
          newY = snapToGrid(newY, GRID_SNAP);
        }
        newX = Math.max(0, Math.min(newX, labelSize.width - 1));
        newY = Math.max(0, Math.min(newY, labelSize.height - 1));
        updateElement(id, { x: newX, y: newY });
      }
      if (resizeRef.current) {
        const { id, handle, startX, startY, origW, origH } = resizeRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        const updates = {};
        if (handle === "r" || handle === "br") {
          let w = origW + dx;
          if (snapEnabled) w = snapToGrid(w, GRID_SNAP);
          updates.width = Math.max(2, w);
        }
        if (handle === "b" || handle === "br") {
          let h = origH + dy;
          if (snapEnabled) h = snapToGrid(h, GRID_SNAP);
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
    const preset = LABEL_PRESETS.find((p) => p.key === key);
    if (preset && key !== "custom") {
      setLabelSize({ width: preset.width, height: preset.height });
    }
  };

  // ─── Save / Load designs ──────────────────────────────
  const saveDesign = () => {
    const design = {
      id: Date.now().toString(),
      name: designName,
      labelSize,
      labelPreset,
      elements,
      savedAt: new Date().toISOString(),
    };
    const updated = [...savedDesigns.filter((d) => d.name !== designName), design];
    setSavedDesigns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`บันทึก "${designName}" แล้ว`);
  };

  const loadDesign = (design) => {
    setDesignName(design.name);
    setLabelSize(design.labelSize);
    setLabelPreset(design.labelPreset || "custom");
    setElements(design.elements);
    setSelectedId(null);
    toast.success(`โหลด "${design.name}" แล้ว`);
  };

  const deleteDesign = (id) => {
    const updated = savedDesigns.filter((d) => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success("ลบแบบแล้ว");
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

        case "image":
          // Images are rendered client-side from src
          if (el.src) {
            try {
              const img = new Image();
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

    setPrinting(true);
    try {
      const canvas = renderToCanvas();
      const base64 = canvas.toDataURL("image/png").split(",")[1];

      const images = [];
      for (let i = 0; i < printQty; i++) {
        images.push(base64);
      }

      const res = await fetch("/api/marketing/labelDesigner/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          labelWidth: labelSize.width,
          labelHeight: labelSize.height,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`พิมพ์สำเร็จ ${printQty} แผ่น`);
      } else {
        toast.error(`พิมพ์ไม่สำเร็จ: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setPrinting(false);
    }
  };

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
          {LABEL_PRESETS.map((p) => (
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
        <Tooltip content="บันทึก">
          <Button size="sm" isIconOnly variant="flat" color="success" onPress={saveDesign}>
            <Save size={16} />
          </Button>
        </Tooltip>

        {savedDesigns.length > 0 && (
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<FolderOpen size={14} />}>
                โหลดแบบ
                <ChevronDown size={12} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {savedDesigns.map((d) => (
                <DropdownItem
                  key={d.id}
                  description={`${d.labelSize.width}×${d.labelSize.height}mm`}
                  onPress={() => loadDesign(d)}
                  endContent={
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      color="danger"
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteDesign(d.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  }
                >
                  {d.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}

        <Tooltip content="ส่งออก PNG">
          <Button size="sm" isIconOnly variant="flat" onPress={handleExportPng}>
            <Download size={16} />
          </Button>
        </Tooltip>

        <Divider orientation="vertical" className="h-6" />

        {/* Print */}
        <Input
          size="sm"
          className="w-20"
          type="number"
          min={1}
          max={99}
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
                style={{ width: RULER_V, height: RULER_H, background: "#f1f5f9" }}
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
