"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";

const glueThickness = 1;
const lockBlockHeight = 400;
const lockBlockPosition = 1000;
const cutAllowance = 10;

const noRailCoreTypes = ["foam", "particle_solid", "honeycomb"];

const coreTypeConfig = [
  {
    value: "foam",
    label: "\u0E42\u0E1F\u0E21 EPS",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "foam",
  },
  {
    value: "plywood_strips",
    label: "\u0E44\u0E21\u0E49\u0E2D\u0E31\u0E14\u0E40\u0E2A\u0E49\u0E19",
    type: "strips",
    thickness: 4,
    spacing: 40,
    sheetWidth: 1220,
    dbKey: "plywood",
  },
  {
    value: "particle_solid",
    label: "\u0E44\u0E21\u0E49\u0E1B\u0E32\u0E23\u0E4C\u0E15\u0E34\u0E40\u0E04\u0E34\u0E25 (\u0E41\u0E1C\u0E48\u0E19\u0E40\u0E15\u0E47\u0E21)",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "particle",
  },
  {
    value: "rockwool",
    label: "\u0E23\u0E47\u0E2D\u0E04\u0E27\u0E39\u0E25",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "rockwool",
  },
  {
    value: "honeycomb",
    label: "\u0E23\u0E31\u0E07\u0E1C\u0E36\u0E49\u0E07",
    type: "solid",
    thickness: null,
    spacing: null,
    dbKey: "honeycomb",
  },
  {
    value: "particle_strips",
    label: "\u0E44\u0E21\u0E49\u0E1B\u0E32\u0E23\u0E4C\u0E15\u0E34\u0E40\u0E04\u0E34\u0E25\u0E40\u0E2A\u0E49\u0E19",
    type: "strips",
    thickness: 12,
    spacing: null,
    sheetWidth: 1220,
    dbKey: "particle",
  },
];

const frameTypes = [
  { value: "rubberwood", label: "\u0E44\u0E21\u0E49\u0E22\u0E32\u0E07\u0E1E\u0E32\u0E23\u0E32" },
  { value: "sadao", label: "\u0E44\u0E21\u0E49\u0E2A\u0E30\u0E40\u0E14\u0E32" },
  { value: "lvl", label: "\u0E44\u0E21\u0E49 LVL" },
];

