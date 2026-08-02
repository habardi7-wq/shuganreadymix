import { z } from "zod";
import {
  PROJECT_TYPES,
  CONCRETE_TYPES,
  STRENGTH_GRADES,
  PUMP_TYPES,
} from "@/lib/enums";

export const createOrderSchema = z
  .object({
    cityId: z.string().min(1),
    districtId: z.string().min(1).optional(),
    locationDetails: z.string().max(500).optional(),
    projectType: z.enum(PROJECT_TYPES),
    concreteType: z.enum(CONCRETE_TYPES),
    strengthGrade: z.enum(STRENGTH_GRADES),
    quantityM3: z.coerce.number().positive().max(2000),
    pumpRequired: z.boolean(),
    pumpType: z.enum(PUMP_TYPES).optional(),
    scheduledDate: z.string().min(1),
    scheduledTime: z.string().min(1),
    notes: z.string().max(1000).optional(),
  })
  .refine((v) => !v.pumpRequired || !!v.pumpType, {
    message: "يرجى تحديد نوع المضخة",
    path: ["pumpType"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
