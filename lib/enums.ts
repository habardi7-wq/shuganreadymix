// Central source of truth for status/role/type string values used across the
// app and the database (SQLite has no native enum type, see prisma/schema.prisma).

export const ROLES = ["CUSTOMER", "COMPANY", "SALES_REP", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = [
  "ACTIVE",
  "PENDING_APPROVAL",
  "SUSPENDED",
  "REJECTED",
] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ADMIN_LEVELS = ["SUPER_ADMIN", "STAFF"] as const;
export type AdminLevel = (typeof ADMIN_LEVELS)[number];

export const OTP_PURPOSES = ["REGISTER", "LOGIN"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const COMPANY_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const SALES_REP_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type SalesRepStatus = (typeof SALES_REP_STATUSES)[number];

export const PROJECT_TYPES = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "INFRASTRUCTURE",
  "OTHER",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const CONCRETE_TYPES = [
  "READY_MIX_NORMAL",
  "READY_MIX_PUMPABLE",
  "SELF_COMPACTING",
  "OTHER",
] as const;
export type ConcreteType = (typeof CONCRETE_TYPES)[number];

export const STRENGTH_GRADES = ["C20", "C25", "C30", "C35", "C40", "OTHER"] as const;
export type StrengthGrade = (typeof STRENGTH_GRADES)[number];

export const PUMP_TYPES = ["BOOM", "LINE"] as const;
export type PumpType = (typeof PUMP_TYPES)[number];

export const ORDER_STATUSES = [
  "NEW",
  "QUOTED",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const QUOTE_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const COMMISSION_TYPES = ["PER_M3", "PERCENTAGE", "FIXED"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export const COMMISSION_STATUSES = ["PENDING", "CONFIRMED", "PAID"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "WHATSAPP"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
