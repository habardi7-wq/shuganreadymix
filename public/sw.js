const CACHE_NAME = "kharasana-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const cacheableAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/shugan/");
  if (cacheableAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => {
          if (response.ok && response.type === "basic") cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => new Response(
        `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f58206"><title>خرسانة برو</title><style>body{margin:0;background:#f7f7f5;color:#1c1a16;font-family:system-ui;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}.card{max-width:420px;background:white;border:1px solid #e7e6e3;border-radius:24px;padding:32px;text-align:center;box-shadow:0 16px 50px #0001}.icon{font-size:42px}h1{font-size:24px}p{line-height:1.8;color:#59554a}button{border:0;border-radius:14px;background:#f58206;color:white;padding:12px 22px;font-weight:700}</style><body><main class="card"><div class="icon">🚧</div><h1>أنت غير متصل بالإنترنت</h1><p>بيانات الحساب والطلبات لا تُحفظ على الجهاز حفاظاً على الخصوصية. اتصل بالشبكة ثم حاول مرة ثانية.</p><button onclick="location.reload()">إعادة المحاولة</button></main></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } }
      ))
    );
  }
});
