export function compactItemNumber(itemNumber, maxLength = 12) {
  let compact = itemNumber.replace(/-/g, "");
  if (compact.length > maxLength) {
    compact = compact.substring(0, maxLength);
  }
  return compact;
}

export function generatePlainEPC(
  itemNumber,
  sequenceNumber,
  totalQuantity,
  bits = 96,
) {
  const bytes = Math.floor(bits / 8);

  const seqChar =
    sequenceNumber <= 9
      ? String(sequenceNumber)
      : String.fromCharCode(55 + sequenceNumber);

  const totalChar =
    totalQuantity <= 9
      ? String(totalQuantity)
      : String.fromCharCode(55 + totalQuantity);

  const itemMaxLen = bytes - 3;
  const compactItem = compactItemNumber(itemNumber, itemMaxLen);

  const paddedItem = compactItem.padEnd(itemMaxLen, " ");

  const fullString = `${paddedItem}/${seqChar}${totalChar}`;

  let hexEPC = "";
  for (let i = 0; i < fullString.length; i++) {
    hexEPC += fullString
      .charCodeAt(i)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
  }

  return hexEPC.padEnd(bytes * 2, "00");
}

export const EPCService = {
  generate(item, options = {}) {
    const { sequenceNumber = 1, totalQuantity = 1, bits = 96 } = options;

    return generatePlainEPC(item.number, sequenceNumber, totalQuantity, bits);
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
