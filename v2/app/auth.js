/**
 * Atomify Auth — single source of truth for the logged-in user.
 *
 * Why this exists: every page used to declare its own `currentUser` and a
 * partial `updateAuthUI()` that only touched the desktop name. The mobile
 * drawer / dropdown / avatars stayed stale, so the navbar would show
 * user-A's data after logging out and back in as user-B. This module owns
 * the auth state once and fires `atomify:auth-changed` so the navbar
 * (and anyone else who cares) can re-render in full.
 *
 * Public API (window.AtomifyAuth):
 *   user          — the currently logged-in user, or null
 *   refresh()     — re-fetch /user, update state, fire event. Returns user.
 *   logout()      — POST /logout then refresh.
 *   onChange(fn)  — subscribe; returns an unsubscribe fn. fn(user) is also
 *                   called immediately with the current value.
 *   isAuthed()    — boolean
 *
 * Pages don't have to call refresh manually: this module intercepts
 * window.fetch and triggers a refresh after any /login, /logout, or
 * /register call. It also refreshes on tab focus/visibility.
 */
(function () {
  'use strict';

  const AUTH_ENDPOINT = '/user';
  const REFRESH_ON_FETCH_PATHS = /\/(login|logout|register)(\?.*)?$/;

  const AtomifyAuth = {
    user: null,
    _ready: false,
    _listeners: new Set(),
    _inflight: null,

    isAuthed() {
      return !!this.user;
    },

    onChange(fn) {
      if (typeof fn !== 'function') return () => {};
      this._listeners.add(fn);
      // Only fire immediately if the first /user fetch already resolved —
      // otherwise the subscriber would paint a "logged-out" shell, then
      // repaint to "logged-in" milliseconds later (visible flash).
      if (this._ready) {
        try { fn(this.user); } catch (e) { console.error('[AtomifyAuth] listener threw:', e); }
      }
      return () => this._listeners.delete(fn);
    },

    _emit() {
      // Keep legacy global in sync — old page code reads window.currentUser.
      window.currentUser = this.user;
      this._listeners.forEach(fn => {
        try { fn(this.user); } catch (e) { console.error('[AtomifyAuth] listener threw:', e); }
      });
      try {
        window.dispatchEvent(new CustomEvent('atomify:auth-changed', { detail: { user: this.user } }));
      } catch (_) { /* old browsers */ }
    },

    async refresh() {
      // Coalesce concurrent refreshes — multiple callers in the same tick
      // should hit /user once, not three times.
      if (this._inflight) return this._inflight;
      this._inflight = (async () => {
        let next = null;
        try {
          const res = await _origFetch.call(window, AUTH_ENDPOINT, {
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            next = data && data.user ? data.user : null;
          }
        } catch (e) {
          // Network failure — keep previous user; don't blow away the UI on a flaky tick.
          console.warn('[AtomifyAuth] refresh failed:', e);
          // Still mark ready so subscribers waiting for the initial state
          // get unblocked (otherwise the navbar would stay hidden forever
          // when the network is down on first load).
          if (!this._ready) {
            this._ready = true;
            this._emit();
          }
          this._inflight = null;
          return this.user;
        }
        const changed = !sameUser(this.user, next);
        const wasReady = this._ready;
        this.user = next;
        this._ready = true;
        // Always emit on the very first refresh so subscribers learn the
        // initial state even when the answer is "logged out" (null→null).
        if (changed || !wasReady) this._emit();
        this._inflight = null;
        return this.user;
      })();
      return this._inflight;
    },

    async logout() {
      try {
        await _origFetch.call(window, '/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (e) {
        console.warn('[AtomifyAuth] logout request failed:', e);
      }
      this.user = null;
      this._emit();
    }
  };

  function sameUser(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.id === b.id && a.username === b.username && a.role === b.role && a.country === b.country;
  }

  // ── fetch interceptor ────────────────────────────────────────────────
  // Any call to /login, /logout, /register triggers a refresh so the
  // navbar updates without each page having to remember to do it.
  const _origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const promise = _origFetch(input, init);
    if (REFRESH_ON_FETCH_PATHS.test(url)) {
      promise.then(res => {
        // Only refresh on success — no point re-fetching after a 400.
        if (res && res.ok) setTimeout(() => AtomifyAuth.refresh(), 30);
      }).catch(() => {});
    }
    return promise;
  };

  // ── lifecycle hooks ──────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') AtomifyAuth.refresh();
  });
  window.addEventListener('focus', () => AtomifyAuth.refresh());
  window.addEventListener('pageshow', (e) => {
    // bfcache restore — page came back from history with possibly stale state
    if (e.persisted) AtomifyAuth.refresh();
  });

  // Kick off the first fetch as soon as we load.
  AtomifyAuth.refresh();

  window.AtomifyAuth = AtomifyAuth;
})();
