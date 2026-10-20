        /* ─── LANGUAGE ─── */
        let lang = 'AR';
        /* Real, public URL of the deployed platform — used to build the
           student invite/referral link so it always points at the live
           site regardless of where this page happens to be loaded from. */
        const PLATFORM_BASE_URL = 'https://atlasya2026.github.io/Atlasya/';
        const T = {
            AR: {
                navLbl1: 'الرئيسية', navLbl2: 'المحتوى',
                navLbl3: 'الأدوات', navLbl4: 'التعلم', navLbl5: 'أخرى',
                menuDashTxt: 'الرئيسية',
                menuPlayTxt: 'قوائم التشغيل',
                menuLibTxt: 'المكتبة الرقمية',
                menuInsightTxt: 'رؤى GIS',
                menuDataTxt: 'البيانات المكانية',
                menuToolTxt: 'أدوات البرامج',
                menuJobTxt: 'لوحة الوظائف',
                menuCourseTxt: 'الكورسات',
                menuConnectTxt: 'سوشيال ميديا',
                menuCommunityTxt: 'مجتمع الطلاب',
                menuExpertTxt: 'الدعم الفني',
                menuCVTxt: 'عمل CV',
                menuPortfolioTxt: 'خرائط الطلبة',
                menuMentorshipTxt: 'اسأل خبير GIS',
                menuAccountTxt: 'الإعدادات',
                menuAdminMembersTxt: 'قائمة الأعضاء',
                menuAdminProTxt: 'طلبات Pro',
                menuAdminCVTxt: 'عمل CV',
                menuAdminPortfolioTxt: 'خرائط الطلبة',
                menuAdminMentorshipTxt: 'حجوزات الاستشارات',
                menuDailyChallengeTxt: 'التحديات',
                menuWheelTxt: 'عجلة الحظ',
                txtTopbarLogout: 'خروج',
                txtTopbarLogoutDesk: 'خروج',
                sideUserRole: 'عضو',
                notifMarkAllTxt: 'تعليم الكل',
                notifDropTitle: 'الإشعارات',
                langBtn: 'EN',
            },
            EN: {
                navLbl1: 'Overview', navLbl2: 'Content',
                navLbl3: 'Tools', navLbl4: 'Learning', navLbl5: 'Other',
                menuDashTxt: 'Home',
                menuPlayTxt: 'Playlists',
                menuLibTxt: 'Digital Library',
                menuInsightTxt: 'GIS Insights',
                menuDataTxt: 'Spatial Datasets',
                menuToolTxt: 'GIS Software',
                menuJobTxt: 'Job Board',
                menuCourseTxt: 'Courses',
                menuConnectTxt: 'Social Media',
                menuCommunityTxt: 'Community',
                menuExpertTxt: 'Technical Support',
                menuCVTxt: 'Build CV',
                menuPortfolioTxt: 'Student Maps',
                menuMentorshipTxt: 'Ask a GIS Expert',
                menuAccountTxt: 'Settings',
                menuAdminMembersTxt: 'Members List',
                menuAdminProTxt: 'Pro Requests',
                menuAdminCVTxt: 'Build CV',
                menuAdminPortfolioTxt: 'Student Maps',
                menuAdminMentorshipTxt: 'Consultation Bookings',
                menuDailyChallengeTxt: 'Challenges',
                menuWheelTxt: 'Fortune Wheel',
                txtTopbarLogout: 'Logout',
                txtTopbarLogoutDesk: 'Logout',
                sideUserRole: 'Member',
                notifMarkAllTxt: 'Mark All Read',
                notifDropTitle: 'Notifications',
                langBtn: 'AR',
            }
        };

        function toggleLang() {
            lang = lang === 'AR' ? 'EN' : 'AR';
            const body = document.getElementById('pageBody');
            body.classList.toggle('rtl', lang === 'AR');
            applyLang();
            // re-render current page to apply language
            if (window._currentPage) navigate(window._currentPage, null, true);
        }

        function applyLang() {
            const t = T[lang];
            for (const id in t) {
                const el = document.getElementById(id);
                if (el) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[id];
                    else el.textContent = t[id];
                }
            }
            // Update notification dropdown title & mark-all button
            const notifDropTitle = document.getElementById('notifDropTitle');
            if (notifDropTitle) notifDropTitle.textContent = t.notifDropTitle || (lang === 'AR' ? 'الإشعارات' : 'Notifications');
            const notifMarkAllTxt = document.getElementById('notifMarkAllTxt');
            if (notifMarkAllTxt) notifMarkAllTxt.textContent = t.notifMarkAllTxt || (lang === 'AR' ? 'تعليم الكل' : 'Mark All Read');
            const notifMarkAllBtn = document.getElementById('notifMarkAllBtn');
            if (notifMarkAllBtn) notifMarkAllBtn.title = lang === 'AR' ? 'تعليم الكل كمقروء' : 'Mark all as read';
        }

        /* ─── AUTH FORMS ─── */
        function showLogin() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('signUpForm').classList.add('hidden');
            document.getElementById('forgotForm').classList.add('hidden');
            document.getElementById('emailVerifyForm').classList.add('hidden');
            document.getElementById('adminLoginForm').classList.add('hidden');
        }
        function showSignup() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('signUpForm').classList.remove('hidden');
            document.getElementById('forgotForm').classList.add('hidden');
            document.getElementById('emailVerifyForm').classList.add('hidden');
            document.getElementById('adminLoginForm').classList.add('hidden');
        }
        function showSupervisorLogin() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('signUpForm').classList.add('hidden');
            document.getElementById('forgotForm').classList.add('hidden');
            document.getElementById('emailVerifyForm').classList.add('hidden');
            document.getElementById('adminLoginForm').classList.remove('hidden');
            const emailEl = document.getElementById('svLoginEmail');
            if (emailEl) setTimeout(() => emailEl.focus(), 50);
        }
        // student.html?supervisor=1 بيفتح فورم المشرفين على طول (admin.html بيرجّع هنا لو مفيش جلسة)
        (function () {
            try {
                const qs = new URLSearchParams(location.search);
                if (qs.get('supervisor') === '1') {
                    showSupervisorLogin();
                    qs.delete('supervisor');
                    const rest = qs.toString();
                    history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
                }
            } catch (e) {}
        })();

        /* رسالة خطأ بتقول السبب الحقيقي (بدل "حدث خطأ" وبس) — للعجلة والتحديات */
        window.explainFirestoreError = function (e, isAR) {
            const code = (e && e.code) || '';
            const msg  = (e && e.message) || '';
            if (code === 'permission-denied' || code === 'firestore/permission-denied')
                return isAR ? 'قواعد Firestore مانعة العملية دي (permission-denied)' : 'Firestore rules blocked this action (permission-denied)';
            if (code === 'unavailable' || code === 'firestore/unavailable' || code === 'auth/network-request-failed' || /network|offline/i.test(msg))
                return isAR ? 'مشكلة في الاتصال بالإنترنت، حاول تاني' : 'Network problem, try again';
            if (/answer key/i.test(msg))
                return isAR ? 'السؤال ده لسه مالوش إجابة صحيحة متسجلة — بلّغ الإدارة' : 'This question has no answer key yet — please tell the admins';
            return isAR ? 'حدث خطأ، حاول تاني' : 'Something went wrong, try again';
        };

        /* ─── PLATFORM ON/OFF — صفحة "المنصة متوقفة مؤقتًا" + لعبة التسلية ───
           الصفحة كاملة (اللي في كود_ايقاف_منصة_مؤقتا) بتتعرض جوه iframe معزول (srcdoc + sandbox)
           عشان الـ CSS بتاعها ما يتخانقش مع CSS المنصة، واللعبة تفضل شغالة زي ما هي.
           الحالة بتيجي من Firestore: settings/platformStatus.maintenance (شوف startPlatformWatcher). */
        const MAINTENANCE_PAGE_HTML = "\u003c!DOCTYPE html>\n\u003chtml lang=\"ar\" dir=\"rtl\">\n\u003chead>\n\u003cmeta charset=\"UTF-8\">\n\u003cmeta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n\u003cmeta name=\"robots\" content=\"noindex, nofollow\">\n\u003ctitle>ATLASYA — تحت الصيانة\u003c/title>\n\u003clink rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n\u003clink rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n\u003clink href=\"https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=Tajawal:wght@400;500;700;800&display=swap\" rel=\"stylesheet\">\n\u003cstyle>\n  :root{\n    --ink:#0b1d26;\n    --ink-2:#0f2733;\n    --paper:#ede6d6;\n    --paper-dim:#c9c0aa;\n    --grid:#2f4a45;\n    --grid-soft:#1c332f;\n    --beacon:#e8a33d;\n    --beacon-dim:#8a6326;\n  }\n  *{box-sizing:border-box;}\n  html,body{height:100%;}\n  body{\n    margin:0;\n    background:radial-gradient(ellipse at 50% -10%, var(--ink-2), var(--ink) 60%);\n    color:var(--paper);\n    font-family:'Tajawal', sans-serif;\n    min-height:100vh;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    overflow:hidden;\n    position:relative;\n  }\n\n  /* ---------- خلفية خطوط الارتفاعات (كونتور) ---------- */\n  .contours{\n    position:fixed; inset:0;\n    z-index:0;\n    opacity:.5;\n  }\n  .contours svg{\n    width:100%; height:100%;\n    display:block;\n  }\n  .contours path{\n    fill:none;\n    stroke:var(--grid);\n    stroke-width:1;\n  }\n  .contours .drift{\n    animation:drift 60s linear infinite;\n  }\n  @keyframes drift{\n    from{ transform:translateY(0); }\n    to{ transform:translateY(-120px); }\n  }\n\n  .vignette{\n    position:fixed; inset:0; z-index:1; pointer-events:none;\n    background:radial-gradient(ellipse at 50% 40%, transparent 30%, var(--ink) 92%);\n  }\n\n  /* ---------- المحتوى ---------- */\n  .wrap{\n    position:relative; z-index:2;\n    width:100%;\n    max-width:640px;\n    padding:32px 24px;\n    text-align:center;\n  }\n\n  .wordmark{\n    font-family:'JetBrains Mono', monospace;\n    letter-spacing:.35em;\n    font-size:13px;\n    color:var(--beacon);\n    text-transform:uppercase;\n    margin-bottom:6px;\n  }\n  .tagline{\n    font-family:'JetBrains Mono', monospace;\n    font-size:11px;\n    color:var(--paper-dim);\n    letter-spacing:.15em;\n    margin-bottom:40px;\n  }\n\n  .crosshair{\n    width:64px; height:64px;\n    margin:0 auto 28px;\n    position:relative;\n  }\n  .crosshair svg{ width:100%; height:100%; }\n  .crosshair circle{\n    fill:none; stroke:var(--beacon); stroke-width:1.4;\n  }\n  .crosshair .ring1{ animation:spin 14s linear infinite; transform-origin:32px 32px; }\n  .crosshair .ring2{ animation:spin 22s linear infinite reverse; transform-origin:32px 32px; }\n  .crosshair line{ stroke:var(--beacon-dim); stroke-width:1; }\n  .crosshair .core{ fill:var(--beacon); stroke:none; }\n  @keyframes spin{ to{ transform:rotate(360deg); } }\n\n  h1{\n    font-family:'Big Shoulders Display', sans-serif;\n    font-weight:800;\n    font-size:clamp(34px, 6vw, 52px);\n    line-height:1.15;\n    margin:0 0 14px;\n    color:var(--paper);\n  }\n  h1 span{ color:var(--beacon); }\n\n  p.lead{\n    font-size:16px;\n    line-height:1.9;\n    color:var(--paper-dim);\n    max-width:480px;\n    margin:0 auto 36px;\n  }\n\n  /* ---------- سجل الحالة ---------- */\n  .log{\n    text-align:right;\n    background:rgba(237,230,214,.04);\n    border:1px solid rgba(237,230,214,.12);\n    border-radius:10px;\n    padding:18px 20px;\n    margin:0 auto 32px;\n    max-width:420px;\n  }\n  .log-row{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    gap:12px;\n    font-family:'JetBrains Mono', monospace;\n    font-size:12.5px;\n    padding:9px 0;\n    border-bottom:1px dashed rgba(237,230,214,.1);\n    color:var(--paper-dim);\n  }\n  .log-row:last-child{ border-bottom:none; }\n  .log-row .label{ color:var(--paper); text-align:right; }\n  .status{\n    display:inline-flex; align-items:center; gap:7px;\n    padding:3px 9px;\n    border-radius:20px;\n    font-size:10.5px;\n    letter-spacing:.05em;\n  }\n  .status::before{\n    content:'';\n    width:6px; height:6px;\n    border-radius:50%;\n  }\n  .status.working{ background:rgba(232,163,61,.12); color:var(--beacon); }\n  .status.working::before{ background:var(--beacon); animation:pulse 1.6s ease-in-out infinite; }\n  .status.locked{ background:rgba(237,230,214,.08); color:var(--paper-dim); }\n  .status.locked::before{ background:var(--paper-dim); }\n  @keyframes pulse{\n    0%,100%{ opacity:1; } 50%{ opacity:.25; }\n  }\n\n  .coords{\n    font-family:'JetBrains Mono', monospace;\n    font-size:11px;\n    color:var(--grid);\n    letter-spacing:.1em;\n  }\n\n  @media (prefers-reduced-motion: reduce){\n    .contours .drift, .crosshair .ring1, .crosshair .ring2, .status.working::before{\n      animation:none !important;\n    }\n  }\n\n  @media (max-width:480px){\n    .log{ text-align:right; }\n    .log-row{ font-size:11.5px; }\n  }\n\n  /* ---------- زرار اللعبة ---------- */\n  .play-btn{\n    font-family:'Tajawal', sans-serif;\n    font-weight:700;\n    font-size:14.5px;\n    color:var(--ink);\n    background:var(--beacon);\n    border:none;\n    border-radius:30px;\n    padding:13px 26px;\n    margin-top:30px;\n    cursor:pointer;\n    display:inline-flex;\n    align-items:center;\n    gap:8px;\n    transition:transform .15s ease, box-shadow .15s ease;\n    box-shadow:0 0 0 0 rgba(232,163,61,.4);\n  }\n  .play-btn:hover{ transform:translateY(-2px); box-shadow:0 8px 20px -6px rgba(232,163,61,.5); }\n  .play-btn:active{ transform:translateY(0); }\n\n  /* ---------- دخول المشرفين (خافت عن قصد) ---------- */\n  .staff-link{\n    margin-top:34px;\n    background:none; border:none;\n    font-family:'JetBrains Mono', 'Tajawal', monospace;\n    font-size:11px; letter-spacing:.08em;\n    color:var(--paper-dim);\n    opacity:.4;\n    cursor:pointer;\n    padding:6px 10px;\n    transition:opacity .2s ease;\n  }\n  .staff-link:hover, .staff-link:focus-visible{ opacity:1; outline:none; text-decoration:underline; text-underline-offset:3px; }\n\n  /* ---------- المودال ---------- */\n  .modal-overlay{\n    position:fixed; inset:0; z-index:10;\n    background:rgba(6,13,17,.86);\n    backdrop-filter:blur(3px);\n    display:none;\n    align-items:center;\n    justify-content:center;\n    padding:16px;\n  }\n  .modal-overlay.open{ display:flex; }\n\n  .modal{\n    background:linear-gradient(180deg, var(--ink-2), var(--ink));\n    border:1px solid rgba(237,230,214,.14);\n    border-radius:16px;\n    width:100%;\n    max-width:460px;\n    padding:20px;\n    position:relative;\n  }\n  .modal-close{\n    position:absolute; top:14px; left:14px;\n    width:30px; height:30px;\n    border-radius:50%;\n    border:1px solid rgba(237,230,214,.2);\n    background:transparent;\n    color:var(--paper-dim);\n    font-size:16px;\n    cursor:pointer;\n    display:flex; align-items:center; justify-content:center;\n  }\n  .modal-close:hover{ color:var(--paper); border-color:var(--paper-dim); }\n\n  .modal-title{\n    font-family:'Big Shoulders Display', sans-serif;\n    font-weight:800;\n    font-size:22px;\n    text-align:center;\n    margin:0 0 4px;\n  }\n  .modal-sub{\n    font-family:'JetBrains Mono', monospace;\n    font-size:10.5px;\n    color:var(--paper-dim);\n    text-align:center;\n    letter-spacing:.05em;\n    margin-bottom:16px;\n  }\n\n  .hud{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    font-family:'JetBrains Mono', monospace;\n    font-size:13px;\n    color:var(--paper);\n    margin-bottom:10px;\n    padding:0 2px;\n  }\n  .hud .chip{\n    background:rgba(237,230,214,.06);\n    border:1px solid rgba(237,230,214,.12);\n    border-radius:8px;\n    padding:5px 10px;\n  }\n  .hud .chip.beacon-color{ color:var(--beacon); }\n\n  .game-wrap{\n    position:relative;\n    width:100%;\n    aspect-ratio:3/4;\n    max-height:60vh;\n    border-radius:12px;\n    overflow:hidden;\n    border:1px solid rgba(237,230,214,.14);\n    background:radial-gradient(ellipse at 50% 0%, #10262f, #081319 80%);\n    touch-action:none;\n  }\n  #gameCanvas{ width:100%; height:100%; display:block; }\n\n  .game-overlay-msg{\n    position:absolute; inset:0;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:center;\n    gap:14px;\n    text-align:center;\n    padding:20px;\n    background:rgba(6,13,17,.72);\n  }\n  .game-overlay-msg.hidden{ display:none; }\n  .game-overlay-msg h3{\n    font-family:'Big Shoulders Display', sans-serif;\n    font-size:26px;\n    margin:0;\n    color:var(--paper);\n  }\n  .game-overlay-msg p{\n    font-family:'JetBrains Mono', monospace;\n    font-size:12px;\n    color:var(--paper-dim);\n    margin:0;\n    max-width:280px;\n    line-height:1.7;\n  }\n  .game-btn{\n    font-family:'Tajawal', sans-serif;\n    font-weight:700;\n    font-size:14px;\n    color:var(--ink);\n    background:var(--beacon);\n    border:none;\n    border-radius:24px;\n    padding:10px 22px;\n    cursor:pointer;\n  }\n\n  .modal-note{\n    font-size:11.5px;\n    color:var(--paper-dim);\n    text-align:center;\n    margin-top:12px;\n    line-height:1.7;\n  }\n\n  .hint-row{\n    display:flex;\n    justify-content:center;\n    gap:16px;\n    margin-top:10px;\n    font-family:'JetBrains Mono', monospace;\n    font-size:10.5px;\n    color:var(--grid);\n  }\n\u003c/style>\n\u003c/head>\n\u003cbody>\n\n  \u003cdiv class=\"contours\" aria-hidden=\"true\">\n    \u003csvg viewBox=\"0 0 800 800\" preserveAspectRatio=\"xMidYMid slice\">\n      \u003cg class=\"drift\">\n        \u003cpath d=\"M-50,120 C150,60 250,180 450,110 S750,150 900,90\" />\n        \u003cpath d=\"M-50,220 C120,170 260,260 420,200 S760,230 900,180\" />\n        \u003cpath d=\"M-50,320 C160,280 300,350 460,300 S740,320 900,270\" />\n        \u003cpath d=\"M-50,420 C140,390 280,440 440,400 S760,410 900,370\" />\n        \u003cpath d=\"M-50,520 C160,470 300,540 460,490 S740,510 900,460\" />\n        \u003cpath d=\"M-50,620 C140,590 280,640 440,600 S760,610 900,570\" />\n        \u003cpath d=\"M-50,720 C160,680 300,740 460,700 S740,710 900,670\" />\n        \u003cpath d=\"M-50,820 C140,790 280,830 440,800 S760,810 900,770\" />\n        \u003cpath d=\"M-50,920 C160,880 300,940 460,900 S740,910 900,870\" />\n      \u003c/g>\n    \u003c/svg>\n  \u003c/div>\n  \u003cdiv class=\"vignette\" aria-hidden=\"true\">\u003c/div>\n\n  \u003cmain class=\"wrap\">\n    \u003cdiv class=\"wordmark\">ATLASYA\u003c/div>\n    \u003cdiv class=\"tagline\">GIS LEARNING PORTAL\u003c/div>\n\n    \u003cdiv class=\"crosshair\" aria-hidden=\"true\">\n      \u003csvg viewBox=\"0 0 64 64\">\n        \u003ccircle class=\"ring1\" cx=\"32\" cy=\"32\" r=\"27\" stroke-dasharray=\"4 7\"/>\n        \u003ccircle class=\"ring2\" cx=\"32\" cy=\"32\" r=\"19\" stroke-dasharray=\"2 5\"/>\n        \u003cline x1=\"32\" y1=\"4\" x2=\"32\" y2=\"16\"/>\n        \u003cline x1=\"32\" y1=\"48\" x2=\"32\" y2=\"60\"/>\n        \u003cline x1=\"4\" y1=\"32\" x2=\"16\" y2=\"32\"/>\n        \u003cline x1=\"48\" y1=\"32\" x2=\"60\" y2=\"32\"/>\n        \u003ccircle class=\"core\" cx=\"32\" cy=\"32\" r=\"3.2\"/>\n      \u003c/svg>\n    \u003c/div>\n\n    \u003ch1>يتم عمل بعض التحديثات علي المنصة في الوقت الحالي \u003cspan>\u003c/span>\u003cbr>شوية وهنرجع\u003c/h1>\n    \u003cp class=\"lead\">\n      المنصة متوقفة مؤقتًا عشان بنشتغل على تحديثات وإصلاحات مهمة.\n      البيانات والحسابات كلها في أمان، وهنرجع بمجرد ما نخلص.\n    \u003c/p>\n\n\n    \u003cbutton class=\"play-btn\" id=\"openGameBtn\" type=\"button\">\n      🛰️ سلّي وقتك لحد ما نرجع\n    \u003c/button>\n\n    \u003cdiv>\n      \u003cbutton class=\"staff-link\" id=\"staffLoginBtn\" type=\"button\">دخول المشرفين\u003c/button>\n    \u003c/div>\n  \u003c/main>\n\n  \u003cdiv class=\"modal-overlay\" id=\"gameOverlay\">\n    \u003cdiv class=\"modal\">\n      \u003cbutton class=\"modal-close\" id=\"closeGameBtn\" aria-label=\"إغلاق\">✕\u003c/button>\n      \u003cdiv class=\"modal-title\">صياد الإشارات\u003c/div>\n      \u003cdiv class=\"modal-sub\">SIGNAL HUNTER — لعبة تسلية بس\u003c/div>\n\n      \u003cdiv class=\"hud\">\n        \u003cspan class=\"chip beacon-color\" id=\"hudScore\">الإشارات: 0\u003c/span>\n        \u003cspan class=\"chip\" id=\"hudTime\">⏱ 45\u003c/span>\n        \u003cspan class=\"chip\" id=\"hudLives\">♥ ♥ ♥\u003c/span>\n      \u003c/div>\n\n      \u003cdiv class=\"game-wrap\">\n        \u003ccanvas id=\"gameCanvas\">\u003c/canvas>\n\n        \u003cdiv class=\"game-overlay-msg\" id=\"startMsg\">\n          \u003ch3>جاهز تصطاد إشارات؟\u003c/h3>\n          \u003cp>حرّك الجهاز يمين وشمال والقط النقط الصفراء، وابعد عن التشويش الأحمر.\u003c/p>\n          \u003cbutton class=\"game-btn\" id=\"startBtn\">ابدأ\u003c/button>\n        \u003c/div>\n\n        \u003cdiv class=\"game-overlay-msg hidden\" id=\"endMsg\">\n          \u003ch3 id=\"endTitle\">خلصت الجولة!\u003c/h3>\n          \u003cp id=\"endScoreText\">جمّعت 0 إشارة\u003c/p>\n          \u003cbutton class=\"game-btn\" id=\"retryBtn\">جولة تانية\u003c/button>\n        \u003c/div>\n      \u003c/div>\n\n      \u003cdiv class=\"hint-row\">\n        \u003cspan>← → أو A / D\u003c/span>\n        \u003cspan>أو اسحب بإصبعك\u003c/span>\n      \u003c/div>\n\n      \u003cp class=\"modal-note\">\n        النقط دي لعبة تسلية بس أثناء انتظار عودة المنصة — ملهاش أي علاقة\n        بكوينز حسابك أو رصيدك على ATLASYA، ومش بتتسجل في أي مكان.\n      \u003c/p>\n    \u003c/div>\n  \u003c/div>\n\n\u003cscript>\n  // تذبذب بسيط جدًا في رقم الإحداثيات لإحساس \"لايف\" — تجميلي بحت وبدون أي اتصال بالسيرفر\n  (function(){\n    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;\n    var el = document.getElementById('coordTicker');\n    if (!el) return;\n    var baseLat = 30.0444, baseLng = 31.2357;\n    setInterval(function(){\n      var lat = (baseLat + (Math.random() - 0.5) * 0.002).toFixed(4);\n      var lng = (baseLng + (Math.random() - 0.5) * 0.002).toFixed(4);\n      el.textContent = lat + '° N · ' + lng + '° E';\n    }, 2200);\n  })();\n\u003c/script>\n\n\u003cscript>\n  /* =====================================================================\n     \"صياد الإشارات\" — لعبة تسلية بسيطة، كل حاجة تعيش في الذاكرة بس\n     (مفيش أي حفظ دائم ومفيش أي اتصال بأي سيرفر أو Firestore)\n     ===================================================================== */\n  (function(){\n    var overlay   = document.getElementById('gameOverlay');\n    var openBtn   = document.getElementById('openGameBtn');\n    var closeBtn  = document.getElementById('closeGameBtn');\n    var startMsg  = document.getElementById('startMsg');\n    var endMsg    = document.getElementById('endMsg');\n    var startBtn  = document.getElementById('startBtn');\n    var retryBtn  = document.getElementById('retryBtn');\n    var endTitle  = document.getElementById('endTitle');\n    var endScoreText = document.getElementById('endScoreText');\n    var hudScore  = document.getElementById('hudScore');\n    var hudTime   = document.getElementById('hudTime');\n    var hudLives  = document.getElementById('hudLives');\n    var canvas    = document.getElementById('gameCanvas');\n    var ctx       = canvas.getContext('2d');\n\n    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);\n    var running = false, rafId = null;\n    var sessionBest = 0; // في الذاكرة بس — بيتصفّر لما الصفحة تتحدّث\n\n    var receiver, drops, score, lives, timeLeft, lastTick, spawnEvery, spawnTimer, dropSpeed;\n\n    function resizeCanvas(){\n      var rect = canvas.getBoundingClientRect();\n      W = rect.width; H = rect.height;\n      canvas.width = W * dpr;\n      canvas.height = H * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n      if (receiver) receiver.y = H - 34;\n    }\n\n    function resetState(){\n      receiver = { x: W / 2, y: H - 34, w: 46, targetX: W / 2 };\n      drops = [];\n      score = 0;\n      lives = 3;\n      timeLeft = 45;\n      dropSpeed = 1.6;\n      spawnEvery = 900;\n      spawnTimer = 0;\n      lastTick = null;\n      updateHud();\n    }\n\n    function updateHud(){\n      hudScore.textContent = 'الإشارات: ' + score;\n      hudTime.textContent = '⏱ ' + Math.max(0, Math.ceil(timeLeft));\n      hudLives.textContent = '♥ '.repeat(Math.max(0, lives)).trim() || '—';\n    }\n\n    function openModal(){\n      overlay.classList.add('open');\n      resizeCanvas();\n      showStart();\n    }\n    function closeModal(){\n      overlay.classList.remove('open');\n      stopLoop();\n    }\n    function showStart(){\n      startMsg.classList.remove('hidden');\n      endMsg.classList.add('hidden');\n    }\n    function showEnd(reason){\n      if (score > sessionBest) sessionBest = score;\n      endTitle.textContent = reason === 'lives' ? 'خلصت قلوبك!' : 'خلصت الجولة!';\n      endScoreText.textContent = 'جمّعت ' + score + ' إشارة  ·  أفضل نتيجة في الجلسة: ' + sessionBest;\n      endMsg.classList.remove('hidden');\n      startMsg.classList.add('hidden');\n    }\n\n    function startGame(){\n      resizeCanvas();\n      resetState();\n      startMsg.classList.add('hidden');\n      endMsg.classList.add('hidden');\n      running = true;\n      lastTick = performance.now();\n      loop(lastTick);\n    }\n    function stopLoop(){\n      running = false;\n      if (rafId) cancelAnimationFrame(rafId);\n    }\n\n    function spawnDrop(){\n      var isBad = Math.random() \u003c 0.24;\n      drops.push({\n        x: 20 + Math.random() * (W - 40),\n        y: -12,\n        r: isBad ? 8 : 7,\n        bad: isBad,\n        speed: dropSpeed + Math.random() * 0.6\n      });\n    }\n\n    function loop(now){\n      if (!running) return;\n      var dt = Math.min(now - lastTick, 50);\n      lastTick = now;\n\n      timeLeft -= dt / 1000;\n      spawnTimer += dt;\n      if (spawnTimer > spawnEvery){\n        spawnTimer = 0;\n        spawnDrop();\n        dropSpeed = Math.min(dropSpeed + 0.03, 4.2);\n        spawnEvery = Math.max(420, spawnEvery - 4);\n      }\n\n      // حركة سلسة للجهاز نحو الهدف\n      receiver.x += (receiver.targetX - receiver.x) * 0.18;\n      receiver.x = Math.max(receiver.w / 2, Math.min(W - receiver.w / 2, receiver.x));\n\n      for (var i = drops.length - 1; i >= 0; i--){\n        var d = drops[i];\n        d.y += d.speed * (dt / 16.6);\n\n        var caught = d.y > receiver.y - 10 && d.y \u003c receiver.y + 12 &&\n                     Math.abs(d.x - receiver.x) \u003c receiver.w / 2 + d.r;\n\n        if (caught){\n          drops.splice(i, 1);\n          if (d.bad){\n            lives -= 1;\n          } else {\n            score += 1;\n          }\n          updateHud();\n          if (lives \u003c= 0){ endRound('lives'); return; }\n          continue;\n        }\n        if (d.y > H + 20){\n          drops.splice(i, 1);\n        }\n      }\n\n      if (timeLeft \u003c= 0){ endRound('time'); return; }\n      updateHud();\n\n      draw();\n      rafId = requestAnimationFrame(loop);\n    }\n\n    function endRound(reason){\n      running = false;\n      if (rafId) cancelAnimationFrame(rafId);\n      showEnd(reason);\n    }\n\n    function draw(){\n      ctx.clearRect(0, 0, W, H);\n\n      // خطوط شبكة خفيفة تحاكي شبكة إحداثيات\n      ctx.strokeStyle = 'rgba(237,230,214,0.05)';\n      ctx.lineWidth = 1;\n      var step = 28;\n      for (var gx = 0; gx \u003c W; gx += step){\n        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();\n      }\n      for (var gy = 0; gy \u003c H; gy += step){\n        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();\n      }\n\n      // النقاط الساقطة\n      for (var i = 0; i \u003c drops.length; i++){\n        var d = drops[i];\n        ctx.beginPath();\n        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);\n        if (d.bad){\n          ctx.fillStyle = '#c65b45';\n          ctx.shadowColor = 'rgba(198,91,69,0.6)';\n        } else {\n          ctx.fillStyle = '#e8a33d';\n          ctx.shadowColor = 'rgba(232,163,61,0.6)';\n        }\n        ctx.shadowBlur = 8;\n        ctx.fill();\n        ctx.shadowBlur = 0;\n      }\n\n      // الجهاز (المستقبِل)\n      ctx.save();\n      ctx.translate(receiver.x, receiver.y);\n      ctx.strokeStyle = '#ede6d6';\n      ctx.lineWidth = 2;\n      ctx.beginPath();\n      ctx.moveTo(-receiver.w / 2, 10);\n      ctx.lineTo(0, -12);\n      ctx.lineTo(receiver.w / 2, 10);\n      ctx.stroke();\n      ctx.beginPath();\n      ctx.arc(0, -12, 3, 0, Math.PI * 2);\n      ctx.fillStyle = '#e8a33d';\n      ctx.fill();\n      ctx.restore();\n    }\n\n    // ---------- تحكّم ----------\n    function setTargetFromClientX(clientX){\n      var rect = canvas.getBoundingClientRect();\n      receiver.targetX = clientX - rect.left;\n    }\n    canvas.addEventListener('mousemove', function(e){ setTargetFromClientX(e.clientX); });\n    canvas.addEventListener('touchmove', function(e){\n      if (e.touches[0]) setTargetFromClientX(e.touches[0].clientX);\n      e.preventDefault();\n    }, { passive: false });\n\n    var keys = {};\n    window.addEventListener('keydown', function(e){\n      if (!running) return;\n      if (['ArrowLeft','ArrowRight','a','d','A','D'].indexOf(e.key) !== -1){\n        keys[e.key] = true;\n        e.preventDefault();\n      }\n    });\n    window.addEventListener('keyup', function(e){ keys[e.key] = false; });\n    setInterval(function(){\n      if (!running || !receiver) return;\n      var step = 9;\n      if (keys['ArrowLeft'] || keys['a'] || keys['A']) receiver.targetX -= step;\n      if (keys['ArrowRight'] || keys['d'] || keys['D']) receiver.targetX += step;\n      receiver.targetX = Math.max(0, Math.min(W, receiver.targetX));\n    }, 16);\n\n    // ---------- فتح/قفل المودال ----------\n    openBtn.addEventListener('click', openModal);\n    closeBtn.addEventListener('click', closeModal);\n    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });\n    startBtn.addEventListener('click', startGame);\n    retryBtn.addEventListener('click', startGame);\n    window.addEventListener('resize', function(){ if (overlay.classList.contains('open')) resizeCanvas(); });\n\n    // زرار \"دخول المشرفين\": بيبلّغ صفحة الطالب (اللي محتويانا) عشان تفتح فورم المشرفين\n    var staffBtn = document.getElementById('staffLoginBtn');\n    if (staffBtn) staffBtn.addEventListener('click', function(){\n      try { parent.postMessage({ atlasya: 'maintenance', action: 'supervisor-login' }, '*'); } catch (e) {}\n    });\n  })();\n\u003c/script>\n\u003c/body>\n\u003c/html>\n";
        window._maintenanceOn = false;
        let _maintFrame = null;
        let _maintPrevOverflow = '';
        let _maintForcedAuthBox = false;

        // فورم المشرفين ظاهر؟ (الاستثناء الوحيد اللي بيخلّي المشرف يعدّي من صفحة الصيانة)
        function isSupervisorFormVisible() {
            const form = document.getElementById('adminLoginForm');
            const box  = document.getElementById('authBox');
            return !!form && !form.classList.contains('hidden') && !!box && getComputedStyle(box).display !== 'none';
        }
        function showMaintenanceOverlay() {
            const f = document.createElement('iframe');
            f.id = 'maintenanceFrame';
            f.title = 'المنصة متوقفة مؤقتًا';
            f.setAttribute('sandbox', 'allow-scripts');
            f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:#0b1d26;';
            f.srcdoc = MAINTENANCE_PAGE_HTML;
            document.body.appendChild(f);
            _maintPrevOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            _maintFrame = f;
        }
        function hideMaintenanceOverlay() {
            if (_maintFrame) { _maintFrame.remove(); _maintFrame = null; }
            document.documentElement.style.overflow = _maintPrevOverflow;
        }
        // ─── الإيميل التجريبي: الحساب ده بس بيعدّي من صفحة الصيانة ويشوف التعديلات ───
        window._platformTestEmail = '';
        window._currentAuthEmail = window._currentAuthEmail || '';
        function isTesterSession() {
            const t = String(window._platformTestEmail || '').trim().toLowerCase();
            const e = String(window._currentAuthEmail || '').trim().toLowerCase();
            return !!t && !!e && t === e;
        }
        // الرابط ?tester=1 بيسمح بظهور شاشة تسجيل الدخول وقت الإيقاف عشان المختبر يقدر يسجّل بإيميله
        function isTesterLoginMode() {
            if (!/[?&]tester=1(&|$)/.test(location.search)) return false;
            const box = document.getElementById('authBox');
            return !!box && getComputedStyle(box).display !== 'none';
        }
        function updateTesterBadge() {
            let b = document.getElementById('testerBadge');
            const show = window._maintenanceOn === true && isTesterSession();
            if (show && !b) {
                b = document.createElement('div');
                b.id = 'testerBadge';
                b.style.cssText = 'position:fixed;bottom:14px;left:14px;z-index:2147482000;background:#e8a33d;color:#0b1d26;font:700 12px Tajawal,sans-serif;padding:7px 12px;border-radius:20px;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;';
                b.textContent = '🧪 وضع التجربة — المنصة متوقفة عن الطلاب';
                document.body.appendChild(b);
            } else if (!show && b) { b.remove(); }
        }
        function refreshMaintenanceOverlay() {
            const shouldShow = window._maintenanceOn === true
                && !isSupervisorFormVisible()
                && !isTesterSession()
                && !isTesterLoginMode();
            if (shouldShow && !_maintFrame) showMaintenanceOverlay();
            else if (!shouldShow && _maintFrame) hideMaintenanceOverlay();
            updateTesterBadge();
        }
        window.refreshMaintenanceOverlay = refreshMaintenanceOverlay;
        function applyPlatformStatus(data) {
            const wasOn = window._maintenanceOn === true;
            window._maintenanceOn = !!(data && data.maintenance === true);
            window._platformTestEmail = (data && data.testEmail) ? String(data.testEmail).trim().toLowerCase() : '';
            if (wasOn && !window._maintenanceOn) restoreAuthBoxAfterMaintenance();
            refreshMaintenanceOverlay();
        }
        window.applyPlatformStatus = applyPlatformStatus;

        // زرار "دخول المشرفين" جوه صفحة الصيانة → نفتح فورم المشرفين (حتى لو فيه سيشن طالب شغالة)
        function openSupervisorFromMaintenance() {
            const box = document.getElementById('authBox');
            if (box && getComputedStyle(box).display === 'none') { box.style.display = 'flex'; _maintForcedAuthBox = true; }
            showSupervisorLogin();
        }
        // لما المنصة ترجع وكنا فاتحين شاشة الدخول بالغصب لطالب مسجّل دخوله، نرجّع الوضع زي ما كان
        function restoreAuthBoxAfterMaintenance() {
            if (!_maintForcedAuthBox) return;
            _maintForcedAuthBox = false;
            const box = document.getElementById('authBox');
            if (box) box.style.display = 'none';
            showLogin();
        }
        window.addEventListener('message', function (e) {
            if (!_maintFrame || e.source !== _maintFrame.contentWindow) return;
            const d = e.data;
            if (d && d.atlasya === 'maintenance' && d.action === 'supervisor-login') openSupervisorFromMaintenance();
        });
        // أي تغيير في ظهور فورم المشرفين / شاشة الدخول يعيد حساب ظهور صفحة الصيانة تلقائيًا
        (function () {
            if (!window.MutationObserver) return;
            const mo = new MutationObserver(refreshMaintenanceOverlay);
            const form = document.getElementById('adminLoginForm');
            const box  = document.getElementById('authBox');
            if (form) mo.observe(form, { attributes: true, attributeFilter: ['class'] });
            if (box)  mo.observe(box,  { attributes: true, attributeFilter: ['style', 'class'] });
        })();

        function toggleEye(inputId, btn) {
            const inp = document.getElementById(inputId);
            inp.type = inp.type === 'password' ? 'text' : 'password';
            btn.querySelector('i').className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
        }


        /* ─── EMAIL VERIFICATION ─── */
        function showEmailVerifyScreen(email) {
            const isAR = true; // Auth flow is always Arabic
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('signUpForm').classList.add('hidden');
            document.getElementById('forgotForm').classList.add('hidden');
            document.getElementById('adminLoginForm').classList.add('hidden');
            document.getElementById('emailVerifyForm').classList.remove('hidden');

            const addrEl = document.getElementById('emailVerifyAddress');
            if (addrEl) addrEl.textContent = email || '';

            const titleEl = document.getElementById('emailVerifyTitle');
            if (titleEl) titleEl.textContent = 'تأكيد البريد الإلكتروني';
            const subEl = document.getElementById('emailVerifySubtitle');
            if (subEl) subEl.textContent = 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني.  تحقق من مجلد "الرسائل المزعجة / Spam"، وبعد ذلك اضغط على زر "لقد قمت بالتأكيد".';
            const openTxt = document.getElementById('openGmailBtnText');
            if (openTxt) openTxt.textContent = 'فتح Gmail';
            const checkTxt = document.getElementById('checkVerifiedBtnText');
            if (checkTxt) checkTxt.textContent = 'لقد قمت بالتأكيد';
            const notRecv = document.getElementById('emailNotReceivedTxt');
            if (notRecv) notRecv.textContent = 'لم يصلك البريد؟ تحقق من الرسائل المزعجة (Spam)';
            const resendLink = document.getElementById('resendEmailLink');
            if (resendLink) resendLink.textContent = 'إعادة الإرسال';
            const backTxt = document.getElementById('backToLoginFromVerifyTxt');
            if (backTxt) backTxt.textContent = 'العودة لتسجيل الدخول';
        }
        window.showEmailVerifyScreen = showEmailVerifyScreen;

        function openGmailInbox() {
            window.open('https://mail.google.com/', '_blank');
        }

        async function checkEmailVerified() {
            const isAR = true; // Auth flow is always Arabic
            const btn = document.getElementById('checkVerifiedBtn');
            if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
            try {
                const verified = await window._reloadUser();
                if (verified) {
                    showToast('✓ تم تأكيد البريد بنجاح!');
                    document.getElementById('emailVerifyForm').classList.add('hidden');
                    // onAuthStateChanged doesn't refire automatically here, so reload the page state manually
                    location.reload();
                } else {
                    showToast('لم يتم التأكيد بعد، تحقق من بريدك (وتحقق من مجلد الرسائل المزعجة Spam)', true);
                }
            } catch(e) {
                showToast(e.message, true);
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check" style="margin-left:8px;"></i><span id="checkVerifiedBtnText">لقد قمت بالتأكيد</span>'; }
            }
        }
        window.checkEmailVerified = checkEmailVerified;

        async function resendVerificationEmail() {
            const isAR = true; // Auth flow is always Arabic
            try {
                await window._sendVerificationEmail();
                showToast('✓ تم إعادة إرسال رابط التأكيد، تحقق من بريدك ومن مجلد الرسائل المزعجة (Spam)');
            } catch(e) {
                showToast(e.message, true);
            }
        }
        window.resendVerificationEmail = resendVerificationEmail;

        async function cancelEmailVerify() {
            document.getElementById('emailVerifyForm').classList.add('hidden');
            try { await window._signOutAuth(); } catch(e) {}
            showLogin();
        }
        window.cancelEmailVerify = cancelEmailVerify;

        // Add shake keyframes
        const _shakeStyle = document.createElement('style');
        _shakeStyle.textContent = '@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }';
        document.head.appendChild(_shakeStyle);

        async function doLogin() {
            const email = document.getElementById('loginEmail').value.trim();
            const pass  = document.getElementById('loginPassword').value;
            if (!email || !pass) { showToast('أدخل البريد وكلمة المرور', true); return; }
            const btn = document.getElementById('loginBtn');
            btn.innerHTML = '<div class="spinner"></div>';
            btn.disabled = true;
            try {
                const result = await window._doLogin(email, pass);
                if (result === 'redirecting-to-admin') return; // الصفحة بتتغيّر، مفيش داعي نكمل إعداد واجهة الطالب
                // Handle Remember Me
                const remember = document.getElementById('rememberMe')?.checked;
                if (remember) {
                    localStorage.setItem('rememberedEmail', email);
                    localStorage.setItem('rememberedPass', pass);
                } else {
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberedPass');
                }
                if (window._auth?.currentUser?.emailVerified === false) {
                    showToast('يجب تأكيد بريدك الإلكتروني أولاً', true);
                } else {
                    showToast('تم تسجيل الدخول');
                }
            } catch(e) {
                showToast(e.message.includes('user-not-found') || e.message.includes('invalid') ? 'بيانات غير صحيحة' : e.message, true);
            } finally {
                btn.innerHTML = `<span id="loginBtnText">تسجيل الدخول</span>`;
                btn.disabled = false;
            }
        }

        // Supervisor (admin) login from the student page: Firebase Auth email + password,
        // then admins/{uid} must exist. On success we hand off to admin.html (same session).
        async function doSupervisorLogin() {
            const email = document.getElementById('svLoginEmail').value.trim();
            const pass  = document.getElementById('svLoginPassword').value;
            if (!email || !pass) { showToast('أدخل اسم المستخدم وكلمة المرور', true); return; }
            const btn = document.getElementById('svLoginBtn');
            btn.innerHTML = '<div class="spinner"></div>';
            btn.disabled = true;
            let redirecting = false;
            try {
                const result = await window._supervisorSignIn(email, pass);
                if (result === 'redirecting-to-admin') {
                    redirecting = true;
                    showToast('تم التحقق ✓ جارٍ فتح لوحة الإدارة...');
                    return;
                }
                showToast('هذا الحساب غير مصرّح له بالدخول كمشرف', true);
            } catch (e) {
                const code = (e && e.code) || '';
                if (code === 'auth/too-many-requests') showToast('محاولات كثيرة — انتظر قليلًا ثم حاول مرة أخرى', true);
                else if (code === 'auth/network-request-failed') showToast('مشكلة في الاتصال بالإنترنت', true);
                else showToast('بيانات الدخول غير صحيحة', true);
            } finally {
                if (!redirecting) {
                    btn.innerHTML = '<span id="svLoginBtnText">دخول لوحة الإدارة</span>';
                    btn.disabled = false;
                }
            }
        }

        // Pressing Enter/Next/Go on the login fields (desktop keyboard Enter,
        // or mobile virtual keyboard's Next/Go/Done button) logs in automatically
        function initLoginKeyboardSubmit() {
            const emailEl = document.getElementById('loginEmail');
            const passEl  = document.getElementById('loginPassword');
            if (emailEl) {
                emailEl.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (passEl && !passEl.value) {
                            passEl.focus(); // move to password field if still empty
                        } else {
                            doLogin();
                        }
                    }
                });
            }
            if (passEl) {
                passEl.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doLogin();
                    }
                });
            }
        }

        // Auto-fill remembered credentials on page load
        function loadRememberedCredentials() {
            const email = localStorage.getItem('rememberedEmail');
            const pass  = localStorage.getItem('rememberedPass');
            if (email && pass) {
                const emailEl = document.getElementById('loginEmail');
                const passEl  = document.getElementById('loginPassword');
                const remEl   = document.getElementById('rememberMe');
                if (emailEl) emailEl.value = email;
                if (passEl)  passEl.value  = pass;
                if (remEl)   remEl.checked = true;
            }
        }

        async function doSignUp() {
            const fName     = document.getElementById('signUpFirstName').value.trim();
            const lName     = document.getElementById('signUpLastName').value.trim();
            const phone     = document.getElementById('signUpPhone').value.trim();
            const email     = document.getElementById('signUpEmail').value.trim();
            const pass      = document.getElementById('signUpPassword').value;
            const confirm   = document.getElementById('signUpConfirmPassword').value;
            const affiliate = document.getElementById('signUpAffiliate').value;
            const isAR = true; // Auth flow is always Arabic
            if (!fName||!lName||!phone||!email||!pass) { showToast('أكمل جميع الحقول', true); return; }
            // Gmail only validation
            if (!email.toLowerCase().endsWith('@gmail.com')) {
                showToast('❌ يجب أن يكون البريد الإلكتروني Gmail فقط (example@gmail.com)', true);
                const emailInput = document.getElementById('signUpEmail');
                if (emailInput) { emailInput.style.borderColor = '#e74c3c'; emailInput.focus(); setTimeout(() => emailInput.style.borderColor = '', 3000); }
                return;
            }
            if (pass !== confirm) { showToast('كلمتا المرور غير متطابقتين', true); return; }
            if (pass.length < 6) { showToast('كلمة المرور قصيرة جداً', true); return; }

            const btn = document.getElementById('signUpBtn');
            btn.innerHTML = '<div class="spinner"></div>';
            btn.disabled = true;
            try {
                let pendingReferral = '';
                try { pendingReferral = localStorage.getItem('pendingReferralUid') || ''; } catch(e) {}
                await window._doSignUp(fName, lName, phone, email, pass, affiliate, pendingReferral);
                try { localStorage.removeItem('pendingReferralUid'); } catch(e) {}
                showToast('✓ تم إنشاء الحساب! تم إرسال رابط تأكيد لبريدك');
                showEmailVerifyScreen(email);
            } catch(e) {
                let msg = e.message;
                if (e.code === 'auth/email-already-in-use') {
                    msg = 'هذا البريد الإلكتروني مسجل بالفعل من قبل. يمكنك تسجيل الدخول مباشرة أو استخدام بريد إلكتروني آخر.';
                    const emailInput = document.getElementById('signUpEmail');
                    if (emailInput) { emailInput.style.borderColor = '#e74c3c'; emailInput.focus(); setTimeout(() => emailInput.style.borderColor = '', 3000); }
                }
                showToast(msg, true);
            } finally {
                btn.innerHTML = `<span id="signUpBtnText">إنشاء الحساب</span>`;
                btn.disabled = false;
            }
        }

        async function doLogout() {
            if (window._isAdmin) {
                // Admin logout — not Firebase-based
                window._isAdmin = false;
                window._adminProfile = null;
                window._adminIsSuper = null;
                window._adminPermissions = null;
                window._base64Img = '';
                const editBtn = document.getElementById('adminEditBtn');
                if (editBtn) editBtn.style.display = 'none';

                // Restore hidden nav items
                const adminHideItems = ['menuPlay','menuLib','menuInsight','menuData','menuTool','menuCourse','menuConnect','menuCV','menuPortfolio','menuMentorship'];
                adminHideItems.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = '';
                });
                document.querySelectorAll('.nav-label').forEach(lbl => lbl.style.display = '');
                const menuExpertBtn2 = document.getElementById('menuExpert');
                if (menuExpertBtn2) menuExpertBtn2.style.display = 'none';
                // Hide admin-only sidebar items
                ['menuAdminMembers','menuAdminPro','menuAdminCV'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                });

                document.getElementById('mainApp').style.display = 'none';
                document.getElementById('authBox').style.display = 'flex';

                // Reset admin form
                document.getElementById('adminEmail').value = '';
                document.getElementById('adminPassword').value = '';
                switchAuthTab('student');
                showToast(lang==='AR'?'تم تسجيل الخروج':'Logged out successfully');
            } else {
                await window._doLogout();
            }
        }

        /* ─── NAVIGATION ─── */
        window._currentPage = 'dashboard';

        function toggleNavGroup(btn) {
            const sec = btn.closest('.nav-section');
            if (!sec) return;
            const isOpen = sec.classList.contains('open');
            document.querySelectorAll('.sidebar .nav-section.collapsible').forEach(s => s.classList.remove('open'));
            if (!isOpen) sec.classList.add('open');
        }

        function goSettings(tab) {
            window._accountTab = tab || 'hub';
            navigate('account', document.getElementById('menuAccount'));
        }

        /* Maps each page key to its sidebar nav-item id, used to highlight the
           correct menu entry when routing directly from a URL hash (deep link
           or browser back/forward), where no click event/element is available. */
        const PAGE_NAV_ID_MAP = {
            dashboard: 'menuDash', playlists: 'menuPlay', library: 'menuLib',
            insights: 'menuInsight', datasets: 'menuData', tools: 'menuTool',
            jobs: 'menuJob', courses: 'menuCourse', expert: 'menuExpert',
            community: 'menuCommunity', cvbuilder: 'menuCV', connect: 'menuConnect',
            account: 'menuAccount', portfolio: 'menuPortfolio', mentorship: 'menuMentorship',
            adminmembers: 'menuAdminMembers', adminpro: 'menuAdminPro',
            adminportfolio: 'menuAdminPortfolio', adminmentorship: 'menuAdminMentorship',
            dailychallenge: 'menuDailyChallenge', wheel: 'menuWheel'
        };

        /* Reflects the current page in the URL as #/page-name so every page has
           its own shareable, bookmarkable, browser-back-friendly link. */
        function updateUrlForPage(page) {
            try {
                const newHash = '#/' + page;
                if (location.hash !== newHash) history.pushState({ page }, '', newHash);
            } catch (e) { /* URL API not available — fail silently, app still works */ }
        }

        /* Reads the page name out of the current URL hash (#/page-name), if any. */
        function getPageFromUrl() {
            const raw = (location.hash || '').replace(/^#\/?/, '').trim();
            return raw || null;
        }

        function navigate(page, el, silent, noHistory) {
            if (window._isAdmin && Array.isArray(window._adminPermissions)) {
                const neededKey = ADMIN_PAGE_PERMISSION_MAP[page];
                if (neededKey && !window._adminPermissions.includes(neededKey)) {
                    showToast(lang==='AR' ? 'ليس لديك صلاحية للوصول لهذا القسم' : "You don't have permission to access this section", true);
                    return;
                }
            }
            window._currentPage = page;
            // Close mobile sidebar on navigation
            closeSidebar();
            if (!silent) {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                if (el) el.classList.add('active');
                // Auto-expand the collapsible group containing the active item
                const parentGroup = el ? el.closest('.nav-section.collapsible') : null;
                if (parentGroup) {
                    document.querySelectorAll('.sidebar .nav-section.collapsible').forEach(s => s.classList.remove('open'));
                    parentGroup.classList.add('open');
                }
            }
            if (!noHistory) updateUrlForPage(page);
            const titles = {
                dashboard: lang==='AR'?'لوحة التحكم':'Dashboard',
                playlists: lang==='AR'?'قوائم التشغيل':'Playlists',
                library:   lang==='AR'?'المكتبة الرقمية':'Digital Library',
                insights:  lang==='AR'?'رؤى GIS':'GIS Insights',
                datasets:  lang==='AR'?'البيانات المكانية':'Spatial Datasets',
                tools:     lang==='AR'?'أدوات البرامج':'GIS Software Tools',
                jobs:      lang==='AR'?'لوحة الوظائف':'Job Board',
                courses:   lang==='AR'?'الكورسات':'Courses',
                expert:    lang==='AR'?'الدعم الفني':'Technical Support',
                community: lang==='AR'?'مجتمع الطلاب':'Student Community',
                cvbuilder: lang==='AR'?'عمل CV':'Build CV',
                connect:   lang==='AR'?'سوشيال ميديا':'Social Media',
                account:   lang==='AR'?'الإعدادات':'Settings',
                adminmembers:  lang==='AR'?'قائمة الأعضاء':'Members List',
                adminpro:      lang==='AR'?'طلبات Pro':'Pro Requests',
                adminportfolio: lang==='AR'?'خرائط الطلبة':'Student Maps',
                adminmentorship: lang==='AR'?'حجوزات الاستشارات':'Consultation Bookings',
                portfolio:     lang==='AR'?'خرائط الطلبة':'Student Maps',
                monthlyreport: lang==='AR'?'تقريري الشهري':'My Monthly Report',
                mentorship:    lang==='AR'?'اسأل خبير GIS':'Ask a GIS Expert',
                dailychallenge: lang==='AR'?'التحديات':'Challenges',
                wheel: lang==='AR'?'عجلة الحظ':'Fortune Wheel',
            };
            document.getElementById('breadcrumbTitle').textContent = titles[page] || page;
            const area = document.getElementById('contentArea');
            area.innerHTML = '';

            // cleanup jobs realtime listener when leaving jobs page
            if (page !== 'jobs' && typeof _jobsUnsubscribe === 'function') {
                _jobsUnsubscribe();
                _jobsUnsubscribe = null;
            }

            // cleanup community chat realtime listener when leaving community page
            if (page !== 'community' && typeof _communityUnsubscribe === 'function') {
                _communityUnsubscribe();
                _communityUnsubscribe = null;
            }

            // cleanup courses realtime listener when leaving courses page
            if (page !== 'courses' && typeof _coursesUnsubscribe === 'function') {
                _coursesUnsubscribe();
                _coursesUnsubscribe = null;
            }

            if (page === 'dashboard') renderDashboard(area);
            else if (page === 'playlists') renderPlaylists(area);
            else if (page === 'connect') renderConnect(area);
            else if (page === 'account') renderAccount(area);
            else if (page === 'expert') renderExpert(area);
            else if (page === 'datasets') renderDatasets(area);
            else if (page === 'insights') renderInsights(area);
            else if (page === 'tools') renderTools(area);
            else if (page === 'community') renderCommunity(area);
            else if (page === 'jobs') renderJobs(area);
            else if (page === 'cvbuilder') renderCVBuilder(area);
            else if (page === 'adminmembers') renderAdminMembers(area);
            else if (page === 'adminpro') renderAdminProRequests(area);
            else if (page === 'adminportfolio') renderAdminPortfolio(area);
            else if (page === 'adminmentorship') renderAdminMentorship(area);
            else if (page === 'portfolio') renderPortfolio(area);
            else if (page === 'monthlyreport') renderMonthlyReport(area);
            else if (page === 'mentorship') renderMentorship(area);
            else if (page === 'courses') renderCourses(area);
            else if (page === 'library') renderLibrary(area);
            else if (page === 'dailychallenge') renderDailyChallenge(area);
            else if (page === 'wheel') renderWheel(area);
            else renderSoon(area, page, titles[page]);


            // Apply admin-saved content from Firebase after every render
            if (window._applyContent) window._applyContent();
        }

        /* Handles the browser Back/Forward buttons: re-renders the page encoded
           in the URL without pushing a new (duplicate) history entry. */
        window.addEventListener('popstate', () => {
            const page = getPageFromUrl() || 'dashboard';
            const navEl = PAGE_NAV_ID_MAP[page] ? document.getElementById(PAGE_NAV_ID_MAP[page]) : null;
            navigate(page, navEl, false, true);
        });

        /* ─── DASHBOARD INSTALL BANNER ─── */
        function buildDashInstallBanner(isAR) {
            // Don't show if already installed (standalone mode)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                            || window.navigator.standalone === true;
            // Don't show if user dismissed it this session
            let dismissed = false;
            try { dismissed = !!sessionStorage.getItem('dashInstallDismissed'); } catch(e) {}
            if (isStandalone || dismissed) return '';

            return `
            <div class="dash-install-banner" id="dashInstallBanner">
                <div class="dash-install-icon">🧭</div>
                <div class="dash-install-text">
                    <strong>${isAR ? 'ثبّت ATLASYA على جهازك' : 'Install ATLASYA on your device'}</strong>
                    <span>${isAR ? 'استخدمه كتطبيق مستقل على موبايلك أو كمبيوترك بدون متصفح' : 'Use it as a standalone app on your phone or desktop, no browser needed'}</span>
                </div>
                <button class="dash-install-btn" onclick="dashInstallApp()">
                    <i class="fa-solid fa-download"></i>
                    ${isAR ? 'تثبيت' : 'Install'}
                </button>
                <button class="dash-install-dismiss" onclick="dashDismissInstall()" title="${isAR?'إغلاق':'Dismiss'}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`;
        }

        window.dashInstallApp = function() {
            // Use existing PWA install logic
            if (typeof window.triggerPWAInstall === 'function') {
                window.triggerPWAInstall();
            }
        };

        window.dashDismissInstall = function() {
            try { sessionStorage.setItem('dashInstallDismissed', '1'); } catch(e) {}
            const banner = document.getElementById('dashInstallBanner');
            if (banner) {
                banner.style.transition = 'opacity 0.3s, transform 0.3s';
                banner.style.opacity = '0';
                banner.style.transform = 'translateY(-8px)';
                setTimeout(() => banner.remove(), 320);
            }
        };

        /* ─── DASHBOARD ─── */
        async function renderDashboard(area) {
            const isAR = lang === 'AR';

            /* ── Time-based greeting ── */
            const hour = new Date().getHours();
            let greetAR, greetEN, greetIcon;
            if (hour >= 5 && hour < 12) {
                greetAR = 'صباح الخير'; greetEN = 'Good Morning'; greetIcon = '🌤️';
            } else if (hour >= 12 && hour < 17) {
                greetAR = 'مساء النور'; greetEN = 'Good Afternoon'; greetIcon = '☀️';
            } else {
                greetAR = 'مساء الخير'; greetEN = 'Good Evening'; greetIcon = '🌙';
            }
            const _d = window._userData || {};
            const _adminProfile = window._adminProfile || {};
            const _firstName = window._isAdmin
                ? (_adminProfile.displayName || '').split(' ')[0]
                : (_d.firstName || '');
            const _nameStr = _firstName ? `, <span style="color:var(--green4);">${escapeHtml(_firstName)}</span>` : '';

            area.innerHTML = `
            <div class="welcome-banner">
                <i class="fa-solid fa-earth-africa globe-bg"></i>
                <h1>${isAR
                    ? `${greetAR}${_nameStr} <span style="font-size:0.75em;">${greetIcon}</span>`
                    : `${greetEN}${_nameStr} <span style="font-size:0.75em;">${greetIcon}</span>`}
                </h1>
                <p>${isAR
                    ? 'منصتك الشاملة لتعلّم نظم المعلومات الجغرافية والجغرافيا<br>اختر ما تريد استكشافه وابدأ رحلتك 🚀'
                    : 'Your comprehensive hub for learning GIS and Geography<br>Pick what you want to explore and start your journey 🚀'}</p>
                ${window._isAdmin ? '' : `
                <div onclick="goSettings('wallet')" style="position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:7px 14px;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.3);border-radius:99px;cursor:pointer;">
                    <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:11px;color:#0a0a0e;flex-shrink:0;"><i class="fa-solid fa-coins"></i></div>
                    <span style="font-size:13px;font-weight:800;color:var(--gold3);">${_d.coins||0}</span>
                    <span style="font-size:12px;color:var(--muted);">${isAR?'عملة':'coins'}</span>
                </div>`}
            </div>

            ${''/* dashboard install box removed per request */}

            <div class="stats-row">
                ${statNavCard('playlists', 'g', 'fa-clapperboard', 'stat_videos', 0,
                    isAR?'فيديو':'Videos', isAR?'استكشف قوائم التشغيل':'Explore Playlists', 'menuPlay')}
                ${statNavCard('library', 'b', 'fa-book-bookmark', 'stat_library', 0,
                    isAR?'مرجعًا':'References', isAR?'استكشف المكتبة':'Explore Library', 'menuLib')}
                ${statNavCard('jobs', 'y', 'fa-briefcase', 'stat_jobs', 0,
                    isAR?'وظيفة متاحة':'Open Positions', isAR?'تصفح الوظائف':'Browse Jobs', 'menuJob')}
                ${statNavCard('datasets', 'p', 'fa-database', 'stat_datasets', 0,
                    isAR?'مجموعة بيانات':'Datasets', isAR?'استكشف البيانات':'Explore Datasets', 'menuData')}
            </div>

            ${window._isAdmin ? '' : `
            <div style="display:flex;align-items:center;gap:10px;margin:6px 0 16px;">
                <div style="font-size:16px;font-weight:800;">${isAR?'🚀 استكشف ATLASYA':'🚀 Explore ATLASYA'}</div>
            </div>
            <div class="sections-grid">
                ${sectionCard('library','fa-book-bookmark',isAR?'المكتبة الرقمية':'Digital Library',isAR?'كتب ومراجع تقنية في علوم GIS':'Technical books and GIS references', true)}
                ${sectionCard('datasets','fa-database',isAR?'البيانات المكانية':'Spatial Datasets',isAR?'تحميل مجموعات البيانات المكانية':'Download spatial data collections', true)}
                ${sectionCard('courses','fa-building-shield',isAR?'الكورسات والشركات':'Courses & Companies',isAR?'دورات تدريبية وشركات GIS الرائدة':'Training courses and leading GIS firms', true)}
                ${sectionCard('playlists','fa-clapperboard',isAR?'قوائم التشغيل':'Playlists',isAR?'قوائم فيديوهات تعليمية في نظم المعلومات الجغرافية':'Educational video playlists in GIS', true)}
                ${sectionCard('tools','fa-laptop-code',isAR?'أدوات البرامج':'GIS Software Tools',isAR?'أفضل برامج وأدوات GIS للمبتدئين والمحترفين':'Top GIS tools for all levels', true)}
                ${sectionCard('portfolio','fa-map-location-dot',isAR?'خرائط الطلبة':'Student Maps',isAR?'شارك مشاريعك وخرائطك مع باقي الطلاب':'Share your maps and projects with other students', true)}
                ${sectionCard('insights','fa-lightbulb',isAR?'نصائح GIS':'GIS Insights',isAR?'نصيحة يومية جديدة في نظم المعلومات الجغرافية':'A new GIS tip every day', true)}
                ${sectionCard('dailychallenge','fa-calendar-check',isAR?'التحديات':'Challenges',isAR?'جاوب على سؤال اليوم وتحدي الأسبوع واكسب عملات ومكافأة إكمال':"Answer today's question and the weekly challenge to earn coins and a completion bonus", true)}
                ${sectionCard('wheel','fa-dharmachakra',isAR?'عجلة الحظ':'Fortune Wheel',isAR?'محاولة مجانية كل 24 ساعة — اكسب عملات، لفات إضافية، أو هدايا مفاجئة':'One free spin every 24 hours — win coins, extra spins, or surprise gifts', true)}
                ${sectionCard('jobs','fa-briefcase',isAR?'لوحة الوظائف':'Job Board',isAR?'فرص وظيفية في مجال الخرائط وتحليل البيانات':'GIS & mapping job opportunities', true)}
            </div>`}`;

            // Load live counts from Firestore for the clickable stat cards
            (async () => {
                try {
                    if (window._loadPlaylists) {
                        const playlists = await window._loadPlaylists();
                        // Each playlist doc keeps its own videoCount field in sync
                        // (see _addPlaylistVideo/_deletePlaylistVideo) — summing that
                        // is far cheaper and more reliable than querying every
                        // playlist's videos subcollection individually.
                        const totalVideos = playlists.reduce((s, p) => s + (p.videoCount || 0), 0);
                        const el = document.getElementById('stat_videos');
                        if (el) el.textContent = totalVideos;
                    }
                } catch(e) { /* silent fail — keep default 0 */ }
                try {
                    if (window._loadLibraryBooks) {
                        const books = await window._loadLibraryBooks();
                        const el = document.getElementById('stat_library');
                        if (el) el.textContent = books.length;
                    }
                } catch(e) { /* silent fail — keep default 0 */ }
                try {
                    if (window._loadJobs) {
                        const jobs = await window._loadJobs();
                        const approvedJobs = jobs.filter(j => (j.status || 'approved') === 'approved');
                        const el = document.getElementById('stat_jobs');
                        if (el) el.textContent = approvedJobs.length;
                    }
                } catch(e) { /* silent fail — keep default 0 */ }
                try {
                    if (window._loadSpatialDatasets) {
                        const datasets = await window._loadSpatialDatasets();
                        const el = document.getElementById('stat_datasets');
                        if (el) el.textContent = datasets.length;
                    }
                } catch(e) { /* silent fail — keep default 0 */ }
            })();
        }

        /* A dashboard stat card that's also a nav shortcut: clicking anywhere on
           it (not just the "explore" line) jumps straight to that section. */
        function statNavCard(page, colorClass, icon, numId, numDefault, label, exploreText, navElId) {
            const arrowIcon = document.getElementById('pageBody')?.classList.contains('rtl') ? 'fa-arrow-left' : 'fa-arrow-right';
            return `
            <div class="stat-card stat-nav-card" onclick="navigate('${page}', document.getElementById('${navElId}'))" role="button" tabindex="0" onkeydown="if(event.key==='Enter')this.click()">
                <div class="stat-icon ${colorClass}"><i class="fa-solid ${icon}"></i></div>
                <div class="stat-num" id="${numId}">${numDefault}</div>
                <div class="stat-label">${label}</div>
                <div class="stat-nav-explore"><span>${exploreText}</span> <i class="fa-solid ${arrowIcon}"></i></div>
            </div>`;
        }

        function sectionCard(page, icon, title, desc, hideMobile=false) {
            return `
            <div class="section-card${hideMobile?' mob-hidden-card':''}" onclick="navigate('${page}', document.getElementById('menu${page.charAt(0).toUpperCase()+page.slice(1)}'))">
                <div class="section-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="section-info">
                    <h4>${title}</h4>
                    <p>${desc}</p>
                </div>
                <i class="fa-solid fa-chevron-right section-arrow"></i>
            </div>`;
        }