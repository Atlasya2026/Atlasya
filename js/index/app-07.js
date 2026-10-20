
        function _escapeHtml(text) {
            return (text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        function _linkifyText(text) {
            const escaped = _escapeHtml(text);
            return escaped
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--gold3);font-weight:700;text-decoration:underline;">$1</a>')
                .replace(/\n/g, '<br>');
        }

        window.openConsultationModal = function() {
            const isAR = lang === 'AR';
            const existing = document.getElementById('consultationModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'consultationModal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div style="width:100%;max-width:480px;background:var(--card);border:1px solid rgba(212,160,23,0.3);border-radius:20px;padding:28px 26px;backdrop-filter:blur(20px);box-shadow:var(--shadow);animation:fadeUp 0.3s ease both;" onclick="event.stopPropagation()">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                        <h3 style="font-size:17px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-user-tie" style="color:var(--gold3);"></i> ${isAR ? 'احجز استشارة' : 'Book a Consultation'}</h3>
                        <button onclick="document.getElementById('consultationModal').remove()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:var(--muted);cursor:pointer;font-size:15px;">✕</button>
                    </div>
                    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.7;">${isAR ? 'اكتب اللي محتاج تستشير فيه بالظبط، واختار اليوم والساعة اللي يناسبوك، وفريقنا هيرد عليك بالتأكيد أو بمواعيد تانية ولينك الجلسة.' : 'Tell us exactly what you need help with, pick your preferred day and time, and our team will confirm or suggest other times along with the session link.'}</p>
                    <textarea id="consultationMsgInput" rows="5" placeholder="${isAR ? 'مثال: محتاج مراجعة مشروع خرائطي في ArcGIS...' : 'e.g. I need a review of my ArcGIS mapping project...'}" style="width:100%;padding:12px 14px;background:rgba(0,0,0,0.35);border:1px solid rgba(212,160,23,0.2);border-radius:12px;color:var(--text);font-size:14px;font-family:'Tajawal',sans-serif;outline:none;resize:vertical;margin-bottom:14px;"></textarea>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
                        <div>
                            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">${isAR ? 'اليوم المفضل' : 'Preferred Day'}</label>
                            <input type="date" id="consultationDayInput" style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(212,160,23,0.25);border-radius:10px;color:var(--text);font-size:13px;font-family:'Tajawal',sans-serif;outline:none;color-scheme:dark;">
                        </div>
                        <div>
                            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">${isAR ? 'الساعة المفضلة' : 'Preferred Time'}</label>
                            <input type="time" id="consultationTimeInput" style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(212,160,23,0.25);border-radius:10px;color:var(--text);font-size:13px;font-family:'Tajawal',sans-serif;outline:none;color-scheme:dark;">
                        </div>
                    </div>
                    <button onclick="submitConsultationRequest()" style="width:100%;padding:13px;background:linear-gradient(135deg,var(--gold3),var(--gold2));color:#0a0a0e;border:none;border-radius:12px;font-size:14px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                        <i class="fa-solid fa-paper-plane"></i> ${isAR ? 'إرسال الطلب' : 'Send Request'}
                    </button>
                </div>`;
            document.body.appendChild(modal);
            setTimeout(() => document.getElementById('consultationMsgInput')?.focus(), 100);
        };

        window.submitConsultationRequest = async function() {
            const isAR = lang === 'AR';
            const input = document.getElementById('consultationMsgInput');
            const msg = input?.value.trim();
            const dayVal = document.getElementById('consultationDayInput')?.value || '';
            const timeVal = document.getElementById('consultationTimeInput')?.value || '';
            if (!msg) {
                if (typeof showToast === 'function') showToast(isAR ? 'من فضلك اكتب طلبك الأول' : 'Please write your request first', true);
                return;
            }
            // Format the date nicely (e.g. "الأحد 29 يونيو 2026") if provided
            let dayLabel = '';
            if (dayVal) {
                try {
                    const dt = new Date(dayVal + 'T00:00:00');
                    dayLabel = dt.toLocaleDateString(isAR ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                } catch(e) { dayLabel = dayVal; }
            }
            try {
                await window._sendMentorshipRequest(msg, dayLabel, timeVal);
                document.getElementById('consultationModal')?.remove();
                if (typeof showToast === 'function') showToast(isAR ? '🎉 تم إرسال طلبك! هيتم الرد عليك قريباً' : '🎉 Request sent! We will get back to you soon.');
                if (window._currentPage === 'mentorship') navigate('mentorship', null, true);
            } catch(e) {
                if (typeof showToast === 'function') showToast(isAR ? 'خطأ في الإرسال، حاول مرة ثانية' : 'Failed to send, please try again', true);
            }
        };

        /* ─── SOON ─── */
        /* ══════════════════════════════════════════════════════
           DIGITAL LIBRARY (ATLASYA) — student-facing
           ══════════════════════════════════════════════════════ */
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

        let _libAllBooks = [];
        let _libStage = { view: 'home', payload: null };
        let _libListBase = [];
        let _libFilters = { category: '', language: '', university: '', sort: '' };

        async function renderLibrary(area) {
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="lib-hero">
                <h2><i class="fa-solid fa-book-bookmark"></i> ${isAR?'مكتبة ATLASYA الرقمية':'ATLASYA Digital Library'}</h2>
                <p>${isAR?'أكبر مكتبة عربية وإنجليزية في الجغرافيا و GIS والاستشعار عن بعد والخرائط والمساحة والعلوم المرتبطة':'The largest Arabic & English library for Geography, GIS, Remote Sensing, Cartography, Surveying & related sciences'}</p>
                <div class="lib-search-bar ${isAR?'rtl':''}">
                    <i class="fa-solid fa-magnifying-glass lib-search-ic"></i>
                    <input type="text" id="libHeroSearch" placeholder="${isAR?'ابحث باسم الكتاب أو المؤلف أو الكلمات المفتاحية...':'Search by title, author, or keywords...'}" onkeydown="if(event.key==='Enter') libDoSearch()">
                    <button class="lib-search-go" onclick="libDoSearch()">${isAR?'بحث':'Search'}</button>
                </div>
                <div class="lib-quickstats-row">
                    <button class="lib-fav-quick-btn" onclick="libGo('list',{type:'favorites'})"><i class="fa-solid fa-heart"></i> ${isAR?'المفضلة لديّ':'My Favorites'}</button>
                    <div class="lib-quickstats" id="libQuickStats"></div>
                </div>
            </div>
            <div id="libraryStage"><div style="text-align:center;padding:60px;"><div class="spinner" style="margin:0 auto;"></div></div></div>`;

            try { _libAllBooks = await window._loadLibraryBooks(); }
            catch(e) { console.error(e); _libAllBooks = []; }

            const stats = document.getElementById('libQuickStats');
            if (stats) {
                const totalDownloads = _libAllBooks.reduce((s,b) => s + (b.downloads||0), 0);
                const uniCount = new Set(_libAllBooks.filter(b=>b.university).map(b=>b.university.trim().toLowerCase())).size;
                stats.innerHTML = `
                    <div class="lib-stat-pill"><i class="fa-solid fa-book"></i> ${_libAllBooks.length} ${isAR?'كتاب':'books'}</div>
                    <div class="lib-stat-pill"><i class="fa-solid fa-download"></i> ${totalDownloads} ${isAR?'تحميل':'downloads'}</div>
                    <div class="lib-stat-pill"><i class="fa-solid fa-building-columns"></i> ${uniCount} ${isAR?'جامعة':'universities'}</div>`;
            }
            window.libGo('home');
        }

        window.libGo = function(view, payload) {
            _libStage = { view, payload };
            const stage = document.getElementById('libraryStage');
            if (!stage) return;
            if (view === 'home') _libRenderHome(stage);
            else if (view === 'list') _libRenderList(stage, payload);
            else if (view === 'detail') _libRenderDetail(stage, payload);
            else if (view === 'universities') _libRenderUniversities(stage);
            stage.scrollIntoView({ behavior:'smooth', block:'start' });
        };
        window.libGoHome = function() { window.libGo('home'); };
        window.libGoCategory = function(key) { window.libGo('list', { type:'category', key }); };
        window.libGoDetail = function(id) { window.libGo('detail', id); };
        window.libGoUniversities = function() { window.libGo('universities'); };
        window.libGoUniversity = function(name) { window.libGo('list', { type:'university', value:name }); };
        window.libDoSearch = function() {
            const q = document.getElementById('libHeroSearch')?.value.trim() || '';
            window.libGo('list', { type:'search', value:q });
        };

        function _libBookCard(b, isAR) {
            const favIds = window._userData?.favoriteBooks || [];
            const isFav = favIds.includes(b.id);
            const cover = b.coverData ? `<img src="${b.coverData}" alt="">` : `<i class="fa-solid fa-book"></i>`;
            return `
            <div class="lib-book-card" onclick="libGoDetail('${b.id}')">
                <button class="lib-fav-btn ${isFav?'active':''}" onclick="event.stopPropagation(); libToggleFav('${b.id}')" title="${isAR?'المفضلة':'Favorite'}"><i class="fa-${isFav?'solid':'regular'} fa-heart"></i></button>
                <div class="lib-book-cover">${cover}</div>
                <div class="lib-book-body">
                    <span class="lib-book-badge">${libCatLabel(b.category, isAR)}</span>
                    <div class="lib-book-title">${escapeHtml(b.title||'')}</div>
                    <div class="lib-book-author">${escapeHtml(b.author || (isAR?'مؤلف غير معروف':'Unknown author'))}</div>
                    <div class="lib-book-meta">
                        <span><i class="fa-solid fa-download"></i> ${b.downloads||0}</span>
                        <span>${b.language==='EN'?(isAR?'إنجليزي':'English'):(isAR?'عربي':'Arabic')}</span>
                    </div>
                </div>
            </div>`;
        }

        function _libRenderHome(stage) {
            const isAR = lang === 'AR';
            if (!_libAllBooks.length) {
                stage.innerHTML = `<div class="lib-empty"><i class="fa-solid fa-book-open"></i><p>${isAR?'لا توجد كتب في المكتبة حتى الآن — تابعنا قريباً!':'No books in the library yet — check back soon!'}</p></div>`;
                return;
            }
            const visible = _libAllBooks;
            const latest = [...visible].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,8);
            const favIds = window._userData?.favoriteBooks || [];
            const favBooks = visible.filter(b => favIds.includes(b.id));

            const catCounts = {};
            visible.forEach(b => { catCounts[b.category] = (catCounts[b.category]||0)+1; });

            stage.innerHTML = `
                <div class="lib-section">
                    <div class="lib-section-head"><h3><i class="fa-solid fa-layer-group"></i> ${isAR?'تصفح حسب التصنيف':'Browse by Category'}</h3></div>
                    <div class="lib-cat-grid">
                        ${LIBRARY_CATEGORIES.map(c => `
                        <div class="lib-cat-card" onclick="libGoCategory('${c.key}')">
                            <div class="lib-cat-icon">${c.icon}</div>
                            <div class="lib-cat-name">${isAR?c.ar:c.en}</div>
                            <div class="lib-cat-count">${catCounts[c.key]||0} ${isAR?'كتاب':'books'}</div>
                        </div>`).join('')}
                    </div>
                </div>

                <div class="lib-section">
                    <div onclick="libGoUniversities()" style="cursor:pointer;background:linear-gradient(135deg,rgba(212,160,23,0.14),rgba(212,160,23,0.04));border:1px solid rgba(212,160,23,0.3);border-radius:16px;padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;transition:all .2s;">
                        <div style="display:flex;align-items:center;gap:14px;">
                            <div style="width:48px;height:48px;border-radius:12px;background:rgba(212,160,23,0.15);display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--gold3);"><i class="fa-solid fa-building-columns"></i></div>
                            <div>
                                <div style="font-size:15px;font-weight:800;margin-bottom:3px;">${isAR?'مكتبات الجامعات':'University Libraries'}</div>
                                <div style="font-size:12.5px;color:var(--muted);">${isAR?'اختر جامعتك ولاقي كل كتبها ومراجعها في مكان واحد':'Pick your university to find all its books & references in one place'}</div>
                            </div>
                        </div>
                        <div style="color:var(--gold3);font-size:20px;"><i class="fa-solid fa-arrow-${isAR?'left':'right'}"></i></div>
                    </div>
                </div>

                <div class="lib-section">
                    <div class="lib-section-head">
                        <h3><i class="fa-solid fa-clock-rotate-left"></i> ${isAR?'أحدث الإضافات':'Latest Additions'}</h3>
                        <button class="lib-see-all" onclick="libGo('list',{type:'latest'})">${isAR?'عرض الكل':'View All'} <i class="fa-solid fa-arrow-${isAR?'left':'right'}"></i></button>
                    </div>
                    <div class="lib-row">${latest.map(b=>_libBookCard(b,isAR)).join('')}</div>
                </div>

                ${favBooks.length ? `
                <div class="lib-section">
                    <div class="lib-section-head">
                        <h3><i class="fa-solid fa-heart" style="color:#ff5577;"></i> ${isAR?'المفضلة لديك':'Your Favorites'}</h3>
                        <button class="lib-see-all" onclick="libGo('list',{type:'favorites'})">${isAR?'عرض الكل':'View All'} <i class="fa-solid fa-arrow-${isAR?'left':'right'}"></i></button>
                    </div>
                    <div class="lib-row">${favBooks.slice(0,8).map(b=>_libBookCard(b,isAR)).join('')}</div>
                </div>` : ''}
            `;
        }

        function _libGetListItems(payload) {
            const isAR = lang === 'AR';
            let items = [..._libAllBooks];
            let title = '';
            switch(payload.type) {
                case 'category':
                    items = items.filter(b => b.category === payload.key);
                    title = libCatLabel(payload.key, isAR);
                    break;
                case 'latest':
                    items = items.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
                    title = isAR?'أحدث الإضافات':'Latest Additions';
                    break;
                case 'popular':
                    items = items.sort((a,b)=>(b.downloads||0)-(a.downloads||0));
                    title = isAR?'الأكثر تحميلاً':'Most Downloaded';
                    break;
                case 'favorites': {
                    const favIds = window._userData?.favoriteBooks || [];
                    items = items.filter(b => favIds.includes(b.id));
                    title = isAR?'المفضلة لديك':'Your Favorites';
                    break;
                }
                case 'university':
                    items = items.filter(b => (b.university||'').trim().toLowerCase() === (payload.value||'').trim().toLowerCase());
                    title = payload.value || (isAR?'مكتبة الجامعة':'University Library');
                    break;
                case 'search': {
                    const q = (payload.value||'').trim().toLowerCase();
                    title = isAR ? `نتائج البحث${payload.value ? ' عن "'+payload.value+'"' : ''}` : `Search results${payload.value ? ' for "'+payload.value+'"' : ''}`;
                    if (q) items = items.filter(b =>
                        (b.title||'').toLowerCase().includes(q) ||
                        (b.author||'').toLowerCase().includes(q) ||
                        (b.keywords||'').toLowerCase().includes(q) ||
                        (b.university||'').toLowerCase().includes(q));
                    break;
                }
                default:
                    title = isAR?'كل الكتب':'All Books';
            }
            return { items, title };
        }

        function _libRenderList(stage, payload) {
            const isAR = lang === 'AR';
            const { items, title } = _libGetListItems(payload || {});
            _libListBase = items;
            _libFilters = {
                category: payload && payload.type === 'category' ? payload.key : '',
                language: '', university: '',
                sort: payload && payload.type === 'popular' ? 'popular' : (payload && payload.type === 'latest' ? 'latest' : '')
            };

            const universities = [...new Set(_libAllBooks.filter(b=>b.university).map(b=>b.university.trim()))].sort();

            stage.innerHTML = `
                ${dsBreadcrumbHTML([
                    { label: isAR?'الرئيسية':'Home', onclick:'libGoHome()' },
                    { label: escapeHtml(title) },
                ])}
                <div class="lib-section-head"><h3>${escapeHtml(title)}</h3></div>
                <div class="lib-filters-bar">
                    <input type="text" id="libListSearch" placeholder="${isAR?'بحث ضمن النتائج...':'Search within results...'}" oninput="_libApplyFilters()" style="min-width:180px;flex:1;">
                    <select id="libListCat" onchange="_libApplyFilters()">
                        <option value="">${isAR?'كل التصنيفات':'All Categories'}</option>
                        ${LIBRARY_CATEGORIES.map(c=>`<option value="${c.key}" ${_libFilters.category===c.key?'selected':''}>${c.icon} ${isAR?c.ar:c.en}</option>`).join('')}
                    </select>
                    <select id="libListLang" onchange="_libApplyFilters()">
                        <option value="">${isAR?'كل اللغات':'All Languages'}</option>
                        <option value="AR">${isAR?'عربي':'Arabic'}</option>
                        <option value="EN">${isAR?'إنجليزي':'English'}</option>
                    </select>
                    <select id="libListUni" onchange="_libApplyFilters()">
                        <option value="">${isAR?'كل الجامعات':'All Universities'}</option>
                        ${universities.map(u=>`<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('')}
                    </select>
                    <select id="libListSort" onchange="_libApplyFilters()">
                        <option value="">${isAR?'ترتيب':'Sort'}</option>
                        <option value="latest" ${_libFilters.sort==='latest'?'selected':''}>${isAR?'الأحدث':'Latest'}</option>
                        <option value="popular" ${_libFilters.sort==='popular'?'selected':''}>${isAR?'الأكثر تحميلاً':'Most Downloaded'}</option>
                        <option value="az">${isAR?'أبجدياً (أ-ي)':'A-Z'}</option>
                    </select>
                </div>
                <div class="lib-grid" id="libListGrid"></div>`;
            window._libApplyFilters();
        }

        window._libApplyFilters = function() {
            const isAR = lang === 'AR';
            const q = document.getElementById('libListSearch')?.value.trim().toLowerCase() || '';
            const cat = document.getElementById('libListCat')?.value || '';
            const langF = document.getElementById('libListLang')?.value || '';
            const uni = document.getElementById('libListUni')?.value || '';
            const sort = document.getElementById('libListSort')?.value || '';

            let items = [..._libListBase];
            if (q) items = items.filter(b => (b.title||'').toLowerCase().includes(q) || (b.author||'').toLowerCase().includes(q) || (b.keywords||'').toLowerCase().includes(q));
            if (cat) items = items.filter(b => b.category === cat);
            if (langF) items = items.filter(b => b.language === langF);
            if (uni) items = items.filter(b => (b.university||'').trim() === uni);
            if (sort === 'latest') items = items.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
            else if (sort === 'popular') items = items.sort((a,b)=>(b.downloads||0)-(a.downloads||0));
            else if (sort === 'az') items = items.sort((a,b)=>(a.title||'').localeCompare(b.title||''));

            const grid = document.getElementById('libListGrid');
            if (!grid) return;
            if (!items.length) {
                grid.innerHTML = `<div class="lib-empty" style="grid-column:1/-1;"><i class="fa-solid fa-magnifying-glass"></i><p>${isAR?'لا توجد نتائج مطابقة':'No matching results'}</p></div>`;
                return;
            }
            grid.innerHTML = items.map(b => _libBookCard(b, isAR)).join('');
        };

        function _libRenderUniversities(stage) {
            const isAR = lang === 'AR';
            const map = {};
            _libAllBooks.forEach(b => {
                const u = (b.university||'').trim();
                if (!u) return;
                map[u] = (map[u]||0) + 1;
            });
            const unis = Object.keys(map).sort((a,b) => map[b]-map[a]);
            stage.innerHTML = `
                ${dsBreadcrumbHTML([
                    { label: isAR?'الرئيسية':'Home', onclick:'libGoHome()' },
                    { label: isAR?'مكتبات الجامعات':'University Libraries' },
                ])}
                <div class="lib-section-head"><h3><i class="fa-solid fa-building-columns"></i> ${isAR?'مكتبات الجامعات':'University Libraries'}</h3></div>
                <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">${isAR?'اختر جامعتك للوصول المباشر لكل الكتب والمراجع الخاصة بيها':'Pick your university for direct access to all its books & references'}</p>
                ${unis.length ? `<div class="lib-uni-grid">${unis.map(u => `
                    <div class="lib-uni-card" onclick="libGoUniversity('${escapeHtml(u).replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-building-columns"></i>
                        <div class="lib-uni-name">${escapeHtml(u)}</div>
                        <div class="lib-uni-count">${map[u]} ${isAR?'كتاب':'books'}</div>
                    </div>`).join('')}</div>` :
                    `<div class="lib-empty"><i class="fa-solid fa-building-columns"></i><p>${isAR?'لا توجد كتب مرتبطة بجامعات حتى الآن':'No books linked to universities yet'}</p></div>`}
            `;
        }

        function _libRenderDetail(stage, id) {
            const isAR = lang === 'AR';
            const b = _libAllBooks.find(x => x.id === id);
            if (!b) {
                stage.innerHTML = `<div class="lib-empty"><i class="fa-solid fa-book-skull"></i><p>${isAR?'الكتاب غير موجود':'Book not found'}</p></div>`;
                return;
            }
            window._libViewedSet = window._libViewedSet || new Set();
            if (!window._libViewedSet.has(id)) {
                window._libViewedSet.add(id);
                b.views = (b.views||0) + 1;
                window._incrementBookViews(id);
            }

            const favIds = window._userData?.favoriteBooks || [];
            const isFav = favIds.includes(id);
            const cover = b.coverData ? `<img src="${b.coverData}" alt="">` : `<i class="fa-solid fa-book"></i>`;
            const sizeLabel = b.pdfData ? `~${Math.max(1, Math.round(b.pdfData.length*3/4/1024))} KB` : '';
            const ratings = b.ratings || {};
            const ratingVals = Object.values(ratings);
            const avgRating = ratingVals.length ? (ratingVals.reduce((a,c)=>a+c,0)/ratingVals.length) : 0;

            const facts = [];
            facts.push(`<div class="lib-fact"><i class="fa-solid fa-tag"></i> ${libCatLabel(b.category, isAR)}</div>`);
            facts.push(`<div class="lib-fact"><i class="fa-solid fa-language"></i> ${b.language==='EN'?(isAR?'إنجليزي':'English'):(isAR?'عربي':'Arabic')}</div>`);
            if (b.year) facts.push(`<div class="lib-fact"><i class="fa-solid fa-calendar"></i> ${b.year}</div>`);
            if (b.pages) facts.push(`<div class="lib-fact"><i class="fa-solid fa-file-lines"></i> ${b.pages} ${isAR?'صفحة':'pages'}</div>`);
            if (sizeLabel) facts.push(`<div class="lib-fact"><i class="fa-solid fa-file-pdf"></i> ${sizeLabel}</div>`);
            if (b.university) facts.push(`<div class="lib-fact"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(b.university)}</div>`);
            facts.push(`<div class="lib-fact"><i class="fa-solid fa-eye"></i> ${b.views||0} ${isAR?'مشاهدة':'views'}</div>`);
            facts.push(`<div class="lib-fact"><i class="fa-solid fa-download"></i> ${b.downloads||0} ${isAR?'تحميل':'downloads'}</div>`);

            const keywords = (b.keywords||'').split(',').map(k=>k.trim()).filter(Boolean);
            const similar = _libAllBooks.filter(x => x.id !== b.id && x.category === b.category).slice(0,8);

            stage.innerHTML = `
                ${dsBreadcrumbHTML([
                    { label: isAR?'الرئيسية':'Home', onclick:'libGoHome()' },
                    { label: libCatLabel(b.category, isAR), onclick:`libGoCategory('${b.category}')` },
                    { label: escapeHtml(b.title||'') },
                ])}
                <div class="lib-detail-top">
                    <div class="lib-detail-cover-wrap"><div class="lib-detail-cover">${cover}</div></div>
                    <div class="lib-detail-info">
                        <span class="lib-book-badge">${libCatLabel(b.category, isAR)}</span>
                        <h1>${escapeHtml(b.title||'')}</h1>
                        ${b.author ? `<div class="lib-detail-author"><i class="fa-solid fa-user-pen"></i> ${escapeHtml(b.author)}</div>` : ''}
                        <div class="lib-detail-facts">${facts.join('')}</div>
                        <div class="lib-rating-row">
                            <div class="lib-stars" id="libStars">
                                ${[1,2,3,4,5].map(i=>`<i class="fa-${i<=Math.round(avgRating)?'solid':'regular'} fa-star" onclick="libRateBook('${b.id}', ${i})"></i>`).join('')}
                            </div>
                            <span class="lib-rating-avg">${avgRating ? avgRating.toFixed(1) : (isAR?'لا يوجد تقييم بعد':'No ratings yet')} ${ratingVals.length ? `(${ratingVals.length})` : ''}</span>
                        </div>
                        <div class="lib-detail-actions">
                            <button class="lib-btn lib-btn-primary" onclick="libDownloadBook('${b.id}')"><i class="fa-solid fa-download"></i> ${isAR?'تحميل':'Download'}</button>
                            ${b.pdfData ? `<button class="lib-btn lib-btn-outline" onclick="libPreviewBook('${b.id}')"><i class="fa-solid fa-eye"></i> ${isAR?'معاينة PDF':'Preview PDF'}</button>` : ''}
                            <button class="lib-btn lib-btn-outline ${isFav?'active':''}" onclick="libToggleFav('${b.id}')"><i class="fa-${isFav?'solid':'regular'} fa-heart"></i> ${isFav?(isAR?'في المفضلة':'In Favorites'):(isAR?'أضف للمفضلة':'Add to Favorites')}</button>
                            <button class="lib-btn lib-btn-outline" onclick="libShareBook('${b.id}')"><i class="fa-solid fa-share-nodes"></i> ${isAR?'مشاركة':'Share'}</button>
                        </div>
                    </div>
                </div>

                <div class="lib-desc-card">
                    <h4>${isAR?'نبذة عن الكتاب':'About This Book'}</h4>
                    <p>${escapeHtml(b.description || (isAR?'لا يوجد وصف متاح لهذا الكتاب.':'No description available for this book.'))}</p>
                    ${keywords.length ? `<div class="lib-keywords">${keywords.map(k=>`<span class="lib-keyword">#${escapeHtml(k)}</span>`).join('')}</div>` : ''}
                </div>

                ${similar.length ? `
                <div class="lib-section">
                    <div class="lib-section-head"><h3><i class="fa-solid fa-book-open-reader"></i> ${isAR?'قد يعجبك أيضاً':'You May Also Like'}</h3></div>
                    <div class="lib-row">${similar.map(s=>_libBookCard(s,isAR)).join('')}</div>
                </div>` : ''}
            `;
        }

        window.libToggleFav = async function(id) {
            const isAR = lang === 'AR';
            if (!window._currentUid) { showToast(isAR?'سجّل الدخول لإضافة الكتاب للمفضلة':'Log in to add to favorites', true); return; }
            const favIds = window._userData?.favoriteBooks || [];
            const isFav = favIds.includes(id);
            try {
                await window._toggleFavoriteBook(id, !isFav);
                if (!window._userData.favoriteBooks) window._userData.favoriteBooks = [];
                if (isFav) window._userData.favoriteBooks = window._userData.favoriteBooks.filter(x => x !== id);
                else window._userData.favoriteBooks.push(id);
                if (document.getElementById('libraryStage')) window.libGo(_libStage.view, _libStage.payload);
                showToast(isFav ? (isAR?'تمت الإزالة من المفضلة':'Removed from favorites') : (isAR?'أُضيف إلى المفضلة ❤️':'Added to favorites ❤️'));
            } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
        };

        window.libDownloadBook = async function(id) {
            const isAR = lang === 'AR';
            const b = _libAllBooks.find(x => x.id === id);
            if (!b) return;
            if (!b.pdfData && !b.downloadUrl) { showToast(isAR?'لا يوجد ملف متاح لهذا الكتاب':'No file available for this book', true); return; }
            try {
                if (b.pdfData) {
                    const a = document.createElement('a');
                    a.href = b.pdfData;
                    a.download = b.pdfName || ((b.title || 'book') + '.pdf');
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    window.open(b.downloadUrl, '_blank');
                }
                b.downloads = (b.downloads||0) + 1;
                window._incrementBookDownloads(id, b);
                if (_libStage.view === 'detail' && _libStage.payload === id) window.libGo('detail', id);
            } catch(e) { showToast(isAR?'تعذّر التحميل':'Download failed', true); }
        };

        window.libPreviewBook = function(id) {
            const b = _libAllBooks.find(x => x.id === id);
            if (!b || !b.pdfData) return;
            window.open(b.pdfData, '_blank');
        };

        window.libShareBook = async function(id) {
            const isAR = lang === 'AR';
            const b = _libAllBooks.find(x => x.id === id);
            if (!b) return;
            const text = `📚 ${b.title || ''}${b.author ? ' — ' + b.author : ''}\n${isAR?'من مكتبة ATLASYA الرقمية':'via ATLASYA Digital Library'}`;
            try {
                if (navigator.share) {
                    await navigator.share({ title: b.title || 'ATLASYA', text });
                } else {
                    await navigator.clipboard.writeText(text);
                    showToast(isAR?'تم نسخ تفاصيل الكتاب':'Book details copied');
                }
            } catch(e) { /* user cancelled — ignore */ }
        };

        window.libRateBook = async function(id, value) {
            const isAR = lang === 'AR';
            if (!window._currentUid) { showToast(isAR?'سجّل الدخول لتقييم الكتاب':'Log in to rate this book', true); return; }
            const b = _libAllBooks.find(x => x.id === id);
            if (!b) return;
            try {
                await window._rateBook(id, window._currentUid, value, window._botItemName(b));
                if (!b.ratings) b.ratings = {};
                b.ratings[window._currentUid] = value;
                window.libGo('detail', id);
                showToast(isAR?'شكراً لتقييمك ⭐':'Thanks for rating ⭐');
            } catch(e) { showToast(isAR?'حدث خطأ':'An error occurred', true); }
        };

        function renderSoon(area, page, title) {
            area.innerHTML = `
            <div class="soon-page">
                <div class="soon-icon"><i class="fa-solid ${soonIcons[page]||'fa-clock'}"></i></div>
                <h2>${title}</h2>
                <p>${isAR?'هذا القسم قيد التطوير وسيكون متاحاً قريباً. نعمل على تجهيز أفضل محتوى لك.':'This section is under development and coming soon. We are preparing the best content for you.'}</p>
                <div class="progress-bar-wrap">
                    <div class="progress-bar-label">
                        <span>${isAR?'نسبة الإنجاز':'Progress'}</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>`;
        }

        /* ─── CONNECT ─── */
        function renderConnect(area) {
            const isAR = lang === 'AR';
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR?'سوشيال ميديا':'Social Media'}</h2>
                <p>${isAR?'تابعنا على قنواتنا الرسمية وابقَ على اطلاع بآخر المستجدات':'Follow us on our official social channels and stay updated'}</p>
            </div>

            <!-- Interactive Connect Hub -->
            <div class="connect-hub" id="connectHub" data-state="idle">
                <div style="text-align:center;">
                    <button class="hub-back-btn" onclick="backConnectHub()"><i class="fa-solid fa-arrow-${isAR?'right':'left'}"></i> ${isAR?'رجوع':'Back'}</button>
                </div>
                <div class="hub-stage">
                    <button class="hub-node atlasya-node" id="atlasyaHubNode" onclick="toggleConnectHub()" aria-label="Atlasya">
                        <img src="data:image/jpeg;base64,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" alt="Atlasya">
                    </button>
                    <button class="hub-node brand-node gis-node" id="gisHubNode" onclick="selectConnectBrand('gis')" aria-label="GIS Explorer">
                        <img src="data:image/jpeg;base64,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" alt="GIS Explorer">
                    </button>
                    <button class="hub-node brand-node ts-node" id="tsHubNode" onclick="selectConnectBrand('terrascope')" aria-label="TerraScope">
                        <img src="data:image/jpeg;base64,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6joHwB09h+g4O18xLu4IKp5oMVb4o4dounNnCMquNUzPLmyP2ehJ79QB9gFZ4qrGKk7a2t59SOFBysr6He4riPEZpzmY/IQWXN6lrHfMB66PVYDxjw+LBrHL1GzB5YWufrTgda6+65bi2lQxfE3D0uKiir35LTWvjgAbzx7AJIH3C5ytjr+XiztCjg4rjprzx8a97R4Hzdhvr2/qs6mOqwlksm10v0uXhh4SWa+h6ff4rwmLsmtcydaCZoDix7uoB7FWFS3BerR2a0rZYZW8zHt7OHqvNp6N88V/q2Ctjr1ili4m8txnySHTdnfffpvyXomJjlixtaOeCGvK2MB8UP4GHzDfZdOGxE6k5KSskY1acYRTT3NtERdpgEREAREQBERASEREAREQBERAEREIChSiEkIiIAinSFAQinSaQFdnMDT4gpipd8QxNkbIOR3KdjstbP8ACeO4kbXF7x/3cksMUnIeuv8AZXSaWcqMJXzLctGco2sznq3A2IrV4K4FiWKGyLbWyyl25ANDe/L2WSzwfjLGQtXx48M1uF0M3hScrZA4aJI7b9/UK8RVWHpJWyk8Wd73KK1wXiLVWhW8OWEY/Xw8kL+V7Ne/n16rcxeCpYltgQMc59mQyzySHmdK4nzP9lYopVCmnmUdQ5yas2c0/wDR9g31Japjn8N8xsNIlIMTz35D5D29luYXhPGYJ0z67JZZpxyyTWHmR7m+mz5K5RVWGpJ3UUS6s2rNnKyfoz4dksGXwLDI3O5jA2ZwiJ/0qzyvCuJzNGKlaqt8KAah8P5DF/pI7K3RFhqSTSitQ6s273OfwvA+HwVr4yvHNNZA02WxIXuaPb0VjicJUwsU0dVrh40rppHOOy5zjs/7LfRWhQpw/rFIiVSUt2c7mOBMTm8i/IWjbE72tYTFMWDQHTsrnHUIsZShpwF5ihYGN53cx0PU+a2UUxowjJyirNkOcmkm9AiItCoRE0gCImkARTpRpASEREAREQBERAEREICIiAaTSIgCIiAIiIAiIgBUaUohJGk0pRAQinSICEUogI0pREICIiEhERAEREA80REAREQgIiIAiIhIREQBERAEREICIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIhIREQBERAAiIgCIiEWCIiEhERAEREAREQBERCLBERCQiIgCIiEWCIiCwREQkIiIAiIhFgiIhIREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAf//Z" alt="TerraScope">
                    </button>

                    <!-- GIS Explorer orbit links -->
                    <a href="https://www.facebook.com/profile.php?id=61551234331234" target="_blank" class="orbit-link gis-orbit-link fb pos-top">
                        <span class="orbit-circle"><i class="fa-brands fa-facebook"></i></span>
                        <span class="orbit-label">${isAR?'فيسبوك':'Facebook'}</span>
                    </a>
                    <a href="https://www.youtube.com/@gis_explorer" target="_blank" class="orbit-link gis-orbit-link yt pos-right">
                        <span class="orbit-circle"><i class="fa-brands fa-youtube"></i></span>
                        <span class="orbit-label">${isAR?'يوتيوب':'YouTube'}</span>
                    </a>
                    <a href="https://www.instagram.com/gis_explorer25?igsh=MWRnNDVrdWx4OWxuYQ%3D%3D" target="_blank" class="orbit-link gis-orbit-link ig pos-bottom">
                        <span class="orbit-circle"><i class="fa-brands fa-instagram"></i></span>
                        <span class="orbit-label">Instagram</span>
                    </a>
                    <a href="https://www.tiktok.com/@gis_explorer25?_r=1&_t=ZS-97BLTuXk4hx" target="_blank" class="orbit-link gis-orbit-link tt pos-left">
                        <span class="orbit-circle"><i class="fa-brands fa-tiktok"></i></span>
                        <span class="orbit-label">TikTok</span>
                    </a>

                    <!-- TerraScope orbit links -->
                    <a href="https://www.facebook.com/share/1GKgtQ1cRD/" target="_blank" class="orbit-link ts-orbit-link fb pos-top">
                        <span class="orbit-circle"><i class="fa-brands fa-facebook"></i></span>
                        <span class="orbit-label">${isAR?'فيسبوك':'Facebook'}</span>
                    </a>
                    <a href="https://chat.whatsapp.com/HOIGv3xsNoBL3DGw5lmv6s?mode=gi_t" target="_blank" class="orbit-link ts-orbit-link wa pos-right">
                        <span class="orbit-circle"><i class="fa-brands fa-whatsapp"></i></span>
                        <span class="orbit-label">${isAR?'واتساب':'WhatsApp'}</span>
                    </a>
                    <a href="https://youtube.com/@terrascope-gis?si=ZZgknxYvPml1ZrtI" target="_blank" class="orbit-link ts-orbit-link yt pos-bottom">
                        <span class="orbit-circle"><i class="fa-brands fa-youtube"></i></span>
                        <span class="orbit-label">${isAR?'يوتيوب':'YouTube'}</span>
                    </a>
                    <a href="https://www.tiktok.com/@terrascope72?_r=1&_t=ZS-94Sy7sFRlXs" target="_blank" class="orbit-link ts-orbit-link tt pos-left">
                        <span class="orbit-circle"><i class="fa-brands fa-tiktok"></i></span>
                        <span class="orbit-label">TikTok</span>
                    </a>
                </div>
                <div class="hub-hint" id="hubHint">${isAR?'دوس على شعار أطلسية عشان تشوف المنصتين':'Tap the ATLASYA logo to reveal both platforms'}</div>
            </div>`;
        }

        /* ─── CONNECT HUB: interactive Atlasya ↔ GIS Explorer ↔ TerraScope state machine ─── */
        window._connectHubState = 'idle';

        function setConnectHubState(state) {
            window._connectHubState = state;
            const hub = document.getElementById('connectHub');
            if (!hub) return;
            hub.setAttribute('data-state', state);
            const hint = document.getElementById('hubHint');
            if (!hint) return;
            const isAR = lang === 'AR';
            if (state === 'idle') {
                hint.textContent = isAR ? 'دوس على شعار أطلسية عشان تشوف المنصتين' : 'Tap the ATLASYA logo to reveal both platforms';
            } else if (state === 'dual') {
                hint.textContent = isAR ? 'دوس على أي شعار تشوف قنواته' : 'Tap a logo to see its channels';
            } else if (state === 'gis') {
                hint.textContent = isAR ? 'دوس على أي أيقونة تفتح قناتها' : 'Tap any icon to open its channel';
            } else if (state === 'terrascope') {
                hint.textContent = isAR ? 'دوس على أي أيقونة تفتح قناتها' : 'Tap any icon to open its channel';
            } else {
                hint.textContent = '';
            }
        }

        window.toggleConnectHub = function() {
            setConnectHubState(window._connectHubState === 'idle' ? 'dual' : 'idle');
        };

        window.selectConnectBrand = function(brand) {
            setConnectHubState(brand);
        };

        window.backConnectHub = function() {
            setConnectHubState('dual');
        };

        /* ─── STUDENT COMMUNITY (in-app group chat) ─── */
        let _communityUnsubscribe = null;

        function communityGroupTypeLabel(type, isAR) {
            if (type === 'support') return isAR ? 'دعم فني' : 'Technical Support';
            if (type === 'general') return isAR ? 'عام' : 'General';
            return type || '';
        }
        function communityGroupTypeIcon(type) {
            if (type === 'support') return 'fa-headset';
            return 'fa-users';
        }

        async function renderCommunity(area) {
            const isAR = lang === 'AR';
            const isAdmin = window._isAdmin === true;

            // cleanup any open chat listener when (re)entering the page
            if (typeof _communityUnsubscribe === 'function') { _communityUnsubscribe(); _communityUnsubscribe = null; }

            if (isAdmin) {
                area.innerHTML = `
                <div class="page-header">
                    <h2>${isAR?'إدارة مجتمع الطلاب':'Manage Student Community'}</h2>
                    <p>${isAR?'أنشئ جروبات شات داخل المنصة — جروب دعم فني وجروب عام لكل الطلبة':'Create in-platform chat groups — a Technical Support group and a General group for all students'}</p>
                </div>
                <div class="community-admin-layout">
                    <div class="community-form-card">
                        <h3 id="communityFormTitle"><i class="fa-solid fa-circle-plus" style="color:var(--green4);"></i> ${isAR?'إضافة جروب جديد':'Add New Group'}</h3>
                        <input type="hidden" id="cgEditId" value="">
                        <div class="job-field">
                            <label>${isAR?'اسم الجروب *':'Group Name *'}</label>
                            <input type="text" id="cgName" placeholder="${isAR?'مثال: G-73':'e.g. G-73'}">
                        </div>
                        <div class="job-field">
                            <label>${isAR?'وصف الجروب':'Group Description'}</label>
                            <textarea id="cgDesc" placeholder="${isAR?'وصف مختصر عن الجروب وأهدافه...':'Short description of the group and its purpose...'}"></textarea>
                        </div>
                        <div class="job-field">
                            <label>${isAR?'نوع الجروب *':'Group Type *'}</label>
                            <select id="cgType">
                                <option value="general">${isAR?'عام (لكل الطلبة)':'General (all students)'}</option>
                                <option value="support">${isAR?'دعم فني':'Technical Support'}</option>
                            </select>
                            <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.7;">
                                <i class="fa-solid fa-circle-info"></i>
                                ${isAR?'دعم فني: لو حصلت مشكلة في المنصة أو صعب استخدامها، تواصل معنا هنا. عام: جروب مفتوح لكل الطلبة للنقاش العام.':'Technical Support: for platform issues or usage problems. General: an open discussion group for all students.'}
                            </div>
                        </div>
                        <div class="job-field">
                            <label>${isAR?'شروط الانضمام (سطر لكل شرط)':'Join Conditions (one per line)'}</label>
                            <textarea id="cgConditions" placeholder="${isAR?'مثال:\nأن تكون طالباً مسجلاً في ATLASYA\nالالتزام بقواعد المجموعة':'e.g.\nMust be an enrolled ATLASYA student\nMust agree to the group rules'}"></textarea>
                        </div>
                        <div class="job-field">
                            <label>${isAR?'قواعد الجروب (سطر لكل قاعدة)':'Group Rules (one per line)'}</label>
                            <textarea id="cgRules" placeholder="${isAR?'مثال:\nالاحترام المتبادل بين جميع الأعضاء\nممنوع نشر محتوى دعائي\nالأسئلة العلمية فقط داخل الجروب':'e.g.\nMutual respect between all members\nNo promotional content\nAcademic questions only'}"></textarea>
                        </div>
                        <button class="btn-post-job" id="btnSaveCommunity" onclick="saveCommunityGroup()">
                            <i class="fa-solid fa-floppy-disk"></i>
                            <span id="btnSaveCommunityTxt">${isAR?'حفظ الجروب':'Save Group'}</span>
                        </button>
                        <button class="btn-post-job" id="btnCancelEditCommunity" onclick="cancelEditCommunity()" style="display:none;margin-top:8px;background:rgba(255,255,255,0.06);color:var(--text);">
                            <i class="fa-solid fa-xmark"></i> ${isAR?'إلغاء التعديل':'Cancel Edit'}
                        </button>
                    </div>
                    <div class="community-list-card" id="communityAdminList">
                        <div style="text-align:center;padding:40px;color:var(--muted);">
                            <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i>
                        </div>
                    </div>
                </div>`;
                loadCommunityAdminList(isAR);
                return;
            }

            // ── STUDENT VIEW: groups grid ──
            area.innerHTML = `
            <div class="page-header">
                <h2>${isAR?'مجتمع الطلاب':'Student Community'}</h2>
                <p>${isAR?'جروبات شات داخل المنصة — تواصل مع زملائك ومع فريق الدعم الفني':'In-platform chat groups — connect with fellow students and the support team'}</p>
            </div>
            <div class="community-grid" id="communityGrid">
                <div style="text-align:center;padding:40px;color:var(--muted);grid-column:1/-1;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i>
                </div>
            </div>`;
            loadCommunityStudentGrid(isAR);
        }

        async function loadCommunityStudentGrid(isAR) {
            const grid = document.getElementById('communityGrid');
            if (!grid) return;
            try {
                const groups = await window._loadCommunityGroups();
                window._communityGroupsCache = groups;
                if (!groups.length) {
                    grid.innerHTML = `<div class="job-empty" style="grid-column:1/-1;"><i class="fa-solid fa-users-slash"></i><p>${isAR?'لا توجد جروبات حالياً':'No groups available yet'}</p></div>`;
                    return;
                }
                grid.innerHTML = groups.map(g => buildCommunityCard(g, isAR)).join('');
            } catch(e) {
                grid.innerHTML = `<div class="job-empty" style="grid-column:1/-1;"><i class="fa-solid fa-triangle-exclamation"></i><p>${isAR?'خطأ في التحميل':'Loading error'}</p></div>`;
            }
        }

        function buildCommunityCard(g, isAR) {
            const conditions = (g.conditions || '').split('\n').map(s=>s.trim()).filter(Boolean);
            const rules = (g.rules || '').split('\n').map(s=>s.trim()).filter(Boolean);
            const memberCount = g.memberCount || 0;
            const hasInfo = conditions.length || rules.length;
            const infoBtn = hasInfo ? `<button class="community-info-btn" onclick="showCommunityRules('${g.id}')" title="${isAR?'قواعد الجروب':'Group Rules'}"><i class="fa-solid fa-info"></i></button>` : '';
            return `
            <div class="community-card">
                <div class="community-card-head">
                    <div class="community-card-icon"><i class="fa-solid ${communityGroupTypeIcon(g.type)}"></i></div>
                    <div>
                        <h3>${escapeHtml(g.name||'')}</h3>
                        <div class="community-members"><i class="fa-solid fa-user-group"></i> ${memberCount} ${isAR?'مشترك':'members'}</div>
                    </div>
                    ${infoBtn}
                </div>
                <div><span class="community-badge-type">${communityGroupTypeLabel(g.type, isAR)}</span></div>
                ${g.description ? `<div class="community-card-desc">${escapeHtml(g.description)}</div>` : ''}
                <div class="community-card-footer">
                    <button class="btn-join-community" onclick="openCommunityChat('${g.id}')"><i class="fa-solid fa-comments"></i> ${isAR?'دخول الجروب':'Enter Group'}</button>
                </div>
            </div>`;
        }

        window.showCommunityRules = function(groupId) {
            const isAR = lang === 'AR';
            document.getElementById('communityRulesOverlay')?.remove();
            const g = (window._communityGroupsCache || []).find(x => x.id === groupId);
            if (!g) return;
            const conditions = (g.conditions || '').split('\n').map(s=>s.trim()).filter(Boolean);
            const rules = (g.rules || '').split('\n').map(s=>s.trim()).filter(Boolean);
            const conditionsHtml = conditions.length ? `
                <div class="community-rules">
                    <strong><i class="fa-solid fa-clipboard-check"></i> ${isAR?'شروط الانضمام':'Join Conditions'}</strong>
                    <ul>${conditions.map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>
                </div>` : '';
            const rulesHtml = rules.length ? `
                <div class="community-rules">
                    <strong><i class="fa-solid fa-gavel"></i> ${isAR?'قواعد الجروب':'Group Rules'}</strong>
                    <ul>${rules.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>
                </div>` : '';
            const overlay = document.createElement('div');
            overlay.id = 'communityRulesOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;';
            overlay.innerHTML = `
            <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:20px;width:100%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.8);overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                    <div style="font-size:15px;font-weight:700;"><i class="fa-solid fa-circle-info" style="color:var(--gold4);margin-${isAR?'left':'right'}:8px;"></i>${escapeHtml(g.name||'')}</div>
                    <button onclick="document.getElementById('communityRulesOverlay').remove()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;">✕</button>
                </div>
                <div style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
                    ${conditionsHtml}
                    ${rulesHtml}
                    ${(!conditions.length && !rules.length) ? `<div style="text-align:center;padding:20px;color:var(--muted);">${isAR?'لا توجد قواعد محددة':'No rules specified'}</div>` : ''}
                </div>
            </div>`;
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            document.body.appendChild(overlay);
        };

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /* ── Open in-app chat room for a group ── */
        window.openCommunityChat = async function(groupId) {
            const isAR = lang === 'AR';
            const area = document.getElementById('contentArea');
            if (!area) return;
            const isLight = document.getElementById('pageBody').classList.contains('light-mode');
            const inputBg = isLight ? '#f4f6fa' : 'rgba(0,0,0,0.3)';
            const inputBorder = isLight ? 'rgba(var(--brand-rgb,30,122,52),0.22)' : 'rgba(var(--brand-rgb,30,122,52),0.28)';

            let group = null;
            try {
                const groups = await window._loadCommunityGroups();
                group = groups.find(g => g.id === groupId);
            } catch(e) {}
            if (!group) { showToast(isAR?'الجروب غير موجود':'Group not found', true); return; }

            const typeIcon = communityGroupTypeIcon(group.type);
            const typeLabel = communityGroupTypeLabel(group.type, isAR);

            area.innerHTML = `
            <div class="page-header" style="margin-bottom:16px;display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;">
                <div>
                    <button onclick="navigate('community', document.getElementById('menuCommunity'))" style="background:none;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:'Tajawal',sans-serif;margin-bottom:8px;">
                        <i class="fa-solid fa-arrow-${isAR?'right':'left'}"></i> ${isAR?'رجوع للمجموعات':'Back to groups'}
                    </button>
                    <h2>${escapeHtml(group.name||'')}</h2>
                    <p><span class="community-badge-type"><i class="fa-solid ${typeIcon}"></i> ${typeLabel}</span></p>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;background:var(--chat-card-bg);border:1px solid var(--border);border-radius:18px;overflow:hidden;height:calc(100vh - 240px);min-height:440px;">
                <!-- Chat header -->
                <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0;">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--g2),var(--g4));display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;">
                        <i class="fa-solid ${typeIcon}"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:700;">${escapeHtml(group.name||'')}</div>
                        <div style="font-size:12px;color:var(--muted);"><i class="fa-solid fa-user-group"></i> ${group.memberCount||0} ${isAR?'مشترك':'members'}</div>
                    </div>
                    <button onclick="showGroupMembers('${groupId}')" title="${isAR?'عرض الأعضاء':'View Members'}"
                        style="display:flex;align-items:center;gap:6px;padding:7px 13px;background:rgba(var(--brand-rgb,30,122,52),0.1);border:1px solid var(--border2);border-radius:10px;color:var(--green4);font-size:12px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;flex-shrink:0;"
                        onmouseover="this.style.background='rgba(var(--brand-rgb,30,122,52),0.22)'" onmouseout="this.style.background='rgba(var(--brand-rgb,30,122,52),0.1)'">
                        <i class="fa-solid fa-users"></i>
                        <span>${isAR?'الأعضاء':'Members'}</span>
                    </button>
                </div>
                <!-- Messages -->
                <div id="communityChatMsgs" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;">
                    <div style="text-align:center;padding:30px;color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;"></i></div>
                </div>
                <!-- Format toolbar + Input -->
                <div style="padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0;background:var(--chat-card-bg);">
                    <div style="display:flex;gap:4px;margin-bottom:6px;">
                        <button onclick="communityRich('bold')" title="Bold" style="padding:4px 9px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-weight:700;font-size:13px;">B</button>
                        <button onclick="communityRich('italic')" title="Italic" style="padding:4px 9px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-style:italic;font-size:13px;">I</button>
                        <button onclick="communityRich('underline')" title="Underline" style="padding:4px 9px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;text-decoration:underline;font-size:13px;">U</button>
                    </div>
                    <div style="display:flex;gap:8px;align-items:flex-end;">
                        <div id="communityChatInput" contenteditable="true"
                            style="flex:1;min-height:40px;max-height:120px;overflow-y:auto;padding:10px 14px;background:${inputBg};border:1px solid ${inputBorder};border-radius:10px;color:var(--text);font-size:14px;font-family:'Tajawal',sans-serif;outline:none;line-height:1.5;"
                            data-placeholder="${isAR?'اكتب رسالتك للمجموعة...':'Write a message to the group...'}"
                            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendCommunityMsg('${groupId}');}"
                        ></div>
                        <button onclick="sendCommunityMsg('${groupId}')" style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--g3),var(--g2));border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="fa-solid fa-paper-plane" style="color:#fff;font-size:15px;transform:${isAR?'scaleX(-1)':'none'};"></i>
                        </button>
                    </div>
                </div>
            </div>`;

            // mark membership + start realtime listener
            try { await window._ensureCommunityMembership(groupId); } catch(e) {}
            if (typeof _communityUnsubscribe === 'function') { _communityUnsubscribe(); _communityUnsubscribe = null; }
            _communityUnsubscribe = window._loadCommunityMessagesRealtime(groupId, (msgs) => {
                renderCommunityMessages(msgs, isAR, groupId);
            });
        };