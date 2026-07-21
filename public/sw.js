const STATIC_VIDEO_CACHE = "gaga-static-video-v1";
const HOME_HERO_VIDEO_URL =
  "https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwy51yk6553x66/_output/transgbdvch1pj69sr5k12wef/mda-gbdwy51yk6553x66.mp4";

const CACHED_VIDEO_URLS = [HOME_HERO_VIDEO_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_VIDEO_CACHE);
      await Promise.all(
        CACHED_VIDEO_URLS.map(async (url) => {
          try {
            const response = await fetch(url, {
              mode: "no-cors",
              cache: "no-cache",
            });
            await cache.put(url, response);
          } catch {
            // Ignore warm-cache failures and retry on runtime requests.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("gaga-static-video-") && key !== STATIC_VIDEO_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = event.request.url;
  if (!CACHED_VIDEO_URLS.includes(requestUrl)) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_VIDEO_CACHE);
      const cached = await cache.match(requestUrl);
      if (cached) {
        return cached;
      }

      const response = await fetch(event.request);
      await cache.put(requestUrl, response.clone());
      return response;
    })(),
  );
});
