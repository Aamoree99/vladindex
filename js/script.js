/* ========== Мобильное меню ========== */
(() => {
  const toggle = document.querySelector('.nav__toggle');
  const list   = document.getElementById('nav-list');
  if (!toggle || !list) return;

  const open  = () => { document.body.setAttribute('data-nav-open','true');  toggle.setAttribute('aria-expanded','true');  };
  const close = () => { document.body.removeAttribute('data-nav-open');      toggle.setAttribute('aria-expanded','false'); };

  toggle.addEventListener('click', () => {
    document.body.hasAttribute('data-nav-open') ? close() : open();
  });

  // закрытие по клику на ссылку, по Esc и по клику вне меню
  list.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => {
    if (!document.body.hasAttribute('data-nav-open')) return;
    if (e.target.closest('.nav')) return;
    close();
  }, true);
})();

/* ===== ScrollSpy для навигации ===== */
(() => {
  const nav = document.querySelector('.nav__list');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('.nav__link[href^="#"]'));
  const targets = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach(a => {
      const on = a.getAttribute('href') === `#${id}`;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current','page');
      else    a.removeAttribute('aria-current');
    });
  };

  // Подсказка по клику (моментально)
  links.forEach(a => {
    a.addEventListener('click', () => {
      const id = (a.getAttribute('href') || '').slice(1);
      if (id) setActive(id);
    });
  });

  // Наблюдаем секции
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      setActive(e.target.id);
    });
  }, {
    // «активной» считаем секцию, когда её верх в средней зоне вьюпорта
    root: null,
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  });

  targets.forEach(sec => sec.id && io.observe(sec));
})();

/* ========== Слайдер отзывов (без точек) ========== */
(async () => {
  const root = document.querySelector('#testimonials .slider');
  if (!root) return;

  const viewport = root.querySelector('.slider__viewport');
  const track    = root.querySelector('.slider__track');
  const prevBtn  = root.querySelector('.slider__arrow--prev');
  const nextBtn  = root.querySelector('.slider__arrow--next');

  if (!viewport.hasAttribute('tabindex')) viewport.setAttribute('tabindex','0');

  // --- 1) Источник данных ---
  // приоритет: data-src на .slider -> абсолютный по-умолчанию
  const JSON_URL = root.dataset.src || '/data/testimonials.json';

  const esc = s => String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');

  async function loadData() {
    console.info('[testimonials] loading JSON:', JSON_URL, 'from page:', window.location.pathname);
    try {
      const res = await fetch(JSON_URL, { cache:'no-store' });
      if (!res.ok) {
        console.error('[testimonials] HTTP error:', res.status, res.statusText);
        return null;
      }
      const json = await res.json();
      if (!Array.isArray(json)) {
        console.error('[testimonials] JSON is not an array:', json);
        return null;
      }
      return json;
    } catch (e) {
      console.error('[testimonials] fetch/parse failed:', e);
      return null;
    }
  }

  // --- 2) Разметка ---
  function render(data) {
    track.innerHTML = data.map(({ text, author }, i) => `
      <li class="slide" role="group" aria-roledescription="slide" aria-label="${i+1} из ${data.length}">
        <figure class="t-card">
          <div class="t-card__quote" aria-hidden="true">“</div>
          <blockquote class="t-card__text">${esc(text ?? '')}</blockquote>
          <figcaption class="t-card__author">— ${esc(author ?? 'Анонимный пациент')}</figcaption>
        </figure>
      </li>
    `).join('');
  }

  // --- 3) Навигация ---
  let slides = [];
  let index = 0;

  function goTo(i, instant=false) {
    const n = slides.length;
    if (!n) return;
    index = (i + n) % n;
    track.style.transition = instant ? 'none' : 'transform .45s cubic-bezier(.2,.7,.2,1)';
    track.style.transform  = `translateX(-${index * 100}%)`;
    if (instant) requestAnimationFrame(() => {
      track.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1)';
    });
  }
  const next = () => goTo(index + 1);
  let autoTimer;
  const AUTO_INTERVAL = 6000; // 6 секунд между сменами

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, AUTO_INTERVAL);
  }
  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

// останавливаем при наведении и фокусе, возобновляем при уходе
  viewport.addEventListener('mouseenter', stopAuto);
  viewport.addEventListener('mouseleave', startAuto);
  viewport.addEventListener('focusin', stopAuto);
  viewport.addEventListener('focusout', startAuto);
  const prev = () => goTo(index - 1);

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  viewport.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  // свайп с предпросмотром
  let dragging = false, startX = 0, moved = false;
  const unify = e => e.changedTouches ? e.changedTouches[0] : e;

  viewport.addEventListener('pointerdown', e => {
    dragging = true; moved = false;
    startX = unify(e).clientX;
    track.style.transition = 'none';
    viewport.setPointerCapture?.(e.pointerId);
  }, { passive:true });

  viewport.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = unify(e).clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    track.style.transform = `translateX(calc(${-index*100}% + ${dx}px))`;
  }, { passive:true });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    const dx = unify(e).clientX - startX;
    const thr = Math.min(120, viewport.clientWidth * 0.18);
    if (dx >  thr) prev();
    else if (dx < -thr) next();
    else goTo(index);
  }
  viewport.addEventListener('pointerup', endDrag, { passive:true });
  viewport.addEventListener('pointercancel', endDrag, { passive:true });
  track.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);

  // ресайз: фикс ширины слайдов
  function fixWidths() { slides.forEach(s => s.style.width = viewport.clientWidth + 'px'); }
  window.addEventListener('resize', () => { fixWidths(); goTo(index, true); });

  // --- 4) Инициализация ---
  let data = await loadData();
  if (!data || !data.length) {
    console.warn('[testimonials] using fallback data');
    data = [
      { text: 'Доктор Шнырёв помог мне преодолеть зависимость. Профессионал своего дела.', author: 'Анонимный пациент' },
      { text: 'Внимательный, спокойный, объясняет без воды. Рекомендую.', author: 'Наталья К.' },
      { text: 'После курса у врача впервые почувствовал контроль над жизнью.', author: 'Михаил П.' }
    ];
  }

  render(data);
  slides = Array.from(track.children);
  fixWidths();
  goTo(0, true);
  startAuto();

})();

// ===== Modal logic (Esc, клик по фону, запрет скролла, фокус) =====
(function () {
  const body = document.body;
  const modal = document.getElementById('privacyModal');
  const openBtn = document.getElementById('openPrivacy');
  const closeBtn = document.getElementById('closePrivacy');
  const okBtn = document.getElementById('privacyOk');
  const printBtn = document.getElementById('privacyPrint');
  const backdrop = modal.querySelector('.modal__backdrop');

  let lastFocused = null;

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    // фокус на кнопку закрытия
    closeBtn?.focus();
    // примитивный фокус-трэп
    document.addEventListener('focus', trapFocus, true);
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    document.removeEventListener('focus', trapFocus, true);
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeModal();
  }

  function trapFocus(e) {
    if (!modal.classList.contains('open')) return;
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      closeBtn?.focus();
    }
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  okBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  printBtn?.addEventListener('click', () => window.print());
})();
