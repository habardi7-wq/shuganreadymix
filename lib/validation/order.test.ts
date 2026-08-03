import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./order";

const validBase = {
  cityId: "city-riyadh",
  districtId: "dist-rawdah",
  projectType: "RESIDENTIAL",
  concreteType: "READY_MIX_NORMAL",
  strengthGrade: "C30",
  quantityM3: 12,
  pumpRequired: false,
  scheduledDate: "2026-08-10",
  scheduledTime: "09:00",
};

describe("createOrderSchema", () => {
  it("accepts a valid order without a pump", () => {
    expect(createOrderSchema.safeParse(validBase).success).toBe(true);
  });

  it("accepts a valid order with a pump and pumpType", () => {
    const result = createOrderSchema.safeParse({
      ...validBase,
      pumpRequired: true,
      pumpType: "BOOM",
    });
    expect(result.success).toBe(true);
  });

  it("rejects pumpRequired=true without a pumpType", () => {
    const result = createOrderSchema.safeParse({ ...validBase, pumpRequired: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["pumpType"]);
    }
  });

  it("rejects a non-positive quantity", () => {
    expect(createOrderSchema.safeParse({ ...validBase, quantityM3: 0 }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...validBase, quantityM3: -5 }).success).toBe(false);
  });

  it("rejects an unreasonably large quantity", () => {
    expect(createOrderSchema.safeParse({ ...validBase, quantityM3: 5000 }).success).toBe(false);
  });

  it("rejects an unknown concreteType", () => {
    expect(
      createOrderSchema.safeParse({ ...validBase, concreteType: "MAGIC_MIX" }).success
    ).toBe(false);
  });
});
