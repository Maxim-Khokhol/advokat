/* ==== Phone input (UA mask + per-country digit limits) ==== */

/* ---- Countries (тільки потрібні) ---- */
const countries = [
        { name: "Ukraine",         code: "UA", phone: 380, max: 9,  uaMask: true },
        { name: "Poland",          code: "PL", phone: 48,  max: 9  },
        { name: "Italy",           code: "IT", phone: 39,  max: 10 },
        { name: "France",          code: "FR", phone: 33,  max: 9  },
        { name: "United States",   code: "US", phone: 1,   max: 10 },
        { name: "Germany",         code: "DE", phone: 49,  max: 11 },
        { name: "Estonia",         code: "EE", phone: 372, max: 8  },
        { name: "Czech Republic",  code: "CZ", phone: 420, max: 9  },
];

/* ---- DOM ---- */
const selectBox       = document.querySelector('.select-box');
const optionsBox      = selectBox.querySelector('.options');
const searchBox       = selectBox.querySelector('.search-box');
const optionsOl       = optionsBox.querySelector('ol');

const selectedWrap    = selectBox.querySelector('.selected-option');  // увесь рядок
const opener          = selectedWrap.querySelector('div');            // ЛІВИЙ блок (флаг+код+«стрілка»)
const inputBox        = selectedWrap.querySelector('input[type="tel"]');

if (!opener || !inputBox) {
        console.warn('[phone.js] Missing required DOM nodes');
}

/* ---- Build options ---- */
optionsOl.innerHTML = '';
countries.forEach(c => {
        const li = document.createElement('li');
        li.className = 'option';
        li.innerHTML = `
    <div>
      <span class="iconify" data-icon="flag:${c.code.toLowerCase()}-4x3"></span>
      <span class="country-name">${c.name}</span>
    </div>
    <strong>+${c.phone}</strong>`;
        optionsOl.appendChild(li);
});
let options = optionsOl.querySelectorAll('.option');

/* ---- State ---- */
let currentPrefix = '+380';        // "+код"
let currentMax    = 9;             // ліміт цифр після коду
let isUA          = true;          // Україна?

const LOCKED_PREFIX = '+380 ';     // UA: саме з пробілом

/* ---- Utils ---- */
const onlyDigits = s => s.replace(/\D+/g, '');
const setCaretToEnd = el => requestAnimationFrame(() => {
        const len = el.value.length;
        el.setSelectionRange(len, len);
});
const readPrefixFromSelected = () => {
        const strong = opener.querySelector('strong');
        return strong ? strong.textContent.trim() : '+380';
};
const findByPrefix = (prefix) => {
        const code = prefix.replace(/^\+/, '');
        return countries.find(c => String(c.phone) === code);
};

/* ---- UA formatting & caret helpers ---- */
const digitsAfterUA = v => onlyDigits(v.slice(LOCKED_PREFIX.length));
// +380 (XX) XXX XX XX
function formatUA(d) {
        const dd = d.slice(0, currentMax); // 9
        const a = dd.slice(0,2), b = dd.slice(2,5), c = dd.slice(5,7), e = dd.slice(7,9);
        let s = LOCKED_PREFIX;
        if (!dd.length) return s;
        if (a.length < 2) return s + '(' + a;
        s += '(' + a + ') ';
        if (b) { s += b; if (b.length === 3) s += ' '; }
        if (c) { s += c; if (c.length === 2) s += ' '; }
        if (e) s += e;
        return s;
}
function applyUA() {
        if (!inputBox.value.startsWith(LOCKED_PREFIX)) {
                inputBox.value = LOCKED_PREFIX + digitsAfterUA(inputBox.value);
        }
        inputBox.value = formatUA(digitsAfterUA(inputBox.value));
        setCaretToEnd(inputBox);
}
// скільки цифр до каретки (без префікса)
function digitIndexBeforeCaretUA(val, caretPos) {
        const slice = val.slice(LOCKED_PREFIX.length, caretPos);
        const m = slice.match(/\d/g);
        return m ? m.length : 0;
}
// позиція каретки після N-ої цифри у форматованому рядку
function caretPosForDigitCountUA(formatted, targetCount) {
        let count = 0;
        for (let i = LOCKED_PREFIX.length; i < formatted.length; i++) {
                if (/\d/.test(formatted[i])) {
                        if (count === targetCount) return i + 1;
                        count++;
                }
        }
        return formatted.length;
}

/* ---- Generic (інша країна) ---- */
function applyGeneric() {
        if (!inputBox.value.startsWith(currentPrefix)) {
                const rest = onlyDigits(inputBox.value.replace(/^\+\d+/, ''));
                inputBox.value = currentPrefix + rest.slice(0, currentMax);
        } else {
                const rest = onlyDigits(inputBox.value.slice(currentPrefix.length));
                inputBox.value = currentPrefix + rest.slice(0, currentMax);
        }
        setCaretToEnd(inputBox);
}

