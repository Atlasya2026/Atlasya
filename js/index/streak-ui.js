    (function () {
        'use strict';
        if (window.__atlasyaStreakUI) return;
        window.__atlasyaStreakUI = true;

        const AR = () => (typeof lang !== 'undefined' && lang === 'AR');
        const T = (ar, en) => AR() ? ar : en;
        const getView = () => (typeof window._streakGetView === 'function') ? window._streakGetView() : null;
        const DAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
        const DAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const isStudent = () => !window._isAdmin;
        let _justCells = false;   // بيفعّل أنيميشن الخلية مرة واحدة بعد تسجيل يوم جديد

        function daysWord(n) {
            if (AR()) return window._streakCore ? window._streakCore.arDaysWord(n) : (n + ' يوم');
            return n + (n === 1 ? ' day' : ' days');
        }
        function nextMilestone(v) {
            return v.milestones.find(m => !m.claimed && m.days > v.currentStreak) || null;
        }

        /* ───────── مكوّنات العرض ───────── */
        function weekRow(v) {
            const names = AR() ? DAYS_AR : DAYS_EN;
            return `<div class="atl-st-week">${v.week.map((c, i) => {
                const cls = ['atl-st-day', c.status, c.isToday ? 'today' : '', (c.isToday && c.status === 'done' && _justCells) ? 'just' : ''].join(' ');
                let dot = '';
                if (c.isToday) dot = c.status === 'done' ? '🔥' : '<i class="fa-solid fa-fire"></i>';
                else if (c.status === 'done') dot = '<i class="fa-solid fa-check"></i>';
                return `<div class="${cls}"><span class="atl-st-dl">${names[i]}</span><span class="atl-st-dot">${dot}</span></div>`;
            }).join('')}</div>`;
        }

        function progressBlock(v) {
            const nm = nextMilestone(v);
            if (!nm) return '';
            const pct = Math.max(4, Math.min(100, Math.round((v.currentStreak / nm.days) * 100)));
            const left = nm.days - v.currentStreak;
            return `<div class="atl-st-prog">
                <div class="atl-st-prog-top">
                    <span>${T(`باقي ${daysWord(left)} للمكافأة التالية`, `${daysWord(left)} left to the next reward`)}</span>
                    <span>🎁 +${nm.coins} ${T('عملة', 'coins')}${nm.badge ? ' + 🏅' : ''}</span>
                </div>
                <div class="atl-st-bar"><i style="width:${pct}%"></i></div>
            </div>`;
        }

        function messageFor(v) {
            const n = v.currentStreak;
            const msg = n > 0
                ? T(`أنت مستمر منذ ${daysWord(n)}!`, `You've been on a streak for ${daysWord(n)}!`)
                : T('ابدأ سلسلتك اليوم!', 'Start your streak today!');
            const sub = v.doneToday
                ? T('✓ تم تسجيل نشاط اليوم — نراك غدًا!', "✓ Today's activity is logged — see you tomorrow!")
                : T('سجّل نشاطًا حقيقيًا اليوم: حل التحدي، شاهد فيديو، أو افتح مرجعًا أو Dataset.',
                    'Do a real activity today: solve the challenge, watch a video, or open a reference or dataset.');
            return { msg, sub };
        }

        function dashCardHTML() {
            const v = getView();
            if (!v || v.status === 'off' || v.status === 'error') return '';
            if (!v.ready) {
                return `<div class="atl-st-card" id="atlStreakCard"><div class="atl-st-head"><div class="atl-st-title"><i class="fa-solid fa-fire"></i> Daily Streak</div></div>
                    <div class="atl-st-sub" style="margin-top:12px;"><i class="fa-solid fa-spinner fa-spin"></i></div></div>`;
            }
            const { msg, sub } = messageFor(v);
            return `<div class="atl-st-card" id="atlStreakCard">
                <div class="atl-st-head">
                    <div class="atl-st-title"><i class="fa-solid fa-fire"></i> 🔥 Daily Streak</div>
                    <button class="atl-st-link" onclick="goSettings('streak')">🔥 My Streak <i class="fa-solid fa-${AR() ? 'angle-left' : 'angle-right'}"></i></button>
                </div>
                <div class="atl-st-main">
                    <div class="atl-st-flame ${v.doneToday ? 'on' : 'off'}">🔥</div>
                    <div>
                        <div class="atl-st-msg">${msg}</div>
                        <div class="atl-st-sub">${sub}</div>
                    </div>
                </div>
                ${weekRow(v)}
                ${progressBlock(v)}
            </div>`;
        }

        function injectDashCard(area) {
            if (!area || !isStudent()) return;
            const html = dashCardHTML();
            const existing = area.querySelector('#atlStreakCard');
            if (existing) { if (html) existing.outerHTML = html; else existing.remove(); return; }
            if (!html) return;
            const anchor = area.querySelector('.welcome-banner');
            if (anchor) anchor.insertAdjacentHTML('afterend', html);
        }

        function streakPageHTML() {
            const v = getView();
            const back = `<button class="settings-back-btn" onclick="goSettings('hub')"><i class="fa-solid fa-${AR() ? 'arrow-right' : 'arrow-left'}"></i> ${T('العودة للإعدادات', 'Back to Settings')}</button>`;
            const head = `<div class="page-header"><h2>🔥 My Streak</h2><p>${T('تابع التزامك اليومي ومكافآتك', 'Track your daily consistency and rewards')}</p></div>${back}`;
            if (!v || !v.ready) {
                const failed = v && (v.status === 'error');
                return head + `<div class="atl-st-panel" style="text-align:center;color:var(--muted);">${failed
                    ? T('تعذّر تحميل بيانات الـ Streak حاليًا. تأكد من الاتصال ثم أعد المحاولة.', 'Could not load your streak right now. Check your connection and try again.')
                    : '<i class="fa-solid fa-spinner fa-spin"></i>'}</div>`;
            }
            const { msg, sub } = messageFor(v);
            const stats = `<div class="atl-st-stats">
                <div class="atl-st-stat"><i class="fa-solid fa-fire"></i><b>${v.currentStreak}</b><span>Current Streak</span></div>
                <div class="atl-st-stat"><i class="fa-solid fa-trophy"></i><b>${v.longestStreak}</b><span>Longest Streak</span></div>
                <div class="atl-st-stat"><i class="fa-solid fa-calendar-check"></i><b>${v.totalActiveDays}</b><span>Total Active Days</span></div>
            </div>`;
            const week = `<div class="atl-st-panel"><h3>${msg}</h3>${weekRow(v)}<div class="atl-st-sub" style="margin-top:12px;">${sub}</div>${progressBlock(v)}</div>`;

            const nm = nextMilestone(v);
            const ms = v.milestones.map(m => {
                const state = m.claimed ? 'done' : (nm && nm.days === m.days ? 'next' : '');
                const icon = m.claimed ? 'fa-check' : (state === 'next' ? 'fa-fire' : 'fa-lock');
                const right = m.claimed
                    ? (m.pending > 0 ? `⏳ ${m.pending} ${T('مؤجلة', 'pending')}` : `✓ ${T('تم الاستلام', 'Claimed')}`)
                    : `🎁 +${m.coins} ${T('عملة', 'coins')}`;
                return `<div class="atl-st-ms ${state}"><div class="atl-st-ms-ic"><i class="fa-solid ${icon}"></i></div>
                    <div class="atl-st-ms-t"><b>${daysWord(m.days)} ${T('متتالية', 'in a row')}</b>
                    <small>+${m.coins} ${T('عملة', 'coins')}${m.badge ? T(' + Badge مميز', ' + special Badge') : ''}</small></div>
                    <div class="atl-st-ms-r">${right}</div></div>`;
            }).join('');
            const pendingNote = v.pendingTotal > 0
                ? `<div class="atl-st-note">⏳ ${T(`لديك ${v.pendingTotal} عملة في المكافآت المؤجلة بسبب الحد اليومي للعملات — ستُضاف تلقائيًا في اليوم التالي.`,
                    `You have ${v.pendingTotal} coins in pending rewards because of the daily coin limit — they'll be added automatically the next day.`)}</div>` : '';
            const milestones = `<div class="atl-st-panel"><h3><i class="fa-solid fa-gift" style="color:var(--gold3);"></i> Milestones</h3>${ms}
                <div class="atl-st-note" style="margin-top:12px;">${T('كل مكافأة تُمنح مرة واحدة فقط لكل Milestone.', 'Each milestone reward is granted only once.')}</div>${pendingNote}</div>`;

            const earned = v.badges.some(b => b.id === 'streak_30');
            const badges = `<div class="atl-st-panel"><h3><i class="fa-solid fa-medal" style="color:var(--gold3);"></i> Badges</h3>
                <div class="atl-st-badges"><div class="atl-st-badge ${earned ? 'earned' : 'locked'}">
                    <div class="atl-st-badge-ic">${earned ? '🏅' : '<i class="fa-solid fa-lock" style="font-size:17px;"></i>'}</div>
                    <div><b>${T('وسام الالتزام — 30 يومًا', 'Consistency Badge — 30 days')}</b>
                    <small>${earned ? T('تم الحصول عليه', 'Earned') : T('حافظ على Streak لمدة 30 يومًا متتاليًا', 'Keep a 30-day streak to unlock it')}</small></div></div></div></div>`;

            const how = `<div class="atl-st-panel"><h3><i class="fa-solid fa-circle-info" style="color:var(--gold3);"></i> ${T('كيف يُحتسب اليوم؟', 'What counts as an active day?')}</h3>
                <ul class="atl-st-how">
                    <li><i class="fa-solid fa-calendar-check"></i>${T('حل التحدي اليومي', 'Solve the daily challenge')}</li>
                    <li><i class="fa-solid fa-circle-play"></i>${T('مشاهدة محتوى تعليمي', 'Watch educational content')}</li>
                    <li><i class="fa-solid fa-book-open"></i>${T('فتح مرجع أو Dataset', 'Open a reference or dataset')}</li>
                </ul>
                <div class="atl-st-note">${T('يُحتسب اليوم مرة واحدة فقط بتوقيت القاهرة. إذا مر يوم كامل بدون نشاط يبدأ الـ Streak من جديد.',
                    'A day counts once, in Cairo time. If a full day passes without activity, your streak starts over.')}</div></div>`;
            return head + stats + week + milestones + badges + how;
        }

        function renderStreakPage(area) {
            area.innerHTML = streakPageHTML();
        }

        /* ───────── إضافة عنصر في قائمة الإعدادات (Profile hub) ───────── */
        function injectHubItem(area) {
            const first = area && area.querySelector('.settings-hub-item');
            if (!first || area.querySelector('#atlStreakHubItem')) return;
            const v = getView();
            const desc = (v && v.ready)
                ? T(`Streak الحالي: ${v.currentStreak} — الأطول: ${v.longestStreak} — إجمالي الأيام: ${v.totalActiveDays}`,
                    `Current: ${v.currentStreak} — Longest: ${v.longestStreak} — Active days: ${v.totalActiveDays}`)
                : T('تابع التزامك اليومي ومكافآتك', 'Track your daily consistency and rewards');
            first.insertAdjacentHTML('beforebegin', `<div class="settings-hub-item" id="atlStreakHubItem" onclick="goSettings('streak')">
                <div class="settings-hub-icon"><i class="fa-solid fa-fire" style="color:#ff8a1f;"></i></div>
                <div class="settings-hub-text"><div class="settings-hub-title">🔥 My Streak</div><div class="settings-hub-desc">${desc}</div></div>
                <i class="fa-solid fa-${AR() ? 'angle-left' : 'angle-right'} settings-hub-arrow"></i></div>`);
        }

        /* ───────── لفّ الدوال الموجودة (من غير تعديل جسمها) ───────── */
        if (typeof window.renderDashboard === 'function') {
            const _orig = window.renderDashboard;
            window.renderDashboard = async function (area) {
                const r = await _orig.apply(this, arguments);
                try { injectDashCard(area || document.getElementById('contentArea')); } catch (e) { console.warn('[streak] dash card', e); }
                return r;
            };
        }
        if (typeof window.renderAccount === 'function') {
            const _orig = window.renderAccount;
            window.renderAccount = function (area) {
                area = area || document.getElementById('contentArea');
                if (isStudent() && window._accountTab === 'streak') { renderStreakPage(area); return; }
                const r = _orig.apply(this, arguments);
                try { if (isStudent() && (window._accountTab || 'hub') === 'hub') injectHubItem(area); } catch (e) { console.warn('[streak] hub item', e); }
                return r;
            };
        }

        /* ───────── ربط الأنشطة الحقيقية (مشاهدة محتوى / مرجع / Dataset) ───────── */
        function record(type) {
            try { const p = window._streakRecordActivity && window._streakRecordActivity(type); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        }
        function hook(name, type, guard) {
            const orig = window[name];
            if (typeof orig !== 'function') return;
            window[name] = function () {
                const r = orig.apply(this, arguments);
                try { if (!guard || guard.apply(this, arguments)) record(type); } catch (e) {}
                return r;
            };
        }
        hook('plGoDetail', 'content');          // فتح قائمة تشغيل
        hook('plPlayVideo', 'content');         // تشغيل فيديو
        hook('libGoDetail', 'reference');       // فتح مرجع/كتاب
        hook('libPreviewBook', 'reference');    // معاينة مرجع
        hook('libDownloadBook', 'reference');   // تحميل مرجع
        hook('dsOpenProject', 'dataset');       // فتح مشروع بيانات
        hook('dsOpenDataset', 'dataset');       // فتح Dataset
        hook('insOpenStage', 'content', function (stage) {   // صندوق رؤى GIS — فقط لو مفتوح فعلًا (مش مقفول)
            return typeof insUnlockedStage !== 'function' || stage <= insUnlockedStage();
        });

        /* ───────── الإشعارات والأنيميشن ───────── */
        function showDayPop(streak) {
            document.querySelectorAll('.atl-st-pop').forEach(n => n.remove());
            const el = document.createElement('div');
            el.className = 'atl-st-pop';
            el.innerHTML = `<span class="f">🔥</span><span>${T(`يوم جديد! Streak: ${streak}`, `New day logged! Streak: ${streak}`)}</span>`;
            document.body.appendChild(el);
            setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 380); }, 2600);
        }

        function showMilestoneModal(list) {
            const m = list[list.length - 1];
            const lines = [];
            list.forEach(x => {
                if (x.granted > 0) lines.push(`<div class="atl-st-mline">🎁 ${T(`حصلت على ${x.granted} عملة!`, `You earned ${x.granted} coins!`)}</div>`);
                if (x.left > 0) lines.push(`<div class="atl-st-mline dim">⏳ ${x.granted > 0
                    ? T(`وصلت للحد اليومي للعملات — الباقي ${x.left} عملة سيُضاف تلقائيًا غدًا.`, `Daily coin limit reached — the remaining ${x.left} coins will be added tomorrow.`)
                    : T(`وصلت للحد اليومي للعملات — تم حفظ ${x.left} عملة وستُضاف تلقائيًا غدًا.`, `Daily coin limit reached — ${x.left} coins are saved and will be added tomorrow.`)}</div>`);
                if (x.badge) lines.push(`<div class="atl-st-mline">🏅 ${T('حصلت على Badge مميز: وسام الالتزام!', 'You unlocked a special Badge: Consistency!')}</div>`);
            });
            const wrap = document.createElement('div');
            wrap.className = 'atl-st-modal';
            wrap.innerHTML = `<div class="atl-st-mbox" onclick="event.stopPropagation()">
                <div class="atl-st-mflame">🔥</div>
                <h3>${T(`🔥 رائع! وصلت إلى ${daysWord(m.days)} متتالية!`, `🔥 Awesome! You reached a ${m.days}-day streak!`)}</h3>
                ${lines.join('')}
                <button class="atl-st-mbtn">${T('تمام', 'Great')}</button></div>`;
            const close = () => wrap.remove();
            wrap.addEventListener('click', close);
            wrap.querySelector('.atl-st-mbtn').addEventListener('click', close);
            document.body.appendChild(wrap);
        }

        function refreshViews() {
            if (!isStudent()) return;
            const area = document.getElementById('contentArea');
            if (!area) return;
            if ((window._currentPage === 'dashboard' || !window._currentPage) && area.querySelector('.welcome-banner')) injectDashCard(area);
            else if (window._currentPage === 'account') {
                if (window._accountTab === 'streak') renderStreakPage(area);
                else if (area.querySelector('#atlStreakHubItem')) { area.querySelector('#atlStreakHubItem').remove(); injectHubItem(area); }
            }
        }

        window.addEventListener('atlasya:streak', function (e) {
            const d = e.detail || {};
            try {
                if (d.kind === 'day') {
                    _justCells = true;
                    refreshViews();
                    _justCells = false;
                    if (d.milestones && d.milestones.length) showMilestoneModal(d.milestones);
                    else showDayPop(d.streak);
                } else {
                    refreshViews();
                }
                if (d.payouts && d.payouts.length && d.totalGranted > 0 && typeof showToast === 'function') {
                    showToast(T(`🎁 تم صرف ${d.totalGranted} عملة من مكافآت الـ Streak المؤجلة`, `🎁 ${d.totalGranted} coins from your pending Streak rewards were added`));
                }
                // تحديث المحفظة لو مفتوحة وتم صرف عملات
                if (d.totalGranted > 0 && window._currentPage === 'account' && window._accountTab === 'wallet' && typeof renderWalletRoot === 'function') renderWalletRoot();
            } catch (err) { console.warn('[streak] ui', err); }
        });
    })();
    