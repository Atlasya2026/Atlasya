        // Keep the sign-in/sign-up pill toggle in sync with the shared auth
        // functions from core.js (same wrap-the-existing-function pattern the
        // app already uses for toggleLang). Runs after DOMContentLoaded so
        // core.js — loaded with `defer` — has already defined these globals.
        document.addEventListener('DOMContentLoaded', function () {
            function setPillActive(which) {
                const lb = document.getElementById('pillLoginBtn');
                const sb = document.getElementById('pillSignupBtn');
                if (lb) lb.classList.toggle('active', which === 'login');
                if (sb) sb.classList.toggle('active', which === 'signup');
            }
            if (typeof window.showLogin === 'function') {
                const _origShowLogin = window.showLogin;
                window.showLogin = function () { _origShowLogin(); setPillActive('login'); };
            }
            if (typeof window.showSignup === 'function') {
                const _origShowSignup = window.showSignup;
                window.showSignup = function () { _origShowSignup(); setPillActive('signup'); };
            }
        });
    