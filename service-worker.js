const CACHE_NAME = "controle-financeiro-v3";

const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json"
];

// ===============================
// INSTALAÇÃO (salva arquivos)
// ===============================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache criado");
      return cache.addAll(urlsToCache);
    })
  );
});

// ===============================
// ATIVAÇÃO (limpa cache antigo)
// ===============================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Cache antigo removido:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// ===============================
// FETCH (intercepta requisições)
// ===============================
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