const useFrameSelection = (
  doorThickness,
  surfaceThickness,
  doorHeight,
  erpFrames,
) => {
  return useMemo(() => {
    const S = parseFloat(surfaceThickness) || 0;
    const requiredThickness = doorThickness
      ? parseFloat(doorThickness) - (S + glueThickness) * 2
      : 0;
    const requiredLength = doorHeight ? parseFloat(doorHeight) : 0;

    if (!requiredThickness || !erpFrames) {
      return { candidates: [] };
    }

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
      if (isFlipped) parts.push("\u0E1E\u0E25\u0E34\u0E01");
      if (planeAmount > 0) parts.push(`\u0E44\u0E2A ${planeAmount}\u0E21\u0E21.`);
      if (needSplice) parts.push("\u0E15\u0E48\u0E2D 2 \u0E0A\u0E34\u0E49\u0E19");
      const suffix = parts.length > 0 ? ` (${parts.join("+")})` : "";
      return isFlipped
        ? `${f.width}\u00D7${f.thickness}\u00D7${f.length}${suffix}`
        : `${f.thickness}\u00D7${f.width}\u00D7${f.length}${suffix}`;
    };

    const mapFrame = (f, isFlipped, needSplice, spliceInfo) => {
      const actualPlane = isFlipped
        ? f.width - requiredThickness
        : f.thickness - requiredThickness;
      const plane = Math.max(0, actualPlane);
      return {
        ...f,
        useThickness: isFlipped ? f.width - plane : f.thickness - plane,
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

    const strategyPriority = {
      exact: 0,
      flip_exact: 1,
      plane: 2,
      flip_plane: 3,
      splice: 4,
      flip_splice: 5,
      splice_plane: 6,
      flip_splice_plane: 7,
    };

    const allCandidates = [];

    for (const ft of frameTypes) {
      const frames = erpFrames[ft.value] || [];
      if (frames.length === 0) continue;

      const exact = filterAndSort(
        frames.filter((f) => f.thickness === requiredThickness),
      );
      if (exact.length > 0) {
        const best = exact[0];
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "exact",
          priority: strategyPriority.exact,
          frame: mapFrame(best, false, false, null),
          allFrames: exact.map((f) => mapFrame(f, false, false, null)),
        });
      }

      const flipExact = filterAndSort(
        frames.filter((f) => f.width === requiredThickness),
      );
      if (flipExact.length > 0) {
        const best = flipExact[0];
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "flip_exact",
          priority: strategyPriority.flip_exact,
          frame: mapFrame(best, true, false, null),
          allFrames: flipExact.map((f) => mapFrame(f, true, false, null)),
        });
      }

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
      if (thicker.length > 0) {
        const best = thicker[0];
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "plane",
          priority: strategyPriority.plane,
          frame: mapFrame(best, false, false, null),
          allFrames: thicker.map((f) => mapFrame(f, false, false, null)),
        });
      }

      const flipPlane = frames
        .filter(
          (f) => f.width > requiredThickness && f.length >= requiredLength,
        )
        .sort((a, b) =>
          a.width !== b.width ? a.width - b.width : a.length - b.length,
        );
      if (flipPlane.length > 0) {
        const best = flipPlane[0];
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "flip_plane",
          priority: strategyPriority.flip_plane,
          frame: mapFrame(best, true, false, null),
          allFrames: flipPlane.map((f) => mapFrame(f, true, false, null)),
        });
      }

      const spliceExact = findSpliceable(
        frames.filter((f) => f.thickness === requiredThickness),
      );
      if (spliceExact) {
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "splice",
          priority: strategyPriority.splice,
          frame: mapFrame(spliceExact.frame, false, true, spliceExact),
          allFrames: [mapFrame(spliceExact.frame, false, true, spliceExact)],
        });
      }

      const flipSplice = findSpliceable(
        frames.filter((f) => f.width === requiredThickness),
      );
      if (flipSplice) {
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "flip_splice",
          priority: strategyPriority.flip_splice,
          frame: mapFrame(flipSplice.frame, true, true, flipSplice),
          allFrames: [mapFrame(flipSplice.frame, true, true, flipSplice)],
        });
      }

      const splicePlane = findSpliceable(
        frames.filter((f) => f.thickness > requiredThickness),
      );
      if (splicePlane) {
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "splice_plane",
          priority: strategyPriority.splice_plane,
          frame: mapFrame(splicePlane.frame, false, true, splicePlane),
          allFrames: [mapFrame(splicePlane.frame, false, true, splicePlane)],
        });
      }

      const flipSplicePlane = findSpliceable(
        frames.filter((f) => f.width > requiredThickness),
      );
      if (flipSplicePlane) {
        allCandidates.push({
          frameType: ft.value,
          frameTypeLabel: ft.label,
          strategy: "flip_splice_plane",
          priority: strategyPriority.flip_splice_plane,
          frame: mapFrame(flipSplicePlane.frame, true, true, flipSplicePlane),
          allFrames: [
            mapFrame(flipSplicePlane.frame, true, true, flipSplicePlane),
          ],
        });
      }
    }

    allCandidates.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (a.frame.unitCost || 0) - (b.frame.unitCost || 0);
    });

    const seen = new Set();
    const candidates = allCandidates.filter((c) => {
      if (seen.has(c.frameType)) return false;
      seen.add(c.frameType);
      return true;
    });

    return { candidates };
  }, [doorThickness, surfaceThickness, doorHeight, erpFrames]);
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
    const totalSurfaceThickness = (S + glueThickness) * 2;
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

    const lockBlockZoneTop = lockBlockPosition - lockBlockHeight / 2;
    const lockBlockZoneBottom = lockBlockPosition + lockBlockHeight / 2;
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

    const lockBlockTop = lockBlockPosition - lockBlockHeight / 2;
    const lockBlockBottom = lockBlockPosition + lockBlockHeight / 2;
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
      lockBlockHeight: lockBlockHeight,
      lockBlockPosition: lockBlockPosition,
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




