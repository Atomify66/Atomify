/* ============================================================
   Atomify · v2 · profile (page logic)
   ------------------------------------------------------------
   Personal profile. Pulls /api/profile and renders:
     · Identity hero (avatar + username + role/country pills)
     · Quick-stat overview (count-up animated)
     · Overall badge progress (gold bar)
     · Statistics grid (6 metrics)
     · Categorized achievement stamps with filter tabs
     · Account info (definition list)
   Backend contract:
     · GET /user           — auth check
     · GET /api/profile    — { user, stats, badges (grouped) }
   ============================================================ */

(function () {
  'use strict';

  const state = {
    currentUser: null,
    profile: null,        // { user, stats, badges }
    currentFilter: 'all', // 'all' | 'earned' | 'locked' | <category>
  };

  // ─── Romanian category labels ──────────────────────────────
  const CAT_LABEL = {
    isomer_generation: 'Generare izomeri',
    quiz_performance:  'Performanță chestionare',
    perfect_scores:    'Scoruri perfecte',
    time_based:        'Sesiuni',
    streaks:           'Serii consecutive',
    special:           'Realizări speciale',
    milestones:        'Repere',
  };
  const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const RARITY_LABEL = {
    common: 'Comune', uncommon: 'Necomune', rare: 'Rare', epic: 'Epice', legendary: 'Legendare',
  };

  // ─── Custom SVG icons — all 31 badges ────────────────────
  // Each icon uses design-system tokens (currentColor + var(--gold/amber/
  // cobalt/green*)). Elements with data-accent="1" get dimmed in the
  // locked state on top of the global 0.55 SVG opacity.
  const CUSTOM_ICONS = {
    // ── isomer_generation ────────────────────────────────────
    'First Steps': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="28,9 45,18.5 45,37.5 28,47 11,37.5 11,18.5"
                 fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" opacity="0.72"/>
        <circle cx="45" cy="18.5" r="2"   fill="currentColor" opacity="0.4"/>
        <circle cx="45" cy="37.5" r="2"   fill="currentColor" opacity="0.4"/>
        <circle cx="28" cy="47"   r="2"   fill="currentColor" opacity="0.4"/>
        <circle cx="11" cy="37.5" r="2"   fill="currentColor" opacity="0.4"/>
        <circle cx="11" cy="18.5" r="2"   fill="currentColor" opacity="0.4"/>
        <circle cx="28" cy="9"    r="3.8" fill="var(--gold)" data-accent="1"/>
        <circle cx="28" cy="9"    r="1.4" fill="var(--paper)" data-accent="1"/>
        <text x="28" y="33.5" text-anchor="middle"
              font-family="Fraunces, serif" font-style="italic" font-weight="500"
              font-size="13" fill="currentColor">C</text>
      </svg>`,
    'Molecule Explorer': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <line x1="28" y1="28" x2="28" y2="11" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
        <line x1="28" y1="28" x2="44" y2="38" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
        <line x1="28" y1="28" x2="12" y2="38" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
        <line x1="28" y1="28" x2="28" y2="46" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
        <circle cx="28" cy="9"  r="4"   fill="var(--green-deep)" data-accent="1"/>
        <circle cx="44" cy="40" r="3.4" fill="currentColor" opacity="0.7"/>
        <circle cx="12" cy="40" r="3.4" fill="currentColor" opacity="0.7"/>
        <circle cx="28" cy="48" r="3.4" fill="currentColor" opacity="0.7"/>
        <circle cx="28" cy="28" r="5.6" fill="var(--paper)" stroke="currentColor" stroke-width="1.4"/>
        <text x="28" y="32" text-anchor="middle"
              font-family="Fraunces, serif" font-style="italic" font-weight="500"
              font-size="9" fill="currentColor">C</text>
      </svg>`,
    'Isomer Specialist': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M22 9 L22 22 L13 44 Q13 48 18 48 L38 48 Q43 48 43 44 L34 22 L34 9 Z"
              fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M16.4 36 L39.6 36 L42 43 Q42 47 38 47 L18 47 Q14 47 14 43 Z"
              fill="var(--green-deep)" data-accent="1" opacity="0.7"/>
        <line x1="20" y1="9" x2="36" y2="9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="22" cy="41"   r="1.4" fill="var(--paper)" opacity="0.9"/>
        <circle cx="30" cy="38.5" r="1.8" fill="var(--paper)" opacity="0.9"/>
        <circle cx="35" cy="42"   r="1.2" fill="var(--paper)" opacity="0.9"/>
      </svg>`,
    'Molecular Architect': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="28,38 42,32 42,42 28,48 14,42 14,32"
                 fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity="0.55"/>
        <polygon points="28,22 38,17 38,29 28,34 18,29 18,17"
                 fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity="0.78"/>
        <polygon points="28,6 34,9 34,17 28,20 22,17 22,9"
                 fill="var(--cobalt)" stroke="var(--cobalt)" stroke-width="1.2" data-accent="1"/>
        <polygon points="28,8 32,10.5 32,16 28,18.5 24,16 24,10.5"
                 fill="var(--paper)" opacity="0.25"/>
        <line x1="28" y1="20" x2="28" y2="22" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
        <line x1="28" y1="34" x2="28" y2="38" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
      </svg>`,
    'Isomer Master': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M10 36 L46 36 L42 18 L34 26 L28 14 L22 26 L14 18 Z"
              fill="var(--amber)" stroke="var(--amber)" stroke-width="1.2" stroke-linejoin="round" data-accent="1"/>
        <rect x="10" y="36" width="36" height="6" rx="1.2" fill="var(--amber)" data-accent="1"/>
        <line x1="14" y1="39" x2="42" y2="39" stroke="var(--paper)" stroke-width="0.8" opacity="0.55"/>
        <circle cx="14" cy="18" r="1.6" fill="var(--gold)" data-accent="1"/>
        <circle cx="42" cy="18" r="1.6" fill="var(--gold)" data-accent="1"/>
        <circle cx="28" cy="14" r="2.4" fill="var(--gold-bright)" data-accent="1"/>
        <circle cx="28" cy="14" r="0.9" fill="var(--paper)" opacity="0.8"/>
      </svg>`,
    'Molecular Genius': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <g transform="translate(28 28)">
          <ellipse rx="22" ry="9" fill="none" stroke="var(--gold)" stroke-width="1.4" data-accent="1"/>
          <ellipse rx="22" ry="9" fill="none" stroke="var(--gold)" stroke-width="1.4" opacity="0.7"
                   data-accent="1" transform="rotate(60)"/>
          <ellipse rx="22" ry="9" fill="none" stroke="var(--gold)" stroke-width="1.4" opacity="0.55"
                   data-accent="1" transform="rotate(120)"/>
        </g>
        <circle cx="28" cy="28" r="5.4" fill="var(--gold-bright)" data-accent="1"/>
        <circle cx="28" cy="28" r="2"   fill="var(--paper)" opacity="0.85"/>
        <circle cx="50" cy="28"   r="2" fill="currentColor"/>
        <circle cx="17" cy="9.5"  r="2" fill="currentColor"/>
        <circle cx="17" cy="46.5" r="2" fill="currentColor"/>
      </svg>`,

    // ── quiz_performance ─────────────────────────────────────
    'Quiz Rookie': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect x="12" y="8" width="28" height="40" rx="2.2"
              fill="none" stroke="currentColor" stroke-width="1.6"/>
        <line x1="17" y1="18" x2="34" y2="18" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <line x1="17" y1="24" x2="34" y2="24" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <line x1="17" y1="30" x2="28" y2="30" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <line x1="34" y1="48" x2="48" y2="34" stroke="var(--amber)" stroke-width="3.2"
              stroke-linecap="round" data-accent="1"/>
        <polygon points="32,50 38,44 35,48" fill="currentColor"/>
        <line x1="46" y1="34" x2="50" y2="38" stroke="var(--gold)" stroke-width="2"
              stroke-linecap="round" data-accent="1"/>
      </svg>`,
    'Knowledge Seeker': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect x="10" y="14" width="36" height="9" rx="1.4"
              fill="none" stroke="currentColor" stroke-width="1.4"/>
        <line x1="14" y1="14" x2="14" y2="23" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <rect x="7" y="25" width="42" height="9" rx="1.4"
              fill="var(--cobalt-tint)" stroke="var(--cobalt)" stroke-width="1.4" data-accent="1"/>
        <line x1="11" y1="25" x2="11" y2="34" stroke="var(--cobalt)" stroke-width="1.2" data-accent="1"/>
        <rect x="12" y="36" width="32" height="9" rx="1.4"
              fill="none" stroke="currentColor" stroke-width="1.4"/>
        <line x1="16" y1="36" x2="16" y2="45" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
      </svg>`,
    'Quiz Enthusiast': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect x="11" y="9" width="34" height="38" rx="3"
              fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="17" cy="18" r="2.8" fill="var(--green-deep)" data-accent="1"/>
        <polyline points="15.4,18 16.7,19.4 18.8,16.7" fill="none" stroke="var(--paper)"
                  stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="23" y1="18" x2="40" y2="18" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <circle cx="17" cy="28" r="2.8" fill="var(--green-deep)" data-accent="1"/>
        <polyline points="15.4,28 16.7,29.4 18.8,26.7" fill="none" stroke="var(--paper)"
                  stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="23" y1="28" x2="40" y2="28" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        <circle cx="17" cy="38" r="2.8" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
        <line x1="23" y1="38" x2="40" y2="38" stroke="currentColor" stroke-width="1.2" opacity="0.3"/>
      </svg>`,
    'Quiz Champion': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M18 9 L38 9 L38 22 Q38 32 28 32 Q18 32 18 22 Z"
              fill="var(--gold)" stroke="var(--gold)" stroke-width="1.4" stroke-linejoin="round" data-accent="1"/>
        <path d="M18 14 Q10 14 10 20 Q10 24 14 24" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <path d="M38 14 Q46 14 46 20 Q46 24 42 24" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <rect x="25" y="32" width="6" height="6" fill="currentColor" opacity="0.6"/>
        <rect x="18" y="38" width="20" height="4" rx="1" fill="currentColor"/>
        <rect x="14" y="42" width="28" height="4" rx="1" fill="currentColor"/>
        <polygon points="28,15 29.5,19 33.6,19 30.3,21.5 31.6,25.7 28,23.2 24.4,25.7 25.7,21.5 22.4,19 26.5,19"
                 fill="var(--gold-bright)" data-accent="1"/>
      </svg>`,
    'Quiz Legend': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <g stroke="var(--gold)" stroke-width="1.6" stroke-linecap="round" data-accent="1">
          <line x1="28" y1="3"  x2="28" y2="10"/>
          <line x1="28" y1="46" x2="28" y2="53"/>
          <line x1="3"  y1="28" x2="10" y2="28"/>
          <line x1="46" y1="28" x2="53" y2="28"/>
          <line x1="10" y1="10" x2="15" y2="15"/>
          <line x1="41" y1="41" x2="46" y2="46"/>
          <line x1="46" y1="10" x2="41" y2="15"/>
          <line x1="10" y1="46" x2="15" y2="41"/>
        </g>
        <polygon points="28,11 32.3,22.5 44.5,22.5 34.6,30 38.5,42 28,34.5 17.5,42 21.4,30 11.5,22.5 23.7,22.5"
                 fill="var(--gold)" stroke="var(--gold)" stroke-width="1.1" stroke-linejoin="round" data-accent="1"/>
        <polygon points="28,17 30.4,24.5 38,24.5 31.8,29 34.1,36 28,31.8 21.9,36 24.2,29 18,24.5 25.6,24.5"
                 fill="var(--gold-bright)" data-accent="1"/>
      </svg>`,

    // ── perfect_scores ───────────────────────────────────────
    'Perfect Start': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="28,7 31.1,25 49,28 31.1,31 28,49 24.9,31 7,28 24.9,25"
                 fill="var(--green-deep)" data-accent="1"/>
        <polygon points="28,13 29.6,25 41,28 29.6,31 28,43 26.4,31 15,28 26.4,25"
                 fill="var(--green-bright)" data-accent="1" opacity="0.7"/>
        <polygon points="44,12 45,16 49,17 45,18 44,22 43,18 39,17 43,16"
                 fill="currentColor" opacity="0.55"/>
        <polygon points="11,42 12,45 15,46 12,47 11,50 10,47 7,46 10,45"
                 fill="currentColor" opacity="0.55"/>
      </svg>`,
    'Perfectionist': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.28"/>
        <circle cx="28" cy="28" r="16" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45"/>
        <circle cx="28" cy="28" r="10" fill="none" stroke="var(--cobalt)" stroke-width="1.6" data-accent="1"/>
        <polygon points="28,20 36,28 28,36 20,28" fill="var(--cobalt)" data-accent="1"/>
        <polygon points="28,23.5 32.5,28 28,32.5 23.5,28" fill="var(--paper)" opacity="0.85"/>
        <circle cx="28" cy="4"  r="1.4" fill="currentColor"/>
        <circle cx="52" cy="28" r="1.4" fill="currentColor"/>
        <circle cx="28" cy="52" r="1.4" fill="currentColor"/>
        <circle cx="4"  cy="28" r="1.4" fill="currentColor"/>
      </svg>`,
    'Flawless Mind': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M18 6 Q18 18 38 18 Q38 30 18 30 Q18 42 38 42 Q38 50 18 50"
              fill="none" stroke="var(--cobalt)" stroke-width="1.8" data-accent="1"/>
        <path d="M38 6 Q38 18 18 18 Q18 30 38 30 Q38 42 18 42 Q18 50 38 50"
              fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.65"/>
        <line x1="22" y1="12" x2="34" y2="12" stroke="currentColor" stroke-width="1" opacity="0.4"/>
        <line x1="22" y1="24" x2="34" y2="24" stroke="currentColor" stroke-width="1" opacity="0.4"/>
        <line x1="22" y1="36" x2="34" y2="36" stroke="currentColor" stroke-width="1" opacity="0.4"/>
        <line x1="22" y1="48" x2="34" y2="48" stroke="currentColor" stroke-width="1" opacity="0.4"/>
        <circle cx="38" cy="18" r="1.6" fill="var(--cobalt)" data-accent="1"/>
        <circle cx="18" cy="30" r="1.6" fill="var(--cobalt)" data-accent="1"/>
        <circle cx="38" cy="42" r="1.6" fill="var(--cobalt)" data-accent="1"/>
      </svg>`,
    'Chemistry Prodigy': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M10 30 Q6 18 14 12 Q14 19 18 23 Q14 27 12 33 Q8 32 10 30 Z"
              fill="var(--gold-tint)" stroke="var(--gold)" stroke-width="1.2" data-accent="1"/>
        <path d="M46 30 Q50 18 42 12 Q42 19 38 23 Q42 27 44 33 Q48 32 46 30 Z"
              fill="var(--gold-tint)" stroke="var(--gold)" stroke-width="1.2" data-accent="1"/>
        <path d="M14 38 Q28 48 42 38" fill="none" stroke="var(--gold)" stroke-width="1.6"
              stroke-linecap="round" data-accent="1"/>
        <path d="M24 16 L24 22 L20 32 L36 32 L32 22 L32 16 Z"
              fill="var(--gold-bright)" stroke="var(--gold)" stroke-width="1.4" data-accent="1"/>
        <line x1="22" y1="16" x2="34" y2="16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <polygon points="28,21 29,24 32,24 29.5,25.5 30,28 28,26.5 26,28 26.5,25.5 24,24 27,24"
                 fill="var(--paper)" opacity="0.92"/>
      </svg>`,

    // ── time_based ───────────────────────────────────────────
    'Dedicated Student': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect x="9" y="11" width="38" height="34" rx="2.2"
              fill="none" stroke="currentColor" stroke-width="1.4"/>
        <rect x="9" y="11" width="38" height="9" fill="currentColor" opacity="0.85"/>
        <g fill="var(--green-deep)" data-accent="1">
          <rect x="14" y="25" width="5" height="5" rx="0.5"/>
          <rect x="21" y="25" width="5" height="5" rx="0.5"/>
          <rect x="28" y="25" width="5" height="5" rx="0.5"/>
          <rect x="35" y="25" width="5" height="5" rx="0.5"/>
          <rect x="14" y="33" width="5" height="5" rx="0.5"/>
          <rect x="21" y="33" width="5" height="5" rx="0.5"/>
          <rect x="28" y="33" width="5" height="5" rx="0.5"/>
        </g>
        <line x1="17" y1="7" x2="17" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="39" y1="7" x2="39" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`,
    'Month Warrior': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect x="8" y="10" width="40" height="38" rx="2.2"
              fill="none" stroke="currentColor" stroke-width="1.4"/>
        <rect x="8" y="10" width="40" height="8" fill="currentColor" opacity="0.85"/>
        <g fill="var(--green-deep)" data-accent="1">
          <circle cx="14" cy="24" r="1.6"/><circle cx="20" cy="24" r="1.6"/><circle cx="26" cy="24" r="1.6"/>
          <circle cx="32" cy="24" r="1.6"/><circle cx="38" cy="24" r="1.6"/><circle cx="44" cy="24" r="1.6"/>
          <circle cx="14" cy="30" r="1.6"/><circle cx="20" cy="30" r="1.6"/><circle cx="26" cy="30" r="1.6"/>
          <circle cx="32" cy="30" r="1.6"/><circle cx="38" cy="30" r="1.6"/><circle cx="44" cy="30" r="1.6"/>
          <circle cx="14" cy="36" r="1.6"/><circle cx="20" cy="36" r="1.6"/><circle cx="26" cy="36" r="1.6"/>
          <circle cx="32" cy="36" r="1.6"/><circle cx="38" cy="36" r="1.6"/><circle cx="44" cy="36" r="1.6"/>
          <circle cx="14" cy="42" r="1.6"/><circle cx="20" cy="42" r="1.6"/><circle cx="26" cy="42" r="1.6"/>
          <circle cx="32" cy="42" r="1.6"/><circle cx="38" cy="42" r="1.6"/><circle cx="44" cy="42" r="1.6"/>
        </g>
        <line x1="16" y1="6" x2="16" y2="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="40" y1="6" x2="40" y2="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`,
    'Semester Scholar': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 14 Q28 12 26 12 L10 12 Q8 12 8 14 L8 42 Q8 44 10 44 L26 44 Q28 44 28 42 Z"
              fill="var(--paper)" stroke="currentColor" stroke-width="1.4"/>
        <path d="M28 14 Q28 12 30 12 L46 12 Q48 12 48 14 L48 42 Q48 44 46 44 L30 44 Q28 44 28 42 Z"
              fill="var(--paper)" stroke="currentColor" stroke-width="1.4"/>
        <g stroke="currentColor" stroke-width="1" opacity="0.55" stroke-linecap="round">
          <line x1="12" y1="20" x2="24" y2="20"/>
          <line x1="12" y1="26" x2="24" y2="26"/>
          <line x1="12" y1="32" x2="22" y2="32"/>
          <line x1="12" y1="38" x2="24" y2="38"/>
          <line x1="32" y1="20" x2="44" y2="20"/>
          <line x1="32" y1="26" x2="44" y2="26"/>
          <line x1="32" y1="32" x2="42" y2="32"/>
          <line x1="32" y1="38" x2="44" y2="38"/>
        </g>
        <path d="M36 12 L36 26 L40 22 L44 26 L44 12 Z"
              fill="var(--amber)" stroke="var(--amber)" stroke-width="1.2" data-accent="1"/>
      </svg>`,
    'Year Veteran': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="28,12 50,22 28,32 6,22"
                 fill="var(--cobalt)" stroke="var(--cobalt)" stroke-width="1.2" stroke-linejoin="round" data-accent="1"/>
        <polygon points="28,18 38,22 28,26 18,22" fill="var(--paper)" opacity="0.42"/>
        <path d="M14 26 L14 36 Q14 42 28 42 Q42 42 42 36 L42 26"
              fill="var(--cobalt)" stroke="var(--cobalt)" stroke-width="1.2" data-accent="1"/>
        <line x1="14" y1="32" x2="42" y2="32" stroke="var(--paper)" stroke-width="0.7" opacity="0.5"/>
        <line x1="46" y1="22" x2="46" y2="38" stroke="var(--gold)" stroke-width="1.4"
              stroke-linecap="round" data-accent="1"/>
        <circle cx="46" cy="40" r="2.6" fill="var(--gold)" data-accent="1"/>
        <circle cx="46" cy="40" r="1"   fill="var(--gold-bright)" data-accent="1"/>
      </svg>`,

    // ── streaks ──────────────────────────────────────────────
    'On Fire': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 49 C16 49 10 40 12 30 C13 24 16 21 19 16 C19 23 22 25 24 25 C25 18 27 11 33 6 C32 14 39 17 41 26 C43 33 42 40 37 45 C34 48 31 49 28 49 Z"
              fill="var(--amber)" data-accent="1" opacity="0.92"/>
        <path d="M28 43 C22 43 19 38 20 32 C21 29 23 27 24 25 C24 29 26 30 27 29 C28 25 30 21 33 18 C32 23 36 25 37 31 C38 35 36 39 33 41 C31 43 30 43 28 43 Z"
              fill="var(--gold-bright)" data-accent="1"/>
        <ellipse cx="28" cy="38" rx="3.5" ry="5" fill="var(--paper-2)" opacity="0.6"/>
      </svg>`,
    'Unstoppable': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="30,5 17,30 26,30 22,51 39,24 30,24"
                 fill="var(--gold-bright)" stroke="var(--gold)" stroke-width="1.5" stroke-linejoin="round" data-accent="1"/>
        <polygon points="30,11 23,28 28,28 26,42 35,25 29,25"
                 fill="var(--paper)" opacity="0.42"/>
      </svg>`,
    'Consistency King': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M8 22 L14 38 L42 38 L48 22 L40 28 L34 18 L28 30 L22 18 L16 28 Z"
              fill="var(--cobalt-tint)" stroke="var(--cobalt)" stroke-width="1.8" stroke-linejoin="round" data-accent="1"/>
        <circle cx="14" cy="38" r="1.8" fill="var(--gold)" data-accent="1"/>
        <circle cx="42" cy="38" r="1.8" fill="var(--gold)" data-accent="1"/>
        <circle cx="28" cy="30" r="2.2" fill="var(--gold-bright)" data-accent="1"/>
        <circle cx="28" cy="30" r="0.9" fill="var(--paper)" opacity="0.85"/>
        <rect x="14" y="40" width="28" height="4" rx="1" fill="currentColor" opacity="0.7"/>
        <rect x="11" y="44" width="34" height="4" rx="1" fill="currentColor" opacity="0.9"/>
      </svg>`,
    'Streak Master': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="18,6 12,30 22,30 26,18" fill="var(--cobalt)" data-accent="1"/>
        <polygon points="38,6 30,18 34,30 44,30" fill="var(--amber)" data-accent="1"/>
        <circle cx="28" cy="38" r="12" fill="var(--gold)" stroke="var(--gold-bright)" stroke-width="1.6" data-accent="1"/>
        <circle cx="28" cy="38" r="8"  fill="var(--gold-bright)" data-accent="1"/>
        <polygon points="28,32 29.7,36.5 34.5,36.5 30.6,39.5 32.3,44 28,41.5 23.7,44 25.4,39.5 21.5,36.5 26.3,36.5"
                 fill="var(--paper)" opacity="0.92"/>
      </svg>`,

    // ── special ──────────────────────────────────────────────
    'Speed Demon': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <g stroke="var(--amber)" stroke-width="2.6" stroke-linecap="round" data-accent="1">
          <line x1="6"  y1="18" x2="32" y2="18"/>
          <line x1="10" y1="28" x2="40" y2="28"/>
          <line x1="6"  y1="38" x2="28" y2="38"/>
        </g>
        <polygon points="44,6 30,28 38,28 34,50 52,24 44,24"
                 fill="var(--gold-bright)" stroke="var(--gold)" stroke-width="1.5" stroke-linejoin="round" data-accent="1"/>
      </svg>`,
    'Night Owl': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M34 8 A20 20 0 1 0 34 48 A14 14 0 1 1 34 8 Z"
              fill="var(--cobalt)" stroke="var(--cobalt)" stroke-width="1.2" data-accent="1"/>
        <circle cx="30" cy="18" r="1.4" fill="var(--paper)" opacity="0.55"/>
        <circle cx="26" cy="24" r="1"   fill="var(--paper)" opacity="0.4"/>
        <circle cx="28" cy="32" r="1.6" fill="var(--paper)" opacity="0.5"/>
        <polygon points="12,11 13.2,14.2 16.4,15.4 13.2,16.6 12,19.8 10.8,16.6 7.6,15.4 10.8,14.2"
                 fill="var(--gold)" data-accent="1"/>
        <polygon points="9,38 9.8,40 11.6,40.8 9.8,41.6 9,43.6 8.2,41.6 6.4,40.8 8.2,40"
                 fill="var(--gold)" data-accent="1"/>
        <circle cx="16" cy="28" r="1" fill="currentColor"/>
      </svg>`,
    'Early Bird': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="32" r="10" fill="var(--amber)" stroke="var(--amber)" stroke-width="1.2" data-accent="1"/>
        <circle cx="28" cy="32" r="6"  fill="var(--gold-bright)" data-accent="1"/>
        <g stroke="var(--gold)" stroke-width="2.2" stroke-linecap="round" data-accent="1">
          <line x1="28" y1="11" x2="28" y2="18"/>
          <line x1="14" y1="18" x2="18" y2="22"/>
          <line x1="42" y1="18" x2="38" y2="22"/>
          <line x1="7"  y1="32" x2="14" y2="32"/>
          <line x1="42" y1="32" x2="49" y2="32"/>
        </g>
        <line x1="4"  y1="44" x2="52" y2="44" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="8"  y1="49" x2="48" y2="49" stroke="currentColor" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/>
      </svg>`,
    'Weekend Warrior': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 6 L46 12 L46 28 Q46 42 28 50 Q10 42 10 28 L10 12 Z"
              fill="var(--cobalt)" stroke="var(--cobalt)" stroke-width="1.4" data-accent="1"/>
        <path d="M28 12 L40 16 L40 28 Q40 38 28 44 Q16 38 16 28 L16 16 Z"
              fill="var(--cobalt-tint)" data-accent="1"/>
        <rect x="26" y="18" width="4" height="20" fill="var(--paper)" opacity="0.92"/>
        <rect x="20" y="24" width="16" height="4" fill="var(--paper)" opacity="0.92"/>
      </svg>`,
    'Comeback Kid': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <line x1="10" y1="46" x2="48" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="10" y1="8"  x2="10" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <polyline points="14,38 22,40 30,36" fill="none" stroke="currentColor" stroke-width="1.2"
                  stroke-dasharray="3 2" opacity="0.5"/>
        <polyline points="14,38 22,40 30,36 38,22 46,12"
                  fill="none" stroke="var(--green-deep)" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round" data-accent="1"/>
        <circle cx="46" cy="12" r="3" fill="var(--green-bright)" data-accent="1"/>
        <polygon points="46,5 50,12 42,12" fill="var(--green-deep)" data-accent="1"/>
      </svg>`,

    // ── milestones ───────────────────────────────────────────
    'First Week': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M10 10 Q18 14 22 22 Q26 30 30 36"
              fill="none" stroke="var(--green-deep)" stroke-width="1.8" stroke-linecap="round" data-accent="1"/>
        <path d="M46 10 Q38 14 34 22 Q30 30 26 36"
              fill="none" stroke="var(--amber)" stroke-width="1.8" stroke-linecap="round" data-accent="1"/>
        <path d="M28 8 Q28 20 28 36"
              fill="none" stroke="var(--cobalt)" stroke-width="1.8" stroke-linecap="round" data-accent="1"/>
        <rect x="12" y="36" width="4" height="3" rx="0.6" fill="var(--gold)"
              transform="rotate(-25 14 37.5)" data-accent="1"/>
        <rect x="40" y="34" width="4" height="3" rx="0.6" fill="var(--green-deep)"
              transform="rotate(35 42 35.5)" data-accent="1"/>
        <rect x="20" y="44" width="4" height="3" rx="0.6" fill="var(--amber)"
              transform="rotate(-20 22 45.5)" data-accent="1"/>
        <rect x="36" y="46" width="4" height="3" rx="0.6" fill="var(--cobalt)"
              transform="rotate(18 38 47.5)" data-accent="1"/>
        <circle cx="28" cy="42" r="1.6" fill="var(--gold-bright)" data-accent="1"/>
        <circle cx="16" cy="48" r="1.2" fill="var(--cobalt)" data-accent="1"/>
        <circle cx="44" cy="48" r="1.2" fill="var(--green-deep)" data-accent="1"/>
      </svg>`,
    'High Achiever': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <line x1="10" y1="46" x2="48" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="10" y1="8"  x2="10" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="14" y="32" width="6" height="14" fill="currentColor" opacity="0.55"/>
        <rect x="22" y="26" width="6" height="20" fill="var(--green-deep)" data-accent="1"/>
        <rect x="30" y="18" width="6" height="28" fill="var(--green-deep)" data-accent="1"/>
        <rect x="38" y="12" width="6" height="34" fill="var(--gold)" data-accent="1"/>
        <line x1="10" y1="16" x2="48" y2="16" stroke="var(--amber)" stroke-width="1.2"
              stroke-dasharray="3 2" data-accent="1"/>
      </svg>`,
    'Chemistry Expert': `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <polygon points="28,12 41,20 41,36 28,44 15,36 15,20"
                 fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="28,16 38,22 38,34 28,40 18,34 18,22"
                 fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.42"/>
        <line x1="28" y1="12" x2="28" y2="6"   stroke="currentColor" stroke-width="1.2"/>
        <circle cx="28" cy="5"  r="3"   fill="var(--gold)" data-accent="1"/>
        <line x1="41" y1="20" x2="49" y2="14"  stroke="currentColor" stroke-width="1.2"/>
        <circle cx="50" cy="13" r="2.6" fill="var(--green-deep)" data-accent="1"/>
        <line x1="41" y1="36" x2="49" y2="42"  stroke="currentColor" stroke-width="1.2"/>
        <circle cx="50" cy="43" r="2.6" fill="var(--cobalt)" data-accent="1"/>
        <line x1="15" y1="36" x2="7"  y2="42"  stroke="currentColor" stroke-width="1.2"/>
        <circle cx="6"  cy="43" r="2.6" fill="var(--amber)" data-accent="1"/>
        <line x1="15" y1="20" x2="7"  y2="14"  stroke="currentColor" stroke-width="1.2"/>
        <circle cx="6"  cy="13" r="2.6" fill="currentColor" opacity="0.7"/>
      </svg>`,
  };

  // ─── Helpers ───────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function fmtTime(seconds) {
    if (!seconds || seconds < 60) return '0 min';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }
  function initial(name) {
    return (String(name || '?').trim().charAt(0) || '?').toUpperCase();
  }
  function plural(n, one, many) { return n === 1 ? one : many; }

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

  // ─── Load profile ──────────────────────────────────────────
  async function loadProfile() {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.profile = await res.json();
      return true;
    } catch (err) {
      console.error('[profile] load error:', err);
      state.profile = null;
      return false;
    }
  }

  // ─── Identity hero ─────────────────────────────────────────
  function renderIdentity() {
    const { user, stats } = state.profile;
    $('profAvatar').textContent = initial(user.username);
    $('profName').textContent = user.username;

    const tags = [];
    if (user.role) {
      const roleLabel = user.role === 'student' ? 'Elev'
                      : user.role === 'teacher' ? 'Profesor'
                      : user.role;
      tags.push(`<span class="pill pill--green">${escapeHTML(roleLabel)}</span>`);
    }
    if (user.country) {
      tags.push(`<span class="pill">${escapeHTML(user.country)}</span>`);
    }
    if (stats && stats.current_streak >= 3) {
      tags.push(`<span class="pill pill--amber">Serie ${stats.current_streak} zile</span>`);
    }
    $('profTags').innerHTML = tags.join('');

    const days = user.account_age_days || 0;
    $('profMeta').textContent =
      `Membru Atomify de ${days} ${plural(days, 'zi', 'zile')} · ${stats.days_active} ${plural(stats.days_active, 'zi activă', 'zile active')}`;
  }

  // ─── Quick stats overview (4 cells) ────────────────────────
  function renderQuickStats() {
    const { stats } = state.profile;
    const earned = stats.badges_earned || 0;
    const total  = stats.badges_total  || 0;

    $('profStats').innerHTML = `
      <div class="prof-stat">
        <span class="prof-stat-label">Puncte</span>
        <span class="prof-stat-value prof-stat-value--gold"><span class="num" id="qsPoints">0</span></span>
        <span class="prof-stat-aux">cumulate din insigne</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat-label">Insigne</span>
        <span class="prof-stat-value"><span class="num" id="qsBadges">0</span><span class="num" style="color:var(--ink-muted)">/${total}</span></span>
        <span class="prof-stat-aux">${total > 0 ? Math.round(earned / total * 100) : 0}% din colecție</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat-label">Serie curentă</span>
        <span class="prof-stat-value prof-stat-value--accent"><span class="num" id="qsStreak">0</span> <span style="font-size:0.62em;color:var(--ink-muted)">zile</span></span>
        <span class="prof-stat-aux">record · ${stats.longest_streak} zile</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat-label">Activitate</span>
        <span class="prof-stat-value"><span class="num" id="qsActive">0</span> <span style="font-size:0.62em;color:var(--ink-muted)">zile</span></span>
        <span class="prof-stat-aux">${stats.last_activity_date ? 'ultima · ' + fmtDate(stats.last_activity_date) : 'nicio activitate'}</span>
      </div>
    `;

    Atomify.countUp($('qsPoints'), stats.total_points || 0,    { format: v => Math.round(v).toString() });
    Atomify.countUp($('qsBadges'), earned,                     { format: v => Math.round(v).toString() });
    Atomify.countUp($('qsStreak'), stats.current_streak || 0,  { format: v => Math.round(v).toString() });
    Atomify.countUp($('qsActive'), stats.days_active || 0,     { format: v => Math.round(v).toString() });
  }

  // ─── Overall progress ──────────────────────────────────────
  function renderProgress() {
    const { stats } = state.profile;
    const pct = stats.completion_percentage || 0;
    $('profProgressPct').innerHTML = `<span class="num" id="ppNum">0</span>%`;
    $('profProgressBar').style.setProperty('--pct', pct + '%');
    $('profProgressFoot').textContent =
      `${stats.badges_earned}/${stats.badges_total} insigne câștigate`;
    Atomify.countUp($('ppNum'), pct, { format: v => Math.round(v).toString() });
  }

  // ─── Statistics grid (6 metrics) ───────────────────────────
  function renderGrid() {
    const { stats } = state.profile;
    const cells = [
      { label: 'Izomeri generați',     value: stats.isomers_generated, accent: 'accent', aux: 'molecule unice' },
      { label: 'Chestionare',          value: stats.quizzes_completed, accent: '',       aux: 'încercări totale' },
      { label: 'Scoruri perfecte',     value: stats.quizzes_perfect,   accent: 'gold',   aux: '100% obținute' },
      { label: 'Scor mediu',           value: stats.average_score,     accent: '',       aux: 'pe toate testele', suffix: '%' },
      { label: 'Timp de studiu',       value: stats.total_study_time,  accent: '',       aux: 'cumulat la chestionare', formatter: fmtTime },
      { label: 'Cea mai lungă serie',  value: stats.longest_streak,    accent: 'accent', aux: 'zile consecutive', suffix: ' zile' },
    ];

    $('profGrid').innerHTML = cells.map((c, i) => {
      const accentCls = c.accent ? ` prof-grid-cell-value--${c.accent}` : '';
      const display = c.formatter ? c.formatter(c.value) : `<span class="num" id="pg${i}">0</span>${c.suffix || ''}`;
      return `
        <div class="prof-grid-cell">
          <span class="prof-grid-cell-label">${c.label}</span>
          <span class="prof-grid-cell-value${accentCls}">${display}</span>
          <span class="prof-grid-cell-aux">${c.aux}</span>
        </div>`;
    }).join('');

    cells.forEach((c, i) => {
      if (c.formatter) return;
      const el = $('pg' + i);
      if (!el) return;
      Atomify.countUp(el, c.value || 0, {
        format: v => (c.suffix === '%' ? Math.round(v) : Math.round(v)).toString(),
      });
    });
  }

  // ─── Account info ──────────────────────────────────────────
  function renderAccountInfo() {
    const { user, stats } = state.profile;
    const rows = [
      { label: 'Nume utilizator', value: escapeHTML(user.username) },
      { label: 'Rol',             value: user.role === 'student' ? 'Elev' : user.role === 'teacher' ? 'Profesor' : 'Nedefinit' },
      { label: 'Țară',            value: user.country ? escapeHTML(user.country) : '—' },
      { label: 'Cont creat',      value: fmtDate(user.created_at) },
      { label: 'Puncte totale',   value: `<span class="num">${stats.total_points}</span>` },
      { label: 'Ultima activitate', value: fmtDate(stats.last_activity_date) },
    ];
    $('profInfo').innerHTML = rows.map(r => `
      <div class="prof-info-row">
        <span class="prof-info-label">${r.label}</span>
        <span class="prof-info-value">${r.value}</span>
      </div>
    `).join('');
  }

  // ─── Badges ────────────────────────────────────────────────
  function renderTabs() {
    const { badges } = state.profile;
    const total = Object.values(badges).flat();
    const earned = total.filter(b => Boolean(b.earned)).length;
    const locked = total.length - earned;

    const tabs = [
      { key: 'all',    label: 'Toate',     count: total.length },
      { key: 'earned', label: 'Câștigate', count: earned },
      { key: 'locked', label: 'Blocate',   count: locked },
    ];
    Object.keys(badges).forEach(cat => {
      tabs.push({ key: cat, label: CAT_LABEL[cat] || cat, count: badges[cat].length });
    });

    $('profTabs').innerHTML = tabs.map(t => `
      <button type="button" class="prof-tab${t.key === state.currentFilter ? ' is-active' : ''}" data-filter="${t.key}">
        ${escapeHTML(t.label)}
        <span class="prof-tab-count">${t.count}</span>
      </button>
    `).join('');

    document.querySelectorAll('.prof-tab').forEach(btn => {
      btn.addEventListener('click', () => switchFilter(btn.dataset.filter));
    });
  }

  function switchFilter(filter) {
    if (filter === state.currentFilter) return;
    state.currentFilter = filter;
    document.querySelectorAll('.prof-tab').forEach(b => {
      b.classList.toggle('is-active', b.dataset.filter === filter);
    });
    renderShowcase();
    renderAlmost();
    renderBadges();
  }

  function iconMarkup(badge) {
    const custom = CUSTOM_ICONS[badge.name];
    if (custom) return `<div class="prof-badge-icon prof-badge-icon--svg">${custom}</div>`;
    return `<div class="prof-badge-icon">${escapeHTML(badge.icon || '★')}</div>`;
  }

  function badgeCardHTML(badge) {
    const earned = Boolean(badge.earned);
    const pct = badge.progress_percentage || 0;
    const rarity = (badge.rarity || 'common').toLowerCase();
    const earnedCls = earned ? ' prof-badge--earned' : ' prof-badge--locked';

    const footer = earned
      ? `<span class="prof-badge-earned-meta">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="20 6 9 17 4 12"/>
           </svg>
           ${badge.earned_at ? 'Câștigată · ' + fmtDate(badge.earned_at) : 'Câștigată'}
         </span>`
      : `<div class="prof-badge-progress">
           <div class="prof-badge-progress-bar" style="--pct: ${pct}%"></div>
           <div class="prof-badge-progress-text">${badge.current_progress ?? 0} / ${badge.requirement_value ?? '?'} · ${pct}%</div>
         </div>`;

    return `
      <div class="prof-badge${earnedCls}" data-earned="${earned}" data-category="${escapeHTML(badge.category)}">
        <span class="prof-badge-points">${badge.points} pts</span>
        <span class="prof-badge-rarity prof-badge-rarity--${escapeHTML(rarity)}">${escapeHTML(rarity)}</span>
        ${iconMarkup(badge)}
        <div class="prof-badge-name">${escapeHTML(badge.name)}</div>
        <div class="prof-badge-desc">${escapeHTML(badge.description)}</div>
        ${footer}
      </div>`;
  }

  // ─── Rarity collection strip ──────────────────────────────
  function renderRarityStrip() {
    const wrap = $('profRarityStrip');
    if (!wrap) return;
    const all = Object.values(state.profile.badges).flat();
    const tallies = Object.fromEntries(RARITIES.map(r => [r, { earned: 0, total: 0 }]));
    for (const b of all) {
      const r = (b.rarity || 'common').toLowerCase();
      if (!tallies[r]) continue;
      tallies[r].total += 1;
      if (Boolean(b.earned)) tallies[r].earned += 1;
    }
    wrap.innerHTML = RARITIES.map(r => `
      <div class="prof-rarity-cell prof-rarity-cell--${r}">
        <span class="prof-rarity-cell-label">${RARITY_LABEL[r]}</span>
        <span class="prof-rarity-cell-value">
          <span class="num">${tallies[r].earned}</span><span class="prof-rarity-cell-of">/${tallies[r].total}</span>
        </span>
      </div>
    `).join('');
  }

  // ─── Showcase (top 3 earned by rarity desc, points desc) ──
  function renderShowcase() {
    const wrap = $('profShowcase');
    if (!wrap) return;
    // Only show when "all" filter is active
    if (state.currentFilter !== 'all') { wrap.innerHTML = ''; return; }

    const earned = Object.values(state.profile.badges).flat()
      .filter(b => Boolean(b.earned));
    if (earned.length < 1) { wrap.innerHTML = ''; return; }

    const top = [...earned].sort((a, b) => {
      const ra = RARITY_ORDER[(a.rarity || 'common').toLowerCase()] ?? 0;
      const rb = RARITY_ORDER[(b.rarity || 'common').toLowerCase()] ?? 0;
      if (ra !== rb) return rb - ra;
      return (b.points || 0) - (a.points || 0);
    }).slice(0, 3);

    const cards = top.map(b => {
      const rarity = (b.rarity || 'common').toLowerCase();
      const icon = CUSTOM_ICONS[b.name]
        ? `<div class="prof-showcase-icon prof-badge-icon--svg">${CUSTOM_ICONS[b.name]}</div>`
        : `<div class="prof-showcase-icon">${escapeHTML(b.icon || '★')}</div>`;
      return `
        <div class="prof-showcase-card prof-showcase-card--${rarity}">
          ${icon}
          <div class="prof-showcase-body">
            <span class="prof-showcase-rarity">${escapeHTML(rarity)} · ${b.points} pts</span>
            <span class="prof-showcase-name">${escapeHTML(b.name)}</span>
            <span class="prof-showcase-meta">${b.earned_at ? 'Câștigată · ' + fmtDate(b.earned_at) : 'Câștigată'}</span>
          </div>
        </div>`;
    }).join('');

    wrap.innerHTML = `
      <div class="prof-cat-head">
        <h3>Cele mai prețioase</h3>
        <span class="prof-cat-head-rule"></span>
        <span class="prof-cat-head-count">Top ${top.length}</span>
      </div>
      <div class="prof-showcase-grid">${cards}</div>
    `;
  }

  // ─── "Aproape acolo" — locked badges with ≥75% progress ────
  function renderAlmost() {
    const wrap = $('profAlmost');
    if (!wrap) return;
    // Only when looking at "all" or "locked"
    if (state.currentFilter !== 'all' && state.currentFilter !== 'locked') {
      wrap.innerHTML = '';
      return;
    }
    const candidates = Object.values(state.profile.badges).flat()
      .filter(b => !Boolean(b.earned) && (b.progress_percentage || 0) >= 75 && (b.progress_percentage || 0) < 100)
      .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
      .slice(0, 4);

    if (!candidates.length) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = `
      <div class="prof-cat" style="margin-bottom: 1.75rem;">
        <div class="prof-cat-head">
          <h3>Aproape acolo</h3>
          <span class="prof-cat-head-rule"></span>
          <span class="prof-cat-head-count">${candidates.length} ${plural(candidates.length, 'insignă', 'insigne')} la ≥75%</span>
        </div>
        <div class="prof-badges">${candidates.map(badgeCardHTML).join('')}</div>
      </div>
    `;
  }

  function renderBadges() {
    const { badges } = state.profile;
    const wrap = $('profBadgeBody');
    const filter = state.currentFilter;

    // Pick categories to render
    const cats = (filter === 'all' || filter === 'earned' || filter === 'locked')
      ? Object.keys(badges)
      : (badges[filter] ? [filter] : []);

    const sections = [];
    let visibleCount = 0;
    for (const cat of cats) {
      let list = badges[cat] || [];
      if (filter === 'earned')   list = list.filter(b => Boolean(b.earned));
      if (filter === 'locked')   list = list.filter(b => !Boolean(b.earned));
      if (!list.length) continue;

      // Sort: earned first, then by rarity desc, then by points desc
      list = [...list].sort((a, b) => {
        const ea = Boolean(a.earned), eb = Boolean(b.earned);
        if (ea !== eb) return ea ? -1 : 1;
        const ra = RARITY_ORDER[(a.rarity || 'common').toLowerCase()] ?? 0;
        const rb = RARITY_ORDER[(b.rarity || 'common').toLowerCase()] ?? 0;
        if (ra !== rb) return rb - ra;
        return (b.points || 0) - (a.points || 0);
      });
      visibleCount += list.length;

      sections.push(`
        <div class="prof-cat">
          <div class="prof-cat-head">
            <h3>${escapeHTML(CAT_LABEL[cat] || cat)}</h3>
            <span class="prof-cat-head-rule"></span>
            <span class="prof-cat-head-count">${list.length} ${plural(list.length, 'insignă', 'insigne')}</span>
          </div>
          <div class="prof-badges">
            ${list.map(badgeCardHTML).join('')}
          </div>
        </div>
      `);
    }

    if (!visibleCount) {
      wrap.innerHTML = `
        <div class="prof-empty">
          <div class="prof-empty-eyebrow">Nimic de afișat</div>
          <div class="prof-empty-title">Niciun rezultat pentru filtrul curent</div>
          <p class="prof-empty-body">Încearcă alt filtru pentru a vedea insignele disponibile.</p>
        </div>
      `;
      return;
    }
    wrap.innerHTML = sections.join('');
  }

  // ─── Wire-up ───────────────────────────────────────────────
  async function init() {
    Atomify.initAuthModal();

    $('profAuthLoginBtn')?.addEventListener('click', () => Atomify.showAuthModal('login'));

    const authed = await checkAuth();
    if (!authed) {
      show($('profAuthRequired'));
      hide($('profContent'));
      return;
    }

    const ok = await loadProfile();
    if (!ok || !state.profile) {
      show($('profAuthRequired'));
      hide($('profContent'));
      return;
    }

    show($('profContent'));
    renderIdentity();
    renderQuickStats();
    renderProgress();
    renderRarityStrip();
    renderGrid();
    renderTabs();
    renderShowcase();
    renderAlmost();
    renderBadges();
    renderAccountInfo();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
