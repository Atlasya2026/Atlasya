        window.dsSearchGo = function() {
            _dsSearchQ = (document.getElementById('dsSearchInput')?.value || '').trim().toLowerCase();
            if (!_dsSearchQ) { window.dsGoHome(); return; }
            _dsView = { mode:'search', category:null, sub:null, projectId:null, datasetId:null, prevMode:null };
            dsRefresh();
        };
        window.dsSearchKey = function(e) { if (e.key === 'Enter') window.dsSearchGo(); };
        window.dsFilterChange = function() {
            _dsFilters.region = document.getElementById('dsFilterRegion')?.value.trim() || '';
            _dsFilters.fileType = document.getElementById('dsFilterType')?.value || '';
            _dsFilters.coordSystem = document.getElementById('dsFilterCoord')?.value.trim() || '';
            _dsFilters.source = document.getElementById('dsFilterSource')?.value.trim() || '';
            _dsFilters.year = document.getElementById('dsFilterYear')?.value.trim() || '';
            dsRefresh();
        };
        window.dsFilterReset = function() {
            _dsFilters = { region:'', fileType:'', coordSystem:'', source:'', year:'' };
            dsRefresh();
        };

        function dsMatchesFilters(d) {
            if (_dsFilters.region && !((d.region||'').toLowerCase().includes(_dsFilters.region.toLowerCase()))) return false;
            if (_dsFilters.fileType && d.fileType !== _dsFilters.fileType) return false;
            if (_dsFilters.coordSystem && !((d.coordSystem||'').toLowerCase().includes(_dsFilters.coordSystem.toLowerCase()))) return false;
            if (_dsFilters.source && !((d.source||'').toLowerCase().includes(_dsFilters.source.toLowerCase()))) return false;
            if (_dsFilters.year && String(d.year||'') !== String(_dsFilters.year)) return false;
            return true;
        }
        function dsMatchesSearch(d, q) {
            const hay = [d.name, d.nameEn, d.region, d.source, d.description, d.fileType, Array.isArray(d.layers)?d.layers.join(' '):''].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        }

        function renderDatasetsView(area) {
            const isAR = lang === 'AR';
            area = area || document.getElementById('contentArea');
            const header = `
            <div class="page-header">
                <h2>${isAR ? '🗂️ مكتبة البيانات المكانية' : '🗂️ Spatial Data Library'}</h2>
                <p>${isAR ? 'تصفح وحمّل مجموعات البيانات الجغرافية المصنّفة — حدود، طرق، مياه، مبانٍ، تضاريس، صور أقمار صناعية والمزيد' : 'Browse and download organized GIS datasets — boundaries, roads, water, buildings, terrain, satellite imagery and more'}</p>
            </div>
            <div class="ds-search-bar">
                <input type="text" id="dsSearchInput" placeholder="${isAR?'ابحث عن اسم البيانات، الدولة، المصدر...':'Search by dataset name, country, source...'}" value="${_dsSearchQ}" onkeydown="dsSearchKey(event)">
                <button onclick="dsSearchGo()"><i class="fa-solid fa-magnifying-glass"></i> ${isAR?'بحث':'Search'}</button>
            </div>`;

            let body = '';
            if (_dsView.mode === 'home') body = dsHomeHTML(isAR);
            else if (_dsView.mode === 'category') body = dsCategoryViewHTML(isAR);
            else if (_dsView.mode === 'project') body = dsProjectViewHTML(isAR);
            else if (_dsView.mode === 'search') body = dsSearchViewHTML(isAR);
            else if (_dsView.mode === 'detail') body = dsDetailViewHTML(isAR);

            area.innerHTML = header + body;
        }

        function dsHomeHTML(isAR) {
            let html = '';
            if (_dsProjects.length) {
                html += `
                <div class="connect-section-wrap">
                    <div class="connect-section-title">
                        <span class="brand-pill ts"><i class="fa-solid fa-star"></i> ${isAR?'بيانات جاهزة للمشروعات':'Ready-for-Project Data'}</span>
                    </div>
                    <div class="ds-proj-strip">
                        ${_dsProjects.map(p => dsProjectCardHTML(p, isAR)).join('')}
                    </div>
                </div>`;
            }
            html += `
            <div class="connect-section-wrap">
                <div class="connect-section-title">
                    <span class="brand-pill gis"><i class="fa-solid fa-layer-group"></i> ${isAR?'التصنيفات':'Categories'}</span>
                </div>
                <div class="ds-cat-grid">
                    ${SPATIAL_CATEGORIES.map(c => dsCatCardHTML(c, isAR)).join('')}
                </div>
            </div>`;
            return html;
        }

        function dsCatCardHTML(cat, isAR) {
            const count = _dsAll.filter(d => d.category === cat.key).length;
            return `
            <div class="ds-cat-card" onclick="dsOpenCategory('${cat.key}')">
                <div class="ico">${cat.icon}</div>
                <h4>${isAR?cat.ar:cat.en}</h4>
                <div class="cnt">${count} ${isAR?'مجموعة بيانات':'datasets'}</div>
            </div>`;
        }

        function dsProjectCardHTML(p, isAR) {
            const count = _dsAll.filter(d => Array.isArray(d.projects) && d.projects.includes(p.id)).length;
            return `
            <div class="ds-proj-card" onclick="dsOpenProject('${p.id}')">
                <div class="ico">${p.icon || '⭐'}</div>
                <h4>${escapeHtmlAC(isAR ? (p.name||'') : (p.nameEn||p.name||''))}</h4>
                <p>${escapeHtmlAC((isAR ? (p.description||'') : (p.descriptionEn||p.description||'')).slice(0,80))}</p>
                <div class="cnt"><i class="fa-solid fa-database"></i> ${count} ${isAR?'ملف':'files'}</div>
            </div>`;
        }

        function dsBreadcrumbHTML(items) {
            return `<div class="ds-breadcrumb">${items.map((it,i) => `${i>0?'<i class="fa-solid fa-chevron-left" style="font-size:9px;"></i>':''}<span class="${it.onclick?'crumb':''}" ${it.onclick?`onclick="${it.onclick}"`:''}>${it.label}</span>`).join('')}</div>`;
        }

        function dsFiltersBarHTML(isAR) {
            return `
            <div class="ds-filters-bar">
                <input type="text" id="dsFilterRegion" placeholder="${isAR?'الدولة / المحافظة':'Country / Governorate'}" value="${_dsFilters.region}" onchange="dsFilterChange()">
                <select id="dsFilterType" onchange="dsFilterChange()">
                    <option value="">${isAR?'كل أنواع الملفات':'All File Types'}</option>
                    ${SPATIAL_FILE_TYPES.map(t => `<option value="${t}" ${_dsFilters.fileType===t?'selected':''}>${t}</option>`).join('')}
                </select>
                <input type="text" id="dsFilterCoord" placeholder="${isAR?'نظام الإحداثيات':'Coordinate System'}" value="${_dsFilters.coordSystem}" onchange="dsFilterChange()">
                <input type="text" id="dsFilterSource" placeholder="${isAR?'مصدر البيانات':'Data Source'}" value="${_dsFilters.source}" onchange="dsFilterChange()">
                <input type="number" id="dsFilterYear" placeholder="${isAR?'السنة':'Year'}" value="${_dsFilters.year}" onchange="dsFilterChange()" style="width:90px;">
                <button class="ds-reset-btn" onclick="dsFilterReset()"><i class="fa-solid fa-rotate-left"></i> ${isAR?'إعادة تعيين':'Reset'}</button>
            </div>`;
        }

        function dsCategoryViewHTML(isAR) {
            const cat = scFindCat(_dsView.category);
            if (!cat) return dsHomeHTML(isAR);
            let items = _dsAll.filter(d => d.category === cat.key);
            items = items.filter(dsMatchesFilters);

            const crumbs = dsBreadcrumbHTML([
                { label: isAR?'الرئيسية':'Home', onclick:'dsGoHome()' },
                { label: scCatLabel(cat, isAR) },
            ]);

            return `
            ${crumbs}
            <div class="page-header" style="margin-bottom:10px;">
                <h2 style="font-size:18px;">${scCatLabel(cat, isAR)}</h2>
            </div>
            ${dsFiltersBarHTML(isAR)}
            ${dsGridHTML(items, isAR)}`;
        }

        function dsProjectViewHTML(isAR) {
            const p = _dsProjects.find(x => x.id === _dsView.projectId);
            if (!p) return dsHomeHTML(isAR);
            const items = _dsAll.filter(d => Array.isArray(d.projects) && d.projects.includes(p.id)).filter(dsMatchesFilters);
            const crumbs = dsBreadcrumbHTML([
                { label: isAR?'الرئيسية':'Home', onclick:'dsGoHome()' },
                { label: (isAR ? p.name : (p.nameEn||p.name)) || '' },
            ]);
            return `
            ${crumbs}
            <div class="page-header" style="margin-bottom:10px;">
                <h2 style="font-size:18px;">${p.icon||'⭐'} ${escapeHtmlAC(isAR?(p.name||''):(p.nameEn||p.name||''))}</h2>
                <p>${escapeHtmlAC(isAR?(p.description||''):(p.descriptionEn||p.description||''))}</p>
            </div>
            ${dsFiltersBarHTML(isAR)}
            ${dsGridHTML(items, isAR)}`;
        }

        function dsSearchViewHTML(isAR) {
            const items = _dsAll.filter(d => dsMatchesSearch(d, _dsSearchQ)).filter(dsMatchesFilters);
            const crumbs = dsBreadcrumbHTML([
                { label: isAR?'الرئيسية':'Home', onclick:'dsGoHome()' },
                { label: isAR?`نتائج البحث: "${_dsSearchQ}"`:`Search results: "${_dsSearchQ}"` },
            ]);
            return `
            ${crumbs}
            ${dsFiltersBarHTML(isAR)}
            ${dsGridHTML(items, isAR)}`;
        }

        function dsGridHTML(items, isAR) {
            if (!items.length) {
                return `<div class="ds-empty"><i class="fa-solid fa-box-open" style="font-size:24px;margin-bottom:8px;display:block;"></i>${isAR?'لا توجد بيانات مطابقة حالياً':'No matching datasets yet'}</div>`;
            }
            return `<div class="datasets-grid">${items.map(d => dsCardHTML(d, isAR)).join('')}</div>`;
        }

        function dsCardHTML(d, isAR) {
            const sub = scFindSub(d.category, d.subcategory);
            return `
            <a href="javascript:void(0)" onclick="dsOpenDataset('${d.id}')" oncontextmenu="return window._blockCopyAttempt(event);" class="dataset-card">
                ${d.previewImage ? `<img src="${d.previewImage}" style="width:100%;height:100px;object-fit:cover;border-radius:12px;margin-bottom:-2px;">` : ''}
                <div class="ds-top">
                    <div class="ds-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                    <span class="ds-badge">${escapeHtmlAC(d.fileType||'')}</span>
                </div>
                <div class="ds-info">
                    <h4>${escapeHtmlAC(isAR ? (d.name||'') : (d.nameEn||d.name||''))}</h4>
                    <div style="font-size:11px;color:var(--muted);margin-top:4px;">${escapeHtmlAC(d.region||'')}${sub?` · ${escapeHtmlAC(isAR?sub.ar:sub.en)}`:''}</div>
                    ${Array.isArray(d.layers) && d.layers.length > 1 ? `<div style="font-size:10.5px;color:var(--gold3);margin-top:5px;font-weight:700;"><i class="fa-solid fa-layer-group"></i> ${d.layers.length} ${isAR?'طبقات':'layers'}</div>` : ''}
                </div>
                <div class="ds-dl"><i class="fa-solid fa-circle-info"></i><span>${isAR?'التفاصيل':'View Details'}</span></div>
            </a>`;
        }

        function dsDetailViewHTML(isAR) {
            const d = _dsAll.find(x => x.id === _dsView.datasetId);
            if (!d) return dsHomeHTML(isAR);
            const sub = scFindSub(d.category, d.subcategory);
            const cat = scFindCat(d.category);
            const meta = [
                { lbl: isAR?'المنطقة':'Region', val: d.region },
                { lbl: isAR?'التصنيف':'Category', val: cat ? (isAR?cat.ar:cat.en) + (sub?` — ${isAR?sub.ar:sub.en}`:'') : '' },
                { lbl: isAR?'نوع الملف':'File Type', val: d.fileType },
                { lbl: isAR?'نظام الإحداثيات':'Coordinate System', val: d.coordSystem },
                { lbl: isAR?'مقياس الدقة':'Resolution', val: d.resolution },
                { lbl: isAR?'حجم الملف':'File Size', val: d.fileSize },
                { lbl: isAR?'تاريخ التحديث':'Updated', val: d.updateDate },
                { lbl: isAR?'مصدر البيانات':'Source', val: d.source },
                { lbl: isAR?'عدد مرات التحميل':'Downloads', val: d.downloads || 0 },
            ].filter(m => m.val);

            return `
            <div class="ds-breadcrumb" style="margin-bottom:14px;"><span class="crumb" onclick="dsBack()"><i class="fa-solid fa-arrow-right"></i> ${isAR?'رجوع':'Back'}</span></div>
            <div class="dd-wrap">
                ${d.previewImage ? `<img src="${d.previewImage}" class="dd-preview">` : ''}
                <div class="dd-body">
                    <div class="dd-title">${escapeHtmlAC(isAR ? (d.name||'') : (d.nameEn||d.name||''))}</div>
                    ${d.description ? `<div class="dd-desc">${escapeHtmlAC(d.description)}</div>` : ''}
                    ${Array.isArray(d.layers) && d.layers.length ? `
                    <div style="margin:14px 0;">
                        <div style="font-size:12px;font-weight:800;color:var(--gold3);margin-bottom:8px;"><i class="fa-solid fa-layer-group"></i> ${isAR?`الطبقات المُضمّنة (${d.layers.length})`:`Included Layers (${d.layers.length})`}</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;">
                            ${d.layers.map(l => `<span style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;">${escapeHtmlAC(l)}</span>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="dd-meta-grid">
                        ${meta.map(m => `<div class="dd-meta-item"><div class="lbl">${m.lbl}</div><div class="val">${escapeHtmlAC(String(m.val))}</div></div>`).join('')}
                    </div>
                    <button class="dd-dl-btn" onclick="handleDatasetDownload('${d.id}')"><i class="fa-solid fa-download"></i> ${isAR?'تحميل البيانات':'Download Dataset'}</button>
                </div>
            </div>`;
        }

        window.handleDatasetDownload = async function(id) {
            const isAR = lang === 'AR';
            const d = _dsAll.find(x => x.id === id);
            if (!d || !d.downloadUrl) { showToast(isAR?'لا يوجد رابط تحميل لهذه البيانات':'No download link available for this dataset', true); return; }
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
            a.href = d.downloadUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 300);
            try {
                if (window._incrementDatasetDownload) await window._incrementDatasetDownload(id, d.downloads || 0, d);
                d.downloads = (d.downloads || 0) + 1;
            } catch(e) {}
        };


        /* ─── GIS SOFTWARE TOOLS ─── */
        function dsCardWrap(icon, title, badge, url) {
            return `
            <a href="javascript:void(0)" onclick="handleFileDownload('${url.replace(/'/g,"&#39;")}')" oncontextmenu="return window._blockCopyAttempt(event);" class="dataset-card">
                <div class="ds-top">
                    <div class="ds-icon"><i class="fa-solid ${icon}"></i></div>
                    <span class="ds-badge">${badge}</span>
                </div>
                <div class="ds-info"><h4>${title}</h4></div>
                <div class="ds-dl"><i class="fa-solid fa-download"></i><span>${lang==='AR'?'تحميل':'Download'}</span></div>
            </a>`;
        }

        /* Split card: two separate files, two separate buttons, but together they
        only ever consume ONE slot from the daily download quota */
        function dsCardSplit(icon, title, badge, note, comboId, item1, item2) {
            return `
            <div class="dataset-card split" oncontextmenu="return window._blockCopyAttempt(event);">
                <div class="ds-top">
                    <div class="ds-icon"><i class="fa-solid ${icon}"></i></div>
                    <span class="ds-badge">${badge}</span>
                </div>
                <div class="ds-info"><h4>${title}</h4>${note ? `<div class="ds-combo-note">${note}</div>` : ''}</div>
                <div class="ds-dl-group">
                    <button type="button" class="ds-dl-mini" onclick="handleFileDownloadPair('${item1.url.replace(/'/g,"&#39;")}','${comboId}')" oncontextmenu="return window._blockCopyAttempt(event);"><i class="fa-solid fa-download"></i><span>${item1.label}</span></button>
                    <button type="button" class="ds-dl-mini" onclick="handleFileDownloadPair('${item2.url.replace(/'/g,"&#39;")}','${comboId}')" oncontextmenu="return window._blockCopyAttempt(event);"><i class="fa-solid fa-download"></i><span>${item2.label}</span></button>
                </div>
            </div>`;
        }

        /* ══════════════════════════════════════════════════════════════
        ─── COURSES SECTION ───
        Connects GIS students with training companies & institutions.
        Firestore collections: courses (status: pending/approved/rejected),
        free_courses (admin-only, always visible).
        ══════════════════════════════════════════════════════════════ */
        let _coursesUnsubscribe = null;
        let _allCourses = [];
        let _allFreeCourses = [];
        let _coursesTab = 'companies'; // 'companies' | 'free'
        let _coursesFilters = { search: '', company: '', level: '', price: '', sort: 'newest' };

        async function renderCourses(area) {
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'الكورسات' : 'Courses'}</h2>
                <p>${isAR ? 'اكتشف كورسات GIS من شركات ومؤسسات تدريبية موثوقة' : 'Discover GIS courses from trusted companies and training institutions'}</p>
            </div>

            <div class="courses-tabs">
                <button class="courses-tab ${_coursesTab==='companies'?'active':''}" onclick="switchCoursesTab('companies')">
                    <i class="fa-solid fa-building"></i> ${isAR ? 'كورسات الشركات' : 'Company Courses'}
                </button>
                <button class="courses-tab ${_coursesTab==='free'?'active':''}" onclick="switchCoursesTab('free')">
                    <i class="fa-solid fa-gift"></i> ${isAR ? 'كورسات مجانية' : 'Free Courses'}
                </button>
            </div>

            <div id="coursesTabBody"></div>`;

            renderCoursesTabBody(isAR);

            // cleanup any previous listener then subscribe
            if (typeof _coursesUnsubscribe === 'function') { _coursesUnsubscribe(); _coursesUnsubscribe = null; }
            if (window._loadCoursesRealtime) {
                _coursesUnsubscribe = window._loadCoursesRealtime((list) => {
                    _allCourses = list.filter(c => c.hidden !== true);
                    if (_coursesTab === 'companies' && window._currentPage === 'courses') renderCoursesTabBody(isAR);
                });
            }
        }

        window.switchCoursesTab = function(tab) {
            _coursesTab = tab;
            document.querySelectorAll('.courses-tab').forEach(b => b.classList.remove('active'));
            const idx = tab === 'companies' ? 0 : 1;
            document.querySelectorAll('.courses-tab')[idx]?.classList.add('active');
            renderCoursesTabBody(lang === 'AR');
        };

        async function renderCoursesTabBody(isAR) {
            const body = document.getElementById('coursesTabBody');
            if (!body) return;

            if (_coursesTab === 'free') {
                body.innerHTML = `<div class="courses-grid" id="freeCoursesGrid">
                    <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;"></i></div>
                </div>`;
                try {
                    _allFreeCourses = await window._loadFreeCourses();
                } catch(e) { _allFreeCourses = []; }
                const grid = document.getElementById('freeCoursesGrid');
                if (!_allFreeCourses.length) {
                    grid.innerHTML = `<div class="job-empty" style="grid-column:1/-1;"><i class="fa-solid fa-gift"></i><p>${isAR?'لا توجد كورسات مجانية حالياً':'No free courses yet'}</p></div>`;
                    return;
                }
                grid.innerHTML = _allFreeCourses.map(c => freeCourseCardHTML(c, isAR)).join('');
                return;
            }

            // Companies tab
            const companies = [...new Set(_allCourses.map(c => c.companyName).filter(Boolean))];
            body.innerHTML = `
            <div class="company-cta-bar">
                <div class="cta-text">${isAR?'أنت شركة أو مؤسسة تدريبية؟':'Are you a company or training institution?'}<span>${isAR?'انشر كورساتك ووصّلها لآلاف طلاب GIS':'Publish your courses and reach thousands of GIS students'}</span></div>
                <button class="company-cta-btn" onclick="openCompanyPortal()"><i class="fa-solid fa-building-shield"></i> ${isAR?'شركة؟ انشر كورسك':'Company? Post a Course'}</button>
            </div>
            <div class="courses-toolbar">
                <div class="courses-search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="coursesSearchInput" placeholder="${isAR?'ابحث عن كورس...':'Search courses...'}" value="${_coursesFilters.search}" oninput="onCoursesFilterChange()">
                </div>
                <select class="courses-select" id="coursesCompanyFilter" onchange="onCoursesFilterChange()">
                    <option value="">${isAR?'كل الشركات':'All Companies'}</option>
                    ${companies.map(c => `<option value="${c}" ${_coursesFilters.company===c?'selected':''}>${c}</option>`).join('')}
                </select>
                <select class="courses-select" id="coursesLevelFilter" onchange="onCoursesFilterChange()">
                    <option value="">${isAR?'كل المستويات':'All Levels'}</option>
                    <option value="مبتدئ" ${_coursesFilters.level==='مبتدئ'?'selected':''}>${isAR?'مبتدئ':'Beginner'}</option>
                    <option value="متوسط" ${_coursesFilters.level==='متوسط'?'selected':''}>${isAR?'متوسط':'Intermediate'}</option>
                    <option value="متقدم" ${_coursesFilters.level==='متقدم'?'selected':''}>${isAR?'متقدم':'Advanced'}</option>
                </select>
                <select class="courses-select" id="coursesPriceFilter" onchange="onCoursesFilterChange()">
                    <option value="">${isAR?'مجاني/مدفوع':'Free/Paid'}</option>
                    <option value="free" ${_coursesFilters.price==='free'?'selected':''}>${isAR?'مجاني':'Free'}</option>
                    <option value="paid" ${_coursesFilters.price==='paid'?'selected':''}>${isAR?'مدفوع':'Paid'}</option>
                </select>
                <select class="courses-select" id="coursesSortFilter" onchange="onCoursesFilterChange()">
                    <option value="newest" ${_coursesFilters.sort==='newest'?'selected':''}>${isAR?'الأحدث':'Newest'}</option>
                    <option value="views" ${_coursesFilters.sort==='views'?'selected':''}>${isAR?'الأكثر مشاهدة':'Most Viewed'}</option>
                    <option value="interest" ${_coursesFilters.sort==='interest'?'selected':''}>${isAR?'الأكثر اهتماماً':'Most Interest'}</option>
                </select>
            </div>
            <div class="courses-grid" id="companyCoursesGrid"></div>`;

            renderFilteredCourseCards(isAR);
        }

        window.onCoursesFilterChange = function() {
            _coursesFilters.search  = document.getElementById('coursesSearchInput')?.value.trim() || '';
            _coursesFilters.company = document.getElementById('coursesCompanyFilter')?.value || '';
            _coursesFilters.level   = document.getElementById('coursesLevelFilter')?.value || '';
            _coursesFilters.price   = document.getElementById('coursesPriceFilter')?.value || '';
            _coursesFilters.sort    = document.getElementById('coursesSortFilter')?.value || 'newest';
            renderFilteredCourseCards(lang === 'AR');
        };

        function renderFilteredCourseCards(isAR) {
            const grid = document.getElementById('companyCoursesGrid');
            if (!grid) return;
            let list = [..._allCourses];
            const f = _coursesFilters;
            if (f.search) {
                const s = f.search.toLowerCase();
                list = list.filter(c => (c.title||'').toLowerCase().includes(s) || (c.companyName||'').toLowerCase().includes(s));
            }
            if (f.company) list = list.filter(c => c.companyName === f.company);
            if (f.level)   list = list.filter(c => c.level === f.level);
            if (f.price === 'free') list = list.filter(c => !c.price || Number(c.price) === 0);
            if (f.price === 'paid') list = list.filter(c => c.price && Number(c.price) > 0);
            if (f.sort === 'views')    list.sort((a,b) => (b.views||0) - (a.views||0));
            else if (f.sort === 'interest') list.sort((a,b) => (b.interestedCount||0) - (a.interestedCount||0));
            else list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

            if (!list.length) {
                grid.innerHTML = `<div class="job-empty" style="grid-column:1/-1;"><i class="fa-solid fa-chalkboard-user"></i><p>${isAR?'لا توجد كورسات مطابقة':'No matching courses'}</p></div>`;
                return;
            }
            grid.innerHTML = list.map(c => courseCardHTML(c, isAR)).join('');
        }

        function courseCardHTML(c, isAR) {
            const isFree = !c.price || Number(c.price) === 0;
            return `
            <div class="course-card" onclick="openCourseDetails('${c.id}')">
                <div class="course-card-top">
                    <div class="course-company-pill"><i class="fa-solid fa-building"></i> ${escapeHtml(c.companyName||'')}</div>
                    <span class="course-price-badge ${isFree?'free':'paid'}">${isFree ? (isAR?'مجاني':'Free') : (isAR?`${c.price} ج.م`:`${c.price} EGP`)}</span>
                </div>
                <h4>${escapeHtml(c.title||'')}</h4>
                <div class="course-desc">${escapeHtml(c.description||'')}</div>
                <div class="course-tags">
                    ${c.level ? `<span class="course-tag"><i class="fa-solid fa-layer-group"></i> ${escapeHtml(c.level)}</span>` : ''}
                    ${c.duration ? `<span class="course-tag"><i class="fa-solid fa-clock"></i> ${escapeHtml(c.duration)}</span>` : ''}
                </div>
                <div class="course-stats-row">
                    <span><i class="fa-solid fa-eye"></i> ${c.views||0}</span>
                    <span><i class="fa-solid fa-user-graduate"></i> ${c.interestedCount||0} ${isAR?'مهتم':'interested'}</span>
                </div>
                <button class="course-view-btn"><i class="fa-solid fa-arrow-${isAR?'left':'right'}"></i> ${isAR?'عرض التفاصيل':'View Details'}</button>
            </div>`;
        }

        function freeCourseCardHTML(c, isAR) {
            return `
            <div class="course-card" onclick="openFreeCourseDetails('${c.id}')">
                <div class="course-card-top">
                    <div class="course-company-pill"><i class="fa-solid fa-graduation-cap"></i> ${escapeHtml(c.source||(isAR?'مصدر مجاني':'Free source'))}</div>
                    <span class="course-price-badge free">${isAR?'مجاني':'Free'}</span>
                </div>
                <h4>${escapeHtml(c.title||'')}</h4>
                <div class="course-desc">${escapeHtml(c.description||'')}</div>
                <div class="course-tags">
                    ${c.hours ? `<span class="course-tag"><i class="fa-solid fa-clock"></i> ${escapeHtml(String(c.hours))} ${isAR?'ساعة':'hrs'}</span>` : ''}
                </div>
                <button class="course-view-btn"><i class="fa-solid fa-arrow-${isAR?'left':'right'}"></i> ${isAR?'عرض التفاصيل':'View Details'}</button>
            </div>`;
        }

        function escapeHtml(str) {
            return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
        }

        function ytEmbedUrl(url) {
            if (!url) return '';
            let id = '';
            try {
                const u = new URL(url);
                if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
                else if (u.searchParams.get('v')) id = u.searchParams.get('v');
                else if (u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1];
            } catch(e) {}
            return id ? `https://www.youtube.com/embed/${id}` : '';
        }

        let _activeCourse = null;

        window.openCourseDetails = function(courseId) {
            const c = _allCourses.find(x => x.id === courseId);
            if (!c) return;
            _activeCourse = c;
            if (window._incrementCourseView) window._incrementCourseView(courseId);
            renderCourseDetailPage(c, false);
        };

        window.openFreeCourseDetails = function(courseId) {
            const c = _allFreeCourses.find(x => x.id === courseId);
            if (!c) return;
            _activeCourse = c;
            renderCourseDetailPage(c, true);
        };

        function renderCourseDetailPage(c, isFree) {
            const isAR = lang === 'AR';
            const area = document.getElementById('contentArea');
            const embed = ytEmbedUrl(c.youtubeUrl);
            const isCourseFree = isFree || !c.price || Number(c.price) === 0;

            const contactItems = !isFree ? [
                c.email    ? { icon:'fa-envelope',   label:isAR?'البريد الإلكتروني':'Email',    href:`mailto:${c.email}` } : null,
                c.phone    ? { icon:'fa-phone',      label:isAR?'الهاتف':'Phone',               href:`tel:${c.phone}` } : null,
                c.whatsapp ? { icon:'fa-brands fa-whatsapp', label:'WhatsApp',                  href:`https://wa.me/${(c.whatsapp||'').replace(/[^0-9]/g,'')}` } : null,
                c.website  ? { icon:'fa-globe',      label:isAR?'الموقع الإلكتروني':'Website',  href:c.website } : null,
                c.facebook ? { icon:'fa-brands fa-facebook', label:'Facebook',                  href:c.facebook } : null,
                c.linkedin ? { icon:'fa-brands fa-linkedin',label:'LinkedIn',                   href:c.linkedin } : null,
                c.instagram? { icon:'fa-brands fa-instagram',label:'Instagram',                 href:c.instagram } : null,
            ].filter(Boolean) : [];

            area.innerHTML = `
            <div class="course-detail-back" onclick="backToCoursesList()"><i class="fa-solid fa-arrow-${isAR?'right':'left'}"></i> ${isAR?'رجوع إلى الكورسات':'Back to Courses'}</div>

            <div class="course-detail-hero">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                    <span class="course-price-badge ${isCourseFree?'free':'paid'}">${isCourseFree ? (isAR?'مجاني':'Free') : (isAR?`${c.price} ج.م`:`${c.price} EGP`)}</span>
                    ${c.level ? `<span class="course-tag">${escapeHtml(c.level)}</span>` : ''}
                    ${(c.duration||c.hours) ? `<span class="course-tag"><i class="fa-solid fa-clock"></i> ${escapeHtml(c.duration || (c.hours+' '+(isAR?'ساعة':'hrs')))}</span>` : ''}
                </div>
                <h1>${escapeHtml(c.title||'')}</h1>
                <div class="course-company-pill" style="font-size:13px;"><i class="fa-solid fa-building"></i> ${escapeHtml(c.companyName || c.source || '')}</div>
                ${embed ? `<div class="course-video-wrap"><iframe src="${embed}" title="course video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
            </div>

            <div class="course-detail-grid">
                <div>
                    ${c.description ? `<div class="course-detail-block"><h3><i class="fa-solid fa-align-right"></i> ${isAR?'وصف الكورس':'Course Description'}</h3><p>${escapeHtml(c.description).replace(/\n/g,'<br>')}</p></div>` : ''}
                    ${c.goals ? `<div class="course-detail-block"><h3><i class="fa-solid fa-bullseye"></i> ${isAR?'أهداف الكورس':'Course Goals'}</h3><p>${escapeHtml(c.goals).replace(/\n/g,'<br>')}</p></div>` : ''}
                    ${c.content ? `<div class="course-detail-block"><h3><i class="fa-solid fa-list-check"></i> ${isAR?'محتويات الكورس':'Course Content'}</h3><p>${escapeHtml(c.content).replace(/\n/g,'<br>')}</p></div>` : ''}
                    ${c.skills ? `<div class="course-detail-block"><h3><i class="fa-solid fa-brain"></i> ${isAR?'المهارات المكتسبة':'Skills You Will Gain'}</h3><p>${escapeHtml(c.skills).replace(/\n/g,'<br>')}</p></div>` : ''}
                    ${c.software ? `<div class="course-detail-block"><h3><i class="fa-solid fa-laptop-code"></i> ${isAR?'البرامج المستخدمة':'Software Used'}</h3><p>${escapeHtml(c.software)}</p></div>` : ''}
                    ${c.requirements ? `<div class="course-detail-block"><h3><i class="fa-solid fa-circle-check"></i> ${isAR?'متطلبات الالتحاق':'Enrollment Requirements'}</h3><p>${escapeHtml(c.requirements).replace(/\n/g,'<br>')}</p></div>` : ''}
                </div>
                <div>
                    <div class="course-detail-block">
                        <div class="course-info-list">
                            ${c.targetAudience ? `<div class="course-info-row"><span>${isAR?'الفئة المستهدفة':'Target Audience'}</span><span>${escapeHtml(c.targetAudience)}</span></div>` : ''}
                            <div class="course-info-row"><span>${isAR?'شهادة':'Certificate'}</span><span>${c.certificate ? (isAR?'نعم':'Yes') : (isAR?'لا':'No')}</span></div>
                            <div class="course-info-row"><span>${isAR?'المشاهدات':'Views'}</span><span>${c.views||0}</span></div>
                            <div class="course-info-row"><span>${isAR?'الطلاب المهتمون':'Interested Students'}</span><span id="interestCount">${c.interestedCount||0}</span></div>
                        </div>
                        ${!isFree ? `
                        <button class="course-subscribe-btn" style="margin-top:16px;" onclick="openSubscribeModal()">
                            🎓 ${isAR?'اشترك في الكورس':'Subscribe to Course'}
                        </button>` : (c.enrollUrl ? `
                        <a href="${c.enrollUrl}" target="_blank" class="course-subscribe-btn" style="margin-top:16px;text-decoration:none;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> ${isAR?'الذهاب للكورس':'Go to Course'}
                        </a>` : '')}
                    </div>
                    ${contactItems.length ? `
                    <div class="course-detail-block">
                        <h3><i class="fa-solid fa-address-card"></i> ${isAR?'تواصل مع الشركة':'Contact the Company'}</h3>
                        <div class="course-contact-grid">
                            ${contactItems.map(it => `<a class="course-contact-item" href="${it.href}" target="_blank"><i class="fa-solid ${it.icon}"></i><span>${it.label}</span></a>`).join('')}
                        </div>
                    </div>` : ''}
                </div>
            </div>`;
        }

        window.backToCoursesList = function() {
            navigate('courses', document.getElementById('menuCourse'), true);
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.getElementById('menuCourse')?.classList.add('active');
        };

        window.openSubscribeModal = function() {
            const c = _activeCourse;
            if (!c) return;
            const isAR = lang === 'AR';
            const msg = isAR
                ? `مرحبًا،\nأنا من مستخدمي منصة Atlasya، واطلعت على كورس (${c.title}) المنشور على المنصة، وأرغب في التسجيل فيه.\nهل يمكن معرفة تفاصيل الحجز، وطرق الدفع، وأقرب موعد لبدء الكورس؟\nشكرًا لكم.`
                : `Hello,\nI'm a user of the Atlasya platform and saw the course (${c.title}) listed there, and I'd like to enroll.\nCould you share enrollment details, payment methods, and the nearest start date?\nThank you.`;

            const modal = document.createElement('div');
            modal.id = 'subscribeModal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.onclick = (e) => { if (e.target === modal) closeSubscribeModal(); };

            const contactRow = [
                c.whatsapp ? `<a class="sub-modal-btn whatsapp" href="https://wa.me/${(c.whatsapp||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}" target="_blank"><i class="fa-brands fa-whatsapp"></i> ${isAR?'فتح WhatsApp':'Open WhatsApp'}</a>` : '',
                c.email ? `<a class="sub-modal-btn email" href="mailto:${c.email}?subject=${encodeURIComponent(c.title)}&body=${encodeURIComponent(msg)}"><i class="fa-solid fa-envelope"></i> ${isAR?'إرسال Email':'Send Email'}</a>` : '',
                c.website ? `<a class="sub-modal-btn website" href="${c.website}" target="_blank"><i class="fa-solid fa-globe"></i> ${isAR?'زيارة الموقع':'Visit Website'}</a>` : '',
            ].filter(Boolean).join('');

            modal.innerHTML = `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:460px;width:100%;padding:24px;max-height:88vh;overflow-y:auto;" onclick="event.stopPropagation()">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <h3 style="font-size:16px;font-weight:800;">🎓 ${isAR?'اشترك في الكورس':'Subscribe to Course'}</h3>
                    <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);font-size:18px;" onclick="closeSubscribeModal()"></i>
                </div>
                <p style="font-size:12.5px;color:var(--muted);">${isAR?'انسخ الرسالة التالية وأرسلها للشركة عبر أي وسيلة تواصل مناسبة':'Copy the message below and send it to the company via any contact method'}</p>
                <div class="sub-modal-msg-box" id="subModalMsg">${escapeHtml(msg)}</div>
                <div class="sub-modal-actions">
                    <button class="sub-modal-btn copy" onclick="copySubscribeMessage()"><i class="fa-solid fa-copy"></i> ${isAR?'نسخ الرسالة':'Copy Message'}</button>
                    ${contactRow}
                </div>
            </div>`;
            document.body.appendChild(modal);
            window._subscribeMessageText = msg;

            // increment interest counter once per open (best-effort real-time indicator)
            if (window._incrementCourseInterest) {
                window._incrementCourseInterest(c.id).then(() => {
                    const el = document.getElementById('interestCount');
                    if (el) el.textContent = (parseInt(el.textContent)||0) + 1;
                    c.interestedCount = (c.interestedCount || 0) + 1;
                }).catch(() => {});
            }
        };

        window.closeSubscribeModal = function() {
            document.getElementById('subscribeModal')?.remove();
        };

        window.copySubscribeMessage = function() {
            const isAR = lang === 'AR';
            navigator.clipboard.writeText(window._subscribeMessageText || '').then(() => {
                showToast(isAR ? '✅ تم نسخ الرسالة بنجاح' : '✅ Message copied successfully');
            }).catch(() => {
                showToast(isAR ? 'تعذر نسخ الرسالة' : 'Could not copy message', true);
            });
        };

        /* ══════════════════════════════════════════════════════════════
        ─── COMPANY PORTAL ───
        Isolated company session (separate Firebase Auth app) so signing
        in/out as a company never touches the student/admin session.
        ══════════════════════════════════════════════════════════════ */
        let _companyView = 'auth'; // 'auth' | 'dashboard' | 'form'
        let _companyAuthMode = 'login'; // 'login' | 'signup'
        let _companyMyCourses = [];
        let _companyEditingId = null;

        window.openCompanyPortal = function() {
            if (document.getElementById('companyOverlay')) return;
            const overlay = document.createElement('div');
            overlay.id = 'companyOverlay';
            overlay.className = 'company-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) closeCompanyPortal(); };
            document.body.appendChild(overlay);
            _companyView = window._companyIsLoggedIn ? 'dashboard' : 'auth';
            renderCompanyPortal();
        };

        window.closeCompanyPortal = function() {
            document.getElementById('companyOverlay')?.remove();
        };

        window._onCompanyAuthChange = function(profile) {
            window._companyIsLoggedIn = !!profile;
            window._companyProfile = profile;
            if (document.getElementById('companyOverlay')) {
                _companyView = profile ? 'dashboard' : 'auth';
                renderCompanyPortal();
            }
        };

        function renderCompanyPortal() {
            const overlay = document.getElementById('companyOverlay');
            if (!overlay) return;
            const isAR = lang === 'AR';
            if (_companyView === 'auth') overlay.innerHTML = companyAuthHTML(isAR);
            else if (_companyView === 'dashboard') { overlay.innerHTML = companyDashboardShellHTML(isAR); loadCompanyDashboardData(isAR); }
            else if (_companyView === 'form') overlay.innerHTML = companyCourseFormHTML(isAR);
        }

        function companyAuthHTML(isAR) {
            return `
            <div class="company-panel" onclick="event.stopPropagation()">
                <div class="company-panel-header">
                    <h3><i class="fa-solid fa-building-shield"></i> ${isAR?'بوابة الشركات':'Company Portal'}</h3>
                    <i class="fa-solid fa-xmark close-x" onclick="closeCompanyPortal()"></i>
                </div>
                <div class="company-panel-body">
                    <div class="company-auth-pills">
                        <div class="company-auth-pill ${_companyAuthMode==='login'?'active':''}" onclick="switchCompanyAuthMode('login')">${isAR?'تسجيل الدخول':'Login'}</div>
                        <div class="company-auth-pill ${_companyAuthMode==='signup'?'active':''}" onclick="switchCompanyAuthMode('signup')">${isAR?'إنشاء حساب':'Sign Up'}</div>
                    </div>
                    <div id="companyAuthFormWrap">${_companyAuthMode==='login'?companyLoginFormHTML(isAR):companySignupFormHTML(isAR)}</div>
                </div>
            </div>`;
        }

        function companyLoginFormHTML(isAR) {
            return `
            <div class="job-field"><label>${isAR?'البريد الإلكتروني':'Email'}</label><input type="email" id="coLoginEmail" placeholder="company@example.com"></div>
            <div class="job-field"><label>${isAR?'كلمة المرور':'Password'}</label><input type="password" id="coLoginPass"></div>
            <button class="btn-post-job" style="width:100%;margin-top:6px;" onclick="companyDoLogin()"><i class="fa-solid fa-right-to-bracket"></i> ${isAR?'تسجيل الدخول':'Login'}</button>
            <div id="companyAuthError" style="color:#ff6b6b;font-size:12px;margin-top:10px;"></div>`;
        }

        function companySignupFormHTML(isAR) {
            return `
            <div class="proj-form-grid">
                <div class="job-field full"><label>${isAR?'اسم الشركة *':'Company Name *'}</label><input type="text" id="coName"></div>
                <div class="job-field"><label>${isAR?'البريد الإلكتروني *':'Email *'}</label><input type="email" id="coEmail"></div>
                <div class="job-field"><label>${isAR?'كلمة المرور * (6 أحرف على الأقل)':'Password * (min 6 chars)'}</label><input type="password" id="coPass"></div>
                <div class="job-field"><label>${isAR?'رقم الهاتف':'Phone'}</label><input type="text" id="coPhone"></div>
                <div class="job-field"><label>WhatsApp</label><input type="text" id="coWhatsapp"></div>
                <div class="job-field"><label>${isAR?'الموقع الإلكتروني':'Website'}</label><input type="text" id="coWebsite"></div>
                <div class="job-field"><label>Facebook</label><input type="text" id="coFacebook"></div>
                <div class="job-field"><label>LinkedIn</label><input type="text" id="coLinkedin"></div>
                <div class="job-field"><label>Instagram</label><input type="text" id="coInstagram"></div>
            </div>
            <button class="btn-post-job" style="width:100%;margin-top:10px;" onclick="companyDoSignup()"><i class="fa-solid fa-user-plus"></i> ${isAR?'إنشاء حساب':'Create Account'}</button>
            <div id="companyAuthError" style="color:#ff6b6b;font-size:12px;margin-top:10px;"></div>`;
        }

        window.switchCompanyAuthMode = function(mode) {
            _companyAuthMode = mode;
            const isAR = lang === 'AR';
            document.querySelectorAll('.company-auth-pill').forEach((el,i) => el.classList.toggle('active', (mode==='login'&&i===0)||(mode==='signup'&&i===1)));
            const wrap = document.getElementById('companyAuthFormWrap');
            if (wrap) wrap.innerHTML = mode==='login' ? companyLoginFormHTML(isAR) : companySignupFormHTML(isAR);
        };

        window.companyDoLogin = async function() {
            const isAR = lang === 'AR';
            const email = document.getElementById('coLoginEmail')?.value.trim();
            const pass = document.getElementById('coLoginPass')?.value;
            const errEl = document.getElementById('companyAuthError');
            if (!email || !pass) { if (errEl) errEl.textContent = isAR?'من فضلك أدخل البريد وكلمة المرور':'Please enter email and password'; return; }
            try {
                await window._companyLogin(email, pass);
            } catch(e) {
                if (errEl) errEl.textContent = isAR?'بيانات الدخول غير صحيحة':'Invalid login credentials';
            }
        };

        window.companyDoSignup = async function() {
            const isAR = lang === 'AR';
            const errEl = document.getElementById('companyAuthError');
            const data = {
                companyName: document.getElementById('coName')?.value.trim(),
                email: document.getElementById('coEmail')?.value.trim(),
                password: document.getElementById('coPass')?.value,
                phone: document.getElementById('coPhone')?.value.trim(),
                whatsapp: document.getElementById('coWhatsapp')?.value.trim(),
                website: document.getElementById('coWebsite')?.value.trim(),
                facebook: document.getElementById('coFacebook')?.value.trim(),
                linkedin: document.getElementById('coLinkedin')?.value.trim(),
                instagram: document.getElementById('coInstagram')?.value.trim(),
            };
            if (!data.companyName || !data.email || !data.password) { if (errEl) errEl.textContent = isAR?'من فضلك املأ الحقول المطلوبة (*)':'Please fill required fields (*)'; return; }
            if (data.password.length < 6) { if (errEl) errEl.textContent = isAR?'كلمة المرور يجب ألا تقل عن 6 أحرف':'Password must be at least 6 characters'; return; }
            try {
                await window._companySignUp(data);
                showToast(isAR?'تم إنشاء الحساب بنجاح':'Account created successfully');
            } catch(e) {
                if (errEl) errEl.textContent = (e && e.code === 'auth/email-already-in-use') ? (isAR?'البريد مستخدم بالفعل':'Email already in use') : (isAR?'حدث خطأ، حاول مرة أخرى':'Something went wrong, try again');
            }
        };

        function companyDashboardShellHTML(isAR) {
            return `
            <div class="company-panel" onclick="event.stopPropagation()">
                <div class="company-panel-header">
                    <h3><i class="fa-solid fa-building-shield"></i> ${escapeHtml(window._companyProfile?.companyName||'')}</h3>
                    <div style="display:flex;align-items:center;gap:14px;">
                        <i class="fa-solid fa-right-from-bracket close-x" title="${isAR?'تسجيل الخروج':'Logout'}" onclick="companyLogout()"></i>
                        <i class="fa-solid fa-xmark close-x" onclick="closeCompanyPortal()"></i>
                    </div>
                </div>
                <div class="company-panel-body" id="companyDashBody">
                    <div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>`;
        }

        async function loadCompanyDashboardData(isAR) {
            const body = document.getElementById('companyDashBody');
            if (!body || !window._companyUid) return;
            try {
                _companyMyCourses = await window._companyLoadMyCourses(window._companyUid);
            } catch(e) { _companyMyCourses = []; }
            const totalViews = _companyMyCourses.reduce((s,c) => s+(c.views||0), 0);
            const totalInterest = _companyMyCourses.reduce((s,c) => s+(c.interestedCount||0), 0);
            body.innerHTML = `
            <div class="company-stats-grid">
                <div class="company-stat-card"><div class="num">${_companyMyCourses.length}</div><div class="lbl">${isAR?'عدد الكورسات':'Courses'}</div></div>
                <div class="company-stat-card"><div class="num">${totalViews}</div><div class="lbl">${isAR?'إجمالي المشاهدات':'Total Views'}</div></div>
                <div class="company-stat-card"><div class="num">${totalInterest}</div><div class="lbl">${isAR?'الطلاب المهتمون':'Interested'}</div></div>
            </div>
            <button class="btn-post-job" style="width:100%;margin-bottom:16px;" onclick="openCompanyCourseForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة كورس جديد':'Add New Course'}</button>
            <h4 style="font-size:13px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">${isAR?'كورساتي':'My Courses'}</h4>
            <div id="companyCoursesList">
                ${_companyMyCourses.length ? _companyMyCourses.map(c => companyCourseRowHTML(c, isAR)).join('') : `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">${isAR?'لم تقم بإضافة أي كورس بعد':'You have not added any courses yet'}</div>`}
            </div>`;
        }

        function companyStatusBadgeHTML(status, isAR) {
            const map = {
                pending:  { txt: isAR?'قيد المراجعة':'Pending',  bg:'rgba(212,160,23,0.15)', color:'var(--gold4)' },
                approved: { txt: isAR?'منشور':'Approved',        bg:'rgba(var(--brand-rgb,30,122,52),0.15)',  color:'var(--g4)' },
                rejected: { txt: isAR?'مرفوض':'Rejected',        bg:'rgba(220,50,50,0.15)',  color:'#ff6b6b' },
            };
            const s = map[status] || map.pending;
            return `<span class="job-status-badge" style="background:${s.bg};color:${s.color};">${s.txt}</span>`;
        }

        function companyCourseRowHTML(c, isAR) {
            return `
            <div class="company-course-row">
                <div class="cc-title">${escapeHtml(c.title||'')}
                    <div class="cc-meta">${c.views||0} ${isAR?'مشاهدة':'views'} · ${c.interestedCount||0} ${isAR?'مهتم':'interested'}</div>
                </div>
                ${companyStatusBadgeHTML(c.status, isAR)}
                <div class="company-course-actions">
                    <div class="company-icon-btn" title="${isAR?'تعديل':'Edit'}" onclick="openCompanyCourseForm('${c.id}')"><i class="fa-solid fa-pen"></i></div>
                    <div class="company-icon-btn danger" title="${isAR?'حذف':'Delete'}" onclick="companyDeleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></div>
                </div>
            </div>`;
        }

        window.companyDeleteCourse = async function(id) {
            const isAR = lang === 'AR';
            if (!confirm(isAR?'حذف هذا الكورس نهائياً؟':'Delete this course permanently?')) return;
            try {
                await window._companyDeleteCourse(id);
                showToast(isAR?'تم حذف الكورس':'Course deleted');
                loadCompanyDashboardData(isAR);
            } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
        };

        window.companyLogout = async function() {
            await window._companyLogout();
            closeCompanyPortal();
        };

        window.openCompanyCourseForm = function(editId) {
            _companyEditingId = editId || null;
            _companyView = 'form';
            renderCompanyPortal();
        };