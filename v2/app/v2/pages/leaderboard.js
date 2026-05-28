/* ============================================================
   Atomify · v2 · leaderboard (page logic)
   ------------------------------------------------------------
   Backend contract (preserved from v1):
     · GET /user                                — auth
     · GET /api/quizzes                         — list for filter
     · GET /my-classes                          — user's classrooms
     · GET /api/stats/personal?…                — personal stats
     · GET /api/leaderboard/global?quizId=…
     · GET /api/leaderboard/national?quizId=…
     · GET /api/leaderboard/class/:id?quizId=…
   ============================================================ */

(function () {
  'use strict';

  const state = {
    currentUser: null,
    quizzes: [],
    classes: [],
    selectedQuizId: null,
    selectedClassId: null,
    currentTab: 'global', // 'global' | 'national' | 'class'
  };

  // ─── Helpers ───────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtTime(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  function fmtTimeDecimal(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toFixed(2).padStart(5, '0')}`;
  }
  function fmtDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function pctClass(p) {
    if (p >= 80) return '';
    if (p >= 60) return '';
    return 'lb-pct--low';
  }

  // ─── Auth ──────────────────────────────────────────────────
  async function checkAuth() {
    try {
      const res = await fetch('/user');
      if (!res.ok) { state.currentUser = null; return false; }
      const data = await res.json();
      state.currentUser = data.user || null;
      return !!state.currentUser;
    } catch {
      state.currentUser = null;
      return false;
    }
  }

  // ─── Initial data ──────────────────────────────────────────
  async function loadInitial() {
    show($('lbLoading'));
    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/quizzes'),
        fetch('/my-classes'),
      ]);
      if (qRes.ok) state.quizzes = await qRes.json();
      if (cRes.ok) {
        const d = await cRes.json();
        state.classes = d.classes || [];
      }
      populateQuizSelect();
      populateClassSelect();
      await Promise.all([loadStats(), loadLeaderboard()]);
    } catch (err) {
      console.error('[leaderboard] init error:', err);
      $('lbTable').innerHTML = `
        <div class="status status--error" style="margin: 1rem;">
          Eroare la încărcare · ${escapeHTML(err.message)}
        </div>`;
    } finally {
      hide($('lbLoading'));
      show($('lbContent'));
    }
  }

  function populateQuizSelect() {
    const sel = $('lbQuizSelect');
    sel.innerHTML =
      '<option value="">Toate chestionarele</option>' +
      state.quizzes.map(q =>
        `<option value="${escapeHTML(q.id)}">${escapeHTML(q.title)}</option>`).join('');
  }

  function populateClassSelect() {
    const sel = $('lbClassSelect');
    const wrap = $('lbClassFilter');
    const tab  = $('lbTabClass');
    if (!state.classes.length) {
      hide(wrap); hide(tab);
      return;
    }
    sel.innerHTML =
      '<option value="">Selectează o clasă</option>' +
      state.classes.map(c =>
        `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join('');
    show(wrap); show(tab);
  }

  // ─── Personal stats ────────────────────────────────────────
  async function loadStats() {
    const params = new URLSearchParams();
    if (state.selectedQuizId) params.append('quizId', state.selectedQuizId);
    if (state.selectedClassId) params.append('classId', state.selectedClassId);
    if (state.currentTab === 'national') params.append('national', 'true');

    try {
      const res = await fetch('/api/stats/personal' + (params.toString() ? '?' + params.toString() : ''));
      if (!res.ok) { renderStatsEmpty(); return; }
      const data = await res.json();
      renderStats(data.stats || []);
    } catch (err) {
      console.error('[leaderboard] stats error:', err);
      renderStatsEmpty();
    }
  }

  function renderStatsEmpty() {
    $('lbStats').innerHTML =
      '<div class="lb-stats-empty">Nu există statistici personale pentru selecția curentă.</div>';
  }

  function renderStats(stats) {
    if (!stats.length) { renderStatsEmpty(); return; }
    const totalAttempts = stats.reduce((s, x) => s + (x.attempts || 0), 0);
    const avgPct  = stats.reduce((s, x) => s + (x.avg_percentage  || 0), 0) / stats.length;
    const bestPct = stats.reduce((m, x) => Math.max(m, x.best_percentage || 0), 0);
    const avgTime = stats.reduce((s, x) => s + (x.avg_time || 0), 0) / stats.length;

    $('lbStats').innerHTML = `
      <div class="lb-stat">
        <span class="lb-stat-label">Încercări totale</span>
        <span class="lb-stat-value"><span class="num" id="lbStatAttempts">0</span></span>
        <span class="lb-stat-aux">${stats.length} chestionar${stats.length === 1 ? '' : 'e'}</span>
      </div>
      <div class="lb-stat">
        <span class="lb-stat-label">Scor mediu</span>
        <span class="lb-stat-value lb-stat-value--accent"><span class="num" id="lbStatAvg">0</span>%</span>
        <span class="lb-stat-aux">peste toate încercările</span>
      </div>
      <div class="lb-stat">
        <span class="lb-stat-label">Cel mai bun scor</span>
        <span class="lb-stat-value lb-stat-value--gold"><span class="num" id="lbStatBest">0</span>%</span>
        <span class="lb-stat-aux">${bestPct >= 80 ? 'excelent' : bestPct >= 60 ? 'bun' : 'în creștere'}</span>
      </div>
      <div class="lb-stat">
        <span class="lb-stat-label">Timp mediu</span>
        <span class="lb-stat-value"><span class="num">${fmtTimeDecimal(avgTime)}</span></span>
        <span class="lb-stat-aux">min · per chestionar</span>
      </div>
    `;
    Atomify.countUp($('lbStatAttempts'), totalAttempts, { format: v => Math.round(v).toString() });
    Atomify.countUp($('lbStatAvg'),  avgPct,  { format: v => v.toFixed(1) });
    Atomify.countUp($('lbStatBest'), bestPct, { format: v => v.toFixed(1) });

    // Update section header based on context
    const headerSub = $('lbStatsSub');
    if (state.selectedQuizId) {
      const quiz = state.quizzes.find(q => q.id === state.selectedQuizId);
      const country = (state.currentTab === 'national' && state.currentUser?.country)
        ? ` · ${state.currentUser.country}` : '';
      headerSub.textContent = `Pentru: ${quiz?.title || 'chestionarul selectat'}${country}`;
    } else {
      headerSub.textContent = 'Agregat peste toate chestionarele completate.';
    }
  }

  // ─── Leaderboard ───────────────────────────────────────────
  async function loadLeaderboard() {
    const wrap = $('lbTable');
    const podium = $('lbPodium');
    const banner = $('lbScopeBanner');

    if (!state.selectedQuizId) {
      podium.innerHTML = '';
      hide(podium);
      hide(banner);
      wrap.innerHTML = `
        <div class="lb-empty">
          <div class="lb-empty-eyebrow">Niciun chestionar selectat</div>
          <div class="lb-empty-title">Alege un chestionar din filtru</div>
          <div class="lb-empty-body">Clasamentele sunt per-chestionar. Selectează unul mai sus pentru a vedea cine îl conduce.</div>
        </div>`;
      return;
    }

    let url;
    if (state.currentTab === 'national') url = '/api/leaderboard/national';
    else if (state.currentTab === 'class' && state.selectedClassId)
      url = `/api/leaderboard/class/${state.selectedClassId}`;
    else url = '/api/leaderboard/global';

    const params = new URLSearchParams({ quizId: state.selectedQuizId });
    url += '?' + params.toString();

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la încărcare');
      renderLeaderboard(data.leaderboard || [], data);
    } catch (err) {
      console.error('[leaderboard] load error:', err);
      hide(podium);
      hide(banner);
      wrap.innerHTML = `<div class="status status--error" style="margin: 1rem;">Eroare · ${escapeHTML(err.message)}</div>`;
    }
  }

  function renderLeaderboard(rows, data) {
    const wrap = $('lbTable');
    const podium = $('lbPodium');
    const banner = $('lbScopeBanner');

    // Scope banner — national & class only
    if (state.currentTab === 'national' && data?.country) {
      banner.innerHTML = `<span>Clasament național</span><strong>${escapeHTML(data.country)}</strong>`;
      show(banner);
    } else if (state.currentTab === 'class' && state.selectedClassId) {
      const cls = state.classes.find(c => String(c.id) === String(state.selectedClassId));
      banner.innerHTML = `<span>Clasă</span><strong>${escapeHTML(cls?.name || '—')}</strong>`;
      show(banner);
    } else {
      hide(banner);
    }

    if (!rows.length) {
      hide(podium);
      podium.innerHTML = '';
      wrap.innerHTML = `
        <div class="lb-empty">
          <div class="lb-empty-eyebrow">Niciun rezultat</div>
          <div class="lb-empty-title">Clasamentul este gol</div>
          <div class="lb-empty-body">Fii primul care completează acest chestionar.</div>
        </div>`;
      return;
    }

    // Podium
    const top3 = rows.slice(0, 3);
    if (top3.length >= 3) {
      podium.innerHTML = top3.map((entry, i) => {
        const rank = i + 1;
        const initial = (entry.username || '?').charAt(0).toUpperCase();
        return `
          <div class="lb-podium-card lb-podium-card--${rank}">
            <div class="lb-medal lb-medal--${rank}">${rank}</div>
            <div class="lb-podium-avatar">${escapeHTML(initial)}</div>
            <div class="lb-podium-name">${escapeHTML(entry.username || '—')}</div>
            <div class="lb-podium-meta">
              <span class="lb-podium-pct">${Number(entry.percentage).toFixed(0)}%</span>
              <span class="lb-podium-time">${fmtTime(entry.time_taken)} · ${entry.score}/${entry.total_questions}</span>
            </div>
          </div>`;
      }).join('');
      show(podium);
    } else {
      podium.innerHTML = '';
      hide(podium);
    }

    // Full table
    const head = `
      <div class="lb-table-head">
        <div>Rang</div>
        <div>Student</div>
        <div>Țară</div>
        <div>Scor</div>
        <div>Procent</div>
        <div>Timp</div>
        <div>Data</div>
      </div>
    `;
    const meName = state.currentUser?.username;
    const body = rows.map((entry, i) => {
      const rank = i + 1;
      const rankCls = rank <= 3 ? `lb-rank lb-rank--${rank}` : 'lb-rank';
      const initial = (entry.username || '?').charAt(0).toUpperCase();
      const pct = Number(entry.percentage);
      const isYou = entry.username && meName && entry.username === meName;
      const youTag = isYou ? '<span class="lb-username-you">Tu</span>' : '';
      const rowCls = isYou ? 'lb-table-row lb-table-row--you' : 'lb-table-row';
      const country = entry.country
        ? escapeHTML(entry.country)
        : '<span style="opacity:.4">—</span>';
      return `
        <div class="${rowCls}">
          <div class="${rankCls}">${rank}</div>
          <div class="lb-user">
            <span class="lb-avatar">${escapeHTML(initial)}</span>
            <span class="lb-username">${escapeHTML(entry.username || '—')}${youTag}</span>
          </div>
          <div class="lb-country">${country}</div>
          <div class="lb-score">
            <span class="lb-score-correct">${entry.score}</span><span class="lb-score-of">/</span><span>${entry.total_questions}</span>
          </div>
          <div class="lb-pct ${pctClass(pct)}">
            <span class="lb-pct-bar" style="--pct: ${Math.max(0, Math.min(100, pct))}%"></span>
            <span class="lb-pct-num">${pct.toFixed(0)}%</span>
          </div>
          <div class="lb-time">${fmtTime(entry.time_taken)}</div>
          <div class="lb-date">${fmtDate(entry.completed_at)}</div>
        </div>`;
    }).join('');

    wrap.innerHTML = head + body;
  }

  // ─── Tabs ──────────────────────────────────────────────────
  function switchTab(tab) {
    if (tab === state.currentTab) return;
    state.currentTab = tab;
    document.querySelectorAll('.lb-tab').forEach(b => {
      b.classList.toggle('is-active', b.dataset.tab === tab);
    });
    if (tab === 'class' && !state.selectedClassId && state.classes.length) {
      state.selectedClassId = state.classes[0].id;
      $('lbClassSelect').value = state.selectedClassId;
    }
    loadStats();
    loadLeaderboard();
  }

  // ─── Wire-up ───────────────────────────────────────────────
  async function init() {
    Atomify.initAuthModal();

    document.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    $('lbQuizSelect').addEventListener('change', (e) => {
      state.selectedQuizId = e.target.value || null;
      loadStats();
      loadLeaderboard();
    });
    $('lbClassSelect').addEventListener('change', (e) => {
      state.selectedClassId = e.target.value || null;
      if (state.selectedClassId) switchTab('class');
      else loadLeaderboard();
    });
    $('lbAuthLoginBtn').addEventListener('click', () => Atomify.showAuthModal('login'));

    const authed = await checkAuth();
    if (!authed) {
      show($('lbAuthRequired'));
      hide($('lbContent'));
      return;
    }
    show($('lbContent'));
    await loadInitial();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
