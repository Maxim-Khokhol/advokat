/* js/header-elevation.js — ПОЛНАЯ ВСТАВКА */
(() => {
    function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

    ready(() => {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const docEl = document.scrollingElement || document.documentElement;

        // Приоритет: явно помеченный контейнер → .container → документ
        const explicit = document.querySelector('[data-scroll-root]') || document.getElementById('scroll-root');
        const fallback = explicit || document.querySelector('.container') || null;

        const scroller =
            (fallback && fallback.scrollHeight > fallback.clientHeight) ? fallback : docEl;

        const getY = () =>
            (scroller === docEl ? (docEl.scrollTop || document.body.scrollTop) : scroller.scrollTop) || 0;

        let raf = 0;
        const update = () => {
            raf = 0;
            header.classList.toggle('is-scrolled', getY() > 2);
        };
        const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

        (scroller === docEl ? window : scroller).addEventListener('scroll', schedule, { passive: true });

        // первичный расчёт + догон (если контент дорендерится)
        schedule();
        setTimeout(schedule, 300);
        setTimeout(schedule, 1200);
    });
})();
