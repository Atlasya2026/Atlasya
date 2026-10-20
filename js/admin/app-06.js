
    window.onACFilterChange = function() {
        _acSearch = document.getElementById('acSearchInput')?.value.trim().toLowerCase() || '';
        _acStatusFilter = document.getElementById('acStatusSelect')?.value || 'all';
        _acCompanyFilter = document.getElementById('acCompanySelect')?.value || '';
        renderACFilteredList(lang === 'AR');
    };

    function renderACFilteredList(isAR) {
        const list = document.getElementById('acCoursesList');
        if (!list) return;
        let items = [..._acAllCourses];
        if (_acStatusFilter !== 'all') items = items.filter(c => c.status === _acStatusFilter);
        if (_acCompanyFilter) items = items.filter(c => c.companyName === _acCompanyFilter);
        if (_acSearch) items = items.filter(c => (c.title||'').toLowerCase().includes(_acSearch) || (c.companyName||'').toLowerCase().includes(_acSearch));

        if (!items.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد كورسات مطابقة':'No matching courses'}</div>`;
            return;
        }
        list.innerHTML = items.map(c => acCourseRowHTML(c, isAR)).join('');
    }

    function acCourseRowHTML(c, isAR) {
        const statusCls = c.status || 'pending';
        const statusTxt = { pending: isAR?'قيد المراجعة':'Pending', approved: isAR?'منشور':'Approved', rejected: isAR?'مرفوض':'Rejected' }[statusCls] || statusCls;
        return `
        <div class="ac-row">
            <div class="ac-main">
                <div class="ac-title">${escapeHtmlAC(c.title||'')} ${c.hidden ? `<span class="job-status-badge rejected" style="margin-inline-start:6px;"><i class="fa-solid fa-eye-slash"></i> ${isAR?'مخفي':'Hidden'}</span>` : ''}</div>
                <div class="ac-company"><i class="fa-solid fa-building"></i> ${escapeHtmlAC(c.companyName||'')}</div>
                ${c.description ? `<div class="ac-desc">${escapeHtmlAC(c.description)}</div>` : ''}
                <div class="ac-meta">
                    <span class="job-status-badge ${statusCls}">${statusTxt}</span>
                    <span><i class="fa-solid fa-eye"></i> ${c.views||0}</span>
                    <span><i class="fa-solid fa-user-graduate"></i> ${c.interestedCount||0}</span>
                    ${c.level ? `<span><i class="fa-solid fa-layer-group"></i> ${escapeHtmlAC(c.level)}</span>` : ''}
                    ${(c.price && Number(c.price)>0) ? `<span><i class="fa-solid fa-tag"></i> ${c.price} ${isAR?'ج.م':'EGP'}</span>` : `<span>${isAR?'مجاني':'Free'}</span>`}
                </div>
            </div>
            <div class="ac-actions">
                ${statusCls !== 'approved' ? `<button class="ac-btn approve" onclick="acSetStatus('${c.id}','approved')"><i class="fa-solid fa-check"></i> ${isAR?'موافقة':'Approve'}</button>` : ''}
                ${statusCls !== 'rejected' ? `<button class="ac-btn reject" onclick="acSetStatus('${c.id}','rejected')"><i class="fa-solid fa-xmark"></i> ${isAR?'رفض':'Reject'}</button>` : ''}
                <button class="ac-btn hide" onclick="acToggleHidden('${c.id}', ${!c.hidden})"><i class="fa-solid fa-eye${c.hidden?'':'-slash'}"></i> ${c.hidden ? (isAR?'إظهار':'Unhide') : (isAR?'إخفاء':'Hide')}</button>
                <button class="ac-btn" onclick="acOpenEdit('${c.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="acDeleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.acSetStatus = async function(id, status) {
        const isAR = lang === 'AR';
        try {
            await window._updateCourseStatus(id, status);
            showToast(status==='approved' ? (isAR?'✅ تمت الموافقة على الكورس':'✅ Course approved') : (isAR?'تم رفض الكورس':'Course rejected'));
            const idx = _acAllCourses.findIndex(c => c.id === id);
            if (idx > -1) _acAllCourses[idx].status = status;
            renderACFilteredList(isAR);
        } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
    };

    window.acToggleHidden = async function(id, hidden) {
        const isAR = lang === 'AR';
        try {
            await window._updateCourseHidden(id, hidden);
            const idx = _acAllCourses.findIndex(c => c.id === id);
            if (idx > -1) _acAllCourses[idx].hidden = hidden;
            renderACFilteredList(isAR);
        } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
    };

    window.acDeleteCourse = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا الكورس نهائياً؟':'Delete this course permanently?')) return;
        try {
            await window._deleteCourseAdmin(id);
            showToast(isAR?'🗑️ تم حذف الكورس':'🗑️ Course deleted');
            _acAllCourses = _acAllCourses.filter(c => c.id !== id);
            renderACFilteredList(isAR);
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.acOpenEdit = function(id) {
        const c = _acAllCourses.find(x => x.id === id);
        if (!c) return;
        const isAR = lang === 'AR';
        const modal = document.createElement('div');
        modal.id = 'acEditModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${isAR?'تعديل الكورس':'Edit Course'}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('acEditModal').remove()"></i>
            </div>
            <div class="proj-form-grid">
                <div class="job-field full"><label>${isAR?'اسم الكورس':'Title'}</label><input type="text" id="acE_title" value="${escapeHtmlAC(c.title)}"></div>
                <div class="job-field full"><label>${isAR?'الوصف':'Description'}</label><textarea id="acE_desc">${escapeHtmlAC(c.description)}</textarea></div>
                <div class="job-field"><label>${isAR?'المستوى':'Level'}</label><input type="text" id="acE_level" value="${escapeHtmlAC(c.level||'')}"></div>
                <div class="job-field"><label>${isAR?'المدة':'Duration'}</label><input type="text" id="acE_duration" value="${escapeHtmlAC(c.duration||'')}"></div>
                <div class="job-field"><label>${isAR?'السعر':'Price'}</label><input type="number" id="acE_price" value="${c.price||0}"></div>
                <div class="job-field full"><label>${isAR?'رابط اليوتيوب':'YouTube URL'}</label><input type="url" id="acE_yt" value="${escapeHtmlAC(c.youtubeUrl||'')}"></div>
            </div>
            <button class="btn-post-job" style="width:100%;margin-top:12px;" onclick="acSaveEdit('${c.id}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ التعديلات':'Save Changes'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.acSaveEdit = async function(id) {
        const isAR = lang === 'AR';
        const data = {
            title: document.getElementById('acE_title')?.value.trim(),
            description: document.getElementById('acE_desc')?.value.trim(),
            level: document.getElementById('acE_level')?.value.trim(),
            duration: document.getElementById('acE_duration')?.value.trim(),
            price: Number(document.getElementById('acE_price')?.value || 0),
            youtubeUrl: document.getElementById('acE_yt')?.value.trim(),
        };
        try {
            await window._updateCourseAdmin(id, data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('acEditModal')?.remove();
            const idx = _acAllCourses.findIndex(c => c.id === id);
            if (idx > -1) _acAllCourses[idx] = { ..._acAllCourses[idx], ...data };
            renderACFilteredList(isAR);
        } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
    };

    /* ─── ADMIN: FREE COURSES MANAGEMENT ─── */
    function acFreeCourseRowHTML(c, isAR) {
        return `
        <div class="ac-row">
            <div class="ac-main">
                <div class="ac-title">${escapeHtmlAC(c.title||'')}</div>
                ${c.description ? `<div class="ac-desc">${escapeHtmlAC(c.description)}</div>` : ''}
                <div class="ac-meta">
                    ${c.source ? `<span><i class="fa-solid fa-graduation-cap"></i> ${escapeHtmlAC(c.source)}</span>` : ''}
                    ${c.hours ? `<span><i class="fa-solid fa-clock"></i> ${escapeHtmlAC(String(c.hours))} ${isAR?'ساعة':'hrs'}</span>` : ''}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn" onclick="openFreeCourseAdminForm('${c.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="acDeleteFreeCourse('${c.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.openFreeCourseAdminForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _acFreeCourses.find(c => c.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'acFreeModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:520px;width:100%;max-height:88vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل كورس مجاني':'Edit Free Course') : (isAR?'إضافة كورس مجاني':'Add Free Course')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('acFreeModal').remove()"></i>
            </div>
            <div class="job-field"><label>${isAR?'اسم الكورس':'Title'}</label><input type="text" id="fc_title" value="${escapeHtmlAC(v('title'))}"></div>
            <div class="job-field"><label>${isAR?'الوصف':'Description'}</label><textarea id="fc_desc">${escapeHtmlAC(v('description'))}</textarea></div>
            <div class="job-field"><label>${isAR?'رابط اليوتيوب':'YouTube URL'}</label><input type="url" id="fc_yt" value="${escapeHtmlAC(v('youtubeUrl'))}"></div>
            <div class="job-field"><label>${isAR?'رابط الكورس':'Course Link'}</label><input type="url" id="fc_url" value="${escapeHtmlAC(v('enrollUrl'))}"></div>
            <div class="job-field"><label>${isAR?'عدد الساعات':'Hours'}</label><input type="number" id="fc_hours" value="${v('hours')}"></div>
            <div class="job-field"><label>${isAR?'مصدر الكورس':'Source'}</label><input type="text" id="fc_source" value="${escapeHtmlAC(v('source'))}"></div>
            <button class="btn-post-job" style="width:100%;margin-top:10px;" onclick="acSaveFreeCourse('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.acSaveFreeCourse = async function(editId) {
        const isAR = lang === 'AR';
        const data = {
            title: document.getElementById('fc_title')?.value.trim(),
            description: document.getElementById('fc_desc')?.value.trim(),
            youtubeUrl: document.getElementById('fc_yt')?.value.trim(),
            enrollUrl: document.getElementById('fc_url')?.value.trim(),
            hours: Number(document.getElementById('fc_hours')?.value || 0),
            source: document.getElementById('fc_source')?.value.trim(),
        };
        if (!data.title) { showToast(isAR?'من فضلك أدخل اسم الكورس':'Please enter a title', true); return; }
        try {
            if (editId) await window._updateFreeCourse(editId, data);
            else await window._addFreeCourse(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('acFreeModal')?.remove();
            renderACBody();
        } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
    };

    window.acDeleteFreeCourse = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا الكورس نهائياً؟':'Delete this course permanently?')) return;
        try {
            await window._deleteFreeCourse(id);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
            _acFreeCourses = _acFreeCourses.filter(c => c.id !== id);
            renderACBody();
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    /* ─── ADMIN: DIGITAL LIBRARY (ATLASYA) ─── */
    let _libBooks = [];
    let _libSearch = '';
    let _libCatFilter = '';
    let _libLangFilter = '';
    let _libCoverPending = '';   // base64 of a newly-picked cover, staged until Save
    let _libPdfPending = '';     // base64 of a newly-picked PDF, staged until Save
    let _libPdfPendingName = '';

    const LIBRARY_CATEGORIES = [
        { key:'gis',        ar:'GIS',                          en:'GIS',                icon:'🌍' },
        { key:'remote',     ar:'الاستشعار عن بعد',              en:'Remote Sensing',     icon:'🛰️' },
        { key:'cartography',ar:'الخرائط (Cartography)',         en:'Cartography',        icon:'🗺️' },
        { key:'surveying',  ar:'المساحة (Surveying)',           en:'Surveying',          icon:'📐' },
        { key:'geography',  ar:'الجغرافيا',                     en:'Geography',          icon:'🌎' },
        { key:'hydrology',  ar:'الهيدرولوجيا',                  en:'Hydrology',          icon:'🌊' },
        { key:'urban',      ar:'التخطيط العمراني',              en:'Urban Planning',     icon:'🏙️' },
        { key:'environment',ar:'علوم البيئة',                   en:'Environmental Science', icon:'🌾' },
        { key:'cs',         ar:'علوم الحاسب',                   en:'Computer Science',   icon:'🧠' },
        { key:'theses',     ar:'رسائل ماجستير ودكتوراه',        en:'Theses (MSc/PhD)',   icon:'📑' },
        { key:'refs_ar',    ar:'مراجع عربية',                   en:'Arabic References',  icon:'📖' },
        { key:'refs_en',    ar:'مراجع إنجليزية',                en:'English References', icon:'📘' },
    ];
    function libCatLabel(key, isAR) {
        const c = LIBRARY_CATEGORIES.find(c => c.key === key);
        if (!c) return isAR ? 'غير مصنّف' : 'Uncategorized';
        return `${c.icon} ${isAR ? c.ar : c.en}`;
    }

    function renderAdminLibrary(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة المكتبة الرقمية':'Manage Digital Library'}</h2>
            <p>${isAR?'أضف وعدّل وحذف الكتب والمراجع العلمية في مكتبة ATLASYA':'Add, edit, and remove books and references in the ATLASYA library'}</p>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openLibraryBookForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة كتاب جديد':'Add New Book'}</button>
        <div class="ac-toolbar">
            <input type="text" id="libSearchInput" placeholder="${isAR?'ابحث بالاسم أو المؤلف أو الكلمات المفتاحية...':'Search by title, author, or keywords...'}" value="${_libSearch}" oninput="onLibFilterChange()">
            <select id="libCatSelect" onchange="onLibFilterChange()">
                <option value="">${isAR?'كل التصنيفات':'All Categories'}</option>
                ${LIBRARY_CATEGORIES.map(c => `<option value="${c.key}" ${_libCatFilter===c.key?'selected':''}>${c.icon} ${isAR?c.ar:c.en}</option>`).join('')}
            </select>
            <select id="libLangSelect" onchange="onLibFilterChange()">
                <option value="">${isAR?'كل اللغات':'All Languages'}</option>
                <option value="AR" ${_libLangFilter==='AR'?'selected':''}>${isAR?'عربي':'Arabic'}</option>
                <option value="EN" ${_libLangFilter==='EN'?'selected':''}>${isAR?'إنجليزي':'English'}</option>
            </select>
        </div>
        <div id="libStatsRow" style="display:flex;gap:10px;margin:4px 0 16px;flex-wrap:wrap;"></div>
        <div id="libBooksList"><div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div></div>`;
        loadLibraryAdminList();
    }

    async function loadLibraryAdminList() {
        try { _libBooks = await window._loadLibraryBooksAdmin(); } catch(e) { console.error(e); _libBooks = []; }
        const isAR = lang === 'AR';
        const stats = document.getElementById('libStatsRow');
        if (stats) {
            const totalDownloads = _libBooks.reduce((s,b) => s + (b.downloads||0), 0);
            stats.innerHTML = `
                <div class="lib-stat-chip"><i class="fa-solid fa-book"></i> ${_libBooks.length} ${isAR?'كتاب':'books'}</div>
                <div class="lib-stat-chip"><i class="fa-solid fa-download"></i> ${totalDownloads} ${isAR?'تحميل':'downloads'}</div>
                <div class="lib-stat-chip"><i class="fa-solid fa-eye-slash"></i> ${_libBooks.filter(b=>b.hidden).length} ${isAR?'مخفي':'hidden'}</div>`;
        }
        renderLibraryFilteredList(isAR);
    }

    window.onLibFilterChange = function() {
        _libSearch = document.getElementById('libSearchInput')?.value.trim().toLowerCase() || '';
        _libCatFilter = document.getElementById('libCatSelect')?.value || '';
        _libLangFilter = document.getElementById('libLangSelect')?.value || '';
        renderLibraryFilteredList(lang === 'AR');
    };

    function renderLibraryFilteredList(isAR) {
        const list = document.getElementById('libBooksList');
        if (!list) return;
        let items = [..._libBooks];
        if (_libCatFilter) items = items.filter(b => b.category === _libCatFilter);
        if (_libLangFilter) items = items.filter(b => b.language === _libLangFilter);
        if (_libSearch) items = items.filter(b =>
            (b.title||'').toLowerCase().includes(_libSearch) ||
            (b.author||'').toLowerCase().includes(_libSearch) ||
            (b.keywords||'').toLowerCase().includes(_libSearch));

        if (!items.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد كتب مطابقة':'No matching books'}</div>`;
            return;
        }
        list.innerHTML = items.map(b => libBookRowHTML(b, isAR)).join('');
    }

    function libBookRowHTML(b, isAR) {
        const cover = b.coverData
            ? `<img src="${b.coverData}" style="width:52px;height:70px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--border);">`
            : `<div style="width:52px;height:70px;border-radius:6px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--muted);border:1px solid var(--border);"><i class="fa-solid fa-book"></i></div>`;
        return `
        <div class="ac-row" style="align-items:flex-start;">
            ${cover}
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${escapeHtmlAC(b.title||'')} ${b.hidden ? `<span class="job-status-badge rejected" style="margin-inline-start:6px;"><i class="fa-solid fa-eye-slash"></i> ${isAR?'مخفي':'Hidden'}</span>` : ''}</div>
                ${b.author ? `<div class="ac-company"><i class="fa-solid fa-user-pen"></i> ${escapeHtmlAC(b.author)}</div>` : ''}
                <div class="ac-meta">
                    <span class="job-status-badge approved">${libCatLabel(b.category, isAR)}</span>
                    ${b.language ? `<span><i class="fa-solid fa-language"></i> ${b.language==='AR'?(isAR?'عربي':'Arabic'):(isAR?'إنجليزي':'English')}</span>` : ''}
                    ${b.year ? `<span><i class="fa-solid fa-calendar"></i> ${escapeHtmlAC(String(b.year))}</span>` : ''}
                    ${b.pages ? `<span><i class="fa-solid fa-file-lines"></i> ${escapeHtmlAC(String(b.pages))} ${isAR?'صفحة':'pages'}</span>` : ''}
                    <span><i class="fa-solid fa-download"></i> ${b.downloads||0}</span>
                    <span><i class="fa-solid fa-eye"></i> ${b.views||0}</span>
                    ${b.pdfData ? `<span style="color:var(--green4);"><i class="fa-solid fa-file-pdf"></i> PDF</span>` : (b.downloadUrl ? `<span style="color:var(--gold3);"><i class="fa-solid fa-link"></i> ${isAR?'رابط خارجي':'External link'}</span>` : `<span style="color:#e33;"><i class="fa-solid fa-triangle-exclamation"></i> ${isAR?'بدون ملف':'No file'}</span>`)}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn hide" onclick="libToggleHidden('${b.id}', ${!b.hidden})"><i class="fa-solid fa-eye${b.hidden?'':'-slash'}"></i> ${b.hidden ? (isAR?'إظهار':'Unhide') : (isAR?'إخفاء':'Hide')}</button>
                <button class="ac-btn" onclick="openLibraryBookForm('${b.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="libDeleteBook('${b.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.libToggleHidden = async function(id, hidden) {
        try {
            await window._toggleLibraryBookHidden(id, hidden);
            const idx = _libBooks.findIndex(b => b.id === id);
            if (idx > -1) _libBooks[idx].hidden = hidden;
            renderLibraryFilteredList(lang === 'AR');
            showToast(lang==='AR' ? (hidden?'تم إخفاء الكتاب':'تم إظهار الكتاب') : (hidden?'Book hidden':'Book visible'));
        } catch(e) { showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.libDeleteBook = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا الكتاب نهائياً؟':'Delete this book permanently?')) return;
        try {
            await window._deleteLibraryBook(id);
            _libBooks = _libBooks.filter(b => b.id !== id);
            renderLibraryFilteredList(isAR);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    /* Compress a book cover image to a small JPEG data URL (kept well under Firestore's field limit) */
    function _compressLibraryCover(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const LIMIT = 220000; // ~220KB base64 — leaves room for the PDF in the same document
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

    window.libHandleCoverPick = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        try {
            const dataUrl = await _compressLibraryCover(file);
            _libCoverPending = dataUrl;
            const prev = document.getElementById('libCoverPreview');
            if (prev) prev.src = dataUrl;
        } catch(err) {
            showToast(isAR?'تعذّرت معالجة الصورة':'Could not process the image', true);
        }
    };

    const LIB_PDF_MAX_BYTES = 550000; // ~550KB raw ≈ ~730KB as base64, keeps the whole book doc under Firestore's ~1MB field limit

    window.libHandlePdfPick = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        if (file.type !== 'application/pdf') {
            showToast(isAR?'من فضلك اختر ملف PDF فقط':'Please select a PDF file only', true);
            e.target.value = '';
            return;
        }
        if (file.size > LIB_PDF_MAX_BYTES) {
            showToast(isAR ? `⚠️ الملف كبير جداً (الحد الأقصى تقريباً ${Math.round(LIB_PDF_MAX_BYTES/1024)}KB). استخدم حقل "رابط خارجي" بدلاً من ذلك لو الملف أكبر.` : `⚠️ File too large (max ~${Math.round(LIB_PDF_MAX_BYTES/1024)}KB). Use the "External link" field instead for larger files.`, true);
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            _libPdfPending = ev.target.result;
            _libPdfPendingName = file.name;
            const lbl = document.getElementById('libPdfPickedLabel');
            if (lbl) lbl.textContent = `✓ ${file.name} (${Math.round(file.size/1024)}KB)`;
        };
        reader.onerror = () => showToast(isAR?'فشل قراءة الملف':'Failed to read file', true);
        reader.readAsDataURL(file);
    };

    window.openLibraryBookForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _libBooks.find(b => b.id === editId) : null;
        _libCoverPending = '';
        _libPdfPending = '';
        _libPdfPendingName = '';
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'libFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل كتاب':'Edit Book') : (isAR?'إضافة كتاب جديد':'Add New Book')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('libFormModal').remove()"></i>
            </div>

            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="text-align:center;">
                    <img id="libCoverPreview" src="${editing && editing.coverData ? editing.coverData : ''}" style="width:100px;height:135px;object-fit:cover;border-radius:8px;border:1px solid var(--border);background:var(--bg3);display:block;margin-bottom:6px;">
                    <label class="ac-btn" style="cursor:pointer;display:inline-flex;">
                        <i class="fa-solid fa-image"></i> ${isAR?'رفع الغلاف':'Upload Cover'}
                        <input type="file" accept="image/*" style="display:none;" onchange="libHandleCoverPick(event)">
                    </label>
                </div>
                <div style="flex:1;min-width:220px;">
                    <div class="job-field full"><label>${isAR?'اسم الكتاب *':'Book Title *'}</label><input type="text" id="lib_title" value="${escapeHtmlAC(v('title'))}"></div>
                    <div class="job-field full"><label>${isAR?'المؤلف':'Author'}</label><input type="text" id="lib_author" value="${escapeHtmlAC(v('author'))}"></div>
                </div>
            </div>

            <div class="proj-form-grid">
                <div class="job-field"><label>${isAR?'التصنيف *':'Category *'}</label>
                    <select id="lib_category">
                        <option value="">${isAR?'اختر تصنيف':'Select category'}</option>
                        ${LIBRARY_CATEGORIES.map(c => `<option value="${c.key}" ${v('category')===c.key?'selected':''}>${c.icon} ${isAR?c.ar:c.en}</option>`).join('')}
                    </select>
                </div>
                <div class="job-field"><label>${isAR?'اللغة':'Language'}</label>
                    <select id="lib_language">
                        <option value="AR" ${v('language')!=='EN'?'selected':''}>${isAR?'عربي':'Arabic'}</option>
                        <option value="EN" ${v('language')==='EN'?'selected':''}>${isAR?'إنجليزي':'English'}</option>
                    </select>
                </div>
                <div class="job-field"><label>${isAR?'سنة النشر':'Publish Year'}</label><input type="number" id="lib_year" value="${v('year')}" placeholder="2024"></div>
                <div class="job-field"><label>${isAR?'عدد الصفحات':'Pages'}</label><input type="number" id="lib_pages" value="${v('pages')}"></div>
                <div class="job-field full"><label>${isAR?'الجامعة (اختياري)':'University (optional)'}</label><input type="text" id="lib_university" value="${escapeHtmlAC(v('university'))}" placeholder="${isAR?'مثال: جامعة القاهرة':'e.g. Cairo University'}"></div>
                <div class="job-field full"><label>${isAR?'نبذة عن الكتاب':'Book Summary'}</label><textarea id="lib_desc">${escapeHtmlAC(v('description'))}</textarea></div>
                <div class="job-field full"><label>${isAR?'الكلمات المفتاحية (افصل بينها بفاصلة)':'Keywords (comma-separated)'}</label><input type="text" id="lib_keywords" value="${escapeHtmlAC(v('keywords'))}" placeholder="GIS, ArcGIS, Spatial Analysis"></div>
            </div>

            <div style="border:1px dashed var(--border);border-radius:10px;padding:12px;margin-top:8px;">
                <label class="ac-btn" style="cursor:pointer;display:inline-flex;">
                    <i class="fa-solid fa-file-pdf"></i> ${isAR?'رفع ملف PDF':'Upload PDF File'}
                    <input type="file" accept="application/pdf" style="display:none;" onchange="libHandlePdfPick(event)">
                </label>
                <span id="libPdfPickedLabel" style="font-size:12px;color:var(--muted);margin-inline-start:8px;">
                    ${editing && editing.pdfData ? `✓ ${isAR?'يوجد ملف مرفوع بالفعل':'A file is already uploaded'}` : ''}
                </span>
                <div style="font-size:11px;color:var(--muted);margin-top:6px;">${isAR?`الحد الأقصى لحجم الملف تقريباً ${Math.round(LIB_PDF_MAX_BYTES/1024)}KB. للملفات الأكبر استخدم رابط خارجي بدلاً من الرفع المباشر.`:`Max file size ~${Math.round(LIB_PDF_MAX_BYTES/1024)}KB. For larger files, use an external link instead of direct upload.`}</div>
                <div class="job-field full" style="margin-top:10px;"><label>${isAR?'أو رابط تحميل خارجي (اختياري)':'Or external download link (optional)'}</label><input type="url" id="lib_url" value="${escapeHtmlAC(v('downloadUrl'))}" placeholder="https://drive.google.com/..."></div>
            </div>

            <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="lib_hidden" ${v('hidden') ? 'checked' : ''}> ${isAR?'إخفاء الكتاب عن الطلاب':'Hide book from students'}
            </label>

            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="libSaveBtn" onclick="libSaveBook('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.libSaveBook = async function(editId) {
        const isAR = lang === 'AR';
        const title = document.getElementById('lib_title')?.value.trim();
        const category = document.getElementById('lib_category')?.value;
        if (!title) { showToast(isAR?'من فضلك أدخل اسم الكتاب':'Please enter the book title', true); return; }
        if (!category) { showToast(isAR?'من فضلك اختر تصنيف':'Please select a category', true); return; }

        const dupBook = (_libBooks||[]).find(b => b.id !== editId && (b.title||'').trim().toLowerCase() === title.toLowerCase());
        if (dupBook) { showToast(isAR?'يوجد كتاب بنفس هذا الاسم بالفعل':'A book with this exact title already exists', true); return; }

        const data = {
            title,
            author: document.getElementById('lib_author')?.value.trim() || '',
            category,
            language: document.getElementById('lib_language')?.value || 'AR',
            year: Number(document.getElementById('lib_year')?.value || 0) || null,
            pages: Number(document.getElementById('lib_pages')?.value || 0) || null,
            university: document.getElementById('lib_university')?.value.trim() || '',
            description: document.getElementById('lib_desc')?.value.trim() || '',
            keywords: document.getElementById('lib_keywords')?.value.trim() || '',
            downloadUrl: document.getElementById('lib_url')?.value.trim() || '',
            hidden: !!document.getElementById('lib_hidden')?.checked,
        };
        if (_libCoverPending) data.coverData = _libCoverPending;
        if (_libPdfPending) { data.pdfData = _libPdfPending; data.pdfName = _libPdfPendingName; }

        const btn = document.getElementById('libSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) await window._updateLibraryBook(editId, data);
            else await window._addLibraryBook(data);
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('libFormModal')?.remove();
            loadLibraryAdminList();
        } catch(e) {
            console.error('Library save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: PLAYLISTS MANAGEMENT ─── */
    let _adminPlaylists = [];
    let _plAdminSearch = '';
    let _plThumbPending = '';
    let _plvCurrentPlaylistId = null;
    let _plvVideos = [];

    function renderAdminPlaylists(area) {
        area = area || document.getElementById('contentArea');
        const isAR = lang === 'AR';
        area.innerHTML = `
        <div class="page-header">
            <h2>${isAR?'إدارة قوائم التشغيل':'Manage Playlists'}</h2>
            <p>${isAR?'أنشئ قوائم تشغيل غير محدودة، وأضف لكل قائمة فيديوهات يوتيوب تظهر للطلاب':'Create unlimited playlists and add YouTube videos to each one for students'}</p>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openPlaylistForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة قائمة تشغيل جديدة':'Add New Playlist'}</button>
        <div class="ac-toolbar">
            <input type="text" id="plAdminSearchInput" placeholder="${isAR?'ابحث باسم القائمة...':'Search by playlist name...'}" value="${_plAdminSearch}" oninput="onPlAdminFilterChange()">
        </div>
        <div id="plAdminStatsRow" style="display:flex;gap:10px;margin:4px 0 16px;flex-wrap:wrap;"></div>
        <div id="plAdminList"><div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div></div>`;
        loadAdminPlaylistsList();
    }
    window.renderAdminPlaylists = renderAdminPlaylists;

    async function loadAdminPlaylistsList() {
        try { _adminPlaylists = await window._loadPlaylistsAdmin(); } catch(e) { console.error(e); _adminPlaylists = []; }
        const isAR = lang === 'AR';
        const totalVideos = _adminPlaylists.reduce((s,p) => s + (p.videoCount||0), 0);
        const stats = document.getElementById('plAdminStatsRow');
        if (stats) {
            stats.innerHTML = `
                <div class="lib-stat-chip"><i class="fa-solid fa-clapperboard"></i> ${_adminPlaylists.length} ${isAR?'قائمة':'playlists'}</div>
                <div class="lib-stat-chip"><i class="fa-solid fa-video"></i> ${totalVideos} ${isAR?'فيديو':'videos'}</div>
                <div class="lib-stat-chip"><i class="fa-solid fa-eye-slash"></i> ${_adminPlaylists.filter(p=>p.hidden).length} ${isAR?'مخفية':'hidden'}</div>`;
        }
        renderPlAdminFilteredList(isAR);
    }

    window.onPlAdminFilterChange = function() {
        _plAdminSearch = document.getElementById('plAdminSearchInput')?.value.trim().toLowerCase() || '';
        renderPlAdminFilteredList(lang === 'AR');
    };

    function renderPlAdminFilteredList(isAR) {
        const list = document.getElementById('plAdminList');
        if (!list) return;
        let items = [..._adminPlaylists];
        if (_plAdminSearch) items = items.filter(p => (p.title||'').toLowerCase().includes(_plAdminSearch));
        if (!items.length) {
            list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد قوائم مطابقة':'No matching playlists'}</div>`;
            return;
        }
        list.innerHTML = items.map(p => plAdminRowHTML(p, isAR)).join('');
    }

    function plAdminRowHTML(p, isAR) {
        const thumb = p.thumbData
            ? `<img src="${p.thumbData}" style="width:80px;height:45px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--border);">`
            : `<div style="width:80px;height:45px;border-radius:6px;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--g3);border:1px solid var(--border);"><i class="fa-solid fa-clapperboard"></i></div>`;
        return `
        <div class="ac-row" style="align-items:flex-start;">
            ${thumb}
            <div class="ac-main" style="margin-inline-start:12px;">
                <div class="ac-title">${escapeHtmlAC(p.title||'')} ${p.hidden ? `<span class="job-status-badge rejected" style="margin-inline-start:6px;"><i class="fa-solid fa-eye-slash"></i> ${isAR?'مخفي':'Hidden'}</span>` : ''}</div>
                <div class="ac-meta">
                    <span class="job-status-badge approved"><i class="fa-solid fa-video"></i> ${p.videoCount||0} ${isAR?'فيديو':'videos'}</span>
                    ${p.description ? `<span>${escapeHtmlAC((p.description||'').slice(0,60))}${p.description.length>60?'…':''}</span>` : ''}
                </div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn" onclick="openPlaylistVideosManager('${p.id}')"><i class="fa-solid fa-list-ol"></i> ${isAR?'إدارة الفيديوهات':'Manage Videos'}</button>
                <button class="ac-btn hide" onclick="plAdminToggleHidden('${p.id}', ${!p.hidden})"><i class="fa-solid fa-eye${p.hidden?'':'-slash'}"></i> ${p.hidden ? (isAR?'إظهار':'Unhide') : (isAR?'إخفاء':'Hide')}</button>
                <button class="ac-btn" onclick="openPlaylistForm('${p.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="plAdminDelete('${p.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.plAdminToggleHidden = async function(id, hidden) {
        try {
            await window._togglePlaylistHidden(id, hidden);
            const idx = _adminPlaylists.findIndex(p => p.id === id);
            if (idx > -1) _adminPlaylists[idx].hidden = hidden;
            renderPlAdminFilteredList(lang === 'AR');
            showToast(lang==='AR' ? (hidden?'تم إخفاء القائمة':'تم إظهار القائمة') : (hidden?'Playlist hidden':'Playlist visible'));
        } catch(e) { showToast(lang==='AR'?'حدث خطأ':'An error occurred', true); }
    };

    window.plAdminDelete = async function(id) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف قائمة التشغيل هذه وكل الفيديوهات بداخلها نهائياً؟':'Delete this playlist and all its videos permanently?')) return;
        try {
            await window._deletePlaylist(id);
            _adminPlaylists = _adminPlaylists.filter(p => p.id !== id);
            renderPlAdminFilteredList(isAR);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.plHandleThumbPick = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const isAR = lang === 'AR';
        try {
            const LIMIT = 220000;
            let maxDim = 480, quality = 0.8;
            let dataUrl = await _resizeImageFile(file, maxDim, quality);
            while (dataUrl.length > LIMIT && (quality > 0.3 || maxDim > 150)) {
                if (quality > 0.3) quality = Math.round((quality - 0.1) * 10) / 10;
                else maxDim = Math.round(maxDim * 0.8);
                dataUrl = await _resizeImageFile(file, maxDim, quality);
            }
            _plThumbPending = dataUrl;
            const prev = document.getElementById('plThumbPreview');
            if (prev) { prev.src = dataUrl; prev.style.display = 'block'; }
        } catch(err) {
            showToast(isAR?'تعذّرت معالجة الصورة':'Could not process the image', true);
        }
    };

    window.openPlaylistForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _adminPlaylists.find(p => p.id === editId) : null;
        _plThumbPending = '';
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'plFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل قائمة تشغيل':'Edit Playlist') : (isAR?'إضافة قائمة تشغيل جديدة':'Add New Playlist')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('plFormModal').remove()"></i>
            </div>

            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="text-align:center;">
                    <img id="plThumbPreview" src="${editing && editing.thumbData ? editing.thumbData : ''}" style="width:140px;height:79px;object-fit:cover;border-radius:8px;border:1px solid var(--border);background:var(--bg3);${editing && editing.thumbData ? '' : 'display:none;'}margin-bottom:6px;">
                    <label class="ac-btn" style="cursor:pointer;display:inline-flex;">
                        <i class="fa-solid fa-image"></i> ${isAR?'رفع صورة مصغرة (اختياري)':'Upload Thumbnail (optional)'}
                        <input type="file" accept="image/*" style="display:none;" onchange="plHandleThumbPick(event)">
                    </label>
                </div>
                <div style="flex:1;min-width:220px;">
                    <div class="job-field full"><label>${isAR?'اسم قائمة التشغيل *':'Playlist Name *'}</label><input type="text" id="pl_title" value="${escapeHtmlAC(v('title'))}" placeholder="${isAR?'مثال: ArcGIS Pro, QGIS, Python...':'e.g. ArcGIS Pro, QGIS, Python...'}"></div>
                    <div class="job-field full"><label>${isAR?'وصف مختصر (اختياري)':'Short Description (optional)'}</label><textarea id="pl_desc">${escapeHtmlAC(v('description'))}</textarea></div>
                </div>
            </div>

            <label style="display:flex;align-items:center;gap:8px;margin-top:4px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="pl_hidden" ${v('hidden') ? 'checked' : ''}> ${isAR?'إخفاء القائمة عن الطلاب':'Hide playlist from students'}
            </label>

            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="plSaveBtn" onclick="plAdminSave('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.plAdminSave = async function(editId) {
        const isAR = lang === 'AR';
        const title = document.getElementById('pl_title')?.value.trim();
        if (!title) { showToast(isAR?'من فضلك أدخل اسم قائمة التشغيل':'Please enter the playlist name', true); return; }

        const data = {
            title,
            description: document.getElementById('pl_desc')?.value.trim() || '',
            hidden: !!document.getElementById('pl_hidden')?.checked,
        };
        if (_plThumbPending) data.thumbData = _plThumbPending;

        const btn = document.getElementById('plSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) {
                await window._updatePlaylist(editId, data);
                showToast(isAR?'تم الحفظ':'Saved');
                document.getElementById('plFormModal')?.remove();
                loadAdminPlaylistsList();
            } else {
                const newId = await window._addPlaylist(data);
                showToast(isAR?'تم إنشاء القائمة، أضف لها فيديوهات الآن':'Playlist created, now add videos to it');
                document.getElementById('plFormModal')?.remove();
                await loadAdminPlaylistsList();
                if (newId) openPlaylistVideosManager(newId);
            }
        } catch(e) {
            console.error('Playlist save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: PLAYLIST VIDEOS (per playlist) ─── */
    window.openPlaylistVideosManager = async function(playlistId) {
        _plvCurrentPlaylistId = playlistId;
        const isAR = lang === 'AR';
        const area = document.getElementById('contentArea');
        if (!area) return;
        let p = _adminPlaylists.find(x => x.id === playlistId);
        area.innerHTML = `
        <button class="pl-back-btn" onclick="renderAdminPlaylists()"><i class="fa-solid fa-arrow-${isAR?'right':'left'}"></i> ${isAR?'رجوع لقوائم التشغيل':'Back to Playlists'}</button>
        <div class="page-header">
            <h2>${isAR?'إدارة فيديوهات: ':'Manage Videos: '}${escapeHtmlAC(p?.title||'')}</h2>
            <p>${isAR?'أضف فيديوهات غير محدودة، وعدّلها أو احذفها أو أعد ترتيبها بسهولة':'Add unlimited videos, then edit, delete, or reorder them easily'}</p>
        </div>
        <button class="btn-post-job" style="margin-bottom:16px;" onclick="openPlaylistVideoForm()"><i class="fa-solid fa-plus"></i> ${isAR?'إضافة فيديو جديد':'Add New Video'}</button>
        <div id="plvList"><div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div></div>`;
        await loadPlvList();
    };

    async function loadPlvList() {
        try { _plvVideos = await window._loadPlaylistVideos(_plvCurrentPlaylistId); } catch(e) { console.error(e); _plvVideos = []; }
        renderPlvList(lang === 'AR');
    }

    function renderPlvList(isAR) {
        const wrap = document.getElementById('plvList');
        if (!wrap) return;
        if (!_plvVideos.length) {
            wrap.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;">${isAR?'لا توجد فيديوهات بعد، ابدأ بإضافة أول فيديو':'No videos yet, add the first one'}</div>`;
            return;
        }
        wrap.innerHTML = _plvVideos.map((v,i) => plvRowHTML(v, i, isAR)).join('');
    }

    function plvRowHTML(v, i, isAR) {
        const vid = extractYTVideoId(v.youtubeUrl || v.url);
        const thumb = vid
            ? `<img class="plv-thumb" src="https://i.ytimg.com/vi/${vid}/mqdefault.jpg" alt="">`
            : `<div class="plv-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-video" style="color:var(--muted);"></i></div>`;
        return `
        <div class="plv-row">
            <div class="plv-order-controls">
                <button class="plv-order-btn" ${i===0?'disabled':''} onclick="plvMove(${i},-1)" title="${isAR?'تحريك لأعلى':'Move up'}"><i class="fa-solid fa-chevron-up"></i></button>
                <button class="plv-order-btn" ${i===_plvVideos.length-1?'disabled':''} onclick="plvMove(${i},1)" title="${isAR?'تحريك لأسفل':'Move down'}"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
            <div class="plv-index">${i+1}</div>
            ${thumb}
            <div class="plv-main">
                <div class="plv-title">${escapeHtmlAC(v.title||'')}</div>
                <div class="plv-meta">${vid ? `<span style="color:var(--green4);"><i class="fa-solid fa-link"></i> ${isAR?'رابط صالح':'Valid link'}</span>` : `<span style="color:#e33;"><i class="fa-solid fa-triangle-exclamation"></i> ${isAR?'رابط غير صالح':'Invalid link'}</span>`}</div>
            </div>
            <div class="ac-actions">
                <button class="ac-btn" onclick="openPlaylistVideoForm('${v.id}')"><i class="fa-solid fa-pen"></i> ${isAR?'تعديل':'Edit'}</button>
                <button class="ac-btn danger" onclick="plvDelete('${v.id}')"><i class="fa-solid fa-trash"></i> ${isAR?'حذف':'Delete'}</button>
            </div>
        </div>`;
    }

    window.plvMove = async function(index, dir) {
        const newIndex = index + dir;
        if (newIndex < 0 || newIndex >= _plvVideos.length) return;
        const arr = [..._plvVideos];
        const tmp = arr[index]; arr[index] = arr[newIndex]; arr[newIndex] = tmp;
        _plvVideos = arr;
        renderPlvList(lang === 'AR');
        try {
            await window._reorderPlaylistVideos(_plvCurrentPlaylistId, arr.map(v => v.id));
        } catch(e) { showToast(lang==='AR'?'تعذّر حفظ الترتيب':'Could not save order', true); }
    };

    window.plvDelete = async function(videoId) {
        const isAR = lang === 'AR';
        if (!confirm(isAR?'حذف هذا الفيديو نهائياً؟':'Delete this video permanently?')) return;
        try {
            await window._deletePlaylistVideo(_plvCurrentPlaylistId, videoId);
            _plvVideos = _plvVideos.filter(v => v.id !== videoId);
            if (_plvVideos.length) await window._reorderPlaylistVideos(_plvCurrentPlaylistId, _plvVideos.map(v => v.id));
            const idxP = _adminPlaylists.findIndex(p => p.id === _plvCurrentPlaylistId);
            if (idxP > -1) _adminPlaylists[idxP].videoCount = _plvVideos.length;
            renderPlvList(isAR);
            showToast(isAR?'🗑️ تم الحذف':'🗑️ Deleted');
        } catch(e) { showToast(isAR?'خطأ في الحذف':'Delete failed', true); }
    };

    window.openPlaylistVideoForm = function(editId) {
        const isAR = lang === 'AR';
        const editing = editId ? _plvVideos.find(v => v.id === editId) : null;
        const v = (f) => (editing && editing[f] != null) ? editing[f] : '';
        const modal = document.createElement('div');
        modal.id = 'plvFormModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;" onclick="event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="font-size:15px;font-weight:800;">${editing ? (isAR?'تعديل فيديو':'Edit Video') : (isAR?'إضافة فيديو جديد':'Add New Video')}</h3>
                <i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--muted);" onclick="document.getElementById('plvFormModal').remove()"></i>
            </div>
            <div class="job-field full"><label>${isAR?'عنوان الفيديو *':'Video Title *'}</label><input type="text" id="plv_title" value="${escapeHtmlAC(v('title'))}"></div>
            <div class="job-field full"><label>${isAR?'رابط فيديو يوتيوب *':'YouTube Video URL *'}</label><input type="url" id="plv_url" value="${escapeHtmlAC(v('youtubeUrl') || v('url'))}" placeholder="https://www.youtube.com/watch?v=..."></div>
            <button class="btn-post-job" style="width:100%;margin-top:14px;" id="plvSaveBtn" onclick="plvSave('${editId||''}')"><i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}</button>
        </div>`;
        document.body.appendChild(modal);
    };

    window.plvSave = async function(editId) {
        const isAR = lang === 'AR';
        const title = document.getElementById('plv_title')?.value.trim();
        const youtubeUrl = document.getElementById('plv_url')?.value.trim();
        if (!title) { showToast(isAR?'من فضلك أدخل عنوان الفيديو':'Please enter the video title', true); return; }
        if (!youtubeUrl || !extractYTVideoId(youtubeUrl)) { showToast(isAR?'رابط فيديو يوتيوب غير صالح':'Invalid YouTube video URL', true); return; }

        const btn = document.getElementById('plvSaveBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
        try {
            if (editId) {
                await window._updatePlaylistVideo(_plvCurrentPlaylistId, editId, { title, youtubeUrl });
            } else {
                await window._addPlaylistVideo(_plvCurrentPlaylistId, { title, youtubeUrl, order: _plvVideos.length });
                const idxP = _adminPlaylists.findIndex(p => p.id === _plvCurrentPlaylistId);
                if (idxP > -1) _adminPlaylists[idxP].videoCount = (_adminPlaylists[idxP].videoCount || 0) + 1;
            }
            showToast(isAR?'تم الحفظ':'Saved');
            document.getElementById('plvFormModal')?.remove();
            await loadPlvList();
        } catch(e) {
            console.error('Video save error:', e);
            showToast(isAR?'حدث خطأ أثناء الحفظ':'An error occurred while saving', true);
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isAR?'حفظ':'Save'}`; }
        }
    };

    /* ─── ADMIN: SPATIAL DATA LIBRARY ─── */
    let _adsDatasets = [];
    let _adsProjects = [];
    let _adsTab = 'datasets'; // 'datasets' | 'projects'
    let _adsSearch = '';
    let _adsCatFilter = '';