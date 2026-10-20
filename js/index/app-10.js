
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

                // ── Upgrade Requests ──
                if (reqList) {
                const pendingReqs = reqs.filter(r => r.status === 'pending');
                if (reqBadge) { reqBadge.textContent = pendingReqs.length; reqBadge.style.display = pendingReqs.length ? 'inline-flex' : 'none'; }
                if (!pendingReqs.length) {
                    reqList.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-inbox" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR?'لا توجد طلبات ترقية حالياً':'No upgrade requests right now'}</div>`;
                } else {
                    reqList.innerHTML = pendingReqs.map(r => {
                        const timeStr = r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric'}) : '';
                        const waLink = r.phone ? `https://wa.me/${r.phone.replace(/\D/g,'')}` : '#';
                        return `<div id="req_${r.id}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(212,160,23,0.05);border:1px solid rgba(212,160,23,0.2);border-radius:12px;flex-wrap:wrap;transition:0.2s;">
                            <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold2),var(--gold3));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:15px;flex-shrink:0;">${(r.firstName||'U')[0].toUpperCase()}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:700;">${r.firstName||''} ${r.lastName||''}</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:1px;">${r.email||''} ${r.phone ? '· <b style="color:var(--text);">'+r.phone+'</b>' : ''}</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:2px;"><i class="fa-regular fa-clock" style="margin-left:3px;"></i>${timeStr}</div>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
                                <a href="${waLink}" target="_blank" style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3);border-radius:8px;color:#25d366;font-size:11px;font-weight:700;text-decoration:none;" title="${isAR?'فتح واتساب':'Open WhatsApp'}">
                                    <i class="fa-brands fa-whatsapp" style="font-size:15px;"></i> ${isAR?'واتساب':'WhatsApp'}
                                </a>
                                <button onclick="adminActivatePro('${r.uid}','${r.id}')" style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.3);border-radius:8px;color:var(--gold3);font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" title="${isAR?'تفعيل Pro':'Activate Pro'}">
                                    <i class="fa-solid fa-crown"></i> ${isAR?'تفعيل Pro':'Activate Pro'}
                                </button>
                                <button onclick="adminDeleteRequest('${r.id}')" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(220,50,50,0.08);border:1px solid rgba(220,50,50,0.25);border-radius:8px;color:#ff6b6b;cursor:pointer;transition:0.2s;flex-shrink:0;" title="${isAR?'حذف الطلب':'Delete request'}" onmouseover="this.style.background='rgba(220,50,50,0.2)'" onmouseout="this.style.background='rgba(220,50,50,0.08)'">
                                    <i class="fa-solid fa-xmark" style="font-size:14px;"></i>
                                </button>
                            </div>
                        </div>`;
                    }).join('');
                }
                }

                // ── Members Row List with inline toggle ──
                if (memList) {
                if (memBadge) memBadge.textContent = users.length;
                if (!users.length) {
                    memList.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${isAR?'لا يوجد أعضاء':'No members yet'}</div>`;
                } else {
                    // Store users data globally for the modal
                    window._adminUsersCache = users;
                    memList.innerHTML = `
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
                        ${users.map(u => {
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
                                    ${proRemRowHtml}
                                </div>
                                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
                                    <button onclick="adminSetPlan('${u.uid}','${isPro?'basic':'pro'}')" style="display:flex;align-items:center;gap:4px;padding:6px 11px;background:${isPro?'rgba(220,50,50,0.08)':'rgba(212,160,23,0.1)'};border:1px solid ${isPro?'rgba(220,50,50,0.25)':'rgba(212,160,23,0.3)'};border-radius:8px;color:${isPro?'#ff6b6b':'var(--gold3)'};font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" title="${isPro?(isAR?'تحويل Basic':'Set Basic'):(isAR?'ترقية Pro':'Set Pro')}">
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
                                <button onclick="adminSetPlan('${u.uid}','${isPro?'basic':'pro'}');closeMemberModal();" style="width:100%;padding:11px;background:${isPro?'rgba(220,50,50,0.1)':'linear-gradient(135deg,var(--gold3),var(--gold2))'};border:1px solid ${isPro?'rgba(220,50,50,0.3)':'transparent'};border-radius:10px;color:${isPro?'#ff6b6b':'#000'};font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:0.2s;">
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
                }
                }
            } catch(e) {
                if (reqList) reqList.innerHTML = `<div style="color:var(--muted);text-align:center;padding:16px;font-size:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Error</div>`;
                if (memList) memList.innerHTML = `<div style="color:var(--muted);text-align:center;padding:16px;font-size:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Error</div>`;
            }
        };

        window.adminSetPlan = async function(uid, plan) {
            const isAR = lang === 'AR';
            try {
                await window._setUserPlan(uid, plan);
                showToast(isAR ? `✓ تم تغيير الخطة إلى ${plan === 'pro' ? 'Pro' : 'Basic'}` : `✓ Plan changed to ${plan === 'pro' ? 'Pro' : 'Basic'}`);
                adminLoadMembers();
            } catch(e) {
                showToast(isAR ? 'خطأ في التغيير' : 'Failed to change plan', true);
            }
        };

        window.adminActivatePro = async function(uid, reqId) {
            const isAR = lang === 'AR';
            try {
                await window._setUserPlan(uid, 'pro');
                await window._deleteUpgradeRequest(reqId);
                showToast(isAR ? '✓ تم تفعيل Pro وحذف الطلب' : '✓ Pro activated & request removed');
                adminLoadMembers();
            } catch(e) {
                showToast(isAR ? 'خطأ في التفعيل' : 'Activation failed', true);
            }
        };

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
                ? 'لو نسيت بريدك الإلكتروني، تواصل مع الدعم الفني عن طريق صفحة "سوشيال ميديا" لمساعدتك في استرجاعه'
                : "If you forgot your email, please contact our support team via the 'Social Media' page to help you recover it", true);
        }
        window.showForgotEmailHint = showForgotEmailHint;

        /* ─── SOCIAL AUTH (Google / Facebook) ─── */
        async function socialAuth(provider) {
            const isAR = lang === 'AR';
            try {
                const result = await window._socialSignIn(provider);
                if (result === 'redirecting-to-admin') return;
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
            document.getElementById('adminLoginForm').classList.add('hidden');
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
                _myTicketsUnsub = window._subscribeMyTickets(
                    tickets => renderStudentTicketList(tickets, isAR),
                    err => {
                        const box = document.getElementById('studentTkList');
                        if (box) box.innerHTML = `<div style="text-align:center;padding:30px;color:#ff6b6b;font-size:13px;">${isAR?'تعذّر تحميل التذاكر':'Could not load tickets'}<br><span style="font-size:11px;opacity:0.7;direction:ltr;display:inline-block;margin-top:6px;">${(err && (err.code || err.message)) || ''}</span></div>`;
                    }
                );
            }
        }