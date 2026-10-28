import { describe, expect, it } from "vitest";
import {
  canTransitionCommission,
  isCommissionStatus,
} from "@/lib/commission-status";

describe("commission status workflow", () => {
  it("allows an administrator to correct any distinct accounting status", () => {
    expect(canTransitionCommission("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionCommission("CONFIRMED", "PAID")).toBe(true);
    expect(canTransitionCommission("PAID", "CONFIRMED")).toBe(true);
    expect(canTransitionCommission("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionCommission("CANCELLED", "PENDING")).toBe(true);
  });

  it("rejects no-op status changes", () => {
    expect(canTransitionCommission("PENDING", "PENDING")).toBe(false);
    expect(canTransitionCommission("PAID", "PAID")).toBe(false);
    expect(canTransitionCommission("CANCELLED", "CANCELLED")).toBe(false);
  });

  it("recognizes supported statuses", () => {
    expect(isCommissionStatus("PENDING")).toBe(true);
    expect(isCommissionStatus("CONFIRMED")).toBe(true);
    expect(isCommissionStatus("PAID")).toBe(true);
    expect(isCommissionStatus("CANCELLED")).toBe(true);
    expect(isCommissionStatus("DELETED")).toBe(false);
  });
});
