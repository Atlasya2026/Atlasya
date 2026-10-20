import { initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, onSnapshot, limit, where, Timestamp, arrayUnion, arrayRemove, increment, runTransaction } from './supabase-compat.js';

        /* ════════════════════════════════════════════════════════════════════════
   SUPABASE COMPAT LAYER
   نفس دوال Firebase (Auth + Firestore) لكن شغّالة على Supabase — عشان باقي
   الكود يفضل زي ما هو. الجدول: public.docs (شوف supabase_setup.sql)
   ════════════════════════════════════════════════════════════════════════ */


        const firebaseConfig = { provider: 'supabase' };

        const app = initializeApp(firebaseConfig);

        const auth = getAuth(app);
        const db = getFirestore(app);
        window._auth = auth; // expose for password change
        window._signOutAuth = () => signOut(auth);

        /* ─── REFERRAL LINK CAPTURE ───
        If someone lands on the app via a friend's invite link (?ref=UID),
        remember that UID in localStorage so it survives the login/signup
        flow, then attach it to the new account when they sign up. */
        (function captureReferral() {
            try {
                const refUid = new URLSearchParams(window.location.search).get('ref');
                if (refUid) localStorage.setItem('pendingReferralUid', refUid);
            } catch(e) {}
        })();

        /* ─── SECONDARY APP FOR COMPANY SESSIONS ───
        Companies get their own isolated Firebase Auth session so logging in/out
        as a company never touches the student/admin session on this device. */
        const companyApp = initializeApp(firebaseConfig, 'companyPortal');
        const companyAuth = getAuth(companyApp);
        const companyDb = getFirestore(companyApp);
        let companyUid = null;
        let companyProfile = null;

        window._companySignUp = async (data) => {
            const cred = await createUserWithEmailAndPassword(companyAuth, data.email, data.password);
            const profile = {
                companyName: data.companyName || '',
                email: data.email || '',
                phone: data.phone || '',
                whatsapp: data.whatsapp || '',
                website: data.website || '',
                facebook: data.facebook || '',
                linkedin: data.linkedin || '',
                instagram: data.instagram || '',
                createdAt: serverTimestamp()
            };
            await setDoc(doc(companyDb, 'companies', cred.user.uid), profile);
            return cred.user.uid;
        };
        window._companyLogin = async (email, pass) => {
            await signInWithEmailAndPassword(companyAuth, email, pass);
        };
        window._companyLogout = async () => {
            await signOut(companyAuth);
        };
        window._companyLoadProfile = async (uid) => {
            const snap = await getDoc(doc(companyDb, 'companies', uid));
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        };
        window._companyUpdateProfile = async (uid, data) => {
            await updateDoc(doc(companyDb, 'companies', uid), data);
        };
        window._companyLoadMyCourses = async (uid) => {
            const q = query(collection(companyDb, 'courses'), where('companyId', '==', uid));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        };
        window._companySubmitCourse = async (data) => {
            if (!companyUid) throw new Error('Not logged in');
            const companyName = companyProfile?.companyName || '';
            await addDoc(collection(companyDb, 'courses'), {
                ...data,
                companyId: companyUid,
                companyName,
                email: data.email || companyProfile?.email || '',
                whatsapp: data.whatsapp || companyProfile?.whatsapp || '',
                website: data.website || companyProfile?.website || '',
                facebook: data.facebook || companyProfile?.facebook || '',
                linkedin: data.linkedin || companyProfile?.linkedin || '',
                instagram: data.instagram || companyProfile?.instagram || '',
                views: 0,
                interestedCount: 0,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            window._notifyAdminsBot('course_submission', { companyName, courseTitle: data.title || data.courseTitle || '' }, companyAuth);
        };
        window._companyUpdateCourse = async (courseId, data) => {
            await updateDoc(doc(companyDb, 'courses', courseId), {
                ...data,
                status: 'pending', // edits require re-review
                updatedAt: serverTimestamp()
            });
        };
        window._companyDeleteCourse = async (courseId) => {
            await deleteDoc(doc(companyDb, 'courses', courseId));
        };

        onAuthStateChanged(companyAuth, async (user) => {
            if (user) {
                companyUid = user.uid;
                window._companyUid = user.uid;
                companyProfile = await window._companyLoadProfile(user.uid);
                if (typeof window._onCompanyAuthChange === 'function') window._onCompanyAuthChange(companyProfile);
            } else {
                companyUid = null;
                window._companyUid = null;
                companyProfile = null;
                if (typeof window._onCompanyAuthChange === 'function') window._onCompanyAuthChange(null);
            }
        });

        let currentUid = null;
        window._base64Img = "";

        // expose to global
        window._doLogin = async (email, pass) => {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            // نفس مجموعة حسابات Firebase Auth مستخدمة في admin.html، فلو الحساب
            // ده عضو فريق (admins/{uid} موجود)، نوجّهه للوحة الأدمن تلقائيًا —
            // السيشن بتفضل شغالة هناك (نفس default app) فمش هيحتاج يسجل تاني.
            try {
                const adminSnap = await getDoc(doc(db, 'admins', cred.user.uid));
                if (adminSnap.exists()) {
                    sessionStorage.setItem('atlasya_admin_handoff', '1');
                    window.location.href = 'admin.html';
                    return 'redirecting-to-admin';
                }
            } catch (e) {
                // مشكلة شبكة في فحص admins مش لازم تمنع طالب عادي من الدخول
            }
        };
        // ─── PLATFORM ON/OFF (settings/platformStatus) ───
        // المشرف بيوقّف/يشغّل المنصة من "حسابي" في admin.html، وهنا بنسمع للتغيير لحظيًا
        // ونعرض صفحة الصيانة (window.applyPlatformStatus معرّفة في السكريبت العادي تحت).
        // لو القراءة اترفضت أو حصل خطأ بنفشل "مفتوح": المنصة تفضل شغالة بدل ما نقفلها بالغلط.
        let _platformUnsub = null;
        function startPlatformWatcher() {
            if (_platformUnsub) return;
            try {
                _platformUnsub = onSnapshot(doc(db, 'settings', 'platformStatus'),
                    (snap) => { if (window.applyPlatformStatus) window.applyPlatformStatus(snap.exists() ? snap.data() : null); },
                    (err) => { console.warn('platformStatus watch failed:', err && err.code); _platformUnsub = null; }
                );
            } catch (e) { console.warn('platformStatus watch error:', e); _platformUnsub = null; }
        }
        window._startPlatformWatcher = startPlatformWatcher;
        startPlatformWatcher();

        // إيميل الحساب الحالي — بيستخدمه استثناء "الإيميل التجريبي" وقت إيقاف المنصة
        onAuthStateChanged(auth, (u) => {
            window._currentAuthEmail = (u && u.email) ? String(u.email).trim().toLowerCase() : '';
            if (typeof window.refreshMaintenanceOverlay === 'function') window.refreshMaintenanceOverlay();
        });

        // Supervisor login (بوابة المشرفين): only accounts that have an admins/{uid} doc get in.
        // Anyone else is signed out immediately so a student never lands in a half-open session.
        window._supervisorSignIn = async (email, pass) => {
            window._supervisorLoginInProgress = true; // tells onAuthStateChanged not to boot the student UI meanwhile
            let redirecting = false;
            try {
                const cred = await signInWithEmailAndPassword(auth, email, pass);
                let isAdminAccount = false;
                try {
                    isAdminAccount = (await getDoc(doc(db, 'admins', cred.user.uid))).exists();
                } catch (e) {
                    try { await signOut(auth); } catch (_) {}
                    throw e;
                }
                if (!isAdminAccount) {
                    try { await signOut(auth); } catch (_) {}
                    return 'not-admin';
                }
                redirecting = true;
                // عنوان صفحة الطالب الحالية — admin.html بيرجّع له المشرف عند تسجيل الخروج
                try { sessionStorage.setItem('atlasya_student_url', location.pathname); } catch (e) {}
                sessionStorage.setItem('atlasya_admin_handoff', '1');
                window.location.href = 'admin.html';
                return 'redirecting-to-admin';
            } finally {
                if (!redirecting) window._supervisorLoginInProgress = false;
            }
        };
        window._doSignUp = async (fName, lName, phone, email, pass, affiliate, referredBy) => {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName: fName, lastName: lName,
                phone, email, academicLevel: "Level 1",
                affiliate: affiliate || '',
                plan: 'basic',
                uploadCount: 0,
                coins: 0,
                referralCount: 0,
                referredBy: referredBy || '',
                joinedAt: serverTimestamp()
            });
            window._notifyAdminsBot('new_signup', {
                studentName: ((fName || '') + ' ' + (lName || '')).trim() || email,
                affiliate: affiliate || '',
                referred: !!referredBy
            });
            if (referredBy && referredBy !== cred.user.uid) {
                try {
                    const reward = await window._applyCoinBoost(referredBy, 30);
                    await updateDoc(doc(db, "users", referredBy), {
                        coins: increment(reward),
                        coinsEarnedTotal: increment(reward),
                        referralCoinsEarned: increment(reward),
                        referralCount: increment(1)
                    });
                    await addDoc(collection(db, 'coin_transactions'), {
                        userId: referredBy, type: 'earn', amount: reward,
                        reasonAR: 'مكافأة دعوة صديق جديد', reasonEN: 'Reward for inviting a new friend',
                        createdAt: serverTimestamp()
                    });
                } catch(e) { console.error('referral reward error:', e); }
            }
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
            const adminSnap = await getDoc(doc(db, 'admins', user.uid));
            if (adminSnap.exists()) {
                sessionStorage.setItem('atlasya_admin_handoff', '1');
                window.location.href = 'admin.html';
                return 'redirecting-to-admin';
            }
            // Create a user profile doc if this is the user's first sign-in
            const snap = await getDoc(doc(db, "users", user.uid));
            if (!snap.exists()) {
                const displayName = user.displayName || '';
                const parts = displayName.trim().split(/\s+/);
                const firstName = parts.shift() || '';
                const lastName = parts.join(' ');
                let referredBy = '';
                try { referredBy = localStorage.getItem('pendingReferralUid') || ''; } catch(e) {}
                await setDoc(doc(db, "users", user.uid), {
                    firstName, lastName,
                    email: user.email || '',
                    academicLevel: "Level 1",
                    affiliate: '',
                    profileImg: user.photoURL || '',
                    coins: 0,
                    referralCount: 0,
                    referredBy
                });
                if (referredBy && referredBy !== user.uid) {
                    try {
                        const reward = await window._applyCoinBoost(referredBy, 30);
                        await updateDoc(doc(db, "users", referredBy), {
                            coins: increment(reward),
                            coinsEarnedTotal: increment(reward),
                            referralCoinsEarned: increment(reward),
                            referralCount: increment(1)
                        });
                        await addDoc(collection(db, 'coin_transactions'), {
                            userId: referredBy, type: 'earn', amount: reward,
                            reasonAR: 'مكافأة دعوة صديق جديد', reasonEN: 'Reward for inviting a new friend',
                            createdAt: serverTimestamp()
                        });
                        localStorage.removeItem('pendingReferralUid');
                    } catch(e) { console.error('referral reward error:', e); }
                }
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

        /* ─── SPATIAL DATA LIBRARY (read) ─── */
        window._loadSpatialDatasets = async () => {
            const snap = await getDocs(collection(db, 'spatial_datasets'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        };
        window._loadSpatialProjects = async () => {
            const snap = await getDocs(collection(db, 'spatial_projects'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        };
        window._incrementDatasetDownload = async (id, current, item) => {
            await updateDoc(doc(db, 'spatial_datasets', id), { downloads: (current || 0) + 1 });
            window._notifyAdminsBot('resource_download', { studentName: window._botStudentName(), kind: 'dataset', title: window._botItemName(item, id) });
        };

        /* ─── ANTI COPY-LINK PROTECTION (datasets & GIS tools) ───
           Blocks the right-click/long-press menu on download cards (so "Copy Link"
           never has a real file URL to grab — see the javascript:void(0) hrefs) and
           logs each attempt against the user, so repeat offenders are visible to
           admins even though the block itself is silent to the student. */
        window._blockCopyAttempt = function(ev) {
            try {
                if (currentUid) {
                    updateDoc(doc(db, 'users', currentUid), {
                        copyAttempts: increment(1),
                        lastCopyAttemptAt: serverTimestamp()
                    }).catch(() => {
                        // doc might not have the field yet on very old accounts — seed it
                        setDoc(doc(db, 'users', currentUid), { copyAttempts: 1, lastCopyAttemptAt: serverTimestamp() }, { merge: true }).catch(() => {});
                    });
                }
            } catch (e) {}
            return false; // still blocks the native context menu either way
        };

        /* ─── SOFTWARE TOOLS (read) ─── */
        window._loadSoftwareTools = async () => {
            const snap = await getDocs(collection(db, 'software_tools'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        };
        window._incrementToolDownload = async (id, current, item) => {
            await updateDoc(doc(db, 'software_tools', id), { downloads: (current || 0) + 1 });
            window._notifyAdminsBot('resource_download', { studentName: window._botStudentName(), kind: 'software', title: window._botItemName(item, id) });
        };

        /* ─── PORTFOLIO (STUDENT MAPS) ─── */
        window._submitPortfolioItem = async (data) => {
            if (!currentUid) throw new Error('غير مسجل الدخول');
            const authorName = ((window._userData?.firstName || '') + ' ' + (window._userData?.lastName || '')).trim() || 'User';
            await addDoc(collection(db, 'portfolio_items'), {
                ...data,
                uid: currentUid,
                authorName,
                createdAt: serverTimestamp()
            });
            window._notifyAdminsBot('portfolio_map', { studentName: authorName, title: data.title || data.titleAR || data.titleEN || '' });
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

        /* ─── DIGITAL LIBRARY (ATLASYA) — student-facing ─── */
        window._loadLibraryBooks = async () => {
            const snap = await getDocs(collection(db, 'library_books'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => !b.hidden);
        };
        window._incrementBookViews = async (id) => {
            try { await updateDoc(doc(db, 'library_books', id), { views: increment(1) }); } catch(e) {}
        };
        window._incrementBookDownloads = async (id, item) => {
            try { await updateDoc(doc(db, 'library_books', id), { downloads: increment(1) }); } catch(e) {}
            window._notifyAdminsBot('resource_download', { studentName: window._botStudentName(), kind: 'book', title: window._botItemName(item, id) });
        };
        window._toggleFavoriteBook = async (bookId, isFav) => {
            if (!currentUid) throw new Error('Not logged in');
            await updateDoc(doc(db, 'users', currentUid), {
                favoriteBooks: isFav ? arrayUnion(bookId) : arrayRemove(bookId)
            });
        };
        window._rateBook = async (bookId, uid, value, title) => {
            const field = `ratings.${uid}`;
            await updateDoc(doc(db, 'library_books', bookId), { [field]: value });
            window._notifyAdminsBot('book_rating', { studentName: window._botStudentName(), title: title || '', value });
        };

        /* ─── PLAYLISTS (ATLASYA) — student-facing ─── */
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
        window._loadPlaylistVideos = async (playlistId) => {
            const snap = await getDocs(collection(db, 'playlists', playlistId, 'videos'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
            window._notifyAdminsBot('mentorship_booking', {
                studentName: ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User',
                slotLabel: slotData.label || ''
            });
            // Mark slot as taken if slotId provided
            if (slotData.slotId) {
                try { await updateDoc(doc(db, 'mentorship_slots', slotData.slotId), { taken: true }); } catch(e) {}
            }
        };

        // تنبيهات الأدمن الشخصية للطالب (بتتحمّل من هنا لأن query/getDocs مش متاحين برّه الـ module)
        window._loadMyAdminAlerts = async () => {
            if (!currentUid) return [];
            const snap = await getDocs(query(collection(db, 'admin_alerts'), where('toUid', '==', currentUid), limit(10)));
            const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
            snap.docs.forEach(async d => {
                if (!d.data().read) {
                    try { await updateDoc(doc(db, 'admin_alerts', d.id), { read: true }); } catch (e) {}
                }
            });
            return alerts;
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
            const authorName = ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User';
            await addDoc(collection(db, 'mentorship_requests'), {
                uid: currentUid,
                authorName,
                email: d.email || '',
                phone: d.phone || '',
                message: message || '',
                preferredDay: preferredDay || '',
                preferredTime: preferredTime || '',
                replied: false,
                reply: '',
                createdAt: serverTimestamp()
            });
            window._notifyAdminsBot('expert_question', { studentName: authorName, message: message || '' });
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
            const studentName = ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User';
            await addDoc(collection(db, 'support_tickets'), {
                uid: currentUid,
                studentName,
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
            window._notifyAdminsBot('support_ticket', { studentName, ticketType: data.type, message: data.message });
        };
        // Real-time listener for student's own tickets
        window._subscribeMyTickets = (callback, onError) => {
            if (!currentUid) return () => {};
            // الاستعلام لازم يتقيّد بـ uid الطالب نفسه في Firestore (مش فلترة في المتصفح):
            // قواعد الأمان بترفض أي listener ممكن يرجّع تذاكر ناس تانية، فالاستعلام
            // القديم (كل التذاكر + فلترة محلية) كان بيتقفل بـ permission-denied.
            // من غير orderBy عشان ما نحتاجش composite index — الترتيب بيتم هنا.
            const q = query(collection(db, 'support_tickets'), where('uid', '==', currentUid));
            return onSnapshot(q, snap => {
                const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const ms = t => (t.createdAt && t.createdAt.toMillis) ? t.createdAt.toMillis() : Date.now();
                tickets.sort((a, b) => ms(b) - ms(a));
                callback(tickets);
            }, err => {
                console.error('support_tickets listener error:', err);
                if (onError) onError(err);
            });
        };
        // Real-time listener for admin: all tickets from all students
        window._subscribeAllTickets = (callback) => {
            const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
            return onSnapshot(q, snap => {
                callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, err => console.error('support_tickets (admin) listener error:', err));
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

        /* ─── TELEGRAM ADMIN BOT NOTIFICATIONS ───
           بتبعت حدث (تذكرة دعم، لفة عجلة حظ...) لجروب الأدمنز عن طريق Worker
           وسيط بيمسك التوكن بدل ما يبقى هنا في كود الموقع. شوف
           atlasya-notify-bot/README.md لتفاصيل التركيب.
           "Fire and forget": لو الإشعار فشل مش بيوقف أي حاجة تانية بتحصل للطالب. */
        const ADMIN_BOT_WORKER_URL = 'https://atlasya-notify-bot.atlasyateam26.workers.dev/notify';
        window._notifyAdminsBot = async (type, data, authInstance) => {
            try {
                const authObj = authInstance || auth;
                if (!authObj || !authObj.currentUser) return;
                const idToken = await authObj.currentUser.getIdToken();
                await fetch(ADMIN_BOT_WORKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken, type, data })
                });
            } catch (e) {
                console.error('admin bot notify error:', e);
            }
        };
        // أدوات مساعدة لإشعارات الأدمن: اسم الطالب الحالي + اسم أي عنصر (كتاب/برنامج/داتا)
        window._botStudentName = () => {
            const d = window._userData || {};
            return ((d.firstName || '') + ' ' + (d.lastName || '')).trim() || d.email || 'طالب';
        };
        window._botItemName = (o, fb) => {
            if (!o) return String(fb || '');
            return String(o.titleAR || o.title || o.titleEN || o.nameAR || o.name || o.nameEn || o.nameEN || fb || '').slice(0, 120);
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
            if (!isAdminUser) {
                window._notifyAdminsBot('job_post', { studentName: authorName, jobTitle: data.title || '', company: data.company || '' });
            }
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

        /* ─── COURSES (Firestore) ─── */
        window._loadCoursesRealtime = (callback) => {
            const q = query(collection(db, 'courses'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
            return onSnapshot(q, snap => {
                callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, () => {
                // fallback without where+orderBy composite (in case index missing)
                const q2 = query(collection(db, 'courses'), where('status', '==', 'approved'));
                getDocs(q2).then(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
            });
        };
        window._loadFreeCourses = async () => {
            const q = query(collection(db, 'free_courses'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };
        window._incrementCourseView = async (courseId) => {
            try { await updateDoc(doc(db, 'courses', courseId), { views: increment(1) }); } catch(e) {}
        };
        window._incrementCourseInterest = async (courseId) => {
            await updateDoc(doc(db, 'courses', courseId), { interestedCount: increment(1) });
        };
        /* ─── COMPANY ACCOUNTS (Firestore) — for future company portal ─── */
        window._loadCompanyById = async (companyId) => {
            const snap = await getDoc(doc(db, 'companies', companyId));
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        };

        /* ─── ADMIN TEAM ACCOUNTS (Firestore) ─── */
        window._createTeamAccount = async (data) => {
            return await addDoc(collection(db, 'admin_team'), { ...data, createdAt: serverTimestamp() });
        };
        window._loadTeamAccounts = async () => {
            const q = query(collection(db, 'admin_team'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };
        window._findTeamAccount = async (username, password) => {
            const q = query(collection(db, 'admin_team'), where('username', '==', username));
            const snap = await getDocs(q);
            const match = snap.docs.find(d => d.data().password === password);
            return match ? { id: match.id, ...match.data() } : null;
        };
        window._deleteTeamAccount = async (id) => {
            await deleteDoc(doc(db, 'admin_team', id));
        };
        window._updateTeamPermissions = async (id, permissions) => {
            await updateDoc(doc(db, 'admin_team', id), { permissions });
        };

        /* ─── CV BUILDER (Pro feature, Firestore) ─── */
        window._submitCVRequest = async (data) => {
            if (!currentUid) throw new Error('Not logged in');
            const d = window._userData || {};
            const authorName = ((d.firstName || '') + ' ' + (d.lastName || '')).trim() || 'Member';
            const isFirstSubmit = !window._myCVCreatedAt;
            await setDoc(doc(db, 'cv_requests', currentUid), {
                ...data,
                uid: currentUid,
                authorName,
                authorEmail: d.email || '',
                status: 'pending',
                updatedAt: serverTimestamp(),
                createdAt: window._myCVCreatedAt || serverTimestamp()
            }, { merge: true });
            window._notifyAdminsBot('cv_request', { studentName: authorName, targetTitle: data.targetTitle || '', isUpdate: !isFirstSubmit });
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
        window._isPro = () => window._getUserPlan() === 'pro' || (window._hasActiveTempProFeature ? window._hasActiveTempProFeature() : false);

        /* ── EmailJS (optional) — fill these in from your EmailJS dashboard to enable
           automatic emails when a subscription request is approved/rejected.
           Leave PUBLIC_KEY empty to keep email sending disabled (no errors, just skipped). ── */
        window.EMAILJS_CONFIG = { PUBLIC_KEY: '', SERVICE_ID: '', TEMPLATE_ID: '' };
        if (window.EMAILJS_CONFIG.PUBLIC_KEY && typeof emailjs !== 'undefined') {
            try { emailjs.init({ publicKey: window.EMAILJS_CONFIG.PUBLIC_KEY }); } catch (e) {}
        }
        /* Sends an email via EmailJS if configured; silently no-ops otherwise so the
           approve/reject flow never breaks because of missing email setup. */
        window._sendSubscriptionEmail = async (toEmail, toName, subject, message) => {
            try {
                if (!window.EMAILJS_CONFIG.PUBLIC_KEY || typeof emailjs === 'undefined' || !toEmail) return;
                await emailjs.send(window.EMAILJS_CONFIG.SERVICE_ID, window.EMAILJS_CONFIG.TEMPLATE_ID, {
                    to_email: toEmail, to_name: toName || '', subject, message
                });
            } catch (e) { /* email is best-effort only */ }
        };

        /* Fetches this student's most recent upgrade/subscription request (no
           orderBy in the query to avoid needing a composite Firestore index —
           results are sorted client-side, matching the pattern used elsewhere
           in this app for admin_alerts / portfolio_items). */
        window._getMyLatestUpgradeRequest = async () => {
            if (!currentUid) return null;
            const q = query(collection(db, 'upgrade_requests'), where('uid', '==', currentUid));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (!all.length) return null;
            all.sort((a, b) => {
                const ta = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
                const tb = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
                return tb - ta;
            });
            return all[0];
        };

        window._sendUpgradeRequest = async (extra) => {
            if (!currentUid) throw new Error('Not logged in');
            // Block a second request while one is still pending review
            const existing = await window._getMyLatestUpgradeRequest();
            if (existing && existing.status === 'pending') {
                const err = new Error('duplicate-pending');
                err.code = 'duplicate-pending';
                throw err;
            }
            extra = extra || {};
            const d = window._userData || {};
            await addDoc(collection(db, 'upgrade_requests'), {
                uid: currentUid,
                firstName: extra.firstNameOverride || d.firstName || '',
                lastName: extra.lastNameOverride || d.lastName || '',
                email: extra.email || d.email || '',
                phone: d.phone || '',
                username: extra.username || '',
                paymentMethod: extra.paymentMethod || '',
                months: extra.months || 1,
                amount: extra.amount || 0,
                paymentDate: extra.paymentDate || '',
                screenshot: extra.screenshot || '',
                discountCode: extra.discountCode || '',
                discountPercent: extra.discountPercent || 0,
                requestedAt: serverTimestamp(),
                status: 'pending',
                rejectionReason: null,
                reviewedAt: null,
                approvedMonths: null
            });
            window._notifyAdminsBot('upgrade_request', {
                studentName: ((extra.firstNameOverride || d.firstName || '') + ' ' + (extra.lastNameOverride || d.lastName || '')).trim() || window._botStudentName(),
                months: extra.months || 1,
                amount: extra.amount || 0,
                paymentMethod: extra.paymentMethod || '',
                discountCode: extra.discountCode || '',
                discountPercent: extra.discountPercent || 0
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

        /* One-time free trial: instantly grants 1 month of Pro, starting now, with
           no payment/review step. بيتنفّذ من المتصفح: بنقرا freeTrialUsed من مستند الطالب،
           ولو لسه ما استخدمهاش بنفعّل الـ PRO ونعلّم freeTrialUsed:true في نفس الكتابة. */
        window._claimFreeTrial = async () => {
            if (!currentUid) throw new Error('Not logged in');
            const userRef = doc(db, 'users', currentUid);
            const snap = await getDoc(userRef);
            const data = snap.exists() ? snap.data() : {};
            if (data.freeTrialUsed === true) {
                const err = new Error('trial-used');
                err.code = 'trial-used';
                throw err;
            }
            // لو الطالب أصلًا PRO شغّال، الشهر بيتضاف فوق اشتراكه بدل ما يبدأ من أول
            let base = new Date();
            if (data.plan === 'pro' && data.proExpiresAt) {
                const cur = data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt);
                if (cur > base) base = cur;
            }
            const expiry = new Date(base);
            expiry.setMonth(expiry.getMonth() + 1);
            const payload = { plan: 'pro', proExpiresAt: Timestamp.fromDate(expiry), freeTrialUsed: true };
            if (data.plan !== 'pro') payload.proStartAt = serverTimestamp();
            await updateDoc(userRef, payload);
            // keep local cache in sync so the UI reflects Pro immediately
            window._userData = { ...(window._userData || {}), plan: 'pro', proExpiresAt: Timestamp.fromDate(expiry), freeTrialUsed: true };
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

        /* ─── TIPS STAGES (box/level system) ─── */
        window._loadDailyTips = async () => {
            const q = query(collection(db, 'daily_tips'), orderBy('createdAt', 'asc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };
        window._toggleTipLike = async (tipId, liked) => {
            if (!currentUid) throw new Error('Not logged in');
            await updateDoc(doc(db, 'users', currentUid), {
                tipLikes: liked ? arrayUnion(tipId) : arrayRemove(tipId)
            });
            await setDoc(doc(db, 'daily_tips', tipId), {
                likes: increment(liked ? 1 : -1)
            }, { merge: true });
            if (window._userData) {
                const arr = window._userData.tipLikes || [];
                window._userData.tipLikes = liked ? [...new Set([...arr, tipId])] : arr.filter(x => x !== tipId);
            }
        };
        // records which student shared which tip, so admins can see who shared what
        window._trackTipShare = async (tipId) => {
            if (!currentUid) return;
            await setDoc(doc(db, 'users', currentUid), {
                tipShares: arrayUnion(tipId)
            }, { merge: true });
            await setDoc(doc(db, 'daily_tips', tipId), {
                shares: increment(1)
            }, { merge: true });
            if (window._userData) {
                const arr = window._userData.tipShares || [];
                window._userData.tipShares = [...new Set([...arr, tipId])];
            }
        };
        // kicks off the student's personal 24h-per-box journey the first time they open the tips page
        window._startTipsJourney = async () => {
            if (!currentUid) throw new Error('Not logged in');
            const nowIso = new Date().toISOString();
            await setDoc(doc(db, 'users', currentUid), { tipsStartedAt: nowIso, tipsLastShownStage: 0 }, { merge: true });
            if (window._userData) { window._userData.tipsStartedAt = nowIso; window._userData.tipsLastShownStage = 0; }
            return nowIso;
        };
        // remembers which box was last auto-popped-up so we don't re-show it every visit
        window._markTipStageShown = async (stageIdx) => {
            if (!currentUid) return;
            await setDoc(doc(db, 'users', currentUid), { tipsLastShownStage: stageIdx }, { merge: true });
            if (window._userData) window._userData.tipsLastShownStage = stageIdx;
        };

        /* ─── COIN WALLET SYSTEM (ATLAS Coins) ─── */
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

        // Logs one earn/spend entry to the student's coin history (so they can always
        // see where coins came from and where they went).
        window._logCoinTransaction = async (uid, type, amount, reasonAR, reasonEN, extra) => {
            await addDoc(collection(db, 'coin_transactions'), {
                userId: uid, type, amount,
                reasonAR: reasonAR || '', reasonEN: reasonEN || reasonAR || '',
                createdAt: serverTimestamp(),
                ...(extra || {})
            });
        };

        window._loadCoinTransactions = async (uid, max) => {
            // NOTE: filtering by userId + ordering by createdAt in the same Firestore query
            // needs a composite index. If that index isn't created in the Firebase console,
            // Firestore throws a "failed-precondition" error — which used to be swallowed
            // silently by the caller, making real transactions (e.g. wheel wins) look like
            // they never happened. To avoid depending on that index entirely, we only filter
            // by userId here and sort client-side instead.
            const q = query(
                collection(db, 'coin_transactions'),
                where('userId', '==', uid)
            );
            const snap = await getDocs(q);
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            rows.sort((a, b) => {
                const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return tb - ta;
            });
            return rows.slice(0, max || 30);
        };

        // Loads a student's past fortune-wheel spins (basic + gift), newest first. Same
        // "filter only, sort client-side" pattern as _loadCoinTransactions to avoid needing
        // a composite Firestore index.
        window._loadWheelSpinsHistory = async (uid, max) => {
            const q = query(
                collection(db, 'wheel_spins'),
                where('userId', '==', uid)
            );
            const snap = await getDocs(q);
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            rows.sort((a, b) => {
                const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return tb - ta;
            });
            return rows.slice(0, max || 50);
        };

        // Extends (or starts) a user's ATLASYA PRO subscription by N months — stacks on
        // top of a still-active subscription instead of resetting it.
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
            const payload = {
                plan: 'pro',
                proExpiresAt: Timestamp.fromDate(newExpiry)
            };
            if (data.plan !== 'pro') payload.proStartAt = serverTimestamp();
            await updateDoc(doc(db, 'users', uid), payload);
            if (uid === currentUid) {
                window._userData = { ...(window._userData || {}), plan: 'pro', proExpiresAt: Timestamp.fromDate(newExpiry) };
            }
        };

        // Redeems one configured tier for the logged-in student: deducts coins immediately,
        // then either grants PRO instantly (auto-approve) or files a pending admin request.
        window._redeemCoinTier = async (tierIndex) => {
            if (!currentUid) throw new Error('Not logged in');
            const settings = await window._loadCoinSettings();
            if (!settings.redemptionEnabled) { const e = new Error('Redemption disabled'); e.code = 'disabled'; throw e; }
            const tier = (settings.tiers || [])[tierIndex];
            if (!tier) throw new Error('Invalid tier');
            const balance = window._userData?.coins || 0;
            if (balance < tier.coins) { const e = new Error('Insufficient balance'); e.code = 'insufficient'; throw e; }

            await updateDoc(doc(db, 'users', currentUid), {
                coins: increment(-tier.coins),
                coinsSpentTotal: increment(tier.coins)
            });
            window._userData.coins = balance - tier.coins;
            window._userData.coinsSpentTotal = (window._userData.coinsSpentTotal || 0) + tier.coins;

            const monthsAR = tier.months === 1 ? 'شهر' : `${tier.months} أشهر`;
            const monthsEN = tier.months === 1 ? '1 month' : `${tier.months} months`;
            const reasonAR = `استبدال ${tier.coins} عملة مقابل ${monthsAR} من ATLASYA PRO`;
            const reasonEN = `Redeemed ${tier.coins} coins for ${monthsEN} of ATLASYA PRO`;

            if (settings.autoApprove) {
                await window._grantProMonths(currentUid, tier.months);
                await window._logCoinTransaction(currentUid, 'spend', tier.coins, reasonAR, reasonEN, { status: 'approved', months: tier.months });
            } else {
                await addDoc(collection(db, 'coin_redemption_requests'), {
                    userId: currentUid,
                    userName: `${window._userData?.firstName || ''} ${window._userData?.lastName || ''}`.trim(),
                    months: tier.months,
                    coins: tier.coins,
                    status: 'pending',
                    requestedAt: serverTimestamp()
                });
                await window._logCoinTransaction(currentUid, 'spend', tier.coins, reasonAR, reasonEN, { status: 'pending', months: tier.months });
            }
            window._notifyAdminsBot('coin_redemption', {
                studentName: window._botStudentName(),
                coins: tier.coins,
                months: tier.months,
                autoApproved: !!settings.autoApprove
            });
            return { autoApprove: settings.autoApprove, months: tier.months };
        };

        /* ─── DAILY & WEEKLY CHALLENGE (one scheduled question per calendar date) ─── */
        window._loadDailyChallengeQs = async () => {
            const snap = await getDocs(collection(db, 'daily_challenges'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };
        const DEFAULT_WEEKLY_CHALLENGE_SETTINGS = { enabled: true, bonusCoins: 100 };
        window._loadWeeklyChallengeSettings = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'weeklyChallenge'));
                if (snap.exists()) return { ...DEFAULT_WEEKLY_CHALLENGE_SETTINGS, ...snap.data() };
            } catch(e) { console.error('loadWeeklyChallengeSettings error:', e); }
            return DEFAULT_WEEKLY_CHALLENGE_SETTINGS;
        };
        // Sunday (YYYY-MM-DD) of the week containing dateStr — used to group weekly questions.
        window._dcWeekStartOf = (dateStr) => {
            const d = new Date(dateStr + 'T00:00:00');
            d.setDate(d.getDate() - d.getDay());
            return d.toISOString().slice(0, 10);
        };
        // مفتاح الإجابة في مستند منفصل (daily_challenge_keys/{id}) — الـ Rules بتسمح للطالب يقراه
        // بس بعد ما يكون سجّل محاولته على السؤال ده.
        window._getChallengeKey = async (questionId) => {
            try {
                const snap = await getDoc(doc(db, 'daily_challenge_keys', questionId));
                return (snap.exists() && typeof snap.data().correctIndex === 'number') ? snap.data().correctIndex : null;
            } catch (e) { return null; }
        };
        window._getChallengeAttempt = async (questionId) => {
            if (!currentUid) return null;
            const snap = await getDoc(doc(db, 'daily_challenge_attempts', `${currentUid}_${questionId}`));
            return snap.exists() ? snap.data() : null;
        };
        // بيضيف كوينز (بعد ما المضاعفة اتطبّقت عليها) لحساب الطالب الحالي، ويحدّث الكاش،
        // ويسجّلها في سجل العملات.
        async function awardCoinsToMe(finalAmount, reasonAR, reasonEN) {
            if (!finalAmount || finalAmount <= 0) return;
            await updateDoc(doc(db, 'users', currentUid), { coins: increment(finalAmount), coinsEarnedTotal: increment(finalAmount) });
            if (window._userData) {
                window._userData.coins = (window._userData.coins || 0) + finalAmount;
                window._userData.coinsEarnedTotal = (window._userData.coinsEarnedTotal || 0) + finalAmount;
            }
            try { await window._logCoinTransaction(currentUid, 'earn', finalAmount, reasonAR, reasonEN); }
            catch (e) { console.error('coin tx log error:', e); }
        }

        /* ── ساعة السيرفر: اليوم بيتحسب من وقت Firestore مش من ساعة جهاز الطالب ──
           (معرّفة هنا جوه الـ module عشان تشوف db/setDoc/currentUid) */
        const _dcClockState = window._dcClock = window._dcClock || { base: null, perf: 0, syncedAt: 0 };
        window._dcSyncClock = async function (force) {
            try {
                if (!force && _dcClockState.base !== null && performance.now() - _dcClockState.syncedAt < 5 * 60 * 1000) return true;
                if (!currentUid) return false;
                const work = (async () => {
                    const ref = doc(db, 'challenge_clock', currentUid);
                    const t0 = performance.now();
                    await setDoc(ref, { t: serverTimestamp() });
                    const snap = await getDoc(ref);
                    const t1 = performance.now();
                    const ts = snap.exists() ? snap.data().t : null;
                    if (!ts || !ts.toMillis) return false;
                    _dcClockState.base = ts.toMillis() + (t1 - t0) / 2;
                    _dcClockState.perf = t1;
                    _dcClockState.syncedAt = t1;
                    return true;
                })();
                // مهلة 4 ثواني: لو السيرفر مردّش نكمّل بساعة الجهاز بدل ما الصفحة تفضل تحمّل
                return await Promise.race([work, new Promise(r => setTimeout(() => r(false), 4000))]);
            } catch (e) { console.error('server clock sync failed, using device clock:', e); return false; }
        };
        window.dcCairoTodayModule = () => (typeof window.dcCairoToday === 'function' ? window.dcCairoToday() : new Date().toISOString().slice(0, 10));

        // Records the student's one-time answer for a scheduled question, awards coins on a
        // correct answer, and (for weekly questions) checks whether that unlocks the weekly bonus.
        // الإجابة الصح وقيمة الكوينز بتتقرا من مستند السؤال نفسه (daily_challenges/{id}).
        window._submitDailyChallengeAnswer = async (question, selectedIndex) => {
            if (!currentUid) throw new Error('Not logged in');
            const attemptRef = doc(db, 'daily_challenge_attempts', `${currentUid}_${question.id}`);
            if ((await getDoc(attemptRef)).exists()) { const err = new Error('Already answered'); err.code = 'already'; throw err; }

            await window._dcSyncClock();
            let qData = question;
            if (typeof qData.coins !== 'number' || !qData.type) {
                const qSnap = await getDoc(doc(db, 'daily_challenges', question.id));
                if (!qSnap.exists()) throw new Error('Question not found');
                qData = { ...question, ...qSnap.data() };
            }
            if (qData.type === 'weekly' && typeof window._dcCanAnswerWeekly === 'function' && !window._dcCanAnswerWeekly(question.id)) {
                const err = new Error('Weekly chest is locked'); err.code = 'locked'; throw err;
            }
            if (qData.type !== 'weekly' && qData.scheduledDate && qData.scheduledDate !== window.dcCairoTodayModule()) {
                const err = new Error('Question is not open today'); err.code = 'locked'; throw err;
            }

            // 1) المحاولة بتتسجل الأول بالاختيار بس (id ثابت = uid_questionId) — من غير نتيجة.
            await setDoc(attemptRef, {
                userId: currentUid,
                questionId: question.id,
                type: qData.type || 'daily',
                scheduledDate: qData.scheduledDate || '',
                selectedIndex,
                answeredAt: serverTimestamp()
            });
            // 2) بعد كده بس نقدر نقرا مفتاح الإجابة (الـ Rules بتفتحه بعد وجود المحاولة)
            let keyIdx = await window._getChallengeKey(question.id);
            if (typeof keyIdx !== 'number' && typeof qData.correctIndex === 'number') keyIdx = qData.correctIndex; // أسئلة قديمة لسه مترحّلتش
            if (typeof keyIdx !== 'number') throw new Error('Question has no answer key — open it in the admin panel and save it again');
            const correct = selectedIndex === keyIdx;
            const baseCoins = qData.type === 'weekly' ? (qData.coins || 70) : (qData.coins || 0);
            const coinsAwarded = correct ? await window._applyCoinBoost(currentUid, baseCoins, window._userData) : 0;
            await updateDoc(attemptRef, { correct, coinsAwarded });
            await awardCoinsToMe(coinsAwarded, 'إجابة صحيحة في التحدي', 'Correct challenge answer');

            // الصندوق بقى هو المكافأة (سؤال أسبوعي بعد 7 أيام صح) — مفيش مكافأة إكمال تانية
            const weeklyBonus = null;

            const d = window._userData || {};
            const studentName = ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || 'User';
            window._notifyAdminsBot('challenge_answer', { studentName, correct, coinsAwarded, challengeType: qData.type });
            return { correct, coinsAwarded, weeklyBonus, correctIndex: keyIdx };
        };
        window._getWeeklyBonusClaim = async (weekStart) => {
            if (!currentUid) return null;
            const snap = await getDoc(doc(db, 'weekly_challenge_claims', `${currentUid}_${weekStart}`));
            return snap.exists() ? snap.data() : null;
        };
        // Returns the student's most recent challenge attempts (daily + weekly), newest first —
        // used to render the "past challenges" history log on the Challenges hub screen.
        window._getMyChallengeAttempts = async (n) => {
            if (!currentUid) return [];
            try {
                // equality على userId بس (من غير orderBy) عشان ما نحتاجش composite index —
                // الترتيب والـ limit بيتعملوا هنا في المتصفح.
                const q = query(collection(db, 'daily_challenge_attempts'), where('userId', '==', currentUid));
                const snap = await getDocs(q);
                const ms = t => (t && t.toMillis) ? t.toMillis() : 0;
                return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => ms(b.answeredAt) - ms(a.answeredAt))
                    .slice(0, n || 30);
            } catch(e) { console.error('getMyChallengeAttempts error:', e); return []; }
        };
        // Awards the one-time weekly completion bonus once every weekly question in the
        // student's current week has a correct attempt logged, then marks the week as claimed.
        window._maybeAwardWeeklyBonus = async (dateStr) => {
            if (!currentUid) return null;
            const weekStart = window._dcWeekStartOf(dateStr);
            const claimRef = doc(db, 'weekly_challenge_claims', `${currentUid}_${weekStart}`);
            const already = await getDoc(claimRef);
            if (already.exists()) return null;
            const settings = await window._loadWeeklyChallengeSettings();
            if (!settings.enabled) return null;
            const all = await window._loadDailyChallengeQs();
            const weekQs = all.filter(q => q.type === 'weekly' && window._dcWeekStartOf(q.scheduledDate) === weekStart);
            if (!weekQs.length) return null;
            const attempts = await Promise.all(weekQs.map(q => getDoc(doc(db, 'daily_challenge_attempts', `${currentUid}_${q.id}`))));
            const allCorrect = attempts.every(a => a.exists() && a.data().correct);
            if (!allCorrect) return null;
            const bonus = await window._applyCoinBoost(currentUid, settings.bonusCoins || 0, window._userData);
            if (bonus > 0) {
                await updateDoc(doc(db, 'users', currentUid), { coins: increment(bonus), coinsEarnedTotal: increment(bonus) });
                if (window._userData) {
                    window._userData.coins = (window._userData.coins || 0) + bonus;
                    window._userData.coinsEarnedTotal = (window._userData.coinsEarnedTotal || 0) + bonus;
                }
                try { await window._logCoinTransaction(currentUid, 'earn', bonus, 'مكافأة إكمال التحدي الأسبوعي', 'Weekly challenge completion bonus'); }
                catch(e) { console.error('coin tx log error:', e); }
            }
            await setDoc(claimRef, { userId: currentUid, weekStartDate: weekStart, coinsAwarded: bonus, claimedAt: serverTimestamp() });
            return { coinsAwarded: bonus };
        };

        /* ─── FORTUNE WHEEL & GIFT WHEEL ─── */
        const DEFAULT_WHEEL_CONFIG = {
            enabled: true,
            cooldownHours: 24,
            testModeEnabled: false,
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
        window.DEFAULT_WHEEL_CONFIG = DEFAULT_WHEEL_CONFIG;

        window._loadWheelConfig = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'wheel'));
                if (snap.exists()) {
                    const d = snap.data();
                    return {
                        enabled: d.enabled !== false,
                        cooldownHours: d.cooldownHours || 24,
                        // Test mode: lets one specific account (usually the admin's own testing
                        // account) spin the wheel with no 24h wait, while everyone else keeps the
                        // normal cooldownHours untouched.
                        testModeEnabled: d.testModeEnabled === true,
                        testModeUid: d.testModeUid || '',
                        basic: { ...DEFAULT_WHEEL_CONFIG.basic, ...(d.basic || {}) },
                        gift: { ...DEFAULT_WHEEL_CONFIG.gift, ...(d.gift || {}) }
                    };
                }
            } catch(e) { console.error('loadWheelConfig error:', e); }
            return JSON.parse(JSON.stringify(DEFAULT_WHEEL_CONFIG));
        };

        // Weighted random pick — entriesObj = { key: { weight, ... } }. Returns the chosen key.
        window._pickWeighted = (entriesObj) => {
            const keys = Object.keys(entriesObj || {}).filter(k => (entriesObj[k].weight || 0) > 0);
            const total = keys.reduce((s, k) => s + (entriesObj[k].weight || 0), 0);
            if (!total) return keys[0] || null;
            let r = Math.random() * total;
            for (const k of keys) {
                r -= (entriesObj[k].weight || 0);
                if (r <= 0) return k;
            }
            return keys[keys.length - 1];
        };

        // Active coin-boost multiplier for a given user-data object (1 = no active boost).
        window._activeBoostMultiplier = (userData) => {
            const b = userData?.coinBoost;
            if (!b || !b.expiresAt) return 1;
            const exp = b.expiresAt.toDate ? b.expiresAt.toDate() : new Date(b.expiresAt);
            if (exp <= new Date()) return 1;
            return b.multiplier || 1;
        };

        // Applies any active coin boost on `uid` to `baseAmount`. Pass `knownUserData` when
        // it's already loaded in memory (the logged-in user) to skip an extra Firestore read.
        window._applyCoinBoost = async (uid, baseAmount, knownUserData) => {
            if (!baseAmount) return 0;
            let userData = knownUserData;
            if (!userData) {
                try {
                    const snap = await getDoc(doc(db, 'users', uid));
                    userData = snap.exists() ? snap.data() : null;
                } catch(e) { console.error('applyCoinBoost read error:', e); }
            }
            return Math.round(baseAmount * window._activeBoostMultiplier(userData));
        };

        // Whether the logged-in user currently has an active temporary PRO-feature unlock
        // (gift-wheel prize). Folded into window._isPro() below so every existing PRO gate
        // in the app automatically respects it.
        window._hasActiveTempProFeature = () => {
            const t = window._userData?.tempProFeature;
            if (!t || !t.expiresAt) return false;
            const exp = t.expiresAt.toDate ? t.expiresAt.toDate() : new Date(t.expiresAt);
            return exp > new Date();
        };

        window._getWheelState = async () => {
            if (!currentUid) return null;
            const snap = await getDoc(doc(db, 'users', currentUid));
            const d = snap.exists() ? snap.data() : {};
            const config = await window._loadWheelConfig();
            const bypassCooldown = config.testModeEnabled && config.testModeUid && config.testModeUid === currentUid;
            const cooldownMs = (config.cooldownHours || 24) * 3600000;
            const lastSpin = d.wheelLastSpinAt ? (d.wheelLastSpinAt.toDate ? d.wheelLastSpinAt.toDate() : new Date(d.wheelLastSpinAt)) : null;
            const nextAt = lastSpin ? new Date(lastSpin.getTime() + cooldownMs) : null;
            return {
                config,
                canSpinDaily: bypassCooldown || !nextAt || nextAt <= new Date(),
                nextSpinAt: bypassCooldown ? null : nextAt,
                extraSpins: d.wheelExtraSpins || 0,
                coinBoost: (window._activeBoostMultiplier(d) > 1) ? d.coinBoost : null,
                tempProFeature: window._hasActiveTempProFeature() ? d.tempProFeature : null
            };
        };

        function _currentStudentName() {
            const d = window._userData || {};
            return ((d.firstName||'') + ' ' + (d.lastName||'')).trim() || d.email || '';
        }

        // Spins the basic wheel. usingExtraSpin=true consumes a banked extra spin instead of
        // the daily attempt. الحساب والكول داون ومنح الكوينز كله بيتنفّذ من المتصفح
        // (الإعدادات من settings/wheel، والنتيجة بتتسجل في wheel_spins و coin_transactions).
        window._spinBasicWheel = async (usingExtraSpin) => {
            if (!currentUid) throw new Error('Not logged in');
            const config = await window._loadWheelConfig();
            if (!config.enabled) { const e = new Error('Wheel disabled'); e.code = 'disabled'; throw e; }

            const userRef = doc(db, 'users', currentUid);
            const snap = await getDoc(userRef);
            const ud = snap.exists() ? snap.data() : {};

            if (usingExtraSpin) {
                if ((ud.wheelExtraSpins || 0) <= 0) { const e = new Error('No extra spins'); e.code = 'no-extra'; throw e; }
            } else {
                const bypass = config.testModeEnabled && config.testModeUid && config.testModeUid === currentUid;
                const last = ud.wheelLastSpinAt ? (ud.wheelLastSpinAt.toDate ? ud.wheelLastSpinAt.toDate() : new Date(ud.wheelLastSpinAt)) : null;
                const cooldownMs = (config.cooldownHours || 24) * 3600000;
                if (!bypass && last && (Date.now() - last.getTime()) < cooldownMs) { const e = new Error('Cooldown'); e.code = 'cooldown'; throw e; }
            }

            const type = window._pickWeighted(config.basic);
            if (!type) throw new Error('Wheel is not configured');

            let coinsAwarded = 0;
            if (type === 'coin1' || type === 'coin2' || type === 'coin3') {
                coinsAwarded = await window._applyCoinBoost(currentUid, (config.basic[type] && config.basic[type].amount) || 0, ud);
            }
            const extraDelta = (usingExtraSpin ? -1 : 0) + (type === 'extraSpin' ? 1 : 0);

            // كل التغييرات على مستند الطالب في كتابة واحدة (لو فشلت مفيش حاجة بتتمنح)
            const patch = {};
            if (!usingExtraSpin) patch.wheelLastSpinAt = serverTimestamp();
            if (extraDelta !== 0) patch.wheelExtraSpins = increment(extraDelta);
            if (coinsAwarded > 0) { patch.coins = increment(coinsAwarded); patch.coinsEarnedTotal = increment(coinsAwarded); }
            await updateDoc(userRef, patch);

            if (window._userData) {
                if (coinsAwarded > 0) {
                    window._userData.coins = (window._userData.coins || 0) + coinsAwarded;
                    window._userData.coinsEarnedTotal = (window._userData.coinsEarnedTotal || 0) + coinsAwarded;
                }
                if (extraDelta !== 0) window._userData.wheelExtraSpins = Math.max(0, (window._userData.wheelExtraSpins || 0) + extraDelta);
                if (!usingExtraSpin) window._userData.wheelLastSpinAt = Timestamp.now();
            }

            // سجلات (مش حرجة — لو فشلت الجائزة تفضل ممنوحة)
            if (coinsAwarded > 0) {
                try { await window._logCoinTransaction(currentUid, 'earn', coinsAwarded, 'ربحت من عجلة الحظ', 'Won from the fortune wheel'); }
                catch (e) { console.error('coin tx log error:', e); }
            }
            try {
                await addDoc(collection(db, 'wheel_spins'), {
                    userId: currentUid, userName: _currentStudentName(),
                    wheelType: 'basic', resultType: type, coinsAwarded,
                    usedExtraSpin: !!usingExtraSpin, createdAt: serverTimestamp()
                });
            } catch (e) { console.error('wheel spin log error:', e); }

            if (type === 'gift') window._giftSpinAllowed = true; // بيفتح لفة واحدة في عجلة الهدايا

            window._notifyAdminsBot('wheel_spin', { studentName: _currentStudentName() || 'User', wheelType: 'basic', resultType: type });
            return { type, coinsAwarded };
        };

        // Spins the gift wheel — only reachable right after landing on 🎁 on the basic wheel.
        window._spinGiftWheel = async () => {
            if (!currentUid) throw new Error('Not logged in');
            if (!window._giftSpinAllowed) { const e = new Error('Gift wheel not unlocked'); e.code = 'no-gift'; throw e; }

            const config = await window._loadWheelConfig();
            const type = window._pickWeighted(config.gift);
            if (!type) throw new Error('Gift wheel is not configured');
            const g = config.gift[type] || {};
            const userRef = doc(db, 'users', currentUid);
            let result, extra;

            if (type === 'promonth') {
                const months = g.months || 1;
                await window._grantProMonths(currentUid, months);
                result = { type, months };
                extra = { months };
            } else if (type === 'tempfeature') {
                const hours = g.hours || 24;
                const featureAR = g.featureAR || '', featureEN = g.featureEN || '';
                await updateDoc(userRef, { tempProFeature: { featureAR, featureEN, expiresAt: Timestamp.fromDate(new Date(Date.now() + hours * 3600000)) } });
                result = { type, hours, featureAR, featureEN };
                extra = { hours, featureAR, featureEN };
            } else if (type === 'discount') {
                const percent = g.percent || 10, requiredMonths = g.requiredMonths || 6, validDays = g.validDays || 14;
                const code = window._generateDiscountCode();
                const expiresAt = new Date(Date.now() + validDays * 86400000);
                await setDoc(doc(db, 'discount_codes', code), {
                    code, userId: currentUid, percent, requiredMonths,
                    used: false, usedAt: null,
                    createdAt: serverTimestamp(), expiresAt: Timestamp.fromDate(expiresAt)
                });
                window._notifyAdminsBot('discount_issued', { studentName: window._botStudentName(), code, percent, requiredMonths });
                result = { type, code, percent, requiredMonths, expiresAt };
                extra = { percent, requiredMonths, validDays, code };
            } else if (type === 'boost') {
                const multiplier = g.multiplier || 2, hours = g.hours || 24;
                await updateDoc(userRef, { coinBoost: { multiplier, expiresAt: Timestamp.fromDate(new Date(Date.now() + hours * 3600000)) } });
                result = { type, multiplier, hours };
                extra = { multiplier, hours };
            } else {
                throw new Error('Unknown gift type: ' + type);
            }
            window._giftSpinAllowed = false; // اللفة استُهلكت

            // مزامنة الكاش المحلي بالنتيجة عشان الواجهة تتحدث فورًا
            if (window._userData) {
                if (result.type === 'promonth') {
                    window._userData.plan = 'pro';
                } else if (result.type === 'tempfeature') {
                    window._userData.tempProFeature = { featureAR: result.featureAR, featureEN: result.featureEN, expiresAt: Timestamp.fromDate(new Date(Date.now() + (result.hours||24) * 3600000)) };
                } else if (result.type === 'boost') {
                    window._userData.coinBoost = { multiplier: result.multiplier, expiresAt: Timestamp.fromDate(new Date(Date.now() + (result.hours||24) * 3600000)) };
                }
            }

            try {
                await addDoc(collection(db, 'wheel_spins'), {
                    userId: currentUid, userName: _currentStudentName(),
                    wheelType: 'gift', resultType: type, coinsAwarded: 0, extra, createdAt: serverTimestamp()
                });
            } catch (e) { console.error('wheel spin log error:', e); }

            window._notifyAdminsBot('wheel_spin', { studentName: _currentStudentName() || 'User', wheelType: 'gift', resultType: type });
            return result;
        };

        window._generateDiscountCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let s = 'ATLAS-';
            for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
            return s;
        };

        window._getMyDiscountCodes = async () => {
            if (!currentUid) return [];
            const q = query(collection(db, 'discount_codes'), where('userId', '==', currentUid), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        };

        // Validates a discount code for checkout: must belong to the logged-in student,
        // be unused, unexpired, and match the months tier it was issued for.
        window._validateDiscountCode = async (code, forMonths) => {
            if (!currentUid) throw new Error('Not logged in');
            const clean = (code || '').trim().toUpperCase();
            const snap = await getDoc(doc(db, 'discount_codes', clean));
            if (!snap.exists()) { const e = new Error('not-found'); e.code = 'not-found'; throw e; }
            const c = snap.data();
            if (c.userId !== currentUid) { const e = new Error('not-yours'); e.code = 'not-yours'; throw e; }
            if (c.used) { const e = new Error('used'); e.code = 'used'; throw e; }
            const exp = c.expiresAt?.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
            if (exp < new Date()) { const e = new Error('expired'); e.code = 'expired'; throw e; }
            if (forMonths && c.requiredMonths && c.requiredMonths !== forMonths) {
                const e = new Error('wrong-tier'); e.code = 'wrong-tier'; e.requiredMonths = c.requiredMonths; throw e;
            }
            return { code: clean, ...c };
        };

        // Marks a discount code as used (called right after a subscription request that
        // applied it is submitted, so it can't be applied to a second request).
        window._useDiscountCode = async (code) => {
            let percent = 0;
            try { const c = await getDoc(doc(db, 'discount_codes', code)); percent = c.exists() ? (c.data().percent || 0) : 0; } catch (e) {}
            await updateDoc(doc(db, 'discount_codes', code), { used: true, usedAt: serverTimestamp() });
            window._notifyAdminsBot('discount_used', { studentName: window._botStudentName(), code, percent });
        };

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
                // These 4 dashboard stat numbers are now always computed live from
                // Firestore (see renderDashboard), so any old manually-saved override
                // is ignored here — otherwise it would randomly win the race against
                // the live count depending on network timing.
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
                if (!isAdminUser) {
                    const groupData = snap.exists() ? snap.data() : {};
                    const groupName = groupData.nameAR || groupData.name || groupData.titleAR || groupData.title || '';
                    window._notifyAdminsBot('community_join', { studentName: memberName, groupName });
                }
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
            if (!isAdminUser) {
                let groupName = '';
                try {
                    const groupSnap = await getDoc(doc(db, 'community_groups', groupId));
                    const gd = groupSnap.exists() ? groupSnap.data() : {};
                    groupName = gd.nameAR || gd.name || gd.titleAR || gd.title || '';
                } catch(e) {}
                window._notifyAdminsBot('community_message', { studentName: senderName, groupName, message: text });
            }
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
            if (!isAdminUser) {
                window._notifyAdminsBot('community_message', { studentName: senderName, groupName: '', message: text, isThreadReply: true });
            }
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
                startPlatformWatcher(); // لو المحاولة الأولى اتقفلت بسبب الصلاحيات، نعيدها بعد تسجيل الدخول
                // If admin already logged in via local credentials, don't interfere
                if (window._isAdmin) return;
                // بوابة المشرفين لسه بتتحقق من الحساب — ماتفتحش واجهة الطالب في الأثناء
                if (window._supervisorLoginInProgress) return;

                // لو ده سيشن أدمن (السيشن مشتركة مع admin.html لأنهم نفس الـ default app):
                // ما نحوّلوش تلقائيًا لـ admin.html — ده اللي كان بيمنع فتح صفحة الطالب.
                // التحويل بيحصل بس لما الأدمن يسجّل دخول صراحةً من فورم الطالب
                // (_doLogin / _socialSignIn). هنا بنعرض شاشة تسجيل الدخول بدون ما
                // نعمل signOut، عشان جلسة الأدمن في التاب التاني ماتتأثرش.
                try {
                    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
                    if (adminSnap.exists()) {
                        currentUid = null;
                        window._userData = null;
                        document.getElementById('mainApp').style.display = 'none';
                        document.getElementById('authBox').style.display = 'flex';
                        return;
                    }
                } catch (e) {
                    // مشكلة شبكة — كمّل عادي كطالب، محاولة القراءة التالية هتفشل برضو لو فعلاً في مشكلة
                }

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
                document.getElementById('authBox').style.display = 'flex';
                document.getElementById('mainApp').style.display = 'none';
                // Clear any leftover page hash from a previous session (e.g. #/cvbuilder)
                // so the address bar doesn't show a platform page while the login screen
                // is what's actually on screen.
                try {
                    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
                } catch(e) {}
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

        /* ═══════════════════════════════════════════════════════════════════════
           🔥 DAILY STREAK SYSTEM — Backend (Firestore)          [ADDITIVE BLOCK]
           ───────────────────────────────────────────────────────────────────────
           • بلوك مُضاف فقط: بيستخدم collection جديدة اسمها user_streaks، وبيقرأ/بيلفّ
             الدوال الموجودة من غير ما يعدّل أي سطر فيها.
           • التاريخ مأخوذ من سيرفر Firestore (serverTimestamp) وبتوقيت Africa/Cairo،
             فتغيير تاريخ الجهاز أو إعادة تحميل الصفحة ما بيأثرش على الـ Streak.
           • تسجيل اليوم + منح المكافأة + سجل العملات = Firestore Transaction واحدة
             (ما يتمنحش مرتين حتى لو فتح الطالب تابين).
           • المكافآت بتحترم settings/coins.dailyMax، والزيادة بتروح Pending Rewards.
           ═══════════════════════════════════════════════════════════════════════ */
        (function () {
            'use strict';
            /* Firestore transactions: window.__sbCompat.runTransaction (Supabase) */
            const COL = 'user_streaks';

            /*STREAK_CORE_START*/
            const core = (function () {
                const TZ = 'Africa/Cairo';
                const KEEP_DATES = 60;
                // مكافآت الـ Milestones — تُمنح مرة واحدة فقط لكل Milestone
                const MILESTONES = [
                    { days: 3,  coins: 10,  badge: null },
                    { days: 7,  coins: 30,  badge: null },
                    { days: 14, coins: 75,  badge: null },
                    { days: 30, coins: 150, badge: 'streak_30' }
                ];
                const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

                const _fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
                // YYYY-MM-DD حسب توقيت القاهرة (بيتعامل مع التوقيت الصيفي تلقائيًا)
                function cairoDateKey(ms) {
                    const p = {};
                    _fmt.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
                    return p.year + '-' + p.month + '-' + p.day;
                }
                function dayNum(key) {
                    const a = key.split('-').map(Number);
                    return Math.round(Date.UTC(a[0], a[1] - 1, a[2]) / 86400000);
                }
                function keyFromDayNum(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
                function num(v) { v = Number(v); return (isFinite(v) && v > 0) ? Math.floor(v) : 0; }
                function validKey(k) { return typeof k === 'string' && DATE_RE.test(k); }

                function normalizeState(raw) {
                    raw = raw || {};
                    return {
                        currentStreak: num(raw.currentStreak),
                        longestStreak: num(raw.longestStreak),
                        lastActiveDate: validKey(raw.lastActiveDate) ? raw.lastActiveDate : null,
                        totalActiveDays: num(raw.totalActiveDays),
                        activeDates: Array.isArray(raw.activeDates) ? raw.activeDates.filter(validKey).slice(-KEEP_DATES) : [],
                        claimedMilestones: Array.isArray(raw.claimedMilestones)
                            ? raw.claimedMilestones.map(Number).filter(n => MILESTONES.some(m => m.days === n)) : [],
                        badges: Array.isArray(raw.badges)
                            ? raw.badges.filter(b => b && b.id).map(b => ({ id: String(b.id), earnedDate: String(b.earnedDate || '') })) : [],
                        pendingRewards: Array.isArray(raw.pendingRewards)
                            ? raw.pendingRewards.filter(p => p && num(p.coins) > 0).map(p => ({
                                id: String(p.id || ('m' + num(p.milestone))),
                                milestone: num(p.milestone),
                                coins: num(p.coins),
                                createdDate: validKey(p.createdDate) ? p.createdDate : '0000-00-00'
                            })) : []
                    };
                }

                // الـ Streak اللي يُعرض فعليًا: لو فات أكثر من يوم كامل بدون نشاط يبقى 0
                function effectiveStreak(st, today) {
                    if (!st.lastActiveDate || !st.currentStreak) return 0;
                    return (dayNum(today) - dayNum(st.lastActiveDate)) <= 1 ? st.currentStreak : 0;
                }
                function isBroken(st, today) {
                    return !!st.lastActiveDate && st.currentStreak > 0 && (dayNum(today) - dayNum(st.lastActiveDate)) > 1;
                }

                // تسجيل يوم جديد (Pure — بدون أي I/O). لو اليوم اتسجّل قبل كده → no-op.
                function computeDayUpdate(raw, today) {
                    const s = normalizeState(raw);
                    const out = { state: s, isNewDay: false, streakBroken: false, newMilestones: [] };
                    if (s.lastActiveDate) {
                        const diff = dayNum(today) - dayNum(s.lastActiveDate);
                        if (diff <= 0) return out;                  // نفس اليوم (أو ساعة رجعت لورا) → مفيش تغيير
                        if (diff === 1) { s.currentStreak += 1; }
                        else { out.streakBroken = s.currentStreak > 0; s.currentStreak = 1; }   // يوم كامل فات → يبدأ من جديد
                    } else {
                        s.currentStreak = 1;
                    }
                    out.isNewDay = true;
                    s.lastActiveDate = today;
                    s.totalActiveDays += 1;
                    s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
                    if (s.activeDates.indexOf(today) === -1) s.activeDates.push(today);
                    s.activeDates = s.activeDates.slice(-KEEP_DATES);
                    MILESTONES.forEach(m => {
                        if (s.currentStreak >= m.days && s.claimedMilestones.indexOf(m.days) === -1) out.newMilestones.push(m);
                    });
                    return out;
                }

                // توزيع المكافآت مع احترام الحد اليومي للعملات (cap = Infinity لو مفيش حد).
                // القديمة المؤجلة (createdDate < today) الأول، بعدين الجديدة. اللي مايتمنحش يفضل Pending.
                function settleRewards(pending, newItems, today, cap) {
                    let remaining = (cap === Infinity) ? Infinity : Math.max(0, cap);
                    const results = [], nextPending = [];
                    const take = (item, fromPending) => {
                        const give = Math.min(item.coins, remaining);
                        if (remaining !== Infinity) remaining -= give;
                        const left = item.coins - give;
                        results.push({ id: item.id, milestone: item.milestone, granted: give, left, fromPending });
                        if (left > 0) nextPending.push({ id: item.id, milestone: item.milestone, coins: left, createdDate: item.createdDate });
                    };
                    pending.forEach(p => { if (p.createdDate < today) take(p, true); else nextPending.push(p); });
                    newItems.forEach(n => take(n, false));
                    return { results, nextPending };
                }

                // 7 خلايا للأسبوع الحالي (الأحد → السبت) زي نظام التحديات الأسبوعية
                function weekCells(st, today) {
                    const t = dayNum(today);
                    const start = t - new Date(t * 86400000).getUTCDay();
                    const done = new Set(st.activeDates);
                    const cells = [];
                    for (let i = 0; i < 7; i++) {
                        const n = start + i, key = keyFromDayNum(n);
                        cells.push({ key, dow: i, isToday: n === t, status: n > t ? 'future' : (done.has(key) ? 'done' : 'empty') });
                    }
                    return cells;
                }

                function arDaysWord(n) {
                    if (n === 1) return 'يوم واحد';
                    if (n === 2) return 'يومين';
                    return n <= 10 ? (n + ' أيام') : (n + ' يومًا');
                }

                return { TZ, MILESTONES, cairoDateKey, dayNum, keyFromDayNum, normalizeState, effectiveStreak,
                         isBroken, computeDayUpdate, settleRewards, weekCells, arDaysWord };
            })();
            /*STREAK_CORE_END*/
            window._streakCore = core;

            /* ─── حالة الجلسة (في الذاكرة فقط — مش مصدر الحقيقة، مصدرها Firestore) ─── */
            let _clock = null;          // { serverMs, perfMs } — ساعة السيرفر + عدّاد متصفح لا يتأثر بتغيير تاريخ الجهاز
            let _state = null, _stateUid = null, _status = 'loading';
            let _initPromise = null, _inflight = null;

            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('streak-timeout')), ms))]);
            const nowMs = () => _clock ? _clock.serverMs + (performance.now() - _clock.perfMs) : null;
            const todayKey = () => { const n = nowMs(); return n == null ? null : core.cairoDateKey(n); };
            const curUid = () => (auth.currentUser && auth.currentUser.uid) || null;
            const hasDue = (st, today) => st.pendingRewards.some(p => p.createdDate < today);

            // بيجيب وقت السيرفر الحقيقي: كتابة serverTimestamp ثم قراءتها. لو فشل → ما بنسجّل (fail-closed).
            async function syncClock(uid, force) {
                if (!force && _clock && (performance.now() - _clock.perfMs) < 15 * 60 * 1000) return;
                const ref = doc(db, COL, uid);
                const t0 = performance.now();
                await withTimeout(setDoc(ref, { serverPing: serverTimestamp() }, { merge: true }), 10000);
                const snap = await withTimeout(getDoc(ref), 10000);
                const ts = snap.exists() ? snap.data().serverPing : null;
                const ms = ts && ts.toMillis ? ts.toMillis() : null;
                if (!ms) throw new Error('streak: no server time');
                const t1 = performance.now();
                _clock = { serverMs: ms + (t1 - t0) / 2, perfMs: t1 };
            }

            // كام عملة لسه متاحة النهارده حسب settings/coins.dailyMax (Infinity = مفيش حد)
            async function getRemainingCap(uid, today) {
                let max = 0;
                try {
                    const s = await window._loadCoinSettings();
                    max = Number(s && s.dailyMax) || 0;
                } catch (e) { return 0; }                          // مش عارفين الإعداد → نأجّل بدل ما نتجاوز الحد
                if (max <= 0) return Infinity;
                try {
                    const rows = await window._loadCoinTransactions(uid, 300);
                    const earned = rows.filter(r => r.type === 'earn' && r.createdAt && r.createdAt.toMillis
                        && core.cairoDateKey(r.createdAt.toMillis()) === today)
                        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                    return Math.max(0, max - earned);
                } catch (e) { return 0; }
            }

            // Transaction واحدة: (تسجيل يوم جديد اختياريًا) + تسوية المكافآت + خصم/إضافة العملات + سجل العملات
            async function commit(uid, today, cap, countDay) {
                const { runTransaction } = window.__sbCompat;
                const sRef = doc(db, COL, uid), uRef = doc(db, 'users', uid);
                return runTransaction(db, async (tx) => {
                    const snap = await tx.get(sRef);
                    const raw = snap.exists() ? snap.data() : {};
                    let upd;
                    if (countDay) upd = core.computeDayUpdate(raw, today);
                    else upd = { state: core.normalizeState(raw), isNewDay: false, streakBroken: false, newMilestones: [] };
                    const st = upd.state;
                    const broken = !countDay && core.isBroken(st, today);
                    const due = hasDue(st, today);
                    if (!upd.isNewDay && !broken && !due) return { isNewDay: false, state: st, milestones: [], payouts: [], totalGranted: 0, wrote: false };
                    if (broken) st.currentStreak = 0;

                    const newItems = upd.newMilestones.map(m => ({ id: 'm' + m.days, milestone: m.days, coins: m.coins, createdDate: today }));
                    const settled = core.settleRewards(st.pendingRewards, newItems, today, cap);
                    st.pendingRewards = settled.nextPending;
                    upd.newMilestones.forEach(m => {
                        st.claimedMilestones.push(m.days);                                   // مرة واحدة فقط لكل Milestone
                        if (m.badge && !st.badges.some(b => b.id === m.badge)) st.badges.push({ id: m.badge, earnedDate: today });
                    });

                    tx.set(sRef, {
                        currentStreak: st.currentStreak, longestStreak: st.longestStreak,
                        lastActiveDate: st.lastActiveDate, totalActiveDays: st.totalActiveDays,
                        activeDates: st.activeDates, claimedMilestones: st.claimedMilestones,
                        badges: st.badges, pendingRewards: st.pendingRewards,
                        updatedAt: serverTimestamp()
                    }, { merge: true });

                    const totalGranted = settled.results.reduce((s, r) => s + r.granted, 0);
                    if (totalGranted > 0) {
                        tx.update(uRef, { coins: increment(totalGranted), coinsEarnedTotal: increment(totalGranted) });
                        settled.results.filter(r => r.granted > 0).forEach(r => {
                            const dAR = core.arDaysWord(r.milestone), dEN = r.milestone + ' days';
                            tx.set(doc(collection(db, 'coin_transactions')), {
                                userId: uid, type: 'earn', amount: r.granted,
                                reasonAR: r.fromPending ? ('صرف مكافأة Daily Streak المؤجلة (' + dAR + ')') : ('مكافأة Daily Streak — ' + dAR + ' متتالية'),
                                reasonEN: r.fromPending ? ('Deferred Daily Streak reward paid out (' + dEN + ')') : ('Daily Streak reward — ' + dEN + ' in a row'),
                                source: 'streak', milestone: r.milestone,
                                createdAt: serverTimestamp()
                            });
                        });
                    }
                    const milestones = settled.results.filter(r => !r.fromPending).map(r => {
                        const m = core.MILESTONES.find(x => x.days === r.milestone) || {};
                        return { days: r.milestone, coins: r.granted + r.left, granted: r.granted, left: r.left, badge: m.badge || null };
                    });
                    const payouts = settled.results.filter(r => r.fromPending && r.granted > 0);
                    return { isNewDay: upd.isNewDay, streakBroken: upd.streakBroken, state: st, milestones, payouts, totalGranted, wrote: true };
                });
            }

            function applyResult(res) {
                _state = res.state;
                if (res.totalGranted > 0 && window._userData) {
                    window._userData.coins = (window._userData.coins || 0) + res.totalGranted;
                    window._userData.coinsEarnedTotal = (window._userData.coinsEarnedTotal || 0) + res.totalGranted;
                }
            }

            function emit(kind, extra) {
                try { window.dispatchEvent(new CustomEvent('atlasya:streak', { detail: Object.assign({ kind }, extra || {}) })); } catch (e) {}
            }

            window._streakGetView = function () {
                const today = todayKey();
                const st = _state || core.normalizeState({});
                const ready = !!_state && !!today;
                const eff = ready ? core.effectiveStreak(st, today) : 0;
                return {
                    ready, status: _status, today, state: st,
                    currentStreak: eff,
                    longestStreak: Math.max(st.longestStreak, eff),
                    totalActiveDays: st.totalActiveDays,
                    doneToday: ready && st.lastActiveDate === today,
                    week: ready ? core.weekCells(st, today) : [],
                    milestones: core.MILESTONES.map(m => ({
                        days: m.days, coins: m.coins, badge: m.badge,
                        claimed: st.claimedMilestones.indexOf(m.days) !== -1,
                        pending: st.pendingRewards.filter(p => p.milestone === m.days).reduce((s, p) => s + p.coins, 0)
                    })),
                    badges: st.badges,
                    pendingTotal: st.pendingRewards.reduce((s, p) => s + p.coins, 0)
                };
            };

            async function waitForStudent(uid) {
                for (let i = 0; i < 50; i++) {
                    if (curUid() !== uid) return false;
                    if (window._isAdmin) return false;              // جلسة أدمن → لا Streak
                    if (window._userData) return true;
                    await sleep(300);
                }
                return false;
            }

            // بيتنادى عند تسجيل دخول الطالب: يقرأ الحالة، يكسر الـ Streak لو فات يوم كامل، ويصرف المؤجل
            async function init(uid) {
                try {
                    if (!(await waitForStudent(uid))) { _status = 'off'; emit('state'); return; }
                    await syncClock(uid, true);
                    const snap = await withTimeout(getDoc(doc(db, COL, uid)), 10000);
                    if (curUid() !== uid) return;
                    _state = core.normalizeState(snap.exists() ? snap.data() : {});
                    _stateUid = uid; _status = 'ready';
                    emit('state');
                    const today = todayKey();
                    if (core.isBroken(_state, today) || hasDue(_state, today)) {
                        const cap = hasDue(_state, today) ? await getRemainingCap(uid, today) : Infinity;
                        const res = await commit(uid, today, cap, false);
                        if (res.wrote) { applyResult(res); emit('state', { payouts: res.payouts, totalGranted: res.totalGranted }); }
                    }
                } catch (e) {
                    _status = 'error';
                    console.warn('[streak] init failed — تأكد من إضافة قواعد Firestore لـ user_streaks (شوف firestore.rules.streak.txt):', e);
                    emit('state');
                }
            }

            // نقطة التسجيل الوحيدة: بتتنادى من أي نشاط حقيقي. مرة واحدة فقط في اليوم لكل مستخدم.
            window._streakRecordActivity = function (type) {
                if (_inflight) return _inflight;
                const uid = curUid();
                if (!uid || window._isAdmin || !window._userData) return Promise.resolve(null);
                _inflight = (async () => {
                    try {
                        if (_initPromise) { try { await _initPromise; } catch (e) {} }
                        if (curUid() !== uid) return null;
                        await syncClock(uid, false);
                        const today = todayKey();
                        // مسار سريع: اليوم متسجّل فعلًا ومفيش مؤجل مستحق → مفيش أي قراءة/كتابة
                        if (_state && _stateUid === uid && _state.lastActiveDate === today && !hasDue(_state, today)) return null;
                        const cap = await getRemainingCap(uid, today);
                        const res = await commit(uid, today, cap, true);
                        if (!res.wrote) { _state = res.state; _stateUid = uid; emit('state'); return res; }
                        applyResult(res); _stateUid = uid; _status = 'ready';
                        emit(res.isNewDay ? 'day' : 'state', { type, milestones: res.milestones, payouts: res.payouts, totalGranted: res.totalGranted, streak: res.state.currentStreak });
                        return res;
                    } catch (e) {
                        console.warn('[streak] record failed:', e);
                        return null;
                    } finally { _inflight = null; }
                })();
                return _inflight;
            };

            onAuthStateChanged(auth, (user) => {
                _clock = null; _state = null; _stateUid = null; _inflight = null; _initPromise = null; _status = 'loading';
                emit('reset');
                if (user) _initPromise = init(user.uid);
            });

            /* ─── ربط التحدي اليومي (دالة موجودة) — بنلفّها فقط ولا نعدّل جسمها ─── */
            const _origSubmit = window._submitDailyChallengeAnswer;
            if (typeof _origSubmit === 'function') {
                window._submitDailyChallengeAnswer = async function () {
                    const r = await _origSubmit.apply(this, arguments);      // لو رمت خطأ (already/…) يفضل يترمي زي ما هو ومش بيتسجل
                    try { window._streakRecordActivity('challenge'); } catch (e) {}
                    return r;
                };
            }
        })();
    