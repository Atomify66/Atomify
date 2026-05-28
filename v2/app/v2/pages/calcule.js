/* ============================================================
   Atomify · v2 · calcule (page logic)
   ------------------------------------------------------------
   Six interactive calculators for crystal-growth physics.
   Math is rendered with MathJax (loaded from CDN in the HTML).

   Two design touches beyond v1 physics:
   1. Live "as you type" preview chip under each input — turns
      `1e29` into `1 × 10²⁹` instantly via HTML (no MathJax cost
      per keystroke). Only appears when the input is in
      scientific-notation form.
   2. Each output shows three labelled steps:
        FORMULĂ → VALORI SUBSTITUITE → REZULTAT
      so students see the work, not just the answer.
   ============================================================ */

(function () {
  'use strict';

  // ─── Physical constants ────────────────────────────────────
  const kB   = 1.380649e-23;  // Boltzmann (J/K)
  const Rgas = 8.314;         // universal gas constant (J/(mol·K))

  // ─── Formatting helpers ────────────────────────────────────
  // Format a JS number as LaTeX scientific notation (3 sig figs default).
  function formatLatexSci(num, sigFigs = 3) {
    if (Number.isNaN(num)) return '\\text{NaN}';
    if (!Number.isFinite(num)) return num > 0 ? '\\infty' : '-\\infty';
    if (num === 0) return '0';
    const expStr = num.toExponential(sigFigs - 1);
    const [mantissaStr, exponentStr] = expStr.split('e');
    const exponent = parseInt(exponentStr, 10);
    const mantissa = parseFloat(mantissaStr);
    if (exponent === 0) return mantissa.toPrecision(sigFigs);
    return `${mantissa.toPrecision(sigFigs)} \\times 10^{${exponent}}`;
  }

  // Read a JS number back into LaTeX, using sci notation only when needed.
  function lat(num, sigFigs = 3) {
    if (!Number.isFinite(num)) return formatLatexSci(num, sigFigs);
    const abs = Math.abs(num);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return formatLatexSci(num, sigFigs);
    if (Number.isInteger(num)) return String(num);
    return num.toPrecision(sigFigs).replace(/\.?0+$/, '');
  }

  // Format the user's raw input string into a small HTML preview.
  // Only renders when the value is in scientific-notation form,
  // so plain numbers like 0.05 or 298 don't get a redundant chip.
  function formatInputPreview(raw) {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';
    const m = /^([-+]?(?:\d+\.?\d*|\.\d+))[eE]([-+]?\d+)$/.exec(s);
    if (!m) return '';
    const mantissa = m[1];
    const exp = parseInt(m[2], 10);
    if (parseFloat(mantissa) === 0) return '0';
    const sign = exp < 0 ? '−' : '';
    return `<span class="preview-mantissa">${mantissa}</span>` +
           `<span class="preview-mult">×</span>` +
           `<span class="preview-base">10</span>` +
           `<sup>${sign}${Math.abs(exp)}</sup>`;
  }

  // Build one labelled step in the output (FORMULĂ / VALORI / REZULTAT).
  function step(label, latex, modifier) {
    const cls = modifier ? `calc-step calc-step--${modifier}` : 'calc-step';
    return `
      <div class="${cls}">
        <span class="calc-step-label">${label}</span>
        $$ ${latex} $$
      </div>`;
  }

  function setOutput(id, stepsHTML, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('calc-output--error', !!isError);
    const eyebrow = isError ? 'Eroare' : 'Rezultat';
    const eyebrowClass = isError
      ? 'calc-result-eyebrow calc-result-eyebrow--error'
      : 'calc-result-eyebrow';
    el.innerHTML = `
      <div class="calc-result-head">
        <span class="${eyebrowClass}">${eyebrow}</span>
      </div>
      ${stepsHTML}
    `;
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]).catch(err => {
        console.error('[calcule] MathJax typeset error:', err);
        el.textContent = `Eroare la randarea formulei. (${err.message})`;
      });
    } else {
      // MathJax not loaded yet — retry briefly
      setTimeout(() => {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
          MathJax.typesetPromise([el]).catch(() => {});
        }
      }, 300);
    }
  }

  function errOut(id, message) {
    setOutput(id, `<div class="calc-step"><span class="calc-step-label">Verifică intrările</span>$$ \\textit{${message}} $$</div>`, true);
  }

  function num(id)    { return parseFloat(document.getElementById(id).value); }
  function rawVal(id) { return document.getElementById(id).value; }

  // ─── 1 · Nucleation ────────────────────────────────────────
  function calcNucleation() {
    const sigma = num('nuc_sigma'), T = num('nuc_T'),
          S = num('nuc_S'), Vm = num('nuc_Vm'), A = num('nuc_A');

    if (Number.isNaN(sigma) || Number.isNaN(T) || T <= 0 ||
        Number.isNaN(S) || S <= 0 || Number.isNaN(Vm) || Vm <= 0 ||
        Number.isNaN(A)) {
      errOut('nuc_result', 'T,\\, S,\\, V_m > 0 sunt obligatorii.');
      return;
    }

    const lnS = Math.log(S);
    const dGv = (Rgas * T / Vm) * lnS;
    let rc = Infinity, dG_star = Infinity, J = 0;

    if (dGv > 0) {
      rc = 2 * sigma / dGv;
      dG_star = (16 * Math.PI * Math.pow(sigma, 3)) / (3 * Math.pow(dGv, 2));
      const e = -dG_star / (kB * T);
      if (e < -700)      J = 0;
      else if (e > 700)  J = Infinity;
      else               J = A * Math.exp(e);
    }

    const formula =
      `J = A\\,\\exp\\!\\left(-\\dfrac{\\Delta G^*}{k_B T}\\right), \\quad ` +
      `\\Delta G^* = \\dfrac{16\\pi\\,\\sigma^3}{3(\\Delta G_v)^2}, \\quad ` +
      `\\Delta G_v = \\dfrac{RT}{V_m}\\ln S`;

    const sub =
      `\\Delta G_v = \\dfrac{${Rgas}\\,(${T})}{${lat(Vm)}}\\ln(${S}) ` +
      `= ${formatLatexSci(dGv)}\\,\\text{J/m}^3`;

    let resultLatex;
    if (S <= 1) {
      resultLatex =
        `J = 0 \\quad (\\text{nu există supersaturație},\\ S \\le 1)\\\\[4pt] ` +
        `\\Delta G^* = \\infty, \\quad r_c = \\infty`;
    } else {
      resultLatex =
        `J \\approx ${formatLatexSci(J)}\\ \\text{m}^{-3}\\,\\text{s}^{-1}\\\\[4pt] ` +
        `\\Delta G^* \\approx ${formatLatexSci(dG_star)}\\ \\text{J}\\\\[4pt] ` +
        `r_c \\approx ${formatLatexSci(rc)}\\ \\text{m}`;
    }

    setOutput('nuc_result',
      step('Formulă', formula) +
      step('Valori substituite', sub) +
      step('Rezultat', resultLatex, 'final'));
  }

  // ─── 2 · Growth: diffusion vs surface integration ─────────
  function calcGrowth() {
    const S  = num('grow_S'), kd = num('grow_kd'), kr = num('grow_kr');
    if (Number.isNaN(S) || S < 1 || Number.isNaN(kd) || Number.isNaN(kr)) {
      errOut('grow_result', 'S \\ge 1 \\text{ pentru creștere.}');
      return;
    }
    const drive = S - 1;
    const Gd = kd * drive, Gs = kr * drive;

    setOutput('grow_result',
      step('Formulă',
        `G_{\\text{diff}} = k_d\\,(S - 1), \\quad G_{\\text{surf}} = k_r\\,(S - 1)`) +
      step('Valori substituite',
        `G_{\\text{diff}} = (${lat(kd)})\\,(${S} - 1) = ${formatLatexSci(Gd)}\\\\[4pt] ` +
        `G_{\\text{surf}} = (${lat(kr)})\\,(${S} - 1) = ${formatLatexSci(Gs)}`) +
      step('Rezultat',
        `G_{\\text{diff}} \\approx ${formatLatexSci(Gd)}\\ \\text{m}\\,\\text{s}^{-1}\\\\[4pt] ` +
        `G_{\\text{surf}} \\approx ${formatLatexSci(Gs)}\\ \\text{m}\\,\\text{s}^{-1}`,
        'final'));
  }

  // ─── 3 · Avrami (JMAK) ────────────────────────────────────
  function calcAvrami() {
    const n = num('av_n'), K = num('av_K'), t = num('av_t');
    if (Number.isNaN(n) || Number.isNaN(K) || K < 0 ||
        Number.isNaN(t) || t < 0) {
      errOut('av_result', 'K \\ge 0,\\ t \\ge 0 \\text{ sunt obligatorii.}');
      return;
    }
    const exponent = -K * Math.pow(t, n);
    let Y;
    if (exponent < -700) Y = 1.0;
    else if (exponent > 0 && K > 0) Y = NaN;
    else Y = 1 - Math.exp(exponent);

    if (Number.isNaN(Y)) {
      errOut('av_result', 'Y \\text{ nedefinit — verifică } K \\ge 0.');
      return;
    }

    const Ypc = (Y * 100).toFixed(2);

    const formula = `Y(t) = 1 - \\exp\\!\\big[-K\\,t^{n}\\big]`;
    const sub =
      `Y(${t}) = 1 - \\exp\\!\\big[-(${lat(K)})\\,(${t})^{${n}}\\big] ` +
      `= 1 - \\exp(${formatLatexSci(exponent)})`;
    let resultLatex =
      `Y(${t}\\,\\text{s}) \\approx ${Y.toFixed(4)} \\quad (${Ypc}\\%)`;

    // Optional crystal-size estimation
    const C0 = num('av_C0'), Ceq = num('av_Ceq'),
          V  = num('av_V'),  N   = num('av_N'),
          rho = num('av_rho');
    const anyOptional = ['av_C0','av_Ceq','av_V','av_N','av_rho']
      .some(id => rawVal(id) !== '');

    let extraSteps = '';
    if (!Number.isNaN(C0) && !Number.isNaN(Ceq) && C0 >= Ceq &&
        !Number.isNaN(V) && V > 0 &&
        !Number.isNaN(N) && N > 0 &&
        !Number.isNaN(rho) && rho > 0) {
      const massCrystal = (C0 - Ceq) * V * Y;
      if (massCrystal > 0) {
        const volPerCrystal = (massCrystal / rho) / N;
        const d = 2 * Math.cbrt((3 * volPerCrystal) / (4 * Math.PI));
        resultLatex += `\\\\[6pt] d \\approx ${formatLatexSci(d)}\\ \\text{m}`;
        extraSteps =
          step('Dimensiune medie',
            `m_{\\text{cr}} = (C_0 - C^*)\\,V\\,Y = ${formatLatexSci(massCrystal)}\\ \\text{kg}\\\\[4pt] ` +
            `d = 2\\sqrt[3]{\\dfrac{3\\,m_{\\text{cr}}}{4\\pi\\,\\rho_s\\,N}} = ${formatLatexSci(d)}\\ \\text{m}`);
      }
    } else if (anyOptional) {
      extraSteps = step('Dimensiune medie',
        `\\textit{Completează } C_0 \\ge C^*,\\ V > 0,\\ N > 0,\\ \\rho_s > 0.`);
    }

    setOutput('av_result',
      step('Formulă', formula) +
      step('Valori substituite', sub) +
      extraSteps +
      step('Rezultat', resultLatex, 'final'));
  }

  // ─── 4 · Supersaturation ──────────────────────────────────
  function calcSupersat() {
    const C   = num('sup_C');
    const Ceq = num('sup_Ceq');
    if (Number.isNaN(C) || Number.isNaN(Ceq) || Ceq <= 0) {
      errOut('sup_result', 'C \\text{ și } C^* > 0 \\text{ sunt obligatorii.}');
      return;
    }
    const S = C / Ceq;
    setOutput('sup_result',
      step('Formulă', `S = \\dfrac{C}{C^{*}}`) +
      step('Valori substituite', `S = \\dfrac{${C}}{${Ceq}}`) +
      step('Rezultat', `S \\approx ${S.toFixed(4)}`, 'final'));
  }

  // ─── 5 · van't Hoff ───────────────────────────────────────
  function calcVantHoff() {
    const T1 = num('vant_T1'), C1 = num('vant_C1');
    const T2 = num('vant_T2'), dH = num('vant_dH');
    if (Number.isNaN(T1) || T1 <= 0 || Number.isNaN(C1) || C1 <= 0 ||
        Number.isNaN(T2) || T2 <= 0 || Number.isNaN(dH)) {
      errOut('vant_result', 'T_1, C_1, T_2 > 0 \\text{ sunt obligatorii.}');
      return;
    }

    const formula =
      `\\ln\\dfrac{C_2}{C_1} = -\\dfrac{\\Delta H_{\\text{sol}}}{R}\\!\\left(\\dfrac{1}{T_2} - \\dfrac{1}{T_1}\\right)`;

    if (T1 === T2) {
      setOutput('vant_result',
        step('Formulă', formula) +
        step('Observație', `T_1 = T_2 \\Rightarrow C_2 = C_1`) +
        step('Rezultat', `C_2 = ${formatLatexSci(C1, 4)}`, 'final'));
      return;
    }

    const e = -(dH / Rgas) * (1 / T2 - 1 / T1);
    let C2;
    if (e > 700) C2 = Infinity;
    else if (e < -700) C2 = 0;
    else C2 = C1 * Math.exp(e);

    setOutput('vant_result',
      step('Formulă', formula) +
      step('Valori substituite',
        `\\ln\\dfrac{C_2}{${lat(C1, 4)}} = -\\dfrac{${lat(dH)}}{${Rgas}}\\!\\left(\\dfrac{1}{${T2}} - \\dfrac{1}{${T1}}\\right) ` +
        `= ${formatLatexSci(e, 4)}\\\\[4pt] ` +
        `C_2 = ${lat(C1, 4)}\\,e^{${formatLatexSci(e, 3)}}`) +
      step('Rezultat', `C_2 \\approx ${formatLatexSci(C2, 4)}\\ \\text{(unități de }C_1\\text{)}`, 'final'));
  }

  // ─── 6 · Dimensionless: Re, Pe, Ri ────────────────────────
  function calcDimensionless() {
    const rho1 = num('dim_rho1');
    let   rho2 = num('dim_rho2');
    const v    = num('dim_v');
    const L    = num('dim_L');
    const mu   = num('dim_mu');
    const D    = num('dim_D');
    let   g    = num('dim_g');

    if (Number.isNaN(rho1) || rho1 <= 0 || Number.isNaN(v) ||
        Number.isNaN(L) || L <= 0 || Number.isNaN(mu) || mu <= 0 ||
        Number.isNaN(D) || D <= 0) {
      errOut('dim_result', '\\rho_1, L, \\mu, D > 0 \\text{ sunt obligatorii.}');
      return;
    }
    if (Number.isNaN(rho2)) rho2 = rho1;
    if (Number.isNaN(g)) g = 9.81;

    const Re = (rho1 * v * L) / mu;
    const Pe = (v * L) / D;
    const dRho = Math.abs(rho1 - rho2);
    let Ri;
    if (v !== 0) Ri = (g * (dRho / rho1) * L) / (v * v);
    else Ri = (dRho > 0 && g > 0) ? Infinity : 0;

    setOutput('dim_result',
      step('Formulă',
        `\\text{Re} = \\dfrac{\\rho v L}{\\mu}, \\quad ` +
        `\\text{Pe} = \\dfrac{v L}{D}, \\quad ` +
        `\\text{Ri} = \\dfrac{g\\,(\\Delta\\rho/\\rho)\\,L}{v^2}`) +
      step('Valori substituite',
        `\\text{Re} = \\dfrac{(${lat(rho1)})\\,(${lat(v)})\\,(${lat(L)})}{${lat(mu)}}\\\\[4pt] ` +
        `\\text{Pe} = \\dfrac{(${lat(v)})\\,(${lat(L)})}{${lat(D)}}\\\\[4pt] ` +
        `\\text{Ri} = \\dfrac{(${lat(g)})\\,(${lat(dRho)}/${lat(rho1)})\\,(${lat(L)})}{(${lat(v)})^{2}}`) +
      step('Rezultat',
        `\\text{Re} \\approx ${formatLatexSci(Re, 2)}\\\\[4pt] ` +
        `\\text{Pe} \\approx ${formatLatexSci(Pe, 2)}\\\\[4pt] ` +
        `\\text{Ri} \\approx ${formatLatexSci(Ri, 2)}`,
        'final'));
  }

  // ─── Wire-up ───────────────────────────────────────────────
  const handlers = {
    nuc_btn:  calcNucleation,
    grow_btn: calcGrowth,
    av_btn:   calcAvrami,
    sup_btn:  calcSupersat,
    vant_btn: calcVantHoff,
    dim_btn:  calcDimensionless,
  };

  function attachInputPreviews() {
    document.querySelectorAll('.calc-input').forEach(input => {
      const preview = document.createElement('span');
      preview.className = 'calc-input-preview';
      preview.setAttribute('aria-hidden', 'true');
      input.insertAdjacentElement('afterend', preview);
      const update = () => { preview.innerHTML = formatInputPreview(input.value); };
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      update();
    });
  }

  function init() {
    Atomify.initAuthModal();

    Object.entries(handlers).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', fn);
    });

    // Submit-on-Enter inside any input within a panel triggers that panel's CTA
    document.querySelectorAll('.calc-panel').forEach(panel => {
      const cta = panel.querySelector('.calc-cta');
      if (!cta) return;
      panel.querySelectorAll('.calc-input').forEach(input => {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            cta.click();
          }
        });
      });
    });

    // Smooth-scroll for the TOC pills
    document.querySelectorAll('.calc-toc a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    attachInputPreviews();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
