const CACHE = 'cancionero-v1';
const BASE = self.registration.scope;
const ESENCIALES = ['', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'].map(p => BASE + p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESENCIALES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navegación: red primero, caché si no hay conexión.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })
        .catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // Resto: caché primero, y guarda lo que llegue de la red (fuentes, portadas).
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok && (r.type === 'basic' || r.type === 'cors')) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return r;
    }).catch(() => new Response('', { status: 504, statusText: 'Sin conexión' })))
  );
});
