/* file-uploader.js
   Единая и надёжная логика:
   - работают обе зоны: .file-upload-box и .file-up-3
   - работают оба триггера: .relative (3D-папка) и .Documents-btn
   - слушаем все .file-browse-input (их может быть несколько)
   - выбранные файлы рендерятся синхронно во все .file-list
   - drag&drop на обе зоны
   - защита от «двойного открытия» системного диалога
*/

(() => {
    // ===== Настройки =====
    const MAX_FILES  = 3;
    const MAX_BYTES  = 50 * 1024 * 1024; // 50 MB
    const ALLOWED_EXT = ['jpg','jpeg','png','webp','pdf','doc','docx','ppt','pptx'];

    // ===== Узлы =====
    const fileLists   = Array.from(document.querySelectorAll('.file-list')); // может быть 2
    const fileInputs  = Array.from(document.querySelectorAll('.file-browse-input')); // может быть 2
    const dropZones   = Array.from(document.querySelectorAll('.file-upload-box, .file-up-3'));
    const clickers    = Array.from(document.querySelectorAll('.relative, .Documents-btn, .file-upload-box, .file-up-3'));
    const form        = document.querySelector('.contact-form');

    // ===== Состояние =====
    let picked = [];          // [{file, id, key}]
    let pickerBusy = false;   // защита от двойного открытия

    // ===== Утилиты =====
    const extOf = (name) => (name.split('.').pop() || '').toLowerCase();
    const prettySize = (b) => (b >= 1048576 ? (b/1048576).toFixed(2) + ' MB' : (b/1024).toFixed(2) + ' KB');
    const makeKey = (f) => `${f.name}__${f.size}__${f.lastModified || 0}`;

    function warn(msg){
        if (window.notify) window.notify('warning', msg);
        else alert(msg);
    }


    // ===== Рендер списков (во все .file-list синхронно) =====
    function renderAllLists(){
        fileLists.forEach(list => {
            list.innerHTML = '';
            picked.forEach(({file, id}) => {
                const li = document.createElement('li');
                li.className = 'file-item';
                li.innerHTML = `
          <div class="file-extension">${extOf(file.name)}</div>
          <div class="file-content-wrapper">
            <div class="file-content">
              <div class="file-details">
                <h5 class="file-name">${file.name}</h5>
                <div class="file-info">
                  <small class="file-size">${prettySize(file.size)}</small>
                </div>
              </div>
              <button class="cancel-button" aria-label="Remove" type="button">✖</button>
            </div>
          </div>
        `;
                li.querySelector('.cancel-button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    picked = picked.filter(x => x.id !== id);
                    renderAllLists();
                });
                list.appendChild(li);
            });
        });
    }

    // ===== Добавление файлов (валидация + дедупликация) =====
    function addFiles(fileList){
        const arr = Array.from(fileList || []);
        for (const f of arr){
            if (picked.length >= MAX_FILES){
                warn(`Максимум ${MAX_FILES} файли(в).`);
                break;
            }
            const e = extOf(f.name);
            if (!ALLOWED_EXT.includes(e)){
                warn(`Неприпустимий тип: .${e}`);
                continue;
            }
            if (f.size > MAX_BYTES){
                warn(`Файл завеликий (> ${(MAX_BYTES/1048576)|0} MB)`);
                continue;
            }
            const key = makeKey(f);
            if (picked.some(x => x.key === key)) {
                // уже добавлен — пропускаем
                continue;
            }
            picked.push({ file: f, id: Date.now() + Math.random(), key });
        }
        renderAllLists();
    }

    // ===== Открытие системного диалога =====
    function openPicker(fromEl, ev){
        // если жмут на кнопку удаления — игнор
        if (ev?.target?.closest?.('.cancel-button')) return;

        // защита от двойного открытия
        if (pickerBusy) return;
        pickerBusy = true;

        // берём ближайший инпут в пределах формы, иначе первый/последний на странице
        const localInput = fromEl.closest('form')?.querySelector('.file-browse-input');
        const input = localInput || fileInputs[0] || fileInputs.at(-1);
        if (!input){
            pickerBusy = false;
            return;
        }
        input.click();
    }

    // ===== Слушатели клика по триггерам (кнопки, зоны) =====
    clickers.forEach(el => {
        el.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openPicker(el, ev);
        });
    });

    // На всякий случай — клики по hidden input не «пузырятся» наружу
    fileInputs.forEach(inp => {
        inp.addEventListener('click', (ev) => ev.stopPropagation());
    });

    // ===== Слушатели change у всех input[type=file] =====
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length) addFiles(files);
            // позволить выбрать тот же файл повторно
            e.target.value = '';
            // диалог закрыт → можно открывать снова
            pickerBusy = false;
        });
        // Если пользователь закрыл диалог без выбора (ESC/крестик),
        // инпут получает фокус — снимем busy на следующий тик
        input.addEventListener('focus', () => {
            setTimeout(() => { pickerBusy = false; }, 0);
        });
    });

    // ===== Drag & Drop на обеих зонах =====
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('active');
        });
        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('active');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('active');
            addFiles(e.dataTransfer.files);
        });
    });


    function validateFormFields() {
        const tel       = form.querySelector('input[name="tel"]');
        const lastName  = document.getElementById('lastName');
        const firstName = document.getElementById('firstName');
        const middle    = document.getElementById('middleName');
        const city      = document.getElementById('city');
        const comment   = document.getElementById('comment');

        // 1) Обязательные поля (кроме файлов)
        const required = [
            [lastName,  'Прізвище'],
            [firstName, 'Ім’я'],
            [middle,    'По батькові'],
            [city,      'Місто'],
            [comment,   'Коментар'],
        ];
        for (const [el, label] of required) {
            if (!el || !el.value.trim()) {
                warn(`Заповніть поле «${label}».`);
                el?.focus();
                return false;
            }
        }

        // 2) Телефон: довжина по країні
        if (!tel) { warn('Поле телефону відсутнє.'); return false; }

        const api = window.phoneApi;
        const st  = api?.getState ? api.getState() : {};
        const need   = Number(st.currentMax) || 0;          // скільки цифр потрібно
        const prefix = st.currentPrefix || '';              // наприклад "+380"
        const isUA   = Boolean(st.isUA);

        const raw = tel.value || '';
        let digitsCount = 0;

        if (isUA) {
            // беремо тільки цифри ПІСЛЯ "+380 "
            digitsCount = api?.digitsAfterUA ? api.digitsAfterUA(raw).length
                : raw.replace(/\D+/g,'').replace(/^380/,'').length;
        } else {
            // інші країни — рахуємо цифри ПІСЛЯ префікса
            const rest = (prefix && raw.startsWith(prefix))
                ? raw.slice(prefix.length)
                : raw.replace(/^\+\d+\s?/, ''); // fallback, якщо префікс не прочитався
            digitsCount = rest.replace(/\D+/g,'').length;
        }

        if (need > 0 && digitsCount !== need) {
            const humanPrefix = isUA ? '+380' : (prefix || '');
            warn(`Номер телефону неповний: для ${humanPrefix} потрібно ${need} цифр, зараз ${digitsCount}.`);
            tel.focus();
            return false;
        }

        return true;
    }





    // ===== Отправка формы (оставил совместимой) =====
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form) return;

        const toast = (type, msg) => window.notify ? window.notify(type, msg) : alert(msg);

        // --- валидация обязательных полей (кроме файлов) + телефон ---
        const tel       = form.querySelector('input[name="tel"]');
        const lastName  = document.getElementById('lastName');
        const firstName = document.getElementById('firstName');
        const middle    = document.getElementById('middleName');
        const city      = document.getElementById('city');
        const comment   = document.getElementById('comment');

        const required = [
            [lastName,  'Прізвище'],
            [firstName, 'Ім’я'],
            [middle,    'По батькові'],
            [city,      'Місто'],
            [comment,   'Коментар'],
        ];
        for (const [el, label] of required) {
            if (!el || !el.value || !el.value.trim()) {
                warn(`Заповніть поле «${label}».`);
                el?.focus();
                return;
            }
        }

        // Телефон: длина по стране (читает из window.phoneApi, есть фолбек)
        const getPhoneState = () => {
            if (window.phoneApi?.getState) return window.phoneApi.getState();
            const opt = document.querySelector('#country option:checked, select[name="country"] option:checked');
            const currentMax = opt?.dataset?.max ? Number(opt.dataset.max) : NaN;
            const currentPrefix = opt?.dataset?.prefix || '';
            const isUA = currentPrefix === '+380';
            return { currentMax, currentPrefix, isUA };
        };

        if (!tel) { warn('Поле телефону відсутнє.'); return; }

        const { currentMax, currentPrefix, isUA } = getPhoneState();
        const need = Number(currentMax);
        const raw  = tel.value ?? '';
        const fallbackDigitsAfterUA = (s) => s.replace(/\D+/g, '').replace(/^380/, '');
        let digitsCount;

        if (Number.isFinite(need) && need > 0) {
            if (isUA) {
                const fn = window.phoneApi?.digitsAfterUA || fallbackDigitsAfterUA;
                digitsCount = fn(raw).length;
            } else {
                const rest = currentPrefix && raw.startsWith(currentPrefix)
                    ? raw.slice(currentPrefix.length)
                    : raw.replace(/^\+\d+\s?/, '');
                digitsCount = rest.replace(/\D+/g, '').length;
            }
            if (digitsCount !== need) {
                const humanPrefix = isUA ? '+380' : (currentPrefix || '');
                warn(`Номер телефону неповний: для ${humanPrefix} потрібно ${need} цифр, зараз ${digitsCount}.`);
                tel.focus();
                return;
            }
        } else {
            const rest = currentPrefix && raw.startsWith(currentPrefix)
                ? raw.slice(currentPrefix.length)
                : raw.replace(/^\+\d+\s?/, '');
            const digits = rest.replace(/\D+/g, '');
            if (digits.length < 7) {
                warn('Номер телефону занадто короткий.');
                tel.focus();
                return;
            }
        }

        // --- UI: блокируем кнопку ---
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        const originalText = submitBtn?.textContent;
        const setBusy = (busy) => {
            if (!submitBtn) return;
            submitBtn.disabled = !!busy;
            submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
            if (busy && originalText) submitBtn.textContent = 'Надсилання…';
            if (!busy && originalText != null) submitBtn.textContent = originalText;
        };

        // --- сборка FormData + файлы ---
        const fd = new FormData(form);
        try {
            if (Array.isArray(picked)) { // локальный массив из этого же файла
                picked.forEach(({ file }) => file && fd.append('files[]', file, file.name));
            }
        } catch (_) {}

        const action = form.getAttribute('action') || form.action || 'form_submit.php';

        // --- отправка ---
        setBusy(true);
        try {
            const resp = await fetch(action, { method: 'POST', body: fd });
            let data = null; try { data = await resp.json(); } catch {}

            if (resp.ok && (!data || data.ok)) {
                toast('success', 'Надіслано!');

                // 1) очищаем выбранные файлы (локальный массив)
                picked.length = 0;

                // 2) перерисовываем все .file-list
                renderAllLists();

                // 3) чистим все <input type="file">
                fileInputs.forEach(inp => { try { inp.value = ''; } catch (_) {} });

                // 4) снимаем подсветку дроп-зон
                dropZones.forEach(z => z.classList.remove('active'));

                // 5) сбрасываем форму
                form.reset();
            } else {
                const msg = (data && (data.error || data.message)) || `HTTP ${resp.status}`;
                toast('error', `Помилка під час надсилання: ${msg}`);
            }
        } catch (err) {
            toast('error', 'Помилка мережі. Спробуйте ще раз.');
        } finally {
            setBusy(false);
        }
    });




    // ===== Прокси-кнопка «Надіслати» (если используется .button.type--C) =====
    (function proxySubmit(){
        const proxy = document.querySelector('.button.type--C');
        if (!proxy) return;

        if (!proxy.hasAttribute('href')) proxy.setAttribute('href', '#');
        proxy.setAttribute('role', 'button');
        proxy.setAttribute('tabindex', '0');

        function triggerSubmit() {
            const f = proxy.closest('form') || document.querySelector('form');
            if (!f) return;
            const realBtn = f.querySelector('.send-btn');
            if (f.reportValidity && !f.reportValidity()) return;
            if (realBtn) realBtn.click();
            else if (f.requestSubmit) f.requestSubmit();
            else f.submit();
        }
        form?.addEventListener('reset', () => {
            picked.length = 0;
            renderAllLists();
            fileInputs.forEach(inp => { try { inp.value = ''; } catch (_) {} });
            dropZones.forEach(z => z.classList.remove('active'));
            if (window.notify) window.notify('info', 'Файли очищено');
        });


        proxy.addEventListener('click', (e) => { e.preventDefault(); triggerSubmit(); });
        proxy.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSubmit(); }
        });
    })();
})();
