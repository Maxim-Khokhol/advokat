// js/mobile-menu.js — мобильная шторка с автозакрытием по клику на пункт меню
(() => {
    const ready = (fn) =>
        (document.readyState !== 'loading'
            ? fn()
            : document.addEventListener('DOMContentLoaded', fn));

    ready(() => {
        // Бургер: используем существующий .burger-menu, иначе — .mm-burger
        const burger = document.querySelector('.burger-menu, .mm-burger');
        if (!burger) return;

        const drawer   = document.getElementById('mm-drawer');
        const backdrop = document.getElementById('mm-backdrop');
        const btnClose = document.getElementById('mm-close');

        if (!drawer || !backdrop) return;

        const isOpen = () => drawer.classList.contains('open');

        const open = () => {
            drawer.removeAttribute('hidden');
            backdrop.removeAttribute('hidden');
            requestAnimationFrame(() => {
                drawer.classList.add('open');
                backdrop.classList.add('show');
            });
            document.documentElement.classList.add('mm-open');
            burger.setAttribute('aria-expanded', 'true');
        };

        const close = () => {
            drawer.classList.remove('open');
            backdrop.classList.remove('show');
            document.documentElement.classList.remove('mm-open');
            burger.setAttribute('aria-expanded', 'false');
            setTimeout(() => { drawer.setAttribute('hidden',''); backdrop.setAttribute('hidden',''); }, 320);
        };

        // Тоггл по бургеру
        burger.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen() ? close() : open();
        });

        // Закрыть по «X»
        btnClose?.addEventListener('click', (e) => { e.preventDefault(); if (isOpen()) close(); });

        // Клик мимо меню (вне зоны шторки и бургера) — закрыть
        document.addEventListener('click', (e) => {
            if (!isOpen()) return;
            const insideDrawer = drawer.contains(e.target);
            const onBurger     = burger.contains(e.target);
            if (!insideDrawer && !onBurger) close();
        });

        // ⟵ НОВОЕ: автозакрытие по клику на пункт в шторке
        // 1) пометим все пункты в шторке классом .mm-autoclose (если его нет)
        const markAutoClose = () => {
            drawer.querySelectorAll('.mm-nav .nav__item').forEach(el => el.classList.add('mm-autoclose'));
        };
        markAutoClose();

        // 2) делегирование: клик по элементу с .mm-autoclose → закрыть
        drawer.addEventListener('click', (e) => {
            const trigger = e.target.closest('.mm-autoclose');
            if (trigger && isOpen()) close();
        });

        // Esc — закрыть
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) close();
        });

        // При переходе на десктоп — закрыть и сбросить
        const mq = window.matchMedia('(max-width: 900px)');
        const mqHandler = (ev) => { if (!ev.matches && isOpen()) close(); };
        mq.addEventListener ? mq.addEventListener('change', mqHandler) : mq.addListener(mqHandler);
    });
})();

