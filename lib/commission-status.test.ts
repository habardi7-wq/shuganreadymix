import { describe, expect, it } from "vitest";
import {
  canTransitionCommission,
  isCommissionStatus,
} from "@/lib/commission-status";

describe("commission status workflow", () => {
  it("allows only forward accounting transitions", () => {
    expect(canTransitionCommission("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionCommission("CONFIRMED", "PAID")).toBe(true);
    expect(canTransitionCommission("PENDING", "PAID")).toBe(false);
    expect(canTransitionCommission("PAID", "CONFIRMED")).toBe(false);
  });

  it("recognizes supported statuses", () => {
    expect(isCommissionStatus("PENDING")).toBe(true);
    expect(isCommissionStatus("CONFIRMED")).toBe(true);
    expect(isCommissionStatus("PAID")).toBe(true);
    expect(isCommissionStatus("CANCELLED")).toBe(false);
  });
});
