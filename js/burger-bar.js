/* js/burger-bar.js — ПОЛНАЯ ЗАМЕНА */
(() => {
    const ready = (fn) => (document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn));

    ready(() => {
        const burger = document.querySelector('.burger-menu');
        const region = burger?.querySelector('.burger-click-region') || burger;
        if (!burger || !region) return;

        // Берём/создаем бэкдроп и шторку
        let backdrop = document.getElementById('mobileBackdrop');
        let drawer   = document.getElementById('mobileDrawer');
        if (!backdrop){
            backdrop = document.createElement('div');
            backdrop.id = 'mobileBackdrop';
            backdrop.className = 'mobile-backdrop';
            document.body.appendChild(backdrop);
        }
        if (!drawer){
            drawer = document.createElement('aside');
            drawer.id = 'mobileDrawer';
            drawer.className = 'mobile-drawer';
            drawer.setAttribute('aria-hidden','true');
            drawer.innerHTML = `<div class="mobile-drawer__inner"></div>`;
            document.body.appendChild(drawer);
        }
        const inner = drawer.querySelector('.mobile-drawer__inner');

        // Пытаемся КЛОНИРОВАТЬ из хедера нав и телефон; если не нашли — оставляем фолбек-разметку
        const srcNav   = document.querySelector('header .navigation');
        const srcPhone = document.querySelector('header .header__phone');
        if (srcNav || srcPhone) {
            inner.innerHTML = '';
            if (srcNav){
                const nav = srcNav.cloneNode(true);
                nav.classList.add('navigation--mobile');
                inner.appendChild(nav);
            }
            if (srcPhone) inner.appendChild(srcPhone.cloneNode(true));
        }

        const isOpen = () => drawer.classList.contains('open');
        const open = () => {
            burger.classList.add('active');
            drawer.classList.add('open');
            backdrop.classList.add('show');
            drawer.removeAttribute('hidden');
            backdrop.removeAttribute('hidden');
            drawer.setAttribute('aria-hidden','false');
            document.documentElement.classList.add('modal-open');
        };
        const close = () => {
            burger.classList.remove('active');
            burger.classList.add('closing');
            drawer.classList.remove('open');
            backdrop.classList.remove('show');
            drawer.setAttribute('aria-hidden','true');
            document.documentElement.classList.remove('modal-open');
            setTimeout(() => {
                burger.classList.remove('closing');
                drawer.setAttribute('hidden','');
                backdrop.setAttribute('hidden','');
            }, 400);
        };

        // Тоггл по иконке
        region.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen() ? close() : open();
        });

        // Клик вне меню → закрыть
        document.addEventListener('click', (e) => {
            if (!isOpen()) return;
            const clickInside = drawer.contains(e.target) || burger.contains(e.target);
            if (!clickInside) close();
        });

        // Клик по любому .nav__item (и в шторке, и в хедере) → скролл уже настроен в scroll.js, просто закрываем
        document.addEventListener('click', (e) => {
            if (!isOpen()) return;
            if (e.target.closest('.nav__item')) close();
        });

        // ESC → закрыть
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) close();
        });

        // При переходе на десктоп закрываем
        const mq = window.matchMedia('(max-width: 900px)');
        const mqHandler = (ev) => { if (!ev.matches && isOpen()) close(); };
        mq.addEventListener ? mq.addEventListener('change', mqHandler) : mq.addListener(mqHandler);
    });
})();
