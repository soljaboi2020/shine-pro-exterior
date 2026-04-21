/* =======================================================
   ShinePro Exterior Care — client-side logic
   - Instant quote calculator (interpolates between price anchors)
   - First-time visitor WELCOME10 popup
   - Seasonal banner (edit SEASONAL_BANNER below to show/hide)
   - Multi-step booking modal (posts to /api/book — stubbed for now)
   - Smooth scroll + footer year
   ======================================================= */

/* ---------- Config you can edit ---------- */

// Flip `.enabled = true` to show the banner site-wide.
// Edit `.text` to change the message (supports emoji).
const SEASONAL_BANNER = {
  enabled: false,
  text: '🌸 Pollen season is here — book now before your windows disappear!'
};

// Price anchors used by the Instant Quote calculator.
// If Tyson's pricing changes, just edit these numbers.
const PRICE_ANCHORS = [
  { count: 10, min: 125, max: 125 },
  { count: 20, min: 175, max: 175 },
  { count: 30, min: 250, max: 275 },
  { count: 40, min: 350, max: 400 },
  { count: 50, min: 450, max: 500 }
];

/* ---------- DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Seasonal banner ---------- */
function initSeasonalBanner() {
  const banner = $('#seasonal-banner');
  const text   = $('#seasonal-banner-text');
  const close  = $('#seasonal-banner-close');
  if (!banner) return;

  const dismissedKey = 'shinepro:banner-dismissed';
  const dismissed = localStorage.getItem(dismissedKey) === (SEASONAL_BANNER.text || '');

  if (!SEASONAL_BANNER.enabled || dismissed) {
    banner.classList.add('hidden');
    return;
  }
  text.textContent = SEASONAL_BANNER.text;
  banner.classList.remove('hidden');
  close.addEventListener('click', () => {
    banner.classList.add('hidden');
    localStorage.setItem(dismissedKey, SEASONAL_BANNER.text);
  });
}

/* ---------- Hero before/after rotator ---------- */
// Click the image, the "See another →" button, or a dot to advance.
// Auto-rotates every 5 seconds; pauses on hover / keyboard focus.
const HERO_PHOTOS = [
  { src: 'assets/before-after/arched-window-02.jpg',          alt: 'Arched window — mildew and algae erased to sparkling clean' },
  { src: 'assets/before-after/tall-window-reflection-03.jpg', alt: 'Tall window — heavy mineral deposits restored to mirror-clear' },
  { src: 'assets/before-after/window-track-01.jpg',           alt: 'Window track detail — grime blasted out to spotless white' }
];

function initHeroRotator() {
  const rotator = $('#hero-rotator');
  const img     = $('#hero-img');
  const dotsEl  = $('#hero-dots');
  const counter = $('#hero-counter');
  const nextBtn = $('#hero-next-btn');
  if (!rotator || !img || !dotsEl) return;

  // Figure out the asset base path from the initial <img> so per-city pages
  // (which sit one or two dirs deep and use "../../assets/…") still work.
  const initialSrc  = img.getAttribute('src') || '';
  const assetBase   = initialSrc.includes('assets/') ? initialSrc.replace(/assets\/.*$/, '') : '';
  const resolveSrc  = (rel) => assetBase + rel;

  let idx = 0;
  let autoTimer = null;

  // Build dots
  HERO_PHOTOS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-dot';
    dot.setAttribute('aria-label', `Show photo ${i + 1} of ${HERO_PHOTOS.length}`);
    dot.addEventListener('click', (e) => { e.stopPropagation(); go(i); });
    dotsEl.appendChild(dot);
  });

  function render() {
    const photo = HERO_PHOTOS[idx];
    // Quick fade-out → swap → fade-in
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = resolveSrc(photo.src);
      img.alt = photo.alt;
      img.style.opacity = '1';
    }, 180);

    Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === idx));
    if (counter) counter.textContent = `${idx + 1} / ${HERO_PHOTOS.length}`;
  }

  function go(i) {
    idx = ((i % HERO_PHOTOS.length) + HERO_PHOTOS.length) % HERO_PHOTOS.length;
    render();
    resetAuto();
  }
  function next() { go(idx + 1); }

  function startAuto() { if (!autoTimer) autoTimer = setInterval(next, 5000); }
  function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function resetAuto() { stopAuto(); startAuto(); }

  // Click image or the "See another →" button → next
  rotator.addEventListener('click', (e) => {
    if (e.target.closest('.hero-dot')) return; // dots handle themselves
    next();
  });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  // Keyboard — allow Space / Enter / Arrow keys on the rotator
  rotator.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
  });

  // Pause on hover/focus, resume on leave/blur
  rotator.addEventListener('mouseenter', stopAuto);
  rotator.addEventListener('mouseleave', startAuto);
  rotator.addEventListener('focusin',    stopAuto);
  rotator.addEventListener('focusout',   startAuto);

  render();
  startAuto();
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Smooth scroll (for nav anchors) ---------- */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href === '#top') return;
      const target = $(href);
      if (!target) return;
      // Let the native CSS scroll-behaviour handle it — don't preventDefault.
    });
  });
}

