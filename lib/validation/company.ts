import { z } from "zod";

// Base64-encoded file data, capped at ~3MB decoded (base64 inflates size by
// ~4/3, so ~4.2MB of base64 text) — kept small enough to store as a data URL
// directly in the Company row (no persistent local disk / object storage
// credentials on the serverless deploy target) and to stay comfortably under
// Netlify Functions' request payload limit.
export const CR_DOCUMENT_MAX_BASE64_LENGTH = 4_200_000;
export const CR_DOCUMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const companyOnboardingSchema = z.object({
  name: z.string().min(2).max(150),
  nameEn: z.string().max(150).optional(),
  crNumber: z.string().min(4).max(30),
  cityIds: z.array(z.string().min(1)).min(1).max(10),
  crDocument: z.object({
    mimeType: z.enum(CR_DOCUMENT_ALLOWED_MIME_TYPES),
    dataBase64: z.string().min(1).max(CR_DOCUMENT_MAX_BASE64_LENGTH),
  }),
});

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
