import { z } from "zod";

export const createQuoteSchema = z.object({
  orderId: z.string().min(1),
  pricePerM3: z.coerce.number().positive().max(10000),
  pumpPrice: z.coerce.number().nonnegative().max(50000).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
