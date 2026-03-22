import { useMemo } from "react";

export const glueThickness = 1;
export const lockBlockHeight = 400;
export const lockBlockPosition = 1000;
export const cutAllowance = 10;

export const noRailCoreTypes = ["foam", "particle_solid", "honeycomb"];

export const coreTypeConfig = [
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

export const frameTypes = [
  { value: "rubberwood", label: "\u0E44\u0E21\u0E49\u0E22\u0E32\u0E07\u0E1E\u0E32\u0E23\u0E32" },
  { value: "sadao", label: "\u0E44\u0E21\u0E49\u0E2A\u0E30\u0E40\u0E14\u0E32" },
  { value: "lvl", label: "\u0E44\u0E21\u0E49 LVL" },
];

export const useFrameSelection = (
  doorThickness: string,
  surfaceThickness: string,
  doorHeight: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  erpFrames: any,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterAndSort = (frameList: any[]) =>
      frameList
        .filter((f) => f.length >= requiredLength)
        .sort((a, b) => a.length - b.length);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findSpliceable = (frameList: any[]) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createDisplaySize = (f: any, isFlipped: boolean, planeAmount: number, needSplice: boolean) => {
      const parts: string[] = [];
      if (isFlipped) parts.push("\u0E1E\u0E25\u0E34\u0E01");
      if (planeAmount > 0) parts.push(`\u0E44\u0E2A ${planeAmount}\u0E21\u0E21.`);
      if (needSplice) parts.push("\u0E15\u0E48\u0E2D 2 \u0E0A\u0E34\u0E49\u0E19");
      const suffix = parts.length > 0 ? ` (${parts.join("+")})` : "";
      return isFlipped
        ? `${f.width}\u00D7${f.thickness}\u00D7${f.length}${suffix}`
        : `${f.thickness}\u00D7${f.width}\u00D7${f.length}${suffix}`;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapFrame = (f: any, isFlipped: boolean, needSplice: boolean, spliceInfo: any) => {
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

    const strategyPriority: Record<string, number> = {
      exact: 0,
      flip_exact: 1,
      plane: 2,
      flip_plane: 3,
      splice: 4,
      flip_splice: 5,
      splice_plane: 6,
      flip_splice_plane: 7,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allCandidates: any[] = [];

    for (const ft of frameTypes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const frames = (erpFrames[ft.value] || []) as any[];
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

    const seen = new Set<string>();
    const candidates = allCandidates.filter((c) => {
      if (seen.has(c.frameType)) return false;
      seen.add(c.frameType);
      return true;
    });

    return { candidates };
  }, [doorThickness, surfaceThickness, doorHeight, erpFrames]);
};

export const useCalculations = (params: {
  doorThickness: string;
  doorWidth: string;
  doorHeight: string;
  surfaceThickness: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentFrame: any;
  lockBlockLeft: boolean;
  lockBlockRight: boolean;
  lockBlockPiecesPerSide: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doubleFrameSides: any;
  doubleFrameCount: number | string;
}) => {
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

    const numericDoubleCount = parseInt(doubleFrameCount as string) || 0;
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

    const railPositions: number[] = [];
    const railPositionsOriginal: number[] = [];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runBinPacking(allPieces: any[], stockLength: number, sawKerf = 5) {
  const sorted = [...allPieces].sort(
    (a, b) => (b.cutLength ?? b.length) - (a.cutLength ?? a.length),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stocks: any[] = [];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expandPieces(cutPieces: any[], orderQty = 1) {
  return cutPieces.flatMap((piece) =>
    Array.from({ length: piece.qty * orderQty }, (_, i) => ({
      ...piece,
      id: `${piece.name}-${i + 1}`,
    })),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeStockStats(stocks: any[], stockLength: number) {
  const totalStocks = stocks.length;
  const totalStock = totalStocks * stockLength;
  const totalWaste = stocks.reduce((sum, s) => sum + s.remaining, 0);
  const usedLength = totalStock - totalWaste;
  const efficiency = totalStock
    ? ((usedLength / totalStock) * 100).toFixed(1)
    : "0.0";
  return { totalStocks, totalStock, totalWaste, usedLength, efficiency };
}

export const useCuttingPlan = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentFrame: any,
  coreType: string,
  orderQty: string,
) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cutPieces: any[] = [];

    const addPiece = (
      name: string,
      finishedLength: number,
      qty: number,
      color: string,
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

export const useFrameLengthOptimizer = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cutPieces: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frameCandidates: any[],
  orderQty: string,
  selectedFrameCode: string,
) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .flatMap((candidate: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (candidate.allFrames || []).map((frame: any) => {
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

export const useCoreCalculation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any,
  coreType: string,
) => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: any[] = [];

      if (isFullPanelCore) {
        rows = [
          { top: topOffset, bottom: H - bottomOffset, height: coreHeight },
        ];
      } else {
        const rowBoundaries = [topOffset];
        if (railPositions && railPositions.length > 0) {
          railPositions.forEach((pos: number) => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pieces: any[] = [];

      if (isFullPanelCore && hasLockBlock) {
        const lockBlockYTop = H - (lockBlockZoneEnd ?? 0);
        const lockBlockYBottom = H - (lockBlockZoneStart ?? 0);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((row: any, rowIdx: number) => {
          const rowTopFromBottom = H - row.bottom;
          const rowBottomFromBottom = H - row.top;

          if (
            hasLockBlock &&
            lockBlockZoneStart !== null &&
            lockBlockZoneEnd !== null &&
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

    let columnCount: number;
    let actualSpacing: number;

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
              railPositions.forEach((pos: number) => {
                rowBoundaries.push(H - pos - F / 2);
                rowBoundaries.push(H - pos + F / 2);
              });
            }
            rowBoundaries.push(H - bottomOffset);
            rowBoundaries.sort((a, b) => a - b);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const out: any[] = [];
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pieces: any[] = [];
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((row: any, rowIdx: number) => {
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
        ? railPositions.map((pos: number, idx: number) => {
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
