"use client";

import { useCallback, useEffect, useState } from "react";

type Message = {
  id: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  isMine: boolean;
  senderRole: string;
};

export function QuoteNegotiation({
  quoteId,
  initiallyOpen = false,
}: {
  quoteId: string;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [showAttachment, setShowAttachment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/quotes/${quoteId}/messages`, { cache: "no-store" });
    const result = (await response.json()) as { ok: boolean; messages?: Message[]; error?: string };
    if (!response.ok || !result.ok) {
      setError(result.error ?? "تعذر تحميل المحادثة");
      return;
    }
    setMessages(result.messages ?? []);
  }, [quoteId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, open]);

  async function send() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quotes/${quoteId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          attachmentUrl: attachmentUrl || undefined,
          attachmentName: attachmentUrl ? attachmentName : undefined,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "تعذر إرسال الرسالة");
      setBody("");
      setAttachmentUrl("");
      setAttachmentName("");
      setShowAttachment(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700"
      >
        💬 تفاوض واستفسار {messages.length > 0 ? `(${messages.length})` : ""}
      </button>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/50">
      <div className="flex items-center justify-between border-b border-brand-100 p-4">
        <div>
          <p className="font-extrabold text-ink-900">التفاوض على العرض</p>
          <p className="text-xs text-ink-500">المحادثة خاصة بطرفي العرض ومسجلة ضمن العملية.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-ink-500">إغلاق</button>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl p-3 text-sm ${message.isMine ? "ms-auto bg-brand-600 text-white" : "me-auto bg-white text-ink-800 shadow-sm"}`}
          >
            <p className={`mb-1 text-[11px] font-bold ${message.isMine ? "text-brand-100" : "text-ink-400"}`}>
              {message.isMine ? "أنت" : message.senderRole === "COMPANY" ? "المصنع" : "العميل"}
            </p>
            {message.body && <p className="whitespace-pre-wrap leading-6">{message.body}</p>}
            {message.attachmentUrl && (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 block rounded-lg px-3 py-2 font-bold underline ${message.isMine ? "bg-white/10" : "bg-ink-50"}`}
              >
                📎 {message.attachmentName}
              </a>
            )}
            <time className={`mt-2 block text-[10px] ${message.isMine ? "text-brand-100" : "text-ink-400"}`}>
              {new Date(message.createdAt).toLocaleString("ar-SA")}
            </time>
          </div>
        ))}
        {messages.length === 0 && <p className="py-6 text-center text-sm text-ink-400">ابدأ التفاوض أو أرسل استفسارك عن العرض.</p>}
      </div>

      <div className="border-t border-brand-100 bg-white p-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="اكتب رسالة واضحة…"
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        {showAttachment && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              value={attachmentName}
              onChange={(event) => setAttachmentName(event.target.value)}
              maxLength={120}
              placeholder="اسم المرفق"
              className="rounded-xl border border-ink-200 px-3 py-2 text-sm"
            />
            <input
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              type="url"
              placeholder="رابط HTTPS للمرفق"
              className="rounded-xl border border-ink-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-500 sm:col-span-2">حالياً يقبل رابطاً آمناً للمستند. الرفع المباشر سيُفعّل بعد ربط التخزين الخاص.</p>
          </div>
        )}
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
        <div className="mt-3 flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => setShowAttachment((value) => !value)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700">
            📎 {showAttachment ? "إخفاء المرفق" : "إضافة مرفق"}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="rounded-lg px-3 py-2 text-xs font-bold text-ink-500">تحديث</button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || (!body.trim() && !attachmentUrl)}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "جاري الإرسال…" : "إرسال"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
