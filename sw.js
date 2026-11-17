const root = new URL(self.registration.scope);
const cachePrefix = 'athlete-hub:' + root.pathname + ':';
const cacheName = cachePrefix + 'v1';
const appPage = new URL('index.html', root).href;
const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const shell = new Set(files.map(file => new URL(file, root).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(
    Array.from(shell, url => new Request(url, {cache:'reload'}))
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for(const name of await caches.keys()){
      if(name.startsWith(cachePrefix) && name!==cacheName)await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if(request.method!=='GET'||url.origin!==root.origin)return;
  if(request.mode==='navigate'&&(url.pathname===root.pathname||url.pathname===new URL(appPage).pathname)){
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(request);
        if(response.ok)await cache.put(appPage, response.clone());
        return response;
      } catch {
        return (await cache.match(appPage)) ?? Response.error();
      }
    })());
  }else if(shell.has(url.href)){
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      return cached ?? fetch(request);
    })());
  }
});
