import { z } from "zod";

const secureAttachmentUrl = z
  .string()
  .url()
  .max(2000)
  .refine((value) => value.startsWith("https://"), "يجب أن يكون رابط المرفق آمناً");

export const createQuoteMessageSchema = z
  .object({
    body: z.string().trim().max(1000).default(""),
    attachmentUrl: secureAttachmentUrl.optional(),
    attachmentName: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => value.body.length > 0 || Boolean(value.attachmentUrl), {
    message: "اكتب رسالة أو أضف مرفقاً",
  })
  .refine((value) => !value.attachmentUrl || Boolean(value.attachmentName), {
    message: "اسم المرفق مطلوب",
  });

export type CreateQuoteMessageInput = z.infer<typeof createQuoteMessageSchema>;
