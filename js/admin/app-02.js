
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
        <a href="javascript:void(0)" onclick="dsOpenDataset('${d.id}')" oncontextmenu="return false;" class="dataset-card">
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
            if (window._incrementDatasetDownload) await window._incrementDatasetDownload(id, d.downloads || 0);
            d.downloads = (d.downloads || 0) + 1;
        } catch(e) {}
    };

    /* ─── GIS SOFTWARE TOOLS ─── */
    /* ─── GIS SOFTWARE TOOLS (dynamic) ─── */
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
        <a href="javascript:void(0)" onclick="handleToolDownload('${t.id}')" oncontextmenu="return false;" class="dataset-card">
            <div class="ds-top">
                <div class="ds-icon"><i class="fa-solid ${t.icon || (cat?cat.icon:'fa-download')}"></i></div>
                <span class="ds-badge">${escapeHtmlAC(t.version||'')}</span>
            </div>
            <div class="ds-info">
                <h4>${escapeHtmlAC(isAR?(t.name||''):(t.nameEn||t.name||''))}</h4>
                ${t.notes ? `<div style="font-size:10.5px;color:var(--gold3);margin-top:4px;"><i class="fa-solid fa-circle-info"></i> ${escapeHtmlAC(t.notes)}</div>` : ''}
            </div>
            <div class="ds-dl"><i class="fa-solid fa-download"></i><span>${isAR?'تحميل':'Download'}</span></div>
        </a>`;
    }

    function toolCardSplitHTML(t, isAR) {
        return `
        <div class="dataset-card split" oncontextmenu="return false;">
            <div class="ds-top">
                <div class="ds-icon"><i class="fa-solid ${t.icon || 'fa-circle-down'}"></i></div>
                <span class="ds-badge">${escapeHtmlAC(t.version||'')}</span>
            </div>
            <div class="ds-info">
                <h4>${escapeHtmlAC(isAR?(t.name||''):(t.nameEn||t.name||''))}</h4>
                <div class="ds-combo-note">${isAR?`⚠️ يجب تحميل "${escapeHtmlAC(t.prerequisiteLabel||'')}" أولاً قبل التثبيت`:`⚠️ You must download "${escapeHtmlAC(t.prerequisiteLabel||'')}" first before installing`}</div>
                ${t.notes ? `<div style="font-size:10.5px;color:var(--gold3);margin-top:4px;"><i class="fa-solid fa-circle-info"></i> ${escapeHtmlAC(t.notes)}</div>` : ''}
            </div>
            <div class="ds-dl-group">
                <button type="button" class="ds-dl-mini" onclick="handleToolDownloadPair('${t.id}','main')" oncontextmenu="return false;"><i class="fa-solid fa-download"></i><span>${escapeHtmlAC(isAR?(t.name||''):(t.nameEn||t.name||''))}</span></button>
                <button type="button" class="ds-dl-mini" onclick="handleToolDownloadPair('${t.id}','prereq')" oncontextmenu="return false;"><i class="fa-solid fa-download"></i><span>${escapeHtmlAC(t.prerequisiteLabel || (isAR?'المتطلب':'Requirement'))}</span></button>
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
            ${uploadCount>=3?`<button onclick="typeof goSettings==='function' ? goSettings('plan') : navigate('account',document.getElementById('menuAccount'))" style="padding:7px 14px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;flex-shrink:0;"><i class="fa-solid fa-crown"></i> ${isAR?'ترقية Pro':'Upgrade Pro'}</button>`:''}
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
            if (window._incrementToolDownload) await window._incrementToolDownload(id, t.downloads || 0);
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
                if (window._incrementToolDownload) await window._incrementToolDownload(id, t.downloads || 0);
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
                <button onclick="navigate('account',document.getElementById('menuAccount'))" style="margin-top:6px;padding:10px 22px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:10px;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;">
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