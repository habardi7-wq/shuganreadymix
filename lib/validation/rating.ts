import { z } from "zod";

export const createRatingSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
