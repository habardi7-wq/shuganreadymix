import { describe, expect, it } from "vitest";
import {
  hasAdminPermission,
  normalizeAdminPermissions,
  parseAdminPermissions,
} from "@/lib/admin-permissions";

describe("admin permissions", () => {
  it("grants every permission to the super administrator", () => {
    expect(
      hasAdminPermission(
        { role: "ADMIN", adminLevel: "SUPER_ADMIN", permissions: null },
        "STAFF_PERMISSIONS_MANAGE"
      )
    ).toBe(true);
  });

  it("grants staff only explicitly assigned permissions", () => {
    const staff = {
      role: "ADMIN",
      adminLevel: "STAFF",
      permissions: JSON.stringify(["FINANCE_VIEW"]),
    };
    expect(hasAdminPermission(staff, "FINANCE_VIEW")).toBe(true);
    expect(hasAdminPermission(staff, "FINANCE_CORRECT")).toBe(false);
  });

  it("rejects unknown permissions and malformed storage", () => {
    expect(normalizeAdminPermissions(["FINANCE_VIEW", "ROOT_ACCESS"])).toBeNull();
    expect(parseAdminPermissions("invalid")).toEqual([]);
    expect(parseAdminPermissions(JSON.stringify(["FINANCE_VIEW", "UNKNOWN"]))).toEqual([
      "FINANCE_VIEW",
    ]);
  });
});