/* ---------- Instant Quote ---------- */
function interpolateQuote(n) {
  if (n <= 0) return { label: '—', note: 'Enter a number of windows to see your estimate.' };
  if (n < 10) return { label: '$125 minimum', note: 'We charge a $125 minimum for jobs under 10 windows.' };
  if (n > 50) return { label: '$500+', note: 'For jobs this big, call Tyson directly for an exact quote.' };

  // Find the two anchors that bracket n
  let lo = PRICE_ANCHORS[0], hi = PRICE_ANCHORS[PRICE_ANCHORS.length - 1];
  for (let i = 0; i < PRICE_ANCHORS.length - 1; i++) {
    if (n >= PRICE_ANCHORS[i].count && n <= PRICE_ANCHORS[i+1].count) {
      lo = PRICE_ANCHORS[i];
      hi = PRICE_ANCHORS[i+1];
      break;
    }
  }

  // Linear interpolate min and max between anchors
  const t = (hi.count === lo.count) ? 0 : (n - lo.count) / (hi.count - lo.count);
  const minPrice = Math.round(lo.min + t * (hi.min - lo.min));
  const maxPrice = Math.round(lo.max + t * (hi.max - lo.max));

  const label = (minPrice === maxPrice)
    ? `$${minPrice}`
    : `$${minPrice} – $${maxPrice}`;

  const note = (n === 10 || n === 20 || n === 30 || n === 40 || n === 50)
    ? 'Estimate only. Text or call Tyson at (407) 754-5565 for an exact quote.'
    : 'In-between estimate. Call Tyson at (407) 754-5565 for an exact quote.';

  return { label, note };
}

function initQuoteCalculator() {
  const slider  = $('#quote-count');
  const display = $('#quote-count-display');
  const price   = $('#quote-price');
  const note    = $('#quote-note');
  const minusBtn = $('#quote-minus');
  const plusBtn  = $('#quote-plus');
  if (!slider) return;

  const render = () => {
    const n = parseInt(slider.value, 10) || 0;
    display.textContent = n;
    const { label, note: noteText } = interpolateQuote(n);
    price.textContent = label;
    note.textContent = noteText;
  };

  slider.addEventListener('input', render);
  minusBtn.addEventListener('click', () => { slider.value = Math.max(parseInt(slider.min, 10), parseInt(slider.value, 10) - 1); render(); });
  plusBtn.addEventListener('click',  () => { slider.value = Math.min(parseInt(slider.max, 10), parseInt(slider.value, 10) + 1); render(); });

  // Prefill booking window count when user clicks "Book this price"
  $('#quote-book-btn')?.addEventListener('click', () => {
    const input = $('#window-count-input');
    if (input) input.value = slider.value;
    openBooking();
  });

  render();
}

/* ---------- First-time WELCOME10 popup ---------- */
function initWelcomePopup() {
  const WELCOMED_KEY = 'shinepro:welcomed';
  const overlay   = $('#welcome-overlay');
  const closeBtn  = $('#welcome-close');
  const skipBtn   = $('#welcome-skip-btn');
  const bookBtn   = $('#welcome-book-btn');
  if (!overlay) return;

  const dismiss = () => {
    overlay.classList.add('hidden');
    localStorage.setItem(WELCOMED_KEY, '1');
  };

  const shown = localStorage.getItem(WELCOMED_KEY) === '1';
  if (!shown) {
    // Delay by ~6s so it's not jarring
    setTimeout(() => {
      overlay.classList.remove('hidden');
    }, 6000);
  }

  closeBtn?.addEventListener('click', dismiss);
  skipBtn?.addEventListener('click', dismiss);
  bookBtn?.addEventListener('click', () => {
    dismiss();
    // Prefill the coupon field for the user
    const coupon = $('#book-coupon');
    if (coupon) coupon.value = 'WELCOME10';
    openBooking();
  });

  // Click backdrop to close
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
}