/* ---- Init from selected ---- */
function initPhone() {
        const prefix = readPrefixFromSelected();
        const c = findByPrefix(prefix) || countries[0];

        currentPrefix = `+${c.phone}`;
        currentMax    = c.max;
        isUA          = Boolean(c.uaMask);

        inputBox.value = isUA ? LOCKED_PREFIX : currentPrefix;
        if (isUA) applyUA(); else applyGeneric();
}
document.addEventListener('DOMContentLoaded', initPhone);

/* ---- Open/close dropdown: ТІЛЬКИ по кліку на лівому блоці ---- */
opener.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsBox.classList.toggle('active');
        opener.classList.toggle('active');
        searchBox?.focus();
});
document.addEventListener('click', (e) => {
        if (!selectBox.contains(e.target)) {
                optionsBox.classList.remove('active');
                opener.classList.remove('active');
        }
});

/* ---- Live search ---- */
searchBox?.addEventListener('input', () => {
        const q = searchBox.value.trim().toLowerCase();
        options.forEach(li => {
                const t = li.textContent.trim().toLowerCase();
                li.classList.toggle('hide', q && !t.includes(q));
        });
});

/* ---- Select country (delegation) ---- */
optionsOl.addEventListener('click', (e) => {
        const li = e.target.closest('.option');
        if (!li) return;

        const icon = li.querySelector('.iconify')?.cloneNode(true);
        const strong = li.querySelector('strong')?.cloneNode(true);
        if (!strong) return;

        opener.innerHTML = '';
        if (icon) opener.appendChild(icon);
        opener.appendChild(strong);

        const prefix = strong.textContent.trim();
        const c = findByPrefix(prefix);
        currentPrefix = `+${c.phone}`;
        currentMax    = c.max;
        isUA          = Boolean(c.uaMask);

        // ОЧИЩАЄМО поле до одного коду щоразу при зміні країни
        inputBox.value = isUA ? LOCKED_PREFIX : currentPrefix;
        if (isUA) applyUA(); else applyGeneric();

        // Закриваємо дропдаун і скидаємо пошук
        optionsBox.classList.remove('active');
        opener.classList.remove('active');
        if (searchBox) {
                searchBox.value = '';
                options.forEach(li => li.classList.remove('hide'));
        }
});

/* ---- Keydown: UA видаляє саме цифри; інші країни — захищений префікс ---- */
inputBox.addEventListener('keydown', (e) => {
        const start = inputBox.selectionStart;
        const end   = inputBox.selectionEnd;

        // навігація / системні
        const ctrlMeta = e.ctrlKey || e.metaKey;
        const nav = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab'];
        if (ctrlMeta || nav.includes(e.key)) return;

        if (isUA) {
                // захищаємо "+380 "
                if ((e.key === 'Backspace' && start <= LOCKED_PREFIX.length) ||
                    (e.key === 'Delete'    && start <  LOCKED_PREFIX.length)) {
                        e.preventDefault();
                        inputBox.setSelectionRange(LOCKED_PREFIX.length, LOCKED_PREFIX.length);
                        return;
                }
                // цифри — ок (ліміт доб'ємо на input)
                if (/^\d$/.test(e.key)) return;

                // «розумний» Backspace/Delete — видаляємо ЦИФРУ (пробіли/дужки підуть самі)
                if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();

                        const val = inputBox.value;
                        const digits = digitsAfterUA(val).split('');
                        const before = digitIndexBeforeCaretUA(val, start);
                        const after  = digitIndexBeforeCaretUA(val, end);

                        if (start !== end) {
                                // видалити всі цифри у виділенні
                                const remove = Math.max(0, after - before);
                                digits.splice(before, remove);
                                const formatted = formatUA(digits.join(''));
                                const caret = caretPosForDigitCountUA(formatted, before);
                                inputBox.value = formatted;
                                inputBox.setSelectionRange(caret, caret);
                                return;
                        }

                        if (e.key === 'Backspace') {
                                if (before > 0) {
                                        digits.splice(before - 1, 1);
                                        const formatted = formatUA(digits.join(''));
                                        const caret = caretPosForDigitCountUA(formatted, before - 1);
                                        inputBox.value = formatted;
                                        inputBox.setSelectionRange(caret, caret);
                                }
                                return;
                        }
                        if (e.key === 'Delete') {
                                if (before < digits.length) {
                                        digits.splice(before, 1);
                                        const formatted = formatUA(digits.join(''));
                                        const caret = caretPosForDigitCountUA(formatted, before);
                                        inputBox.value = formatted;
                                        inputBox.setSelectionRange(caret, caret);
                                }
                                return;
                        }
                        return;
                }

                // інше блокуємо
                e.preventDefault();

        } else {
                // інші країни: префікс без пробілу, без маски
                if ((e.key === 'Backspace' && start <= currentPrefix.length) ||
                    (e.key === 'Delete'    && start <  currentPrefix.length)) {
                        e.preventDefault();
                        inputBox.setSelectionRange(currentPrefix.length, currentPrefix.length);
                        return;
                }
                if (/^\d$/.test(e.key) || e.key === 'Backspace' || e.key === 'Delete') return;
                e.preventDefault();
        }
});
// ---- Normalize on input/paste/focus: применяем маску/лимит ----
const normalize = () => (isUA ? applyUA() : applyGeneric());

