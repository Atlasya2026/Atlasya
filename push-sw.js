/* push-sw.js — معالج الإشعارات الخارجية (Web Push).
   ضيف السطر ده في أول ملف sw.js الحالي (بعد أي تعليقات):
       importScripts('push-sw.js');
   وارفع push-sw.js جنب sw.js في نفس المجلد. */

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = { body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'ATLASYA';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    dir: 'rtl',
    lang: 'ar',
    data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ('focus' in c) { c.postMessage({ type: 'push-nav', url: target }); return c.focus(); }
    }
    return self.clients.openWindow(target);
  }));
});
