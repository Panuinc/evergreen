"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  memo,
} from "react";
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
import { useFrames } from "@/hooks/production/useFrames";

const GLUE_THICKNESS = 1;
const LOCK_BLOCK_HEIGHT = 400;
const LOCK_BLOCK_POSITION = 1000;
const CUT_ALLOWANCE = 10;

const NO_RAIL_CORE_TYPES = ["foam", "particle_solid", "honeycomb"];



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

const CORE_TYPES = [
  {
    value: "foam",
    label: "โฟม EPS",
    type: "solid",
    thickness: null,
    spacing: null,
  },
  {
    value: "plywood_strips",
    label: "ไม้อัดเส้น",
    type: "strips",
    thickness: 4,
    spacing: 40,
  },
  {
    value: "particle_solid",
    label: "ไม้ปาร์ติเคิล (แผ่นเต็ม)",
    type: "solid",
    thickness: null,
    spacing: null,
  },
  {
    value: "rockwool",
    label: "ร็อควูล",
    type: "solid",
    thickness: null,
    spacing: null,
  },
  {
    value: "honeycomb",
    label: "รังผึ้ง",
    type: "solid",
    thickness: null,
    spacing: null,
  },
  {
    value: "particle_strips",
    label: "ไม้ปาร์ติเคิลเส้น",
    type: "strips",
    thickness: 12,
    spacing: null,
  },
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

const useFrameSelection = (
  frameType,
  doorThickness,
  surfaceThickness,
  doorHeight,
  erpFrames,
) => {
  return useMemo(() => {
    const S = parseFloat(surfaceThickness) || 0;
    const requiredThickness = doorThickness
      ? parseFloat(doorThickness) - (S + GLUE_THICKNESS) * 2
      : 0;
    const requiredLength = doorHeight ? parseFloat(doorHeight) : 0;
    const frames = (erpFrames && erpFrames[frameType]) || [];

    const filterAndSort = (frameList) =>
      frameList
        .filter((f) => f.length >= requiredLength)
        .sort((a, b) => a.length - b.length);

    const findSpliceable = (frameList) => {
      const sorted = [...frameList].sort((a, b) => b.length - a.length);
      for (const frame of sorted) {
        const spliceOverlap = 100;
        const totalLength = frame.length * 2 - spliceOverlap;
        if (totalLength >= requiredLength) {
          return {
            frame,
            needSplice: true,
            spliceCount: 2,
            spliceOverlap,
            effectiveLength: totalLength,
            splicePosition: Math.round(requiredLength / 2),
          };
        }
      }
      return null;
    };

    const createDisplaySize = (f, isFlipped, planeAmount, needSplice) => {
      const parts = [];
      if (isFlipped) parts.push("พลิก");
      if (planeAmount > 0) parts.push(`ไส ${planeAmount}มม.`);
      if (needSplice) parts.push("ต่อ 2 ชิ้น");
      const suffix = parts.length > 0 ? ` (${parts.join("+")})` : "";
      return isFlipped
        ? `${f.width}×${f.thickness}×${f.length}${suffix}`
        : `${f.thickness}×${f.width}×${f.length}${suffix}`;
    };

    const createFrameResult = (
      frameList,
      isFlipped,
      _planeAmount,
      needSplice = false,
      spliceInfo = null,
    ) => {
      const mapFrame = (f) => {
        const actualPlane = isFlipped
          ? f.width - requiredThickness
          : f.thickness - requiredThickness;
        const plane = Math.max(0, actualPlane);
        return {
          ...f,
          useThickness: isFlipped
            ? f.width - plane
            : f.thickness - plane,
          useWidth: isFlipped ? f.thickness : f.width,
          isFlipped,
          planeAmount: plane,
          needSplice,
          ...(spliceInfo && {
            spliceCount: spliceInfo.spliceCount,
            spliceOverlap: spliceInfo.spliceOverlap,
            splicePosition: spliceInfo.splicePosition,
            effectiveLength: spliceInfo.effectiveLength,
          }),
          displaySize: createDisplaySize(f, isFlipped, plane, needSplice),
        };
      };
      return {
        frames: needSplice
          ? [mapFrame(spliceInfo.frame)]
          : frameList.map(mapFrame),
        needFlip: isFlipped,
        needPlane: _planeAmount > 0,
        needSplice,
      };
    };

    const strategies = [
      () => {
        const exact = filterAndSort(
          frames.filter((f) => f.thickness === requiredThickness),
        );
        return exact.length > 0 ? createFrameResult(exact, false, 0) : null;
      },
      () => {
        const flipExact = filterAndSort(
          frames.filter((f) => f.width === requiredThickness),
        );
        return flipExact.length > 0
          ? createFrameResult(flipExact, true, 0)
          : null;
      },
      () => {
        const thicker = frames
          .filter(
            (f) =>
              f.thickness > requiredThickness && f.length >= requiredLength,
          )
          .sort((a, b) =>
            a.thickness !== b.thickness
              ? a.thickness - b.thickness
              : a.length - b.length,
          );
        return thicker.length > 0
          ? createFrameResult(
              thicker,
              false,
              thicker[0].thickness - requiredThickness,
            )
          : null;
      },
      () => {
        const flipPlane = frames
          .filter(
            (f) => f.width > requiredThickness && f.length >= requiredLength,
          )
          .sort((a, b) =>
            a.width !== b.width ? a.width - b.width : a.length - b.length,
          );
        return flipPlane.length > 0
          ? createFrameResult(
              flipPlane,
              true,
              flipPlane[0].width - requiredThickness,
            )
          : null;
      },
      () => {
        const splice = findSpliceable(
          frames.filter((f) => f.thickness === requiredThickness),
        );
        return splice ? createFrameResult([], false, 0, true, splice) : null;
      },
      () => {
        const splice = findSpliceable(
          frames.filter((f) => f.width === requiredThickness),
        );
        return splice ? createFrameResult([], true, 0, true, splice) : null;
      },
      () => {
        const splice = findSpliceable(
          frames.filter((f) => f.thickness > requiredThickness),
        );
        return splice
          ? createFrameResult(
              [],
              false,
              splice.frame.thickness - requiredThickness,
              true,
              splice,
            )
          : null;
      },
      () => {
        const splice = findSpliceable(
          frames.filter((f) => f.width > requiredThickness),
        );
        return splice
          ? createFrameResult(
              [],
              true,
              splice.frame.width - requiredThickness,
              true,
              splice,
            )
          : null;
      },
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result) return result;
    }

    const maxLength = Math.max(...frames.map((f) => f.length), 0);
    const maxSpliceLength = maxLength > 0 ? maxLength * 2 - 100 : 0;
    return {
      frames: [],
      needFlip: false,
      needPlane: false,
      needSplice: false,
      noMatch: true,
      reason:
        maxLength > 0
          ? `ไม่พบไม้ที่เหมาะสม (ต้องการ ≥${requiredLength}มม., ต่อได้สูงสุด ${maxSpliceLength}มม.)`
          : `ไม่มีไม้ความหนา ${requiredThickness}มม.`,
    };
  }, [frameType, doorThickness, surfaceThickness, doorHeight, erpFrames]);
};