inputBox.addEventListener('input', normalize);
inputBox.addEventListener('paste', () => requestAnimationFrame(normalize));
inputBox.addEventListener('focus', normalize);


// ====== NAME FIELDS: перша літера велика, без пробілів/цифр; пробіл -> наступне поле ======
const nameIds = ['lastName','firstName','middleName'];
const nameEls = nameIds.map(id => document.getElementById(id));

// дозволені символи: літери укр/лат + апострофи/дефіси (без пробілів)
const NAME_KEEP_RE = /[^A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’\-]/g;

function normalizeNameValue(raw) {
        // прибираємо все зайве (цифри, пробіли та ін.)
        let v = (raw || '').replace(NAME_KEEP_RE, '');
        if (!v) return '';
        // перша літера — велика
        return v.charAt(0).toUpperCase() + v.slice(1);
}

function focusNext(fromId) {
        const idx = nameIds.indexOf(fromId);
        if (idx >= 0 && idx < nameEls.length - 1) {
                nameEls[idx + 1].focus();
        }
}

// навішуємо обробники
nameEls.forEach((el, i) => {
        if (!el) return;

        // При наборі — чистимо і робимо першу літеру великою
        el.addEventListener('input', () => {
                const pos = el.selectionStart;
                const normalized = normalizeNameValue(el.value);
                // щоб курсор не скакав: якщо ми тільки підняли регістр 1-ї літери — тримаємо позицію
                const wasLen = el.value.length;
                el.value = normalized;
                if (pos !== null) {
                        const delta = el.value.length - wasLen;
                        el.setSelectionRange(Math.max(1, pos + delta), Math.max(1, pos + delta));
                }
        });

        // Пробіл: не вставляємо, а перескакуємо на наступне поле
        el.addEventListener('keydown', (e) => {
                if (e.key === ' ') {
                        e.preventDefault();
                        // перед переходом нормалізуємо значення
                        el.value = normalizeNameValue(el.value);
                        focusNext(el.id);
                }
        });

        // На blur — остаточна нормалізація
        el.addEventListener('blur', () => {
                el.value = normalizeNameValue(el.value);
        });

        // перестраховка від автозаміни/пропозицій (деякі браузери ігнорять атрибути)
        el.setAttribute('autocomplete','off');
        el.setAttribute('autocorrect','off');
        el.setAttribute('spellcheck','false');
        el.setAttribute('autocapitalize','words');
});


// ====== CITY AUTOCOMPLETE ======
const cityInput = document.getElementById('city');
const cityList  = document.getElementById('citySuggest');

/**
 * Список міст.
 * ⚠️ Тут тестова добірка (обласні центри + популярні).
 * Ти можеш підставити ПОВНИЙ список (масив рядків) – алгоритм вже готовий.
 */
const uaCities = [
        'Київ','Харків','Одеса','Дніпро','Донецьк','Запоріжжя','Львів','Кривий Ріг','Миколаїв','Маріуполь',
        'Луганськ','Вінниця','Макаївка','Сімферополь','Севастополь','Хмельницький','Полтава','Чернігів',
        'Черкаси','Житомир','Суми','Рівне','Кропивницький','Івано-Франківськ','Тернопіль','Ужгород',
        'Чернівці','Луцьк','Біла Церква','Камʼянське','Кременчук','Бровари','Нікополь','Бердянськ',
        'Славутич','Бориспіль','Ірпінь','Буча'
];

function renderCityList(items, query) {
        cityList.innerHTML = '';
        if (!items.length) {
                const li = document.createElement('li');
                li.className = 'muted';
                li.textContent = `Не знайдено: "${query}"`;
                cityList.appendChild(li);
                cityList.hidden = false;
                return;
        }
        items.slice(0, 50).forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                li.addEventListener('mousedown', (e) => { // mousedown щоб не губити фокус
                        cityInput.value = name;
                        cityList.hidden = true;
                });
                cityList.appendChild(li);
        });
        cityList.hidden = false;
}

function filterCities(q) {
        const norm = q.trim().toLowerCase();
        if (!norm) { cityList.hidden = true; return; }
        const res = uaCities.filter(c => c.toLowerCase().includes(norm));
        renderCityList(res, q);
}

cityInput.addEventListener('input', () => filterCities(cityInput.value));
cityInput.addEventListener('focus', () => filterCities(cityInput.value));
document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !cityList.contains(e.target)) cityList.hidden = true;
});

// ====== COMMENT COUNTER (max 400) ======
const comment = document.getElementById('comment');
const cnt = document.getElementById('cnt');
if (comment) {
        const sync = () => { cnt.textContent = String(comment.value.length); };
        comment.addEventListener('input', sync);
        comment.addEventListener('focus', sync);
        sync();
}
window.phoneApi = {
        getState: () => ({ currentMax, currentPrefix, isUA }),
        digitsAfterUA: (v) => digitsAfterUA(v),
};
