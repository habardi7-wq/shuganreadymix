import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone, formatPhoneForDisplay } from "./phone";

describe("normalizeSaudiPhone", () => {
  it("accepts a local 05xxxxxxxx number", () => {
    expect(normalizeSaudiPhone("0500000009")).toBe("966500000009");
  });

  it("accepts a bare 5xxxxxxxx number", () => {
    expect(normalizeSaudiPhone("500000009")).toBe("966500000009");
  });

  it("accepts an already-international 9665xxxxxxxx number", () => {
    expect(normalizeSaudiPhone("966500000009")).toBe("966500000009");
  });

  it("accepts a 00-prefixed international number", () => {
    expect(normalizeSaudiPhone("00966500000009")).toBe("966500000009");
  });

  it("strips separators like spaces, dashes and a leading +", () => {
    expect(normalizeSaudiPhone("+966 50-000-0009")).toBe("966500000009");
  });

  it("rejects numbers that don't match a known Saudi mobile format", () => {
    expect(normalizeSaudiPhone("12345")).toBeNull();
    expect(normalizeSaudiPhone("966100000009")).toBeNull(); // landline prefix
  });
});

describe("formatPhoneForDisplay", () => {
  it("adds a + prefix to a normalized number", () => {
    expect(formatPhoneForDisplay("966500000009")).toBe("+966500000009");
  });

  it("returns non-normalized input unchanged", () => {
    expect(formatPhoneForDisplay("0500000009")).toBe("0500000009");
  });
});
