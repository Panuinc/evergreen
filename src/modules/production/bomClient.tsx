"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import {
  coreTypeConfig,
  useFrameSelection,
  useCalculations,
  useCuttingPlan,
  useFrameLengthOptimizer,
  useCoreCalculation,
} from "@/modules/production/hooks/bomCalculations";
import BomView from "@/modules/production/components/bomView";

export default function BomClient() {


  // --- Frames data (inlined from useFrames) ---
  const fetcher = (url: string) => get(url);
  const { data: framesData, isLoading: framesLoading } = useSWR("/api/production/frames", fetcher, { revalidateOnFocus: false });
  const erpFrames = framesData || { rubberwood: [], sadao: [], lvl: [] };

  // --- Cores data (inlined from useCores) ---
  const { data: coresData, isLoading: coresLoading } = useSWR("/api/production/cores", fetcher, { revalidateOnFocus: false });
  const coreItems = useMemo(() => coresData || { foam: [], rockwool: [], particle: [], plywood: [], honeycomb: [] }, [coresData]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (coreItems as any)[config.dbKey] || [];
  }, [coreType, coreItems]);

  const selectedCoreItem = useMemo(() => {
    if (!selectedCoreCode || !availableCoreItems.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return availableCoreItems.find((item: any) => item.bcItemNo === selectedCoreCode) || null;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = c.allFrames.find((f: any) => f.bcItemNo === selectedFrameCode);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frameUnitCost = (currentFrame as any)?.bcItemUnitCost || 0;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coreUnitCost = (selectedCoreItem as any)?.bcItemUnitCost || 0;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripLength = (selectedCoreItem as any)?.length || 0;

      const sheetWidth =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selectedCoreItem as any)?.width || (coreCalculation as any)?.coreType?.sheetWidth || 0;
      const columns = coreCalculation?.columns || 0;
      const damPieces = coreCalculation?.damPieces?.length || 0;

      let totalStrips = 0;
      if (stripLength > 0 && coreCalculation?.pieces?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const piecesByCol: Record<string, number[]> = {};
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
    const sideLabels: Record<string, string> = {
      top: "\u0E1A\u0E19",
      bottom: "\u0E25\u0E48\u0E32\u0E07",
      left: "\u0E0B\u0E49\u0E32\u0E22",
      center: "\u0E01\u0E25\u0E32\u0E07",
      right: "\u0E02\u0E27\u0E32",
    };
    const sides = Object.entries(sideLabels)
      .filter(([key]) => (df as Record<string, unknown>)[key])
      .map(([, label]) => label);
    return sides.length
      ? `\u0E01\u0E23\u0E2D\u0E1A\u0E0B\u0E49\u0E2D\u0E19\u0E14\u0E49\u0E32\u0E19 ${sides.join(", ")} \u0E08\u0E33\u0E19\u0E27\u0E19 ${df.count} \u0E0A\u0E31\u0E49\u0E19/\u0E14\u0E49\u0E32\u0E19`
      : "";
  }, [results]);

  const handleToggleDoubleSide = useCallback((side: string) => {
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
      return { ...prev, [side]: !prev[side as keyof typeof prev], all: false };
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