/* ---------- Booking modal ---------- */
let currentStep = 1;
const MAX_STEP = 4;

function openBooking() {
  $('#booking-overlay').classList.remove('hidden');
  showStep(1);
  document.body.style.overflow = 'hidden';
}
function closeBooking() {
  $('#booking-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}
function showStep(n) {
  currentStep = n;
  // Steps
  $$('.booking-step').forEach(el => el.classList.toggle('hidden', parseInt(el.dataset.step, 10) !== n));
  // Dots
  $$('.step-dot').forEach(d => {
    const s = parseInt(d.dataset.step, 10);
    d.classList.toggle('active',   s === n);
    d.classList.toggle('complete', s < n);
  });
  // Nav buttons
  const back   = $('#booking-back');
  const next   = $('#booking-next');
  const submit = $('#booking-submit');
  const nav    = $('#booking-nav');

  if (n === 5) { // success
    nav.classList.add('hidden');
    return;
  }
  nav.classList.remove('hidden');
  back.classList.toggle('hidden', n === 1);
  next.classList.toggle('hidden',   n === MAX_STEP);
  submit.classList.toggle('hidden', n !== MAX_STEP);
}

function validateStep(n) {
  if (n === 1) {
    const picked = $$('input[name="service"]').some(r => r.checked);
    if (!picked) { alert('Please pick a service.'); return false; }
  }
  if (n === 2) {
    const date = $('#book-date').value;
    const time = $('#book-time').value;
    if (!date) { $('#book-date').focus(); alert('Please pick a preferred date.'); return false; }
    if (!time) { $('#book-time').focus(); alert('Please pick a preferred time.'); return false; }
  }
  if (n === 3) {
    const required = ['#book-name', '#book-phone', '#book-email', '#book-address'];
    for (const sel of required) {
      const el = $(sel);
      if (!el.value.trim()) { el.focus(); alert('Please fill in all starred (*) fields.'); return false; }
    }
    // Basic email sanity
    const email = $('#book-email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#book-email').focus(); alert('Please enter a valid email.'); return false; }
  }
  return true;
}

function buildBookingPayload() {
  return {
    service:      ($$('input[name="service"]').find(r => r.checked)?.value) || '',
    windowCount:  $('#window-count-input').value || null,
    preferredDate:$('#book-date').value,
    preferredTime:$('#book-time').value,
    name:         $('#book-name').value.trim(),
    phone:        $('#book-phone').value.trim(),
    email:        $('#book-email').value.trim(),
    address:      $('#book-address').value.trim(),
    gateCode:     $('#book-gate').value.trim(),
    pets:         $('#book-pets').value.trim(),
    coupon:       $('#book-coupon').value.trim().toUpperCase(),
    notes:        $('#book-notes').value.trim()
  };
}

function renderBookingSummary() {
  const p = buildBookingPayload();
  const line = (label, value) => value ? `<div><span class="text-slate-ink/60">${label}:</span> <strong class="text-ink">${escapeHtml(value)}</strong></div>` : '';
  $('#booking-summary').innerHTML = [
    line('Service', p.service),
    p.windowCount ? line('Windows', p.windowCount) : '',
    line('Date',    p.preferredDate),
    line('Time',    p.preferredTime),
    line('Name',    p.name),
    line('Phone',   p.phone),
    line('Email',   p.email),
    line('Address', p.address),
    line('Gate code', p.gateCode),
    line('Pets',      p.pets),
    line('Coupon',    p.coupon),
    p.notes ? line('Notes', p.notes) : ''
  ].filter(Boolean).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function submitBooking() {
  const payload = buildBookingPayload();
  const submitBtn = $('#booking-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    // Posts to /api/book on Vercel (stubbed for now — real Google-Calendar + email wiring comes next phase).
    // When there's no backend (file:// or before deploy), fall back to success so the user can still preview the flow.
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!res || !res.ok) {
      // Soft-success: surface the booking in a mailto as a backup, then show success UI
      const mailBody = encodeURIComponent(Object.entries(payload).map(([k,v]) => `${k}: ${v}`).join('\n'));
      window.open(`mailto:Tysont5076@gmail.com?subject=${encodeURIComponent('New booking request — ShinePro')}&body=${mailBody}`, '_blank');
    }
    showStep(5);
  } catch (err) {
    console.error(err);
    alert('Sorry, something went wrong. Please text Tyson directly at (407) 754-5565.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Send request';
  }
}

function initBookingModal() {
  // All "Book Now" buttons scattered across the page
  ['#nav-book-btn','#hero-book-btn','#services-book-btn','#gallery-book-btn','#contact-book-btn']
    .forEach(sel => $(sel)?.addEventListener('click', openBooking));

  $('#booking-close')?.addEventListener('click', closeBooking);
  $('#booking-success-close')?.addEventListener('click', closeBooking);

  $('#booking-next')?.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    const next = Math.min(currentStep + 1, MAX_STEP);
    if (next === MAX_STEP) renderBookingSummary();
    showStep(next);
  });
  $('#booking-back')?.addEventListener('click', () => showStep(Math.max(1, currentStep - 1)));
  $('#booking-submit')?.addEventListener('click', submitBooking);

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#booking-overlay').classList.contains('hidden')) closeBooking();
      if (!$('#welcome-overlay').classList.contains('hidden')) $('#welcome-overlay').classList.add('hidden');
    }
  });

  // Backdrop click closes booking
  $('#booking-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'booking-overlay') closeBooking();
  });

  // Reasonable min date = today
  const dateInput = $('#book-date');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }
}