function runBinPacking(allPieces, stockLength, sawKerf = 5) {
  const sorted = [...allPieces].sort(
    (a, b) => (b.cutLength ?? b.length) - (a.cutLength ?? a.length),
  );
  const stocks = [];
  sorted.forEach((piece) => {
    const pieceCut = piece.cutLength ?? piece.length;
    const pieceWithKerf = pieceCut + sawKerf;
    const available = stocks.find((s) => s.remaining >= pieceWithKerf);
    if (available) {
      available.pieces.push(piece);
      available.remaining -= pieceWithKerf;
      available.used += pieceWithKerf;
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
  return stocks;
}


function expandPieces(cutPieces, orderQty = 1) {
  return cutPieces.flatMap((piece) =>
    Array.from({ length: piece.qty * orderQty }, (_, i) => ({
      ...piece,
      id: `${piece.name}-${i + 1}`,
    })),
  );
}


function computeStockStats(stocks, stockLength) {
  const totalStocks = stocks.length;
  const totalStock = totalStocks * stockLength;
  const totalWaste = stocks.reduce((sum, s) => sum + s.remaining, 0);
  const usedLength = totalStock - totalWaste;
  const efficiency = totalStock
    ? ((usedLength / totalStock) * 100).toFixed(1)
    : "0.0";
  return { totalStocks, totalStock, totalWaste, usedLength, efficiency };
}



const useCuttingPlan = (results, currentFrame, coreType, orderQty) => {
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
        batch: null,
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
      const cutLength = finishedLength + (withAllowance ? cutAllowance : 0);
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
      addPiece("\u0E40\u0E2A\u0E32 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 1)", pieceLength, 2, "secondary", true);
      addPiece("\u0E40\u0E2A\u0E32 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 2)", pieceLength, 2, "warning", true);
    } else {
      addPiece("\u0E40\u0E2A\u0E32", stileLength, 2, "secondary");
    }

    const railLength = W - 2 * F;
    addPiece("\u0E23\u0E32\u0E27", railLength, 2, "primary");

    const clearHeight = H - 2 * F;
    const clearWidth = W - 2 * F;

    if (doubleFrame?.hasAny && doubleFrame.count > 0) {
      const count = doubleFrame.count;

      if (doubleFrame.left) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece(
            "\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E0B\u0E49\u0E32\u0E22 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 1)",
            pieceLength,
            count,
            "warning",
            true,
          );
          addPiece(
            "\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E0B\u0E49\u0E32\u0E22 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E0B\u0E49\u0E32\u0E22", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.right) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece(
            "\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E02\u0E27\u0E32 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 1)",
            pieceLength,
            count,
            "warning",
            true,
          );
          addPiece(
            "\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E02\u0E27\u0E32 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("\u0E40\u0E2A\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E02\u0E27\u0E32", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.center) {
        if (needSplice && clearHeight > stockLength) {
          const pieceLength = Math.ceil(clearHeight / 2) + spliceOverlap / 2;
          addPiece("\u0E40\u0E2A\u0E32\u0E01\u0E25\u0E32\u0E07 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 1)", pieceLength, count, "warning", true);
          addPiece(
            "\u0E40\u0E2A\u0E32\u0E01\u0E25\u0E32\u0E07 (\u0E0A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48 2)",
            pieceLength,
            count,
            "secondary",
            true,
          );
        } else {
          addPiece("\u0E40\u0E2A\u0E32\u0E01\u0E25\u0E32\u0E07", clearHeight, count, "warning");
        }
      }

      if (doubleFrame.top) {
        let topLength = clearWidth;
        if (doubleFrame.left) topLength -= F * count;
        if (doubleFrame.right) topLength -= F * count;
        addPiece("\u0E23\u0E32\u0E27\u0E0B\u0E49\u0E2D\u0E19\u0E1A\u0E19", topLength, count, "secondary");
      }

      if (doubleFrame.bottom) {
        let bottomLength = clearWidth;
        if (doubleFrame.left) bottomLength -= F * count;
        if (doubleFrame.right) bottomLength -= F * count;
        addPiece("\u0E23\u0E32\u0E27\u0E0B\u0E49\u0E2D\u0E19\u0E25\u0E48\u0E32\u0E07", bottomLength, count, "secondary");
      }
    }

    const railCount = railSections - 1;
    const skipRailCoreTypes = [...noRailCoreTypes, "particle_strips"];
    if (railCount > 0 && !skipRailCoreTypes.includes(coreType)) {
      let damLength = clearWidth;
      if (doubleFrame?.hasAny && doubleFrame.count > 0) {
        if (doubleFrame.left) damLength -= F * doubleFrame.count;
        if (doubleFrame.right) damLength -= F * doubleFrame.count;
      }
      addPiece("\u0E04\u0E32\u0E19\u0E02\u0E27\u0E32\u0E07", damLength, railCount, "primary");
    }

    if (lockBlockCount > 0) {
      addPiece(
        "\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E25\u0E47\u0E2D\u0E04",
        lockBlockHeight,
        lockBlockCount,
        "danger",
        false,
        false,
      );
    }


    const allPieces = expandPieces(cutPieces, 1);
    const stocks = runBinPacking(allPieces, stockLength, sawKerf);
    const { totalStocks, totalStock, totalWaste, usedLength, efficiency } =
      computeStockStats(stocks, stockLength);

    const spliceCount =
      cutPieces.filter((p) => p.isSplice).reduce((sum, p) => sum + p.qty, 0) /
      2;


    const batchQty = Math.max(1, parseInt(orderQty) || 1);
    let batch = null;
    if (batchQty > 1) {
      const batchPieces = expandPieces(cutPieces, batchQty);
      const batchStocks = runBinPacking(batchPieces, stockLength, sawKerf);
      const batchStats = computeStockStats(batchStocks, stockLength);
      const naiveStocksTotal = totalStocks * batchQty;
      batch = {
        ...batchStats,
        stocks: batchStocks,
        naiveStocksTotal,
        savedStocks: naiveStocksTotal - batchStats.totalStocks,
        orderQty: batchQty,
      };
    }

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
      batch,
    };
  }, [results, currentFrame, coreType, orderQty]);
};


