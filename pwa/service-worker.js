// Gerado no build com os arquivos estáticos desta versão. Não armazena API/sessões.
const CACHE = "nexo-static-__VERSION__";
const PRECACHE = __PRECACHE__;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
  // Uma nova versão aguarda as janelas antigas fecharem para evitar mistura de builds.
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("nexo-static-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Códigos OAuth, links de recuperação e respostas de autenticação nunca entram no cache.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match("/index.html"))));
    return;
  }
  if (url.search || !PRECACHE.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(event.request)));
});
