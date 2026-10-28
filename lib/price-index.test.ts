import { describe, expect, it } from "vitest";
import { buildVerifiedPriceIndex } from "@/lib/price-index";

describe("verified price index", () => {
  it("aggregates monthly prices and calculates change", () => {
    const result = buildVerifiedPriceIndex(
      [
        { pricePerM3: 200, completedAt: new Date("2026-01-10T00:00:00Z") },
        { pricePerM3: 220, completedAt: new Date("2026-01-20T00:00:00Z") },
        { pricePerM3: 210, completedAt: new Date("2026-01-25T00:00:00Z") },
        { pricePerM3: 231, completedAt: new Date("2026-02-10T00:00:00Z") },
        { pricePerM3: 220, completedAt: new Date("2026-02-15T00:00:00Z") },
        { pricePerM3: 242, completedAt: new Date("2026-02-20T00:00:00Z") },
      ],
      3
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ month: "2026-01", average: 210, median: 210 });
    expect(result[1]).toMatchObject({ month: "2026-02", average: 231, changePercent: 10 });
  });

  it("hides groups below the public privacy threshold", () => {
    expect(
      buildVerifiedPriceIndex(
        [
          { pricePerM3: 200, completedAt: new Date("2026-01-10T00:00:00Z") },
          { pricePerM3: 220, completedAt: new Date("2026-01-20T00:00:00Z") },
        ],
        3
      )
    ).toEqual([]);
  });

  it("ignores invalid prices", () => {
    expect(
      buildVerifiedPriceIndex(
        [
          { pricePerM3: 0, completedAt: new Date("2026-01-10T00:00:00Z") },
          { pricePerM3: Number.NaN, completedAt: new Date("2026-01-20T00:00:00Z") },
        ],
        1
      )
    ).toEqual([]);
  });
});