const useCalculations = (params) => {
  const {
    doorThickness,
    doorWidth,
    doorHeight,
    surfaceThickness,
    currentFrame,
    lockBlockLeft,
    lockBlockRight,
    lockBlockPiecesPerSide,
    doubleFrameSides,
    doubleFrameCount,
  } = params;

  return useMemo(() => {
    const T = parseFloat(doorThickness) || 0;
    const W = parseFloat(doorWidth) || 0;
    const H = parseFloat(doorHeight) || 0;
    const S = parseFloat(surfaceThickness) || 0;
    const totalSurfaceThickness = (S + GLUE_THICKNESS) * 2;
    const frameThickness = T - totalSurfaceThickness;
    const F = currentFrame?.useWidth || 0;
    const R = currentFrame?.useThickness || 0;

    const effectiveSides = {
      top: !!(doubleFrameSides?.all || doubleFrameSides?.top),
      bottom: !!(doubleFrameSides?.all || doubleFrameSides?.bottom),
      left: !!(doubleFrameSides?.all || doubleFrameSides?.left),
      right: !!(doubleFrameSides?.all || doubleFrameSides?.right),
      center: !!(doubleFrameSides?.all || doubleFrameSides?.center),
    };

    const numericDoubleCount = parseInt(doubleFrameCount) || 0;
    const hasDoubleFrame =
      numericDoubleCount > 0 && Object.values(effectiveSides).some(Boolean);
    const DF = hasDoubleFrame ? F * numericDoubleCount : 0;
    const totalFrameWidth = F + (hasDoubleFrame ? DF : 0);
    const innerWidth = W - 2 * totalFrameWidth;
    const innerHeight = H - 2 * totalFrameWidth;
    const doorArea = W * H;
    const railSections = H >= 2400 ? 4 : 3;

    const lockBlockZoneTop = LOCK_BLOCK_POSITION - LOCK_BLOCK_HEIGHT / 2;
    const lockBlockZoneBottom = LOCK_BLOCK_POSITION + LOCK_BLOCK_HEIGHT / 2;
    const lockBlockZoneBuffer = 50;
    const avoidZoneTop = lockBlockZoneTop - lockBlockZoneBuffer;
    const avoidZoneBottom = lockBlockZoneBottom + lockBlockZoneBuffer;

    const railPositions = [];
    const railPositionsOriginal = [];
    const railThickness = currentFrame?.useWidth || 50;
    const hasLockBlock = lockBlockLeft || lockBlockRight;

    for (let i = 1; i < railSections; i++) {
      const eqPosition = Math.round((H * i) / railSections);
      railPositionsOriginal.push(eqPosition);
      const railTop = eqPosition + railThickness / 2;
      const railBottom = eqPosition - railThickness / 2;
      const hitLockBlock =
        hasLockBlock &&
        railBottom <= avoidZoneBottom &&
        railTop >= avoidZoneTop;
      if (hitLockBlock) {
        const distToTop = eqPosition - avoidZoneTop;
        const distToBottom = avoidZoneBottom - eqPosition;
        railPositions.push(
          distToTop <= distToBottom
            ? avoidZoneTop - railThickness / 2
            : avoidZoneBottom + railThickness / 2,
        );
      } else {
        railPositions.push(eqPosition);
      }
    }

    const lockBlockTop = LOCK_BLOCK_POSITION - LOCK_BLOCK_HEIGHT / 2;
    const lockBlockBottom = LOCK_BLOCK_POSITION + LOCK_BLOCK_HEIGHT / 2;
    const lockBlockSides = (lockBlockLeft ? 1 : 0) + (lockBlockRight ? 1 : 0);
    const piecesPerSide = parseInt(lockBlockPiecesPerSide) || 0;
    const lockBlockCount = lockBlockSides * piecesPerSide;
    const railsAdjusted = railPositions.some(
      (pos, idx) => pos !== railPositionsOriginal[idx],
    );

    const doubleFrameLeftWidth = effectiveSides.left
      ? F * numericDoubleCount
      : 0;
    const doubleFrameRightWidth = effectiveSides.right
      ? F * numericDoubleCount
      : 0;

    return {
      T,
      W,
      H,
      S,
      F,
      DF,
      R,
      totalSurfaceThickness,
      frameThickness,
      totalFrameWidth,
      innerWidth,
      innerHeight,
      doorArea,
      railPositions,
      railPositionsOriginal,
      railSections,
      railsAdjusted,
      lockBlockTop,
      lockBlockBottom,
      lockBlockHeight: LOCK_BLOCK_HEIGHT,
      lockBlockPosition: LOCK_BLOCK_POSITION,
      lockBlockWidth: F,
      lockBlockCount,
      lockBlockSides,
      lockBlockLeft,
      lockBlockRight,
      currentFrame,
      doubleFrame: {
        count: numericDoubleCount,
        ...effectiveSides,
        hasAny: hasDoubleFrame,
        leftWidth: doubleFrameLeftWidth,
        rightWidth: doubleFrameRightWidth,
      },
    };
  }, [
    doorThickness,
    doorWidth,
    doorHeight,
    surfaceThickness,
    currentFrame,
    lockBlockLeft,
    lockBlockRight,
    lockBlockPiecesPerSide,
    doubleFrameSides,
    doubleFrameCount,
  ]);
};

