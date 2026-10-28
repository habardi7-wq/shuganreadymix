import { describe, expect, it } from "vitest";
import { companyOnboardingSchema, CR_DOCUMENT_MAX_BASE64_LENGTH } from "./company";

const validDocument = { mimeType: "image/png", dataBase64: "aGVsbG8=" };

describe("companyOnboardingSchema", () => {
  it("accepts a valid onboarding submission", () => {
    const result = companyOnboardingSchema.safeParse({
      name: "شركة اختبار",
      crNumber: "1010999999",
      cityIds: ["city-riyadh"],
      crDocument: validDocument,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing CR document", () => {
    const result = companyOnboardingSchema.safeParse({
      name: "شركة اختبار",
      crNumber: "1010999999",
      cityIds: ["city-riyadh"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported document mime type", () => {
    const result = companyOnboardingSchema.safeParse({
      name: "شركة اختبار",
      crNumber: "1010999999",
      cityIds: ["city-riyadh"],
      crDocument: { mimeType: "application/zip", dataBase64: "aGVsbG8=" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a document over the size cap", () => {
    const result = companyOnboardingSchema.safeParse({
      name: "شركة اختبار",
      crNumber: "1010999999",
      cityIds: ["city-riyadh"],
      crDocument: {
        mimeType: "image/png",
        dataBase64: "a".repeat(CR_DOCUMENT_MAX_BASE64_LENGTH + 1),
      },
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one city", () => {
    const result = companyOnboardingSchema.safeParse({
      name: "شركة اختبار",
      crNumber: "1010999999",
      cityIds: [],
      crDocument: validDocument,
    });
    expect(result.success).toBe(false);
  });
});
