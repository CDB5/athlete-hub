const root = new URL(self.registration.scope);
const cachePrefix = 'athlete-hub:' + root.pathname + ':';
const cacheName = cachePrefix + 'v5';
const appPage = new URL('index.html', root).href;
const files = [
  'index.html', 'styles.css', 'storage.js', 'products.js', 'app.js', 'manifest.webmanifest',
  'icon-192.png?v=2', 'icon-512.png?v=2',
  'assets/logo-96.png', 'assets/favicon-48.png', 'assets/apple-touch-icon.png',
];
const shell = new Set(files.map(file => new URL(file, root).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(
    Array.from(shell, url => new Request(url, {cache:'reload'}))
  )).then(() => self.skipWaiting()));
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
  const navigation = request.mode==='navigate'&&(url.pathname===root.pathname||url.pathname===new URL(appPage).pathname);
  if(navigation||shell.has(url.href))networkFirst(event,navigation?appPage:url.href);
});

function networkFirst(event,key){
  let update;
  const response=fetch(event.request,{cache:'no-cache'}).then(result=>{
    if(result.ok){
      const copy=result.clone();
      update=caches.open(cacheName).then(cache=>cache.put(key,copy)).catch(()=>{});
    }
    return result;
  },async ()=>{
    const cache=await caches.open(cacheName);
    return (await cache.match(key))??Response.error();
  });
  event.respondWith(response);
  event.waitUntil(response.then(()=>update).catch(()=>{}));
}
