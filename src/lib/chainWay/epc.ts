const EPC_BYTES = 12;
const MAX_SEQUENCE = 99;

export function generatePlainEPC(
  rfidCodeOrItemNumber: string | number,
  sequenceNumber: number,
  totalQuantity: number,
): string {
  if (sequenceNumber > MAX_SEQUENCE || totalQuantity > MAX_SEQUENCE) {
    throw new Error(
      `จำนวนต่อ batch ต้องไม่เกิน ${MAX_SEQUENCE} ชิ้น (seq=${sequenceNumber}, total=${totalQuantity})`,
    );
  }

  const seqStr = String(sequenceNumber).padStart(2, "0");
  const totalStr = String(totalQuantity).padStart(2, "0");

  let content: string;
  if (typeof rfidCodeOrItemNumber === "number") {
    const codeStr = String(rfidCodeOrItemNumber).padStart(6, "0");
    content = `${codeStr}/${seqStr}${totalStr}`;
  } else {
    const compact = String(rfidCodeOrItemNumber).replace(/-/g, "");
    const withSeq = `${compact}/${seqStr}${totalStr}`;
    content = withSeq.length <= EPC_BYTES ? withSeq : compact;
  }

  let hexEPC = "";
  for (let i = 0; i < EPC_BYTES; i++) {
    const code = i < content.length ? content.charCodeAt(i) : 0;
    hexEPC += code.toString(16).toUpperCase().padStart(2, "0");
  }

  return hexEPC;
}
