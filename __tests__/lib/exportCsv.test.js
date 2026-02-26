/**
 * Tests for exportCsv utility.
 * Since exportToCsv uses DOM APIs (Blob, URL, createElement), we test the
 * internal helpers by importing and testing the escaping/value-extraction logic.
 */

// We can't directly import private functions, so we'll re-implement the logic
// for testing purposes, and also test the public API with DOM mocks.

describe("exportToCsv", () => {
  let exportToCsv;

  beforeEach(() => {
    // Mock DOM APIs
    global.Blob = jest.fn((content, options) => ({ content, options }));
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();

    const mockLink = { href: "", download: "", click: jest.fn() };
    jest.spyOn(document, "createElement").mockReturnValue(mockLink);

    // Dynamically import to get fresh module with mocks
    jest.resetModules();
    exportToCsv = require("@/lib/exportCsv").exportToCsv;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates CSV with correct headers and data", () => {
    const columns = [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ];
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    exportToCsv("test.csv", columns, data);

    expect(global.Blob).toHaveBeenCalled();
    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain("Name,Age");
    expect(blobContent).toContain("Alice,30");
    expect(blobContent).toContain("Bob,25");
  });

  it("triggers download with correct filename", () => {
    const columns = [{ header: "ID", key: "id" }];
    const data = [{ id: 1 }];

    exportToCsv("export.csv", columns, data);

    const link = document.createElement("a");
    expect(link.download).toBe("export.csv");
    expect(link.click).toHaveBeenCalled();
  });

  it("handles nested keys with dot notation", () => {
    const columns = [{ header: "City", key: "address.city" }];
    const data = [{ address: { city: "Bangkok" } }];

    exportToCsv("nested.csv", columns, data);

    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain("Bangkok");
  });

  it("handles null values gracefully", () => {
    const columns = [{ header: "Field", key: "missing" }];
    const data = [{ missing: null }, {}];

    exportToCsv("null.csv", columns, data);

    const blobContent = global.Blob.mock.calls[0][0][0];
    // Should not throw and should have empty values
    expect(blobContent).toContain("Field");
  });

  it("uses custom formatter when provided", () => {
    const columns = [
      {
        header: "Price",
        key: "price",
        formatter: (v) => `$${v.toFixed(2)}`,
      },
    ];
    const data = [{ price: 99.9 }];

    exportToCsv("formatted.csv", columns, data);

    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain("$99.90");
  });

  it("escapes cells with commas and quotes", () => {
    const columns = [{ header: "Note", key: "note" }];
    const data = [
      { note: 'He said "hello"' },
      { note: "one, two, three" },
    ];

    exportToCsv("escape.csv", columns, data);

    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain('"He said ""hello"""');
    expect(blobContent).toContain('"one, two, three"');
  });

  it("includes BOM for UTF-8", () => {
    const columns = [{ header: "Name", key: "name" }];
    const data = [{ name: "ทดสอบ" }];

    exportToCsv("thai.csv", columns, data);

    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent.startsWith("\uFEFF")).toBe(true);
  });
});
