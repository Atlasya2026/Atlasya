    let _adsPreviewPending = '';

    function renderAdminDatasets(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة مكتبة البيانات المكانية':'Manage Spatial Data Library'}</h2>
            <p>${isAR?'أضف وعدّل وحذف مجموعات البيانات المكانية ومشاريع البيانات الجاهزة':'Add, edit, and remove spatial datasets and ready-for-project bundles'}</p>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:18px;">
            <button class="ac-btn ${_adsTab==='datasets'?'hide':''}" style="${_adsTab==='datasets'?'background:var(--g3);color:#fff;border-color:transparent;':''}" onclick="adsSwitchTab('datasets')"><i class="fa-solid fa-database"></i> ${isAR?'مجموعات البيانات':'Datasets'}</button>
            <button class="ac-btn ${_adsTab==='projects'?'hide':''}" style="${_adsTab==='projects'?'background:var(--gold3);color:#000;border-color:transparent;':''}" onclick="adsSwitchTab('projects')"><i class="fa-solid fa-star"></i> ${isAR?'مشاريع البيانات الجاهزة':'Project Bundles'}</button>
        </div>
        <div id="adsTabBody"></div>`;
        loadAdminDatasets();
    }

    window.adsSwitchTab = function(tab) {
        _adsTab = tab;
        renderAdsTabBody();
    };

    async function loadAdminDatasets() {
        const body = document.getElementById('adsTabBody');
        if (body) body.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try {
            [_adsDatasets, _adsProjects] = await Promise.all([
                window._loadSpatialDatasets(), window._loadSpatialProjects()
            ]);
        } catch(e) { console.error(e); _adsDatasets = []; _adsProjects = []; }
        renderAdsTabBody();
    }

    function renderAdsTabBody() {
        const isAR = lang === 'AR';
        const body = document.getElementById('adsTabBody');
        if (!body) return;
        if (_adsTab === 'datasets') {
            const totalDownloads = _adsDatasets.reduce((s,d) => s + (d.downloads||0), 0);
            const topDataset = [..._adsDatasets].sort((a,b) => (b.downloads||0)-(a.downloads||0))[0];
            body.innerHTML = `
            <button class="btn-post-job" style="margin-bottom:16px;" onclick="openDatasetForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة مجموعة بيانات':'Add New Dataset'}</button>
            <div style="display:flex;gap:10px;margin:4px 0 16px;flex-wrap:wrap;">
                <div class="lib-stat-chip"><i class="fa-solid fa-database"></i> ${_adsDatasets.length} ${isAR?'مجموعة':'datasets'}</div>
                <div class="lib-stat-chip"><i class="fa-solid fa-download"></i> ${totalDownloads} ${isAR?'تحميل':'downloads'}</div>
                ${topDataset ? `<div class="lib-stat-chip"><i class="fa-solid fa-fire"></i> ${isAR?'الأكثر تحميلاً:':'Most downloaded:'} ${escapeHtmlAC(topDataset.name||'')} (${topDataset.downloads||0})</div>` : ''}
            </div>
            <div class="ac-toolbar">
                <input type="text" id="adsSearchInput" placeholder="${isAR?'ابحث بالاسم أو المنطقة أو المصدر...':'Search by name, region, or source...'}" value="${_adsSearch}" oninput="adsFilterChangeAdmin()">
                <select id="adsCatSelect" onchange="adsFilterChangeAdmin()">
                    <option value="">${isAR?'كل التصنيفات':'All Categories'}</option>
                    ${SPATIAL_CATEGORIES.map(c => `<option value="${c.key}" ${_adsCatFilter===c.key?'selected':''}>${c.icon} ${isAR?c.ar:c.en}</option>`).join('')}
                </select>
            </div>
            <div id="adsDatasetsList"></div>`;
            renderAdsDatasetsList(isAR);
        } else {
            body.innerHTML = `
            <button class="btn-post-job" style="margin-bottom:16px;" onclick="openProjectForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة مشروع جديد':'Add New Project Bundle'}</button>
            <div id="adsProjectsList"></div>`;
            renderAdsProjectsList(isAR);
        }
    }

    window.adsFilterChangeAdmin = function() {
        _adsSearch = document.getElementById('adsSearchInput')?.value.trim().toLowerCase() || '';
        _adsCatFilter = document.getElementById('adsCatSelect')?.value || '';
        renderAdsDatasetsList(lang === 'AR');
    };

    function renderAdsDatasetsList(isAR) {
        const list = document.getElementById('adsDatasetsList');
        if (!list) return;
        let items = [..._adsDatasets];
        if (_adsCatFilter) items = items.filter(d => d.category === _adsCatFilter);
        if (_adsSearch) items = items.filter(d =>
            (d.name||'').toLowerCase().includes(_adsSearch) ||
            (d.region||'').toLowerCase().includes(_adsSearch) ||
            (d.source||'').toLowerCase().includes(_adsSearch));
        if (!items.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد بيانات مطابقة':'No matching datasets'}</div>`;
            return;
        }
        list.innerHTML = items.map(d => adsDatasetRowHTML(d, isAR)).join('');
    }

    function adsDatasetRowHTML(d, isAR) {
        const cat = scFindCat(d.category);
        const sub = scFindSub(d.category, d.subcategory);
        const thumb = d.previewImage
            ? `<img src="${d.previewImage}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid var(--border);">`
            : `<div style="width:64px;height:64px;border-radius:8px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--muted);border:1px solid var(--border);"><i class="fa-solid fa-map"></i></div>`;
        return `
        <div class="ac-row" style="align-items:flex-start;">
            ${thumb}
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${escapeHtmlAC(d.name||'')} ${d.hidden ? `<span class="job-status-badge rejected" style="margin-inline-start:6px;"><i class="fa-solid fa-eye-slash"></i> ${isAR?'مخفي':'Hidden'}</span>` : ''}</div>
                <div class="ac-meta">
                    <span class="job-status-badge approved">${cat ? scCatLabel(cat, isAR) : ''}${sub ? ` — ${isAR?sub.ar:sub.en}` : ''}</span>
                    ${d.region ? `<span><i class="fa-solid fa-earth-africa"></i> ${escapeHtmlAC(d.region)}</span>` : ''}
                    ${d.fileType ? `<span><i class="fa-solid fa-file"></i> ${escapeHtmlAC(d.fileType)}</span>` : ''}
                    ${Array.isArray(d.layers) && d.layers.length ? `<span><i class="fa-solid fa-layer-group"></i> ${d.layers.length} ${isAR?'طبقة':'layers'}</span>` : ''}
                    <span><i class="fa-solid fa-download"></i> ${d.downloads||0}</span>
                    ${d.downloadUrl ? `<span style="color:var(--green4);"><i class="fa-solid fa-link"></i> ${isAR?'رابط موجود':'Link set'}</span>` : `<span style="color:#e33;"><i class="fa-solid fa-triangle-exclamation"></i> ${isAR?'بدون رابط':'No link'}</span>`}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn hide" onclick="adsToggleHidden('${d.id}', ${!d.hidden})"><i class="fa-solid fa-eye${d.hidden?'':'-slash'}"></i> ${d.hidden ? (isAR?'إظهار':'Unhide') : (isAR?'إخفاء':'Hide')}</button>
                <button class="ac-btn" onclick="openDatasetForm('${d.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="adsDeleteDataset('${d.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.adsToggleHidden = async function(id, hidden) {
        try {
            await window._updateSpatialDataset(id, { hidden });
            const idx = _adsDatasets.findIndex(d => d.id === id);
            if (idx > -1) _adsDatasets[idx].hidden = hidden;
            renderAdsDatasetsList(lang === 'AR');
            showToast(lang==='AR' ? (hidden?'تم الإخفاء':'تم الإظهار') : (hidden?'Hidden':'Visible'));
        } catch(e) { showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.adsDeleteDataset = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف مجموعة البيانات هذه نهائياً؟':'Delete this dataset permanently?')) return;
        try {
            await window._deleteSpatialDataset(id);
            _adsDatasets = _adsDatasets.filter(d => d.id !== id);
            renderAdsDatasetsList(isAR);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    function _compressDatasetPreview(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const LIMIT = 220000;
                let maxDim = 500, quality = 0.8;
                let dataUrl = await _resizeImageFile(file, maxDim, quality);
                while (dataUrl.length > LIMIT && (quality > 0.3 || maxDim > 150)) {
                    if (quality > 0.3) quality = Math.round((quality - 0.1) * 10) / 10;
                    else maxDim = Math.round(maxDim * 0.8);
                    dataUrl = await _resizeImageFile(file, maxDim, quality);
                }
                resolve(dataUrl);
            } catch(e) { reject(e); }
        });
    }

    window.adsHandlePreviewPick = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        try {
            const dataUrl = await _compressDatasetPreview(file);
            _adsPreviewPending = dataUrl;
            const prev = document.getElementById('adsPreviewImg');
            if (prev) prev.src = dataUrl;
        } catch(err) {
            showToast(isAR?'تعذّرت معالجة الصورة':'Could not process the image', true);
        }
    };

    window.openDatasetForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adsDatasets.find(d => d.id === editId) : null;
        _adsPreviewPending = '';
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const curCat = v('category') || SPATIAL_CATEGORIES[0].key;
        const modal = document.createElement('div');
        modal.id = 'adsFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل مجموعة بيانات':'Edit Dataset') : (isAR?'إضافة مجموعة بيانات جديدة':'Add New Dataset')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('adsFormModal').remove()"></i>
            </div>

            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="text-align:center;">
                    <img id="adsPreviewImg" src="${editing && editing.previewImage ? editing.previewImage : ''}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid var(--border);background:var(--bg3);display:block;margin-bottom:6px;">
                    <label class="ac-btn" style="cursor:pointer;display:inline-flex;">
                        <i class="fa-solid fa-image"></i> ${isAR?'رفع صورة معاينة':'Upload Preview'}
                        <input type="file" accept="image/*" style="display:none;" onchange="adsHandlePreviewPick(event)">
                    </label>
                </div>
                <div style="flex:1;min-width:220px;">
                    <div class="job-field full"><label>${isAR?'اسم البيانات (عربي) *':'Dataset Name (Arabic) *'}</label><input type="text" id="ads_name" value="${escapeHtmlAC(v('name'))}"></div>
                    <div class="job-field full"><label>${isAR?'اسم البيانات (إنجليزي)':'Dataset Name (English)'}</label><input type="text" id="ads_nameEn" value="${escapeHtmlAC(v('nameEn'))}"></div>
                </div>
            </div>

            <div class="proj-form-grid">
                <div class="job-field"><label>${isAR?'التصنيف *':'Category *'}</label>
                    <select id="ads_category">
                        ${SPATIAL_CATEGORIES.map(c => `<option value="${c.key}" ${curCat===c.key?'selected':''}>${c.icon} ${isAR?c.ar:c.en}</option>`).join('')}
                    </select>
                </div>
                <div class="job-field"><label>${isAR?'المنطقة (الدولة/المحافظة) *':'Region (Country/Governorate) *'}</label><input type="text" id="ads_region" value="${escapeHtmlAC(v('region'))}" placeholder="${isAR?'مثال: مصر — القاهرة':'e.g. Egypt — Cairo'}"></div>
                <div class="job-field"><label>${isAR?'نوع الملف *':'File Type *'}</label>
                    <select id="ads_fileType">
                        ${SPATIAL_FILE_TYPES.map(t => `<option value="${t}" ${v('fileType')===t?'selected':''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="job-field"><label>${isAR?'نظام الإحداثيات':'Coordinate System'}</label><input type="text" id="ads_coordSystem" value="${escapeHtmlAC(v('coordSystem'))}" placeholder="WGS 84 / UTM Zone 36N"></div>
                <div class="job-field"><label>${isAR?'مقياس الدقة':'Resolution'}</label><input type="text" id="ads_resolution" value="${escapeHtmlAC(v('resolution'))}" placeholder="30m / 1:50,000"></div>
                <div class="job-field"><label>${isAR?'حجم الملف':'File Size'}</label><input type="text" id="ads_fileSize" value="${escapeHtmlAC(v('fileSize'))}" placeholder="25 MB"></div>
                <div class="job-field"><label>${isAR?'تاريخ التحديث':'Update Date'}</label><input type="date" id="ads_updateDate" value="${escapeHtmlAC(v('updateDate'))}"></div>
                <div class="job-field"><label>${isAR?'مصدر البيانات':'Data Source'}</label><input type="text" id="ads_source" value="${escapeHtmlAC(v('source'))}" placeholder="USGS / OpenStreetMap / CAPMAS"></div>
                <div class="job-field full"><label>${isAR?'وصف مختصر':'Short Description'}</label><textarea id="ads_desc">${escapeHtmlAC(v('description'))}</textarea></div>
                <div class="job-field full"><label>${isAR?'الطبقات المُضمّنة (اختياري — طبقة في كل سطر، لو أكتر من layer في نفس الملف)':'Included Layers (optional — one per line, if the package has more than one layer)'}</label><textarea id="ads_layers" placeholder="${isAR?'مثال:\nحدود الدولة\nالمحافظات\nالطرق الرئيسية\nالمسطحات المائية':'e.g.\nCountry Boundary\nGovernorates\nMain Roads\nWater Bodies'}">${escapeHtmlAC(Array.isArray(v('layers')) ? v('layers').join('\n') : (v('layers')||''))}</textarea></div>
                <div class="job-field full"><label>${isAR?'رابط التحميل (خارجي) *':'Download Link (external) *'}</label><input type="url" id="ads_url" value="${escapeHtmlAC(v('downloadUrl'))}" placeholder="https://drive.google.com/..."></div>
                <div class="job-field full"><label>${isAR?'إضافة إلى مشاريع البيانات الجاهزة':'Add to Project Bundles'}</label>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;">
                        ${_adsProjects.length ? _adsProjects.map(p => `
                        <label style="display:flex;align-items:center;gap:6px;font-size:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer;">
                            <input type="checkbox" class="ads_proj_chk" value="${p.id}" ${(editing && Array.isArray(editing.projects) && editing.projects.includes(p.id)) ? 'checked' : ''}>
                            ${p.icon||'⭐'} ${escapeHtmlAC(isAR?(p.name||''):(p.nameEn||p.name||''))}
                        </label>`).join('') : `<span style="font-size:12px;color:var(--muted);">${isAR?'لا توجد مشاريع بعد — أنشئها من تبويب "مشاريع البيانات الجاهزة"':'No project bundles yet — create one from the "Project Bundles" tab'}</span>`}
                    </div>
                </div>
            </div>

            <label style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="ads_hidden" ${v('hidden') ? 'checked' : ''}> ${isAR?'إخفاء عن الطلاب':'Hide from students'}
            </label>

            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="adsSaveBtn" onclick="adsSaveDataset('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.adsSaveDataset = async function(editId) {
        const isAR = lang === 'AR';
        const name = document.getElementById('ads_name')?.value.trim();
        const category = document.getElementById('ads_category')?.value;
        const region = document.getElementById('ads_region')?.value.trim();
        const downloadUrl = document.getElementById('ads_url')?.value.trim();
        if (!name) { showToast(isAR?'من فضلك أدخل اسم البيانات':'Please enter the dataset name', true); return; }
        if (!category) { showToast(isAR?'من فضلك اختر تصنيف':'Please select a category', true); return; }
        if (!region) { showToast(isAR?'من فضلك أدخل المنطقة':'Please enter the region', true); return; }
        if (!downloadUrl) { showToast(isAR?'من فضلك أدخل رابط التحميل':'Please enter the download link', true); return; }

        const selectedProjects = Array.from(document.querySelectorAll('.ads_proj_chk:checked')).map(el => el.value);

        const data = {
            name,
            nameEn: document.getElementById('ads_nameEn')?.value.trim() || '',
            category,
            region,
            fileType: document.getElementById('ads_fileType')?.value || '',
            coordSystem: document.getElementById('ads_coordSystem')?.value.trim() || '',
            resolution: document.getElementById('ads_resolution')?.value.trim() || '',
            fileSize: document.getElementById('ads_fileSize')?.value.trim() || '',
            updateDate: document.getElementById('ads_updateDate')?.value || '',
            source: document.getElementById('ads_source')?.value.trim() || '',
            description: document.getElementById('ads_desc')?.value.trim() || '',
            layers: (document.getElementById('ads_layers')?.value || '').split('\n').map(s => s.trim()).filter(Boolean),
            downloadUrl,
            projects: selectedProjects,
            hidden: !!document.getElementById('ads_hidden')?.checked,
        };
        if (_adsPreviewPending) data.previewImage = _adsPreviewPending;

        const btn = document.getElementById('adsSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateSpatialDataset(editId, data);
            else await window._addSpatialDataset(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('adsFormModal')?.remove();
            loadAdminDatasets();
        } catch(e) {
            console.error('Dataset save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: PROJECT BUNDLES ─── */
    function renderAdsProjectsList(isAR) {
        const list = document.getElementById('adsProjectsList');
        if (!list) return;
        if (!_adsProjects.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد مشاريع بعد':'No project bundles yet'}</div>`;
            return;
        }
        list.innerHTML = _adsProjects.map(p => {
            const count = _adsDatasets.filter(d => Array.isArray(d.projects) && d.projects.includes(p.id)).length;
            return `
            <div class="ac-row" style="align-items:flex-start;">
                <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;">${p.icon||'⭐'}</div>
                <div class="ac-main" style="margin-inline-start:12px;">
                    <div class="ac-title">${escapeHtmlAC(isAR?(p.name||''):(p.nameEn||p.name||''))}</div>
                    <div class="ac-meta">
                        <span><i class="fa-solid fa-database"></i> ${count} ${isAR?'مجموعة بيانات':'datasets'}</span>
                        ${p.description ? `<span>${escapeHtmlAC(p.description.slice(0,80))}</span>` : ''}
                    </div>
                </div>
                <div class="ac-actions">
                    <button class="ac-btn" onclick="openProjectForm('${p.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                    <button class="ac-btn danger" onclick="adsDeleteProject('${p.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
                </div>
            </div>`;
        }).join('');
    }

    window.adsDeleteProject = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا المشروع نهائياً؟ (لن يتم حذف البيانات المرتبطة به)':'Delete this project bundle permanently? (linked datasets will not be deleted)')) return;
        try {
            await window._deleteSpatialProject(id);
            _adsProjects = _adsProjects.filter(p => p.id !== id);
            renderAdsProjectsList(isAR);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.openProjectForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adsProjects.find(p => p.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'projFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل مشروع':'Edit Project Bundle') : (isAR?'مشروع بيانات جديد':'New Project Bundle')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('projFormModal').remove()"></i>
            </div>
            <div class="proj-form-grid">
                <div class="job-field"><label>${isAR?'أيقونة (رمز تعبيري)':'Icon (emoji)'}</label><input type="text" id="proj_icon" value="${escapeHtmlAC(v('icon'))}" placeholder="🌊" style="text-align:center;"></div>
                <div class="job-field"><label>${isAR?'اسم المشروع (عربي) *':'Project Name (Arabic) *'}</label><input type="text" id="proj_name" value="${escapeHtmlAC(v('name'))}" placeholder="${isAR?'مثال: بيانات مشروع Flood Risk':'e.g. Flood Risk Project Data'}"></div>
                <div class="job-field full"><label>${isAR?'اسم المشروع (إنجليزي)':'Project Name (English)'}</label><input type="text" id="proj_nameEn" value="${escapeHtmlAC(v('nameEn'))}"></div>
                <div class="job-field full"><label>${isAR?'وصف مختصر (عربي)':'Short Description (Arabic)'}</label><textarea id="proj_desc">${escapeHtmlAC(v('description'))}</textarea></div>
                <div class="job-field full"><label>${isAR?'وصف مختصر (إنجليزي)':'Short Description (English)'}</label><textarea id="proj_descEn">${escapeHtmlAC(v('descriptionEn'))}</textarea></div>
            </div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.6;">
                ${isAR?'بعد الحفظ، اربط مجموعات البيانات بهذا المشروع من نموذج تعديل كل Dataset.':"After saving, link datasets to this project from each dataset's edit form."}
            </div>
            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="projSaveBtn" onclick="adsSaveProject('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.adsSaveProject = async function(editId) {
        const isAR = lang === 'AR';
        const name = document.getElementById('proj_name')?.value.trim();
        if (!name) { showToast(isAR?'من فضلك أدخل اسم المشروع':'Please enter the project name', true); return; }
        const data = {
            icon: document.getElementById('proj_icon')?.value.trim() || '⭐',
            name,
            nameEn: document.getElementById('proj_nameEn')?.value.trim() || '',
            description: document.getElementById('proj_desc')?.value.trim() || '',
            descriptionEn: document.getElementById('proj_descEn')?.value.trim() || '',
        };
        const btn = document.getElementById('projSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateSpatialProject(editId, data);
            else await window._addSpatialProject(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('projFormModal')?.remove();
            loadAdminDatasets();
        } catch(e) {
            console.error('Project save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };


    /* ─── ADMIN: SOFTWARE TOOLS ─── */
    let _adminTools = [];
    let _atSearch = '';
    let _atCatFilter = '';

    function renderAdminTools(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة أدوات البرامج':'Manage Software Tools'}</h2>
            <p>${isAR?'أضف وعدّل وحذف روابط تحميل البرامج، وحدد لو فيه متطلب لازم يتحمّل الأول قبل التثبيت':'Add, edit, and remove software download links, and mark tools that require a prerequisite download before installing'}</p>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openToolForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة برنامج جديد':'Add New Software'}</button>
        <div class="ac-toolbar">
            <input type="text" id="atSearchInput" placeholder="${isAR?'ابحث بالاسم...':'Search by name...'}" oninput="atFilterChange()">
            <select id="atCatSelect" onchange="atFilterChange()">
                <option value="">${isAR?'كل التصنيفات':'All Categories'}</option>
                ${SOFTWARE_CATEGORIES.map(c=>`<option value="${c.key}">${isAR?c.ar:c.en}</option>`).join('')}
            </select>
        </div>
        <div id="atList"></div>`;
        loadAdminTools();
    }

    async function loadAdminTools() {
        const list = document.getElementById('atList');
        if (list) list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try { _adminTools = await window._loadSoftwareTools(); }
        catch(e) { console.error(e); _adminTools = []; }
        renderAtList();
    }

    window.atFilterChange = function() {
        _atSearch = document.getElementById('atSearchInput')?.value.trim().toLowerCase() || '';
        _atCatFilter = document.getElementById('atCatSelect')?.value || '';
        renderAtList();
    };

    function renderAtList() {
        const isAR = lang === 'AR';
        const list = document.getElementById('atList');
        if (!list) return;
        let items = [..._adminTools];
        if (_atCatFilter) items = items.filter(t => t.category === _atCatFilter);
        if (_atSearch) items = items.filter(t =>
            (t.name||'').toLowerCase().includes(_atSearch) ||
            (t.nameEn||'').toLowerCase().includes(_atSearch));
        if (!items.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد أدوات مطابقة':'No matching tools'}</div>`;
            return;
        }
        list.innerHTML = items.map(t => atRowHTML(t, isAR)).join('');
    }

    function atRowHTML(t, isAR) {
        const cat = scFindToolCat(t.category);
        return `
        <div class="ac-row">
            <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--muted);border:1px solid var(--border);font-size:18px;"><i class="fa-solid ${t.icon || (cat?cat.icon:'fa-download')}"></i></div>
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${escapeHtmlAC(t.name||'')} ${t.version?`<span style="color:var(--muted);font-weight:600;">(${escapeHtmlAC(t.version)})</span>`:''} ${t.hidden ? `<span class="job-status-badge rejected" style="margin-inline-start:6px;"><i class="fa-solid fa-eye-slash"></i> ${isAR?'مخفي':'Hidden'}</span>` : ''}</div>
                <div class="ac-meta">
                    <span class="job-status-badge approved">${cat ? (isAR?cat.ar:cat.en) : ''}</span>
                    ${t.requiresPrerequisite ? `<span style="color:var(--gold3);"><i class="fa-solid fa-link"></i> ${isAR?'له متطلب: ':'Has prerequisite: '}${escapeHtmlAC(t.prerequisiteLabel||'')}</span>` : ''}
                    <span><i class="fa-solid fa-download"></i> ${t.downloads||0}</span>
                    ${t.downloadUrl ? `<span style="color:var(--green4);"><i class="fa-solid fa-link"></i> ${isAR?'رابط موجود':'Link set'}</span>` : `<span style="color:#e33;"><i class="fa-solid fa-triangle-exclamation"></i> ${isAR?'بدون رابط':'No link'}</span>`}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn hide" onclick="atToggleHidden('${t.id}', ${!t.hidden})"><i class="fa-solid fa-eye${t.hidden?'':'-slash'}"></i> ${t.hidden ? (isAR?'إظهار':'Unhide') : (isAR?'إخفاء':'Hide')}</button>
                <button class="ac-btn" onclick="openToolForm('${t.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="atDeleteTool('${t.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.atToggleHidden = async function(id, hidden) {
        try {
            await window._updateSoftwareTool(id, { hidden });
            const idx = _adminTools.findIndex(t => t.id === id);
            if (idx > -1) _adminTools[idx].hidden = hidden;
            renderAtList();
            showToast(lang==='AR' ? (hidden?'تم الإخفاء':'تم الإظهار') : (hidden?'Hidden':'Visible'));
        } catch(e) { showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.atDeleteTool = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا البرنامج نهائياً؟':'Delete this software permanently?')) return;
        try {
            await window._deleteSoftwareTool(id);
            _adminTools = _adminTools.filter(t => t.id !== id);
            renderAtList();
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.openToolForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adminTools.find(t => t.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const requiresPre = !!v('requiresPrerequisite');
        const modal = document.createElement('div');
        modal.id = 'toolFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل برنامج':'Edit Software') : (isAR?'إضافة برنامج جديد':'Add New Software')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('toolFormModal').remove()"></i>
            </div>
            <div class="proj-form-grid">
                <div class="job-field"><label>${isAR?'اسم البرنامج (عربي) *':'Software Name (Arabic) *'}</label><input type="text" id="at_name" value="${escapeHtmlAC(v('name'))}" placeholder="ArcGIS Pro"></div>
                <div class="job-field"><label>${isAR?'اسم البرنامج (إنجليزي)':'Software Name (English)'}</label><input type="text" id="at_nameEn" value="${escapeHtmlAC(v('nameEn'))}"></div>
                <div class="job-field"><label>${isAR?'الإصدار / النسخة':'Version'}</label><input type="text" id="at_version" value="${escapeHtmlAC(v('version'))}" placeholder="2024 / 3.7 / v18"></div>
                <div class="job-field"><label>${isAR?'التصنيف *':'Category *'}</label>
                    <select id="at_category">${SOFTWARE_CATEGORIES.map(c=>`<option value="${c.key}" ${v('category')===c.key?'selected':''}>${isAR?c.ar:c.en}</option>`).join('')}</select>
                </div>
                <div class="job-field full"><label>${isAR?'رابط التحميل الأساسي *':'Main Download Link *'}</label><input type="url" id="at_url" value="${escapeHtmlAC(v('downloadUrl'))}" placeholder="https://..."></div>
                <div class="job-field full"><label>${isAR?'ملاحظات (اختياري — مثال: Password: 123)':'Notes (optional — e.g. Password: 123)'}</label><input type="text" id="at_notes" value="${escapeHtmlAC(v('notes'))}"></div>
            </div>

            <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="at_requiresPre" ${requiresPre?'checked':''} onchange="atTogglePreFields()"> ${isAR?'هذا البرنامج له متطلب — لازم يتحمّل ملف/رابط تاني الأول قبل التثبيت':'This software has a prerequisite — a separate file/link must be downloaded first before installing'}
            </label>
            <div id="atPreFields" class="proj-form-grid" style="margin-top:10px;display:${requiresPre?'grid':'none'};">
                <div class="job-field"><label>${isAR?'اسم المتطلب':'Prerequisite Name'}</label><input type="text" id="at_preLabel" value="${escapeHtmlAC(v('prerequisiteLabel'))}" placeholder=".NET Framework"></div>
                <div class="job-field"><label>${isAR?'رابط تحميل المتطلب':'Prerequisite Download Link'}</label><input type="url" id="at_preUrl" value="${escapeHtmlAC(v('prerequisiteUrl'))}" placeholder="https://..."></div>
            </div>

            <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="at_hidden" ${v('hidden') ? 'checked' : ''}> ${isAR?'إخفاء عن الطلاب':'Hide from students'}
            </label>

            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="atSaveBtn" onclick="atSaveTool('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.atTogglePreFields = function() {
        const box = document.getElementById('atPreFields');
        const checked = document.getElementById('at_requiresPre')?.checked;
        if (box) box.style.display = checked ? 'grid' : 'none';
    };

    window.atSaveTool = async function(editId) {
        const isAR = lang === 'AR';
        const name = document.getElementById('at_name')?.value.trim();
        const category = document.getElementById('at_category')?.value;
        const downloadUrl = document.getElementById('at_url')?.value.trim();
        const requiresPrerequisite = !!document.getElementById('at_requiresPre')?.checked;
        const prerequisiteUrl = document.getElementById('at_preUrl')?.value.trim() || '';
        if (!name) { showToast(isAR?'من فضلك أدخل اسم البرنامج':'Please enter the software name', true); return; }
        if (!category) { showToast(isAR?'من فضلك اختر تصنيف':'Please select a category', true); return; }
        if (!downloadUrl) { showToast(isAR?'من فضلك أدخل رابط التحميل':'Please enter the download link', true); return; }
        if (requiresPrerequisite && !prerequisiteUrl) { showToast(isAR?'من فضلك أدخل رابط المتطلب':'Please enter the prerequisite link', true); return; }

        const data = {
            name,
            nameEn: document.getElementById('at_nameEn')?.value.trim() || '',
            version: document.getElementById('at_version')?.value.trim() || '',
            category,
            downloadUrl,
            notes: document.getElementById('at_notes')?.value.trim() || '',
            requiresPrerequisite,
            prerequisiteLabel: document.getElementById('at_preLabel')?.value.trim() || '',
            prerequisiteUrl,
            hidden: !!document.getElementById('at_hidden')?.checked,
        };

        const btn = document.getElementById('atSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateSoftwareTool(editId, data);
            else await window._addSoftwareTool(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('toolFormModal')?.remove();
            loadAdminTools();
        } catch(e) {
            console.error('Tool save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };


    /* seed tips shared with the student journey — kept in sync manually with student.html's INS_SEED_TIPS */
    const ADMIN_SEED_TIPS = [
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

    /* ─── ADMIN: DAILY TIPS ─── */
    let _adminTips = [];

    function renderAdminTips(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة نصيحة اليوم':'Manage Daily Tips'}</h2>
            <p>${isAR?'أول ١٥ بوكس ثابتين. أي نصيحة تضيفها هنا بتتحول لبوكس جديد بعد رقم ١٥ في رحلة النصايح عند الطالب، بالترتيب اللي بتضيفها بيه. حدد تاريخ معين لأي نصيحة عشان تظهر للطلاب في اليوم ده بالظبط، أو سيبها من غير تاريخ عشان تدخل في الترتيب التلقائي.':'The first 15 boxes are fixed. Any tip you add here becomes a new box after box 15 in the student\'s tips journey, in the order you add them. Set a specific date for a tip to have it shown to students on exactly that day, or leave it undated to join the automatic rotation.'}</p>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openTipForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة نصيحة جديدة (بوكس جديد)':'Add New Tip (New Box)'}</button>
        <div id="dtList"></div>`;
        loadAdminTips();
    }

    async function loadAdminTips() {
        const list = document.getElementById('dtList');
        if (list) list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        let fsTips = [];
        try { fsTips = await window._loadDailyTips(); }
        catch(e) { console.error(e); fsTips = []; }
        // combined order = seed tips (boxes 1-15) then added tips in creation order — same order students see in their box journey
        _adminTips = [...ADMIN_SEED_TIPS.map(t => ({ ...t, _seed: true })), ...fsTips];
        renderDtList();
    }

    function renderDtList() {
        const isAR = lang === 'AR';
        const list = document.getElementById('dtList');
        if (!list) return;
        if (!_adminTips.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد نصايح مضافة بعد':'No tips added yet'}</div>`;
            return;
        }
        // box numbers must reflect the actual journey order (seed tips 1-15, then added tips by creation order) — computed BEFORE any display re-sorting below
        const boxNumOf = new Map(_adminTips.map((t, i) => [t.id, i + 1]));
        // for display only: tips with a scheduled date are ordered by that date first, undated tips (auto-rotation) follow in creation order
        const sorted = [..._adminTips].sort((a, b) => {
            if (a.scheduledDate && b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
            if (a.scheduledDate && !b.scheduledDate) return -1;
            if (!a.scheduledDate && b.scheduledDate) return 1;
            return (boxNumOf.get(a.id)||0) - (boxNumOf.get(b.id)||0);
        });
        list.innerHTML = sorted.map((t) => `
        <div class="ac-row">
            <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:${t.color||'var(--g4)'};border:1px solid var(--border);font-size:18px;"><i class="fa-solid ${t.icon || 'fa-lightbulb'}"></i></div>
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${isAR?'بوكس':'Box'} ${boxNumOf.get(t.id)||'?'} — ${escapeHtmlAC(t.titleAR||'')}</div>
                <div class="ac-meta">
                    <span class="job-status-badge approved">${escapeHtmlAC(t.categoryAR||t.categoryEN||'')}</span>
                    ${t._seed ? `<span style="font-size:11.5px;color:var(--muted);">${isAR?'نصيحة أساسية':'Seed tip'}</span>` : (t.scheduledDate ? `<span class="job-status-badge pending"><i class="fa-solid fa-calendar-day"></i> ${escapeHtmlAC(t.scheduledDate)}</span>` : `<span style="font-size:11.5px;color:var(--muted);">${isAR?'بالترتيب التلقائي':'Auto rotation'}</span>`)}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn" onclick="dtShowEngagement('${t.id}','likes')"><i class="fa-solid fa-heart"></i> ${t.likes||0}</button>
                <button class="ac-btn" onclick="dtShowEngagement('${t.id}','shares')"><i class="fa-solid fa-share-nodes"></i> ${t.shares||0}</button>
                ${t._seed ? '' : `
                <button class="ac-btn" onclick="openTipForm('${t.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="dtDeleteTip('${t.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>`}
            </div>
        </div>`).join('');
    }

    /* shows which students liked or shared a specific tip */
    window.dtShowEngagement = async function(tipId, type) {
        const isAR = lang === 'AR';
        const modal = document.createElement('div');
        modal.id = 'tipEngModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        const heading = type === 'likes' ? (isAR?'الطلبة اللي عملوا إعجاب':'Students who liked this') : (isAR?'الطلبة اللي عملوا مشاركة':'Students who shared this');
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;"><i class="fa-solid ${type==='likes'?'fa-heart':'fa-share-nodes'}"></i> ${heading}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('tipEngModal').remove()"></i>
            </div>
            <div id="tipEngList"><div style="text-align:center;padding:24px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div></div>
        </div>`;
        document.body.appendChild(modal);
        try {
            const users = await window._loadAllUsers();
            const field = type === 'likes' ? 'tipLikes' : 'tipShares';
            const matched = users.filter(u => Array.isArray(u[field]) && u[field].includes(tipId));
            const listEl = document.getElementById('tipEngList');
            if (!listEl) return;
            if (!matched.length) {
                listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'محدش عمل ده لسه':'No one yet'}</div>`;
                return;
            }
            listEl.innerHTML = matched.map(u => `
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
                <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--g3),var(--gold3));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;">${(u.firstName||'؟')[0].toUpperCase()}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;">${escapeHtmlAC(u.firstName||'')} ${escapeHtmlAC(u.lastName||'')}</div>
                    <div style="font-size:11px;color:var(--muted);">${escapeHtmlAC(u.email||'')}</div>
                </div>
            </div>`).join('');
        } catch(e) {
            console.error('dtShowEngagement error:', e);
            const listEl = document.getElementById('tipEngList');
            if (listEl) listEl.innerHTML = `<div style="text-align:center;padding:20px;color:#e74c3c;font-size:13px;">${isAR?'حصل خطأ في التحميل':'An error occurred while loading'}</div>`;
        }
    };

    window.dtDeleteTip = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذه النصيحة نهائياً؟':'Delete this tip permanently?')) return;
        try {
            await window._deleteDailyTip(id);
            _adminTips = _adminTips.filter(t => t.id !== id);
            renderDtList();
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.openTipForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adminTips.find(t => t.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'tipFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل نصيحة':'Edit Tip') : (isAR?'إضافة نصيحة جديدة':'Add New Tip')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('tipFormModal').remove()"></i>
            </div>
            <div class="proj-form-grid">
                <div class="job-field full">
                    <label>${isAR?'تاريخ ظهور النصيحة للطلاب':'Date this tip shows to students'}</label>
                    <input type="date" id="dt_date" value="${escapeHtmlAC(v('scheduledDate'))}">
                    <p style="font-size:11px;color:var(--muted);margin-top:4px;">${isAR?'سيب الحقل فاضي لو عايز النصيحة تدخل في الترتيب التلقائي (نصيحة جديدة كل يوم) بدل ما تكون في تاريخ محدد.':'Leave empty to let the tip join the automatic daily rotation instead of a fixed date.'}</p>
                </div>
                <div class="job-field"><label>${isAR?'التصنيف (عربي) *':'Category (Arabic) *'}</label><input type="text" id="dt_catAR" value="${escapeHtmlAC(v('categoryAR'))}" placeholder="GIS"></div>
                <div class="job-field"><label>${isAR?'التصنيف (إنجليزي)':'Category (English)'}</label><input type="text" id="dt_catEN" value="${escapeHtmlAC(v('categoryEN'))}" placeholder="GIS"></div>
                <div class="job-field full"><label>${isAR?'عنوان النصيحة (عربي) *':'Tip Title (Arabic) *'}</label><input type="text" id="dt_titleAR" value="${escapeHtmlAC(v('titleAR'))}"></div>
                <div class="job-field full"><label>${isAR?'عنوان النصيحة (إنجليزي)':'Tip Title (English)'}</label><input type="text" id="dt_titleEN" value="${escapeHtmlAC(v('titleEN'))}"></div>
                <div class="job-field full"><label>${isAR?'نص النصيحة (عربي) * — تقدر تستخدم <strong> و<br>':'Tip Body (Arabic) * — you can use <strong> and <br>'}</label><textarea id="dt_bodyAR" rows="4" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;">${(v('bodyAR')||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea></div>
                <div class="job-field full"><label>${isAR?'نص النصيحة (إنجليزي)':'Tip Body (English)'}</label><textarea id="dt_bodyEN" rows="4" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;">${(v('bodyEN')||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea></div>
                <div class="job-field"><label>${isAR?'أيقونة (Font Awesome class)':'Icon (Font Awesome class)'}</label><input type="text" id="dt_icon" value="${escapeHtmlAC(v('icon'))}" placeholder="fa-lightbulb"></div>
                <div class="job-field"><label>${isAR?'لون':'Color'}</label><input type="text" id="dt_color" value="${escapeHtmlAC(v('color'))}" placeholder="#1e7a34"></div>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin-top:8px;">${isAR?'ملاحظة: بيتم كتابة الـ HTML اللي بتحطه في النص زي (<strong>، <br>، <ul><li>) زي ما هو من غير تعديل، فخليك حذر وتأكد إن الوسوم متقفلة صح.':'Note: any HTML you type in the body (like <strong>, <br>, <ul><li>) is stored as-is, so make sure tags are properly closed.'}</p>
            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="dtSaveBtn" onclick="dtSaveTip('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
        // unescape the textareas back to real HTML tags for editing (they were entity-escaped only for safe injection into value/innerHTML above)
        const taAR = document.getElementById('dt_bodyAR'); if (taAR) taAR.value = v('bodyAR') || '';
        const taEN = document.getElementById('dt_bodyEN'); if (taEN) taEN.value = v('bodyEN') || '';
    };

    window.dtSaveTip = async function(editId) {
        const isAR = lang === 'AR';
        const categoryAR = document.getElementById('dt_catAR')?.value.trim();
        const titleAR = document.getElementById('dt_titleAR')?.value.trim();
        const bodyAR = document.getElementById('dt_bodyAR')?.value.trim();
        if (!categoryAR) { showToast(isAR?'من فضلك أدخل التصنيف':'Please enter the category', true); return; }
        if (!titleAR) { showToast(isAR?'من فضلك أدخل عنوان النصيحة':'Please enter the tip title', true); return; }
        if (!bodyAR) { showToast(isAR?'من فضلك أدخل نص النصيحة':'Please enter the tip body', true); return; }

        const data = {
            categoryAR,
            categoryEN: document.getElementById('dt_catEN')?.value.trim() || categoryAR,
            titleAR,
            titleEN: document.getElementById('dt_titleEN')?.value.trim() || titleAR,
            bodyAR,
            bodyEN: document.getElementById('dt_bodyEN')?.value.trim() || bodyAR,
            icon: document.getElementById('dt_icon')?.value.trim() || 'fa-lightbulb',
            color: document.getElementById('dt_color')?.value.trim() || '#1e7a34',
            scheduledDate: document.getElementById('dt_date')?.value.trim() || null,
        };

        const btn = document.getElementById('dtSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateDailyTip(editId, data);
            else await window._addDailyTip(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('tipFormModal')?.remove();
            loadAdminTips();
        } catch(e) {
            console.error('Tip save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: DAILY & WEEKLY CHALLENGE (one scheduled question per date) ─── */
    let _adminDCQs = [];
    let _adminDCWeekly = { enabled: true, bonusCoins: 100 };

    function renderAdminDailyChallenges(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة التحدي اليومي والأسبوعي':'Manage Daily & Weekly Challenge'}</h2>
            <p style="font-size:12.5px;color:var(--muted);line-height:1.9;">${isAR?'خريطة الكنز: كل سؤال "يومي" مرتبط بتاريخ ويظهر للطلاب كدايرة في يومه فقط (بتوقيت القاهرة). أسئلة "أسبوعي" هي صناديق الكنز بالترتيب (الأقدم تاريخاً = صندوق المرحلة 1 وهكذا) وتفتح للطالب بعد 7 أيام صح ورا بعض، ومكافأتها حسب حقل العملات (الافتراضي 70). سيب عدد العملات 70 للأسئلة الأسبوعية.':'Treasure map: each "daily" question is a circle shown only on its date (Cairo time). "Weekly" questions are the treasure chests in order (oldest date = stage 1 chest, and so on) and unlock after 7 correct days in a row; the reward is the coins field (default 70). Set 70 coins on weekly questions.'}</p>
        </div>
        <div class="form-card" id="dcWeeklySettingsCard" style="margin-bottom:16px;display:none;">
            <div style="text-align:center;padding:20px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openDCForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة سؤال جديد':'Add New Question'}</button>
        <div id="dcList"></div>`;
        loadAdminDailyChallenges();
    }

    async function loadAdminDailyChallenges() {
        const list = document.getElementById('dcList');
        if (list) list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        try { _adminDCQs = await window._loadDailyChallengeQs(); }
        catch(e) { console.error(e); _adminDCQs = []; }
        try { _adminDCWeekly = await window._loadWeeklyChallengeSettings(); }
        catch(e) { console.error(e); _adminDCWeekly = { ...window.DEFAULT_WEEKLY_CHALLENGE_SETTINGS }; }
        renderDCWeeklySettingsCard();
        renderDCList();
    }

    function renderDCWeeklySettingsCard() {
        const card = document.getElementById('dcWeeklySettingsCard');
        if (!card) return;
        const isAR = lang === 'AR';
        const s = _adminDCWeekly;
        card.innerHTML = `
        <h3><i class="fa-solid fa-gift" style="color:var(--gold3);margin-left:8px;"></i>${isAR?'مكافأة إكمال التحدي الأسبوعي':'Weekly Challenge Completion Bonus'}</h3>
        <div class="form-grid">
            <div class="form-group">
                <label>${isAR?'عدد العملات الإضافية عند إكمال كل أسئلة الأسبوع':'Bonus coins for completing every question in the week'}</label>
                <input type="number" min="0" id="dcw_bonus" value="${s.bonusCoins||0}">
            </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:10px;">
            <input type="checkbox" id="dcw_enabled" ${s.enabled?'checked':''}> ${isAR?'تفعيل مكافأة إكمال الأسبوع':'Enable weekly completion bonus'}
        </label>
        <button class="btn-save" style="margin-top:14px;width:auto;padding:10px 22px;" onclick="saveDCWeeklySettings()"><i class="fa-solid fa-floppy-disk"></i> <span>${isAR?'حفظ':'Save'}</span></button>`;
    }

    window.saveDCWeeklySettings = async function() {
        const isAR = lang === 'AR';
        const bonusCoins = parseInt(document.getElementById('dcw_bonus')?.value, 10) || 0;
        const enabled = !!document.getElementById('dcw_enabled')?.checked;
        try {
            await window._saveWeeklyChallengeSettings({ bonusCoins, enabled });
            _adminDCWeekly = { bonusCoins, enabled };
            showToast(isAR?'تم الحفظ':'Saved');
        } catch(e) { console.error(e); showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true); }
    };

    function dcWeekStartOf(dateStr) {
        // returns the Sunday (YYYY-MM-DD) of the week containing dateStr
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().slice(0, 10);
    }

    function renderDCList() {
        const isAR = lang === 'AR';
        const list = document.getElementById('dcList');
        if (!list) return;
        if (!_adminDCQs.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد أسئلة مضافة بعد':'No questions added yet'}</div>`;
            return;
        }
        const sorted = [..._adminDCQs].sort((a, b) => (a.scheduledDate||'').localeCompare(b.scheduledDate||''));
        const diffLabel = (d) => ({ easy: isAR?'سهل':'Easy', medium: isAR?'متوسط':'Medium', hard: isAR?'صعب':'Hard' }[d] || d || '');
        list.innerHTML = sorted.map((c) => `
        <div class="ac-row">
            <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:${c.type==='weekly'?'var(--g4)':'var(--gold3)'};border:1px solid var(--border);font-size:16px;">
                <i class="fa-solid ${c.type==='weekly'?'fa-calendar-week':'fa-calendar-day'}"></i>
            </div>
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${escapeHtmlAC(c.questionAR||'')}</div>
                <div class="ac-meta">
                    <span class="job-status-badge ${c.type==='weekly'?'pending':'approved'}"><i class="fa-solid fa-calendar-day"></i> ${escapeHtmlAC(c.scheduledDate||'')}</span>
                    <span class="job-status-badge approved">${c.type==='weekly'?(isAR?'أسبوعي':'Weekly'):(isAR?'يومي':'Daily')}</span>
                    <span style="font-size:11.5px;color:var(--muted);">${diffLabel(c.difficulty)}</span>
                    <span class="job-status-badge approved"><i class="fa-solid fa-coins"></i> ${c.coins||0} ${isAR?'عملة':'coins'}</span>
                    <span style="font-size:11.5px;color:var(--muted);">${isAR?'الإجابة الصح':'Correct'}: ${escapeHtmlAC((c.optionsAR||[])[c.correctIndex]||'')}</span>
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn" onclick="openDCForm('${c.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="dcDeleteQuestion('${c.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`).join('');
    }