/* ---------- Gallery lightbox ---------- */
// Click any .gallery-item (or its image) → opens an overlay with the enlarged photo.
// Supports prev/next arrows, keyboard (← → Esc), and backdrop-click to close.
function initLightbox() {
  const overlay  = $('#lightbox-overlay');
  const img      = $('#lightbox-img');
  const caption  = $('#lightbox-caption');
  const counter  = $('#lightbox-counter');
  const closeBtn = $('#lightbox-close');
  const prevBtn  = $('#lightbox-prev');
  const nextBtn  = $('#lightbox-next');
  if (!overlay || !img) return;

  const items = $$('.gallery-item');
  if (!items.length) return;

  // Build a catalog from the DOM so we don't have to duplicate photo data
  const photos = items.map((fig) => {
    const photo = fig.querySelector('img');
    const cap   = fig.querySelector('figcaption');
    // Caption text without the "Tap to enlarge" badge
    const capClone = cap ? cap.cloneNode(true) : null;
    capClone?.querySelector('.tap-hint')?.remove();
    return {
      src: photo?.src || '',
      alt: photo?.alt || '',
      caption: capClone ? capClone.textContent.trim() : ''
    };
  });

  let idx = 0;

  function render() {
    const p = photos[idx];
    img.src = p.src;
    img.alt = p.alt;
    caption.textContent = p.caption;
    counter.textContent = `${idx + 1} / ${photos.length}`;
  }

  function open(i) {
    idx = ((i % photos.length) + photos.length) % photos.length;
    render();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
  function nav(delta) {
    idx = ((idx + delta) % photos.length + photos.length) % photos.length;
    render();
  }

  // Wire gallery clicks
  items.forEach((fig, i) => {
    fig.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); nav(-1); });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); nav(1);  });

  // Backdrop click closes (but clicks on arrows / image don't)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Keyboard: Esc / ← / →
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); nav(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nav(1);  }
  });
}

/* ---------- ZIP code service-area checker ---------- */
// Central Florida ZIPs we actively serve (within 1-hour drive of Sanford, FL).
// "Close" = likely serviceable but may involve a short travel fee — we'll tell them to call.
// Anything else outside this list is treated as out-of-area.
const SERVICE_ZIPS = {
  // Sanford / Lake Mary / Heathrow / Longwood
  primary: [
    '32701','32703','32707','32708','32709','32710','32712','32713','32714','32715','32716','32718','32719',
    '32720','32721','32723','32724','32725','32728','32730','32732','32733','32738','32744','32745','32746','32747','32750','32751','32752','32753','32762','32763','32764','32765','32766','32767','32771','32772','32773','32774','32775','32779','32791','32792','32793','32794','32795','32796','32798','32799',
    // Winter Park / Maitland / Casselberry / Oviedo / Winter Springs / Altamonte Springs / Apopka
    '32789','32790','32704','32712','32776','32777','32718',
    // Orlando core (downtown + north)
    '32801','32802','32803','32804','32805','32806','32807','32808','32809','32810','32811','32812','32814','32817','32820','32825','32826','32828','32829','32831','32832','32833','32835','32839',
    // Deltona / DeBary / Orange City / DeLand / Lake Helen
    '32713','32725','32738','32744','32763','32720','32724','32728','32739','32744',
    // Geneva / Chuluota / Mims / Titusville edge
    '32732','32709','32754','32780','32781','32782','32783','32796'
  ],
  // Border zones — we MIGHT take the job, tell them to call
  close: [
    // Clermont / Winter Garden / Ocoee edge
    '34711','34712','34713','34714','34715','34734','34760','34761','34777','34778','34786','34787',
    // Kissimmee / St. Cloud edge
    '34741','34744','34746','34747','34758','34759','34769','34771','34772','34773',
    // Daytona / Port Orange / New Smyrna
    '32114','32117','32118','32119','32124','32127','32128','32129','32168','32169','32170','32174','32175','32176',
    // Leesburg / Eustis / Tavares edge
    '32726','32727','32735','32736','32757','32776','32778'
  ]
};

