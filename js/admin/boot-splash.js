(function () {
    var splash = document.getElementById('adminBootSplash');
    var logo = document.getElementById('adminBootLogo');
    var srcLogo = document.querySelector('#authBox .auth-logo img');
    if (logo && srcLogo && srcLogo.src) logo.src = srcLogo.src;

    // لو التحميل اتأخر (نت ضعيف مثلًا) منسيبش المستخدم على سبنر للأبد
    var fallbackTimer = setTimeout(function () {
        if (!splash || splash.classList.contains('is-hidden')) return;
        var msg = document.getElementById('adminBootMsg');
        var back = document.getElementById('adminBootBack');
        if (msg) msg.textContent = 'التحميل أخد وقت أطول من المعتاد.';
        if (back) back.style.display = 'inline-block';
    }, 15000);

    // العنوان اللي نرجّع له المشرف (صفحة الطالب = صفحة الدخول الموحّدة). مش بنكتب اسم ملف ثابت
    // (student.html) لأن صفحة الطالب ممكن تكون index.html أو أي اسم تاني على الاستضافة ← كان بيطلع 404.
    // العنوان الحقيقي بيتسجّل في sessionStorage وقت الدخول من بوابة المشرفين؛ ولو مش موجود
    // (فتح admin.html مباشرة) بنرجع لجذر المجلد.
    window._atlasyaStudentPage = function (openSupervisorForm) {
        var base = './';
        try {
            var saved = sessionStorage.getItem('atlasya_student_url');
            if (saved && /^\/(?!\/)/.test(saved)) base = saved; // مسار من نفس الموقع بس
        } catch (e) {}
        return base + (openSupervisorForm ? '?supervisor=1' : '');
    };
    var backLink = document.getElementById('adminBootBack');
    if (backLink) backLink.href = window._atlasyaStudentPage(true);

    window._hideAdminBootSplash = function () {
        clearTimeout(fallbackTimer);
        if (splash) splash.classList.add('is-hidden');
    };
    window._showAdminBootSplash = function (text) {
        var msg = document.getElementById('adminBootMsg');
        if (msg && text) msg.textContent = text;
        if (splash) splash.classList.remove('is-hidden');
    };
})();
