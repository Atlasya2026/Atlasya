
    window.adminLoadReferrals = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('referralsList');
        const badge = document.getElementById('referralCountBadge');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const [users, referralCoinsByUser] = await Promise.all([
                window._loadAllUsers(),
                window._loadReferralCoinsByUser()
            ]);
            const coinsFor = (u) => Math.max(referralCoinsByUser[u.uid] || 0, u.referralCoinsEarned || 0);
            const inviters = users
                .filter(u => (u.referralCount || 0) > 0)
                .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

            const totalInvites = users.reduce((sum, u) => sum + (u.referralCount || 0), 0);
            const totalCoins = users.reduce((sum, u) => sum + coinsFor(u), 0);
            const sumInvitesEl = document.getElementById('refSumInvites');
            const sumCoinsEl = document.getElementById('refSumCoins');
            const sumSharersEl = document.getElementById('refSumSharers');
            if (sumInvitesEl) sumInvitesEl.textContent = totalInvites;
            if (sumCoinsEl) sumCoinsEl.textContent = totalCoins;
            if (sumSharersEl) sumSharersEl.textContent = inviters.length;
            if (badge) badge.textContent = inviters.length;

            if (!inviters.length) {
                list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-user-plus" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا يوجد أحد قام بدعوة أصدقاء بعد':'No one has invited friends yet'}</div>`;
                return;
            }

            // Quick lookup so we can show the name of whoever referred each new member
            const usersById = {};
            users.forEach(u => { usersById[u.uid] = u; });

            list.innerHTML = inviters.map((u, idx) => {
                const fullName = ((u.firstName||'') + ' ' + (u.lastName||'')).trim() || 'User';
                const letter = fullName[0].toUpperCase();
                const hasImg = !!(u.profileImg);
                const avatarBg = hasImg ? `background-image:url('${u.profileImg}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,var(--g2),var(--g4));`;
                const invitedNames = users
                    .filter(x => x.referredBy === u.uid)
                    .map(x => ((x.firstName||'') + ' ' + (x.lastName||'')).trim() || 'User');
                return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                    <div style="width:24px;text-align:center;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0;">${idx+1}</div>
                    <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;border:2px solid rgba(var(--brand-rgb,30,122,52),0.4);${avatarBg}">${hasImg?'':letter}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:700;">${fullName}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.email||'—'}</div>
                        ${invitedNames.length ? `<div style="font-size:10.5px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><i class="fa-solid fa-user-group" style="font-size:9px;"></i> ${invitedNames.join('، ')}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:8px;flex-shrink:0;">
                        <div style="text-align:center;padding:6px 12px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;">
                            <div style="font-size:13px;font-weight:800;color:var(--green4);">${u.referralCount||0}</div>
                            <div style="font-size:9px;color:var(--muted);">${isAR?'دعوات':'invites'}</div>
                        </div>
                        <div style="text-align:center;padding:6px 12px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:8px;">
                            <div style="font-size:13px;font-weight:800;color:var(--gold3);">${coinsFor(u)}</div>
                            <div style="font-size:9px;color:var(--muted);">${isAR?'عملة دعوة':'referral coins'}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch(e) {
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    /* ─── ADMIN: PRO UPGRADE REQUESTS (standalone page) ─── */
    function renderAdminProRequests(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        window._subReqFilter = window._subReqFilter || 'pending';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR ? 'طلبات الاشتراك' : 'Subscription Requests'}</h2>
            <p>${isAR ? 'مراجعة طلبات اشتراك ATLASYA PRO وتفعيلها أو رفضها' : 'Review, approve, or reject ATLASYA PRO subscription requests'}</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
            <div id="subReqTabs" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
            <button onclick="adminLoadMembers()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
            </button>
        </div>
        <div id="upgradeRequestsList" style="display:flex;flex-direction:column;gap:10px;">
            <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>`;
        setTimeout(() => adminLoadMembers(), 100);
    }

    window.adminSetSubReqFilter = function(f) {
        window._subReqFilter = f;
        adminLoadMembers();
    };

    /* ─── ADMIN: COIN SYSTEM SETTINGS ─── */
    window._coinSettingsDraft = null; // { coinName, coinSymbol, tiers:[{months,coins}], dailyMax, redemptionEnabled, autoApprove }

    async function renderAdminCoinSettings(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'⚙️ إعدادات نظام العملات':'⚙️ Coin System Settings'}</h2>
            <p>${isAR?'تحكم كامل في اسم العملة، قيمة كل باقة PRO، سقف الكسب اليومي، وهل يحتاج الاستبدال موافقة الإدارة':'Full control over the coin name, what each PRO tier costs, the daily earning cap, and whether redemptions need admin approval'}</p>
        </div>
        <div id="coinSettingsRoot">
            <div style="text-align:center;padding:40px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>
        <div class="form-card" style="margin-top:16px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
                <h3 style="margin:0;"><i class="fa-solid fa-user-pen" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'إدارة رصيد عملات الطلاب':'Manage Student Coin Balance'}</h3>
            </div>
            <p style="font-size:12.5px;color:var(--muted);margin:0 0 14px;">${isAR?'ابحث عن الطالب ببريده الإلكتروني المسجل، ثم أضف أو اخصم أي عدد من العملات من رصيده.':"Search for a student by their registered email, then add or deduct any amount of coins from their balance."}</p>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <input type="email" id="coinMgmtEmail" placeholder="${isAR?'بريد الطالب الإلكتروني':"Student's email"}" style="flex:1;min-width:220px;padding:9px 12px;border-radius:9px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-family:'Tajawal',sans-serif;font-size:13px;direction:ltr;" onkeydown="if(event.key==='Enter'){event.preventDefault();adminCoinMgmtSearch();}">
                <button onclick="adminCoinMgmtSearch()" style="display:flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));border:none;border-radius:9px;color:#000;font-size:12.5px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                    <i class="fa-solid fa-magnifying-glass"></i> ${isAR?'بحث':'Search'}
                </button>
            </div>
            <div id="coinMgmtResult" style="margin-top:14px;"></div>
        </div>
        <div class="form-card" style="margin-top:16px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <h3 style="margin:0;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'طلبات الاستبدال قيد المراجعة':'Pending Redemption Requests'}</h3>
                <span id="coinReqCountBadge" style="background:var(--gold3);color:#0a0a0e;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
                <button onclick="adminLoadCoinRequests()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                    <i class="fa-solid fa-rotate"></i> ${isAR?'تحديث':'Refresh'}
                </button>
            </div>
            <div id="coinReqList" style="display:flex;flex-direction:column;gap:10px;">
                <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
        </div>`;
        try { window._coinSettingsDraft = await window._loadCoinSettings(); }
        catch(e) { window._coinSettingsDraft = { ...window.DEFAULT_COIN_SETTINGS }; }
        renderCoinSettingsForm();
        adminLoadCoinRequests();
    }

    /* ─── ADMIN: MANUAL COIN BALANCE MANAGEMENT (search a student by email, add/remove coins) ─── */
    window.adminCoinMgmtSearch = async function() {
        const isAR = lang === 'AR';
        const emailInput = document.getElementById('coinMgmtEmail');
        const resultEl = document.getElementById('coinMgmtResult');
        const email = (emailInput?.value || '').trim().toLowerCase();
        if (!resultEl) return;
        if (!email) { showToast(isAR?'من فضلك أدخل البريد الإلكتروني':'Please enter an email', true); return; }
        resultEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const users = await window._loadAllUsers();
            window._adminUsersCache = users;
            const u = users.find(x => (x.email || '').trim().toLowerCase() === email);
            if (!u) {
                resultEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-user-slash" style="display:block;font-size:22px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا يوجد طالب مسجل بهذا البريد الإلكتروني':'No registered student found with this email'}</div>`;
                return;
            }
            window._coinMgmtUid = u.uid;
            renderCoinMgmtResult(u);
        } catch(e) {
            console.error('adminCoinMgmtSearch error:', e);
            resultEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">${(isAR?'حدث خطأ أثناء البحث: ':'Search error: ')}${e?.message || e}</div>`;
        }
    };

    function renderCoinMgmtResult(u) {
        const isAR = lang === 'AR';
        const resultEl = document.getElementById('coinMgmtResult');
        if (!resultEl) return;
        const fullName = ((u.firstName||'') + ' ' + (u.lastName||'')).trim() || 'User';
        const letter = fullName[0].toUpperCase();
        const hasImg = !!(u.profileImg);
        const avatarBg = hasImg ? `background-image:url('${u.profileImg}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,var(--g2),var(--g4));`;
        resultEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;border:2px solid rgba(212,160,23,0.4);${avatarBg}">${hasImg?'':letter}</div>
                <div style="flex:1;min-width:160px;">
                    <div style="font-weight:700;font-size:13.5px;">${fullName}</div>
                    <div style="font-size:11px;color:var(--muted);direction:ltr;text-align:${isAR?'right':'left'};">${u.email||''}</div>
                </div>
                <div style="text-align:center;padding:6px 14px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:8px;">
                    <div id="coinMgmtBalance" style="font-size:15px;font-weight:800;color:var(--gold3);">${u.coins||0}</div>
                    <div style="font-size:9px;color:var(--muted);">${isAR?'الرصيد الحالي':'current balance'}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap;">
                <input type="number" min="1" id="coinMgmtAmount" value="100" style="width:130px;padding:9px 12px;border-radius:9px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-family:'Tajawal',sans-serif;font-size:13px;">
                <button onclick="adminApplyCoinAdjustment(1)" style="display:flex;align-items:center;gap:6px;padding:9px 16px;background:rgba(var(--brand2-rgb,39,163,70),0.12);border:1px solid rgba(var(--brand2-rgb,39,163,70),0.3);border-radius:9px;color:var(--green4);font-weight:700;font-size:12.5px;cursor:pointer;font-family:'Tajawal',sans-serif;">
                    <i class="fa-solid fa-plus"></i> ${isAR?'إضافة عملات':'Add coins'}
                </button>
                <button onclick="adminApplyCoinAdjustment(-1)" style="display:flex;align-items:center;gap:6px;padding:9px 16px;background:rgba(220,50,50,0.1);border:1px solid rgba(220,50,50,0.3);border-radius:9px;color:#ff6b6b;font-weight:700;font-size:12.5px;cursor:pointer;font-family:'Tajawal',sans-serif;">
                    <i class="fa-solid fa-minus"></i> ${isAR?'خصم عملات':'Remove coins'}
                </button>
            </div>`;
    }

    window.adminApplyCoinAdjustment = async function(sign) {
        const isAR = lang === 'AR';
        const uid = window._coinMgmtUid;
        if (!uid) return;
        const amtInput = document.getElementById('coinMgmtAmount');
        const amount = parseInt(amtInput?.value, 10);
        if (!amount || amount <= 0) { showToast(isAR?'أدخل عدد صحيح أكبر من صفر':'Enter a valid positive amount', true); return; }
        try {
            const users = window._adminUsersCache || await window._loadAllUsers();
            const u = users.find(x => x.uid === uid);
            const currentBalance = u?.coins || 0;
            let appliedAmount = amount;
            if (sign < 0 && amount > currentBalance) {
                appliedAmount = currentBalance;
            }
            if (appliedAmount <= 0) { showToast(isAR?'رصيد الطالب صفر بالفعل':'Student balance is already zero', true); return; }
            await window._adjustUserCoinsManual(uid, appliedAmount, sign > 0 ? 'earn' : 'spend');
            showToast(sign > 0
                ? (isAR ? `✓ تم إضافة ${appliedAmount} عملة` : `✓ Added ${appliedAmount} coins`)
                : (isAR ? `✓ تم خصم ${appliedAmount} عملة` : `✓ Deducted ${appliedAmount} coins`));

            // Refresh cache + result card + members list (if visible)
            const freshUsers = await window._loadAllUsers();
            window._adminUsersCache = freshUsers;
            const freshUser = freshUsers.find(x => x.uid === uid);
            if (freshUser) renderCoinMgmtResult(freshUser);
            if (document.getElementById('membersList')) adminLoadMembers();
        } catch(e) {
            console.error('adminApplyCoinAdjustment error:', e);
            const permDenied = e?.code === 'permission-denied';
            showToast(permDenied
                ? (isAR ? 'قواعد Firestore رفضت التعديل — لازم تسمح للأدمن بالكتابة على users/coins و coin_transactions (شوف رسالة المحادثة)' : 'Firestore rules rejected the write — admins must be allowed to write users/coins and coin_transactions')
                : ((isAR?'خطأ: ':'Error: ') + (e?.message || e?.code || String(e))), true);
        }
    };

    function renderCoinSettingsForm() {
        const root = document.getElementById('coinSettingsRoot');
        if (!root) return;
        const isAR = lang === 'AR';
        const s = window._coinSettingsDraft || { ...window.DEFAULT_COIN_SETTINGS };
        const tiers = s.tiers || [];
        root.innerHTML = `
        <div class="form-card">
            <h3><i class="fa-solid fa-sliders" style="color:var(--g3);margin-left:8px;"></i>${isAR?'الإعدادات العامة':'General Settings'}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>${isAR?'اسم العملة':'Coin Name'}</label>
                    <input type="text" id="cs_coinName" value="${escapeHtmlAC(s.coinName)}" placeholder="ATLAS Coins">
                </div>
                <div class="form-group">
                    <label>${isAR?'رمز العملة (إيموجي)':'Coin Symbol (emoji)'}</label>
                    <input type="text" id="cs_coinSymbol" value="${escapeHtmlAC(s.coinSymbol)}" placeholder="🪙" maxlength="4">
                </div>
                <div class="form-group">
                    <label>${isAR?'الحد الأقصى للعملات يومياً (0 = بدون حد)':'Max coins earnable per day (0 = no limit)'}</label>
                    <input type="number" min="0" id="cs_dailyMax" value="${s.dailyMax||0}">
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                    <input type="checkbox" id="cs_redemptionEnabled" ${s.redemptionEnabled?'checked':''}> ${isAR?'السماح للطلاب باستبدال العملات مقابل PRO':'Allow students to redeem coins for PRO'}
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                    <input type="checkbox" id="cs_autoApprove" ${s.autoApprove?'checked':''}> ${isAR?'إضافة PRO تلقائياً بعد الاستبدال (بدون الحاجة لموافقة الإدارة)':'Auto-activate PRO right after redemption (no admin approval needed)'}
                </label>
            </div>
        </div>

        <div class="form-card" style="margin-top:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:10px;">
                <h3 style="margin:0;"><i class="fa-solid fa-table-list" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'باقات الاستبدال (عملات ↔ شهور PRO)':'Redemption Tiers (coins ↔ PRO months)'}</h3>
                <button onclick="coinAddTierRow()" style="display:flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;color:var(--g4);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                    <i class="fa-solid fa-plus"></i> ${isAR?'إضافة باقة':'Add Tier'}
                </button>
            </div>
            <div id="cs_tiersList" style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
                ${tiers.map((t,i) => coinTierRowHTML(t,i,isAR)).join('') || `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12.5px;">${isAR?'لا توجد باقات بعد':'No tiers yet'}</div>`}
            </div>
        </div>

        <button class="btn-save" style="margin-top:16px;width:auto;padding:11px 26px;" id="coinSettingsSaveBtn" onclick="saveCoinSettings()">
            <i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العملات':'Save Coin Settings'}</span>
        </button>`;
    }

    function coinTierRowHTML(t, i, isAR) {
        return `<div class="cs-tier-row" data-idx="${i}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;">
                <label style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${isAR?'عدد الشهور':'Months'}</label>
                <input type="number" min="1" class="cs_tier_months" value="${t.months}" style="width:100%;">
            </div>
            <div style="flex:1;min-width:140px;">
                <label style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${isAR?'عدد العملات المطلوبة':'Coins required'}</label>
                <input type="number" min="1" class="cs_tier_coins" value="${t.coins}" style="width:100%;">
            </div>
            <button onclick="coinRemoveTierRow(${i})" style="align-self:flex-end;display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;cursor:pointer;">
                <i class="fa-solid fa-trash" style="font-size:12px;"></i>
            </button>
        </div>`;
    }

    // Reads current input values out of the DOM back into the draft array (so edits
    // survive add/remove row operations without losing what the admin already typed).
    function syncTiersFromDOM() {
        const rows = document.querySelectorAll('#cs_tiersList .cs-tier-row');
        const tiers = [];
        rows.forEach(row => {
            const months = parseInt(row.querySelector('.cs_tier_months')?.value, 10) || 1;
            const coins = parseInt(row.querySelector('.cs_tier_coins')?.value, 10) || 1;
            tiers.push({ months, coins });
        });
        if (window._coinSettingsDraft) window._coinSettingsDraft.tiers = tiers;
        return tiers;
    }

    window.coinAddTierRow = function() {
        syncTiersFromDOM();
        window._coinSettingsDraft.tiers.push({ months: 1, coins: 1000 });
        renderCoinSettingsForm();
    };

    window.coinRemoveTierRow = function(i) {
        const tiers = syncTiersFromDOM();
        tiers.splice(i, 1);
        window._coinSettingsDraft.tiers = tiers;
        renderCoinSettingsForm();
    };

    window.saveCoinSettings = async function() {
        const isAR = lang === 'AR';
        const btn = document.getElementById('coinSettingsSaveBtn');
        const coinName = document.getElementById('cs_coinName')?.value.trim() || 'ATLAS Coins';
        const coinSymbol = document.getElementById('cs_coinSymbol')?.value.trim() || '🪙';
        const dailyMax = parseInt(document.getElementById('cs_dailyMax')?.value, 10) || 0;
        const redemptionEnabled = !!document.getElementById('cs_redemptionEnabled')?.checked;
        const autoApprove = !!document.getElementById('cs_autoApprove')?.checked;
        const tiers = syncTiersFromDOM();
        if (!tiers.length) { showToast(isAR?'أضف باقة واحدة على الأقل':'Add at least one tier', true); return; }

        const data = { coinName, coinSymbol, dailyMax, redemptionEnabled, autoApprove, tiers };
        window._coinSettingsDraft = data;
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            await window._saveCoinSettings(data);
            showToast(isAR?'✓ تم حفظ إعدادات العملات':'✓ Coin settings saved');
        } catch(e) {
            console.error('save coin settings error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
        }
        if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العملات':'Save Coin Settings'}</span>`; }
    };

    window.adminLoadCoinRequests = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('coinReqList');
        const badge = document.getElementById('coinReqCountBadge');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const all = await window._loadCoinRedemptionRequests();
            const pending = all.filter(r => r.status === 'pending');
            if (badge) { badge.textContent = pending.length; badge.style.display = pending.length ? 'inline-flex' : 'none'; }
            if (!pending.length) {
                list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-check-circle" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات استبدال قيد المراجعة':'No pending redemption requests'}</div>`;
                return;
            }
            list.innerHTML = pending.map(r => {
                const timeStr = r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                const monthsLabel = r.months === 1 ? (isAR?'شهر':'1 month') : (isAR?`${r.months} أشهر`:`${r.months} months`);
                return `<div id="coinReq_${r.id}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(212,160,23,0.04);border:1px solid rgba(212,160,23,0.18);border-radius:12px;flex-wrap:wrap;">
                    <div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;background:rgba(212,160,23,0.12);display:flex;align-items:center;justify-content:center;color:var(--gold3);font-size:16px;"><i class="fa-solid fa-coins"></i></div>
                    <div style="flex:1;min-width:160px;">
                        <div style="font-size:13px;font-weight:800;">${escapeHtmlAC(r.userName||r.userId||'')}</div>
                        <div style="font-size:12px;color:var(--gold3);font-weight:700;margin-top:2px;">${escapeHtmlAC(String(r.coins))} 🪙 → ${monthsLabel} PRO</div>
                        ${timeStr ? `<div style="font-size:10.5px;color:var(--muted);margin-top:3px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:8px;flex-shrink:0;">
                        <button onclick="approveCoinReq('${r.id}','${r.userId}',${r.months},${r.coins})" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(var(--brand-rgb,30,122,52),0.12);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;color:var(--g4);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-check"></i> ${isAR?'موافقة':'Approve'}
                        </button>
                        <button onclick="rejectCoinReq('${r.id}','${r.userId}',${r.coins})" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-xmark"></i> ${isAR?'رفض':'Reject'}
                        </button>
                    </div>
                </div>`;
            }).join('');
        } catch(e) {
            console.error('load coin requests error:', e);
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    window.approveCoinReq = async function(reqId, uid, months, coins) {
        const isAR = lang === 'AR';
        const row = document.getElementById(`coinReq_${reqId}`);
        if (row) row.style.opacity = '0.5';
        try {
            await window._approveCoinRedemption(reqId, uid, months, coins);
            showToast(isAR?'✓ تم تفعيل PRO للطالب':'✓ PRO activated for the student');
            adminLoadCoinRequests();
        } catch(e) {
            console.error('approve error:', e);
            showToast(isAR?'حدث خطأ أثناء الموافقة':'An error occurred while approving', true);
            if (row) row.style.opacity = '1';
        }
    };

    window.rejectCoinReq = async function(reqId, uid, coins) {
        const isAR = lang === 'AR';
        const reason = window.prompt(isAR?'سبب الرفض (اختياري):':'Rejection reason (optional):') || '';
        const row = document.getElementById(`coinReq_${reqId}`);
        if (row) row.style.opacity = '0.5';
        try {
            await window._rejectCoinRedemption(reqId, uid, coins, reason);
            showToast(isAR?'تم الرفض ورد العملات للطالب':'Rejected and coins refunded to the student');
            adminLoadCoinRequests();
        } catch(e) {
            console.error('reject error:', e);
            showToast(isAR?'حدث خطأ أثناء الرفض':'An error occurred while rejecting', true);
            if (row) row.style.opacity = '1';
        }
    };

    /* ─── ADMIN: FORTUNE WHEEL & GIFT WHEEL SETTINGS ─── */
    async function renderAdminWheelSettings(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'🎡 عجلة الحظ وعجلة الهدايا':'🎡 Fortune Wheel & Gift Wheel'}</h2>
            <p>${isAR?'تحكم كامل في المكافآت، احتمالية كل خانة، مدة المحاولة اليومية، ومدة تفعيل الهدايا':'Full control over rewards, each slot\'s odds, the daily attempt cooldown, and gift durations'}</p>
        </div>
        <div id="wheelSettingsRoot">
            <div style="text-align:center;padding:40px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>
        <div class="form-card" style="margin-top:16px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <h3 style="margin:0;"><i class="fa-solid fa-ticket" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'أكواد الخصم':'Discount Codes'}</h3>
                <button onclick="adminLoadDiscountCodes()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                    <i class="fa-solid fa-rotate"></i> ${isAR?'تحديث':'Refresh'}
                </button>
            </div>
            <div id="wheelCodesList" style="display:flex;flex-direction:column;gap:8px;">
                <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
        </div>
        <div class="form-card" style="margin-top:16px;">
            <h3><i class="fa-solid fa-list" style="color:var(--g4);margin-left:8px;"></i>${isAR?'آخر نتائج العجلة':'Recent Wheel Spins'}</h3>
            <div id="wheelSpinLogList" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
                <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
        </div>`;
        try { window._wheelSettingsDraft = await window._loadWheelConfig(); }
        catch(e) { window._wheelSettingsDraft = JSON.parse(JSON.stringify(window.DEFAULT_WHEEL_CONFIG)); }
        renderWheelSettingsForm();
        adminLoadDiscountCodes();
        adminLoadWheelSpinLog();
    }

    const WHEEL_BASIC_SLOT_LABELS_AR = { coin1:'عملات (خانة 1)', coin2:'عملات (خانة 2)', coin3:'عملات (خانة 3)', extraSpin:'لفة إضافية', gift:'هدية مفاجأة', lose1:'حاول مرة أخرى', lose2:'حظ أوفر في المرة القادمة' };
    const WHEEL_BASIC_SLOT_LABELS_EN = { coin1:'Coins (slot 1)', coin2:'Coins (slot 2)', coin3:'Coins (slot 3)', extraSpin:'Extra Spin', gift:'Surprise Gift', lose1:'Try Again', lose2:'Better Luck Next Time' };
    const WHEEL_BASIC_ORDER = ['coin1','coin2','coin3','extraSpin','gift','lose1','lose2'];
    const WHEEL_GIFT_ORDER = ['promonth','tempfeature','discount','boost'];

    function renderWheelSettingsForm() {
        const root = document.getElementById('wheelSettingsRoot');
        if (!root) return;
        const isAR = lang === 'AR';
        const s = window._wheelSettingsDraft || JSON.parse(JSON.stringify(window.DEFAULT_WHEEL_CONFIG));
        root.innerHTML = `
        <div class="form-card">
            <h3><i class="fa-solid fa-sliders" style="color:var(--g3);margin-left:8px;"></i>${isAR?'الإعدادات العامة':'General Settings'}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>${isAR?'مدة المحاولة اليومية (ساعة)':'Daily attempt cooldown (hours)'}</label>
                    <input type="number" min="1" id="ws_cooldown" value="${s.cooldownHours||24}">
                </div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:12px;">
                <input type="checkbox" id="ws_enabled" ${s.enabled!==false?'checked':''}> ${isAR?'تفعيل عجلة الحظ للطلاب':'Enable the wheel for students'}
            </label>
        </div>

        <div class="form-card" style="margin-top:16px;">
            <h3><i class="fa-solid fa-flask" style="color:var(--g3);margin-left:8px;"></i>${isAR?'وضع الاختبار':'Test Mode'}</h3>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:12px;">${isAR?'فعّل ده وحط الـ UID بتاع حسابك اللي بتختبر بيه، هيقدر يلف العجلة براحته من غير انتظار 24 ساعة — وباقي الطلاب هيفضلوا على مدة الانتظار العادية زي ماهي':'Turn this on and enter the UID of the account you\'re testing with — that one account can spin any time with no 24h wait, while every other student keeps the normal cooldown untouched'}</p>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:12px;">
                <input type="checkbox" id="ws_testmode_enabled" ${s.testModeEnabled?'checked':''}> ${isAR?'تفعيل وضع الاختبار (تجاهل الانتظار لحساب واحد بس)':'Enable test mode (bypass cooldown for one account only)'}
            </label>
            <div class="form-group">
                <label>${isAR?'إيميل حساب الاختبار':'Test account email'}</label>
                <input type="email" id="ws_testmode_email" value="${s.testModeEmail||''}" placeholder="${isAR?'إيميل حساب الطالب اللي هتختبر بيه':'The student account email you\'ll test with'}" style="direction:ltr;text-align:left;">
            </div>
        </div>

        <div class="form-card" style="margin-top:16px;">
            <h3><i class="fa-solid fa-dharmachakra" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'خانات عجلة الحظ الأساسية (7 خانات)':'Basic Wheel Slots (7 slots)'}</h3>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:12px;">${isAR?'الاحتمالية = وزن الخانة ÷ مجموع كل الأوزان. زوّد الوزن لخانة عشان تزيد فرصتها':'Odds = this slot\'s weight ÷ the sum of all weights. Raise a slot\'s weight to raise its chance'}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                ${WHEEL_BASIC_ORDER.map(k => {
                    const slot = s.basic[k] || {};
                    const label = isAR ? WHEEL_BASIC_SLOT_LABELS_AR[k] : WHEEL_BASIC_SLOT_LABELS_EN[k];
                    const hasAmount = k === 'coin1' || k === 'coin2' || k === 'coin3';
                    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:140px;font-size:12.5px;font-weight:700;">${label}</div>
                        ${hasAmount ? `<div style="min-width:100px;"><label style="font-size:11px;color:var(--muted);">${isAR?'عدد العملات':'Coins'}</label><input type="number" min="1" class="ws_basic_amount" data-key="${k}" value="${slot.amount||10}" style="width:100%;"></div>` : ''}
                        <div style="min-width:100px;"><label style="font-size:11px;color:var(--muted);">${isAR?'الوزن (الاحتمالية)':'Weight (odds)'}</label><input type="number" min="0" class="ws_basic_weight" data-key="${k}" value="${slot.weight||0}" style="width:100%;"></div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="form-card" style="margin-top:16px;">
            <h3><i class="fa-solid fa-gift" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'خانات عجلة الهدايا (4 خانات)':'Gift Wheel Slots (4 slots)'}</h3>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:12px;">${isAR?'تفتح هذه العجلة تلقائياً لما الطالب يوقف على 🎁 في العجلة الأساسية':'This wheel opens automatically when a student lands on 🎁 on the basic wheel'}</p>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;">
                    <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">👑 ${isAR?'اشتراك ATLASYA PRO مجاني':'Free ATLASYA PRO subscription'}</div>
                    <div class="form-grid">
                        <div class="form-group"><label>${isAR?'عدد الشهور':'Months'}</label><input type="number" min="1" id="ws_gift_promonth_months" value="${s.gift.promonth?.months||1}"></div>
                        <div class="form-group"><label>${isAR?'الوزن (الاحتمالية)':'Weight (odds)'}</label><input type="number" min="0" id="ws_gift_promonth_weight" value="${s.gift.promonth?.weight||10}"></div>
                    </div>
                </div>
                <div style="padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;">
                    <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">🔓 ${isAR?'فتح ميزة PRO مؤقتاً':'Temporary PRO feature unlock'}</div>
                    <div class="form-grid">
                        <div class="form-group"><label>${isAR?'اسم الميزة (عربي)':'Feature name (Arabic)'}</label><input type="text" id="ws_gift_tf_ar" value="${escapeHtmlAC(s.gift.tempfeature?.featureAR||'')}"></div>
                        <div class="form-group"><label>${isAR?'اسم الميزة (إنجليزي)':'Feature name (English)'}</label><input type="text" id="ws_gift_tf_en" value="${escapeHtmlAC(s.gift.tempfeature?.featureEN||'')}"></div>
                        <div class="form-group"><label>${isAR?'مدة الفتح (ساعة)':'Unlock duration (hours)'}</label><input type="number" min="1" id="ws_gift_tf_hours" value="${s.gift.tempfeature?.hours||24}"></div>
                        <div class="form-group"><label>${isAR?'الوزن (الاحتمالية)':'Weight (odds)'}</label><input type="number" min="0" id="ws_gift_tf_weight" value="${s.gift.tempfeature?.weight||25}"></div>
                    </div>
                    <p style="font-size:10.5px;color:var(--muted);margin-top:6px;">${isAR?'ملحوظة: تقنياً بيفتح كل مميزات PRO مؤقتاً للطالب خلال المدة دي، والاسم هنا للعرض بس':'Note: technically this temporarily unlocks all PRO features for the student during this window — the name above is just for display'}</p>
                </div>
                <div style="padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;">
                    <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">🎟️ ${isAR?'قسيمة خصم':'Discount coupon'}</div>
                    <div class="form-grid">
                        <div class="form-group"><label>${isAR?'نسبة الخصم %':'Discount %'}</label><input type="number" min="1" max="100" id="ws_gift_disc_percent" value="${s.gift.discount?.percent||10}"></div>
                        <div class="form-group"><label>${isAR?'خطة PRO المستحقة للخصم':'PRO plan this discount applies to'}</label><select id="ws_gift_disc_months">
                            <option value="1" ${(s.gift.discount?.requiredMonths||6)==1?'selected':''}>${isAR?'شهر واحد':'1 month'}</option>
                            <option value="3" ${(s.gift.discount?.requiredMonths||6)==3?'selected':''}>${isAR?'3 أشهر':'3 months'}</option>
                            <option value="6" ${(s.gift.discount?.requiredMonths||6)==6?'selected':''}>${isAR?'6 أشهر':'6 months'}</option>
                        </select></div>
                        <div class="form-group"><label>${isAR?'مدة صلاحية الكود (يوم)':'Code validity (days)'}</label><input type="number" min="1" id="ws_gift_disc_days" value="${s.gift.discount?.validDays||14}"></div>
                        <div class="form-group"><label>${isAR?'الوزن (الاحتمالية)':'Weight (odds)'}</label><input type="number" min="0" id="ws_gift_disc_weight" value="${s.gift.discount?.weight||35}"></div>
                    </div>
                </div>
                <div style="padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;">
                    <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">⚡ ${isAR?'مضاعفة العملات':'Coin multiplier boost'}</div>
                    <div class="form-grid">
                        <div class="form-group"><label>${isAR?'قيمة المضاعفة':'Multiplier'}</label><input type="number" min="2" id="ws_gift_boost_mult" value="${s.gift.boost?.multiplier||2}"></div>
                        <div class="form-group"><label>${isAR?'مدة التفعيل (ساعة)':'Duration (hours)'}</label><input type="number" min="1" id="ws_gift_boost_hours" value="${s.gift.boost?.hours||24}"></div>
                        <div class="form-group"><label>${isAR?'الوزن (الاحتمالية)':'Weight (odds)'}</label><input type="number" min="0" id="ws_gift_boost_weight" value="${s.gift.boost?.weight||30}"></div>
                    </div>
                </div>
            </div>
        </div>

        <button class="btn-save" style="margin-top:16px;width:auto;padding:11px 26px;" id="wheelSettingsSaveBtn" onclick="saveWheelSettings()">
            <i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العجلة':'Save Wheel Settings'}</span>
        </button>`;
    }

    window.saveWheelSettings = async function() {
        const isAR = lang === 'AR';
        const btn = document.getElementById('wheelSettingsSaveBtn');
        const enabled = !!document.getElementById('ws_enabled')?.checked;
        const cooldownHours = parseInt(document.getElementById('ws_cooldown')?.value, 10) || 24;
        const testModeEnabled = !!document.getElementById('ws_testmode_enabled')?.checked;
        const testModeEmail = document.getElementById('ws_testmode_email')?.value.trim().toLowerCase() || '';

        const basic = {};
        document.querySelectorAll('.ws_basic_weight').forEach(inp => {
            const k = inp.dataset.key;
            basic[k] = { weight: parseInt(inp.value, 10) || 0 };
        });
        document.querySelectorAll('.ws_basic_amount').forEach(inp => {
            const k = inp.dataset.key;
            if (basic[k]) basic[k].amount = parseInt(inp.value, 10) || 1;
        });

        const gift = {
            promonth: { months: parseInt(document.getElementById('ws_gift_promonth_months')?.value,10)||1, weight: parseInt(document.getElementById('ws_gift_promonth_weight')?.value,10)||0 },
            tempfeature: {
                featureAR: document.getElementById('ws_gift_tf_ar')?.value.trim() || '',
                featureEN: document.getElementById('ws_gift_tf_en')?.value.trim() || '',
                hours: parseInt(document.getElementById('ws_gift_tf_hours')?.value,10)||24,
                weight: parseInt(document.getElementById('ws_gift_tf_weight')?.value,10)||0
            },
            discount: {
                percent: parseInt(document.getElementById('ws_gift_disc_percent')?.value,10)||10,
                requiredMonths: parseInt(document.getElementById('ws_gift_disc_months')?.value,10)||6,
                validDays: parseInt(document.getElementById('ws_gift_disc_days')?.value,10)||14,
                weight: parseInt(document.getElementById('ws_gift_disc_weight')?.value,10)||0
            },
            boost: {
                multiplier: parseInt(document.getElementById('ws_gift_boost_mult')?.value,10)||2,
                hours: parseInt(document.getElementById('ws_gift_boost_hours')?.value,10)||24,
                weight: parseInt(document.getElementById('ws_gift_boost_weight')?.value,10)||0
            }
        };

        // Resolve the typed email to that student's uid, since the wheel's cooldown-bypass
        // check on the student side matches by uid, not by email.
        let testModeUid = '';
        if (testModeEnabled && testModeEmail) {
            try {
                const allUsers = window._adminUsersCache && window._adminUsersCache.length ? window._adminUsersCache : await window._loadAllUsers();
                const match = allUsers.find(u => (u.email || '').trim().toLowerCase() === testModeEmail);
                if (match) {
                    testModeUid = match.uid;
                } else {
                    showToast(isAR?'مفيش طالب مسجل بهذا الإيميل — راجع الإيميل وحاول تاني':'No student found with that email — please check it and try again', true);
                    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العجلة':'Save Wheel Settings'}</span>`; }
                    return;
                }
            } catch(e) {
                console.error('resolve test mode email error:', e);
                showToast(isAR?'حدث خطأ أثناء البحث عن الطالب':'An error occurred while looking up the student', true);
                if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العجلة':'Save Wheel Settings'}</span>`; }
                return;
            }
        }

        const data = { enabled, cooldownHours, testModeEnabled, testModeEmail, testModeUid, basic, gift };
        window._wheelSettingsDraft = data;
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            await window._saveWheelConfig(data);
            showToast(isAR?'✓ تم حفظ إعدادات العجلة':'✓ Wheel settings saved');
        } catch(e) {
            console.error('save wheel settings error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
        }
        if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ إعدادات العجلة':'Save Wheel Settings'}</span>`; }
    };

    window.adminLoadDiscountCodes = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('wheelCodesList');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const codes = await window._loadDiscountCodes();
            if (!codes.length) {
                list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد أكواد خصم بعد':'No discount codes yet'}</div>`;
                return;
            }
            list.innerHTML = codes.map(c => {
                const exp = c.expiresAt?.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
                const expired = !c.used && exp < new Date();
                const timeStr = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                const statusHTML = c.used
                    ? `<span class="job-status-badge" style="background:rgba(120,120,130,0.15);color:var(--muted);">${isAR?'مُستخدم':'Used'}</span>`
                    : expired ? `<span class="job-status-badge rejected">${isAR?'منتهي':'Expired'}</span>`
                    : `<span class="job-status-badge approved">${isAR?'فعّال':'Active'}</span>`;
                return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:160px;">
                        <div style="font-size:12.5px;font-weight:800;direction:ltr;text-align:start;">${c.code}</div>
                        <div style="font-size:10.5px;color:var(--muted);">${escapeHtmlAC(c.userId||'')} — ${c.percent}% / ${c.requiredMonths} ${isAR?'شهر':'mo'} — ${timeStr}</div>
                    </div>
                    ${statusHTML}
                    ${(!c.used && !expired) ? `<button onclick="adminMarkCodeUsed('${c.code}')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:11px;cursor:pointer;font-family:'Tajawal',sans-serif;">${isAR?'تعليم كمستخدم':'Mark used'}</button>` : ''}
                    ${c.used ? `<button onclick="adminUnmarkCodeUsed('${c.code}')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:11px;cursor:pointer;font-family:'Tajawal',sans-serif;">${isAR?'استرجاع':'Restore'}</button>` : ''}
                </div>`;
            }).join('');
        } catch(e) {
            console.error('load discount codes error:', e);
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    window.adminMarkCodeUsed = async function(code) {
        try { await window._markDiscountCodeUsed(code); adminLoadDiscountCodes(); }
        catch(e) { console.error(e); showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.adminUnmarkCodeUsed = async function(code) {
        try { await window._markDiscountCodeUnused(code); adminLoadDiscountCodes(); }
        catch(e) { console.error(e); showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.adminLoadWheelSpinLog = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('wheelSpinLogList');
        if (!list) return;
        try {
            const spins = await window._loadWheelSpinLog(50);
            if (!spins.length) {
                list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12.5px;">${isAR?'لا توجد لفات بعد':'No spins yet'}</div>`;
                return;
            }
            const basicLabels = isAR ? WHEEL_BASIC_SLOT_LABELS_AR : WHEEL_BASIC_SLOT_LABELS_EN;
            const giftLabels = { promonth: isAR?'شهر PRO':'PRO month', tempfeature: isAR?'ميزة مؤقتة':'Temp feature', discount: isAR?'كود خصم':'Discount code', boost: isAR?'مضاعفة عملات':'Coin boost' };
            list.innerHTML = spins.map(sp => {
                const label = sp.wheelType === 'gift' ? (giftLabels[sp.resultType]||sp.resultType) : (basicLabels[sp.resultType]||sp.resultType);
                const timeStr = sp.createdAt?.toDate ? sp.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);font-size:11.5px;">
                    <span style="color:var(--muted);">${escapeHtmlAC(sp.userId||'')}</span>
                    <span style="font-weight:700;">${sp.wheelType==='gift'?'🎁':'🎡'} ${label}${sp.coinsAwarded?` (+${sp.coinsAwarded})`:''}</span>
                    <span style="color:var(--muted);">${timeStr}</span>
                </div>`;
            }).join('');
        } catch(e) {
            console.error('load wheel spin log error:', e);
            list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12.5px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    /* ─── ADMIN: STUDENT MAPS MANAGEMENT ─── */
    async function renderAdminPortfolio(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR ? 'إدارة خرائط الطلبة' : 'Manage Student Maps'}</h2>
            <p>${isAR ? 'استعرض وأدر المشاريع المنشورة من الطلاب' : 'View and manage maps published by students'}</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
            <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                <i class="fa-solid fa-map-location-dot" style="color:var(--g3);"></i>
                ${isAR ? 'الخرائط المنشورة' : 'Published Maps'}
                <span id="adminMapsCountBadge" style="background:var(--g3);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
            </h4>
            <button onclick="adminLoadPortfolioItems()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:10px;color:var(--g4);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(var(--brand-rgb,30,122,52),0.22)'" onmouseout="this.style.background='rgba(var(--brand-rgb,30,122,52),0.1)'">
                <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
            </button>
        </div>
        <div id="adminMapsList" style="display:flex;flex-direction:column;gap:10px;">
            <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>`;
        setTimeout(() => adminLoadPortfolioItems(), 100);
    }

    window.adminLoadPortfolioItems = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('adminMapsList');
        const badge = document.getElementById('adminMapsCountBadge');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const items = await window._loadPortfolioItems();
            if (badge) badge.textContent = items.length;
            if (!items.length) {
                list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-map" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد خرائط منشورة بعد':'No published maps yet'}</div>`;
                return;
            }
            list.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">
                ${items.map(it => {
                    const isImg = it.fileData && /^data:image\//.test(it.fileData);
                    const thumb = isImg
                        ? `<div style="width:52px;height:52px;border-radius:8px;background-image:url('${it.fileData}');background-size:cover;background-position:center;flex-shrink:0;cursor:pointer;" onclick="openPortfolioLightbox('${it.id}')"></div>`
                        : `<div style="width:52px;height:52px;border-radius:8px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🗺️</div>`;
                    const timeStr = it.createdAt?.toDate ? it.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;transition:0.2s;">
                        ${thumb}
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:13px;font-weight:700;color:var(--text);">${it.title||'—'}</div>
                            <div style="font-size:11px;color:var(--gold3);font-weight:700;margin-top:2px;">${it.authorName||''}</div>
                            ${it.desc ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${it.desc}</div>` : ''}
                            ${timeStr ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div>` : ''}
                        </div>
                        <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                            ${isImg ? `<button onclick="openPortfolioLightbox('${it.id}')" style="display:flex;align-items:center;gap:4px;padding:7px 12px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;color:var(--green4);font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;" title="${isAR?'عرض':'View'}"><i class="fa-solid fa-expand"></i></button>` : ''}
                            <button onclick="adminDeletePortfolioItem('${it.id}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(220,50,50,0.22)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'" title="${isAR?'حذف':'Delete'}">
                                <i class="fa-solid fa-trash" style="font-size:13px;"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        } catch(e) {
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    window.adminDeletePortfolioItem = async function(itemId) {
        const isAR = lang === 'AR';
        if (!confirm(isAR ? 'حذف هذه الخريطة نهائياً؟' : 'Delete this map permanently?')) return;
        try {
            await window._deletePortfolioItem(itemId);
            showToast(isAR ? '🗑️ تم حذف الخريطة' : '🗑️ Map deleted');
            // Remove from cache too
            _portfolioItemsCache = _portfolioItemsCache.filter(x => x.id !== itemId);
            adminLoadPortfolioItems();
        } catch(e) {
            showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
        }
    };

    /* ─── ADMIN: COURSES MODERATION ─── */
    let _acAllCourses = [];
    let _acTab = 'companies'; // 'companies' | 'free'
    let _acStatusFilter = 'all'; // all | pending | approved | rejected
    let _acSearch = '';
    let _acCompanyFilter = '';
    let _acFreeCourses = [];

    function escapeHtmlAC(str) {
        return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function renderAdminCourses(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة الكورسات':'Manage Courses'}</h2>
            <p>${isAR?'راجع كورسات الشركات ووافق عليها، وأضف كورسات مجانية':'Review company courses and approve them, and add free courses'}</p>
        </div>
        <div class="ac-tabs">
            <button class="ac-tab ${_acTab==='companies'?'active':''}" onclick="switchACTab('companies')"><i class="fa-solid fa-building"></i> ${isAR?'كورسات الشركات':'Company Courses'}</button>
            <button class="ac-tab ${_acTab==='free'?'active':''}" onclick="switchACTab('free')"><i class="fa-solid fa-gift"></i> ${isAR?'الكورسات المجانية':'Free Courses'}</button>
        </div>
        <div id="acBody"></div>`;
        renderACBody();
    }

    window.switchACTab = function(tab) {
        _acTab = tab;
        document.querySelectorAll('.ac-tab').forEach((b,i) => b.classList.toggle('active', (tab==='companies'&&i===0)||(tab==='free'&&i===1)));
        renderACBody();
    };

    async function renderACBody() {
        const body = document.getElementById('acBody');
        if (!body) return;
        const isAR = lang === 'AR';
        body.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

        if (_acTab === 'free') {
            try { _acFreeCourses = await window._loadFreeCoursesAdmin(); } catch(e) { _acFreeCourses = []; }
            body.innerHTML = `
            <button class="btn-post-job" style="margin-bottom:16px;" onclick="openFreeCourseAdminForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة كورس مجاني':'Add Free Course'}</button>
            <div id="acFreeList">
                ${_acFreeCourses.length ? _acFreeCourses.map(c => acFreeCourseRowHTML(c, isAR)).join('') : `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد كورسات مجانية بعد':'No free courses yet'}</div>`}
            </div>`;
            return;
        }

        try { _acAllCourses = await window._loadAllCourses(); } catch(e) { _acAllCourses = []; }
        const companies = [...new Set(_acAllCourses.map(c => c.companyName).filter(Boolean))];
        const counts = { all: _acAllCourses.length, pending: 0, approved: 0, rejected: 0 };
        _acAllCourses.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

        body.innerHTML = `
        <div class="ac-toolbar">
            <input type="text" id="acSearchInput" placeholder="${isAR?'ابحث عن كورس أو شركة...':'Search course or company...'}" value="${_acSearch}" oninput="onACFilterChange()">
            <select id="acStatusSelect" onchange="onACFilterChange()">
                <option value="all" ${_acStatusFilter==='all'?'selected':''}>${isAR?'كل الحالات':'All Statuses'} (${counts.all})</option>
                <option value="pending" ${_acStatusFilter==='pending'?'selected':''}>${isAR?'قيد المراجعة':'Pending'} (${counts.pending})</option>
                <option value="approved" ${_acStatusFilter==='approved'?'selected':''}>${isAR?'منشورة':'Approved'} (${counts.approved})</option>
                <option value="rejected" ${_acStatusFilter==='rejected'?'selected':''}>${isAR?'مرفوضة':'Rejected'} (${counts.rejected})</option>
            </select>
            <select id="acCompanySelect" onchange="onACFilterChange()">
                <option value="">${isAR?'كل الشركات':'All Companies'}</option>
                ${companies.map(c => `<option value="${c}" ${_acCompanyFilter===c?'selected':''}>${c}</option>`).join('')}
            </select>
        </div>
        <div id="acCoursesList"></div>`;
        renderACFilteredList(isAR);
    }