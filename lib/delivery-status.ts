export const DELIVERY_STATUSES = [
  "NOT_SCHEDULED",
  "SCHEDULED",
  "DISPATCHED",
  "ARRIVED",
  "DELIVERED",
  "ISSUE_REPORTED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type DeliveryActorRole = "CUSTOMER" | "COMPANY";

export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return typeof value === "string" && DELIVERY_STATUSES.includes(value as DeliveryStatus);
}

const COMPANY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  NOT_SCHEDULED: ["SCHEDULED"],
  SCHEDULED: ["DISPATCHED"],
  DISPATCHED: ["ARRIVED"],
  ARRIVED: [],
  DELIVERED: [],
  ISSUE_REPORTED: ["SCHEDULED"],
};

const CUSTOMER_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  NOT_SCHEDULED: [],
  SCHEDULED: ["ISSUE_REPORTED"],
  DISPATCHED: ["ISSUE_REPORTED"],
  ARRIVED: ["DELIVERED", "ISSUE_REPORTED"],
  DELIVERED: [],
  ISSUE_REPORTED: ["DELIVERED"],
};

export function canTransitionDelivery(
  current: DeliveryStatus,
  next: DeliveryStatus,
  role: DeliveryActorRole
): boolean {
  const transitions = role === "COMPANY" ? COMPANY_TRANSITIONS : CUSTOMER_TRANSITIONS;
  return transitions[current].includes(next);
}

export function nextDeliveryActions(
  current: DeliveryStatus,
  role: DeliveryActorRole
): DeliveryStatus[] {
  const transitions = role === "COMPANY" ? COMPANY_TRANSITIONS : CUSTOMER_TRANSITIONS;
  return transitions[current];
}
