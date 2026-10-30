/* ATLASYA service worker — network-first, offline fallback to cache.
   غيّر رقم النسخة لما تعدّل الملفات عشان الكاش القديم يتمسح. */
importScripts('push-sw.js'); // الإشعارات الخارجية (Web Push)

const VERSION = 'atlasya-v6';
const SHELL = ['./', './index.html', './admin.html', './manifest.webmanifest', './manifest-admin.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase / APIs / الخطوط / أي دومين تاني: سيبه للمتصفح (بيانات لايف)
  if (url.origin !== location.origin) return;
  if (req.headers.has('range')) return;   // فيديو/PDF بـ Range → سيبه للمتصفح (ردود 206 مينفعش تتخزّن)

  e.respondWith(
    fetch(req)
      .then(res => {
        // نخزّن 200 فقط (cache.put بيرمي error مع 206 وردود الـ redirect/opaque)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r ||
        (req.mode === 'navigate'
          ? caches.match(url.pathname.endsWith('admin.html') ? './admin.html' : './index.html').then(f => f || Response.error())
          : Response.error())))
  );
});
