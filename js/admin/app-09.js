
    window.adminSetPlan = async function(uid, plan, months) {
        const isAR = lang === 'AR';
        try {
            await window._setUserPlan(uid, plan, months);
            const durLabel = (plan === 'pro' && months) ? ` (${months}${isAR?' شهر':' mo'})` : '';
            showToast(isAR ? `✓ تم تغيير الخطة إلى ${plan === 'pro' ? 'Pro' : 'Basic'}${durLabel}` : `✓ Plan changed to ${plan === 'pro' ? 'Pro' : 'Basic'}${durLabel}`);
            adminLoadMembers();
        } catch(e) {
            showToast(isAR ? 'خطأ في التغيير' : 'Failed to change plan', true);
        }
    };

    /* Toggle the inline duration-picker panel under a pending request card */
    window.adminToggleApprovePanel = function(reqId) {
        const rejectPanel = document.getElementById('rejectPanel_' + reqId);
        if (rejectPanel) rejectPanel.style.display = 'none';
        const panel = document.getElementById('approvePanel_' + reqId);
        if (!panel) return;
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'flex' : 'none';
    };

    /* Toggle the inline rejection-reason panel under a pending request card */
    window.adminToggleRejectPanel = function(reqId) {
        const approvePanel = document.getElementById('approvePanel_' + reqId);
        if (approvePanel) approvePanel.style.display = 'none';
        const panel = document.getElementById('rejectPanel_' + reqId);
        if (!panel) return;
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'flex' : 'none';
    };

    window.adminActivatePro = async function(uid, reqId) {
        const isAR = lang === 'AR';
        const monthsSel = document.getElementById('approveMonths_' + reqId);
        const months = monthsSel ? parseInt(monthsSel.value, 10) : 1;
        try {
            // Find the request to know the student's name/email for the notification & email
            const allReqs = await window._loadUpgradeRequests();
            const reqData = allReqs.find(r => r.id === reqId) || {};

            await window._setUserPlan(uid, 'pro', months);
            await window._reviewUpgradeRequest(reqId, 'approved', { months });

            const durationLabel = isAR
                ? (months === 1 ? 'شهر واحد' : (months === 3 ? '3 أشهر' : '6 أشهر'))
                : `${months} month(s)`;
            const alertMsg = isAR
                ? `🎉 تم قبول طلب اشتراكك في ATLASYA PRO لمدة ${durationLabel}! استمتع بجميع المميزات الآن.`
                : `🎉 Your ATLASYA PRO subscription request was approved for ${durationLabel}! Enjoy all Pro features now.`;
            if (typeof window._sendAdminAlert === 'function') await window._sendAdminAlert(uid, alertMsg);
            if (typeof window._sendSubscriptionEmail === 'function') {
                await window._sendSubscriptionEmail(
                    reqData.email, ((reqData.firstName||'')+' '+(reqData.lastName||'')).trim(),
                    isAR ? 'تم تفعيل اشتراكك في ATLASYA PRO' : 'Your ATLASYA PRO subscription is active',
                    alertMsg
                );
            }

            showToast(isAR ? '✓ تم تفعيل Pro وإشعار الطالب' : '✓ Pro activated & student notified');
            adminLoadMembers();
        } catch(e) {
            showToast(isAR ? 'خطأ في التفعيل' : 'Activation failed', true);
        }
    };

    window.adminRejectRequest = async function(uid, reqId) {
        const isAR = lang === 'AR';
        const reasonEl = document.getElementById('rejectReason_' + reqId);
        const reason = reasonEl ? reasonEl.value.trim() : '';
        try {
            const allReqs = await window._loadUpgradeRequests();
            const reqData = allReqs.find(r => r.id === reqId) || {};

            await window._reviewUpgradeRequest(reqId, 'rejected', { reason });
            if (reqData.discountCode) {
                try { await window._markDiscountCodeUnused(reqData.discountCode); } catch(e) { console.error('discount code refund error:', e); }
            }

            const alertMsg = isAR
                ? `تم رفض طلب اشتراكك في ATLASYA PRO.${reason ? ' السبب: ' + reason : ''} يمكنك إعادة التقديم في أي وقت.`
                : `Your ATLASYA PRO subscription request was declined.${reason ? ' Reason: ' + reason : ''} You can submit a new request anytime.`;
            if (typeof window._sendAdminAlert === 'function') await window._sendAdminAlert(uid, alertMsg);
            if (typeof window._sendSubscriptionEmail === 'function') {
                await window._sendSubscriptionEmail(
                    reqData.email, ((reqData.firstName||'')+' '+(reqData.lastName||'')).trim(),
                    isAR ? 'حالة طلب اشتراكك في ATLASYA PRO' : 'Update on your ATLASYA PRO request',
                    alertMsg
                );
            }

            showToast(isAR ? '✓ تم رفض الطلب وإشعار الطالب' : '✓ Request rejected & student notified');
            adminLoadMembers();
        } catch(e) {
            showToast(isAR ? 'خطأ في الرفض' : 'Rejection failed', true);
        }
    };

    /* Permanently deletes a request record (spam/duplicate cleanup only —
       approve/reject above keep full history instead of deleting). */
    window.adminDeleteRequest = async function(reqId) {
        const isAR = lang === 'AR';
        try {
            await window._deleteUpgradeRequest(reqId);
            // Animate out
            const el = document.getElementById('req_' + reqId);
            if (el) { el.style.opacity = '0'; el.style.transform = 'scale(0.95)'; setTimeout(() => el.remove(), 250); }
            showToast(isAR ? '✓ تم حذف الطلب' : '✓ Request deleted');
            const reqBadge = document.getElementById('upgradeReqBadge');
            if (reqBadge) {
                const cur = parseInt(reqBadge.textContent) || 0;
                const next = cur - 1;
                reqBadge.textContent = next;
                if (next <= 0) reqBadge.style.display = 'none';
            }
        } catch(e) {
            showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
        }
    };


    /* ─── ADMIN: SUSPEND / UNSUSPEND ─── */
    window.adminToggleSuspend = async function(uid, currentlySuspended) {
        const isAR = lang === 'AR';
        const newState = !currentlySuspended;
        const confirmMsg = newState
            ? (isAR ? 'تأكيد إيقاف هذا العضو مؤقتاً؟' : 'Suspend this member temporarily?')
            : (isAR ? 'رفع الإيقاف عن هذا العضو؟' : 'Remove suspension from this member?');
        if (!confirm(confirmMsg)) return;
        try {
            await window._suspendUser(uid, newState);
            showToast(newState
                ? (isAR ? '⛔ تم إيقاف العضو مؤقتاً' : '⛔ Member suspended')
                : (isAR ? '✓ تم رفع الإيقاف' : '✓ Suspension removed'));
            adminLoadMembers();
        } catch(e) {
            showToast(isAR ? 'خطأ في التعطيل' : 'Failed to update', true);
        }
    };

    /* ─── ADMIN: DELETE MEMBER PERMANENTLY ─── */
    window.adminDeleteMember = async function(uid, name) {
        const isAR = lang === 'AR';
        const confirmMsg = isAR
            ? `⚠️ هل أنت متأكد من حذف حساب "${name}" نهائياً؟\nسيتم حذف بياناته من Firestore.\nلا يمكن التراجع عن هذا الإجراء.`
            : `⚠️ Permanently delete "${name}"?\nThis will remove their data from Firestore.\nThis cannot be undone.`;
        if (!confirm(confirmMsg)) return;
        try {
            await window._deleteUserData(uid);
            showToast(isAR ? `🗑️ تم حذف حساب ${name} نهائياً` : `🗑️ ${name}'s account deleted`);
            // Animate row out
            const row = document.getElementById('memrow_' + uid);
            if (row) { row.style.opacity='0'; row.style.transform='scale(0.95)'; row.style.transition='0.3s'; setTimeout(()=>row.remove(),300); }
            const badge = document.getElementById('memberCountBadge');
            if (badge) { const n=parseInt(badge.textContent)||1; badge.textContent=n-1; }
        } catch(e) {
            showToast(isAR ? 'خطأ في حذف الحساب' : 'Delete failed', true);
        }
    };

    /* ─── ADMIN: SEND ALERT MESSAGE ─── */
    window.openAdminAlert = function(uid, name) {
        const isAR = lang === 'AR';
        // Remove any existing alert modal
        const existing = document.getElementById('adminAlertModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'adminAlertModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
        modal.onclick = function(e) { if(e.target===modal) modal.remove(); };
        modal.innerHTML = `
            <div style="background:var(--bg2);border:1px solid rgba(100,149,237,0.3);border-radius:20px;padding:28px;max-width:420px;width:100%;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.7);animation:fadeUp 0.25s ease both;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;">
                <button onclick="document.getElementById('adminAlertModal').remove()" style="position:absolute;top:14px;${isAR?'right':'left'}:14px;width:32px;height:32px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:50%;color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div style="text-align:center;margin-bottom:20px;margin-top:4px;">
                    <div style="width:48px;height:48px;border-radius:50%;background:rgba(100,149,237,0.12);border:2px solid rgba(100,149,237,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                        <i class="fa-solid fa-paper-plane" style="color:#6495ed;font-size:20px;"></i>
                    </div>
                    <div style="font-size:16px;font-weight:700;color:var(--text);">${isAR?'رسالة تنبيه':'Alert Message'}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:4px;">${isAR?'إلى:':'To:'} <b style="color:var(--text);">${name}</b></div>
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${isAR?'نص الرسالة':'Message'}</label>
                    <textarea id="adminAlertText" rows="4" placeholder="${isAR?'اكتب رسالتك للعضو هنا...':'Write your message to this member...'}" style="width:100%;padding:12px 14px;background:rgba(0,0,0,0.35);border:1px solid rgba(100,149,237,0.2);border-radius:10px;color:var(--text);font-size:14px;font-family:'Tajawal',sans-serif;resize:vertical;outline:none;transition:border-color 0.25s;" onfocus="this.style.borderColor='#6495ed'" onblur="this.style.borderColor='rgba(100,149,237,0.2)'"></textarea>
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="document.getElementById('adminAlertModal').remove()" style="flex:1;padding:11px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;">
                        ${isAR?'إلغاء':'Cancel'}
                    </button>
                    <button onclick="sendAdminAlertNow('${uid}')" style="flex:2;padding:11px;background:linear-gradient(135deg,#4a7adb,#2a5ab8);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;box-shadow:0 4px 16px rgba(100,149,237,0.3);">
                        <i class="fa-solid fa-paper-plane"></i>
                        ${isAR?'إرسال الرسالة':'Send Message'}
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('adminAlertText')?.focus(), 100);
    };

    window.sendAdminAlertNow = async function(uid) {
        const isAR = lang === 'AR';
        const text = (document.getElementById('adminAlertText')?.value || '').trim();
        if (!text) {
            showToast(isAR ? 'اكتب الرسالة أولاً' : 'Please write a message first', true);
            return;
        }
        const btn = document.querySelector('#adminAlertModal button[onclick^="sendAdmin"]');
        if (btn) { btn.disabled=true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`; }
        try {
            await window._sendAdminAlert(uid, text);
            showToast(isAR ? '✅ تم إرسال الرسالة بنجاح' : '✅ Message sent successfully');
            document.getElementById('adminAlertModal')?.remove();
        } catch(e) {
            showToast(isAR ? 'خطأ في الإرسال' : 'Send failed', true);
            if (btn) { btn.disabled=false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال':'Send'}`; }
        }
    };

    /* ─── ADMIN: CV BUILD REQUESTS ─── */
    window.adminLoadCVRequests = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('cvRequestsList');
        const badge = document.getElementById('cvReqCountBadge');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const reqs = await window._loadCVRequests();
            window._cvRequestsCache = reqs;
            if (badge) badge.textContent = reqs.length;
            if (!reqs.length) {
                list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-inbox" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات عمل CV حالياً':'No CV build requests right now'}</div>`;
                return;
            }
            const statusLabel = { pending: isAR?'قيد المراجعة':'Pending', in_progress: isAR?'جاري التجهيز':'In Progress', done: isAR?'تم التجهيز':'Done' };
            const statusColor = { pending: 'var(--gold3)', in_progress: 'var(--green4)', done: 'var(--green4)' };
            list.innerHTML = `
            <!-- CV Detail Modal -->
            <div id="cvDetailModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this)closeCVModal()">
                <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:20px;padding:28px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.6);">
                    <button onclick="closeCVModal()" style="position:absolute;top:14px;left:14px;width:32px;height:32px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:50%;color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div id="cvDetailContent"></div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${reqs.map(r => {
                    const status = r.status || 'pending';
                    const timeStr = r.updatedAt?.toDate ? r.updatedAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                        <div onclick="showCVDetail('${r.uid}')" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold3));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:15px;flex-shrink:0;cursor:pointer;">${(r.fullName||'U')[0].toUpperCase()}</div>
                        <div onclick="showCVDetail('${r.uid}')" style="flex:1;min-width:160px;cursor:pointer;">
                            <div style="font-size:13px;font-weight:700;">${r.fullName||'—'}</div>
                            <div style="font-size:11px;color:var(--muted);margin-top:1px;">${r.targetTitle||''} ${r.email ? '· '+r.email : ''}</div>
                            <div style="font-size:11px;color:var(--muted);margin-top:2px;"><i class="fa-regular fa-clock" style="margin-left:3px;"></i>${timeStr}</div>
                        </div>
                        <span style="font-size:11px;font-weight:700;color:${statusColor[status]};background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.25);padding:3px 10px;border-radius:99px;flex-shrink:0;">${statusLabel[status]}</span>
                        <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                            <select onchange="adminUpdateCVStatus('${r.uid}', this.value)" style="padding:6px 8px;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:11px;font-family:'Tajawal',sans-serif;cursor:pointer;">
                                <option value="pending" ${status==='pending'?'selected':''}>${isAR?'قيد المراجعة':'Pending'}</option>
                                <option value="in_progress" ${status==='in_progress'?'selected':''}>${isAR?'جاري التجهيز':'In Progress'}</option>
                                <option value="done" ${status==='done'?'selected':''}>${isAR?'تم التجهيز':'Done'}</option>
                            </select>
                            <button onclick="adminDeleteCVRequest('${r.uid}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.25);border-radius:8px;color:#ff6b6b;cursor:pointer;flex-shrink:0;" title="${isAR?'حذف':'Delete'}">
                                <i class="fa-solid fa-trash-can" style="font-size:13px;"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        } catch(e) {
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    window.showCVDetail = async function(uid) {
        const isAR = lang === 'AR';
        const r = (window._cvRequestsCache || []).find(x => x.uid === uid);
        if (!r) return;
        const field = (label, val) => val ? `<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:var(--gold3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">${label}</div><div style="font-size:13px;color:var(--text);white-space:pre-wrap;line-height:1.6;">${val}</div></div>` : '';
        const content = document.getElementById('cvDetailContent');
        if (!content) return;
        content.innerHTML = `<div style="text-align:center;padding:30px;"><div class="spinner" style="margin:0 auto;"></div></div>`;
        const modal = document.getElementById('cvDetailModal');
        if (modal) modal.style.display = 'flex';

        let existingFile = null;
        if (r.hasCvFile) {
            try { existingFile = await window._loadCVFile(uid); } catch(e) { console.error('load cv file error:', e); }
        }

        const certFilesHTML = (Array.isArray(r.certificateFiles) && r.certificateFiles.length)
            ? `<div style="margin-bottom:12px;">
                <div style="font-size:11px;font-weight:700;color:var(--gold3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${isAR?'ملفات الشهادات المرفوعة':'Uploaded Certificate Files'}</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${r.certificateFiles.map(f => `<a href="${f.data}" download="${f.name}" style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--gold3);text-decoration:none;"><i class="fa-solid fa-paperclip"></i><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span><i class="fa-solid fa-download"></i></a>`).join('')}
                </div>
              </div>`
            : '';
        const cvUploadHTML = `
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
                <div style="font-size:11px;font-weight:700;color:var(--gold3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${isAR?'رفع ملف الـ CV النهائي للطالب':'Upload Final CV File to Student'}</div>
                ${existingFile?.fileData ? `<a href="${existingFile.fileData}" download="${existingFile.fileName||'CV'}" style="display:inline-flex;align-items:center;gap:6px;margin-bottom:10px;padding:6px 12px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:8px;color:var(--green4);font-size:12px;text-decoration:none;"><i class="fa-solid fa-file-circle-check"></i>${existingFile.fileName||'CV'}</a>` : ''}
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <input type="file" id="adminCVFileInput" accept=".pdf,.doc,.docx" style="flex:1;min-width:160px;font-size:12px;color:var(--muted);">
                    <button onclick="adminUploadCVFile('${uid}')" id="adminCVUploadBtn" style="padding:8px 16px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:8px;font-size:12px;font-weight:800;font-family:'Tajawal',sans-serif;cursor:pointer;flex-shrink:0;">
                        <i class="fa-solid fa-upload"></i> ${isAR?'رفع وإرسال':'Upload & Send'}
                    </button>
                </div>
            </div>`;
        content.innerHTML = `
            <h3 style="margin-bottom:16px;margin-top:6px;">${r.fullName||''}</h3>
            ${field(isAR?'البريد الإلكتروني':'Email', r.email)}
            ${field(isAR?'الهاتف':'Phone', r.phone)}
            ${field(isAR?'العنوان':'Address', r.address)}
            ${field('LinkedIn', r.linkedin)}
            ${field(isAR?'بورتفوليو':'Portfolio', r.portfolio)}
            ${field(isAR?'المسمى الوظيفي المستهدف':'Target Job Title', r.targetTitle)}
            ${field(isAR?'النبذة':'Summary', r.summary)}
            ${field(isAR?'التعليم':'Education', r.education)}
            ${field(isAR?'الخبرات':'Experience', r.experience)}
            ${field(isAR?'المهارات':'Skills', r.skills)}
            ${field(isAR?'اللغات':'Languages', r.languages)}
            ${field(isAR?'الشهادات':'Certifications', r.certifications)}
            ${certFilesHTML}
            ${field(isAR?'ملاحظات':'Notes', r.notes)}
            ${cvUploadHTML}
        `;
    };

    window.adminUploadCVFile = function(uid) {
        const isAR = lang === 'AR';
        const input = document.getElementById('adminCVFileInput');
        const file = input?.files?.[0];
        if (!file) { showToast(isAR?'اختر ملف الـ CV أولاً':'Select a CV file first', true); return; }
        const ADMIN_CV_MAX_BYTES = 700000; // this doc is separate now, but keep a sane cap (~700KB raw ≈ ~930KB as base64)
        if (file.size > ADMIN_CV_MAX_BYTES) {
            showToast(isAR ? `⚠️ الملف كبير جداً (الحد الأقصى ~700KB)` : `⚠️ File too large (max ~700KB)`, true);
            return;
        }
        const btn = document.getElementById('adminCVUploadBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                await window._uploadCVFileForRequest(uid, file.name, ev.target.result);
                showToast(isAR ? '✓ تم رفع الـ CV وإرساله للطالب' : '✓ CV uploaded and sent to student');
                closeCVModal();
                adminLoadCVRequests();
            } catch(e) {
                console.error('CV file upload error:', e);
                showToast(isAR ? 'خطأ في رفع الملف' : 'Upload failed', true);
                if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-upload"></i> ${isAR?'رفع وإرسال':'Upload & Send'}`; }
            }
        };
        reader.onerror = () => {
            showToast(isAR ? 'فشل قراءة الملف' : 'Failed to read file', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-upload"></i> ${isAR?'رفع وإرسال':'Upload & Send'}`; }
        };
        reader.readAsDataURL(file);
    };

    window.closeCVModal = function() {
        const modal = document.getElementById('cvDetailModal');
        if (modal) modal.style.display = 'none';
    };

    window.adminUpdateCVStatus = async function(uid, status) {
        const isAR = lang === 'AR';
        try {
            await window._updateCVRequestStatus(uid, status);
            showToast(isAR ? '✓ تم تحديث الحالة' : '✓ Status updated');
            adminLoadCVRequests();
        } catch(e) {
            showToast(isAR ? 'خطأ في التحديث' : 'Update failed', true);
        }
    };

    window.adminDeleteCVRequest = async function(uid) {
        const isAR = lang === 'AR';
        if (!confirm(isAR ? 'حذف هذا الطلب؟' : 'Delete this request?')) return;
        try {
            await window._deleteCVRequest(uid);
            showToast(isAR ? '✓ تم الحذف' : '✓ Deleted');
            adminLoadCVRequests();
        } catch(e) {
            showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
        }
    };

    async function saveProfile() {
        const btn = document.getElementById('saveProfileBtn');
        btn.innerHTML = '<div class="spinner"></div>';
        btn.disabled = true;
        const data = {
            firstName: document.getElementById('pFirstName').value,
            lastName:  document.getElementById('pLastName').value,
            phone:     document.getElementById('pPhone').value,
            job:       document.getElementById('pJob').value,
            company:   document.getElementById('pCompany').value,
            academicLevel: document.getElementById('pLevel').value,
            bio:       document.getElementById('pBio').value,
        };
        try {
            await window._saveProfile(data);
            window._userData = { ...window._userData, ...data };
            if (window._updateSidebarUser) window._updateSidebarUser(data.firstName, data.lastName, window._base64Img);
            if (window._applyTheme) window._applyTheme(data.affiliate || '');
            showToast(lang==='AR'?'تم حفظ التغييرات':'Changes saved');
        } catch(e) {
            showToast(e.message, true);
        } finally {
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${lang==='AR'?'حفظ التغييرات':'Save Changes'}</span>`;
            btn.disabled = false;
        }
    }

    async function changePassword() {
        const current = document.getElementById('pCurrentPass')?.value;
        const newPass = document.getElementById('pNewPass')?.value;
        const confirm = document.getElementById('pConfirmPass')?.value;
        const isAR = lang === 'AR';
        if (!current || !newPass || !confirm) { showToast(isAR?'أكمل جميع حقول كلمة المرور':'Fill all password fields', true); return; }
        if (newPass !== confirm) { showToast(isAR?'كلمتا المرور الجديدتان غير متطابقتين':'New passwords do not match', true); return; }
        if (newPass.length < 6) { showToast(isAR?'كلمة المرور قصيرة جداً (6 أحرف على الأقل)':'Password too short (min 6 chars)', true); return; }
        if (!/[^A-Za-z0-9]/.test(newPass)) {
            showToast(
                isAR
                    ? ' يجب أن تحتوي كلمة المرور على رمز خاص مثل: @ # ! $ % & * ويجب أن تكون كلمة المرور قوية جدا'
                    : ' Password should include a special character like: @ # ! $ % & * and be very strong',
                true
            );
            return;
        }
        try {
            const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = window.__sbCompat;
            const user = window._auth?.currentUser;
            if (!user) { showToast(isAR?'يجب تسجيل الدخول':'Must be logged in', true); return; }
            const credential = EmailAuthProvider.credential(user.email, current);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPass);
            showToast(isAR?'تم تغيير كلمة المرور بنجاح':'Password changed successfully!');
            document.getElementById('pCurrentPass').value = '';
            document.getElementById('pNewPass').value = '';
            document.getElementById('pConfirmPass').value = '';
        } catch(e) {
            showToast(isAR?'كلمة المرور الحالية غير صحيحة':'Current password is incorrect', true);
        }
    }

    function toggleEyeField(inputId, btn) {
        const inp = document.getElementById(inputId);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    }

    function checkAccountPassStrength() {
        const pass = document.getElementById('pNewPass')?.value || '';
        const fill = document.getElementById('acctPassFill');
        const label = document.getElementById('acctPassLabel');
        if (!fill || !label) return;
        if (!pass) { fill.style.width='0%'; label.textContent=''; return; }
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        const levels = [
            { pct:'20%', color:'#e74c3c', lbl:'Very Weak' },
            { pct:'40%', color:'#e67e22', lbl:'Weak' },
            { pct:'65%', color:'#f0c040', lbl:'Medium' },
            { pct:'85%', color:'#27a346', lbl:'Strong' },
            { pct:'100%',color:'#1abc9c', lbl:'Very Strong' },
        ];
        const lvl = levels[Math.min(score, levels.length-1)];
        fill.style.width = lvl.pct; fill.style.background = lvl.color;
        label.textContent = lvl.lbl; label.style.color = lvl.color;
    }

    async function deleteAccount() {
        const confirm = window.confirm(lang==='AR'?'هل أنت متأكد من حذف الحساب نهائياً؟':'Are you sure you want to permanently delete your account?');
        if (!confirm) return;
        try {
            await window._deleteAccount();
        } catch(e) { showToast(e.message, true); }
    }

    /* ─── IMAGE COMPRESSION (keeps profileImg under Firestore's 1MB field limit) ─── */
    function _resizeImageFile(file, maxDim, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
                    } else {
                        if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function compressImageForProfile(file) {
        const LIMIT = 700000; // safe margin under Firestore's 1,048,487 byte field limit
        let maxDim = 600, quality = 0.8;
        let dataUrl = await _resizeImageFile(file, maxDim, quality);
        while (dataUrl.length > LIMIT && (quality > 0.3 || maxDim > 150)) {
            if (quality > 0.3) quality = Math.round((quality - 0.1) * 10) / 10;
            else maxDim = Math.round(maxDim * 0.8);
            dataUrl = await _resizeImageFile(file, maxDim, quality);
        }
        return dataUrl;
    }

    function handleAdminImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            window._base64Img = ev.target.result;
            // Save to localStorage keyed by username so it persists
            if (window._adminProfile) {
                localStorage.setItem('adminImg_' + window._adminProfile.username, ev.target.result);
            }
            const av = document.getElementById('avatarXl');
            if (av) {
                av.style.backgroundImage = `url('${ev.target.result}')`;
                av.innerHTML = '<div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>';
            }
            // Update topbar avatar
            if (window._adminProfile && window._updateSidebarUser) {
                window._updateSidebarUser(window._adminProfile.firstName, window._adminProfile.lastName, ev.target.result);
            }
            showToast(lang==='AR' ? 'تم تحديث الصورة' : 'Photo updated');
        };
        reader.readAsDataURL(file);
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        try {
            const dataUrl = await compressImageForProfile(file);
            if (dataUrl.length > 1000000) {
                showToast(isAR ? '⚠️ الصورة كبيرة جداً، جرّب صورة أصغر' : '⚠️ Image is too large, try a smaller one', true);
                return;
            }
            window._base64Img = dataUrl;
            const av = document.getElementById('avatarXl');
            if (av) { av.style.backgroundImage = `url('${dataUrl}')`; av.innerHTML = '<div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>'; }
            const sa = document.getElementById('sideAvatar');
            if (sa) { sa.style.backgroundImage = `url('${dataUrl}')`; sa.innerHTML = ''; }
        } catch (err) {
            console.error('handleImageUpload error:', err);
            showToast(isAR ? 'حدث خطأ أثناء تحميل الصورة' : 'Error processing the image', true);
        }
    }

    /* ─── FORGOT EMAIL ─── */
    function showForgotEmailHint() {
        const isAR = lang === 'AR';
        showToast(isAR
            ? 'لو نسيت بريدك الإلكتروني، تواصل مع الدعم الفني عن طريق صفحة "تواصل معنا" لمساعدتك في استرجاعه'
            : "If you forgot your email, please contact our support team via the 'Connect' page to help you recover it", true);
    }
    window.showForgotEmailHint = showForgotEmailHint;

    /* ─── SOCIAL AUTH (Google / Facebook) ─── */
    async function socialAuth(provider) {
        const isAR = lang === 'AR';
        try {
            await window._socialSignIn(provider);
            showToast(isAR ? '✓ تم تسجيل الدخول بنجاح' : '✓ Signed in successfully');
        } catch(e) {
            console.error('socialAuth error:', e);
            let msg = e.message;
            if (e.code === 'auth/popup-closed-by-user') return; // user cancelled, no need to show error
            if (e.code === 'auth/account-exists-with-different-credential') {
                msg = isAR ? 'يوجد حساب بهذا البريد بطريقة تسجيل دخول مختلفة' : 'An account already exists with a different sign-in method';
            }
            showToast(msg, true);
        }
    }
    window.socialAuth = socialAuth;

    /* ─── FORGOT PASSWORD ─── */
    function showForgotPassword() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signUpForm').classList.add('hidden');
        document.getElementById('forgotForm').classList.remove('hidden');

        document.getElementById('emailVerifyForm').classList.add('hidden');
    }

    async function doForgotPassword() {
        const email = document.getElementById('forgotEmail').value.trim();
        if (!email) { showToast('أدخل بريدك الإلكتروني', true); return; }
        const btn = document.getElementById('forgotBtn');
        btn.innerHTML = '<div class="spinner"></div>';
        btn.disabled = true;
        try {
            await window._doForgotPassword(email);
            showToast('تم إرسال رابط الاسترداد إلى بريدك');
            setTimeout(() => showLogin(), 2000);
        } catch(e) {
            showToast('البريد غير مسجل أو غير صحيح', true);
        } finally {
            btn.innerHTML = `<span>إرسال رابط الاسترداد</span>`;
            btn.disabled = false;
        }
    }

    /* ─── SUPPORT TICKETS PAGE ─── */
    let _myTicketsUnsub = null;
    let _allTicketsUnsub = null;
    let _ticketScreenshotData = '';
    let _selectedTicketType = '';
    let _activeAdminTicketId = null;
    let _allTicketsCache = [];
    let _adminTicketFilter = 'all';

    const TICKET_TYPES = [
        { key: 'inquiry',    icon: 'fa-circle-question',   labelAR: 'استفسار', labelEN: 'Inquiry' },
        { key: 'complaint',  icon: 'fa-triangle-exclamation', labelAR: 'شكوى',    labelEN: 'Complaint' },
        { key: 'suggestion', icon: 'fa-lightbulb',         labelAR: 'اقتراح',  labelEN: 'Suggestion' }
    ];

    function ticketTypeLabel(type, isAR) {
        const t = TICKET_TYPES.find(x => x.key === type);
        if (!t) return type || '';
        return isAR ? t.labelAR : t.labelEN;
    }
    function ticketTypeIcon(type) {
        const t = TICKET_TYPES.find(x => x.key === type);
        return t ? t.icon : 'fa-ticket';
    }
    function ticketStatusLabel(status, isAR) {
        if (status === 'answered') return isAR ? 'تم الرد' : 'Answered';
        if (status === 'closed') return isAR ? 'مغلقة' : 'Closed';
        return isAR ? 'قيد الانتظار' : 'Pending';
    }
    function ticketDate(ts, isAR) {
        if (!ts?.toDate) return '';
        return ts.toDate().toLocaleString(isAR ? 'ar-EG' : 'en-US', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    }

    async function renderExpert(area) {
        const isAR = lang === 'AR';
        const isAdmin = window._isAdmin === true;

        if (_myTicketsUnsub) { _myTicketsUnsub(); _myTicketsUnsub = null; }
        if (_allTicketsUnsub) { _allTicketsUnsub(); _allTicketsUnsub = null; }

        if (isAdmin) {
            area.innerHTML = `
            <div class="page-header" style="margin-bottom:16px;">
                <h2>${isAR?'تذاكر الدعم الفني':'Support Tickets'}</h2>
                <p>${isAR?'اطّلع على مشاكل الطلبة ورُد على تذاكرهم':'Review student issues and reply to their tickets'}</p>
            </div>
            <div id="adminTicketWrap">
            <style>
            #adminTicketWrap { display:grid; grid-template-columns:320px 1fr; gap:16px; height:calc(100vh - 210px); min-height:460px; }
            @media (max-width:768px) {
                #adminTicketWrap { display:flex; flex-direction:column; gap:10px; height:auto; min-height:unset; }
                #adminTicketListBox { max-height:320px; }
                #adminTicketDetailBox { min-height:320px; }
            }
            </style>
                <div id="adminTicketListBox" style="background:var(--chat-card-bg);border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;">
                    <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0;">
                        <div style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
                            <i class="fa-solid fa-ticket" style="color:var(--g3);margin-${isAR?'left':'right'}:7px;"></i>${isAR?'التذاكر':'Tickets'}
                        </div>
                        <div class="tk-tabs" style="margin-bottom:0;">
                            <button class="tk-tab active" id="adminTkFilterAll" onclick="setAdminTicketFilter('all')">${isAR?'الكل':'All'}</button>
                            <button class="tk-tab" id="adminTkFilterOpen" onclick="setAdminTicketFilter('open')">${isAR?'قيد الانتظار':'Pending'}</button>
                            <button class="tk-tab" id="adminTkFilterAnswered" onclick="setAdminTicketFilter('answered')">${isAR?'تم الرد':'Answered'}</button>
                        </div>
                    </div>
                    <div id="adminTicketList" style="flex:1;overflow-y:auto;"></div>
                </div>
                <div id="adminTicketDetailBox" style="background:var(--chat-card-bg);border:1px solid var(--border);border-radius:16px;overflow-y:auto;padding:20px;">
                    <div id="adminTicketDetail" style="text-align:center;padding:40px;color:var(--muted);">
                        <i class="fa-regular fa-folder-open" style="font-size:36px;opacity:0.3;display:block;margin-bottom:12px;"></i>
                        <div style="font-size:13px;">${isAR?'اختر تذكرة من القائمة':'Choose a ticket from the list'}</div>
                    </div>
                </div>
            </div>`;
            _allTicketsUnsub = window._subscribeAllTickets(tickets => {
                _allTicketsCache = tickets;
                renderAdminTicketList(isAR);
                if (_activeAdminTicketId) renderAdminTicketDetail(isAR, _activeAdminTicketId);
            });
        } else {
            area.innerHTML = `
            <div class="page-header" style="margin-bottom:16px;">
                <h2>${isAR?'مركز المساعدة':'Help Center'}</h2>
                <p>${isAR?'أرسل تذكرة دعم وتابع ردود فريق Atlasya':'Submit a support ticket and track replies from the Atlasya team'}</p>
            </div>
            <div class="tk-tabs">
                <button class="tk-tab active" id="studentTkTabNew" onclick="switchTicketTab('new')">
                    <i class="fa-solid fa-plus"></i> ${isAR?'تذكرة جديدة':'New Ticket'}
                </button>
                <button class="tk-tab" id="studentTkTabMine" onclick="switchTicketTab('mine')">
                    <i class="fa-solid fa-headset"></i> ${isAR?'عرض تذاكر الدعم':'View Support Tickets'}
                </button>
            </div>
            <div id="studentTkNewPane">
                <div class="tk-hero-grid">
                    <div class="tk-hero-illustration">
                        <div class="tk-hero-circle">
                            <i class="fa-solid fa-envelope-open-text main-icon"></i>
                            <div class="tk-hero-bubble" style="top:-6px;inset-inline-end:-10px;background:linear-gradient(135deg,var(--gold3),var(--gold2));"><i class="fa-solid fa-comment-dots"></i></div>
                            <div class="tk-hero-bubble" style="bottom:4px;inset-inline-start:-16px;"><i class="fa-solid fa-paper-plane"></i></div>
                        </div>
                        <span class="tk-hero-dot" style="width:14px;height:14px;background:var(--gold4);top:14%;inset-inline-start:8%;"></span>
                        <span class="tk-hero-dot" style="width:10px;height:10px;background:var(--g4);bottom:12%;inset-inline-end:10%;"></span>
                        <span class="tk-hero-dot" style="width:8px;height:8px;background:var(--gold3);top:70%;inset-inline-start:18%;"></span>
                    </div>
                    <div class="tk-hero-form">
                        <label class="tk-field-label">${isAR?'اختر':'Choose'}</label>
                        <div class="tk-select-wrap">
                            <select id="ticketTypeSelect" onchange="selectTicketType(this.value)">
                                <option value="" disabled selected>${isAR?'اختر نوع المشكلة':'Select issue type'}</option>
                                ${TICKET_TYPES.map(t => `<option value="${t.key}">${isAR ? t.labelAR : t.labelEN}</option>`).join('')}
                            </select>
                            <i class="fa-solid fa-chevron-${isAR?'down':'down'} chevron"></i>
                        </div>
                        <label class="tk-field-label">${isAR?'يرجى كتابة تفاصيل المشكلة لمساعدتنا في حلها':'Please describe the issue to help us solve it'}</label>
                        <textarea id="ticketMessage" placeholder="${isAR?'اكتب هنا...':'Write here...'}"
                            style="width:100%;min-height:130px;padding:14px;border-radius:12px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text);font-family:'Tajawal',sans-serif;font-size:14px;line-height:1.6;resize:vertical;outline:none;margin-bottom:18px;"></textarea>
                        <label class="tk-field-label">${isAR?'يمكنك إضافة صورة توضح المشكلة بشكل أفضل':'You can add an image to better illustrate the issue'}</label>
                        <div class="tk-upload-box" id="ticketUploadBox">
                            <input type="file" id="ticketScreenshotInput" accept="image/*" onchange="handleTicketScreenshot(event)">
                            <i class="fa-solid fa-cloud-arrow-up upload-ic"></i>
                            <span>${isAR?'اختر ملف، أو قم بالسحب والإسقاط':'Choose a file, or drag and drop'}</span>
                        </div>
                        <div id="ticketScreenshotPreviewWrap"></div>
                        <button id="ticketSubmitBtn" onclick="submitTicket()" style="margin-top:18px;padding:12px 28px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--g3),var(--g2));color:#fff;font-family:'Tajawal',sans-serif;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;">
                            <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال التذكرة':'Submit Ticket'}
                        </button>
                    </div>
                </div>
            </div>
            <div id="studentTkMinePane" style="display:none;">
                <div id="studentTkList">
                    <div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>`;
            _selectedTicketType = '';
            _ticketScreenshotData = '';
            _myTicketsUnsub = window._subscribeMyTickets(tickets => renderStudentTicketList(tickets, isAR));
        }
    }

    function switchTicketTab(tab) {
        const isNew = tab === 'new';
        document.getElementById('studentTkTabNew')?.classList.toggle('active', isNew);
        document.getElementById('studentTkTabMine')?.classList.toggle('active', !isNew);
        const newPane = document.getElementById('studentTkNewPane');
        const minePane = document.getElementById('studentTkMinePane');
        if (newPane) newPane.style.display = isNew ? '' : 'none';
        if (minePane) minePane.style.display = isNew ? 'none' : '';
    }

    function selectTicketType(key) {
        _selectedTicketType = key;
    }

    async function handleTicketScreenshot(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        try {
            const dataUrl = await compressImageForProfile(file);
            _ticketScreenshotData = dataUrl;
            const preview = document.getElementById('ticketScreenshotPreviewWrap');
            if (preview) preview.innerHTML = `<img src="${dataUrl}" class="tk-screenshot-thumb" onclick="window.open('${dataUrl}','_blank')">`;
        } catch (err) {
            showToast(isAR ? 'تعذر تحميل الصورة' : 'Failed to load image', true);
        }
    }

    async function submitTicket() {
        const isAR = lang === 'AR';
        const msgEl = document.getElementById('ticketMessage');
        const message = msgEl ? msgEl.value.trim() : '';
        if (!_selectedTicketType) {
            showToast(isAR ? 'من فضلك اختر نوع المشكلة' : 'Please select an issue type', true);
            return;
        }
        if (!message) {
            showToast(isAR ? 'من فضلك اكتب تفاصيل المشكلة' : 'Please describe your issue', true);
            return;
        }
        const btn = document.getElementById('ticketSubmitBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            await window._createTicket({ type: _selectedTicketType, message, screenshot: _ticketScreenshotData });
            showToast(isAR ? 'تم إرسال التذكرة بنجاح ✓' : 'Ticket submitted successfully ✓');
            _selectedTicketType = '';
            _ticketScreenshotData = '';
            if (msgEl) msgEl.value = '';
            const typeSelect = document.getElementById('ticketTypeSelect');
            if (typeSelect) typeSelect.selectedIndex = 0;
            const preview = document.getElementById('ticketScreenshotPreviewWrap');
            if (preview) preview.innerHTML = '';
            const fileInput = document.getElementById('ticketScreenshotInput');
            if (fileInput) fileInput.value = '';
            switchTicketTab('mine');
        } catch (err) {
            console.error('submitTicket error:', err);
            showToast(isAR ? 'حدث خطأ أثناء الإرسال' : 'Failed to submit ticket', true);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال التذكرة':'Submit Ticket'}`; }
        }
    }

    function renderStudentTicketList(tickets, isAR) {
        const list = document.getElementById('studentTkList');
        if (!list) return;
        if (!tickets.length) {
            list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
                <i class="fa-regular fa-folder-open" style="font-size:34px;opacity:0.3;display:block;margin-bottom:12px;"></i>
                <div style="font-size:13px;">${isAR?'لا يوجد لديك تذاكر بعد':"You haven't submitted any tickets yet"}</div>
            </div>`;
            return;
        }
        window._myTicketsCache = {};
        tickets.forEach(tk => { window._myTicketsCache[tk.id] = tk; });

        const rows = tickets.map(tk => {
            const badgeClass = 'tk-badge-' + (tk.type || 'inquiry');
            const statusClass = 'tk-status-' + (tk.status || 'open');
            const canAnswer = tk.status === 'answered' || tk.status === 'closed';

            let ratingCell = `<span style="color:var(--muted);font-size:12px;">${isAR?'بانتظار الرد':'Awaiting reply'}</span>`;
            if (canAnswer) {
                if (tk.rating > 0) {
                    ratingCell = `<span style="direction:ltr;display:inline-block;color:var(--gold3);">${'★'.repeat(tk.rating)}${'☆'.repeat(5-tk.rating)}</span>`;
                } else if (tk.reply) {
                    ratingCell = `<button class="tk-rate-btn" onclick="openTicketRatingModal('${tk.id}')"><i class="fa-solid fa-star"></i> ${isAR?'قيّم الخدمة':'Rate service'}</button>`;
                }
            }

            return `<tr>
                <td><span class="tk-badge ${badgeClass}"><i class="fa-solid ${ticketTypeIcon(tk.type)}"></i> ${ticketTypeLabel(tk.type, isAR)}</span></td>
                <td style="white-space:nowrap;font-size:12px;color:var(--muted);">${ticketDate(tk.createdAt, isAR)}</td>
                <td><span class="tk-status ${statusClass}">${ticketStatusLabel(tk.status, isAR)}</span></td>
                <td><div class="tk-cell-clip">${escapeHtml(tk.message||'')}</div></td>
                <td>${tk.reply ? `<div class="tk-cell-clip">${escapeHtml(tk.reply)}</div>` : `<span style="color:var(--muted);font-size:12px;">—</span>`}</td>
                <td>${tk.screenshot ? `<img src="${tk.screenshot}" class="tk-screenshot-thumb" onclick="window.open('${tk.screenshot}','_blank')">` : `<span style="color:var(--muted);font-size:12px;">—</span>`}</td>
                <td>${ratingCell}${tk.ratingComment ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;max-width:160px;">${escapeHtml(tk.ratingComment)}</div>` : ''}</td>
            </tr>`;
        }).join('');

        list.innerHTML = `<div class="tk-table-wrap">
            <table class="tk-table">
                <thead><tr>
                    <th>${isAR?'موضوع':'Subject'}</th>
                    <th>${isAR?'تاريخ الإنشاء':'Created'}</th>
                    <th>${isAR?'الحالة':'Status'}</th>
                    <th>${isAR?'تفاصيل التذكرة':'Ticket Details'}</th>
                    <th>${isAR?'الرد':'Reply'}</th>
                    <th>${isAR?'المرفق':'Attachment'}</th>
                    <th>${isAR?'تقييم مستوى الخدمة':'Service Rating'}</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }