import { z } from "zod";

export const companyOnboardingSchema = z.object({
  name: z.string().min(2).max(150),
  nameEn: z.string().max(150).optional(),
  crNumber: z.string().min(4).max(30),
  cityIds: z.array(z.string().min(1)).min(1).max(10),
});

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
