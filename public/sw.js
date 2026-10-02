// Offline support: single-player games work with no connection once the game has loaded once.
// Pages are network-first (so updates arrive), everything else is served from cache and refreshed
// in the background. Online play (/api) always goes to the network.
const CACHE = "metro-empire-v1";
const MAX_ENTRIES = 150; // old builds' hashed files would otherwise pile up

async function save(req, res) {
  const c = await caches.open(CACHE);
  await c.put(req, res);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) if (new URL(k.url).pathname !== "/") await c.delete(k);
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.webmanifest"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    // the app is one page: try the network, fall back to the cached copy
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) e.waitUntil(save("/", res.clone()));
          return res;
        })
        .catch(async () => (await caches.match("/")) ?? Response.error())
    );
    return;
  }

  // stale-while-revalidate for scripts, styles, sprites and fonts
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") e.waitUntil(save(req, res.clone()));
          return res;
        })
        .catch(() => hit ?? Response.error());
      return hit || fresh;
    })
  );
});
