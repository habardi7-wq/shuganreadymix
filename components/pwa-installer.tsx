"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstaller() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    if (isStandalone() || localStorage.getItem("pwa-install-dismissed") === "1") return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (ios && safari) {
      setShowIosHelp(true);
      setVisible(true);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setPrompt(null);
  }

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-ink-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:start-4">
      <button onClick={dismiss} aria-label="إغلاق" className="absolute end-3 top-2 text-xl text-ink-400">×</button>
      <div className="pe-7">
        <p className="font-extrabold text-ink-900">ثبّت خرسانة برو على جوالك</p>
        {showIosHelp && !prompt ? (
          <p className="mt-1 text-sm leading-6 text-ink-600">
            من Safari اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية».
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-600">وصول أسرع وتجربة بملء الشاشة مثل التطبيق.</p>
        )}
      </div>
      {prompt && (
        <button onClick={() => void install()} className="mt-3 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          تثبيت التطبيق
        </button>
      )}
    </aside>
  );
}
