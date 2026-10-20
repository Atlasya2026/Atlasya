
    window.dcDeleteQuestion = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا السؤال نهائياً؟':'Delete this question permanently?')) return;
        try {
            await window._deleteDailyChallengeQ(id);
            _adminDCQs = _adminDCQs.filter(c => c.id !== id);
            renderDCList();
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.openDCForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adminDCQs.find(c => c.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const optAR = editing?.optionsAR || ['','','',''];
        const optEN = editing?.optionsEN || ['','','',''];
        const correctIdx = editing ? (editing.correctIndex ?? 0) : 0;
        const letters = isAR ? ['أ','ب','ج','د'] : ['A','B','C','D'];
        const type = editing?.type || 'daily';
        const difficulty = editing?.difficulty || 'easy';
        const modal = document.createElement('div');
        modal.id = 'dcFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل سؤال':'Edit Question') : (isAR?'إضافة سؤال جديد':'Add New Question')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('dcFormModal').remove()"></i>
            </div>
            <div class="proj-form-grid">
                <div class="job-field">
                    <label>${isAR?'نوع التحدي *':'Challenge Type *'}</label>
                    <select id="dc_type">
                        <option value="daily" ${type==='daily'?'selected':''}>${isAR?'يومي':'Daily'}</option>
                        <option value="weekly" ${type==='weekly'?'selected':''}>${isAR?'أسبوعي':'Weekly'}</option>
                    </select>
                </div>
                <div class="job-field">
                    <label>${isAR?'تاريخ ظهور السؤال *':'Date this question appears *'}</label>
                    <input type="date" id="dc_date" value="${escapeHtmlAC(v('scheduledDate'))}">
                </div>
                <div class="job-field">
                    <label>${isAR?'مستوى الصعوبة':'Difficulty'}</label>
                    <select id="dc_difficulty">
                        <option value="easy" ${difficulty==='easy'?'selected':''}>${isAR?'سهل':'Easy'}</option>
                        <option value="medium" ${difficulty==='medium'?'selected':''}>${isAR?'متوسط':'Medium'}</option>
                        <option value="hard" ${difficulty==='hard'?'selected':''}>${isAR?'صعب':'Hard'}</option>
                    </select>
                </div>
                <div class="job-field"><label>${isAR?'قيمة السؤال (عدد العملات) *':'Question value (coins) *'}</label><input type="number" min="1" id="dc_coins" value="${escapeHtmlAC(v('coins'))}" placeholder="10"></div>
                <div class="job-field full"><label>${isAR?'نص السؤال (عربي) *':'Question (Arabic) *'}</label><input type="text" id="dc_qAR" value="${escapeHtmlAC(v('questionAR'))}"></div>
                <div class="job-field full"><label>${isAR?'نص السؤال (إنجليزي)':'Question (English)'}</label><input type="text" id="dc_qEN" value="${escapeHtmlAC(v('questionEN'))}"></div>
                ${[0,1,2,3].map(i => `
                <div class="job-field"><label>${isAR?`الاختيار ${letters[i]} (عربي) *`:`Option ${letters[i]} (Arabic) *`}</label><input type="text" id="dc_optAR_${i}" value="${escapeHtmlAC(optAR[i]||'')}"></div>
                <div class="job-field"><label>${isAR?`الاختيار ${letters[i]} (إنجليزي)`:`Option ${letters[i]} (English)`}</label><input type="text" id="dc_optEN_${i}" value="${escapeHtmlAC(optEN[i]||'')}"></div>
                `).join('')}
                <div class="job-field full">
                    <label>${isAR?'الإجابة الصحيحة *':'Correct Answer *'}</label>
                    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;">
                        ${[0,1,2,3].map(i => `
                        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                            <input type="radio" name="dc_correct" value="${i}" ${correctIdx===i?'checked':''}> ${letters[i]}
                        </label>`).join('')}
                    </div>
                </div>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin-top:8px;">${isAR?'لو حددت "أسبوعي"، هيتحسب السؤال ده ضمن أسبوعه (الأحد للسبت) حسب التاريخ اللي اخترته — أضف سؤال لكل يوم من أيام الأسبوع عشان يقدر الطالب ياخد مكافأة الإكمال.':'If you pick "Weekly", this question is grouped into its calendar week (Sun–Sat) based on the date you chose — add one question per weekday so students can earn the completion bonus.'}</p>
            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="dcSaveBtn" onclick="dcSaveQuestion('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.dcSaveQuestion = async function(editId) {
        const isAR = lang === 'AR';
        const scheduledDate = document.getElementById('dc_date')?.value.trim();
        if (!scheduledDate) { showToast(isAR?'من فضلك اختر تاريخ ظهور السؤال':'Please pick the date this question appears', true); return; }
        const questionAR = document.getElementById('dc_qAR')?.value.trim();
        if (!questionAR) { showToast(isAR?'من فضلك أدخل نص السؤال':'Please enter the question', true); return; }
        const optionsAR = [0,1,2,3].map(i => document.getElementById(`dc_optAR_${i}`)?.value.trim() || '');
        if (optionsAR.some(o => !o)) { showToast(isAR?'من فضلك أدخل كل الاختيارات الأربعة':'Please fill in all 4 options', true); return; }
        const optionsEN = [0,1,2,3].map(i => document.getElementById(`dc_optEN_${i}`)?.value.trim() || '');
        const correctRadio = document.querySelector('input[name="dc_correct"]:checked');
        const correctIndex = correctRadio ? parseInt(correctRadio.value, 10) : 0;
        const coins = parseInt(document.getElementById('dc_coins')?.value, 10);
        if (!coins || coins < 1) { showToast(isAR?'من فضلك أدخل قيمة العملات للسؤال':'Please enter the coin value for this question', true); return; }

        // one question per date+type — warn if a question already exists for this date/type (excluding the one being edited)
        const dup = _adminDCQs.find(c => c.id !== editId && c.scheduledDate === scheduledDate && c.type === document.getElementById('dc_type').value);
        if (dup) { showToast(isAR?'يوجد بالفعل سؤال بنفس النوع والتاريخ':'A question with this type and date already exists', true); return; }

        const data = {
            type: document.getElementById('dc_type')?.value || 'daily',
            scheduledDate,
            difficulty: document.getElementById('dc_difficulty')?.value || 'easy',
            questionAR,
            questionEN: document.getElementById('dc_qEN')?.value.trim() || questionAR,
            optionsAR,
            optionsEN: optionsEN.map((o, i) => o || optionsAR[i]),
            correctIndex,
            coins,
        };

        const btn = document.getElementById('dcSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateDailyChallengeQ(editId, data);
            else await window._addDailyChallengeQ(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('dcFormModal')?.remove();
            loadAdminDailyChallenges();
        } catch(e) {
            console.error('Daily challenge save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: MENTORSHIP REQUESTS ─── */
    async function renderAdminMentorship(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR ? 'إدارة الاستشارات' : 'Consultation Management'}</h2>
            <p>${isAR ? 'شوف طلبات الطلاب ورد عليهم بمواعيد التوفر ولينك الجلسة' : 'View student requests and reply with available times and a session link'}</p>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
            <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                <i class="fa-solid fa-comments" style="color:var(--gold3);"></i>
                ${isAR ? 'طلبات الاستشارة' : 'Consultation Requests'}
                <span id="adminRequestsCountBadge" style="background:var(--gold3);color:#000;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
            </h4>
            <button onclick="adminLoadMentorshipRequests()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
            </button>
        </div>
        <div id="adminRequestsList" style="display:flex;flex-direction:column;gap:12px;">
            <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>`;

        setTimeout(() => adminLoadMentorshipRequests(), 100);
    }

    window.adminLoadMentorshipRequests = async function() {
        const isAR = lang === 'AR';
        const list = document.getElementById('adminRequestsList');
        const badge = document.getElementById('adminRequestsCountBadge');
        if (!list) return;
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            const reqs = await window._loadMentorshipRequests();
            if (badge) { badge.textContent = reqs.length; badge.style.display = reqs.length ? 'inline-flex' : 'none'; }
            if (!reqs.length) {
                list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-comments" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات بعد':'No requests yet'}</div>`;
                return;
            }
            list.innerHTML = reqs.map(r => {
                const timeStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                const waLink = r.phone ? `https://wa.me/${r.phone.replace(/\D/g,'')}` : null;
                const mailLink = r.email ? `mailto:${r.email}` : null;
                return `<div id="request_${r.id}" style="padding:16px 18px;background:rgba(212,160,23,0.04);border:1px solid rgba(212,160,23,0.18);border-radius:14px;">
                    <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold3));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:16px;flex-shrink:0;">${(r.authorName||'U')[0].toUpperCase()}</div>
                        <div style="flex:1;min-width:200px;">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <div style="font-size:14px;font-weight:700;color:var(--text);">${r.authorName||'—'}</div>
                                <span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;background:${r.replied ? 'rgba(var(--brand-rgb,30,122,52),0.15)' : 'rgba(212,160,23,0.15)'};color:${r.replied ? 'var(--green4)' : 'var(--gold3)'};">${r.replied ? (isAR?'تم الرد':'Replied') : (isAR?'قيد الانتظار':'Pending')}</span>
                            </div>
                            <div style="font-size:12px;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                ${mailLink ? `<a href="${mailLink}" style="color:var(--gold3);font-weight:700;text-decoration:none;font-size:12px;"><i class="fa-solid fa-envelope"></i> ${r.email}</a>` : ''}
                                ${r.phone ? `<span style="color:var(--muted);font-size:11px;">· ${r.phone}</span>` : ''}
                            </div>
                            <div style="font-size:13px;color:var(--text);line-height:1.75;margin-top:9px;white-space:pre-wrap;">${(r.message||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                            ${(r.preferredDay || r.preferredTime) ? `<div style="font-size:11px;font-weight:700;color:var(--gold3);margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><i class="fa-regular fa-calendar-check"></i> ${isAR ? 'الوقت المطلوب:' : 'Requested time:'} ${r.preferredDay || ''} ${r.preferredTime ? '— ' + r.preferredTime : ''}</div>` : ''}
                            ${timeStr ? `<div style="font-size:11px;color:var(--muted);margin-top:7px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div>` : ''}
                            ${r.replied ? `<div style="margin-top:11px;padding:10px 12px;background:rgba(var(--brand-rgb,30,122,52),0.07);border:1px solid rgba(var(--brand-rgb,30,122,52),0.22);border-radius:10px;">
                                <div style="font-size:11px;font-weight:700;color:var(--green4);margin-bottom:4px;">${isAR?'ردك':'Your Reply'}</div>
                                <div style="font-size:12px;color:var(--text);line-height:1.65;white-space:pre-wrap;">${(r.reply||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                            </div>` : `
                            <div id="replyBox_${r.id}" style="margin-top:11px;">
                                <textarea id="replyInput_${r.id}" rows="3" placeholder="${isAR?'اكتب ردك هنا (لينك الجلسة والمواعيد المتاحة)...':'Write your reply here (session link and available times)...'}" style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(212,160,23,0.25);border-radius:10px;color:var(--text);font-size:13px;font-family:'Tajawal',sans-serif;outline:none;resize:vertical;margin-bottom:8px;"></textarea>
                                <button onclick="adminSendMentorshipReply('${r.id}')" style="padding:9px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:9px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                    <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الرد':'Send Reply'}
                                </button>
                            </div>`}
                        </div>
                        <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                            ${waLink ? `<a href="${waLink}" target="_blank" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3);border-radius:8px;color:#25d366;" title="${isAR?'واتساب':'WhatsApp'}"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                            <button onclick="adminDeleteMentorshipRequest('${r.id}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(220,50,50,0.22)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'" title="${isAR?'حذف':'Delete'}">
                                <i class="fa-solid fa-trash" style="font-size:13px;"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch(e) {
            list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">${isAR?'خطأ في التحميل':'Loading error'}</div>`;
        }
    };

    window.adminSendMentorshipReply = async function(requestId) {
        const isAR = lang === 'AR';
        const input = document.getElementById('replyInput_' + requestId);
        const text = input?.value.trim();
        if (!text) {
            showToast(isAR ? 'من فضلك اكتب الرد الأول' : 'Please write a reply first', true);
            return;
        }
        try {
            await window._replyMentorshipRequest(requestId, text);
            showToast(isAR ? '✓ تم إرسال الرد للطالب' : '✓ Reply sent to the student');
            adminLoadMentorshipRequests();
        } catch(e) {
            showToast(isAR ? 'خطأ في الإرسال، حاول مرة ثانية' : 'Failed to send, please try again', true);
        }
    };

    window.adminDeleteMentorshipRequest = async function(requestId) {
        const isAR = lang === 'AR';
        if (!confirm(isAR ? 'حذف هذا الطلب نهائياً؟' : 'Delete this request permanently?')) return;
        try {
            await window._deleteMentorshipRequest(requestId);
            showToast(isAR ? '🗑️ تم حذف الطلب' : '🗑️ Request deleted');
            const el = document.getElementById('request_' + requestId);
            if (el) { el.style.opacity='0'; el.style.transition='0.3s'; setTimeout(()=>el.remove(),300); }
        } catch(e) {
            showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
        }
    };

    /* ─── PLATFORM ON/OFF (حسابي ← التحكم في المنصة) ───
       الحالة في Firestore: settings/platformStatus { maintenance: true|false }.
       المشرف العام بس هو اللي بيشوف الكارت ده وبيقدر يغيّره. */
    window._platformState = { loaded: false, maintenance: false, testEmail: '', error: '', updatedBy: '', updatedAtMs: 0 };
    let _platformUnsub = null;

    function startPlatformWatch() {
        if (_platformUnsub || !window._watchPlatformStatus) return;
        _platformUnsub = window._watchPlatformStatus((data, err) => {
            if (err) {
                _platformUnsub = null; // الـ listener اتقفل بالخطأ — نسمح بإعادة المحاولة
                window._platformState = { loaded: false, maintenance: false, error: err.code || String(err), updatedBy: '', updatedAtMs: 0 };
            } else {
                window._platformState = {
                    loaded: true, error: '',
                    maintenance: data.maintenance === true,
                    testEmail: data.testEmail || '',
                    updatedBy: data.updatedBy || '',
                    updatedAtMs: (data.updatedAt && data.updatedAt.toMillis) ? data.updatedAt.toMillis() : 0
                };
            }
            renderPlatformControlUI();
        });
    }

    function renderPlatformControlUI() {
        const st = window._platformState;
        const isAR = typeof lang === 'undefined' || lang === 'AR';
        const off = st.loaded && st.maintenance;

        const pill = document.getElementById('platformOffPill');
        if (pill) {
            pill.classList.toggle('show', !!off && window._adminIsSuper === true);
            const pt = document.getElementById('platformOffPillText');
            if (pt) pt.textContent = isAR ? 'المنصة متوقفة عن الطلاب — اضغط للتشغيل' : 'Platform is stopped for students — click to turn on';
        }

        const sw = document.getElementById('platformSwitch');
        if (!sw) return; // كارت "حسابي" مش معروض دلوقتي
        const row = document.getElementById('platformRow');
        const text = document.getElementById('platformStateText');
        const sub = document.getElementById('platformStateSub');
        if (row) row.classList.toggle('is-off', !!off);
        const ti = document.getElementById('platformTestEmail');
        if (ti && document.activeElement !== ti) ti.value = st.testEmail || '';
        const tn = document.getElementById('platformTestNote');
        if (tn) tn.textContent = st.testEmail
            ? (isAR ? 'الإيميل التجريبي الحالي: ' : 'Current test email: ') + st.testEmail
            : (isAR ? 'مفيش إيميل تجريبي محدد.' : 'No test email set.');

        if (!st.loaded) {
            sw.disabled = true;
            if (text) text.textContent = st.error ? (isAR ? 'تعذّر قراءة حالة المنصة' : 'Could not read platform status') : (isAR ? 'جارٍ التحميل...' : 'Loading...');
            if (sub) sub.textContent = st.error ? (isAR ? 'راجع قواعد Firestore للمستند settings/platformStatus (' + st.error + ')' : 'Check Firestore rules for settings/platformStatus (' + st.error + ')') : '';
            return;
        }
        sw.disabled = false;
        sw.checked = !off;
        if (text) text.textContent = off ? (isAR ? 'المنصة متوقفة' : 'Platform is stopped') : (isAR ? 'المنصة تعمل' : 'Platform is running');
        if (sub) {
            let line = off
                ? (isAR ? 'الطلاب بيشوفوا دلوقتي صفحة "المنصة متوقفة مؤقتًا".' : 'Students currently see the "temporarily down" page.')
                : (isAR ? 'كل الطلاب يقدروا يستخدموا المنصة عادي.' : 'All students can use the platform normally.');
            if (st.updatedAtMs) {
                const when = new Date(st.updatedAtMs).toLocaleString(isAR ? 'ar-EG' : 'en-GB');
                line += (isAR ? '  آخر تغيير: ' : '  Last change: ') + (st.updatedBy ? st.updatedBy + ' — ' : '') + when;
            }
            sub.textContent = line;
        }
    }

    async function savePlatformTestEmail(clear) {
        const isAR = typeof lang === 'undefined' || lang === 'AR';
        if (!window._adminIsSuper) return;
        const inp = document.getElementById('platformTestEmail');
        const val = clear ? '' : (inp ? inp.value.trim() : '');
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showToast(isAR ? 'اكتب إيميل صحيح' : 'Enter a valid email', true); return; }
        try {
            await window._setPlatformTestEmail(val);
            if (clear && inp) inp.value = '';
            showToast(val ? (isAR ? 'تم حفظ الإيميل التجريبي ✓' : 'Test email saved ✓') : (isAR ? 'تم مسح الإيميل التجريبي' : 'Test email cleared'));
        } catch (e) {
            console.error('test email save failed:', e);
            showToast(isAR ? 'تعذّر الحفظ، جرّب تاني' : 'Could not save, try again', true);
        }
    }
    window.savePlatformTestEmail = savePlatformTestEmail;

    async function onPlatformSwitch(cb) {
        const isAR = typeof lang === 'undefined' || lang === 'AR';
        if (!window._adminIsSuper) { renderPlatformControlUI(); return; }
        const wantRunning = cb.checked;
        if (!wantRunning) {
            const te = (window._platformState && window._platformState.testEmail) || '';
            const ok = confirm(isAR
                ? 'هتوقف المنصة عن كل الطلاب دلوقتي، وهيشوفوا صفحة "المنصة متوقفة مؤقتًا".' + (te ? '\nالإيميل التجريبي (' + te + ') هيفضل شغال عادي. متأكد؟' : '\nمفيش إيميل تجريبي محدد — اكتبه الأول (تحت زر التشغيل) لو عايز تجرّب التعديلات. متأكد؟')
                : 'This will stop the platform for ALL students right now.' + (te ? '\nThe test email (' + te + ') will keep working. Continue?' : '\nNo test email is set. Continue?'));
            if (!ok) { cb.checked = true; return; }
        }
        cb.disabled = true;
        try {
            await window._setPlatformStatus(!wantRunning);
            showToast(wantRunning
                ? (isAR ? 'تم تشغيل المنصة ✓' : 'Platform is running again ✓')
                : (isAR ? 'تم إيقاف المنصة — الطلاب هيشوفوا صفحة الصيانة' : 'Platform stopped — students now see the maintenance page'));
        } catch (e) {
            console.error('platform toggle failed:', e);
            showToast(e && e.code === 'permission-denied'
                ? (isAR ? 'مفيش صلاحية كتابة على settings/platformStatus — راجع قواعد Firestore' : 'No write permission on settings/platformStatus — check Firestore rules')
                : (isAR ? 'حصلت مشكلة في تغيير حالة المنصة، جرّب تاني' : 'Could not change platform status, try again'), true);
        } finally {
            renderPlatformControlUI(); // بيرجّع الزرار لحالته الفعلية من Firestore
        }
    }

    function renderAccount(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';

        // ── ADMIN account view ──
        if (window._isAdmin && window._adminProfile) {
            const adm = window._adminProfile;
            const img = window._base64Img || '';
            const letter = adm.firstName[0].toUpperCase();
            const avatarInlineStyle = img
                ? `style="cursor:pointer;background-image:url('${img}');background-size:cover;background-position:center;"`
                : `style="cursor:pointer;"`;
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'حساب الإدارة' : 'Admin Account'}</h2>
                <p>${isAR ? 'بيانات حساب المشرف' : 'Your admin profile and settings'}</p>
            </div>
            <div class="account-grid">
                <div class="profile-card">
                    <div class="avatar-xl" id="avatarXl" ${avatarInlineStyle} onclick="document.getElementById('adminImgInput').click()">
                        ${!img ? `<span>${letter}</span>` : ''}
                        <div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>
                    </div>
                    <input type="file" id="adminImgInput" accept="image/*" style="display:none;" onchange="handleAdminImageUpload(event)">
                    <div class="profile-name">${adm.displayName}</div>
                    <div class="profile-email" style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                        <i class="fa-solid fa-shield-halved" style="color:var(--gold3);font-size:12px;"></i>
                        <span style="color:var(--gold3);font-weight:700;font-size:13px;">${window._adminIsSuper ? (isAR ? 'مشرف النظام' : 'System Admin') : (isAR ? 'عضو عادي' : 'Team Member')}</span>
                    </div>
                </div>
                <div class="form-card">
                    <h3>${isAR ? 'معلومات الحساب' : 'Account Info'}</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>${isAR ? 'الاسم الأول' : 'First Name'}</label>
                            <input type="text" value="${adm.firstName}" disabled style="opacity:0.7;">
                        </div>
                        <div class="form-group">
                            <label>${isAR ? 'الاسم الأخير' : 'Last Name'}</label>
                            <input type="text" value="${adm.lastName}" disabled style="opacity:0.7;">
                        </div>
                        <div class="form-group">
                            <label>${isAR ? 'اسم المستخدم' : 'Username'}</label>
                            <input type="text" value="${adm.username}" disabled style="opacity:0.7;">
                        </div>
                        <div class="form-group">
                            <label>${isAR ? 'الصلاحية' : 'Role'}</label>
                            <input type="text" value="${window._adminIsSuper ? (isAR ? 'مشرف النظام' : 'System Administrator') : (isAR ? 'عضو عادي' : 'Team Member')}" disabled style="opacity:0.7;color:var(--gold3);">
                        </div>
                        ${!window._adminIsSuper ? `
                        <div class="form-group">
                            <label>${isAR ? 'تابع لـ' : 'Belongs To'}</label>
                            <input type="text" value="${adm.org === 'terrascope' ? 'TerraScope' : 'GIS Explorer'}" disabled style="opacity:0.7;">
                        </div>` : ''}
                    </div>
                    <div style="margin-top:20px;padding:14px 16px;background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.2);border-radius:10px;font-size:13px;color:var(--muted);">
                        <i class="fa-solid fa-circle-info" style="color:var(--gold3);margin-left:6px;"></i>
                        ${isAR ? 'يمكنك تغيير صورتك بالضغط على الأفاتار أعلاه.' : 'You can update your profile photo by clicking the avatar above.'}
                    </div>
                </div>
            </div>
            ${window._adminIsSuper ? `
            <div class="form-card" id="platformControlCard" style="margin-top:24px;">
                <h3><i class="fa-solid fa-power-off" style="color:var(--gold3);margin-${isAR ? 'left' : 'right'}:8px;"></i>${isAR ? 'التحكم في المنصة' : 'Platform Control'}</h3>
                <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px;line-height:1.7;">${isAR
                    ? 'لو حصل أي عطل، أوقف المنصة عن الطلاب: هتظهر لهم صفحة "المنصة متوقفة مؤقتًا" وفيها لعبة تسلية لحد ما ترجع. لوحة الإدارة بتفضل شغالة عادي، وتقدر تشغّل المنصة تاني في أي وقت.'
                    : 'If something breaks, stop the platform for students: they will see a "temporarily down" page with a small game until you are back. This admin panel keeps working, and you can turn the platform back on any time.'}</p>
                <div class="pf-row" id="platformRow">
                    <div>
                        <div class="pf-state"><span class="pf-dot"></span><span id="platformStateText">${isAR ? 'جارٍ التحميل...' : 'Loading...'}</span></div>
                        <div class="pf-sub" id="platformStateSub"></div>
                    </div>
                    <label class="pf-switch" title="${isAR ? 'تشغيل / إيقاف المنصة' : 'Platform on / off'}">
                        <input type="checkbox" id="platformSwitch" onchange="onPlatformSwitch(this)" disabled>
                        <span class="pf-slider"></span>
                    </label>
                </div>
                <div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:14px;font-weight:700;margin-bottom:6px;">${isAR ? 'إيميل تجريبي (يشتغل والمنصة متوقفة)' : 'Test email (works while platform is stopped)'}</div>
                    <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:10px;">${isAR
                        ? 'وقت الإيقاف، الحساب ده بس هيعدّي من صفحة الصيانة ويشوف تعديلاتك، وباقي الطلاب يفضلوا شايفين صفحة الإيقاف. افتح رابط المنصة وزوّد في آخره ?tester=1 (مثال: index.html?tester=1) وسجّل الدخول بالإيميل ده.'
                        : 'While the platform is stopped, only this account can use it to preview your changes. Open index.html?tester=1 and sign in with this email.'}</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <input type="email" id="platformTestEmail" dir="ltr" placeholder="tester@example.com" style="flex:1;min-width:200px;">
                        <button type="button" class="btn" onclick="savePlatformTestEmail(false)">${isAR ? 'حفظ' : 'Save'}</button>
                        <button type="button" class="btn" onclick="savePlatformTestEmail(true)">${isAR ? 'مسح' : 'Clear'}</button>
                    </div>
                    <div id="platformTestNote" style="font-size:12px;color:var(--muted);margin-top:8px;"></div>
                </div>
            </div>` : ''}
            ${window._adminIsSuper ? `
            <div class="form-card" style="margin-top:24px;">
                <h3>${isAR ? 'إدارة فريق العمل' : 'Team Management'}</h3>
                <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px;">${isAR ? 'أنشئ حسابات لزملائك في الإدارة وحدد الأقسام المسموح لهم بالدخول إليها.' : 'Create accounts for your teammates and choose which admin sections they can access.'}</p>

                <div class="form-grid">
                    <div class="form-group">
                        <label>${isAR?'الاسم الأول':'First Name'}</label>
                        <input type="text" id="teamFirstName" placeholder="${isAR?'الاسم الأول':'First name'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'الاسم الأخير':'Last Name'}</label>
                        <input type="text" id="teamLastName" placeholder="${isAR?'الاسم الأخير':'Last name'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'البريد الإلكتروني':'Email'}</label>
                        <input type="email" id="teamEmail" placeholder="name@example.com">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'كلمة المرور':'Password'}</label>
                        <input type="text" id="teamPassword" placeholder="${isAR?'كلمة المرور':'Password'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'تابع لـ':'Belongs To'}</label>
                        <select id="teamOrg">
                            <option value="gis_explorer">GIS Explorer</option>
                            <option value="terrascope">TerraScope</option>
                        </select>
                    </div>
                </div>

                <div style="margin-top:14px;">
                    <label style="display:block;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">${isAR?'الأقسام المسموح بالدخول إليها':'Accessible Sections'}</label>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;">
                        ${ADMIN_PERMISSION_LIST.map(p => `
                        <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer;font-size:13px;">
                            <input type="checkbox" class="teamPermCheck" value="${p.key}">
                            <i class="fa-solid ${p.icon}" style="color:var(--gold3);width:16px;text-align:center;"></i>
                            ${isAR ? p.labelAR : p.labelEN}
                        </label>`).join('')}
                    </div>
                </div>

                <div class="btn-row" style="margin-top:16px;">
                    <button class="btn-save" id="teamCreateBtn" onclick="submitNewTeamMember()">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>${isAR?'إنشاء الحساب':'Create Account'}</span>
                    </button>
                </div>

                <div style="border-top:1px solid var(--border);margin-top:24px;padding-top:20px;">
                    <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">${isAR?'أعضاء الفريق الحاليين':'Current Team Members'}</h4>
                    <div id="teamMembersList" style="display:flex;flex-direction:column;gap:10px;">
                        <div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
                    </div>
                </div>
            </div>` : ''}`;
            if (window._adminIsSuper) { startPlatformWatch(); renderPlatformControlUI(); }
            if (window._adminIsSuper) setTimeout(() => adminLoadTeamAccounts(), 100);
            return;
        }

        const d = window._userData || {};
        const plan = d.plan || 'basic';
        const isPro = plan === 'pro';
        const letter = d.firstName ? d.firstName[0].toUpperCase() : 'U';
        const img = window._base64Img || '';
        const avatarStyle = img ? `style="background-image:url('${img}')"` : '';
        const levelOpts = ['Level 1','Level 2','Level 3','Level 4','Graduate'];
        const levelLabels = isAR
            ? ['المستوى 1','المستوى 2','المستوى 3','المستوى 4','خريج']
            : levelOpts;

        // Pro remaining-time display (live ticking countdown)
        let proRemainingHtml = '';
        if (isPro && d.proExpiresAt) {
            const rem = window._formatProRemaining(d.proExpiresAt, isAR);
            const expMs = d.proExpiresAt.toDate ? d.proExpiresAt.toDate().getTime() : new Date(d.proExpiresAt).getTime();
            if (rem) {
                if (rem.expired) {
                    proRemainingHtml = `<div style="margin-top:8px;font-size:12px;font-weight:700;color:#ff6b6b;display:flex;align-items:center;justify-content:center;gap:6px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        ${rem.text}
                    </div>`;
                } else {
                    proRemainingHtml = `<div style="margin-top:8px;font-size:12px;font-weight:700;color:var(--gold3);display:flex;align-items:center;justify-content:center;gap:6px;">
                        <i class="fa-solid fa-hourglass-half"></i>
                        <span>${isAR ? 'متبقي' : ''}</span>
                        <span id="proCountdownLive" data-expires-ms="${expMs}" data-uid="${window._currentUid || currentUid || ''}" style="font-family:'Space Mono',monospace;color:var(--gold4);">${rem.text}</span>
                        <span>${isAR ? 'على انتهاء الاشتراك' : 'left on your subscription'}</span>
                    </div>`;
                }
            }
        }

        // Subscription card HTML
        const subCard = `
        <div class="form-card" style="margin-top:0;">
            <h3 style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:12px;">
                <i class="fa-solid fa-crown" style="color:${isPro?'var(--gold3)':'var(--muted)'};"></i>
                ${isAR?'خطة الاشتراك':'Subscription Plan'}
            </h3>

            <div class="plan-cards-row">

                <!-- ─── Basic ─── -->
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
                        ${!isPro
                            ? `<div class="active-label al-basic"><i class="fa-solid fa-circle-check"></i> ${isAR?'خطتك الحالية':'Current plan'}</div>`
                            : ''}
                    </div>
                </div>

                <!-- ─── Pro ─── -->
                <div class="plan-card${isPro?' is-pro':''}">
                    ${!isPro
                        ? `<span class="plan-card-tag t-pro">⭐ PRO</span>`
                        : `<span class="plan-card-tag t-pro">${isAR?'خطتك':'Active'}</span>`}
                    <div class="plan-card-head">
                        <i class="fa-solid fa-crown" style="color:var(--gold3);"></i>
                        <span style="color:var(--gold3);">Pro</span>
                    </div>
                    <div class="plan-card-price">200 ${isAR?'ج':'EGP'}</div>
                    <div class="plan-card-period">${isAR?'/ سنة':'/ year'}</div>
                    <ul class="plan-card-feats">
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'كل مميزات Basic':'All Basic features'}</li>
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'CV يتخطى ATS':'ATS-friendly CV'}</li>
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'تحميل غير محدود':'Unlimited downloads'}</li>
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'أولوية في الرد':'Priority support'}</li>
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'خرائط الطلبة المميزين':'Premium Student Maps'}</li>
                        <li><i class="fa-solid fa-check" style="color:var(--gold3);"></i>${isAR?'جلسة Mentorship مع خبير':'Expert Mentorship Session'}</li>
                    </ul>
                    <div class="plan-card-foot">
                        ${!isPro
                            ? `<button onclick="requestUpgrade()" id="upgradeBtn"><i class="fa-solid fa-arrow-up"></i> ${isAR?'ترقية إلى Pro':'Upgrade to Pro'}</button>`
                            : `<div class="active-label al-pro"><i class="fa-solid fa-crown"></i> ${isAR?'أنت عضو Pro!':'You are Pro!'}</div>
                               ${proRemainingHtml}`}
                    </div>
                </div>

            </div>
        </div>`;

        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'الملف الشخصي':'My Profile'}</h2>
            <p>${isAR?'إدارة بياناتك ومعلومات الحساب':'Manage your personal info and account settings'}</p>
        </div>
        ${subCard}
        <div class="account-grid" style="margin-top:24px;">
            <div class="profile-card">
                <div class="avatar-xl" id="avatarXl" ${avatarStyle} onclick="document.getElementById('imageInput').click()">
                    ${!img ? `<span>${letter}</span>` : ''}
                    <div class="avatar-xl-overlay"><i class="fa-solid fa-camera"></i></div>
                </div>
                <div class="profile-name" id="profileDisplayName">${(d.firstName||'')+' '+(d.lastName||'')}</div>
                <div class="profile-email">${d.email||''}</div>
            </div>
            <div class="form-card">
                <h3>${isAR?'تعديل البيانات':'Edit Profile'}</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>${isAR?'الاسم الأول':'First Name'}</label>
                        <input type="text" id="pFirstName" value="${d.firstName||''}" placeholder="${isAR?'الاسم الأول':'First name'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'الاسم الأخير':'Last Name'}</label>
                        <input type="text" id="pLastName" value="${d.lastName||''}" placeholder="${isAR?'الاسم الأخير':'Last name'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'رقم الهاتف':'Phone'}</label>
                        <input type="tel" id="pPhone" value="${d.phone||''}" placeholder="+201xxxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'البريد الإلكتروني':'Email'}</label>
                        <input type="email" id="pEmail" value="${d.email||''}" disabled>
                    </div>
                    <div class="form-group">
                        <label>${isAR?'المسمى الوظيفي':'Job Title'}</label>
                        <input type="text" id="pJob" value="${d.job||''}" placeholder="${isAR?'مثال: طالب':'e.g. Student'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'الجامعة / الجهة':'University / Company'}</label>
                        <input type="text" id="pCompany" value="${d.company||''}" placeholder="${isAR?'اسم الجامعة':'University or Company'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'المستوى الأكاديمي':'Academic Level'}</label>
                        <select id="pLevel">
                            ${levelOpts.map((v,i)=>`<option value="${v}" ${(d.academicLevel||'')=== v?'selected':''}>${levelLabels[i]}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${isAR?'النبذة الشخصية':'Profile Bio'}</label>
                        <textarea id="pBio" placeholder="${isAR?'نبذة عن خبراتك في GIS...':'Tell us about your GIS expertise...'}">${d.bio||''}</textarea>
                    </div>
                </div>

                <div class="btn-row" style="margin-top:24px;">
                    <button class="btn-save" id="saveProfileBtn" onclick="saveProfile()">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>${isAR?'حفظ التغييرات':'Save Changes'}</span>
                    </button>
                    <button class="btn-danger" onclick="deleteAccount()">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>${isAR?'حذف الحساب':'Delete Account'}</span>
                    </button>
                </div>

                <!-- Change Password Section -->
                <div style="border-top:1px solid var(--border);margin-top:24px;padding-top:24px;">
                    <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-lock" style="color:var(--g3);"></i>
                        ${isAR?'تغيير كلمة المرور':'Change Password'}
                    </h4>
                    <div class="form-grid">
                        <div class="form-group" style="grid-column:1/-1;">
                            <label>${isAR?'كلمة المرور الحالية':'Current Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pCurrentPass" placeholder="${isAR?'أدخل كلمة المرور الحالية':'Enter current password'}" style="padding-right:42px;width:100%;">
                                <button type="button" onclick="toggleEyeField('pCurrentPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${isAR?'كلمة المرور الجديدة':'New Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pNewPass" placeholder="${isAR?'كلمة المرور الجديدة':'New password'}" style="padding-right:42px;width:100%;" oninput="checkAccountPassStrength()">
                                <button type="button" onclick="toggleEyeField('pNewPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                            <div class="pass-strength-bar" style="margin-top:6px;"><div class="pass-strength-fill" id="acctPassFill"></div></div>
                            <div class="pass-strength-label" id="acctPassLabel"></div>
                        </div>
                        <div class="form-group">
                            <label>${isAR?'تأكيد كلمة المرور الجديدة':'Confirm New Password'}</label>
                            <div style="position:relative;">
                                <input type="password" id="pConfirmPass" placeholder="${isAR?'أعد كتابة كلمة المرور الجديدة':'Confirm new password'}" style="padding-right:42px;width:100%;">
                                <button type="button" onclick="toggleEyeField('pConfirmPass',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;transition:color 0.2s;"><i class="fa-regular fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                    <button class="btn-save" style="margin-top:12px;width:auto;padding:10px 24px;" onclick="changePassword()">
                        <i class="fa-solid fa-key"></i>
                        <span>${isAR?'تغيير كلمة المرور':'Change Password'}</span>
                    </button>
                </div>
            </div>
        </div>`;
        if (typeof window._startProCountdown === 'function') window._startProCountdown();
    }

    /* ─── ADMIN: TEAM MANAGEMENT (sub-admin accounts + permissions) ─── */
    window.submitNewTeamMember = async function() {
        const isAR = lang === 'AR';
        const firstName = document.getElementById('teamFirstName').value.trim();
        const lastName  = document.getElementById('teamLastName').value.trim();
        const email     = document.getElementById('teamEmail').value.trim();
        const password  = document.getElementById('teamPassword').value.trim();
        const org       = document.getElementById('teamOrg').value;
        const permissions = Array.from(document.querySelectorAll('.teamPermCheck:checked')).map(c => c.value);

        if (!firstName || !lastName || !email || !password) {
            showToast(isAR ? 'من فضلك أكمل جميع الحقول' : 'Please fill in all fields', true);
            return;
        }
        if (password.length < 6) {
            showToast(isAR ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password too short (min 6 chars)', true);
            return;
        }

        const btn = document.getElementById('teamCreateBtn');
        if (btn) btn.disabled = true;
        try {
            // Firebase Auth بيرفض تلقائيًا أي إيميل مسجل قبل كده
            await window._createTeamAccount({
                firstName, lastName, email, password,
                displayName: firstName + ' ' + lastName,
                permissions,
                org,
            });
            showToast(isAR ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
            ['teamFirstName','teamLastName','teamEmail','teamPassword'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            document.getElementById('teamOrg').value = 'gis_explorer';
            document.querySelectorAll('.teamPermCheck').forEach(c => c.checked = false);
            adminLoadTeamAccounts();
        } catch(e) {
            const msg = (e.code === 'auth/email-already-in-use')
                ? (isAR ? 'الإيميل ده مستخدم بالفعل' : 'Email already in use')
                : (e.code === 'auth/invalid-email')
                ? (isAR ? 'صيغة الإيميل غير صحيحة' : 'Invalid email format')
                : (isAR ? 'حدث خطأ أثناء إنشاء الحساب' : 'Error creating account');
            showToast(msg, true);
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
                const isSelf = a.id === (window._auth?.currentUser && window._auth.currentUser.uid);
                const isSuper = a.permissions === 'all' || a.role === 'superadmin';
                return `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;flex-wrap:wrap;">
                    <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;color:#0a0a0e;font-weight:800;flex-shrink:0;">${(a.firstName||'?')[0].toUpperCase()}</div>
                    <div style="flex:1;min-width:150px;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <div style="font-weight:700;font-size:14px;">${a.displayName || ((a.firstName||'')+' '+(a.lastName||''))}</div>
                            <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.3);color:var(--gold3);">${orgLabel}</span>
                            ${isSuper ? `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(46,204,113,0.12);border:1px solid rgba(46,204,113,0.3);color:#2ecc71;">${isAR?'مشرف كامل':'Super Admin'}</span>` : ''}
                            ${isSelf ? `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.08);color:var(--muted);">${isAR?'أنت':'You'}</span>` : ''}
                        </div>
                        <div style="font-size:12px;color:var(--muted);">${a.email || a.username || ''}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:4px;">${isSuper ? (isAR?'كل الصلاحيات':'All sections') : (permLabels.length ? permLabels.join(' · ') : (isAR?'بدون صلاحيات':'No permissions'))}</div>
                    </div>
                    ${isSelf ? '' : `
                    <button onclick="deleteTeamMember('${a.id}')" style="padding:7px 12px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;color:#e74c3c;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                        <i class="fa-solid fa-trash-can"></i> ${isAR?'حذف':'Delete'}
                    </button>`}
                </div>`;
            }).join('');
        } catch(e) {
            list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${isAR?'تعذر تحميل الأعضاء':'Failed to load team members'}</div>`;
        }
    }

    window.deleteTeamMember = async function(id) {
        const isAR = lang === 'AR';
        const warnMsg = isAR
            ? 'هيتشال من لوحة الأدمن فورًا. حساب الدخول بتاعه هيفضل موجود على Firebase لكن من غير أي صلاحية أدمن. متأكد؟'
            : 'They will lose admin access immediately. Their login account itself stays on Firebase but with no admin rights. Continue?';
        if (!window.confirm(warnMsg)) return;
        try {
            await window._deleteTeamAccount(id);
            showToast(isAR ? 'تم حذف صلاحية الأدمن' : 'Admin access removed');
            adminLoadTeamAccounts();
        } catch(e) {
            showToast(isAR ? 'حدث خطأ أثناء الحذف' : 'Error deleting account', true);
        }
    };

    window.requestUpgrade = async function() {
        const isAR = lang === 'AR';
        const btn = document.getElementById('upgradeBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            await window._sendUpgradeRequest();
            showToast(isAR ? '✓ تم إرسال طلب الترقية! سيتواصل معك الفريق عبر واتساب' : '✓ Upgrade request sent! Team will contact you via WhatsApp');
            if (btn) { btn.innerHTML = `<i class="fa-solid fa-clock"></i> ${isAR?'في انتظار التفعيل':'Pending activation'}`; }
        } catch(e) {
            showToast(isAR ? 'خطأ في إرسال الطلب' : 'Failed to send request', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${isAR?'ترقية إلى Pro':'Upgrade to Pro'}`; }
        }
    };

    window.adminLoadMembers = async function() {
        const isAR = lang === 'AR';
        const reqList = document.getElementById('upgradeRequestsList');
        const memList = document.getElementById('membersList');
        const memBadge = document.getElementById('memberCountBadge');
        const reqBadge = document.getElementById('upgradeReqBadge');
        if (!reqList && !memList) return;
        if (reqList) reqList.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        if (memList) memList.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

        try {
            const [users, reqs] = await Promise.all([
                window._loadAllUsers(),
                window._loadUpgradeRequests()
            ]);

            // ── Auto-expire any Pro members whose subscription has ended ──
            const now = new Date();
            users.forEach(u => {
                if ((u.plan || 'basic') === 'pro' && u.proExpiresAt) {
                    const expDate = u.proExpiresAt.toDate ? u.proExpiresAt.toDate() : new Date(u.proExpiresAt);
                    if (expDate - now <= 0) {
                        u.plan = 'basic';
                        u.proExpiresAt = null;
                        u.proStartAt = null;
                        if (typeof window._checkAndExpirePro === 'function') window._checkAndExpirePro(u.uid, { plan: 'pro', proExpiresAt: expDate });
                    }
                }
            });

            // ── Subscription Requests (tabs + full detail cards) ──
            if (reqList) {
            const filter = window._subReqFilter || 'pending';
            const counts = {
                pending: reqs.filter(r => r.status === 'pending').length,
                approved: reqs.filter(r => r.status === 'approved').length,
                rejected: reqs.filter(r => r.status === 'rejected').length,
                all: reqs.length
            };
            if (reqBadge) { reqBadge.textContent = counts.pending; reqBadge.style.display = counts.pending ? 'inline-flex' : 'none'; }

            const tabsEl = document.getElementById('subReqTabs');
            if (tabsEl) {
                const tabDefs = [
                    { key: 'pending',  labelAR: '⏳ قيد المراجعة', labelEN: '⏳ Pending' },
                    { key: 'approved', labelAR: '✅ مقبول',        labelEN: '✅ Approved' },
                    { key: 'rejected', labelAR: '❌ مرفوض',        labelEN: '❌ Rejected' },
                    { key: 'all',      labelAR: 'الكل',            labelEN: 'All' }
                ];
                tabsEl.innerHTML = tabDefs.map(t => {
                    const active = filter === t.key;
                    return `<button onclick="adminSetSubReqFilter('${t.key}')" style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;border:1px solid ${active?'var(--gold3)':'var(--border)'};background:${active?'rgba(212,160,23,0.15)':'transparent'};color:${active?'var(--gold3)':'var(--muted)'};">
                        ${isAR ? t.labelAR : t.labelEN}
                        <span style="background:${active?'var(--gold3)':'rgba(255,255,255,0.08)'};color:${active?'#000':'var(--muted)'};font-size:11px;font-weight:700;padding:1px 6px;border-radius:99px;">${counts[t.key]}</span>
                    </button>`;
                }).join('');
            }

            const filteredReqs = (filter === 'all') ? reqs : reqs.filter(r => (r.status || 'pending') === filter);
            // newest first
            filteredReqs.sort((a, b) => {
                const ta = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
                const tb = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
                return tb - ta;
            });

            if (!filteredReqs.length) {
                reqList.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-inbox" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات في هذا القسم':'No requests in this section'}</div>`;
            } else {
                const methodLabel = (m) => m === 'instapay' ? 'InstaPay' : (m === 'vodafone' ? 'Vodafone Cash' : (m || (isAR?'غير محدد':'Not specified')));
                const statusBadge = (status) => {
                    if (status === 'approved') return `<span style="background:rgba(var(--brand2-rgb,39,163,70),0.15);color:var(--green4);font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;">✅ ${isAR?'مقبول':'Approved'}</span>`;
                    if (status === 'rejected') return `<span style="background:rgba(220,50,50,0.15);color:#ff6b6b;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;">❌ ${isAR?'مرفوض':'Rejected'}</span>`;
                    return `<span style="background:rgba(212,160,23,0.15);color:var(--gold3);font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;">⏳ ${isAR?'قيد المراجعة':'Pending'}</span>`;
                };
                reqList.innerHTML = filteredReqs.map(r => {
                    const status = r.status || 'pending';
                    const timeStr = r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                    const reviewedStr = r.reviewedAt?.toDate ? r.reviewedAt.toDate().toLocaleString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                    const shotHtml = r.screenshot
                        ? `<img src="${r.screenshot}" onclick="window.open(this.src,'_blank')" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:zoom-in;flex-shrink:0;" title="${isAR?'اضغط للتكبير':'Click to enlarge'}">`
                        : `<div style="width:64px;height:64px;border-radius:8px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:18px;flex-shrink:0;"><i class="fa-regular fa-image"></i></div>`;
                    return `<div id="req_${r.id}" style="padding:14px;background:rgba(212,160,23,0.04);border:1px solid rgba(212,160,23,0.18);border-radius:14px;transition:0.2s;">
                        <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                            ${shotHtml}
                            <div style="flex:1;min-width:180px;">
                                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
                                    <span style="font-size:13.5px;font-weight:700;">${r.firstName||''} ${r.lastName||''}</span>
                                    ${statusBadge(status)}
                                </div>
                                <div style="font-size:11px;color:var(--muted);">
                                    ${r.email||''}${r.username ? ' · @'+r.username : ''}
                                </div>
                                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;font-size:11px;color:var(--muted);">
                                    <span><i class="fa-solid fa-credit-card" style="margin-left:3px;color:var(--gold3);"></i>${methodLabel(r.paymentMethod)}</span>
                                    ${r.months ? `<span><i class="fa-solid fa-calendar-days" style="margin-left:3px;color:var(--gold3);"></i>${r.months}${isAR?' شهر':' mo'}</span>` : ''}
                                    ${r.amount ? `<span><i class="fa-solid fa-money-bill" style="margin-left:3px;color:var(--gold3);"></i>${r.amount} ${isAR?'ج':'EGP'}</span>` : ''}
                                    ${r.paymentDate ? `<span><i class="fa-regular fa-calendar" style="margin-left:3px;"></i>${r.paymentDate}</span>` : ''}
                                </div>
                                ${r.discountCode ? `<div style="font-size:11px;color:var(--gold3);margin-top:4px;"><i class="fa-solid fa-ticket" style="margin-left:3px;"></i>${isAR?`كود خصم مُطبّق: `:`Discount code applied: `}<strong style="direction:ltr;display:inline-block;">${escapeHtmlAC(r.discountCode)}</strong> (${r.discountPercent}%)</div>` : ''}
                                <div style="font-size:11px;color:var(--muted);margin-top:4px;"><i class="fa-regular fa-clock" style="margin-left:3px;"></i>${isAR?'أُرسل':'Sent'}: ${timeStr}</div>
                                ${reviewedStr ? `<div style="font-size:11px;color:var(--muted);margin-top:1px;"><i class="fa-solid fa-check-double" style="margin-left:3px;"></i>${isAR?'روجع':'Reviewed'}: ${reviewedStr}${r.approvedMonths ? ' · '+r.approvedMonths+(isAR?' شهر':' mo') : ''}</div>` : ''}
                                ${r.rejectionReason ? `<div style="font-size:11px;color:#ff6b6b;margin-top:6px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.2);border-radius:8px;padding:6px 10px;">${isAR?'سبب الرفض':'Rejection reason'}: ${r.rejectionReason}</div>` : ''}
                            </div>
                            ${status === 'pending' ? `
                            <div style="display:flex;gap:6px;flex-shrink:0;align-items:flex-start;">
                                <button onclick="adminToggleApprovePanel('${r.id}')" style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:rgba(var(--brand2-rgb,39,163,70),0.12);border:1px solid rgba(var(--brand2-rgb,39,163,70),0.3);border-radius:8px;color:var(--green4);font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;" title="${isAR?'قبول':'Approve'}">
                                    <i class="fa-solid fa-check"></i> ${isAR?'قبول':'Approve'}
                                </button>
                                <button onclick="adminToggleRejectPanel('${r.id}')" style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:rgba(220,50,50,0.1);border:1px solid rgba(220,50,50,0.3);border-radius:8px;color:#ff6b6b;font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;" title="${isAR?'رفض':'Reject'}">
                                    <i class="fa-solid fa-xmark"></i> ${isAR?'رفض':'Reject'}
                                </button>
                            </div>` : ''}
                        </div>
                        <div id="approvePanel_${r.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(212,160,23,0.15);align-items:center;gap:10px;flex-wrap:wrap;">
                            <label style="font-size:12px;color:var(--muted);">${isAR?'باقة الاشتراك':'Subscription package'}</label>
                            <select id="approveMonths_${r.id}" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-family:'Tajawal',sans-serif;font-size:12px;">
                                <option value="1" ${(r.months||1)===1?'selected':''}>${isAR?'شهر واحد — 50 ج':'1 month — 50 EGP'}</option>
                                <option value="3" ${r.months===3?'selected':''}>${isAR?'3 أشهر — 150 ج':'3 months — 150 EGP'}</option>
                                <option value="6" ${r.months===6?'selected':''}>${isAR?'6 أشهر — 200 ج':'6 months — 200 EGP'}</option>
                            </select>
                            <button onclick="adminActivatePro('${r.uid}','${r.id}')" style="padding:7px 16px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#000;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                                <i class="fa-solid fa-crown"></i> ${isAR?'تأكيد التفعيل':'Confirm activation'}
                            </button>
                        </div>
                        <div id="rejectPanel_${r.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(220,50,50,0.15);flex-direction:column;gap:8px;">
                            <label style="font-size:12px;color:var(--muted);">${isAR?'سبب الرفض (سيصل للطالب)':'Rejection reason (sent to the student)'}</label>
                            <textarea id="rejectReason_${r.id}" rows="2" placeholder="${isAR?'مثال: صورة إثبات الدفع غير واضحة':'e.g. Payment proof image is unclear'}" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-family:'Tajawal',sans-serif;font-size:12.5px;resize:vertical;"></textarea>
                            <button onclick="adminRejectRequest('${r.uid}','${r.id}')" style="align-self:flex-start;padding:7px 16px;background:rgba(220,50,50,0.85);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                                <i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الرفض':'Send rejection'}
                            </button>
                        </div>
                    </div>`;
                }).join('');
            }
            }

            // ── Members Row List with inline toggle ──
            if (memList) {
            // Store users data globally for the modal (always the FULL unfiltered list)
            window._adminUsersCache = users;

            // Apply plan filter + search + optional alphabetical sort just for display
            let visibleUsers = users.slice();
            const memberFilter = window._memberFilter || 'all';
            if (memberFilter === 'basic') visibleUsers = visibleUsers.filter(u => (u.plan || 'basic') !== 'pro');
            else if (memberFilter === 'pro') visibleUsers = visibleUsers.filter(u => (u.plan || 'basic') === 'pro');
            const searchTerm = (window._memberSearch || '').trim().toLowerCase();
            if (searchTerm) {
                visibleUsers = visibleUsers.filter(u => {
                    const fullName = ((u.firstName||'') + ' ' + (u.lastName||'')).trim().toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    const phone = (u.phone || '').replace(/\s|-/g, '');
                    const searchPhone = searchTerm.replace(/\s|-/g, '');
                    return fullName.includes(searchTerm) || email.includes(searchTerm) || (searchPhone && phone.includes(searchPhone));
                });
            }
            {
                const mode = window._memberSort || 'newest';
                const nameOf = (u) => ((u.firstName||'') + ' ' + (u.lastName||'')).trim();
                if (mode === 'az') {
                    visibleUsers.sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ar'));
                } else {
                    const dir = mode === 'oldest' ? 1 : -1;
                    visibleUsers.sort((a, b) => {
                        const ta = window._joinedMs(a), tb = window._joinedMs(b);
                        if (!ta && !tb) return nameOf(a).localeCompare(nameOf(b), 'ar');
                        if (!ta) return 1;   // الأعضاء القدام اللي ملهمش تاريخ في الآخر دايماً
                        if (!tb) return -1;
                        return (ta - tb) * dir;
                    });
                }
            }

            if (memBadge) memBadge.textContent = visibleUsers.length;
            if (!visibleUsers.length) {
                memList.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${searchTerm ? (isAR?'لا يوجد أعضاء يطابقون البحث':'No members match your search') : (isAR?'لا يوجد أعضاء يطابقون الفلتر':'No members match this filter')}</div>`;
            } else {
                memList.innerHTML = `
                <!-- Plan Picker Modal (choose subscription package when manually setting a member to Pro) -->
                <div id="planPickerModal" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)closePlanPickerModal()">
                    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:18px;max-width:380px;width:100%;box-shadow:0 12px 60px rgba(0,0,0,0.6);padding:20px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                            <h3 style="font-size:15px;margin:0;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-crown" style="color:var(--gold3);"></i> ${isAR?'اختر باقة الاشتراك':'Choose subscription package'}</h3>
                            <button onclick="closePlanPickerModal()" style="width:28px;height:28px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:50%;color:var(--muted);cursor:pointer;">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div id="planPickerOptions" style="display:flex;flex-direction:column;gap:10px;"></div>
                    </div>
                </div>
                <!-- Member Detail Modal -->
                <div id="memberDetailModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);align-items:flex-end;justify-content:center;padding:0;" onclick="if(event.target===this)closeMemberModal()">
                    <div id="memberDetailBox" style="background:var(--bg2);border:1px solid var(--border2);border-radius:20px 20px 0 0;max-width:480px;width:100%;position:relative;box-shadow:0 -12px 60px rgba(0,0,0,0.6);animation:slideUp 0.28s cubic-bezier(0.4,0,0.2,1) both;display:flex;flex-direction:column;max-height:92vh;">
                        <!-- Sticky handle + close -->
                        <div style="flex-shrink:0;padding:12px 20px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:12px;">
                            <div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto;position:absolute;left:50%;transform:translateX(-50%);top:10px;"></div>
                            <div style="width:32px;"></div>
                            <div id="memberDetailTitle" style="font-size:14px;font-weight:700;color:var(--text);"></div>
                            <button onclick="closeMemberModal()" style="width:32px;height:32px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:50%;color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.14)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <!-- Scrollable body -->
                        <div id="memberDetailContent" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 20px 24px;"></div>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${visibleUsers.map(u => {
                        const isPro = (u.plan || 'basic') === 'pro';
                        const fullName = ((u.firstName||'') + ' ' + (u.lastName||'')).trim() || 'User';
                        const letter = fullName[0].toUpperCase();
                        const hasImg = !!(u.profileImg);
                        const avatarBg = hasImg ? `background-image:url('${u.profileImg}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,var(--g2),var(--g4));`;
                        const isSuspended = !!(u.suspended);
                        const proRem = (isPro && u.proExpiresAt) ? window._formatProRemaining(u.proExpiresAt, isAR) : null;
                        const proRemRowHtml = proRem ? `<div style="font-size:11px;font-weight:700;color:${proRem.expired?'#ff6b6b':'var(--gold3)'};margin-top:2px;display:flex;align-items:center;gap:4px;">
                            <i class="fa-solid ${proRem.expired?'fa-triangle-exclamation':'fa-hourglass-half'}"></i>
                            ${proRem.expired ? proRem.text : (isAR?`متبقي ${proRem.text}`:`${proRem.text} left`)}
                        </div>` : '';
                        return `<div id="memrow_${u.uid}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:${isSuspended?'rgba(220,50,50,0.05)':'rgba(255,255,255,0.02)'};border:1px solid ${isSuspended?'rgba(220,50,50,0.2)':'var(--border)'};border-radius:12px;transition:0.2s;" onmouseover="this.style.background='${isSuspended?'rgba(220,50,50,0.1)':'rgba(var(--brand-rgb,30,122,52),0.06)'}'" onmouseout="this.style.background='${isSuspended?'rgba(220,50,50,0.05)':'rgba(255,255,255,0.02)'}'">
                            <div onclick="showMemberDetail('${u.uid}')" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;border:2px solid ${isSuspended?'rgba(220,50,50,0.5)':isPro?'var(--gold3)':'rgba(var(--brand-rgb,30,122,52),0.4)'};${avatarBg}cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;${isSuspended?'filter:grayscale(60%);opacity:0.7;':''}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${hasImg?'':letter}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    ${fullName}
                                    ${isSuspended?`<span style="background:rgba(220,50,50,0.18);color:#ff6b6b;font-size:9px;font-weight:700;padding:1px 6px;border-radius:99px;"><i class="fa-solid fa-ban" style="font-size:8px;"></i> ${isAR?'موقوف':'Suspended'}</span>`:isPro?`<span style="background:var(--gold3);color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:99px;"><i class="fa-solid fa-crown" style="font-size:8px;"></i> PRO</span>`:`<span style="background:rgba(var(--brand-rgb,30,122,52),0.2);color:var(--green4);font-size:9px;font-weight:700;padding:1px 6px;border-radius:99px;">BASIC</span>`}
                                </div>
                                <div style="font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.email||'—'}</div>
                                <div style="font-size:10.5px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:4px;opacity:.85;"><i class="fa-regular fa-calendar" style="font-size:11px;"></i> ${isAR?'انضم:':'Joined:'} ${window._joinedMs(u) ? new Date(window._joinedMs(u)).toLocaleDateString(isAR?'ar-EG':'en-GB',{day:'numeric',month:'short',year:'numeric'}) : (isAR?'غير محدد':'Unknown')}</div>
                                ${proRemRowHtml}
                            </div>
                            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;text-align:center;padding:5px 10px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:8px;" title="${isAR?'رصيد العملات':'Coin balance'}">
                                <i class="fa-solid fa-coins" style="color:var(--gold3);font-size:11px;"></i>
                                <span style="font-size:12.5px;font-weight:800;color:var(--gold3);">${u.coins||0}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
                                <button onclick="${isPro ? `adminSetPlan('${u.uid}','basic')` : `openPlanPickerModal('${u.uid}')`}" style="display:flex;align-items:center;gap:4px;padding:6px 11px;background:${isPro?'rgba(220,50,50,0.08)':'rgba(212,160,23,0.1)'};border:1px solid ${isPro?'rgba(220,50,50,0.25)':'rgba(212,160,23,0.3)'};border-radius:8px;color:${isPro?'#ff6b6b':'var(--gold3)'};font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" title="${isPro?(isAR?'تحويل Basic':'Set Basic'):(isAR?'ترقية Pro':'Set Pro')}">
                                    <i class="fa-solid ${isPro?'fa-arrow-down':'fa-crown'}"></i>
                                    <span class="row-btn-label">${isPro?(isAR?'Basic':'Basic'):(isAR?'Pro':'Pro')}</span>
                                </button>
                                <button onclick="adminToggleSuspend('${u.uid}',${isSuspended})" style="display:flex;align-items:center;gap:4px;padding:6px 11px;background:${isSuspended?'rgba(39,163,70,0.1)':'rgba(255,165,0,0.08)'};border:1px solid ${isSuspended?'rgba(39,163,70,0.3)':'rgba(255,165,0,0.3)'};border-radius:8px;color:${isSuspended?'var(--green4)':'#ffaa00'};font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" title="${isSuspended?(isAR?'رفع الإيقاف':'Unsuspend'):(isAR?'إيقاف مؤقت':'Suspend')}">
                                    <i class="fa-solid ${isSuspended?'fa-circle-check':'fa-ban'}"></i>
                                    <span class="row-btn-label">${isSuspended?(isAR?'رفع الإيقاف':'Enable'):(isAR?'إيقاف':'Suspend')}</span>
                                </button>
                                <button onclick="openAdminAlert('${u.uid}','${fullName.replace(/'/g,"&#39;")}')" style="display:flex;align-items:center;gap:4px;padding:6px 11px;background:rgba(100,149,237,0.08);border:1px solid rgba(100,149,237,0.25);border-radius:8px;color:#6495ed;font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" title="${isAR?'مراسلة':'Message'}">
                                    <i class="fa-solid fa-paper-plane"></i>
                                    <span class="row-btn-label">${isAR?'رسالة':'Msg'}</span>
                                </button>
                                <button onclick="adminDeleteMember('${u.uid}','${fullName.replace(/'/g,"&#39;")}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.22);border-radius:8px;color:#ff6b6b;font-size:13px;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(220,50,50,0.22)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'" title="${isAR?'حذف نهائي':'Delete permanently'}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;

                // Inject modal functions
                window.showMemberDetail = function(uid) {
                    const isAR = lang === 'AR';
                    const u = (window._adminUsersCache || []).find(x => x.uid === uid);
                    if (!u) return;
                    const isPro = (u.plan || 'basic') === 'pro';
                    const fullName = ((u.firstName||'') + ' ' + (u.lastName||'')).trim() || 'User';
                    const letter = fullName[0].toUpperCase();
                    const hasImg = !!(u.profileImg);
                    const avatarBg = hasImg ? `background-image:url('${u.profileImg}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,var(--g2),var(--g4));`;
                    const joinDate = u.joinedAt?.toDate ? u.joinedAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'long',year:'numeric'}) : (isAR?'غير محدد':'Unknown');
                    let proExpiryVal = '';
                    if (isPro && u.proExpiresAt) {
                        const rem = window._formatProRemaining(u.proExpiresAt, isAR);
                        const expDateStr = u.proExpiresAt.toDate ? u.proExpiresAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'long',year:'numeric'}) : '';
                        if (rem) proExpiryVal = rem.expired ? rem.text : `${expDateStr} (${isAR?'متبقي':''} ${rem.text}${isAR?'':' left'})`;
                    }
                    const row = (icon, label, val) => val ? `
                        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;">
                            <i class="fa-solid ${icon}" style="color:var(--muted);width:16px;text-align:center;font-size:13px;flex-shrink:0;"></i>
                            <div>
                                <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${label}</div>
                                <div style="font-size:13px;color:var(--text);font-weight:500;margin-top:1px;">${val}</div>
                            </div>
                        </div>` : '';

                    // Set sticky header title
                    const titleEl = document.getElementById('memberDetailTitle');
                    if (titleEl) titleEl.textContent = fullName;

                    document.getElementById('memberDetailContent').innerHTML = `
                        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px;margin-top:4px;">
                            <div style="width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:26px;color:#fff;border:3px solid ${u.suspended?'rgba(220,50,50,0.6)':isPro?'var(--gold3)':'rgba(var(--brand-rgb,30,122,52),0.5)'};${avatarBg}margin-bottom:12px;${u.suspended?'filter:grayscale(50%);':''}">${hasImg?'':letter}</div>
                            <div style="font-size:17px;font-weight:700;color:var(--text);">${fullName}</div>
                            <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
                                ${u.suspended
                                    ? `<span style="background:rgba(220,50,50,0.18);color:#ff6b6b;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;"><i class="fa-solid fa-ban" style="font-size:11px;margin-left:3px;"></i> ${isAR?'موقوف مؤقتاً':'Suspended'}</span>`
                                    : isPro
                                    ? `<span style="background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#000;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;"><i class="fa-solid fa-crown" style="font-size:11px;margin-left:3px;"></i> Pro</span>`
                                    : `<span style="background:rgba(var(--brand-rgb,30,122,52),0.2);color:var(--green4);font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;"><i class="fa-solid fa-bolt" style="font-size:11px;margin-left:3px;"></i> Basic</span>`
                                }
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
                            ${row('fa-coins', isAR?'رصيد العملات':'Coin balance', `${u.coins||0}`)}
                            ${row('fa-envelope', isAR?'البريد الإلكتروني':'Email', u.email)}
                            ${row('fa-phone', isAR?'الهاتف':'Phone', u.phone)}
                            ${row('fa-briefcase', isAR?'المسمى الوظيفي':'Job Title', u.job)}
                            ${row('fa-building', isAR?'الجامعة / الجهة':'University / Company', u.company)}
                            ${row('fa-graduation-cap', isAR?'المستوى الأكاديمي':'Academic Level', u.academicLevel)}
                            ${row('fa-calendar', isAR?'تاريخ الانضمام':'Joined', joinDate)}
                            ${proExpiryVal ? row('fa-hourglass-half', isAR?'انتهاء اشتراك Pro':'Pro Expiry', proExpiryVal) : ''}
                            ${u.bio ? row('fa-align-left', isAR?'النبذة الشخصية':'Bio', u.bio) : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <button onclick="${isPro ? `adminSetPlan('${u.uid}','basic');closeMemberModal();` : `closeMemberModal();openPlanPickerModal('${u.uid}');`}" style="width:100%;padding:11px;background:${isPro?'rgba(220,50,50,0.1)':'linear-gradient(135deg,var(--gold3),var(--gold2))'};border:1px solid ${isPro?'rgba(220,50,50,0.3)':'transparent'};border-radius:10px;color:${isPro?'#ff6b6b':'#000'};font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
                                <i class="fa-solid ${isPro?'fa-arrow-down':'fa-crown'}"></i>
                                ${isPro?(isAR?'تحويل إلى Basic':'Downgrade to Basic'):(isAR?'ترقية إلى Pro':'Upgrade to Pro')}
                            </button>
                            <button onclick="adminToggleSuspend('${u.uid}',${!!u.suspended});closeMemberModal();" style="width:100%;padding:11px;background:${u.suspended?'rgba(39,163,70,0.1)':'rgba(255,165,0,0.08)'};border:1px solid ${u.suspended?'rgba(39,163,70,0.3)':'rgba(255,165,0,0.3)'};border-radius:10px;color:${u.suspended?'var(--green4)':'#ffaa00'};font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
                                <i class="fa-solid ${u.suspended?'fa-circle-check':'fa-ban'}"></i>
                                ${u.suspended?(isAR?'رفع الإيقاف':'Remove Suspension'):(isAR?'إيقاف مؤقت':'Suspend Account')}
                            </button>
                            <button onclick="closeMemberModal();openAdminAlert('${u.uid}','${fullName.replace(/'/g,"&#39;")}');" style="width:100%;padding:11px;background:rgba(100,149,237,0.08);border:1px solid rgba(100,149,237,0.25);border-radius:10px;color:#6495ed;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
                                <i class="fa-solid fa-paper-plane"></i>
                                ${isAR?'إرسال رسالة تنبيه':'Send Alert Message'}
                            </button>
                            <button onclick="closeMemberModal();navigate('admincoins', document.getElementById('menuAdminCoins'));setTimeout(()=>{const el=document.getElementById('coinMgmtEmail'); if(el){el.value='${(u.email||'').replace(/'/g,"&#39;")}'; adminCoinMgmtSearch();}},250);" style="width:100%;padding:11px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
                                <i class="fa-solid fa-coins"></i>
                                ${isAR?'إدارة رصيد العملات':'Manage Coin Balance'}
                            </button>
                            <button onclick="adminDeleteMember('${u.uid}','${fullName.replace(/'/g,"&#39;")}');closeMemberModal();" style="width:100%;padding:11px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.25);border-radius:10px;color:#ff6b6b;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
                                <i class="fa-solid fa-trash"></i>
                                ${isAR?'حذف الحساب نهائياً':'Delete Account Permanently'}
                            </button>
                        </div>`;

                    // Reset scroll to top when opening
                    const content = document.getElementById('memberDetailContent');
                    if (content) content.scrollTop = 0;
                    document.getElementById('memberDetailModal').style.display = 'flex';
                };

                window.closeMemberModal = function() {
                    const modal = document.getElementById('memberDetailModal');
                    if (modal) modal.style.display = 'none';
                };

                /* Opens the subscription-package picker before manually setting a member to Pro */
                window.openPlanPickerModal = function(uid) {
                    const PRO_PLANS = [
                        { months: 1, price: 50 },
                        { months: 3, price: 150 },
                        { months: 6, price: 200 }
                    ];
                    const optsEl = document.getElementById('planPickerOptions');
                    if (optsEl) {
                        optsEl.innerHTML = PRO_PLANS.map(p => {
                            const perMonth = (p.price / p.months).toFixed(0);
                            const durLabel = isAR ? (p.months === 1 ? 'شهر واحد' : (p.months === 3 ? '3 أشهر' : '6 أشهر')) : `${p.months} month${p.months > 1 ? 's' : ''}`;
                            const bestValue = p.months === 6;
                            return `<div onclick="adminConfirmManualPro('${uid}', ${p.months})" style="cursor:pointer;position:relative;display:flex;align-items:center;gap:12px;padding:14px;border:1px solid ${bestValue?'var(--gold3)':'var(--border)'};border-radius:12px;background:${bestValue?'rgba(212,160,23,0.06)':'transparent'};transition:0.2s;" onmouseover="this.style.borderColor='var(--gold3)'" onmouseout="this.style.borderColor='${bestValue?'var(--gold3)':'var(--border)'}'">
                                ${bestValue ? `<span style="position:absolute;top:-9px;${isAR?'right':'left'}:12px;background:var(--gold3);color:#000;font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;">${isAR?'أفضل قيمة':'Best value'}</span>` : ''}
                                <div style="width:38px;height:38px;border-radius:10px;background:rgba(212,160,23,0.12);display:flex;align-items:center;justify-content:center;color:var(--gold3);font-size:15px;flex-shrink:0;"><i class="fa-solid fa-crown"></i></div>
                                <div style="flex:1;">
                                    <div style="font-weight:700;font-size:13.5px;">${durLabel}</div>
                                    <div style="color:var(--muted);font-size:11px;">${isAR?'بمعدل':'~'} ${perMonth} ${isAR?'ج/شهر':'EGP/mo'}</div>
                                </div>
                                <div style="font-weight:700;font-size:15px;color:var(--gold3);">${p.price} ${isAR?'ج':'EGP'}</div>
                            </div>`;
                        }).join('');
                    }
                    const modal = document.getElementById('planPickerModal');
                    if (modal) modal.style.display = 'flex';
                };

                window.closePlanPickerModal = function() {
                    const modal = document.getElementById('planPickerModal');
                    if (modal) modal.style.display = 'none';
                };

                /* Applies the chosen package from the plan picker (manual Pro upgrade, no request involved) */
                window.adminConfirmManualPro = async function(uid, months) {
                    closePlanPickerModal();
                    await adminSetPlan(uid, 'pro', months);
                };
            }
            }
        } catch(e) {
            if (reqList) reqList.innerHTML = `<div style="color:var(--muted);text-align:center;padding:16px;font-size:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Error</div>`;
            if (memList) memList.innerHTML = `<div style="color:var(--muted);text-align:center;padding:16px;font-size:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Error</div>`;
        }
    };