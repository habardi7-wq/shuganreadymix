import type { CommissionType } from "@/lib/enums";

export function computeCommission(
  type: CommissionType,
  rate: number,
  quantityM3: number,
  totalPrice: number
): number {
  if (type === "PER_M3") return rate * quantityM3;
  if (type === "PERCENTAGE") return (rate / 100) * totalPrice;
  return rate; // FIXED
}
