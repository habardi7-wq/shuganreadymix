import { NextResponse } from "next/server";
import { getCurrentUser } from "./current-user";
import type { Role } from "@/lib/enums";

export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role as Role)) {
    return {
      user: null,
      response: NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 }),
    } as const;
  }
  return { user, response: null } as const;
}
