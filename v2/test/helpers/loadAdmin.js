'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const APP_DIR = path.join(__dirname, '..', '..', 'app');
const ADMIN_HTML = path.join(APP_DIR, 'admin.html');
const ADMIN_JS = path.join(APP_DIR, 'v2', 'pages', 'admin.js');

// Strip every external <script> / <link rel="stylesheet"> from the page so
// jsdom does not try to fetch them off the filesystem. We inject our own
// stubs + the page script manually.
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
}

// Build the in-DOM stubs:
//  • global Atomify with the two methods admin.js calls
//  • fetch handler driven by `window.__routes` (set per test)
const STUBS = `
  window.Atomify = {
    initAuthModal() {},
    showAuthModal() {},
    countUp(el, final) { if (el) el.textContent = String(final); },
  };

  window.__routes = window.__routes || {};
  window.__fetchLog = [];
  window.fetch = function (url, opts) {
    const method = (opts && opts.method) || 'GET';
    const key = method + ' ' + url;
    window.__fetchLog.push(key);
    const handler = window.__routes[key] || window.__routes[url];
    if (!handler) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'no stub for ' + key }),
      });
    }
    const result = (typeof handler === 'function') ? handler(opts) : handler;
    const status = result.status != null ? result.status : 200;
    const body = result.body != null ? result.body : {};
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  };
`;

async function loadAdmin({ routes = {} } = {}) {
  const rawHtml = fs.readFileSync(ADMIN_HTML, 'utf8');
  const adminJs = fs.readFileSync(ADMIN_JS, 'utf8');
  const html = sanitizeHtml(rawHtml);

  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'http://localhost/admin.html',
  });

  // Install stubs before running admin.js
  dom.window.eval(STUBS);
  Object.assign(dom.window.__routes, routes);

  // Run the admin.js IIFE
  dom.window.eval(adminJs);

  // admin.js wires up on DOMContentLoaded; jsdom has already fired it for the
  // initial parse, so we fire it manually after injecting the script.
  dom.window.document.dispatchEvent(
    new dom.window.Event('DOMContentLoaded', { bubbles: true, cancelable: false }),
  );

  // Let queued microtasks (the fetch chain in checkAuth) drain.
  await flushAsync(dom.window);

  return dom;
}

function flushAsync(win) {
  // Drain a generous number of micro/macro ticks. checkAuth has a couple of
  // awaits before it sets visibility; loadAdminStats has one more.
  return new Promise((resolve) => {
    let ticks = 0;
    const pump = () => {
      ticks += 1;
      if (ticks > 20) return resolve();
      win.setTimeout(pump, 0);
    };
    pump();
  });
}

function isHidden(dom, id) {
  const el = dom.window.document.getElementById(id);
  if (!el) throw new Error('element not found: ' + id);
  return el.hasAttribute('hidden');
}

function isVisible(dom, id) {
  return !isHidden(dom, id);
}

module.exports = { loadAdmin, isHidden, isVisible };
