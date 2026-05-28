/* ============================================================
   Atomify · v2 · bio (page logic)
   ------------------------------------------------------------
   DNA ↔ RNA conversion. Pure client-side: validation, six
   sequence derivations, nucleotide composition, copy-all.
   ============================================================ */

(function () {
  'use strict';

  // ─── Pairing tables ────────────────────────────────────────
  const DNA_COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const DNA_TO_RNA     = { A: 'U', T: 'A', G: 'C', C: 'G' };

  const EXAMPLES = [
    { name: 'Start codon',  seq: 'ATGGCTAGCTAA' },
    { name: 'TATA box',     seq: 'TATAAATATA' },
    { name: 'Repetitiv GC', seq: 'GCGCGCATATAT' },
    { name: 'Promotor scurt', seq: 'TTGACAATTAATCATCGGCTCG' },
    { name: 'Codon poliprotein', seq: 'ATGAAATTTCCCGGG' },
    { name: 'Palindrom',    seq: 'GAATTC' },
  ];

  // ─── Conversion helpers ────────────────────────────────────
  function cleanInput(raw) {
    return raw.replace(/\s+/g, '').toUpperCase();
  }
  function validate(seq) {
    return /^[ATGC]+$/.test(seq);
  }
  function complement(seq) {
    return seq.split('').map(n => DNA_COMPLEMENT[n] || n).join('');
  }
  function transcribe(seq) {
    return seq.split('').map(n => DNA_TO_RNA[n] || n).join('');
  }
  function reverse(seq) {
    return seq.split('').reverse().join('');
  }
  function composition(seq) {
    const c = { A: 0, T: 0, G: 0, C: 0 };
    for (const n of seq) if (c[n] != null) c[n]++;
    return c;
  }

  // ─── Render helpers ────────────────────────────────────────
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }
  function colorize(seq) {
    return seq.split('').map(n => {
      const cls = ({ A: 'nt nt-a', T: 'nt nt-t', U: 'nt nt-u', G: 'nt nt-g', C: 'nt nt-c' })[n];
      return cls ? `<span class="${cls}">${n}</span>` : escapeHTML(n);
    }).join('');
  }

  function $(id) { return document.getElementById(id); }
  function setResult(html) { $('result').innerHTML = html; }
  function statusError(msg) { setResult(`<div class="status status--error">${escapeHTML(msg)}</div>`); }

  function renderRow(eyebrow, name, seq, alt) {
    return `
      <div class="bio-seq-row${alt ? ' bio-seq-row--alt' : ''}">
        <div class="bio-seq-label">
          <span class="bio-seq-label-eyebrow">${eyebrow}</span>
          <span class="bio-seq-label-name">${name}</span>
        </div>
        <div class="bio-seq">${colorize(seq)}</div>
      </div>
    `;
  }

  function renderComposition(comp, total) {
    const items = [
      { key: 'A', label: 'Adenină' },
      { key: 'T', label: 'Timină' },
      { key: 'G', label: 'Guanină' },
      { key: 'C', label: 'Citozină' },
    ];
    return `
      <div class="bio-composition">
        ${items.map(it => {
          const n = comp[it.key] || 0;
          const pct = total > 0 ? (n / total) * 100 : 0;
          return `
            <div class="bio-comp-cell nt-${it.key.toLowerCase()}">
              <div class="bio-comp-head">
                <span class="bio-comp-letter nt-${it.key.toLowerCase()}">${it.key}</span>
                <span class="bio-comp-pct num">${pct.toFixed(1)}%</span>
              </div>
              <div class="bio-comp-count num">${n}</div>
              <div class="bio-comp-bar" style="--pct: ${pct.toFixed(2)}%"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderPanel(dna) {
    const compDNA = complement(dna);
    const mRNA    = transcribe(dna);
    const compRNA = transcribe(compDNA);
    const rev     = reverse(dna);
    const revComp = complement(rev);
    const comp    = composition(dna);

    const html = `
      <div class="bio-panel" role="region" aria-label="Rezultate biologie">
        <div class="bio-panel-head">
          <div>
            <span class="label-mono">Secvență ADN</span>
            <div class="bio-panel-title">Conversie completă</div>
          </div>
          <div class="bio-panel-meta">
            <span class="label-mono">Lungime</span>
            <div>
              <span class="num">${dna.length}</span>
              <span class="bio-panel-meta-unit">nucleotide</span>
            </div>
          </div>
        </div>

        <div class="bio-panel-toolbar">
          <span class="bio-toolbar-meta">A · T · G · C — 4 baze · ${dna.length} poziții</span>
          <button type="button" id="bioCopyBtn" class="bio-copy-btn" aria-label="Copiază toate rezultatele">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copiază tot
          </button>
        </div>

        <div class="bio-sequences">
          ${renderRow('ADN · I', 'Original', dna, false)}
          ${renderRow('ADN · II', 'Complementar', compDNA, true)}

          <div class="bio-seq-divider"><span class="bio-seq-divider-text">Transcripție</span></div>

          ${renderRow('ARN · I', 'Mesager (mRNA)', mRNA, false)}
          ${renderRow('ARN · II', 'Complementar', compRNA, true)}

          <div class="bio-seq-divider"><span class="bio-seq-divider-text">Derivate</span></div>

          ${renderRow('5′ ← 3′', 'Inversă', rev, false)}
          ${renderRow('5′ ← 3′ · c', 'Inversă complementară', revComp, true)}
        </div>

        ${renderComposition(comp, dna.length)}
      </div>
    `;
    setResult(html);

    document.getElementById('bioCopyBtn').addEventListener('click', () => {
      const lines = [
        `ADN Original:               ${dna}`,
        `ADN Complementar:           ${compDNA}`,
        `ARN Mesager (mRNA):         ${mRNA}`,
        `ARN Complementar:           ${compRNA}`,
        `Inversă:                    ${rev}`,
        `Inversă complementară:      ${revComp}`,
        `Compoziție: A:${comp.A} T:${comp.T} G:${comp.G} C:${comp.C}`,
        `Lungime: ${dna.length} nucleotide`,
      ].join('\n');
      copyAll(lines);
    });

    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function copyAll(text) {
    const btn = document.getElementById('bioCopyBtn');
    const toast = document.getElementById('bioToast');
    try {
      await navigator.clipboard.writeText(text);
      btn?.classList.add('is-copied');
      if (toast) { toast.textContent = 'Rezultate copiate'; Atomify.toast(toast); }
      setTimeout(() => btn?.classList.remove('is-copied'), 1600);
    } catch {
      if (toast) { toast.textContent = 'Nu s-a putut copia'; Atomify.toast(toast); }
    }
  }

  // ─── Examples grid (rendered into chapter 02) ─────────────
  function renderExamples() {
    const container = document.getElementById('bioExamples');
    if (!container) return;
    container.innerHTML = EXAMPLES.map((ex, idx) => `
      <button type="button" class="bio-example" data-seq="${ex.seq}">
        <span class="bio-example-num">${String(idx + 1).padStart(2, '0')} · ${escapeHTML(ex.name)}</span>
        <span class="bio-example-seq">${colorize(ex.seq)}</span>
        <span class="bio-example-name">${ex.seq.length} nucleotide</span>
      </button>
    `).join('');
  }

  // ─── Wire-up ───────────────────────────────────────────────
  function init() {
    Atomify.initAuthModal();
    renderExamples();

    const form     = $('bioForm');
    const field    = $('dnaField');
    const input    = $('dnaInput');
    const clearBtn = $('bioClearBtn');
    const randomBtn = $('bioRandomBtn');
    if (!form || !input) return;

    const syncField = () => {
      field.dataset.hasValue = input.value.length > 0 ? 'true' : 'false';
    };
    input.addEventListener('input', syncField);
    syncField();

    document.querySelectorAll('.bio-example').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-seq') || '';
        syncField();
        input.focus();
        form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
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
      input.value = pick.seq;
      syncField();
      input.focus();
      form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    // Ctrl/Cmd+Enter from inside the textarea submits
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) {
        statusError('Introdu o secvență ADN.');
        return;
      }
      // Quick alphabet check on the raw input before cleaning
      if (!/^[ATGCatgc\s]+$/.test(raw)) {
        statusError('Secvența conține caractere invalide. Folosește doar A, T, G, C.');
        return;
      }
      const dna = cleanInput(raw);
      if (!validate(dna)) {
        statusError('Secvența conține caractere invalide. Folosește doar A, T, G, C.');
        return;
      }
      renderPanel(dna);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