function initZipChecker() {
  const input  = $('#zip-input');
  const btn    = $('#zip-check-btn');
  const result = $('#zip-result');
  if (!input || !btn || !result) return;

  const setState = (cls, html) => {
    result.classList.remove('hidden','zip-ok','zip-close','zip-bad','zip-err');
    result.classList.add(cls);
    result.innerHTML = html;
  };

  const check = () => {
    const zip = (input.value || '').trim();
    if (!/^\d{5}$/.test(zip)) {
      setState('zip-err', '⚠️ Please enter a 5-digit ZIP code.');
      return;
    }
    if (SERVICE_ZIPS.primary.includes(zip)) {
      setState('zip-ok', `✅ <strong>You're in our area!</strong> ZIP ${zip} is right in Tyson's service zone. <a href="#" id="zip-book-link">Book now →</a>`);
    } else if (SERVICE_ZIPS.close.includes(zip)) {
      setState('zip-close', `🤔 <strong>You're close!</strong> ZIP ${zip} is on the edge of our 1-hour radius. Give Tyson a call at <a href="tel:+14077545565">(407) 754-5565</a> — he can usually make it work.`);
    } else {
      setState('zip-bad', `❌ <strong>Outside our service area.</strong> ZIP ${zip} is too far from Sanford, FL. But call <a href="tel:+14077545565">(407) 754-5565</a> — Tyson may have a referral for you.`);
    }
    // Wire the freshly-injected "Book now →" link if present
    $('#zip-book-link')?.addEventListener('click', (e) => { e.preventDefault(); openBooking(); });
  };

  btn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  // Restrict to digits as the user types
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D+/g, '').slice(0, 5);
  });
}

/* ---------- Exit-intent popup ---------- */
// Fires once per session when the user's mouse moves rapidly toward the top of the
// viewport (typical "I'm about to close the tab" motion). Desktop only — skipped on
// mobile where there's no hover concept. Gated by sessionStorage so we don't nag.
function initExitIntent() {
  const overlay  = $('#exit-overlay');
  const closeBtn = $('#exit-close');
  const bookBtn  = $('#exit-book-btn');
  if (!overlay) return;

  const SESSION_KEY = 'shinepro:exit-shown';
  if (sessionStorage.getItem(SESSION_KEY)) return;

  // Skip on touch devices (no reliable exit-intent signal)
  const isTouch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  if (isTouch) return;

  let armed = false;
  // Arm the detector after a short grace period so the popup never fires immediately
  const armTimer = setTimeout(() => { armed = true; }, 20000);

  const show = () => {
    if (!armed) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    // Don't open over another modal
    if (!$('#booking-overlay').classList.contains('hidden')) return;
    if (!$('#welcome-overlay').classList.contains('hidden')) return;
    if (!$('#lightbox-overlay').classList.contains('hidden')) return;

    overlay.classList.remove('hidden');
    sessionStorage.setItem(SESSION_KEY, '1');
    document.removeEventListener('mouseout', onMouseOut);
    clearTimeout(armTimer);
  };

  const dismiss = () => {
    overlay.classList.add('hidden');
  };

  const onMouseOut = (e) => {
    // e.relatedTarget === null typically means the cursor left the window
    // e.clientY <= 0 means it left from the top (toward address bar / tabs)
    if (!e.relatedTarget && e.clientY <= 10) show();
  };
  document.addEventListener('mouseout', onMouseOut);

  closeBtn?.addEventListener('click', dismiss);
  bookBtn?.addEventListener('click', () => {
    dismiss();
    const coupon = $('#book-coupon');
    if (coupon) coupon.value = 'WELCOME10';
    openBooking();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) dismiss();
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initSeasonalBanner();
  initFooterYear();
  initSmoothScroll();
  initQuoteCalculator();
  initWelcomePopup();
  initBookingModal();
  initHeroRotator();
  initLightbox();
  initZipChecker();
  initExitIntent();
});
