
        let cvCertFilesData = [];
        const CV_CERT_MAX_FILES = 8;
        const CV_CERT_MAX_TOTAL_BYTES = 800000; // certs budget; leaves ~150KB margin for text fields under Firestore's 1MB doc limit
        const CV_CERT_MAX_PDF_BYTES = 500000;   // PDFs aren't compressed, so cap raw file size

        async function _cvCompressToBudget(file, budgetBytes) {
            // Try progressively smaller/lower-quality renders until the file fits its byte budget
            const attempts = [[1280, 0.6], [1000, 0.5], [800, 0.4], [640, 0.35], [500, 0.28], [420, 0.2], [340, 0.15], [280, 0.12]];
            let dataUrl = await _cvCompressImage(file, attempts[0][0], attempts[0][1]);
            for (let i = 1; i < attempts.length && _cvDataUrlBytes(dataUrl) > budgetBytes; i++) {
                dataUrl = await _cvCompressImage(file, attempts[i][0], attempts[i][1]);
            }
            return dataUrl;
        }

        function _cvCompressImage(file, maxDim, quality) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width >= height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
                        else { width = Math.round(width * (maxDim / height)); height = maxDim; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
                img.src = url;
            });
        }

        function _cvDataUrlBytes(dataUrl) {
            // IMPORTANT: what actually gets stored in Firestore/JSON is the base64 TEXT itself,
            // not the decoded binary — so the real size is the string length, not length*3/4.
            const i = dataUrl.indexOf(',');
            const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
            return b64.length;
        }

        function _cvTotalCertBytes() {
            return cvCertFilesData.reduce((sum, f) => sum + _cvDataUrlBytes(f.data), 0);
        }

        async function handleCVCertFile(e) {
            const isAR = lang === 'AR';
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            const remaining = CV_CERT_MAX_FILES - cvCertFilesData.length;
            if (remaining <= 0) {
                showToast(isAR ? `⚠️ الحد الأقصى ${CV_CERT_MAX_FILES} ملفات` : `⚠️ Maximum ${CV_CERT_MAX_FILES} files allowed`, true);
                e.target.value = '';
                return;
            }
            let filesToAdd = files;
            if (files.length > remaining) {
                filesToAdd = files.slice(0, remaining);
                showToast(isAR ? `⚠️ تم أخذ أول ${remaining} فقط (الحد الأقصى ${CV_CERT_MAX_FILES} ملفات)` : `⚠️ Only first ${remaining} taken (max ${CV_CERT_MAX_FILES} files)`, true);
            }

            const zoneTxt = document.getElementById('cvCertDropZoneTxt');
            const origTxt = zoneTxt ? zoneTxt.textContent : '';
            const progWrap = document.getElementById('cvCertProgressWrap');
            const progBar  = document.getElementById('cvCertProgressBar');
            const progTxt  = document.getElementById('cvCertProgressTxt');
            if (progWrap) progWrap.style.display = 'block';

            for (let idx = 0; idx < filesToAdd.length; idx++) {
                const file = filesToAdd[idx];
                if (progBar) progBar.style.width = Math.round((idx / filesToAdd.length) * 100) + '%';
                if (progTxt) progTxt.textContent = isAR ? `جاري ضغط "${file.name}"... (${idx + 1}/${filesToAdd.length})` : `Compressing "${file.name}"... (${idx + 1}/${filesToAdd.length})`;
                if (zoneTxt) zoneTxt.textContent = isAR ? `جاري تجهيز الملفات...` : 'Processing files...';
                try {
                    let dataUrl;
                    if (/^image\//.test(file.type)) {
                        // Budget-aware compression: split remaining space across remaining files
                        // so uploading several images in a row doesn't blow past the total limit.
                        const slotsLeft = filesToAdd.length - idx;
                        const bytesLeft = CV_CERT_MAX_TOTAL_BYTES - _cvTotalCertBytes();
                        const budget = Math.max(10000, Math.floor(bytesLeft / slotsLeft));
                        dataUrl = await _cvCompressToBudget(file, budget);
                    } else if (file.type === 'application/pdf') {
                        if (file.size > CV_CERT_MAX_PDF_BYTES) {
                            showToast(isAR ? `⚠️ ملف "${file.name}" كبير جداً (الحد الأقصى ~500KB للـ PDF)` : `⚠️ "${file.name}" is too large (max ~500KB for PDFs)`, true);
                            continue;
                        }
                        dataUrl = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = ev => resolve(ev.target.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                    } else {
                        showToast(isAR ? `⚠️ نوع الملف "${file.name}" غير مدعوم` : `⚠️ "${file.name}" file type not supported`, true);
                        continue;
                    }

                    const newBytes = _cvDataUrlBytes(dataUrl);
                    if (_cvTotalCertBytes() + newBytes > CV_CERT_MAX_TOTAL_BYTES) {
                        const leftKB = Math.max(0, Math.floor((CV_CERT_MAX_TOTAL_BYTES - _cvTotalCertBytes()) / 1000));
                        showToast(isAR
                            ? `⚠️ "${file.name}" مش هيدخل (فاضل حوالي ${leftKB}KB بس)، شيل بعض الملفات القديمة وحاول تاني`
                            : `⚠️ "${file.name}" won't fit (only ~${leftKB}KB left), remove some older files and try again`, true);
                        continue;
                    }

                    cvCertFilesData.push({ name: file.name, data: dataUrl });
                    renderCVCertFilesList();
                } catch (err) {
                    showToast(isAR ? `⚠️ فشل تجهيز الملف "${file.name}"` : `⚠️ Failed to process "${file.name}"`, true);
                }
            }

            if (progWrap) progWrap.style.display = 'none';
            if (zoneTxt) zoneTxt.textContent = origTxt;
            e.target.value = '';
        }
        window.handleCVCertFile = handleCVCertFile;
        function renderCVCertFilesList() {
            const box = document.getElementById('cvCertFilesList');
            if (!box) return;
            box.innerHTML = cvCertFilesData.map((f, i) => `
                <div style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;font-size:12px;">
                    <i class="fa-solid fa-paperclip" style="color:var(--gold3);"></i>
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
                    <button onclick="removeCVCertFile(${i})" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:13px;"><i class="fa-solid fa-xmark"></i></button>
                </div>`).join('');
            const zoneTxt = document.getElementById('cvCertDropZoneTxt');
            if (zoneTxt) {
                const isAR = lang === 'AR';
                zoneTxt.textContent = cvCertFilesData.length >= CV_CERT_MAX_FILES
                    ? (isAR ? `تم الوصول للحد الأقصى (${CV_CERT_MAX_FILES} ملفات)` : `Maximum reached (${CV_CERT_MAX_FILES} files)`)
                    : (isAR ? `اضغط لرفع صورة أو ملف PDF للشهادة (${cvCertFilesData.length}/${CV_CERT_MAX_FILES})` : `Click to upload a certificate image or PDF (${cvCertFilesData.length}/${CV_CERT_MAX_FILES})`);
            }
        }
        window.removeCVCertFile = function(i) {
            cvCertFilesData.splice(i, 1);
            renderCVCertFilesList();
        };

        async function submitCVRequest() {
            const isAR = lang === 'AR';
            const fullName = document.getElementById('cvFullName')?.value.trim();
            const email    = document.getElementById('cvEmail')?.value.trim();
            const phone    = document.getElementById('cvPhone')?.value.trim();
            const targetTitle = document.getElementById('cvTargetTitle')?.value.trim();
            const education = document.getElementById('cvEducation')?.value.trim();
            const skills     = document.getElementById('cvSkills')?.value.trim();

            if (!fullName)     { showToast(isAR?'أدخل الاسم بالكامل':'Enter your full name', true); return; }
            if (!email)        { showToast(isAR?'أدخل البريد الإلكتروني':'Enter your email', true); return; }
            if (!phone)        { showToast(isAR?'أدخل رقم الهاتف':'Enter your phone number', true); return; }
            if (!targetTitle)  { showToast(isAR?'أدخل المسمى الوظيفي المستهدف':'Enter your target job title', true); return; }
            if (!education)    { showToast(isAR?'أدخل بياناتك الدراسية':'Enter your education history', true); return; }
            if (!skills)        { showToast(isAR?'أدخل مهاراتك':'Enter your skills', true); return; }

            const data = {
                fullName, email, phone,
                address: document.getElementById('cvAddress')?.value.trim() || '',
                linkedin: document.getElementById('cvLinkedin')?.value.trim() || '',
                portfolio: document.getElementById('cvPortfolio')?.value.trim() || '',
                targetTitle,
                summary: document.getElementById('cvSummary')?.value.trim() || '',
                education,
                experience: document.getElementById('cvExperience')?.value.trim() || '',
                skills,
                languages: document.getElementById('cvLanguages')?.value.trim() || '',
                certifications: document.getElementById('cvCertifications')?.value.trim() || '',
                certificateFiles: cvCertFilesData,
                notes: document.getElementById('cvNotes')?.value.trim() || '',
            };

            // Firestore's real limit is on the WHOLE document (~1MB), not just the certificate files.
            // Check the actual combined payload size here so we catch it before Firestore does.
            const FIRESTORE_SAFE_DOC_BYTES = 950000;
            const fullPayloadBytes = new Blob([JSON.stringify(data)]).size;
            if (fullPayloadBytes > FIRESTORE_SAFE_DOC_BYTES) {
                const overKB = Math.ceil((fullPayloadBytes - FIRESTORE_SAFE_DOC_BYTES) / 1000);
                showToast(isAR
                    ? `⚠️ إجمالي البيانات (شهادات + نصوص) كبير بحوالي ${overKB}KB، شيل شهادة أو اتنين أو قصّر النصوص وحاول تاني`
                    : `⚠️ Total data (certificates + text) is about ${overKB}KB too large, remove a certificate or two, or shorten some text fields`, true);
                return;
            }

            const btn = document.getElementById('cvSubmitBtn');
            if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`; }

            try {
                await window._submitCVRequest(data);
                showToast(isAR ? '✓ تم إرسال بياناتك بنجاح! سيتواصل معك فريقنا قريباً' : '✓ Your data has been sent! Our team will contact you soon');
                navigate('cvbuilder', document.getElementById('menuCV'));
            } catch(e) {
                console.error('CV submit error:', e);
                const isSizeErr = /longer than|exceeds the maximum|invalid-argument|too large/i.test(e?.message || '');
                const msg = isSizeErr
                    ? (isAR ? 'حجم البيانات كبير جداً، شيل بعض ملفات الشهادات وحاول تاني' : 'Data too large, remove some certificate files and try again')
                    : (isAR ? 'خطأ في الإرسال، حاول مرة أخرى' : 'Failed to send, please try again');
                showToast(msg, true);
                if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span id="cvSubmitBtnTxt">${isAR?'إرسال بياناتي':'Send My Data'}</span>`; }
            }
        }
        window.submitCVRequest = submitCVRequest;
        window.renderCVBuilder = renderCVBuilder;

        /* ─── PLAYLISTS ─── */
        /* Extract a YouTube VIDEO id from watch/short/embed/youtu.be URL formats */
        function extractYTVideoId(url) {
            if (!url) return '';
            const s = String(url).trim();
            let m = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/); if (m) return m[1];
            m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/); if (m) return m[1];
            m = s.match(/\/embed\/([a-zA-Z0-9_-]{6,})/); if (m) return m[1];
            m = s.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/); if (m) return m[1];
            return '';
        }
        window.extractYTVideoId = extractYTVideoId;

        let _plAll = [];
        let _plStage = { view: 'list', payload: null };
        let _plSearch = '';
        let _plFilter = '';
        let _plCurrentPlaylist = null;
        let _plCurrentVideos = [];
        let _plCurrentIndex = 0;

        async function renderPlaylists(area) {
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="lib-hero">
                <h2><i class="fa-solid fa-clapperboard"></i> ${isAR?'قوائم تشغيل ATLASYA':'ATLASYA Playlists'}</h2>
                <p>${isAR?'قوائم فيديوهات تعليمية منظمة في نظم المعلومات الجغرافية والمساحة':'Organized educational video playlists in GIS and surveying'}</p>
                <div class="lib-search-bar ${isAR?'rtl':''}">
                    <i class="fa-solid fa-magnifying-glass lib-search-ic"></i>
                    <input type="text" id="plHeroSearch" placeholder="${isAR?'ابحث باسم القائمة... (مثال: ArcGIS, QGIS, Python)':'Search by playlist name... (e.g. ArcGIS, QGIS, Python)'}" onkeydown="if(event.key==='Enter') plHeroSearchGo()">
                    <button class="lib-search-go" onclick="plHeroSearchGo()">${isAR?'بحث':'Search'}</button>
                </div>
                <div class="lib-quickstats-row">
                    <button class="lib-fav-quick-btn" onclick="plGoFilter('favorites')"><i class="fa-solid fa-heart"></i> ${isAR?'المفضلة لديّ':'My Favorites'}</button>
                    <button class="lib-saved-quick-btn" onclick="plGoFilter('saved')"><i class="fa-solid fa-bookmark"></i> ${isAR?'المحفوظة لديّ':'My Saved'}</button>
                    <div class="lib-quickstats" id="plQuickStats"></div>
                </div>
            </div>
            <div id="plStage"><div style="text-align:center;padding:60px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;color:var(--muted);"></i></div></div>`;

            try { _plAll = await window._loadPlaylists(); } catch(e) { console.error(e); _plAll = []; }
            _plSearch = '';
            _plFilter = '';

            const stats = document.getElementById('plQuickStats');
            if (stats) {
                const totalVideos = _plAll.reduce((s,p) => s + (p.videoCount || 0), 0);
                stats.innerHTML = `
                    <div class="lib-stat-pill"><i class="fa-solid fa-clapperboard"></i> ${_plAll.length} ${isAR?'قائمة':'playlists'}</div>
                    <div class="lib-stat-pill"><i class="fa-solid fa-video"></i> ${totalVideos} ${isAR?'فيديو':'videos'}</div>`;
            }
            window.plGoList();
        }
        window.renderPlaylists = renderPlaylists;

        window.plHeroSearchGo = function() {
            _plSearch = document.getElementById('plHeroSearch')?.value.trim().toLowerCase() || '';
            _plFilter = '';
            const stage = document.getElementById('plStage');
            _plRenderList(stage);
            stage?.scrollIntoView({ behavior:'smooth', block:'start' });
        };

        window.plGoFilter = function(filter) {
            _plFilter = filter;
            _plSearch = '';
            const heroInput = document.getElementById('plHeroSearch');
            if (heroInput) heroInput.value = '';
            const stage = document.getElementById('plStage');
            _plRenderList(stage);
            stage?.scrollIntoView({ behavior:'smooth', block:'start' });
        };

        window.plGoList = function() {
            _plStage = { view: 'list', payload: null };
            const stage = document.getElementById('plStage');
            _plRenderList(stage);
            stage?.scrollIntoView({ behavior:'smooth', block:'start' });
        };

        window.plGoDetail = async function(id) {
            _plStage = { view: 'detail', payload: id };
            const stage = document.getElementById('plStage');
            if (!stage) return;
            const isAR = lang === 'AR';
            stage.innerHTML = `<div style="text-align:center;padding:60px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;color:var(--muted);"></i></div>`;
            stage.scrollIntoView({ behavior:'smooth', block:'start' });
            const p = _plAll.find(x => x.id === id);
            if (!p) { stage.innerHTML = `<div class="pl-empty">${isAR?'القائمة غير موجودة':'Playlist not found'}</div>`; return; }
            let videos = [];
            try { videos = await window._loadPlaylistVideos(id); } catch(e) { console.error(e); videos = []; }
            _plCurrentPlaylist = p;
            _plCurrentVideos = videos;
            _plCurrentIndex = 0;
            _plRenderDetail(stage);
        };

        window.plDoSearch = function() {
            _plSearch = document.getElementById('plSearchInput')?.value.trim().toLowerCase() || '';
            _plRenderList(document.getElementById('plStage'));
        };

        function _plRenderList(stage) {
            if (!stage) return;
            const isAR = lang === 'AR';
            let items = [..._plAll];

            if (_plFilter === 'favorites') {
                const favIds = window._userData?.favoritePlaylists || [];
                items = items.filter(p => favIds.includes(p.id));
            } else if (_plFilter === 'saved') {
                const savedIds = window._userData?.savedPlaylists || [];
                items = items.filter(p => savedIds.includes(p.id));
            }
            if (_plSearch) items = items.filter(p => (p.title||'').toLowerCase().includes(_plSearch));

            const filterBanner = _plFilter ? `
            <div class="pl-filter-banner">
                <span><i class="fa-solid fa-${_plFilter==='favorites'?'heart':'bookmark'}"></i> ${_plFilter==='favorites'?(isAR?'المفضلة لديك':'Your Favorites'):(isAR?'المحفوظة لديك':'Your Saved Playlists')}</span>
                <button onclick="plGoFilter('')"><i class="fa-solid fa-xmark"></i> ${isAR?'عرض الكل':'Show All'}</button>
            </div>` : '';

            stage.innerHTML = `
            ${filterBanner}
            <div class="pl-search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="plSearchInput" placeholder="${isAR?'ابحث باسم القائمة... (مثال: ArcGIS, QGIS, Python)':'Search by playlist name... (e.g. ArcGIS, QGIS, Python)'}" value="${_plSearch}" oninput="plDoSearch()">
            </div>
            <div class="playlists-grid" id="plGrid"></div>`;

            const grid = document.getElementById('plGrid');
            if (!items.length) {
                const emptyMsg = _plFilter === 'favorites' ? (isAR?'لا توجد قوائم في المفضلة بعد':'No favorite playlists yet')
                    : _plFilter === 'saved' ? (isAR?'لا توجد قوائم محفوظة بعد':'No saved playlists yet')
                    : (isAR?'لا توجد قوائم تشغيل مطابقة':'No matching playlists');
                grid.innerHTML = `<div class="pl-empty" style="grid-column:1/-1;">${emptyMsg}</div>`;
                return;
            }
            grid.innerHTML = items.map(p => _plCardHTML(p, isAR)).join('');
        }

        function _plCardHTML(p, isAR) {
            const count = p.videoCount || 0;
            return `
            <div class="playlist-card" onclick="plGoDetail('${p.id}')">
                <div class="pl-thumb-wrap">
                    ${p.thumbData ? `<img src="${p.thumbData}" alt="">` : `<i class="fa-solid fa-clapperboard" style="color:var(--g3);font-size:36px;"></i>`}
                    <div class="pl-play-badge"><i class="fa-solid fa-circle-play"></i></div>
                </div>
                <div class="pl-body">
                    <h3 class="pl-title">${escapeHtmlAC(p.title||'')}</h3>
                    ${p.description ? `<p class="pl-desc">${escapeHtmlAC((p.description||'').slice(0,90))}${p.description.length>90?'…':''}</p>` : ''}
                </div>
                <div class="pl-footer">
                    <div class="pl-yt">
                        <i class="fa-solid fa-video" style="color:var(--g3);font-size:14px;"></i>
                        <span>${count} ${isAR?'فيديو':(count===1?'video':'videos')}</span>
                    </div>
                    <div class="pl-arrow">
                        <i class="fa-solid fa-play" style="color:var(--g3);font-size:12px;"></i>
                    </div>
                </div>
            </div>`;
        }

        function _plPlayerHTML(isAR) {
            const v = _plCurrentVideos[_plCurrentIndex];
            if (!v) return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);text-align:center;padding:16px;"><span><i class="fa-solid fa-video-slash"></i>&nbsp; ${isAR?'لا توجد فيديوهات في هذه القائمة بعد':'No videos in this playlist yet'}</span></div>`;
            const vid = extractYTVideoId(v.youtubeUrl || v.url);
            if (!vid) return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);"><i class="fa-solid fa-triangle-exclamation"></i>&nbsp; ${isAR?'رابط الفيديو غير صالح':'Invalid video link'}</div>`;
            return `<iframe id="plYtIframe" src="https://www.youtube.com/embed/${vid}?rel=0" title="${escapeHtmlAC(v.title||'')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        }

        function _plVideoItemHTML(v, i, isAR) {
            const active = i === _plCurrentIndex;
            const vid = extractYTVideoId(v.youtubeUrl || v.url);
            const thumb = vid ? `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` : '';
            return `
            <div class="pl-video-item ${active?'active':''}" onclick="plPlayVideo(${i})">
                <div class="pl-video-num">${active ? '<i class="fa-solid fa-play"></i>' : (i+1)}</div>
                ${thumb ? `<img class="pl-video-thumb" src="${thumb}" alt="">` : `<div class="pl-video-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-video" style="color:var(--muted);"></i></div>`}
                <div class="pl-video-item-title">${escapeHtmlAC(v.title||'')}</div>
            </div>`;
        }

        function _plRenderDetail(stage) {
            if (!stage) return;
            const isAR = lang === 'AR';
            const p = _plCurrentPlaylist;
            const videos = _plCurrentVideos;
            if (!p) { stage.innerHTML = `<div class="pl-empty">${isAR?'القائمة غير موجودة':'Playlist not found'}</div>`; return; }
            const favIds = window._userData?.favoritePlaylists || [];
            const savedIds = window._userData?.savedPlaylists || [];
            const isFav = favIds.includes(p.id);
            const isSaved = savedIds.includes(p.id);

            stage.innerHTML = `
            <button class="pl-back-btn" onclick="plGoList()"><i class="fa-solid fa-arrow-${isAR?'right':'left'}"></i> ${isAR?'رجوع لقوائم التشغيل':'Back to Playlists'}</button>
            <div class="pl-detail-layout">
                <div class="pl-detail-main">
                    <div class="pl-player-wrap" id="plPlayerWrap">${_plPlayerHTML(isAR)}</div>
                    <span class="pl-count-badge" style="margin-top:12px;"><i class="fa-solid fa-video"></i> ${videos.length} ${isAR?'فيديو':(videos.length===1?'video':'videos')}</span>
                    <h2 class="pl-detail-title">${escapeHtmlAC(p.title||'')}</h2>
                    ${p.description ? `<p class="pl-detail-desc">${escapeHtmlAC(p.description)}</p>` : ''}
                    <div class="pl-actions-row">
                        <button class="pl-action-btn ${isFav?'active':''}" onclick="plToggleFavorite('${p.id}')"><i class="fa-${isFav?'solid':'regular'} fa-heart"></i> ${isAR?'المفضلة':'Favorite'}</button>
                        <button class="pl-action-btn ${isSaved?'saved':''}" onclick="plToggleSaved('${p.id}')"><i class="fa-${isSaved?'solid':'regular'} fa-bookmark"></i> ${isAR?'حفظ':'Save'}</button>
                        <button class="pl-action-btn" onclick="plShare('${p.id}')"><i class="fa-solid fa-share-nodes"></i> ${isAR?'مشاركة':'Share'}</button>
                    </div>
                </div>
                <div class="pl-video-list-wrap">
                    <div class="pl-video-list-title"><span>${isAR?'فيديوهات القائمة':'Playlist Videos'}</span><span>${videos.length}</span></div>
                    <div id="plVideoList">${videos.length ? videos.map((v,i) => _plVideoItemHTML(v,i,isAR)).join('') : `<div class="pl-empty">${isAR?'لا توجد فيديوهات بعد':'No videos yet'}</div>`}</div>
                </div>
            </div>`;
        }

        window.plPlayVideo = function(i) {
            if (i < 0 || i >= _plCurrentVideos.length) return;
            _plCurrentIndex = i;
            const isAR = lang === 'AR';
            const wrap = document.getElementById('plPlayerWrap');
            if (wrap) wrap.innerHTML = _plPlayerHTML(isAR);
            const list = document.getElementById('plVideoList');
            if (list) list.innerHTML = _plCurrentVideos.map((v,idx) => _plVideoItemHTML(v,idx,isAR)).join('');
            wrap?.scrollIntoView({ behavior:'smooth', block:'start' });
        };

        window.plToggleFavorite = async function(id) {
            const isAR = lang === 'AR';
            if (!window._currentUid) { showToast(isAR?'سجّل الدخول لإضافة القائمة للمفضلة':'Log in to add to favorites', true); return; }
            const favIds = window._userData?.favoritePlaylists || [];
            const isFav = favIds.includes(id);
            try {
                await window._togglePlaylistFavorite(id, !isFav);
                window._userData.favoritePlaylists = isFav ? favIds.filter(x => x !== id) : [...favIds, id];
                _plRenderDetail(document.getElementById('plStage'));
                showToast(isFav ? (isAR?'تمت الإزالة من المفضلة':'Removed from favorites') : (isAR?'أُضيف إلى المفضلة ❤️':'Added to favorites ❤️'));
            } catch(e) { console.error('plToggleFavorite error:', e); showToast(isAR?'حدث خطأ':'An error occurred', true); }
        };

        window.plToggleSaved = async function(id) {
            const isAR = lang === 'AR';
            if (!window._currentUid) { showToast(isAR?'سجّل الدخول لحفظ القائمة':'Log in to save this playlist', true); return; }
            const savedIds = window._userData?.savedPlaylists || [];
            const isSaved = savedIds.includes(id);
            try {
                await window._togglePlaylistSaved(id, !isSaved);
                window._userData.savedPlaylists = isSaved ? savedIds.filter(x => x !== id) : [...savedIds, id];
                _plRenderDetail(document.getElementById('plStage'));
                showToast(isSaved ? (isAR?'تم إلغاء الحفظ':'Removed from saved') : (isAR?'تم حفظ القائمة 📌':'Playlist saved 📌'));
            } catch(e) { console.error('plToggleSaved error:', e); showToast(isAR?'حدث خطأ':'An error occurred', true); }
        };

        window.plShare = function(id) {
            const isAR = lang === 'AR';
            const p = (_plCurrentPlaylist && _plCurrentPlaylist.id === id) ? _plCurrentPlaylist : _plAll.find(x => x.id === id);
            const shareUrl = window.location.href;
            if (navigator.share) {
                navigator.share({ title: p?.title || 'ATLASYA Playlist', url: shareUrl }).catch(()=>{});
            } else {
                navigator.clipboard?.writeText(shareUrl).then(() => {
                    showToast(isAR?'تم نسخ رابط القائمة':'Playlist link copied');
                }).catch(() => showToast(isAR?'تعذّر النسخ':'Could not copy', true));
            }
        };


        /* ─── COMING SOON ─── */
        const soonProgress = { playlists:75, library:60, insights:30, datasets:50, tools:85, jobs:40, courses:55 };
        const soonIcons = { playlists:'fa-clapperboard', library:'fa-book-bookmark', insights:'fa-lightbulb', datasets:'fa-database', tools:'fa-laptop-code', jobs:'fa-briefcase', courses:'fa-building-shield' };

        /* ─── PRO GATE HELPER ─── */
        function _renderProGate(area, featureName, featureNameEN) {
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="pro-gate">
                <div class="pro-gate-icon"><i class="fa-solid fa-crown"></i></div>
                <h2>${isAR ? `${featureName} — حصري لـ Pro` : `${featureNameEN} — Pro Only`}</h2>
                <p>${isAR
                    ? 'هذه الميزة حصرية لأعضاء Pro. قم بالترقية للوصول الفوري لهذه الخدمة وغيرها.'
                    : 'This feature is exclusive to Pro members. Upgrade now for instant access.'}</p>
                <button class="pro-gate-btn" onclick="goSettings('plan')">
                    <i class="fa-solid fa-arrow-up"></i>
                    ${isAR ? 'ترقية إلى Pro — 200 ج/سنة' : 'Upgrade to Pro — 200 EGP/year'}
                </button>
            </div>`;
        }

        /* ─── PORTFOLIO (STUDENT MAPS) ─── */
        async function renderPortfolio(area) {
            const isAR = lang === 'AR';
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin ? window._isAdmin() : false;

            if (!isPro && !isAdmin) {
                // Basic user → view-only mode, can see all published maps but can't publish
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR ? 'خرائط الطلبة' : 'Student Maps'}</h2>
                    <p>${isAR ? 'استعرض مشاريع وخرائط الطلاب المنشورة' : 'Browse published maps and projects by students'}</p>
                </div>
                <div class="portfolio-viewer-note">
                    <i class="fa-solid fa-eye" style="color:var(--g3);"></i>
                    ${isAR
                        ? 'أنت في وضع العرض فقط. ترقّى إلى <strong>Pro</strong> لنشر مشاريعك وخرائطك الخاصة.'
                        : 'You are in view-only mode. Upgrade to <strong>Pro</strong> to publish your own maps.'}
                    <button class="pro-gate-btn" style="margin:0 8px;padding:6px 14px;font-size:12px;" onclick="goSettings('plan')">
                        <i class="fa-solid fa-crown"></i> ${isAR ? 'ترقية' : 'Upgrade'}
                    </button>
                </div>
                <div class="portfolio-grid" id="portfolioGrid"><div class="spinner" style="margin:30px auto;"></div></div>`;
                try {
                    // Load ALL published items (no uid filter) so Basic users see everyone's work
                    const items = await window._loadPortfolioItems();
                    _renderPortfolioGrid(items, isAR);
                } catch(e) { _renderPortfolioGrid([], isAR); }
                return;
            }

            // Pro user
            const uid = window._userData?.uid || window._currentUid || 'me';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'خرائط الطلبة' : 'Student Maps'}</h2>
                <p>${isAR ? 'عرض عام لمشاريعك وخرائطك — زي Behance بس لـ GIS' : 'Your public profile for maps & projects — like Behance for GIS'}</p>
            </div>
            <div class="portfolio-header-actions">
                <button onclick="openPortfolioUpload()" style="margin-right:auto;padding:9px 18px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:9px;font-size:13px;font-weight:800;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-plus"></i> ${isAR ? 'نشر مشروع جديد' : 'Add New Project'}
                </button>
            </div>
            <div id="portfolioUploadForm" style="display:none;margin-bottom:20px;">
                <div class="form-card">
                    <h3 style="margin-bottom:16px;font-size:15px;">${isAR ? 'نشر مشروع جديد' : 'Publish New Project'}</h3>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label style="font-size:12px;color:var(--muted);font-weight:700;display:block;margin-bottom:6px;">${isAR ? 'اسم المشروع' : 'Project Name'}</label>
                        <input type="text" id="portTitle" placeholder="${isAR ? 'مثلاً: خريطة توزيع السكان في القاهرة' : 'e.g. Cairo Population Distribution Map'}" style="width:100%;padding:10px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:14px;font-family:'Tajawal',sans-serif;outline:none;">
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label style="font-size:12px;color:var(--muted);font-weight:700;display:block;margin-bottom:6px;">${isAR ? 'وصف قصير' : 'Short Description'}</label>
                        <textarea id="portDesc" rows="2" placeholder="${isAR ? 'اشرح إيه اللي عملته...' : 'Describe what you built...'}" style="width:100%;padding:10px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:14px;font-family:'Tajawal',sans-serif;outline:none;resize:vertical;"></textarea>
                    </div>
                    <div class="portfolio-upload-zone" id="portDropZone" onclick="document.getElementById('portFile').click()">
                        <i class="fa-solid fa-map"></i>
                        <p>${isAR ? 'اضغط لرفع صورة الخريطة أو ملف المشروع' : 'Click to upload a map screenshot or project file'}</p>
                        <input type="file" id="portFile" style="display:none;" accept=".png,.jpg,.jpeg,.pdf,.zip" onchange="handlePortFile(event)">
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="submitPortfolioItem()" style="flex:1;padding:11px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:9px;font-size:14px;font-weight:800;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            <i class="fa-solid fa-paper-plane"></i> ${isAR ? 'نشر' : 'Publish'}
                        </button>
                        <button onclick="document.getElementById('portfolioUploadForm').style.display='none'" style="padding:11px 18px;background:transparent;border:1px solid var(--border2);border-radius:9px;color:var(--muted);font-size:13px;font-family:'Tajawal',sans-serif;cursor:pointer;">
                            ${isAR ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
            <div class="portfolio-grid" id="portfolioGrid"><div class="spinner" style="margin:30px auto;"></div></div>`;

            try {
                // Load ALL published items so Pro users see everyone's work + their own
                const items = await window._loadPortfolioItems();
                _renderPortfolioGrid(items, isAR);
            } catch(e) { _renderPortfolioGrid([], isAR); }
        }

        function _portfolioItemCard(it, isAR) {
            const isImg = it.fileData && /^data:image\//.test(it.fileData);
            const thumb = isImg
                ? `<div class="portfolio-item-thumb" style="background-image:url('${it.fileData}');background-size:cover;background-position:center;cursor:pointer;" onclick="openPortfolioLightbox('${it.id}')"></div>`
                : `<div class="portfolio-item-thumb">${it.icon || '🗺️'}</div>`;
            const fileLink = (!isImg && it.fileData)
                ? `<a href="${it.fileData}" download="${it.fileName||'project'}" style="display:inline-block;margin-top:8px;font-size:11px;font-weight:700;color:var(--gold3);text-decoration:none;"><i class="fa-solid fa-download"></i> ${isAR?'تحميل الملف':'Download file'}</a>`
                : '';
            return `
            <div class="portfolio-item">
                ${thumb}
                <div class="portfolio-item-body">
                    <h4>${it.title || ''}</h4>
                    <p>${it.desc || ''}</p>
                    <p style="margin-top:6px;font-size:11px;font-weight:700;color:var(--gold3);">${it.authorName || ''}</p>
                    ${isImg ? `<button onclick="openPortfolioLightbox('${it.id}')" style="margin-top:8px;padding:5px 12px;background:rgba(var(--brand-rgb,30,122,52),0.12);border:1px solid rgba(var(--brand-rgb,30,122,52),0.3);border-radius:7px;color:var(--green4);font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"><i class="fa-solid fa-expand"></i> ${isAR?'عرض كاملاً':'Full Screen'}</button>` : ''}
                    ${fileLink}
                </div>
            </div>`;
        }

        // Store portfolio items for lightbox access
        let _portfolioItemsCache = [];

        function _renderPortfolioGrid(items, isAR) {
            _portfolioItemsCache = items;
            const grid = document.getElementById('portfolioGrid');
            if (!grid) return;
            if (!items.length) {
                grid.innerHTML = `<div class="no-projects"><i class="fa-solid fa-map"></i><p>${isAR ? 'لا توجد مشاريع منشورة بعد — كن أول من ينشر!' : 'No projects published yet!'}</p></div>`;
                return;
            }
            grid.innerHTML = items.map(it => _portfolioItemCard(it, isAR)).join('');
        }

        window.openPortfolioLightbox = function(itemId) {
            const it = _portfolioItemsCache.find(x => x.id === itemId);
            if (!it || !it.fileData) return;
            const isAR = lang === 'AR';
            // Remove existing lightbox
            const existing = document.getElementById('portfolioLightbox');
            if (existing) existing.remove();

            const lb = document.createElement('div');
            lb.id = 'portfolioLightbox';
            lb.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;';
            lb.onclick = function(e) { if(e.target === lb) lb.remove(); };
            lb.innerHTML = `
                <div style="position:absolute;top:16px;right:16px;display:flex;gap:10px;z-index:1;">
                    <a href="${it.fileData}" download="${it.title||'map'}" style="width:40px;height:40px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;text-decoration:none;" title="${isAR?'تحميل':'Download'}"><i class="fa-solid fa-download"></i></a>
                    <button onclick="document.getElementById('portfolioLightbox').remove()" style="width:40px;height:40px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <img src="${it.fileData}" alt="${it.title||''}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,0.8);">
                <div style="margin-top:14px;text-align:center;">
                    <div style="font-size:15px;font-weight:700;color:#fff;">${it.title||''}</div>
                    ${it.authorName ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${it.authorName}</div>` : ''}
                </div>`;
            document.body.appendChild(lb);
        };

        let portfolioFileData = null;
        const PORT_FILE_BUDGET_BYTES = 800000; // leaves headroom under Firestore's ~1MB doc limit for title/desc text
        const PORT_NONIMAGE_MAX_BYTES = 600000; // pdf/zip aren't compressed, so cap the raw file size instead
        async function handlePortFile(e) {
            const isAR = lang === 'AR';
            const file = e.target.files[0];
            if (!file) return;
            const zone = document.getElementById('portDropZone');
            const setZoneTxt = (t) => { if (zone) { const p = zone.querySelector('p'); if (p) p.textContent = t; } };
            try {
                let dataUrl;
                if (/^image\//.test(file.type)) {
                    // Reuses the same budget-aware compressor as the CV certificates uploader:
                    // resizes + re-encodes as JPEG until it fits comfortably under Firestore's doc limit.
                    setZoneTxt(isAR ? 'جاري ضغط الصورة...' : 'Compressing image...');
                    dataUrl = await _cvCompressToBudget(file, PORT_FILE_BUDGET_BYTES);
                } else {
                    if (file.size > PORT_NONIMAGE_MAX_BYTES) {
                        showToast(isAR
                            ? `⚠️ الملف كبير جداً (الحد الأقصى ~${Math.floor(PORT_NONIMAGE_MAX_BYTES / 1000)}KB لملفات PDF/ZIP)`
                            : `⚠️ File too large (max ~${Math.floor(PORT_NONIMAGE_MAX_BYTES / 1000)}KB for PDF/ZIP)`, true);
                        e.target.value = '';
                        return;
                    }
                    dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = ev => resolve(ev.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }
                portfolioFileData = { name: file.name, data: dataUrl };
                setZoneTxt(`✓ ${file.name}`);
            } catch (err) {
                console.error('portfolio file compress error:', err);
                showToast(isAR ? '⚠️ فشل تجهيز الملف، حاول مرة أخرى' : '⚠️ Failed to process the file, try again', true);
                setZoneTxt(isAR ? 'اضغط لرفع صورة الخريطة أو ملف المشروع' : 'Click to upload a map screenshot or project file');
                e.target.value = '';
            }
        }

        window.openPortfolioUpload = function() {
            const f = document.getElementById('portfolioUploadForm');
            if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
        };
        window.copyPortfolioLink = function(uid) {
            try { navigator.clipboard.writeText('https://atlasya.app/p/' + uid); } catch(e) {}
            if (typeof showToast === 'function') showToast(lang==='AR' ? '✅ تم نسخ الرابط' : '✅ Link copied');
        };
        window.submitPortfolioItem = async function() {
            const isAR = lang === 'AR';
            const title = document.getElementById('portTitle')?.value?.trim();
            const desc  = document.getElementById('portDesc')?.value?.trim();
            if (!title) { if (typeof showToast === 'function') showToast(isAR ? '⚠️ اكتب اسم المشروع' : '⚠️ Enter a project title'); return; }
            const FIRESTORE_SAFE_DOC_BYTES = 950000;
            const payloadCheck = { title, desc, fileName: portfolioFileData?.name || '', fileData: portfolioFileData?.data || '' };
            const fullPayloadBytes = new Blob([JSON.stringify(payloadCheck)]).size;
            if (fullPayloadBytes > FIRESTORE_SAFE_DOC_BYTES) {
                if (typeof showToast === 'function') showToast(isAR ? '⚠️ حجم الملف كبير جداً حتى بعد الضغط، جرب صورة تانية' : '⚠️ File is too large even after compression, try a different image', true);
                return;
            }
            const btn = document.querySelector('#portfolioUploadForm button[onclick="submitPortfolioItem()"]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }
            try {
                await window._submitPortfolioItem({
                    title, desc,
                    fileName: portfolioFileData?.name || '',
                    fileData: portfolioFileData?.data || ''
                });
                if (typeof showToast === 'function') showToast(isAR ? '🎉 تم نشر مشروعك!' : '🎉 Project published!');
                document.getElementById('portfolioUploadForm').style.display = 'none';
                document.getElementById('portTitle').value = '';
                document.getElementById('portDesc').value = '';
                portfolioFileData = null;
                const zone = document.getElementById('portDropZone');
                if (zone) { const p = zone.querySelector('p'); if (p) p.textContent = isAR ? 'اضغط لرفع صورة الخريطة أو ملف المشروع' : 'Click to upload a map screenshot or project file'; }
                const uid = window._userData?.uid || window._currentUid || 'me';
                const items = await window._loadPortfolioItems(uid);
                _renderPortfolioGrid(items, isAR);
            } catch(e) {
                if (typeof showToast === 'function') showToast(e.message || (isAR ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, try again'));
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${lang==='AR' ? 'نشر' : 'Publish'}`; }
            }
        };

        /* ─── MONTHLY REPORT ─── */
        async function renderMonthlyReport(area) {
            const isAR = lang === 'AR';

            const now = new Date();
            const monthName = isAR
                ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][now.getMonth()]
                : now.toLocaleString('en', {month:'long'});

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? `تقريرك لشهر ${monthName} ${now.getFullYear()}` : `Your ${monthName} ${now.getFullYear()} Report`}</h2>
                <p>${isAR ? 'ملخص شامل لنشاطك ومسيرتك التعليمية هذا الشهر' : 'A full summary of your activity and learning journey this month'}</p>
            </div>
            <div class="report-summary-grid">
                <div class="report-stat-card">
                    <div class="rs-icon"><i class="fa-solid fa-upload"></i></div>
                    <div class="rs-val">0</div>
                    <div class="rs-label">${isAR ? 'ملفات رُفعت' : 'Files Uploaded'}</div>
                </div>
                <div class="report-stat-card">
                    <div class="rs-icon"><i class="fa-solid fa-play-circle"></i></div>
                    <div class="rs-val">0</div>
                    <div class="rs-label">${isAR ? 'كورسات فُتحت' : 'Courses Opened'}</div>
                </div>
                <div class="report-stat-card">
                    <div class="rs-icon"><i class="fa-solid fa-comments"></i></div>
                    <div class="rs-val">0</div>
                    <div class="rs-label">${isAR ? 'رسائل في الـ Community' : 'Community Messages'}</div>
                </div>
                <div class="report-stat-card">
                    <div class="rs-icon"><i class="fa-solid fa-briefcase"></i></div>
                    <div class="rs-val">0</div>
                    <div class="rs-label">${isAR ? 'وظائف شُوهدت' : 'Jobs Viewed'}</div>
                </div>
            </div>
            <p class="report-section-title"><i class="fa-solid fa-timeline"></i> ${isAR ? 'آخر النشاطات' : 'Recent Activity'}</p>
            <div class="report-activity-list">
                <div class="report-activity-item" style="justify-content:center;color:var(--muted);">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span>${isAR ? 'لا توجد نشاطات بعد — ابدأ استخدام المنصة وستظهر هنا' : 'No activity yet — start using the platform and it will show up here'}</span>
                </div>
            </div>
            <button class="report-download-btn" onclick="downloadMonthlyReportPDF()">
                <i class="fa-solid fa-file-pdf"></i>
                ${isAR ? `تحميل تقرير ${monthName} كـ PDF` : `Download ${monthName} Report as PDF`}
            </button>`;
        }


        window.downloadMonthlyReportPDF = async function() {
        const isAR = lang === 'AR';
        if (typeof showToast === 'function') showToast(isAR ? '📸 جاري تجهيز الصورة...' : '📸 Preparing image...');

        // بناء صفحة التقرير كـ overlay مؤقت
        const now = new Date();
        const monthName = isAR
            ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][now.getMonth()]
            : now.toLocaleString('en', {month:'long'});

        const overlay = document.createElement('div');
        overlay.id = '__reportOverlay';
        overlay.style.cssText = `
            position:fixed;top:-9999px;left:-9999px;
            width:900px;background:#20242c;
            font-family:'Tajawal',sans-serif;
            direction:rtl;color:#e8e6f0;
            border-radius:24px;overflow:hidden;
            z-index:-1;
        `;
        overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#161920 0%,#1a2818 60%,#1e2f1c 100%);border-bottom:1px solid rgba(var(--brand-rgb,30,122,52),0.3);padding:36px 48px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;">
        <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:58px;height:58px;background:linear-gradient(135deg,#1e7a34,#27a346);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(var(--brand-rgb,30,122,52),0.5);">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            <div>
            <div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:700;letter-spacing:-1px;color:#e8e6f0;">ATLAS<span style="color:#d4a017;">YA</span></div>
            <div style="font-size:12px;color:#8a8fa0;margin-top:2px;">منصة تعلّم الجغرافيا المكانية · GIS Learning Portal</div>
            </div>
        </div>
        <div style="text-align:left;">
            <div style="display:inline-block;padding:4px 14px;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.35);border-radius:20px;font-size:12px;font-weight:700;color:#f0c040;margin-bottom:8px;">📊 ${isAR?'تقرير شهري':'Monthly Report'}</div>
            <div style="font-size:22px;font-weight:900;color:#e8e6f0;">${isAR?`تقرير ${monthName} ${now.getFullYear()}`:`${monthName} ${now.getFullYear()} Report`}</div>
            <div style="font-size:13px;color:#8a8fa0;margin-top:4px;">${isAR?'النسخة الرسمية':'Official Report'}</div>
        </div>
        </div>
        <div style="padding:36px 48px;">
        ${document.querySelector('.report-summary-grid') ? document.querySelector('.report-summary-grid').outerHTML : ''}
        ${document.querySelector('.report-activity-list') ? `<div style="margin-top:24px;"><p style="font-size:14px;font-weight:700;color:#8a8fa0;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;">${isAR?'آخر النشاطات':'Recent Activity'}</p>${document.querySelector('.report-activity-list').outerHTML}</div>` : ''}
        </div>
        <div style="border-top:1px solid rgba(var(--brand-rgb,30,122,52),0.25);padding:18px 48px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#8a8fa0;background:rgba(0,0,0,0.15);">
        <span>${isAR?'تم إنشاؤه بواسطة':'Generated by'} <strong style="color:#27a346;">ATLASYA Platform</strong></span>
        <span>${monthName} ${now.getFullYear()}</span>
        <span>atlasya.io</span>
        </div>`;

        document.body.appendChild(overlay);

        // تحريكه للشاشة مؤقتاً عشان html2canvas يشوفه
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.zIndex = '99999';
        overlay.style.position = 'fixed';

        try {
            const canvas = await html2canvas(overlay, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#20242c',
                logging: false
            });
            const link = document.createElement('a');
            link.download = `atlasya_report_${monthName}_${now.getFullYear()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            if (typeof showToast === 'function') showToast(isAR ? '✅ تم تحميل التقرير كصورة!' : '✅ Report downloaded as image!');
        } catch(e) {
            if (typeof showToast === 'function') showToast(isAR ? '❌ حدث خطأ، حاول مرة أخرى' : '❌ Error, please try again', true);
        }

        document.body.removeChild(overlay);
    };

        /* ─── MENTORSHIP ─── */
        async function renderMentorship(area) {
            const isAR = lang === 'AR';
            const isPro = (window._userData?.plan === 'pro') || (window._isPro ? window._isPro() : false);
            const isAdmin = window._isAdmin ? window._isAdmin() : false;

            if (!isPro && !isAdmin) {
                _renderProGate(area, isAR ? 'اسأل خبير GIS' : 'Ask a GIS Expert', isAR ? 'اسأل خبير GIS' : 'Ask a GIS Expert');
                return;
            }

            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR ? 'اسأل خبير GIS' : 'Ask a GIS Expert'}</h2>
                <p>${isAR ? 'ابعت طلبك وهيرد عليك فريقنا بمواعيد التوفر ولينك الجلسة' : 'Send your request and our team will reply with available times and a session link'}</p>
            </div>
            <div class="mentorship-intro">
                <i class="fa-solid fa-user-tie"></i>
                <div>
                    <h3>${isAR ? 'إيه اللي هتاخده من الاستشارة؟' : 'What you get from the consultation'}</h3>
                    <p>${isAR
                        ? 'مراجعة مشاريعك، إجابة أسئلتك التقنية، نصائح لمسارك المهني في GIS، ومساعدة في بناء الـ Portfolio. اكتب طلبك وهيوصلك رد بمواعيد الجلسة على Google Meet.'
                        : 'Project review, technical Q&A, GIS career advice, and help building your Portfolio. Write your request and you will get a reply with session times on Google Meet.'}</p>
                </div>
            </div>
            <div style="text-align:center;margin:22px 0 30px;">
                <button onclick="openConsultationModal()" style="padding:15px 34px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(212,160,23,0.25);">
                    <i class="fa-solid fa-calendar-plus"></i> ${isAR ? 'احجز استشارة' : 'Book a Consultation'}
                </button>
            </div>
            <p class="report-section-title"><i class="fa-solid fa-comments"></i> ${isAR ? 'طلباتك السابقة' : 'Your Requests'}</p>
            <div id="mentorshipRequestsContainer">
                <div style="text-align:center;padding:24px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>`;

            // Load this student's requests from Firebase
            try {
                let reqs = [];
                if (window._loadMyMentorshipRequests) {
                    reqs = await window._loadMyMentorshipRequests();
                }
                const container = document.getElementById('mentorshipRequestsContainer');
                if (!container) return;
                if (!reqs || reqs.length === 0) {
                    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:10px;"><i class="fa-solid fa-comments" style="display:block;font-size:24px;opacity:0.3;margin-bottom:8px;"></i>${isAR ? 'مفيش طلبات لسه، دوس على "احجز استشارة" وابدأ' : 'No requests yet — click "Book a Consultation" to get started'}</div>`;
                    return;
                }
                container.innerHTML = reqs.map(r => {
                    const timeStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString(isAR?'ar-EG':'en-US',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                    return `<div style="padding:16px 18px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;margin-bottom:12px;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                            <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:${r.replied ? 'rgba(var(--brand-rgb,30,122,52),0.15)' : 'rgba(212,160,23,0.15)'};color:${r.replied ? 'var(--green4)' : 'var(--gold3)'};">
                                <i class="fa-solid fa-circle" style="font-size:6px;"></i> ${r.replied ? (isAR ? 'تم الرد' : 'Replied') : (isAR ? 'قيد الانتظار' : 'Pending')}
                            </span>
                            ${timeStr ? `<span style="font-size:11px;color:var(--muted);margin-right:auto;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>` : ''}
                        </div>
                        <div style="font-size:13px;color:var(--text);line-height:1.75;white-space:pre-wrap;">${_escapeHtml(r.message||'')}</div>
                        ${(r.preferredDay || r.preferredTime) ? `<div style="font-size:11px;color:var(--gold3);margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><i class="fa-regular fa-calendar-check"></i> ${isAR ? 'الوقت المطلوب:' : 'Requested time:'} ${r.preferredDay || ''} ${r.preferredTime ? '— ' + r.preferredTime : ''}</div>` : ''}
                        ${r.replied ? `<div style="margin-top:12px;padding:12px 14px;background:rgba(var(--brand-rgb,30,122,52),0.07);border:1px solid rgba(var(--brand-rgb,30,122,52),0.22);border-radius:10px;">
                            <div style="font-size:11px;font-weight:700;color:var(--green4);margin-bottom:6px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-headset"></i> ${isAR ? 'رد الفريق' : "Team's Reply"}</div>
                            <div style="font-size:13px;color:var(--text);line-height:1.75;">${_linkifyText(r.reply||'')}</div>
                        </div>` : `<div style="margin-top:10px;font-size:12px;color:var(--muted);"><i class="fa-regular fa-hourglass-half"></i> ${isAR ? 'هيوصلك رد قريباً بمواعيد التوفر' : 'You will get a reply soon with available times'}</div>`}
                    </div>`;
                }).join('');
            } catch(e) {
                const container = document.getElementById('mentorshipRequestsContainer');
                if (container) container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);">${isAR ? 'خطأ في التحميل' : 'Loading error'}</div>`;
            }
        }