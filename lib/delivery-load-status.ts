export const DELIVERY_LOAD_STATUSES = [
  "PLANNED",
  "DISPATCHED",
  "ARRIVED",
  "RECEIVED",
  "ISSUE_REPORTED",
  "CANCELLED",
] as const;

export type DeliveryLoadStatus = (typeof DELIVERY_LOAD_STATUSES)[number];
export type DeliveryLoadActor = "CUSTOMER" | "COMPANY";

const COMPANY_TRANSITIONS: Record<DeliveryLoadStatus, DeliveryLoadStatus[]> = {
  PLANNED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["ARRIVED"],
  ARRIVED: [],
  RECEIVED: [],
  ISSUE_REPORTED: ["PLANNED", "CANCELLED"],
  CANCELLED: ["PLANNED"],
};

const CUSTOMER_TRANSITIONS: Record<DeliveryLoadStatus, DeliveryLoadStatus[]> = {
  PLANNED: ["ISSUE_REPORTED"],
  DISPATCHED: ["ISSUE_REPORTED"],
  ARRIVED: ["RECEIVED", "ISSUE_REPORTED"],
  RECEIVED: [],
  ISSUE_REPORTED: [],
  CANCELLED: [],
};

export function isDeliveryLoadStatus(value: unknown): value is DeliveryLoadStatus {
  return typeof value === "string" && DELIVERY_LOAD_STATUSES.includes(value as DeliveryLoadStatus);
}

export function canTransitionDeliveryLoad(
  current: DeliveryLoadStatus,
  next: DeliveryLoadStatus,
  actor: DeliveryLoadActor
): boolean {
  return (actor === "COMPANY" ? COMPANY_TRANSITIONS : CUSTOMER_TRANSITIONS)[current].includes(next);
}

export function nextDeliveryLoadActions(
  current: DeliveryLoadStatus,
  actor: DeliveryLoadActor
): DeliveryLoadStatus[] {
  return (actor === "COMPANY" ? COMPANY_TRANSITIONS : CUSTOMER_TRANSITIONS)[current];
}
