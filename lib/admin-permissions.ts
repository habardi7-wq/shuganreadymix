export const ADMIN_PERMISSIONS = [
  "FINANCE_VIEW",
  "FINANCE_CORRECT",
  "FINANCE_SETTINGS",
  "ORDERS_VIEW",
  "ORDERS_EDIT",
  "APPROVALS_MANAGE",
  "ANALYTICS_VIEW",
  "AUDIT_VIEW",
  "STAFF_PERMISSIONS_MANAGE",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  FINANCE_VIEW: "مشاهدة المالية",
  FINANCE_CORRECT: "تصحيح الدفعات والعمولات",
  FINANCE_SETTINGS: "تعديل إعدادات العمولات",
  ORDERS_VIEW: "مشاهدة الطلبات",
  ORDERS_EDIT: "تعديل الطلبات والأرقام",
  APPROVALS_MANAGE: "اعتماد الشركات والمندوبين",
  ANALYTICS_VIEW: "مشاهدة التقارير والأداء",
  AUDIT_VIEW: "مشاهدة سجل التدقيق",
  STAFF_PERMISSIONS_MANAGE: "إدارة الموظفين والصلاحيات",
};

type AdminIdentity = {
  role: string;
  adminLevel: string | null;
  permissions: string | null;
};

export function parseAdminPermissions(value: string | null | undefined): AdminPermission[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AdminPermission =>
        typeof item === "string" && ADMIN_PERMISSIONS.includes(item as AdminPermission)
    );
  } catch {
    return [];
  }
}

export function hasAdminPermission(
  user: AdminIdentity | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user || user.role !== "ADMIN") return false;
  if (user.adminLevel === "SUPER_ADMIN") return true;
  return parseAdminPermissions(user.permissions).includes(permission);
}

export function normalizeAdminPermissions(value: unknown): AdminPermission[] | null {
  if (!Array.isArray(value)) return null;
  const unique = [...new Set(value)];
  if (
    unique.some(
      (item) =>
        typeof item !== "string" ||
        !ADMIN_PERMISSIONS.includes(item as AdminPermission)
    )
  ) {
    return null;
  }
  return unique as AdminPermission[];
}
