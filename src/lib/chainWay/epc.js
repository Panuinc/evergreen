const EPC_BYTES = 12;
const MAX_RFID_CODE = 999999;
const MAX_SEQUENCE = 99;

export function generatePlainEPC(
  rfidCodeOrItemNumber,
  sequenceNumber,
  totalQuantity,
) {

  if (typeof rfidCodeOrItemNumber === "number") {
    if (rfidCodeOrItemNumber < 1 || rfidCodeOrItemNumber > MAX_RFID_CODE) {
      throw new Error(
        `rfidCode ต้องอยู่ระหว่าง 1 - ${MAX_RFID_CODE.toLocaleString()} (ได้รับ ${rfidCodeOrItemNumber})`,
      );
    }
  }


  if (sequenceNumber > MAX_SEQUENCE || totalQuantity > MAX_SEQUENCE) {
    throw new Error(
      `จำนวนต่อ batch ต้องไม่เกิน ${MAX_SEQUENCE} ชิ้น (seq=${sequenceNumber}, total=${totalQuantity})`,
    );
  }

  const seqStr = String(sequenceNumber).padStart(2, "0");
  const totalStr = String(totalQuantity).padStart(2, "0");

  let content;

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
      const afterSlash = raw.substring(slashIndex + 1);

      if (afterSlash.length >= 4 && /^\d{4}/.test(afterSlash)) {

        sequence = parseInt(afterSlash.substring(0, 2), 10);
        total = parseInt(afterSlash.substring(2, 4), 10);
      } else {

        const seqChar = afterSlash[0];
        const totalChar = afterSlash[1];
        sequence =
          seqChar >= "A" ? seqChar.charCodeAt(0) - 55 : parseInt(seqChar, 10);
        total =
          totalChar >= "A"
            ? totalChar.charCodeAt(0) - 55
            : parseInt(totalChar, 10);
      }

      sequenceText = `${sequence}/${total}`;


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
