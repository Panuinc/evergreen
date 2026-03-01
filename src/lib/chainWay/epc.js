const EPC_BYTES = 12; /* 96-bit tag */
const MAX_RFID_CODE = 99999999; // 8 digits max for EPC encoding
const MAX_SEQUENCE = 25; // A-P encoding limit (0-9 + A-P)

export function generatePlainEPC(
  rfidCodeOrItemNumber,
  sequenceNumber,
  totalQuantity,
) {
  // Validate rfidCode range
  if (typeof rfidCodeOrItemNumber === "number") {
    if (rfidCodeOrItemNumber < 1 || rfidCodeOrItemNumber > MAX_RFID_CODE) {
      throw new Error(
        `rfidCode ต้องอยู่ระหว่าง 1 - ${MAX_RFID_CODE.toLocaleString()} (ได้รับ ${rfidCodeOrItemNumber})`,
      );
    }
  }

  // Validate sequence/total range
  if (sequenceNumber > MAX_SEQUENCE || totalQuantity > MAX_SEQUENCE) {
    throw new Error(
      `จำนวนต่อ batch ต้องไม่เกิน ${MAX_SEQUENCE} ชิ้น (seq=${sequenceNumber}, total=${totalQuantity})`,
    );
  }

  const seqChar =
    sequenceNumber <= 9
      ? String(sequenceNumber)
      : String.fromCharCode(55 + sequenceNumber);

  const totalChar =
    totalQuantity <= 9
      ? String(totalQuantity)
      : String.fromCharCode(55 + totalQuantity);

  let content;

  if (typeof rfidCodeOrItemNumber === "number") {
    /* rfidCode (integer) → zero-padded 8 digits + /seq+total = 11 chars */
    const codeStr = String(rfidCodeOrItemNumber).padStart(8, "0");
    content = `${codeStr}/${seqChar}${totalChar}`;
  } else {
    /* Fallback: compact item number (strip dashes) */
    const compact = String(rfidCodeOrItemNumber).replace(/-/g, "");
    const withSeq = `${compact}/${seqChar}${totalChar}`;
    content = withSeq.length <= EPC_BYTES ? withSeq : compact;
  }

  let hexEPC = "";
  for (let i = 0; i < EPC_BYTES; i++) {
    const code = i < content.length ? content.charCodeAt(i) : 0;
    hexEPC += code.toString(16).toUpperCase().padStart(2, "0");
  }

  return hexEPC;
}

export const EPCService = {
  generate(item, options = {}) {
    const { sequenceNumber = 1, totalQuantity = 1 } = options;
    const key = item.rfidCode ?? item.number;
    return generatePlainEPC(key, sequenceNumber, totalQuantity);
  },

  generateBatch(item, quantity, options = {}) {
    const results = [];

    for (let i = 1; i <= quantity; i++) {
      const epc = this.generate(item, {
        ...options,
        sequenceNumber: i,
        totalQuantity: quantity,
      });

      results.push({
        epc,
        sequenceNumber: i,
        totalQuantity: quantity,
        sequenceText: `${i}/${quantity}`,
      });
    }

    return results;
  },

  parse(epc) {
    if (!epc) return null;

    const bits = epc.length * 4;

    let raw = "";
    for (let i = 0; i < epc.length; i += 2) {
      const hex = epc.substring(i, i + 2);
      const charCode = parseInt(hex, 16);
      if (charCode === 0) break;
      raw += String.fromCharCode(charCode);
    }

    const slashIndex = raw.lastIndexOf("/");
    let rfidCode = null;
    let itemCompact = "";
    let sequence = null;
    let total = null;
    let sequenceText = "";

    if (slashIndex !== -1 && slashIndex < raw.length - 2) {
      itemCompact = raw.substring(0, slashIndex).trim();
      const seqChar = raw[slashIndex + 1];
      const totalChar = raw[slashIndex + 2];

      sequence =
        seqChar >= "A" ? seqChar.charCodeAt(0) - 55 : parseInt(seqChar, 10);
      total =
        totalChar >= "A"
          ? totalChar.charCodeAt(0) - 55
          : parseInt(totalChar, 10);

      sequenceText = `${sequence}/${total}`;

      /* All digits = rfidCode; otherwise = compact item number */
      if (/^\d+$/.test(itemCompact)) {
        rfidCode = parseInt(itemCompact, 10);
      }
    } else {
      itemCompact = raw.trim();
      if (/^\d+$/.test(itemCompact)) {
        rfidCode = parseInt(itemCompact, 10);
      }
    }

    return {
      raw: epc,
      bits,
      bytes: bits / 8,
      hexLength: epc.length,
      decoded: raw,
      rfidCode,
      itemCompact: rfidCode ? null : itemCompact,
      sequence,
      total,
      sequenceText,
    };
  },
};

export default EPCService;
