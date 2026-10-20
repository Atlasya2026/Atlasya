import { initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, onSnapshot, limit, where, Timestamp, arrayUnion, arrayRemove, increment, writeBatch, deleteField } from './supabase-compat.js';

    /* ════════════════════════════════════════════════════════════════════════
   SUPABASE COMPAT LAYER
   نفس دوال Firebase (Auth + Firestore) لكن شغّالة على Supabase — عشان باقي
   الكود يفضل زي ما هو. الجدول: public.docs (شوف supabase_setup.sql)
   ════════════════════════════════════════════════════════════════════════ */


    const firebaseConfig = { provider: 'supabase' };

    /* Admin panel gets its own isolated Firebase Auth session (separate named
       app), so it never inherits a student's already-logged-in session on this
       device/browser — the admin has to submit the login form every time,
       and student.html's session is never touched by anything here either. */
    // نفس الـ app الافتراضي المستخدم في student.html (بدون اسم) — عشان جلسة
    // تسجيل الدخول تتشارك تلقائيًا بين الصفحتين من غير ما المستخدم يسجل دخول مرتين
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    window._auth = auth; // expose for password change
    window._signOutAuth = () => signOut(auth);

    // جسور لتسجيل دخول الأدمن — الكود اللي بعد الـ module script (سكريبت
    // عادي) مايقدرش يشوف auth/signInWithEmailAndPassword/getDoc مباشرة،
    // فلازم يمر من هنا زي باقي دوال window._xxx في الملف ده
    window._adminSignIn = (email, pass) =>
        signInWithEmailAndPassword(auth, email, pass).then(cred => cred.user.uid);

    window._getAdminDoc = async (uid) => {
        const snap = await getDoc(doc(db, 'admins', uid));
        return snap.exists() ? snap.data() : null;
    };

    // ─── PLATFORM ON/OFF (settings/platformStatus) ───
    // student.html بيسمع للمستند ده لحظيًا: maintenance:true → بيعرض صفحة "المنصة متوقفة مؤقتًا".
    window._watchPlatformStatus = (cb) => onSnapshot(
        doc(db, 'settings', 'platformStatus'),
        (snap) => cb(snap.exists() ? snap.data() : {}, null),
        (err) => cb(null, err)
    );
    window._setPlatformStatus = (maintenance) => setDoc(doc(db, 'settings', 'platformStatus'), {
        maintenance: !!maintenance,
        updatedAt: serverTimestamp(),
        updatedBy: (window._adminProfile && (window._adminProfile.displayName || window._adminProfile.username)) || ''
    }, { merge: true });

    // إيميل تجريبي بيعدّي من صفحة الإيقاف (settings/platformStatus.testEmail)
    window._setPlatformTestEmail = (email) => setDoc(doc(db, 'settings', 'platformStatus'), {
        testEmail: String(email || '').trim().toLowerCase(),
        updatedAt: serverTimestamp(),
        updatedBy: (window._adminProfile && (window._adminProfile.displayName || window._adminProfile.username)) || ''
    }, { merge: true });

    let currentUid = null;
    window._base64Img = "";

    // expose to global
    window._doLogin = async (email, pass) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };
    window._doSignUp = async (fName, lName, phone, email, pass, affiliate) => {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
            firstName: fName, lastName: lName,
            phone, email, academicLevel: "Level 1",
            affiliate: affiliate || '',
            plan: 'basic',
            uploadCount: 0,
            joinedAt: serverTimestamp()
        });
        try { await sendEmailVerification(cred.user); } catch(e) { console.error('sendEmailVerification error:', e); }
    };
    window._sendVerificationEmail = async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    };
    window._socialSignIn = async (providerName) => {
            const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
            // Supabase بيحوّل الصفحة لجوجل/فيسبوك وبيرجع تاني — باقي الخطوات في _finishSocialSignIn
            await signInWithPopup(auth, provider);
        };
        window._finishSocialSignIn = async (user) => {
        // Create a user profile doc if this is the user's first sign-in
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
            const displayName = user.displayName || '';
            const parts = displayName.trim().split(/\s+/);
            const firstName = parts.shift() || '';
            const lastName = parts.join(' ');
            await setDoc(doc(db, "users", user.uid), {
                firstName, lastName,
                email: user.email || '',
                academicLevel: "Level 1",
                affiliate: '',
                profileImg: user.photoURL || ''
            });
        }
        return user;
    };
    window._reloadUser = async () => {
        if (auth.currentUser) { await auth.currentUser.reload(); return auth.currentUser.emailVerified; }
        return false;
    };
    window._doLogout = () => signOut(auth);
    window._doForgotPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };
    window._saveProfile = async (data) => {
        if (!currentUid) return;
        await setDoc(doc(db, "users", currentUid), { ...data, profileImg: window._base64Img }, { merge: true });
    };
    window._deleteAccount = async () => {
        if (!auth.currentUser) return;
        await deleteDoc(doc(db, "users", auth.currentUser.uid));
        await deleteUser(auth.currentUser);
    };

    /* ─── PORTFOLIO (STUDENT MAPS) ─── */
    window._submitPortfolioItem = async (data) => {
        if (!currentUid) throw new Error('غير مسجل الدخول');
        await addDoc(collection(db, 'portfolio_items'), {
            ...data,
            uid: currentUid,
            authorName: ((window._userData?.firstName || '') + ' ' + (window._userData?.lastName || '')).trim() || 'User',
            createdAt: serverTimestamp()
        });
    };

    window._loadPortfolioItems = async (uid) => {
        if (uid) {
            const snap = await getDocs(query(collection(db, 'portfolio_items'), where('uid', '==', uid)));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        const q = query(collection(db, 'portfolio_items'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._deletePortfolioItem = async (itemId) => {
        await deleteDoc(doc(db, 'portfolio_items', itemId));
    };

    /* ─── ADMIN: COURSES MODERATION ─── */
    window._loadAllCourses = async () => {
        const snap = await getDocs(collection(db, 'courses'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._updateCourseStatus = async (courseId, status) => {
        await updateDoc(doc(db, 'courses', courseId), { status, reviewedAt: serverTimestamp() });
    };
    window._updateCourseHidden = async (courseId, hidden) => {
        await updateDoc(doc(db, 'courses', courseId), { hidden });
    };
    window._updateCourseAdmin = async (courseId, data) => {
        await updateDoc(doc(db, 'courses', courseId), data);
    };
    window._deleteCourseAdmin = async (courseId) => {
        await deleteDoc(doc(db, 'courses', courseId));
    };

    /* ─── ADMIN: FREE COURSES ─── */
    window._loadFreeCoursesAdmin = async () => {
        const snap = await getDocs(collection(db, 'free_courses'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addFreeCourse = async (data) => {
        await addDoc(collection(db, 'free_courses'), { ...data, createdAt: serverTimestamp() });
    };
    window._updateFreeCourse = async (id, data) => {
        await updateDoc(doc(db, 'free_courses', id), data);
    };
    window._deleteFreeCourse = async (id) => {
        await deleteDoc(doc(db, 'free_courses', id));
    };

    /* ─── ADMIN: DIGITAL LIBRARY (ATLASYA) ─── */
    window._loadLibraryBooksAdmin = async () => {
        const snap = await getDocs(collection(db, 'library_books'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addLibraryBook = async (data) => {
        await addDoc(collection(db, 'library_books'), {
            ...data,
            downloads: 0,
            views: 0,
            hidden: !!data.hidden,
            createdAt: serverTimestamp(),
        });
    };
    window._updateLibraryBook = async (id, data) => {
        await updateDoc(doc(db, 'library_books', id), data);
    };
    window._deleteLibraryBook = async (id) => {
        await deleteDoc(doc(db, 'library_books', id));
    };
    window._toggleLibraryBookHidden = async (id, hidden) => {
        await updateDoc(doc(db, 'library_books', id), { hidden });
    };

    /* ─── ADMIN: PLAYLISTS ─── */
    window._loadPlaylistsAdmin = async () => {
        const snap = await getDocs(collection(db, 'playlists'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addPlaylist = async (data) => {
        const ref = await addDoc(collection(db, 'playlists'), {
            ...data,
            hidden: !!data.hidden,
            videoCount: 0,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    };
    window._updatePlaylist = async (id, data) => {
        await updateDoc(doc(db, 'playlists', id), data);
    };
    window._deletePlaylist = async (id) => {
        // cascade delete all videos in this playlist first
        const vSnap = await getDocs(collection(db, 'playlists', id, 'videos'));
        for (const v of vSnap.docs) {
            await deleteDoc(doc(db, 'playlists', id, 'videos', v.id));
        }
        await deleteDoc(doc(db, 'playlists', id));
    };
    window._togglePlaylistHidden = async (id, hidden) => {
        await updateDoc(doc(db, 'playlists', id), { hidden });
    };
    /* Student-facing: only visible playlists */
    window._loadPlaylists = async () => {
        const snap = await getDocs(collection(db, 'playlists'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.hidden);
    };
    window._togglePlaylistFavorite = async (id, isFav) => {
        if (!currentUid) throw new Error('Not logged in');
        await updateDoc(doc(db, 'users', currentUid), {
            favoritePlaylists: isFav ? arrayUnion(id) : arrayRemove(id)
        });
    };
    window._togglePlaylistSaved = async (id, isSaved) => {
        if (!currentUid) throw new Error('Not logged in');
        await updateDoc(doc(db, 'users', currentUid), {
            savedPlaylists: isSaved ? arrayUnion(id) : arrayRemove(id)
        });
    };

    /* ─── ADMIN/STUDENT: PLAYLIST VIDEOS (subcollection) ─── */
    window._loadPlaylistVideos = async (playlistId) => {
        const snap = await getDocs(collection(db, 'playlists', playlistId, 'videos'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };
    window._addPlaylistVideo = async (playlistId, data) => {
        await addDoc(collection(db, 'playlists', playlistId, 'videos'), {
            ...data,
            createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'playlists', playlistId), { videoCount: increment(1) });
    };
    window._updatePlaylistVideo = async (playlistId, videoId, data) => {
        await updateDoc(doc(db, 'playlists', playlistId, 'videos', videoId), data);
    };
    window._deletePlaylistVideo = async (playlistId, videoId) => {
        await deleteDoc(doc(db, 'playlists', playlistId, 'videos', videoId));
        await updateDoc(doc(db, 'playlists', playlistId), { videoCount: increment(-1) });
    };
    window._reorderPlaylistVideos = async (playlistId, orderedVideoIds) => {
        for (let i = 0; i < orderedVideoIds.length; i++) {
            await updateDoc(doc(db, 'playlists', playlistId, 'videos', orderedVideoIds[i]), { order: i });
        }
    };

    /* ─── ADMIN: SPATIAL DATA LIBRARY ─── */
    window._loadSpatialDatasets = async () => {
        const snap = await getDocs(collection(db, 'spatial_datasets'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addSpatialDataset = async (data) => {
        await addDoc(collection(db, 'spatial_datasets'), {
            ...data,
            downloads: 0,
            hidden: !!data.hidden,
            createdAt: serverTimestamp(),
        });
    };
    window._updateSpatialDataset = async (id, data) => {
        await updateDoc(doc(db, 'spatial_datasets', id), data);
    };
    window._deleteSpatialDataset = async (id) => {
        await deleteDoc(doc(db, 'spatial_datasets', id));
    };
    window._incrementDatasetDownload = async (id, current) => {
        await updateDoc(doc(db, 'spatial_datasets', id), { downloads: (current || 0) + 1 });
    };

    window._loadSpatialProjects = async () => {
        const snap = await getDocs(collection(db, 'spatial_projects'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addSpatialProject = async (data) => {
        await addDoc(collection(db, 'spatial_projects'), { ...data, createdAt: serverTimestamp() });
    };
    window._updateSpatialProject = async (id, data) => {
        await updateDoc(doc(db, 'spatial_projects', id), data);
    };
    window._deleteSpatialProject = async (id) => {
        await deleteDoc(doc(db, 'spatial_projects', id));
    };

    /* ─── ADMIN: SOFTWARE TOOLS ─── */
    window._loadSoftwareTools = async () => {
        const snap = await getDocs(collection(db, 'software_tools'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    };
    window._addSoftwareTool = async (data) => {
        await addDoc(collection(db, 'software_tools'), {
            ...data,
            downloads: 0,
            hidden: !!data.hidden,
            createdAt: serverTimestamp(),
        });
    };
    window._updateSoftwareTool = async (id, data) => {
        await updateDoc(doc(db, 'software_tools', id), data);
    };
    window._deleteSoftwareTool = async (id) => {
        await deleteDoc(doc(db, 'software_tools', id));
    };
    window._incrementToolDownload = async (id, current) => {
        await updateDoc(doc(db, 'software_tools', id), { downloads: (current || 0) + 1 });
    };

    /* ─── ADMIN: DAILY TIPS ─── */
    window._loadDailyTips = async () => {
        const q = query(collection(db, 'daily_tips'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._addDailyTip = async (data) => {
        await addDoc(collection(db, 'daily_tips'), { ...data, likes: 0, createdAt: serverTimestamp() });
    };
    window._updateDailyTip = async (id, data) => {
        await updateDoc(doc(db, 'daily_tips', id), data);
    };
    window._deleteDailyTip = async (id) => {
        await deleteDoc(doc(db, 'daily_tips', id));
    };

    /* ─── ADMIN: DAILY & WEEKLY CHALLENGE (one scheduled question per calendar date) ─── */
    window._loadDailyChallengeQs = async () => {
        const [snap, keysSnap] = await Promise.all([
            getDocs(collection(db, 'daily_challenges')),
            getDocs(collection(db, 'daily_challenge_keys')).catch(() => null)
        ]);
        const keys = {};
        if (keysSnap) keysSnap.docs.forEach(d => { keys[d.id] = d.data(); });
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // مفتاح الإجابة (correctIndex) بقى في مستند منفصل daily_challenge_keys/{id} عشان الطالب
        // ما يقدرش يشوفه مع السؤال. هنا بندمجه في الـ list للعرض، وأي سؤال لسه مفتاحه جوه مستند
        // السؤال (تصميم قديم) بنرحّله تلقائيًا مرة واحدة وبنشيل الحقل من مستند السؤال.
        for (const q of list) {
            if (keys[q.id] && typeof keys[q.id].correctIndex === 'number') {
                if (typeof q.correctIndex === 'number') {
                    updateDoc(doc(db, 'daily_challenges', q.id), { correctIndex: deleteField() }).catch(() => {});
                }
                q.correctIndex = keys[q.id].correctIndex;
                continue;
            }
            let idx = typeof q.correctIndex === 'number' ? q.correctIndex : null;
            if (idx === null) {
                try {
                    const old = await getDoc(doc(db, 'daily_challenges_answers', q.id));
                    if (old.exists() && typeof old.data().correctIndex === 'number') idx = old.data().correctIndex;
                } catch (e) {}
            }
            if (idx === null) continue;
            q.correctIndex = idx;
            setDoc(doc(db, 'daily_challenge_keys', q.id), { correctIndex: idx })
                .then(() => updateDoc(doc(db, 'daily_challenges', q.id), { correctIndex: deleteField() }))
                .catch(e => console.error('answer-key migration failed for', q.id, e));
        }
        return list;
    };
    window._addDailyChallengeQ = async (data) => {
        const { correctIndex, ...qData } = data;
        const ref = doc(collection(db, 'daily_challenges'));
        await setDoc(doc(db, 'daily_challenge_keys', ref.id), { correctIndex });
        await setDoc(ref, { ...qData, createdAt: serverTimestamp() });
        return ref.id;
    };
    window._updateDailyChallengeQ = async (id, data) => {
        const { correctIndex, ...qData } = data;
        if (typeof correctIndex === 'number') await setDoc(doc(db, 'daily_challenge_keys', id), { correctIndex });
        await updateDoc(doc(db, 'daily_challenges', id), { ...qData, correctIndex: deleteField() });
    };
    window._deleteDailyChallengeQ = async (id) => {
        await deleteDoc(doc(db, 'daily_challenges', id));
        try { await deleteDoc(doc(db, 'daily_challenge_keys', id)); } catch (e) {}
        try { await deleteDoc(doc(db, 'daily_challenges_answers', id)); } catch (e) {}
    };
    const DEFAULT_WEEKLY_CHALLENGE_SETTINGS = { enabled: true, bonusCoins: 100 };
    window.DEFAULT_WEEKLY_CHALLENGE_SETTINGS = DEFAULT_WEEKLY_CHALLENGE_SETTINGS;
    window._loadWeeklyChallengeSettings = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'weeklyChallenge'));
            if (snap.exists()) return { ...DEFAULT_WEEKLY_CHALLENGE_SETTINGS, ...snap.data() };
        } catch(e) { console.error('loadWeeklyChallengeSettings error:', e); }
        return DEFAULT_WEEKLY_CHALLENGE_SETTINGS;
    };
    window._saveWeeklyChallengeSettings = async (data) => {
        await setDoc(doc(db, 'settings', 'weeklyChallenge'), data, { merge: true });
    };

    /* ─── COIN WALLET SYSTEM (ATLAS Coins) — admin config + redemption review ─── */
    const DEFAULT_COIN_SETTINGS = {
        coinName: 'ATLAS Coins',
        coinSymbol: '🪙',
        tiers: [
            { months: 1, coins: 1000 },
            { months: 2, coins: 2000 },
            { months: 3, coins: 3000 },
            { months: 6, coins: 5000 },
            { months: 12, coins: 8000 }
        ],
        dailyMax: 0, // 0 = no cap
        redemptionEnabled: true,
        autoApprove: true
    };
    window.DEFAULT_COIN_SETTINGS = DEFAULT_COIN_SETTINGS; // exposed for the classic <script> block below, which can't see module-scoped consts

    window._loadCoinSettings = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'coins'));
            if (snap.exists()) {
                const data = snap.data();
                return { ...DEFAULT_COIN_SETTINGS, ...data, tiers: (Array.isArray(data.tiers) && data.tiers.length) ? data.tiers : DEFAULT_COIN_SETTINGS.tiers };
            }
        } catch(e) { console.error('loadCoinSettings error:', e); }
        return DEFAULT_COIN_SETTINGS;
    };

    window._saveCoinSettings = async (data) => {
        await setDoc(doc(db, 'settings', 'coins'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    };

    /* ─── FORTUNE WHEEL & GIFT WHEEL (admin) ─── */
    window.DEFAULT_WHEEL_CONFIG = {
        enabled: true,
        cooldownHours: 24,
        testModeEnabled: false,
        testModeEmail: '',
        testModeUid: '',
        basic: {
            coin1: { amount: 10, weight: 20 },
            coin2: { amount: 25, weight: 15 },
            coin3: { amount: 50, weight: 8 },
            extraSpin: { weight: 12 },
            gift: { weight: 10 },
            lose1: { weight: 20 },
            lose2: { weight: 15 }
        },
        gift: {
            promonth: { months: 1, weight: 10 },
            tempfeature: { hours: 24, featureAR: 'مكتبة GIS الرقمية كاملة', featureEN: 'Full digital GIS library', weight: 25 },
            discount: { percent: 10, requiredMonths: 6, validDays: 14, weight: 35 },
            boost: { multiplier: 2, hours: 24, weight: 30 }
        }
    };
    window._loadWheelConfig = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'wheel'));
            if (snap.exists()) {
                const d = snap.data();
                return {
                    enabled: d.enabled !== false,
                    cooldownHours: d.cooldownHours || 24,
                    testModeEnabled: d.testModeEnabled === true,
                    testModeEmail: d.testModeEmail || '',
                    testModeUid: d.testModeUid || '',
                    basic: { ...window.DEFAULT_WHEEL_CONFIG.basic, ...(d.basic || {}) },
                    gift: { ...window.DEFAULT_WHEEL_CONFIG.gift, ...(d.gift || {}) }
                };
            }
        } catch(e) { console.error('loadWheelConfig error:', e); }
        return JSON.parse(JSON.stringify(window.DEFAULT_WHEEL_CONFIG));
    };
    window._saveWheelConfig = async (data) => {
        await setDoc(doc(db, 'settings', 'wheel'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    };
    window._loadDiscountCodes = async () => {
        const q = query(collection(db, 'discount_codes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._markDiscountCodeUsed = async (code) => {
        await updateDoc(doc(db, 'discount_codes', code), { used: true, usedAt: serverTimestamp() });
    };
    window._markDiscountCodeUnused = async (code) => {
        await updateDoc(doc(db, 'discount_codes', code), { used: false, usedAt: null });
    };
    window._loadWheelSpinLog = async (n) => {
        const q = query(collection(db, 'wheel_spins'), orderBy('createdAt', 'desc'), limit(n || 50));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._loadCoinRedemptionRequests = async () => {
        const q = query(collection(db, 'coin_redemption_requests'), orderBy('requestedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    // Extends (or starts) a user's ATLASYA PRO subscription by N months, stacking on
    // top of a still-active subscription instead of resetting it (mirrors student.html logic).
    window._grantProMonths = async (uid, months) => {
        const snap = await getDoc(doc(db, 'users', uid));
        const data = snap.exists() ? snap.data() : {};
        let base = new Date();
        if (data.plan === 'pro' && data.proExpiresAt) {
            const cur = data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt);
            if (cur > base) base = cur;
        }
        const newExpiry = new Date(base);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const payload = { plan: 'pro', proExpiresAt: Timestamp.fromDate(newExpiry) };
        if (data.plan !== 'pro') payload.proStartAt = serverTimestamp();
        await updateDoc(doc(db, 'users', uid), payload);
    };

    // Approves a pending redemption request: grants the PRO months and marks the
    // matching coin transaction (and request) as approved.
    window._approveCoinRedemption = async (reqId, uid, months, coins) => {
        await window._grantProMonths(uid, months);
        await updateDoc(doc(db, 'coin_redemption_requests', reqId), {
            status: 'approved', reviewedAt: serverTimestamp()
        });
    };

    // Rejects a pending redemption request and refunds the deducted coins to the student.
    window._rejectCoinRedemption = async (reqId, uid, coins, reason) => {
        await updateDoc(doc(db, 'users', uid), {
            coins: increment(coins),
            coinsSpentTotal: increment(-coins)
        });
        await updateDoc(doc(db, 'coin_redemption_requests', reqId), {
            status: 'rejected', reviewedAt: serverTimestamp(), rejectionReason: reason || ''
        });
        await addDoc(collection(db, 'coin_transactions'), {
            userId: uid, type: 'earn', amount: coins,
            reasonAR: 'رد عملات — تم رفض طلب الاستبدال', reasonEN: 'Coins refunded — redemption request rejected',
            createdAt: serverTimestamp()
        });
    };

    // Manually adjusts a student's coin balance from the admin panel and logs the transaction.
    // type must be 'earn' (add) or 'spend' (deduct). Exposed on window since the coin-management
    // UI code lives in a later classic <script> block that can't see these module-scoped consts.
    window._adjustUserCoinsManual = async (uid, amount, type) => {
        // ١) تأكد إن الحساب المسجّل دخوله على Firebase Auth *دلوقتي* هو فعلاً أدمن.
        // السيشن مشتركة بين كل تابات نفس المتصفح: لو فتحت student.html وسجّلت
        // بحساب طالب، تاب الأدمن بيكمّل يشتغل شكلاً لكن الطلبات بتخرج باسم الطالب
        // فتترفض بـ "Missing or insufficient permissions".
        const cu = auth.currentUser;
        if (!cu) throw new Error('انتهت الجلسة — سجّل دخول الأدمن من جديد');
        let isAdminNow = false;
        try { isAdminNow = (await getDoc(doc(db, 'admins', cu.uid))).exists(); } catch (e) {}
        if (!isAdminNow) {
            console.error('coin adjust blocked: signed-in account is not an admin →', cu.uid, cu.email);
            throw new Error('الحساب المسجّل حالياً على المتصفح (' + (cu.email || cu.uid) + ') مش حساب أدمن — سجّل خروج وادخل بحساب الأدمن تاني');
        }

        // ٢) الرصيد والسجل في batch واحد: يا الاتنين يتنفذوا يا ولا واحد،
        // فمافيش حالة رصيد اتغيّر من غير سجل معاملة.
        const delta = type === 'earn' ? amount : -amount;
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', uid), {
            coins: increment(delta),
            ...(type === 'earn' ? { coinsEarnedTotal: increment(amount) } : { coinsSpentTotal: increment(amount) })
        });
        batch.set(doc(collection(db, 'coin_transactions')), {
            userId: uid, type, amount,
            reasonAR: type === 'earn' ? 'إضافة عملات يدوياً من الإدارة' : 'خصم عملات يدوياً من الإدارة',
            reasonEN: type === 'earn' ? 'Coins added manually by admin' : 'Coins deducted manually by admin',
            createdAt: serverTimestamp()
        });
        try {
            await batch.commit();
        } catch (e) {
            console.error('coin adjust rejected by Firestore rules (admin uid ' + cu.uid + ') on users/' + uid + ' and/or coin_transactions:', e);
            throw e;
        }
    };

    window._bookMentorshipSlot = async (slotData) => {
        if (!currentUid) throw new Error('Not logged in');
        const d = window._userData || {};
        await addDoc(collection(db, 'mentorship_bookings'), {
            uid: currentUid,
            authorName: ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User',
            email: d.email || '',
            phone: d.phone || '',
            slotLabel: slotData.label || '',
            slotId: slotData.slotId || '',
            bookedAt: serverTimestamp()
        });
        // Mark slot as taken if slotId provided
        if (slotData.slotId) {
            try { await updateDoc(doc(db, 'mentorship_slots', slotData.slotId), { taken: true }); } catch(e) {}
        }
    };

    window._loadMentorshipSlots = async () => {
        const q = query(collection(db, 'mentorship_slots'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._addMentorshipSlot = async (slotData) => {
        await addDoc(collection(db, 'mentorship_slots'), {
            ...slotData,
            createdAt: serverTimestamp()
        });
    };

    window._deleteMentorshipSlot = async (slotId) => {
        await deleteDoc(doc(db, 'mentorship_slots', slotId));
    };

    window._loadMentorshipBookings = async () => {
        const q = query(collection(db, 'mentorship_bookings'), orderBy('bookedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._deleteMentorshipBooking = async (bookingId) => {
        await deleteDoc(doc(db, 'mentorship_bookings', bookingId));
    };

    /* ─── MENTORSHIP: ASK-AN-EXPERT REQUESTS ─── */
    window._sendMentorshipRequest = async (message, preferredDay, preferredTime) => {
        if (!currentUid) throw new Error('Not logged in');
        const d = window._userData || {};
        await addDoc(collection(db, 'mentorship_requests'), {
            uid: currentUid,
            authorName: ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User',
            email: d.email || '',
            phone: d.phone || '',
            message: message || '',
            preferredDay: preferredDay || '',
            preferredTime: preferredTime || '',
            replied: false,
            reply: '',
            createdAt: serverTimestamp()
        });
    };

    window._loadMyMentorshipRequests = async () => {
        if (!currentUid) return [];
        // NOTE: no orderBy here on purpose — combining where() + orderBy() on
        // different fields needs a Firestore composite index that doesn't exist,
        // which made this query fail. We sort client-side instead.
        const q = query(collection(db, 'mentorship_requests'), where('uid', '==', currentUid));
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return rows;
    };

    window._loadMentorshipRequests = async () => {
        const q = query(collection(db, 'mentorship_requests'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._replyMentorshipRequest = async (requestId, replyText) => {
        await updateDoc(doc(db, 'mentorship_requests', requestId), {
            reply: replyText,
            replied: true,
            repliedAt: serverTimestamp()
        });
    };

    window._deleteMentorshipRequest = async (requestId) => {
        await deleteDoc(doc(db, 'mentorship_requests', requestId));
    };

    /* ─── SUPPORT TICKETS ─── */
    window._createTicket = async (data) => {
        if (!currentUid) throw new Error('Not logged in');
        const d = window._userData || {};
        await addDoc(collection(db, 'support_tickets'), {
            uid: currentUid,
            studentName: ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User',
            studentEmail: d.email || '',
            type: data.type,
            message: data.message,
            screenshot: data.screenshot || '',
            status: 'open',
            reply: '',
            rating: 0,
            createdAt: serverTimestamp(),
            repliedAt: null,
            ratedAt: null
        });
    };
    // Real-time listener for student's own tickets
    window._subscribeMyTickets = (callback) => {
        if (!currentUid) return () => {};
        const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            const tickets = snap.docs
                .filter(d => d.data().uid === currentUid)
                .map(d => ({ id: d.id, ...d.data() }));
            callback(tickets);
        });
    };
    // Real-time listener for admin: all tickets from all students
    window._subscribeAllTickets = (callback) => {
        const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    };
    window._loadAllTickets = async () => {
        const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._replyToTicket = async (ticketId, replyText) => {
        await updateDoc(doc(db, 'support_tickets', ticketId), {
            reply: replyText,
            status: 'answered',
            repliedAt: serverTimestamp()
        });
    };
    window._closeTicket = async (ticketId) => {
        await updateDoc(doc(db, 'support_tickets', ticketId), { status: 'closed' });
    };
    window._rateTicket = async (ticketId, rating, comment) => {
        await updateDoc(doc(db, 'support_tickets', ticketId), { rating, ratingComment: comment || '', ratedAt: serverTimestamp() });
    };

    /* ─── ADMIN BROADCAST NOTIFICATIONS ─── */
    window._sendAdminNotif = async (title, body) => {
        await addDoc(collection(db, 'admin_notifications'), {
            title,
            body,
            createdAt: serverTimestamp(),
            sentBy: window._adminProfile?.displayName || 'Admin'
        });
    };
    window._loadAdminNotifs = async () => {
        const q = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    /* Track which notif IDs student has seen — stored in localStorage */
    window._getUnseenNotifCount = async () => {
        try {
            let total = 0;
            // Broadcast notifications (unseen via localStorage)
            const notifs = await window._loadAdminNotifs();
            const seen = JSON.parse(localStorage.getItem('seenNotifs_' + (currentUid||'guest')) || '[]');
            total += notifs.filter(n => !seen.includes(n.id)).length;
            // Personal admin alerts (unread from Firestore)
            if (currentUid) {
                try {
                    const alertsQ = query(
                        collection(db, 'admin_alerts'),
                        where('toUid', '==', currentUid)
                    );
                    const alertSnap = await getDocs(alertsQ);
                    total += alertSnap.docs.filter(d => !d.data().read).length;
                } catch(e) {}
            }
            return total;
        } catch(e) { return 0; }
    };
    window._markNotifsAsSeen = async () => {
        try {
            const notifs = await window._loadAdminNotifs();
            localStorage.setItem('seenNotifs_' + (currentUid||'guest'), JSON.stringify(notifs.map(n=>n.id)));
        } catch(e) {}
    };

    /* ─── JOB BOARD (Firestore) ─── */
    window._postJob = async (data) => {
        const d = window._userData || {};
        const isAdminUser = window._isAdmin === true;
        const authorName = isAdminUser ? 'Atlasya Team' : (((d.firstName || '') + ' ' + (d.lastName || '')).trim() || 'Member');
        await addDoc(collection(db, 'job_posts'), {
            ...data,
            authorName,
            authorUid: currentUid,
            authorEmail: isAdminUser ? (window._adminProfile?.email || '') : (d.email || ''),
            isAdminPost: isAdminUser,
            status: isAdminUser ? 'approved' : 'pending',
            createdAt: serverTimestamp()
        });
    };
    window._loadJobs = async () => {
        const q = query(collection(db, 'job_posts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._deleteJob = async (jobId) => {
        await deleteDoc(doc(db, 'job_posts', jobId));
    };
    window._loadJobsRealtime = (callback) => {
        const q = query(collection(db, 'job_posts'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    };
    window._updateJobStatus = async (jobId, status) => {
        await updateDoc(doc(db, 'job_posts', jobId), { status, reviewedAt: serverTimestamp() });
    };

    /* ─── ADMIN TEAM ACCOUNTS (Firebase Auth + admins/{uid}) ───
       إنشاء عضو فريق بيعمل حساب Firebase Auth حقيقي عن طريق تطبيق فرعي مؤقت
       (temp secondary app) — بالظبط زي فكرة companyAuth — عشان إنشاء الحساب
       الجديد ميعملش تسجيل خروج للأدمن الحالي (createUserWithEmailAndPassword
       بيسجل دخول تلقائي على أي auth instance بيتنفذ عليه). بعد ما ناخد الـ uid
       بتاع الحساب الجديد، نسيب التطبيق المؤقت ونمسحه، ونكتب صلاحياته في
       admins/{uid} على التطبيق الرئيسي. */
    window._createTeamAccount = async (data) => {
        const tempApp = initializeApp(firebaseConfig, 'tempTeamCreate_' + Date.now());
        const tempAuth = getAuth(tempApp);
        try {
            const cred = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
            const newUid = cred.user.uid;
            await setDoc(doc(db, 'admins', newUid), {
                role: 'admin',
                name: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                permissions: data.permissions || [],
                org: data.org || '',
                createdAt: serverTimestamp(),
                createdBy: window._adminProfile ? window._adminProfile.username : '',
            });
            return { id: newUid };
        } finally {
            try { await signOut(tempAuth); } catch (e) {}
            try { await deleteApp(tempApp); } catch (e) {}
        }
    };

    window._loadTeamAccounts = async () => {
        const snap = await getDocs(collection(db, 'admins'));
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    };

    // ⚠️ ده بيشيل صلاحية الأدمن بمسح مستند admins/{uid} — الحساب يقف عن
    // العمل كأدمن فورًا. لكن حساب Firebase Auth بتاعه نفسه بيفضل موجود
    // (حذف حساب مستخدم تاني فعليًا محتاج Admin SDK من سيرفر، مش client SDK).
    // لو عايز حذف كامل محتاج Admin SDK على سيرفر خارجي — مش مستخدم في المنصة دلوقتي.
    window._deleteTeamAccount = async (id) => {
        await deleteDoc(doc(db, 'admins', id));
    };
    window._updateTeamPermissions = async (id, permissions) => {
        await updateDoc(doc(db, 'admins', id), { permissions });
    };

    /* ─── CV BUILDER (Pro feature, Firestore) ─── */
    window._submitCVRequest = async (data) => {
        if (!currentUid) throw new Error('Not logged in');
        const d = window._userData || {};
        await setDoc(doc(db, 'cv_requests', currentUid), {
            ...data,
            uid: currentUid,
            authorName: ((d.firstName || '') + ' ' + (d.lastName || '')).trim() || 'Member',
            authorEmail: d.email || '',
            status: 'pending',
            updatedAt: serverTimestamp(),
            createdAt: window._myCVCreatedAt || serverTimestamp()
        }, { merge: true });
    };
    window._loadMyCVRequest = async () => {
        if (!currentUid) return null;
        const snap = await getDoc(doc(db, 'cv_requests', currentUid));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    };
    window._loadCVRequests = async () => {
        const q = query(collection(db, 'cv_requests'), orderBy('updatedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._deleteCVRequest = async (uid) => {
        await deleteDoc(doc(db, 'cv_requests', uid));
        try { await deleteDoc(doc(db, 'cv_files', uid)); } catch(e) { /* no file existed, ignore */ }
    };
    window._updateCVRequestStatus = async (uid, status) => {
        await updateDoc(doc(db, 'cv_requests', uid), { status, reviewedAt: serverTimestamp() });
    };
    window._uploadCVFileForRequest = async (uid, fileName, fileData) => {
        await setDoc(doc(db, 'cv_files', uid), {
            fileName, fileData, updatedAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'cv_requests', uid), {
            hasCvFile: true,
            status: 'done',
            reviewedAt: serverTimestamp()
        });
    };
    window._loadCVFile = async (uid) => {
        if (!uid) return null;
        const snap = await getDoc(doc(db, 'cv_files', uid));
        return snap.exists() ? snap.data() : null;
    };

    /* ─── SUBSCRIPTION SYSTEM ─── */
    window._getUserPlan = () => {
        return window._userData?.plan || 'basic';
    };
    window._isPro = () => window._getUserPlan() === 'pro';

    /* ─── SUBSCRIPTION SYSTEM ─── */
    window._getUserPlan = () => {
        return window._userData?.plan || 'basic';
    };
    window._isPro = () => window._getUserPlan() === 'pro';

    /* ── EmailJS (optional) — must match the same values configured in student.html
       to enable automatic emails when a subscription request is approved/rejected. ── */
    window.EMAILJS_CONFIG = { PUBLIC_KEY: '', SERVICE_ID: '', TEMPLATE_ID: '' };
    if (window.EMAILJS_CONFIG.PUBLIC_KEY && typeof emailjs !== 'undefined') {
        try { emailjs.init({ publicKey: window.EMAILJS_CONFIG.PUBLIC_KEY }); } catch (e) {}
    }
    window._sendSubscriptionEmail = async (toEmail, toName, subject, message) => {
        try {
            if (!window.EMAILJS_CONFIG.PUBLIC_KEY || typeof emailjs === 'undefined' || !toEmail) return;
            await emailjs.send(window.EMAILJS_CONFIG.SERVICE_ID, window.EMAILJS_CONFIG.TEMPLATE_ID, {
                to_email: toEmail, to_name: toName || '', subject, message
            });
        } catch (e) { /* email is best-effort only */ }
    };

    window._sendUpgradeRequest = async () => {
        if (!currentUid) throw new Error('Not logged in');
        const d = window._userData || {};
        await addDoc(collection(db, 'upgrade_requests'), {
            uid: currentUid,
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            email: d.email || '',
            phone: d.phone || '',
            requestedAt: serverTimestamp(),
            status: 'pending'
        });
    };

    window._loadUpgradeRequests = async () => {
        const q = query(collection(db, 'upgrade_requests'), orderBy('requestedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    window._deleteUpgradeRequest = async (reqId) => {
        await deleteDoc(doc(db, 'upgrade_requests', reqId));
    };

    /* Updates a subscription request's review status (approve/reject) while
       keeping the document as a permanent history record — never deleted. */
    window._reviewUpgradeRequest = async (reqId, status, extra) => {
        extra = extra || {};
        const payload = {
            status,
            reviewedAt: serverTimestamp(),
            rejectionReason: status === 'rejected' ? (extra.reason || '') : null,
            approvedMonths: status === 'approved' ? (extra.months || 12) : null
        };
        await updateDoc(doc(db, 'upgrade_requests', reqId), payload);
    };

    window._setUserPlan = async (uid, plan, months) => {
        const payload = { plan };
        if (plan === 'pro') {
            const durationMonths = (months && months > 0) ? months : 12;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + durationMonths);
            payload.proStartAt = serverTimestamp();
            payload.proExpiresAt = Timestamp.fromDate(expiry);
        } else {
            payload.proExpiresAt = null;
            payload.proStartAt = null;
        }
        await updateDoc(doc(db, 'users', uid), payload);
    };

    /* Checks a user's Pro subscription and downgrades to Basic in Firestore + local
       cache if it has expired. Safe to call repeatedly (no-op if not pro/expired). */
    window._checkAndExpirePro = async (uid, data) => {
        try {
            if (!uid || !data) return;
            if ((data.plan || 'basic') !== 'pro') return;
            if (!data.proExpiresAt) return;
            const expDate = data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt);
            if (expDate - new Date() > 0) return; // still active

            // Expired — downgrade to basic
            await updateDoc(doc(db, 'users', uid), {
                plan: 'basic',
                proExpiresAt: null,
                proStartAt: null
            });
            if (window._userData && uid === (window._currentUid || currentUid)) {
                window._userData.plan = 'basic';
                window._userData.proExpiresAt = null;
                window._userData.proStartAt = null;
            }
            // Refresh account page if currently viewing it
            if (window._currentPage === 'account' && typeof renderAccount === 'function') renderAccount();
        } catch (e) { /* silent fail — will retry on next load */ }
    };

    /* ─── LIVE PRO COUNTDOWN TICKER ─── */
    window._proCountdownInterval = window._proCountdownInterval || null;
    window._startProCountdown = () => {
        if (window._proCountdownInterval) { clearInterval(window._proCountdownInterval); window._proCountdownInterval = null; }
        const el = document.getElementById('proCountdownLive');
        if (!el) return;
        const isAR = typeof lang !== 'undefined' && lang === 'AR';
        const tick = () => {
            const el2 = document.getElementById('proCountdownLive');
            if (!el2) { clearInterval(window._proCountdownInterval); window._proCountdownInterval = null; return; }
            const expMs = parseInt(el2.getAttribute('data-expires-ms'), 10);
            const diff = expMs - Date.now();
            if (diff <= 0) {
                clearInterval(window._proCountdownInterval);
                window._proCountdownInterval = null;
                const uid = el2.getAttribute('data-uid');
                if (uid && typeof window._checkAndExpirePro === 'function') {
                    window._checkAndExpirePro(uid, { plan: 'pro', proExpiresAt: new Date(expMs) });
                }
                if (window._currentPage === 'account' && typeof renderAccount === 'function') renderAccount();
                return;
            }
            const totalSec = Math.floor(diff / 1000);
            const days = Math.floor(totalSec / 86400);
            const hours = Math.floor((totalSec % 86400) / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;
            const pad = n => String(n).padStart(2, '0');
            el2.textContent = isAR
                ? `${days} يوم ${pad(hours)}:${pad(mins)}:${pad(secs)}`
                : `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
        };
        tick();
        window._proCountdownInterval = setInterval(tick, 1000);
    };

    /* Returns { expired, text, totalDays } describing time left on a Pro subscription */
    window._formatProRemaining = (expiresAt, isAR) => {
        if (!expiresAt) return null;
        const expDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
        const now = new Date();
        const diffMs = expDate - now;
        if (diffMs <= 0) {
            return { expired: true, text: isAR ? 'انتهى الاشتراك' : 'Subscription expired' };
        }
        const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const months = Math.floor(totalDays / 30);
        const weeks = Math.floor((totalDays % 30) / 7);
        const days = (totalDays % 30) % 7;
        const parts = [];
        if (months > 0) parts.push(isAR ? `${months} شهر` : `${months} mo`);
        if (weeks > 0) parts.push(isAR ? `${weeks} أسبوع` : `${weeks} wk`);
        if (days > 0 || parts.length === 0) parts.push(isAR ? `${days} يوم` : `${days} d`);
        return { expired: false, text: parts.join(isAR ? ' و ' : ', '), totalDays };
    };

    window._loadAllUsers = async () => {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    };

    // Sums coin_transactions specifically tagged as referral rewards, grouped by userId.
    // More reliable than the `referralCoinsEarned` field alone, since that field was only
    // added at a certain point — older referrals may only be traceable via their logged
    // transaction record (or may predate transaction logging entirely and have neither).
    window._loadReferralCoinsByUser = async () => {
        const map = {};
        try {
            const q = query(collection(db, 'coin_transactions'), where('reasonEN', '==', 'Reward for inviting a new friend'));
            const snap = await getDocs(q);
            snap.docs.forEach(d => {
                const data = d.data();
                if (!data.userId) return;
                map[data.userId] = (map[data.userId] || 0) + (data.amount || 0);
            });
        } catch(e) { console.error('_loadReferralCoinsByUser error:', e); }
        return map;
    };

    window._deleteUserData = async (uid) => {
        await deleteDoc(doc(db, 'users', uid));
    };

    window._suspendUser = async (uid, suspend) => {
        await updateDoc(doc(db, 'users', uid), { suspended: suspend });
    };

    window._sendAdminAlert = async (uid, message) => {
        await addDoc(collection(db, 'admin_alerts'), {
            toUid: uid,
            message,
            createdAt: serverTimestamp(),
            read: false,
            sentBy: window._adminProfile?.displayName || 'Admin'
        });
    };

    /* ─── DAILY DOWNLOAD LIMIT (3/day for Basic) ─── */
    function _getTodayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    window._getDailyDownloadCount = function() {
        // Read from in-memory userData (synced from Firestore on login)
        const daily = window._userData?.dailyDownloads;
        const today = _getTodayStr();
        if (!daily || daily.date !== today) return 0;
        return daily.count || 0;
    };
    window._incrementDailyDownload = async () => {
        if (!currentUid) return;
        const today = _getTodayStr();
        const daily = window._userData?.dailyDownloads;
        const newCount = (daily && daily.date === today) ? (daily.count || 0) + 1 : 1;
        await updateDoc(doc(db, 'users', currentUid), {
            dailyDownloads: { count: newCount, date: today }
        });
        if (window._userData) window._userData.dailyDownloads = { count: newCount, date: today };
    };
    // Keep old functions for backward compat (no-op increment, return daily count)
    window._getUserUploadCount = async () => window._getDailyDownloadCount();
    window._incrementUploadCount = async () => { await window._incrementDailyDownload(); };

    /* ─── ADMIN CONTENT (Firestore) ─── */
    window._saveContent = async (contentMap) => {
        // contentMap = { 'element-id': 'new text', ... }
        await setDoc(doc(db, 'site_content', 'main'), { ...contentMap, updatedAt: serverTimestamp() }, { merge: true });
    };
    window._loadContent = async () => {
        const snap = await getDoc(doc(db, 'site_content', 'main'));
        return snap.exists() ? snap.data() : {};
    };
    window._applyContent = async () => {
        try {
            // Manual override for these 4 is removed — they're always computed
            // live from Firestore now (see renderDashboard).
            const LIVE_STAT_IDS = ['stat_videos', 'stat_library', 'stat_jobs', 'stat_datasets'];
            const content = await window._loadContent();
            Object.entries(content).forEach(([id, text]) => {
                if (id === 'updatedAt' || LIVE_STAT_IDS.includes(id)) return;
                const el = document.getElementById(id);
                if (el) el.innerHTML = text;
            });
        } catch(e) { /* silent fail */ }
    };

    /* ─── STUDENT COMMUNITY GROUPS (Firestore, in-app group chat) ─── */
    window._saveCommunityGroup = async (groupId, data) => {
        const payload = { ...data, updatedAt: serverTimestamp() };
        if (groupId) {
            await setDoc(doc(db, 'community_groups', groupId), payload, { merge: true });
            return groupId;
        } else {
            const ref = await addDoc(collection(db, 'community_groups'), { ...payload, createdAt: serverTimestamp(), memberCount: data.memberCount || 0 });
            return ref.id;
        }
    };
    window._loadCommunityGroups = async () => {
        const q = query(collection(db, 'community_groups'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };
    window._deleteCommunityGroup = async (groupId) => {
        await deleteDoc(doc(db, 'community_groups', groupId));
    };
    /* Mark current user as a member of the group (called when they open the chat) */
    window._ensureCommunityMembership = async (groupId) => {
        const d = window._userData || {};
        const isAdminUser = window._isAdmin === true;
        const memberName = isAdminUser
            ? (window._adminProfile?.displayName || 'Atlasya Team')
            : ((((d.firstName || '') + ' ' + (d.lastName || '')).trim()) || 'Member');
        const memberId = isAdminUser ? ('admin_' + (window._adminProfile?.username || 'team')) : (currentUid || 'guest');
        try {
            const memberRef = doc(db, 'community_groups', groupId, 'members', memberId);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) return;
            await setDoc(memberRef, {
                uid: isAdminUser ? null : (currentUid || null),
                name: memberName,
                email: isAdminUser ? (window._adminProfile?.email || '') : (d.email || ''),
                isAdmin: isAdminUser,
                joinedAt: serverTimestamp()
            });
            const ref = doc(db, 'community_groups', groupId);
            const snap = await getDoc(ref);
            const current = snap.exists() ? (snap.data().memberCount || 0) : 0;
            await updateDoc(ref, { memberCount: current + 1 });
        } catch(e) {}
    };
    /* Send a message into a group's in-app chat */
    window._sendCommunityMessage = async (groupId, text) => {
        const d = window._userData || {};
        const isAdminUser = window._isAdmin === true;
        const senderName = isAdminUser
            ? 'Atlasya Team'
            : ((((d.firstName || '') + ' ' + (d.lastName || '')).trim()) || 'Member');
        await window._ensureCommunityMembership(groupId);
        await addDoc(collection(db, 'community_groups', groupId, 'messages'), {
            uid: isAdminUser ? null : (currentUid || null),
            authorName: senderName,
            senderType: isAdminUser ? 'admin' : 'student',
            text,
            createdAt: serverTimestamp()
        });
    };
    /* Delete a message from a group's in-app chat */
    window._deleteCommunityMessage = async (groupId, messageId) => {
        await deleteDoc(doc(db, 'community_groups', groupId, 'messages', messageId));
    };

    /* Toggle current user's reaction (emoji) on a message */
    window._communityReactorId = () => {
        const isAdminUser = window._isAdmin === true;
        return isAdminUser ? ('admin_' + (window._adminProfile?.username || 'team')) : (currentUid || 'guest');
    };
    window._toggleMessageReaction = async (groupId, messageId, emoji) => {
        const msgRef = doc(db, 'community_groups', groupId, 'messages', messageId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const reactorId = window._communityReactorId();
        const current = (data.reactions && data.reactions[emoji]) || [];
        const field = `reactions.${emoji}`;
        await updateDoc(msgRef, { [field]: current.includes(reactorId) ? arrayRemove(reactorId) : arrayUnion(reactorId) });
    };

    /* Send a reply into a message's private thread (not shown inline in the group) */
    window._sendThreadReply = async (groupId, messageId, text) => {
        const d = window._userData || {};
        const isAdminUser = window._isAdmin === true;
        const senderName = isAdminUser
            ? 'Atlasya Team'
            : ((((d.firstName || '') + ' ' + (d.lastName || '')).trim()) || 'Member');
        await window._ensureCommunityMembership(groupId);
        await addDoc(collection(db, 'community_groups', groupId, 'messages', messageId, 'replies'), {
            uid: isAdminUser ? null : (currentUid || null),
            authorName: senderName,
            senderType: isAdminUser ? 'admin' : 'student',
            text,
            createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'community_groups', groupId, 'messages', messageId), { replyCount: increment(1) });
    };

    /* Real-time listener for a message's thread replies */
    window._loadThreadRepliesRealtime = (groupId, messageId, callback) => {
        const q = query(collection(db, 'community_groups', groupId, 'messages', messageId, 'replies'), orderBy('createdAt', 'asc'));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    };

    /* Load members of a group */
    window._loadCommunityMembers = async (groupId) => {
        const q = query(collection(db, 'community_groups', groupId, 'members'), orderBy('joinedAt', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    /* Real-time listener for a group's messages */
    window._loadCommunityMessagesRealtime = (groupId, callback) => {
        const q = query(collection(db, 'community_groups', groupId, 'messages'), orderBy('createdAt', 'asc'));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // If admin already logged in via local credentials, don't interfere
            if (window._isAdmin) return;

            // لو الحساب ده عضو فريق (admins/{uid} موجود)، أوقف هنا في كل
            // الأحوال — عشان ما نكملش على فحوصات حساب طالب (تحت) اللي هتبوّظ
            // الشاشة. بس الدخول التلقائي الفعلي بيحصل مرة واحدة بس، لما يكون
            // جاي فعلاً من صفحة الطالب (علامة atlasya_admin_handoff) — أي فتح
            // مباشر أو تحديث لـ admin.html بعد كده محتاج ضغط زرار الدخول يدويًا.
            try {
                const adminData = await window._getAdminDoc(user.uid);
                if (adminData) {
                    // العلامة بتتحط من بوابة المشرفين في student.html وبتفضل طول ما التاب مفتوح
                    // (فالـ refresh بيفضل جوه لوحة الإدارة)، وبتتمسح عند تسجيل الخروج.
                    const isHandoff = sessionStorage.getItem('atlasya_admin_handoff') === '1';
                    if (isHandoff) {
                        const isSuper = adminData.permissions === 'all' || adminData.role === 'superadmin';
                        const permissions = isSuper ? 'all' : (Array.isArray(adminData.permissions) ? adminData.permissions : []);
                        const displayEmail = adminData.email || user.email || 'Admin';
                        const nameParts = (adminData.name || displayEmail).trim().split(' ');
                        const matched = {
                            username: displayEmail,
                            displayName: adminData.name || displayEmail,
                            firstName: adminData.firstName || nameParts[0] || 'Admin',
                            lastName: adminData.lastName || nameParts.slice(1).join(' '),
                        };
                        if (window._activateAdminSession) {
                            window._activateAdminSession(matched, isSuper, permissions);
                        }
                    } else {
                        // حساب أدمن بس مفيش دخول من البوابة في التاب ده — يدخل من صفحة الدخول الموحّدة
                        window.location.replace(window._atlasyaStudentPage(true));
                    }
                    return;
                }
            } catch (e) {
                console.error('Admin auto-detect failed:', e);
            }
            // مش حساب أدمن (أو تعذّر التحقق): لوحة الإدارة مش للطلاب — نرجّعه لصفحة الدخول الموحّدة.
            // (الكود اللي بعد كده الخاص بحساب الطالب بقى مش بيتنفذ في admin.html)
            window.location.replace(window._atlasyaStudentPage(false));
            return;

            // Require verified email before granting access
            if (!user.emailVerified) {
                currentUid = null;
                window._userData = null;
                document.getElementById('mainApp').style.display = 'none';
                document.getElementById('authBox').style.display = 'flex';
                if (typeof showEmailVerifyScreen === 'function') showEmailVerifyScreen(user.email);
                return;
            }

            currentUid = user.uid;
            window._currentUid = user.uid; // expose for JS
            document.getElementById('authBox').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';

            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const d = snap.data();

                // ── SUSPENDED CHECK ──
                if (d.suspended === true) {
                    await signOut(auth);
                    currentUid = null;
                    window._userData = null;
                    document.getElementById('mainApp').style.display = 'none';
                    document.getElementById('authBox').style.display = 'flex';
                    // Show suspended modal
                    setTimeout(() => {
                        const isAR = typeof lang !== 'undefined' && lang === 'AR';
                        const CONTACT_EMAIL = 'atlasyateam26@gmail.com';
                        const existing = document.getElementById('suspendedModal');
                        if (existing) existing.remove();
                        const modal = document.createElement('div');
                        modal.id = 'suspendedModal';
                        modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.82);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeUp 0.35s ease both;';
                        modal.innerHTML = `
                            <div style="background:linear-gradient(135deg,#1a0a0a,#220c0c);border:1px solid rgba(220,50,50,0.4);border-radius:20px;padding:32px 28px;max-width:400px;width:100%;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,0.8),0 0 0 1px rgba(220,50,50,0.1);direction:rtl;">
                                <div style="width:64px;height:64px;border-radius:50%;background:rgba(220,50,50,0.12);border:2px solid rgba(220,50,50,0.4);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
                                    <i class="fa-solid fa-ban" style="color:#ff6b6b;font-size:26px;"></i>
                                </div>
                                <div style="font-size:19px;font-weight:800;color:#ff6b6b;margin-bottom:10px;">تم إيقاف حسابك مؤقتاً</div>
                                <div style="font-size:13px;color:#a08080;line-height:1.7;margin-bottom:20px;">
                                    حسابك موقوف مؤقتاً من قِبَل إدارة المنصة.<br>للاستفسار وحل المشكلة، تواصل معنا على:
                                </div>
                                <div onclick="navigator.clipboard.writeText('${CONTACT_EMAIL}').then(()=>{const t=document.getElementById('emailCopiedTip');if(t){t.style.opacity='1';setTimeout(()=>t.style.opacity='0',1800);}})"
                                     style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:rgba(220,50,50,0.1);border:1px dashed rgba(220,50,50,0.4);border-radius:10px;cursor:pointer;transition:0.2s;margin-bottom:8px;"
                                     onmouseover="this.style.background='rgba(220,50,50,0.2)'" onmouseout="this.style.background='rgba(220,50,50,0.1)'">
                                    <i class="fa-solid fa-envelope" style="color:#ff6b6b;font-size:14px;"></i>
                                    <span style="font-size:14px;font-weight:700;color:#ffaaaa;letter-spacing:0.3px;direction:ltr;">${CONTACT_EMAIL}</span>
                                    <i class="fa-regular fa-copy" style="color:#a08080;font-size:13px;"></i>
                                </div>
                                <div id="emailCopiedTip" style="font-size:12px;color:var(--green4);opacity:0;transition:opacity 0.3s;margin-bottom:12px;">
                                    <i class="fa-solid fa-check"></i> تم نسخ الإيميل!
                                </div>
                                <div style="margin-top:8px;margin-bottom:22px;">
                                    <div style="font-size:12px;color:#806060;margin-bottom:8px;">سيتم إغلاق هذه الرسالة خلال:</div>
                                    <div id="suspendCountdown" style="font-size:28px;font-weight:800;color:#ff6b6b;font-family:'Space Mono',monospace;">20</div>
                                </div>
                                <button onclick="document.getElementById('suspendedModal').remove()" style="padding:10px 28px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#806060;font-size:13px;font-weight:700;font-family:'Tajawal',sans-serif;cursor:pointer;transition:0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#806060'">
                                    إغلاق
                                </button>
                            </div>`;
                        document.body.appendChild(modal);
                        // Countdown timer
                        let secs = 20;
                        const countEl = modal.querySelector('#suspendCountdown');
                        const timer = setInterval(() => {
                            secs--;
                            if (countEl) countEl.textContent = secs;
                            if (secs <= 0) {
                                clearInterval(timer);
                                modal.style.opacity = '0';
                                modal.style.transition = 'opacity 0.4s';
                                setTimeout(() => modal.remove(), 400);
                            }
                        }, 1000);
                    }, 300);
                    return;
                }

                window._userData = d;
                window._userData.email = user.email;
                window._base64Img = d.profileImg || "";
                // ── AUTO-EXPIRE PRO SUBSCRIPTION ──
                if (typeof window._checkAndExpirePro === 'function') {
                    window._checkAndExpirePro(user.uid, window._userData);
                }
                updateSidebarUser(d.firstName, d.lastName, d.profileImg);
                applyTheme(d.affiliate || '');
                // if account page is open, re-render
                if (window._currentPage === 'account') renderAccount();
                // Re-render dashboard to show name in greeting (userData loads async after first render)
                if (window._currentPage === 'dashboard' || !window._currentPage) {
                    const _dashArea = document.getElementById('pageContent');
                    if (_dashArea) renderDashboard(_dashArea);
                }
                // Load notification count for student
                loadAdminNotifCount();

                // ── CHECK FOR ADMIN ALERT MESSAGES ──
                try {
                    const alertsQ = query(
                        collection(db, 'admin_alerts'),
                        where('toUid', '==', user.uid),
                        limit(10)
                    );
                    const alertSnap = await getDocs(alertsQ);
                    const unreadAlerts = alertSnap.docs
                        .filter(d => !d.data().read)
                        .sort((a, b) => {
                            const ta = a.data().createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
                            const tb = b.data().createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
                            return tb - ta;
                        });
                    if (unreadAlerts.length > 0) {
                        unreadAlerts.forEach(async (alertDoc) => {
                            const alertData = alertDoc.data();
                            setTimeout(() => {
                                showAdminAlertBanner(alertData.message, alertDoc.id);
                            }, 1200);
                            try { await updateDoc(doc(db, 'admin_alerts', alertDoc.id), { read: true }); } catch(e) {}
                        });
                    }
                } catch(alertErr) { /* silently skip if collection doesn't exist yet */ }
            }
        } else {
            if (window._isAdmin) return; // admin session — ignore Firebase signout
            currentUid = null;
            window._userData = null;
            // مفيش جلسة: مافيش شاشة دخول أدمن منفصلة — الدخول من "بوابة مشرفي المنصة" في student.html
            try { sessionStorage.removeItem('atlasya_admin_handoff'); } catch (e) {}
            window.location.replace(window._atlasyaStudentPage(true));
        }
    });

    /* ─── ADMIN ALERT BANNER (shown to student when they log in) ─── */
    function showAdminAlertBanner(message, alertId) {
        const isAR = typeof lang !== 'undefined' && lang === 'AR';
        const banner = document.createElement('div');
        banner.id = 'adminAlertBanner_' + alertId;
        banner.style.cssText = `
            position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:99999;
            background:linear-gradient(135deg,#1a2a4a,#0e1a30);
            border:1px solid rgba(100,149,237,0.5);
            border-radius:16px;padding:18px 22px;
            max-width:420px;width:calc(100% - 32px);
            box-shadow:0 12px 40px rgba(0,0,0,0.6),0 0 0 1px rgba(100,149,237,0.15);
            display:flex;gap:14px;align-items:flex-start;
            transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s ease;
            opacity:0;
        `;
        banner.innerHTML = `
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(100,149,237,0.15);border:2px solid rgba(100,149,237,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fa-solid fa-bullhorn" style="color:#6495ed;font-size:16px;"></i>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:11px;font-weight:700;color:#6495ed;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                    ${isAR?'رسالة من الإدارة':'Message from Admin'}
                </div>
                <div style="font-size:14px;color:#e8e6f0;line-height:1.5;font-family:'Tajawal',sans-serif;">${message}</div>
            </div>
            <button onclick="this.closest('[id^=adminAlertBanner_]').style.opacity='0';this.closest('[id^=adminAlertBanner_]').style.transform='translateX(-50%) translateY(-80px)';setTimeout(()=>this.closest('[id^=adminAlertBanner_]').remove(),400);" style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s;margin-top:-2px;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        document.body.appendChild(banner);
        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                banner.style.opacity = '1';
                banner.style.transform = 'translateX(-50%) translateY(0)';
            });
        });
        // Auto dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(banner)) {
                banner.style.opacity = '0';
                banner.style.transform = 'translateX(-50%) translateY(-80px)';
                setTimeout(() => banner.remove(), 400);
            }
        }, 10000);
    }

    function updateSidebarUser(fn, ln, img) {
        const name = (fn || '') + ' ' + (ln || '');
        const letter = fn ? fn[0].toUpperCase() : 'U';
        const sideUserName = document.getElementById('sideUserName');
        if (sideUserName) sideUserName.textContent = name.trim() || 'User';
        const sideAvatarLetter = document.getElementById('sideAvatarLetter');
        if (sideAvatarLetter) sideAvatarLetter.textContent = letter;
        const sideAvatar = document.getElementById('sideAvatar');
        if (img && sideAvatar) {
            sideAvatar.style.backgroundImage = `url('${img}')`;
            sideAvatar.innerHTML = '';
        }
        // big avatar in account
        const av = document.getElementById('avatarXl');
        if (av) {
            if (img) { av.style.backgroundImage = `url('${img}')`; av.querySelector('span')?.remove(); }
            else { av.style.backgroundImage = 'none'; }
        }
        // update affiliate label under name (element removed, skip safely)
        const roleEl = document.getElementById('sideUserRole');
        if (roleEl) {
            const affiliate = window._userData?.affiliate || '';
            const userPlan = window._userData?.plan || 'basic';
            if (userPlan === 'pro') {
                roleEl.innerHTML = '<span style="color:var(--gold3);font-weight:700;"><i class="fa-solid fa-crown" style="font-size:11px;margin-left:3px;"></i> Pro</span>';
            } else if (affiliate === 'TerraScope') {
                roleEl.innerHTML = '<span style="color:var(--gold3);font-weight:700;">🌍 TerraScope</span>';
            } else if (affiliate === 'GIS Explorer') {
                roleEl.innerHTML = '<span style="color:var(--green3);font-weight:700;">🌱 GIS Explorer</span>';
            } else {
                roleEl.textContent = lang === 'AR' ? 'عضو' : 'Member';
            }
        }
        // update TOPBAR user — update ALL copies (mob + desk)
        const displayName = (fn || 'User').trim();
        const isPro = (window._userData?.plan || 'basic') === 'pro';
        const proBadge = isPro ? `<span class="pro-topbar-badge"><i class="fa-solid fa-crown" style="font-size:8px;"></i> PRO</span>` : '';
        ['topbarUserName', 'topbarUserNameDesk'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = proBadge + displayName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        });
        ['topbarAvatar', 'topbarAvatarDesk'].forEach(id => {
            const av = document.getElementById(id);
            if (!av) return;
            if (img) {
                av.style.backgroundImage = `url('${img}')`;
                av.style.backgroundSize = 'cover';
                av.innerHTML = '';
            } else {
                av.style.backgroundImage = 'none';
                av.innerHTML = `<span>${letter}</span>`;
            }
        });
        ['topbarAvatarLetter', 'topbarAvatarLetterDesk'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = letter;
        });
    }
    window._updateSidebarUser = updateSidebarUser;

    /* ─── THEME ─── */
    function applyTheme(affiliate) {
        const body = document.getElementById('pageBody');
        if (affiliate === 'TerraScope') {
            body.classList.add('theme-gold');
        } else {
            body.classList.remove('theme-gold');
        }
    }
    window._applyTheme = applyTheme;
