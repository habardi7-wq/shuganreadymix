import { describe, expect, it } from "vitest";
import { createQuoteMessageSchema } from "@/lib/validation/quote-message";

describe("quote negotiation messages", () => {
  it("accepts a normal negotiation message", () => {
    expect(createQuoteMessageSchema.safeParse({ body: "هل يمكن تخفيض سعر المتر؟" }).success).toBe(true);
  });

  it("accepts a secure attachment with a name", () => {
    expect(
      createQuoteMessageSchema.safeParse({
        body: "",
        attachmentUrl: "https://files.example.com/offer.pdf",
        attachmentName: "العرض المعدل.pdf",
      }).success
    ).toBe(true);
  });

  it("rejects empty messages and insecure attachments", () => {
    expect(createQuoteMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(
      createQuoteMessageSchema.safeParse({
        body: "مرفق",
        attachmentUrl: "http://files.example.com/file.pdf",
        attachmentName: "file.pdf",
      }).success
    ).toBe(false);
  });
});
