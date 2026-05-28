/* ============================================================
   Atomify · v2 · equations (page logic)
   ------------------------------------------------------------
   Stoichiometric balancer. Uses Atomify shared helpers.
   The math (parser → linear system → integer null-space) is
   intentionally identical to the v1 implementation.
   ============================================================ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  //  Parsing — equation string → reactants / products
  // ──────────────────────────────────────────────────────────
  function parseEquation(str) {
    const standardized = str.replace(/\s*(=>|->|→|=)\s*/g, '->');
    const sides = standardized.split('->');
    if (sides.length !== 2) {
      throw new Error('Folosește un separator valid: ->, →, sau =.');
    }
    const left  = sides[0].trim();
    const right = sides[1].trim();
    if (!left || !right) throw new Error('Reacție incompletă.');
    const reactants = left.split('+').map(s => s.trim()).filter(Boolean);
    const products  = right.split('+').map(s => s.trim()).filter(Boolean);
    if (!reactants.length || !products.length) {
      throw new Error('Ambele părți trebuie să conțină substanțe.');
    }
    return { reactants, products };
  }

  function parseMolecule(formula, masses) {
    let i = 0;
    function parseSegment() {
      const atoms = {};
      while (i < formula.length) {
        const c = formula[i];
        if (/[A-Z]/.test(c)) {
          let elem = c; i++;
          if (i < formula.length && /[a-z]/.test(formula[i])) { elem += formula[i]; i++; }
          if (!masses[elem]) throw new Error(`Simbol „${elem}" invalid.`);
          let num = ''; while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
          const count = num ? parseInt(num, 10) : 1;
          if (!Number.isFinite(count) || count <= 0) throw new Error(`Număr invalid după ${elem}.`);
          atoms[elem] = (atoms[elem] || 0) + count;
        } else if (c === '(') {
          i++;
          const sub = parseSegment();
          if (i >= formula.length || formula[i] !== ')') throw new Error('Paranteză „(" fără pereche.');
          i++;
          let num = ''; while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
          const factor = num ? parseInt(num, 10) : 1;
          if (!Number.isFinite(factor) || factor <= 0) throw new Error('Număr invalid după „)".');
          for (const e in sub) atoms[e] = (atoms[e] || 0) + sub[e] * factor;
        } else if (c === ')') {
          break;
        } else {
          if (!/\s/.test(c)) throw new Error(`Caracter invalid „${c}".`);
          i++;
        }
      }
      return atoms;
    }
    const result = parseSegment();
    const trimmed = formula.trimEnd();
    if (i < trimmed.length) throw new Error(`Eroare la „${formula.substring(i)}".`);
    if (Object.keys(result).length === 0 && formula.trim().length > 0) {
      throw new Error(`Formula „${formula}" nu conține elemente valide.`);
    }
    return result;
  }

  // ──────────────────────────────────────────────────────────
  //  Build matrix · solve null-space · integer reduction
  // ──────────────────────────────────────────────────────────
  function buildSystem(reactants, products, masses) {
    const substances = [...reactants, ...products];
    const parsed = substances.map(s => {
      try { return parseMolecule(s, masses); }
      catch (e) { throw new Error(`„${s}" → ${e.message}`); }
    });

    const elements = new Set();
    parsed.forEach(p => Object.keys(p).forEach(e => elements.add(e)));
    if (!elements.size) throw new Error('Niciun element identificat.');
    const elemArr = [...elements].sort();

    const rows = elemArr.length;
    const cols = substances.length;
    const A = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i++) {
      const e = elemArr[i];
      for (let j = 0; j < reactants.length; j++) {
        A[i][j] = parsed[j][e] || 0;
      }
      for (let j = reactants.length; j < cols; j++) {
        A[i][j] = -(parsed[j][e] || 0);
      }
    }
    return { A, substances, elements: elemArr, reactantsCount: reactants.length };
  }

  function solveSystem(A) {
    const k = A.length; if (!k) return null;
    const n = A[0].length;
    const M = A.map(r => [...r]);
    let rank = 0;
    const pivotCols = [];

    for (let col = 0; col < n && rank < k; col++) {
      let p = rank;
      while (p < k && Math.abs(M[p][col]) < 1e-12) p++;
      if (p === k) continue;
      if (p !== rank) [M[rank], M[p]] = [M[p], M[rank]];
      const pv = M[rank][col];
      if (Math.abs(pv) > 1e-12) for (let c = col; c < n; c++) M[rank][c] /= pv;
      for (let r = 0; r < k; r++) {
        if (r !== rank) {
          const f = M[r][col];
          if (Math.abs(f) > 1e-12) for (let c = col; c < n; c++) M[r][c] -= f * M[rank][c];
        }
      }
      pivotCols[rank] = col;
      rank++;
    }
    if (rank === n) return null;

    const x = Array(n).fill(0);
    let freeCol = -1;
    for (let col = n - 1; col >= 0; col--) {
      let isPivot = false;
      for (let r = 0; r < rank; r++) if (pivotCols[r] === col) isPivot = true;
      if (!isPivot) { freeCol = col; break; }
    }
    if (freeCol === -1) return null;
    x[freeCol] = 1;

    for (let r = rank - 1; r >= 0; r--) {
      const pc = pivotCols[r];
      let sum = 0;
      for (let c = pc + 1; c < n; c++) sum += M[r][c] * x[c];
      x[pc] = -sum;
    }

    const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
    const lcm = (a, b) => { a = Math.abs(a); b = Math.abs(b); return (!a || !b) ? 0 : (a * b) / gcd(a, b); };

    const fractions = [];
    for (const v of x) {
      if (Math.abs(v) < 1e-10) { fractions.push({ num: 0, den: 1 }); continue; }
      let best = { num: 1, den: 1, diff: Math.abs(v - 1) };
      const maxDen = 1000;
      for (let d = 1; d <= maxDen; d++) {
        const num = Math.round(v * d);
        if (num === 0 && Math.abs(v) > 1e-9) continue;
        const diff = Math.abs(v - num / d);
        if (diff < best.diff) best = { num, den: d, diff };
        if (diff < 1e-9) break;
      }
      fractions.push(best);
    }
    let common = 1;
    for (const f of fractions) if (f.num !== 0) common = lcm(common, f.den);
    common = Math.abs(common) || 1;

    let ints = fractions.map(f => Math.round(f.num * (common / f.den)));
    const signs = ints.filter(v => v !== 0).map(v => Math.sign(v));
    if (signs.length && signs.every(s => s === -1)) ints = ints.map(v => -v);
    else if (signs.some(s => s === -1)) return null;
    if (!ints.some(v => v !== 0)) return null;

    let div = 0;
    for (const v of ints) if (v !== 0) div = !div ? Math.abs(v) : gcd(div, Math.abs(v));
    if (!div) div = 1;
    if (div > 1) ints = ints.map(v => v / div);
    if (!ints.every(v => v > 0 && Number.isInteger(v))) return null;
    return ints;
  }

  function molarMass(formula, masses) {
    try {
      const atoms = parseMolecule(formula, masses);
      let total = 0;
      for (const e in atoms) {
        if (!masses[e]) return null;
        total += masses[e] * atoms[e];
      }
      return total;
    } catch { return null; }
  }

  // ──────────────────────────────────────────────────────────
  //  Render
  // ──────────────────────────────────────────────────────────
  function renderEquationDisplay(substances, coefs, reactantsCount) {
    const tokenize = (subs, c) => {
      const formula = Atomify.formatFormulaHTML(subs);
      const coef = c === 1 ? '' : `<span class="eq-coef">${c}</span>`;
      return coef + formula;
    };
    const left = substances.slice(0, reactantsCount)
      .map((s, i) => tokenize(s, coefs[i]))
      .join('<span class="eq-plus">+</span>');
    const right = substances.slice(reactantsCount)
      .map((s, i) => tokenize(s, coefs[i + reactantsCount]))
      .join('<span class="eq-plus">+</span>');
    return `${left}<span class="eq-arrow" aria-hidden="true"></span>${right}`;
  }

  function plainEquation(substances, coefs, reactantsCount) {
    const tok = (s, c) => (c === 1 ? s : `${c} ${s}`);
    const left  = substances.slice(0, reactantsCount).map((s, i) => tok(s, coefs[i])).join(' + ');
    const right = substances.slice(reactantsCount).map((s, i) => tok(s, coefs[i + reactantsCount])).join(' + ');
    return `${left} → ${right}`;
  }

  function renderResults(substances, coefs, reactantsCount, masses) {
    const equationHTML = renderEquationDisplay(substances, coefs, reactantsCount);

    const renderRow = (substance, coef, kind) => {
      const mass = molarMass(substance, masses);
      const massHTML = mass != null
        ? `${mass.toFixed(4)}<span class="eq-row-mass-unit">g·mol⁻¹</span>`
        : '<span class="eq-row-mass-unit">N/A</span>';

      let elementsHTML = '';
      try {
        const atoms = parseMolecule(substance, masses);
        if (mass && mass > 0) {
          elementsHTML = Object.entries(atoms).map(([e, n]) => {
            const pct = (((masses[e] || 0) * n) / mass) * 100;
            return `
              <span class="eq-elem">
                <span class="eq-elem-sym">${e}</span>
                <span class="eq-elem-pct num">${pct.toFixed(1)}%</span>
              </span>`;
          }).join('');
        }
      } catch { /* leave empty */ }

      return `
        <div class="eq-row eq-row--${kind}">
          <div class="eq-row-coef">${coef}</div>
          <div class="eq-row-formula">${Atomify.formatFormulaHTML(substance)}</div>
          <div class="eq-row-mass num">${massHTML}</div>
          <div class="eq-row-elements">${elementsHTML}</div>
        </div>`;
    };

    const reactantRows = substances.slice(0, reactantsCount)
      .map((s, i) => renderRow(s, coefs[i], 'reactant')).join('');
    const productRows  = substances.slice(reactantsCount)
      .map((s, i) => renderRow(s, coefs[i + reactantsCount], 'product')).join('');

    return `
      <div class="eq-panel" role="region" aria-label="Ecuație echilibrată">
        <div class="eq-panel-head">
          <div>
            <span class="label-mono">Ecuație echilibrată</span>
            <div class="eq-display">${equationHTML}</div>
          </div>
          <button type="button" class="eq-copy" id="eqCopyBtn" aria-label="Copiază ecuația">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copiază
          </button>
        </div>
        <div class="eq-substances">
          ${reactantRows}
          <div class="eq-divider"><span class="eq-divider-text">Produși</span></div>
          ${productRows}
        </div>
      </div>`;
  }

  // ──────────────────────────────────────────────────────────
  //  Wire-up
  // ──────────────────────────────────────────────────────────
  const RANDOM_EQS = [
    'CH4 + O2 -> CO2 + H2O',
    'C2H6 + O2 -> CO2 + H2O',
    'C3H8 + O2 -> CO2 + H2O',
    'C8H18 + O2 -> CO2 + H2O',
    'C2H5OH + O2 -> CO2 + H2O',
    'CH3COOH + O2 -> CO2 + H2O',
    'C6H6 + O2 -> CO2 + H2O',
    'H2S + O2 -> SO2 + H2O',
    'AgNO3 + NaCl -> AgCl + NaNO3',
    'Pb(NO3)2 + KI -> PbI2 + KNO3',
    'BaCl2 + H2SO4 -> BaSO4 + HCl',
    'CaCl2 + Na2CO3 -> CaCO3 + NaCl',
    'CuSO4 + BaCl2 -> BaSO4 + CuCl2',
    'FeCl3 + NaOH -> Fe(OH)3 + NaCl',
    'AlCl3 + NaOH -> Al(OH)3 + NaCl',
    'NH4Cl + NaOH -> NH3 + H2O + NaCl',
    'K2CrO4 + BaCl2 -> BaCrO4 + KCl',
    'Fe + O2 -> Fe2O3',
    'Al + CuSO4 -> Al2(SO4)3 + Cu',
    'Ca(OH)2 + HCl -> CaCl2 + H2O',
  ];

  function init() {
    Atomify.initAuthModal();

    const els = Atomify.elements;
    const form = document.getElementById('eqForm');
    const field = document.getElementById('eqField');
    const input = document.getElementById('eqInput');
    const clearBtn = document.getElementById('eqClearBtn');
    const randomBtn = document.getElementById('eqRandomBtn');
    const result = document.getElementById('result');
    const toast = document.getElementById('eqToast');
    if (!form || !input || !result) return;

    const syncField = () => {
      field.dataset.hasValue = input.value.length > 0 ? 'true' : 'false';
    };
    input.addEventListener('input', syncField);
    syncField();

    document.querySelectorAll('.eq-example').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-equation') || '';
        syncField();
        input.focus();
        form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      syncField();
      input.focus();
      result.innerHTML = '';
    });

    randomBtn?.addEventListener('click', () => {
      input.value = RANDOM_EQS[Math.floor(Math.random() * RANDOM_EQS.length)];
      syncField();
      input.focus();
      form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!els.loaded) {
        result.innerHTML = '<div class="status status--loading">Se încarcă datele chimice…</div>';
        return;
      }
      const raw = input.value.trim();
      result.innerHTML = '';
      if (!raw) {
        result.innerHTML = '<div class="status status--error">Introdu o ecuație chimică.</div>';
        return;
      }
      result.innerHTML = '<div class="status status--loading">Se echilibrează…</div>';

      setTimeout(() => {
        try {
          const { reactants, products } = parseEquation(raw);
          // Validate each formula early
          [...reactants, ...products].forEach(s => parseMolecule(s, els.masses));

          const { A, substances, reactantsCount } = buildSystem(reactants, products, els.masses);
          const sol = solveSystem(A);
          if (!sol) throw new Error('Ecuația nu poate fi echilibrată.');

          result.innerHTML = renderResults(substances, sol, reactantsCount, els.masses);
          result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          const copyBtn = result.querySelector('#eqCopyBtn');
          copyBtn?.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(plainEquation(substances, sol, reactantsCount));
              copyBtn.classList.add('is-copied');
              if (toast) {
                toast.textContent = 'Ecuație copiată';
                Atomify.toast(toast);
              }
              setTimeout(() => copyBtn.classList.remove('is-copied'), 1600);
            } catch {
              if (toast) {
                toast.textContent = 'Nu s-a putut copia';
                Atomify.toast(toast);
              }
            }
          });
        } catch (err) {
          result.innerHTML = `<div class="status status--error">Eroare: ${err.message}</div>`;
        }
      }, 50);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await Atomify.loadElements();
    init();
  });
})();
