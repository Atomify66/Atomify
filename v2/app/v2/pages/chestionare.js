/* ============================================================
   Atomify · v2 · chestionare (page logic)
   ------------------------------------------------------------
   Quiz library + in-session interface + results.
   Backend contract (preserved from v1):
     · GET  /user                       — auth check
     · GET  /api/quizzes                — quiz list
     · GET  /api/quiz/:id               — quiz with questions
     · POST /api/quiz/:id/submit        — submit answers
     · POST /homework/:id/submit        — homework variant
   MathJax is loaded async from CDN; we typeset on each render.
   ============================================================ */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────
  const state = {
    currentUser: null,
    quizzes: [],
    quiz: null,
    qIndex: 0,
    answers: {},
    questionMappings: {},
    timeLeft: 300,
    timerId: null,
    finished: false,
    startedAt: null,
    isHomeworkMode: false,
    homeworkId: null,
    lastResults: null,
  };

  // ─── Helpers ───────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  function letterFor(i) { return String.fromCharCode(65 + i); } // 0→A

  function typeset(elements) {
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise(elements.filter(Boolean)).catch(err => {
        console.error('[chestionare] MathJax error:', err);
      });
    }
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  // ─── View routing (library vs session vs results) ─────────
  function showLibrary() {
    show($('quizLibraryView'));
    hide($('quizSessionView'));
    hide($('quizResultsView'));
    hide($('quizAuthRequired'));
  }
  function showSession() {
    hide($('quizLibraryView'));
    show($('quizSessionView'));
    hide($('quizResultsView'));
    hide($('quizAuthRequired'));
  }
  function showResults() {
    hide($('quizLibraryView'));
    show($('quizSessionView'));   // keep questions visible for review
    show($('quizResultsView'));
  }
  function showAuthRequired() {
    show($('quizAuthRequired'));
    hide($('quizLibraryView'));
    hide($('quizSessionView'));
    hide($('quizResultsView'));
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

  // ─── Quiz library ──────────────────────────────────────────
  async function loadQuizzes() {
    const libEl = $('quizLibrary');
    libEl.innerHTML = `
      <div class="status status--loading" style="grid-column: 1 / -1;">
        Se încarcă chestionarele…
      </div>`;
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la încărcare');
      state.quizzes = Array.isArray(data) ? data : [];
      renderLibrary();
    } catch (err) {
      libEl.innerHTML = `<div class="status status--error" style="grid-column: 1 / -1;">Eroare · ${escapeHTML(err.message)}</div>`;
    }
  }

  function renderLibrary() {
    const libEl = $('quizLibrary');
    if (!state.quizzes.length) {
      libEl.innerHTML = `
        <div class="quiz-empty" style="grid-column: 1 / -1;">
          <div class="quiz-empty-title">Nu există chestionare disponibile</div>
          <div>Revino mai târziu sau contactează profesorul tău.</div>
        </div>`;
      return;
    }
    libEl.innerHTML = state.quizzes.map((q, i) => {
      const minutes = Math.max(1, Math.round((q.timeLimit || 300) / 60));
      return `
        <button type="button" class="quiz-card" data-quiz-id="${escapeHTML(q.id)}">
          <div class="quiz-card-eyebrow">
            <span class="quiz-card-num">Test · ${String(i + 1).padStart(2, '0')}</span>
            <span class="quiz-card-badge">BAC</span>
          </div>
          <h3 class="quiz-card-title">${escapeHTML(q.title)}</h3>
          <p class="quiz-card-desc">${escapeHTML(q.description || '')}</p>
          <div class="quiz-card-stats">
            <div class="quiz-card-stat">
              <span class="quiz-card-stat-label">Întrebări</span>
              <span class="quiz-card-stat-value">${q.questionCount ?? '—'}</span>
            </div>
            <div class="quiz-card-stat">
              <span class="quiz-card-stat-label">Timp</span>
              <span class="quiz-card-stat-value">${minutes} min</span>
            </div>
          </div>
          <span class="quiz-card-cta">
            Începe testul
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </span>
        </button>`;
    }).join('');
    libEl.querySelectorAll('.quiz-card').forEach(card => {
      card.addEventListener('click', () => startQuiz(card.dataset.quizId));
    });
  }

  // ─── Start a quiz ──────────────────────────────────────────
  async function startQuiz(quizId) {
    if (!state.currentUser) {
      Atomify.showAuthModal('login');
      return;
    }
    try {
      const res = await fetch(`/api/quiz/${quizId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la încărcarea chestionarului');
      state.quiz = data;
      state.quiz.id = quizId;
      state.qIndex = 0;
      state.answers = {};
      state.finished = false;
      state.timeLeft = state.quiz.timeLimit || 300;
      state.startedAt = Date.now();
      state.lastResults = null;
      state.questionMappings = {};
      (state.quiz.questions || []).forEach(q => {
        if (q.optionMapping) state.questionMappings[q.id] = { optionMapping: q.optionMapping };
      });
      hide($('quizResultsView'));
      $('quizFinalizeBtn').disabled = false;
      renderSessionHeader();
      renderDots();
      renderQuestion();
      startTimer();
      showSession();
      $('quizSessionView').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      const libEl = $('quizLibrary');
      libEl.innerHTML = `<div class="status status--error" style="grid-column: 1 / -1;">${escapeHTML(err.message)}</div>`;
    }
  }

  // ─── Session header (title + score chip + timer) ──────────
  function renderSessionHeader() {
    $('quizSessionTitle').textContent = state.quiz.title || 'Chestionar';
    $('quizSessionEyebrow').textContent = state.isHomeworkMode ? 'Rezolvare temă' : 'Chestionar · BAC';
    updateScoreChip();
    updateProgress();
    updateTimerEl();
  }
  function updateScoreChip() {
    const total = state.quiz.questions.length;
    const answered = Object.keys(state.answers).length;
    $('quizScoreCurrent').textContent = answered;
    $('quizScoreTotal').textContent = total;
  }
  function updateProgress() {
    const total = state.quiz.questions.length;
    const answered = Object.keys(state.answers).length;
    const pct = total ? (answered / total) * 100 : 0;
    $('quizProgress').style.setProperty('--progress', pct.toFixed(2) + '%');
  }

  // ─── Dots (question jump nav) ─────────────────────────────
  function renderDots() {
    const wrap = $('quizDots');
    wrap.innerHTML = '';
    state.quiz.questions.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-dot';
      btn.textContent = String(i + 1);
      btn.addEventListener('click', () => {
        if (state.finished) {
          state.qIndex = i;
          renderQuestion();
        } else {
          saveCurrent();
          state.qIndex = i;
          renderQuestion();
        }
      });
      wrap.appendChild(btn);
    });
    updateDotsUI();
  }
  function updateDotsUI() {
    const dots = $('quizDots').querySelectorAll('.quiz-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('quiz-dot--answered', 'quiz-dot--active', 'quiz-dot--correct', 'quiz-dot--wrong');
      const q = state.quiz.questions[i];
      if (state.answers[q.id] !== undefined && state.answers[q.id] !== '') {
        dot.classList.add('quiz-dot--answered');
      }
      if (i === state.qIndex) dot.classList.add('quiz-dot--active');
      if (state.finished && state.lastResults) {
        const r = state.lastResults.results.find(r => r.questionId === q.id);
        if (r) dot.classList.add(r.isCorrect ? 'quiz-dot--correct' : 'quiz-dot--wrong');
      }
    });
  }

  // ─── Question render ──────────────────────────────────────
  function renderQuestion() {
    const q = state.quiz.questions[state.qIndex];
    const total = state.quiz.questions.length;
    $('quizQEyebrow').textContent = `Întrebarea ${state.qIndex + 1} din ${total}`;
    $('quizQTitle').innerHTML = q.question;

    const optionsEl = $('quizOptions');
    const result = state.finished && state.lastResults
      ? state.lastResults.results.find(r => r.questionId === q.id)
      : null;

    if (q.type === 'text') {
      const currentAnswer = state.answers[q.id] || '';
      let inputClass = 'quiz-text-input';
      if (result) inputClass += result.isCorrect ? ' quiz-text-input--correct' : ' quiz-text-input--wrong';
      optionsEl.innerHTML = `
        <div class="quiz-text-answer">
          <label for="quizTextAnswer">Scrie răspunsul tău</label>
          <input
            type="text"
            id="quizTextAnswer"
            class="${inputClass}"
            value="${escapeHTML(currentAnswer)}"
            placeholder="Introdu răspunsul aici…"
            ${state.finished ? 'disabled' : ''}
            spellcheck="false"
            autocomplete="off"
          />
        </div>
      `;
      if (!state.finished) {
        const input = $('quizTextAnswer');
        input.addEventListener('input', () => {
          state.answers[q.id] = input.value.trim();
          updateDotsUI();
          updateScoreChip();
          updateProgress();
        });
      }
    } else {
      const userIdx = state.answers[q.id];
      optionsEl.innerHTML = `
        <div class="quiz-options">
          ${q.options.map((opt, idx) => {
            let cls = 'quiz-pill';
            if (result) {
              if (idx === result.correctAnswer) cls += ' quiz-pill--correct';
              else if (userIdx === idx) cls += ' quiz-pill--wrong';
              else cls += ' quiz-pill--disabled';
            } else if (userIdx === idx) {
              cls += ' quiz-pill--selected';
            }
            const icon = (result && idx === result.correctAnswer)
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
              : (result && userIdx === idx && !result.isCorrect)
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
                : '';
            return `
              <label class="${cls}" data-idx="${idx}">
                <span class="quiz-pill-letter">${letterFor(idx)}</span>
                <span class="quiz-pill-text">${opt}</span>
                <span class="quiz-pill-icon">${icon}</span>
                <input type="radio" name="quizOption" value="${idx}" ${userIdx === idx ? 'checked' : ''} ${state.finished ? 'disabled' : ''} />
              </label>`;
          }).join('')}
        </div>
      `;
      if (!state.finished) {
        optionsEl.querySelectorAll('.quiz-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            const idx = parseInt(pill.dataset.idx, 10);
            state.answers[q.id] = idx;
            optionsEl.querySelectorAll('.quiz-pill').forEach(p => p.classList.remove('quiz-pill--selected'));
            pill.classList.add('quiz-pill--selected');
            const radio = pill.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            updateDotsUI();
            updateScoreChip();
            updateProgress();
          });
        });
      }
    }

    // Feedback (only after submission)
    const feedbackEl = $('quizFeedback');
    feedbackEl.innerHTML = '';
    feedbackEl.className = '';
    if (result) {
      const isCorrect = result.isCorrect;
      const cls = isCorrect ? 'quiz-feedback quiz-feedback--correct' : 'quiz-feedback quiz-feedback--wrong';
      let html = `
        <span class="quiz-feedback-title">${isCorrect ? '✓ Răspuns corect' : '✗ Răspuns incorect'}</span>
      `;
      if (!isCorrect) {
        if (q.type === 'text' && result.correctAnswers) {
          html += `<div class="quiz-feedback-correct-answer">Răspunsul corect: <strong>${escapeHTML(result.correctAnswers.join(' / '))}</strong></div>`;
        } else if (q.type !== 'text' && typeof result.correctAnswer === 'number') {
          const correctText = q.options[result.correctAnswer];
          html += `<div class="quiz-feedback-correct-answer">Răspunsul corect: <strong>${letterFor(result.correctAnswer)}</strong> · ${correctText}</div>`;
        }
      }
      if (result.explanation) {
        html += `<div class="quiz-feedback-explanation">${result.explanation}</div>`;
      }
      feedbackEl.className = cls;
      feedbackEl.innerHTML = html;
    }

    updateDotsUI();
    updateNavButtons();
    typeset([$('quizQTitle'), $('quizOptions'), $('quizFeedback')]);
  }

  function updateNavButtons() {
    $('quizPrev').disabled = state.qIndex === 0;
    $('quizNext').disabled = state.qIndex === state.quiz.questions.length - 1;
  }

  function saveCurrent() {
    if (state.finished) return;
    const q = state.quiz.questions[state.qIndex];
    if (q.type === 'text') {
      const input = $('quizTextAnswer');
      if (input) state.answers[q.id] = input.value.trim();
    } else {
      const radios = document.querySelectorAll('input[name="quizOption"]');
      for (const r of radios) {
        if (r.checked) { state.answers[q.id] = parseInt(r.value, 10); break; }
      }
    }
    updateDotsUI();
    updateScoreChip();
    updateProgress();
  }

  // ─── Timer ─────────────────────────────────────────────────
  function updateTimerEl() {
    const el = $('quizTimer');
    const value = $('quizTimerValue');
    value.textContent = fmtTime(Math.max(0, state.timeLeft));
    el.classList.remove('quiz-timer--warn', 'quiz-timer--critical');
    if (state.timeLeft <= 30) el.classList.add('quiz-timer--critical');
    else if (state.timeLeft <= 60) el.classList.add('quiz-timer--warn');
  }
  function startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    updateTimerEl();
    state.timerId = setInterval(() => {
      state.timeLeft--;
      updateTimerEl();
      if (state.timeLeft <= 0) {
        clearInterval(state.timerId);
        finalize(true);
      }
    }, 1000);
  }

  // ─── Finalize ─────────────────────────────────────────────
  function openFinalize() {
    if (state.finished) return;
    const total = state.quiz.questions.length;
    const answered = Object.keys(state.answers).length;
    $('quizConfirmBody').textContent =
      `Ai răspuns la ${answered}/${total} întrebări. Vrei să trimiți răspunsurile acum?`;
    $('quizConfirm').classList.add('is-open');
  }
  function closeFinalize() { $('quizConfirm').classList.remove('is-open'); }

  async function finalize(forcedByTimer) {
    if (state.timerId) clearInterval(state.timerId);
    state.finished = true;
    saveCurrent();
    $('quizFinalizeBtn').disabled = true;
    closeFinalize();

    const timeTaken = Math.floor((Date.now() - state.startedAt) / 1000);

    let submitUrl, submitData;
    if (state.isHomeworkMode && state.homeworkId) {
      submitUrl = `/homework/${state.homeworkId}/submit`;
      submitData = { answers: state.answers, timeTaken, questionMappings: state.questionMappings };
    } else {
      submitUrl = `/api/quiz/${state.quiz.id}/submit`;
      submitData = { answers: state.answers, timeTaken, questionMappings: state.questionMappings };
    }

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const results = await res.json();
      if (!res.ok) throw new Error(results.error || 'Eroare la trimitere');
      state.lastResults = results;
      renderResults(results, forcedByTimer, timeTaken);
      renderQuestion();   // refresh to show feedback states
    } catch (err) {
      const resEl = $('quizResultsView');
      resEl.innerHTML = `<div class="status status--error">${escapeHTML(err.message)}</div>`;
      show(resEl);
    }
  }

  function renderResults(results, forcedByTimer, timeTaken) {
    const total = results.totalQuestions ?? state.quiz.questions.length;
    const score = results.score ?? 0;
    const pct = results.percentage ?? Math.round((score / total) * 100);
    const passed = pct >= 50;

    const eyebrowText = forcedByTimer
      ? 'Timp expirat'
      : (state.isHomeworkMode ? 'Temă trimisă' : 'Test finalizat');
    const eyebrowClass = forcedByTimer ? 'quiz-results-eyebrow quiz-results-eyebrow--timeout' : 'quiz-results-eyebrow';

    const reviewLinkHTML = state.isHomeworkMode
      ? `<a href="admin.html" class="quiz-results-action quiz-results-action--primary">
           Înapoi la temele mele
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M5 12h14M13 6l6 6-6 6"/>
           </svg>
         </a>`
      : `<a href="leaderboard.html" class="quiz-results-action quiz-results-action--primary">
           Vezi clasamentul
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
             <path d="M5 12h14M13 6l6 6-6 6"/>
           </svg>
         </a>`;

    const attemptHTML = results.attemptNumber
      ? `<a href="istoric.html" class="quiz-results-action">Încercarea ${results.attemptNumber}${results.maxAttempts ? ` / ${results.maxAttempts}` : ''}</a>`
      : '';

    const resEl = $('quizResultsView');
    resEl.innerHTML = `
      <div class="quiz-results">
        <div class="quiz-results-head">
          <span class="${eyebrowClass}">${eyebrowText}</span>
        </div>
        <div class="quiz-results-stats">
          <div class="quiz-stat">
            <span class="quiz-stat-label">Scor</span>
            <span class="quiz-stat-value quiz-stat-value--accent"><span class="num" id="quizStatScore">0</span>/<span class="num">${total}</span></span>
            <span class="quiz-stat-aux">${escapeHTML(state.quiz.title)}</span>
          </div>
          <div class="quiz-stat">
            <span class="quiz-stat-label">Procent</span>
            <span class="quiz-stat-value"><span class="num" id="quizStatPct">0</span>%</span>
            <span class="quiz-stat-aux">${passed ? 'reușit' : 'sub pragul de promovare'}</span>
          </div>
          <div class="quiz-stat">
            <span class="quiz-stat-label">Timp</span>
            <span class="quiz-stat-value"><span class="num">${fmtTime(timeTaken)}</span></span>
            <span class="quiz-stat-aux">${forcedByTimer ? 'încheiat automat' : 'finalizat manual'}</span>
          </div>
        </div>
        <div class="quiz-results-bar ${passed ? '' : 'quiz-results-bar--low'}" id="quizResultsBar" style="--progress: 0%"></div>
        <div class="quiz-results-actions">
          ${reviewLinkHTML}
          <a href="#quizSession" class="quiz-results-action">
            Revizuiește răspunsurile
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </a>
          ${attemptHTML}
        </div>
      </div>
    `;
    show(resEl);

    // Count-up animations
    Atomify.countUp($('quizStatScore'), score, { format: v => Math.round(v).toString() });
    Atomify.countUp($('quizStatPct'),   pct,   { format: v => Math.round(v).toString() });
    requestAnimationFrame(() => {
      $('quizResultsBar').style.setProperty('--progress', pct + '%');
    });

    resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Homework mode (auto-start from URL) ──────────────────
  function checkHomeworkMode() {
    const params = new URLSearchParams(window.location.search);
    const homework = params.get('homework');
    const quizParam = params.get('quiz');
    if (homework && quizParam) {
      state.isHomeworkMode = true;
      state.homeworkId = parseInt(homework, 10);
      return quizParam;
    }
    return null;
  }

  // ─── Wire-up ───────────────────────────────────────────────
  async function init() {
    Atomify.initAuthModal();

    $('quizPrev').addEventListener('click', () => {
      if (state.qIndex === 0) return;
      saveCurrent();
      state.qIndex--;
      renderQuestion();
    });
    $('quizNext').addEventListener('click', () => {
      if (state.qIndex >= state.quiz.questions.length - 1) return;
      saveCurrent();
      state.qIndex++;
      renderQuestion();
    });
    $('quizFinalizeBtn').addEventListener('click', openFinalize);
    $('quizConfirmYes').addEventListener('click', () => finalize(false));
    $('quizConfirmNo').addEventListener('click', closeFinalize);
    $('quizConfirm').addEventListener('click', (e) => {
      if (e.target === $('quizConfirm')) closeFinalize();
    });

    // Auth-required prompt CTA
    $('quizAuthLoginBtn').addEventListener('click', () => Atomify.showAuthModal('login'));

    const homeworkQuiz = checkHomeworkMode();
    const authed = await checkAuth();

    if (!authed) {
      showAuthRequired();
      return;
    }
    showLibrary();
    await loadQuizzes();
    if (homeworkQuiz) startQuiz(homeworkQuiz);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
