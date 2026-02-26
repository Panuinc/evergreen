import { generatePlainEPC, EPCService } from "@/lib/chainWay/epc";

describe("generatePlainEPC", () => {
  it("generates hex EPC from integer rfidCode", () => {
    const epc = generatePlainEPC(12345, 1, 1);
    expect(epc).toHaveLength(24); // 12 bytes * 2 hex chars
    expect(/^[0-9A-F]+$/.test(epc)).toBe(true);
  });

  it("pads rfidCode to 8 digits", () => {
    const epc = generatePlainEPC(1, 1, 1);
    // Decoding: "00000001/11" -> hex
    const decoded = decodeHexEpc(epc);
    expect(decoded).toMatch(/^0{7}1\/11/);
  });

  it("generates EPC from string item number", () => {
    const epc = generatePlainEPC("ABC-123", 2, 5);
    expect(epc).toHaveLength(24);
    const decoded = decodeHexEpc(epc);
    expect(decoded).toContain("ABC123");
  });

  it("uses letter encoding for sequences > 9", () => {
    const epc = generatePlainEPC(1, 10, 15);
    const decoded = decodeHexEpc(epc);
    // 10 -> 'A' (55+10=65), 15 -> 'F' (55+15=70)
    expect(decoded).toContain("/AF");
  });

  it("handles single digit sequences as numbers", () => {
    const epc = generatePlainEPC(100, 3, 7);
    const decoded = decodeHexEpc(epc);
    expect(decoded).toContain("/37");
  });
});

describe("EPCService.generate", () => {
  it("uses rfidCode when available", () => {
    const item = { rfidCode: 999, number: "ALT-001" };
    const epc = EPCService.generate(item);
    const decoded = decodeHexEpc(epc);
    expect(decoded).toContain("00000999");
  });

  it("falls back to item number when no rfidCode", () => {
    const item = { number: "ITM-42" };
    const epc = EPCService.generate(item);
    const decoded = decodeHexEpc(epc);
    expect(decoded).toContain("ITM42");
  });

  it("accepts custom sequence options", () => {
    const item = { rfidCode: 1 };
    const epc = EPCService.generate(item, {
      sequenceNumber: 5,
      totalQuantity: 8,
    });
    const decoded = decodeHexEpc(epc);
    expect(decoded).toContain("/58");
  });
});

describe("EPCService.generateBatch", () => {
  it("generates correct number of EPCs", () => {
    const item = { rfidCode: 100 };
    const batch = EPCService.generateBatch(item, 5);
    expect(batch).toHaveLength(5);
  });

  it("each EPC has correct sequence info", () => {
    const item = { rfidCode: 100 };
    const batch = EPCService.generateBatch(item, 3);

    batch.forEach((entry, i) => {
      expect(entry.sequenceNumber).toBe(i + 1);
      expect(entry.totalQuantity).toBe(3);
      expect(entry.sequenceText).toBe(`${i + 1}/3`);
      expect(entry.epc).toHaveLength(24);
    });
  });
});

describe("EPCService.parse", () => {
  it("returns null for empty input", () => {
    expect(EPCService.parse(null)).toBeNull();
    expect(EPCService.parse("")).toBeNull();
  });

  it("round-trips integer rfidCode", () => {
    const epc = EPCService.generate({ rfidCode: 42 }, { sequenceNumber: 1, totalQuantity: 3 });
    const parsed = EPCService.parse(epc);

    expect(parsed.rfidCode).toBe(42);
    expect(parsed.sequence).toBe(1);
    expect(parsed.total).toBe(3);
    expect(parsed.sequenceText).toBe("1/3");
    expect(parsed.bits).toBe(96);
  });

  it("round-trips string item number", () => {
    const epc = EPCService.generate({ number: "ABC123" }, { sequenceNumber: 2, totalQuantity: 5 });
    const parsed = EPCService.parse(epc);

    expect(parsed.itemCompact).toBe("ABC123");
    expect(parsed.sequence).toBe(2);
    expect(parsed.total).toBe(5);
  });

  it("parses hex fields correctly", () => {
    const epc = EPCService.generate({ rfidCode: 1 });
    const parsed = EPCService.parse(epc);

    expect(parsed.raw).toBe(epc);
    expect(parsed.hexLength).toBe(24);
    expect(parsed.bytes).toBe(12);
  });
});

// Helper to decode hex EPC back to string for assertions
function decodeHexEpc(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}
