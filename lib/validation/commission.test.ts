import { describe, expect, it } from "vitest";
import { createCommissionSettingSchema, updateCommissionSettingSchema } from "./commission";

describe("createCommissionSettingSchema", () => {
  it("accepts a valid GLOBAL setting without a companyId", () => {
    const result = createCommissionSettingSchema.safeParse({
      scope: "GLOBAL",
      type: "PER_M3",
      value: 5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid COMPANY setting with a companyId", () => {
    const result = createCommissionSettingSchema.safeParse({
      scope: "COMPANY",
      companyId: "company-1",
      type: "PERCENTAGE",
      value: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative rate", () => {
    const result = createCommissionSettingSchema.safeParse({
      scope: "GLOBAL",
      type: "FIXED",
      value: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown commission type", () => {
    const result = createCommissionSettingSchema.safeParse({
      scope: "GLOBAL",
      type: "MYSTERY",
      value: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCommissionSettingSchema", () => {
  it("accepts a partial update with only isActive", () => {
    expect(updateCommissionSettingSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    expect(updateCommissionSettingSchema.safeParse({}).success).toBe(true);
  });
});
