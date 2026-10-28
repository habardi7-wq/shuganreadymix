export const COMMISSION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "CANCELLED",
] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export function isCommissionStatus(value: unknown): value is CommissionStatus {
  return typeof value === "string" && COMMISSION_STATUSES.includes(value as CommissionStatus);
}

export function canTransitionCommission(
  current: CommissionStatus,
  next: CommissionStatus
): boolean {
  return current !== next;
}
