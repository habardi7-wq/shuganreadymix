"use client";

import { useState } from "react";

type Draft = { customer: string; area: string; grade: string; quantity: string };
const blank: Draft = { customer: "", area: "", grade: "C30", quantity: "" };

export default function DemoPage() {
  const [draft, setDraft] = useState<Draft>(blank);
  const [step, setStep] = useState(0);
  const [orders, setOrders] = useState<Draft[]>([]);
  const [message, setMessage] = useState("");
  const valid = draft.customer.trim().length > 0 && draft.area.trim().length > 0 &&
    Number.isFinite(Number(draft.quantity)) && Number(draft.quantity) > 0 && Number(draft.quantity) <= 10000;
  const next = () => {
    if (step === 0 && (!draft.customer.trim() || !draft.area.trim())) {
      setMessage("أدخل اسم العميل والحي للتجربة"); return;
    }
    if (step === 1 && (!valid || !/^(C25|C30|C35|C40)$/.test(draft.grade))) {
      setMessage("تحقق من نوع الخرسانة والكمية"); return;
    }
    setMessage(""); setStep((n) => Math.min(2, n + 1));
  };
  const save = () => {
    if (!valid || !/^(C25|C30|C35|C40)$/.test(draft.grade)) return;
    setOrders((old) => [{ ...draft }, ...old]);
    setDraft(blank); setStep(0);
    setMessage("تم تسجيل طلب تجريبي داخل هذه الصفحة فقط. لم يُرسل للخادم.");
  };
  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-4 py-10 text-ink-900">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900" role="note">
        <strong>تجربة عامة بدون تسجيل دخول أو OTP</strong>
        <p>استخدم بيانات وهمية فقط. لا تحفظ الصفحة الطلبات في قاعدة بيانات أو جهازك، ولا ترسل أي طلب إلى مصانع أو موردين. تُمسح البيانات عند تحديث الصفحة.</p>
      </div>
      <h1 className="mt-8 text-3xl font-extrabold">تجربة طلب صبة — خرسانة برو</h1>
      <p className="mt-2 text-sm text-ink-600">3 خطوات بسيطة للتعرف على تجربة المستخدم، دون إنشاء حساب.</p>
      <div className="mt-6 flex gap-2 text-center text-xs font-semibold" aria-label="مراحل الطلب">
        {["المشروع", "الخرسانة", "المراجعة"].map((label, i) => (
          <div key={label} aria-current={step === i ? "step" : undefined}
            className={`flex-1 rounded-lg p-3 ${step === i ? "bg-brand-500 text-white" : "bg-ink-50"}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        {step === 0 && <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">عميل وهمي
            <input maxLength={80} value={draft.customer} onChange={e => setDraft({ ...draft, customer: e.target.value })}
              className="w-full rounded-lg border border-ink-200 p-3" placeholder="مثال: عميل تجريبي" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">الحي
            <input maxLength={80} value={draft.area} onChange={e => setDraft({ ...draft, area: e.target.value })}
              className="w-full rounded-lg border border-ink-200 p-3" placeholder="مثال: الرمال" />
          </label>
        </div>}
        {step === 1 && <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">نوع الخرسانة
            <select value={draft.grade} onChange={e => setDraft({ ...draft, grade: e.target.value })}
              className="rounded-lg border border-ink-200 p-3">
              {["C25", "C30", "C35", "C40"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">الكمية بالمتر المكعب
            <input type="number" inputMode="decimal" min="0.1" max="10000" step="0.1"
              value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })}
              className="rounded-lg border border-ink-200 p-3" />
          </label>
        </div>}
        {step === 2 && <div className="space-y-3 text-sm">
          <p><strong>العميل:</strong> {draft.customer}</p>
          <p><strong>الحي:</strong> {draft.area}</p>
          <p><strong>الخلطة:</strong> {draft.grade}</p>
          <p><strong>الكمية:</strong> {draft.quantity} م³</p>
          <p className="text-ink-600">هذه مراجعة افتراضية وليست عرض سعر أو طلبًا فعليًا.</p>
        </div>}
        {message && <p role="status" className="mt-4 text-sm text-brand-700">{message}</p>}
        <div className="mt-6 flex gap-3">
          {step > 0 && <button type="button" onClick={() => { setStep(step - 1); setMessage(""); }}
            className="rounded-lg border border-ink-200 px-5 py-3">السابق</button>}
          {step < 2 ? <button type="button" onClick={next}
            className="rounded-lg bg-brand-500 px-6 py-3 font-bold text-white">التالي</button>
            : <button type="button" onClick={save} className="rounded-lg bg-brand-500 px-6 py-3 font-bold text-white">حفظ تجريبي</button>}
        </div>
      </div>
      {orders.length > 0 && <section className="mt-8" aria-label="طلبات تجريبية">
        <h2 className="text-lg font-bold">طلبات هذه الجلسة التجريبية ({orders.length})</h2>
        <ul className="mt-3 space-y-2">{orders.map((o, i) => <li key={i} className="rounded-lg bg-ink-50 p-3 text-sm">
          {o.customer} — {o.area} — {o.grade} — {o.quantity} م³
        </li>)}</ul>
      </section>}
    </main>
  );
}
