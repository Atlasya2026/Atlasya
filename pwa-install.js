/* ATLASYA — PWA install card
   - بيسجّل الـ service worker
   - بيطلّع كارت من ناحية اليمين بعد ما الطالب يسجّل دخول
   - Android/Chrome/Edge: زرار تحميل مباشر | iPhone/Firefox: خطوات التثبيت جوه الكارت */
(function () {
  'use strict';

  /* ───────── Service worker ───────── */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('[PWA] SW failed', e); });
    });
  }

  /* ───────── Config (admin.html بيحط window.ATLASYA_PWA = {admin:true}) ───────── */
  var CFG = window.ATLASYA_PWA || {};
  var IS_ADMIN = !!CFG.admin;
  var LOGO = IS_ADMIN ? 'icons/admin-icon-192.png' : 'icons/icon-192.png';

  /* ───────── Environment ───────── */
  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var isMobile = isIOS || isAndroid || window.innerWidth <= 768;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isChromium = /chrome|crios|edg\/|samsungbrowser|opr\//i.test(ua) && !isIOS; // بيطلّع beforeinstallprompt
  var SNOOZE_DAYS = 3;
  var SFX = IS_ADMIN ? '_admin' : '';
  var K_SNOOZE = 'atl_pwa_snooze_until' + SFX, K_DONE = 'atl_pwa_installed' + SFX;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function isAR() { return typeof lang === 'undefined' ? true : lang === 'AR'; }

  /* ───────── Telegram admin notifications (عن طريق window._notifyAdminsBot الموجودة في الموقع) ───────── */
  var K_NOTIFIED = 'atl_pwa_install_notified';
  var pendingInstall = false;

  function studentName() {
    var d = window._userData || {};
    return ((d.firstName || '') + ' ' + (d.lastName || '')).trim() || d.email || 'طالب';
  }
  function deviceInfo() {
    var platform = 'laptop';
    if (isIOS) platform = /ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'tablet' : 'phone';
    else if (isAndroid) platform = /mobile/i.test(ua) ? 'phone' : 'tablet';
    var os = isIOS ? 'iOS' : isAndroid ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'macOS' : /cros/i.test(ua) ? 'ChromeOS' : /linux/i.test(ua) ? 'Linux' : '-';
    var browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
      : /firefox|fxios/i.test(ua) ? 'Firefox' : /crios|chrome/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : '-';
    return { platform: platform, os: os, browser: browser };
  }
  // بتتبعت مرة واحدة بس لكل جهاز، وبعد ما بيانات الطالب تكون جاهزة
  function flushInstall() {
    if (IS_ADMIN || store(K_NOTIFIED)) return;
    if (!(pendingInstall || isStandalone)) return;          // standalone = الطالب فتح التطبيق المثبّت (بيغطي iPhone والتثبيت اليدوي)
    if (!loggedIn() || !window._userData || typeof window._notifyAdminsBot !== 'function') return;
    store(K_NOTIFIED, '1'); pendingInstall = false;
    var di = deviceInfo();
    window._notifyAdminsBot('app_install', { studentName: studentName(), platform: di.platform, os: di.os, browser: di.browser });
  }

  /* ───────── إشعار الاستريك: «الطالب فلان عمل استريك النهارده» ───────── */
  window.addEventListener('atlasya:streak', function (e) {
    var d = e.detail || {};
    if (IS_ADMIN || d.kind !== 'day' || typeof window._notifyAdminsBot !== 'function') return;
    var uid = (window._currentUid || window._userData && window._userData.uid || 'u');
    var key = 'atl_streak_notified_' + uid, n = new Date(), today = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2);   // تاريخ الجهاز المحلي (مش UTC)
    if (store(key) === today) return;                        // مرة واحدة في اليوم
    store(key, today);
    var ms = (d.milestones || [])[0];
    window._notifyAdminsBot('streak_day', {
      studentName: studentName(),
      streak: Number(d.streak) || 1,
      coinsAwarded: Number(d.totalGranted) || 0,
      milestoneDays: ms ? Number(ms.days) : 0
    });
  });

  var deferredPrompt = null;
  var card = null, showTimer = null, stepsOpen = false;

  /* ───────── Texts ───────── */
  function T() {
    var ar = isAR();
    var dev = isMobile ? (ar ? 'موبايلك' : 'your phone') : (ar ? 'جهازك' : 'your device');
    if (IS_ADMIN) return ar ? {
      title: 'حمّل لوحة الأدمن دلوقتي',
      sub: 'تقدر تحمّل لوحة التحكم دلوقتي وتنزل على ' + dev + ' وتفتحها زي أي تطبيق.',
      btn: 'تحميل التطبيق', how: 'إزاي أحمّله؟', later: 'مش دلوقتي',
      close: 'إغلاق', done: '✓ جاري تثبيت التطبيق...', steps: stepsFor(true)
    } : {
      title: 'Install the Admin app',
      sub: 'Install the admin panel — it lands on ' + dev + ' and opens like any other app.',
      btn: 'Install app', how: 'How to install?', later: 'Not now',
      close: 'Close', done: '✓ Installing app...', steps: stepsFor(false)
    };
    return ar ? {
      title: 'حمّل التطبيق دلوقتي',
      sub: 'تقدر تحمّل التطبيق دلوقتي وينزل على ' + dev + ' ويفتح زي أي تطبيق.',
      btn: 'تحميل التطبيق', how: 'إزاي أحمّله؟', later: 'مش دلوقتي',
      close: 'إغلاق', done: '✓ جاري تثبيت التطبيق...',
      steps: stepsFor(true)
    } : {
      title: 'Get the app now',
      sub: 'You can install the app now — it lands on ' + dev + ' and opens like any other app.',
      btn: 'Install app', how: 'How to install?', later: 'Not now',
      close: 'Close', done: '✓ Installing app...',
      steps: stepsFor(false)
    };
  }
  function stepsFor(ar) {
    if (isIOS) return ar
      ? ['اضغط زر <b>المشاركة</b> <span class="atl-ico">⬆︎</span> في شريط Safari', 'اختار <b>«إضافة إلى الشاشة الرئيسية»</b>', 'اضغط <b>«إضافة»</b> وهتلاقي ATLASYA على شاشتك ✅']
      : ['Tap the <b>Share</b> button <span class="atl-ico">⬆︎</span> in Safari', 'Choose <b>“Add to Home Screen”</b>', 'Tap <b>“Add”</b> — ATLASYA appears on your screen ✅'];
    return ar
      ? ['اضغط على <b>⋮</b> (قائمة المتصفح)', 'اختار <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>', 'اضغط <b>«تثبيت»</b> ✅']
      : ['Open the browser menu <b>⋮</b>', 'Choose <b>“Install app”</b> or <b>“Add to Home screen”</b>', 'Tap <b>“Install”</b> ✅'];
  }

  /* ───────── Styles ───────── */
  function injectCSS() {
    if (document.getElementById('atlPwaCss')) return;
    var s = document.createElement('style');
    s.id = 'atlPwaCss';
    s.textContent = [
      '#atlPwaCard{position:fixed;right:16px;bottom:24px;z-index:99990;width:min(350px,calc(100vw - 32px));',
      'background:linear-gradient(160deg,#20242c,#171a21);color:#e8e6f0;border:1px solid rgba(39,163,70,.4);',
      'border-radius:18px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.03) inset;',
      "font-family:'Tajawal',sans-serif;transform:translateX(calc(100% + 40px));opacity:0;visibility:hidden;",
      'transition:transform .55s cubic-bezier(.22,1,.36,1),opacity .4s ease,visibility 0s linear .55s;overflow:hidden}',
      '#atlPwaCard.show{transform:translateX(0);opacity:1;visibility:visible;transition-delay:0s}',
      '#atlPwaCard::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,#27a346,#f0c040)}',
      '#atlPwaCard .atl-row{display:flex;align-items:center;gap:12px}',
      '#atlPwaCard .atl-logo{width:52px;height:52px;border-radius:13px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
      '#atlPwaCard .atl-txt{flex:1;min-width:0}',
      '#atlPwaCard .atl-txt strong{display:block;font-size:15px;font-weight:800;margin-bottom:3px}',
      '#atlPwaCard .atl-txt span{display:block;font-size:12.5px;line-height:1.6;color:#9aa0b2}',
      '#atlPwaCard .atl-x{position:absolute;top:8px;background:none;border:0;color:#8a8fa0;font-size:20px;line-height:1;cursor:pointer;padding:4px 8px}',
      '#atlPwaCard .atl-x:hover{color:#ff6b6b;transform:none}',
      '#atlPwaCard .atl-actions{display:flex;gap:8px;margin-top:14px}',
      '#atlPwaCard .atl-btn{flex:1;border:0;border-radius:11px;padding:11px 14px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;color:#fff;',
      'background:linear-gradient(135deg,#1e7a34,#27a346);box-shadow:0 3px 14px rgba(30,122,52,.45)}',
      '#atlPwaCard .atl-btn.ghost{flex:0 0 auto;background:rgba(255,255,255,.06);box-shadow:none;color:#b4b9c8;font-weight:500}',
      '#atlPwaCard .atl-steps{display:none;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}',
      '#atlPwaCard.steps .atl-steps{display:block}',
      '#atlPwaCard .atl-step{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.6;margin-bottom:9px}',
      '#atlPwaCard .atl-n{min-width:24px;height:24px;border-radius:50%;background:#1e7a34;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}',
      '#atlPwaCard .atl-ico{display:inline-block;padding:0 5px;border-radius:5px;background:rgba(255,255,255,.1)}',
      '#atlPwaCard[dir=rtl] .atl-x{left:6px}#atlPwaCard[dir=ltr] .atl-x{right:6px}',
      '@media (max-width:768px){#atlPwaCard{bottom:16px;right:12px;width:min(340px,calc(100vw - 24px))}}',
      '@media (prefers-reduced-motion:reduce){#atlPwaCard{transition:opacity .2s}}',
      'body.light-mode #atlPwaCard{background:#fff;color:#1c2230;border-color:rgba(30,122,52,.35);box-shadow:0 18px 50px rgba(0,0,0,.18)}',
      'body.light-mode #atlPwaCard .atl-txt span{color:#5b6275}',
      'body.light-mode #atlPwaCard .atl-btn.ghost{background:#eef0f4;color:#4a5164}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ───────── Card ───────── */
  function build() {
    if (card) return card;
    injectCSS();
    card = document.createElement('div');
    card.id = 'atlPwaCard';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML =
      '<button class="atl-x" id="atlPwaX" type="button">×</button>' +
      '<div class="atl-row"><img class="atl-logo" src="' + LOGO + '" alt="ATLASYA">' +
      '<div class="atl-txt"><strong id="atlT"></strong><span id="atlS"></span></div></div>' +
      '<div class="atl-actions"><button class="atl-btn" id="atlGo" type="button"></button>' +
      '<button class="atl-btn ghost" id="atlLater" type="button"></button></div>' +
      '<div class="atl-steps" id="atlSteps"></div>';
    document.body.appendChild(card);
    card.querySelector('#atlPwaX').onclick = card.querySelector('#atlLater').onclick = dismiss;
    card.querySelector('#atlGo').onclick = install;
    return card;
  }

  function render() {
    if (!card) return;
    var t = T();
    card.dir = isAR() ? 'rtl' : 'ltr';
    card.querySelector('#atlT').textContent = t.title;
    card.querySelector('#atlS').textContent = t.sub;
    card.querySelector('#atlLater').textContent = t.later;
    card.querySelector('#atlPwaX').setAttribute('aria-label', t.close);
    card.querySelector('#atlGo').textContent = deferredPrompt ? t.btn : t.how;
    card.querySelector('#atlSteps').innerHTML = t.steps.map(function (s, i) {
      return '<div class="atl-step"><div class="atl-n">' + (i + 1) + '</div><div>' + s + '</div></div>';
    }).join('');
  }

  function show() {
    build(); render();
    requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('show'); }); });
  }
  function hide() { if (card) card.classList.remove('show'); }

  function dismiss() {
    hide();
    store(K_SNOOZE, String(Date.now() + SNOOZE_DAYS * 864e5));
  }

  /* ───────── Install ───────── */
  function install() {
    if (deferredPrompt) {
      var p = deferredPrompt; deferredPrompt = null;
      p.prompt();
      p.userChoice.then(function (c) {
        if (c.outcome === 'accepted') {
          store(K_DONE, '1'); hide(); pendingInstall = true; flushInstall();
          if (typeof showToast === 'function') showToast(T().done);
        } else { dismiss(); }
      }).catch(function () {});
      return;
    }
    // مفيش prompt جاهز (iPhone / Firefox …) → اعرض الخطوات
    if (card) { card.classList.toggle('steps'); stepsOpen = card.classList.contains('steps'); }
    else if (typeof window.alert === 'function') alert(T().steps.join('\n').replace(/<[^>]+>/g, ''));
  }
  window.triggerPWAInstall = function () {   // بيستخدمه زرار «Install App» في الداشبورد
    if (!deferredPrompt && !card) { build(); render(); show(); }
    install();
  };
  window.dismissPWABanner = dismiss;

  /* ───────── When to show ───────── */
  function loggedIn() {
    var app = document.getElementById('mainApp');
    return !!app && getComputedStyle(app).display !== 'none' && (IS_ADMIN ? window._isAdmin === true : !window._isAdmin);
  }
  function allowed() {
    if (isStandalone || store(K_DONE)) return false;
    var until = parseInt(store(K_SNOOZE) || '0', 10);
    if (until && Date.now() < until) return false;
    if (isChromium && !deferredPrompt) return false;   // كروم بيقول لو التثبيت متاح — استنى الـ event
    return true;
  }
  function check() {
    flushInstall();
    if (!loggedIn()) { clearTimeout(showTimer); showTimer = null; hide(); return; }
    if (!allowed() || (card && card.classList.contains('show')) || showTimer) return;
    showTimer = setTimeout(function () {       // استنى ثانيتين بعد الدخول عشان الواجهة تفتح الأول
      showTimer = null;
      if (loggedIn() && allowed()) show();
    }, 2500);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferredPrompt = e; render(); check();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null; store(K_DONE, '1'); hide(); pendingInstall = true; flushInstall();
  });

  function init() {
    var app = document.getElementById('mainApp'), auth = document.getElementById('authBox');
    var mo = new MutationObserver(check);
    [app, auth].forEach(function (el) { if (el) mo.observe(el, { attributes: true, attributeFilter: ['style', 'class'] }); });
    setInterval(check, 3000);                  // شبكة أمان
    check();
    // تحديث النص لما اللغة تتغيّر
    var _t = window.toggleLang;
    if (typeof _t === 'function') window.toggleLang = function () { var r = _t.apply(this, arguments); render(); return r; };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
