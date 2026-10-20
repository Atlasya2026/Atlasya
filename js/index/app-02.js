
        /* ─── SHARED CHALLENGE STYLES (used by the daily/weekly challenge UI) ─── */
        function chInjectStyles() {
            if (document.getElementById('chGameStyles')) return;
            const style = document.createElement('style');
            style.id = 'chGameStyles';
            style.textContent = `
                .ch-wrap { max-width: 720px; margin: 0 auto; }
                .ch-empty { text-align:center; padding:70px 20px; }
                .ch-empty i { font-size:46px; color:var(--gold3); opacity:0.55; margin-bottom:16px; display:block; }
                .ch-empty h3 { font-size:17px; font-weight:800; margin-bottom:8px; }
                .ch-empty p { font-size:13px; color:var(--muted); max-width:340px; margin:0 auto; }

                .ch-start { text-align:center; padding:20px; }
                .ch-start-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(212,160,23,0.12); border:1px solid rgba(212,160,23,0.35); color:var(--gold3); font-size:12px; font-weight:800; padding:6px 16px; border-radius:99px; margin-bottom:18px; }
                .ch-start h2 { font-size:22px; font-weight:900; margin-bottom:10px; background:linear-gradient(90deg,var(--gold4),var(--gold3)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
                .ch-start p { font-size:13.5px; color:var(--muted); max-width:420px; margin:0 auto 22px; line-height:1.7; }
                .ch-ladder { display:flex; flex-direction:column-reverse; gap:6px; max-width:320px; margin:0 auto 22px; max-height:260px; overflow-y:auto; }
                .ch-ladder-row { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-radius:10px; background:var(--bg3); border:1px solid var(--border); font-size:12.5px; }
                .ch-ladder-row.last { border-color:rgba(212,160,23,0.5); background:rgba(212,160,23,0.08); }
                .ch-ladder-row .num { color:var(--muted); font-weight:700; }
                .ch-ladder-row .val { color:var(--gold3); font-weight:800; }
                .ch-start-btn { display:inline-flex; align-items:center; gap:10px; padding:14px 34px; border-radius:99px; background:linear-gradient(135deg,var(--gold3),var(--gold2)); color:#0a0a0e; font-weight:900; font-size:15px; border:none; cursor:pointer; box-shadow:0 10px 30px rgba(212,160,23,0.3); transition:0.2s; font-family:'Tajawal',sans-serif; }
                .ch-start-btn:hover { transform:translateY(-2px); box-shadow:0 14px 36px rgba(212,160,23,0.4); }
                .ch-best { margin-top:16px; font-size:12.5px; color:var(--muted); }
                .ch-best strong { color:var(--gold3); }

                .ch-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
                .ch-level { font-size:13px; font-weight:800; color:var(--muted); }
                .ch-level span { color:var(--gold3); }
                .ch-coins-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(212,160,23,0.12); border:1px solid rgba(212,160,23,0.3); border-radius:99px; padding:6px 14px; font-size:13px; font-weight:800; color:var(--gold3); }
                .ch-question-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:26px 22px; margin-bottom:20px; text-align:center; box-shadow:var(--shadow); }
                .ch-question-card h3 { font-size:16px; font-weight:800; line-height:1.7; }
                .ch-options { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
                @media (max-width:560px) { .ch-options { grid-template-columns:1fr; } }
                .ch-opt { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:12px; background:var(--bg3); border:1px solid var(--border); cursor:pointer; text-align:start; font-size:13.5px; font-weight:600; color:var(--text); transition:0.15s; font-family:'Tajawal',sans-serif; width:100%; }
                .ch-opt:hover:not(.disabled) { border-color:var(--gold3); background:rgba(212,160,23,0.08); }
                .ch-opt .ltr { width:28px; height:28px; border-radius:50%; background:var(--bg2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12.5px; flex-shrink:0; }
                .ch-opt.selected { border-color:var(--gold3); background:rgba(212,160,23,0.14); }
                .ch-opt.correct { border-color:#27a346; background:rgba(39,163,70,0.15); }
                .ch-opt.wrong { border-color:#e74c3c; background:rgba(231,76,60,0.15); }
                .ch-opt.disabled { cursor:default; opacity:0.9; }
                .ch-actions-row { display:flex; justify-content:center; margin-top:20px; }
                .ch-lock-btn, .ch-next-btn { padding:12px 30px; border-radius:99px; font-weight:800; font-size:13.5px; border:none; cursor:pointer; font-family:'Tajawal',sans-serif; }
                .ch-lock-btn { background:linear-gradient(135deg,var(--g3),var(--g2)); color:#fff; }
                .ch-lock-btn:disabled { opacity:0.4; cursor:not-allowed; }
                .ch-next-btn { background:linear-gradient(135deg,var(--gold3),var(--gold2)); color:#0a0a0e; }

                .ch-end { text-align:center; padding:30px 20px; }
                .ch-end i.big { font-size:52px; margin-bottom:16px; display:block; }
                .ch-end h2 { font-size:20px; font-weight:900; margin-bottom:8px; }
                .ch-final-coins { font-size:32px; font-weight:900; color:var(--gold3); margin:12px 0; }
                .ch-end p { font-size:13px; color:var(--muted); max-width:380px; margin:0 auto 22px; }
                .ch-end-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
                .ch-btn-outline { padding:11px 24px; border-radius:99px; background:transparent; border:1px solid var(--border2); color:var(--text); font-weight:700; font-size:13px; cursor:pointer; font-family:'Tajawal',sans-serif; }
            `;
            document.head.appendChild(style);
        }

        /* ─── DAILY & WEEKLY CHALLENGE ─── */
        let _dcQuestions = null;
        let _dcWeeklySettings = null;
        let _dcAttemptsCache = {}; // questionId -> attempt data or null
        let _dcState = null; // { question, selected, locked, inModal }

        function dcTodayStr() {
            const d = new Date();
            const tz = d.getTimezoneOffset() * 60000;
            return new Date(d - tz).toISOString().slice(0, 10);
        }

        function dcInjectStyles() {
            chInjectStyles();
            if (document.getElementById('dcStyles')) return;
            const style = document.createElement('style');
            style.id = 'dcStyles';
            style.textContent = `
                .dc-wrap { max-width: 980px; margin: 0 auto; }
                .dc-section-title { font-size:14px; font-weight:800; color:var(--muted); margin:26px 0 12px; display:flex; align-items:center; gap:8px; }
                .dc-section-title i { color:var(--gold3); }
                .dcw-strip { display:flex; gap:10px; flex-wrap:wrap; }
                .dcw-day { flex:1; min-width:88px; text-align:center; padding:14px 8px; border-radius:14px; background:var(--bg3); border:1px solid var(--border); transition:0.15s; }
                .dcw-day.clickable { cursor:pointer; border-color:var(--gold3); background:rgba(212,160,23,0.08); }
                .dcw-day.clickable:hover { transform:translateY(-2px); }
                .dcw-day.done-correct { border-color:#27a346; background:rgba(39,163,70,0.1); }
                .dcw-day.done-wrong { border-color:#e74c3c; background:rgba(231,76,60,0.1); }
                .dcw-day.locked { opacity:0.5; }
                .dcw-day .dname { font-size:11.5px; color:var(--muted); font-weight:700; margin-bottom:6px; }
                .dcw-day .ddate { font-size:10.5px; color:var(--muted); margin-bottom:8px; }
                .dcw-day .dicon { font-size:18px; }
                .dcw-day.done-correct .dicon { color:#27a346; }
                .dcw-day.done-wrong .dicon { color:#e74c3c; }
                .dcw-day .dcoins { font-size:11px; font-weight:800; color:var(--gold3); margin-top:6px; }
                .dcw-bonus-banner { display:flex; align-items:center; gap:10px; margin-top:16px; padding:14px 16px; border-radius:14px; background:rgba(212,160,23,0.1); border:1px solid rgba(212,160,23,0.3); font-size:13px; }
                .dcw-bonus-banner.claimed { background:rgba(39,163,70,0.1); border-color:rgba(39,163,70,0.35); }
                .dcw-bonus-banner i { color:var(--gold3); font-size:20px; }
                .dc-hub-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:8px; }
                .dc-hub-card { cursor:pointer; text-align:center; padding:28px 18px; border-radius:18px; background:var(--bg3); border:1px solid var(--border); transition:0.2s; }
                .dc-hub-card:hover { border-color:var(--gold3); transform:translateY(-2px); }
                .dc-hub-card i { font-size:30px; color:var(--gold3); margin-bottom:12px; display:block; }
                .dc-hub-card h3 { font-size:15px; font-weight:800; margin-bottom:10px; }
                .dc-hub-status { display:inline-block; font-size:11.5px; font-weight:700; padding:5px 12px; border-radius:99px; }
                .dc-hub-status.avail { background:rgba(39,163,70,0.12); border:1px solid rgba(39,163,70,0.3); color:#3ecb63; }
                .dc-hub-status.unavail { background:rgba(255,255,255,0.04); border:1px solid var(--border); color:var(--muted); }
                .dc-hist-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:12px; background:var(--bg3); border:1px solid var(--border); margin-bottom:8px; }
                .dc-hist-icon { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:13px; }
                .dc-hist-icon.ok { background:rgba(39,163,70,0.15); color:#3ecb63; }
                .dc-hist-icon.bad { background:rgba(231,76,60,0.15); color:#e74c3c; }
                .dc-hist-main { flex:1; min-width:0; }
                .dc-hist-q { font-size:12.5px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .dc-hist-meta { font-size:11px; color:var(--muted); margin-top:2px; }
                .dc-hist-coins { font-size:12.5px; font-weight:800; color:var(--gold3); flex-shrink:0; white-space:nowrap; }
            `;
            document.head.appendChild(style);
        }

        let _dcView = 'hub'; // 'hub' | 'daily' | 'weekly'

        async function renderDailyChallenge(area) {
            area.innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i></div>`;
            dcInjectStyles();
            dcInjectJourneyStyles();
            _dcView = 'hub';
            if (!_dcQuestions) {
                try { _dcQuestions = await window._loadDailyChallengeQs(); }
                catch(e) { console.error('loadDailyChallengeQs error:', e); _dcQuestions = []; }
            }
            if (!_dcWeeklySettings) {
                try { _dcWeeklySettings = await window._loadWeeklyChallengeSettings(); }
                catch(e) { _dcWeeklySettings = { enabled: true, bonusCoins: 100 }; }
            }
            try { await dcRenderPage(area); }
            catch (e) {
                console.error('renderDailyChallenge error:', e);
                area.innerHTML = `<div style="text-align:center;padding:50px 20px;color:var(--muted);"><i class="fa-solid fa-triangle-exclamation" style="font-size:24px;color:var(--gold3);"></i><p style="margin-top:12px;">${lang==='AR'?'حصلت مشكلة في تحميل التحديات — جرّب تحدّث الصفحة':'Could not load challenges — please refresh'}</p></div>`;
            }
        }

        window.dcGoView = function(view) {
            _dcView = view;
            const area = document.getElementById('contentArea');
            if (area) dcRenderPage(area);
        };
        window.dcBackToHub = function() {
            _dcView = 'hub';
            const area = document.getElementById('contentArea');
            if (area) dcRenderPage(area);
        };

        async function dcRenderPage(area) {
            await dcRenderJourney(area);
        }

        async function dcRenderDailyView(area, dailyQ) {
            const isAR = lang === 'AR';
            if (dailyQ && !(dailyQ.id in _dcAttemptsCache)) {
                try { _dcAttemptsCache[dailyQ.id] = await window._getChallengeAttempt(dailyQ.id); } catch(e) { console.error(e); }
            }
            area.innerHTML = `
            <div class="page-header">
                <button onclick="dcBackToHub()" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:10px;">
                    <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'رجوع للتحديات':'Back to Challenges'}
                </button>
                <h2>${isAR?'📅 التحدي اليومي':'📅 Daily Challenge'}</h2>
                <p>${isAR?'جاوب صح على سؤال اليوم واكسب عملات':"Answer today's question correctly to earn coins"}</p>
            </div>
            <div class="dc-wrap"><div id="dcDailyCard"></div></div>`;
            dcRenderDailyCard(dailyQ);
        }

        async function dcRenderWeeklyView(area, weekQs, today, weekStart) {
            const isAR = lang === 'AR';
            const toFetch = weekQs.filter(q => !(q.id in _dcAttemptsCache)).map(q => q.id);
            if (toFetch.length) {
                const results = await Promise.all(toFetch.map(id => window._getChallengeAttempt(id)));
                toFetch.forEach((id, i) => { _dcAttemptsCache[id] = results[i]; });
            }
            let bonusClaimed = null;
            if (weekQs.length) {
                try { bonusClaimed = await window._getWeeklyBonusClaim(weekStart); } catch(e) { console.error(e); }
            }
            area.innerHTML = `
            <div class="page-header">
                <button onclick="dcBackToHub()" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:10px;">
                    <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'رجوع للتحديات':'Back to Challenges'}
                </button>
                <h2>${isAR?'🗓️ التحدي الأسبوعي':'🗓️ Weekly Challenge'}</h2>
                <p>${isAR?'جمّع كل أسئلة الأسبوع صح عشان تاخد مكافأة إضافية':'Answer every question this week correctly for a bonus'}</p>
            </div>
            <div class="dc-wrap">
                ${weekQs.length ? `
                <div class="dcw-strip" id="dcwStrip"></div>
                <div class="dcw-bonus-banner ${bonusClaimed?'claimed':''}" id="dcwBonusBanner"></div>` : `
                <div class="ch-empty">
                    <i class="fa-solid fa-calendar-week"></i>
                    <h3>${isAR?'لا يوجد تحدي أسبوعي حالياً':'No weekly challenge right now'}</h3>
                    <p>${isAR?'إدارة المنصة لسه ما ضافتش أسئلة للأسبوع ده — تابعنا وارجع قريب 🎯':"The team hasn't added questions for this week yet — check back soon 🎯"}</p>
                </div>`}
            </div>`;
            if (weekQs.length) {
                dcRenderWeeklyStrip(weekQs, today);
                dcRenderBonusBanner(weekQs, bonusClaimed);
            }
        }

        async function dcRenderHistoryList(root) {
            const isAR = lang === 'AR';
            let attempts = [];
            try { attempts = await window._getMyChallengeAttempts(30); } catch(e) { console.error(e); }
            if (!root) return;
            if (!attempts.length) {
                root.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12.5px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لسه معملتش أي تحدي':"You haven't attempted any challenge yet"}</div>`;
                return;
            }
            root.innerHTML = attempts.map(a => {
                const q = (_dcQuestions || []).find(x => x.id === a.questionId);
                const qText = q ? (isAR ? q.questionAR : (q.questionEN || q.questionAR)) : (isAR?'سؤال محذوف':'Deleted question');
                const typeLabel = a.type === 'weekly' ? (isAR?'أسبوعي':'Weekly') : (isAR?'يومي':'Daily');
                const dateStr = a.scheduledDate || '';
                return `<div class="dc-hist-row">
                    <div class="dc-hist-icon ${a.correct?'ok':'bad'}"><i class="fa-solid ${a.correct?'fa-check':'fa-xmark'}"></i></div>
                    <div class="dc-hist-main">
                        <div class="dc-hist-q">${escapeHtml(qText)}</div>
                        <div class="dc-hist-meta">${typeLabel} · ${dateStr}</div>
                    </div>
                    <div class="dc-hist-coins">${a.correct ? `+${a.coinsAwarded||0} <i class="fa-solid fa-coins"></i>` : '—'}</div>
                </div>`;
            }).join('');
        }

        function dcRenderDailyCard(dailyQ) {
            const root = document.getElementById('dcDailyCard');
            if (!root) return;
            const isAR = lang === 'AR';
            if (!dailyQ) {
                root.innerHTML = `
                <div class="ch-empty">
                    <i class="fa-solid fa-calendar-day"></i>
                    <h3>${isAR?'لا يوجد تحدي يومي اليوم':'No daily challenge today'}</h3>
                    <p>${isAR?'إدارة المنصة بتجهز سؤال جديد — تابعنا وارجع بكرة 🎯':"We're preparing a new question — check back tomorrow 🎯"}</p>
                </div>`;
                return;
            }
            const attempt = _dcAttemptsCache[dailyQ.id];
            if (attempt) {
                root.innerHTML = `
                <div class="ch-end" style="padding:26px 20px;">
                    <i class="fa-solid ${attempt.correct?'fa-circle-check':'fa-circle-xmark'} big" style="color:${attempt.correct?'#27a346':'#e74c3c'};"></i>
                    <h2>${attempt.correct?(isAR?'🎉 إجابة صحيحة!':'🎉 Correct answer!'):(isAR?'❌ إجابة غير صحيحة':'❌ Incorrect answer')}</h2>
                    ${attempt.correct ? `<div class="ch-final-coins"><i class="fa-solid fa-coins"></i> ${attempt.coinsAwarded}</div>` : ''}
                    <p>${attempt.correct
                        ? (isAR?`حصلت على ${attempt.coinsAwarded} عملة 🪙`:`You earned ${attempt.coinsAwarded} coins 🪙`)
                        : (isAR?'حظ أوفر في التحدي القادم! 🍀':'Better luck in the next challenge! 🍀')}</p>
                    <p style="margin-top:10px;font-size:12.5px;color:var(--muted);"><i class="fa-solid fa-moon"></i> ${isAR?'خلصت تحدي اليوم — التحدي الجديد هيتجدد بكرة، تعالى تاني! 👋':"You're done for today — a new challenge unlocks tomorrow, see you then! 👋"}</p>
                </div>`;
                return;
            }
            _dcState = { question: dailyQ, selected: null, locked: false, inModal: false };
            dcRenderQuestion(root, dailyQ, false, 'dcDailyCard');
        }

        function dcRenderQuestion(root, q, isWeekly, containerId) {
            const isAR = lang === 'AR';
            const letters = isAR ? ['أ','ب','ج','د'] : ['A','B','C','D'];
            const opts = isAR ? (q.optionsAR||[]) : (q.optionsEN||q.optionsAR||[]);
            const qText = isAR ? q.questionAR : (q.questionEN || q.questionAR);
            const optsHTML = opts.map((opt, i) => `
                <button class="ch-opt" onclick="dcSelectOption(${i})">
                    <span class="ltr">${letters[i]}</span> <span>${escapeHtml(opt)}</span>
                </button>`).join('');
            root.innerHTML = `
            <div class="ch-top">
                <div class="ch-level">${isWeekly?(isAR?'سؤال الأسبوع':'Weekly Question'):(isAR?'سؤال اليوم':"Today's Question")}</div>
                <div class="ch-coins-pill"><i class="fa-solid fa-coins"></i> ${q.coins||0} ${isAR?'عملة':'coins'}</div>
            </div>
            <div class="ch-question-card"><h3>${escapeHtml(qText)}</h3></div>
            <div class="ch-options">${optsHTML}</div>
            <div class="ch-actions-row">
                <button class="ch-lock-btn" id="${containerId}LockBtn" disabled onclick="dcLockAnswer()">${isAR?'تأكيد الإجابة':'Lock In Answer'}</button>
            </div>`;
        }

        /* ═══════════════════════════════════════════════════════════
           TREASURE-MAP CHALLENGE JOURNEY
           كل يوم = دايرة (سؤال اليوم). 7 دواير صح ورا بعض = صندوق الكنز
           (سؤال أسبوعي بـ 70 عملة). الدايرة الجاية بتفتح مع بداية اليوم
           الجديد بتوقيت القاهرة، والإجابة الصح بتظهر بعد ما تجاوب.
           ═══════════════════════════════════════════════════════════ */
        const DC_SEG = 7;
        const DC_WEEKLY_DEFAULT_COINS = 70;
        const DC_ISLANDS_AR = ['شاطئ البداية','وادي الخرائط','غابة الإحداثيات','جبال الارتفاعات','صحراء الأقمار','جزيرة الكنز'];
        const DC_ISLANDS_EN = ['Starter Shore','Map Valley','Coordinate Forest','Contour Mountains','Satellite Desert','Treasure Isle'];

        /* ── ساعة السيرفر: اليوم بيتحسب من وقت Firestore مش من ساعة جهاز الطالب ──
           بنكتب serverTimestamp() في مستند الطالب بتاع الساعة ونقراه، ونحفظ الفرق بين وقت السيرفر
           وعدّاد performance.now() (عدّاد ثابت مبيتأثرش لو الطالب غيّر ساعة الجهاز بعد كده). */
        /* الساعة نفسها (الـ sync) معرّفة جوه الـ module (window._dcSyncClock) لأنها محتاجة Firestore؛
           هنا بس بنقرا الحالة المشتركة window._dcClock. */
        function dcNow() {
            const c = window._dcClock;
            if (!c || c.base === null) return new Date();
            return new Date(c.base + (performance.now() - c.perf));
        }
        function dcCairoToday() {
            try {
                return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dcNow());
            } catch (e) { return dcTodayStr(); }
        }
        window.dcCairoToday = dcCairoToday;
        function dcSecondsToCairoMidnight() {
            try {
                const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(dcNow());
                const g = t => parseInt(parts.find(p => p.type === t).value, 10) % 24;
                return 86400 - (g('hour') * 3600 + g('minute') * 60 + g('second'));
            } catch (e) {
                const d = new Date();
                return 86400 - (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
            }
        }

        function dcInjectJourneyStyles() {
            if (document.getElementById('tmStyles')) return;
            const style = document.createElement('style');
            style.id = 'tmStyles';
            style.textContent = `
                .tm-top { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:14px; }
                .tm-stat { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:14px; background:linear-gradient(160deg,var(--bg3),var(--bg2)); border:1px solid var(--border); }
                .tm-stat > i { font-size:20px; color:var(--gold3); width:24px; text-align:center; }
                .tm-stat b { display:block; font-size:16px; font-weight:900; line-height:1.2; }
                .tm-stat span { font-size:11.5px; color:var(--muted); }
                .tm-rules { margin-bottom:16px; border:1px dashed var(--border2); border-radius:14px; padding:10px 14px; font-size:12.5px; color:var(--muted); }
                .tm-rules summary { cursor:pointer; font-weight:800; color:var(--text); list-style:none; display:flex; align-items:center; gap:8px; }
                .tm-rules summary::-webkit-details-marker { display:none; }
                .tm-rules ul { margin:10px 0 2px; padding-inline-start:18px; line-height:1.9; }

                .tm-island { position:relative; border-radius:26px; border:1px solid var(--border2); padding:22px 16px 10px; margin-bottom:18px; overflow:hidden;
                    background: radial-gradient(520px 240px at 88% 0%, rgba(240,192,64,.10), transparent 62%), radial-gradient(440px 280px at 0% 100%, rgba(var(--brand2-rgb,39,163,70),.15), transparent 62%), var(--bg2); }
                .tm-island::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.9;
                    background: repeating-radial-gradient(circle at 82% 18%, transparent 0 26px, rgba(240,192,64,.05) 27px 28px), repeating-radial-gradient(circle at 10% 90%, transparent 0 30px, rgba(var(--brand2-rgb,39,163,70),.06) 31px 32px); }
                .tm-island.tm-future { opacity:.7; }
                .tm-island-head { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; padding:0 4px; }
                .tm-island-title { font-size:14.5px; font-weight:900; display:flex; align-items:center; gap:8px; }
                .tm-island-title i { color:var(--gold3); }
                .tm-island-title small { font-size:11px; color:var(--muted); font-weight:700; }
                .tm-badge { font-size:11.5px; font-weight:800; padding:4px 11px; border-radius:99px; background:rgba(var(--brand2-rgb,39,163,70),.14); border:1px solid rgba(var(--brand2-rgb,39,163,70),.35); color:var(--g4); white-space:nowrap; }
                .tm-badge.gold { background:rgba(240,192,64,.14); border-color:rgba(240,192,64,.4); color:var(--gold4); }

                .tm-path { position:relative; z-index:1; direction:ltr; height:450px; }
                .tm-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
                .tm-base { fill:none; stroke:var(--muted); opacity:.5; stroke-width:3.5; stroke-dasharray:3 10; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
                .tm-prog { fill:none; stroke:var(--g4); stroke-width:5; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; filter:drop-shadow(0 0 6px rgba(var(--brand2-rgb,39,163,70),.55)); }

                .tm-node { position:absolute; transform:translate(-50%,-50%); width:100px; text-align:center; cursor:pointer; -webkit-tap-highlight-color:transparent; }
                .tm-node.tm-static { cursor:default; }
                .tm-circle { position:relative; width:74px; height:74px; margin:0 auto; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:23px;
                    background:var(--bg3); color:var(--muted); border:3px solid var(--border2); transition:transform .2s ease, box-shadow .2s ease; }
                .tm-node:not(.tm-static):hover .tm-circle { transform:scale(1.08); }
                .tm-label { margin-top:8px; font-size:13px; font-weight:800; color:var(--text); direction:rtl; white-space:nowrap; }
                .tm-sub { font-size:11.5px; color:var(--muted); direction:rtl; }

                .tm-correct .tm-circle { background:linear-gradient(135deg,var(--g3),var(--g4)); border-color:#7be495; color:#fff; box-shadow:0 6px 18px -6px rgba(39,163,70,.7); }
                .tm-wrong .tm-circle { background:linear-gradient(135deg,#a8241c,#e74c3c); border-color:#ff9a8f; color:#fff; box-shadow:0 6px 18px -6px rgba(231,76,60,.6); }
                .tm-current .tm-circle { background:linear-gradient(135deg,var(--gold3),var(--gold4)); border-color:#fff3c4; color:#2b1e00; animation:tmPulse 1.8s ease-in-out infinite; }
                .tm-missed .tm-circle { background:transparent; border-style:dashed; opacity:.7; }
                .tm-locked .tm-circle, .tm-empty .tm-circle { opacity:.55; }

                .tm-chest .tm-circle { width:92px; height:92px; border-radius:28px; font-size:34px; }
                .tm-chest.tm-ready .tm-circle { background:linear-gradient(135deg,var(--gold3),var(--gold4)); border-color:#fff3c4; color:#2b1e00; animation:tmPulse 1.6s ease-in-out infinite; }
                .tm-chest.tm-correct .tm-circle { background:linear-gradient(135deg,var(--gold2),var(--gold4)); border-color:#fff3c4; color:#2b1e00; box-shadow:0 8px 24px -6px rgba(240,192,64,.7); }
                .tm-chest.tm-failed .tm-circle { filter:grayscale(1); opacity:.5; }
                .tm-chest .tm-lock { position:absolute; bottom:-6px; inset-inline-end:-6px; width:24px; height:24px; border-radius:50%; background:var(--bg); border:2px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--muted); }

                .tm-pin { position:absolute; left:50%; top:-48px; width:38px; height:38px; margin-left:-19px; border-radius:50%; background:#fff; color:var(--g2); display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 6px 16px rgba(0,0,0,.4); animation:tmBob 1.6s ease-in-out infinite; z-index:3; }
                .tm-pin::after { content:''; position:absolute; bottom:-6px; left:50%; margin-left:-6px; border:6px solid transparent; border-bottom:0; border-top-color:#fff; }

                @keyframes tmPulse { 0%,100% { box-shadow:0 0 0 0 rgba(240,192,64,.55); } 50% { box-shadow:0 0 0 14px rgba(240,192,64,0); } }
                @keyframes tmBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }

                .tm-modal-box { background:var(--card); border:1px solid var(--border); border-radius:20px; max-width:560px; width:100%; padding:22px; }
                .tm-result { margin-top:16px; padding:16px; border-radius:14px; text-align:center; border:1px solid var(--border); background:var(--bg3); }
                .tm-result.ok { border-color:rgba(39,163,70,.45); background:rgba(39,163,70,.1); }
                .tm-result.bad { border-color:rgba(231,76,60,.4); background:rgba(231,76,60,.08); }
                .tm-result h4 { font-size:15px; font-weight:900; margin-bottom:6px; }
                .tm-result p { font-size:12.5px; color:var(--muted); line-height:1.8; }
                .tm-result .tm-coins { display:inline-flex; align-items:center; gap:6px; margin-top:8px; font-weight:900; color:var(--gold4); }
                .tm-continue { margin-top:14px; padding:11px 28px; border:none; border-radius:99px; font-weight:800; font-size:13.5px; font-family:'Tajawal',sans-serif; cursor:pointer; color:#fff; background:linear-gradient(135deg,var(--g3),var(--g2)); }
                .tm-review-tag { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:800; padding:5px 12px; border-radius:99px; margin-bottom:12px; }
                .tm-review-tag.ok { background:rgba(39,163,70,.14); color:var(--g4); }
                .tm-review-tag.bad { background:rgba(231,76,60,.14); color:#ff7b6e; }
                .tm-review-tag.miss { background:rgba(255,255,255,.06); color:var(--muted); }
                .ch-opt.picked::after { content:'\\2190'; margin-inline-start:auto; font-size:11px; color:var(--muted); }
                @media (max-width:420px) {
                    .tm-node { width:78px; }
                    .tm-circle { width:58px; height:58px; font-size:19px; }
                    .tm-chest .tm-circle { width:72px; height:72px; }
                }
            `;
            document.head.appendChild(style);
        }

        // ── Data ──
        async function dcLoadAllAttempts() {
            let list = [];
            try { list = await window._getMyChallengeAttempts(500); } catch (e) { console.error(e); }
            const map = {};
            list.forEach(a => { map[a.questionId] = a; });
            (_dcQuestions || []).forEach(q => { _dcAttemptsCache[q.id] = map[q.id] || null; });
            return list;
        }

        function dcBuildJourney(today) {
            const qs = _dcQuestions || [];
            const dailies = qs.filter(q => q.type === 'daily' && q.scheduledDate).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
            const weeklies = qs.filter(q => q.type === 'weekly').sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
            const att = id => _dcAttemptsCache[id] || null;
            const nodes = dailies.map((q, i) => {
                const a = att(q.id);
                let status;
                if (a) status = a.correct ? 'correct' : 'wrong';
                else if (q.scheduledDate === today) status = 'current';
                else if (q.scheduledDate < today) status = 'missed';
                else status = 'locked';
                return { kind: 'day', q, a, status, day: (i % DC_SEG) + 1 };
            });
            const totalSegs = Math.max(1, Math.ceil(nodes.length / DC_SEG));
            let lastActive = 0;
            nodes.forEach((n, i) => { if (n.q.scheduledDate <= today) lastActive = Math.floor(i / DC_SEG); });
            const segs = [];
            for (let k = 0; k <= Math.min(lastActive, totalSegs - 1); k++) {
                const segNodes = nodes.slice(k * DC_SEG, k * DC_SEG + DC_SEG);
                const full = segNodes.length === DC_SEG;
                const anyBad = segNodes.some(n => n.status === 'wrong' || n.status === 'missed');
                const allCorrect = full && segNodes.every(n => n.status === 'correct');
                const wq = weeklies[k] || null;
                const wa = wq ? att(wq.id) : null;
                let cs;
                if (anyBad) cs = 'failed';
                else if (allCorrect) cs = !wq ? 'soon' : (wa ? (wa.correct ? 'correct' : 'wrong') : 'ready');
                else cs = 'locked';
                segs.push({ k, nodes: segNodes, chest: { kind: 'chest', q: wq, a: wa, status: cs, coins: wq ? (wq.coins || DC_WEEKLY_DEFAULT_COINS) : DC_WEEKLY_DEFAULT_COINS } });
            }
            return { nodes, segs, weeklies, dailies, lastActive };
        }

        // Is this weekly question's chest currently unlocked for the student? (used before submitting)
        window._dcCanAnswerWeekly = function (questionId) {
            try {
                const J = dcBuildJourney(dcCairoToday());
                const seg = J.segs.find(s => s.chest.q && s.chest.q.id === questionId);
                return !!seg && seg.chest.status === 'ready';
            } catch (e) { return false; }
        };

        // ── Geometry ──
        // خريطة أكبر: صفّين × 4 دواير، كل دايرة أعلى/أوطى من اللي قبلها، والخطوط بينهم زجزاج مستقيم
        const TM_ROW_H = 220, TM_TOP = 112, TM_ZIG = 40, TM_H = 450;
        function tmPos(i) {
            const row = Math.floor(i / 4);
            const col = row % 2 === 0 ? (i % 4) : (3 - (i % 4));
            const zig = (i % 2 === 0) ? -TM_ZIG : TM_ZIG;
            return { row, col, x: (col + 0.5) * 100, y: TM_TOP + row * TM_ROW_H + zig };
        }
        function tmPathD(count) {
            let d = '';
            for (let i = 0; i < count; i++) {
                const p = tmPos(i);
                d += (i === 0 ? 'M ' : ' L ') + p.x + ' ' + p.y;
            }
            return d;
        }

        function tmNodeInner(item, isAR) {
            const icons = {
                correct: 'fa-check', wrong: 'fa-xmark', current: 'fa-play', missed: 'fa-minus', locked: 'fa-lock', empty: 'fa-lock'
            };
            if (item.kind === 'chest') {
                const ic = { locked: 'fa-gem', ready: 'fa-gem', soon: 'fa-gem', correct: 'fa-trophy', wrong: 'fa-gem', failed: 'fa-heart-crack' }[item.status] || 'fa-gem';
                const lock = (item.status === 'locked' || item.status === 'soon') ? `<span class="tm-lock"><i class="fa-solid fa-lock"></i></span>` : '';
                return `<div class="tm-circle"><i class="fa-solid ${ic}"></i>${lock}</div>`;
            }
            if (item.status === 'correct' || item.status === 'wrong' || item.status === 'missed' || item.status === 'locked' || item.status === 'empty') {
                return `<div class="tm-circle"><i class="fa-solid ${icons[item.status]}" style="font-size:16px;"></i></div>`;
            }
            return `<div class="tm-circle">${item.day}</div>`;
        }

        function dcSegmentHTML(seg, avatarKey, isAR) {
            const items = [];
            for (let i = 0; i < DC_SEG; i++) items.push(seg.nodes[i] || { kind: 'day', status: 'empty', day: i + 1 });
            items.push(seg.chest);
            const islandName = (isAR ? DC_ISLANDS_AR : DC_ISLANDS_EN)[seg.k % DC_ISLANDS_AR.length];
            const correctCount = seg.nodes.filter(n => n.status === 'correct').length;
            // path highlights up to the avatar (explorer) position
            let avatarIdx = items.findIndex(it => (it.kind === 'day' ? it.q && it.q.id : 'chest' + seg.k) === avatarKey);
            if (avatarIdx < 0) avatarIdx = 0;
            const nodesHTML = items.map((it, i) => {
                const p = tmPos(i);
                const isChest = it.kind === 'chest';
                let label, sub, click = '';
                if (isChest) {
                    label = isAR ? 'صندوق الكنز' : 'Treasure Chest';
                    sub = `+${it.coins} <i class="fa-solid fa-coins" style="color:var(--gold3);"></i>`;
                    click = `onclick="dcNodeClick('chest','${it.q ? it.q.id : ''}','${it.status}')"`;
                } else if (it.status === 'empty') {
                    label = isAR ? `يوم ${it.day}` : `Day ${it.day}`;
                    sub = isAR ? 'قريباً' : 'Soon';
                } else {
                    label = isAR ? `يوم ${it.day}` : `Day ${it.day}`;
                    sub = it.q.scheduledDate.slice(5).replace('-', '/');
                    click = `onclick="dcNodeClick('day','${it.q.id}','${it.status}')"`;
                }
                const pin = i === avatarIdx ? `<div class="tm-pin"><i class="fa-solid fa-person-hiking"></i></div>` : '';
                const cls = `tm-node ${isChest ? 'tm-chest' : ''} tm-${it.status} ${click ? '' : 'tm-static'}`;
                return `<div class="${cls}" style="left:${(p.col + 0.5) * 25}%;top:${p.y}px;" ${click}>${pin}${tmNodeInner(it, isAR)}<div class="tm-label">${label}</div><div class="tm-sub">${sub}</div></div>`;
            }).join('');
            const progD = avatarIdx > 0 ? tmPathD(avatarIdx + 1) : '';
            const chestBadge = {
                ready: isAR ? '🎁 الصندوق مفتوح!' : '🎁 Chest unlocked!',
                correct: isAR ? '🏆 تم' : '🏆 Done',
                wrong: isAR ? 'تم' : 'Done',
                failed: isAR ? 'الصندوق اتقفل' : 'Chest lost',
                locked: `${correctCount}/${DC_SEG}`,
                soon: isAR ? 'السؤال قريباً' : 'Coming soon'
            }[seg.chest.status];
            return `
            <div class="tm-island">
                <div class="tm-island-head">
                    <div class="tm-island-title"><i class="fa-solid fa-map-location-dot"></i> ${isAR ? 'المرحلة' : 'Stage'} ${seg.k + 1} · ${islandName}</div>
                    <span class="tm-badge ${seg.chest.status === 'ready' ? 'gold' : ''}">${chestBadge}</span>
                </div>
                <div class="tm-path">
                    <svg class="tm-svg" viewBox="0 0 400 ${TM_H}" preserveAspectRatio="none">
                        <path class="tm-base" d="${tmPathD(8)}"/>
                        ${progD ? `<path class="tm-prog" d="${progD}"/>` : ''}
                    </svg>
                    ${nodesHTML}
                </div>
            </div>`;
        }

        async function dcRenderJourney(area) {
            const isAR = lang === 'AR';
            try { await Promise.all([dcLoadAllAttempts(), (window._dcSyncClock ? window._dcSyncClock() : Promise.resolve(false))]); }
            catch (e) { console.error('challenge load error:', e); }
            const today = dcCairoToday();
            const J = dcBuildJourney(today);

            if (!J.dailies.length) {
                area.innerHTML = `
                <div class="page-header"><h2>${isAR ? '🗺️ خريطة التحديات' : '🗺️ Challenge Map'}</h2></div>
                <div class="dc-wrap"><div class="ch-empty">
                    <i class="fa-solid fa-map"></i>
                    <h3>${isAR ? 'الخريطة لسه بتتجهز' : 'The map is being prepared'}</h3>
                    <p>${isAR ? 'إدارة المنصة لسه ما ضافتش أسئلة — ارجع قريب 🎯' : "The team hasn't added questions yet — check back soon 🎯"}</p>
                </div></div>`;
                return;
            }

            // Where the explorer stands: today's open circle, else the latest answered one.
            const curSeg = J.segs[J.segs.length - 1];
            let avatarKey = null;
            const curNode = J.nodes.find(n => n.status === 'current');
            if (curNode) avatarKey = curNode.q.id;
            else {
                const answered = J.nodes.filter(n => n.a).pop();
                avatarKey = answered ? answered.q.id : J.nodes[0].q.id;
            }
            if (curSeg.chest.status === 'ready') avatarKey = 'chest' + curSeg.k;
            // the avatar only lives in its own island
            const avatarSeg = J.segs.find(s => s.nodes.some(n => n.q.id === avatarKey) || ('chest' + s.k) === avatarKey);

            let streak = 0;
            for (const n of curSeg.nodes) { if (n.status === 'correct') streak++; else break; }
            const totalCorrect = J.nodes.filter(n => n.status === 'correct').length;
            let coinsEarned = 0;
            Object.values(_dcAttemptsCache).forEach(a => { if (a && a.correct) coinsEarned += (a.coinsAwarded || 0); });
            const readySeg = J.segs.find(s => s.chest.status === 'ready');
            const todayDone = J.nodes.some(n => n.q.scheduledDate === today && n.a);
            const todayExists = J.nodes.some(n => n.q.scheduledDate === today);

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? '🗺️ خريطة التحديات' : '🗺️ Challenge Map'}</h2>
                <p>${isAR ? 'كل يوم دايرة جديدة — جاوب، واعرف الإجابة الصح، وكمّل رحلتك ناحية الكنز' : 'A new circle every day — answer, learn the right answer, and journey toward the treasure'}</p>
            </div>
            <div class="dc-wrap">
                <div class="tm-top">
                    <div class="tm-stat"><i class="fa-solid fa-fire"></i><div><b>${streak}/${DC_SEG}</b><span>${isAR ? 'أيام صح ورا بعض' : 'Correct in a row'}</span></div></div>
                    <div class="tm-stat"><i class="fa-solid fa-circle-check"></i><div><b>${totalCorrect}</b><span>${isAR ? 'إجابات صح' : 'Correct answers'}</span></div></div>
                    <div class="tm-stat"><i class="fa-solid fa-coins"></i><div><b>${coinsEarned}</b><span>${isAR ? 'عملات من التحديات' : 'Coins earned'}</span></div></div>
                    <div class="tm-stat"><i class="fa-solid fa-hourglass-half"></i><div><b id="tmCountdown" data-day="${today}">--:--:--</b><span>${todayExists && !todayDone ? (isAR ? 'سؤال النهارده مستنيك' : "Today's question awaits") : (isAR ? 'للدايرة الجاية' : 'Until next circle')}</span></div></div>
                </div>
                <details class="tm-rules">
                    <summary><i class="fa-solid fa-circle-question" style="color:var(--gold3);"></i> ${isAR ? 'إزاي تلعب؟' : 'How to play'}</summary>
                    <ul>
                        <li>${isAR ? 'كل يوم بتفتح دايرة جديدة فيها سؤال واحد، وبتتجدد الساعة 12 بالليل بتوقيت القاهرة.' : 'A new circle with one question opens every day at midnight (Cairo time).'}</li>
                        <li>${isAR ? 'جاوب صح أو غلط — في الحالتين هتشوف الإجابة الصح عشان تتعلم منها.' : 'Right or wrong, you always see the correct answer so you can learn from it.'}</li>
                        <li>${isAR ? `جاوب ${DC_SEG} أيام صح ورا بعض من غير ما يفوتك يوم، وصندوق الكنز هيفتح لك بسؤال أسبوعي بـ ${DC_WEEKLY_DEFAULT_COINS} عملة 🪙` : `Answer ${DC_SEG} days correctly in a row without missing one and the treasure chest opens with a weekly question worth ${DC_WEEKLY_DEFAULT_COINS} coins 🪙`}</li>
                        <li>${isAR ? 'لو غلطت أو فاتك يوم، الصندوق بتاع المرحلة دي بيتقفل وتبدأ مرحلة جديدة.' : 'If you miss a day or answer wrong, that stage\'s chest locks and a new stage begins.'}</li>
                    </ul>
                </details>
                ${readySeg ? `<div class="tm-rules" style="border-style:solid;border-color:rgba(240,192,64,.5);background:rgba(240,192,64,.08);color:var(--text);font-weight:800;"><i class="fa-solid fa-gift" style="color:var(--gold4);margin-inline-end:8px;"></i>${isAR ? `صندوق الكنز في المرحلة ${readySeg.k + 1} مفتوح — اضغط عليه وجاوب سؤال الأسبوع واكسب ${readySeg.chest.coins} عملة!` : `The Stage ${readySeg.k + 1} treasure chest is open — tap it and win ${readySeg.chest.coins} coins!`}</div>` : ''}
                ${J.segs.map(s => dcSegmentHTML(s, avatarSeg && avatarSeg.k === s.k ? avatarKey : null, isAR)).join('')}
            </div>`;
            dcStartCountdown();
            // bring the explorer into view
            const pin = area.querySelector('.tm-pin');
            if (pin && pin.scrollIntoView) setTimeout(() => pin.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
        }

        function dcStartCountdown() {
            if (window._dcTimer) clearInterval(window._dcTimer);
            const tick = () => {
                const el = document.getElementById('tmCountdown');
                if (!el || window._currentPage !== 'dailychallenge') { clearInterval(window._dcTimer); window._dcTimer = null; return; }
                if (el.dataset.day !== dcCairoToday()) {
                    clearInterval(window._dcTimer); window._dcTimer = null;
                    const area = document.getElementById('contentArea');
                    if (area) dcRenderPage(area);
                    return;
                }
                const s = dcSecondsToCairoMidnight();
                const pad = n => String(n).padStart(2, '0');
                el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
            };
            tick();
            window._dcTimer = setInterval(tick, 1000);
        }

        // ── Interactions ──
        window.dcNodeClick = function (kind, id, status) {
            const isAR = lang === 'AR';
            if (status === 'current' || status === 'ready') { dcOpenWeeklyQuestion(id); return; }
            if (status === 'correct' || status === 'wrong' || status === 'missed') { if (id) dcOpenReview(id, status); return; }
            let msg = '';
            if (kind === 'chest') {
                if (status === 'failed') msg = isAR ? 'الصندوق ده اتقفل لأنك غلطت أو فاتك يوم — كمّل المرحلة الجاية 💪' : 'This chest locked after a wrong or missed day — go for the next stage 💪';
                else if (status === 'soon') msg = isAR ? 'سؤال الصندوق لسه بيتجهز — ارجع قريب 🎁' : 'The chest question is being prepared — check back soon 🎁';
                else msg = isAR ? `جاوب ${DC_SEG} أيام صح ورا بعض عشان الصندوق يفتح 🔒` : `Answer ${DC_SEG} days correctly in a row to open the chest 🔒`;
            } else {
                const q = (_dcQuestions || []).find(x => x.id === id);
                msg = isAR ? `الدايرة دي هتفتح يوم ${q ? q.scheduledDate : ''} 🔒` : `This circle opens on ${q ? q.scheduledDate : ''} 🔒`;
            }
            if (msg) showToast(msg);
        };

        function dcMakeModal(innerHtml, boxId) {
            document.getElementById('dcWeeklyModalOverlay')?.remove();
            const modal = document.createElement('div');
            modal.id = 'dcWeeklyModalOverlay';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
            modal.onclick = (e) => { if (e.target === modal) dcCloseWeeklyModal(); };
            modal.innerHTML = `<div id="${boxId}" class="ch-wrap tm-modal-box" onclick="event.stopPropagation()">${innerHtml}</div>`;
            document.body.appendChild(modal);
            return document.getElementById(boxId);
        }

        // Opens a question (today's daily circle OR an unlocked weekly chest) in a modal.
        window.dcOpenWeeklyQuestion = function (questionId) {
            const q = (_dcQuestions || []).find(x => x.id === questionId);
            if (!q) return;
            const box = dcMakeModal('', 'dcWeeklyModal');
            _dcState = { question: q, selected: null, locked: false, inModal: true };
            dcRenderQuestion(box, q, q.type === 'weekly', 'dcWeeklyModal');
        };
        window.dcCloseWeeklyModal = function () {
            document.getElementById('dcWeeklyModalOverlay')?.remove();
        };

        // Shows an already-answered (or missed) question with the correct answer revealed.
        window.dcOpenReview = async function (questionId, status) {
            const isAR = lang === 'AR';
            const q = (_dcQuestions || []).find(x => x.id === questionId);
            if (!q) return;
            const a = _dcAttemptsCache[q.id] || null;
            const letters = isAR ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
            const opts = isAR ? (q.optionsAR || []) : (q.optionsEN || q.optionsAR || []);
            const qText = isAR ? q.questionAR : (q.questionEN || q.questionAR);
            let keyIdx = typeof q.correctIndex === 'number' ? q.correctIndex : null;
            if (keyIdx === null && a) keyIdx = await window._getChallengeKey(q.id);
            const hasKey = typeof keyIdx === 'number';
            const optsHTML = opts.map((opt, i) => {
                let cls = 'disabled';
                if (hasKey && i === keyIdx) cls += ' correct';
                else if (a && a.selectedIndex === i && !a.correct) cls += ' wrong';
                return `<button class="ch-opt ${cls}"><span class="ltr">${letters[i]}</span> <span>${escapeHtml(opt)}</span></button>`;
            }).join('');
            const tag = status === 'correct'
                ? `<span class="tm-review-tag ok"><i class="fa-solid fa-circle-check"></i> ${isAR ? 'جاوبت صح' : 'You answered correctly'}</span>`
                : status === 'wrong'
                    ? `<span class="tm-review-tag bad"><i class="fa-solid fa-circle-xmark"></i> ${isAR ? 'إجابتك كانت غلط — الصح مظلل بالأخضر' : 'Your answer was wrong — the right one is in green'}</span>`
                    : `<span class="tm-review-tag miss"><i class="fa-solid fa-moon"></i> ${isAR ? 'فاتك اليوم ده — دي الإجابة الصح' : 'You missed this day — here is the right answer'}</span>`;
            dcMakeModal(`
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div class="ch-level">${q.type === 'weekly' ? (isAR ? 'سؤال الصندوق' : 'Chest Question') : `${isAR ? 'سؤال يوم' : 'Question of'} ${q.scheduledDate}`}</div>
                    <button onclick="dcCloseWeeklyModal()" style="background:none;border:none;color:var(--muted);font-size:17px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                ${tag}
                <div class="ch-question-card"><h3>${escapeHtml(qText)}</h3></div>
                <div class="ch-options">${optsHTML}</div>
                ${a && a.correct ? `<div class="tm-result ok"><div class="tm-coins"><i class="fa-solid fa-coins"></i> +${a.coinsAwarded || 0}</div></div>` : ''}
            `, 'dcReviewBox');
        };

        // Called by dcLockAnswer after a modal answer is saved: shows the result in place
        // (correct option stays highlighted) instead of closing the modal immediately.
        function dcShowModalResult(box, q, result) {
            const isAR = lang === 'AR';
            if (!box) return;
            const row = box.querySelector('.ch-actions-row');
            if (row) row.remove();
            const weekly = q.type === 'weekly';
            const div = document.createElement('div');
            div.className = 'tm-result ' + (result.correct ? 'ok' : 'bad');
            div.innerHTML = `
                <h4>${result.correct
                    ? (weekly ? (isAR ? '🏆 فتحت صندوق الكنز!' : '🏆 Treasure chest opened!') : (isAR ? '🎉 إجابة صحيحة!' : '🎉 Correct!'))
                    : (isAR ? '❌ إجابة غير صحيحة' : '❌ Incorrect')}</h4>
                <p>${result.correct
                    ? (isAR ? 'كمّل لبكرة — دايرة جديدة هتفتح بعد 12 بالليل.' : 'Keep going — a new circle opens at midnight.')
                    : (isAR ? 'الإجابة الصح متظللة بالأخضر فوق — حظ أوفر بكرة 🍀' : 'The right answer is highlighted in green above — better luck tomorrow 🍀')}</p>
                ${result.correct ? `<div class="tm-coins"><i class="fa-solid fa-coins"></i> +${result.coinsAwarded}</div>` : ''}
                <div><button class="tm-continue" onclick="dcContinueAfterAnswer()">${isAR ? 'متابعة الرحلة' : 'Continue journey'}</button></div>`;
            box.appendChild(div);
        }
        window.dcContinueAfterAnswer = function () {
            dcCloseWeeklyModal();
            const area = document.getElementById('contentArea');
            if (area && window._currentPage === 'dailychallenge') dcRenderPage(area);
        };


        /* ─── CELEBRATION EFFECT (confetti + balloons from both sides) ───
           Pure CSS/JS, no external library. Fires for ~5s then removes itself.
           Used when a student answers today's daily challenge correctly. */
        /* ─── CHALLENGE SOUNDS (Web Audio — synthesized, no audio files needed) ───
           win()  = cheerful fanfare + sparkle + applause burst
           lose() = sad "womp womp" trombone
           unlock() must run inside a user tap so mobile browsers allow playback later. */
        window._chAudio = (function () {
            let ctx = null;
            const enabled = () => { try { return localStorage.getItem('atlasya_sound') !== 'off'; } catch (e) { return true; } };
            function get() {
                try {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    if (!AC) return null;
                    if (!ctx) ctx = new AC();
                    if (ctx.state === 'suspended') ctx.resume();
                    return ctx;
                } catch (e) { return null; }
            }
            function tone(c, o) {
                const t0 = c.currentTime + (o.at || 0);
                const osc = c.createOscillator();
                const g = c.createGain();
                osc.type = o.type || 'sine';
                osc.frequency.setValueAtTime(o.f, t0);
                if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.d);
                let node = osc;
                if (o.lp) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; osc.connect(lp); node = lp; }
                const v = o.v || 0.18;
                g.gain.setValueAtTime(0.0001, t0);
                g.gain.exponentialRampToValueAtTime(v, t0 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
                node.connect(g); g.connect(c.destination);
                if (o.vib) {
                    const lfo = c.createOscillator(), lg = c.createGain();
                    lfo.frequency.value = 6; lg.gain.value = o.vib;
                    lfo.connect(lg); lg.connect(osc.frequency);
                    lfo.start(t0); lfo.stop(t0 + o.d + 0.05);
                }
                osc.start(t0); osc.stop(t0 + o.d + 0.05);
            }
            function noise(c, at, d, v) {
                const t0 = c.currentTime + at;
                const len = Math.floor(c.sampleRate * d);
                const buf = c.createBuffer(1, len, c.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
                const src = c.createBufferSource(); src.buffer = buf;
                const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.7;
                const g = c.createGain();
                g.gain.setValueAtTime(0.0001, t0);
                g.gain.exponentialRampToValueAtTime(v, t0 + 0.08);
                g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
                src.connect(bp); bp.connect(g); g.connect(c.destination);
                src.start(t0);
            }
            return {
                unlock() { if (enabled()) get(); },
                win() {
                    if (!enabled()) return; const c = get(); if (!c) return;
                    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, { f, at: i * 0.1, d: 0.22, type: 'triangle', v: 0.2 }));
                    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(c, { f, at: 0.45, d: 0.9, type: 'triangle', v: 0.12 }));
                    [1318.5, 1568, 2093].forEach((f, i) => tone(c, { f, at: 0.5 + i * 0.09, d: 0.25, type: 'sine', v: 0.08 }));
                    noise(c, 0.35, 0.9, 0.12);
                },
                lose() {
                    if (!enabled()) return; const c = get(); if (!c) return;
                    [233.08, 220, 207.65].forEach((f, i) => tone(c, { f, to: f * 0.97, at: i * 0.38, d: 0.34, type: 'sawtooth', lp: 700, v: 0.16 }));
                    tone(c, { f: 196, to: 150, at: 1.14, d: 0.95, type: 'sawtooth', lp: 650, v: 0.16, vib: 5 });
                }
            };
        })();

        /* ─── CELEBRATION EFFECT (confetti + balloons) ───
           Pure CSS/JS, no external library. Fires for ~5s then removes itself.
           Desktop: from both sides. Mobile: spread over the whole screen width. */
        window._fireCelebration = function() {
            if (document.getElementById('celebrateOverlay')) return; // avoid stacking
            if (!document.getElementById('celebrateStyleTag')) {
                const style = document.createElement('style');
                style.id = 'celebrateStyleTag';
                style.textContent = `
                #celebrateOverlay { position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; overflow: hidden; }
                .confetti-piece {
                    position: absolute; top: -20px; width: 9px; height: 14px; opacity: 0.95;
                    animation: confettiFall 3.2s ease-in forwards;
                }
                @keyframes confettiFall {
                    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) translateX(var(--drift,0px)) rotate(720deg); opacity: 0; }
                }
                .balloon-piece {
                    position: absolute; bottom: -80px; font-size: 38px; line-height: 1;
                    animation: balloonRise 4.6s ease-out forwards;
                }
                @keyframes balloonRise {
                    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-115vh) translateX(var(--drift,0px)) rotate(var(--rot,10deg)); opacity: 0; }
                }`;
                document.head.appendChild(style);
            }
            const overlay = document.createElement('div');
            overlay.id = 'celebrateOverlay';
            document.body.appendChild(overlay);

            const mobile = window.innerWidth < 700;
            const colors = ['#1a7f99','#26948c','#166088','#d4a017','#f0c040','#e74c3c','#9b59b6','#f39c12','#2ecc71'];
            const nConf = mobile ? 70 : 60;
            for (let i = 0; i < nConf; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                const fromLeft = i % 2 === 0;
                piece.style.left = (mobile ? (Math.random()*98) : (fromLeft ? (Math.random()*18) : (82 + Math.random()*18))) + 'vw';
                piece.style.background = colors[Math.floor(Math.random()*colors.length)];
                piece.style.setProperty('--drift', ((Math.random()*160)-80)+'px');
                piece.style.animationDelay = (Math.random()*0.8) + 's';
                piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                overlay.appendChild(piece);
            }
            const balloonEmojis = ['🎈','🎈','🎉','🎊'];
            const nBal = mobile ? 16 : 14;
            for (let i = 0; i < nBal; i++) {
                const b = document.createElement('div');
                b.className = 'balloon-piece';
                const fromLeft = i % 2 === 0;
                b.style.left = (mobile ? (2 + Math.random()*86) : (fromLeft ? (Math.random()*15) : (85 + Math.random()*15))) + 'vw';
                b.textContent = balloonEmojis[Math.floor(Math.random()*balloonEmojis.length)];
                b.style.setProperty('--drift', ((fromLeft?1:-1) * (40+Math.random()*100))+'px');
                b.style.setProperty('--rot', ((Math.random()*40)-20)+'deg');
                b.style.animationDelay = (Math.random()*0.6) + 's';
                overlay.appendChild(b);
            }
            setTimeout(() => overlay.remove(), 5200);
        };