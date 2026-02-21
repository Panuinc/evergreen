export function generatePlainEPC(
  itemNumber,
  sequenceNumber,
  totalQuantity,
) {
  const seqChar =
    sequenceNumber <= 9
      ? String(sequenceNumber)
      : String.fromCharCode(55 + sequenceNumber);

  const totalChar =
    totalQuantity <= 9
      ? String(totalQuantity)
      : String.fromCharCode(55 + totalQuantity);

  /* Keep full item number with dashes, e.g. "EX-00162-EX51-D/11" */
  const content = `${itemNumber}/${seqChar}${totalChar}`;

  /* Round up to 2-byte boundary (Gen2 EPC requirement) */
  const bytes = Math.ceil(content.length / 2) * 2;

  let hexEPC = "";
  for (let i = 0; i < bytes; i++) {
    const code = i < content.length ? content.charCodeAt(i) : 0;
    hexEPC += code.toString(16).toUpperCase().padStart(2, "0");
  }

  return hexEPC;
}

export const EPCService = {
  generate(item, options = {}) {
    const { sequenceNumber = 1, totalQuantity = 1 } = options;

    return generatePlainEPC(item.number, sequenceNumber, totalQuantity);
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
    let itemNumber = "";
    let sequence = null;
    let total = null;
    let sequenceText = "";

    if (slashIndex !== -1 && slashIndex < raw.length - 2) {
      const itemCompact = raw.substring(0, slashIndex).trim();
      const seqChar = raw[slashIndex + 1];
      const totalChar = raw[slashIndex + 2];

      sequence =
        seqChar >= "A" ? seqChar.charCodeAt(0) - 55 : parseInt(seqChar, 10);
      total =
        totalChar >= "A"
          ? totalChar.charCodeAt(0) - 55
          : parseInt(totalChar, 10);

      if (itemCompact && itemCompact.length >= 4) {
        const cleaned = itemCompact.replace(/[\x00\s0]+$/, "").trim();
        const match = cleaned.match(/^([A-Z]{2})(\d{2})(\d{2})(\d+)$/);
        if (match) {
          itemNumber = `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
        } else {
          itemNumber = cleaned;
        }
      }

      sequenceText = `${sequence}/${total}`;
    } else {
      itemNumber = raw.trim();
    }

    return {
      raw: epc,
      bits,
      bytes: bits / 8,
      hexLength: epc.length,
      decoded: raw,
      itemNumber,
      sequence,
      total,
      sequenceText,
      uri: `urn:epc:tag:${epc}`,
    };
  },
};

export default EPCService;
