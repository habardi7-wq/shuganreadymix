import { describe, expect, it } from "vitest";
import { createRatingSchema } from "./rating";

describe("createRatingSchema", () => {
  it("accepts 1 through 5 stars", () => {
    for (const stars of [1, 2, 3, 4, 5]) {
      expect(createRatingSchema.safeParse({ stars }).success).toBe(true);
    }
  });

  it("rejects 0 or 6 stars", () => {
    expect(createRatingSchema.safeParse({ stars: 0 }).success).toBe(false);
    expect(createRatingSchema.safeParse({ stars: 6 }).success).toBe(false);
  });

  it("rejects a non-integer rating", () => {
    expect(createRatingSchema.safeParse({ stars: 3.5 }).success).toBe(false);
  });

  it("accepts an optional comment", () => {
    expect(createRatingSchema.safeParse({ stars: 5, comment: "ممتاز" }).success).toBe(true);
  });
});
