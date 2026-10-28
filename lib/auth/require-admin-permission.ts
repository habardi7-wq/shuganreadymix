import { NextResponse } from "next/server";
import { getCurrentUser } from "./current-user";
import {
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin-permissions";

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await getCurrentUser();
  if (!hasAdminPermission(user, permission)) {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: "ليس لديك الصلاحية المطلوبة لتنفيذ هذه العملية" },
        { status: 403 }
      ),
    } as const;
  }
  return { user, response: null } as const;
}
