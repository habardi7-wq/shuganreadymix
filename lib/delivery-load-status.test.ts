import { describe, expect, it } from "vitest";
import { canTransitionDeliveryLoad, nextDeliveryLoadActions } from "@/lib/delivery-load-status";

describe("delivery load workflow", () => {
  it("lets the company dispatch and report arrival", () => {
    expect(canTransitionDeliveryLoad("PLANNED", "DISPATCHED", "COMPANY")).toBe(true);
    expect(canTransitionDeliveryLoad("DISPATCHED", "ARRIVED", "COMPANY")).toBe(true);
    expect(canTransitionDeliveryLoad("ARRIVED", "RECEIVED", "COMPANY")).toBe(false);
  });

  it("reserves received quantity confirmation for the customer", () => {
    expect(canTransitionDeliveryLoad("ARRIVED", "RECEIVED", "CUSTOMER")).toBe(true);
    expect(canTransitionDeliveryLoad("DISPATCHED", "RECEIVED", "CUSTOMER")).toBe(false);
  });

  it("keeps recovery paths for issues and cancellations", () => {
    expect(canTransitionDeliveryLoad("ARRIVED", "ISSUE_REPORTED", "CUSTOMER")).toBe(true);
    expect(nextDeliveryLoadActions("ISSUE_REPORTED", "COMPANY")).toEqual(["PLANNED", "CANCELLED"]);
    expect(canTransitionDeliveryLoad("CANCELLED", "PLANNED", "COMPANY")).toBe(true);
  });
});
