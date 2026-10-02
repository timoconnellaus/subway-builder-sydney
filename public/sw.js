// Offline support: single-player games work with no connection once the game has loaded once.
// Pages are network-first (so updates arrive), everything else is served from cache and refreshed
// in the background. Online play (/api) always goes to the network.
const CACHE = "metro-empire-v1";
const MAX_ENTRIES = 150; // old builds' hashed files would otherwise pile up

const isApi = (url) => url.pathname.startsWith("/api/");
// a missing file comes back as the app's HTML page (single-page fallback); never cache that under its URL
const isHtml = (res, url) => new URL(url).pathname !== "/" && (res.headers.get("content-type") ?? "").includes("text/html");

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

// the page sends the files it already loaded (before this worker was in charge) so they work offline too
self.addEventListener("message", (e) => {
  const urls = e.data?.cache;
  if (!Array.isArray(urls)) return;
  const wanted = [];
  for (const u of urls) {
    try {
      const url = new URL(u);
      if (url.origin === location.origin && !isApi(url)) wanted.push(url.href);
    } catch {
      /* not a URL */
    }
  }
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      const have = new Set((await c.keys()).map((r) => r.url));
      for (const u of wanted) {
        if (have.has(u)) continue;
        const res = await fetch(u).catch(() => null);
        if (res && res.ok && !isHtml(res, u)) await save(u, res);
      }
    })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && isApi(url)) return;

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

  // stale-while-revalidate for scripts, styles, sprites and fonts. A missing file comes back
  // as the app's HTML page (single-page fallback), which must never be cached under its URL.
  const fresh = fetch(req);
  e.waitUntil(
    fresh
      .then((res) => ((res.ok && !isHtml(res, req.url)) || res.type === "opaque" ? save(req, res.clone()) : undefined))
      .catch(() => {})
  );
  e.respondWith(caches.match(req).then((hit) => hit || fresh.catch(() => Response.error())));
});
