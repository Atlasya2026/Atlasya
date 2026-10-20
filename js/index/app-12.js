
        /* ─── INIT ─── */
        window.addEventListener('DOMContentLoaded', () => {
            lang = 'EN';
            const body = document.getElementById('pageBody');
            body.classList.remove('rtl');
            body.classList.add('light-mode'); // default light mode
            document.getElementById('langBtn').textContent = 'AR';
            const icon = document.getElementById('themeToggleIcon');
            if (icon) icon.className = 'fa-solid fa-moon'; // moon = switch to dark
            applyLang();
            const deepLinkPage = getPageFromUrl();
            if (deepLinkPage && deepLinkPage !== 'dashboard') {
                const navEl = PAGE_NAV_ID_MAP[deepLinkPage] ? document.getElementById(PAGE_NAV_ID_MAP[deepLinkPage]) : null;
                navigate(deepLinkPage, navEl, false, true);
            } else {
                navigate('dashboard', document.getElementById('menuDash'));
            }
            // Apply any admin-saved content from Firebase
            if (window._applyContent) window._applyContent();
            // Auto-fill remembered login credentials
            loadRememberedCredentials();
            // Enter/Next on login fields submits automatically
            initLoginKeyboardSubmit();
            // ── Sync mob topbar duplicates with real IDs ──
            function syncMobTopbar() {
                // avatar letter
                const srcLetter = document.getElementById('topbarAvatarLetterDesk');
                const dstLetter = document.getElementById('topbarAvatarLetter');
                if (srcLetter && dstLetter) dstLetter.textContent = srcLetter.textContent;
                // avatar bg image
                const srcAv = document.getElementById('topbarAvatarDesk');
                const dstAv = document.getElementById('topbarAvatar');
                if (srcAv && dstAv) {
                    dstAv.style.backgroundImage = srcAv.style.backgroundImage;
                    dstAv.style.backgroundSize  = srcAv.style.backgroundSize;
                }
                // username
                const srcName = document.getElementById('topbarUserNameDesk');
                const dstName = document.getElementById('topbarUserName');
                if (srcName && dstName) dstName.textContent = srcName.textContent;
                // logout label
                const srcLbl = document.getElementById('txtTopbarLogoutDesk');
                const dstLbl = document.getElementById('txtTopbarLogout');
                if (srcLbl && dstLbl) dstLbl.textContent = srcLbl.textContent;
                // lang btn
                const srcLang = document.getElementById('langBtn');
                const dstLang = document.getElementById('langBtnMob');
                if (srcLang && dstLang) dstLang.textContent = srcLang.textContent;
                // theme icon
                const srcIcon = document.getElementById('themeToggleIcon');
                const dstIcon = document.getElementById('themeToggleIconMob');
                if (srcIcon && dstIcon) dstIcon.className = srcIcon.className;
            }
            // Patch updateSidebarUser / applyLang to also sync mob topbar
            const _origApplyLang = window.applyLang;
            window.applyLang = function(...args) {
                if (_origApplyLang) _origApplyLang(...args);
                syncMobTopbar();
            };
        });
    /* PWA: انقل إلى pwa-install.js + manifest.webmanifest + sw.js */
    