(function(){
    var starsEl = document.getElementById('authStars');
    if (starsEl && !starsEl.children.length) {
        for (var i = 0; i < 70; i++) {
            var s = document.createElement('span');
            s.style.top = (Math.random()*100) + 'vh';
            s.style.left = (Math.random()*100) + 'vw';
            s.style.animationDelay = (Math.random()*4) + 's';
            var sz = Math.random()*1.6+1;
            s.style.width = sz + 'px';
            s.style.height = sz + 'px';
            starsEl.appendChild(s);
        }
    }
})();
