import { describe, expect, it } from "vitest";
import { canTransitionComplaint, isComplaintStatus } from "./complaint-status";

describe("complaint workflow", () => {
  it("supports triage, resolution and reopening with a reason", () => {
    expect(canTransitionComplaint("OPEN", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionComplaint("UNDER_REVIEW", "RESOLVED")).toBe(true);
    expect(canTransitionComplaint("RESOLVED", "UNDER_REVIEW")).toBe(true);
  });
  it("rejects skipped and same-state transitions", () => {
    expect(canTransitionComplaint("OPEN", "RESOLVED")).toBe(false);
    expect(canTransitionComplaint("OPEN", "OPEN")).toBe(false);
    expect(isComplaintStatus("UNKNOWN")).toBe(false);
  });
});
