/* scroll-up.js — ПОЛНАЯ ЗАМЕНА */
(() => {
    function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

    ready(() => {
        const btn = document.getElementById('myBtn');
        if (!btn) return;

        const docEl = document.scrollingElement || document.documentElement;

        // Если у тебя есть конкретный контейнер — пометь его data-scroll-root в HTML,
        // он станет приоритетным для отслеживания.
        const dataRoot = document.querySelector('[data-scroll-root]') || document.getElementById('scroll-root');

        // Частые кандидатЫ (если прокрутка не у окна):
        const candidates = [
            dataRoot,
            document.querySelector('.container'),
            document.querySelector('.container-2'),
            document.querySelector('main'),
            document.querySelector('.wrapper'),
        ].filter(Boolean);

        const getYDoc = () => Math.max(document.body.scrollTop || 0, docEl.scrollTop || 0);
        const getYEl  = (el) => (el && typeof el.scrollTop === 'number') ? el.scrollTop : 0;

        const maxOf = (arr) => arr.reduce((m, it) => it.y > m.y ? it : m, { el: docEl, y: getYDoc() });

        let lastScroller = docEl;  // кто прокручен последним/сильнее

        // rAF-троттлинг, чтобы обновление состояния не терялось
        let raf = 0;
        function scheduleUpdate(fromEl){
            if (fromEl instanceof Element) lastScroller = fromEl;
            if (!raf) raf = requestAnimationFrame(update);
        }

        function update(){
            raf = 0;
            const items = [{ el: docEl, y: getYDoc() }];

            // добавим последнего скроллера
            if (lastScroller && lastScroller !== docEl) items.push({ el: lastScroller, y: getYEl(lastScroller) });

            // добавим типовые контейнеры (если есть)
            for (const el of candidates) if (el !== lastScroller) items.push({ el, y: getYEl(el) });

            const { el, y } = maxOf(items);
            lastScroller = el;
            btn.style.display = y > 20 ? 'block' : 'none';
        }

        // Ловим ЛЮБОЙ скролл в документе (capture=true перехватывает и внутренние скроллеры)
        document.addEventListener('scroll', (e) => scheduleUpdate(e.target), { passive: true, capture: true });

        // Доп. триггеры на случай изменения верстки/высот
        window.addEventListener('resize', () => scheduleUpdate(), { passive: true });
        window.addEventListener('orientationchange', () => scheduleUpdate(), { passive: true });
        document.addEventListener('wheel', () => scheduleUpdate(), { passive: true });
        document.addEventListener('touchmove', () => scheduleUpdate(), { passive: true });

        // Первичный расчёт + догон (если контент дорисуется позже)
        scheduleUpdate();
        setTimeout(scheduleUpdate, 300);
        setTimeout(scheduleUpdate, 1200);

        // Плавная прокрутка вверх: ease-out quint — мягкая в конце
        const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

        function setTop(el, val){
            if (el === docEl) {
                docEl.scrollTop = val;
                document.body.scrollTop = val; // Safari
            } else if (el && typeof el.scrollTop === 'number') {
                el.scrollTop = val;
            }
        }

        // Выбираем сейчас наибольший скролл и едем к 0
        window.topFunction = function () {
            const items = [{ el: docEl, y: getYDoc() }];
            if (lastScroller && lastScroller !== docEl) items.push({ el: lastScroller, y: getYEl(lastScroller) });
            for (const el of candidates) if (el !== lastScroller) items.push({ el, y: getYEl(el) });

            const { el: scroller, y: start } = maxOf(items);
            if (start <= 1) { btn.style.display = 'none'; return; }

            const duration = 650; // мс — плавнее
            const t0 = performance.now();

            const step = (now) => {
                const p = Math.min((now - t0) / duration, 1);
                const eased = easeOutQuint(p);
                setTop(scroller, start * (1 - eased));
                if (p < 1) {
                    requestAnimationFrame(step);
                } else {
                    // фиксируем на 0, прячем кнопку и синхронизируем состояние
                    setTop(scroller, 0);
                    btn.style.display = 'none';
                    scheduleUpdate();
                }
            };
            requestAnimationFrame(step);
        };
    });
})();

