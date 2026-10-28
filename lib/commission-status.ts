export const COMMISSION_STATUSES = ["PENDING", "CONFIRMED", "PAID"] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

const NEXT_STATUS: Record<CommissionStatus, CommissionStatus | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PAID",
  PAID: null,
};

export function isCommissionStatus(value: unknown): value is CommissionStatus {
  return typeof value === "string" && COMMISSION_STATUSES.includes(value as CommissionStatus);
}

export function canTransitionCommission(
  current: CommissionStatus,
  next: CommissionStatus
): boolean {
  return NEXT_STATUS[current] === next;
}
