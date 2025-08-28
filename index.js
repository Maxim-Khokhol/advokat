document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('.reveal-left, .reveal-right'));

    // Якщо браузер просить мінімум анімацій — показуємо одразу
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('is-inview'));
        return;
    }

    // Якщо IntersectionObserver недоступний — показуємо одразу
    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-inview'));
        return;
    }

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                entry.target.classList.add('is-inview');
                obs.unobserve(entry.target); // одноразова анімація
            }
        });
    }, {
        threshold: 0.01,
        root: null,
        rootMargin: '0px'
    });

    items.forEach(el => io.observe(el));

    // «Запобіжник»: якщо з якоїсь причини IO не спрацював, підсвіти видимі елементи
    setTimeout(() => {
        items.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-inview');
        });
    }, 1000);
});




const control  = document.getElementById("direction-toggle");
const marquees = document.querySelectorAll(".marquee");
const wrapper3 = document.querySelector(".wrapper-3");

if (control){
    control.addEventListener("click", () => {
        control.classList.toggle("toggle--vertical");
        wrapper3.classList.toggle("wrapper--vertical");
        marquees.forEach(m => m.classList.toggle("marquee--vertical"));
    });
}
