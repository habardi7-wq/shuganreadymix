import { describe, expect, it } from "vitest";
import { canTransitionDelivery, nextDeliveryActions } from "@/lib/delivery-status";

describe("delivery workflow", () => {
  it("lets the company move only through operational stages", () => {
    expect(canTransitionDelivery("NOT_SCHEDULED", "SCHEDULED", "COMPANY")).toBe(true);
    expect(canTransitionDelivery("SCHEDULED", "DISPATCHED", "COMPANY")).toBe(true);
    expect(canTransitionDelivery("DISPATCHED", "ARRIVED", "COMPANY")).toBe(true);
    expect(canTransitionDelivery("ARRIVED", "DELIVERED", "COMPANY")).toBe(false);
  });

  it("reserves delivery confirmation for the customer", () => {
    expect(canTransitionDelivery("ARRIVED", "DELIVERED", "CUSTOMER")).toBe(true);
    expect(canTransitionDelivery("DISPATCHED", "DELIVERED", "CUSTOMER")).toBe(false);
  });

  it("supports issue reporting and rescheduling", () => {
    expect(canTransitionDelivery("DISPATCHED", "ISSUE_REPORTED", "CUSTOMER")).toBe(true);
    expect(nextDeliveryActions("ISSUE_REPORTED", "COMPANY")).toContain("SCHEDULED");
    expect(nextDeliveryActions("ISSUE_REPORTED", "CUSTOMER")).toContain("DELIVERED");
  });
});
