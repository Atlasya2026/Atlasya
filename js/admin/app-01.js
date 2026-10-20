    /* ─── LANGUAGE ─── */
    let lang = 'AR';
    const T = {
        AR: {
            navLbl1: 'الرئيسية', navLbl2: 'المحتوى',
            navLbl3: 'الأدوات', navLbl4: 'التعلم', navLbl5: 'أخرى',
            navLblSettings: 'الإعدادات',
            navLblLearning: 'التعلم',
            menuDashTxt: 'لوحة التحكم',
            menuPlayTxt: 'قوائم التشغيل',
            menuLibTxt: 'المكتبة الرقمية',
            menuInsightTxt: 'رؤى GIS',
            menuDataTxt: 'البيانات المكانية',
            menuToolTxt: 'أدوات البرامج',
            menuJobTxt: 'الوظائف',
            menuCourseTxt: 'الكورسات',
            menuConnectTxt: 'تواصل معنا',
            menuCommunityTxt: 'مجتمع الطلاب',
            menuExpertTxt: 'الدعم الفني',
            menuCVTxt: 'عمل CV',
            menuPortfolioTxt: 'خرائط الطلبة',
            menuMentorshipTxt: 'اسأل خبير GIS',
            menuAccountTxt: 'حسابي',
            menuAdminMembersTxt: 'قائمة الأعضاء',
            menuAdminReferralsTxt: 'دعوة الأصدقاء',
            menuAdminCVTxt: 'طلبات عمل CV',
            menuAdminPortfolioTxt: 'خرائط الطلبة',
            menuAdminCoursesTxt: 'إدارة الكورسات',
            menuAdminLibraryTxt: 'المكتبة الرقمية',
            menuAdminPlaylistsTxt: 'قوائم التشغيل',
            menuAdminDatasetsTxt: 'مكتبة البيانات المكانية',
            menuAdminToolsTxt: 'أدوات البرامج',
            menuAdminTipsTxt: 'نصيحة اليوم',
            menuAdminMentorshipTxt: 'حجوزات الاستشارات',
            menuAdminDailyChallengesTxt: 'التحديات',
            menuAdminProTxt: 'طلبات البرو',
            menuAdminCoinsTxt: 'إعدادات نظام العملات',
            menuAdminWheelTxt: 'عجلة الحظ والهدايا',
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
            navLblSettings: 'Settings',
            navLblLearning: 'Learning',
            menuDashTxt: 'Dashboard',
            menuPlayTxt: 'Playlists',
            menuLibTxt: 'Digital Library',
            menuInsightTxt: 'GIS Insights',
            menuDataTxt: 'Spatial Datasets',
            menuToolTxt: 'GIS Software',
            menuJobTxt: 'Jobs',
            menuCourseTxt: 'Courses',
            menuConnectTxt: 'Connect',
            menuCommunityTxt: 'Community',
            menuExpertTxt: 'Technical Support',
            menuCVTxt: 'Build CV',
            menuPortfolioTxt: 'Student Maps',
            menuMentorshipTxt: 'Ask a GIS Expert',
            menuAccountTxt: 'My Account',
            menuAdminMembersTxt: 'Members List',
            menuAdminReferralsTxt: 'Invite Friends',
            menuAdminCVTxt: 'CV Requests',
            menuAdminPortfolioTxt: 'Student Maps',
            menuAdminCoursesTxt: 'Manage Courses',
            menuAdminLibraryTxt: 'Digital Library',
            menuAdminPlaylistsTxt: 'Playlists',
            menuAdminDatasetsTxt: 'Spatial Data Library',
            menuAdminToolsTxt: 'Software Tools',
            menuAdminTipsTxt: 'Daily Tip',
            menuAdminMentorshipTxt: 'Consultation Bookings',
            menuAdminDailyChallengesTxt: 'Challenges',
            menuAdminProTxt: 'Pro Requests',
            menuAdminCoinsTxt: 'Coin System Settings',
            menuAdminWheelTxt: 'Fortune Wheel & Gifts',
            txtLogout: 'Log Out',
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
    }
    function showSignup() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signUpForm').classList.remove('hidden');
        document.getElementById('forgotForm').classList.add('hidden');
        document.getElementById('emailVerifyForm').classList.add('hidden');
    }

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
            await window._doLogin(email, pass);
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
            await window._doSignUp(fName, lName, phone, email, pass, affiliate);
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
            // خروج المشرف: بنقفل جلسة Firebase كمان ونرجع لصفحة الدخول الموحّدة (student.html)
            try { sessionStorage.removeItem('atlasya_admin_handoff'); } catch (e) {}
            if (window._showAdminBootSplash) window._showAdminBootSplash('جارٍ تسجيل الخروج...');
            try { await window._signOutAuth(); } catch (e) { console.error('admin signOut failed:', e); }
            window.location.replace(window._atlasyaStudentPage(false));
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

    /* Maps each page key to its sidebar nav-item id, used to highlight the
       correct menu entry when routing directly from a URL hash (deep link
       or browser back/forward), where no click event/element is available. */
    const PAGE_NAV_ID_MAP = {
        dashboard: 'menuDash', playlists: 'menuPlay', library: 'menuLib',
        insights: 'menuInsight', datasets: 'menuData', tools: 'menuTool',
        jobs: 'menuJob', courses: 'menuCourse', expert: 'menuExpert',
        community: 'menuCommunity', cvbuilder: 'menuCV', connect: 'menuConnect',
        account: 'menuAccount', portfolio: 'menuPortfolio', mentorship: 'menuMentorship',
        adminmembers: 'menuAdminMembers', adminpro: 'menuAdminPro', admincoins: 'menuAdminCoins', adminwheel: 'menuAdminWheel',
        adminreferrals: 'menuAdminReferrals',
        adminportfolio: 'menuAdminPortfolio', adminmentorship: 'menuAdminMentorship',
        admincourses: 'menuAdminCourses', adminlibrary: 'menuAdminLibrary',
        adminplaylists: 'menuAdminPlaylists', admindatasets: 'menuAdminDatasets',
        admintools: 'menuAdminTools', admintips: 'menuAdminTips',
        admindailychallenges: 'menuAdminDailyChallenges'
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
            // Auto-expand the collapsible group containing the active item (and close the others)
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
            connect:   lang==='AR'?'تواصل معنا':'Connect With Us',
            account:   lang==='AR'?'حسابي':'My Account',
            adminmembers:  lang==='AR'?'قائمة الأعضاء':'Members List',
            adminreferrals: lang==='AR'?'دعوة الأصدقاء':'Invite Friends',
            adminpro:      lang==='AR'?'طلبات Pro':'Pro Requests',
            admincoins:    lang==='AR'?'إعدادات نظام العملات':'Coin System Settings',
            adminwheel:    lang==='AR'?'عجلة الحظ والهدايا':'Fortune & Gift Wheel',
            adminportfolio: lang==='AR'?'خرائط الطلبة':'Student Maps',
            admincourses: lang==='AR'?'إدارة الكورسات':'Manage Courses',
            adminlibrary: lang==='AR'?'إدارة المكتبة الرقمية':'Manage Digital Library',
            adminplaylists: lang==='AR'?'إدارة قوائم التشغيل':'Manage Playlists',
            admindatasets: lang==='AR'?'إدارة مكتبة البيانات المكانية':'Manage Spatial Data Library',
            admintools: lang==='AR'?'إدارة أدوات البرامج':'Manage Software Tools',
            admintips: lang==='AR'?'إدارة نصيحة اليوم':'Manage Daily Tips',
            admindailychallenges: lang==='AR'?'إدارة التحدي اليومي والأسبوعي':'Manage Daily & Weekly Challenge',
            adminmentorship: lang==='AR'?'حجوزات الاستشارات':'Consultation Bookings',
            portfolio:     lang==='AR'?'خرائط الطلبة':'Student Maps',
            monthlyreport: lang==='AR'?'تقريري الشهري':'My Monthly Report',
            mentorship:    lang==='AR'?'اسأل خبير GIS':'Ask a GIS Expert',
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
        else if (page === 'adminreferrals') renderAdminReferrals(area);
        else if (page === 'adminpro') renderAdminProRequests(area);
        else if (page === 'admincoins') renderAdminCoinSettings(area);
        else if (page === 'adminwheel') renderAdminWheelSettings(area);
        else if (page === 'adminportfolio') renderAdminPortfolio(area);
        else if (page === 'admincourses') renderAdminCourses(area);
        else if (page === 'adminlibrary') renderAdminLibrary(area);
        else if (page === 'adminplaylists') renderAdminPlaylists(area);
        else if (page === 'admindatasets') renderAdminDatasets(area);
        else if (page === 'admintools') renderAdminTools(area);
        else if (page === 'admintips') renderAdminTips(area);
        else if (page === 'admindailychallenges') renderAdminDailyChallenges(area);
        else if (page === 'adminmentorship') renderAdminMentorship(area);
        else if (page === 'portfolio') renderPortfolio(area);
        else if (page === 'monthlyreport') renderMonthlyReport(area);
        else if (page === 'mentorship') renderMentorship(area);
        else renderSoon(area, page, titles[page]);


        // Apply admin-saved content from Firebase after every render
        if (window._applyContent) window._applyContent();
    }

    /* Handles the browser Back/Forward buttons: re-renders the page encoded
       in the URL without pushing a new (duplicate) history entry. */
    window.addEventListener('popstate', () => {
        const page = getPageFromUrl();
        if (!page) return;
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
                ? 'منصتك الشاملة لتعلم نظم المعلومات الجغرافية — اختر قسماً من القائمة للبدء.'
                : 'Your comprehensive GIS learning hub. Select a section from the sidebar to get started.'}</p>
        </div>

        ${''/* dashboard install box removed per request */}

        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon g"><i class="fa-solid fa-clapperboard"></i></div>
                <div class="stat-num" id="stat_videos">0</div>
                <div class="stat-label">${isAR?'قائمة تشغيل':'Playlists'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon b"><i class="fa-solid fa-book-bookmark"></i></div>
                <div class="stat-num" id="stat_library">0</div>
                <div class="stat-label">${isAR?'مراجع علمية':'Library Resources'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon y"><i class="fa-solid fa-briefcase"></i></div>
                <div class="stat-num" id="stat_jobs">0</div>
                <div class="stat-label">${isAR?'وظيفة متاحة':'Open Positions'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon p"><i class="fa-solid fa-database"></i></div>
                <div class="stat-num" id="stat_datasets">34</div>
                <div class="stat-label">${isAR?'مجموعة بيانات':'Datasets'}</div>
            </div>
        </div>

        ${window._isAdmin ? '' : `<div class="sections-grid">
            ${sectionCard('playlists','fa-clapperboard',isAR?'قوائم التشغيل':'Playlists',isAR?'قوائم فيديوهات تعليمية في نظم المعلومات الجغرافية':'Educational video playlists in GIS', true)}
            ${sectionCard('library','fa-book-bookmark',isAR?'المكتبة الرقمية':'Digital Library',isAR?'كتب ومراجع تقنية في علوم GIS':'Technical books and GIS references', true)}
            ${sectionCard('datasets','fa-database',isAR?'البيانات المكانية':'Spatial Datasets',isAR?'تحميل مجموعات البيانات المكانية':'Download spatial data collections', true)}
            ${sectionCard('tools','fa-laptop-code',isAR?'أدوات البرامج':'GIS Software Tools',isAR?'أفضل برامج وأدوات GIS للمبتدئين والمحترفين':'Top GIS tools for all levels', true)}
            ${sectionCard('jobs','fa-briefcase',isAR?'لوحة الوظائف':'Job Board',isAR?'فرص وظيفية في مجال الخرائط وتحليل البيانات':'GIS & mapping job opportunities', true)}
            ${sectionCard('courses','fa-building-shield',isAR?'الكورسات والشركات':'Courses & Companies',isAR?'دورات تدريبية وشركات GIS الرائدة':'Training courses and leading GIS firms', true)}
        </div>`}`;

        // Load live counts from Firestore for all 4 dashboard stat cards
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
                if (window._loadLibraryBooksAdmin) {
                    const books = await window._loadLibraryBooksAdmin();
                    const visibleBooks = books.filter(b => !b.hidden);
                    const el = document.getElementById('stat_library');
                    if (el) el.textContent = visibleBooks.length;
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

    /* ─── GIS INSIGHTS ─── */
    function renderInsights(area) {
        const isAR = lang === 'AR';
        const tips = [
            { icon:'fa-graduation-cap', color:'#1e7a34', titleAR:'ابدأ بالأساسيات قبل البرامج', titleEN:'Master the Basics Before Software', bodyAR:'قبل ما تفتح أي برنامج GIS، ركّز على المفاهيم الأساسية: الفرق بين <strong>Raster</strong> و<strong>Vector</strong>، نظم الإحداثيات <strong>Projection & Coordinate Systems</strong>، وقواعد البيانات المكانية <strong>Spatial Databases</strong>.<br><br>🎯 الفهم ده هيسهّل عليك التعامل مع أي برنامج بعدين.', bodyEN:'Before opening any GIS software, focus on core concepts: the difference between <strong>Raster</strong> and <strong>Vector</strong>, <strong>Projection & Coordinate Systems</strong>, and <strong>Spatial Databases</strong>.<br><br>🎯 This understanding makes any software much easier to learn.' },
            { icon:'fa-briefcase', color:'#d4a017', titleAR:'التطبيق العملي أهم من الشهادات', titleEN:'Practical Experience Over Certificates', bodyAR:'الشهادات مهمة، بس الخبرة العملية هي اللي بتفرق:<ul><li>اعمل مشاريع حقيقية حتى لو صغيرة</li><li>استخدم بيانات مفتوحة <strong>Open Data</strong> لتطبيق الدروس</li><li>ابنِ <strong>Portfolio</strong> قوي بخرائطك ومشاريعك الخاصة</li></ul>', bodyEN:'Certificates matter, but practical experience makes the real difference:<ul><li>Work on real projects, even small ones</li><li>Use <strong>Open Data</strong> to apply lessons</li><li>Build a strong <strong>Portfolio</strong> with your own maps and analyses</li></ul>' },
            { icon:'fa-folder-open', color:'#1e7a34', titleAR:'اشتغل على Projects حقيقية', titleEN:'Work on Real-World Projects', bodyAR:'المشاريع الواقعية بتخليك تتعلم:<ol><li>تحليل البيانات البيئية <strong>Environmental Analysis</strong></li><li>رسم خرائط الشبكات <strong>Network Analysis</strong></li><li>دراسات الأراضي <strong>Land Use & Land Cover</strong></li></ol>🎯 كل مشروع هيديك فكرة عن سوق الشغل وطلبات الشركات.', bodyEN:'Real-world projects help you learn:<ol><li><strong>Environmental Analysis</strong></li><li><strong>Network Analysis</strong></li><li><strong>Land Use & Land Cover</strong> studies</li></ol>🎯 Each project gives you insight into what employers actually need.' },
            { icon:'fa-laptop-code', color:'#d4a017', titleAR:'اتعلم QGIS مع ArcGIS', titleEN:'Learn QGIS Alongside ArcGIS', bodyAR:'حتى لو هتستخدم ArcGIS Pro، لازم تعرف QGIS:<ul><li>QGIS مجاني ومفتوح المصدر</li><li>فيه <strong>Plugins</strong> كتيرة تساعدك في Analysis وVisualization</li><li>الشركات الصغيرة والمشاريع الحرة <strong>Freelance</strong> غالبًا بتستخدم QGIS</li></ul>', bodyEN:'Even if you use ArcGIS Pro, you must know QGIS:<ul><li>QGIS is free and open-source</li><li>Rich <strong>Plugins</strong> ecosystem for Analysis & Visualization</li><li>Small companies and <strong>Freelance</strong> projects often prefer QGIS</li></ul>' },
            { icon:'fa-table', color:'#1e7a34', titleAR:'اعرف أساسيات Excel وSQL', titleEN:'Learn Excel & SQL Basics', bodyAR:'مهارات التحليل مهمّة لأي GIS Specialist:<ul><li><strong>Excel:</strong> sorting, filtering, pivot tables</li><li><strong>SQL:</strong> استعلامات على قواعد البيانات المكانية</li></ul>هيساعدك في التعامل مع أي Dataset كبير بسهولة.', bodyEN:'Analytical skills are essential for any GIS Specialist:<ul><li><strong>Excel:</strong> sorting, filtering, pivot tables</li><li><strong>SQL:</strong> queries on spatial databases</li></ul>This will help you handle any large dataset with ease.' },
            { icon:'fa-folder-tree', color:'#d4a017', titleAR:'نظّم ملفاتك GIS', titleEN:'Organize Your GIS Files', bodyAR:'لازم يكون عندك نظام واضح لتنظيم ملفاتك:<ul><li>اعمل فولدر لكل مشروع</li><li>قسّم البيانات حسب النوع <strong>Raster / Vector</strong></li><li>خلي الخرائط، التحليلات، والبيانات المصدرية في مكان منفصل</li></ul>🎯 ده هيوفر وقتك ويخليك تشتغل بكفاءة.', bodyEN:'You need a clear file organization system:<ul><li>Create a folder for each project</li><li>Separate data by type: <strong>Raster / Vector</strong></li><li>Keep maps, analyses, and source data in separate folders</li></ul>🎯 This saves time and keeps you working efficiently.' },
            { icon:'fa-rotate', color:'#1e7a34', titleAR:'تابع التحديثات والأدوات الجديدة', titleEN:'Stay Updated with New Tools', bodyAR:'برامج GIS دايمًا بتتحدث:<ol><li>تابع المدونات الرسمية لـ ArcGIS و QGIS</li><li>تابع حسابات GitHub الخاصة بالـ Plugins</li><li>جرّب الأدوات الجديدة على مشاريع صغيرة</li></ol>🎯 ده هيخليك دائمًا محدث ومواكب لأي وظيفة أو مشروع.', bodyEN:'GIS software is always evolving:<ol><li>Follow official ArcGIS & QGIS blogs</li><li>Watch GitHub repos for new Plugins</li><li>Test new tools on small projects</li></ol>🎯 This keeps you current and competitive in the job market.' },
            { icon:'fa-database', color:'#d4a017', titleAR:'استخدم بيانات مفتوحة Open Data', titleEN:'Use Open Data Sources', bodyAR:'لتطبيق مشاريع GIS بدون تعقيدات:<ol><li>استخدم بيانات مفتوحة من مواقع حكومية أو بحثية</li><li>جرّب مشاريع صغيرة زي رسم خرائط استخدام الأراضي</li><li>افتح ملفات البيانات بنفسك لتفهم هيكلها</li></ol>🎯 ده هيساعدك تتعلم التحليل العملي بدون قيود تراخيص.', bodyEN:'Apply GIS projects without complications:<ol><li>Use open data from government or research portals</li><li>Try small projects like mapping land use</li><li>Open data files yourself to understand their structure</li></ol>🎯 This helps you learn practical analysis without license restrictions.' },
            { icon:'fa-share-nodes', color:'#1e7a34', titleAR:'شارك مشاريعك وخبراتك', titleEN:'Share Your Projects & Experience', bodyAR:'مشاركة مشاريعك خطوة مهمة لبناء Portfolio:<ol><li>انشر خرائطك ومشاريعك على LinkedIn أو GitHub</li><li>اشرح كل مشروع: البيانات، الأدوات، النتائج</li></ol>🎯 ده هيخلي أصحاب الشغل يشوفوا مهاراتك.<br>⚠️ مهم جدًا لو عايز Freelance أو وظيفة ثابتة.', bodyEN:'Sharing is key to building your Portfolio:<ol><li>Post your maps and projects on LinkedIn or GitHub</li><li>Describe each project: data, tools, and results</li></ol>🎯 This lets employers see and appreciate your skills.<br>⚠️ Essential if you want Freelance or a permanent GIS job.' },
            { icon:'fa-magnifying-glass-location', color:'#d4a017', titleAR:'ركّز على التحليل المكاني Spatial Analysis', titleEN:'Master Spatial Analysis', bodyAR:'مهارة التحليل المكاني مطلوبة في كل مشاريع GIS:<ol><li>اتعلم كيفية تحليل البيانات المكانية وعلاقاتها</li><li>جرّب أدوات مثل <strong>Buffer, Overlay, Spatial Join</strong></li><li>اربط النتائج بخطط عملية أو خرائط توضيحية</li></ol>🎯 التطبيق العملي هو اللي هيخلي مهارتك واضحة.', bodyEN:'Spatial analysis skills are required in every GIS project:<ol><li>Learn how to analyze spatial data and its relationships</li><li>Practice tools like <strong>Buffer, Overlay, Spatial Join</strong></li><li>Link results to practical plans or illustrative maps</li></ol>🎯 Hands-on practice is what makes your skill visible.' },
            { icon:'fa-satellite', color:'#1e7a34', titleAR:'تعلّم Remote Sensing', titleEN:'Learn Remote Sensing', bodyAR:'الـ Remote Sensing جزء أساسي من GIS:<ul><li>افهم أنواع الأقمار الصناعية مثل <strong>Landsat, Sentinel</strong></li><li>تعلّم استخدام وتحليل الصور الفضائية</li><li>اربط النتائج بالخرائط GIS</li></ul>ده هيفتحلك مجالات كبيرة في البيئة، الزراعة، والتخطيط العمراني.', bodyEN:'Remote Sensing is a core part of GIS:<ul><li>Understand satellite types like <strong>Landsat, Sentinel</strong></li><li>Learn to use and analyze satellite imagery</li><li>Link results back to GIS maps</li></ul>This opens huge opportunities in environment, agriculture, and urban planning.' },
            { icon:'fa-palette', color:'#d4a017', titleAR:'ركّز على Visualization', titleEN:'Focus on Visualization', bodyAR:'العرض البصري للخرائط مهم جدًا:<ul><li>استخدم <strong>Symbols, Labels, Color Schemes</strong> بشكل واضح</li><li>تعلّم عمل <strong>Interactive Maps</strong> في ArcGIS أو QGIS</li><li>تقديم الخرائط بشكل جذاب يسهّل فهم البيانات</li></ul>يزيد فرصك في الشغل ويجعل نتائجك أكثر تأثيراً.', bodyEN:'Map visualization is critically important:<ul><li>Use clear <strong>Symbols, Labels, Color Schemes</strong></li><li>Learn to create <strong>Interactive Maps</strong> in ArcGIS or QGIS</li><li>Attractive map presentation makes data easier to understand</li></ul>This increases your job opportunities and makes your results more impactful.' },
            { icon:'fa-file-lines', color:'#1e7a34', titleAR:'اعمل Portfolio رقمي', titleEN:'Build a Digital Portfolio', bodyAR:'لكي تُثبت مهاراتك لأي وظيفة أو مشروع:<ul><li>احتفظ بمشاريعك، خرائطك، تحليلاتك في ملف أو موقع</li><li>اعمل شرح لكل مشروع: الهدف، البيانات، التحليل، النتائج</li><li>استخدم <strong>GitHub</strong> أو <strong>LinkedIn</strong> لعرض Portfolio</li></ul>', bodyEN:'To prove your skills for any job or project:<ul><li>Keep your projects, maps, and analyses in one place</li><li>Document each project: goal, data, analysis, results</li><li>Use <strong>GitHub</strong> or <strong>LinkedIn</strong> to showcase your Portfolio</li></ul>' },
            { icon:'fa-code', color:'#d4a017', titleAR:'اتعلّم Python وGIS', titleEN:'Learn Python for GIS', bodyAR:'البرمجة مهمة جدًا في GIS:<ul><li>استخدم <strong>Python + ArcPy</strong> لتسريع التحليل المكرّر</li><li>جرّب <strong>QGIS Python Plugins</strong></li><li>كتابة سكربتات صغيرة هتوفر وقتك وتديك قوة في تحليل البيانات الكبيرة</li></ul>', bodyEN:'Programming is very important in GIS:<ul><li>Use <strong>Python + ArcPy</strong> to automate repetitive analysis</li><li>Try <strong>QGIS Python Plugins</strong></li><li>Writing small scripts saves time and gives you power over large datasets</li></ul>' },
            { icon:'fa-users', color:'#1e7a34', titleAR:'شارك في مجتمعات GIS', titleEN:'Join GIS Communities', bodyAR:'المجتمع هيساعدك تتعلم أسرع:<ul><li>انضم لمجموعات GIS على Facebook، LinkedIn، Reddit</li><li>اسأل، شارك مشاريعك، خذ نصايح من محترفين</li><li>ده هيوصلك لفرص تدريبية وشغل أكثر</li></ul>', bodyEN:'Community will help you learn faster:<ul><li>Join GIS groups on Facebook, LinkedIn, Reddit</li><li>Ask questions, share your projects, get advice from professionals</li><li>This connects you to more training and job opportunities</li></ul>' }
        ];

        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR ? 'رؤى GIS' : 'GIS Insights'}</h2>
            <p>${isAR ? '١٥ نصيحة ذهبية لتطوير مسيرتك في نظم المعلومات الجغرافية' : '15 expert tips to advance your GIS career and skills'}</p>
        </div>
        <div class="tips-grid">
            ${tips.map((t,i) => `
            <div class="tip-card">
                <div class="tip-header">
                    <div class="tip-icon" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44;">
                        <i class="fa-solid ${t.icon}"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div class="tip-num">${isAR?'نصيحة':'Tip'} ${i+1}</div>
                        <h3 class="tip-title">${isAR?t.titleAR:t.titleEN}</h3>
                    </div>
                </div>
                <div class="tip-body">${isAR?t.bodyAR:t.bodyEN}</div>
            </div>`).join('')}
        </div>`;
    }

    /* ─── SPATIAL DATA LIBRARY ─── */
    const SPATIAL_CATEGORIES = [
        { key:'base', icon:'🗺️', ar:'البيانات الأساسية', en:'Base Data' },
        { key:'roads', icon:'🛣️', ar:'شبكة الطرق', en:'Road Network' },
        { key:'water', icon:'🌊', ar:'الموارد المائية', en:'Water Resources' },
        { key:'buildings', icon:'🏢', ar:'المباني والمنشآت', en:'Buildings & Facilities' },
        { key:'terrain', icon:'🌍', ar:'بيانات التضاريس', en:'Terrain Data' },
        { key:'satellite', icon:'🛰️', ar:'صور الأقمار الصناعية', en:'Satellite Imagery' },
        { key:'environment', icon:'🌿', ar:'البيئة', en:'Environment' },
        { key:'climate', icon:'🌦️', ar:'المناخ', en:'Climate' },
        { key:'population', icon:'👥', ar:'السكان', en:'Population' },
        { key:'geology', icon:'🪨', ar:'الجيولوجيا', en:'Geology' },
        { key:'osm', icon:'🌍', ar:'OpenStreetMap', en:'OpenStreetMap' },
        { key:'topo_maps', icon:'🧭', ar:'خرائط طبوغرافية', en:'Topographic Maps' },
        { key:'arab_shapefiles', icon:'🗂️', ar:'شيب فايلات دول عربية', en:'Arab Countries Shapefiles' },
    ];
    const SPATIAL_FILE_TYPES = ['Shapefile (.shp)','GeoPackage (.gpkg)','GeoJSON','KML / KMZ','CSV','Raster (.tif)','File Geodatabase (.gdb)'];

    function scFindCat(key) { return SPATIAL_CATEGORIES.find(c => c.key === key); }
    function scFindSub(catKey, subKey) { return null; }
    function scCatLabel(cat, isAR) { return `${cat.icon} ${isAR ? cat.ar : cat.en}`; }

    let _dsAll = [];
    let _dsProjects = [];
    let _dsLoaded = false;
    let _dsView = { mode:'home', category:null, sub:null, projectId:null, datasetId:null, prevMode:null };
    let _dsFilters = { region:'', fileType:'', coordSystem:'', source:'', year:'' };
    let _dsSearchQ = '';

    async function renderDatasets(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        if (!_dsLoaded) {
            area.innerHTML = `<div style="text-align:center;padding:60px 0;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i><div style="margin-top:10px;font-size:13px;">${isAR?'جاري تحميل مكتبة البيانات المكانية...':'Loading spatial data library...'}</div></div>`;
            try {
                const [ds, pj] = await Promise.all([
                    window._loadSpatialDatasets ? window._loadSpatialDatasets() : Promise.resolve([]),
                    window._loadSpatialProjects ? window._loadSpatialProjects() : Promise.resolve([]),
                ]);
                _dsAll = (ds || []).filter(d => !d.hidden);
                _dsProjects = pj || [];
                _dsLoaded = true;
            } catch(e) { console.error('Spatial library load error:', e); _dsAll = []; _dsProjects = []; }
        }
        _dsView = { mode:'home', category:null, sub:null, projectId:null, datasetId:null, prevMode:null };
        renderDatasetsView(area);
    }

    function dsRefresh() {
        const area = document.getElementById('contentArea');
        if (area) renderDatasetsView(area);
    }

    window.dsGoHome = function() {
        _dsView = { mode:'home', category:null, sub:null, projectId:null, datasetId:null, prevMode:null };
        dsRefresh();
    };
    window.dsOpenCategory = function(catKey, subKey) {
        _dsView = { mode:'category', category:catKey, sub: subKey || null, projectId:null, datasetId:null, prevMode:null };
        dsRefresh();
    };
    window.dsOpenProject = function(projId) {
        _dsView = { mode:'project', category:null, sub:null, projectId:projId, datasetId:null, prevMode:null };
        dsRefresh();
    };
    window.dsOpenDataset = function(id) {
        _dsView.prevMode = _dsView.mode === 'detail' ? (_dsView.prevMode || 'home') : _dsView.mode;
        _dsView.mode = 'detail';
        _dsView.datasetId = id;
        dsRefresh();
        window.scrollTo({top:0, behavior:'smooth'});
    };
    window.dsBack = function() {
        if (_dsView.mode === 'detail') {
            _dsView.mode = _dsView.prevMode || 'home';
            _dsView.datasetId = null;
            dsRefresh();
        } else {
            window.dsGoHome();
        }
    };
    window.dsSearchGo = function() {
        _dsSearchQ = (document.getElementById('dsSearchInput')?.value || '').trim().toLowerCase();
        if (!_dsSearchQ) { window.dsGoHome(); return; }
        _dsView = { mode:'search', category:null, sub:null, projectId:null, datasetId:null, prevMode:null };
        dsRefresh();
    };
    window.dsSearchKey = function(e) { if (e.key === 'Enter') window.dsSearchGo(); };
    window.dsFilterChange = function() {
        _dsFilters.region = document.getElementById('dsFilterRegion')?.value.trim() || '';
        _dsFilters.fileType = document.getElementById('dsFilterType')?.value || '';
        _dsFilters.coordSystem = document.getElementById('dsFilterCoord')?.value.trim() || '';
        _dsFilters.source = document.getElementById('dsFilterSource')?.value.trim() || '';
        _dsFilters.year = document.getElementById('dsFilterYear')?.value.trim() || '';
        dsRefresh();
    };
    window.dsFilterReset = function() {
        _dsFilters = { region:'', fileType:'', coordSystem:'', source:'', year:'' };
        dsRefresh();
    };

    function dsMatchesFilters(d) {
        if (_dsFilters.region && !((d.region||'').toLowerCase().includes(_dsFilters.region.toLowerCase()))) return false;
        if (_dsFilters.fileType && d.fileType !== _dsFilters.fileType) return false;
        if (_dsFilters.coordSystem && !((d.coordSystem||'').toLowerCase().includes(_dsFilters.coordSystem.toLowerCase()))) return false;
        if (_dsFilters.source && !((d.source||'').toLowerCase().includes(_dsFilters.source.toLowerCase()))) return false;
        if (_dsFilters.year && String(d.year||'') !== String(_dsFilters.year)) return false;
        return true;
    }
    function dsMatchesSearch(d, q) {
        const hay = [d.name, d.nameEn, d.region, d.source, d.description, d.fileType, Array.isArray(d.layers)?d.layers.join(' '):''].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
    }

    function renderDatasetsView(area) {
        const isAR = lang === 'AR';
        area = area || document.getElementById('contentArea');
        const header = `
        <div class="page-header">
            <h2>${isAR ? '🗂️ مكتبة البيانات المكانية' : '🗂️ Spatial Data Library'}</h2>
            <p>${isAR ? 'تصفح وحمّل مجموعات البيانات الجغرافية المصنّفة — حدود، طرق، مياه، مبانٍ، تضاريس، صور أقمار صناعية والمزيد' : 'Browse and download organized GIS datasets — boundaries, roads, water, buildings, terrain, satellite imagery and more'}</p>
        </div>
        <div class="ds-search-bar">
            <input type="text" id="dsSearchInput" placeholder="${isAR?'ابحث عن اسم البيانات، الدولة، المصدر...':'Search by dataset name, country, source...'}" value="${_dsSearchQ}" onkeydown="dsSearchKey(event)">
            <button onclick="dsSearchGo()"><i class="fa-solid fa-magnifying-glass"></i> ${isAR?'بحث':'Search'}</button>
        </div>`;

        let body = '';
        if (_dsView.mode === 'home') body = dsHomeHTML(isAR);
        else if (_dsView.mode === 'category') body = dsCategoryViewHTML(isAR);
        else if (_dsView.mode === 'project') body = dsProjectViewHTML(isAR);
        else if (_dsView.mode === 'search') body = dsSearchViewHTML(isAR);
        else if (_dsView.mode === 'detail') body = dsDetailViewHTML(isAR);

        area.innerHTML = header + body;
    }

    function dsHomeHTML(isAR) {
        let html = '';
        if (_dsProjects.length) {
            html += `
            <div class="connect-section-wrap">
                <div class="connect-section-title">
                    <span class="brand-pill ts"><i class="fa-solid fa-star"></i> ${isAR?'بيانات جاهزة للمشروعات':'Ready-for-Project Data'}</span>
                </div>
                <div class="ds-proj-strip">
                    ${_dsProjects.map(p => dsProjectCardHTML(p, isAR)).join('')}
                </div>
            </div>`;
        }
        html += `
        <div class="connect-section-wrap">
            <div class="connect-section-title">
                <span class="brand-pill gis"><i class="fa-solid fa-layer-group"></i> ${isAR?'التصنيفات':'Categories'}</span>
            </div>
            <div class="ds-cat-grid">
                ${SPATIAL_CATEGORIES.map(c => dsCatCardHTML(c, isAR)).join('')}
            </div>
        </div>`;
        return html;
    }

    function dsCatCardHTML(cat, isAR) {
        const count = _dsAll.filter(d => d.category === cat.key).length;
        return `
        <div class="ds-cat-card" onclick="dsOpenCategory('${cat.key}')">
            <div class="ico">${cat.icon}</div>
            <h4>${isAR?cat.ar:cat.en}</h4>
            <div class="cnt">${count} ${isAR?'مجموعة بيانات':'datasets'}</div>
        </div>`;
    }