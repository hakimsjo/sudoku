const CACHE_NAME = 'sudoku-v2';
const APP_SHELL = [
    './',
    './index.html',
    './sudoku.js',
    './favicon.svg',
    './icon-192.png',
    './icon-512.png',
    './manifest.webmanifest'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => Promise.all(
            names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse =>
            cachedResponse || fetch(event.request)
        )
    );
});
