"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  type AdminPermission,
  parseAdminPermissions,
} from "@/lib/admin-permissions";

type Staff = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  adminLevel: string | null;
  adminGrade: number;
  permissions: string | null;
};

type Draft = {
  adminLevel: "MANAGER" | "STAFF";
  adminGrade: number;
  status: "ACTIVE" | "SUSPENDED";
  permissions: AdminPermission[];
};

export function StaffPermissions() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/staff", { cache: "no-store" });
    if (response.status === 403) return;
    const result = (await response.json()) as { ok: boolean; staff?: Staff[]; error?: string };
    if (!response.ok || !result.ok) {
      setError(result.error ?? "تعذر تحميل الموظفين");
      return;
    }
    const rows = result.staff ?? [];
    setStaff(rows);
    setDrafts(
      Object.fromEntries(
        rows.map((item) => [
          item.id,
          {
            adminLevel: item.adminLevel === "MANAGER" ? "MANAGER" : "STAFF",
            adminGrade: item.adminGrade,
            status: item.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
            permissions: parseAdminPermissions(item.permissions),
          },
        ])
      )
    );
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateDraft(id: string, change: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...change } }));
  }

  function togglePermission(id: string, permission: AdminPermission) {
    const draft = drafts[id];
    if (!draft) return;
    const permissions = draft.permissions.includes(permission)
      ? draft.permissions.filter((item) => item !== permission)
      : [...draft.permissions, permission];
    updateDraft(id, { permissions });
  }

  async function save(item: Staff) {
    const draft = drafts[item.id];
    if (!draft) return;
    const reason = window.prompt(`اكتب سبب تعديل صلاحيات ${item.name ?? item.email}:`)?.trim();
    if (!reason) return;

    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/staff/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, reason }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر حفظ الصلاحيات");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusyId(null);
    }
  }

  async function createStaff(form: HTMLFormElement) {
    const data = new FormData(form);
    const permissions = ADMIN_PERMISSIONS.filter((permission) => data.get(permission) === "on");
    const reason = window.prompt("سبب إنشاء حساب الموظف:")?.trim();
    if (!reason) return;

    setBusyId("create");
    setError("");
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          adminLevel: data.get("adminLevel"),
          adminGrade: Number(data.get("adminGrade")),
          permissions,
          reason,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر إنشاء الموظف");
      form.reset();
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500">الدرجة من 1 إلى 5 تنظيمية، والصلاحيات الفعلية تُحدد بشكل مستقل لكل موظف.</p>
        <button onClick={() => setShowCreate((value) => !value)} className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-bold text-white">
          {showCreate ? "إلغاء" : "إضافة موظف"}
        </button>
      </div>

      {showCreate && (
        <form
          className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void createStaff(event.currentTarget);
          }}
        >
          <h3 className="font-extrabold text-ink-900">حساب موظف إداري جديد</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="اسم الموظف" className="rounded-lg border border-ink-200 px-3 py-2" />
            <input name="email" required type="email" placeholder="البريد الإلكتروني" className="rounded-lg border border-ink-200 px-3 py-2" />
            <input name="password" required type="password" minLength={10} placeholder="كلمة مرور مؤقتة (10 أحرف)" className="rounded-lg border border-ink-200 px-3 py-2" />
            <select name="adminLevel" className="rounded-lg border border-ink-200 px-3 py-2">
              <option value="STAFF">موظف</option>
              <option value="MANAGER">مدير قسم</option>
            </select>
            <select name="adminGrade" defaultValue="1" className="rounded-lg border border-ink-200 px-3 py-2">
              {[1, 2, 3, 4, 5].map((grade) => <option key={grade} value={grade}>الدرجة {grade}</option>)}
            </select>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_PERMISSIONS.map((permission) => (
              <label key={permission} className="flex items-center gap-2 rounded-lg bg-ink-50 p-3 text-sm">
                <input type="checkbox" name={permission} />
                {ADMIN_PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
          <button disabled={busyId === "create"} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            {busyId === "create" ? "جاري الإنشاء…" : "إنشاء الحساب"}
          </button>
        </form>
      )}

      {staff.map((item) => {
        if (item.adminLevel === "SUPER_ADMIN") {
          return (
            <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-extrabold text-ink-900">{item.name ?? item.email}</p>
              <p className="mt-1 text-sm text-amber-800">مدير التطبيق الأعلى · جميع الصلاحيات · محمي من التعديل</p>
            </div>
          );
        }
        const draft = drafts[item.id];
        if (!draft) return null;
        return (
          <div key={item.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-ink-900">{item.name ?? "موظف إداري"}</p>
                <p className="text-sm text-ink-500">{item.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={draft.adminLevel} onChange={(e) => updateDraft(item.id, { adminLevel: e.target.value as Draft["adminLevel"] })} className="rounded-lg border border-ink-200 px-3 py-2 text-sm">
                  <option value="STAFF">موظف</option>
                  <option value="MANAGER">مدير قسم</option>
                </select>
                <select value={draft.adminGrade} onChange={(e) => updateDraft(item.id, { adminGrade: Number(e.target.value) })} className="rounded-lg border border-ink-200 px-3 py-2 text-sm">
                  {[1, 2, 3, 4, 5].map((grade) => <option key={grade} value={grade}>الدرجة {grade}</option>)}
                </select>
                <select value={draft.status} onChange={(e) => updateDraft(item.id, { status: e.target.value as Draft["status"] })} className="rounded-lg border border-ink-200 px-3 py-2 text-sm">
                  <option value="ACTIVE">نشط</option>
                  <option value="SUSPENDED">موقوف</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-lg bg-ink-50 p-3 text-sm">
                  <input type="checkbox" checked={draft.permissions.includes(permission)} onChange={() => togglePermission(item.id, permission)} />
                  {ADMIN_PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>
            <button onClick={() => void save(item)} disabled={busyId === item.id} className="mt-4 rounded-lg bg-ink-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {busyId === item.id ? "جاري الحفظ…" : "حفظ الصلاحيات"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