const useFrameLengthOptimizer = (cutPieces, frameCandidates, orderQty, selectedFrameCode) => {
  return useMemo(() => {
    const empty = {
      allOptions: [],
      recommendedFrameCode: null,
      recommendedOption: null,
      currentOption: null,
      potentialSavings: 0,
    };
    if (!cutPieces?.length || !frameCandidates?.length) return empty;

    const batchQty = Math.max(1, parseInt(orderQty) || 1);
    const sawKerf = 5;


    const allOptions = frameCandidates
      .flatMap((candidate) =>
        (candidate.allFrames || []).map((frame) => {
          const pieces = expandPieces(cutPieces, batchQty);
          const stocks = runBinPacking(pieces, frame.length || 2040, sawKerf);
          const stats = computeStockStats(stocks, frame.length || 2040);
          const totalCost = stocks.length * (frame.unitCost || 0);
          return {
            frame,
            candidateKey: `${candidate.frameType}-${candidate.strategy}`,
            totalStocks: stocks.length,
            stocksPerDoor: stocks.length / batchQty,
            totalCost,
            costPerDoor: totalCost / batchQty,
            efficiency: stats.efficiency,
          };
        }),
      )
      .sort((a, b) => a.totalCost - b.totalCost);

    if (allOptions.length === 0) return empty;

    const recommendedOption = allOptions[0];
    const recommendedFrameCode = recommendedOption.frame.code;

    const currentCode = selectedFrameCode || frameCandidates[0]?.frame?.code;
    const currentOption =
      allOptions.find((o) => o.frame.code === currentCode) || recommendedOption;

    const potentialSavings = Math.max(
      0,
      (currentOption?.totalCost || 0) - (recommendedOption?.totalCost || 0),
    );

    return { allOptions, recommendedFrameCode, recommendedOption, currentOption, potentialSavings };
  }, [cutPieces, frameCandidates, orderQty, selectedFrameCode]);
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
    const coreConfig = coreTypeConfig.find((c) => c.value === coreType);
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

      const isFullPanelCore = noRailCoreTypes.includes(coreType);

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
            name: "\u0E44\u0E2A\u0E49\u0E2A\u0E48\u0E27\u0E19\u0E1A\u0E19",
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
                name: "\u0E44\u0E2A\u0E49\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
                x: leftOffset + solidLockBlockWidth,
                y: lockBlockYTop,
                width: middleWidth,
                height: middleHeight,
              });
            }
          } else if (lockBlockLeft) {
            pieces.push({
              name: "\u0E44\u0E2A\u0E49\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
              x: leftOffset + solidLockBlockWidth,
              y: lockBlockYTop,
              width: coreWidth - solidLockBlockWidth,
              height: middleHeight,
            });
          } else if (lockBlockRight) {
            pieces.push({
              name: "\u0E44\u0E2A\u0E49\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
              x: leftOffset,
              y: lockBlockYTop,
              width: coreWidth - solidLockBlockWidth,
              height: middleHeight,
            });
          }
        }

        if (lockBlockYBottom < H - bottomOffset) {
          pieces.push({
            name: "\u0E44\u0E2A\u0E49\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E48\u0E32\u0E07",
            x: leftOffset,
            y: lockBlockYBottom,
            width: coreWidth,
            height: H - bottomOffset - lockBlockYBottom,
          });
        }
      } else if (isFullPanelCore && !hasLockBlock) {
        pieces.push({
          name: "\u0E44\u0E2A\u0E49\u0E40\u0E15\u0E47\u0E21\u0E41\u0E1C\u0E48\u0E19",
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
                name: `\u0E44\u0E2A\u0E49\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${rowIdx + 1} (\u0E0B\u0E49\u0E32\u0E22)`,
                x: leftOffset + solidLockBlockWidth,
                y: row.top,
                width: (coreWidth - solidLockBlockWidth * 2) / 2,
                height: row.height,
              });
              pieces.push({
                name: `\u0E44\u0E2A\u0E49\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${rowIdx + 1} (\u0E02\u0E27\u0E32)`,
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
                name: `\u0E44\u0E2A\u0E49\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${rowIdx + 1}`,
                x: leftOffset + solidLockBlockWidth,
                y: row.top,
                width: coreWidth - solidLockBlockWidth,
                height: row.height,
              });
            } else if (lockBlockRight) {
              pieces.push({
                name: `\u0E44\u0E2A\u0E49\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${rowIdx + 1}`,
                x: leftOffset,
                y: row.top,
                width: coreWidth - solidLockBlockWidth,
                height: row.height,
              });
            }
          } else {
            pieces.push({
              name: `\u0E44\u0E2A\u0E49\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${rowIdx + 1}`,
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
              name: `\u0E04\u0E32\u0E19\u0E02\u0E27\u0E32\u0E07\u0E1B\u0E32\u0E23\u0E4C\u0E15\u0E34\u0E40\u0E04\u0E34\u0E25 ${idx + 1}`,
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
import BomView from "@/modules/production/components/bomView";

export default function BomClient() {


  // --- Frames data (inlined from useFrames) ---
  const fetcher = (url) => get(url);
  const { data: framesData, isLoading: framesLoading } = useSWR("/api/production/frames", fetcher);
  const erpFrames = framesData || { rubberwood: [], sadao: [], lvl: [] };

  // --- Cores data (inlined from useCores) ---
  const { data: coresData, isLoading: coresLoading } = useSWR("/api/production/cores", fetcher);
  const coreItems = coresData || { foam: [], rockwool: [], particle: [], plywood: [], honeycomb: [] };

  const formRef = useRef(null);
  const [customerPO, setCustomerPO] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [doorType, setDoorType] = useState("");
  const [doorThickness, setDoorThickness] = useState("");
  const [doorWidth, setDoorWidth] = useState("");
  const [doorHeight, setDoorHeight] = useState("");
  const [surfaceMaterial, setSurfaceMaterial] = useState("");
  const [surfacePrice, setSurfacePrice] = useState("");
  const [surfaceThickness, setSurfaceThickness] = useState("");
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
  const [selectedCoreCode, setSelectedCoreCode] = useState("");
  const [edgeBanding, setEdgeBanding] = useState(false);
  const [edgeMaterial, setEdgeMaterial] = useState("");
  const [edgePrice, setEdgePrice] = useState("");
  const [edgeSides, setEdgeSides] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false,
  });
  const [drilling, setDrilling] = useState(false);
  const [drillItems, setDrillItems] = useState({
    doorCloser: { checked: false, price: "" },
    handle: { checked: false, price: "" },
    peephole: { checked: false, price: "" },
    hinge: { checked: false, price: "" },
    dropSeal: { checked: false, price: "" },
  });

  const [customMargin, setCustomMargin] = useState("");

  const availableCoreItems = useMemo(() => {
    if (!coreType || !coreItems) return [];
    const config = coreTypeConfig.find((c) => c.value === coreType);
    if (!config) return [];
    return coreItems[config.dbKey] || [];
  }, [coreType, coreItems]);

  const selectedCoreItem = useMemo(() => {
    if (!selectedCoreCode || !availableCoreItems.length) return null;
    return availableCoreItems.find((item) => item.code === selectedCoreCode) || null;
  }, [selectedCoreCode, availableCoreItems]);

  const lockBlockLeft =
    lockBlockPosition === "left" || lockBlockPosition === "both";
  const lockBlockRight =
    lockBlockPosition === "right" || lockBlockPosition === "both";

  const frameSelection = useFrameSelection(
    doorThickness,
    surfaceThickness,
    doorHeight,
    erpFrames,
  );

  const currentFrame = useMemo(() => {
    const emptyFrame = {
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
    if (!frameSelection.candidates?.length) return emptyFrame;

    if (selectedFrameCode) {
      for (const c of frameSelection.candidates) {
        const found = c.allFrames.find((f) => f.code === selectedFrameCode);
        if (found) return found;
      }
    }

    return frameSelection.candidates[0]?.frame || emptyFrame;
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

  const cuttingPlan = useCuttingPlan(results, currentFrame, coreType, orderQty);
  const frameLengthOptions = useFrameLengthOptimizer(
    cuttingPlan.cutPieces,
    frameSelection.candidates,
    orderQty,
    selectedFrameCode,
  );
  const coreCalculation = useCoreCalculation(results, coreType);

  const priceSummary = useMemo(() => {
    const frameUnitCost = currentFrame?.unitCost || 0;
    const qty = parseInt(orderQty) || 0;
    const batchQty = Math.max(1, qty);


    const frameStocks = cuttingPlan?.totalStocks || 0;
    const frameCost = frameUnitCost * frameStocks;


    const frameStocksTotal =
      cuttingPlan?.batch?.totalStocks ?? frameStocks * batchQty;
    const frameCostTotal = frameUnitCost * frameStocksTotal;


    const frameCostPerDoor = qty > 0 ? frameCostTotal / qty : frameCost;


    const frameSavings = Math.max(
      0,
      frameCost * (qty || 1) - frameCostTotal,
    );

    const surface = (parseFloat(surfacePrice) || 0) * 2;

    const coreUnitCost = selectedCoreItem?.unitCost || 0;
    const isSolidCore = coreCalculation?.isSolid !== false;
    let coreQtyUsed = 0;
    let coreQtyLabel = "";

    let coreStrips = 0;
    let coreStripsPerSheet = 0;
    let coreSheetWidth = 0;
    let coreStripCutWidth = 0;

    if (isSolidCore) {
      coreQtyUsed = coreCalculation?.totalPieces || 0;
      coreQtyLabel = `${coreQtyUsed} \u0E41\u0E1C\u0E48\u0E19`;
    } else {
      const stripLength = selectedCoreItem?.length || 0;

      const sheetWidth =
        selectedCoreItem?.width || coreCalculation?.coreType?.sheetWidth || 0;
      const columns = coreCalculation?.columns || 0;
      const damPieces = coreCalculation?.damPieces?.length || 0;

      let totalStrips = 0;
      if (stripLength > 0 && coreCalculation?.pieces?.length > 0) {
        const piecesByCol = {};
        for (const p of coreCalculation.pieces) {
          if (!piecesByCol[p.col]) piecesByCol[p.col] = [];
          piecesByCol[p.col].push(p.height);
        }

        for (const col in piecesByCol) {
          const totalHeight = piecesByCol[col].reduce((s, h) => s + h, 0);
          totalStrips += Math.ceil(totalHeight / stripLength);
        }

        if (damPieces > 0 && coreCalculation.damPieces) {
          for (const dam of coreCalculation.damPieces) {
            totalStrips += Math.ceil((dam.width || 0) / stripLength);
          }
        }
      } else {
        totalStrips = columns + damPieces;
      }



      const stripCutWidth = parseInt(doorThickness) || 0;
      const stripsPerSheet =
        sheetWidth > 0 && stripCutWidth > 0
          ? Math.floor(sheetWidth / stripCutWidth)
          : 0;
      const sheetsNeeded =
        stripsPerSheet > 0 ? Math.ceil(totalStrips / stripsPerSheet) : totalStrips;

      coreQtyUsed = sheetsNeeded;
      coreQtyLabel =
        stripsPerSheet > 0
          ? `${sheetsNeeded} \u0E41\u0E1C\u0E48\u0E19 (${totalStrips} \u0E40\u0E2A\u0E49\u0E19)`
          : `${totalStrips} \u0E40\u0E2A\u0E49\u0E19`;

      coreStrips = totalStrips;
      coreStripsPerSheet = stripsPerSheet;
      coreSheetWidth = sheetWidth;
      coreStripCutWidth = stripCutWidth;
    }



    let core;
    if (!isSolidCore && coreStripsPerSheet > 0) {
      core = (coreStrips / coreStripsPerSheet) * coreUnitCost;
    } else {
      core = coreUnitCost * coreQtyUsed;
    }

    const edge = edgeBanding ? (parseFloat(edgePrice) || 0) : 0;
    const drillCost = Object.values(drillItems).reduce(
      (sum, item) =>
        item.checked ? sum + (parseFloat(item.price) || 0) : sum,
      0,
    );
    const margin = parseFloat(customMargin) || 0;


    const nonFramePerDoor = surface + core + edge + drillCost;
    const totalPerDoor = frameCostPerDoor + nonFramePerDoor;


    const grandTotal = qty > 0 ? frameCostTotal + nonFramePerDoor * qty : 0;

    return {
      frameCost: frameCostPerDoor,
      frameCostNaive: frameCost,
      frameStocks,
      frameStocksTotal,
      frameUnitCost,
      frameSavings,
      surface,
      core,
      coreQtyUsed,
      coreQtyLabel,
      coreUnitCost,
      coreStrips,
      coreStripsPerSheet,
      coreSheetWidth,
      coreStripCutWidth,
      edge,
      drillCost,
      totalPerDoor,
      plus10: totalPerDoor * 1.1,
      profit20: totalPerDoor * 1.2,
      customPrice: totalPerDoor + margin,
      qty,
      grandTotal,
      grandPlus10: grandTotal * 1.1,
      grandProfit20: grandTotal * 1.2,
      grandCustom: grandTotal + margin * qty,
    };
  }, [currentFrame, surfacePrice, selectedCoreItem, edgeBanding, edgePrice, drillItems, orderQty, customMargin, cuttingPlan, coreCalculation, doorThickness]);

  const isDataComplete = doorThickness && doorWidth && doorHeight;
  const piecesPerSide = parseInt(lockBlockPiecesPerSide) || 0;

  const doubleConfigSummary = useMemo(() => {
    const df = results.doubleFrame;
    if (!df?.hasAny || !df.count) return "";
    const sideLabels = {
      top: "\u0E1A\u0E19",
      bottom: "\u0E25\u0E48\u0E32\u0E07",
      left: "\u0E0B\u0E49\u0E32\u0E22",
      center: "\u0E01\u0E25\u0E32\u0E07",
      right: "\u0E02\u0E27\u0E32",
    };
    const sides = Object.entries(sideLabels)
      .filter(([key]) => df[key])
      .map(([_, label]) => label);
    return sides.length
      ? `\u0E01\u0E23\u0E2D\u0E1A\u0E0B\u0E49\u0E2D\u0E19\u0E14\u0E49\u0E32\u0E19 ${sides.join(", ")} \u0E08\u0E33\u0E19\u0E27\u0E19 ${df.count} \u0E0A\u0E31\u0E49\u0E19/\u0E14\u0E49\u0E32\u0E19`
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
      ? `\u0E0B\u0E49\u0E32\u0E22 ${piecesPerSide} + \u0E02\u0E27\u0E32 ${piecesPerSide}`
      : lockBlockLeft
        ? `Left ${piecesPerSide}`
        : lockBlockRight
          ? `Right ${piecesPerSide}`
          : "-";


  const frameCandidates = frameSelection.candidates;

  return (
    <BomView
      formRef={formRef}
      customerPO={customerPO}
      setCustomerPO={setCustomerPO}
      orderQty={orderQty}
      setOrderQty={setOrderQty}
      doorType={doorType}
      setDoorType={setDoorType}
      doorThickness={doorThickness}
      setDoorThickness={setDoorThickness}
      doorWidth={doorWidth}
      setDoorWidth={setDoorWidth}
      doorHeight={doorHeight}
      setDoorHeight={setDoorHeight}
      surfaceMaterial={surfaceMaterial}
      setSurfaceMaterial={setSurfaceMaterial}
      surfacePrice={surfacePrice}
      setSurfacePrice={setSurfacePrice}
      surfaceThickness={surfaceThickness}
      setSurfaceThickness={setSurfaceThickness}
      selectedFrameCode={selectedFrameCode}
      setSelectedFrameCode={setSelectedFrameCode}
      frameCandidates={frameCandidates}
      lockBlockPosition={lockBlockPosition}
      setLockBlockPosition={setLockBlockPosition}
      lockBlockPiecesPerSide={lockBlockPiecesPerSide}
      setLockBlockPiecesPerSide={setLockBlockPiecesPerSide}
      doubleFrameSides={doubleFrameSides}
      doubleFrameCount={doubleFrameCount}
      setDoubleFrameCount={setDoubleFrameCount}
      coreType={coreType}
      setCoreType={setCoreType}
      selectedCoreCode={selectedCoreCode}
      setSelectedCoreCode={setSelectedCoreCode}
      availableCoreItems={availableCoreItems}
      selectedCoreItem={selectedCoreItem}
      edgeBanding={edgeBanding}
      setEdgeBanding={setEdgeBanding}
      edgeMaterial={edgeMaterial}
      setEdgeMaterial={setEdgeMaterial}
      edgePrice={edgePrice}
      setEdgePrice={setEdgePrice}
      edgeSides={edgeSides}
      setEdgeSides={setEdgeSides}
      drilling={drilling}
      setDrilling={setDrilling}
      drillItems={drillItems}
      setDrillItems={setDrillItems}
      lockBlockLeft={lockBlockLeft}
      lockBlockRight={lockBlockRight}
      currentFrame={currentFrame}
      results={results}
      cuttingPlan={cuttingPlan}
      frameLengthOptions={frameLengthOptions}
      coreCalculation={coreCalculation}
      isDataComplete={isDataComplete}
      piecesPerSide={piecesPerSide}
      doubleConfigSummary={doubleConfigSummary}
      handleToggleDoubleSide={handleToggleDoubleSide}
      lockBlockDesc={lockBlockDesc}
      priceSummary={priceSummary}
      customMargin={customMargin}
      setCustomMargin={setCustomMargin}
    />
  );
}
