(function () {
    // Безпечна ініціалізація, незалежно від місця підключення
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    ready(function init() {
        var header = document.getElementById('header'); // існує у твоїй розмітці
        if (!header) return;

        var THRESHOLD = 40;
        var ticking = false;

        function apply() {
            var y = window.scrollY || document.documentElement.scrollTop || 0;
            if (y >= THRESHOLD) {
                header.classList.add('header--elevated');
            } else {
                header.classList.remove('header--elevated');
            }
            ticking = false;
        }

        // Початкове застосування стану (на випадок перезавантаження посеред сторінки)
        apply();

        // Скрол з rAF-троттлінгом
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(apply);
                ticking = true;
            }
        }, { passive: true });

        // Перестраховка: якщо щось змінює розкладку (шрифти/зображення) — оновити стан
        window.addEventListener('load', apply);
    });
})();

