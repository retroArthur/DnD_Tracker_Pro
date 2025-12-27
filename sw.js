// Service Worker for D&D Tracker
// Basic offline caching

const CACHE_NAME = 'dnd-tracker-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass through all requests - localStorage handles offline data
    event.respondWith(fetch(event.request));
});
