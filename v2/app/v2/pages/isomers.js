/* ============================================================
   Atomify · v2 · isomers (page logic)
   ------------------------------------------------------------
   Organic isomer generator. Calls /api/isomers, renders SMILES
   structures via SmilesDrawer, supports PDF export. The business
   logic is intentionally close to the v1 implementation; the UI
   is rewritten to use the v2 design system + Atomify helpers.
   ============================================================ */

(function () {
  'use strict';

  // ─── External library URLs (lazy-loaded on demand) ─────────
  const LIB = {
    smilesDrawer: 'https://unpkg.com/smiles-drawer/dist/smiles-drawer.min.js',
    html2canvas:  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf:        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  };
  const loaded = { smilesDrawer: false, html2canvas: false, jspdf: false };

  // ─── State ─────────────────────────────────────────────────
  let allSmiles = [];
  let currentFormula = '';

  // ─── Examples for the "Formule clasice" section ────────────
  const EXAMPLES = [
    { formula: 'C4H10',  name: 'Butan',        count: 2,  level: 'simplu' },
    { formula: 'C5H12',  name: 'Pentan',       count: 3,  level: 'simplu' },
    { formula: 'C4H8',   name: 'Butenă',       count: 3,  level: 'simplu' },
    { formula: 'C6H14',  name: 'Hexan',        count: 5,  level: 'mediu' },
    { formula: 'C4H10O', name: 'Butanol',      count: 4,  level: 'mediu' },
    { formula: 'C7H16',  name: 'Heptan',       count: 9,  level: 'mediu' },
    { formula: 'C8H18',  name: 'Octan',        count: 18, level: 'avansat' },
    { formula: 'C4H8O2', name: 'Acid butiric', count: null, level: 'avansat' },
  ];

  // ─── Mobile detection (keeps v1 caps to avoid heavy DOMs) ──
  function isMobile() {
    return window.innerWidth <= 720
        || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // ─── Lazy <script> loader ──────────────────────────────────
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Nu s-a putut încărca ${url}`));
      document.head.appendChild(s);
    });
  }
  async function ensureSmilesDrawer() {
    if (loaded.smilesDrawer) return;
    await loadScript(LIB.smilesDrawer);
    loaded.smilesDrawer = true;
  }
  async function ensurePdfLibs() {
    if (!loaded.html2canvas) { await loadScript(LIB.html2canvas); loaded.html2canvas = true; }
    if (!loaded.jspdf)       { await loadScript(LIB.jspdf);       loaded.jspdf = true; }
  }
  function drawSmiles() {
    if (typeof SmiDrawer !== 'undefined') {
      try { SmiDrawer.apply(); } catch (e) { console.error('[isomers] SmiDrawer.apply()', e); }
    }
  }

  // ─── Formula parser (mirrors v1, uses Atomify element data) ─
  function parseFormula(formula, masses) {
    let i = 0;
    function segment() {
      const atoms = {};
      while (i < formula.length) {
        const c = formula[i];
        if (/[A-Z]/.test(c)) {
          let el = c; i++;
          if (i < formula.length && /[a-z]/.test(formula[i])) { el += formula[i]; i++; }
          if (!masses[el]) throw new Error(`Simbol „${el}" necunoscut.`);
          let n = ''; while (i < formula.length && /\d/.test(formula[i])) { n += formula[i]; i++; }
          const k = n ? parseInt(n, 10) : 1;
          if (!Number.isFinite(k) || k <= 0) throw new Error(`Număr invalid după ${el}.`);
          atoms[el] = (atoms[el] || 0) + k;
        } else if (c === '(') {
          i++;
          const sub = segment();
          if (i >= formula.length || formula[i] !== ')') throw new Error('Paranteză „(" fără pereche.');
          i++;
          let n = ''; while (i < formula.length && /\d/.test(formula[i])) { n += formula[i]; i++; }
          const f = n ? parseInt(n, 10) : 1;
          if (!Number.isFinite(f) || f <= 0) throw new Error('Număr invalid după „)".');
          for (const e in sub) atoms[e] = (atoms[e] || 0) + sub[e] * f;
        } else if (c === ')') {
          break;
        } else {
          if (!/\s/.test(c)) throw new Error(`Caracter invalid „${c}".`);
          i++;
        }
      }
      return atoms;
    }
    const result = segment();
    if (i < formula.trimEnd().length) throw new Error(`Eroare la „${formula.substring(i)}".`);
    if (!Object.keys(result).length && formula.trim()) throw new Error('Nu s-au identificat elemente valide.');
    return result;
  }
  function formatAtoms(atoms) {
    let out = '';
    for (const e in atoms) { out += e; if (atoms[e] > 1) out += atoms[e]; }
    return out;
  }

  // ─── Rendering helpers ─────────────────────────────────────
  function $result() { return document.getElementById('result'); }
  function setResult(html) { $result().innerHTML = html; }
  function fmt(formula) { return Atomify.formatFormulaHTML(formula); }

  function statusLoading(msg) {
    setResult(`<div class="status status--loading">${msg}</div>`);
  }
  function statusError(msg) {
    setResult(`<div class="status status--error">${msg}</div>`);
  }

  function renderPanel(smilesList, formula, totalKnown) {
    const total = (typeof totalKnown === 'number' && totalKnown > 0) ? totalKnown : smilesList.length;
    const partial = total > smilesList.length;
    const truncatedMobile = isMobile() && smilesList.length > 500;
    const display = truncatedMobile ? smilesList.slice(0, 500) : smilesList;

    const meta = truncatedMobile
      ? `AFIȘAJ · ${display.length} din ${smilesList.length} (optimizat pentru mobil)`
      : (partial
          ? `AFIȘAJ · ${smilesList.length} din ${total}`
          : `AFIȘAJ · ${smilesList.length}`);

    const noteHTML = (totalKnown === -1)
      ? '<div class="iso-count-note">Total exact necunoscut · numărarea a depășit timpul alocat.</div>'
      : '';

    setResult(`
      <div class="iso-panel" role="region" aria-label="Izomeri generați">
        <div class="iso-panel-head">
          <div>
            <span class="label-mono">Formulă moleculară</span>
            <div class="iso-formula">${fmt(formula)}</div>
          </div>
          <div class="iso-count-block">
            <span class="label-mono">Izomeri</span>
            <div>
              <span class="iso-count">${total}</span>
              <span class="iso-count-unit">structuri</span>
            </div>
            ${noteHTML}
          </div>
        </div>
        <div class="iso-panel-toolbar">
          <span class="iso-toolbar-meta">${meta}</span>
          <button type="button" id="isoPdfBtn" class="iso-pdf-btn" aria-label="Descarcă PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M5 21h14"/>
            </svg>
            Descarcă PDF
          </button>
        </div>
        <div class="iso-grid" id="isoGrid"></div>
      </div>
    `);

    document.getElementById('isoPdfBtn').addEventListener('click', downloadPdf);

    const grid = document.getElementById('isoGrid');
    if (display.length > 100) {
      loadProgressively(grid, display);
    } else {
      grid.innerHTML = display.map(cardHTML).join('');
      ensureSmilesDrawer().then(drawSmiles).catch(err => console.error(err));
    }
  }

  function cardHTML(smiles, idx) {
    return `
      <div class="iso-card">
        <div class="iso-card-num">Izomer · ${String(idx + 1).padStart(2, '0')}</div>
        <div class="iso-card-canvas">
          <img data-smiles="${smiles}" alt="Structură izomer ${idx + 1}" />
        </div>
        <div class="iso-card-smiles">${smiles}</div>
      </div>
    `;
  }

  function loadProgressively(grid, smilesArray) {
    const batchSize = isMobile() ? 25 : 50;
    const total = smilesArray.length;
    let i = 0;

    const progress = document.createElement('div');
    progress.className = 'iso-progress';
    progress.innerHTML = `
      <span>SE ÎNCARCĂ STRUCTURILE</span>
      <div class="iso-progress-bar" style="--progress: 0%"></div>
      <span class="iso-progress-num">0%</span>
    `;
    grid.insertAdjacentElement('afterend', progress);

    function step() {
      const end = Math.min(i + batchSize, total);
      const chunk = [];
      for (let k = i; k < end; k++) chunk.push(cardHTML(smilesArray[k], k));
      grid.insertAdjacentHTML('beforeend', chunk.join(''));
      i = end;
      const pct = Math.round((i / total) * 100);
      progress.querySelector('.iso-progress-bar').style.setProperty('--progress', pct + '%');
      progress.querySelector('.iso-progress-num').textContent = pct + '%';
      drawSmiles();
      if (i < total) setTimeout(step, isMobile() ? 280 : 140);
      else progress.remove();
    }

    ensureSmilesDrawer().then(step).catch(err => {
      console.error(err);
      progress.remove();
    });
  }

  function renderBigConfirm(data, formula) {
    const onMobile = isMobile();
    const estimate = data.count != null
      ? `<dl class="iso-warning-meta">
           <div><dt>Estimat</dt><dd>${data.count} izomeri</dd></div>
           ${onMobile ? '<div><dt>Pe mobil</dt><dd>Maxim 500 afișați</dd></div>' : ''}
         </dl>`
      : '';
    setResult(`
      <div class="iso-warning" role="alert">
        <div class="iso-warning-eyebrow">Formulă mare</div>
        <h3 class="iso-warning-title">Confirmare necesară</h3>
        <p class="iso-warning-body">${escapeHTML(data.message || 'Formula poate genera un număr mare de izomeri.')}</p>
        ${estimate}
        <div class="iso-warning-actions">
          <button type="button" class="btn btn-primary" id="bigYes">
            ${onMobile ? 'Da, afișează (optimizat)' : 'Da, afișează primii 1500'}
          </button>
          <button type="button" class="btn btn-ghost" id="bigNo">Nu, e prea mult</button>
        </div>
      </div>
    `);
    document.getElementById('bigYes').addEventListener('click', () => fetchConfirmed(formula));
    document.getElementById('bigNo').addEventListener('click', () => {
      setResult(`<div class="status">În regulă, izomerii nu vor fi afișați. Încearcă o formulă mai mică.</div>`);
    });
  }

  function renderComplexWarning(data, formula) {
    const c = data.complexity || {};
    const levelLabel = ({
      simplu: 'Simplu',
      mediu: 'Mediu',
      complex: 'Complex',
      foarte_complex: 'Foarte complex',
    })[c.level] || (c.level || '');
    setResult(`
      <div class="iso-warning" role="alert">
        <div class="iso-warning-eyebrow">Formulă complexă</div>
        <h3 class="iso-warning-title">Procesare îndelungată</h3>
        <p class="iso-warning-body">${escapeHTML(data.message || 'Această formulă poate dura 1–2 minute.')}</p>
        ${c.carbons != null ? `
          <dl class="iso-warning-meta">
            <div><dt>Carbon</dt><dd>${c.carbons}</dd></div>
            <div><dt>Hidrogen</dt><dd>${c.hydrogens}</dd></div>
            <div><dt>Heteroatomi</dt><dd>${c.heteroatoms}</dd></div>
            <div><dt>Nivel</dt><dd>${levelLabel}</dd></div>
          </dl>
        ` : ''}
        <div class="iso-warning-actions">
          <button type="button" class="btn btn-primary" id="complexYes">Continuă oricum</button>
          <button type="button" class="btn btn-ghost" id="complexNo">Alege o formulă mai simplă</button>
        </div>
      </div>
    `);
    document.getElementById('complexYes').addEventListener('click', () => {
      statusLoading(`Se procesează formula complexă ${formula}…`);
      fetchConfirmed(formula);
    });
    document.getElementById('complexNo').addEventListener('click', () => renderSuggestions());
  }

  function renderSmartError(data) {
    const suggestionsHTML = (data.suggestions && data.suggestions.length)
      ? `<div class="iso-level">
           <div class="iso-level-head">
             <span class="iso-level-name">Încearcă în schimb</span>
             <span class="iso-level-rule"></span>
           </div>
           <div class="iso-level-list">
             ${data.suggestions.map(s => `
               <button type="button" class="iso-suggestion" data-formula="${escapeAttr(s.formula)}">
                 <span class="iso-suggestion-formula">${fmt(s.formula)}</span>
                 <span class="iso-suggestion-desc">${escapeHTML(s.descriere || '')}</span>
               </button>
             `).join('')}
           </div>
         </div>`
      : '';

    const estimateHTML = data.estimatedIsomers
      ? `<dl class="iso-warning-meta">
           <div><dt>Estimat</dt><dd>${data.estimatedIsomers.toLocaleString('ro-RO')} izomeri</dd></div>
         </dl>`
      : '';

    setResult(`
      <div class="iso-warning" role="alert">
        <div class="iso-warning-eyebrow">Informație educațională</div>
        <h3 class="iso-warning-title">${escapeHTML(data.error || 'Formula nu poate fi procesată.')}</h3>
        ${estimateHTML}
      </div>
      ${suggestionsHTML ? `<div class="iso-suggestions">${suggestionsHTML}</div>` : ''}
    `);
    bindSuggestionClicks();
  }

  function renderSuggestions() {
    setResult(`
      <div class="iso-suggestions">
        <div class="iso-suggestions-head">
          <div class="iso-warning-eyebrow">Recomandate</div>
          <h3 class="iso-suggestions-title">Formule potrivite pentru învățare</h3>
          <p class="iso-suggestions-sub">Începe cu o formulă simplă și urcă în complexitate.</p>
        </div>
        ${suggestionLevel('Începători', [
          { formula: 'C4H10', descriere: 'Butanul — 2 izomeri.' },
          { formula: 'C5H12', descriere: 'Pentanul — 3 izomeri.' },
          { formula: 'C4H8',  descriere: 'Butena — 3 izomeri.' },
        ])}
        ${suggestionLevel('Intermediari', [
          { formula: 'C6H14',  descriere: 'Hexanul — 5 izomeri.' },
          { formula: 'C6H12',  descriere: 'Hexena — izomerie de poziție.' },
          { formula: 'C4H10O', descriere: 'Butanolul — 4 izomeri.' },
        ])}
        ${suggestionLevel('Avansați', [
          { formula: 'C7H16',  descriere: 'Heptanul — 9 izomeri.' },
          { formula: 'C8H18',  descriere: 'Octanul — 18 izomeri.' },
          { formula: 'C4H8O2', descriere: 'Acid butiric — izomerie funcțională.' },
        ])}
      </div>
    `);
    bindSuggestionClicks();
  }

  function suggestionLevel(name, items) {
    return `
      <div class="iso-level">
        <div class="iso-level-head">
          <span class="iso-level-name">${name}</span>
          <span class="iso-level-rule"></span>
        </div>
        <div class="iso-level-list">
          ${items.map(s => `
            <button type="button" class="iso-suggestion" data-formula="${escapeAttr(s.formula)}">
              <span class="iso-suggestion-formula">${fmt(s.formula)}</span>
              <span class="iso-suggestion-desc">${escapeHTML(s.descriere)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindSuggestionClicks() {
    const input = document.getElementById('formulaInput');
    const field = document.getElementById('formulaField');
    document.querySelectorAll('.iso-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-formula') || '';
        if (input) {
          input.value = f;
          if (field) field.dataset.hasValue = f.length > 0 ? 'true' : 'false';
          input.focus();
        }
        const form = document.getElementById('isoForm');
        if (!form) return;
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function escapeAttr(str) { return escapeHTML(str); }

  // ─── API ───────────────────────────────────────────────────
  async function fetchAndShow(formula, confirmFlag) {
    const url = `/api/isomers?formula=${encodeURIComponent(formula)}${confirmFlag ? '&confirm=1' : ''}`;
    let data;
    try {
      const res = await fetch(url);
      const text = await res.text();
      try { data = JSON.parse(text); }
      catch { throw new Error(`Răspuns invalid de la server (HTTP ${res.status}).`); }
    } catch (err) {
      statusError(`Eroare de rețea · ${err.message}`);
      return;
    }

    if (data.error) {
      renderSmartError(data);
      return;
    }
    if (!confirmFlag && data.warning === true && data.message) {
      renderComplexWarning(data, formula);
      return;
    }
    if (!confirmFlag && data.big === true && data.message) {
      renderBigConfirm(data, formula);
      return;
    }
    if (data.timedOutEnumerationPartial === true) {
      const partial = (data.smilesList && data.smilesList.length) || 0;
      if (partial > 0) {
        renderPanel(data.smilesList, formula, data.actualTotalIsomers);
        return;
      }
      setResult(`
        <div class="iso-warning" role="alert">
          <div class="iso-warning-eyebrow">Timp depășit</div>
          <h3 class="iso-warning-title">Generarea a fost întreruptă</h3>
          <p class="iso-warning-body">${escapeHTML(data.message || 'Nu s-au putut extrage izomeri înainte de expirarea timpului.')}</p>
        </div>
      `);
      return;
    }
    if (data.smilesList && data.smilesList.length > 0) {
      allSmiles = data.smilesList;
      currentFormula = formula;
      renderPanel(data.smilesList, formula, data.actualTotalIsomers);
      return;
    }
    setResult(`<div class="status">Răspuns neașteptat de la server pentru ${formula}.</div>`);
  }

  async function fetchConfirmed(formula) {
    statusLoading(`Se generează izomerii pentru ${escapeHTML(formula)}…`);
    await fetchAndShow(formula, true);
  }

  // ─── PDF export ────────────────────────────────────────────
  async function downloadPdf() {
    if (!allSmiles.length) return;
    const formula = currentFormula || 'formula';
    const btn = document.getElementById('isoPdfBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Se pregătește…'; }

    try {
      await ensureSmilesDrawer();
      await ensurePdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let temp = document.getElementById('iso-pdf-temp');
      if (!temp) {
        temp = document.createElement('div');
        temp.id = 'iso-pdf-temp';
        temp.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:#fff;';
        document.body.appendChild(temp);
      }

      const perPage = 6;
      const pages = Math.ceil(allSmiles.length / perPage);

      for (let p = 0; p < pages; p++) {
        if (p > 0) pdf.addPage();
        if (btn) btn.textContent = `Pagina ${p + 1}/${pages}`;

        const pageDiv = document.createElement('div');
        pageDiv.style.cssText = 'padding:10mm;box-sizing:border-box;width:210mm;height:297mm;background:#fff;font-family:sans-serif;color:#0F1622;';

        const title = document.createElement('p');
        title.style.cssText = 'text-align:center;font-size:12pt;font-weight:600;margin:0 0 5mm 0;';
        title.textContent = p === 0
          ? `Izomeri pentru ${formula} (total ${allSmiles.length}) — pagina ${p + 1}/${pages}`
          : `Izomeri pentru ${formula} — pagina ${p + 1}/${pages}`;
        pageDiv.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5mm;width:190mm;';

        const start = p * perPage;
        const end = Math.min(start + perPage, allSmiles.length);
        for (let i = start; i < end; i++) {
          const card = document.createElement('div');
          card.style.cssText = 'border:1px solid #ddd;padding:2mm;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;box-sizing:border-box;';

          const imgWrap = document.createElement('div');
          imgWrap.style.cssText = 'width:85mm;height:60mm;display:flex;align-items:center;justify-content:center;margin-bottom:2mm;';
          const img = document.createElement('img');
          img.setAttribute('data-smiles', allSmiles[i]);
          img.style.cssText = 'max-width:100%;max-height:100%;';
          imgWrap.appendChild(img);
          card.appendChild(imgWrap);

          const lbl = document.createElement('p');
          lbl.style.cssText = 'font-size:7pt;margin:0;text-align:center;word-break:break-all;color:#4A5568;';
          lbl.textContent = `SMILES: ${allSmiles[i]}`;
          card.appendChild(lbl);

          grid.appendChild(card);
        }
        pageDiv.appendChild(grid);
        temp.innerHTML = '';
        temp.appendChild(pageDiv);

        drawSmiles();
        await new Promise(r => setTimeout(r, 800 + perPage * 60));

        const canvas = await html2canvas(pageDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);

        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const margin = 10;
        let w = pw - 2 * margin;
        let h = (canvas.height * w) / canvas.width;
        if (h > ph - 2 * margin) { h = ph - 2 * margin; w = (canvas.width * h) / canvas.height; }
        pdf.addImage(imgData, 'JPEG', (pw - w) / 2, margin, w, h);
      }

      pdf.save(`izomeri_${formula.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      temp.remove();
    } catch (err) {
      console.error('[isomers] PDF error:', err);
      alert('Eroare la generarea PDF-ului: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>
          </svg>
          Descarcă PDF`;
      }
    }
  }

  // ─── Examples grid (renders into chapter 02) ──────────────
  function renderExamples() {
    const container = document.getElementById('isoExamples');
    if (!container) return;
    container.innerHTML = EXAMPLES.map((ex, idx) => {
      const tag = ex.count != null ? `${ex.count} izomeri` : 'izomerie funcțională';
      return `
        <button type="button" class="iso-example" data-formula="${escapeAttr(ex.formula)}">
          <div class="iso-example-head">
            <span class="iso-example-num">${String(idx + 1).padStart(2, '0')} · ${ex.name}</span>
            <span class="iso-example-count">${tag}</span>
          </div>
          <span class="iso-example-formula">${fmt(ex.formula)}</span>
          <span class="iso-example-name">${capitalize(ex.level)}</span>
        </button>
      `;
    }).join('');
  }
  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  // ─── Auth gate (preserved from v1) ────────────────────────
  async function isAuthenticated() {
    try {
      const r = await fetch('/user');
      return r.ok;
    } catch { return false; }
  }

  // ─── Wire-up ───────────────────────────────────────────────
  function init() {
    Atomify.initAuthModal();
    renderExamples();

    const form    = document.getElementById('isoForm');
    const field   = document.getElementById('formulaField');
    const input   = document.getElementById('formulaInput');
    const clearBtn = document.getElementById('isoClearBtn');
    const randomBtn = document.getElementById('isoRandomBtn');
    if (!form || !input) return;

    const syncField = () => {
      field.dataset.hasValue = input.value.length > 0 ? 'true' : 'false';
    };
    input.addEventListener('input', syncField);
    syncField();

    document.querySelectorAll('.iso-example').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-formula') || '';
        syncField();
        input.focus();
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      syncField();
      input.focus();
      setResult('');
    });

    randomBtn?.addEventListener('click', () => {
      const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
      input.value = pick.formula;
      syncField();
      input.focus();
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) {
        statusError('Introdu o formulă moleculară.');
        return;
      }

      // Validate + normalize formula client-side
      let formula = raw;
      try {
        const atoms = parseFormula(raw, Atomify.elements.masses);
        const normalized = formatAtoms(atoms);
        if (normalized !== raw) {
          input.value = normalized;
          syncField();
          formula = normalized;
        }
      } catch (err) {
        statusError(`Eroare în formulă · ${err.message}`);
        return;
      }

      // Require login (server enforces too, but UX-wise we surface it early)
      if (!(await isAuthenticated())) {
        Atomify.showAuthModal('login');
        return;
      }

      currentFormula = formula;
      allSmiles = [];
      statusLoading(`Se procesează formula ${escapeHTML(formula)}…`);
      await fetchAndShow(formula, false);
    });

    // Hook: if redirected from /istoric with a saved formula
    const regen = localStorage.getItem('regenerateFormula');
    if (regen) {
      localStorage.removeItem('regenerateFormula');
      input.value = regen;
      syncField();
      input.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await Atomify.loadElements();
    init();
  });
})();
