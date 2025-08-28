/* notifications.js
   Файл, который у тебя сейчас начинается так:
   const notifications = document.querySelector(".notifications"),
         buttons = document.querySelectorAll(".buttons .btn");
   ↓ Полная замена: делаем универсальный window.notify(type, text)
*/
(() => {
    const wrap = document.querySelector('.notifications');
    const DEFAULT_MS = 5000; // синхронно с твоим CSS (progress 5s)
    const ICON = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info:    'fa-circle-info'
    };

    function removeToast(toast) {
        toast.classList.add('hide');
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
        setTimeout(() => toast.remove(), 500);
    }

    function show(type, text, ms = DEFAULT_MS) {
        if (!wrap) return alert(text); // безопасный фолбек
        const li = document.createElement('li');
        li.className = `toast ${type}`;
        li.innerHTML = `
      <div class="column">
        <i class="fa-solid ${ICON[type] || ICON.info}"></i>
        <span>${text}</span>
      </div>
      <i class="fa-solid fa-xmark" role="button" aria-label="Close"></i>`;
        li.querySelector('.fa-xmark').onclick = () => removeToast(li);
        wrap.appendChild(li);
        li.timeoutId = setTimeout(() => removeToast(li), ms);
    }

    // Глобальная функция для показа тостов из любых файлов
    window.notify = (type, text, opts = {}) => show(type, text, opts.timer);

    // Поддержка твоих демо-кнопок (можно оставить/удалить — не мешает)
    document.querySelectorAll('.buttons .btn')?.forEach(btn => {
        btn.addEventListener('click', () => window.notify(btn.id, btn.id.toUpperCase()));
    });
})();
