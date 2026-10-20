
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
           الباسوردات النص الصريح اتشالت من هنا. اللوحة دي أصلاً مش شغالة في
           الملف ده (adminLoginForm فاضي/مقفول) — الدخول الحقيقي للأدمن بقى من
           admin.html بس، عبر Firebase Auth + admins/{uid}. */
        const ADMINS = [];

        // Sections a team member's access can be limited to
        const ADMIN_PERMISSION_LIST = [
            { key:'jobs',       labelAR:'لوحة الوظائف',       labelEN:'Job Board',             icon:'fa-briefcase' },
            { key:'community',  labelAR:'مجتمع طلاب',         labelEN:'Student Community',     icon:'fa-users' },
            { key:'support',    labelAR:'تذاكر الدعم',        labelEN:'Support Tickets',       icon:'fa-ticket' },
            { key:'members',    labelAR:'قائمة اعضاء',        labelEN:'Members List',          icon:'fa-users-gear' },
            { key:'pro',        labelAR:'طلبات برو',          labelEN:'Pro Requests',          icon:'fa-crown' },
            { key:'cv',         labelAR:'عمل cv',             labelEN:'CV Requests',           icon:'fa-file-invoice' },
            { key:'portfolio',  labelAR:'خرائط طلبة',         labelEN:'Student Maps',          icon:'fa-map-location-dot' },
            { key:'mentorship', labelAR:'حجوزات استشارات',    labelEN:'Consultation Bookings', icon:'fa-user-tie' },
        ];

        // Which DOM elements each permission key controls the visibility of
        const ADMIN_PERMISSION_ELEMENT_IDS = {
            members:    ['menuAdminMembers'],
            pro:        ['menuAdminPro'],
            cv:         ['menuAdminCV'],
            portfolio:  ['menuAdminPortfolio'],
            mentorship: ['menuAdminMentorship'],
            jobs:       ['menuJob'],
            support:    ['menuExpert'],
            community:  ['menuCommunity'],
        };

        // Maps a page route to the permission key that guards it (used for direct navigate() calls)
        const ADMIN_PAGE_PERMISSION_MAP = {
            adminmembers: 'members', adminpro: 'pro', cvbuilder: 'cv',
            adminportfolio: 'portfolio', adminmentorship: 'mentorship',
            jobs: 'jobs', expert: 'support',
            community: 'community',
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
            document.getElementById('tabStudent').classList.toggle('active', tab==='student');
            document.getElementById('tabAdmin').classList.toggle('active', tab==='admin');
            ['loginForm','adminLoginForm','signUpForm','forgotForm'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });
            if (tab === 'student') document.getElementById('loginForm').classList.remove('hidden');
            else document.getElementById('adminLoginForm').classList.remove('hidden');
        }

        async function doAdminLogin() {
            const username = document.getElementById('adminEmail').value.trim();
            const pass     = document.getElementById('adminPassword').value;
            let matched  = ADMINS.find(a => a.username === username && a.password === pass);
            let isSuper = true;
            let permissions = 'all';
            if (!matched) {
                try {
                    const teamMatch = await window._findTeamAccount(username, pass);
                    if (teamMatch) {
                        matched = teamMatch;
                        isSuper = false;
                        permissions = Array.isArray(teamMatch.permissions) ? teamMatch.permissions : [];
                    }
                } catch(e) { /* ignore lookup errors — falls through to invalid credentials */ }
            }
            if (matched) {
                window._isAdmin = true;
                window._adminProfile = matched;
                window._adminIsSuper = isSuper;
                window._adminPermissions = permissions;
                // Load saved admin photo from localStorage if exists
                const savedImg = localStorage.getItem('adminImg_' + username) || '';
                window._base64Img = savedImg;

                document.getElementById('authBox').style.display = 'none';
                document.getElementById('mainApp').style.display = 'flex';

                // Show Edit Mode button in topbar (hidden initially)
                const editBtn = document.getElementById('adminEditBtn');
                if (editBtn) editBtn.style.display = 'flex';

                // Update topbar and sidebar with real admin name + photo
                if (window._updateSidebarUser) {
                    window._updateSidebarUser(matched.firstName, matched.lastName, savedImg);
                }

                // Load notification count
                loadAdminNotifCount();

                // Show "Technical Support" sidebar item for admin (student chats)
                const menuExpertBtn = document.getElementById('menuExpert');
                if (menuExpertBtn) menuExpertBtn.style.display = '';

                // Show admin-only sidebar items (desktop/laptop)
                ['menuAdminMembers','menuAdminPro','menuAdminCV','menuAdminPortfolio','menuAdminMentorship'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = '';
                });

                // Hide nav items not relevant for admin
                const adminHideItems = ['menuPlay','menuLib','menuInsight','menuData','menuTool','menuCourse','menuConnect','menuCV','menuPortfolio','menuMentorship'];
                adminHideItems.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                    // also hide parent nav-section label if all items hidden
                });
                // Hide nav-section labels that become empty
                document.querySelectorAll('.nav-section').forEach(sec => {
                    const visibleItems = sec.querySelectorAll('.nav-item:not([style*="display: none"])');
                    const label = sec.querySelector('.nav-label');
                    if (visibleItems.length === 0 && label) label.style.display = 'none';
                });

                navigate('dashboard', document.getElementById('menuDash'));
                applyAdminPermissions();
                showToast('Welcome, ' + matched.displayName + ' — Admin mode active ✓');
            } else {
                showToast('Invalid admin credentials', true);
            }
        }

        let editModeOn = false;
        let _editSnapshot = {};
        const EDITABLE_IDS = ['stat_videos','stat_library','stat_jobs','stat_datasets'];

        function toggleEditMode() {
            editModeOn = !editModeOn;
            document.getElementById('pageBody').classList.toggle('edit-mode', editModeOn);
            const btn = document.getElementById('adminEditBtn');
            if (btn) {
                if (editModeOn) {
                    btn.style.background = 'linear-gradient(135deg,#e74c3c,#c0392b)';
                    btn.style.color = '#fff';
                    btn.style.boxShadow = '0 2px 10px rgba(231,76,60,0.4)';
                } else {
                    btn.style.background = 'linear-gradient(135deg,var(--gold3),var(--gold2))';
                    btn.style.color = '#0a0a0e';
                    btn.style.boxShadow = '0 2px 10px rgba(212,160,23,0.35)';
                }
            }
            document.getElementById('adminEditIcon').className = editModeOn ? 'fa-solid fa-xmark' : 'fa-solid fa-pen-to-square';
            document.getElementById('adminEditTxt').textContent = editModeOn ? 'Stop Editing' : 'Edit Mode';

            if (editModeOn) {
                _editSnapshot = {};
                EDITABLE_IDS.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        _editSnapshot[id] = el.innerHTML;
                        el.setAttribute('contenteditable','true');
                        el.setAttribute('spellcheck','false');
                        el.style.outline = '2px dashed rgba(212,160,23,0.8)';
                        el.style.borderRadius = '4px';
                        el.style.padding = '2px 4px';
                        el.style.cursor = 'text';
                    }
                });
                showToast('Click any number to edit it');
            } else {
                const changed = {};
                EDITABLE_IDS.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.removeAttribute('contenteditable');
                        el.style.outline = '';
                        el.style.borderRadius = '';
                        el.style.padding = '';
                        el.style.cursor = '';
                        if (el.innerHTML !== _editSnapshot[id]) changed[id] = el.innerHTML;
                    }
                });
                if (Object.keys(changed).length > 0 && window._saveContent) {
                    window._saveContent(changed).then(() => {
                        showToast('✓ ' + Object.keys(changed).length + ' number(s) saved — visible to all users');
                    }).catch(() => showToast('Save failed', true));
                } else {
                    showToast('No changes detected');
                }
            }
        }

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
                        personalAlerts = await window._loadMyAdminAlerts();
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