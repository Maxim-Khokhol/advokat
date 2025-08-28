// ===== Исходные данные (заполняй своими отзывами) =====
const reviews = [
    {
        name: "Donald Jackman",
        rating: 5,
        text: "I've been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier. I especially love the batch optimization and how quickly it handles large images without visible quality loss."
    },
    {
        name: "Blanche Pearson",
        rating: 4,
        text: "Great tool for everyday content work. The interface is straightforward and the results are consistent. I wish there were a few more export presets, but overall I’m very satisfied and recommend it to my colleagues."
    },
    {
        name: "Joenas Brauers",
        rating: 5,
        text: "The compression ratio is impressive. Our landing pages load much faster now. Support was quick to respond when we had a question about WebP fallback behavior—super helpful team!"
    },
    {
        name: "Lariach French",
        rating: 5,
        text: "Simple, fast, and reliable. I use it weekly for client projects. The UX gets out of the way and the defaults are sane. A must-have in my toolbox for social media and blog posts."
    },
    {
        name: "James Khosravi",
        rating: 3,
        text: "It does what it says, but I ran into edge cases with transparent PNGs. The latest update improved it a lot though, so I’m keeping it in my workflow."
    },
    {
        name: "Kiristina Zasiadko",
        rating: 5,
        text: "We optimized a huge archive from an old site. The storage savings and faster CDN delivery paid for the subscription in the first month. Totally worth it."
    }
];

// ===== Хелперы для карточек =====
const MAX_CHARS = 150;

const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const truncate = (str, limit = MAX_CHARS) =>
    str.length > limit ? str.slice(0, limit).trimEnd() + "…" : str;

// ===== Рендер карточек в карусель =====
function renderCards() {
    const carousel = document.querySelector(".carousel");
    carousel.innerHTML = "";

    reviews.forEach((rv, idx) => {
        const short = rv.text.length > 150 ? rv.text.slice(0,150).trimEnd() + "..." : rv.text;
        const truncated = rv.text.length > 150;

        const li = document.createElement("li");
        li.className = "card";
        li.innerHTML = `
      <div class="card-inner">
        <div class="card__head">
          <div class="card__name">${rv.name}</div>
          <div class="card__stars" aria-label="${rv.rating} stars">
            ${"★★★★★".slice(0, rv.rating) + "☆☆☆☆☆".slice(0, 5 - rv.rating)}
          </div>
        </div>

        <p class="review__text">${short}</p>

        <div class="read-more hover:underline" data-index="${idx}" ${truncated ? "" : 'style="display:none"'}>Читати повністю</div>
      </div>
    `;

        // полный текст для модалки
        li.querySelector(".review__text").dataset.full = rv.text;

        carousel.appendChild(li);
    });
}

// ===== Модалка =====
const modal = {
    el: null,
    nameEl: null,
    starsEl: null,
    textEl: null,
    open(data) {
        this.nameEl.textContent = data.name;
        this.starsEl.textContent = stars(data.rating);
        this.textEl.textContent = data.text;
        this.el.classList.add("open");
        this.el.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    },
    close() {
        this.el.classList.remove("open");
        this.el.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    },
    init() {
        this.el = document.getElementById("reviewModal");
        this.nameEl = this.el.querySelector(".modal__name");
        this.starsEl = this.el.querySelector(".modal__stars");
        this.textEl = this.el.querySelector(".modal__text");

        this.el.addEventListener("click", (e) => {
            if (e.target.matches("[data-close]")) this.close();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.el.classList.contains("open")) this.close();
        });
    },
};

// ===== Карусель: стрелки, drag, автоплей =====
function initCarousel() {
    const wrapper  = document.querySelector(".wrapper-4");
    const carousel = document.querySelector(".carousel");
    const leftBtn  = document.getElementById("left");
    const rightBtn = document.getElementById("right");

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let timeoutId;

    const getGap = () => {
        const s = getComputedStyle(carousel);
        const g = parseFloat(s.columnGap || s.gap || "0");
        return isNaN(g) ? 0 : g;
    };
    const getCardWidth = () => {
        const first = carousel.querySelector(".card");
        return first ? first.getBoundingClientRect().width : 0;
    };
    const stepValue = () => getCardWidth() + getGap();

    const scrollByStep = (dir) => {
        const step = stepValue();
        if (step <= 0) return;
        carousel.scrollBy({ left: dir * step, behavior: "smooth" });
    };
    leftBtn.addEventListener("click",  () => scrollByStep(-1));
    rightBtn.addEventListener("click", () => scrollByStep(1));

    const pageX = (e) => (e.touches ? e.touches[0].pageX : e.pageX);

    const dragStart = (e) => {
        isDragging = true;
        startX = pageX(e);
        startScrollLeft = carousel.scrollLeft;
        clearTimeout(timeoutId);
        carousel.classList.add("dragging");
    };
    const dragging = (e) => {
        if (!isDragging) return;
        const x = pageX(e);
        carousel.scrollLeft = startScrollLeft - (x - startX);
    };
    const dragStop = () => {
        if (!isDragging) return;
        isDragging = false;
        carousel.classList.remove("dragging");
        autoPlay();
    };

    carousel.addEventListener("mousedown", dragStart);
    carousel.addEventListener("mousemove", dragging);
    document.addEventListener("mouseup", dragStop);

    carousel.addEventListener("touchstart", dragStart, { passive: true });
    carousel.addEventListener("touchmove",  dragging,  { passive: true });
    document.addEventListener("touchend",  dragStop);

    const autoPlay = () => {
        if (window.innerWidth < 800) return;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const atEnd = Math.ceil(carousel.scrollLeft + carousel.clientWidth) >= carousel.scrollWidth - 1;
            if (atEnd) carousel.scrollTo({ left: 0, behavior: "auto" });
            else scrollByStep(1);
        }, 2500);
    };
    autoPlay();

    wrapper.addEventListener("mouseenter", () => clearTimeout(timeoutId));
    wrapper.addEventListener("mouseleave", () => autoPlay());
    carousel.addEventListener("scroll", () => { clearTimeout(timeoutId); autoPlay(); });
}

// ===== Делегирование клика по «Read more» =====
function bindReadMore() {
    const carousel = document.querySelector(".carousel");
    carousel.addEventListener("click", (e) => {
        const btn = e.target.closest(".read-more");
        if (!btn) return;
        const idx = Number(btn.dataset.index);
        const rv = reviews[idx];
        modal.open(rv);
    });
}

// ===== Инициализация =====
document.addEventListener("DOMContentLoaded", () => {
    renderCards();
    modal.init();
    initCarousel();
    bindReadMore();
});
