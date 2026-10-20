
        function selectSettingsLang(code) {
            if (lang !== code) toggleLang();
        }

        /* ─── COIN WALLET UI ─── */
        async function renderWalletRoot() {
            const root = document.getElementById('walletRoot');
            if (!root) return;
            const isAR = lang === 'AR';
            const d = window._userData || {};
            let settings = window.DEFAULT_COIN_SETTINGS;
            let txs = [];
            try { settings = await window._loadCoinSettings(); } catch(e) {}
            try { txs = await window._loadCoinTransactions(window._currentUid || null); } catch(e) { console.error('loadCoinTransactions error:', e); }
            let myCodes = [];
            try { myCodes = await window._getMyDiscountCodes(); } catch(e) {}
            window._walletSettings = settings;

            const root2 = document.getElementById('walletRoot');
            if (!root2) return; // user navigated away while loading

            const balance = d.coins || 0;
            const earned = d.coinsEarnedTotal || 0;
            const spent = d.coinsSpentTotal || 0;
            const sym = settings.coinSymbol || '🪙';
            const nf = (n) => (n||0).toLocaleString(isAR ? 'ar-EG' : 'en-US');

            const tiersHTML = (settings.tiers || []).map((t, i) => {
                const afford = balance >= t.coins;
                const disabled = !afford || !settings.redemptionEnabled;
                const monthsLabel = t.months === 1 ? (isAR?'شهر':'1 month') : (isAR?`${t.months} أشهر`:`${t.months} months`);
                return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:16px;color:#0a0a0e;flex-shrink:0;"><i class="fa-solid fa-crown"></i></div>
                        <div>
                            <div style="font-size:13.5px;font-weight:800;">${isAR?`${monthsLabel} من ATLASYA PRO`:`${monthsLabel} of ATLASYA PRO`}</div>
                            <div style="font-size:12px;color:var(--gold3);font-weight:700;">${nf(t.coins)} ${sym}</div>
                        </div>
                    </div>
                    <button ${disabled?'disabled':''} onclick="openRedeemConfirm(${i})" style="display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;border:none;font-size:12.5px;font-weight:800;font-family:'Tajawal',sans-serif;cursor:${disabled?'not-allowed':'pointer'};background:${disabled?'rgba(255,255,255,0.05)':'linear-gradient(135deg,var(--gold3),var(--gold2))'};color:${disabled?'var(--muted)':'#0a0a0e'};">
                        <i class="fa-solid fa-gift"></i> ${isAR?'استبدال':'Redeem'}
                    </button>
                </div>`;
            }).join('');

            const txHTML = txs.length ? txs.map(tx => {
                const isEarn = tx.type === 'earn';
                const dateStr = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                const reason = isAR ? (tx.reasonAR||'') : (tx.reasonEN||tx.reasonAR||'');
                const statusBadge = tx.status === 'pending' ? `<span style="font-size:11px;color:var(--gold3);">(${isAR?'قيد المراجعة':'pending review'})</span>`
                    : tx.status === 'rejected' ? `<span style="font-size:11px;color:#ff6b6b;">(${isAR?'مرفوض — تم رد العملات':'rejected — coins refunded'})</span>` : '';
                return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                    <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:${isEarn?'rgba(var(--brand-rgb,30,122,52),0.12)':'rgba(220,50,50,0.1)'};display:flex;align-items:center;justify-content:center;color:${isEarn?'var(--g4)':'#ff6b6b'};font-size:13px;">
                        <i class="fa-solid fa-${isEarn?'plus':'minus'}"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:12.5px;font-weight:700;">${reason} ${statusBadge}</div>
                        <div style="font-size:10.5px;color:var(--muted);">${dateStr}</div>
                    </div>
                    <div style="font-size:13px;font-weight:800;color:${isEarn?'var(--g4)':'#ff6b6b'};flex-shrink:0;">${isEarn?'+':'-'}${nf(tx.amount)} ${sym}</div>
                </div>`;
            }).join('') : `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12.5px;">${isAR?'لا توجد عمليات بعد':'No transactions yet'}</div>`;

            root2.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
                <div class="report-stat-card"><div class="rs-icon"><i class="fa-solid fa-coins"></i></div><div class="rs-val">${nf(balance)}</div><div class="rs-label">${isAR?'رصيد العملات الحالي':'Current balance'}</div></div>
                <div class="report-stat-card"><div class="rs-icon"><i class="fa-solid fa-arrow-trend-up"></i></div><div class="rs-val">${nf(earned)}</div><div class="rs-label">${isAR?'إجمالي العملات المكتسبة':'Total earned'}</div></div>
                <div class="report-stat-card"><div class="rs-icon"><i class="fa-solid fa-arrow-trend-down"></i></div><div class="rs-val">${nf(spent)}</div><div class="rs-label">${isAR?'العملات المستخدمة':'Coins used'}</div></div>
            </div>
            <div class="form-card">
                <h3><i class="fa-solid fa-gift" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'🎁 استبدال العملات':'🎁 Redeem Coins'}</h3>
                ${settings.redemptionEnabled ? '' : `<div style="padding:10px 14px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:10px;color:#ff6b6b;font-size:12.5px;margin-bottom:12px;">${isAR?'الاستبدال متوقف مؤقتاً من إدارة المنصة':'Redemption is currently disabled by the platform admin'}</div>`}
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
                    ${tiersHTML || `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12.5px;">${isAR?'لا توجد باقات استبدال متاحة حالياً':'No redemption tiers available yet'}</div>`}
                </div>
            </div>
            ${(myCodes.length || d.coinBoost || d.tempProFeature) ? `<div class="form-card" style="margin-top:16px;">
                <h3><i class="fa-solid fa-dharmachakra" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'🎡 مكافآت عجلة الحظ':'🎡 Fortune Wheel Rewards'}</h3>
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
                    ${myCodes.map(c => {
                        const used = c.used;
                        const exp = c.expiresAt?.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
                        const expired = !used && exp < new Date();
                        const monthsLabel = c.requiredMonths === 1 ? (isAR?'شهر':'1 month') : (isAR?`${c.requiredMonths} أشهر`:`${c.requiredMonths} months`);
                        const statusAR = used ? 'مُستخدم' : (expired ? 'منتهي الصلاحية' : `صالح حتى ${exp.toLocaleDateString('ar-EG')}`);
                        const statusEN = used ? 'Used' : (expired ? 'Expired' : `Valid until ${exp.toLocaleDateString('en-US')}`);
                        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
                            <div>
                                <div style="font-size:13px;font-weight:800;direction:ltr;text-align:start;">${c.code}</div>
                                <div style="font-size:11px;color:var(--muted);">${isAR?`خصم ${c.percent}% على ${monthsLabel}`:`${c.percent}% off ${monthsLabel}`} — ${isAR?statusAR:statusEN}</div>
                            </div>
                            ${!used && !expired ? `<button class="wh-code-copy" onclick="navigator.clipboard.writeText('${c.code}').then(()=>showToast('${isAR?'✅ اتنسخ الكود':'✅ Code copied'}'))">${isAR?'نسخ':'Copy'}</button>` : ''}
                        </div>`;
                    }).join('')}
                    ${d.coinBoost ? `<div style="padding:10px 14px;background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.25);border-radius:10px;font-size:12px;">${isAR?`⚡ مضاعفة العملات ×${d.coinBoost.multiplier} مفعّلة`:`⚡ ×${d.coinBoost.multiplier} coin boost active`}</div>` : ''}
                    ${d.tempProFeature ? `<div style="padding:10px 14px;background:rgba(39,163,70,0.08);border:1px solid rgba(39,163,70,0.25);border-radius:10px;font-size:12px;">${isAR?`🔓 ميزة مؤقتة مفتوحة: ${d.tempProFeature.featureAR||''}`:`🔓 Temp feature unlocked: ${d.tempProFeature.featureEN||''}`}</div>` : ''}
                </div>
            </div>` : ''}
            <div class="form-card" style="margin-top:16px;">
                <h3><i class="fa-solid fa-receipt" style="color:var(--g4);margin-left:8px;"></i>${isAR?'سجل العمليات':'Transaction History'}</h3>
                <div style="margin-top:6px;">${txHTML}</div>
            </div>`;
        }

        window.openRedeemConfirm = function(tierIndex) {
            const isAR = lang === 'AR';
            const settings = window._walletSettings || window.DEFAULT_COIN_SETTINGS;
            const tier = (settings.tiers || [])[tierIndex];
            if (!tier) return;
            const sym = settings.coinSymbol || '🪙';
            const nf = (n) => (n||0).toLocaleString(isAR ? 'ar-EG' : 'en-US');
            const monthsLabel = tier.months === 1 ? (isAR?'شهر':'1 month') : (isAR?`${tier.months} أشهر`:`${tier.months} months`);
            const modal = document.createElement('div');
            modal.id = 'redeemConfirmModal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:380px;width:100%;padding:26px 22px;text-align:center;" onclick="event.stopPropagation()">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:24px;color:#0a0a0e;margin:0 auto 14px;"><i class="fa-solid fa-gift"></i></div>
                <h3 style="font-size:15px;font-weight:800;margin-bottom:8px;">${isAR?'تأكيد الاستبدال':'Confirm Redemption'}</h3>
                <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.6;">${isAR?`هل تريد استبدال ${nf(tier.coins)} ${sym} مقابل ${monthsLabel} من ATLASYA PRO؟`:`Redeem ${nf(tier.coins)} ${sym} for ${monthsLabel} of ATLASYA PRO?`}</p>
                <div style="display:flex;gap:10px;">
                    <button onclick="document.getElementById('redeemConfirmModal').remove()" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">${isAR?'إلغاء':'Cancel'}</button>
                    <button id="redeemConfirmBtn" onclick="doRedeemTier(${tierIndex})" style="flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;font-size:13px;font-weight:800;font-family:'Tajawal',sans-serif;cursor:pointer;">${isAR?'تأكيد الاستبدال':'Confirm'}</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
        };

        window.doRedeemTier = async function(tierIndex) {
            const isAR = lang === 'AR';
            const btn = document.getElementById('redeemConfirmBtn');
            if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }
            try {
                const result = await window._redeemCoinTier(tierIndex);
                document.getElementById('redeemConfirmModal')?.remove();
                showToast(result.autoApprove
                    ? (isAR?'🎉 تم الاستبدال وتفعيل PRO بنجاح':'🎉 Redeemed — PRO activated successfully')
                    : (isAR?'✅ تم إرسال طلب الاستبدال لمراجعة الإدارة':'✅ Redemption request sent for admin review'));
                if (window._accountTab === 'wallet') renderWalletRoot();
            } catch(e) {
                console.error('redeem error:', e);
                let msg = isAR?'حدث خطأ أثناء الاستبدال':'An error occurred while redeeming';
                if (e.code === 'insufficient') msg = isAR?'رصيدك من العملات غير كافٍ':'Insufficient coin balance';
                if (e.code === 'disabled') msg = isAR?'الاستبدال متوقف حالياً':'Redemption is currently disabled';
                showToast(msg, true);
                if (btn) { btn.disabled = false; btn.innerHTML = isAR?'تأكيد الاستبدال':'Confirm'; }
            }
        };

        window.copyReferralLink = function() {
            const isAR = lang === 'AR';
            const input = document.getElementById('referralLinkInput');
            const link = input ? input.value : (PLATFORM_BASE_URL + '?ref=' + (window._currentUid || '') + '#/dashboard');
            navigator.clipboard?.writeText(link).then(() => {
                showToast(isAR?'✅ تم نسخ رابط الدعوة':'✅ Invite link copied');
            }).catch(() => showToast(isAR?'تعذّر النسخ':'Could not copy', true));
        };

        window.shareReferralLink = function() {
            const isAR = lang === 'AR';
            const link = PLATFORM_BASE_URL + '?ref=' + (window._currentUid || '') + '#/dashboard';
            const firstName = window._userData?.firstName || '';
            const text = isAR
                ? `${firstName ? `دعوة من ${firstName} 🎓 ` : ''}انضم لي على منصة ATLASYA لتعلم نظم المعلومات الجغرافية 🌍`
                : `${firstName ? `${firstName}'s invite 🎓 ` : ''}Join me on ATLASYA to learn GIS 🌍`;
            if (navigator.share) {
                navigator.share({ title: 'ATLASYA', text, url: link }).catch(()=>{});
            } else {
                navigator.clipboard?.writeText(`${text}\n${link}`).then(() => {
                    showToast(isAR?'✅ تم نسخ رابط الدعوة':'✅ Invite link copied');
                }).catch(() => showToast(isAR?'تعذّر النسخ':'Could not copy', true));
            }
        };

        /* ─── ADMIN: TEAM MANAGEMENT (sub-admin accounts + permissions) ─── */
        window.submitNewTeamMember = async function() {
            const isAR = lang === 'AR';
            const firstName = document.getElementById('teamFirstName').value.trim();
            const lastName  = document.getElementById('teamLastName').value.trim();
            const username  = document.getElementById('teamUsername').value.trim();
            const password  = document.getElementById('teamPassword').value.trim();
            const org       = document.getElementById('teamOrg').value;
            const permissions = Array.from(document.querySelectorAll('.teamPermCheck:checked')).map(c => c.value);

            if (!firstName || !lastName || !username || !password) {
                showToast(isAR ? 'من فضلك أكمل جميع الحقول' : 'Please fill in all fields', true);
                return;
            }
            if (password.length < 6) {
                showToast(isAR ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password too short (min 6 chars)', true);
                return;
            }
            if (ADMINS.some(a => a.username === username)) {
                showToast(isAR ? 'اسم المستخدم غير متاح' : 'Username not available', true);
                return;
            }

            const btn = document.getElementById('teamCreateBtn');
            if (btn) btn.disabled = true;
            try {
                const existing = await window._loadTeamAccounts();
                if (existing.some(t => t.username === username)) {
                    showToast(isAR ? 'اسم المستخدم مستخدم بالفعل' : 'Username already taken', true);
                    return;
                }
                await window._createTeamAccount({
                    firstName, lastName, username, password,
                    displayName: firstName + ' ' + lastName,
                    permissions,
                    org,
                });
                showToast(isAR ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
                ['teamFirstName','teamLastName','teamUsername','teamPassword'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                document.getElementById('teamOrg').value = 'gis_explorer';
                document.querySelectorAll('.teamPermCheck').forEach(c => c.checked = false);
                adminLoadTeamAccounts();
            } catch(e) {
                showToast(isAR ? 'حدث خطأ أثناء إنشاء الحساب' : 'Error creating account', true);
            } finally {
                if (btn) btn.disabled = false;
            }
        };

        async function adminLoadTeamAccounts() {
            const isAR = lang === 'AR';
            const list = document.getElementById('teamMembersList');
            if (!list) return;
            try {
                const accounts = await window._loadTeamAccounts();
                if (!accounts.length) {
                    list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${isAR?'لا يوجد أعضاء فريق حتى الآن':'No team members yet'}</div>`;
                    return;
                }
                list.innerHTML = accounts.map(a => {
                    const perms = Array.isArray(a.permissions) ? a.permissions : [];
                    const permLabels = ADMIN_PERMISSION_LIST.filter(p => perms.includes(p.key)).map(p => isAR ? p.labelAR : p.labelEN);
                    const orgLabel = a.org === 'terrascope' ? 'TerraScope' : 'GIS Explorer';
                    return `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;color:#0a0a0e;font-weight:800;flex-shrink:0;">${(a.firstName||'?')[0].toUpperCase()}</div>
                        <div style="flex:1;min-width:150px;">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <div style="font-weight:700;font-size:14px;">${a.displayName || ((a.firstName||'')+' '+(a.lastName||''))}</div>
                                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.3);color:var(--gold3);">${orgLabel}</span>
                            </div>
                            <div style="font-size:12px;color:var(--muted);">@${a.username}</div>
                            <div style="font-size:11px;color:var(--muted);margin-top:4px;">${permLabels.length ? permLabels.join(' · ') : (isAR?'بدون صلاحيات':'No permissions')}</div>
                        </div>
                        <button onclick="deleteTeamMember('${a.id}')" style="padding:7px 12px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;color:#e74c3c;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-trash-can"></i> ${isAR?'حذف':'Delete'}
                        </button>
                    </div>`;
                }).join('');
            } catch(e) {
                list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${isAR?'تعذر تحميل الأعضاء':'Failed to load team members'}</div>`;
            }
        }

        window.deleteTeamMember = async function(id) {
            const isAR = lang === 'AR';
            if (!window.confirm(isAR ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Are you sure you want to delete this account?')) return;
            try {
                await window._deleteTeamAccount(id);
                showToast(isAR ? 'تم حذف الحساب' : 'Account deleted');
                adminLoadTeamAccounts();
            } catch(e) {
                showToast(isAR ? 'حدث خطأ أثناء الحذف' : 'Error deleting account', true);
            }
        };

        /* ══════════════════════════════════════════════════════════════
           ATLASYA PRO — SUBSCRIPTION CHECKOUT FLOW
           Steps: entry (plan cards) → choose (payment method) →
                  pay (instructions for chosen method) → form (proof of payment)
           Also renders "pending review" / "rejected" states when the
           student already has a request on file.
           ══════════════════════════════════════════════════════════════ */

        window._subState = window._subState || { step: 'entry', method: null };
        window._subScreenshotData = window._subScreenshotData || '';
        // Full (pre-discount) PRO prices per duration tier — mirrors PRO_PLANS below,
        // kept accessible outside _renderPlanTabRoot so discount math never uses an
        // already-discounted price as its base.
        window._subPlanPrices = { 1: 50, 3: 150, 6: 200 };

        window._subGoStep = function(step, method, months, price) {
            window._subState = window._subState || {};
            if (months && months !== window._subState.months) {
                // Keep an already-applied discount code only if it was issued for the
                // duration the student is now selecting; otherwise it doesn't apply, so clear it.
                if (!(window._subState.discountApplied && window._subState.discountRequiredMonths === months)) {
                    window._subState.discountCode = ''; window._subState.discountPercent = 0; window._subState.discountApplied = false; window._subState.discountRequiredMonths = null;
                }
            }
            window._subState.step = step;
            if (method) window._subState.method = method;
            if (months) window._subState.months = months;
            if (price) window._subState.price = price;
            if (step !== 'form') window._subScreenshotData = '';
            window._renderPlanTabRoot();
        };

        window._subCopyText = function(text, btnEl) {
            const isAR = lang === 'AR';
            if (!text) { showToast(isAR ? 'لا يوجد بريد إلكتروني مسجل' : 'No email on file', true); return; }
            const done = () => {
                showToast(isAR ? '✓ تم النسخ' : '✓ Copied');
                if (btnEl) {
                    const orig = btnEl.innerHTML;
                    btnEl.innerHTML = `<i class="fa-solid fa-check"></i> ${isAR?'تم':'Copied'}`;
                    setTimeout(() => { btnEl.innerHTML = orig; }, 1500);
                }
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => showToast(isAR?'تعذر النسخ':'Copy failed', true));
            } else {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = text; document.body.appendChild(ta); ta.select();
                    document.execCommand('copy'); document.body.removeChild(ta);
                    done();
                } catch (e) { showToast(isAR?'تعذر النسخ':'Copy failed', true); }
            }
        };

        window._subHandleScreenshot = async function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const isAR = lang === 'AR';
            const prev = document.getElementById('subScreenshotPreview');
            if (prev) prev.innerHTML = `<div class="spinner" style="margin:6px auto;"></div>`;
            try {
                const dataUrl = await compressImageForProfile(file);
                window._subScreenshotData = dataUrl;
                if (prev) prev.innerHTML = `<img src="${dataUrl}" style="max-width:150px;max-height:150px;border-radius:10px;border:1px solid var(--border);object-fit:cover;">`;
            } catch (err) {
                window._subScreenshotData = '';
                if (prev) prev.innerHTML = '';
                showToast(isAR ? 'تعذّر تحميل الصورة، جرّب صورة أخرى' : 'Could not load image, try another one', true);
            }
        };

        window._startFreeTrial = async function() {
            const isAR = lang === 'AR';
            const btn = document.getElementById('freeTrialBtn');
            if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
            try {
                await window._claimFreeTrial();
                showToast(isAR ? '🎉 تم تفعيل الفترة التجريبية المجانية لمدة شهر!' : '🎉 Free trial activated for 1 month!');
                window._subState = { step: 'entry', method: null };
                window._renderPlanTabRoot();
            } catch (e) {
                if (e && e.code === 'trial-used') {
                    showToast(isAR ? 'لقد استخدمت الفترة التجريبية المجانية من قبل' : "You've already used your free trial", true);
                    window._renderPlanTabRoot();
                } else {
                    showToast(isAR ? 'حدث خطأ أثناء التفعيل' : 'Error activating trial', true);
                    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${isAR?'ابدأ الفترة المجانية':'Start free trial'}`; }
                }
            }
        };

        // Promo box shown on the "choose duration" step, before a plan is picked.
        window._subTogglePromoBox = function() {
            const box = document.getElementById('durPromoBox');
            if (box) box.style.display = (box.style.display === 'none' ? 'block' : 'none');
        };

        window._subApplyPromoAtDuration = async function() {
            const isAR = lang === 'AR';
            const input = document.getElementById('durPromoCode');
            const msg = document.getElementById('durPromoMsg');
            const btn = document.getElementById('durPromoBtn');
            const code = (input?.value || '').trim().toUpperCase();
            if (!code) { if (msg) { msg.style.color = '#ff6b6b'; msg.textContent = isAR?'اكتب الكود الأول':'Enter a code first'; } return; }
            if (btn) { btn.disabled = true; btn.textContent = isAR?'...':'...'; }
            try {
                const c = await window._validateDiscountCode(code); // no forMonths yet — just checks it belongs to this student, is unused & unexpired
                window._subState.discountCode = c.code;
                window._subState.discountPercent = c.percent;
                window._subState.discountRequiredMonths = c.requiredMonths || null;
                window._subState.discountApplied = true;
                window._renderPlanTabRoot();
            } catch(e) {
                if (msg) {
                    msg.style.color = '#ff6b6b';
                    if (e.code === 'not-found') msg.textContent = isAR?'الكود غير موجود':'Code not found';
                    else if (e.code === 'not-yours') msg.textContent = isAR?'هذا الكود ليس لك':"This code isn't yours";
                    else if (e.code === 'used') msg.textContent = isAR?'تم استخدام هذا الكود من قبل':'This code has already been used';
                    else if (e.code === 'expired') msg.textContent = isAR?'انتهت صلاحية الكود':'This code has expired';
                    else msg.textContent = isAR?'حدث خطأ، حاول تاني':'Something went wrong, try again';
                }
                if (btn) { btn.disabled = false; btn.textContent = isAR?'تفعيل':'Activate'; }
            }
        };

        window._subRemovePromoAtDuration = function() {
            window._subState.discountCode = '';
            window._subState.discountPercent = 0;
            window._subState.discountRequiredMonths = null;
            window._subState.discountApplied = false;
            window._renderPlanTabRoot();
        };

        window._subApplyDiscountCode = async function() {
            const isAR = lang === 'AR';
            const input = document.getElementById('subDiscountCode');
            const msg = document.getElementById('subDiscountMsg');
            const btn = document.getElementById('subApplyCodeBtn');
            const code = (input?.value || '').trim().toUpperCase();
            if (!code) { if (msg) { msg.style.color = '#ff6b6b'; msg.textContent = isAR?'اكتب الكود الأول':'Enter a code first'; } return; }
            if (btn) { btn.disabled = true; btn.textContent = isAR?'...':'...'; }
            try {
                const selMonths = window._subState.months || 1;
                const c = await window._validateDiscountCode(code, selMonths);
                window._subState.discountCode = c.code;
                window._subState.discountPercent = c.percent;
                window._subState.discountRequiredMonths = c.requiredMonths || selMonths;
                window._subState.discountApplied = true;
                const priceEl = document.getElementById('subAmount');
                const basePrice = window._subPlanPrices[selMonths] || window._subState.price || 50;
                const discPrice = Math.round(basePrice * (1 - c.percent / 100));
                window._subState.price = discPrice;
                if (priceEl) priceEl.value = discPrice;
                window._renderPlanTabRoot();
            } catch(e) {
                if (msg) {
                    msg.style.color = '#ff6b6b';
                    if (e.code === 'not-found') msg.textContent = isAR?'الكود غير موجود':'Code not found';
                    else if (e.code === 'not-yours') msg.textContent = isAR?'هذا الكود ليس لك':"This code isn't yours";
                    else if (e.code === 'used') msg.textContent = isAR?'تم استخدام هذا الكود من قبل':'This code has already been used';
                    else if (e.code === 'expired') msg.textContent = isAR?'انتهت صلاحية الكود':'This code has expired';
                    else if (e.code === 'wrong-tier') msg.textContent = isAR?`هذا الكود صالح لباقة ${e.requiredMonths} شهر فقط`:`This code only applies to the ${e.requiredMonths}-month plan`;
                    else msg.textContent = isAR?'حدث خطأ، حاول تاني':'Something went wrong, try again';
                }
                if (btn) { btn.disabled = false; btn.textContent = isAR?'تطبيق':'Apply'; }
            }
        };

        window._subRemoveDiscountCode = function() {
            const selMonths = window._subState.months || 1;
            const basePrice = window._subPlanPrices[selMonths] || 50;
            window._subState.discountCode = '';
            window._subState.discountPercent = 0;
            window._subState.discountRequiredMonths = null;
            window._subState.discountApplied = false;
            window._subState.price = basePrice;
            const priceEl = document.getElementById('subAmount');
            if (priceEl) priceEl.value = basePrice;
            window._renderPlanTabRoot();
        };

        window._subSubmitRequest = async function() {
            const isAR = lang === 'AR';
            const btn = document.getElementById('subSubmitBtn');
            const nameEl = document.getElementById('subName');
            const emailEl = document.getElementById('subEmail');
            const usernameEl = document.getElementById('subUsername');
            const amountEl = document.getElementById('subAmount');
            const dateEl = document.getElementById('subDate');
            const name = (nameEl?.value || '').trim();
            const email = (emailEl?.value || '').trim();
            const username = (usernameEl?.value || '').trim();
            const amount = parseFloat(amountEl?.value) || 0;
            const paymentDate = dateEl?.value || '';

            if (!name || !email || !username) {
                showToast(isAR ? 'من فضلك أكمل جميع الحقول المطلوبة' : 'Please fill in all required fields', true);
                return;
            }
            if (!window._subScreenshotData) {
                showToast(isAR ? 'من فضلك ارفع صورة إثبات الدفع' : 'Please upload a payment proof screenshot', true);
                return;
            }
            if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
            try {
                const [firstName, ...rest] = name.split(' ');
                await window._sendUpgradeRequest({
                    firstNameOverride: firstName || name,
                    lastNameOverride: rest.join(' ') || '',
                    email, username,
                    paymentMethod: window._subState.method,
                    months: window._subState.months || 1,
                    amount, paymentDate,
                    screenshot: window._subScreenshotData,
                    discountCode: window._subState.discountApplied ? window._subState.discountCode : '',
                    discountPercent: window._subState.discountApplied ? window._subState.discountPercent : 0
                });
                if (window._subState.discountApplied && window._subState.discountCode) {
                    try { await window._useDiscountCode(window._subState.discountCode); } catch(e) { console.error('useDiscountCode error:', e); }
                }
                window._subState = { step: 'entry', method: null };
                window._subScreenshotData = '';
                showToast(isAR ? '✓ تم إرسال طلبك بنجاح، سنراجعه في أقرب وقت' : '✓ Request submitted — we will review it shortly');
                window._renderPlanTabRoot();
            } catch (e) {
                if (e && e.code === 'duplicate-pending') {
                    showToast(isAR ? 'لديك طلب اشتراك قيد المراجعة بالفعل' : 'You already have a pending subscription request', true);
                    window._subState = { step: 'entry', method: null };
                    window._renderPlanTabRoot();
                } else {
                    showToast(isAR ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting your request', true);
                    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الطلب':'Submit Request'}`; }
                }
            }
        };

        window._renderPlanTabRoot = async function() {
            const root = document.getElementById('planTabRoot');
            if (!root) return;
            const isAR = lang === 'AR';
            const d = window._userData || {};
            const isPro = (d.plan || 'basic') === 'pro';
            const PRO_PLANS = [
                { months: 1, price: 50 },
                { months: 3, price: 150 },
                { months: 6, price: 200 }
            ];

            /* helper: shared plan-cards-row markup used for both the ACTIVE PRO view
               and the entry/upsell view */
            function proRemainingBlock() {
                if (!(isPro && d.proExpiresAt)) return '';
                const rem = window._formatProRemaining(d.proExpiresAt, isAR);
                const expMs = d.proExpiresAt.toDate ? d.proExpiresAt.toDate().getTime() : new Date(d.proExpiresAt).getTime();
                if (!rem) return '';
                if (rem.expired) {
                    return `<div style="margin-top:8px;font-size:12px;font-weight:700;color:#ff6b6b;display:flex;align-items:center;justify-content:center;gap:6px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>${rem.text}
                    </div>`;
                }
                return `<div style="margin-top:8px;font-size:12px;font-weight:700;color:var(--gold3);display:flex;align-items:center;justify-content:center;gap:6px;">
                    <i class="fa-solid fa-hourglass-half"></i>
                    <span>${isAR ? 'متبقي' : ''}</span>
                    <span id="proCountdownLive" data-expires-ms="${expMs}" data-uid="${window._currentUid || currentUid || ''}" style="font-family:'Space Mono',monospace;color:var(--gold4);">${rem.text}</span>
                    <span>${isAR ? 'على انتهاء الاشتراك' : 'left on your subscription'}</span>
                </div>`;
            }

            function entryCardsHtml(footerHtml) {
                return `
                <div class="form-card" style="margin-top:0;">
                    <h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:12px;">
                        <i class="fa-solid fa-crown" style="color:${isPro?'var(--gold3)':'var(--muted)'};"></i>
                        ${isAR?'خطة الاشتراك':'Subscription Plan'}
                    </h3>
                    <div class="plan-cards-row">
                        <div class="plan-card${!isPro?' is-basic':''}">
                            ${!isPro?`<span class="plan-card-tag t-basic">${isAR?'خطتك':'Active'}</span>`:''}
                            <div class="plan-card-head">
                                <i class="fa-solid fa-bolt" style="color:${!isPro?'var(--green4)':'var(--muted)'};"></i>
                                <span style="color:${!isPro?'var(--green4)':'var(--muted)'};">Basic</span>
                            </div>
                            <div class="plan-card-price">${isAR?'مجاني':'Free'}</div>
                            <div class="plan-card-period">&nbsp;</div>
                            <ul class="plan-card-feats">
                                <li><i class="fa-solid fa-check" style="color:var(--green3);"></i>${isAR?'عرض الوظائف':'View jobs'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--green3);"></i>${isAR?'تحميل 3 ملفات':'3 downloads'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--green3);"></i>${isAR?'المحتوى التعليمي':'Educational content'}</li>
                                <li><i class="fa-solid fa-xmark" style="color:var(--muted);"></i>${isAR?'رد أسرع':'Faster support'}</li>
                            </ul>
                            <div class="plan-card-foot">
                                ${!isPro ? `<div class="active-label al-basic"><i class="fa-solid fa-circle-check"></i> ${isAR?'خطتك الحالية':'Current plan'}</div>` : ''}
                            </div>
                        </div>
                        <div class="plan-card${isPro?' is-pro':''}">
                            ${!isPro ? `<span class="plan-card-tag t-pro">⭐ PRO</span>` : `<span class="plan-card-tag t-pro">${isAR?'خطتك':'Active'}</span>`}
                            <div class="plan-card-head">
                                <i class="fa-solid fa-crown" style="color:var(--gold3);"></i>
                                <span style="color:var(--gold3);">ATLASYA PRO</span>
                            </div>
                            <div class="plan-card-price">${isAR?'يبدأ من 50':'From 50'} ${isAR?'ج':'EGP'}</div>
                            <div class="plan-card-period">${isAR?'/ شهر':'/ month'}</div>
                            <ul class="plan-card-feats">
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'كل مميزات Basic':'All Basic features'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'CV يتخطى ATS':'ATS-friendly CV'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'تحميل غير محدود':'Unlimited downloads'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'أولوية في الرد':'Priority support'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'خرائط الطلبة المميزين':'Premium Student Maps'}</li>
                                <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'جلسة Mentorship مع خبير':'Expert Mentorship Session'}</li>
                            </ul>
                            <div class="plan-card-foot">${footerHtml}</div>
                        </div>
                    </div>
                </div>`;
            }

            /* ── Already PRO: show the classic two-card summary, no checkout ── */
            if (isPro) {
                root.innerHTML = entryCardsHtml(`<div class="active-label al-pro"><i class="fa-solid fa-crown"></i> ${isAR?'أنت عضو Pro!':'You are Pro!'}</div>${proRemainingBlock()}`);
                if (typeof window._startProCountdown === 'function') window._startProCountdown();
                return;
            }

            /* ── Not pro: look up latest request to decide entry state ── */
            let latestReq = null;
            try { latestReq = await window._getMyLatestUpgradeRequest(); } catch (e) {}
            const step = window._subState?.step || 'entry';

            // Pending review — block new submissions, show status card
            if (latestReq && latestReq.status === 'pending' && step === 'entry') {
                const timeStr = latestReq.requestedAt?.toDate ? latestReq.requestedAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;text-align:center;padding:34px 20px;">
                    <div style="font-size:42px;color:var(--gold3);margin-bottom:10px;"><i class="fa-solid fa-hourglass-half"></i></div>
                    <h3 style="margin-bottom:6px;">${isAR?'طلبك قيد المراجعة':'Your request is under review'}</h3>
                    <p style="color:var(--muted);font-size:13px;max-width:360px;margin:0 auto 4px;">${isAR
                        ? 'استلمنا طلب اشتراكك في ATLASYA PRO وسيقوم فريقنا بمراجعته وتفعيله قريباً.'
                        : "We've received your ATLASYA PRO subscription request. Our team will review and activate it shortly."}</p>
                    ${timeStr ? `<p style="color:var(--muted);font-size:11px;margin-top:6px;"><i class="fa-regular fa-clock"></i> ${isAR?'تاريخ الإرسال:':'Sent on:'} ${timeStr}</p>` : ''}
                </div>`;
                return;
            }

            // Rejected — show reason + allow resubmission
            if (latestReq && latestReq.status === 'rejected' && step === 'entry') {
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;text-align:center;padding:34px 20px;">
                    <div style="font-size:42px;color:#ff6b6b;margin-bottom:10px;"><i class="fa-solid fa-circle-xmark"></i></div>
                    <h3 style="margin-bottom:6px;">${isAR?'تم رفض طلب الاشتراك':'Your subscription request was declined'}</h3>
                    ${latestReq.rejectionReason ? `<p style="color:var(--muted);font-size:13px;max-width:380px;margin:0 auto 10px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.2);border-radius:10px;padding:10px 14px;">${latestReq.rejectionReason}</p>` : ''}
                    <button class="pro-gate-btn" onclick="_subGoStep('duration')"><i class="fa-solid fa-rotate"></i> ${isAR?'إعادة التقديم':'Try again'}</button>
                </div>`;
                return;
            }

            // ── Step: entry (plan cards, click Upgrade to start checkout) ──
            if (step === 'entry') {
                const trialBanner = (!d.freeTrialUsed) ? `
                <div style="margin-bottom:16px;background:linear-gradient(135deg,rgba(212,160,23,0.14),rgba(212,160,23,0.05));border:1px solid rgba(212,160,23,0.35);border-radius:16px;padding:18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                    <div style="width:46px;height:46px;border-radius:12px;background:rgba(212,160,23,0.18);display:flex;align-items:center;justify-content:center;color:var(--gold3);font-size:20px;flex-shrink:0;"><i class="fa-solid fa-gift"></i></div>
                    <div style="flex:1;min-width:180px;">
                        <div style="font-weight:800;font-size:14.5px;color:var(--gold3);">${isAR?'جرّب ATLASYA PRO مجانًا!':'Try ATLASYA PRO for free!'}</div>
                        <div style="color:var(--muted);font-size:12px;margin-top:2px;">${isAR?'شهر كامل من كل مميزات Pro بدون أي دفع — يبدأ فور التفعيل':'A full month of every Pro feature, no payment — starts the moment you activate it'}</div>
                    </div>
                    <button onclick="_startFreeTrial()" id="freeTrialBtn" style="flex-shrink:0;padding:11px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:10px;font-weight:700;font-size:13px;font-family:'Tajawal',sans-serif;cursor:pointer;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> ${isAR?'ابدأ الفترة المجانية':'Start free trial'}
                    </button>
                </div>` : '';
                root.innerHTML = trialBanner + entryCardsHtml(`<button onclick="_subGoStep('duration')" id="upgradeBtn"><i class="fa-solid fa-arrow-up"></i> ${isAR?'ترقية إلى Pro':'Upgrade to Pro'}</button>`);
                return;
            }

            // ── Step: choose subscription duration / price tier ──
            if (step === 'duration') {
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;">
                    <button onclick="_subGoStep('entry')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:14px;">
                        <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'رجوع':'Back'}
                    </button>
                    <h3 style="margin-bottom:4px;"><i class="fa-solid fa-crown" style="color:var(--gold3);"></i> ATLASYA PRO</h3>
                    <p style="color:var(--muted);font-size:13px;margin-bottom:18px;">${isAR?'اختر مدة الاشتراك المناسبة لك':'Choose the subscription duration that suits you'}</p>
                    ${(() => {
                        const applied = window._subState.discountApplied;
                        if (applied) {
                            const rm = window._subState.discountRequiredMonths;
                            const durL = isAR ? (rm===1?'شهر واحد':(rm===3?'3 أشهر':`${rm} أشهر`)) : `${rm} month(s)`;
                            return `<div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:rgba(62,203,99,0.08);border:1px solid rgba(62,203,99,0.3);border-radius:12px;padding:12px 14px;">
                                <div style="font-size:12.5px;color:#3ecb63;font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${isAR?`تم تفعيل كود الخصم `:`Code `}<span style="direction:ltr;display:inline-block;">${window._subState.discountCode}</span>${isAR?` — خصم ${window._subState.discountPercent}% على خطة ${durL}`:` applied — ${window._subState.discountPercent}% off the ${durL} plan`}</div>
                                <button onclick="_subRemovePromoAtDuration()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--muted);font-size:11.5px;cursor:pointer;font-family:'Tajawal',sans-serif;flex-shrink:0;">${isAR?'إلغاء':'Remove'}</button>
                            </div>`;
                        }
                        return `<div style="margin-bottom:16px;">
                            <button onclick="_subTogglePromoBox()" style="background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);color:var(--gold3);padding:9px 16px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:7px;">
                                <i class="fa-solid fa-ticket"></i> ${isAR?'عندك بروموكود أو قسيمة خصم على اشتراك PRO؟':'Have a promo code or discount coupon for PRO?'}
                            </button>
                            <div id="durPromoBox" style="display:none;margin-top:10px;">
                                <div style="display:flex;gap:8px;">
                                    <input type="text" id="durPromoCode" placeholder="ATLAS-XXXXXX" style="flex:1;direction:ltr;text-align:start;text-transform:uppercase;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-family:'Tajawal',sans-serif;font-size:13px;">
                                    <button type="button" id="durPromoBtn" onclick="_subApplyPromoAtDuration()" style="padding:0 16px;border-radius:8px;border:none;background:rgba(212,160,23,0.15);color:var(--gold3);font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Tajawal',sans-serif;">${isAR?'تفعيل':'Activate'}</button>
                                </div>
                                <div id="durPromoMsg" style="font-size:11.5px;margin-top:6px;color:var(--muted);"></div>
                            </div>
                        </div>`;
                    })()}
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${PRO_PLANS.map(p => {
                            const discOk = window._subState.discountApplied && window._subState.discountRequiredMonths === p.months;
                            const finalPrice = discOk ? Math.max(0, Math.round(p.price * (1 - (window._subState.discountPercent||0) / 100))) : p.price;
                            const perMonth = (finalPrice / p.months).toFixed(0);
                            const durLabel = isAR ? (p.months === 1 ? 'شهر واحد' : (p.months === 3 ? '3 أشهر' : '6 أشهر')) : `${p.months} month${p.months > 1 ? 's' : ''}`;
                            const bestValue = p.months === 6;
                            return `<div onclick="_subGoStep('choose', null, ${p.months}, ${finalPrice})" style="cursor:pointer;position:relative;display:flex;align-items:center;gap:14px;padding:16px;border:1px solid ${discOk?'#3ecb63':(bestValue?'var(--gold3)':'var(--border)')};border-radius:14px;transition:0.2s;background:${discOk?'rgba(62,203,99,0.05)':(bestValue?'rgba(212,160,23,0.05)':'transparent')};" onmouseover="this.style.borderColor='var(--gold3)'" onmouseout="this.style.borderColor='${discOk?'#3ecb63':(bestValue?'var(--gold3)':'var(--border)')}'">
                                ${bestValue ? `<span style="position:absolute;top:-9px;${isAR?'right':'left'}:14px;background:var(--gold3);color:#000;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;">${isAR?'أفضل قيمة':'Best value'}</span>` : ''}
                                ${discOk ? `<span style="position:absolute;top:-9px;${isAR?'left':'right'}:14px;background:#3ecb63;color:#06210f;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;">🎟️ ${isAR?'خصم مُفعّل':'Discount applied'}</span>` : ''}
                                <div style="width:44px;height:44px;border-radius:12px;background:rgba(212,160,23,0.12);display:flex;align-items:center;justify-content:center;color:var(--gold3);font-size:18px;flex-shrink:0;"><i class="fa-solid fa-crown"></i></div>
                                <div style="flex:1;">
                                    <div style="font-weight:700;font-size:14px;">${durLabel}</div>
                                    <div style="color:var(--muted);font-size:11.5px;">${isAR?'بمعدل':'~'} ${perMonth} ${isAR?'ج/شهر':'EGP/mo'}</div>
                                </div>
                                <div style="text-align:${isAR?'left':'right'};flex-shrink:0;">
                                    ${discOk ? `<div style="font-size:12px;color:var(--muted);text-decoration:line-through;">${p.price} ${isAR?'ج':'EGP'}</div><div style="font-weight:700;font-size:16px;color:#3ecb63;">${finalPrice} ${isAR?'ج':'EGP'}</div>` : `<div style="font-weight:700;font-size:16px;color:var(--gold3);">${p.price} ${isAR?'ج':'EGP'}</div>`}
                                </div>
                                <i class="fa-solid fa-chevron-${isAR?'left':'right'}" style="color:var(--muted);"></i>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
                return;
            }

            // ── Step: choose payment method ──
            if (step === 'choose') {
                const selMonths = window._subState.months || 1;
                const selPrice = window._subState.price || 50;
                const durLabel = isAR ? (selMonths === 1 ? 'شهر واحد' : (selMonths === 3 ? '3 أشهر' : '6 أشهر')) : `${selMonths} month${selMonths > 1 ? 's' : ''}`;
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;">
                    <button onclick="_subGoStep('duration')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:14px;">
                        <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'تغيير المدة':'Change duration'}
                    </button>
                    <h3 style="margin-bottom:4px;"><i class="fa-solid fa-crown" style="color:var(--gold3);"></i> ATLASYA PRO — ${durLabel} — ${selPrice} ${isAR?'ج':'EGP'}</h3>
                    <p style="color:var(--muted);font-size:13px;margin-bottom:18px;">${isAR?'اختر طريقة الدفع المناسبة لك':'Choose your preferred payment method'}</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div onclick="_subGoStep('pay','instapay')" style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--border);border-radius:14px;transition:0.2s;" onmouseover="this.style.borderColor='var(--gold3)'" onmouseout="this.style.borderColor='var(--border)'">
                            <div style="width:44px;height:44px;border-radius:12px;background:rgba(90,60,220,0.12);display:flex;align-items:center;justify-content:center;color:#7c5cff;font-size:18px;flex-shrink:0;"><i class="fa-solid fa-mobile-screen-button"></i></div>
                            <div style="flex:1;">
                                <div style="font-weight:700;font-size:14px;">InstaPay</div>
                                <div style="color:var(--muted);font-size:11.5px;">${isAR?'تحويل فوري عبر تطبيق البنك':'Instant transfer via banking app'}</div>
                            </div>
                            <i class="fa-solid fa-chevron-${isAR?'left':'right'}" style="color:var(--muted);"></i>
                        </div>
                        <div onclick="_subGoStep('pay','vodafone')" style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--border);border-radius:14px;transition:0.2s;" onmouseover="this.style.borderColor='var(--gold3)'" onmouseout="this.style.borderColor='var(--border)'">
                            <div style="width:44px;height:44px;border-radius:12px;background:rgba(230,0,20,0.1);display:flex;align-items:center;justify-content:center;color:#e60014;font-size:18px;flex-shrink:0;"><i class="fa-solid fa-wallet"></i></div>
                            <div style="flex:1;">
                                <div style="font-weight:700;font-size:14px;">Vodafone Cash</div>
                                <div style="color:var(--muted);font-size:11.5px;">${isAR?'تحويل مباشر لرقم فودافون كاش':'Direct transfer to Vodafone Cash number'}</div>
                            </div>
                            <i class="fa-solid fa-chevron-${isAR?'left':'right'}" style="color:var(--muted);"></i>
                        </div>
                    </div>
                </div>`;
                return;
            }

            // ── Step: payment instructions ──
            if (step === 'pay') {
                const method = window._subState.method;
                const selMonths = window._subState.months || 1;
                const selPrice = window._subState.price || 50;
                const emailLocal = (d.email || '').split('@')[0] || '';
                let box = '';
                if (method === 'instapay') {
                    box = `
                    <div style="background:rgba(90,60,220,0.06);border:1px solid rgba(90,60,220,0.25);border-radius:14px;padding:18px;">
                        <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#7c5cff;"><i class="fa-solid fa-mobile-screen-button"></i> InstaPay</div>
                        <a href="https://ipn.eg/S/zeyadahmedmarei/instapay/9Qp7wM" target="_blank" style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-decoration:none;color:var(--text);font-family:'Space Mono',monospace;font-size:12.5px;word-break:break-all;margin-bottom:12px;">
                            <span>ipn.eg/S/zeyadahmedmarei/instapay/9Qp7wM</span>
                            <i class="fa-solid fa-up-right-from-square" style="color:#7c5cff;flex-shrink:0;"></i>
                        </a>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;">
                            <div style="min-width:0;">
                                <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">${isAR?'انسخه وضعه في ملاحظات الدفع (Notes) بإنستاباي':'Copy this into the InstaPay payment Notes field'}</div>
                                <span style="font-family:'Space Mono',monospace;font-weight:700;font-size:14px;word-break:break-all;">${emailLocal || (isAR?'—':'—')}</span>
                            </div>
                            <button onclick="_subCopyText('${emailLocal}', this)" style="flex-shrink:0;padding:8px 14px;background:rgba(124,92,255,0.15);border:1px solid rgba(124,92,255,0.35);border-radius:8px;color:#7c5cff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Tajawal',sans-serif;">
                                <i class="fa-regular fa-copy"></i> ${isAR?'نسخ':'Copy'}
                            </button>
                        </div>
                    </div>`;
                } else {
                    box = `
                    <div style="background:rgba(230,0,20,0.05);border:1px solid rgba(230,0,20,0.2);border-radius:14px;padding:18px;">
                        <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#e60014;"><i class="fa-solid fa-wallet"></i> Vodafone Cash</div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;">
                            <span style="color:var(--muted);font-size:12px;">${isAR?'رقم فودافون كاش':'Vodafone Cash number'}</span>
                            <span style="font-family:'Space Mono',monospace;font-weight:700;font-size:14px;">01222402933</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
                            <span style="color:var(--muted);font-size:12px;">${isAR?'اسم صاحب الرقم':'Account holder'}</span>
                            <span style="font-weight:700;font-size:13px;">زياد احمد مرعي</span>
                        </div>
                        <a href="http://vf.eg/vfcash?id=mt&qrId=Vpd1Tx" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#e60014;color:#fff;border-radius:10px;padding:11px;text-decoration:none;font-weight:700;font-size:13px;">
                            <i class="fa-solid fa-bolt"></i> ${isAR?'الدفع المباشر عبر الرابط':'Pay directly via link'}
                        </a>
                    </div>`;
                }
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;">
                    <button onclick="_subGoStep('choose')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:14px;">
                        <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'تغيير طريقة الدفع':'Change payment method'}
                    </button>
                    <h3 style="margin-bottom:14px;">${isAR?'أكمل عملية الدفع':'Complete your payment'} — ${selPrice} ${isAR?'ج':'EGP'}</h3>
                    ${box}
                    <div style="margin-top:16px;background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.2);border-radius:12px;padding:14px 16px;font-size:12.5px;color:var(--muted);line-height:1.8;">
                        <div style="font-weight:700;color:var(--gold3);margin-bottom:6px;"><i class="fa-solid fa-circle-info"></i> ${isAR?'ملاحظات مهمة قبل الدفع':'Important notes before paying'}</div>
                        <div>${isAR?'• احتفظ بإيصال التحويل / صورة الشاشة، ستحتاج لرفعها في الخطوة التالية.':"• Keep the transfer receipt / screenshot — you'll need to upload it in the next step."}</div>
                    </div>
                    <button onclick="_subGoStep('form')" style="width:100%;margin-top:18px;padding:12px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:10px;font-weight:700;font-size:13.5px;font-family:'Tajawal',sans-serif;cursor:pointer;">
                        <i class="fa-solid fa-check"></i> ${isAR?'لقد أتممت الدفع':"I've completed the payment"}
                    </button>
                </div>`;
                return;
            }

            // ── Step: proof-of-payment form ──
            if (step === 'form') {
                const method = window._subState.method;
                const selMonths = window._subState.months || 1;
                const selPrice = window._subState.price || 50;
                const methodLabel = method === 'instapay' ? 'InstaPay' : 'Vodafone Cash';
                const emailLocal = (d.email || '').split('@')[0] || '';
                root.innerHTML = `
                <div class="form-card" style="margin-top:0;">
                    <button onclick="_subGoStep('pay', '${method}')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;margin-bottom:14px;">
                        <i class="fa-solid fa-${isAR?'arrow-right':'arrow-left'}"></i> ${isAR?'رجوع':'Back'}
                    </button>
                    <h3 style="margin-bottom:4px;"><i class="fa-solid fa-file-invoice" style="color:var(--gold3);"></i> ${isAR?'تأكيد الاشتراك':'Confirm subscription'}</h3>
                    <p style="color:var(--muted);font-size:12.5px;margin-bottom:16px;">${isAR?'أكمل البيانات التالية لإرسال طلبك للمراجعة':'Fill in the details below to submit your request for review'}</p>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>${isAR?'الاسم بالكامل *':'Full name *'}</label>
                            <input type="text" id="subName" value="${((d.firstName||'')+' '+(d.lastName||'')).trim()}" placeholder="${isAR?'اسمك بالكامل':'Your full name'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'البريد الإلكتروني *':'Email *'}</label>
                            <input type="email" id="subEmail" value="${d.email||''}" placeholder="email@example.com">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'اسم المستخدم داخل المنصة *':'Platform username *'}</label>
                            <input type="text" id="subUsername" value="${emailLocal}" placeholder="${isAR?'اسم المستخدم':'username'}">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'طريقة الدفع':'Payment method'}</label>
                            <input type="text" value="${methodLabel}" disabled style="opacity:0.7;">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'مدة الاشتراك':'Subscription duration'}</label>
                            <input type="text" value="${isAR ? (selMonths===1?'شهر واحد':(selMonths===3?'3 أشهر':'6 أشهر')) : selMonths+' month(s)'}" disabled style="opacity:0.7;">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'مبلغ الدفع (ج.م) *':'Amount paid (EGP) *'}</label>
                            <input type="number" id="subAmount" value="${selPrice}" min="0">
                        </div>
                        <div class="form-group">
                            <label>${isAR?'تاريخ الدفع (اختياري)':'Payment date (optional)'}</label>
                            <input type="date" id="subDate">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:6px;">
                        <label>${isAR?'صورة إثبات الدفع (Screenshot) *':'Payment proof screenshot *'}</label>
                        <input type="file" accept="image/*" onchange="_subHandleScreenshot(event)" style="font-size:12.5px;">
                        <div id="subScreenshotPreview" style="margin-top:8px;"></div>
                    </div>
                    <div class="form-group" style="margin-top:6px;">
                        <label>${isAR?'كود خصم (اختياري)':'Discount code (optional)'}</label>
                        <div style="display:flex;gap:8px;">
                            <input type="text" id="subDiscountCode" placeholder="ATLAS-XXXXXX" style="flex:1;direction:ltr;text-align:start;text-transform:uppercase;" value="${escapeHtmlAC(window._subState.discountCode||'')}" ${window._subState.discountApplied?'disabled':''}>
                            ${window._subState.discountApplied
                                ? `<button type="button" onclick="_subRemoveDiscountCode()" style="padding:0 16px;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--muted);font-size:12.5px;cursor:pointer;font-family:'Tajawal',sans-serif;">${isAR?'إلغاء':'Remove'}</button>`
                                : `<button type="button" id="subApplyCodeBtn" onclick="_subApplyDiscountCode()" style="padding:0 16px;border-radius:8px;border:none;background:rgba(212,160,23,0.15);color:var(--gold3);font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Tajawal',sans-serif;">${isAR?'تطبيق':'Apply'}</button>`}
                        </div>
                        <div id="subDiscountMsg" style="font-size:11.5px;margin-top:6px;${window._subState.discountApplied?'color:#3ecb63;':'color:var(--muted);'}">${window._subState.discountApplied ? (isAR?`✓ تم تطبيق خصم ${window._subState.discountPercent}%`:`✓ ${window._subState.discountPercent}% discount applied`) : ''}</div>
                    </div>
                    <button onclick="_subSubmitRequest()" id="subSubmitBtn" style="width:100%;margin-top:16px;padding:12px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:10px;font-weight:700;font-size:13.5px;font-family:'Tajawal',sans-serif;cursor:pointer;">
                        <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الطلب':'Submit Request'}
                    </button>
                </div>`;
                return;
            }
        };