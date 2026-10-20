import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.3/+esm";

const __sb = (() => {
    const SUPABASE_URL = "https://tyepugbvycipxzupnidn.supabase.co";
    const SUPABASE_KEY = "sb_publishable_s8RzSP_lkCtIKhihrXIZMg_R4qI974H";

    /* ───────────── Timestamp + FieldValue sentinels ───────────── */
    class Timestamp {
        constructor(seconds, nanoseconds) { this.seconds = seconds; this.nanoseconds = nanoseconds || 0; }
        static fromMillis(ms) { const s = Math.floor(ms / 1000); return new Timestamp(s, Math.round((ms - s * 1000) * 1e6)); }
        static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
        static now() { return Timestamp.fromMillis(Date.now()); }
        toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
        toDate() { return new Date(this.toMillis()); }
        valueOf() { return this.toMillis(); }
        isEqual(o) { return !!o && o.toMillis && o.toMillis() === this.toMillis(); }
    }
    class FieldValue { constructor(op, v) { this.op = op; this.v = v; } }
    const serverTimestamp = () => new FieldValue('st');
    const increment = (n) => new FieldValue('inc', n);
    const arrayUnion = (...a) => new FieldValue('au', a);
    const arrayRemove = (...a) => new FieldValue('ar', a);
    const deleteField = () => new FieldValue('del');

    function enc(v) {
        if (v === undefined) return undefined;
        if (v === null) return null;
        if (v instanceof FieldValue) {
            if (v.op === 'st') return { __op: 'st' };
            if (v.op === 'inc') return { __op: 'inc', n: v.v };
            if (v.op === 'au') return { __op: 'au', v: v.v.map(enc) };
            if (v.op === 'ar') return { __op: 'ar', v: v.v.map(enc) };
            return { __op: 'del' };
        }
        if (v instanceof Timestamp) return { __t: v.toMillis() };
        if (v instanceof Date) return { __t: v.getTime() };
        if (Array.isArray(v)) return v.map(x => { const e = enc(x); return e === undefined ? null : e; });
        if (typeof v === 'object') {
            const o = {};
            for (const k of Object.keys(v)) { const e = enc(v[k]); if (e !== undefined) o[k] = e; }
            return o;
        }
        if (typeof v === 'number' && !isFinite(v)) return null;
        return v;
    }
    function dec(v) {
        if (v === null || typeof v !== 'object') return v;
        if (Array.isArray(v)) return v.map(dec);
        const keys = Object.keys(v);
        if (keys.length === 1 && keys[0] === '__t' && typeof v.__t === 'number') return Timestamp.fromMillis(v.__t);
        const o = {};
        for (const k of keys) o[k] = dec(v[k]);
        return o;
    }

    const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    function autoId() {
        const a = new Uint8Array(20); crypto.getRandomValues(a);
        let s = ''; for (let i = 0; i < 20; i++) s += ID_CHARS[a[i] % 62];
        return s;
    }

    /* ───────────── Errors ───────────── */
    function dbError(err) {
        const msg = String((err && (err.message || err.details)) || err || 'unknown');
        let code = 'unknown';
        if (/FS_ABORTED/.test(msg)) code = 'aborted';
        else if (/FS_NOT_FOUND/.test(msg)) code = 'not-found';
        else if (err && (err.code === '42501' || /row-level security|permission denied/i.test(msg))) code = 'permission-denied';
        else if (err && (err.code === 'PGRST301' || err.code === 'PGRST303' || /JWT/i.test(msg))) code = 'unauthenticated';
        else if (/fetch|network|timeout|failed to load/i.test(msg)) code = 'unavailable';
        const e = new Error(msg); e.code = code; return e;
    }
    function authError(err) {
        const msg = String((err && err.message) || err || '');
        const c = String((err && (err.code || err.error_code)) || '');
        let code = 'auth/internal-error';
        if (c === 'invalid_credentials' || /invalid login credentials/i.test(msg)) code = 'auth/invalid-credential';
        else if (c === 'user_already_exists' || c === 'email_exists' || /already (registered|been registered|exists)/i.test(msg)) code = 'auth/email-already-in-use';
        else if (c === 'weak_password' || /password should be|weak/i.test(msg)) code = 'auth/weak-password';
        else if (/over_request_rate_limit|over_email_send_rate_limit|rate limit|too many/i.test(c + ' ' + msg)) code = 'auth/too-many-requests';
        else if (c === 'email_not_confirmed' || /not confirmed/i.test(msg)) code = 'auth/email-not-verified';
        else if (c === 'user_not_found') code = 'auth/user-not-found';
        else if (c === 'validation_failed' || /invalid.*email|email.*invalid/i.test(msg)) code = 'auth/invalid-email';
        else if (/fetch|network|retryable/i.test(msg + ' ' + (err && err.name))) code = 'auth/network-request-failed';
        const e = new Error(msg); e.code = code; return e;
    }

    /* ───────────── Apps / clients ───────────── */
    const apps = new Map();
    function initializeApp(config, name) {
        const n = name || '[DEFAULT]';
        if (apps.has(n)) return apps.get(n);
        const app = { name: n, options: config || {} };
        apps.set(n, app);
        return app;
    }
    function getClient(app) {
        if (app._client) return app._client;
        const isDefault = app.name === '[DEFAULT]';
        const temp = /^temp/i.test(app.name);
        app._client = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                storageKey: isDefault ? 'sb-atlasya-auth' : 'sb-atlasya-' + app.name + '-auth',
                persistSession: !temp,
                autoRefreshToken: !temp,
                detectSessionInUrl: isDefault
            },
            realtime: { params: { eventsPerSecond: 10 } }
        });
        return app._client;
    }
    async function deleteApp(app) {
        try { if (app._client) { await app._client.removeAllChannels(); app._client.auth.stopAutoRefresh(); } } catch (e) {}
        apps.delete(app.name);
    }

    /* ═══════════════════════════ AUTH ═══════════════════════════ */
    class GoogleAuthProvider { constructor() { this.providerId = 'google.com'; } addScope() { return this; } setCustomParameters() { return this; } }
    class FacebookAuthProvider { constructor() { this.providerId = 'facebook.com'; } addScope() { return this; } setCustomParameters() { return this; } }
    class EmailAuthProvider { static credential(email, password) { return { providerId: 'password', email, password }; } }

    function userFields(su) {
        const m = su.user_metadata || {};
        return {
            uid: su.id,
            email: su.email || null,
            emailVerified: !!(su.email_confirmed_at || su.confirmed_at),
            displayName: m.full_name || m.name || null,
            photoURL: m.avatar_url || m.picture || null,
            phoneNumber: su.phone || null,
            isAnonymous: false,
            providerData: (su.identities || []).map(i => ({ providerId: i.provider === 'email' ? 'password' : i.provider + '.com', uid: i.id })),
            metadata: { creationTime: su.created_at, lastSignInTime: su.last_sign_in_at }
        };
    }
    function makeUser(auth, su) {
        const u = userFields(su);
        Object.defineProperty(u, '_auth', { value: auth, enumerable: false });
        u.reload = async () => {
            const { data, error } = await auth._client.auth.getUser();
            if (error) throw authError(error);
            Object.assign(u, userFields(data.user));
        };
        u.getIdToken = async () => {
            const { data } = await auth._client.auth.getSession();
            return data.session ? data.session.access_token : null;
        };
        return u;
    }
    function applyUser(auth, su) {
        if (!su) { auth.currentUser = null; return null; }
        if (auth.currentUser && auth.currentUser.uid === su.id) Object.assign(auth.currentUser, userFields(su));
        else auth.currentUser = makeUser(auth, su);
        return auth.currentUser;
    }

    const OAUTH_FLAG = 'sb_oauth_pending';
    // أول دخول بعد redirect من جوجل/فيسبوك → كمّل إنشاء البروفايل (window._finishSocialSignIn)
    // قبل ما الـ listeners تشتغل
    async function finishOAuth(auth) {
        if (!auth.currentUser || auth.app.name !== '[DEFAULT]') return;
        try {
            const t = Number(localStorage.getItem(OAUTH_FLAG) || 0);
            if (!t) return;
            localStorage.removeItem(OAUTH_FLAG);
            if (Date.now() - t < 10 * 60 * 1000 && typeof window._finishSocialSignIn === 'function') {
                await window._finishSocialSignIn(auth.currentUser);
            }
        } catch (e) { console.error('social sign-in completion failed:', e); }
    }
    async function emitChange(auth) {
        if (!auth._inited) return;
        const uid = auth.currentUser ? auth.currentUser.uid : null;
        if (uid === auth._lastUid) return;
        auth._lastUid = uid;
        if (uid) await finishOAuth(auth);
        const cu = auth.currentUser;
        auth._listeners.forEach(cb => { try { cb(cu); } catch (e) { console.error(e); } });
    }

    function getAuth(app) {
        if (app._auth) return app._auth;
        const client = getClient(app);
        const auth = { app, currentUser: null, _client: client, _listeners: new Set(), _inited: false, _lastUid: null };
        app._auth = auth;
        auth._ready = client.auth.getSession().then(async ({ data }) => {
            applyUser(auth, data.session ? data.session.user : null);
            auth._lastUid = auth.currentUser ? auth.currentUser.uid : null;
            await finishOAuth(auth);
            auth._inited = true;
        }).catch(() => { auth._inited = true; });
        client.auth.onAuthStateChange((event, session) => {
            // مفيش await لأي استدعاء Supabase جوه الـ callback (بيعمل deadlock)
            if (event === 'INITIAL_SESSION') return;
            applyUser(auth, session ? session.user : null);
            if (event === 'PASSWORD_RECOVERY' && app.name === '[DEFAULT]') setTimeout(() => showRecoveryModal(auth), 0);
            setTimeout(() => emitChange(auth), 0);
        });
        return auth;
    }
    function onAuthStateChanged(auth, cb) {
        let active = true;
        const wrapped = (u) => { if (active) cb(u); };
        auth._listeners.add(wrapped);
        auth._ready.then(() => { if (active) setTimeout(() => active && cb(auth.currentUser), 0); });
        return () => { active = false; auth._listeners.delete(wrapped); };
    }
    async function signInWithEmailAndPassword(auth, email, password) {
        const { data, error } = await auth._client.auth.signInWithPassword({ email, password });
        if (error) throw authError(error);
        const user = applyUser(auth, data.user);
        await auth._ready;
        emitChange(auth);
        return { user, providerId: 'password', operationType: 'signIn' };
    }
    async function createUserWithEmailAndPassword(auth, email, password) {
        const { data, error } = await auth._client.auth.signUp({ email, password });
        if (error) throw authError(error);
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            const e = new Error('email already registered'); e.code = 'auth/email-already-in-use'; throw e;
        }
        if (!data.session) {
            const e = new Error('Email confirmation is ON in Supabase (Auth → Providers → Email → "Confirm email"). Turn it off.');
            e.code = 'auth/operation-not-allowed'; throw e;
        }
        const user = applyUser(auth, data.user);
        await auth._ready;
        emitChange(auth);
        return { user, providerId: 'password', operationType: 'signIn' };
    }
    async function signOut(auth) {
        try { await auth._client.auth.signOut({ scope: 'local' }); } catch (e) {}
        applyUser(auth, null);
        await auth._ready;
        emitChange(auth);
    }
    async function sendPasswordResetEmail(auth, email) {
        const { error } = await auth._client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        if (error) throw authError(error);
    }
    async function sendEmailVerification(user) {
        if (user.emailVerified) return;
        const { error } = await user._auth._client.auth.resend({ type: 'signup', email: user.email });
        if (error) throw authError(error);
    }
    async function deleteUser(user) {
        const { error } = await user._auth._client.rpc('delete_my_account');
        if (error) throw dbError(error);
        await signOut(user._auth);
    }
    async function signInWithPopup(auth, provider) {
        const name = provider.providerId === 'google.com' ? 'google' : 'facebook';
        try { localStorage.setItem(OAUTH_FLAG, String(Date.now())); } catch (e) {}
        const { error } = await auth._client.auth.signInWithOAuth({
            provider: name, options: { redirectTo: location.origin + location.pathname }
        });
        if (error) { try { localStorage.removeItem(OAUTH_FLAG); } catch (e) {} throw authError(error); }
        return new Promise(() => {});   // الصفحة بتتحوّل لجوجل وبترجع تاني
    }
    async function reauthenticateWithCredential(user, cred) {
        const { error } = await user._auth._client.auth.signInWithPassword({ email: cred.email, password: cred.password });
        if (error) throw authError(error);
    }
    async function updatePassword(user, newPassword) {
        const { error } = await user._auth._client.auth.updateUser({ password: newPassword });
        if (error) throw authError(error);
    }

    // شاشة تعيين كلمة مرور جديدة (بعد الضغط على لينك "نسيت كلمة المرور")
    function showRecoveryModal(auth) {
        if (document.getElementById('sbRecoveryModal')) return;
        const ar = (document.documentElement.lang || '').toLowerCase().startsWith('ar') || /[\u0600-\u06FF]/.test(document.body ? document.body.innerText.slice(0, 400) : '');
        const w = document.createElement('div');
        w.id = 'sbRecoveryModal';
        w.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit;';
        w.innerHTML = '<div style="background:#14171f;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:24px;max-width:360px;width:100%;direction:' + (ar ? 'rtl' : 'ltr') + ';text-align:center">'
            + '<div style="font-size:18px;font-weight:800;margin-bottom:14px">' + (ar ? 'تعيين كلمة مرور جديدة' : 'Set a new password') + '</div>'
            + '<input id="sbRecPass" type="password" minlength="6" placeholder="' + (ar ? 'كلمة المرور الجديدة' : 'New password') + '" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:#0b0d12;color:#fff;margin-bottom:10px">'
            + '<div id="sbRecMsg" style="font-size:12px;min-height:16px;color:#ff8a8a;margin-bottom:8px"></div>'
            + '<button id="sbRecBtn" style="width:100%;padding:12px;border:0;border-radius:10px;background:#3b82f6;color:#fff;font-weight:700;cursor:pointer">' + (ar ? 'حفظ' : 'Save') + '</button></div>';
        document.body.appendChild(w);
        const msg = w.querySelector('#sbRecMsg');
        w.querySelector('#sbRecBtn').onclick = async () => {
            const p = w.querySelector('#sbRecPass').value;
            if (p.length < 6) { msg.textContent = ar ? 'لازم 6 حروف على الأقل' : 'At least 6 characters'; return; }
            const { error } = await auth._client.auth.updateUser({ password: p });
            if (error) { msg.textContent = error.message; return; }
            msg.style.color = '#6ee7a0'; msg.textContent = ar ? 'تم تغيير كلمة المرور ✓' : 'Password updated ✓';
            setTimeout(() => { location.href = location.origin + location.pathname; }, 900);
        };
    }

    /* ═════════════════════════ FIRESTORE ═════════════════════════ */
    const dbs = new Map();
    function getFirestore(app) {
        if (dbs.has(app)) return dbs.get(app);
        const db = { type: 'firestore', app, client: getClient(app) };
        dbs.set(app, db);
        return db;
    }
    const mkCol = (db, path) => { const s = path.split('/'); return { type: 'collection', firestore: db, path, id: s[s.length - 1] }; };
    const mkDoc = (db, path) => {
        const s = path.split('/');
        return { type: 'document', firestore: db, path, id: s[s.length - 1], parent: mkCol(db, s.slice(0, -1).join('/')) };
    };
    function collection(base, ...segs) {
        const db = base.firestore || base;
        return mkCol(db, [...(base.path ? [base.path] : []), ...segs].join('/'));
    }
    function doc(base, ...segs) {
        const db = base.firestore || base;
        if (base.type === 'collection' && segs.length === 0) return mkDoc(db, base.path + '/' + autoId());
        return mkDoc(db, [...(base.path ? [base.path] : []), ...segs].join('/'));
    }

    const where = (field, op, value) => ({ type: 'where', field, op, value });
    const orderBy = (field, dir) => ({ type: 'orderBy', field, dir: dir || 'asc' });
    const limit = (n) => ({ type: 'limit', n });
    function query(base, ...constraints) {
        const prev = base.type === 'query' ? base.constraints : [];
        return { type: 'query', firestore: base.firestore, path: base.path, constraints: [...prev, ...constraints] };
    }

    function getPath(obj, field) {
        if (field.indexOf('.') < 0) return obj ? obj[field] : undefined;
        return field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    }
    const rank = (v) => v == null ? 0 : typeof v === 'boolean' ? 1 : typeof v === 'number' ? 2 : v instanceof Timestamp ? 3 : typeof v === 'string' ? 4 : Array.isArray(v) ? 6 : 7;
    function cmp(a, b) {
        const ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra < rb ? -1 : 1;
        if (ra === 0) return 0;
        if (ra === 3) return a.toMillis() - b.toMillis();
        if (ra === 2 || ra === 1) return a < b ? -1 : a > b ? 1 : 0;
        if (ra === 4) return a < b ? -1 : a > b ? 1 : 0;
        const sa = JSON.stringify(enc(a)), sb = JSON.stringify(enc(b));
        return sa < sb ? -1 : sa > sb ? 1 : 0;
    }
    const eq = (a, b) => (a === undefined || b === undefined) ? false : cmp(a, b) === 0;
    function matches(data, w) {
        const v = getPath(data, w.field);
        switch (w.op) {
            case '==': return eq(v, w.value);
            case '!=': return v !== undefined && !eq(v, w.value);
            case '<': return v !== undefined && rank(v) === rank(w.value) && cmp(v, w.value) < 0;
            case '<=': return v !== undefined && rank(v) === rank(w.value) && cmp(v, w.value) <= 0;
            case '>': return v !== undefined && rank(v) === rank(w.value) && cmp(v, w.value) > 0;
            case '>=': return v !== undefined && rank(v) === rank(w.value) && cmp(v, w.value) >= 0;
            case 'in': return Array.isArray(w.value) && w.value.some(x => eq(v, x));
            case 'not-in': return v !== undefined && Array.isArray(w.value) && !w.value.some(x => eq(v, x));
            case 'array-contains': return Array.isArray(v) && v.some(x => eq(x, w.value));
            case 'array-contains-any': return Array.isArray(v) && Array.isArray(w.value) && v.some(x => w.value.some(y => eq(x, y)));
        }
        return true;
    }

    function mkSnap(db, path, row) {
        const ref = mkDoc(db, path);
        const snap = {
            id: ref.id, ref, _version: row ? row.version : 0,
            exists: () => !!row,
            data: () => row ? dec(row.data) : undefined,
            get: (f) => row ? getPath(dec(row.data), f) : undefined
        };
        return snap;
    }
    function mkQuerySnap(db, snaps, q) {
        return {
            docs: snaps, size: snaps.length, empty: snaps.length === 0, query: q,
            forEach: (fn, thisArg) => snaps.forEach(fn, thisArg),
            docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false }
        };
    }

    async function fetchDocRow(db, path) {
        const { data, error } = await db.client.from('docs').select('path,data,version').eq('path', path).maybeSingle();
        if (error) throw dbError(error);
        return data || null;
    }
    async function getDoc(ref) { return mkSnap(ref.firestore, ref.path, await fetchDocRow(ref.firestore, ref.path)); }

    async function getDocs(target) {
        const db = target.firestore;
        const constraints = target.type === 'query' ? target.constraints : [];
        const wheres = constraints.filter(c => c.type === 'where');
        const orders = constraints.filter(c => c.type === 'orderBy');
        const lim = constraints.find(c => c.type === 'limit');

        const push = {};
        for (const w of wheres) {
            if (w.op === '==' && ['string', 'number', 'boolean'].includes(typeof w.value) && w.field.indexOf('.') < 0 && !(w.field in push)) push[w.field] = w.value;
        }
        const rows = [];
        const PAGE = 500;
        for (let from = 0; ; from += PAGE) {
            let q = db.client.from('docs').select('id,path,data,version').eq('collection', target.path);
            if (Object.keys(push).length) q = q.contains('data', push);
            const { data, error } = await q.order('path', { ascending: true }).range(from, from + PAGE - 1);
            if (error) throw dbError(error);
            rows.push(...data);
            if (data.length < PAGE) break;
        }
        let items = rows.map(r => ({ row: r, d: dec(r.data) }));
        for (const w of wheres) items = items.filter(it => matches(it.d, w));
        if (orders.length) {
            items = items.filter(it => orders.every(o => getPath(it.d, o.field) !== undefined));
            items.sort((x, y) => {
                for (const o of orders) {
                    const c = cmp(getPath(x.d, o.field), getPath(y.d, o.field));
                    if (c) return o.dir === 'desc' ? -c : c;
                }
                return 0;
            });
        } else {
            items.sort((x, y) => (x.row.id < y.row.id ? -1 : x.row.id > y.row.id ? 1 : 0));
        }
        if (lim) items = items.slice(0, lim.n);
        return mkQuerySnap(db, items.map(it => mkSnap(db, it.row.path, it.row)), target);
    }

    /* ── writes ── */
    const listeners = new Set();
    function notifyWrites(paths) {
        for (const l of listeners) {
            if (paths.some(p => l.match(p))) l.trigger();
        }
    }
    const opOf = (kind, ref, data) => {
        const o = { op: kind, path: ref.path, collection: ref.parent.path, id: ref.id };
        if (data !== undefined) o.data = enc(data);
        return o;
    };
    async function commitOps(db, ops, expects) {
        if (!ops.length && !(expects && expects.length)) return;
        const { error } = await db.client.rpc('fs_commit', { ops, expects: expects || [] });
        if (error) throw dbError(error);
        notifyWrites(ops.map(o => o.path));
    }
    const updateData = (args) => {
        if (args.length === 1) return args[0];
        const o = {}; for (let i = 0; i < args.length; i += 2) o[args[i]] = args[i + 1]; return o;
    };
    async function setDoc(ref, data, opts) { await commitOps(ref.firestore, [opOf(opts && opts.merge ? 'merge' : 'set', ref, data)]); }
    async function updateDoc(ref, ...args) { await commitOps(ref.firestore, [opOf('update', ref, updateData(args))]); }
    async function deleteDoc(ref) { await commitOps(ref.firestore, [opOf('delete', ref)]); }
    async function addDoc(colRef, data) { const ref = doc(colRef); await setDoc(ref, data); return ref; }

    function writeBatch(db) {
        const ops = [];
        const b = {
            set(ref, data, opts) { ops.push(opOf(opts && opts.merge ? 'merge' : 'set', ref, data)); return b; },
            update(ref, ...args) { ops.push(opOf('update', ref, updateData(args))); return b; },
            delete(ref) { ops.push(opOf('delete', ref)); return b; },
            commit() { return commitOps(db, ops); }
        };
        return b;
    }
    async function runTransaction(db, fn) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const reads = new Map(), ops = [];
            const tx = {
                async get(ref) {
                    const row = await fetchDocRow(db, ref.path);
                    reads.set(ref.path, row ? row.version : 0);
                    return mkSnap(db, ref.path, row);
                },
                set(ref, data, opts) { ops.push(opOf(opts && opts.merge ? 'merge' : 'set', ref, data)); return tx; },
                update(ref, ...args) { ops.push(opOf('update', ref, updateData(args))); return tx; },
                delete(ref) { ops.push(opOf('delete', ref)); return tx; }
            };
            const result = await fn(tx);
            try {
                await commitOps(db, ops, [...reads].map(([path, v]) => ({ path, v })));
                return result;
            } catch (e) {
                if (e.code === 'aborted' && attempt < 4) continue;
                throw e;
            }
        }
    }

    /* ── realtime (onSnapshot) ── */
    let chSeq = 0;
    function onSnapshot(target, onNext, onError) {
        if (typeof onNext === 'object' && onNext) { onError = onNext.error; onNext = onNext.next; }
        const db = target.firestore;
        const isDoc = target.type === 'document';
        const colPath = isDoc ? target.parent.path : target.path;
        let stopped = false, seq = 0, first = true, timer = null, poll = null, channel = null;

        const run = async () => {
            const my = ++seq;
            try {
                const snap = isDoc ? await getDoc(target) : await getDocs(target);
                if (stopped || my !== seq) return;
                first = false;
                onNext && onNext(snap);
            } catch (e) {
                if (stopped) return;
                if (first) { stopped = true; cleanup(); onError && onError(e); }
            }
        };
        const trigger = () => { clearTimeout(timer); timer = setTimeout(run, 150); };
        const l = {
            match: (p) => isDoc ? p === target.path : (p.slice(0, p.lastIndexOf('/')) === colPath),
            trigger
        };
        function cleanup() {
            listeners.delete(l); clearTimeout(timer); clearInterval(poll);
            if (channel) { try { db.client.removeChannel(channel); } catch (e) {} channel = null; }
        }
        listeners.add(l);
        run();
        try {
            channel = db.client.channel('fs-' + (++chSeq) + '-' + Math.random().toString(36).slice(2, 7))
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'docs', filter: (isDoc ? 'path=eq.' + target.path : 'collection=eq.' + colPath) },
                    trigger)
                .subscribe();
        } catch (e) { /* polling fallback below */ }
        poll = setInterval(() => { if (!document.hidden) run(); }, 45000);   // أمان لو Realtime فاتته حاجة (زي الحذف)
        return () => { stopped = true; cleanup(); };
    }

    const api = {
        initializeApp, deleteApp,
        getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
        onAuthStateChanged, deleteUser, sendPasswordResetEmail, sendEmailVerification,
        GoogleAuthProvider, FacebookAuthProvider, signInWithPopup,
        EmailAuthProvider, reauthenticateWithCredential, updatePassword,
        getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, orderBy, query,
        serverTimestamp, updateDoc, onSnapshot, limit, where, Timestamp, arrayUnion, arrayRemove,
        increment, writeBatch, deleteField, runTransaction
    };
    if (typeof window !== 'undefined') window.__sbCompat = api;
    return api;
})();
const {
    initializeApp, deleteApp,
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    onAuthStateChanged, deleteUser, sendPasswordResetEmail, sendEmailVerification,
    GoogleAuthProvider, FacebookAuthProvider, signInWithPopup,
    getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, orderBy, query,
    serverTimestamp, updateDoc, onSnapshot, limit, where, Timestamp, arrayUnion, arrayRemove,
    increment, writeBatch, deleteField, runTransaction
} = __sb;
/* ═══════════════════════ END SUPABASE COMPAT LAYER ═══════════════════════ */

export { initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, onSnapshot, limit, where, Timestamp, arrayUnion, arrayRemove, increment, writeBatch, deleteField };
