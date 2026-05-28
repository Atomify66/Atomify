/* ============================================================
   Atomify · v2 · istoric (page logic)
   ------------------------------------------------------------
   Personal activity journal. Pulls /user-history once and shows
   it three ways:
     · Stat overview cards (count-up animated)
     · Per-quiz best scores grid
     · Chronological timeline grouped by day
   Backend contract (preserved from v1):
     · GET /user           — auth check
     · GET /user-history   — { isomers, quizSummary, allQuizResults }
   ============================================================ */

(function () {
  'use strict';

  const state = {
    currentUser: null,
    history: { isomers: [], quizSummary: [], allQuizResults: [] },
    currentTab: 'all', // 'all' | 'isomers' | 'quizzes'
  };

  // ─── Helpers ───────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function parseDate(s) {
    if (!s) return null;
    // v1 stores UTC without trailing Z; append Z so the browser parses correctly.
    const iso = /[zZ]$/.test(s) ? s : (s + 'Z');
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtDay(d) {
    return d.toLocaleDateString('ro-RO', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDateShort(d) {
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function relativeDay(d) {
    const now = new Date();
    const ms = now - d;
    const days = Math.floor(ms / 86400000);
    if (d.toDateString() === now.toDateString()) return 'AZI';
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'IERI';
    if (days < 7)  return `${days} ZILE`;
    if (days < 30) return `${Math.floor(days / 7)} SĂPT.`;
    if (days < 365) return `${Math.floor(days / 30)} LUNI`;
    return `${Math.floor(days / 365)} ANI`;
  }
  function formulaHTML(f) { return Atomify.formatFormulaHTML(f); }
  function pctClass(p) {
    if (p >= 80) return 'hist-entry-pct--good';
    if (p < 60)  return 'hist-entry-pct--low';
    return '';
  }
  function pctBigClass(p) {
    if (p >= 80) return 'hist-best-pct--good';
    if (p < 60)  return 'hist-best-pct--low';
    return '';
  }

  // ─── Auth ──────────────────────────────────────────────────
  async function checkAuth() {
    try {
      const res = await fetch('/user');
      if (!res.ok) { state.currentUser = null; return false; }
      const data = await res.json();
      state.currentUser = data.user || null;
      return !!state.currentUser;
    } catch { state.currentUser = null; return false; }
  }

  // ─── Load history ──────────────────────────────────────────
  async function loadHistory() {
    try {
      const res = await fetch('/user-history');
      if (!res.ok) throw new Error('Eroare la încărcare');
      state.history = await res.json();
      // Ensure arrays
      state.history.isomers        = state.history.isomers        || [];
      state.history.quizSummary    = state.history.quizSummary    || [];
      state.history.allQuizResults = state.history.allQuizResults || [];
    } catch (err) {
      console.error('[istoric] load error:', err);
      state.history = { isomers: [], quizSummary: [], allQuizResults: [] };
    }
  }

  // ─── Stats overview ────────────────────────────────────────
  function renderStats() {
    const isomers = state.history.isomers;
    const quizzes = state.history.allQuizResults;
    const totalFormulas = isomers.length;
    const totalStructures = isomers.reduce((s, x) => s + (x.isomer_count || 0), 0);
    const totalQuizzes = quizzes.length;
    const avgPct = totalQuizzes
      ? quizzes.reduce((s, x) => s + (x.score / (x.total_questions || 1)), 0) / totalQuizzes * 100
      : 0;

    $('histStats').innerHTML = `
      <div class="hist-stat">
        <span class="hist-stat-label">Formule generate</span>
        <span class="hist-stat-value"><span class="num" id="histStatFormulas">0</span></span>
        <span class="hist-stat-aux">izomeri · molecule</span>
      </div>
      <div class="hist-stat">
        <span class="hist-stat-label">Structuri totale</span>
        <span class="hist-stat-value hist-stat-value--accent"><span class="num" id="histStatStructures">0</span></span>
        <span class="hist-stat-aux">izomeri găsiți cumulat</span>
      </div>
      <div class="hist-stat">
        <span class="hist-stat-label">Teste completate</span>
        <span class="hist-stat-value"><span class="num" id="histStatTests">0</span></span>
        <span class="hist-stat-aux">${state.history.quizSummary.length} chestionar${state.history.quizSummary.length === 1 ? '' : 'e'} distincte</span>
      </div>
      <div class="hist-stat">
        <span class="hist-stat-label">Scor mediu</span>
        <span class="hist-stat-value hist-stat-value--gold"><span class="num" id="histStatAvg">0</span>%</span>
        <span class="hist-stat-aux">${avgPct >= 80 ? 'excelent' : avgPct >= 60 ? 'bun' : totalQuizzes ? 'în creștere' : '—'}</span>
      </div>
    `;

    Atomify.countUp($('histStatFormulas'),   totalFormulas,   { format: v => Math.round(v).toString() });
    Atomify.countUp($('histStatStructures'), totalStructures, { format: v => Math.round(v).toString() });
    Atomify.countUp($('histStatTests'),      totalQuizzes,    { format: v => Math.round(v).toString() });
    Atomify.countUp($('histStatAvg'),        avgPct,          { format: v => v.toFixed(1) });
  }

  // ─── Best scores ───────────────────────────────────────────
  function renderBestScores() {
    const wrap = $('histBest');
    const head = $('histBestHead');
    if (state.currentTab === 'isomers') {
      hide(head); hide(wrap); return;
    }
    const list = state.history.quizSummary || [];
    $('histBestCount').textContent = `${list.length} chestionar${list.length === 1 ? '' : 'e'}`;
    if (!list.length) {
      hide(head); hide(wrap); return;
    }
    show(head); show(wrap);

    // Sort by best % descending
    const sorted = [...list].sort((a, b) => {
      const pa = (a.best_score / (a.total_questions || 1)) * 100;
      const pb = (b.best_score / (b.total_questions || 1)) * 100;
      return pb - pa;
    });

    wrap.innerHTML = sorted.map((q, i) => {
      const pct = Math.round((q.best_score / (q.total_questions || 1)) * 100);
      const last = parseDate(q.last_attempt);
      const medal = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const medalCls = medal ? `hist-best-card-medal hist-best-card-medal--${medal}` : 'hist-best-card-medal';
      const barCls = pct < 60 ? 'hist-best-bar hist-best-bar--low' : 'hist-best-bar';
      return `
        <div class="hist-best-card">
          <div class="hist-best-card-head">
            <div class="hist-best-card-name">${escapeHTML(q.quiz_name)}</div>
            <span class="${medalCls}">${i + 1}</span>
          </div>
          <div class="hist-best-score-row">
            <span class="hist-best-score">
              <span class="hist-best-score-correct">${q.best_score}</span><span class="hist-best-score-of">/</span><span>${q.total_questions}</span>
            </span>
            <span class="hist-best-pct ${pctBigClass(pct)}">${pct}%</span>
          </div>
          <div class="${barCls}" style="--pct: ${pct}%"></div>
          <div class="hist-best-foot">
            <span class="hist-best-meta">${q.attempts} încercări · ${last ? fmtDateShort(last) : '—'}</span>
            <a class="hist-best-retake" href="chestionare.html">
              Reia
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0115-6.7L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
            </a>
          </div>
        </div>`;
    }).join('');
  }

  // ─── Timeline (grouped by day) ────────────────────────────
  function buildTimelineEntries() {
    const entries = [];
    if (state.currentTab !== 'quizzes') {
      for (const i of state.history.isomers || []) {
        const d = parseDate(i.generated_at);
        if (!d) continue;
        entries.push({
          kind: 'isomer',
          date: d,
          title: formulaHTML(i.formula),
          rawFormula: i.formula,
          metaParts: [`${i.isomer_count} izomeri`],
          action: { label: 'Regenerează', formula: i.formula },
        });
      }
    }
    if (state.currentTab !== 'isomers') {
      for (const r of state.history.allQuizResults || []) {
        const d = parseDate(r.completed_at);
        if (!d) continue;
        const pct = Math.round((r.score / (r.total_questions || 1)) * 100);
        entries.push({
          kind: 'quiz',
          date: d,
          title: escapeHTML(r.quiz_name),
          metaParts: [
            `<span>${r.score}/${r.total_questions}</span>`,
            `<span class="hist-entry-meta-sep">·</span>`,
            `<span class="hist-entry-pct ${pctClass(pct)}">${pct}%</span>`,
          ],
        });
      }
    }
    entries.sort((a, b) => b.date - a.date);
    return entries;
  }

  function renderTimeline() {
    const wrap = $('histTimeline');
    const head = $('histTimelineHead');
    const entries = buildTimelineEntries();
    $('histTimelineCount').textContent = `${entries.length} eveniment${entries.length === 1 ? '' : 'e'}`;

    if (!entries.length) {
      show(head);
      wrap.innerHTML = renderEmpty();
      return;
    }
    show(head);

    // Group by day
    const groups = new Map();
    for (const e of entries) {
      const k = dayKey(e.date);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    }

    let html = '<div class="hist-timeline">';
    for (const [, list] of groups) {
      const day = list[0].date;
      html += `
        <div class="hist-day">
          <div class="hist-day-head">
            <span class="hist-day-label">${escapeHTML(fmtDay(day))}</span>
            <span class="hist-day-relative">${relativeDay(day)}</span>
          </div>`;
      for (const e of list) {
        const actionHTML = e.action
          ? `<button type="button" class="hist-entry-action" data-action="regenerate" data-formula="${escapeHTML(e.action.formula)}">
               ${escapeHTML(e.action.label)}
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/>
               </svg>
             </button>`
          : `<a class="hist-entry-action" href="chestionare.html" aria-label="Reia chestionarul">
               Reia
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M5 12h14M13 6l6 6-6 6"/>
               </svg>
             </a>`;
        html += `
          <div class="hist-entry hist-entry--${e.kind}">
            <span class="hist-entry-time">${fmtTime(e.date)}</span>
            <div class="hist-entry-body">
              <div class="hist-entry-head">
                <span class="hist-entry-kind hist-entry-kind--${e.kind}">${e.kind === 'isomer' ? 'Izomer' : 'Chestionar'}</span>
                <span class="hist-entry-title">${e.title}</span>
              </div>
              <div class="hist-entry-meta">${e.metaParts.join(' ')}</div>
            </div>
            ${actionHTML}
          </div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-action="regenerate"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const formula = btn.dataset.formula;
        if (formula) localStorage.setItem('regenerateFormula', formula);
        window.location.href = 'isomers.html';
      });
    });
  }

  function renderEmpty() {
    const isAll = state.currentTab === 'all';
    const isIsomers = state.currentTab === 'isomers';
    if (isIsomers) {
      return `
        <div class="hist-empty">
          <div class="hist-empty-eyebrow">Niciun izomer generat</div>
          <div class="hist-empty-title">Începe cu o formulă</div>
          <p class="hist-empty-body">Generează prima ta formulă și apare aici imediat ce serverul răspunde.</p>
          <a href="isomers.html" class="hist-empty-cta">
            Deschide generatorul
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </a>
        </div>`;
    }
    if (state.currentTab === 'quizzes') {
      return `
        <div class="hist-empty">
          <div class="hist-empty-eyebrow">Niciun chestionar completat</div>
          <div class="hist-empty-title">Începe primul tău test</div>
          <p class="hist-empty-body">Rezultatele tale apar aici după ce trimiți un chestionar.</p>
          <a href="chestionare.html" class="hist-empty-cta">
            Deschide chestionarele
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </a>
        </div>`;
    }
    return `
      <div class="hist-empty">
        <div class="hist-empty-eyebrow">Activitate goală</div>
        <div class="hist-empty-title">Nu ai înregistrat încă nicio activitate</div>
        <p class="hist-empty-body">Generează izomeri sau completează un chestionar — toate acțiunile apar aici cronologic.</p>
        <a href="isomers.html" class="hist-empty-cta">
          Începe acum
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </a>
      </div>`;
  }

  // ─── Tabs ──────────────────────────────────────────────────
  function switchTab(tab) {
    if (tab === state.currentTab) return;
    state.currentTab = tab;
    document.querySelectorAll('.hist-tab').forEach(b => {
      b.classList.toggle('is-active', b.dataset.tab === tab);
    });
    renderBestScores();
    renderTimeline();
  }

  // ─── Wire-up ───────────────────────────────────────────────
  async function init() {
    Atomify.initAuthModal();

    document.querySelectorAll('.hist-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    $('histAuthLoginBtn').addEventListener('click', () => Atomify.showAuthModal('login'));

    const authed = await checkAuth();
    if (!authed) {
      show($('histAuthRequired'));
      hide($('histContent'));
      return;
    }
    if (state.currentUser?.username) {
      $('histUsername').textContent = state.currentUser.username;
    }
    show($('histContent'));
    await loadHistory();
    renderStats();
    renderBestScores();
    renderTimeline();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
