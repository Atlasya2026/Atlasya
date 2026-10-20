
        window.backToCompanyDashboard = function() {
            _companyView = 'dashboard';
            _companyEditingId = null;
            renderCompanyPortal();
        };

        function companyCourseFormHTML(isAR) {
            const editing = _companyEditingId ? _companyMyCourses.find(c => c.id === _companyEditingId) : null;
            const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
            return `
            <div class="company-panel" onclick="event.stopPropagation()">
                <div class="company-panel-header">
                    <h3><i class="fa-solid fa-chalkboard-user"></i> ${editing ? (isAR?'تعديل الكورس':'Edit Course') : (isAR?'إضافة كورس جديد':'Add New Course')}</h3>
                    <i class="fa-solid fa-xmark close-x" onclick="backToCompanyDashboard()"></i>
                </div>
                <div class="company-panel-body">
                    <div class="proj-form-grid">
                        <div class="job-field full"><label>${isAR?'اسم الكورس *':'Course Title *'}</label><input type="text" id="ccTitle" value="${escapeHtml(v('title'))}"></div>
                        <div class="job-field full"><label>${isAR?'وصف الكورس *':'Course Description *'}</label><textarea id="ccDesc">${escapeHtml(v('description'))}</textarea></div>
                        <div class="job-field full"><label>${isAR?'أهداف الكورس':'Course Goals'}</label><textarea id="ccGoals">${escapeHtml(v('goals'))}</textarea></div>
                        <div class="job-field full"><label>${isAR?'محتويات الكورس':'Course Content'}</label><textarea id="ccContent">${escapeHtml(v('content'))}</textarea></div>
                        <div class="job-field full"><label>${isAR?'المهارات المكتسبة':'Skills Gained'}</label><textarea id="ccSkills">${escapeHtml(v('skills'))}</textarea></div>
                        <div class="job-field"><label>${isAR?'البرامج المستخدمة':'Software Used'}</label><input type="text" id="ccSoftware" value="${escapeHtml(v('software'))}"></div>
                        <div class="job-field"><label>${isAR?'المستوى':'Level'}</label>
                            <select id="ccLevel">
                                <option value="">${isAR?'— اختر —':'— Select —'}</option>
                                <option value="مبتدئ" ${v('level')==='مبتدئ'?'selected':''}>${isAR?'مبتدئ':'Beginner'}</option>
                                <option value="متوسط" ${v('level')==='متوسط'?'selected':''}>${isAR?'متوسط':'Intermediate'}</option>
                                <option value="متقدم" ${v('level')==='متقدم'?'selected':''}>${isAR?'متقدم':'Advanced'}</option>
                            </select>
                        </div>
                        <div class="job-field"><label>${isAR?'الفئة المستهدفة':'Target Audience'}</label><input type="text" id="ccAudience" value="${escapeHtml(v('targetAudience'))}"></div>
                        <div class="job-field"><label>${isAR?'مدة الكورس':'Duration'}</label><input type="text" id="ccDuration" value="${escapeHtml(v('duration'))}" placeholder="${isAR?'مثال: 6 أسابيع':'e.g. 6 weeks'}"></div>
                        <div class="job-field"><label>${isAR?'يوجد شهادة؟':'Certificate?'}</label>
                            <select id="ccCert">
                                <option value="no" ${!editing || !editing.certificate ? 'selected':''}>${isAR?'لا':'No'}</option>
                                <option value="yes" ${editing && editing.certificate ? 'selected':''}>${isAR?'نعم':'Yes'}</option>
                            </select>
                        </div>
                        <div class="job-field"><label>${isAR?'السعر (اتركه فارغاً إن كان مجانياً)':'Price (leave empty if free)'}</label><input type="number" id="ccPrice" value="${v('price')}"></div>
                        <div class="job-field"><label>${isAR?'رابط التسجيل (اختياري)':'Enrollment Link (optional)'}</label><input type="url" id="ccEnrollUrl" value="${escapeHtml(v('enrollUrl'))}"></div>
                        <div class="job-field full"><label>${isAR?'رابط فيديو يوتيوب':'YouTube Video URL'}</label><input type="url" id="ccYoutube" value="${escapeHtml(v('youtubeUrl'))}" placeholder="https://youtube.com/watch?v=..."></div>
                        <div class="job-field full"><label>${isAR?'متطلبات الالتحاق':'Enrollment Requirements'}</label><textarea id="ccRequirements">${escapeHtml(v('requirements'))}</textarea></div>
                        <div class="job-field"><label>${isAR?'البريد الإلكتروني':'Email'}</label><input type="email" id="ccEmail" value="${escapeHtml(v('email') || window._companyProfile?.email || '')}"></div>
                        <div class="job-field"><label>WhatsApp</label><input type="text" id="ccWhatsapp" value="${escapeHtml(v('whatsapp') || window._companyProfile?.whatsapp || '')}"></div>
                        <div class="job-field"><label>${isAR?'الموقع الإلكتروني':'Website'}</label><input type="text" id="ccWebsite" value="${escapeHtml(v('website') || window._companyProfile?.website || '')}"></div>
                        <div class="job-field"><label>Facebook</label><input type="text" id="ccFacebook" value="${escapeHtml(v('facebook') || window._companyProfile?.facebook || '')}"></div>
                        <div class="job-field"><label>LinkedIn</label><input type="text" id="ccLinkedin" value="${escapeHtml(v('linkedin') || window._companyProfile?.linkedin || '')}"></div>
                        <div class="job-field"><label>Instagram</label><input type="text" id="ccInstagram" value="${escapeHtml(v('instagram') || window._companyProfile?.instagram || '')}"></div>
                    </div>
                    <button class="btn-post-job" style="width:100%;margin-top:14px;" onclick="companySubmitCourseForm()"><i class="fa-solid fa-paper-plane"></i> ${isAR?'إرسال الكورس':'Submit Course'}</button>
                    <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;"><i class="fa-solid fa-hourglass-half"></i> ${isAR?'سيتم مراجعة الكورس بواسطة الإدارة قبل نشره':'The course will be reviewed by the admin before publishing'}</p>
                    <div id="companyFormError" style="color:#ff6b6b;font-size:12px;margin-top:8px;text-align:center;"></div>
                </div>
            </div>`;
        }

        window.companySubmitCourseForm = async function() {
            const isAR = lang === 'AR';
            const errEl = document.getElementById('companyFormError');
            const data = {
                title: document.getElementById('ccTitle')?.value.trim(),
                description: document.getElementById('ccDesc')?.value.trim(),
                goals: document.getElementById('ccGoals')?.value.trim(),
                content: document.getElementById('ccContent')?.value.trim(),
                skills: document.getElementById('ccSkills')?.value.trim(),
                software: document.getElementById('ccSoftware')?.value.trim(),
                level: document.getElementById('ccLevel')?.value,
                targetAudience: document.getElementById('ccAudience')?.value.trim(),
                duration: document.getElementById('ccDuration')?.value.trim(),
                certificate: document.getElementById('ccCert')?.value === 'yes',
                price: document.getElementById('ccPrice')?.value ? Number(document.getElementById('ccPrice').value) : 0,
                enrollUrl: document.getElementById('ccEnrollUrl')?.value.trim(),
                youtubeUrl: document.getElementById('ccYoutube')?.value.trim(),
                requirements: document.getElementById('ccRequirements')?.value.trim(),
                email: document.getElementById('ccEmail')?.value.trim(),
                whatsapp: document.getElementById('ccWhatsapp')?.value.trim(),
                website: document.getElementById('ccWebsite')?.value.trim(),
                facebook: document.getElementById('ccFacebook')?.value.trim(),
                linkedin: document.getElementById('ccLinkedin')?.value.trim(),
                instagram: document.getElementById('ccInstagram')?.value.trim(),
            };
            if (!data.title || !data.description) {
                if (errEl) errEl.textContent = isAR?'من فضلك املأ اسم ووصف الكورس على الأقل':'Please fill at least the title and description';
                return;
            }
            // Firestore بيرفض أي قيمة undefined أو NaN — ننضّف البيانات قبل الإرسال
            Object.keys(data).forEach(k => {
                if (data[k] === undefined || data[k] === null) data[k] = '';
                if (typeof data[k] === 'number' && !Number.isFinite(data[k])) data[k] = 0;
            });
            let _saved = false;
            try {
                if (_companyEditingId) await window._companyUpdateCourse(_companyEditingId, data);
                else await window._companySubmitCourse(data);
                _saved = true;
                showToast(isAR?'تم إرسال الكورس للمراجعة':'Course submitted for review');
                _companyEditingId = null;
                _companyView = 'dashboard';
                renderCompanyPortal();
            } catch(e) {
                console.error('company course submit failed (saved=' + _saved + '):', e);
                const code = String((e && (e.code || e.message)) || '').slice(0, 140);
                let hint = '';
                if (/permission-denied|insufficient/i.test(code)) hint = isAR ? ' — الحساب مش مسموح له بإضافة كورس (راجع قواعد Firestore)' : ' — this account is not allowed to add courses (check Firestore rules)';
                else if (/unauthenticated|Not logged in/i.test(code)) hint = isAR ? ' — سجّل خروج وادخل تاني بحساب الشركة' : ' — please log out and log in again';
                if (errEl) errEl.textContent = (_saved
                    ? (isAR ? 'تم الحفظ لكن حصل خطأ في عرض الصفحة، حدّث الصفحة' : 'Saved, but the page failed to refresh — please reload')
                    : (isAR ? 'حدث خطأ أثناء الإرسال' : 'An error occurred while submitting')) + (code ? ` (${code})` : '') + hint;
            }
        };

        window.handleFileDownload = async function(url) {
            const isAR = lang === 'AR';
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin === true;
            if (!isAdmin && !isPro) {
                const count = window._getDailyDownloadCount ? window._getDailyDownloadCount() : 0;
                if (count >= 3) {
                    showToast(isAR
                        ? '🔒 وصلت للحد اليومي (3 ملفات) — يتجدد تلقائياً غداً أو قم بالترقية إلى Pro'
                        : '🔒 Daily limit reached (3 files) — resets tomorrow or upgrade to Pro', true);
                    return;
                }
                try { await window._incrementDailyDownload(); } catch(e) {}
            }
            // Open via temporary anchor to prevent URL exposure
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 300);
        };

        // Two files belong to the same required pair (e.g. ArcGIS Pro + .NET Framework).
        // Whichever one the student downloads first consumes ONE slot from the daily quota;
        // downloading the other file on the same day afterwards is free.
        window.handleFileDownloadPair = async function(url, comboId) {
            const isAR = lang === 'AR';
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin === true;
            const openFile = (u) => {
                const a = document.createElement('a');
                a.href = u;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => a.remove(), 300);
            };
            if (isAdmin || isPro) { openFile(url); return; }

            const comboKey = `atlasya_combo_${comboId}_${new Date().toDateString()}`;
            const alreadyUsedToday = localStorage.getItem(comboKey) === '1';
            if (alreadyUsedToday) { openFile(url); return; }

            const count = window._getDailyDownloadCount ? window._getDailyDownloadCount() : 0;
            if (count >= 3) {
                showToast(isAR
                    ? '🔒 وصلت للحد اليومي (3 ملفات) — يتجدد تلقائياً غداً أو قم بالترقية إلى Pro'
                    : '🔒 Daily limit reached (3 files) — resets tomorrow or upgrade to Pro', true);
                return;
            }
            openFile(url);
            try { await window._incrementDailyDownload(); } catch(e) {}
            localStorage.setItem(comboKey, '1');
        };

        // ── Prevent right-click on dataset/tool cards ──
        document.addEventListener('contextmenu', function(e) {
            const card = e.target.closest('.dataset-card');
            if (card) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);


        /* ─── GIS SOFTWARE TOOLS (dynamic library) ─── */
        const SOFTWARE_CATEGORIES = [
            { key:'gis',             icon:'fa-map',                ar:'برامج GIS',            en:'GIS Software' },
            { key:'cad',             icon:'fa-drafting-compass',   ar:'برامج CAD',            en:'CAD Software' },
            { key:'remote_sensing',  icon:'fa-satellite',          ar:'الاستشعار عن بعد',      en:'Remote Sensing' },
            { key:'office',          icon:'fa-file-word',          ar:'برامج مكتبية',          en:'Office Software' },
            { key:'programming',     icon:'fa-code',                ar:'برمجة',                en:'Programming' },
            { key:'other',           icon:'fa-toolbox',            ar:'أخرى',                 en:'Other' },
        ];
        function scFindToolCat(key) { return SOFTWARE_CATEGORIES.find(c => c.key === key); }

        let _toolsAll = [];
        let _toolsLoaded = false;
        let _toolsSearchQ = '';

        function toolCardHTML(t, isAR) {
            const cat = scFindToolCat(t.category);
            return `
            <a href="javascript:void(0)" onclick="handleToolDownload('${t.id}')" oncontextmenu="return window._blockCopyAttempt(event);" class="dataset-card">
                <div class="ds-top">
                    <div class="ds-icon"><i class="fa-solid ${t.icon || (cat?cat.icon:'fa-download')}"></i></div>
                    <span class="ds-badge">${escapeHtml(t.version||'')}</span>
                </div>
                <div class="ds-info">
                    <h4>${escapeHtml(isAR?(t.name||''):(t.nameEn||t.name||''))}</h4>
                    ${t.notes ? `<div style="font-size:10.5px;color:var(--gold3);margin-top:4px;"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(t.notes)}</div>` : ''}
                </div>
                <div class="ds-dl"><i class="fa-solid fa-download"></i><span>${isAR?'تحميل':'Download'}</span></div>
            </a>`;
        }

        function toolCardSplitHTML(t, isAR) {
            return `
            <div class="dataset-card split" oncontextmenu="return window._blockCopyAttempt(event);">
                <div class="ds-top">
                    <div class="ds-icon"><i class="fa-solid ${t.icon || 'fa-circle-down'}"></i></div>
                    <span class="ds-badge">${escapeHtml(t.version||'')}</span>
                </div>
                <div class="ds-info">
                    <h4>${escapeHtml(isAR?(t.name||''):(t.nameEn||t.name||''))}</h4>
                    <div class="ds-combo-note">${isAR?`⚠️ يجب تحميل "${escapeHtml(t.prerequisiteLabel||'')}" أولاً قبل التثبيت`:`⚠️ You must download "${escapeHtml(t.prerequisiteLabel||'')}" first before installing`}</div>
                    ${t.notes ? `<div style="font-size:10.5px;color:var(--gold3);margin-top:4px;"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(t.notes)}</div>` : ''}
                </div>
                <div class="ds-dl-group">
                    <button type="button" class="ds-dl-mini" onclick="handleToolDownloadPair('${t.id}','main')" oncontextmenu="return window._blockCopyAttempt(event);"><i class="fa-solid fa-download"></i><span>${escapeHtml(isAR?(t.name||''):(t.nameEn||t.name||''))}</span></button>
                    <button type="button" class="ds-dl-mini" onclick="handleToolDownloadPair('${t.id}','prereq')" oncontextmenu="return window._blockCopyAttempt(event);"><i class="fa-solid fa-download"></i><span>${escapeHtml(t.prerequisiteLabel || (isAR?'المتطلب':'Requirement'))}</span></button>
                </div>
            </div>`;
        }

        async function renderTools(area) {
            const isAR = lang === 'AR';
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin === true;
            const uploadCount = window._getDailyDownloadCount ? window._getDailyDownloadCount() : (window._userData?.uploadCount || 0);
            const quotaBannerTools = (!isAdmin && !isPro) ? `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${uploadCount>=3?'rgba(220,50,50,0.07)':'rgba(var(--brand-rgb,30,122,52),0.07)'};border:1px solid ${uploadCount>=3?'rgba(220,50,50,0.25)':'var(--border2)'};border-radius:12px;margin-bottom:20px;flex-wrap:wrap;">
                <i class="fa-solid fa-cloud-arrow-down" style="color:${uploadCount>=3?'#ff6b6b':'var(--g4)'};font-size:18px;flex-shrink:0;"></i>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:${uploadCount>=3?'#ff6b6b':'var(--text)'};">${isAR ? `تحميلات اليوم: ${uploadCount} / 3` : `Today's downloads: ${uploadCount} / 3`}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:2px;">${uploadCount>=3 ? (isAR?'وصلت للحد اليومي — يتجدد غداً أو قم بالترقية إلى Pro':'Daily limit reached — resets tomorrow or upgrade to Pro') : (isAR?'Basic: حتى 3 تحميلات مجاناً يومياً':'Basic: up to 3 free downloads per day')}</div>
                </div>
                ${uploadCount>=3?`<button onclick="goSettings('plan')" style="padding:7px 14px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;flex-shrink:0;"><i class="fa-solid fa-crown"></i> ${isAR?'ترقية Pro':'Upgrade Pro'}</button>`:''}
            </div>` : (isPro ? `
            <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.2);border-radius:10px;margin-bottom:16px;">
                <i class="fa-solid fa-crown" style="color:var(--gold3);"></i>
                <span style="font-size:12px;font-weight:700;color:var(--gold3);">${isAR?'Pro — تحميل غير محدود مفعّل':'Pro — Unlimited downloads active'}</span>
            </div>` : '');

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? '🧰 أدوات البرامج' : '🧰 Software Tools'}</h2>
                <p>${isAR ? 'روابط تحميل أهم برامج GIS والـ CAD والاستشعار عن بعد والأدوات المساعدة' : 'Download links for essential GIS, CAD, remote sensing software and supporting tools'}</p>
            </div>
            ${quotaBannerTools}
            <div class="ds-search-bar">
                <input type="text" id="toolsSearchInput" placeholder="${isAR?'ابحث عن اسم البرنامج...':'Search for a software name...'}" onkeydown="if(event.key==='Enter') toolsSearchGo()">
                <button onclick="toolsSearchGo()"><i class="fa-solid fa-magnifying-glass"></i> ${isAR?'بحث':'Search'}</button>
            </div>
            <div id="toolsStage"><div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:var(--muted);"></i></div></div>`;

            if (!_toolsLoaded) {
                try {
                    const tools = window._loadSoftwareTools ? await window._loadSoftwareTools() : [];
                    _toolsAll = (tools || []).filter(t => !t.hidden);
                    _toolsLoaded = true;
                } catch(e) { console.error('Software tools load error:', e); _toolsAll = []; }
            }
            renderToolsStage();
        }

        window.toolsSearchGo = function() {
            _toolsSearchQ = (document.getElementById('toolsSearchInput')?.value || '').trim().toLowerCase();
            renderToolsStage();
        };

        function renderToolsStage() {
            const isAR = lang === 'AR';
            const stage = document.getElementById('toolsStage');
            if (!stage) return;
            let items = _toolsAll;
            if (_toolsSearchQ) items = items.filter(t => [(t.name||''),(t.nameEn||''),(t.version||'')].join(' ').toLowerCase().includes(_toolsSearchQ));
            if (!items.length) {
                stage.innerHTML = `<div class="ds-empty"><i class="fa-solid fa-toolbox" style="font-size:24px;margin-bottom:8px;display:block;"></i>${isAR?'لا توجد أدوات مضافة حتى الآن':'No software tools added yet'}</div>`;
                return;
            }
            const grouped = {};
            items.forEach(t => { (grouped[t.category] = grouped[t.category] || []).push(t); });
            let html = '';
            SOFTWARE_CATEGORIES.forEach(cat => {
                const list = grouped[cat.key];
                if (!list || !list.length) return;
                html += `
                <div class="connect-section-wrap">
                    <div class="connect-section-title">
                        <span class="brand-pill gis"><i class="fa-solid ${cat.icon}"></i> ${isAR?cat.ar:cat.en}</span>
                    </div>
                    <div class="datasets-grid">
                        ${list.map(t => t.requiresPrerequisite ? toolCardSplitHTML(t, isAR) : toolCardHTML(t, isAR)).join('')}
                    </div>
                </div>`;
            });
            stage.innerHTML = html;
        }

        window.handleToolDownload = async function(id) {
            const isAR = lang === 'AR';
            const t = _toolsAll.find(x => x.id === id);
            if (!t || !t.downloadUrl) { showToast(isAR?'لا يوجد رابط تحميل لهذا البرنامج':'No download link available for this software', true); return; }
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin === true;
            if (!isAdmin && !isPro) {
                const count = window._getDailyDownloadCount ? window._getDailyDownloadCount() : 0;
                if (count >= 3) {
                    showToast(isAR
                        ? '🔒 وصلت للحد اليومي (3 ملفات) — يتجدد تلقائياً غداً أو قم بالترقية إلى Pro'
                        : '🔒 Daily limit reached (3 files) — resets tomorrow or upgrade to Pro', true);
                    return;
                }
                try { await window._incrementDailyDownload(); } catch(e) {}
            }
            const a = document.createElement('a');
            a.href = t.downloadUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 300);
            try {
                if (window._incrementToolDownload) await window._incrementToolDownload(id, t.downloads || 0, t);
                t.downloads = (t.downloads || 0) + 1;
            } catch(e) {}
        };

        // Prerequisite pair: downloading either the main file or the prerequisite consumes
        // ONE slot from the daily quota; the other stays free for the rest of the day.
        window.handleToolDownloadPair = async function(id, which) {
            const isAR = lang === 'AR';
            const t = _toolsAll.find(x => x.id === id);
            if (!t) return;
            const url = which === 'main' ? t.downloadUrl : t.prerequisiteUrl;
            if (!url) { showToast(isAR?'لا يوجد رابط لهذا الملف':'No link available for this file', true); return; }
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin === true;
            const openFile = (u) => {
                const a = document.createElement('a');
                a.href = u;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => a.remove(), 300);
            };
            const trackDownload = async () => {
                try {
                    if (window._incrementToolDownload) await window._incrementToolDownload(id, t.downloads || 0, t);
                    t.downloads = (t.downloads || 0) + 1;
                } catch(e) {}
            };
            if (isAdmin || isPro) { openFile(url); trackDownload(); return; }

            const comboKey = `atlasya_combo_tool_${id}_${new Date().toDateString()}`;
            const alreadyUsedToday = localStorage.getItem(comboKey) === '1';
            if (alreadyUsedToday) { openFile(url); return; }

            const count = window._getDailyDownloadCount ? window._getDailyDownloadCount() : 0;
            if (count >= 3) {
                showToast(isAR
                    ? '🔒 وصلت للحد اليومي (3 ملفات) — يتجدد تلقائياً غداً أو قم بالترقية إلى Pro'
                    : '🔒 Daily limit reached (3 files) — resets tomorrow or upgrade to Pro', true);
                return;
            }
            openFile(url);
            try { await window._incrementDailyDownload(); } catch(e) {}
            localStorage.setItem(comboKey, '1');
            trackDownload();
        };

        /* ─── JOB BOARD ─── */
        let _jobsUnsubscribe = null; // real-time listener cleanup

        async function renderJobs(area) {
            const isAR = lang === 'AR';
            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const inputBg = isLight ? '#f4f6fa' : 'rgba(0,0,0,0.25)';
            const isAdmin = window._isAdmin === true;

            const rightPanel = isAdmin ? `
                <!-- RIGHT: admin tabs (requests + post job) -->
                <div class="job-requests-panel">
                    <!-- Admin tabs -->
                    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:0;">
                        <button id="adminJobTab1" onclick="switchJobTab(1)" style="flex:1;padding:11px 8px;background:rgba(var(--brand-rgb,30,122,52),0.12);border:none;border-bottom:2px solid var(--green4);color:var(--text);font-weight:700;font-size:13px;cursor:pointer;font-family:'Tajawal',sans-serif;transition:0.2s;">
                            <i class="fa-solid fa-inbox" style="color:var(--gold3);margin-${isAR?'left':'right'}:6px;"></i>${isAR ? 'طلبات النشر' : 'Post Requests'} <span class="job-count-badge" id="jobRequestsBadge" style="margin-${isAR?'right':'left'}:4px;">0</span>
                        </button>
                        <button id="adminJobTab2" onclick="switchJobTab(2)" style="flex:1;padding:11px 8px;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-weight:700;font-size:13px;cursor:pointer;font-family:'Tajawal',sans-serif;transition:0.2s;">
                            <i class="fa-solid fa-plus" style="color:var(--green4);margin-${isAR?'left':'right'}:6px;"></i>${isAR ? 'نشر وظيفة' : 'Post a Job'}
                        </button>
                    </div>

                    <!-- Tab 1: requests list -->
                    <div id="adminJobTabPanel1">
                        <div class="job-requests-header" style="border-bottom:none;padding-top:14px;">
                            <i class="fa-solid fa-inbox" style="color:var(--gold3);font-size:16px;"></i>
                            <h3>${isAR ? 'طلبات نشر الوظائف' : 'Job Post Requests'}</h3>
                        </div>
                        <div class="job-requests-list" id="jobRequestsList">
                            <div style="text-align:center;padding:40px;color:var(--muted);">
                                <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 2: admin post job form -->
                    <div id="adminJobTabPanel2" style="display:none;">
                        <div class="job-post-header" style="padding-top:14px;">
                            <h3><i class="fa-solid fa-plus" style="color:var(--g4);margin-${isAR?'left':'right'}:8px;"></i>${isAR ? 'نشر وظيفة كإدارة' : 'Post a Job as Admin'}</h3>
                            <p style="font-size:12px;color:var(--muted);margin-top:4px;"><i class="fa-solid fa-shield-check" style="color:var(--green4);margin-${isAR?'left':'right'}:4px;"></i>${isAR ? 'الوظيفة ستُنشر فوراً باسم Atlasya Team' : 'Job will be published instantly under Atlasya Team'}</p>
                        </div>
                        <div class="job-post-body">
                            <div class="job-field">
                                <label>${isAR ? 'المسمى الوظيفي *' : 'Job Title *'}</label>
                                <input type="text" id="jTitle" placeholder="${isAR ? 'مثال: محلل GIS' : 'e.g. GIS Analyst'}">
                            </div>
                            <div class="job-field">
                                <label>${isAR ? 'اسم الشركة / الجهة *' : 'Company / Organization *'}</label>
                                <input type="text" id="jCompany" placeholder="${isAR ? 'مثال: وزارة التخطيط' : 'e.g. Ministry of Planning'}">
                            </div>
                            <div class="job-field">
                                <label>${isAR ? 'الموقع' : 'Location'}</label>
                                <input type="text" id="jLocation" placeholder="${isAR ? 'مثال: القاهرة، مصر' : 'e.g. Cairo, Egypt'}">
                            </div>
                            <div class="job-field">
                                <label>${isAR ? 'نوع الوظيفة' : 'Job Type'}</label>
                                <select id="jType">
                                    <option value="">${isAR ? '— اختر —' : '— Select —'}</option>
                                    <option value="${isAR?'دوام كامل':'Full-time'}">${isAR ? 'دوام كامل' : 'Full-time'}</option>
                                    <option value="${isAR?'دوام جزئي':'Part-time'}">${isAR ? 'دوام جزئي' : 'Part-time'}</option>
                                    <option value="${isAR?'عن بُعد':'Remote'}">${isAR ? 'عن بُعد' : 'Remote'}</option>
                                    <option value="${isAR?'تدريب':'Internship'}">${isAR ? 'تدريب / Internship' : 'Internship'}</option>
                                    <option value="${isAR?'فريلانس':'Freelance'}">${isAR ? 'فريلانس' : 'Freelance'}</option>
                                </select>
                            </div>
                            <div class="job-field">
                                <label>${isAR ? 'وصف الوظيفة *' : 'Job Description *'}</label>
                                <textarea id="jDesc" placeholder="${isAR ? 'المهام، المتطلبات، وطريقة التقديم...' : 'Responsibilities, requirements, how to apply...'}"></textarea>
                            </div>
                            <div class="job-field">
                                <label>${isAR ? 'رابط التقديم (اختياري)' : 'Apply Link (optional)'}</label>
                                <input type="url" id="jLink" placeholder="https://...">
                            </div>
                            <button class="btn-post-job" id="btnPostJob" onclick="submitJob()">
                                <i class="fa-solid fa-paper-plane"></i>
                                ${isAR ? 'نشر الوظيفة' : 'Post Job'}
                            </button>
                            <p style="font-size:11px;color:var(--green4);text-align:center;margin-top:6px;">
                                <i class="fa-solid fa-shield-check"></i>
                                ${isAR ? 'تُنشر فوراً — لا تحتاج مراجعة' : 'Published instantly — no review needed'}
                            </p>
                        </div>
                    </div>
                </div>` : `
                <!-- RIGHT: post panel -->
                <div class="job-post-panel">
                    <div class="job-post-header">
                        <h3><i class="fa-solid fa-plus" style="color:var(--g4);margin-${isAR?'left':'right'}:8px;"></i>${isAR ? 'أضف وظيفة' : 'Post a Job'}</h3>
                        <p>${isAR ? 'شارك فرصة وظيفية مع المجتمع' : 'Share a job opportunity with the community'}</p>
                    </div>
                    <div class="job-post-body">
                        <div class="job-field">
                            <label>${isAR ? 'المسمى الوظيفي *' : 'Job Title *'}</label>
                            <input type="text" id="jTitle" placeholder="${isAR ? 'مثال: محلل GIS' : 'e.g. GIS Analyst'}">
                        </div>
                        <div class="job-field">
                            <label>${isAR ? 'اسم الشركة / الجهة *' : 'Company / Organization *'}</label>
                            <input type="text" id="jCompany" placeholder="${isAR ? 'مثال: وزارة التخطيط' : 'e.g. Ministry of Planning'}">
                        </div>
                        <div class="job-field">
                            <label>${isAR ? 'الموقع' : 'Location'}</label>
                            <input type="text" id="jLocation" placeholder="${isAR ? 'مثال: القاهرة، مصر' : 'e.g. Cairo, Egypt'}">
                        </div>
                        <div class="job-field">
                            <label>${isAR ? 'نوع الوظيفة' : 'Job Type'}</label>
                            <select id="jType">
                                <option value="">${isAR ? '— اختر —' : '— Select —'}</option>
                                <option value="${isAR?'دوام كامل':'Full-time'}">${isAR ? 'دوام كامل' : 'Full-time'}</option>
                                <option value="${isAR?'دوام جزئي':'Part-time'}">${isAR ? 'دوام جزئي' : 'Part-time'}</option>
                                <option value="${isAR?'عن بُعد':'Remote'}">${isAR ? 'عن بُعد' : 'Remote'}</option>
                                <option value="${isAR?'تدريب':'Internship'}">${isAR ? 'تدريب / Internship' : 'Internship'}</option>
                                <option value="${isAR?'فريلانس':'Freelance'}">${isAR ? 'فريلانس' : 'Freelance'}</option>
                            </select>
                        </div>
                        <div class="job-field">
                            <label>${isAR ? 'وصف الوظيفة *' : 'Job Description *'}</label>
                            <textarea id="jDesc" placeholder="${isAR ? 'المهام، المتطلبات، وطريقة التقديم...' : 'Responsibilities, requirements, how to apply...'}"></textarea>
                        </div>
                        <div class="job-field">
                            <label>${isAR ? 'رابط التقديم (اختياري)' : 'Apply Link (optional)'}</label>
                            <input type="url" id="jLink" placeholder="https://...">
                        </div>
                        <button class="btn-post-job" id="btnPostJob" onclick="submitJob()">
                            <i class="fa-solid fa-paper-plane"></i>
                            ${isAR ? 'نشر الوظيفة' : 'Post Job'}
                        </button>
                        <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:2px;">
                            <i class="fa-solid fa-circle-info"></i>
                            ${isAR ? 'وظيفتك تظهر في اللوحة بعد مراجعة وموافقة الإدارة' : 'Your job appears on the board after admin review & approval'}
                        </p>
                    </div>
                </div>`;

            area.innerHTML = `
            <div class="page-header" style="margin-bottom:18px;">
                <h2>${isAR ? 'لوحة الوظائف' : 'Job Board'}</h2>
                <p>${isAR ? 'فرص وظيفية في مجال الخرائط وتحليل البيانات — شاركها مع المجتمع' : 'GIS & mapping job opportunities — share them with the community'}</p>
            </div>

            <div class="jobs-layout">
                <!-- LEFT: feed -->
                <div class="job-feed">
                    <div class="job-feed-header">
                        <i class="fa-solid fa-briefcase" style="color:var(--g4);font-size:16px;"></i>
                        <h3>${isAR ? 'الوظائف المتاحة' : 'Available Positions'}</h3>
                        <span class="job-count-badge" id="jobCountBadge">0</span>
                    </div>
                    <div class="job-feed-list" id="jobFeedList">
                        <div style="text-align:center;padding:40px;color:var(--muted);">
                            <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i>
                        </div>
                    </div>
                </div>

                ${rightPanel}
            </div>`;

            // Start real-time listener
            if (_jobsUnsubscribe) _jobsUnsubscribe();
            const handleJobs = (jobs) => {
                renderJobFeed(jobs, isAR);
                if (isAdmin) renderJobRequests(jobs, isAR);
            };
            if (window._loadJobsRealtime) {
                _jobsUnsubscribe = window._loadJobsRealtime(handleJobs);
            } else {
                // fallback: static load
                try {
                    const jobs = await window._loadJobs();
                    handleJobs(jobs);
                } catch(e) {
                    document.getElementById('jobFeedList').innerHTML = `<div class="job-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>${isAR?'خطأ في التحميل':'Loading error'}</p></div>`;
                }
            }
        }

        function switchJobTab(tab) {
            const panel1 = document.getElementById('adminJobTabPanel1');
            const panel2 = document.getElementById('adminJobTabPanel2');
            const btn1 = document.getElementById('adminJobTab1');
            const btn2 = document.getElementById('adminJobTab2');
            if (!panel1 || !panel2) return;
            if (tab === 1) {
                panel1.style.display = '';
                panel2.style.display = 'none';
                if (btn1) { btn1.style.background = 'rgba(var(--brand-rgb,30,122,52),0.12)'; btn1.style.borderBottomColor = 'var(--green4)'; btn1.style.color = 'var(--text)'; }
                if (btn2) { btn2.style.background = 'none'; btn2.style.borderBottomColor = 'transparent'; btn2.style.color = 'var(--muted)'; }
            } else {
                panel1.style.display = 'none';
                panel2.style.display = '';
                if (btn2) { btn2.style.background = 'rgba(var(--brand-rgb,30,122,52),0.12)'; btn2.style.borderBottomColor = 'var(--green4)'; btn2.style.color = 'var(--text)'; }
                if (btn1) { btn1.style.background = 'none'; btn1.style.borderBottomColor = 'transparent'; btn1.style.color = 'var(--muted)'; }
            }
        }
        window.switchJobTab = switchJobTab;

        function renderJobFeed(jobs, isAR) {
            const list = document.getElementById('jobFeedList');
            const badge = document.getElementById('jobCountBadge');
            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const currentUid = window._userData?.uid || '';
            const isAdmin = window._isAdmin === true;

            // Public feed: approved jobs for everyone, plus the student's own pending/rejected jobs (with a status badge)
            const visibleJobs = jobs.filter(j => {
                const status = j.status || 'approved';
                if (status === 'approved') return true;
                return !isAdmin && j.authorUid === currentUid;
            });

            if (badge) badge.textContent = visibleJobs.filter(j => (j.status || 'approved') === 'approved').length;

            if (!list) return;
            if (!visibleJobs.length) {
                list.innerHTML = `<div class="job-empty">
                    <i class="fa-solid fa-briefcase"></i>
                    <p>${isAR ? 'لا توجد وظائف منشورة بعد.<br>كن أول من ينشر فرصة!' : 'No jobs posted yet.<br>Be the first to share an opportunity!'}</p>
                </div>`;
                return;
            }

            list.innerHTML = visibleJobs.map(j => {
                const letter = (j.authorName || 'U')[0].toUpperCase();
                const canDelete = isAdmin || j.authorUid === currentUid;
                const status = j.status || 'approved';
                const isAdminPost = j.isAdminPost === true || j.authorName === 'Atlasya Team';
                const timeStr = j.createdAt?.toDate
                    ? j.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US', {day:'numeric',month:'short',year:'numeric'})
                    : '';

                const tags = [];
                if (j.location) tags.push(`<span class="job-tag"><i class="fa-solid fa-location-dot" style="font-size:11px;"></i> ${j.location}</span>`);
                if (j.type) tags.push(`<span class="job-tag type">${j.type}</span>`);
                if (status === 'pending')  tags.push(`<span class="job-status-badge pending"><i class="fa-solid fa-clock"></i> ${isAR?'قيد المراجعة':'Pending Review'}</span>`);
                if (status === 'rejected') tags.push(`<span class="job-status-badge rejected"><i class="fa-solid fa-circle-xmark"></i> ${isAR?'مرفوضة':'Rejected'}</span>`);

                const adminBadge = isAdminPost ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--green4);background:rgba(var(--brand-rgb,30,122,52),0.12);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);padding:2px 8px;border-radius:99px;margin-${isAR?'right':'left'}:6px;vertical-align:middle;"><i class="fa-solid fa-shield-check" style="font-size:9px;"></i> ${isAR?'الإدارة':'Admin'}</span>` : '';

                return `<div class="job-card">
                    ${canDelete ? `<button class="job-delete-btn" onclick="deleteJob('${j.id}', event)" title="${isAR?'حذف':'Delete'}"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                    <div class="job-card-top">
                        <div class="job-avatar" style="${isAdminPost?'background:linear-gradient(135deg,var(--green2),var(--green4));':''}">${isAdminPost?'<i class="fa-solid fa-shield-check" style="font-size:14px;"></i>':letter}</div>
                        <div class="job-card-meta">
                            <div class="job-author-row">
                                <span class="job-author">${j.authorName || 'Member'}${adminBadge}</span>
                                <span class="job-time">${timeStr}</span>
                            </div>
                            <div class="job-title">${j.title}</div>
                            <div class="job-company"><i class="fa-solid fa-building" style="font-size:11px;margin-${isAR?'left':'right'}:5px;"></i>${j.company}</div>
                        </div>
                    </div>
                    <div style="font-size:13px;color:var(--muted);line-height:1.65;margin-top:10px;white-space:pre-wrap;">${j.desc}</div>
                    ${tags.length ? `<div class="job-tags">${tags.join('')}</div>` : ''}
                    ${j.link ? `<a href="${j.link}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:700;color:var(--g4);text-decoration:none;background:rgba(var(--brand-rgb,30,122,52),0.1);padding:5px 12px;border-radius:8px;border:1px solid rgba(var(--brand-rgb,30,122,52),0.2);"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i>${isAR?'تقدم للوظيفة':'Apply Now'}</a>` : ''}
                </div>`;
            }).join('');
        }

        function renderJobRequests(jobs, isAR) {
            const list = document.getElementById('jobRequestsList');
            const badge = document.getElementById('jobRequestsBadge');
            if (!list) return;

            const pending = jobs.filter(j => (j.status || 'approved') === 'pending');
            if (badge) badge.textContent = pending.length;

            if (!pending.length) {
                list.innerHTML = `<div class="job-empty">
                    <i class="fa-solid fa-inbox"></i>
                    <p>${isAR ? 'لا توجد طلبات نشر جديدة حالياً' : 'No new job post requests right now'}</p>
                </div>`;
                return;
            }

            list.innerHTML = pending.map(j => {
                const timeStr = j.createdAt?.toDate
                    ? j.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US', {day:'numeric',month:'short',year:'numeric'})
                    : '';
                const tags = [];
                if (j.location) tags.push(`<span class="job-tag"><i class="fa-solid fa-location-dot" style="font-size:11px;"></i> ${j.location}</span>`);
                if (j.type) tags.push(`<span class="job-tag type">${j.type}</span>`);

                return `<div class="job-request-card">
                    <div class="job-author-row">
                        <span class="job-author">${j.authorName || 'Member'}</span>
                        <span class="job-time">${timeStr}</span>
                    </div>
                    ${j.authorEmail ? `<div style="font-size:11px;color:var(--muted);margin-bottom:6px;"><i class="fa-regular fa-envelope" style="font-size:11px;"></i> ${j.authorEmail}</div>` : ''}
                    <div class="job-title">${j.title}</div>
                    <div class="job-company"><i class="fa-solid fa-building" style="font-size:11px;margin-${isAR?'left':'right'}:5px;"></i>${j.company}</div>
                    <div style="font-size:13px;color:var(--muted);line-height:1.65;margin-top:8px;white-space:pre-wrap;">${j.desc}</div>
                    ${tags.length ? `<div class="job-tags">${tags.join('')}</div>` : ''}
                    ${j.link ? `<a href="${j.link}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:700;color:var(--g4);text-decoration:none;background:rgba(var(--brand-rgb,30,122,52),0.1);padding:5px 12px;border-radius:8px;border:1px solid rgba(var(--brand-rgb,30,122,52),0.2);"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i>${isAR?'رابط التقديم':'Apply Link'}</a>` : ''}
                    <div class="job-request-actions">
                        <button class="job-approve-btn" onclick="approveJob('${j.id}')"><i class="fa-solid fa-check"></i> ${isAR?'قبول':'Approve'}</button>
                        <button class="job-refuse-btn" onclick="refuseJob('${j.id}')"><i class="fa-solid fa-xmark"></i> ${isAR?'رفض':'Refuse'}</button>
                    </div>
                </div>`;
            }).join('');
        }

        async function approveJob(jobId) {
            const isAR = lang === 'AR';
            try {
                await window._updateJobStatus(jobId, 'approved');
                showToast(isAR ? '✓ تم قبول الوظيفة ونشرها' : '✓ Job approved and published');
            } catch(e) {
                showToast(isAR ? 'حدث خطأ' : 'Something went wrong', true);
            }
        }

        async function refuseJob(jobId) {
            const isAR = lang === 'AR';
            try {
                await window._updateJobStatus(jobId, 'rejected');
                showToast(isAR ? '✓ تم رفض الوظيفة' : '✓ Job refused');
            } catch(e) {
                showToast(isAR ? 'حدث خطأ' : 'Something went wrong', true);
            }
        }

        async function submitJob() {
            const isAR = lang === 'AR';
            const title   = document.getElementById('jTitle')?.value.trim();
            const company = document.getElementById('jCompany')?.value.trim();
            const desc    = document.getElementById('jDesc')?.value.trim();
            const location= document.getElementById('jLocation')?.value.trim();
            const type    = document.getElementById('jType')?.value;
            const link    = document.getElementById('jLink')?.value.trim();

            if (!title)   { showToast(isAR?'أدخل المسمى الوظيفي':'Enter job title', true); return; }
            if (!company) { showToast(isAR?'أدخل اسم الشركة':'Enter company name', true); return; }
            if (!desc)    { showToast(isAR?'أدخل وصف الوظيفة':'Enter job description', true); return; }

            const btn = document.getElementById('btnPostJob');
            if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`; }

            try {
                await window._postJob({ title, company, desc, location, type, link });
                // Clear fields
                ['jTitle','jCompany','jDesc','jLocation','jLink'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                const sel = document.getElementById('jType');
                if (sel) sel.value = '';
                if (window._isAdmin) {
                    showToast(isAR ? '✓ تم نشر الوظيفة بنجاح' : '✓ Job posted successfully');
                } else {
                    showToast(isAR ? '✓ تم إرسال الوظيفة للمراجعة، وستظهر في اللوحة بعد موافقة الإدارة' : '✓ Job submitted for review and will appear once approved by admin');
                }
            } catch(e) {
                showToast(isAR ? 'خطأ في النشر' : 'Failed to post job', true);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${isAR?'نشر الوظيفة':'Post Job'}`;
                }
            }
        }

        async function deleteJob(jobId, e) {
            e.stopPropagation();
            const isAR = lang === 'AR';
            if (!confirm(isAR ? 'حذف هذه الوظيفة؟' : 'Delete this job?')) return;
            try {
                await window._deleteJob(jobId);
                showToast(isAR ? '✓ تم الحذف' : '✓ Deleted');
            } catch(err) {
                showToast(isAR ? 'خطأ في الحذف' : 'Delete failed', true);
            }
        }

        /* ─── CV BUILDER (Pro feature) ─── */
        async function renderCVBuilder(area) {
            const isAR = lang === 'AR';
            const isAdmin = window._isAdmin === true;
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);

            if (isAdmin) {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR ? 'عمل CV' : 'Build CV'}</h2>
                    <p>${isAR ? 'مراجعة طلبات إنشاء السير الذاتية' : 'Review incoming CV build requests'}</p>
                </div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                    <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin:0;">
                        <i class="fa-solid fa-file-invoice" style="color:var(--gold3);"></i>
                        ${isAR ? 'طلبات عمل CV' : 'CV Build Requests'}
                        <span id="cvReqCountBadge" style="background:var(--gold3);color:#000;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;"></span>
                    </h4>
                    <button onclick="adminLoadCVRequests()" style="margin-right:auto;display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:10px;color:var(--gold3);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(212,160,23,0.22)'" onmouseout="this.style.background='rgba(212,160,23,0.1)'">
                        <i class="fa-solid fa-rotate"></i> ${isAR ? 'تحديث' : 'Refresh'}
                    </button>
                </div>
                <div id="cvRequestsList" style="display:flex;flex-direction:column;gap:8px;">
                    <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>`;
                setTimeout(() => adminLoadCVRequests(), 100);
                return;
            }

            if (!isPro) {
                const d = window._userData || {};
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR ? 'عمل CV' : 'Build CV'}</h2>
                    <p>${isAR ? 'سيرة ذاتية احترافية تتخطى أنظمة فرز السير الذاتية (ATS)' : 'A professional CV that passes Applicant Tracking Systems (ATS)'}</p>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:50px 24px;background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.25);border-radius:18px;max-width:520px;margin:0 auto;">
                    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:26px;color:#000;">
                        <i class="fa-solid fa-file-invoice"></i>
                    </div>
                    <div style="font-size:16px;font-weight:700;color:var(--gold3);">${isAR ? 'عمل CV مجاني متاح لأعضاء Pro' : 'Free CV building is a Pro feature'}</div>
                    <div style="font-size:13px;color:var(--muted);line-height:1.7;">${isAR ? 'ابعتلنا بياناتك وهنجهزلك سيرة ذاتية احترافية مصممة عشان تعدي أنظمة فرز السير الذاتية (ATS) وتزود فرصتك في القبول.' : 'Send us your data and our team will prepare a professional CV designed to pass ATS systems and boost your chances of getting hired.'}</div>
                    <button onclick="goSettings('plan')" style="margin-top:6px;padding:10px 22px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:10px;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
                        <i class="fa-solid fa-arrow-up"></i> ${isAR ? 'ترقية إلى Pro' : 'Upgrade to Pro'}
                    </button>
                </div>`;
                return;
            }

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'عمل CV' : 'Build CV'}</h2>
                <p>${isAR ? 'ابعتلنا بياناتك وهنجهزلك سيرة ذاتية احترافية تعدي أنظمة ATS' : 'Send us your data and we will prepare a professional ATS-friendly CV for you'}</p>
            </div>
            <div id="cvStatusBanner"></div>
            <div class="form-card" style="margin-top:16px;">
                <h3><i class="fa-solid fa-user" style="color:var(--gold3);margin-${isAR?'left':'right'}:8px;"></i>${isAR?'البيانات الشخصية':'Personal Information'}</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>${isAR?'الاسم بالكامل *':'Full Name *'}</label>
                        <input type="text" id="cvFullName" placeholder="${isAR?'مثال: محمد أحمد علي':'e.g. John Smith'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'البريد الإلكتروني *':'Email *'}</label>
                        <input type="email" id="cvEmail" placeholder="name@example.com">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'رقم الهاتف *':'Phone *'}</label>
                        <input type="tel" id="cvPhone" placeholder="+201xxxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'المدينة / العنوان':'City / Address'}</label>
                        <input type="text" id="cvAddress" placeholder="${isAR?'مثال: الجيزة، مصر':'e.g. Giza, Egypt'}">
                    </div>
                    <div class="form-group">
                        <label>LinkedIn</label>
                        <input type="url" id="cvLinkedin" placeholder="https://linkedin.com/in/...">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'بورتفوليو / GitHub':'Portfolio / GitHub'}</label>
                        <input type="url" id="cvPortfolio" placeholder="https://...">
                    </div>
                    <div class="form-group full">
                        <label>${isAR?'المسمى الوظيفي المستهدف *':'Target Job Title *'}</label>
                        <input type="text" id="cvTargetTitle" placeholder="${isAR?'مثال: محلل نظم معلومات جغرافية (GIS Analyst)':'e.g. GIS Analyst'}">
                    </div>
                    <div class="form-group full">
                        <label>${isAR?'نبذة مختصرة (Summary)':'Professional Summary'}</label>
                        <textarea id="cvSummary" style="height:80px;" placeholder="${isAR?'جملتين أو ثلاثة عن خبرتك وأهدافك المهنية...':'Two or three sentences about your experience and career goals...'}"></textarea>
                    </div>
                </div>
            </div>
            <div class="form-card">
                <h3><i class="fa-solid fa-graduation-cap" style="color:var(--gold3);margin-${isAR?'left':'right'}:8px;"></i>${isAR?'التعليم':'Education'}</h3>
                <div class="form-group full">
                    <label>${isAR?'المؤهلات الدراسية *':'Education History *'}</label>
                    <textarea id="cvEducation" style="height:100px;" placeholder="${isAR?'مثال:\nبكالوريوس هندسة المساحة — جامعة القاهرة — 2024 — جيد جداً':'e.g.\nBSc in Surveying Engineering — Cairo University — 2024 — Very Good'}"></textarea>
                </div>
            </div>
            <div class="form-card">
                <h3><i class="fa-solid fa-briefcase" style="color:var(--gold3);margin-${isAR?'left':'right'}:8px;"></i>${isAR?'الخبرات العملية':'Work Experience'}</h3>
                <div class="form-group full">
                    <label>${isAR?'الخبرات / التدريبات (لو موجودة)':'Experience / Internships (if any)'}</label>
                    <textarea id="cvExperience" style="height:110px;" placeholder="${isAR?'مثال:\nمحلل GIS متدرب — شركة كذا — 2024 إلى الآن\n- إعداد خرائط باستخدام ArcGIS\n- تحليل بيانات مكانية':'e.g.\nGIS Analyst Intern — Company X — 2024–Present\n- Produced maps using ArcGIS\n- Analyzed spatial datasets'}"></textarea>
                </div>
            </div>
            <div class="form-card">
                <h3><i class="fa-solid fa-star" style="color:var(--gold3);margin-${isAR?'left':'right'}:8px;"></i>${isAR?'المهارات واللغات':'Skills & Languages'}</h3>
                <div class="form-grid">
                    <div class="form-group full">
                        <label>${isAR?'المهارات *':'Skills *'}</label>
                        <textarea id="cvSkills" style="height:70px;" placeholder="${isAR?'مثال: ArcGIS, QGIS, Remote Sensing, AutoCAD, Python':'e.g. ArcGIS, QGIS, Remote Sensing, AutoCAD, Python'}"></textarea>
                    </div>
                    <div class="form-group">
                        <label>${isAR?'اللغات':'Languages'}</label>
                        <input type="text" id="cvLanguages" placeholder="${isAR?'مثال: العربية (لغة أم)، الإنجليزية (متقدم)':'e.g. Arabic (Native), English (Advanced)'}">
                    </div>
                    <div class="form-group">
                        <label>${isAR?'الشهادات والدورات':'Certifications'}</label>
                        <input type="text" id="cvCertifications" placeholder="${isAR?'مثال: شهادة GIS من NARSS':'e.g. GIS Certificate from NARSS'}">
                    </div>
                    <div class="form-group full">
                        <label>${isAR?'رفع صور/ملفات الشهادات (اختياري)':'Upload Certificate Files (optional)'}</label>
                        <div class="portfolio-upload-zone" id="cvCertDropZone" onclick="document.getElementById('cvCertFile').click()">
                            <i class="fa-solid fa-certificate"></i>
                            <p id="cvCertDropZoneTxt">${isAR?'اضغط لرفع صورة أو ملف PDF للشهادة (يمكن اختيار أكثر من ملف)':'Click to upload a certificate image or PDF (multiple files allowed)'}</p>
                            <input type="file" id="cvCertFile" style="display:none;" accept=".png,.jpg,.jpeg,.pdf" multiple onchange="handleCVCertFile(event)">
                        </div>
                        <div id="cvCertProgressWrap" style="display:none;margin-top:8px;">
                            <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                                <div id="cvCertProgressBar" style="height:100%;width:0%;background:linear-gradient(135deg,var(--gold3),var(--gold2));transition:width 0.15s ease;"></div>
                            </div>
                            <p id="cvCertProgressTxt" style="font-size:11px;color:var(--text-dim);margin-top:4px;"></p>
                        </div>
                        <div id="cvCertFilesList" style="display:flex;flex-direction:column;gap:6px;margin-top:10px;"></div>
                    </div>
                    <div class="form-group full">
                        <label>${isAR?'ملاحظات إضافية':'Additional Notes'}</label>
                        <textarea id="cvNotes" style="height:70px;" placeholder="${isAR?'أي معلومات تانية حابب تضيفها...':'Any other information you would like to add...'}"></textarea>
                    </div>
                </div>
                <div class="btn-row" style="margin-top:10px;">
                    <button class="btn-save" id="cvSubmitBtn" onclick="submitCVRequest()">
                        <i class="fa-solid fa-paper-plane"></i>
                        <span id="cvSubmitBtnTxt">${isAR?'إرسال بياناتي':'Send My Data'}</span>
                    </button>
                </div>
            </div>`;

            // Load any existing submission to prefill + show status
            cvCertFilesData = [];
            renderCVCertFilesList();
            try {
                const existing = await window._loadMyCVRequest();
                const dCV = existing || {};
                const dUser = window._userData || {};
                const fullNameDefault = ((dUser.firstName||'') + ' ' + (dUser.lastName||'')).trim();
                const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
                setVal('cvFullName', dCV.fullName || fullNameDefault);
                setVal('cvEmail', dCV.email || dUser.email);
                setVal('cvPhone', dCV.phone || dUser.phone);
                setVal('cvAddress', dCV.address);
                setVal('cvLinkedin', dCV.linkedin);
                setVal('cvPortfolio', dCV.portfolio);
                setVal('cvTargetTitle', dCV.targetTitle);
                setVal('cvSummary', dCV.summary);
                setVal('cvEducation', dCV.education);
                setVal('cvExperience', dCV.experience);
                setVal('cvSkills', dCV.skills);
                setVal('cvLanguages', dCV.languages);
                setVal('cvCertifications', dCV.certifications);
                setVal('cvNotes', dCV.notes);
                cvCertFilesData = Array.isArray(dCV.certificateFiles) ? dCV.certificateFiles.slice() : [];
                renderCVCertFilesList();
                if (existing) {
                    window._myCVCreatedAt = existing.createdAt;
                    const statusLabels = {
                        pending:     isAR ? 'تم استلام بياناتك — قيد المراجعة' : 'Your data has been received — pending review',
                        in_progress: isAR ? 'فريقنا بيجهز السيرة الذاتية بتاعتك دلوقتي' : 'Our team is currently preparing your CV',
                        done:        isAR ? 'تم تجهيز سيرتك الذاتية! يمكنك تحميلها من هنا' : 'Your CV is ready! You can download it here',
                    };
                    const statusColors = { pending: 'var(--gold3)', in_progress: 'var(--green4)', done: 'var(--green4)' };
                    const status = dCV.status || 'pending';
                    const banner = document.getElementById('cvStatusBanner');
                    if (banner) {
                        let cvFileBtn = '';
                        if (dCV.hasCvFile) {
                            try {
                                const uid = window._userData?.uid || window._currentUid;
                                const fileDoc = await window._loadCVFile(uid);
                                if (fileDoc?.fileData) {
                                    cvFileBtn = `<a href="${fileDoc.fileData}" download="${fileDoc.fileName || 'CV'}" style="margin-${isAR?'right':'left'}:auto;flex-shrink:0;padding:7px 14px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-download"></i>${isAR?'تحميل الـ CV':'Download CV'}</a>`;
                                }
                            } catch(e) { console.error('load cv file error:', e); }
                        }
                        banner.innerHTML = `
                        <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(var(--brand-rgb,30,122,52),0.07);border:1px solid rgba(var(--brand-rgb,30,122,52),0.25);border-radius:12px;margin-top:16px;flex-wrap:wrap;">
                            <i class="fa-solid fa-circle-check" style="color:${statusColors[status]};font-size:18px;flex-shrink:0;"></i>
                            <div style="font-size:13px;color:var(--text);font-weight:600;">${statusLabels[status]}</div>
                            ${cvFileBtn}
                        </div>`;
                    }
                    const btnTxt = document.getElementById('cvSubmitBtnTxt');
                    if (btnTxt) btnTxt.textContent = isAR ? 'تحديث بياناتي' : 'Update My Data';
                }
            } catch(e) { /* no existing submission, ignore */ }
        }