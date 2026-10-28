import { describe, expect, it } from "vitest";
import { computeCommission } from "./commission";

describe("computeCommission", () => {
  it("PER_M3 multiplies rate by quantity, ignoring totalPrice", () => {
    expect(computeCommission("PER_M3", 5, 12, 999)).toBe(60);
    expect(computeCommission("PER_M3", 7, 12, 999)).toBe(84);
  });

  it("PERCENTAGE applies rate/100 to totalPrice, ignoring quantity", () => {
    expect(computeCommission("PERCENTAGE", 10, 999, 3600)).toBe(360);
    expect(computeCommission("PERCENTAGE", 2.5, 999, 3600)).toBe(90);
  });

  it("FIXED returns the rate regardless of quantity/price", () => {
    expect(computeCommission("FIXED", 150, 1, 1)).toBe(150);
    expect(computeCommission("FIXED", 150, 500, 999999)).toBe(150);
  });

  it("changing the admin-configured rate changes the result", () => {
    const before = computeCommission("PER_M3", 5, 12, 3600);
    const after = computeCommission("PER_M3", 7, 12, 3600);
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBe(24);
  });
});
