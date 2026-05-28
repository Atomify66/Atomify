/* ============================================================
   Atomify · v2 · shared
   ------------------------------------------------------------
   Cross-page utilities: auth modal, periodic-table data loader,
   formula formatter, count-up animation, lightweight toast.
   Exposes window.Atomify (namespaced; doesn't collide with
   AtomifyAuth or AtomifyNavbar from auth.js / navbar.js).
   ============================================================ */

(function () {
  'use strict';

  const Atomify = {};

  // ──────────────────────────────────────────────────────────
  //  Element data — single fetch, cached on window
  // ──────────────────────────────────────────────────────────
  const elementCache = {
    masses: {},
    names: {},
    numbers: {},
    loaded: false,
    promise: null,
  };

  Atomify.loadElements = function () {
    if (elementCache.promise) return elementCache.promise;
    elementCache.promise = (async () => {
      try {
        const res = await fetch('/api/elements');
        const json = await res.json();
        const list = json.elements || [];
        for (const e of list) {
          elementCache.masses[e.symbol]  = e.atomic_mass;
          elementCache.names[e.symbol]   = e.name_ro;
          elementCache.numbers[e.symbol] = e.atomic_number;
        }
        elementCache.loaded = list.length > 0;
      } catch (err) {
        console.error('[Atomify] failed to load /api/elements:', err);
        elementCache.loaded = false;
      }
      return elementCache;
    })();
    return elementCache.promise;
  };

  Atomify.elements = elementCache;

  // ──────────────────────────────────────────────────────────
  //  Formula helper — wrap trailing digits in <sub>
  // ──────────────────────────────────────────────────────────
  Atomify.formatFormulaHTML = function (formula) {
    return String(formula).replace(/([A-Za-z\)])(\d+)/g, '$1<sub>$2</sub>');
  };

  // ──────────────────────────────────────────────────────────
  //  Count-up animation for tabular numbers
  //  el: target element; final: number; opts.format(value) → string
  // ──────────────────────────────────────────────────────────
  Atomify.countUp = function (el, final, opts = {}) {
    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = opts.duration || 700;
    const format = opts.format || ((v) => v.toFixed(4));
    const suffixHTML = opts.suffixHTML || '';

    if (reduced) {
      el.innerHTML = format(final) + suffixHTML;
      return;
    }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.innerHTML = format(final * eased) + suffixHTML;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  // ──────────────────────────────────────────────────────────
  //  Toast — lightweight transient banner (centered bottom)
  //  Each page styles its own .X-toast; this just toggles
  //  .show on the element with the given id for `ms` ms.
  // ──────────────────────────────────────────────────────────
  Atomify.toast = function (idOrEl, ms = 1800) {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!el) return;
    el.classList.add('show');
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  };

  // ──────────────────────────────────────────────────────────
  //  Auth modal — pages just include the standard markup
  //  (#authModal, #loginForm, etc.) and call Atomify.initAuthModal()
  // ──────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function showAuthModal(mode) {
    const modal = $('authModal');
    if (!modal) return;
    const login = $('loginForm');
    const reg   = $('registerForm');
    const msg   = $('authMessage');
    if (msg) { msg.style.display = 'none'; msg.className = 'auth-message'; }
    if (mode === 'register') {
      if (login) login.style.display = 'none';
      if (reg)   reg.style.display = 'block';
      updatePasswordRequirements('');
    } else {
      if (login) login.style.display = 'block';
      if (reg)   reg.style.display = 'none';
    }
    modal.style.display = 'block';
  }

  function hideAuthModal() {
    const modal = $('authModal');
    if (!modal) return;
    modal.style.display = 'none';
    $('loginFormElement')?.reset();
    $('registerFormElement')?.reset();
    updatePasswordRequirements('');
  }

  function showAuthMessage(text, type = 'error') {
    const el = $('authMessage');
    if (!el) return;
    el.textContent = text;
    el.className = `auth-message ${type}`;
    el.style.display = 'block';
  }

  function validatePassword(p) {
    return {
      length:    p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      digit:     /[0-9]/.test(p),
    };
  }

  function updatePasswordRequirements(password) {
    const r = validatePassword(password);
    const set = (id, ok) => {
      const el = $(id);
      if (el) el.className = `requirement ${ok ? 'met' : 'not-met'}`;
    };
    set('req-length',    r.length);
    set('req-uppercase', r.uppercase);
    set('req-digit',     r.digit);
    return r.length && r.uppercase && r.digit;
  }

  async function handleLogin(e) {
    e.preventDefault();
    const u = $('loginUsername')?.value || '';
    const p = $('loginPassword')?.value || '';
    try {
      const r = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        showAuthMessage('Autentificare reușită.', 'success');
        setTimeout(() => { hideAuthModal(); window.AtomifyAuth?.refresh(); }, 800);
      } else {
        showAuthMessage(d.error || 'Eroare la autentificare.');
      }
    } catch { showAuthMessage('Eroare de conexiune.'); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const u = $('registerUsername')?.value || '';
    const p = $('registerPassword')?.value || '';
    const c = $('registerPasswordConfirm')?.value || '';
    const v = validatePassword(p);
    if (!(v.length && v.uppercase && v.digit)) {
      showAuthMessage('Parola nu îndeplinește cerințele.');
      return;
    }
    if (p !== c) { showAuthMessage('Parolele nu coincid.'); return; }
    try {
      const r = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        showAuthMessage('Cont creat. Te poți autentifica.', 'success');
        setTimeout(() => showAuthModal('login'), 1200);
      } else {
        showAuthMessage(d.error || 'Eroare la crearea contului.');
      }
    } catch { showAuthMessage('Eroare de conexiune.'); }
  }

  function handleGoogleAuth() { window.location.href = '/auth/google'; }

  function checkAuthStatusFromURL() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('auth');
    if (status === 'success') {
      showAuthMessage('Autentificare cu Google reușită.', 'success');
      const url = new URL(window.location); url.searchParams.delete('auth');
      window.history.replaceState({}, document.title, url);
    } else if (status === 'failed') {
      showAuthMessage('Autentificarea cu Google a eșuat.', 'error');
      const url = new URL(window.location); url.searchParams.delete('auth');
      window.history.replaceState({}, document.title, url);
    }
  }

  Atomify.initAuthModal = function () {
    $('loginBtn')?.addEventListener('click',    () => showAuthModal('login'));
    $('registerBtn')?.addEventListener('click', () => showAuthModal('register'));
    $('googleLoginBtn')?.addEventListener('click',    handleGoogleAuth);
    $('googleRegisterBtn')?.addEventListener('click', handleGoogleAuth);
    document.querySelector('.auth-close')?.addEventListener('click', hideAuthModal);
    $('showRegister')?.addEventListener('click', e => { e.preventDefault(); showAuthModal('register'); });
    $('showLogin')?.addEventListener('click',    e => { e.preventDefault(); showAuthModal('login'); });
    $('loginFormElement')?.addEventListener('submit',    handleLogin);
    $('registerFormElement')?.addEventListener('submit', handleRegister);
    $('registerPassword')?.addEventListener('input', e => updatePasswordRequirements(e.target.value));
    window.addEventListener('click', e => {
      const m = $('authModal');
      if (m && e.target === m) hideAuthModal();
    });
    checkAuthStatusFromURL();
  };

  Atomify.showAuthModal = showAuthModal;
  Atomify.hideAuthModal = hideAuthModal;

  // Expose
  window.Atomify = Atomify;
})();
