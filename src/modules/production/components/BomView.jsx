"use client";

import React, { useState, useMemo, useRef, useCallback, memo } from "react";
import {
  Calculator,
  RulerDimensionLine,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Layers,
  FileImage,
  FileText,
  FileCode,
  ChevronDown,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Progress,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import jsPDF from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import * as htmlToImage from "html-to-image";
import BomAIPanel from "@/modules/production/components/BomAIPanel";
import { useBomAI } from "@/modules/production/hooks/useBomAI";

const GLUE_THICKNESS = 1;
const LOCK_BLOCK_HEIGHT = 400;
const LOCK_BLOCK_POSITION = 1000;
const CUT_ALLOWANCE = 10;

const NO_RAIL_CORE_TYPES = ["foam", "particle_solid", "honeycomb"];

const CORE_TYPE_CONFIG = [
  {
    value: "foam",
    label: "โฟม EPS",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "foam",
  },
  {
    value: "plywood_strips",
    label: "ไม้อัดเส้น",
    type: "strips",
    thickness: 4,
    spacing: 40,
    dbKey: "plywood",
  },
  {
    value: "particle_solid",
    label: "ไม้ปาร์ติเคิล (แผ่นเต็ม)",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "particle",
  },
  {
    value: "rockwool",
    label: "ร็อควูล",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "rockwool",
  },
  {
    value: "honeycomb",
    label: "รังผึ้ง",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "honeycomb",
  },
  {
    value: "particle_strips",
    label: "ไม้ปาร์ติเคิลเส้น",
    type: "strips",
    thickness: 12,
    spacing: null,
    dbKey: "particle",
  },
];

const FRAME_TYPES = [
  { value: "rubberwood", label: "ไม้ยางพารา" },
  { value: "sadao", label: "ไม้สะเดา" },
  { value: "lvl", label: "ไม้ LVL" },
];

const DOUBLE_FRAME_SIDES = [
  { key: "top", label: "บน" },
  { key: "bottom", label: "ล่าง" },
  { key: "left", label: "ซ้าย" },
  { key: "center", label: "กลาง" },
  { key: "right", label: "ขวา" },
  { key: "all", label: "ทั้งหมด" },
];

const LOCK_BLOCK_PIECES_OPTIONS = [
  { value: "1", label: "1 ชิ้น" },
  { value: "2", label: "2 ชิ้น" },
  { value: "3", label: "3 ชิ้น" },
  { value: "4", label: "4 ชิ้น" },
];

const LOCK_BLOCK_POSITIONS = [
  { value: "left", left: true, right: false, label: "ซ้าย" },
  { value: "right", left: false, right: true, label: "ขวา" },
  { value: "both", left: true, right: true, label: "ทั้งสองด้าน" },
];

const DOUBLE_FRAME_COUNT_OPTIONS = [
  { value: "0", label: "ไม่ซ้อน" },
  { value: "1", label: "1 ชั้น" },
  { value: "2", label: "2 ชั้น" },
  { value: "3", label: "3 ชั้น" },
];

const GRID_LETTERS = ["A", "B", "C", "D", "E", "F"];
const GRID_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

const LAYER_CONFIG = {
  grid: {
    id: "grid",
    label: "เส้นกริด",
    color: "#DCDCDC",
    defaultVisible: true,
  },
  title: {
    id: "title",
    label: "กรอบชื่อ",
    color: "#4456E9",
    defaultVisible: true,
  },
  dimensions: {
    id: "dimensions",
    label: "มิติ",
    color: "#000000",
    defaultVisible: true,
  },
  centerlines: {
    id: "centerlines",
    label: "เส้นกึ่งกลาง",
    color: "#666666",
    defaultVisible: true,
  },
  surface: {
    id: "surface",
    label: "วัสดุผิว",
    color: "#10B981",
    defaultVisible: true,
  },
  frame: {
    id: "frame",
    label: "กรอบ (เสา)",
    color: "#FFB441",
    defaultVisible: true,
  },
  rails: {
    id: "rails",
    label: "กรอบ (ราว)",
    color: "#FF8A00",
    defaultVisible: true,
  },
  lockblock: {
    id: "lockblock",
    label: "บล็อกล็อค",
    color: "#FF0076",
    defaultVisible: true,
  },
  core: {
    id: "core",
    label: "ไส้ประตู",
    color: "#4456E9",
    defaultVisible: true,
  },
  doubleframe: {
    id: "doubleframe",
    label: "กรอบซ้อน",
    color: "#FFB441",
    defaultVisible: true,
  },
};

const formatDimension = (t, w, h, separator = "×") =>
  `${t || "-"}${separator}${w || "-"}${separator}${h || "-"}`;

const getMaterialLabel = (materials, value) =>
  materials.find((m) => m.value === value)?.label || "-";

const getEfficiencyColor = (efficiency) => {
  const val = parseFloat(String(efficiency)) || 0;
  if (val >= 80) return "success";
  if (val >= 60) return "warning";
  return "danger";
};
const generateDXF = (results) => {
  if (!results) return "";
  const { W = 0, H = 0, F = 0, railPositions = [] } = results;

  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  const offsetX = 100;
  const offsetY = 100;

  const addLine = (x1, y1, x2, y2) =>
    `0\nLINE\n8\n0\n10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`;

  dxf += addLine(offsetX, offsetY, offsetX + W, offsetY);
  dxf += addLine(offsetX + W, offsetY, offsetX + W, offsetY + H);
  dxf += addLine(offsetX + W, offsetY + H, offsetX, offsetY + H);
  dxf += addLine(offsetX, offsetY + H, offsetX, offsetY);

  dxf += addLine(offsetX + F, offsetY, offsetX + F, offsetY + H);
  dxf += addLine(offsetX + W - F, offsetY, offsetX + W - F, offsetY + H);
  dxf += addLine(offsetX + F, offsetY + F, offsetX + W - F, offsetY + F);
  dxf += addLine(
    offsetX + F,
    offsetY + H - F,
    offsetX + W - F,
    offsetY + H - F,
  );

  railPositions?.forEach((pos) => {
    const railY = offsetY + H - pos;
    dxf += addLine(offsetX + F, railY, offsetX + W - F, railY);
  });

  dxf += `0\nENDSEC\n0\nEOF`;
  return dxf;
};

const DimLine = memo(
  ({
    x1,
    y1,
    x2,
    y2,
    value,
    offset = 25,
    vertical = false,
    color = "#000000",
    fontSize = 9,
    unit = "",
    theme,
  }) => {
    const strokeColor = theme?.stroke || color;
    const paperColor = theme?.paper || "#FFFFFF";
    const arrowSize = 3;
    const displayValue = unit ? `${value}${unit}` : value;
    const textWidth = String(displayValue).length * 5.5 + 10;

    if (vertical) {
      const lineX = x1 + offset;
      const midY = (y1 + y2) / 2;
      return (
        <g className="layer-dimensions">
          <line
            x1={x1 + 2}
            y1={y1}
            x2={lineX + 3}
            y2={y1}
            stroke={strokeColor}
            strokeWidth="0.4"
          />
          <line
            x1={x1 + 2}
            y1={y2}
            x2={lineX + 3}
            y2={y2}
            stroke={strokeColor}
            strokeWidth="0.4"
          />
          <line
            x1={lineX}
            y1={y1}
            x2={lineX}
            y2={y2}
            stroke={strokeColor}
            strokeWidth="0.6"
          />
          <polygon
            points={`${lineX},${y1} ${lineX - arrowSize},${y1 + arrowSize * 1.5} ${lineX + arrowSize},${y1 + arrowSize * 1.5}`}
            fill={strokeColor}
          />
          <polygon
            points={`${lineX},${y2} ${lineX - arrowSize},${y2 - arrowSize * 1.5} ${lineX + arrowSize},${y2 - arrowSize * 1.5}`}
            fill={strokeColor}
          />
          <rect
            x={lineX - textWidth / 2}
            y={midY - 6}
            width={textWidth}
            height="12"
            fill={paperColor}
          />
          <text
            x={lineX}
            y={midY + 3}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="500"
            fill={strokeColor}
          >
            {displayValue}
          </text>
        </g>
      );
    }

    const lineY = y1 + offset;
    const midX = (x1 + x2) / 2;
    return (
      <g className="layer-dimensions">
        <line
          x1={x1}
          y1={y1 + 2}
          x2={x1}
          y2={lineY + 3}
          stroke={strokeColor}
          strokeWidth="0.4"
        />
        <line
          x1={x2}
          y1={y1 + 2}
          x2={x2}
          y2={lineY + 3}
          stroke={strokeColor}
          strokeWidth="0.4"
        />
        <line
          x1={x1}
          y1={lineY}
          x2={x2}
          y2={lineY}
          stroke={strokeColor}
          strokeWidth="0.6"
        />
        <polygon
          points={`${x1},${lineY} ${x1 + arrowSize * 1.5},${lineY - arrowSize} ${x1 + arrowSize * 1.5},${lineY + arrowSize}`}
          fill={strokeColor}
        />
        <polygon
          points={`${x2},${lineY} ${x2 - arrowSize * 1.5},${lineY - arrowSize} ${x2 - arrowSize * 1.5},${lineY + arrowSize}`}
          fill={strokeColor}
        />
        <rect
          x={midX - textWidth / 2}
          y={lineY - 6}
          width={textWidth}
          height="12"
          fill={paperColor}
        />
        <text
          x={midX}
          y={lineY + 3}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="500"
          fill={strokeColor}
        >
          {displayValue}
        </text>
      </g>
    );
  },
);
DimLine.displayName = "DimLine";

const CenterLine = memo(({ x1, y1, x2, y2, theme }) => (
  <line
    className="layer-centerlines"
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={theme?.stroke || "#000000"}
    strokeWidth="0.3"
    strokeDasharray="10,3,2,3"
  />
));
CenterLine.displayName = "CenterLine";

const LockBlockSVG = memo(({ x, y, width, height }) => (
  <g className="layer-lockblock">
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="url(#hatch-lockblock)"
      stroke="#000000"
      strokeWidth="0.8"
    />
  </g>
));
LockBlockSVG.displayName = "LockBlockSVG";

const FilledRect = memo(
  ({
    x,
    y,
    width,
    height,
    strokeWidth = 1,
    strokeDasharray,
    className,
    patternId,
  }) => {
    const fill = patternId ? `url(#${patternId})` : "#FFFFFF";
    return (
      <rect
        className={className}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#000000"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  },
);
FilledRect.displayName = "FilledRect";

const TitleBlockSVG = ({ x, y, w, h, theme, data }) => {
  const stroke = theme?.stroke || "#000";
  const fill = theme?.text || "#000";
  const font = "Arial, sans-serif";

  const rows = [
    { key: "logo", weight: 220 },
    { key: "company", weight: 95 },
    { key: "ownerH", weight: 110 },
    { key: "ownerV", weight: 360 },
    { key: "pcH", weight: 120 },
    { key: "pcV", weight: 90 },
    { key: "dimH", weight: 110 },
    { key: "dimV", weight: 105 },
    { key: "typeH", weight: 110 },
    { key: "typeV", weight: 105 },
    { key: "issueH", weight: 110 },
    { key: "issueV", weight: 95 },
    { key: "drawn", weight: 85 },
    { key: "checked", weight: 85 },
    { key: "sale", weight: 85 },
    { key: "co", weight: 85 },
    { key: "tol", weight: 235 },
    { key: "qr", weight: 280 },
    { key: "thai1", weight: 140 },
    { key: "thai2", weight: 150 },
    { key: "sig", weight: 120 },
    { key: "app", weight: 110 },
    { key: "footer", weight: 35 },
  ];

  const total = rows.reduce((s, r) => s + r.weight, 0);
  const k = h / total;

  const yMap = {};
  let cy = y;
  rows.forEach((r) => {
    const rh = r.weight * k;
    yMap[r.key] = { y: cy, h: rh };
    cy += rh;
  });

  const midY = (key) => yMap[key].y + yMap[key].h / 2;

  const line = (x1, y1, x2, y2, sw = 2) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} />
  );

  const txt = (tx, ty, text, opt = {}) => (
    <text
      x={tx}
      y={ty}
      fill={fill}
      fontFamily={font}
      fontSize={opt.size ?? 20}
      fontWeight={opt.weight ?? 700}
      textAnchor={opt.anchor ?? "middle"}
      dominantBaseline="middle"
      letterSpacing={opt.letterSpacing ?? 0}
    >
      {text || ""}
    </text>
  );

  const splitHalf = x + w * 0.5;
  const splitIssue = x + w * 0.66;
  const splitName = x + w * 0.36;
  const pad = w * 0.04;

  const owner = data?.projectOwner || "";
  const projectCode = data?.projectCode || "";
  const code = data?.code || "";
  const dimText = data?.dimension || "-";
  const type = data?.type || "";
  const issueDate = data?.issueDate || "";
  const revise = data?.revise ?? "";

  const drawn = data?.drawn || "";
  const checked = data?.checked || "";
  const sale = data?.sale || "";
  const coApproved = data?.coApproved || "";

  return (
    <g className="layer-title">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
      />

      {rows.map((r) => (
        <React.Fragment key={`h-${r.key}`}>
          {line(x, yMap[r.key].y, x + w, yMap[r.key].y, 2)}
        </React.Fragment>
      ))}
      {line(x, y + h, x + w, y + h, 3)}

      <rect
        x={x + pad}
        y={yMap.logo.y + pad * 0.5}
        width={w - pad * 2}
        height={yMap.logo.h - pad}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      />
      {txt(x + w / 2, yMap.logo.y + yMap.logo.h * 0.62, "EVERGREEN", {
        size: 34,
        weight: 300,
        letterSpacing: 8,
      })}
      {txt(
        x + w / 2,
        yMap.logo.y + yMap.logo.h * 0.8,
        "GREEN CONSTRUCTION MATERIALS",
        { size: 16, weight: 300, letterSpacing: 2 },
      )}

      {txt(x + w / 2, midY("company"), "C.H.H. INDUSTRY CO.,LTD .", {
        size: 26,
        weight: 600,
        letterSpacing: 2,
      })}

      {txt(x + w / 2, midY("ownerH"), "เจ้าของโครงการ", {
        size: 38,
        weight: 900,
      })}
      {txt(x + w / 2, midY("ownerV"), owner, { size: 28, weight: 600 })}

      {line(
        splitHalf,
        yMap.pcH.y,
        splitHalf,
        yMap.pcH.y + yMap.pcH.h + yMap.pcV.h,
        2,
      )}
      {txt(x + (splitHalf - x) / 2, midY("pcH"), "รหัสโครงการ", {
        size: 24,
        weight: 900,
      })}
      {txt(splitHalf + (x + w - splitHalf) / 2, midY("pcH"), "รหัส", {
        size: 32,
        weight: 900,
      })}
      {txt(x + (splitHalf - x) / 2, midY("pcV"), projectCode, {
        size: 28,
        weight: 600,
      })}
      {txt(splitHalf + (x + w - splitHalf) / 2, midY("pcV"), code, {
        size: 28,
        weight: 600,
      })}

      {txt(x + w / 2, midY("dimH"), "ขนาด", { size: 34, weight: 900 })}
      {txt(x + w / 2, midY("dimV"), dimText, { size: 26, weight: 600 })}

      {txt(x + w / 2, midY("typeH"), "ประเภท", { size: 34, weight: 900 })}
      {txt(x + w / 2, midY("typeV"), type, { size: 26, weight: 600 })}

      {line(
        splitIssue,
        yMap.issueH.y,
        splitIssue,
        yMap.issueH.y + yMap.issueH.h + yMap.issueV.h,
        2,
      )}
      {txt(x + (splitIssue - x) / 2, midY("issueH"), "วันที่ออก", {
        size: 30,
        weight: 900,
      })}
      {txt(
        splitIssue + (x + w - splitIssue) / 2,
        midY("issueH"),
        "แก้ไขครั้งที่",
        {
          size: 28,
          weight: 900,
        },
      )}
      {txt(x + (splitIssue - x) / 2, midY("issueV"), issueDate, {
        size: 26,
        weight: 600,
      })}
      {txt(
        splitIssue + (x + w - splitIssue) / 2,
        midY("issueV"),
        String(revise),
        { size: 26, weight: 600 },
      )}

      {["drawn", "checked", "sale", "co"].map((kRow) => {
        const yy = yMap[kRow].y;
        const hh = yMap[kRow].h;
        const value =
          kRow === "drawn"
            ? drawn
            : kRow === "checked"
              ? checked
              : kRow === "sale"
                ? sale
                : coApproved;
        const label =
          kRow === "drawn"
            ? "เขียนโดย"
            : kRow === "checked"
              ? "ตรวจสอบโดย"
              : kRow === "sale"
                ? "ฝ่ายขาย"
                : "อนุมัติร่วม";

        return (
          <React.Fragment key={`ap-${kRow}`}>
            {line(splitName, yy, splitName, yy + hh, 2)}
            {txt(x + (splitName - x) / 2, yy + hh / 2, label, {
              size: 18,
              weight: 600,
            })}
            <text
              x={splitName + pad}
              y={yy + hh / 2}
              fill={fill}
              fontFamily={font}
              fontSize={18}
              fontWeight={500}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {value || ""}
            </text>
          </React.Fragment>
        );
      })}

      <text
        x={x + pad * 2}
        y={yMap.tol.y + yMap.tol.h * 0.25}
        fill={fill}
        fontFamily={font}
        fontSize={18}
        fontWeight={500}
        textAnchor="start"
        dominantBaseline="middle"
      >
        ความตรง ( ± 4 มม. )
      </text>
      <text
        x={x + pad * 2}
        y={yMap.tol.y + yMap.tol.h * 0.45}
        fill={fill}
        fontFamily={font}
        fontSize={18}
        fontWeight={500}
        textAnchor="start"
        dominantBaseline="middle"
      >
        ค่าเผื่อ ( ± 3 มม. )
      </text>
      <text
        x={x + pad * 2}
        y={yMap.tol.y + yMap.tol.h * 0.65}
        fill={fill}
        fontFamily={font}
        fontSize={18}
        fontWeight={500}
        textAnchor="start"
        dominantBaseline="middle"
      >
        ความหนา ( ± 1 มม. )
      </text>
      <text
        x={x + pad * 2}
        y={yMap.tol.y + yMap.tol.h * 0.85}
        fill={fill}
        fontFamily={font}
        fontSize={18}
        fontWeight={500}
        textAnchor="start"
        dominantBaseline="middle"
      >
        หน่วย : มิลลิเมตร
      </text>

      <rect
        x={x + w * 0.25}
        y={yMap.qr.y + yMap.qr.h * 0.18}
        width={w * 0.5}
        height={yMap.qr.h * 0.55}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      />
      {txt(x + w / 2, yMap.qr.y + yMap.qr.h * 0.48, "QR", {
        size: 28,
        weight: 900,
      })}

      {txt(x + w / 2, midY("thai1"), "*เงื่อนไขการรับประกันสินค้า*", {
        size: 20,
        weight: 600,
      })}
      {txt(x + w / 2, midY("thai2"), "*ตรวจสอบและยืนยันก่อนลงนามอนุมัติ*", {
        size: 20,
        weight: 600,
      })}
      {txt(x + w / 2, midY("sig"), "( ลายเซ็นลูกค้า )", {
        size: 20,
        weight: 600,
      })}
      {txt(x + w / 2, midY("app"), "( วันที่อนุมัติ )", {
        size: 20,
        weight: 600,
      })}

      <text
        x={x + w - pad}
        y={midY("footer")}
        fill={fill}
        fontFamily={font}
        fontSize={18}
        fontWeight={500}
        textAnchor="end"
        dominantBaseline="middle"
      >
        FP--02 Rev.00
      </text>
    </g>
  );
};

const EnhancedEngineeringDrawing = memo(
  ({ results, coreCalculation, surfaceMaterial }) => {
    const svgRef = useRef(null);
    const [visibleLayers, setVisibleLayers] = useState(() =>
      Object.fromEntries(
        Object.entries(LAYER_CONFIG).map(([key, config]) => [
          key,
          config.defaultVisible,
        ]),
      ),
    );
    const [isExporting, setIsExporting] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const theme = {
      background: "#FFFFFF",
      paper: "#FFFFFF",
      stroke: "#000000",
      text: "#000000",
      gridText: "#000000",
      border: "#000000",
      accent: "#000000",
    };

    const safeResults = useMemo(() => results || {}, [results]);
    const {
      W = 0,
      H = 0,
      T = 0,
      S = 0,
      F = 0,
      R = 0,
      railPositions = [],
      railSections = 3,
      lockBlockBottom = 1200,
      lockBlockLeft = false,
      lockBlockRight = false,
      lockBlockPosition = 1000,
      lockBlockCount = 0,
      lockBlockSides = 1,
      doubleFrame = {},
    } = safeResults;

    const surfaceMaterialLabel = surfaceMaterial || "ไม่ระบุ";

    const titleData = useMemo(
      () => ({
        projectOwner: safeResults.projectOwner || "",
        projectCode: safeResults.projectCode || "0",
        code: safeResults.code || "0",
        dimension: `${T} × ${W} × ${H} มม.`,
        type: safeResults.type || "",
        issueDate: safeResults.issueDate || "",
        revise: safeResults.revise ?? "0",
        drawn: safeResults.drawn || "",
        checked: safeResults.checked || "",
        sale: safeResults.sale || "",
        coApproved: safeResults.coApproved || "",
      }),
      [safeResults, T, W, H],
    );

    const safeH = H > 0 ? H : 2000;
    const safeW = W > 0 ? W : 800;
    const safeT = T > 0 ? T : 35;
    const safeS = S > 0 ? S : 4;
    const safeF = F > 0 ? F : 50;
    const safeR = R > 0 ? R : 27;

    const wrapperKey = useMemo(
      () => `drawing-${safeT}-${safeW}-${safeH}`,
      [safeT, safeW, safeH],
    );

    const viewBoxWidth = 2970;
    const viewBoxHeight = 2100;
    const DRAWING_SCALE = 0.45;
    const titleBlockWidth = 439;
    const drawingAreaWidth = viewBoxWidth - titleBlockWidth - 20;

    const hasDoubleFrame = doubleFrame?.hasAny && doubleFrame.count > 0;
    const drawingDF = hasDoubleFrame ? safeF * doubleFrame.count : 0;
    const piecesPerSide = parseInt(lockBlockCount / (lockBlockSides || 1)) || 0;

    const dims = useMemo(
      () => ({
        front: {
          W: safeW * DRAWING_SCALE,
          H: safeH * DRAWING_SCALE,
          F: safeF * DRAWING_SCALE,
          DF: drawingDF * DRAWING_SCALE,
          totalFrame: safeF * DRAWING_SCALE,
          R: safeR * DRAWING_SCALE,
          lockBlockW: safeF * DRAWING_SCALE,
        },
        side: {
          T: safeT * DRAWING_SCALE,
          H: safeH * DRAWING_SCALE,
          S: safeS * DRAWING_SCALE,
        },
        exterior: {
          W: safeW * DRAWING_SCALE,
          H: safeH * DRAWING_SCALE,
          S: safeS * DRAWING_SCALE,
        },
      }),
      [safeW, safeH, safeT, safeS, safeF, safeR, drawingDF],
    );

    const gapBetweenViews = 350;
    const totalDrawingWidth =
      dims.side.T +
      gapBetweenViews +
      dims.front.W +
      gapBetweenViews +
      dims.exterior.W;

    const calculatedStartX = (drawingAreaWidth - totalDrawingWidth) / 2;
    const startX = Math.max(100, calculatedStartX);
    const marginY = 180;

    const positions = useMemo(
      () => ({
        side: { x: startX, y: marginY + 200 },
        front: { x: startX + dims.side.T + gapBetweenViews, y: marginY + 200 },
        exterior: {
          x:
            startX +
            dims.side.T +
            gapBetweenViews +
            dims.front.W +
            gapBetweenViews,
          y: marginY + 200,
        },
      }),
      [startX, dims.side.T, dims.front.W, gapBetweenViews, marginY],
    );

    const layerStyle = useMemo(() => {
      let css = "";
      Object.entries(visibleLayers).forEach(([layer, visible]) => {
        if (!visible) css += `.layer-${layer} { display: none !important; }`;
      });
      return css;
    }, [visibleLayers]);

    const exportToPDF = useCallback(async () => {
      if (!svgRef.current) return;
      setIsExporting(true);
      try {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "มม.",
          format: "a4",
        });

        const svgElement = svgRef.current.cloneNode(true);
        const styleTag = svgElement.querySelector("style");
        if (styleTag) styleTag.remove();

        await svg2pdf(svgElement, pdf, {
          x: 0,
          y: 0,
          width: 297,
          height: 210,
        });

        pdf.save(`door-drawing-${safeT}x${safeW}x${safeH}.pdf`);
      } catch (error) {}
      setIsExporting(false);
    }, [safeT, safeW, safeH]);

    const exportToPNG = useCallback(
      async (scale = 2) => {
        if (!svgRef.current) return;
        setIsExporting(true);
        try {
          const dataUrl = await htmlToImage.toPng(svgRef.current, {
            quality: 1,
            pixelRatio: scale,
            backgroundColor: theme.background,
          });
          const link = document.createElement("a");
          link.download = `door-drawing-${safeT}x${safeW}x${safeH}.png`;
          link.href = dataUrl;
          link.click();
        } catch (error) {}
        setIsExporting(false);
      },
      [safeT, safeW, safeH, theme.background],
    );

    const exportToDXF = useCallback(() => {
      setIsExporting(true);
      try {
        const dxfContent = generateDXF(safeResults);
        const blob = new Blob([dxfContent], { type: "application/dxf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `door-drawing-${safeT}x${safeW}x${safeH}.dxf`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {}
      setIsExporting(false);
    }, [safeResults, safeT, safeW, safeH]);

    const toggleLayer = useCallback((layerId) => {
      setVisibleLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
    }, []);

    const toggleAllLayers = useCallback((visible) => {
      setVisibleLayers(
        Object.fromEntries(
          Object.keys(LAYER_CONFIG).map((key) => [key, visible]),
        ),
      );
    }, []);

    const getCorePatternId = (value) => {
      if (value === "honeycomb") return "hatch-core";
      if (value === "foam") return "hatch-foam";
      if (value === "rockwool") return "hatch-rockwool";
      if (value === "particle_solid" || value === "particle_strips")
        return "hatch-particle";
      if (value === "plywood_strips") return "hatch-plywood";
      return "hatch-core";
    };

    const corePatternId = useMemo(
      () => getCorePatternId(coreCalculation?.coreType?.value),
      [coreCalculation?.coreType?.value],
    );

    const renderLockBlocks = useCallback(() => {
      const blocks = [];
      const lockBlockH = LOCK_BLOCK_HEIGHT * DRAWING_SCALE;
      const lockBlockY =
        positions.front.y + dims.front.H - lockBlockBottom * DRAWING_SCALE;

      const getOffset = (isLeft) => {
        const hasDoubleOnSide =
          hasDoubleFrame &&
          doubleFrame &&
          doubleFrame.count > 0 &&
          (isLeft ? doubleFrame.left : doubleFrame.right);
        return dims.front.F + (hasDoubleOnSide ? dims.front.DF : 0);
      };

      const renderSide = (isLeft) => {
        if (!(isLeft ? lockBlockLeft : lockBlockRight)) return;

        const offset = getOffset(isLeft);

        [...Array(piecesPerSide)].forEach((_, i) => {
          const x = isLeft
            ? positions.front.x + offset + dims.front.lockBlockW * i
            : positions.front.x +
              dims.front.W -
              offset -
              dims.front.lockBlockW * (i + 1);
          blocks.push(
            <LockBlockSVG
              key={`lb-${isLeft ? "left" : "right"}-${i}`}
              x={x}
              y={lockBlockY}
              width={dims.front.lockBlockW}
              height={lockBlockH}
            />,
          );
        });
      };

      renderSide(true);
      renderSide(false);

      return blocks;
    }, [
      positions,
      dims,
      lockBlockLeft,
      lockBlockRight,
      piecesPerSide,
      lockBlockBottom,
      hasDoubleFrame,
      doubleFrame,
    ]);

    const renderDoubleFrames = useCallback(() => {
      if (!hasDoubleFrame) return null;

      const elements = [];
      const count = doubleFrame.count;
      const leftOffset = doubleFrame.left ? dims.front.F * count : 0;
      const rightOffset = doubleFrame.right ? dims.front.F * count : 0;

      const configs = [
        {
          key: "left",
          getRect: (i) => ({
            x: positions.front.x + dims.front.F + dims.front.F * i,
            y: positions.front.y + dims.front.F,
            w: dims.front.F,
            h: dims.front.H - 2 * dims.front.F,
          }),
        },
        {
          key: "right",
          getRect: (i) => ({
            x:
              positions.front.x +
              dims.front.W -
              dims.front.F -
              dims.front.F * (i + 1),
            y: positions.front.y + dims.front.F,
            w: dims.front.F,
            h: dims.front.H - 2 * dims.front.F,
          }),
        },
        {
          key: "top",
          getRect: (i) => ({
            x: positions.front.x + dims.front.F + leftOffset,
            y: positions.front.y + dims.front.F + dims.front.F * i,
            w: dims.front.W - 2 * dims.front.F - leftOffset - rightOffset,
            h: dims.front.F,
          }),
        },
        {
          key: "bottom",
          getRect: (i) => ({
            x: positions.front.x + dims.front.F + leftOffset,
            y:
              positions.front.y +
              dims.front.H -
              dims.front.F -
              dims.front.F * (i + 1),
            w: dims.front.W - 2 * dims.front.F - leftOffset - rightOffset,
            h: dims.front.F,
          }),
        },
        {
          key: "center",
          getRect: (i) => ({
            x:
              positions.front.x +
              dims.front.W / 2 -
              dims.front.F / 2 +
              (i - (count - 1) / 2) * dims.front.F,
            y: positions.front.y + dims.front.F,
            w: dims.front.F,
            h: dims.front.H - 2 * dims.front.F,
          }),
        },
      ];

      configs.forEach(({ key, getRect }) => {
        if (!doubleFrame[key]) return;
        for (let i = 0; i < count; i++) {
          const r = getRect(i);
          elements.push(
            <rect
              key={`df-${key}-${i}`}
              className="layer-doubleframe"
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="url(#hatch-doubleframe)"
              stroke="#000000"
              strokeWidth="1"
              strokeDasharray="8,4"
            />,
          );
        }
      });

      return elements;
    }, [hasDoubleFrame, positions, dims, doubleFrame]);

    const renderRails = useCallback(() => {
      if (!railPositions || railPositions.length === 0) return null;

      const skipRailCoreTypes = [...NO_RAIL_CORE_TYPES, "particle_strips"];
      if (skipRailCoreTypes.includes(coreCalculation?.coreType?.value))
        return null;

      const leftOffset = hasDoubleFrame && doubleFrame.left ? dims.front.DF : 0;
      const rightOffset =
        hasDoubleFrame && doubleFrame.right ? dims.front.DF : 0;
      const railX = positions.front.x + dims.front.F + leftOffset;
      const railWidth =
        dims.front.W - 2 * dims.front.F - leftOffset - rightOffset;

      return railPositions.map((pos, idx) => {
        const railY = positions.front.y + dims.front.H - pos * DRAWING_SCALE;
        return (
          <FilledRect
            key={`front-rail-${idx}`}
            className="layer-rails"
            x={railX}
            y={railY - dims.front.R / 2}
            width={railWidth}
            height={dims.front.R}
            patternId="hatch-rails"
            strokeWidth={1}
          />
        );
      });
    }, [
      railPositions,
      positions,
      dims,
      hasDoubleFrame,
      doubleFrame,
      coreCalculation,
    ]);

    const renderCore = useCallback(() => {
      if (
        !coreCalculation ||
        !coreCalculation.coreType ||
        coreCalculation.totalPieces === 0
      )
        return null;

      const elements = [];
      const pid = getCorePatternId(coreCalculation.coreType.value);

      if (coreCalculation.isSolid) {
        coreCalculation.pieces.forEach((piece, idx) => {
          elements.push(
            <rect
              key={`core-solid-${idx}`}
              className="layer-core"
              x={positions.front.x + piece.x * DRAWING_SCALE}
              y={positions.front.y + piece.y * DRAWING_SCALE}
              width={piece.width * DRAWING_SCALE}
              height={piece.height * DRAWING_SCALE}
              fill={`url(#${pid})`}
              stroke="#000000"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />,
          );
        });
        return elements;
      }

      const maxPiecesToDraw = 200;
      const piecesToDraw = coreCalculation.pieces.slice(0, maxPiecesToDraw);

      piecesToDraw.forEach((piece, idx) => {
        elements.push(
          <rect
            key={`core-strip-${idx}`}
            className="layer-core"
            x={positions.front.x + piece.x * DRAWING_SCALE}
            y={positions.front.y + piece.y * DRAWING_SCALE}
            width={piece.width * DRAWING_SCALE}
            height={piece.height * DRAWING_SCALE}
            fill={`url(#${pid})`}
            stroke="#000000"
            strokeWidth="0.25"
            opacity="0.95"
          />,
        );
      });

      if (coreCalculation.damPieces?.length) {
        coreCalculation.damPieces.forEach((p) => {
          elements.push(
            <rect
              key={p.id}
              className="layer-core"
              x={positions.front.x + p.x * DRAWING_SCALE}
              y={positions.front.y + p.y * DRAWING_SCALE}
              width={p.width * DRAWING_SCALE}
              height={p.height * DRAWING_SCALE}
              fill={`url(#${pid})`}
              stroke="#000000"
              strokeWidth="0.35"
            />,
          );
        });
      }

      if (coreCalculation.pieces.length > maxPiecesToDraw) {
        elements.push(
          <text
            key="core-overflow-text"
            x={positions.front.x + dims.front.W / 2}
            y={positions.front.y + dims.front.H / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#4456E9"
          >
            +{coreCalculation.pieces.length - maxPiecesToDraw} แถบเพิ่มเติม
          </text>,
        );
      }

      return elements;
    }, [coreCalculation, positions, dims]);

    return (
      <div className="relative w-full h-full flex flex-col bg-default-100 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-default-50 border-b border-border gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Chip size="md" variant="shadow">
              {Math.round(zoomLevel * 100)}%
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Button
                  color="default"
                  variant="shadow"
                  size="md"
                  radius="md"
                  className="w-full text-foreground border-border"
                  startContent={<Layers />}
                >
                  Layers
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="p-2 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border gap-2">
                    <span className="font-light text-[13px]">เลเยอร์</span>
                    <div className="flex gap-2">
                      <Button
                        color="default"
                        variant="light"
                        size="md"
                        radius="md"
                        className="w-full text-foreground"
                        onPress={() => toggleAllLayers(true)}
                      >
                        เปิดทั้งหมด
                      </Button>
                      <Button
                        color="default"
                        variant="light"
                        size="md"
                        radius="md"
                        className="w-full text-foreground"
                        onPress={() => toggleAllLayers(false)}
                      >
                        ปิดทั้งหมด
                      </Button>
                    </div>
                  </div>
                  {Object.entries(LAYER_CONFIG).map(([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-[13px]">{config.label}</span>
                      </div>
                      <Switch
                        size="md"
                        isSelected={visibleLayers[key]}
                        onValueChange={() => toggleLayer(key)}
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Divider orientation="vertical" className="h-6" />

            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="default"
                  variant="shadow"
                  size="md"
                  radius="md"
                  className="w-full bg-foreground text-background"
                  startContent={<Download />}
                  endContent={<ChevronDown />}
                  isLoading={isExporting}
                >
                  Export
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="ตัวเลือกส่งออก">
                <DropdownItem
                  key="pdf"
                  startContent={<FileText />}
                  description="รูปแบบเวกเตอร์ เหมาะสำหรับพิมพ์"
                  onPress={exportToPDF}
                >
                  ส่งออก PDF
                </DropdownItem>

                <DropdownItem
                  key="png-hd"
                  startContent={<FileImage />}
                  description="ความละเอียด 4 เท่า สำหรับงานพิมพ์ขนาดใหญ่"
                  onPress={() => exportToPNG(4)}
                >
                  ส่งออก PNG (4K)
                </DropdownItem>

                <DropdownItem
                  key="dxf"
                  startContent={<FileCode />}
                  description="สำหรับซอฟต์แวร์ AutoCAD/CAD"
                  onPress={exportToDXF}
                >
                  ส่งออก DXF
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div
          className="flex-1 relative overflow-hidden"
          style={{ backgroundColor: theme.background }}
        >
          <TransformWrapper
            key={wrapperKey}
            initialScale={1}
            minScale={0.1}
            maxScale={5}
            centerOnInit
            onTransformed={(ref) => setZoomLevel(ref.state.scale)}
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
              <>
                <div className="absolute botto right-4 z-10 flex flex-col gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                  <Tooltip content="ซูมเข้า" placement="left">
                    <Button
                      color="default"
                      variant="light"
                      size="md"
                      radius="md"
                      className="w-full text-foreground"
                      isIconOnly
                      onPress={() => zoomIn()}
                    >
                      <ZoomIn />
                    </Button>
                  </Tooltip>
                  <Tooltip content="ซูมออก" placement="left">
                    <Button
                      color="default"
                      variant="light"
                      size="md"
                      radius="md"
                      className="w-full text-foreground"
                      isIconOnly
                      onPress={() => zoomOut()}
                    >
                      <ZoomOut />
                    </Button>
                  </Tooltip>
                  <Divider className="" />
                  <Tooltip content="พอดีหน้าจอ" placement="left">
                    <Button
                      color="default"
                      variant="light"
                      size="md"
                      radius="md"
                      className="w-full text-foreground"
                      isIconOnly
                      onPress={() => centerView()}
                    >
                      <Maximize2 />
                    </Button>
                  </Tooltip>
                  <Tooltip content="รีเซ็ตซูม" placement="left">
                    <Button
                      color="default"
                      variant="light"
                      size="md"
                      radius="md"
                      className="w-full text-foreground"
                      isIconOnly
                      onPress={() => resetTransform()}
                    >
                      <RotateCcw />
                    </Button>
                  </Tooltip>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                >
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                    width="297mm"
                    height="210mm"
                    className="w-full h-auto"
                    style={{ backgroundColor: theme.paper }}
                  >
                    <style>{layerStyle}</style>

                    <defs>
                      <pattern
                        id="hatch-surface"
                        patternUnits="userSpaceOnUse"
                        width="8"
                        height="8"
                      >
                        <path
                          d="M0 8 L8 0"
                          stroke="#000000"
                          strokeWidth="0.3"
                        />
                      </pattern>

                      <pattern
                        id="hatch-frame"
                        patternUnits="userSpaceOnUse"
                        width="4"
                        height="4"
                      >
                        <path
                          d="M2 0 L2 4"
                          stroke="#000000"
                          strokeWidth="0.4"
                        />
                      </pattern>

                      <pattern
                        id="hatch-rails"
                        patternUnits="userSpaceOnUse"
                        width="4"
                        height="4"
                      >
                        <path
                          d="M0 2 L4 2"
                          stroke="#000000"
                          strokeWidth="0.4"
                        />
                      </pattern>

                      <pattern
                        id="hatch-lockblock"
                        patternUnits="userSpaceOnUse"
                        width="4"
                        height="4"
                      >
                        <path
                          d="M2 0 L2 4"
                          stroke="#000000"
                          strokeWidth="0.4"
                        />
                      </pattern>

                      <pattern
                        id="hatch-core"
                        patternUnits="userSpaceOnUse"
                        width="17.32"
                        height="20"
                      >
                        <polygon
                          points="8.66,0 17.32,5 17.32,15 8.66,20 0,15 0,5"
                          fill="none"
                          stroke="#555555"
                          strokeWidth="0.6"
                        />
                        <polygon
                          points="17.32,10 25.98,15 25.98,25 17.32,30 8.66,25 8.66,15"
                          fill="none"
                          stroke="#555555"
                          strokeWidth="0.6"
                        />
                      </pattern>

                      <pattern
                        id="hatch-particle"
                        patternUnits="userSpaceOnUse"
                        width="10"
                        height="10"
                      >
                        <circle
                          cx="2"
                          cy="3"
                          r="0.6"
                          fill="#000000"
                          opacity="0.35"
                        />
                        <circle
                          cx="7"
                          cy="2"
                          r="0.5"
                          fill="#000000"
                          opacity="0.25"
                        />
                        <circle
                          cx="5"
                          cy="7"
                          r="0.7"
                          fill="#000000"
                          opacity="0.3"
                        />
                        <circle
                          cx="9"
                          cy="8"
                          r="0.4"
                          fill="#000000"
                          opacity="0.22"
                        />
                        <circle
                          cx="1"
                          cy="9"
                          r="0.45"
                          fill="#000000"
                          opacity="0.2"
                        />
                      </pattern>

                      <pattern
                        id="hatch-foam"
                        patternUnits="userSpaceOnUse"
                        width="12"
                        height="12"
                      >
                        <circle
                          cx="3"
                          cy="3"
                          r="0.7"
                          fill="#000000"
                          opacity="0.18"
                        />
                        <circle
                          cx="9"
                          cy="4"
                          r="0.6"
                          fill="#000000"
                          opacity="0.14"
                        />
                        <circle
                          cx="6"
                          cy="9"
                          r="0.8"
                          fill="#000000"
                          opacity="0.16"
                        />
                      </pattern>

                      <pattern
                        id="hatch-rockwool"
                        patternUnits="userSpaceOnUse"
                        width="18"
                        height="12"
                      >
                        <path
                          d="M0 3 C4 0, 8 6, 12 3 S20 6, 24 3"
                          stroke="#000000"
                          strokeWidth="0.35"
                          opacity="0.25"
                          fill="none"
                        />
                        <path
                          d="M0 9 C4 6, 8 12, 12 9 S20 12, 24 9"
                          stroke="#000000"
                          strokeWidth="0.35"
                          opacity="0.2"
                          fill="none"
                        />
                      </pattern>

                      <pattern
                        id="hatch-plywood"
                        patternUnits="userSpaceOnUse"
                        width="12"
                        height="12"
                      >
                        <path
                          d="M0 10 L10 0"
                          stroke="#000000"
                          strokeWidth="0.35"
                          opacity="0.25"
                        />
                        <path
                          d="M2 12 L12 2"
                          stroke="#000000"
                          strokeWidth="0.35"
                          opacity="0.18"
                        />
                        <path
                          d="M0 6 L6 0"
                          stroke="#000000"
                          strokeWidth="0.25"
                          opacity="0.15"
                        />
                      </pattern>

                      <pattern
                        id="hatch-doubleframe"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                      >
                        <path
                          d="M0 6 L6 0"
                          stroke="#000000"
                          strokeWidth="0.3"
                        />
                        <path
                          d="M0 0 L6 6"
                          stroke="#000000"
                          strokeWidth="0.3"
                        />
                      </pattern>
                    </defs>

                    <rect
                      x="8"
                      y="8"
                      width={viewBoxWidth - 16}
                      height={viewBoxHeight - 16}
                      fill="none"
                      stroke={theme.border}
                      strokeWidth="2"
                    />
                    <rect
                      x="12"
                      y="12"
                      width={viewBoxWidth - 24}
                      height={viewBoxHeight - 24}
                      fill="none"
                      stroke={theme.border}
                      strokeWidth="0.5"
                    />

                    <g
                      className="layer-grid"
                      fontSize="20"
                      fill={theme.gridText}
                    >
                      {GRID_LETTERS.map((letter, i) => (
                        <text
                          key={`grid-${letter}`}
                          x="40"
                          y={200 + i * 400}
                          textAnchor="middle"
                        >
                          {letter}
                        </text>
                      ))}
                      {GRID_NUMBERS.map((num, i) => (
                        <text
                          key={`grid-${num}`}
                          x={250 + i * 200}
                          y="120"
                          textAnchor="middle"
                        >
                          {num}
                        </text>
                      ))}
                    </g>

                    <text
                      x={viewBoxWidth / 2}
                      y="80"
                      textAnchor="middle"
                      fontSize="40"
                      fontWeight="bold"
                      fill={theme.text}
                    >
                      แบบโครงสร้างกรอบประตู
                    </text>

                    <g id="side-view">
                      <text
                        x={positions.side.x + dims.side.T / 2}
                        y={positions.side.y + dims.side.H + 70}
                        textAnchor="middle"
                        fontSize="28"
                        fontWeight="bold"
                        fill={theme.text}
                      >
                        Side View
                      </text>

                      <FilledRect
                        className="layer-surface"
                        x={positions.side.x}
                        y={positions.side.y}
                        width={dims.side.S}
                        height={dims.side.H}
                        patternId="hatch-surface"
                        strokeWidth={0.8}
                      />
                      <FilledRect
                        className="layer-surface"
                        x={positions.side.x + dims.side.T - dims.side.S}
                        y={positions.side.y}
                        width={dims.side.S}
                        height={dims.side.H}
                        patternId="hatch-surface"
                        strokeWidth={0.8}
                      />

                      <FilledRect
                        className="layer-frame"
                        x={positions.side.x + dims.side.S}
                        y={positions.side.y}
                        width={(dims.side.T - 2 * dims.side.S) * 0.25}
                        height={dims.side.H}
                        patternId="hatch-frame"
                      />
                      <FilledRect
                        className="layer-frame"
                        x={
                          positions.side.x +
                          dims.side.T -
                          dims.side.S -
                          (dims.side.T - 2 * dims.side.S) * 0.25
                        }
                        y={positions.side.y}
                        width={(dims.side.T - 2 * dims.side.S) * 0.25}
                        height={dims.side.H}
                        patternId="hatch-frame"
                      />

                      <FilledRect
                        className="layer-core"
                        x={
                          positions.side.x +
                          dims.side.S +
                          (dims.side.T - 2 * dims.side.S) * 0.25
                        }
                        y={positions.side.y}
                        width={(dims.side.T - 2 * dims.side.S) * 0.5}
                        height={dims.side.H}
                        patternId={corePatternId}
                        strokeWidth={0.8}
                        strokeDasharray="4,4"
                      />

                      <CenterLine
                        x1={positions.side.x + dims.side.T / 2}
                        y1={positions.side.y - 40}
                        x2={positions.side.x + dims.side.T / 2}
                        y2={positions.side.y + dims.side.H + 40}
                        theme={theme}
                      />

                      {!NO_RAIL_CORE_TYPES.includes(
                        coreCalculation?.coreType?.value,
                      ) &&
                        coreCalculation?.coreType?.value !==
                          "particle_strips" &&
                        railPositions.map((pos, idx) => {
                          const railY =
                            positions.side.y +
                            dims.side.H -
                            pos * DRAWING_SCALE;
                          const railH = safeR * DRAWING_SCALE * 0.5;
                          return (
                            <FilledRect
                              key={`side-rail-${idx}`}
                              className="layer-rails"
                              x={positions.side.x + dims.side.S}
                              y={railY - railH / 2}
                              width={dims.side.T - 2 * dims.side.S}
                              height={railH}
                              patternId="hatch-rails"
                            />
                          );
                        })}

                      {(lockBlockLeft || lockBlockRight) && (
                        <rect
                          className="layer-lockblock"
                          x={positions.side.x + dims.side.S}
                          y={
                            positions.side.y +
                            dims.side.H -
                            lockBlockBottom * DRAWING_SCALE
                          }
                          width={dims.side.T - 2 * dims.side.S}
                          height={LOCK_BLOCK_HEIGHT * DRAWING_SCALE}
                          fill="none"
                          stroke="#000000"
                          strokeWidth="1.4"
                          strokeDasharray="6,4"
                        />
                      )}

                      {(lockBlockLeft || lockBlockRight) &&
                        (() => {
                          const lockBlockTopY =
                            positions.side.y +
                            dims.side.H -
                            lockBlockBottom * DRAWING_SCALE;
                          const lockBlockBottomY =
                            lockBlockTopY + LOCK_BLOCK_HEIGHT * DRAWING_SCALE;
                          return (
                            <DimLine
                              x1={positions.side.x}
                              y1={lockBlockTopY}
                              x2={positions.side.x}
                              y2={lockBlockBottomY}
                              value={LOCK_BLOCK_HEIGHT}
                              offset={-60}
                              vertical
                              fontSize={16}
                              theme={theme}
                            />
                          );
                        })()}

                      <DimLine
                        x1={positions.side.x}
                        y1={positions.side.y}
                        x2={positions.side.x + dims.side.T}
                        y2={positions.side.y}
                        value={T}
                        offset={-160}
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.side.x}
                        y1={positions.side.y}
                        x2={positions.side.x + dims.side.S}
                        y2={positions.side.y}
                        value={S}
                        offset={-80}
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.side.x + dims.side.S}
                        y1={positions.side.y}
                        x2={positions.side.x + dims.side.T - dims.side.S}
                        y2={positions.side.y}
                        value={T - 2 * S}
                        offset={-120}
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.side.x + dims.side.T}
                        y1={positions.side.y}
                        x2={positions.side.x + dims.side.T}
                        y2={positions.side.y + dims.side.H}
                        value={H}
                        offset={100}
                        vertical
                        fontSize={18}
                        theme={theme}
                      />
                    </g>

                    <g id="front-view">
                      <text
                        x={positions.front.x + dims.front.W / 2}
                        y={positions.front.y + dims.front.H + 70}
                        textAnchor="middle"
                        fontSize="28"
                        fontWeight="bold"
                        fill={theme.text}
                      >
                        Front View
                      </text>

                      <FilledRect
                        className="layer-frame"
                        x={positions.front.x}
                        y={positions.front.y}
                        width={dims.front.F}
                        height={dims.front.H}
                        patternId="hatch-frame"
                        strokeWidth={1.2}
                      />
                      <FilledRect
                        className="layer-frame"
                        x={positions.front.x + dims.front.W - dims.front.F}
                        y={positions.front.y}
                        width={dims.front.F}
                        height={dims.front.H}
                        patternId="hatch-frame"
                        strokeWidth={1.2}
                      />

                      <FilledRect
                        className="layer-rails"
                        x={positions.front.x + dims.front.F}
                        y={positions.front.y}
                        width={dims.front.W - 2 * dims.front.F}
                        height={dims.front.F}
                        patternId="hatch-rails"
                        strokeWidth={1.2}
                      />
                      <FilledRect
                        className="layer-rails"
                        x={positions.front.x + dims.front.F}
                        y={positions.front.y + dims.front.H - dims.front.F}
                        width={dims.front.W - 2 * dims.front.F}
                        height={dims.front.F}
                        patternId="hatch-rails"
                        strokeWidth={1.2}
                      />

                      {renderCore()}
                      {renderDoubleFrames()}
                      {renderRails()}
                      {renderLockBlocks()}

                      <CenterLine
                        x1={positions.front.x + dims.front.W / 2}
                        y1={positions.front.y - 40}
                        x2={positions.front.x + dims.front.W / 2}
                        y2={positions.front.y + dims.front.H + 40}
                        theme={theme}
                      />
                      <CenterLine
                        x1={positions.front.x - 40}
                        y1={positions.front.y + dims.front.H / 2}
                        x2={positions.front.x + dims.front.W + 40}
                        y2={positions.front.y + dims.front.H / 2}
                        theme={theme}
                      />

                      <DimLine
                        x1={positions.front.x}
                        y1={positions.front.y}
                        x2={positions.front.x + dims.front.W}
                        y2={positions.front.y}
                        value={W}
                        offset={-160}
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.front.x}
                        y1={positions.front.y}
                        x2={positions.front.x + dims.front.F}
                        y2={positions.front.y}
                        value={F}
                        offset={-80}
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.front.x}
                        y1={positions.front.y}
                        x2={positions.front.x}
                        y2={positions.front.y + dims.front.F}
                        value={F}
                        offset={-80}
                        vertical
                        fontSize={18}
                        theme={theme}
                      />
                      <DimLine
                        x1={positions.front.x + dims.front.W}
                        y1={positions.front.y}
                        x2={positions.front.x + dims.front.W}
                        y2={positions.front.y + dims.front.H}
                        value={H}
                        offset={100}
                        vertical
                        fontSize={18}
                        theme={theme}
                      />

                      {(lockBlockLeft || lockBlockRight) && (
                        <DimLine
                          x1={positions.front.x}
                          y1={positions.front.y + dims.front.H}
                          x2={positions.front.x}
                          y2={
                            positions.front.y +
                            dims.front.H -
                            lockBlockPosition * DRAWING_SCALE
                          }
                          value={lockBlockPosition}
                          offset={-100}
                          vertical
                          fontSize={18}
                          theme={theme}
                        />
                      )}

                      {railPositions.length > 0 &&
                        !NO_RAIL_CORE_TYPES.includes(
                          coreCalculation?.coreType?.value,
                        ) &&
                        coreCalculation?.coreType?.value !==
                          "particle_strips" &&
                        (() => {
                          const railPos = railPositions[0];
                          const railCenter =
                            positions.front.y +
                            dims.front.H -
                            railPos * DRAWING_SCALE;
                          const top = railCenter - dims.front.R / 2;
                          const bottom = railCenter + dims.front.R / 2;
                          const dx = positions.front.x + dims.front.W + 120;
                          return (
                            <DimLine
                              x1={dx}
                              y1={top}
                              x2={dx}
                              y2={bottom}
                              value={F}
                              offset={40}
                              vertical
                              fontSize={16}
                              theme={theme}
                            />
                          );
                        })()}
                    </g>

                    <g id="exterior-view">
                      <rect
                        x={positions.exterior.x}
                        y={positions.exterior.y}
                        width={dims.exterior.W}
                        height={dims.exterior.H}
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth="1.5"
                      />

                      <line
                        x1={positions.exterior.x}
                        y1={positions.exterior.y + dims.exterior.H / 2}
                        x2={positions.exterior.x + dims.exterior.W}
                        y2={positions.exterior.y + dims.exterior.H / 2}
                        stroke="#000000"
                        strokeWidth="0.5"
                        strokeDasharray="10,3,2,3"
                      />

                      <line
                        x1={positions.exterior.x + dims.exterior.W / 2}
                        y1={positions.exterior.y}
                        x2={positions.exterior.x + dims.exterior.W / 2}
                        y2={positions.exterior.y + dims.exterior.H}
                        stroke="#000000"
                        strokeWidth="0.5"
                        strokeDasharray="10,3,2,3"
                      />

                      <DimLine
                        x1={positions.exterior.x}
                        y1={positions.exterior.y}
                        x2={positions.exterior.x + dims.exterior.W}
                        y2={positions.exterior.y}
                        value={W}
                        offset={-60}
                        fontSize={16}
                        theme={theme}
                      />

                      <DimLine
                        x1={positions.exterior.x + dims.exterior.W}
                        y1={positions.exterior.y}
                        x2={positions.exterior.x + dims.exterior.W}
                        y2={positions.exterior.y + dims.exterior.H}
                        value={H}
                        offset={60}
                        vertical
                        fontSize={16}
                        theme={theme}
                      />

                      <text
                        x={positions.exterior.x + dims.exterior.W / 2}
                        y={positions.exterior.y + dims.exterior.H + 40}
                        textAnchor="middle"
                        fontSize="14"
                        fill={theme.text}
                      >
                        ประตู {surfaceMaterialLabel}
                      </text>
                      <text
                        x={positions.exterior.x + dims.exterior.W / 2}
                        y={positions.exterior.y + dims.exterior.H + 60}
                        textAnchor="middle"
                        fontSize="14"
                        fill={theme.text}
                      >
                        ความหนาผิว: {S} มม. × 2 ด้าน
                      </text>

                      <text
                        x={positions.exterior.x + dims.exterior.W / 2}
                        y={positions.exterior.y + dims.exterior.H + 90}
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill={theme.text}
                      >
                        Exterior View
                      </text>
                    </g>

                    <TitleBlockSVG
                      x={viewBoxWidth - 439}
                      y={9}
                      w={430}
                      h={viewBoxHeight - 17}
                      theme={theme}
                      data={titleData}
                    />
                  </svg>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        <div className="flex items-center justify-between p-2 bg-default-50 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              ประตู: {T}×{W}×{H} มม.
            </span>
            <span>
              กรอบ: {R}×{F} มม.
            </span>
            {!NO_RAIL_CORE_TYPES.includes(coreCalculation?.coreType?.value) &&
              coreCalculation?.coreType?.value !== "particle_strips" && (
                <span>คานขวาง: {railSections - 1}</span>
              )}
            <span>บล็อกล็อค: {lockBlockCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>มาตราส่วน: 1:25</span>
          </div>
        </div>
      </div>
    );
  },
);

EnhancedEngineeringDrawing.displayName = "EnhancedEngineeringDrawing";

const UIDoorBom = ({
  formRef,
  customerPO,
  setCustomerPO,
  orderQty,
  setOrderQty,
  doorType,
  setDoorType,
  doorThickness,
  setDoorThickness,
  doorWidth,
  setDoorWidth,
  doorHeight,
  setDoorHeight,
  surfaceMaterial,
  setSurfaceMaterial,
  surfacePrice,
  setSurfacePrice,
  surfaceThickness,
  setSurfaceThickness,
  selectedFrameCode,
  setSelectedFrameCode,
  frameCandidates,
  lockBlockPosition,
  setLockBlockPosition,
  lockBlockPiecesPerSide,
  setLockBlockPiecesPerSide,
  doubleFrameSides,
  doubleFrameCount,
  setDoubleFrameCount,
  coreType,
  setCoreType,
  selectedCoreCode,
  setSelectedCoreCode,
  availableCoreItems,
  selectedCoreItem,
  edgeBanding,
  setEdgeBanding,
  edgeMaterial,
  setEdgeMaterial,
  edgePrice,
  setEdgePrice,
  edgeSides,
  setEdgeSides,
  drilling,
  setDrilling,
  drillItems,
  setDrillItems,
  lockBlockLeft,
  lockBlockRight,
  currentFrame,
  results,
  cuttingPlan,
  coreCalculation,
  isDataComplete,
  piecesPerSide,
  doubleConfigSummary,
  handleToggleDoubleSide,
  lockBlockDesc,
  priceSummary,
  customMargin,
  setCustomMargin,
  frameLengthOptions,
}) => {
  const isNoRailCoreType = NO_RAIL_CORE_TYPES.includes(coreType);

  const [framePlanPage, setFramePlanPage] = useState(1);
  const [corePlanPage, setCorePlanPage] = useState(1);
  const FRAME_PAGE_SIZE = 10;
  const CORE_PAGE_SIZE = 5;

  const bomState = useMemo(
    () => ({
      customerPO,
      orderQty,
      doorType,
      doorThickness,
      doorWidth,
      doorHeight,
      surfaceMaterial,
      surfaceThickness,
      surfacePrice,
      coreType,
      edgeBanding,
    }),
    [customerPO, orderQty, doorType, doorThickness, doorWidth, doorHeight, surfaceMaterial, surfaceThickness, surfacePrice, coreType, edgeBanding],
  );

  const aiSetters = useMemo(
    () => ({
      setCustomerPO,
      setOrderQty,
      setDoorType,
      setDoorThickness,
      setDoorWidth,
      setDoorHeight,
      setSurfaceMaterial,
      setSurfacePrice,
      setSurfaceThickness,
      setCoreType,
      setEdgeBanding,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const bomAI = useBomAI({ bomState, setters: aiSetters });

  return (
    <div ref={formRef} className="flex flex-col w-full gap-3">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 w-full">
        <div className="xl:col-span-1 flex flex-col gap-3">
          <BomAIPanel bomState={bomState} bomAI={bomAI} />

          {/* Door type tab bar — shown when PDF has multiple door types */}
          {bomAI.pendingDoors.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 flex-wrap">
              <span className="text-[11px] font-light text-primary-700 shrink-0">
                ประตูที่อ่านได้:
              </span>
              {bomAI.pendingDoors.map((door, i) => {
                const isApplied = bomAI.appliedDoorIdxs.includes(i);
                const isActive = i === bomAI.selectedDoorIdx;
                return (
                  <Chip
                    key={i}
                    size="sm"
                    variant={isActive ? "solid" : "flat"}
                    color={isApplied ? "success" : isActive ? "primary" : "default"}
                    className="cursor-pointer text-[12px] font-light"
                    onClick={() => {
                      bomAI.selectDoor(i);
                      bomAI.applyDoorFields(door, null, i);
                    }}
                  >
                    {isApplied ? "✓ " : ""}{door.doorCode || `ประตู ${i + 1}`}
                  </Chip>
                );
              })}
              <Button
                size="sm" variant="light" color="default"
                className="ml-auto text-[11px] h-6 min-w-0 px-2"
                onPress={bomAI.dismissPendingDoors}
              >
                ปิด
              </Button>
            </div>
          )}
          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  1
                </Chip>
                <span className="font-light text-sm">📝 ข้อมูลลูกค้า</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  name="customerPO"
                  label="PO ลูกค้า"
                  labelPlacement="outside"
                  placeholder="กรอก PO"
                  variant="shadow"
                  size="sm"
                  value={customerPO}
                  onChange={(e) => setCustomerPO(e.target.value)}
                />
                <Input
                  name="orderQty"
                  type="number"
                  label="จำนวนสั่ง"
                  labelPlacement="outside"
                  placeholder="กรอกจำนวน"
                  variant="bordered"
                  size="sm"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                />
                <Input
                  name="doorType"
                  label="ประเภทประตู"
                  labelPlacement="outside"
                  placeholder="กรอกประเภท"
                  variant="bordered"
                  size="sm"
                  value={doorType}
                  onChange={(e) => setDoorType(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  name="doorThickness"
                  type="number"
                  label="ความหนา (มม.)"
                  labelPlacement="outside"
                  placeholder="หนา"
                  variant="bordered"
                  size="sm"
                  value={doorThickness}
                  onChange={(e) => setDoorThickness(e.target.value)}
                />
                <Input
                  name="doorWidth"
                  type="number"
                  label="ความกว้าง (มม.)"
                  labelPlacement="outside"
                  placeholder="กว้าง"
                  variant="bordered"
                  size="sm"
                  value={doorWidth}
                  onChange={(e) => setDoorWidth(e.target.value)}
                />
                <Input
                  name="doorHeight"
                  type="number"
                  label="ความสูง (มม.)"
                  labelPlacement="outside"
                  placeholder="สูง"
                  variant="bordered"
                  size="sm"
                  value={doorHeight}
                  onChange={(e) => setDoorHeight(e.target.value)}
                />
              </div>
              <Chip
                color="default"
                variant="flat"
                size="sm"
                className="w-full justify-center"
              >
                สเปค: {formatDimension(doorThickness, doorWidth, doorHeight)}{" "}
                มม.
              </Chip>
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  2
                </Chip>
                <span className="font-light text-sm">🎨 วัสดุผิว</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  name="surfaceMaterial"
                  label="ประเภทวัสดุ"
                  labelPlacement="outside"
                  placeholder="กรอกประเภทวัสดุ"
                  variant="shadow"
                  size="sm"
                  value={surfaceMaterial}
                  onChange={(e) => setSurfaceMaterial(e.target.value)}
                />
                <Input
                  name="surfaceThickness"
                  type="number"
                  label="ความหนา/แผ่น (มม.)"
                  labelPlacement="outside"
                  placeholder="หนา"
                  variant="bordered"
                  size="sm"
                  value={surfaceThickness}
                  onChange={(e) => setSurfaceThickness(e.target.value)}
                />
                <Input
                  name="surfacePrice"
                  type="number"
                  label="ราคา (บาท)"
                  labelPlacement="outside"
                  placeholder="ราคา"
                  variant="bordered"
                  size="sm"
                  value={surfacePrice}
                  onChange={(e) => setSurfacePrice(e.target.value)}
                />
              </div>
              <Divider />
              <div className="flex flex-col gap-2 text-[13px] p-2">
                <div className="flex justify-between">
                  <span>วัสดุ:</span>
                  <span className="font-light text-foreground">
                    {surfaceMaterial || "ไม่ระบุ"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>วัสดุผิว:</span>
                  <span>
                    {surfaceThickness || 0} มม. × 2 ={" "}
                    {(parseFloat(surfaceThickness) || 0) * 2} มม.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>กาว:</span>
                  <span>
                    {GLUE_THICKNESS} มม. × 2 = {GLUE_THICKNESS * 2} มม.
                  </span>
                </div>
                <Divider className="" />
                <div className="flex justify-between font-light">
                  <span>รวม:</span>
                  <span>{results.totalSurfaceThickness} มม.</span>
                </div>
                <div className="flex justify-between font-light">
                  <span>ความหนากรอบที่ต้องการ:</span>
                  <span className="text-foreground">
                    {results.frameThickness} มม.
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  3
                </Chip>
                <span className="font-light text-sm">🪵 กรอบไม้ (ERP)</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              {frameCandidates.length === 0 && results.frameThickness > 0 && (
                <Chip color="default" variant="shadow" className="w-full">
                  ⚠️ ไม่พบไม้ที่เหมาะสมสำหรับความหนา {results.frameThickness}มม.
                </Chip>
              )}

              {frameCandidates.length > 0 && (
                <div className="flex flex-col gap-2 p-2">
                  <span className="text-[13px] font-light">
                    ไม้ที่เหมาะสม (เรียงจากดีที่สุด)
                  </span>
                  {frameCandidates.map((candidate, idx) => {
                    const f = candidate.frame;
                    const isSelected = selectedFrameCode
                      ? candidate.allFrames.some(
                          (af) => af.code === selectedFrameCode,
                        )
                      : idx === 0;
                    const isRecommended = candidate.allFrames.some(
                      (af) => af.code === frameLengthOptions?.recommendedFrameCode,
                    );
                    return (
                      <div
                        key={`${candidate.frameType}-${candidate.strategy}`}
                        className={`flex flex-col gap-1 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary-50"
                            : isRecommended
                              ? "border-success-300 bg-success-50 hover:border-success-400"
                              : "border-border bg-default-50 hover:border-border"
                        }`}
                        onClick={() => setSelectedFrameCode(f.code)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isSelected && (
                              <Chip color="primary" variant="solid" size="sm">
                                เลือก
                              </Chip>
                            )}
                            {isRecommended && (
                              <Chip color="success" variant="flat" size="sm">
                                💰 ถูกที่สุด
                              </Chip>
                            )}
                            <span className="font-light text-[13px]">
                              {candidate.frameTypeLabel}
                            </span>
                          </div>
                          <span className="text-[13px] font-light text-foreground">
                            ฿{(f.unitCost || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-foreground">
                          <span>{f.displaySize}</span>
                          <span>
                            ใช้จริง: {f.useThickness}×{f.useWidth} mm
                          </span>
                          <span>
                            สต็อก: {(f.inventory || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {f.isFlipped && (
                            <Chip color="warning" variant="flat" size="sm">
                              พลิก
                            </Chip>
                          )}
                          {f.planeAmount > 0 && (
                            <Chip color="secondary" variant="flat" size="sm">
                              ไส {f.planeAmount} มม.
                            </Chip>
                          )}
                          {f.needSplice && (
                            <Chip color="danger" variant="flat" size="sm">
                              ต่อ {f.spliceCount} ชิ้น
                            </Chip>
                          )}
                        </div>
                        {isSelected && candidate.allFrames.length > 1 && (
                          <div className="mt-2">
                            <Select
                              label="เลือกขนาดอื่น"
                              size="sm"
                              variant="shadow"
                              selectedKeys={
                                selectedFrameCode ? [selectedFrameCode] : []
                              }
                              onSelectionChange={(keys) =>
                                setSelectedFrameCode([...keys][0] || "")
                              }
                            >
                              {candidate.allFrames.map((af) => {
                                const isRecLen =
                                  af.code === frameLengthOptions?.recommendedFrameCode;
                                return (
                                  <SelectItem
                                    key={af.code}
                                    textValue={af.displaySize}
                                  >
                                    {af.displaySize} — ฿
                                    {(af.unitCost || 0).toLocaleString()}
                                    {isRecLen ? " ✓ แนะนำ" : ""}
                                  </SelectItem>
                                );
                              })}
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {frameLengthOptions?.potentialSavings > 0 &&
                frameLengthOptions?.recommendedOption && (
                  <div className="flex flex-col gap-2 p-3 bg-success-50 rounded-lg border border-success-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-light text-success-700">
                        💡 พบตัวเลือกที่ถูกกว่า
                      </span>
                      <Chip color="success" variant="flat" size="sm">
                        ประหยัด ฿
                        {frameLengthOptions.potentialSavings.toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 },
                        )}
                      </Chip>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-light">
                          {frameLengthOptions.recommendedOption.frame.displaySize}
                        </span>
                        <span className="text-muted-foreground">
                          {frameLengthOptions.recommendedOption.totalStocks} ท่อน ·{" "}
                          {frameLengthOptions.recommendedOption.efficiency}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-light text-success-700">
                          ฿
                          {frameLengthOptions.recommendedOption.totalCost.toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                        </div>
                        <div className="text-success-600 text-[11px]">
                          ฿
                          {frameLengthOptions.recommendedOption.costPerDoor.toFixed(2)}
                          /บาน
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() =>
                        setSelectedFrameCode(
                          frameLengthOptions.recommendedFrameCode,
                        )
                      }
                    >
                      เลือกตัวเลือกนี้
                    </Button>
                  </div>
                )}

              <Divider />

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-light">ด้านที่ซ้อนกรอบ</span>
                <div className="flex flex-wrap gap-2">
                  {DOUBLE_FRAME_SIDES.map(({ key, label }) => (
                    <Button
                      key={key}
                      color={doubleFrameSides[key] ? "default" : "default"}
                      variant={doubleFrameSides[key] ? "shadow" : "bordered"}
                      size="md"
                      radius="md"
                      onPress={() => handleToggleDoubleSide(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Select
                name="doubleFrameCount"
                label="จำนวนชั้นซ้อน/ด้าน"
                labelPlacement="outside"
                placeholder="กรุณาเลือก"
                variant="shadow"
                size="sm"
                selectedKeys={doubleFrameCount ? [doubleFrameCount] : []}
                onSelectionChange={(keys) =>
                  setDoubleFrameCount([...keys][0] || "")
                }
              >
                {DOUBLE_FRAME_COUNT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value}>{opt.label}</SelectItem>
                ))}
              </Select>

              {doubleConfigSummary && (
                <Chip color="default" variant="shadow" className="w-full">
                  {doubleConfigSummary}
                </Chip>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  4
                </Chip>
                <span className="font-light text-sm">➖ คานขวาง</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              {isNoRailCoreType ? (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <Chip color="default" variant="shadow" size="md">
                    ⚠️ ไส้ประเภท {coreCalculation?.coreType?.label || coreType}{" "}
                    ไม่มีคานขวางตรงกลาง
                  </Chip>
                  <span className="text-muted-foreground">
                    ไส้เต็มแผ่น มีกรอบเฉพาะซ้าย ขวา บน ล่าง
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>จำนวนช่อง:</span>
                    <span className="font-light text-foreground">
                      {results.railSections} ช่อง ({results.railSections - 1}{" "}
                      คานขวาง)
                    </span>
                  </div>

                  {doorHeight && parseFloat(doorHeight) >= 2400 && (
                    <Chip color="default" variant="shadow" size="md">
                      ⚡ ความสูงประตูเกิน 2400มม. → แบ่งอัตโนมัติเป็น 4 ช่อง
                    </Chip>
                  )}

                  {results.railsAdjusted && (
                    <Chip color="default" variant="shadow" size="md">
                      🔄 ปรับตำแหน่งคานขวางอัตโนมัติเพื่อหลีกเลี่ยงบล็อกล็อค
                    </Chip>
                  )}

                  <div className="flex justify-between">
                    <span>ขนาดคานขวาง:</span>
                    <span className="font-light text-foreground">
                      {coreType === "particle_strips"
                        ? `${coreCalculation.stripThickness || 12} มม. (ตัดจากแผ่นปาร์ติเคิล)`
                        : `${currentFrame.useThickness || 0}×${currentFrame.useWidth || 0} มม.`}
                    </span>
                  </div>

                  {coreType !== "particle_strips" && (
                    <span className="text-sm text-muted-foreground">
                      (ใช้ไม้เดียวกับกรอบ)
                    </span>
                  )}
                  {coreType === "particle_strips" && (
                    <span className="text-sm text-muted-foreground">
                      (ใช้แผ่นปาร์ติเคิลแทนคานขวาง)
                    </span>
                  )}

                  <Divider className="" />

                  {results.railPositions.map((pos, idx) => {
                    const wasAdjusted =
                      results.railPositionsOriginal &&
                      pos !== results.railPositionsOriginal[idx];
                    return (
                      <div key={idx} className="flex justify-between">
                        <span>ตำแหน่งที่ {idx + 1}:</span>
                        <span>
                          {pos} มม.{" "}
                          {wasAdjusted && (
                            <span className="text-sm">
                              (เดิม {results.railPositionsOriginal[idx]})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  5
                </Chip>
                <span className="font-light text-sm">🔒 บล็อกล็อค</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  name="lockBlockPiecesPerSide"
                  label="จำนวนชิ้น/ด้าน"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือก"
                  variant="shadow"
                  size="sm"
                  selectedKeys={
                    lockBlockPiecesPerSide ? [lockBlockPiecesPerSide] : []
                  }
                  onSelectionChange={(keys) =>
                    setLockBlockPiecesPerSide([...keys][0] || "")
                  }
                >
                  {LOCK_BLOCK_PIECES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value}>{opt.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  name="lockBlockPosition"
                  label="ตำแหน่งบล็อกล็อค"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือก"
                  variant="bordered"
                  size="sm"
                  selectedKeys={lockBlockPosition ? [lockBlockPosition] : []}
                  onSelectionChange={(keys) =>
                    setLockBlockPosition([...keys][0] || "")
                  }
                >
                  {LOCK_BLOCK_POSITIONS.map((pos) => (
                    <SelectItem
                      key={pos.value}
                      textValue={`${pos.label} (${pos.value === "both" ? `${piecesPerSide * 2} ชิ้น` : `${piecesPerSide} ชิ้น`})`}
                    >
                      {pos.label} (
                      {pos.value === "both"
                        ? `${piecesPerSide * 2} ชิ้น`
                        : `${piecesPerSide} ชิ้น`}
                      )
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {(lockBlockLeft || lockBlockRight) && piecesPerSide > 0 && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>จำนวนรวม:</span>
                    <span className="font-light text-foreground">
                      {results.lockBlockCount} ชิ้น ({lockBlockDesc})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ขนาดบล็อกล็อค:</span>
                    <span className="font-light text-foreground">
                      {currentFrame.useThickness || 0}×
                      {currentFrame.useWidth || 0}×{LOCK_BLOCK_HEIGHT} mm
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    (ใช้ไม้เดียวกับกรอบ)
                  </span>
                  <Divider className="" />
                  <div className="flex justify-between text-foreground">
                    <span>ขอบบน:</span>
                    <span>{results.lockBlockTop} มม. จากพื้น</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>กลาง:</span>
                    <span>{results.lockBlockPosition} มม. จากพื้น</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>ขอบล่าง:</span>
                    <span>{results.lockBlockBottom} มม. จากพื้น</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  6
                </Chip>
                <span className="font-light text-sm">🧱 วัสดุไส้ประตู</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <Select
                name="coreType"
                label="ประเภทไส้"
                labelPlacement="outside"
                placeholder="กรุณาเลือก"
                variant="shadow"
                size="sm"
                selectedKeys={coreType ? [coreType] : []}
                onSelectionChange={(keys) => setCoreType([...keys][0] || "")}
              >
                {CORE_TYPE_CONFIG.map((core) => (
                  <SelectItem key={core.value}>{core.label}</SelectItem>
                ))}
              </Select>

              {coreType && (
                <Select
                  name="coreItem"
                  label="เลือกวัสดุไส้"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือก"
                  variant="bordered"
                  size="sm"
                  selectedKeys={selectedCoreCode ? [selectedCoreCode] : []}
                  onSelectionChange={(keys) =>
                    setSelectedCoreCode([...keys][0] || "")
                  }
                >
                  {availableCoreItems.map((item) => (
                    <SelectItem
                      key={item.code}
                      textValue={`${item.desc} — ฿${(item.unitCost || 0).toLocaleString()}`}
                    >
                      {item.desc} — ฿{(item.unitCost || 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {selectedCoreItem && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-primary-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>รหัส:</span>
                    <span className="font-light text-foreground">
                      {selectedCoreItem.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>รายละเอียด:</span>
                    <span className="font-light text-foreground">
                      {selectedCoreItem.desc}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ราคา:</span>
                    <span className="font-light text-foreground">
                      ฿{(selectedCoreItem.unitCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>สต็อก:</span>
                    <span className="font-light text-foreground">
                      {(selectedCoreItem.inventory || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {coreType && coreCalculation.coreType && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>ประเภท:</span>
                    <span className="font-light text-foreground">
                      {coreCalculation.coreType.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>รูปแบบ:</span>
                    <span className="font-light">
                      {coreCalculation.isSolid ? "เต็มแผ่น" : "แถบ"}
                      {coreCalculation.isFullPanelCore && " (ไม่มีคานขวาง)"}
                    </span>
                  </div>

                  {!coreCalculation.isSolid && (
                    <>
                      <Divider className="" />
                      <div className="flex justify-between">
                        <span>ระยะขอบ:</span>
                        <span>{coreCalculation.edgePadding || 40} มม.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ความหนาแถบ:</span>
                        <span>{coreCalculation.stripThickness} มม.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ระยะห่างแถบ:</span>
                        <span>{coreCalculation.stripSpacing} มม.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>คอลัมน์:</span>
                        <span className="font-light text-foreground">
                          {coreCalculation.columns} คอลัมน์
                          {coreCalculation.coreType?.value ===
                            "particle_strips" &&
                            doorWidth && (
                              <span className="text-sm font-light text-muted-foreground">
                                ({doorWidth}/10+1)
                              </span>
                            )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>แถว:</span>
                        <span>{coreCalculation.rows} แถว</span>
                      </div>

                      {coreCalculation.coreType?.value === "particle_strips" &&
                        coreCalculation.damPieces?.length > 0 && (
                          <div className="flex justify-between">
                            <span>คานขวางปาร์ติเคิล:</span>
                            <span className="font-light text-foreground">
                              {coreCalculation.damPieces.length} ชิ้น
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  <Divider className="" />
                  <div className="flex justify-between font-light">
                    <span>จำนวนชิ้นรวม:</span>
                    <span className="text-foreground">
                      {coreCalculation.totalPieces} pcs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>พื้นที่ไส้:</span>
                    <span>
                      {coreCalculation.coreWidth} × {coreCalculation.coreHeight}{" "}
                      มม.
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  7
                </Chip>
                <span className="font-light text-sm">📐 การทำขอบประตู</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="flex items-center justify-between p-2">
                <span className="text-[13px] font-light">ทำขอบประตู</span>
                <Switch
                  isSelected={edgeBanding}
                  onValueChange={setEdgeBanding}
                  size="sm"
                />
              </div>

              {edgeBanding && (
                <div className="flex flex-col gap-3 p-2">
                  <div className="flex flex-col xl:flex-row gap-2">
                    <Input
                      name="edgeMaterial"
                      label="วัสดุขอบ"
                      labelPlacement="outside"
                      placeholder="กรอกประเภทวัสดุขอบ"
                      color="default"
                      variant="shadow"
                      size="md"
                      radius="md"
                      value={edgeMaterial}
                      onChange={(e) => setEdgeMaterial(e.target.value)}
                    />
                    <Input
                      name="edgePrice"
                      type="number"
                      label="ราคา (บาท)"
                      labelPlacement="outside"
                      placeholder="กรอกราคา"
                      color="default"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={edgePrice}
                      onChange={(e) => setEdgePrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-light">
                      ด้านที่ทำขอบ
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "top", label: "บน" },
                        { key: "bottom", label: "ล่าง" },
                        { key: "left", label: "ซ้าย" },
                        { key: "right", label: "ขวา" },
                      ].map(({ key, label }) => (
                        <Button
                          key={key}
                          color={edgeSides[key] ? "default" : "default"}
                          variant={edgeSides[key] ? "shadow" : "bordered"}
                          size="md"
                          radius="md"
                          onPress={() =>
                            setEdgeSides((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                        >
                          {edgeSides[key] ? `✅ ${label}` : label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  8
                </Chip>
                <span className="font-light text-sm">🔩 เจาะใส่อุปกรณ์</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="flex items-center justify-between p-2">
                <span className="text-[13px] font-light">เจาะอุปกรณ์</span>
                <Switch
                  isSelected={drilling}
                  onValueChange={setDrilling}
                  size="sm"
                />
              </div>

              {drilling && (
                <div className="flex flex-col gap-3 p-2">
                  {[
                    { key: "doorCloser", label: "โช็ค" },
                    { key: "handle", label: "มือจับ" },
                    { key: "peephole", label: "ตาแมว" },
                    { key: "hinge", label: "บานพับ" },
                    { key: "dropSeal", label: "Drop Seal" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        drillItems[key].checked
                          ? "border-primary bg-primary-50"
                          : "border-border bg-default-50"
                      }`}
                    >
                      <Switch
                        isSelected={drillItems[key].checked}
                        onValueChange={(val) =>
                          setDrillItems((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], checked: val },
                          }))
                        }
                        size="sm"
                      />
                      <span className="text-[13px] font-light min-w-[60px]">
                        {label}
                      </span>
                      {drillItems[key].checked && (
                        <Input
                          type="number"
                          label="ราคา (บาท)"
                          labelPlacement="inside"
                          placeholder="0"
                          color="default"
                          variant="shadow"
                          size="sm"
                          radius="md"
                          className="max-w-[150px]"
                          value={drillItems[key].price}
                          onChange={(e) =>
                            setDrillItems((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], price: e.target.value },
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        {/* end left form column */}

        <div className="xl:col-span-2 flex flex-col gap-3">
          {/* Drawing - at top of right column so user sees live updates */}
          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">📐</span>
                <span className="font-light text-sm">แบบวาด</span>
              </div>
            </CardHeader>
            <CardBody className="bg-default-50 p-2 min-h-[600px]">
              {isDataComplete ? (
                <EnhancedEngineeringDrawing
                  results={results}
                  coreCalculation={coreCalculation}
                  surfaceMaterial={surfaceMaterial}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-96 gap-2">
                  <RulerDimensionLine className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm font-light text-foreground">
                    กรุณากรอกข้อมูลประตู
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    กรอก ความหนา (T), ความกว้าง (W), ความสูง (H)
                  </p>
                  <div className="flex gap-2">
                    <Chip
                      color={doorThickness ? "success" : "default"}
                      variant="flat"
                    >
                      T: {doorThickness || "—"}
                    </Chip>
                    <Chip
                      color={doorWidth ? "success" : "default"}
                      variant="flat"
                    >
                      W: {doorWidth || "—"}
                    </Chip>
                    <Chip
                      color={doorHeight ? "success" : "default"}
                      variant="flat"
                    >
                      H: {doorHeight || "—"}
                    </Chip>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="flat" size="sm">
                  9
                </Chip>
                <span className="font-light text-sm">💰 สรุปราคา</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                <span className="font-light text-foreground">
                  รายละเอียดต้นทุน / บาน
                </span>
                <div className="flex justify-between">
                  <span>
                    กรอบไม้ ({priceSummary.frameStocks} ท่อน × ฿
                    {priceSummary.frameUnitCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ):
                  </span>
                  <span>
                    ฿
                    {priceSummary.frameCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>วัสดุผิว (×2 ด้าน):</span>
                  <span>
                    ฿
                    {priceSummary.surface.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {priceSummary.coreStripsPerSheet > 0
                      ? `วัสดุไส้ (${priceSummary.coreStrips} เส้น / ${priceSummary.coreStripsPerSheet} เส้น/แผ่น × ฿${priceSummary.coreUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):`
                      : `วัสดุไส้ (${priceSummary.coreQtyLabel} × ฿${priceSummary.coreUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):` }
                  </span>
                  <span>
                    ฿
                    {priceSummary.core.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {priceSummary.coreStripsPerSheet > 0 && priceSummary.qty > 1 && (() => {
                  const { coreStrips, coreStripsPerSheet, coreUnitCost, qty } = priceSummary;
                  const totalStrips = coreStrips * qty;
                  const sheetsNeeded = Math.ceil(totalStrips / coreStripsPerSheet);
                  const batchTotal = sheetsNeeded * coreUnitCost;
                  return (
                    <div className="text-sm text-muted-foreground pl-2 space-y-0.5 mb-1">
                      <div>= {qty} บาน × {coreStrips} เส้น = {totalStrips.toLocaleString()} เส้น</div>
                      <div>= ceil({totalStrips.toLocaleString()} ÷ {coreStripsPerSheet}) = {sheetsNeeded.toLocaleString()} แผ่น</div>
                      <div>= {sheetsNeeded.toLocaleString()} × ฿{coreUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {qty} บาน = ฿{priceSummary.core.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/บาน</div>
                    </div>
                  );
                })()}
                {priceSummary.edge > 0 && (
                  <div className="flex justify-between">
                    <span>ทำขอบประตู:</span>
                    <span>
                      ฿
                      {priceSummary.edge.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {priceSummary.drillCost > 0 && (
                  <div className="flex justify-between">
                    <span>เจาะอุปกรณ์:</span>
                    <span>
                      ฿
                      {priceSummary.drillCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <Divider />
                <div className="flex justify-between font-light text-foreground">
                  <span>ต้นทุนรวม / บาน:</span>
                  <span>
                    ฿
                    {priceSummary.totalPerDoor.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ต้นทุน + 10% / บาน:</span>
                  <span className="font-light">
                    ฿
                    {priceSummary.plus10.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>กำไร 20% / บาน:</span>
                  <span className="font-light">
                    ฿
                    {priceSummary.profit20.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap">กำไรตามใจ / บาน:</span>
                  <Input
                    type="number"
                    placeholder="กรอกกำไร (บาท)"
                    size="sm"
                    variant="shadow"
                    className="max-w-[140px]"
                    value={customMargin}
                    onChange={(e) => setCustomMargin(e.target.value)}
                  />
                  <span className="font-light whitespace-nowrap">
                    ฿
                    {priceSummary.customPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {priceSummary.qty > 0 && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-light text-foreground">
                      รวมทั้งหมด ({priceSummary.qty} บาน)
                    </span>
                    {priceSummary.frameSavings > 0 && (
                      <Chip color="success" variant="flat" size="sm">
                        ✂️ ประหยัดไม้ ฿
                        {priceSummary.frameSavings.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </Chip>
                    )}
                  </div>
                  {priceSummary.frameSavings > 0 && (
                    <div className="flex justify-between text-success-600">
                      <span>
                        กรอบไม้รวม ({priceSummary.frameStocksTotal} ท่อน ×{" "}
                        {priceSummary.qty} บาน):
                      </span>
                      <span className="font-light">
                        ประหยัด{" "}
                        {(
                          (priceSummary.frameSavings /
                            (priceSummary.frameStocksTotal *
                              priceSummary.frameUnitCost +
                              priceSummary.frameSavings)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-light text-foreground">
                    <span>ต้นทุนรวม:</span>
                    <span>
                      ฿
                      {priceSummary.grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ต้นทุน + 10%:</span>
                    <span className="font-light">
                      ฿
                      {priceSummary.grandPlus10.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>กำไร 20%:</span>
                    <span className="font-light">
                      ฿
                      {priceSummary.grandProfit20.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {customMargin && (
                    <div className="flex justify-between">
                      <span>กำไรตามใจ:</span>
                      <span className="font-light">
                        ฿
                        {priceSummary.grandCustom.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="w-full border border-border">
            <CardHeader className="border-b border-border bg-default-50">
              <div className="flex items-center gap-2">
                <span className="font-light text-sm">📋 สรุปโครงสร้าง</span>
              </div>
            </CardHeader>
            <CardBody className="gap-3 p-4">
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="p-2 bg-default-100 rounded-lg">
                  <span className="block text-foreground">สเปคประตู:</span>
                  <span className="font-light">
                    {formatDimension(doorThickness, doorWidth, doorHeight)} mm
                  </span>
                </div>
                <div className="p-2 bg-default-100 rounded-lg">
                  <span className="block text-foreground">ผิว:</span>
                  <span className="font-light text-foreground">
                    {surfaceMaterial || "ไม่ระบุ"} {surfaceThickness || 0}mm +
                    Glue {GLUE_THICKNESS}mm (×2)
                  </span>
                </div>
                <div className="p-2 bg-default-50 rounded-lg">
                  <span className="block text-foreground">กรอบไม้:</span>
                  <span className="font-light text-foreground">
                    {currentFrame.useThickness || "-"}×
                    {currentFrame.useWidth || "-"} mm
                  </span>
                  {currentFrame.isFlipped && (
                    <span className="block text-sm text-foreground">
                      🔄 พลิก
                    </span>
                  )}
                  {currentFrame.planeAmount > 0 && (
                    <span className="block text-sm text-foreground">
                      🪚 ไส {currentFrame.planeAmount}มม.
                    </span>
                  )}
                </div>
                <div className="p-2 bg-default-50 rounded-lg">
                  <span className="block text-foreground">คานขวาง:</span>
                  {isNoRailCoreType ? (
                    <span className="font-light text-foreground">
                      ไม่มี (ไส้เต็มแผ่น)
                    </span>
                  ) : (
                    <>
                      <span className="font-light text-foreground">
                        {results.railSections - 1} ชิ้น ({results.railSections}{" "}
                        ช่อง)
                      </span>
                      {coreType === "particle_strips" && (
                        <span className="block text-sm text-foreground">
                          ใช้แผ่นปาร์ติเคิลแทนคานขวาง
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="col-span-2 p-2 bg-default-50 rounded-lg">
                  <span className="block text-foreground">บล็อกล็อค:</span>
                  <span className="font-light text-foreground">
                    {results.lockBlockCount} ชิ้น ({lockBlockDesc})
                  </span>
                </div>
                {coreType && coreCalculation.coreType && (
                  <div className="col-span-2 p-2 bg-default-50 rounded-lg">
                    <span className="block text-foreground">ไส้ประตู:</span>
                    <span className="font-light text-foreground">
                      {coreCalculation.coreType.label} (
                      {coreCalculation.totalPieces} ชิ้น)
                    </span>
                    {!coreCalculation.isSolid && (
                      <span className="block text-sm text-foreground">
                        {coreCalculation.columns} คอลัมน์ ×{" "}
                        {coreCalculation.rows} แถว, ความหนาแถบ{" "}
                        {coreCalculation.stripThickness}mm spacing{" "}
                        {coreCalculation.stripSpacing}mm
                      </span>
                    )}
                    {coreCalculation.isFullPanelCore && (
                      <span className="block text-sm text-foreground">
                        ⚠️ ไส้เต็มแผ่น ไม่มีคานขวาง
                      </span>
                    )}
                  </div>
                )}
              </div>
              {doubleConfigSummary && (
                <div className="p-2 bg-default-50 rounded-lg text-[13px] text-foreground">
                  {doubleConfigSummary}
                </div>
              )}
              {selectedFrameCode && (
                <div className="p-2 bg-default-50 rounded-lg text-[13px]">
                  <span className="font-light text-foreground">
                    รหัส ERP: {selectedFrameCode}
                  </span>
                  <span className="block text-sm">{currentFrame.desc}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {isDataComplete ? (
            <Card shadow="none" className="w-full border border-border">
              <CardHeader className="border-b border-border bg-default-50">
                <div className="flex items-center gap-2">
                  <span className="font-light text-sm">
                    ✂️ แผนตัดไม้ (เพิ่มประสิทธิภาพ)
                  </span>
                </div>
              </CardHeader>
              <CardBody className="gap-3 p-4">
                {isNoRailCoreType && (
                  <Chip color="default" variant="shadow" className="w-full">
                    ⚠️ ไส้ {coreCalculation?.coreType?.label}: ไม่มีคานขวาง
                    (ไส้เต็มแผ่น)
                  </Chip>
                )}

                {coreType === "particle_strips" && (
                  <Chip color="default" variant="shadow" className="w-full">
                    คานขวาง: ใช้แผ่นปาร์ติเคิลแทน (ไม่รวมในแผนตัดไม้กรอบ)
                  </Chip>
                )}

                {cuttingPlan.needSplice && (
                  <div className="p-2 bg-default-50 rounded-lg">
                    <div className="flex items-center gap-2 font-light text-foreground">
                      <span>🔗</span>
                      <span>ต้องต่อเสา</span>
                    </div>
                    <div className="text-[13px] text-foreground">
                      <div>
                        • จำนวนชิ้นที่ต้องต่อ: {cuttingPlan.spliceCount} ชิ้น
                      </div>
                      <div>
                        • ระยะทับซ้อน: {cuttingPlan.spliceOverlap} มม. ต่อจุดต่อ
                      </div>
                      <div className="text-sm opacity-80">
                        ใช้กาว + ตะปูที่จุดต่อ
                      </div>
                    </div>
                  </div>
                )}

                {/* Single-door stats */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-1.5 bg-default-100 text-sm font-light text-foreground">
                    1 บาน
                  </div>
                  <div className="grid grid-cols-4 gap-0 divide-x divide-default-200">
                    <div className="p-2 text-center">
                      <div className="font-light text-sm text-foreground">{cuttingPlan.totalStocks}</div>
                      <div className="text-[11px] text-muted-foreground">ท่อนไม้ที่ใช้</div>
                    </div>
                    <div className="p-2 text-center">
                      <div className="font-light text-sm text-foreground">{cuttingPlan.efficiency}%</div>
                      <div className="text-[11px] text-muted-foreground">ประสิทธิภาพ</div>
                    </div>
                    <div className="p-2 text-center">
                      <div className="font-light text-sm text-foreground">{cuttingPlan.usedLength}</div>
                      <div className="text-[11px] text-muted-foreground">ใช้จริง (มม.)</div>
                    </div>
                    <div className="p-2 text-center">
                      <div className="font-light text-sm text-muted-foreground">{cuttingPlan.totalWaste}</div>
                      <div className="text-[11px] text-muted-foreground">เศษ (มม.)</div>
                    </div>
                  </div>
                </div>

                {/* Batch stats */}
                {cuttingPlan.batch && (
                  <div className="rounded-lg border border-success-200 overflow-hidden">
                    <div className="px-3 py-1.5 bg-success-50 text-sm font-light text-success-700 flex items-center justify-between">
                      <span>📦 ทั้ง order {cuttingPlan.batch.orderQty} บาน (ตัดรวม)</span>
                      {cuttingPlan.batch.savedStocks > 0 && (
                        <span className="text-success-600">ประหยัดได้ {cuttingPlan.batch.savedStocks} ท่อน</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-0 divide-x divide-default-200">
                      <div className="p-2 text-center">
                        <div className="font-light text-sm text-success-700">{cuttingPlan.batch.totalStocks}</div>
                        <div className="text-[11px] text-muted-foreground">ท่อนทั้งหมด (ตัดรวม)</div>
                      </div>
                      <div className="p-2 text-center">
                        <div className="font-light text-sm text-muted-foreground line-through">{cuttingPlan.batch.naiveStocksTotal}</div>
                        <div className="text-[11px] text-muted-foreground">ถ้าตัดแยกบาน ({cuttingPlan.totalStocks}×{cuttingPlan.batch.orderQty})</div>
                      </div>
                      <div className="p-2 text-center">
                        <div className="font-light text-sm text-success-600">{cuttingPlan.batch.efficiency}%</div>
                        <div className="text-[11px] text-muted-foreground">ประสิทธิภาพรวม</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-1 border-border rounded-lg overflow-hidden">
                  <div className="p-2 text-sm font-light bg-default-100">
                    📋 รายการชิ้นส่วน (เผื่อรอยเลื่อย {cuttingPlan.sawKerf} มม.)
                  </div>
                  <div>
                    {cuttingPlan.cutPieces.map((piece, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 text-sm ${piece.isSplice ? "bg-default-50" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <Chip
                            color={piece.color}
                            variant="shadow"
                            size="md"
                            className="w-4 h-4 p-2"
                          />
                          <span className="font-light">{piece.name}</span>
                          {piece.isSplice && (
                            <Chip color="default" variant="shadow" size="md">
                              Splice
                            </Chip>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            {piece.length} มม.{" "}
                            <span className="text-muted-foreground">
                              (ตัด {piece.cutLength ?? piece.length} มม.)
                            </span>
                          </span>
                          <span className="font-light">×{piece.qty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const isBatch = cuttingPlan.batch?.stocks?.length > 0;
                  const displayStocks = isBatch ? cuttingPlan.batch.stocks : cuttingPlan.stocks;
                  const totalStocksDisplay = isBatch ? cuttingPlan.batch.totalStocks : cuttingPlan.totalStocks;
                  const efficiencyDisplay = isBatch ? cuttingPlan.batch.efficiency : cuttingPlan.efficiency;
                  const framePageCount = Math.ceil(displayStocks.length / FRAME_PAGE_SIZE);
                  const framePage = Math.min(framePlanPage, framePageCount);
                  const framePageStocks = displayStocks.slice((framePage - 1) * FRAME_PAGE_SIZE, framePage * FRAME_PAGE_SIZE);
                  const colorMap = {
                    primary: "#4456E9",
                    secondary: "#FF8A00",
                    warning: "#FFB441",
                    danger: "#FF0076",
                    success: "#10B981",
                  };
                  return (
                    <>
                      <div className="border-1 border-border rounded-lg overflow-hidden">
                        <div className="p-2 text-sm font-light bg-default-100 flex items-center justify-between">
                          <span>🪵 แผนตัดไม้ (ท่อนยาว {cuttingPlan.stockLength}มม. × {totalStocksDisplay} ท่อน)</span>
                          {isBatch && (
                            <span className="text-muted-foreground font-light">📦 {cuttingPlan.batch.orderQty} บาน</span>
                          )}
                        </div>
                        <div className="p-2 space-y-3">
                          {framePageStocks.map((stock, idx) => {
                            const stockIdx = (framePage - 1) * FRAME_PAGE_SIZE + idx;
                            return (
                              <div key={stockIdx} className="space-y-1">
                                <div className="text-sm text-foreground">ท่อนที่ {stockIdx + 1}</div>
                                <div className="relative h-8 rounded overflow-hidden bg-default-100">
                                  {(() => {
                                    let offset = 0;
                                    return stock.pieces.map((piece, pieceIdx) => {
                                      const pieceCut = piece.cutLength ?? piece.length;
                                      const width = (pieceCut / stock.length) * 100;
                                      const kerfWidth = (cuttingPlan.sawKerf / stock.length) * 100;
                                      const left = offset;
                                      offset += width + kerfWidth;
                                      return (
                                        <React.Fragment key={pieceIdx}>
                                          <div
                                            className="absolute h-full flex items-center justify-center text-[8px] font-light overflow-hidden text-white"
                                            style={{ left: `${left}%`, width: `${width}%`, backgroundColor: colorMap[piece.color] || "#DCDCDC" }}
                                            title={`${piece.name}: cut ${pieceCut}mm (use ${piece.length}mm)`}
                                          >
                                            {width > 8 && <span className="truncate p-2">{pieceCut}</span>}
                                          </div>
                                          {pieceIdx < stock.pieces.length - 1 && (
                                            <div className="absolute h-full bg-default-200" style={{ left: `${left + width}%`, width: `${kerfWidth}%` }} />
                                          )}
                                        </React.Fragment>
                                      );
                                    });
                                  })()}
                                  {stock.remaining > 0 && (
                                    <div
                                      className="absolute right-0 h-full flex items-center justify-center text-[8px] bg-background text-foreground"
                                      style={{ width: `${(stock.remaining / stock.length) * 100}%` }}
                                    >
                                      {stock.remaining > 100 && <span>เศษเหลือ {stock.remaining}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {framePageCount > 1 && (
                          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-default-50">
                            <button
                              className="text-sm px-2 py-1 rounded disabled:opacity-30 hover:bg-default-200 transition-colors"
                              onClick={() => setFramePlanPage(p => Math.max(1, p - 1))}
                              disabled={framePage === 1}
                            >← ก่อนหน้า</button>
                            <span className="text-sm text-muted-foreground">
                              ท่อนที่ {(framePage - 1) * FRAME_PAGE_SIZE + 1}–{Math.min(framePage * FRAME_PAGE_SIZE, displayStocks.length)} / {displayStocks.length}
                            </span>
                            <button
                              className="text-sm px-2 py-1 rounded disabled:opacity-30 hover:bg-default-200 transition-colors"
                              onClick={() => setFramePlanPage(p => Math.min(framePageCount, p + 1))}
                              disabled={framePage === framePageCount}
                            >ถัดไป →</button>
                          </div>
                        )}
                      </div>

                      <div className="p-2">
                        <div className="flex justify-between text-sm">
                          <span>ประสิทธิภาพการใช้ไม้</span>
                          <span className={`font-light text-${getEfficiencyColor(efficiencyDisplay)}`}>
                            {efficiencyDisplay}%
                          </span>
                        </div>
                        <Progress value={parseFloat(efficiencyDisplay)} color={getEfficiencyColor(efficiencyDisplay)} size="md" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0%</span>
                          <span>ดี: ≥80%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Core cutting plan */}
                {priceSummary.coreStripsPerSheet > 0 && (() => {
                  const { coreStrips, coreStripsPerSheet, coreSheetWidth, coreStripCutWidth } = priceSummary;
                  const orderQty = priceSummary.qty || 1;
                  const batchStrips = coreStrips * orderQty;
                  const batchSheets = Math.ceil(batchStrips / coreStripsPerSheet);
                  const batchEfficiency = batchSheets > 0
                    ? ((batchStrips / (batchSheets * coreStripsPerSheet)) * 100).toFixed(1)
                    : "0";

                  // Build sheet data for visualization (cap at 5 sheets for display)
                  const buildSheets = (totalStrips, perSheet) => {
                    const sheets = [];
                    let remaining = totalStrips;
                    while (remaining > 0) {
                      const used = Math.min(remaining, perSheet);
                      sheets.push({ used, waste: perSheet - used });
                      remaining -= used;
                    }
                    return sheets;
                  };

                  const displaySheets = buildSheets(
                    orderQty > 1 ? batchStrips : coreStrips,
                    coreStripsPerSheet,
                  );
                  const corePageCount = Math.ceil(displaySheets.length / CORE_PAGE_SIZE);
                  const corePage = Math.min(corePlanPage, corePageCount);
                  const corePageSheets = displaySheets.slice((corePage - 1) * CORE_PAGE_SIZE, corePage * CORE_PAGE_SIZE);

                  return (
                    <div className="mt-3 border-1 border-border rounded-lg overflow-hidden">
                      <div className="p-2 text-sm font-light bg-default-100 flex items-center justify-between">
                        <span>
                          🧱 แผนตัดใส้ (แผ่น {coreSheetWidth}มม. ÷ {coreStripCutWidth}มม. = {coreStripsPerSheet} เส้น/แผ่น)
                        </span>
                        {orderQty > 1 && (
                          <span className="text-muted-foreground font-light">
                            📦 กลุ่ม {orderQty} บาน: {batchSheets} แผ่น
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-2">
                        {corePageSheets.map((sheet, idx) => {
                          const sheetIdx = (corePage - 1) * CORE_PAGE_SIZE + idx;
                          const usedPct = (sheet.used / coreStripsPerSheet) * 100;
                          const wastePct = (sheet.waste / coreStripsPerSheet) * 100;
                          return (
                            <div key={sheetIdx} className="space-y-0.5">
                              <div className="text-sm text-muted-foreground">
                                แผ่นที่ {sheetIdx + 1}
                                <span className="ml-1 text-muted-foreground">
                                  ({sheet.used} เส้น{sheet.waste > 0 ? ` · เหลือ ${sheet.waste}` : ""})
                                </span>
                              </div>
                              <div className="relative h-6 rounded overflow-hidden bg-default-100">
                                <div
                                  className="absolute h-full flex items-center justify-center text-[8px] font-light text-white"
                                  style={{ width: `${usedPct}%`, backgroundColor: "#D97706" }}
                                  title={`ใช้ ${sheet.used} เส้น`}
                                >
                                  {usedPct > 15 && `${sheet.used} เส้น`}
                                </div>
                                {sheet.waste > 0 && (
                                  <div
                                    className="absolute right-0 h-full flex items-center justify-center text-[8px] text-muted-foreground"
                                    style={{ width: `${wastePct}%` }}
                                  >
                                    {wastePct > 10 && `เศษ ${sheet.waste}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {corePageCount > 1 && (
                        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-default-50">
                          <button
                            className="text-sm px-2 py-1 rounded disabled:opacity-30 hover:bg-default-200 transition-colors"
                            onClick={() => setCorePlanPage(p => Math.max(1, p - 1))}
                            disabled={corePage === 1}
                          >← ก่อนหน้า</button>
                          <span className="text-sm text-muted-foreground">
                            แผ่นที่ {(corePage - 1) * CORE_PAGE_SIZE + 1}–{Math.min(corePage * CORE_PAGE_SIZE, displaySheets.length)} / {displaySheets.length}
                          </span>
                          <button
                            className="text-sm px-2 py-1 rounded disabled:opacity-30 hover:bg-default-200 transition-colors"
                            onClick={() => setCorePlanPage(p => Math.min(corePageCount, p + 1))}
                            disabled={corePage === corePageCount}
                          >ถัดไป →</button>
                        </div>
                      )}
                      <div className="px-2 pb-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>ประสิทธิภาพการใช้แผ่น</span>
                          <span className={`font-light text-${getEfficiencyColor(batchEfficiency)}`}>
                            {batchEfficiency}%
                          </span>
                        </div>
                        <Progress
                          value={parseFloat(batchEfficiency)}
                          color={getEfficiencyColor(batchEfficiency)}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardBody>
            </Card>
          ) : (
            <Card shadow="none" className="w-full border border-border">
              <CardHeader className="border-b border-border bg-default-50">
                <div className="flex items-center gap-2">
                  <span className="font-light text-sm">
                    ✂️ แผนตัดไม้ (เพิ่มประสิทธิภาพ)
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Calculator className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm font-light">
                    กรุณากรอกสเปคประตูให้ครบ
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    ระบบจะคำนวณแผนตัดไม้ให้อัตโนมัติ
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
        {/* end right column */}
      </div>
      {/* end main grid */}
    </div>
  );
};

export default UIDoorBom;
