import {
  isValidLatitude,
  isValidLongitude,
  isValidThaiPhone,
  isRequired,
  isPositiveNumber,
  validateForm,
} from "@/lib/validation";

describe("isValidLatitude", () => {
  it("accepts valid latitudes", () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(13.7563)).toBe(true);
    expect(isValidLatitude("45.5")).toBe(true);
  });

  it("rejects invalid latitudes", () => {
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLatitude(-91)).toBe(false);
    expect(isValidLatitude("abc")).toBe(false);
    expect(isValidLatitude(NaN)).toBe(false);
  });
});

describe("isValidLongitude", () => {
  it("accepts valid longitudes", () => {
    expect(isValidLongitude(0)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(100.5018)).toBe(true);
    expect(isValidLongitude("120")).toBe(true);
  });

  it("rejects invalid longitudes", () => {
    expect(isValidLongitude(181)).toBe(false);
    expect(isValidLongitude(-181)).toBe(false);
    expect(isValidLongitude("xyz")).toBe(false);
  });
});

describe("isValidThaiPhone", () => {
  it("accepts valid Thai phone numbers", () => {
    expect(isValidThaiPhone("0812345678")).toBe(true);
    expect(isValidThaiPhone("0912345678")).toBe(true);
    expect(isValidThaiPhone("021234567")).toBe(true);
    expect(isValidThaiPhone("08-1234-5678")).toBe(true);
    expect(isValidThaiPhone("08 1234 5678")).toBe(true);
  });

  it("rejects invalid Thai phone numbers", () => {
    expect(isValidThaiPhone("1234567890")).toBe(false);
    expect(isValidThaiPhone("08123")).toBe(false);
    expect(isValidThaiPhone("")).toBe(false);
    expect(isValidThaiPhone("abc")).toBe(false);
  });
});

describe("isRequired", () => {
  it("returns true for non-empty strings", () => {
    expect(isRequired("hello")).toBe(true);
    expect(isRequired(" hello ")).toBe(true);
  });

  it("returns false for empty/whitespace strings", () => {
    expect(isRequired("")).toBe(false);
    expect(isRequired("   ")).toBe(false);
  });

  it("returns true for non-empty arrays", () => {
    expect(isRequired([1, 2])).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(isRequired([])).toBe(false);
  });

  it("returns true for non-null values", () => {
    expect(isRequired(0)).toBe(true);
    expect(isRequired(42)).toBe(true);
    expect(isRequired(true)).toBe(true);
    expect(isRequired(false)).toBe(true);
  });

  it("returns false for null/undefined", () => {
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
  });
});

describe("isPositiveNumber", () => {
  it("returns true for positive numbers", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.5)).toBe(true);
    expect(isPositiveNumber("100")).toBe(true);
  });

  it("returns false for zero, negative, or non-numbers", () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber("abc")).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

describe("validateForm", () => {
  it("returns isValid true when all rules pass", () => {
    const formData = { name: "John", age: "25" };
    const rules = {
      name: [(v) => (!v ? "Name required" : false)],
      age: [(v) => (!isPositiveNumber(v) ? "Must be positive" : false)],
    };
    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("returns isValid false with error messages on failure", () => {
    const formData = { name: "", age: "-1" };
    const rules = {
      name: [(v) => (!v?.trim() ? "Name required" : false)],
      age: [(v) => (!isPositiveNumber(v) ? "Must be positive" : false)],
    };
    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe("Name required");
    expect(result.errors.age).toBe("Must be positive");
  });

  it("stops at first error per field", () => {
    const formData = { email: "" };
    const rules = {
      email: [
        (v) => (!v ? "Email required" : false),
        (v) => (!v.includes("@") ? "Invalid email" : false),
      ],
    };
    const result = validateForm(formData, rules);
    expect(result.errors.email).toBe("Email required");
  });

  it("passes formData as second argument to rule functions", () => {
    const formData = { password: "abc", confirmPassword: "xyz" };
    const rules = {
      confirmPassword: [
        (v, data) => (v !== data.password ? "Passwords don't match" : false),
      ],
    };
    const result = validateForm(formData, rules);
    expect(result.errors.confirmPassword).toBe("Passwords don't match");
  });
});
