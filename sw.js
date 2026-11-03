/* ATLASYA service worker — صفحة الطالب "مثبّتة" على النسخة اللي الطالب شغّال بيها.
   - لما تنزّل نسخة جديدة على السيرفر، الطالب مش بياخدها بالريفرش ولا لوحده.
   - بتوصله فقط لما يضغط "تحديث" (atlUpdateApp بيمسح الكاش ويفتح الصفحة بـ ?_u=...) فبنجيب النسخة الجديدة ونثبّتها.
   - الأدمن (admin.html) والملفات التانية والصور: شبكة أولًا زي الأول (بياخدوا الجديد دايمًا).
   - مش لازم تغيّر رقم نسخة هنا عند كل تعديل — الملف ده بيتغيّر بس لو عدّلت منطق الـ Service Worker نفسه. */
/* أيقونة الإشعار: لوجو المنصة (icon) + أيقونة الشريط الصغيرة (badge: لوجو أبيض على شفاف — أندرويد بيرسمها بلون واحد).
   بنحقنهم هنا في showNotification نفسها، فيشتغلوا مع أي إشعار بيعرضه push-sw.js من غير ما نعدّل فيه. */
(function () {
  const proto = self.ServiceWorkerRegistration && self.ServiceWorkerRegistration.prototype;
  if (!proto || proto.__atlIcons) return;
  const orig = proto.showNotification;
  const abs = p => new URL(p, self.registration.scope).href;
  proto.showNotification = function (title, opts) {
    opts = Object.assign({}, opts || {});
    opts.icon = opts.icon || abs('icons/icon-192.png');
    opts.badge = abs('icons/badge-96.png');
    return orig.call(this, title, opts);
  };
  proto.__atlIcons = true;
})();

importScripts('push-sw.js'); // الإشعارات الخارجية (Web Push)

const ATL_SHELL_CACHE = 'atlasya-shell';   // ثابت — متغيّرش الاسم ده عشان النسخة المثبّتة متتمسحش بالغلط
const ATL_SHELL = ['./', './index.html', './admin.html', './manifest.webmanifest', './manifest-admin.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/badge-96.png'];
const atlIsAdminPath = p => /admin|explore/i.test(p);   // الأدمن وصفحة الزائر (explore) = شبكة أولًا دايمًا (مش مثبّتة)، فالزوّار ياخدوا آخر نسخة

self.addEventListener('install', e => {
  /* نجهّز الأساسيات لأول مرة بس — اللي موجود بالفعل (النسخة المثبّتة) منلمسوش */
  e.waitUntil(caches.open(ATL_SHELL_CACHE).then(c => Promise.allSettled(ATL_SHELL.map(async u => {
    if (await c.match(u)) return;
    const r = await fetch(u, { cache: 'reload' });
    if (r && r.status === 200 && r.type === 'basic') await c.put(u, r);
  }))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== ATL_SHELL_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* صفحة الطالب: من الكاش (النسخة المثبّتة). لو الكاش فاضي (أول مرة / بعد "تحديث") أو الرابط فيه _u → من السيرفر ونثبّتها. */
async function atlPinnedPage(req, url) {
  const key = url.origin + url.pathname;
  const c = await caches.open(ATL_SHELL_CACHE);
  const fresh = url.searchParams.has('_u');
  if (!fresh) { const hit = await c.match(key); if (hit) return hit; }
  try {
    const res = await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' });
    if (res && res.redirected) return Response.redirect(res.url, 302);
    if (res && res.status === 200 && res.type === 'basic') await c.put(key, res.clone());
    return res;
  } catch (err) {
    return (await c.match(key)) || (await c.match('./index.html')) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase / APIs / الخطوط / أي دومين تاني: سيبه للمتصفح (بيانات لايف)
  if (url.origin !== location.origin) return;
  if (req.headers.has('range')) return;   // فيديو/PDF بـ Range → سيبه للمتصفح (ردود 206 مينفعش تتخزّن)
  /* فحص الإصدار (version.json / الصفحة بـ no-store) لازم يروح للسيرفر دايمًا عشان يعرف إن فيه نسخة جديدة */
  if (req.cache === 'no-store' || /version\.json$/i.test(url.pathname) || url.searchParams.has('_')) return;

  if (req.mode === 'navigate' && !atlIsAdminPath(url.pathname)) { e.respondWith(atlPinnedPage(req, url)); return; }

  /* باقي الملفات: شبكة أولًا، والكاش لو أوفلاين (زي الأول) */
  e.respondWith(
    fetch(req)
      .then(res => {
        // نخزّن 200 فقط (cache.put بيرمي error مع 206 وردود الـ redirect/opaque)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(ATL_SHELL_CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r ||
        (req.mode === 'navigate'
          ? caches.match(url.pathname.endsWith('admin.html') ? './admin.html' : url.pathname.endsWith('explore.html') ? './explore.html' : './index.html').then(f => f || Response.error())
          : Response.error())))
  );
});
