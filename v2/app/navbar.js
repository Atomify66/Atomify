/**
 * Atomify Navbar
 *
 * Renders the shared navbar/drawer markup and keeps the logged-in UI in
 * sync with `window.AtomifyAuth`. Each page calls `initNavbar('pageKey')`.
 * Valid keys: isomers | chestionare | leaderboard | equations | masa |
 *             calcule | profile | bio | istoric | admin
 *
 * Auth state is owned by auth.js. This file only renders.
 */
(function () {
  'use strict';

  const NAV_LINKS = [
    {
      key: 'isomers', label: 'Izomeri', href: 'isomers.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="16" r="2.5"/><line x1="8.2" y1="7.2" x2="10" y2="14"/><line x1="15.8" y1="7.2" x2="14" y2="14"/><line x1="8.5" y1="6" x2="15.5" y2="6"/></svg>`,
      children: [
        {
          key: 'isomers', label: 'Izomeri', href: 'isomers.html',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="16" r="2.5"/><line x1="8.2" y1="7.2" x2="10" y2="14"/><line x1="15.8" y1="7.2" x2="14" y2="14"/><line x1="8.5" y1="6" x2="15.5" y2="6"/></svg>`
        },
        {
          key: 'bio', label: 'Bio – ADN/ARN', href: 'bio.html',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c0-4 2-6 4-6s4 4 8 4 4-6 8-6"/><path d="M22 12c0 4-2 6-4 6s-4-4-8-4-4 6-8 6"/></svg>`
        }
      ]
    },
    {
      key: 'chestionare', label: 'Chestionar', href: 'chestionare.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`
    },
    {
      key: 'leaderboard', label: 'Clasament', href: 'leaderboard.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`
    },
    {
      key: 'equations', label: 'Ecuații', href: 'equations.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><line x1="11" y1="4" x2="7" y2="20"/><line x1="17" y1="4" x2="13" y2="20"/></svg>`
    },
    {
      key: 'masa', label: 'Masă Atomică', href: 'masa.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`
    },
    {
      key: 'calcule', label: 'Calcule', href: 'calcule.html',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>`
    },
  ];

  const ICON = {
    user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    history: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    chevron: `<svg class="at-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`,
    sun: `<svg class="at-theme-sun" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg class="at-theme-moon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`
  };

  function avatarInitials(username) {
    if (!username) return '?';
    const parts = String(username).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  // Deterministic accent color per username so different users get visually
  // distinct avatars at a glance. Helps the "I logged in as someone else"
  // case feel real even if the name didn't render yet.
  function avatarHue(username) {
    if (!username) return 230;
    let h = 0;
    for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  }

  function renderHTML(activePage) {
    const links = NAV_LINKS.map(p => {
      if (p.children) {
        const parentActive = p.children.some(c => c.key === activePage);
        const childLinks = p.children.map(c => `
          <li>
            <a href="${c.href}" class="at-nav-sublink${activePage === c.key ? ' active' : ''}">
              ${c.icon || ''}
              <span>${c.label}</span>
            </a>
          </li>`).join('');
        return `
      <li class="at-nav-has-dropdown">
        <button type="button" class="at-nav-link at-nav-dropdown-btn${parentActive ? ' active' : ''}" aria-haspopup="true" aria-expanded="false">
          ${p.icon}
          <span>${p.label}</span>
          <svg class="at-sub-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <ul class="at-nav-subdropdown" role="menu">
          ${childLinks}
        </ul>
      </li>`;
      }
      return `
      <li>
        <a href="${p.href}" class="at-nav-link${activePage === p.key ? ' active' : ''}">
          ${p.icon}
          <span>${p.label}</span>
        </a>
      </li>`;
    }).join('');

    // Mobile drawer uses a flat link list (no subdropdowns needed on mobile)
    const mobileLinks = NAV_LINKS.flatMap(p =>
      p.children
        ? p.children.map(c => `
      <li>
        <a href="${c.href}" class="at-nav-link${activePage === c.key ? ' active' : ''}">
          ${c.icon || p.icon}
          <span>${c.label}</span>
        </a>
      </li>`)
        : [`
      <li>
        <a href="${p.href}" class="at-nav-link${activePage === p.key ? ' active' : ''}">
          ${p.icon}
          <span>${p.label}</span>
        </a>
      </li>`]
    ).join('');

    return { navHTML: `
<nav class="at-navbar" role="navigation" aria-label="Main navigation">
  <a href="isomers.html" class="at-brand">
    <img src="logo_light.png" class="at-brand-logo at-logo-light" alt="Atomify" onerror="this.style.display='none'">
    <img src="logo_dark.png" class="at-brand-logo at-logo-dark" alt="Atomify" style="display:none" onerror="this.style.display='none'">
    <span class="at-brand-name">Atomify</span>
  </a>

  <ul class="at-nav-links" id="atNavLinks">
    ${links}
  </ul>

  <div class="at-nav-end">
    <label class="at-theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
      <input type="checkbox" id="themeCheckbox" />
      <span class="at-theme-track">
        <span class="at-theme-thumb"></span>
        ${ICON.sun}
        ${ICON.moon}
      </span>
    </label>

    <div id="authButtons" class="at-auth-btns">
      <button id="loginBtn" type="button" class="at-btn at-btn-ghost">Intră în cont</button>
      <button id="registerBtn" type="button" class="at-btn at-btn-primary">Cont nou</button>
    </div>

    <div id="userInfo" class="at-user-menu" hidden aria-haspopup="true">
      <button class="at-user-trigger" id="userDropdownTrigger" type="button" aria-expanded="false">
        <span class="at-avatar" id="userAvatar" aria-hidden="true">?</span>
        <span class="at-user-name" id="username">…</span>
        ${ICON.chevron}
      </button>

      <div class="at-dropdown" id="userDropdownMenu" role="menu">
        <div class="at-dropdown-header">
          <span class="at-avatar at-avatar-lg" id="userAvatarDrop" aria-hidden="true">?</span>
          <div class="at-dropdown-headtext">
            <div class="at-dropdown-greeting">Bună,</div>
            <div class="at-dropdown-name" id="usernameDisplay">…</div>
          </div>
        </div>

        <div class="at-dropdown-body">
          <a href="profile.html" class="at-dropdown-item" role="menuitem">${ICON.user} Profilul Meu</a>
          <a href="istoric.html" class="at-dropdown-item" role="menuitem">${ICON.history} Istoric</a>
          <a href="admin.html" class="at-dropdown-item at-admin-link" role="menuitem">${ICON.settings} Administrare</a>
        </div>

        <div class="at-dropdown-footer">
          <button id="logoutBtn" type="button" class="at-dropdown-item at-logout" role="menuitem">
            ${ICON.logout} Ieși din cont
          </button>
        </div>
      </div>
    </div>
  </div>

  <button class="at-hamburger" id="mobileMenuBtn" type="button" aria-label="Deschide meniu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</nav>
`, drawerHTML: `
<div class="at-mobile-drawer" id="atMobileDrawer" aria-hidden="true">
  <ul class="at-mobile-links">
    ${mobileLinks}
  </ul>
  <div class="at-mobile-auth">
    <div class="at-mobile-auth-btns" id="mobileAuthButtons">
      <button class="at-btn at-btn-ghost at-btn-full" type="button" id="mobileLoginBtn">Intră în cont</button>
      <button class="at-btn at-btn-primary at-btn-full" type="button" id="mobileRegisterBtn">Cont nou</button>
    </div>
    <div class="at-mobile-user" id="mobileUserInfo" hidden>
      <div class="at-mobile-user-row">
        <span class="at-avatar" id="mobileUserAvatar" aria-hidden="true">?</span>
        <span id="mobileUsername" class="at-mobile-username">…</span>
      </div>
      <a href="profile.html" class="at-mobile-link">Profilul Meu</a>
      <a href="istoric.html" class="at-mobile-link">Istoric</a>
      <a href="admin.html" class="at-mobile-link at-admin-link">Administrare</a>
      <button id="mobileLogoutBtn" type="button" class="at-mobile-link at-mobile-logout">Ieși din cont</button>
    </div>
  </div>
</div>
`};
  }

  // Render the current logged-in / logged-out state. Called from the
  // AtomifyAuth subscriber; idempotent — safe to call repeatedly.
  function paintAuth(user) {
    const $ = (id) => document.getElementById(id);
    const authButtons    = $('authButtons');
    const userInfo       = $('userInfo');
    const username       = $('username');
    const usernameDisplay= $('usernameDisplay');
    const userAvatar     = $('userAvatar');
    const userAvatarDrop = $('userAvatarDrop');
    const mobileAuthBtns = $('mobileAuthButtons');
    const mobileUserInfo = $('mobileUserInfo');
    const mobileUsername = $('mobileUsername');
    const mobileAvatar   = $('mobileUserAvatar');
    const adminLinks     = document.querySelectorAll('.at-admin-link');

    // Mark the body so CSS can prevent flash-of-stale-state during the
    // very first fetch.
    document.body.classList.toggle('at-auth-known', true);
    document.body.classList.toggle('at-authed', !!user);

    if (user) {
      const initials = avatarInitials(user.username);
      const hue = avatarHue(user.username);
      const avatarStyle = `--at-avatar-hue:${hue}`;

      // Clear any inline display style left over from page-level
      // updateAuthUI() helpers — otherwise `style.display='none'` would
      // shadow `hidden=false` and the menu would stay invisible.
      if (authButtons) { authButtons.hidden = true; authButtons.style.display = ''; }
      if (userInfo)    { userInfo.hidden = false;   userInfo.style.display = ''; }
      if (username)         username.textContent = user.username;
      if (usernameDisplay)  usernameDisplay.textContent = user.username;
      if (userAvatar) {
        userAvatar.textContent = initials;
        userAvatar.setAttribute('style', avatarStyle);
      }
      if (userAvatarDrop) {
        userAvatarDrop.textContent = initials;
        userAvatarDrop.setAttribute('style', avatarStyle);
      }

      if (mobileAuthBtns) { mobileAuthBtns.hidden = true; mobileAuthBtns.style.display = ''; }
      if (mobileUserInfo) { mobileUserInfo.hidden = false; mobileUserInfo.style.display = ''; }
      if (mobileUsername) mobileUsername.textContent = user.username;
      if (mobileAvatar) {
        mobileAvatar.textContent = initials;
        mobileAvatar.setAttribute('style', avatarStyle);
      }

      adminLinks.forEach(el => { el.hidden = false; });
    } else {
      if (authButtons) { authButtons.hidden = false; authButtons.style.display = ''; }
      if (userInfo)    { userInfo.hidden = true;    userInfo.style.display = ''; }
      if (mobileAuthBtns) { mobileAuthBtns.hidden = false; mobileAuthBtns.style.display = ''; }
      if (mobileUserInfo) { mobileUserInfo.hidden = true; mobileUserInfo.style.display = ''; }

      // Reset stale text so it's not lurking behind hidden=true
      // when the next user logs in mid-session.
      if (username)        username.textContent = '…';
      if (usernameDisplay) usernameDisplay.textContent = '…';
      if (mobileUsername)  mobileUsername.textContent = '…';
      if (userAvatar)      { userAvatar.textContent = '?'; userAvatar.removeAttribute('style'); }
      if (userAvatarDrop)  { userAvatarDrop.textContent = '?'; userAvatarDrop.removeAttribute('style'); }
      if (mobileAvatar)    { mobileAvatar.textContent = '?'; mobileAvatar.removeAttribute('style'); }
      adminLinks.forEach(el => { el.hidden = true; });
    }
  }

  function setupEvents() {
    // ── Nav sub-dropdowns (e.g. Izomeri → Bio) ─────────────────────
    document.querySelectorAll('.at-nav-dropdown-btn').forEach(btn => {
      const li = btn.closest('.at-nav-has-dropdown');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.at-nav-has-dropdown.open').forEach(li => {
        li.classList.remove('open');
        const btn = li.querySelector('.at-nav-dropdown-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.at-nav-has-dropdown.open').forEach(li => {
          li.classList.remove('open');
          const btn = li.querySelector('.at-nav-dropdown-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    const hamburger = document.getElementById('mobileMenuBtn');
    const drawer    = document.getElementById('atMobileDrawer');

    if (hamburger && drawer) {
      hamburger.addEventListener('click', () => {
        const open = drawer.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('at-drawer-open', open);
      });
    }
    drawer && drawer.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        drawer.classList.remove('open');
        hamburger && hamburger.classList.remove('open');
        document.body.classList.remove('at-drawer-open');
      });
    });

    const trigger = document.getElementById('userDropdownTrigger');
    const menu    = document.getElementById('userDropdownMenu');
    const userInfoEl = document.getElementById('userInfo');
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.toggle('show');
        trigger.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (e) => {
        if (userInfoEl && !userInfoEl.contains(e.target)) {
          menu.classList.remove('show');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          menu.classList.remove('show');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Mobile login/register mirror the desktop ones so a page only has
    // to bind handlers once.
    const mLoginBtn = document.getElementById('mobileLoginBtn');
    const mRegBtn   = document.getElementById('mobileRegisterBtn');
    const dLoginBtn = document.getElementById('loginBtn');
    const dRegBtn   = document.getElementById('registerBtn');
    mLoginBtn && mLoginBtn.addEventListener('click', () => dLoginBtn && dLoginBtn.click());
    mRegBtn && mRegBtn.addEventListener('click', () => dRegBtn && dRegBtn.click());

    // Logout: navbar owns this end-to-end. Pages no longer need their own.
    const handleLogout = async () => {
      if (window.AtomifyAuth) {
        await window.AtomifyAuth.logout();
      } else {
        await fetch('/logout', { method: 'POST' }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('atomify:logout'));
    };
    const dLogoutBtn = document.getElementById('logoutBtn');
    const mLogoutBtn = document.getElementById('mobileLogoutBtn');
    dLogoutBtn && dLogoutBtn.addEventListener('click', handleLogout);
    mLogoutBtn && mLogoutBtn.addEventListener('click', handleLogout);

    // Theme toggle
    const checkbox = document.getElementById('themeCheckbox');
    if (checkbox) {
      const saved = localStorage.getItem('theme');
      checkbox.checked = saved === 'dark';
      _applyTheme(saved === 'dark');
      checkbox.addEventListener('change', () => {
        const dark = checkbox.checked;
        _applyTheme(dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      });
    }
  }

  function _applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', dark);
    document.body.classList.toggle('light-mode', !dark);
    document.querySelectorAll('.at-logo-light').forEach(img => img.style.display = dark ? 'none' : '');
    document.querySelectorAll('.at-logo-dark').forEach(img => img.style.display = dark ? '' : 'none');
  }

  // ── badge toast (was only on isomers.html) ──────────────────────────
  // Centralized so any page picks up earned-badge notifications.
  let _notifyTimer = null;
  function startBadgeNotifications() {
    if (_notifyTimer) clearInterval(_notifyTimer);
    _notifyTimer = setInterval(checkNotifications, 8000);
    checkNotifications();
  }
  function stopBadgeNotifications() {
    if (_notifyTimer) { clearInterval(_notifyTimer); _notifyTimer = null; }
  }
  async function checkNotifications() {
    if (!window.AtomifyAuth || !window.AtomifyAuth.user) return;
    if (document.visibilityState !== 'visible') return;
    try {
      const res = await fetch('/api/notifications', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.notifications) || !data.notifications.length) return;
      data.notifications.forEach(n => {
        if (n && n.type === 'badge_earned' && n.badge) showBadgeToast(n.badge);
      });
      fetch('/api/notifications/clear', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    } catch (e) { /* silent */ }
  }

  function showBadgeToast(badge) {
    const root = document.body;
    const el = document.createElement('div');
    el.className = 'at-badge-toast rarity-' + (badge.rarity || 'common');
    el.innerHTML = `
      <div class="at-badge-toast-icon">${badge.icon || '🏆'}</div>
      <div class="at-badge-toast-text">
        <div class="at-badge-toast-title">Insignă nouă!</div>
        <div class="at-badge-toast-name">${escapeHtml(badge.name || '')}</div>
        <div class="at-badge-toast-desc">${escapeHtml(badge.description || '')}</div>
        <div class="at-badge-toast-points">+${Number(badge.points) || 0} puncte</div>
      </div>
      <button class="at-badge-toast-close" type="button" aria-label="Închide">×</button>
    `;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const dismiss = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector('.at-badge-toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 6000);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ── public API ──────────────────────────────────────────────────────
  function init(activePage) {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const { navHTML, drawerHTML } = renderHTML(activePage);
    header.innerHTML = navHTML;

    // Drawer must live on body, not inside .site-header — backdrop-filter
    // there creates a stacking context that traps position:fixed children.
    const existing = document.getElementById('atMobileDrawer');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = drawerHTML.trim();
    document.body.appendChild(wrap.firstElementChild);

    setupEvents();

    const saved = localStorage.getItem('theme');
    if (saved) _applyTheme(saved === 'dark');

    // Subscribe to auth state. AtomifyAuth fires immediately with current
    // value, so the navbar paints itself the moment it mounts.
    if (window.AtomifyAuth && typeof window.AtomifyAuth.onChange === 'function') {
      window.AtomifyAuth.onChange((user) => {
        paintAuth(user);
        if (user) startBadgeNotifications(); else stopBadgeNotifications();
      });
    } else {
      // Fallback: paint logged-out shell.
      paintAuth(null);
      console.warn('[AtomifyNavbar] auth.js missing — load it before navbar.js for the auth-state sync.');
    }
  }

  window.AtomifyNavbar = {
    init,
    refresh: () => window.AtomifyAuth && window.AtomifyAuth.refresh(),
    paint: paintAuth
  };
  window.initNavbar = init;
})();
