
    /* ── Floating service-rating modal: 5 stars + optional comment ── */
    let _ticketRatingSelected = 0;
    window.openTicketRatingModal = function(ticketId) {
        const isAR = lang === 'AR';
        document.getElementById('ticketRatingOverlay')?.remove();
        _ticketRatingSelected = 0;

        const overlay = document.createElement('div');
        overlay.id = 'ticketRatingOverlay';
        overlay.className = 'tk-rating-overlay';
        overlay.innerHTML = `
        <div class="tk-rating-box">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <div style="font-size:15px;font-weight:800;"><i class="fa-solid fa-star" style="color:var(--gold3);margin-${isAR?'left':'right'}:6px;"></i>${isAR?'تقييم مستوى الخدمة':'Rate the service'}</div>
                <button onclick="closeTicketRatingModal()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);width:30px;height:30px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="font-size:12.5px;color:var(--muted);">${isAR?'قيّم مدى رضاك عن الرد والدعم اللي وصلك':'Rate how satisfied you were with the reply and support you received'}</div>
            <div class="tk-rating-stars" id="ticketRatingStars">
                ${[1,2,3,4,5].map(n => `<i class="fa-solid fa-star" data-n="${n}" onclick="setTicketRatingStars(${n})"></i>`).join('')}
            </div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:var(--muted);margin-bottom:8px;">${isAR?'تعليق (اختياري)':'Comment (optional)'}</label>
            <textarea id="ticketRatingComment" placeholder="${isAR?'اكتب تعليقك هنا...':'Write your comment here...'}"
                style="width:100%;min-height:80px;padding:12px;border-radius:10px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text);font-family:'Tajawal',sans-serif;font-size:13px;line-height:1.6;resize:vertical;outline:none;margin-bottom:16px;"></textarea>
            <button id="ticketRatingSubmitBtn" onclick="submitTicketRating('${ticketId}')" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#1a1300;font-family:'Tajawal',sans-serif;font-size:14px;font-weight:800;cursor:pointer;">
                ${isAR?'إرسال التقييم':'Submit Rating'}
            </button>
        </div>`;
        overlay.addEventListener('click', e => { if (e.target === overlay) closeTicketRatingModal(); });
        document.body.appendChild(overlay);
    };

    window.closeTicketRatingModal = function() {
        document.getElementById('ticketRatingOverlay')?.remove();
        _ticketRatingSelected = 0;
    };

    window.setTicketRatingStars = function(n) {
        _ticketRatingSelected = n;
        document.querySelectorAll('#ticketRatingStars i').forEach(el => {
            el.classList.toggle('filled', parseInt(el.dataset.n, 10) <= n);
        });
    };

    window.submitTicketRating = async function(ticketId) {
        const isAR = lang === 'AR';
        if (!_ticketRatingSelected) {
            showToast(isAR ? 'من فضلك اختر عدد النجوم' : 'Please select a star rating', true);
            return;
        }
        const commentEl = document.getElementById('ticketRatingComment');
        const comment = commentEl ? commentEl.value.trim() : '';
        const btn = document.getElementById('ticketRatingSubmitBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            await window._rateTicket(ticketId, _ticketRatingSelected, comment);
            showToast(isAR ? 'شكراً لتقييمك!' : 'Thanks for your rating!');
            closeTicketRatingModal();
        } catch (err) {
            showToast(isAR ? 'تعذر إرسال التقييم' : 'Failed to submit rating', true);
            if (btn) { btn.disabled = false; btn.innerHTML = isAR?'إرسال التقييم':'Submit Rating'; }
        }
    };

    function setAdminTicketFilter(filter) {
        _adminTicketFilter = filter;
        ['All','Open','Answered'].forEach(key => {
            const btn = document.getElementById('adminTkFilter' + key);
            if (btn) btn.classList.toggle('active', key.toLowerCase() === filter);
        });
        renderAdminTicketList(lang === 'AR');
    }

    function renderAdminTicketList(isAR) {
        const list = document.getElementById('adminTicketList');
        if (!list) return;
        let tickets = _allTicketsCache;
        if (_adminTicketFilter === 'open') tickets = tickets.filter(t => t.status === 'open');
        else if (_adminTicketFilter === 'answered') tickets = tickets.filter(t => t.status === 'answered' || t.status === 'closed');
        if (!tickets.length) {
            list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px;">${isAR?'لا توجد تذاكر':'No tickets'}</div>`;
            return;
        }
        list.innerHTML = tickets.map(tk => `
            <div class="tk-list-item ${tk.id === _activeAdminTicketId ? 'active' : ''}" onclick="openAdminTicket('${tk.id}')">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="font-size:13px;font-weight:700;color:var(--text);">${escapeHtml(tk.studentName || 'Student')}</span>
                    <span class="tk-status tk-status-${tk.status||'open'}" style="font-size:11px;padding:2px 8px;">${ticketStatusLabel(tk.status, isAR)}</span>
                </div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">
                    <i class="fa-solid ${ticketTypeIcon(tk.type)}"></i> ${ticketTypeLabel(tk.type, isAR)} · ${ticketDate(tk.createdAt, isAR)}
                </div>
                <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(tk.message || '')}</div>
            </div>`).join('');
    }

    function openAdminTicket(ticketId) {
        _activeAdminTicketId = ticketId;
        renderAdminTicketList(lang === 'AR');
        renderAdminTicketDetail(lang === 'AR', ticketId);
    }

    function renderAdminTicketDetail(isAR, ticketId) {
        const wrap = document.getElementById('adminTicketDetail');
        if (!wrap) return;
        const tk = _allTicketsCache.find(t => t.id === ticketId);
        if (!tk) {
            wrap.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">${isAR?'التذكرة غير موجودة':'Ticket not found'}</div>`;
            return;
        }
        const ratingHtml = tk.rating > 0
            ? `<div style="margin-top:14px;font-size:13px;color:var(--muted);">${isAR?'تقييم الطالب: ':"Student's rating: "}<span style="direction:ltr;display:inline-block;color:var(--gold3);">${'★'.repeat(tk.rating)}${'☆'.repeat(5-tk.rating)}</span>
                ${tk.ratingComment ? `<div style="margin-top:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;"><i class="fa-solid fa-comment-dots" style="color:var(--gold4);margin-${isAR?'left':'right'}:6px;"></i>${escapeHtml(tk.ratingComment)}</div>` : ''}
              </div>`
            : '';
        wrap.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
                <div>
                    <div style="font-size:16px;font-weight:800;color:var(--text);">${escapeHtml(tk.studentName || 'Student')}</div>
                    <div style="font-size:12px;color:var(--muted);">${escapeHtml(tk.studentEmail || '')}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span class="tk-badge tk-badge-${tk.type||'inquiry'}"><i class="fa-solid ${ticketTypeIcon(tk.type)}"></i> ${ticketTypeLabel(tk.type, isAR)}</span>
                    <span class="tk-status tk-status-${tk.status||'open'}">${ticketStatusLabel(tk.status, isAR)}</span>
                </div>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">${ticketDate(tk.createdAt, isAR)}</div>
            <div style="background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:14px;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;">${escapeHtml(tk.message)}</div>
            ${tk.screenshot ? `<img src="${tk.screenshot}" class="tk-screenshot-thumb" style="max-width:320px;" onclick="window.open('${tk.screenshot}','_blank')">` : ''}
            ${tk.reply ? `<div class="tk-reply-box" style="margin-top:16px;">
                <div style="font-size:11px;font-weight:700;color:var(--g4);margin-bottom:6px;"><i class="fa-solid fa-headset"></i> ${isAR?'ردّك':'Your reply'}</div>
                <div style="font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;">${escapeHtml(tk.reply)}</div>
            </div>` : ''}
            ${ratingHtml}
            <div style="margin-top:18px;">
                <textarea id="adminTicketReplyInput" placeholder="${isAR?'اكتب ردك على الطالب...':'Write your reply to the student...'}"
                    style="width:100%;min-height:100px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,0.25);border:1px solid var(--border2);color:var(--text);font-family:'Tajawal',sans-serif;font-size:13px;line-height:1.6;resize:vertical;outline:none;margin-bottom:10px;">${tk.reply ? '' : ''}</textarea>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button onclick="sendAdminTicketReply('${tk.id}')" style="padding:10px 22px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--g3),var(--g2));color:#fff;font-family:'Tajawal',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
                        <i class="fa-solid fa-paper-plane"></i> ${tk.reply ? (isAR?'تحديث الرد':'Update reply') : (isAR?'إرسال الرد':'Send reply')}
                    </button>
                    ${tk.status !== 'closed' ? `<button onclick="closeAdminTicket('${tk.id}')" style="padding:10px 22px;border-radius:10px;border:1px solid var(--border2);background:none;color:var(--muted);font-family:'Tajawal',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
                        <i class="fa-solid fa-box-archive"></i> ${isAR?'إغلاق التذكرة':'Close ticket'}
                    </button>` : ''}
                </div>
            </div>`;
    }

    async function sendAdminTicketReply(ticketId) {
        const isAR = lang === 'AR';
        const input = document.getElementById('adminTicketReplyInput');
        const text = input ? input.value.trim() : '';
        if (!text) {
            showToast(isAR ? 'اكتب رداً أولاً' : 'Write a reply first', true);
            return;
        }
        try {
            await window._replyToTicket(ticketId, text);
            showToast(isAR ? 'تم إرسال الرد ✓' : 'Reply sent ✓');
        } catch (err) {
            console.error('sendAdminTicketReply error:', err);
            showToast(isAR ? 'تعذر إرسال الرد' : 'Failed to send reply', true);
        }
    }

    async function closeAdminTicket(ticketId) {
        const isAR = lang === 'AR';
        try {
            await window._closeTicket(ticketId);
            showToast(isAR ? 'تم إغلاق التذكرة' : 'Ticket closed');
        } catch (err) {
            showToast(isAR ? 'تعذر إغلاق التذكرة' : 'Failed to close ticket', true);
        }
    }




    let toastTimer;
    function showToast(msg, isError) {
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        m.textContent = msg;
        t.className = isError ? 'error' : '';
        t.querySelector('i').className = isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-check-circle';
        clearTimeout(toastTimer);
        t.classList.add('show');
        toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
    }

    /* ─── PASSWORD STRENGTH ─── */
    function checkPassStrength() {
        const pass = document.getElementById('signUpPassword').value;
        const fill = document.getElementById('passStrengthFill');
        const label = document.getElementById('passStrengthLabel');
        if (!pass) { fill.style.width='0%'; label.textContent=''; return; }
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        const levels = [
            { pct:'20%', color:'#e74c3c', lbl: lang==='AR'?'ضعيف جداً':'Very Weak' },
            { pct:'40%', color:'#e67e22', lbl: lang==='AR'?'ضعيف':'Weak' },
            { pct:'65%', color:'#f0c040', lbl: lang==='AR'?'متوسط':'Medium' },
            { pct:'85%', color:'#27a346', lbl: lang==='AR'?'قوي':'Strong' },
            { pct:'100%',color:'#1abc9c', lbl: lang==='AR'?'قوي جداً':'Very Strong' },
        ];
        const lvl = levels[Math.min(score, levels.length-1)];
        fill.style.width = lvl.pct;
        fill.style.background = lvl.color;
        label.textContent = lvl.lbl;
        label.style.color = lvl.color;
        checkPassMatch();
    }

    function checkPassMatch() {
        const pass    = document.getElementById('signUpPassword').value;
        const confirm = document.getElementById('signUpConfirmPassword').value;
        const msg     = document.getElementById('passConfirmMsg');
        if (!confirm) { msg.textContent=''; return; }
        if (pass === confirm) {
            msg.textContent = lang==='AR'?'✓ كلمتا المرور متطابقتان':'✓ Passwords match';
            msg.style.color = '#27a346';
        } else {
            msg.textContent = lang==='AR'?'✗ كلمتا المرور غير متطابقتين':'✗ Passwords do not match';
            msg.style.color = '#e74c3c';
        }
    }

    /* ─── DARK / LIGHT MODE ─── */
    let isLightMode = true; // default: light
    function toggleTheme() {
        isLightMode = !isLightMode;
        const body = document.getElementById('pageBody');
        body.classList.toggle('light-mode', isLightMode);
        const iconClass = isLightMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        const icon = document.getElementById('themeToggleIcon');
        if (icon) icon.className = iconClass;
        const iconMob = document.getElementById('themeToggleIconMob');
        if (iconMob) iconMob.className = iconClass;
    }

    /* ─── ADMIN CREDENTIALS ───
       الباسوردات النص الصريح القديمة اتشالت خالص من هنا (كانت ظاهرة لأي حد
       يعمل View Source للصفحة). الدخول دلوقتي حقيقي عبر Firebase Auth، وصلاحية
       الأدمن بتتأكد من وجود مستند admins/{uid} في Firestore — شوف doAdminLogin
       تحت. عشان تضيف عضو فريق جديد: اعمله حساب من Firebase Console →
       Authentication → Add user، وبعدين أنشئ مستند admins/{ذاك الـ UID}
       بمحتوى زي: { "role": "admin", "name": "...", "permissions": ["courses", ...] }
       أو { "role": "admin", "permissions": "all" } لصلاحيات كاملة. */

    // Sections a team member's access can be limited to
    const ADMIN_PERMISSION_LIST = [
        { key:'jobs',       labelAR:'لوحة الوظائف',       labelEN:'Job Board',             icon:'fa-briefcase' },
        { key:'community',  labelAR:'مجتمع طلاب',         labelEN:'Student Community',     icon:'fa-users' },
        { key:'support',    labelAR:'تذاكر الدعم',        labelEN:'Support Tickets',       icon:'fa-ticket' },
        { key:'members',    labelAR:'قائمة اعضاء',        labelEN:'Members List',          icon:'fa-users-gear' },
        { key:'pro',        labelAR:'طلبات برو',          labelEN:'Pro Requests',          icon:'fa-crown' },
        { key:'cv',         labelAR:'عمل cv',             labelEN:'CV Requests',           icon:'fa-file-invoice' },
        { key:'portfolio',  labelAR:'خرائط طلبة',         labelEN:'Student Maps',          icon:'fa-map-location-dot' },
        { key:'courses',    labelAR:'إدارة الكورسات',     labelEN:'Manage Courses',        icon:'fa-building-shield' },
        { key:'library',    labelAR:'المكتبة الرقمية',    labelEN:'Digital Library',       icon:'fa-book-bookmark' },
        { key:'playlists',  labelAR:'قوائم التشغيل',      labelEN:'Playlists',             icon:'fa-clapperboard' },
        { key:'spatialdata',labelAR:'مكتبة البيانات المكانية', labelEN:'Spatial Data Library', icon:'fa-database' },
        { key:'softwaretools',labelAR:'أدوات البرامج', labelEN:'Software Tools', icon:'fa-toolbox' },
        { key:'dailytips',  labelAR:'نصيحة اليوم',        labelEN:'Daily Tip',             icon:'fa-lightbulb' },
        { key:'mentorship', labelAR:'حجوزات استشارات',    labelEN:'Consultation Bookings', icon:'fa-user-tie' },
        { key:'dailychallenges', labelAR:'التحديات', labelEN:'Challenges', icon:'fa-calendar-check' },
        { key:'coinsettings', labelAR:'إعدادات العملات',  labelEN:'Coin Settings',          icon:'fa-coins' },
        { key:'wheelsettings', labelAR:'عجلة الحظ والهدايا', labelEN:'Fortune & Gift Wheel', icon:'fa-dharmachakra' },
    ];

    // Which DOM elements each permission key controls the visibility of
    const ADMIN_PERMISSION_ELEMENT_IDS = {
        members:    ['menuAdminMembers', 'menuAdminReferrals'],
        pro:        ['menuAdminPro'],
        cv:         ['menuAdminCV'],
        portfolio:  ['menuAdminPortfolio'],
        courses:    ['menuAdminCourses'],
        library:    ['menuAdminLibrary'],
        playlists:  ['menuAdminPlaylists'],
        spatialdata:['menuAdminDatasets'],
        softwaretools:['menuAdminTools'],
        dailytips:  ['menuAdminTips'],
        mentorship: ['menuAdminMentorship'],
        jobs:       ['menuJob'],
        support:    ['menuExpert'],
        community:  ['menuCommunity'],
        dailychallenges: ['menuAdminDailyChallenges'],
        coinsettings: ['menuAdminCoins'],
        wheelsettings: ['menuAdminWheel'],
    };

    // Maps a page route to the permission key that guards it (used for direct navigate() calls)
    const ADMIN_PAGE_PERMISSION_MAP = {
        adminmembers: 'members', adminpro: 'pro', cvbuilder: 'cv',
        adminreferrals: 'members',
        adminportfolio: 'portfolio', admincourses: 'courses', adminlibrary: 'library', adminplaylists: 'playlists', adminmentorship: 'mentorship',
        admindatasets: 'spatialdata',
        admintools: 'softwaretools',
        admintips: 'dailytips',
        jobs: 'jobs', expert: 'support',
        community: 'community',
        admindailychallenges: 'dailychallenges',
        admincoins: 'coinsettings',
        adminwheel: 'wheelsettings',
    };

    // Shows/hides admin nav + mobile items according to window._adminPermissions ('all' or an array of keys)
    function applyAdminPermissions() {
        const perms = window._adminPermissions;
        const allAllowed = perms === 'all';
        Object.keys(ADMIN_PERMISSION_ELEMENT_IDS).forEach(key => {
            const allowed = allAllowed || (Array.isArray(perms) && perms.includes(key));
            ADMIN_PERMISSION_ELEMENT_IDS[key].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = allowed ? '' : 'none';
            });
        });
        document.querySelectorAll('.nav-section').forEach(sec => {
            const visibleItems = sec.querySelectorAll('.nav-item:not([style*="display: none"])');
            const label = sec.querySelector('.nav-label');
            if (label) label.style.display = visibleItems.length === 0 ? 'none' : '';
        });
    }

    // Stores current logged-in admin profile
    window._adminProfile = null;

    function switchAuthTab(tab) {
        // Only the admin login form exists now — always show it.
        const el = document.getElementById('adminLoginForm');
        if (el) el.classList.remove('hidden');
    }

    // بيفعّل واجهة الأدمن بعد التأكد من الهوية — مستخدمة من doAdminLogin
    // (تسجيل دخول يدوي) ومن auto-login (لو المستخدم جه أصلاً من student.html
    // بسيشن مسجّل دخوله بالفعل)
    function activateAdminSession(matched, isSuper, permissions) {
        window._isAdmin = true;
        // شبكة أمان: حتى لو حصل خطأ في أي خطوة تحت، الـ splash مايفضلش عالق
        setTimeout(function () { if (window._hideAdminBootSplash) window._hideAdminBootSplash(); }, 3000);
        window._adminProfile = matched;
        window._adminIsSuper = isSuper;
        window._adminPermissions = permissions;
        const savedImg = localStorage.getItem('adminImg_' + matched.username) || '';
        window._base64Img = savedImg;

        document.getElementById('authBox').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';

        const editBtn = document.getElementById('adminEditBtn');
        if (editBtn) editBtn.style.display = 'flex';

        if (window._updateSidebarUser) {
            window._updateSidebarUser(matched.firstName, matched.lastName, savedImg);
        }

        loadAdminNotifCount();

        const menuExpertBtn = document.getElementById('menuExpert');
        if (menuExpertBtn) menuExpertBtn.style.display = '';

        ['menuAdminMembers','menuAdminReferrals','menuAdminPro','menuAdminCV','menuAdminPortfolio','menuAdminCourses','menuAdminLibrary','menuAdminPlaylists','menuAdminDatasets','menuAdminTools','menuAdminTips','menuAdminMentorship'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });

        const adminHideItems = ['menuPlay','menuLib','menuInsight','menuData','menuTool','menuCourse','menuConnect','menuCV','menuPortfolio'];
        adminHideItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        document.querySelectorAll('.nav-section').forEach(sec => {
            const visibleItems = sec.querySelectorAll('.nav-item:not([style*="display: none"])');
            const label = sec.querySelector('.nav-label');
            if (visibleItems.length === 0 && label) label.style.display = 'none';
        });

        try {
            navigate('dashboard', document.getElementById('menuDash'));
            applyAdminPermissions();
        } catch (e) {
            console.error('activateAdminSession: navigate/applyAdminPermissions failed:', e);
        }
        if (isSuper) startPlatformWatch();
        if (window._hideAdminBootSplash) window._hideAdminBootSplash();
        showToast('Welcome, ' + matched.displayName + ' — Admin mode active ✓');
    }
    // بيتنادى من داخل الـ module script (فوق، في onAuthStateChanged) لما
    // يكتشف سيشن أدمن جاهزة — التعيين ده مجرد تخزين مرجع، آمن حتى لو حصل
    // قبل ما الـ module يخلص شغله، لأنه مش بينادي على window._xxx تاني
    window._activateAdminSession = activateAdminSession;

    // بيبني بيانات العرض من محتوى مستند admins/{uid} الخام (بدون أي اتصال
    // مباشر بـ Firebase — آمن هنا لأنه مجرد تحويل بيانات عادي)
    function buildAdminMatchFromData(data, fallbackEmail) {
        if (!data) return null;
        const isSuper = data.permissions === 'all' || data.role === 'superadmin';
        const permissions = isSuper ? 'all' : (Array.isArray(data.permissions) ? data.permissions : []);
        const displayEmail = data.email || fallbackEmail || 'Admin';
        const nameParts = (data.name || displayEmail).trim().split(' ');
        const matched = {
            username: displayEmail,
            displayName: data.name || displayEmail,
            firstName: data.firstName || nameParts[0] || 'Admin',
            lastName: data.lastName || nameParts.slice(1).join(' '),
        };
        return { matched, isSuper, permissions };
    }

    async function doAdminLogin() {
        const email = document.getElementById('adminEmail').value.trim();
        const pass  = document.getElementById('adminPassword').value;

        if (!email || !pass) {
            showToast('اكتب البريد الإلكتروني وكلمة المرور', true);
            return;
        }

        let matched = null, isSuper = false, permissions = [];
        try {
            const uid = await window._adminSignIn(email, pass);
            const data = await window._getAdminDoc(uid);
            const result = buildAdminMatchFromData(data, email);

            if (!result) {
                // الحساب ده حقيقي على Firebase Auth، لكنه مش عضو فريق مسجّل
                await window._signOutAuth();
                showToast('الحساب ده مش مصرح له بالدخول كأدمن', true);
                return;
            }
            matched = result.matched;
            isSuper = result.isSuper;
            permissions = result.permissions;
        } catch (e) {
            // بيانات دخول غلط أو مشكلة في الشبكة — في الحالتين نرفض بأمان
            console.error('doAdminLogin failed:', e);
            matched = null;
        }

        if (matched) {
            activateAdminSession(matched, isSuper, permissions);
        } else {
            showToast('Invalid admin credentials', true);
        }
    }

    /* Manual "Edit Mode" for the 4 dashboard stat numbers was removed — they're
       now always computed live from Firestore (see renderDashboard), so there's
       nothing to manually type in anymore. */

    /* ─── SIDEBAR TOGGLE ─── */
    function toggleSidebar() {
        const sb = document.querySelector('.sidebar');
        const ov = document.getElementById('sidebarOverlay');
        if (!sb) return;
        if (window.innerWidth <= 768) {
            const isOpen = sb.classList.contains('open');
            if (!isOpen) {
                // Reset animations so they replay every time sidebar opens
                sb.querySelectorAll('.brand, .nav-item, .nav-section, .nav-label, .user-card, .btn-logout, .sidebar-footer').forEach(el => {
                    el.style.animation = 'none';
                    void el.offsetHeight; // force reflow
                    el.style.animation = '';
                });
                sb.classList.add('open');
                if (ov) ov.classList.add('active');
            } else {
                sb.classList.remove('open');
                if (ov) ov.classList.remove('active');
            }
        } else {
            sb.classList.toggle('collapsed');
        }
    }
    function closeSidebar() {
        const sb = document.querySelector('.sidebar');
        const ov = document.getElementById('sidebarOverlay');
        if (sb) sb.classList.remove('open');
        if (ov) ov.classList.remove('active');
    }

    /* ─── ADMIN NOTIFICATIONS ─── */
    let _notifOpen = false;

    function toggleNotifDropdown() {
        _notifOpen = !_notifOpen;
        const dd = document.getElementById('notifDropdown');
        if (!dd) return;

        // ── Pick whichever bell button is currently visible ──
        const btnDesk = document.getElementById('notifBtn');
        const btnMob  = document.getElementById('notifBtnMob');
        const btn = (btnMob && btnMob.offsetParent !== null) ? btnMob : btnDesk;

        // ── Position the dropdown directly below the bell button ──
        if (btn) {
            const rect = btn.getBoundingClientRect();
            const isMobile = window.innerWidth <= 768;
            const vw = window.innerWidth;

            if (isMobile) {
                // On mobile: full-width, positioned just below the topbar
                const topbar = document.querySelector('.topbar');
                const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : rect.bottom;
                dd.style.top   = (topbarBottom + 6) + 'px';
                dd.style.left  = '10px';
                dd.style.right = '10px';
                dd.style.width = 'auto';
            } else {
                const ddWidth = Math.min(360, vw - 16);
                let rightPos = vw - rect.right;
                if (vw - rightPos - ddWidth < 8) rightPos = vw - ddWidth - 8;
                if (rightPos < 8) rightPos = 8;
                dd.style.top   = (rect.bottom + 8) + 'px';
                dd.style.right = rightPos + 'px';
                dd.style.left  = 'auto';
                dd.style.width = ddWidth + 'px';
            }
        }

        // Set solid background based on current theme
        const isLight = document.getElementById('pageBody').classList.contains('light-mode');
        dd.style.background = isLight ? '#ffffff' : '#1e2230';
        dd.style.borderColor = isLight ? 'rgba(var(--brand-rgb,30,122,52),0.25)' : 'rgba(var(--brand-rgb,30,122,52),0.4)';
        const header = dd.querySelector('div:first-child');
        if (header) header.style.background = isLight ? '#ffffff' : '#1e2230';
        const titleEl = document.getElementById('notifDropTitle');
        if (titleEl) titleEl.style.color = isLight ? '#0f2a40' : '#e8e6f0';
        const list = document.getElementById('notifList');
        if (list) list.style.background = isLight ? '#ffffff' : '#1e2230';

        dd.style.display = _notifOpen ? 'block' : 'none';
        if (_notifOpen) {
            if (window._isAdmin) loadNotifMessages();
            else loadStudentNotifs();
        }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const btnDesk = document.getElementById('notifBtn');
        const btnMob  = document.getElementById('notifBtnMob');
        const dd = document.getElementById('notifDropdown');
        if (!dd) return;
        const clickedBtn = (btnDesk && btnDesk.contains(e.target)) || (btnMob && btnMob.contains(e.target));
        if (!clickedBtn && !dd.contains(e.target)) {
            _notifOpen = false;
            dd.style.display = 'none';
        }
    });

    function _setNotifBadge(count) {
        // Update both desktop and mobile badges
        const ids = [
            { dot: 'notifDot',    counter: 'notifCount' },
            { dot: 'notifDotMob', counter: 'notifCountMob' }
        ];
        ids.forEach(({ dot: dotId, counter: counterId }) => {
            const dot     = document.getElementById(dotId);
            const counter = document.getElementById(counterId);
            if (count > 0) {
                if (dot) dot.style.display = 'block';
                if (counter) { counter.textContent = count > 9 ? '9+' : count; counter.style.display = 'flex'; }
            } else {
                if (dot) dot.style.display = 'none';
                if (counter) counter.style.display = 'none';
            }
        });
    }

    async function loadAdminNotifCount() {
        if (!window._isAdmin) {
            // Student: count unseen admin broadcasts
            try {
                const count = await window._getUnseenNotifCount();
                _setNotifBadge(count);
            } catch(e) { /* silent */ }
            return;
        }
        // Admin: count pending (unanswered) tickets
        if (!window._loadAllTickets) return;
        try {
            const tickets = await window._loadAllTickets();
            const pending = tickets.filter(t => t.status === 'open');
            _setNotifBadge(pending.length);
        } catch(e) { /* silent */ }
    }

    async function loadNotifMessages() {
        if (!window._loadAllTickets) return;
        const list = document.getElementById('notifList');
        const titleEl = document.getElementById('notifDropTitle');
        const isAR = lang === 'AR';
        if (titleEl) titleEl.textContent = isAR ? 'لوحة الإشعارات' : 'Notifications';
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            // ─ Section 1: Send broadcast notification
            const isDark = !document.getElementById('pageBody').classList.contains('light-mode');
            const inputBg = isDark ? '#141720' : '#f1f6fa';
            const inputColor = isDark ? '#e8e6f0' : '#0f2a40';
            const inputBorder = isDark ? 'rgba(212,160,23,0.4)' : 'rgba(var(--brand-rgb,30,122,52),0.3)';
            const sectionBg = isDark ? 'rgba(212,160,23,0.08)' : 'rgba(212,160,23,0.06)';
            const broadcastSection = `<div style="padding:12px 16px;border-bottom:2px solid rgba(212,160,23,0.35);background:${sectionBg};">
                <div style="font-size:12px;font-weight:700;color:#d4a017;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                    <i class="fa-solid fa-bullhorn"></i> ${isAR?'إرسال إشعار لجميع الطلبة':'Broadcast to All Students'}
                </div>
                <input id="notifBroadcastTitle" type="text" placeholder="${isAR?'عنوان الإشعار...':'Notification title...'}" style="width:100%;padding:8px 10px;background:${inputBg};border:1px solid ${inputBorder};border-radius:8px;color:${inputColor};font-family:'Tajawal',sans-serif;font-size:13px;margin-bottom:6px;outline:none;">
                <textarea id="notifBroadcastBody" placeholder="${isAR?'تفاصيل الإشعار...':'Notification details...'}" rows="2" style="width:100%;padding:8px 10px;background:${inputBg};border:1px solid ${inputBorder};border-radius:8px;color:${inputColor};font-family:'Tajawal',sans-serif;font-size:13px;outline:none;resize:none;"></textarea>
                <button onclick="sendBroadcastNotif()" style="width:100%;margin-top:6px;padding:8px;background:linear-gradient(135deg,#d4a017,#b07d00);color:#0a0a0e;border:none;border-radius:8px;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                    <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال':'Send'}
                </button>
            </div>`;

            // ─ Section 2: Support tickets
            const allTickets = await window._loadAllTickets();
            const pendingTickets = allTickets.filter(t => t.status === 'open');
            const questionsHtml = pendingTickets.length === 0
                ? `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${isAR?'لا توجد تذاكر قيد الانتظار':'No pending tickets'}</div>`
                : pendingTickets.map(tk => {
                    const date = tk.createdAt?.toDate ? tk.createdAt.toDate().toLocaleDateString() : '';
                    const letter = tk.studentName?.[0]?.toUpperCase() || 'U';
                    return `<div style="padding:12px 16px;border-bottom:1px solid var(--border);">
                        <div style="display:flex;align-items:flex-start;gap:10px;">
                            <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--g2),var(--g4));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;">${letter}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:700;margin-bottom:2px;">${tk.studentName || 'User'}</div>
                                <div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tk.message || ''}</div>
                                <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
                                    <span style="font-size:11px;color:var(--muted);">${date}</span>
                                    <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;background:rgba(212,160,23,0.15);color:var(--gold3);">
                                        ${isAR ? '⏳ بانتظار الرد' : '⏳ Pending'}
                                    </span>
                                    <button onclick="toggleQuickReply('${tk.id}')" style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;border:1px solid var(--g3);background:rgba(var(--brand-rgb,30,122,52),0.1);color:var(--g4);cursor:pointer;font-family:Tajawal,sans-serif;">
                                        <i class="fa-solid fa-reply" style="font-size:11px;"></i> ${isAR?'رد':'Reply'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="qr_wrap_${tk.id}" style="display:none;margin-top:8px;padding-right:44px;">
                            <div style="display:flex;gap:6px;">
                                <input type="text" id="qr_${tk.id}" placeholder="${isAR?'اكتب ردك...':'Type reply...'}" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--border2);background:rgba(0,0,0,0.2);color:var(--text);font-family:Tajawal,sans-serif;font-size:12px;outline:none;">
                                <button onclick="sendQuickReply('${tk.id}')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--g3);color:#fff;cursor:pointer;font-size:13px;font-family:Tajawal,sans-serif;font-weight:700;">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('');

            list.innerHTML = broadcastSection +
                `<div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px;"><i class="fa-solid fa-ticket"></i> ${isAR?'تذاكر الدعم':'Support Tickets'}</div>` +
                questionsHtml;
        } catch(e) {
            console.error('loadNotifMessages error:', e);
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR ? 'خطأ في التحميل' : 'Loading error'}</div>`;
        }
    }

    function toggleQuickReply(msgId) {
        const wrap = document.getElementById('qr_wrap_' + msgId);
        if (!wrap) return;
        const isHidden = wrap.style.display === 'none' || wrap.style.display === '';
        wrap.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            const inp = document.getElementById('qr_' + msgId);
            if (inp) inp.focus();
        }
    }

    async function sendQuickReply(ticketId) {
        const inp = document.getElementById('qr_' + ticketId);
        const text = inp?.value.trim();
        const isAR = lang === 'AR';
        if (!text) { showToast(isAR?'اكتب ردك أولاً':'Write a reply first', true); return; }
        try {
            await window._replyToTicket(ticketId, text);
            showToast(isAR?'✓ تم إرسال الرد':'✓ Reply sent');
            // Refresh notification list
            loadNotifMessages();
        } catch(e) { showToast(e.message, true); }
    }

    async function sendBroadcastNotif() {
        const title = document.getElementById('notifBroadcastTitle')?.value?.trim();
        const body  = document.getElementById('notifBroadcastBody')?.value?.trim();
        const isAR = lang === 'AR';
        if (!title) { showToast(isAR?'أدخل عنوان الإشعار':'Enter notification title', true); return; }
        try {
            await window._sendAdminNotif(title, body || '');
            showToast(isAR?'✓ تم إرسال الإشعار لجميع الطلبة':'✓ Notification sent to all students');
            if (document.getElementById('notifBroadcastTitle')) document.getElementById('notifBroadcastTitle').value = '';
            if (document.getElementById('notifBroadcastBody')) document.getElementById('notifBroadcastBody').value = '';
        } catch(e) {
            showToast(isAR?'خطأ في الإرسال':'Send failed', true);
        }
    }

    async function markAllNotifsRead() {
        if (window._markNotifsAsSeen) await window._markNotifsAsSeen();
        _setNotifBadge(0);
        const markBtn = document.getElementById('notifMarkAllBtn');
        if (markBtn) markBtn.style.display = 'none';
        // Re-render immediately to remove green highlights
        await loadStudentNotifs();
        showToast(lang === 'AR' ? '✓ تم تعليم كل الإشعارات كمقروءة' : '✓ All notifications marked as read');
    }

    async function loadStudentNotifs() {
        if (!window._loadAdminNotifs) return;
        const list = document.getElementById('notifList');
        const titleEl = document.getElementById('notifDropTitle');
        const isAR = lang === 'AR';
        if (titleEl) titleEl.textContent = isAR ? 'الإشعارات' : 'Notifications';
        if (!list) return;
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        try {
            const notifs = await window._loadAdminNotifs();
            // Check unseen count BEFORE marking as seen
            let unseenCount = 0;
            try { unseenCount = await window._getUnseenNotifCount(); } catch(e) {}
            // Reset badge
            _setNotifBadge(0);
            // Show/hide mark-all-read button
            const markBtn = document.getElementById('notifMarkAllBtn');
            if (markBtn) {
                markBtn.style.display = unseenCount > 0 ? 'inline-flex' : 'none';
                // Always keep text in sync with current language
                const markTxt = document.getElementById('notifMarkAllTxt');
                if (markTxt) markTxt.textContent = isAR ? 'تعليم الكل' : 'Mark All Read';
                markBtn.title = isAR ? 'تعليم الكل كمقروء' : 'Mark all as read';
            }

            // ── Load personal admin alerts for this student ──
            let personalAlerts = [];
            if (window._currentUid) {
                try {
                    const alertsQ = query(
                        collection(db, 'admin_alerts'),
                        where('toUid', '==', window._currentUid),
                        limit(10)
                    );
                    const alertSnap = await getDocs(alertsQ);
                    personalAlerts = alertSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .sort((a, b) => {
                            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                            return tb - ta;
                        });
                    // Mark them all read after loading
                    alertSnap.docs.forEach(async d => {
                        if (!d.data().read) {
                            try { await updateDoc(doc(db, 'admin_alerts', d.id), { read: true }); } catch(e) {}
                        }
                    });
                } catch(e) { console.warn('admin_alerts load error:', e?.message); }
            }

            const isDark = !document.getElementById('pageBody').classList.contains('light-mode');
            const textColor = isDark ? '#e8e6f0' : '#0f2a40';
            const mutedColor = isDark ? '#8a8fa0' : '#5d7488';
            const borderColor = isDark ? 'rgba(var(--brand-rgb,30,122,52),0.2)' : 'rgba(var(--brand-rgb,30,122,52),0.12)';

            // Render personal alerts section
            let personalAlertsHtml = '';
            if (personalAlerts.length > 0) {
                personalAlertsHtml = `<div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:#6495ed;text-transform:uppercase;letter-spacing:1px;margin-top:4px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-envelope-circle-check"></i> ${isAR?'رسائل الإدارة':'Admin Messages'}</div>`
                + personalAlerts.map(a => {
                    const isUnread = !a.read;
                    const date = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short'}) : '';
                    return '<div style="padding:14px 16px;border-bottom:1px solid ' + borderColor + ';' + (isUnread ? 'background:rgba(100,149,237,0.07);' : '') + '">'
                        + '<div style="display:flex;align-items:flex-start;gap:10px;">'
                        + '<div style="width:32px;height:32px;border-radius:50%;background:rgba(100,149,237,0.12);border:1px solid rgba(100,149,237,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;"><i class="fa-solid fa-bullhorn" style="color:#6495ed;"></i></div>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="font-size:11px;font-weight:700;color:#6495ed;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px;">' + (isAR?'رسالة من الإدارة':'From Admin') + (isUnread ? ' <span style="width:7px;height:7px;border-radius:50%;background:#6495ed;display:inline-block;margin-right:4px;"></span>' : '') + '</div>'
                        + '<div style="font-size:13px;color:' + textColor + ';line-height:1.5;">' + a.message + '</div>'
                        + '<div style="font-size:11px;color:' + mutedColor + ';margin-top:4px;">' + date + '</div>'
                        + '</div></div></div>';
                }).join('');
            }

            if (!notifs.length && !personalAlerts.length) {
                list.innerHTML = '<div style="text-align:center;padding:24px;color:#8a8fa0;font-size:13px;"><i class="fa-regular fa-bell-slash" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.4;"></i>' + (isAR?'لا توجد إشعارات حتى الآن':'No notifications yet') + '</div>';
                return;
            }
            // Get seen IDs to highlight new ones (use same key as _getUnseenNotifCount)
            let seenIds = [];
            try {
                const uid = window._currentUid || 'guest';
                seenIds = JSON.parse(localStorage.getItem('seenNotifs_' + uid) || '[]');
            } catch(e) {}

            const broadcastHtml = notifs.length === 0 ? '' :
                `<div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:var(--gold3);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-bullhorn"></i> ${isAR?'إشعارات المنصة':'Platform Notifications'}</div>`
                + notifs.map(n => {
                const isNew = !seenIds.includes(n.id);
                const date = n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : '';
                return '<div style="padding:14px 16px;border-bottom:1px solid ' + borderColor + ';' + (isNew ? 'background:rgba(var(--brand-rgb,30,122,52),0.07);' : '') + '">'
                    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
                    + '<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#b07d00,#f0c040);display:flex;align-items:center;justify-content:center;font-size:13px;color:#0a0a0e;flex-shrink:0;"><i class="fa-solid fa-bullhorn"></i></div>'
                    + '<div style="font-size:13px;font-weight:700;color:' + textColor + ';flex:1;">' + n.title + '</div>'
                    + (isNew ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--green4);flex-shrink:0;display:inline-block;"></span>' : '')
                    + '</div>'
                    + (n.body ? '<div style="font-size:12px;color:' + mutedColor + ';padding-right:38px;line-height:1.5;">' + n.body + '</div>' : '')
                    + '<div style="font-size:11px;color:' + mutedColor + ';margin-top:6px;padding-right:38px;">' + date + '</div>'
                    + '</div>';
            }).join('');

            list.innerHTML = personalAlertsHtml + broadcastHtml;
        } catch(e) {
            console.error('loadStudentNotifs error:', e);
            list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">' + (lang==='AR'?'خطأ في التحميل':'Loading error') + (e?.message ? '<div style="margin-top:6px;font-size:11px;opacity:0.7;direction:ltr;">' + e.message + '</div>' : '') + '</div>';
        }
    }

    /* ─── INIT ─── */

    window.addEventListener('DOMContentLoaded', () => {
        lang = 'EN';
        const body = document.getElementById('pageBody');
        body.classList.remove('rtl');
        body.classList.add('light-mode'); // default light mode
        document.getElementById('langBtn').textContent = 'AR';
        const icon = document.getElementById('themeToggleIcon');
        if (icon) icon.className = 'fa-solid fa-moon'; // moon = switch to dark
        applyLang();
        const deepLinkPage = getPageFromUrl();
        if (deepLinkPage && deepLinkPage !== 'dashboard') {
            const navEl = PAGE_NAV_ID_MAP[deepLinkPage] ? document.getElementById(PAGE_NAV_ID_MAP[deepLinkPage]) : null;
            navigate(deepLinkPage, navEl, false, true);
        } else {
            navigate('dashboard', document.getElementById('menuDash'));
        }
        // Apply any admin-saved content from Firebase
        if (window._applyContent) window._applyContent();
        // Auto-fill remembered login credentials
        loadRememberedCredentials();
        // ── Sync mob topbar duplicates with real IDs ──
        function syncMobTopbar() {
            // avatar letter
            const srcLetter = document.getElementById('topbarAvatarLetterDesk');
            const dstLetter = document.getElementById('topbarAvatarLetter');
            if (srcLetter && dstLetter) dstLetter.textContent = srcLetter.textContent;
            // avatar bg image
            const srcAv = document.getElementById('topbarAvatarDesk');
            const dstAv = document.getElementById('topbarAvatar');
            if (srcAv && dstAv) {
                dstAv.style.backgroundImage = srcAv.style.backgroundImage;
                dstAv.style.backgroundSize  = srcAv.style.backgroundSize;
            }
            // username
            const srcName = document.getElementById('topbarUserNameDesk');
            const dstName = document.getElementById('topbarUserName');
            if (srcName && dstName) dstName.textContent = srcName.textContent;
            // logout label
            const srcLbl = document.getElementById('txtTopbarLogoutDesk');
            const dstLbl = document.getElementById('txtTopbarLogout');
            if (srcLbl && dstLbl) dstLbl.textContent = srcLbl.textContent;
            // lang btn
            const srcLang = document.getElementById('langBtn');
            const dstLang = document.getElementById('langBtnMob');
            if (srcLang && dstLang) dstLang.textContent = srcLang.textContent;
            // theme icon
            const srcIcon = document.getElementById('themeToggleIcon');
            const dstIcon = document.getElementById('themeToggleIconMob');
            if (srcIcon && dstIcon) dstIcon.className = srcIcon.className;
        }
        // Patch updateSidebarUser / applyLang to also sync mob topbar
        const _origApplyLang = window.applyLang;
        window.applyLang = function(...args) {
            if (_origApplyLang) _origApplyLang(...args);
            syncMobTopbar();
        };
    });
/* PWA: pwa-install.js + manifest-admin.webmanifest + sw.js */
