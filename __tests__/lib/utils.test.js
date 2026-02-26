import { cn } from "@/lib/utils";

describe("cn (classNames utility)", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", null, "b", undefined, "", false, "c")).toBe("a b c");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(null, undefined, false, "")).toBe("");
  });

  it("returns single class", () => {
    expect(cn("only")).toBe("only");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});