const useCuttingPlan = (results, currentFrame, coreType) => {
  return useMemo(() => {
    if (!results || !currentFrame) {
      return {
        cutPieces: [],
        allPieces: [],
        stocks: [],
        totalStocks: 0,
        totalWaste: 0,
        totalStock: 0,
        efficiency: "0.0",
        stockLength: 2040,
        sawKerf: 5,
        usedLength: 0,
        needSplice: false,
        spliceCount: 0,
        spliceOverlap: 100,
      };
    }

    const { W, H, F, railSections, lockBlockCount, doubleFrame } = results;
    const stockLength = currentFrame.length || 2040;
    const sawKerf = 5;
    const needSplice = currentFrame.needSplice || false;
    const spliceOverlap = currentFrame.spliceOverlap || 100;
    const cutPieces = [];

    const addPiece = (
      name,
      finishedLength,
      qty,
      color,
      isSplice = false,
      withAllowance = true,
    ) => {
      if (!finishedLength || finishedLength <= 0 || !qty) return;
      const cutLength = finishedLength + (withAllowance ? CUT_ALLOWANCE : 0);
      cutPieces.push({
        name,
        length: finishedLength,
        cutLength,
        qty,
        color,
        isSplice,
      });
    };

    const stileLength = H;
    if (needSplice && stileLength > stockLength) {
      const pieceLength = Math.ceil(stileLength / 2) + spliceOverlap / 2;
      addPiece("เสา (ชิ้นที่ 1)", pieceLength, 2, "secondary", true);
      addPiece("เสา (ชิ้นที่ 2)", pieceLength, 2, "warning", true);
    } else {
      addPiece("เสา", stileLength, 2, "secondary");
    }

    const railLength = W - 2 * F;
    addPiece("ราว", railLength, 2, "primary");

    const clearHeight = H - 2 * F;
    const clearWidth = W - 2 * F;

    if (doubleFrame?.hasAny && doubleFrame.count > 0) {
      const count = doubleFrame.count;

      if (doubleFrame.left) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece(
            "เสาซ้อนซ้าย (ชิ้นที่ 1)",
            pieceLength,
            count,
            "warning",
            true,
          );
          addPiece(
            "เสาซ้อนซ้าย (ชิ้นที่ 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("เสาซ้อนซ้าย", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.right) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece(
            "เสาซ้อนขวา (ชิ้นที่ 1)",
            pieceLength,
            count,
            "warning",
            true,
          );
          addPiece(
            "เสาซ้อนขวา (ชิ้นที่ 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("เสาซ้อนขวา", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.center) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece("เสากลาง (ชิ้นที่ 1)", pieceLength, count, "warning", true);
          addPiece(
            "เสากลาง (ชิ้นที่ 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("เสากลาง", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.top) {
        let topLength = clearWidth;
        if (doubleFrame.left) topLength -= F * count;
        if (doubleFrame.right) topLength -= F * count;
        addPiece("ราวซ้อนบน", topLength, count, "secondary");
      }

      if (doubleFrame.bottom) {
        let bottomLength = clearWidth;
        if (doubleFrame.left) bottomLength -= F * count;
        if (doubleFrame.right) bottomLength -= F * count;
        addPiece("ราวซ้อนล่าง", bottomLength, count, "secondary");
      }
    }

    const railCount = railSections - 1;
    const skipRailCoreTypes = [...NO_RAIL_CORE_TYPES, "particle_strips"];
    if (railCount > 0 && !skipRailCoreTypes.includes(coreType)) {
      let damLength = clearWidth;
      if (doubleFrame?.hasAny && doubleFrame.count > 0) {
        if (doubleFrame.left) damLength -= F * doubleFrame.count;
        if (doubleFrame.right) damLength -= F * doubleFrame.count;
      }
      addPiece("คานขวาง", damLength, railCount, "primary");
    }

    if (lockBlockCount > 0) {
      addPiece(
        "บล็อกล็อค",
        LOCK_BLOCK_HEIGHT,
        lockBlockCount,
        "danger",
        false,
        false,
      );
    }

    const allPieces = cutPieces
      .flatMap((piece) =>
        Array.from({ length: piece.qty }, (_, i) => ({
          ...piece,
          id: `${piece.name}-${i + 1}`,
        })),
      )
      .sort((a, b) => (b.cutLength ?? b.length) - (a.cutLength ?? a.length));

    const stocks = [];
    allPieces.forEach((piece) => {
      const pieceCut = piece.cutLength ?? piece.length;
      const pieceWithKerf = pieceCut + sawKerf;
      const availableStock = stocks.find((s) => s.remaining >= pieceWithKerf);

      if (availableStock) {
        availableStock.pieces.push(piece);
        availableStock.remaining -= pieceWithKerf;
        availableStock.used += pieceWithKerf;
      } else {
        stocks.push({
          length: stockLength,
          pieces: [piece],
          remaining: stockLength - pieceWithKerf,
          used: pieceWithKerf,
        });
      }
    });

    stocks.forEach((s) => {
      s.remaining += sawKerf;
      s.used -= sawKerf;
    });

    const totalStocks = stocks.length;
    const totalStock = totalStocks * stockLength;
    const totalWaste = stocks.reduce((sum, s) => sum + s.remaining, 0);
    const usedLength = totalStock - totalWaste;
    const efficiency = totalStock
      ? ((usedLength / totalStock) * 100).toFixed(1)
      : "0.0";
    const spliceCount =
      cutPieces.filter((p) => p.isSplice).reduce((sum, p) => sum + p.qty, 0) /
      2;

    return {
      cutPieces,
      allPieces,
      stocks,
      totalStocks,
      totalWaste,
      totalStock,
      efficiency,
      stockLength,
      sawKerf,
      usedLength,
      needSplice,
      spliceCount,
      spliceOverlap,
    };
  }, [results, currentFrame, coreType]);
};

const useCoreCalculation = (results, coreType) => {
  return useMemo(() => {
    if (!results || !coreType) {
      return {
        coreType: null,
        pieces: [],
        damPieces: [],
        totalPieces: 0,
        columns: 0,
        rows: 0,
        stripThickness: 0,
        stripSpacing: 0,
        isSolid: true,
      };
    }

    const {
      W,
      H,
      F,
      railPositions,
      lockBlockLeft,
      lockBlockRight,
      lockBlockTop,
      lockBlockBottom,
      doubleFrame,
    } = results;
    const coreConfig = CORE_TYPES.find((c) => c.value === coreType);
    if (!coreConfig) {
      return {
        coreType: null,
        pieces: [],
        damPieces: [],
        totalPieces: 0,
        columns: 0,
        rows: 0,
        stripThickness: 0,
        stripSpacing: 0,
        isSolid: true,
      };
    }

    const leftOffset = F + (doubleFrame?.left ? F * doubleFrame.count : 0);
    const rightOffset = F + (doubleFrame?.right ? F * doubleFrame.count : 0);
    const topOffset = F + (doubleFrame?.top ? F * doubleFrame.count : 0);
    const bottomOffset = F + (doubleFrame?.bottom ? F * doubleFrame.count : 0);

    const coreWidth = W - leftOffset - rightOffset;
    const coreHeight = H - topOffset - bottomOffset;

    const hasLockBlock = lockBlockLeft || lockBlockRight;
    const lockBlockZoneStart = hasLockBlock ? lockBlockTop : null;
    const lockBlockZoneEnd = hasLockBlock ? lockBlockBottom : null;

    if (coreConfig.type === "solid") {
      const solidLockBlockSides =
        (lockBlockLeft ? 1 : 0) + (lockBlockRight ? 1 : 0);
      const solidLockBlockCount = results.lockBlockCount || 0;
      const solidPiecesPerSide =
        solidLockBlockSides > 0
          ? Math.max(1, Math.ceil(solidLockBlockCount / solidLockBlockSides))
          : 0;
      const solidLockBlockWidth = F * solidPiecesPerSide;

      const isFullPanelCore = NO_RAIL_CORE_TYPES.includes(coreType);

      let rows = [];

      if (isFullPanelCore) {
        rows = [
          { top: topOffset, bottom: H - bottomOffset, height: coreHeight },
        ];
      } else {
        const rowBoundaries = [topOffset];
        if (railPositions && railPositions.length > 0) {
          railPositions.forEach((pos) => {
            rowBoundaries.push(H - pos - F / 2);
            rowBoundaries.push(H - pos + F / 2);
          });
        }
        rowBoundaries.push(H - bottomOffset);
        rowBoundaries.sort((a, b) => a - b);

        for (let i = 0; i < rowBoundaries.length - 1; i += 2) {
          const rowTop = rowBoundaries[i];
          const rowBottom = rowBoundaries[i + 1];
          if (rowBottom > rowTop)
            rows.push({
              top: rowTop,
              bottom: rowBottom,
              height: rowBottom - rowTop,
            });
        }
      }

      const pieces = [];

      if (isFullPanelCore && hasLockBlock) {
        const lockBlockYTop = H - lockBlockZoneEnd;
        const lockBlockYBottom = H - lockBlockZoneStart;

        if (lockBlockYTop > topOffset) {
          pieces.push({
            name: "ไส้ส่วนบน",
            x: leftOffset,
            y: topOffset,
            width: coreWidth,
            height: lockBlockYTop - topOffset,
          });
        }

        const middleHeight = lockBlockYBottom - lockBlockYTop;
        if (middleHeight > 0) {
          if (lockBlockLeft && lockBlockRight) {
            const middleWidth = coreWidth - solidLockBlockWidth * 2;
            if (middleWidth > 0) {
              pieces.push({
                name: "ไส้ส่วนกลาง",
                x: leftOffset + solidLockBlockWidth,
                y: lockBlockYTop,
                width: middleWidth,
                height: middleHeight,
              });
            }
          } else if (lockBlockLeft) {
            pieces.push({
              name: "ไส้ส่วนกลาง",
              x: leftOffset + solidLockBlockWidth,
              y: lockBlockYTop,
              width: coreWidth - solidLockBlockWidth,
              height: middleHeight,
            });
          } else if (lockBlockRight) {
            pieces.push({
              name: "ไส้ส่วนกลาง",
              x: leftOffset,
              y: lockBlockYTop,
              width: coreWidth - solidLockBlockWidth,
              height: middleHeight,
            });
          }
        }

        if (lockBlockYBottom < H - bottomOffset) {
          pieces.push({
            name: "ไส้ส่วนล่าง",
            x: leftOffset,
            y: lockBlockYBottom,
            width: coreWidth,
            height: H - bottomOffset - lockBlockYBottom,
          });
        }
      } else if (isFullPanelCore && !hasLockBlock) {
        pieces.push({
          name: "ไส้เต็มแผ่น",
          x: leftOffset,
          y: topOffset,
          width: coreWidth,
          height: coreHeight,
        });
      } else {
        rows.forEach((row, rowIdx) => {
          const rowTopFromBottom = H - row.bottom;
          const rowBottomFromBottom = H - row.top;

          if (
            hasLockBlock &&
            lockBlockZoneStart < rowBottomFromBottom &&
            lockBlockZoneEnd > rowTopFromBottom
          ) {
            if (lockBlockLeft && lockBlockRight) {
              pieces.push({
                name: `ไส้แถวที่ ${rowIdx + 1} (ซ้าย)`,
                x: leftOffset + solidLockBlockWidth,
                y: row.top,
                width: (coreWidth - solidLockBlockWidth * 2) / 2,
                height: row.height,
              });
              pieces.push({
                name: `ไส้แถวที่ ${rowIdx + 1} (ขวา)`,
                x:
                  W -
                  rightOffset -
                  solidLockBlockWidth -
                  (coreWidth - solidLockBlockWidth * 2) / 2,
                y: row.top,
                width: (coreWidth - solidLockBlockWidth * 2) / 2,
                height: row.height,
              });
            } else if (lockBlockLeft) {
              pieces.push({
                name: `ไส้แถวที่ ${rowIdx + 1}`,
                x: leftOffset + solidLockBlockWidth,
                y: row.top,
                width: coreWidth - solidLockBlockWidth,
                height: row.height,
              });
            } else if (lockBlockRight) {
              pieces.push({
                name: `ไส้แถวที่ ${rowIdx + 1}`,
                x: leftOffset,
                y: row.top,
                width: coreWidth - solidLockBlockWidth,
                height: row.height,
              });
            }
          } else {
            pieces.push({
              name: `ไส้แถวที่ ${rowIdx + 1}`,
              x: leftOffset,
              y: row.top,
              width: coreWidth,
              height: row.height,
            });
          }
        });
      }

      return {
        coreType: coreConfig,
        pieces,
        damPieces: [],
        totalPieces: pieces.length,
        columns: 1,
        rows: isFullPanelCore ? 1 : rows.length,
        stripThickness: 0,
        stripSpacing: 0,
        isSolid: true,
        isFullPanelCore,
        coreWidth,
        coreHeight,
        leftOffset,
        rightOffset,
        topOffset,
        bottomOffset,
      };
    }

    const stripThickness = coreConfig.thickness || 4;
    const edgePadding = 40;
    const stripAreaWidth = coreWidth - edgePadding * 2;
    const stripStartX = leftOffset + edgePadding;

    let columnCount;
    let actualSpacing;

    if (coreConfig.value === "particle_strips") {
      columnCount = Math.round(W / 100) + 1;
      actualSpacing =
        (stripAreaWidth - columnCount * stripThickness) /
        (columnCount - 1 || 1);
    } else {
      const stripSpacing = coreConfig.spacing || 40;
      columnCount =
        Math.floor(stripAreaWidth / (stripThickness + stripSpacing)) + 1;
      actualSpacing =
        (stripAreaWidth - columnCount * stripThickness) /
        (columnCount - 1 || 1);
    }

    const rows =
      coreConfig.value === "particle_strips"
        ? [{ top: topOffset, bottom: H - bottomOffset, height: coreHeight }]
        : (() => {
            const rowBoundaries = [topOffset];
            if (railPositions && railPositions.length > 0) {
              railPositions.forEach((pos) => {
                rowBoundaries.push(H - pos - F / 2);
                rowBoundaries.push(H - pos + F / 2);
              });
            }
            rowBoundaries.push(H - bottomOffset);
            rowBoundaries.sort((a, b) => a - b);

            const out = [];
            for (let i = 0; i < rowBoundaries.length - 1; i += 2) {
              const rowTop = rowBoundaries[i];
              const rowBottom = rowBoundaries[i + 1];
              if (rowBottom > rowTop)
                out.push({
                  top: rowTop,
                  bottom: rowBottom,
                  height: rowBottom - rowTop,
                });
            }
            return out;
          })();

    const lockBlockSides = (lockBlockLeft ? 1 : 0) + (lockBlockRight ? 1 : 0);
    const lockBlockCount = results.lockBlockCount || 0;
    const piecesPerSide =
      lockBlockSides > 0
        ? Math.max(1, Math.ceil(lockBlockCount / lockBlockSides))
        : 0;

    const lockBlockWidth = F * piecesPerSide;
    const lockBlockLeftStart = lockBlockLeft ? leftOffset : null;
    const lockBlockLeftEnd = lockBlockLeft ? leftOffset + lockBlockWidth : null;
    const lockBlockRightStart = lockBlockRight
      ? W - rightOffset - lockBlockWidth
      : null;
    const lockBlockRightEnd = lockBlockRight ? W - rightOffset : null;

    const lockBlockYTop = H - (lockBlockZoneEnd ?? 0);
    const lockBlockYBottom = H - (lockBlockZoneStart ?? 0);

    const pieces = [];
    let pieceId = 0;

    for (let col = 0; col < columnCount; col++) {
      const stripX = stripStartX + col * (stripThickness + actualSpacing);
      const stripXEnd = stripX + stripThickness;

      const overlapsLeftLockBlock =
        lockBlockLeft &&
        lockBlockLeftStart !== null &&
        lockBlockLeftEnd !== null &&
        stripXEnd > lockBlockLeftStart &&
        stripX < lockBlockLeftEnd;
      const overlapsRightLockBlock =
        lockBlockRight &&
        lockBlockRightStart !== null &&
        lockBlockRightEnd !== null &&
        stripXEnd > lockBlockRightStart &&
        stripX < lockBlockRightEnd;
      const overlapsAnyLockBlockX =
        overlapsLeftLockBlock || overlapsRightLockBlock;

      rows.forEach((row, rowIdx) => {
        const rowOverlapsLockBlockY =
          hasLockBlock &&
          row.top < lockBlockYBottom &&
          row.bottom > lockBlockYTop;
        const stripHitsLockBlock =
          overlapsAnyLockBlockX && rowOverlapsLockBlockY;

        if (stripHitsLockBlock) {
          if (lockBlockYTop > row.top) {
            const pieceHeight = lockBlockYTop - row.top;
            if (pieceHeight > 5)
              pieces.push({
                id: pieceId++,
                col,
                row: rowIdx,
                x: stripX,
                y: row.top,
                width: stripThickness,
                height: pieceHeight,
                name: `Strip C${col + 1}-R${rowIdx + 1}a`,
              });
          }
          if (lockBlockYBottom < row.bottom) {
            const pieceHeight = row.bottom - lockBlockYBottom;
            if (pieceHeight > 5)
              pieces.push({
                id: pieceId++,
                col,
                row: rowIdx,
                x: stripX,
                y: lockBlockYBottom,
                width: stripThickness,
                height: pieceHeight,
                name: `Strip C${col + 1}-R${rowIdx + 1}b`,
              });
          }
        } else {
          pieces.push({
            id: pieceId++,
            col,
            row: rowIdx,
            x: stripX,
            y: row.top,
            width: stripThickness,
            height: row.height,
            name: `Strip C${col + 1}-R${rowIdx + 1}`,
          });
        }
      });
    }

    const damPieces =
      coreConfig.value === "particle_strips" && railPositions?.length
        ? railPositions.map((pos, idx) => {
            const yCenter = H - pos;
            return {
              id: `dam-${idx}`,
              x: leftOffset,
              y: yCenter - stripThickness / 2,
              width: coreWidth,
              height: stripThickness,
              name: `คานขวางปาร์ติเคิล ${idx + 1}`,
            };
          })
        : [];

    return {
      coreType: coreConfig,
      pieces,
      damPieces,
      totalPieces: pieces.length + damPieces.length,
      columns: columnCount,
      rows: rows.length,
      stripThickness,
      stripSpacing: Math.round(actualSpacing),
      isSolid: false,
      coreWidth,
      coreHeight,
      leftOffset,
      rightOffset,
      topOffset,
      bottomOffset,
      rowBoundaries: rows,
      edgePadding,
    };
  }, [results, coreType]);
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
        <div className="flex items-center justify-between p-2 bg-default-50 border-b-1 border-default gap-2 flex-wrap">
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
                  variant="bordered"
                  size="md"
                  radius="md"
                  className="w-full text-foreground border-default"
                  startContent={<Layers />}
                >
                  Layers
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="p-2 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b-1 border-default gap-2">
                    <span className="font-semibold text-[13px]">เลเยอร์</span>
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

        <div className="flex items-center justify-between p-2 bg-default-50 border-t-1 border-default text-xs text-default-500">
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
  frameType,
  setFrameType,
  selectedFrameCode,
  setSelectedFrameCode,
  lockBlockPosition,
  setLockBlockPosition,
  lockBlockPiecesPerSide,
  setLockBlockPiecesPerSide,
  doubleFrameSides,
  doubleFrameCount,
  setDoubleFrameCount,
  coreType,
  setCoreType,
  lockBlockLeft,
  lockBlockRight,
  frameSelection,
  currentFrame,
  results,
  cuttingPlan,
  coreCalculation,
  isDataComplete,
  piecesPerSide,
  doubleConfigSummary,
  handleToggleDoubleSide,
  lockBlockDesc,
}) => {
  const isNoRailCoreType = NO_RAIL_CORE_TYPES.includes(coreType);

  return (
    <div
      ref={formRef}
      className="flex flex-col items-center justify-start w-full h-full gap-2 overflow-auto"
    >
      <div className="flex flex-col items-center justify-center w-full h-fit p-2 gap-2">
        <div className="flex items-center justify-center w-full h-full p-2 gap-2">
          🚪 ระบบถอด BOM ประตู
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full h-fit p-2 gap-2">
        <div className="grid grid-cols-1 xl:grid-cols-2 p-2 gap-2 w-full h-full">
          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  1
                </Chip>
                <span className="font-semibold">📝 ข้อมูลลูกค้า</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="flex flex-col xl:flex-row items-center justify-center w-full h-fit gap-2">
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="doorThickness"
                    type="number"
                    label="ความหนา (มม.)"
                    labelPlacement="outside"
                    placeholder="กรอกความหนา"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={doorThickness}
                    onChange={(e) => setDoorThickness(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="doorWidth"
                    type="number"
                    label="ความกว้าง (มม.)"
                    labelPlacement="outside"
                    placeholder="กรอกความกว้าง"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={doorWidth}
                    onChange={(e) => setDoorWidth(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="doorHeight"
                    type="number"
                    label="ความสูง (มม.)"
                    labelPlacement="outside"
                    placeholder="กรอกความสูง"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={doorHeight}
                    onChange={(e) => setDoorHeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center w-full p-2">
                <Chip color="default" variant="shadow" size="md">
                  สเปค: {formatDimension(doorThickness, doorWidth, doorHeight)}{" "}
                  มม.
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  2
                </Chip>
                <span className="font-semibold">🎨 วัสดุผิว</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="flex flex-col xl:flex-row items-center justify-center w-full h-fit gap-2">
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="surfaceMaterial"
                    label="ประเภทวัสดุ"
                    labelPlacement="outside"
                    placeholder="กรอกประเภทวัสดุ"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={surfaceMaterial}
                    onChange={(e) => setSurfaceMaterial(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="surfaceThickness"
                    type="number"
                    label="ความหนา/แผ่น (มม.)"
                    labelPlacement="outside"
                    placeholder="กรอกความหนา"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={surfaceThickness}
                    onChange={(e) => setSurfaceThickness(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Input
                    name="surfacePrice"
                    type="number"
                    label="ราคา (บาท)"
                    labelPlacement="outside"
                    placeholder="กรอกราคา"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={surfacePrice}
                    onChange={(e) => setSurfacePrice(e.target.value)}
                  />
                </div>
              </div>
              <Divider />
              <div className="flex flex-col gap-2 text-[13px] p-2">
                <div className="flex justify-between">
                  <span>วัสดุ:</span>
                  <span className="font-bold text-foreground">
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
                <div className="flex justify-between font-bold">
                  <span>รวม:</span>
                  <span>{results.totalSurfaceThickness} มม.</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>ความหนากรอบที่ต้องการ:</span>
                  <span className="text-foreground">
                    {results.frameThickness} มม.
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  3
                </Chip>
                <span className="font-semibold">🪵 กรอบไม้ (ERP)</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="flex flex-col xl:flex-row items-center justify-center w-full h-fit gap-2">
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Select
                    name="frameType"
                    label="ประเภทไม้กรอบ"
                    labelPlacement="outside"
                    placeholder="กรุณาเลือก"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={frameType ? [frameType] : []}
                    onSelectionChange={(keys) =>
                      setFrameType([...keys][0] || "")
                    }
                  >
                    {FRAME_TYPES.map((opt) => (
                      <SelectItem key={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Select
                    name="selectedFrameCode"
                    label={`เลือกไม้กรอบ (ยาว≥${doorHeight || 0}mm)`}
                    labelPlacement="outside"
                    placeholder="กรุณาเลือก"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
                    isDisabled={
                      !frameType || frameSelection.frames.length === 0
                    }
                    selectedKeys={selectedFrameCode ? [selectedFrameCode] : []}
                    onSelectionChange={(keys) =>
                      setSelectedFrameCode([...keys][0] || "")
                    }
                  >
                    {frameSelection.frames.map((frame) => (
                      <SelectItem key={frame.code}>
                        {frame.displaySize}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {frameType && frameSelection.frames.length === 0 && (
                <Chip color="default" variant="shadow" className="w-full">
                  ⚠️{" "}
                  {frameSelection.reason ||
                    `ไม่พบไม้ที่เหมาะสมสำหรับความหนา ${results.frameThickness}มม.`}
                </Chip>
              )}

              {frameType && frameSelection.frames.length > 0 && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>ขนาดกรอบจริง:</span>
                    <span className="font-bold text-foreground">
                      {currentFrame.useThickness}×{currentFrame.useWidth} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>รหัส ERP:</span>
                    <span className="font-mono text-xs">
                      {selectedFrameCode}
                    </span>
                  </div>
                  {currentFrame.isFlipped && (
                    <Chip color="default" variant="shadow" size="md">
                      🔄 พลิก {currentFrame.thickness}×{currentFrame.width} →{" "}
                      {currentFrame.width}×{currentFrame.thickness}
                    </Chip>
                  )}
                  {currentFrame.planeAmount > 0 && (
                    <Chip color="default" variant="shadow" size="md">
                      🪚 ต้องไส {currentFrame.planeAmount} มม.
                    </Chip>
                  )}
                  {currentFrame.needSplice && (
                    <div className="flex flex-col gap-2 p-2 bg-default-50 rounded-lg">
                      <Chip color="default" variant="shadow" size="md">
                        🔗 ต่อ {currentFrame.spliceCount} ชิ้น
                      </Chip>
                      <span className="text-xs">
                        • ตำแหน่งต่อ: {currentFrame.splicePosition} มม. จากปลาย
                      </span>
                      <span className="text-xs">
                        • ระยะทับซ้อน: {currentFrame.spliceOverlap} มม.
                      </span>
                      <span className="text-xs">
                        • ความยาวรวม: {currentFrame.effectiveLength} มม.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Divider />

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium">ด้านที่ซ้อนกรอบ</span>
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

              <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                <Select
                  name="doubleFrameCount"
                  label="จำนวนชั้นซ้อน/ด้าน"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือก"
                  color="default"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={doubleFrameCount ? [doubleFrameCount] : []}
                  onSelectionChange={(keys) =>
                    setDoubleFrameCount([...keys][0] || "")
                  }
                >
                  {DOUBLE_FRAME_COUNT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value}>{opt.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {doubleConfigSummary && (
                <Chip color="default" variant="shadow" className="w-full">
                  {doubleConfigSummary}
                </Chip>
              )}
            </CardBody>
          </Card>

          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  4
                </Chip>
                <span className="font-semibold">➖ คานขวาง</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              {isNoRailCoreType ? (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <Chip color="default" variant="shadow" size="md">
                    ⚠️ ไส้ประเภท {coreCalculation?.coreType?.label || coreType}{" "}
                    ไม่มีคานขวางตรงกลาง
                  </Chip>
                  <span className="text-default-500">
                    ไส้เต็มแผ่น มีกรอบเฉพาะซ้าย ขวา บน ล่าง
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>จำนวนช่อง:</span>
                    <span className="font-bold text-foreground">
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
                    <span className="font-bold text-foreground">
                      {coreType === "particle_strips"
                        ? `${coreCalculation.stripThickness || 12} มม. (ตัดจากแผ่นปาร์ติเคิล)`
                        : `${currentFrame.useThickness || 0}×${currentFrame.useWidth || 0} มม.`}
                    </span>
                  </div>

                  {coreType !== "particle_strips" && (
                    <span className="text-xs text-default-500">
                      (ใช้ไม้เดียวกับกรอบ)
                    </span>
                  )}
                  {coreType === "particle_strips" && (
                    <span className="text-xs text-default-500">
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
                            <span className="text-xs">
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

          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  5
                </Chip>
                <span className="font-semibold">🔒 บล็อกล็อค</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="flex flex-col xl:flex-row items-center justify-center w-full h-fit gap-2">
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Select
                    name="lockBlockPiecesPerSide"
                    label="จำนวนชิ้น/ด้าน"
                    labelPlacement="outside"
                    placeholder="กรุณาเลือก"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
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
                </div>
                <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                  <Select
                    name="lockBlockPosition"
                    label="ตำแหน่งบล็อกล็อค"
                    labelPlacement="outside"
                    placeholder="กรุณาเลือก"
                    color="default"
                    variant="bordered"
                    size="md"
                    radius="md"
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
              </div>

              {(lockBlockLeft || lockBlockRight) && piecesPerSide > 0 && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>จำนวนรวม:</span>
                    <span className="font-bold text-foreground">
                      {results.lockBlockCount} ชิ้น ({lockBlockDesc})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ขนาดบล็อกล็อค:</span>
                    <span className="font-bold text-foreground">
                      {currentFrame.useThickness || 0}×
                      {currentFrame.useWidth || 0}×{LOCK_BLOCK_HEIGHT} mm
                    </span>
                  </div>
                  <span className="text-xs text-default-500">
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

          <Card className="w-full">
            <CardHeader className="bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Chip color="default" variant="solid" size="md">
                  6
                </Chip>
                <span className="font-semibold">🧱 วัสดุไส้ประตู</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="flex items-center justify-center w-full h-full p-2 gap-2">
                <Select
                  name="coreType"
                  label="ประเภทไส้"
                  labelPlacement="outside"
                  placeholder="กรุณาเลือก"
                  color="default"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={coreType ? [coreType] : []}
                  onSelectionChange={(keys) => setCoreType([...keys][0] || "")}
                >
                  {CORE_TYPES.map((core) => (
                    <SelectItem key={core.value}>{core.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {coreType && coreCalculation.coreType && (
                <div className="flex flex-col gap-2 text-[13px] p-2 bg-default-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>ประเภท:</span>
                    <span className="font-bold text-foreground">
                      {coreCalculation.coreType.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>รูปแบบ:</span>
                    <span className="font-bold">
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
                        <span className="font-bold text-foreground">
                          {coreCalculation.columns} คอลัมน์
                          {coreCalculation.coreType?.value ===
                            "particle_strips" &&
                            doorWidth && (
                              <span className="text-xs font-normal text-default-500">
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
                            <span className="font-bold text-foreground">
                              {coreCalculation.damPieces.length} ชิ้น
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  <Divider className="" />
                  <div className="flex justify-between font-bold">
                    <span>จำนวนชิ้นรวม:</span>
                    <span className="text-foreground">
                      {coreCalculation.totalPieces} pcs
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-default-500">
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

          <Card className="w-full">
            <CardHeader className="bg-default-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold">📋 สรุปโครงสร้าง</span>
              </div>
            </CardHeader>
            <CardBody className="gap-2">
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="p-2 bg-default-100 rounded-lg">
                  <span className="block text-default-600">สเปคประตู:</span>
                  <span className="font-bold">
                    {formatDimension(doorThickness, doorWidth, doorHeight)} mm
                  </span>
                </div>
                <div className="p-2 bg-default-100 rounded-lg">
                  <span className="block text-default-600">ผิว:</span>
                  <span className="font-bold text-foreground">
                    {surfaceMaterial || "ไม่ระบุ"}{" "}
                    {surfaceThickness || 0}mm + Glue {GLUE_THICKNESS}mm (×2)
                  </span>
                </div>
                <div className="p-2 bg-default-50 rounded-lg">
                  <span className="block text-default-600">กรอบไม้:</span>
                  <span className="font-bold text-foreground">
                    {currentFrame.useThickness || "-"}×
                    {currentFrame.useWidth || "-"} mm
                  </span>
                  {currentFrame.isFlipped && (
                    <span className="block text-xs text-foreground">
                      🔄 พลิก
                    </span>
                  )}
                  {currentFrame.planeAmount > 0 && (
                    <span className="block text-xs text-foreground">
                      🪚 ไส {currentFrame.planeAmount}มม.
                    </span>
                  )}
                </div>
                <div className="p-2 bg-default-50 rounded-lg">
                  <span className="block text-default-600">คานขวาง:</span>
                  {isNoRailCoreType ? (
                    <span className="font-bold text-default-700">
                      ไม่มี (ไส้เต็มแผ่น)
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-foreground">
                        {results.railSections - 1} ชิ้น ({results.railSections}{" "}
                        ช่อง)
                      </span>
                      {coreType === "particle_strips" && (
                        <span className="block text-xs text-foreground">
                          ใช้แผ่นปาร์ติเคิลแทนคานขวาง
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="col-span-2 p-2 bg-default-50 rounded-lg">
                  <span className="block text-default-600">บล็อกล็อค:</span>
                  <span className="font-bold text-foreground">
                    {results.lockBlockCount} ชิ้น ({lockBlockDesc})
                  </span>
                </div>
                {coreType && coreCalculation.coreType && (
                  <div className="col-span-2 p-2 bg-default-50 rounded-lg">
                    <span className="block text-default-600">ไส้ประตู:</span>
                    <span className="font-bold text-foreground">
                      {coreCalculation.coreType.label} (
                      {coreCalculation.totalPieces} ชิ้น)
                    </span>
                    {!coreCalculation.isSolid && (
                      <span className="block text-xs text-default-600">
                        {coreCalculation.columns} คอลัมน์ ×{" "}
                        {coreCalculation.rows} แถว, ความหนาแถบ{" "}
                        {coreCalculation.stripThickness}mm spacing{" "}
                        {coreCalculation.stripSpacing}mm
                      </span>
                    )}
                    {coreCalculation.isFullPanelCore && (
                      <span className="block text-xs text-default-700">
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
                  <span className="font-medium text-foreground">
                    รหัส ERP: {selectedFrameCode}
                  </span>
                  <span className="block text-xs">{currentFrame.desc}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {isDataComplete ? (
            <Card className="w-full">
              <CardHeader className="bg-foreground text-background">
                <div className="flex items-center gap-2">
                  <Chip color="default" variant="solid" size="md">
                    7
                  </Chip>
                  <span className="font-semibold">
                    ✂️ แผนตัดไม้ (เพิ่มประสิทธิภาพ)
                  </span>
                </div>
              </CardHeader>
              <CardBody className="gap-2">
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
                    <div className="flex items-center gap-2 font-medium text-foreground">
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
                      <div className="text-xs opacity-80">
                        ใช้กาว + ตะปูที่จุดต่อ
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg text-center">
                    <div className="font-bold text-lg text-foreground">
                      {cuttingPlan.totalStocks}
                    </div>
                    <div className="text-xs text-default-700">ท่อนที่ใช้</div>
                  </div>
                  <div className="p-2 rounded-lg text-center">
                    <div className="font-bold text-lg text-foreground">
                      {cuttingPlan.efficiency}
                    </div>
                    <div className="text-xs text-default-700">ประสิทธิภาพ</div>
                  </div>
                  <div className="p-2 rounded-lg text-center">
                    <div className="font-bold text-lg text-foreground">
                      {cuttingPlan.usedLength}
                    </div>
                    <div className="text-xs text-default-700">ใช้ (มม.)</div>
                  </div>
                  <div className="p-2 rounded-lg text-center">
                    <div className="font-bold text-lg text-foreground">
                      {cuttingPlan.totalWaste}
                    </div>
                    <div className="text-xs text-default-700">
                      เศษเหลือ (มม.)
                    </div>
                  </div>
                </div>

                <div className="border-1 border-default rounded-lg overflow-hidden">
                  <div className="p-2 text-xs font-semibold bg-default-100">
                    📋 รายการชิ้นส่วน (เผื่อรอยเลื่อย {cuttingPlan.sawKerf} มม.)
                  </div>
                  <div>
                    {cuttingPlan.cutPieces.map((piece, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 text-xs ${piece.isSplice ? "bg-default-50" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <Chip
                            color={piece.color}
                            variant="shadow"
                            size="md"
                            className="w-4 h-4 p-2"
                          />
                          <span className="font-medium">{piece.name}</span>
                          {piece.isSplice && (
                            <Chip color="default" variant="shadow" size="md">
                              Splice
                            </Chip>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            {piece.length} มม.{" "}
                            <span className="text-default-500">
                              (ตัด {piece.cutLength ?? piece.length} มม.)
                            </span>
                          </span>
                          <span className="font-bold">×{piece.qty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-1 border-default rounded-lg overflow-hidden">
                  <div className="p-2 text-xs font-semibold bg-default-100">
                    🪵 แผนตัดไม้ (ท่อนยาว {cuttingPlan.stockLength}มม. ×{" "}
                    {cuttingPlan.totalStocks} ท่อน)
                  </div>
                  <div className="p-2 space-y-3">
                    {cuttingPlan.stocks.map((stock, stockIdx) => (
                      <div key={stockIdx} className="space-y-1">
                        <div className="text-xs text-default-600">
                          ท่อนที่ {stockIdx + 1}
                        </div>
                        <div className="relative h-8 rounded overflow-hidden bg-default-100">
                          {(() => {
                            let offset = 0;
                            return stock.pieces.map((piece, pieceIdx) => {
                              const pieceCut = piece.cutLength ?? piece.length;
                              const width = (pieceCut / stock.length) * 100;
                              const kerfWidth =
                                (cuttingPlan.sawKerf / stock.length) * 100;
                              const left = offset;
                              offset += width + kerfWidth;
                              const colorMap = {
                                primary: "#4456E9",
                                secondary: "#FF8A00",
                                warning: "#FFB441",
                                danger: "#FF0076",
                                success: "#10B981",
                              };
                              return (
                                <React.Fragment key={pieceIdx}>
                                  <div
                                    className="absolute h-full flex items-center justify-center text-[8px] font-medium overflow-hidden text-white"
                                    style={{
                                      left: `${left}%`,
                                      width: `${width}%`,
                                      backgroundColor:
                                        colorMap[piece.color] || "#DCDCDC",
                                    }}
                                    title={`${piece.name}: cut ${pieceCut}mm (use ${piece.length}mm)`}
                                  >
                                    {width > 8 && (
                                      <span className="truncate p-2">
                                        {pieceCut}
                                      </span>
                                    )}
                                  </div>
                                  {pieceIdx < stock.pieces.length - 1 && (
                                    <div
                                      className="absolute h-full bg-default-200"
                                      style={{
                                        left: `${left + width}%`,
                                        width: `${kerfWidth}%`,
                                      }}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            });
                          })()}
                          {stock.remaining > 0 && (
                            <div
                              className="absolute right-0 h-full flex items-center justify-center text-[8px] bg-background text-default-600"
                              style={{
                                width: `${(stock.remaining / stock.length) * 100}%`,
                              }}
                            >
                              {stock.remaining > 100 && (
                                <span>เศษเหลือ {stock.remaining}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2">
                  <div className="flex justify-between text-xs">
                    <span>ประสิทธิภาพการใช้ไม้</span>
                    <span
                      className={`font-bold text-${getEfficiencyColor(cuttingPlan.efficiency)}`}
                    >
                      {cuttingPlan.efficiency}%
                    </span>
                  </div>
                  <Progress
                    value={parseFloat(cuttingPlan.efficiency)}
                    color={getEfficiencyColor(cuttingPlan.efficiency)}
                    size="md"
                  />
                  <div className="flex justify-between text-[10px] text-default-500">
                    <span>0%</span>
                    <span>ดี: ≥80%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="w-full">
              <CardHeader className="bg-default-200">
                <div className="flex items-center gap-2">
                  <Chip color="default" variant="solid" size="md">
                    7
                  </Chip>
                  <span className="font-semibold">
                    ✂️ แผนตัดไม้ (เพิ่มประสิทธิภาพ)
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Calculator className="w-12 h-12 text-default-300" />
                  <p className="text-lg font-medium">
                    กรุณากรอกสเปคประตูให้ครบ
                  </p>
                  <p className="text-[13px] text-default-400">
                    ระบบจะคำนวณแผนตัดไม้ให้อัตโนมัติ
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-1 p-2 gap-2 w-full h-full">
          <Card className="w-full">
            <CardHeader className="bg-foreground text-background flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>📐</span>
                <span className="font-semibold">แบบวาด</span>
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
                  <RulerDimensionLine className="w-12 h-12 text-default-300" />
                  <p className="text-lg font-medium">กรุณากรอกข้อมูลประตู</p>
                  <p className="text-[13px] text-default-400">
                    กรอก ความหนา (T), ความกว้าง (W), ความสูง (H)
                  </p>
                  <div className="flex gap-2">
                    <Chip
                      color={doorThickness ? "success" : "danger"}
                      variant="shadow"
                    >
                      T: {doorThickness || "—"}
                    </Chip>
                    <Chip
                      color={doorWidth ? "success" : "danger"}
                      variant="shadow"
                    >
                      W: {doorWidth || "—"}
                    </Chip>
                    <Chip
                      color={doorHeight ? "success" : "danger"}
                      variant="shadow"
                    >
                      H: {doorHeight || "—"}
                    </Chip>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function DoorConfigurator() {
  const { frames: erpFrames, loading: framesLoading } = useFrames();
  const formRef = useRef(null);
  const [doorThickness, setDoorThickness] = useState("");
  const [doorWidth, setDoorWidth] = useState("");
  const [doorHeight, setDoorHeight] = useState("");
  const [surfaceMaterial, setSurfaceMaterial] = useState("");
  const [surfacePrice, setSurfacePrice] = useState("");
  const [surfaceThickness, setSurfaceThickness] = useState("");
  const [frameType, setFrameType] = useState("");
  const [selectedFrameCode, setSelectedFrameCode] = useState("");
  const [lockBlockPosition, setLockBlockPosition] = useState("");
  const [lockBlockPiecesPerSide, setLockBlockPiecesPerSide] = useState("");
  const [doubleFrameSides, setDoubleFrameSides] = useState({
    top: false,
    bottom: false,
    left: false,
    center: false,
    right: false,
    all: false,
  });
  const [doubleFrameCount, setDoubleFrameCount] = useState("");
  const [coreType, setCoreType] = useState("");

  const lockBlockLeft =
    lockBlockPosition === "left" || lockBlockPosition === "both";
  const lockBlockRight =
    lockBlockPosition === "right" || lockBlockPosition === "both";

  const frameSelection = useFrameSelection(
    frameType,
    doorThickness,
    surfaceThickness,
    doorHeight,
    erpFrames,
  );

  const currentFrame = useMemo(() => {
    if (!frameSelection.frames?.length)
      return {
        thickness: 0,
        width: 0,
        length: 0,
        useThickness: 0,
        useWidth: 0,
        isFlipped: false,
        planeAmount: 0,
        code: "",
        desc: "",
      };

    const frame = frameSelection.frames.find(
      (f) => f.code === selectedFrameCode,
    );
    if (frame) return frame;

    const firstFrame = frameSelection.frames[0];
    return firstFrame;
  }, [frameSelection, selectedFrameCode]);

  const numericDoubleCount = parseInt(doubleFrameCount) || 0;

  const results = useCalculations({
    doorThickness,
    doorWidth,
    doorHeight,
    surfaceThickness,
    currentFrame,
    lockBlockLeft,
    lockBlockRight,
    lockBlockPiecesPerSide,
    doubleFrameSides,
    doubleFrameCount: numericDoubleCount,
  });

  const cuttingPlan = useCuttingPlan(results, currentFrame, coreType);
  const coreCalculation = useCoreCalculation(results, coreType);

  const isDataComplete = doorThickness && doorWidth && doorHeight;
  const piecesPerSide = parseInt(lockBlockPiecesPerSide) || 0;

  const doubleConfigSummary = useMemo(() => {
    const df = results.doubleFrame;
    if (!df?.hasAny || !df.count) return "";
    const sideLabels = {
      top: "บน",
      bottom: "ล่าง",
      left: "ซ้าย",
      center: "กลาง",
      right: "ขวา",
    };
    const sides = Object.entries(sideLabels)
      .filter(([key]) => df[key])
      .map(([_, label]) => label);
    return sides.length
      ? `กรอบซ้อนด้าน ${sides.join(", ")} จำนวน ${df.count} ชั้น/ด้าน`
      : "";
  }, [results]);

  const handleToggleDoubleSide = useCallback((side) => {
    setDoubleFrameSides((prev) => {
      if (side === "all") {
        const newValue = !prev.all;
        return {
          top: newValue,
          bottom: newValue,
          left: newValue,
          center: newValue,
          right: newValue,
          all: newValue,
        };
      }
      return { ...prev, [side]: !prev[side], all: false };
    });
  }, []);

  const lockBlockDesc =
    lockBlockLeft && lockBlockRight
      ? `ซ้าย ${piecesPerSide} + ขวา ${piecesPerSide}`
      : lockBlockLeft
        ? `Left ${piecesPerSide}`
        : lockBlockRight
          ? `Right ${piecesPerSide}`
          : "-";

  const uiProps = {
    formRef,
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
    frameType,
    setFrameType,
    selectedFrameCode,
    setSelectedFrameCode,
    lockBlockPosition,
    setLockBlockPosition,
    lockBlockPiecesPerSide,
    setLockBlockPiecesPerSide,
    doubleFrameSides,
    doubleFrameCount,
    setDoubleFrameCount,
    coreType,
    setCoreType,
    lockBlockLeft,
    lockBlockRight,
    frameSelection,
    currentFrame,
    results,
    cuttingPlan,
    coreCalculation,
    isDataComplete,
    piecesPerSide,
    doubleConfigSummary,
    handleToggleDoubleSide,
    lockBlockDesc,
  };

  return <UIDoorBom {...uiProps} />;
}
