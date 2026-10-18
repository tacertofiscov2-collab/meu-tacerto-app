/* CENTRAL sw v1 — guarda só a casca do app (abre rápido e sem internet
   mostra a última versão). Dados (/api) nunca ficam guardados. */
const CASCA = "central-v1";
const ARQUIVOS = ["/", "/app.js", "/style.css"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CASCA).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CASCA).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Rede primeiro (sempre a versão nova); sem rede, a guardada.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && ARQUIVOS.includes(url.pathname)) {
          const copia = r.clone();
          caches.open(CASCA).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/")))
  );
});
