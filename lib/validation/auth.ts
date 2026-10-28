import { z } from "zod";

// Admin is provisioned internally and never goes through the public OTP flow.
export const PHONE_AUTH_ROLES = ["CUSTOMER", "COMPANY", "SALES_REP"] as const;

export const otpRequestSchema = z.object({
  phone: z.string().min(9).max(20),
  role: z.enum(PHONE_AUTH_ROLES),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(9).max(20),
  role: z.enum(PHONE_AUTH_ROLES),
  code: z.string().length(6),
  name: z.string().min(2).max(120).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
