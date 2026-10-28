import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("transliterates Arabic letters/digits into a dashed slug with the suffix", () => {
    expect(slugify("شركة شغن للخرسانة الجاهزة", "5y3dam")).toBe(
      "شركة-شغن-للخرسانة-الجاهزة-5y3dam"
    );
  });

  it("lowercases and dashes English names", () => {
    expect(slugify("Shugan Ready-Mix Concrete", "abc123")).toBe(
      "shugan-ready-mix-concrete-abc123"
    );
  });

  it("collapses punctuation/whitespace runs into a single dash", () => {
    expect(slugify("  Test   Co.,  Ltd.  ", "xyz")).toBe("test-co-ltd-xyz");
  });

  it("falls back to 'company' when the name has no letters/digits", () => {
    expect(slugify("!!!", "xyz")).toBe("company-xyz");
  });
});
