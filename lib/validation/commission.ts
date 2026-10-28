import { z } from "zod";
import { COMMISSION_TYPES } from "@/lib/enums";

export const createCommissionSettingSchema = z.object({
  scope: z.enum(["GLOBAL", "COMPANY"]),
  companyId: z.string().min(1).optional(),
  type: z.enum(COMMISSION_TYPES),
  value: z.coerce.number().nonnegative().max(1000000),
});

export const updateCommissionSettingSchema = z.object({
  type: z.enum(COMMISSION_TYPES).optional(),
  value: z.coerce.number().nonnegative().max(1000000).optional(),
  isActive: z.boolean().optional(),
});
