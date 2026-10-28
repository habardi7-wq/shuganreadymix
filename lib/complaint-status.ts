export const COMPLAINT_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

const transitions: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  OPEN: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["RESOLVED", "REJECTED"],
  RESOLVED: ["UNDER_REVIEW"],
  REJECTED: ["UNDER_REVIEW"],
};

export function isComplaintStatus(value: unknown): value is ComplaintStatus {
  return typeof value === "string" && COMPLAINT_STATUSES.includes(value as ComplaintStatus);
}

export function canTransitionComplaint(current: ComplaintStatus, next: ComplaintStatus): boolean {
  return current !== next && transitions[current].includes(next);
}
