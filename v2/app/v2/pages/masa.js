/* ============================================================
   Atomify · v2 · masa (page logic)
   ------------------------------------------------------------
   Molar mass calculator. Uses Atomify shared helpers for element
   data, auth modal, formula formatting, and count-up animation.
   ============================================================ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  //  Parser
  // ──────────────────────────────────────────────────────────
  function parseMolecule(formula, masses) {
    let i = 0;

    function parseSegment() {
      const atoms = {};
      while (i < formula.length) {
        const c = formula[i];
        if (/[A-Z]/.test(c)) {
          let elem = c; i++;
          if (i < formula.length && /[a-z]/.test(formula[i])) { elem += formula[i]; i++; }
          if (!masses[elem]) throw new Error(`Simbol „${elem}" necunoscut. Verifică majusculele.`);
          let num = ''; while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
          const count = num ? parseInt(num, 10) : 1;
          if (!Number.isFinite(count) || count <= 0) throw new Error(`Număr invalid după ${elem}.`);
          atoms[elem] = (atoms[elem] || 0) + count;
        } else if (c === '(') {
          i++;
          const sub = parseSegment();
          if (i >= formula.length || formula[i] !== ')') throw new Error('Paranteză „(" fără pereche „)".');
          i++;
          let num = ''; while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
          const factor = num ? parseInt(num, 10) : 1;
          if (!Number.isFinite(factor) || factor <= 0) throw new Error('Număr invalid după „)".');
          for (const e in sub) atoms[e] = (atoms[e] || 0) + sub[e] * factor;
        } else if (c === ')') {
          break;
        } else {
          if (!/\s/.test(c)) throw new Error(`Caracter invalid „${c}" în formulă.`);
          i++;
        }
      }
      return atoms;
    }

    const result = parseSegment();
    const trimmed = formula.trimEnd();
    if (i < trimmed.length) throw new Error(`Procesare oprită la „${formula.substring(i)}".`);
    if (Object.keys(result).length === 0 && formula.trim().length > 0) {
      throw new Error('Nu s-au identificat elemente valide.');
    }
    return result;
  }

  function calcMassAndPercent(atomsMap, masses) {
    const details = [];
    let total = 0;
    for (const elem in atomsMap) {
      if (!masses[elem]) continue;
      const count = atomsMap[elem];
      const w = masses[elem];
      const mass = w * count;
      total += mass;
      details.push({ elem, atoms: count, atomicWeight: w, mass, massPercent: 0 });
    }
    if (total > 0) details.forEach(d => { d.massPercent = (d.mass / total) * 100; });
    details.sort((a, b) => b.mass - a.mass);
    return { totalMass: total, details };
  }

  // ──────────────────────────────────────────────────────────
  //  Render
  // ──────────────────────────────────────────────────────────
  function renderResults(rawFormula, totalMass, details, els) {
    const massExact = totalMass.toFixed(4);
    const massRounded = Math.round(totalMass);
    const formulaHTML = Atomify.formatFormulaHTML(rawFormula);

    const rows = details.map(d => {
      const pct = d.massPercent.toFixed(2);
      return `
        <tr>
          <td>
            <div class="composition-symbol">
              <span class="pt-cell">
                <span class="pt-cell-num num">${els.numbers[d.elem] || ''}</span>
                <span class="pt-cell-symbol">${d.elem}</span>
              </span>
              <span>
                <span class="composition-name">${els.names[d.elem] || d.elem}</span>
                <span class="composition-symbol-text">${d.elem}</span>
              </span>
            </div>
          </td>
          <td class="right num">${d.atoms}</td>
          <td class="right num">${d.atomicWeight.toFixed(4)}</td>
          <td class="right num">${d.mass.toFixed(4)}</td>
          <td>
            <div class="pct-cell">
              <div class="pct-bar" style="--pct:${pct}%"></div>
              <span class="num">${pct}%</span>
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="result-panel" role="region" aria-label="Rezultate calcul masă molară">
        <div class="result-head">
          <div>
            <span class="result-formula-label">Compus analizat</span>
            <div class="result-formula">${formulaHTML}</div>
          </div>
          <div class="result-mass-block">
            <div class="result-mass-label">Masa molară</div>
            <div class="result-mass" data-target="${massExact}">0.0000<span class="result-mass-unit">g·mol⁻¹</span></div>
            <div class="result-mass-rounded">≈ ${massRounded} g·mol⁻¹</div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Element</th>
                <th class="right">Atomi</th>
                <th class="right">Masă atomică · u</th>
                <th class="right">Masă · g·mol⁻¹</th>
                <th class="right">% Masă</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ──────────────────────────────────────────────────────────
  //  Wire-up
  // ──────────────────────────────────────────────────────────
  const RANDOM_FORMULAS = [
    'H2O','CO2','NaCl','KNO3','CaCO3','C2H5OH','CH3COOH','C6H12O6','NH4NO3','FeSO4',
    'Al2(SO4)3','MgCl2','Na2SO4','KAl(SO4)2','Fe2O3','TiO2','SiO2','NaHCO3','CaSO4',
    'BaSO4','SrCO3','H3PO4','H2SO4','HNO3','HCl','HF','HBr','HI','CH3NH2','C6H5OH',
    'C6H5COOH','C6H4Cl2','C7H5N3O6','C3H6O','C4H10','C4H8','C2H4Cl2','C2H3ClO',
    'C3H7Cl','C3H7OH','C3H6Cl2','C9H8O4','C8H10N4O2','C10H14N2','C17H19NO3','C21H30O2',
    'Na2HPO4','K2Cr2O7','KMnO4','K3Fe(CN)6','CoCl2','ZnSO4','Cu(NO3)2','AgNO3','PbSO4',
    'HgCl2','SnCl2','NiCl2','LiAlH4','NaBH4','BF3','PCl5','SOCl2','N2O','SF6'
  ];

  function init() {
    Atomify.initAuthModal();

    const els = Atomify.elements;
    const form = document.getElementById('masaForm');
    const field = document.getElementById('formulaField');
    const input = document.getElementById('formulaInput');
    const clearBtn = document.getElementById('clearMasaBtn');
    const randomBtn = document.getElementById('randomBtn');
    const result = document.getElementById('result');
    if (!form || !input || !result) return;

    const syncField = () => {
      field.dataset.hasValue = input.value.length > 0 ? 'true' : 'false';
    };
    input.addEventListener('input', syncField);
    syncField();

    document.querySelectorAll('.specimen').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-formula') || '';
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
      input.value = RANDOM_FORMULAS[Math.floor(Math.random() * RANDOM_FORMULAS.length)];
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
      const cleaned = raw.replace(/\s+/g, '');
      result.innerHTML = '';
      if (!cleaned) {
        result.innerHTML = '<div class="status status--error">Introdu o formulă chimică.</div>';
        return;
      }
      if (/[^A-Za-z0-9()]/.test(cleaned)) {
        result.innerHTML = '<div class="status status--error">Formula conține caractere nepermise.</div>';
        return;
      }
      if (!/^[A-Z\(]/.test(cleaned)) {
        result.innerHTML = '<div class="status status--error">Formula trebuie să înceapă cu o literă mare sau cu „(".</div>';
        return;
      }

      result.innerHTML = '<div class="status status--loading">Se calculează…</div>';

      setTimeout(() => {
        try {
          const atoms = parseMolecule(cleaned, els.masses);
          if (Object.keys(atoms).length === 0) throw new Error('Formula nu conține elemente valide.');
          const { totalMass, details } = calcMassAndPercent(atoms, els.masses);
          if (!Number.isFinite(totalMass) || totalMass < 0 || details.length === 0) {
            throw new Error('Calcul eșuat. Verifică formula.');
          }
          result.innerHTML = renderResults(raw, totalMass, details, els);
          const massEl = result.querySelector('.result-mass');
          if (massEl) {
            Atomify.countUp(massEl, totalMass, {
              format: (v) => v.toFixed(4),
              suffixHTML: '<span class="result-mass-unit">g·mol⁻¹</span>',
            });
          }
          result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
