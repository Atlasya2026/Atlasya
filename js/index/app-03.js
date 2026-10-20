
        window.dcSelectOption = function(i) {
            const st = _dcState;
            if (!st || st.locked) return;
            st.selected = i;
            try { window._chAudio.unlock(); } catch (e) {}
            const containerId = st.inModal ? 'dcWeeklyModal' : 'dcDailyCard';
            const container = document.getElementById(containerId);
            if (container) container.querySelectorAll('.ch-opt').forEach((el, idx) => el.classList.toggle('selected', idx === i));
            const lockBtn = document.getElementById(containerId + 'LockBtn');
            if (lockBtn) lockBtn.disabled = false;
        };

        window.dcLockAnswer = async function() {
            const isAR = lang === 'AR';
            const st = _dcState;
            if (!st || st.locked || st.selected === null) return;
            st.locked = true;
            try { window._chAudio.unlock(); } catch (e) {}
            const q = st.question;
            const containerId = st.inModal ? 'dcWeeklyModal' : 'dcDailyCard';
            const container = document.getElementById(containerId);
            if (container) {
                container.querySelectorAll('.ch-opt').forEach((el) => {
                    el.classList.add('disabled'); el.onclick = null;
                });
            }
            const lockBtn = document.getElementById(containerId + 'LockBtn');
            if (lockBtn) { lockBtn.disabled = true; lockBtn.innerHTML = '<div class="spinner"></div>'; }

            let result;
            try { result = await window._submitDailyChallengeAnswer(q, st.selected); }
            catch(e) {
                console.error('submitDailyChallengeAnswer error:', e);
                showToast(window.explainFirestoreError(e, isAR), true);
                st.locked = false;
                if (lockBtn) { lockBtn.disabled = false; lockBtn.innerHTML = isAR?'تأكيد الإجابة':'Lock In Answer'; }
                return;
            }
            _dcAttemptsCache[q.id] = { correct: result.correct, coinsAwarded: result.coinsAwarded };
            if (container && typeof result.correctIndex === 'number') {
                container.querySelectorAll('.ch-opt').forEach((el, idx) => {
                    if (idx === result.correctIndex) el.classList.add('correct');
                    else if (idx === st.selected) el.classList.add('wrong');
                });
            }
            if (result.correct) {
                window._fireCelebration();
                try { window._chAudio.win(); } catch (e) {}
            } else {
                try { window._chAudio.lose(); } catch (e) {}
            }
            showToast(result.correct
                ? (isAR?`🎉 إجابة صحيحة! حصلت على ${result.coinsAwarded} عملة`:`🎉 Correct! You earned ${result.coinsAwarded} coins`)
                : (isAR?'❌ إجابة غير صحيحة. حظ أوفر في التحدي القادم! 🍀':'❌ Incorrect. Better luck in the next challenge! 🍀'));
            if (result.weeklyBonus && result.weeklyBonus.coinsAwarded > 0) {
                setTimeout(() => showToast(isAR?`🏆 أكملت تحدي الأسبوع! حصلت على ${result.weeklyBonus.coinsAwarded} عملة إضافية`:`🏆 Weekly challenge complete! +${result.weeklyBonus.coinsAwarded} bonus coins`), 1600);
            }
            if (st.inModal) {
                dcShowModalResult(container, q, result);
            } else {
                // Let the confetti/balloons play (~5s) before flipping to the
                // "you're done for today, come back tomorrow" summary card.
                setTimeout(() => dcRenderDailyCard(q), result.correct ? 5000 : 0);
            }
        };

        function dcRenderWeeklyStrip(weekQs, todayStr) {
            const root = document.getElementById('dcwStrip');
            if (!root) return;
            const isAR = lang === 'AR';
            const dayNamesAR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
            const dayNamesEN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            root.innerHTML = weekQs.map(q => {
                const d = new Date(q.scheduledDate + 'T00:00:00');
                const dayName = isAR ? dayNamesAR[d.getDay()] : dayNamesEN[d.getDay()];
                const attempt = _dcAttemptsCache[q.id];
                let cls, icon, clickable = false;
                if (attempt) {
                    cls = attempt.correct ? 'done-correct' : 'done-wrong';
                    icon = attempt.correct ? 'fa-check' : 'fa-xmark';
                } else if (q.scheduledDate === todayStr) {
                    cls = 'clickable'; icon = 'fa-play'; clickable = true;
                } else if (q.scheduledDate < todayStr) {
                    cls = 'locked'; icon = 'fa-minus';
                } else {
                    cls = 'locked'; icon = 'fa-lock';
                }
                return `<div class="dcw-day ${cls}" ${clickable?`onclick="dcOpenWeeklyQuestion('${q.id}')"`:''}>
                    <div class="dname">${dayName}</div>
                    <div class="ddate">${q.scheduledDate.slice(5)}</div>
                    <i class="fa-solid ${icon} dicon"></i>
                    <div class="dcoins"><i class="fa-solid fa-coins"></i> ${q.coins||0}</div>
                </div>`;
            }).join('');
        }

        function dcRenderBonusBanner(weekQs, claimed) {
            const root = document.getElementById('dcwBonusBanner');
            if (!root) return;
            const isAR = lang === 'AR';
            const bonus = _dcWeeklySettings?.bonusCoins || 0;
            if (!_dcWeeklySettings?.enabled || !bonus) { root.style.display = 'none'; return; }
            root.innerHTML = claimed
                ? `<i class="fa-solid fa-circle-check"></i> <span>${isAR?`🏆 أكملت تحدي الأسبوع وحصلت على ${claimed.coinsAwarded} عملة إضافية`:`🏆 You completed the weekly challenge and earned ${claimed.coinsAwarded} bonus coins`}</span>`
                : `<i class="fa-solid fa-gift"></i> <span>${isAR?`جاوب صح على كل أسئلة الأسبوع (${weekQs.length}) عشان تاخد ${bonus} عملة إضافية`:`Answer all ${weekQs.length} questions this week correctly to earn ${bonus} bonus coins`}</span>`;
        }



        /* ─── FORTUNE WHEEL & GIFT WHEEL (UI) ─── */
        const WHEEL_BASIC_ORDER = ['coin1','coin2','coin3','extraSpin','gift','lose1','lose2'];
        const WHEEL_GIFT_ORDER  = ['promonth','tempfeature','discount','boost'];
        const WHEEL_BASIC_COLORS = ['#d4a017','#e0b52b','#c99310','#1e7a34','#a8781f','#2a2a33','#33333d'];
        const WHEEL_GIFT_COLORS  = ['#d4a017','#1e7a34','#7a3fc9','#c93f5a'];
        let _wheelState = null;
        let _wheelBasicRot = 0;
        let _wheelGiftRot = 0;
        let _wheelCountdownTimer = null;
        let _wheelSpinning = false;

        function wheelSlotMeta(key, isAR, cfg) {
            cfg = cfg || {};
            const M = {
                coin1: { emoji:'🪙', short:`${cfg.amount||0}`, fullAR:`${cfg.amount||0} عملة`, fullEN:`${cfg.amount||0} coins` },
                coin2: { emoji:'🪙', short:`${cfg.amount||0}`, fullAR:`${cfg.amount||0} عملة`, fullEN:`${cfg.amount||0} coins` },
                coin3: { emoji:'🪙', short:`${cfg.amount||0}`, fullAR:`${cfg.amount||0} عملة`, fullEN:`${cfg.amount||0} coins` },
                extraSpin: { emoji:'🔄', short:isAR?'لفة زيادة':'Extra Spin', fullAR:'لفة إضافية', fullEN:'Extra Spin' },
                gift: { emoji:'🎁', short:isAR?'هدية':'Gift', fullAR:'هدية مفاجأة', fullEN:'Surprise Gift' },
                lose1: { emoji:'😔', short:isAR?'حاول تاني':'Try Again', fullAR:'حاول مرة أخرى', fullEN:'Try Again' },
                lose2: { emoji:'🍀', short:isAR?'حظ أوفر':'Better Luck', fullAR:'حظ أوفر في المرة القادمة', fullEN:'Better Luck Next Time' },
                promonth: { emoji:'👑', short:isAR?`${cfg.months||1} شهر PRO`:`${cfg.months||1}mo PRO`, fullAR:`${cfg.months||1} ${(cfg.months||1)===1?'شهر':'أشهر'} PRO مجاناً`, fullEN:`${cfg.months||1} month(s) PRO free` },
                tempfeature: { emoji:'🔓', short:isAR?'ميزة مؤقتة':'Temp Unlock', fullAR:`فتح ميزة لمدة ${cfg.hours||24} ساعة`, fullEN:`Unlock for ${cfg.hours||24}h` },
                discount: { emoji:'🎟️', short:`${cfg.percent||10}%`, fullAR:`خصم ${cfg.percent||10}%`, fullEN:`${cfg.percent||10}% off` },
                boost: { emoji:'⚡', short:`×${cfg.multiplier||2}`, fullAR:`مضاعفة ×${cfg.multiplier||2}`, fullEN:`×${cfg.multiplier||2} boost` }
            };
            return M[key] || { emoji:'❔', short:'', fullAR:'', fullEN:'' };
        }

        // Formats a single wheel_spins record for the history modal. Uses the amounts/details
        // actually saved on the record (coinsAwarded, extra) rather than the current live wheel
        // config, since config values (coin amounts, month counts, etc.) can change over time.
        function wheelHistoryLabel(entry, isAR) {
            const rt = entry.resultType;
            if (entry.wheelType !== 'gift') {
                if (rt === 'coin1' || rt === 'coin2' || rt === 'coin3') {
                    return { emoji: '🪙', text: isAR ? `${entry.coinsAwarded||0} عملة` : `${entry.coinsAwarded||0} coins` };
                }
                if (rt === 'extraSpin') return { emoji: '🔄', text: isAR ? 'لفة إضافية' : 'Extra spin' };
                if (rt === 'gift') return { emoji: '🎁', text: isAR ? 'فتح عجلة الهدايا المفاجئة' : 'Unlocked the surprise gift wheel' };
                if (rt === 'lose1' || rt === 'lose2') return { emoji: '🍀', text: isAR ? 'حظ أوفر في المرة القادمة' : 'Better luck next time' };
                return { emoji: '🎡', text: isAR ? 'العجلة الأساسية' : 'Basic wheel' };
            }
            const extra = entry.extra || {};
            if (rt === 'promonth') {
                const months = extra.months || 1;
                return { emoji: '👑', text: isAR ? `${months} ${months===1?'شهر':'أشهر'} من ATLASYA PRO مجاناً` : `${months} month(s) of ATLASYA PRO free` };
            }
            if (rt === 'tempfeature') {
                const hours = extra.hours || 24;
                const feat = isAR ? (extra.featureAR||'') : (extra.featureEN||'');
                return { emoji: '🔓', text: isAR ? `فتح ميزة${feat?': '+feat:''} لمدة ${hours} ساعة` : `Unlocked${feat?': '+feat:''} for ${hours}h` };
            }
            if (rt === 'discount') {
                const pct = extra.percent || 10;
                return { emoji: '🎟️', text: isAR ? `كود خصم ${pct}%` : `${pct}% discount code` };
            }
            if (rt === 'boost') {
                const mult = extra.multiplier || 2;
                const hrs = extra.hours || 24;
                return { emoji: '⚡', text: isAR ? `مضاعفة عملات ×${mult} لمدة ${hrs} ساعة` : `×${mult} coin boost for ${hrs}h` };
            }
            return { emoji: '🎁', text: isAR ? 'هدية مفاجأة' : 'Surprise gift' };
        }

        // Small "Spin History" button on the wheel page opens this — lists past spins
        // (basic + gift wheel) for the logged-in student, newest first.
        window.openWheelHistoryModal = async function() {
            const isAR = lang === 'AR';
            const modal = document.createElement('div');
            modal.id = 'wheelHistoryModal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:440px;width:100%;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;" onclick="event.stopPropagation()">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0;">
                    <h3 style="font-size:14.5px;font-weight:800;margin:0;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'سجل عجلة الحظ':'Wheel Spin History'}</h3>
                    <button onclick="document.getElementById('wheelHistoryModal').remove()" style="background:none;border:none;color:var(--muted);font-size:17px;cursor:pointer;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="wheelHistoryBody" style="padding:8px 20px 16px;overflow-y:auto;">
                    <div style="text-align:center;padding:24px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>`;
            document.body.appendChild(modal);

            try {
                const rows = await window._loadWheelSpinsHistory(window._currentUid, 50);
                const body = document.getElementById('wheelHistoryBody');
                if (!body) return;
                if (!rows.length) {
                    body.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12.5px;">${isAR?'لسه معملتش أي لفة عجلة':"You haven't spun the wheel yet"}</div>`;
                    return;
                }
                body.innerHTML = rows.map(r => {
                    const meta = wheelHistoryLabel(r, isAR);
                    const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                    const wheelLabel = r.wheelType === 'gift' ? (isAR?'عجلة الهدايا':'Gift wheel') : (isAR?'العجلة الأساسية':'Basic wheel');
                    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                        <div style="width:34px;height:34px;border-radius:50%;flex-shrink:0;background:rgba(212,160,23,0.1);display:flex;align-items:center;justify-content:center;font-size:15px;">${meta.emoji}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:12.5px;font-weight:700;">${meta.text}</div>
                            <div style="font-size:10.5px;color:var(--muted);">${wheelLabel} · ${dateStr}</div>
                        </div>
                    </div>`;
                }).join('');
            } catch(e) {
                console.error('wheel history load error:', e);
                const body = document.getElementById('wheelHistoryBody');
                if (body) body.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12.5px;">${isAR?'حدث خطأ أثناء تحميل السجل':'Something went wrong loading history'}</div>`;
            }
        };

        function wheelInjectStyles() {
            if (document.getElementById('wheelStyles')) return;
            const style = document.createElement('style');
            style.id = 'wheelStyles';
            style.textContent = `
                .wh-wrap { max-width: 640px; margin: 0 auto; text-align:center; }
                .wh-banner { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:14px; background:rgba(212,160,23,0.1); border:1px solid rgba(212,160,23,0.3); font-size:12.5px; margin-bottom:14px; text-align:start; }
                .wh-banner i { color:var(--gold3); font-size:18px; flex-shrink:0; }
                .wh-disc-wrap { position:relative; width:300px; height:300px; margin:20px auto; }
                .wh-disc { width:100%; height:100%; border-radius:50%; border:6px solid var(--gold3); box-shadow:0 0 0 4px rgba(212,160,23,0.15), 0 14px 40px rgba(0,0,0,0.4); position:relative; transition: transform 4s cubic-bezier(0.15,0.6,0.15,1); }
                .wh-label { position:absolute; top:50%; left:50%; font-size:11px; font-weight:800; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.7); display:flex; flex-direction:column; align-items:center; gap:1px; width:auto; white-space:nowrap; pointer-events:none; }
                .wh-label .em { font-size:16px; line-height:1; }
                .wh-label .lb { line-height:1; }
                .wh-pointer { position:absolute; top:-14px; left:50%; transform:translateX(-50%); font-size:28px; z-index:5; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
                .wh-hub { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,var(--gold3),var(--gold2)); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11.5px; color:#0a0a0e; cursor:pointer; box-shadow:0 6px 18px rgba(212,160,23,0.4); border:3px solid #fff2; z-index:6; text-align:center; line-height:1.2; }
                .wh-hub.disabled { cursor:not-allowed; opacity:0.55; }
                .wh-countdown { font-size:13px; color:var(--muted); margin-top:6px; }
                .wh-countdown strong { color:var(--gold3); font-weight:800; }
                .wh-extra-row { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:10px; flex-wrap:wrap; }
                .wh-extra-btn { display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:99px; background:rgba(var(--brand2-rgb,39,163,70),0.12); border:1px solid rgba(var(--brand2-rgb,39,163,70),0.35); color:#3ecb63; font-weight:800; font-size:12.5px; cursor:pointer; font-family:'Tajawal',sans-serif; }
                .wh-legend { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:8px; margin-top:22px; text-align:start; }
                .wh-legend-item { display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--bg3); border:1px solid var(--border); border-radius:10px; font-size:11.5px; }
                .wh-result-modal { position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.78); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px; }
                .wh-result-card { background:var(--card); border:1px solid var(--border); border-radius:20px; max-width:400px; width:100%; padding:30px 24px; text-align:center; }
                .wh-result-card i.big { font-size:48px; margin-bottom:14px; display:block; }
                .wh-result-card h3 { font-size:18px; font-weight:900; margin-bottom:8px; }
                .wh-result-card p { font-size:13.5px; color:var(--muted); line-height:1.7; margin-bottom:20px; }
                .wh-result-card .coins-big { font-size:30px; font-weight:900; color:var(--gold3); margin:6px 0 16px; }
                .wh-result-btn { padding:12px 28px; border-radius:99px; border:none; background:linear-gradient(135deg,var(--gold3),var(--gold2)); color:#0a0a0e; font-weight:800; font-size:13.5px; cursor:pointer; font-family:'Tajawal',sans-serif; }
                .wh-code-box { display:flex; align-items:center; justify-content:center; gap:10px; background:var(--bg3); border:1px dashed var(--gold3); border-radius:12px; padding:12px 16px; margin-bottom:14px; }
                .wh-code-box span { font-size:17px; font-weight:900; letter-spacing:1px; color:var(--gold3); direction:ltr; }
                .wh-code-copy { padding:6px 12px; border-radius:8px; border:none; background:rgba(212,160,23,0.15); color:var(--gold3); font-size:11.5px; font-weight:700; cursor:pointer; font-family:'Tajawal',sans-serif; }
                .wh-gift-disc-wrap { width:220px; height:220px; margin:16px auto; }
            `;
            document.head.appendChild(style);
        }

        function wheelBuildConicGradient(order, colors) {
            const seg = 360 / order.length;
            const stops = order.map((k, i) => `${colors[i % colors.length]} ${(i*seg).toFixed(2)}deg ${((i+1)*seg).toFixed(2)}deg`);
            return `conic-gradient(from 0deg, ${stops.join(', ')})`;
        }

        function wheelBuildLabels(order, isAR, cfgObj, radius) {
            const seg = 360 / order.length;
            const rad = radius || 108;
            return order.map((k, i) => {
                const center = i*seg + seg/2;
                const meta = wheelSlotMeta(k, isAR, (cfgObj||{})[k]);
                return `<div class="wh-label" style="transform:translate(-50%,-50%) rotate(${center}deg) translateY(-${rad}px) rotate(${-center}deg);">
                    <span class="em">${meta.emoji}</span><span class="lb">${meta.short}</span>
                </div>`;
            }).join('');
        }

        async function renderWheel(area) {
            wheelInjectStyles();
            area.innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i></div>`;
            try { _wheelState = await window._getWheelState(); }
            catch(e) { console.error('getWheelState error:', e); _wheelState = null; }
            wheelRenderPage(area);
        }

        function wheelRenderPage(area) {
            const isAR = lang === 'AR';
            const st = _wheelState;
            if (!st || (st.config && st.config.enabled === false)) {
                area.innerHTML = `
                <div class="ch-empty">
                    <i class="fa-solid fa-dharmachakra"></i>
                    <h3>${isAR?'عجلة الحظ متوقفة مؤقتاً':'The wheel is temporarily unavailable'}</h3>
                    <p>${isAR?'إدارة المنصة أوقفت عجلة الحظ حالياً — تابعنا وارجع قريباً 🎡':'The platform admin has paused the wheel — check back soon 🎡'}</p>
                </div>`;
                return;
            }
            let banners = '';
            if (st.coinBoost) {
                const exp = st.coinBoost.expiresAt.toDate ? st.coinBoost.expiresAt.toDate() : new Date(st.coinBoost.expiresAt);
                banners += `<div class="wh-banner"><i class="fa-solid fa-bolt"></i><div>${isAR?`مضاعفة العملات ×${st.coinBoost.multiplier} مفعّلة حتى `:`Coin boost ×${st.coinBoost.multiplier} active until `}${exp.toLocaleTimeString(isAR?'ar-EG':'en-US',{hour:'2-digit',minute:'2-digit'})}</div></div>`;
            }
            if (st.tempProFeature) {
                const label = isAR ? st.tempProFeature.featureAR : st.tempProFeature.featureEN;
                banners += `<div class="wh-banner"><i class="fa-solid fa-unlock"></i><div>${isAR?`تم فتح: ${label} لفترة محدودة`:`Unlocked: ${label} for a limited time`}</div></div>`;
            }
            area.innerHTML = `
            <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                    <h2>${isAR?'🎡 عجلة الحظ':'🎡 Fortune Wheel'}</h2>
                    <p>${isAR?'محاولة مجانية كل 24 ساعة — اكسب عملات، لفات إضافية، أو افتح عجلة الهدايا المفاجئة':'One free spin every 24 hours — win coins, extra spins, or unlock the surprise gift wheel'}</p>
                </div>
                <button onclick="openWheelHistoryModal()" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;white-space:nowrap;flex-shrink:0;">
                    <i class="fa-solid fa-clock-rotate-left"></i> ${isAR?'سجل العجلة':'Spin History'}
                </button>
            </div>
            <div class="wh-wrap">
                ${banners}
                <div class="wh-disc-wrap">
                    <div class="wh-pointer">🔻</div>
                    <div class="wh-disc" id="whBasicDisc" style="background:${wheelBuildConicGradient(WHEEL_BASIC_ORDER, WHEEL_BASIC_COLORS)};">
                        ${wheelBuildLabels(WHEEL_BASIC_ORDER, isAR, st.config.basic)}
                    </div>
                    <div class="wh-hub ${st.canSpinDaily?'':'disabled'}" id="whHub" onclick="wheelSpinBasic(false)">${st.canSpinDaily?(isAR?'لف الآن':'SPIN'):(isAR?'منتهية':'Used')}</div>
                </div>
                <div id="whCountdownWrap">${st.canSpinDaily ? '' : `<div class="wh-countdown">${isAR?'المحاولة القادمة بعد: ':'Next attempt in: '}<strong id="whCountdownVal">--:--:--</strong></div>`}</div>
                <div class="wh-extra-row">
                    ${st.extraSpins > 0 ? `<button class="wh-extra-btn" onclick="wheelSpinBasic(true)"><i class="fa-solid fa-rotate-right"></i> ${isAR?`استخدم لفة إضافية (${st.extraSpins})`:`Use extra spin (${st.extraSpins})`}</button>` : ''}
                </div>
                <div class="wh-legend">
                    ${WHEEL_BASIC_ORDER.map(k => { const m = wheelSlotMeta(k, isAR, st.config.basic[k]); return `<div class="wh-legend-item"><span>${m.emoji}</span><span>${isAR?m.fullAR:m.fullEN}</span></div>`; }).join('')}
                </div>
            </div>`;
            if (!st.canSpinDaily) {
                wheelTickCountdown();
                if (_wheelCountdownTimer) clearInterval(_wheelCountdownTimer);
                _wheelCountdownTimer = setInterval(wheelTickCountdown, 1000);
            }
        }

        function wheelTickCountdown() {
            const el = document.getElementById('whCountdownVal');
            if (!el || !_wheelState || !_wheelState.nextSpinAt) { if (_wheelCountdownTimer) { clearInterval(_wheelCountdownTimer); _wheelCountdownTimer = null; } return; }
            const nextAt = _wheelState.nextSpinAt.getTime ? _wheelState.nextSpinAt : new Date(_wheelState.nextSpinAt);
            const diff = nextAt - Date.now();
            if (diff <= 1000) {
                clearInterval(_wheelCountdownTimer); _wheelCountdownTimer = null;
                const area = document.getElementById('contentArea');
                if (area && window._currentPage === 'wheel') renderWheel(area);
                return;
            }
            const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            el.textContent = `${h}:${m}:${s}`;
        }

        // Rotates a wheel disc so the slice at `index` (of `total` equal visual slices)
        // ends up under the fixed top pointer, always spinning forward several full turns.
        function wheelAnimateTo(discEl, currentRot, index, total, spins) {
            const seg = 360 / total;
            const jitter = (Math.random() - 0.5) * seg * 0.55;
            const centerAngle = index * seg + seg / 2 + jitter;
            const targetMod = (360 - centerAngle + 360) % 360;
            const delta = ((targetMod - (currentRot % 360)) + 360) % 360;
            const newRot = currentRot + spins * 360 + delta;
            discEl.style.transform = `rotate(${newRot}deg)`;
            return newRot;
        }

        window.wheelSpinBasic = async function(usingExtra) {
            if (_wheelSpinning) return;
            const isAR = lang === 'AR';
            const hub = document.getElementById('whHub');
            if (!usingExtra && (!_wheelState || !_wheelState.canSpinDaily)) return;
            if (usingExtra && (!_wheelState || !(_wheelState.extraSpins > 0))) return;
            _wheelSpinning = true;
            if (hub) hub.classList.add('disabled');
            let result;
            try {
                result = await window._spinBasicWheel(usingExtra);
            } catch(e) {
                _wheelSpinning = false;
                if (hub) hub.classList.remove('disabled');
                if (e.code === 'cooldown') showToast(isAR?'المحاولة القادمة لسه ما جتش':'Your next attempt isn\'t ready yet', true);
                else if (e.code === 'no-extra') showToast(isAR?'مفيش لفات إضافية متاحة':'No extra spins available', true);
                else if (e.code === 'disabled') showToast(isAR?'العجلة متوقفة مؤقتاً':'The wheel is currently paused', true);
                else { console.error('spinBasicWheel error:', e); showToast(window.explainFirestoreError(e, isAR), true); }
                return;
            }
            const discEl = document.getElementById('whBasicDisc');
            const idx = WHEEL_BASIC_ORDER.indexOf(result.type);
            if (discEl && idx >= 0) _wheelBasicRot = wheelAnimateTo(discEl, _wheelBasicRot, idx, WHEEL_BASIC_ORDER.length, 6);
            setTimeout(() => {
                _wheelSpinning = false;
                wheelShowBasicResult(result);
            }, 4100);
        };

        function wheelShowBasicResult(result) {
            const isAR = lang === 'AR';
            const modal = document.createElement('div');
            modal.id = 'whResultModal';
            modal.className = 'wh-result-modal';
            let inner = '';
            if (result.type === 'coin1' || result.type === 'coin2' || result.type === 'coin3') {
                inner = `
                <i class="fa-solid fa-circle-check big" style="color:#27a346;"></i>
                <h3>${isAR?'🎉 مبروك!':'🎉 Congrats!'}</h3>
                <div class="coins-big"><i class="fa-solid fa-coins"></i> ${result.coinsAwarded}</div>
                <p>${isAR?`حصلت على ${result.coinsAwarded} عملة 🪙`:`You won ${result.coinsAwarded} coins 🪙`}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove()">${isAR?'تمام':'Nice'}</button>`;
            } else if (result.type === 'extraSpin') {
                inner = `
                <i class="fa-solid fa-rotate big" style="color:var(--gold3);"></i>
                <h3>${isAR?'🎉 مبروك!':'🎉 Congrats!'}</h3>
                <p>${isAR?'حصلت على لفة إضافية 🎡 هل تريد استخدامها الآن؟':'You got an extra spin 🎡 Want to use it now?'}</p>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="wh-result-btn" style="background:transparent;border:1px solid var(--border2);color:var(--text);" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'لاحقاً':'Later'}</button>
                    <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState().then(()=>wheelSpinBasic(true));">${isAR?'استخدم الآن':'Use now'}</button>
                </div>`;
            } else if (result.type === 'gift') {
                inner = `
                <i class="fa-solid fa-gift big" style="color:var(--gold3);"></i>
                <h3>${isAR?'🎁 هدية مفاجأة!':'🎁 Surprise Gift!'}</h3>
                <p>${isAR?'لف عجلة الهدايا عشان تعرف مكافأتك':'Spin the gift wheel to find out your prize'}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelOpenGiftModal();">${isAR?'لف عجلة الهدايا':'Spin the gift wheel'}</button>`;
            } else {
                inner = `
                <i class="fa-solid fa-circle-xmark big" style="color:#e74c3c;"></i>
                <h3>${isAR?'😔 حظ أوفر في المرة القادمة!':'😔 Better luck next time!'}</h3>
                <p>${isAR?'محاولتك القادمة بعد 24 ساعة 🍀':'Your next attempt is in 24 hours 🍀'}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'تمام':'Got it'}</button>`;
            }
            modal.innerHTML = `<div class="wh-result-card">${inner}</div>`;
            modal.onclick = (e) => { if (e.target === modal) { modal.remove(); wheelRefreshState(); } };
            document.body.appendChild(modal);
        }

        window.wheelRefreshState = async function() {
            try { _wheelState = await window._getWheelState(); } catch(e) { console.error(e); }
            const area = document.getElementById('contentArea');
            if (area && window._currentPage === 'wheel') wheelRenderPage(area);
        };

        window.wheelOpenGiftModal = function() {
            const isAR = lang === 'AR';
            const giftCfg = (_wheelState && _wheelState.config && _wheelState.config.gift) || window.DEFAULT_WHEEL_CONFIG.gift;
            const modal = document.createElement('div');
            modal.id = 'whGiftModalOverlay';
            modal.className = 'wh-result-modal';
            modal.innerHTML = `
            <div class="wh-result-card" style="max-width:420px;" onclick="event.stopPropagation()">
                <h3>${isAR?'🎁 عجلة الهدايا':'🎁 Gift Wheel'}</h3>
                <p>${isAR?'لف عجلة الهدايا واكسب واحدة من المكافآت دي':'Spin to win one of these prizes'}</p>
                <div class="wh-disc-wrap wh-gift-disc-wrap">
                    <div class="wh-pointer" style="font-size:22px;">🔻</div>
                    <div class="wh-disc" id="whGiftDisc" style="background:${wheelBuildConicGradient(WHEEL_GIFT_ORDER, WHEEL_GIFT_COLORS)};">
                        ${wheelBuildLabels(WHEEL_GIFT_ORDER, isAR, giftCfg, 68)}
                    </div>
                    <div class="wh-hub" id="whGiftHub" onclick="wheelSpinGift()">${isAR?'لف':'SPIN'}</div>
                </div>
                <div class="wh-legend">
                    ${WHEEL_GIFT_ORDER.map(k => { const m = wheelSlotMeta(k, isAR, giftCfg[k]); return `<div class="wh-legend-item"><span>${m.emoji}</span><span>${isAR?m.fullAR:m.fullEN}</span></div>`; }).join('')}
                </div>
            </div>`;
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.body.appendChild(modal);
        };

        window.wheelSpinGift = async function() {
            if (_wheelSpinning) return;
            const isAR = lang === 'AR';
            const hub = document.getElementById('whGiftHub');
            _wheelSpinning = true;
            if (hub) hub.classList.add('disabled');
            let result;
            try { result = await window._spinGiftWheel(); }
            catch(e) {
                _wheelSpinning = false;
                if (hub) hub.classList.remove('disabled');
                console.error('spinGiftWheel error:', e);
                showToast(window.explainFirestoreError(e, isAR), true);
                return;
            }
            const discEl = document.getElementById('whGiftDisc');
            const idx = WHEEL_GIFT_ORDER.indexOf(result.type);
            if (discEl && idx >= 0) _wheelGiftRot = wheelAnimateTo(discEl, _wheelGiftRot, idx, WHEEL_GIFT_ORDER.length, 6);
            setTimeout(() => {
                _wheelSpinning = false;
                document.getElementById('whGiftModalOverlay')?.remove();
                wheelShowGiftResult(result);
            }, 4100);
        };

        function wheelShowGiftResult(result) {
            const isAR = lang === 'AR';
            const modal = document.createElement('div');
            modal.id = 'whResultModal';
            modal.className = 'wh-result-modal';
            let inner = '';
            if (result.type === 'promonth') {
                const monthsLabel = result.months === 1 ? (isAR?'شهر':'1 month') : (isAR?`${result.months} أشهر`:`${result.months} months`);
                inner = `
                <i class="fa-solid fa-crown big" style="color:var(--gold3);"></i>
                <h3>${isAR?'🎁 مبروك!':'🎁 Congrats!'}</h3>
                <p>${isAR?`حصلت على ${monthsLabel} من ATLASYA PRO مجاناً — تم التفعيل تلقائياً`:`You won ${monthsLabel} of ATLASYA PRO free — activated automatically`}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'رائع':'Awesome'}</button>`;
            } else if (result.type === 'tempfeature') {
                const label = isAR ? result.featureAR : result.featureEN;
                inner = `
                <i class="fa-solid fa-unlock big" style="color:#27a346;"></i>
                <h3>${isAR?'🔓 تم الفتح!':'🔓 Unlocked!'}</h3>
                <p>${isAR?`تم فتح "${label}" لمدة ${result.hours} ساعة`:`"${label}" unlocked for ${result.hours} hours`}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'تمام':'Got it'}</button>`;
            } else if (result.type === 'discount') {
                const monthsLabel = result.requiredMonths === 1 ? (isAR?'شهر':'1 month') : (isAR?`${result.requiredMonths} أشهر`:`${result.requiredMonths} months`);
                const exp = result.expiresAt instanceof Date ? result.expiresAt : new Date(result.expiresAt);
                inner = `
                <i class="fa-solid fa-ticket big" style="color:var(--gold3);"></i>
                <h3>${isAR?'🎟️ قسيمة خصم!':'🎟️ Discount Coupon!'}</h3>
                <p>${isAR?`خصم ${result.percent}% عند الاشتراك في ${monthsLabel} من ATLASYA PRO`:`${result.percent}% off ${monthsLabel} of ATLASYA PRO`}</p>
                <div class="wh-code-box"><span id="whCodeText">${result.code}</span><button class="wh-code-copy" onclick="navigator.clipboard.writeText('${result.code}').then(()=>showToast('${isAR?'✅ اتنسخ الكود':'✅ Code copied'}'))">${isAR?'نسخ':'Copy'}</button></div>
                <p style="font-size:11.5px;">${isAR?`صالح حتى ${exp.toLocaleDateString('ar-EG')}`:`Valid until ${exp.toLocaleDateString('en-US')}`}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'تمام':'Got it'}</button>`;
            } else if (result.type === 'boost') {
                inner = `
                <i class="fa-solid fa-bolt big" style="color:var(--gold3);"></i>
                <h3>${isAR?'⚡ مضاعفة العملات!':'⚡ Coin Boost!'}</h3>
                <p>${isAR?`تم تفعيل مضاعفة العملات ×${result.multiplier} لمدة ${result.hours} ساعة`:`×${result.multiplier} coin boost activated for ${result.hours} hours`}</p>
                <button class="wh-result-btn" onclick="document.getElementById('whResultModal').remove();wheelRefreshState();">${isAR?'يلا':"Let's go"}</button>`;
            }
            modal.innerHTML = `<div class="wh-result-card">${inner}</div>`;
            modal.onclick = (e) => { if (e.target === modal) { modal.remove(); wheelRefreshState(); } };
            document.body.appendChild(modal);
        }

        /* ─── GIS INSIGHTS — DAILY TIP ROTATION ─── */
        const INS_SEED_TIPS = [
            { id:'seed01', icon:'fa-graduation-cap', color:'#1e7a34', categoryAR:'أساسيات', categoryEN:'Basics', titleAR:'ابدأ بالأساسيات قبل البرامج', titleEN:'Master the Basics Before Software', bodyAR:'قبل ما تفتح أي برنامج GIS، ركّز على المفاهيم الأساسية: الفرق بين <strong>Raster</strong> و<strong>Vector</strong>، نظم الإحداثيات <strong>Projection & Coordinate Systems</strong>، وقواعد البيانات المكانية <strong>Spatial Databases</strong>.<br><br>🎯 الفهم ده هيسهّل عليك التعامل مع أي برنامج بعدين.', bodyEN:'Before opening any GIS software, focus on core concepts: the difference between <strong>Raster</strong> and <strong>Vector</strong>, <strong>Projection & Coordinate Systems</strong>, and <strong>Spatial Databases</strong>.<br><br>🎯 This understanding makes any software much easier to learn.' },
            { id:'seed02', icon:'fa-briefcase', color:'#d4a017', categoryAR:'مسار مهني', categoryEN:'Career', titleAR:'التطبيق العملي أهم من الشهادات', titleEN:'Practical Experience Over Certificates', bodyAR:'الشهادات مهمة، بس الخبرة العملية هي اللي بتفرق:<ul><li>اعمل مشاريع حقيقية حتى لو صغيرة</li><li>استخدم بيانات مفتوحة <strong>Open Data</strong> لتطبيق الدروس</li><li>ابنِ <strong>Portfolio</strong> قوي بخرائطك ومشاريعك الخاصة</li></ul>', bodyEN:'Certificates matter, but practical experience makes the real difference:<ul><li>Work on real projects, even small ones</li><li>Use <strong>Open Data</strong> to apply lessons</li><li>Build a strong <strong>Portfolio</strong> with your own maps and analyses</li></ul>' },
            { id:'seed03', icon:'fa-folder-open', color:'#1e7a34', categoryAR:'مشاريع', categoryEN:'Projects', titleAR:'اشتغل على Projects حقيقية', titleEN:'Work on Real-World Projects', bodyAR:'المشاريع الواقعية بتخليك تتعلم:<ol><li>تحليل البيانات البيئية <strong>Environmental Analysis</strong></li><li>رسم خرائط الشبكات <strong>Network Analysis</strong></li><li>دراسات الأراضي <strong>Land Use & Land Cover</strong></li></ol>🎯 كل مشروع هيديك فكرة عن سوق الشغل وطلبات الشركات.', bodyEN:'Real-world projects help you learn:<ol><li><strong>Environmental Analysis</strong></li><li><strong>Network Analysis</strong></li><li><strong>Land Use & Land Cover</strong> studies</li></ol>🎯 Each project gives you insight into what employers actually need.' },
            { id:'seed04', icon:'fa-laptop-code', color:'#d4a017', categoryAR:'برامج', categoryEN:'Software', titleAR:'اتعلم QGIS مع ArcGIS', titleEN:'Learn QGIS Alongside ArcGIS', bodyAR:'حتى لو هتستخدم ArcGIS Pro، لازم تعرف QGIS:<ul><li>QGIS مجاني ومفتوح المصدر</li><li>فيه <strong>Plugins</strong> كتيرة تساعدك في Analysis وVisualization</li><li>الشركات الصغيرة والمشاريع الحرة <strong>Freelance</strong> غالبًا بتستخدم QGIS</li></ul>', bodyEN:'Even if you use ArcGIS Pro, you must know QGIS:<ul><li>QGIS is free and open-source</li><li>Rich <strong>Plugins</strong> ecosystem for Analysis & Visualization</li><li>Small companies and <strong>Freelance</strong> projects often prefer QGIS</li></ul>' },
            { id:'seed05', icon:'fa-table', color:'#1e7a34', categoryAR:'تحليل بيانات', categoryEN:'Data Analysis', titleAR:'اعرف أساسيات Excel وSQL', titleEN:'Learn Excel & SQL Basics', bodyAR:'مهارات التحليل مهمّة لأي GIS Specialist:<ul><li><strong>Excel:</strong> sorting, filtering, pivot tables</li><li><strong>SQL:</strong> استعلامات على قواعد البيانات المكانية</li></ul>هيساعدك في التعامل مع أي Dataset كبير بسهولة.', bodyEN:'Analytical skills are essential for any GIS Specialist:<ul><li><strong>Excel:</strong> sorting, filtering, pivot tables</li><li><strong>SQL:</strong> queries on spatial databases</li></ul>This will help you handle any large dataset with ease.' },
            { id:'seed06', icon:'fa-folder-tree', color:'#d4a017', categoryAR:'تنظيم', categoryEN:'Organization', titleAR:'نظّم ملفاتك GIS', titleEN:'Organize Your GIS Files', bodyAR:'لازم يكون عندك نظام واضح لتنظيم ملفاتك:<ul><li>اعمل فولدر لكل مشروع</li><li>قسّم البيانات حسب النوع <strong>Raster / Vector</strong></li><li>خلي الخرائط، التحليلات، والبيانات المصدرية في مكان منفصل</li></ul>🎯 ده هيوفر وقتك ويخليك تشتغل بكفاءة.', bodyEN:'You need a clear file organization system:<ul><li>Create a folder for each project</li><li>Separate data by type: <strong>Raster / Vector</strong></li><li>Keep maps, analyses, and source data in separate folders</li></ul>🎯 This saves time and keeps you working efficiently.' },
            { id:'seed07', icon:'fa-rotate', color:'#1e7a34', categoryAR:'أدوات', categoryEN:'Tools', titleAR:'تابع التحديثات والأدوات الجديدة', titleEN:'Stay Updated with New Tools', bodyAR:'برامج GIS دايمًا بتتحدث:<ol><li>تابع المدونات الرسمية لـ ArcGIS و QGIS</li><li>تابع حسابات GitHub الخاصة بالـ Plugins</li><li>جرّب الأدوات الجديدة على مشاريع صغيرة</li></ol>🎯 ده هيخليك دائمًا محدث ومواكب لأي وظيفة أو مشروع.', bodyEN:'GIS software is always evolving:<ol><li>Follow official ArcGIS & QGIS blogs</li><li>Watch GitHub repos for new Plugins</li><li>Test new tools on small projects</li></ol>🎯 This keeps you current and competitive in the job market.' },
            { id:'seed08', icon:'fa-database', color:'#d4a017', categoryAR:'بيانات مفتوحة', categoryEN:'Open Data', titleAR:'استخدم بيانات مفتوحة Open Data', titleEN:'Use Open Data Sources', bodyAR:'لتطبيق مشاريع GIS بدون تعقيدات:<ol><li>استخدم بيانات مفتوحة من مواقع حكومية أو بحثية</li><li>جرّب مشاريع صغيرة زي رسم خرائط استخدام الأراضي</li><li>افتح ملفات البيانات بنفسك لتفهم هيكلها</li></ol>🎯 ده هيساعدك تتعلم التحليل العملي بدون قيود تراخيص.', bodyEN:'Apply GIS projects without complications:<ol><li>Use open data from government or research portals</li><li>Try small projects like mapping land use</li><li>Open data files yourself to understand their structure</li></ol>🎯 This helps you learn practical analysis without license restrictions.' },
            { id:'seed09', icon:'fa-share-nodes', color:'#1e7a34', categoryAR:'مشاركة', categoryEN:'Sharing', titleAR:'شارك مشاريعك وخبراتك', titleEN:'Share Your Projects & Experience', bodyAR:'مشاركة مشاريعك خطوة مهمة لبناء Portfolio:<ol><li>انشر خرائطك ومشاريعك على LinkedIn أو GitHub</li><li>اشرح كل مشروع: البيانات، الأدوات، النتائج</li></ol>🎯 ده هيخلي أصحاب الشغل يشوفوا مهاراتك.<br>⚠️ مهم جدًا لو عايز Freelance أو وظيفة ثابتة.', bodyEN:'Sharing is key to building your Portfolio:<ol><li>Post your maps and projects on LinkedIn or GitHub</li><li>Describe each project: data, tools, and results</li></ol>🎯 This lets employers see and appreciate your skills.<br>⚠️ Essential if you want Freelance or a permanent GIS job.' },
            { id:'seed10', icon:'fa-magnifying-glass-location', color:'#d4a017', categoryAR:'تحليل مكاني', categoryEN:'Spatial Analysis', titleAR:'ركّز على التحليل المكاني Spatial Analysis', titleEN:'Master Spatial Analysis', bodyAR:'مهارة التحليل المكاني مطلوبة في كل مشاريع GIS:<ol><li>اتعلم كيفية تحليل البيانات المكانية وعلاقاتها</li><li>جرّب أدوات مثل <strong>Buffer, Overlay, Spatial Join</strong></li><li>اربط النتائج بخطط عملية أو خرائط توضيحية</li></ol>🎯 التطبيق العملي هو اللي هيخلي مهارتك واضحة.', bodyEN:'Spatial analysis skills are required in every GIS project:<ol><li>Learn how to analyze spatial data and its relationships</li><li>Practice tools like <strong>Buffer, Overlay, Spatial Join</strong></li><li>Link results to practical plans or illustrative maps</li></ol>🎯 Hands-on practice is what makes your skill visible.' },
            { id:'seed11', icon:'fa-satellite', color:'#1e7a34', categoryAR:'استشعار عن بعد', categoryEN:'Remote Sensing', titleAR:'تعلّم Remote Sensing', titleEN:'Learn Remote Sensing', bodyAR:'الـ Remote Sensing جزء أساسي من GIS:<ul><li>افهم أنواع الأقمار الصناعية مثل <strong>Landsat, Sentinel</strong></li><li>تعلّم استخدام وتحليل الصور الفضائية</li><li>اربط النتائج بالخرائط GIS</li></ul>ده هيفتحلك مجالات كبيرة في البيئة، الزراعة، والتخطيط العمراني.', bodyEN:'Remote Sensing is a core part of GIS:<ul><li>Understand satellite types like <strong>Landsat, Sentinel</strong></li><li>Learn to use and analyze satellite imagery</li><li>Link results back to GIS maps</li></ul>This opens huge opportunities in environment, agriculture, and urban planning.' },
            { id:'seed12', icon:'fa-palette', color:'#d4a017', categoryAR:'تصميم خرائط', categoryEN:'Cartography', titleAR:'ركّز على Visualization', titleEN:'Focus on Visualization', bodyAR:'العرض البصري للخرائط مهم جدًا:<ul><li>استخدم <strong>Symbols, Labels, Color Schemes</strong> بشكل واضح</li><li>تعلّم عمل <strong>Interactive Maps</strong> في ArcGIS أو QGIS</li><li>تقديم الخرائط بشكل جذاب يسهّل فهم البيانات</li></ul>يزيد فرصك في الشغل ويجعل نتائجك أكثر تأثيراً.', bodyEN:'Map visualization is critically important:<ul><li>Use clear <strong>Symbols, Labels, Color Schemes</strong></li><li>Learn to create <strong>Interactive Maps</strong> in ArcGIS or QGIS</li><li>Attractive map presentation makes data easier to understand</li></ul>This increases your job opportunities and makes your results more impactful.' },
            { id:'seed13', icon:'fa-file-lines', color:'#1e7a34', categoryAR:'بورتفوليو', categoryEN:'Portfolio', titleAR:'اعمل Portfolio رقمي', titleEN:'Build a Digital Portfolio', bodyAR:'لكي تُثبت مهاراتك لأي وظيفة أو مشروع:<ul><li>احتفظ بمشاريعك، خرائطك، تحليلاتك في ملف أو موقع</li><li>اعمل شرح لكل مشروع: الهدف، البيانات، التحليل، النتائج</li><li>استخدم <strong>GitHub</strong> أو <strong>LinkedIn</strong> لعرض Portfolio</li></ul>', bodyEN:'To prove your skills for any job or project:<ul><li>Keep your projects, maps, and analyses in one place</li><li>Document each project: goal, data, analysis, results</li><li>Use <strong>GitHub</strong> or <strong>LinkedIn</strong> to showcase your Portfolio</li></ul>' },
            { id:'seed14', icon:'fa-code', color:'#d4a017', categoryAR:'برمجة', categoryEN:'Programming', titleAR:'اتعلّم Python وGIS', titleEN:'Learn Python for GIS', bodyAR:'البرمجة مهمة جدًا في GIS:<ul><li>استخدم <strong>Python + ArcPy</strong> لتسريع التحليل المكرّر</li><li>جرّب <strong>QGIS Python Plugins</strong></li><li>كتابة سكربتات صغيرة هتوفر وقتك وتديك قوة في تحليل البيانات الكبيرة</li></ul>', bodyEN:'Programming is very important in GIS:<ul><li>Use <strong>Python + ArcPy</strong> to automate repetitive analysis</li><li>Try <strong>QGIS Python Plugins</strong></li><li>Writing small scripts saves time and gives you power over large datasets</li></ul>' },
            { id:'seed15', icon:'fa-users', color:'#1e7a34', categoryAR:'مجتمع', categoryEN:'Community', titleAR:'شارك في مجتمعات GIS', titleEN:'Join GIS Communities', bodyAR:'المجتمع هيساعدك تتعلم أسرع:<ul><li>انضم لمجموعات GIS على Facebook، LinkedIn، Reddit</li><li>اسأل، شارك مشاريعك، خذ نصايح من محترفين</li><li>ده هيوصلك لفرص تدريبية وشغل أكثر</li></ul>', bodyEN:'Community will help you learn faster:<ul><li>Join GIS groups on Facebook, LinkedIn, Reddit</li><li>Ask questions, share your projects, get advice from professionals</li><li>This connects you to more training and job opportunities</li></ul>' }
        ];
        const INS_SHARE_LINK = 'https://atlasya2026.github.io/Atlasya/';
        const INS_STAGE_HOURS = 24; // hours between each box unlocking
        let _insTips = null;      // combined seed + Firestore tips, loaded once per session
        let _insCountdownTimer = null;
        let _insShareTipId = null;

        async function renderInsights(area) {
            area.innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i></div>`;
            if (!_insTips) {
                let fsTips = [];
                try { fsTips = window._loadDailyTips ? await window._loadDailyTips() : []; }
                catch(e) { console.error('loadDailyTips error:', e); }
                _insTips = [...INS_SEED_TIPS, ...fsTips];
            }
            // first-ever visit: kick off this student's personal 24h-per-box journey
            if (!window._userData?.tipsStartedAt) {
                try { await window._startTipsJourney(); }
                catch(e) { console.error('startTipsJourney error:', e); }
            }
            insRenderPage(area);
        }

        function insTotalStages() { return _insTips.length; }
        function insStartMs() {
            const s = window._userData?.tipsStartedAt;
            return s ? new Date(s).getTime() : null;
        }
        // 1-based index of the highest box unlocked right now (0 = journey not started yet)
        function insUnlockedStage() {
            const start = insStartMs();
            if (!start) return 0;
            const elapsedHours = (Date.now() - start) / 3600000;
            const idx = 1 + Math.floor(elapsedHours / INS_STAGE_HOURS);
            return Math.min(idx, insTotalStages());
        }
        // ms timestamp the next box unlocks at, or null if every box we currently have is already unlocked
        function insNextUnlockMs() {
            const start = insStartMs();
            if (!start) return null;
            const cur = insUnlockedStage();
            if (cur >= insTotalStages()) return null;
            return start + cur * INS_STAGE_HOURS * 3600000;
        }
        function insLikedIds() { return window._userData?.tipLikes || []; }
        function insIsLiked(id) { return insLikedIds().includes(id); }

        function insActionsHTML(tip, isAR) {
            const liked = insIsLiked(tip.id);
            return `
            <button class="ins-act-btn ${liked?'liked':''}" onclick="insToggleLike('${tip.id}')">
                <i class="fa-solid fa-heart"></i> ${isAR?'إعجاب':'Like'} <span class="cnt">${tip.likes||0}</span>
            </button>
            <button class="ins-act-btn" onclick="insOpenShare('${tip.id}')">
                <i class="fa-solid fa-share-nodes"></i> ${isAR?'مشاركة':'Share'}
            </button>`;
        }

        function insRenderPage(area) {
            const isAR = lang === 'AR';
            const total = insTotalStages();
            const unlocked = insUnlockedStage();

            const INS_GROUP_SIZE = 15;
            const insGroups = [];
            for (let gi = 0; gi * INS_GROUP_SIZE < _insTips.length; gi++) {
                insGroups.push(_insTips.slice(gi * INS_GROUP_SIZE, gi * INS_GROUP_SIZE + INS_GROUP_SIZE));
            }
            const boxesHTML = insGroups.map((group, gi) => {
                const startNum = gi * INS_GROUP_SIZE + 1;
                const endNum = startNum + group.length - 1;
                const groupBoxes = group.map((t, j) => {
                    const stage = startNum + j;
                    const cls = stage < unlocked ? 'done' : (stage === unlocked ? 'current' : 'locked');
                    const icon = stage < unlocked ? '<i class="fa-solid fa-check ic"></i>'
                               : (stage === unlocked ? '<i class="fa-solid fa-box-open ic"></i>' : '<i class="fa-solid fa-lock ic"></i>');
                    return `<div class="ins-stage-box ${cls}" onclick="insOpenStage(${stage})" title="${isAR?'بوكس':'Box'} ${stage}">
                                <span class="num">${stage}</span>
                                ${icon}
                            </div>`;
                }).join('');
                const groupLabel = insGroups.length > 1
                    ? `<div class="ins-stage-group-label">${isAR?`المجموعة ${gi+1}`:`Batch ${gi+1}`} <span>(${startNum}–${endNum})</span></div>`
                    : '';
                return `<div class="ins-stage-group">${groupLabel}<div class="ins-stage-grid">${groupBoxes}</div></div>`;
            }).join('');

            const countdownHTML = unlocked >= total
                ? `<div class="ins-next-countdown"><i class="fa-solid fa-flag-checkered"></i>
                     <span class="lbl">${isAR?'خلصت كل البوكسات المتاحة — نصائح جديدة جاية قريب 🚀':'You finished all available boxes — new ones are coming soon 🚀'}</span></div>`
                : `<div class="ins-next-countdown">
                     <i class="fa-solid fa-hourglass-half"></i>
                     <span class="lbl">${isAR?'البوكس الجاي يفتح بعد:':'Next box unlocks in:'}</span>
                     <span class="val" id="insCountdownVal">--:--:--</span>
                   </div>`;

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'رحلة النصائح' : 'Tips Journey'}</h2>
                <p>${isAR ? 'كل 24 ساعة يتفتح بوكس جديد فيه نصيحة — اقرأ، اعمل لايك، وشارك' : 'A new box unlocks every 24 hours — read, like, and share'}</p>
            </div>

            <div class="ins-stage-wrap">
                ${boxesHTML}
                ${countdownHTML}
            </div>

            <!-- share sheet -->
            <div class="ins-sheet-overlay" id="insSheetOverlay" onclick="insCloseShare()"></div>
            <div class="ins-share-sheet" id="insShareSheet">
                <h4>${isAR?'مشاركة النصيحة عبر':'Share this tip via'}</h4>
                <div class="ins-share-grid">
                    <div class="ins-share-opt wa" onclick="insDoShare('whatsapp')"><i class="fa-brands fa-whatsapp"></i> ${isAR?'واتساب':'WhatsApp'}</div>
                    <div class="ins-share-opt tg" onclick="insDoShare('telegram')"><i class="fa-brands fa-telegram"></i> ${isAR?'تيليجرام':'Telegram'}</div>
                    <div class="ins-share-opt fb" onclick="insDoShare('facebook')"><i class="fa-brands fa-facebook"></i> ${isAR?'فيسبوك':'Facebook'}</div>
                    <div class="ins-share-opt cp" onclick="insDoShare('copy')"><i class="fa-solid fa-copy"></i> ${isAR?'نسخ النص':'Copy text'}</div>
                </div>
                <button class="ins-sheet-close" onclick="insCloseShare()">${isAR?'إغلاق':'Close'}</button>
            </div>

            <!-- stage (box) tip modal -->
            <div class="ins-modal-overlay" id="insStageOverlay">
                <div class="ins-modal-card" id="insStageModalContent"></div>
            </div>`;

            insTickCountdown();
            if (_insCountdownTimer) clearInterval(_insCountdownTimer);
            _insCountdownTimer = setInterval(insTickCountdown, 1000);

            // auto-popup the newest unlocked box the student hasn't seen yet (e.g. box 1 on their very first visit)
            const lastShown = window._userData?.tipsLastShownStage || 0;
            if (unlocked > lastShown) {
                insOpenStage(unlocked);
            }
        }

        window.insOpenStage = function(stage) {
            const isAR = lang === 'AR';
            const unlocked = insUnlockedStage();
            if (stage > unlocked) return; // still locked, nothing to show
            const tip = _insTips[stage - 1];
            if (!tip) return;
            document.getElementById('insStageModalContent').innerHTML = `
                <div class="ins-eyebrow"><i class="fa-solid fa-box-open"></i> ${isAR?`بوكس ${stage}`:`Box ${stage}`}</div>
                <span class="ins-cat">${isAR?tip.categoryAR:tip.categoryEN}</span>
                <h3 class="tip-title" style="font-size:19px;">${isAR?tip.titleAR:tip.titleEN}</h3>
                <div class="tip-body" style="font-size:14.5px;margin-top:8px;">${isAR?tip.bodyAR:tip.bodyEN}</div>
                <div class="ins-actions" id="insStageActions">${insActionsHTML(tip, isAR)}</div>
                <button class="ins-modal-close" onclick="document.getElementById('insStageOverlay').classList.remove('open')">${isAR?'تمام':'Got it'}</button>`;
            document.getElementById('insStageOverlay').classList.add('open');

            const lastShown = window._userData?.tipsLastShownStage || 0;
            if (stage > lastShown) {
                window._markTipStageShown(stage).catch(e => console.error(e));
            }
        };

        window.insToggleLike = async function(tipId) {
            if (!window._currentUid) { showToast(lang==='AR'?'سجّل الدخول الأول':'Please log in first', true); return; }
            const wasLiked = insIsLiked(tipId);
            const t = _insTips.find(x => x.id === tipId);
            try {
                await window._toggleTipLike(tipId, !wasLiked);
                if (t) t.likes = (t.likes || 0) + (wasLiked ? -1 : 1);
                const actionsEl = document.getElementById('insStageActions');
                if (actionsEl && t) actionsEl.innerHTML = insActionsHTML(t, lang === 'AR');
            } catch(e) { console.error(e); showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
        };

        window.insOpenShare = function(tipId) {
            _insShareTipId = tipId;
            document.getElementById('insSheetOverlay')?.classList.add('open');
            document.getElementById('insShareSheet')?.classList.add('open');
        };
        window.insCloseShare = function() {
            document.getElementById('insSheetOverlay')?.classList.remove('open');
            document.getElementById('insShareSheet')?.classList.remove('open');
        };
        function insShareText(tip) {
            const isAR = lang === 'AR';
            const cat = isAR ? tip.categoryAR : tip.categoryEN;
            const title = isAR ? tip.titleAR : tip.titleEN;
            const body = (isAR ? tip.bodyAR : tip.bodyEN).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return `💡 ${isAR?'نصيحة':'A'} ${cat} ${isAR?'من منصة':'tip from'} ATLASYA\n\n${title}\n${body}\n\n📚 ${isAR?'المزيد من النصائح والكتب والكورسات وبيانات GIS:':'More tips, books, courses, and GIS data:'}\n${INS_SHARE_LINK}`;
        }
        window.insDoShare = function(channel) {
            const tip = _insTips.find(t => t.id === _insShareTipId);
            if (!tip) return;
            const text = insShareText(tip);
            const enc = encodeURIComponent(text);
            if (channel === 'whatsapp') window.open(`https://wa.me/?text=${enc}`, '_blank');
            else if (channel === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(INS_SHARE_LINK)}&text=${enc}`, '_blank');
            else if (channel === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(INS_SHARE_LINK)}&quote=${enc}`, '_blank');
            else if (channel === 'copy') { navigator.clipboard?.writeText(text).then(() => showToast(lang==='AR'?'✅ اتنسخ النص':'✅ Copied')); }
            if (window._trackTipShare) window._trackTipShare(tip.id).catch(e => console.error('trackTipShare error:', e));
            insCloseShare();
        };

        function insTickCountdown() {
            const el = document.getElementById('insCountdownVal');
            if (!el) { if (_insCountdownTimer) { clearInterval(_insCountdownTimer); _insCountdownTimer = null; } return; }
            const nextMs = insNextUnlockMs();
            if (nextMs == null) { if (_insCountdownTimer) { clearInterval(_insCountdownTimer); _insCountdownTimer = null; } return; }
            const diff = nextMs - Date.now();
            if (diff <= 1000) {
                // a new box just unlocked — re-render in place
                const area = document.getElementById('contentArea');
                if (area && window._currentPage === 'insights') insRenderPage(area);
                return;
            }
            const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            el.textContent = `${h}:${m}:${s}`;
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
        function escapeHtmlAC(str) { return escapeHtml(str); }

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