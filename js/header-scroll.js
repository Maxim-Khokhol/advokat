/* js/scroll.js — ПОЛНАЯ ЗАМЕНА
   Клики по .nav__item плавно скроллят к нужной секции.
   Хедер не перекрывает — за счёт CSS scroll-margin-top.
*/
(() => {
    function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

    ready(() => {
        // 1) Нав-пункты (у тебя это <p class="nav__item">…</p>)
        const navItems = Array.from(document.querySelectorAll('.nav__item'));
        if (!navItems.length) return;

        // 2) Карта соответствий по индексу (фолбек, если нет data-target)
        const fallbackTargets = [
            '.container-2', // Послуги
            '.wrapper-4',   // Відгуки
            '.contact-us',  // Контакти
            '.map',         // Карта
        ];

        // 3) Функция определения целевой секции
        function resolveTargetFor(item, idx){
            const sel = item.dataset?.target; // лучше явно: data-target=".map"
            if (sel) {
                return sel.startsWith('#') ? document.getElementById(sel.slice(1)) : document.querySelector(sel);
            }
            const fb = fallbackTargets[idx];
            return fb ? document.querySelector(fb) : null;
        }

        // 4) Учитываем высоту хедера через CSS-переменную (для scroll-margin-top)
        const header = document.querySelector('.site-header, #header');
        function setHeaderVar(){
            const h = header ? header.getBoundingClientRect().height : 0;
            document.documentElement.style.setProperty('--header-h', `${Math.round(h)}px`);
        }
        setHeaderVar();
        window.addEventListener('resize', setHeaderVar);
        setTimeout(setHeaderVar, 250);
        setTimeout(setHeaderVar, 1000);

        // 5) Делегируем клики — плавный скролл к секции
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.nav__item');
            if (!item) return;

            e.preventDefault();

            const idx = navItems.indexOf(item);
            const target = resolveTargetFor(item, idx);
            if (!target) return;

            // активный пункт подсветим
            navItems.forEach(n => n.classList.remove('is-active'));
            item.classList.add('is-active');

            // Гарантируем наличие класса для scroll-margin-top
            target.classList.add('js-scroll-target');

            // Важно: отключи на scroller/документе CSS `scroll-behavior: smooth`,
            // чтобы не было двойной анимации. Мы сами даём behavior:'smooth'.
            target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }, { passive: false });
    });
})();
