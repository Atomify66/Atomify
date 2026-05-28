# Atomify · Design System v2

A note to future-Claude (and future-Luca): read this end-to-end before touching any page.
It captures the architecture, conventions, and roadmap of the v2 redesign — so a new
page can be built in one pass without re-deriving anything.

The single sentence: **v2 is a clean, three-tier CSS system + a shared JS module that
replaces the 9.5K-line `style.css` monolith. Every page that has been migrated lives
under `app/v2/pages/`. Pages that haven't been migrated still use the old `style.css`.**

---

## 1 · Visual direction

**"Modernist Laboratory"** — academic but warm. Inspired by Brilliant.org, Swiss
scientific publishing, and Stripe-docs restraint. The brand wants two modes off the
same design system:

| Mode | Used for | Feel |
|---|---|---|
| **Academic** (current) | masa, equations, isomers, calcule, bio | Calm, restrained, textbook-like, generous whitespace, hairline borders, mono numbers |
| **Gamified** (current) | chestionare, leaderboard, istoric, profile | Same tokens, but with progress bars, achievement stamps, streak counters, larger CTAs |

Same color palette, same typography, same primitives — only the page-specific
components change. **Don't fork the design system to build the gamified mode.**

### Palette
- `--paper` cream surface, `--ink` deep blue-black for text
- `--green` lab-glass green (primary accent)
- `--amber` burnt orange (warning / hot)
- `--cobalt` (badge cells), `--gold` (achievements, gamified mode)
- All defined in `core.css` for both light and dark themes

### Typography
- **Display**: Fraunces (serif with optical-size variations) — page titles, formulas, results
- **Body**: Geist — paragraphs, buttons, labels
- **Mono**: JetBrains Mono — numbers, eyebrow labels, technical metadata
- All loaded once from Google Fonts in `core.css`

### Don't
- No emojis in chrome (headings, buttons, navbar). Emojis are OK in user-generated
  content (badges from the API).
- No purple gradients, no Inter, no Space Grotesk. The point of v2 is to feel
  intentional, not generic.
- No `style.css` imports on v2 pages — that file is being phased out.

---

## 2 · File structure

```
app/
  masa.html              ← migrated (v2 pilot page #1)
  equations.html         ← migrated (v2 pilot page #2)
  isomers.html           ← migrated (v2 pilot page #3)
  calcule.html           ← migrated (v2 pilot page #5)
  bio.html               ← migrated (v2 pilot page #4)
  chestionare.html       ← migrated (v2 pilot page #6 · first gamified)
  leaderboard.html       ← migrated (v2 pilot page #7 · gamified)
  istoric.html           ← migrated (v2 pilot page #8 · gamified)
  profile.html           ← migrated (v2 pilot page #9 · gamified)
  admin.html             ← migrated (v2 pilot page #10 · gamified)
  privacy.html           ← legacy
  index.html             ← landing (legacy)

  style.css              ← LEGACY MONOLITH. Do not touch. Do not load on v2 pages.
  navbar.css             ← legacy. Do not load on v2 pages.

  navbar.js              ← legacy. KEEP loading — renders the navbar markup.
  auth.js                ← legacy. KEEP loading — owns AtomifyAuth global.
  pwa.js, tutorial.js, logo-theme-switcher.js, google-translate.js  ← keep

  v2/
    core.css             ← tokens · reset · masthead · chapter · reveal motion
    components.css       ← buttons · fields · tables · panels · status · pills · pt-cell · progress
    chrome.css           ← navbar · footer · modal · drawer · badge toast (UI shell)
    shared.js            ← Atomify global: element loader, auth modal, count-up, toast, formula formatter
    pages/
      masa.css           ← page-specific
      masa.js            ← page-specific
      equations.css      ← page-specific
      equations.js       ← page-specific
      <future>.css
      <future>.js

  DESIGN_V2.md           ← this file
```

**Rule of thumb:**
- Foundation lives in `v2/core.css`. Reusable design system in `v2/components.css`.
- UI shell (navbar, footer, modal) lives in `v2/chrome.css`.
- Cross-page logic lives in `v2/shared.js`.
- Page-specific anything lives in `v2/pages/<page>.css` or `v2/pages/<page>.js`.

---

## 3 · CSS architecture · three tiers

Every v2 page loads the same three foundational files in this order, then its own
page-specific stylesheet:

```html
<link rel="stylesheet" href="v2/core.css" />
<link rel="stylesheet" href="v2/components.css" />
<link rel="stylesheet" href="v2/chrome.css" />
<link rel="stylesheet" href="v2/pages/<page>.css" />
```

### `core.css` — foundation only
- Design tokens (light + dark) on `:root` and `[data-theme="dark"]`
- Reset, base typography, body background (cream + grain texture)
- Layout primitives: `.container`, `.page-main`, `.masthead`, `.chapter`
- Typography utilities: `.display`, `.eyebrow`, `.label-mono`, `.num`, `.ital`
- Reveal motion (`.reveal`, `.reveal-1` through `.reveal-5`)
- `prefers-reduced-motion` handling

### `components.css` — design system primitives
Reusable, tokens-in / classes-out. No layout, no markup-specific assumptions.

| Class | What it is |
|---|---|
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-cta`, `.btn-link`, `.btn-icon` | Button variants |
| `.field`, `.field-input`, `.field-clear`, `.field--compact` | Bordered text input with auto-show clear button (uses `data-has-value` toggled by JS) |
| `.data-table`, `.table-wrap` | Hairline-bordered table with mono header |
| `.panel`, `.panel-head`, `.panel-title`, `.panel-body` | Card container |
| `.status`, `.status--error`, `.status--success`, `.status--loading` | Inline state banners |
| `.pill`, `.pill--green/amber/cobalt/gold` | Inline tag chips (used for tags, achievements) |
| `.pt-cell`, `.pt-cell--sm`, `.pt-cell-symbol`, `.pt-cell-num` | Periodic-table-style atom badge |
| `.progress-bar` (with `--progress` custom prop) | Generic green-gradient progress bar |

### `chrome.css` — UI shell
The navbar markup is rendered by legacy `navbar.js` using `.at-*` classes. v2's
`chrome.css` styles those classes from scratch in the new aesthetic. **Don't load
`navbar.css`** — chrome.css supersedes it.

Includes: navbar shell, brand, nav-links, sub-dropdowns, theme toggle, user menu,
dropdown panel, hamburger, mobile drawer, footer (4-col grid + bottom strip),
auth modal, badge toast.

### `pages/<page>.css` — page-specific
Anything not reusable. Examples:
- `masa.css`: `.specimen-grid`, `.specimen`, `.result-panel`, `.composition-symbol`, `.pct-cell`, `.pct-bar`
- `equations.css`: `.eq-form-row`, `.eq-examples`, `.eq-example` cards (two-line reactants/products), `.eq-panel`, `.eq-row` (reactant/product breakdown), `.eq-arrow`, `.eq-toast`

---

## 4 · The Atomify shared module (`v2/shared.js`)

Every v2 page should `<script src="v2/shared.js" defer></script>` before its own
page script. It exposes `window.Atomify` with these helpers:

| Method | Purpose |
|---|---|
| `Atomify.loadElements()` | Promise. Single fetch of `/api/elements`. Caches result. Idempotent — calling twice returns the same promise. |
| `Atomify.elements` | The cache: `{ masses, names, numbers, loaded }`. Available after `loadElements()` resolves. |
| `Atomify.formatFormulaHTML(str)` | Wraps trailing digits in `<sub>` (`H2O` → `H<sub>2</sub>O`). |
| `Atomify.countUp(el, final, opts)` | Animates a numeric element from 0 to `final` over 700ms. Respects `prefers-reduced-motion`. `opts.format` and `opts.suffixHTML`. |
| `Atomify.toast(idOrEl, ms)` | Toggles `.show` on an element for `ms` (default 1800). Page provides the toast markup + CSS. |
| `Atomify.initAuthModal()` | One call wires up the entire login/register modal (assuming the standard markup is present in the page). |
| `Atomify.showAuthModal(mode)` / `Atomify.hideAuthModal()` | Imperative open/close. |

The auth modal expects this markup (copy from `masa.html` or `equations.html`):
`#authModal`, `#loginForm`/`#registerForm`, `#loginFormElement`/`#registerFormElement`,
`#loginUsername`/`#loginPassword`, `#registerUsername`/`#registerPassword`/`#registerPasswordConfirm`,
`#req-length`/`#req-uppercase`/`#req-digit`, `#googleLoginBtn`/`#googleRegisterBtn`,
`#showRegister`/`#showLogin`, `#authMessage`, `.auth-close`.

---

## 5 · Building a new page · checklist

When migrating page `<page>.html`:

1. **Plan the page-specific components.** What does this page have that no other does?
   Those go in `pages/<page>.css`. Anything reusable (a new pill style, a new card type)
   goes in `components.css`.
2. **Create `app/v2/pages/<page>.css`** — page-specific styles only.
3. **Create `app/v2/pages/<page>.js`** — page-specific logic. Use the IIFE pattern,
   `'use strict'`, lean on `Atomify` shared helpers. Don't duplicate auth-modal,
   element-loading, count-up, or toast code.
4. **Rewrite `app/<page>.html`**:
   - `<link>`: only `v2/core.css`, `v2/components.css`, `v2/chrome.css`, `v2/pages/<page>.css`.
     **Do not load `style.css` or `navbar.css`.**
   - Keep loading `auth.js` and `navbar.js` (they own the navbar markup + auth state).
   - Page structure: `<header class="site-header"></header>`, then `<main class="page-main">`
     containing `.masthead` + numbered `.chapter` blocks.
   - Footer: copy the v2 footer markup from `masa.html` (it's identical across pages).
   - Auth modal: copy the standard markup from `masa.html` so `Atomify.initAuthModal()` works.
   - `<script>`: `v2/shared.js` then `v2/pages/<page>.js`, both `defer`.
5. **Smoke test**: `curl http://localhost:3000/app/<page>.html` should return 200; same
   for each new asset. Reload in browser, hard-refresh to bust cache.
6. **Verify both themes** (light + dark via the navbar toggle).
7. **Verify mobile** (≤720px) — chapter/masthead grid collapses to single column, mobile
   drawer opens.
8. **No emojis** in section headings. Use inline SVG icons or none.
9. **Romanian copy.** Keep titles and metadata terse. Mirror the `masa.html` /
   `equations.html` patterns.

### Standard page HTML skeleton

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <title>Atomify · <Page Name></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="v2/core.css" />
  <link rel="stylesheet" href="v2/components.css" />
  <link rel="stylesheet" href="v2/chrome.css" />
  <link rel="stylesheet" href="v2/pages/<page>.css" />
  <script src="logo-theme-switcher.js" defer></script>
  <script src="pwa.js" defer></script>
  <script src="tutorial.js" defer></script>
</head>
<body>
  <header class="site-header"></header>
  <script src="auth.js"></script>
  <script src="navbar.js"></script>
  <script>initNavbar("<page>");</script>

  <main class="page-main">
    <section class="masthead reveal reveal-1">
      <div class="masthead-eyebrow">Calcul · Vol. N</div>
      <h1 class="masthead-title">Title <span class="ital">word</span>.</h1>
      <div class="masthead-meta">META<br/>LINE</div>
    </section>

    <section class="chapter reveal reveal-2">
      <div class="chapter-num">01</div>
      <div class="chapter-body">
        <h2 class="chapter-head">Section title</h2>
        <p class="chapter-sub">Description.</p>
        <!-- page content here -->
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <!-- copy from masa.html -->
  </footer>

  <div id="authModal" class="auth-modal">
    <!-- copy from masa.html -->
  </div>

  <script src="v2/shared.js" defer></script>
  <script src="v2/pages/<page>.js" defer></script>
</body>
</html>
```

### Standard page JS skeleton

```js
(function () {
  'use strict';

  // ── parsers / business logic ────
  // ...

  // ── render ────
  function render(...) { return `<div class="...">...</div>`; }

  // ── wire-up ────
  function init() {
    Atomify.initAuthModal();
    const els = Atomify.elements;
    // wire form, buttons, click handlers
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await Atomify.loadElements();   // skip if page doesn't need element data
    init();
  });
})();
```

---

## 6 · Page status

| Page | Status | Notes |
|---|---|---|
| `masa.html` | ✅ migrated | Pilot. Specimen grid + result panel + count-up animation. |
| `equations.html` | ✅ migrated | Stoichiometric balancer. Two-line example cards. Copy-to-clipboard with toast. |
| `isomers.html` | ✅ migrated | Organic-isomer generator. SmilesDrawer lazy-loaded; PDF export via html2canvas + jsPDF lazy-loaded. Big-formula confirmation + complex-warning + educational-suggestions all use the design system (no inline styles). |
| `calcule.html` | ✅ migrated | Six crystal-growth calculators (nucleație, growth, Avrami, supersaturație, van't Hoff, Re/Pe/Ri) + Navier–Stokes regime info. MathJax CDN loaded async; per-panel `setOutput` runs `MathJax.typesetPromise` on the result element only. TOC pills smooth-scroll to chapters. |
| `bio.html` | ✅ migrated | DNA ↔ RNA conversion. Textarea field (`.field--bio`), nucleotide-colored sequences (A=green, T=amber, G=cobalt, C=gold), 4-cell composition chart with mini bars, copy-all toast. |
| `chestionare.html` | ✅ migrated | **Gamified** — first page to use the gamified component set. Library cards lift on hover with a CTA reveal; in-session view has a full-width XP-style `.quiz-progress`, a `.quiz-timer` that pulses amber in the last 30s, full-width Duolingo-style answer pills (`.quiz-pill`) with selected/correct/wrong states, MathJax-rendered questions, and a results screen with three big count-up stat blocks. Same Modernist Laboratory palette — no purple gradients. |
| `leaderboard.html` | ✅ migrated | Gamified. 4-cell `.lb-stats` block with count-up animations (Total · Mediu · Best · Timp), pill-row scope tabs (Global / Național / Clasă), filter dropdowns for quiz + class, **Olympic podium** for top-3 (gold/silver/bronze medals via `--gold`/`--ink-3`/`--amber`, 1st card raised in center on desktop), then a full hairline table with rank chips, avatar initials, country, score, inline mini percentage bar, time and date. Current user's row is highlighted with a green left-border + "Tu" tag. |
| `istoric.html` | ✅ migrated | Gamified — activity journal. 4-cell `.hist-stats` overview with count-up (Formule · Structuri · Teste · Scor mediu), pill-row tabs (Tot / Izomeri / Chestionare), per-quiz "Cele mai bune scoruri" grid with gold/silver/bronze medal rank chip + mini percentage bar + Reia chip, then a chronological **timeline** (`.hist-timeline`) with a vertical hairline rail, day-group headers showing localized full date + relative pill ("AZI", "IERI", "5 ZILE"), entry cards anchored to the rail with kind-coloured markers (green for isomer, cobalt for quiz), and per-entry Regenerează (writes `regenerateFormula` to localStorage and redirects to `isomers.html`) or Reia buttons. |
| `profile.html` | ✅ migrated | Gamified — personal profile. Identity hero (`.prof-hero`) with gold-ringed initial avatar, role/country/streak pills and "Membru de N zile" meta. 4-cell `.prof-stats` overview with count-up (Puncte · Insigne · Serie · Activitate), gold full-width `.prof-progress` bar (% insigne) with mono percentage, 5-cell `.prof-rarity-strip` (Comune/Necomune/Rare/Epice/Legendare collection breakdown with colored dots), 6-cell `.prof-grid` (izomeri · chestionare · perfecte · scor mediu · timp · cea mai lungă serie), pill-row `.prof-tabs` filter (Toate / Câștigate / Blocate + per-category), `.prof-showcase-card` strip (top 3 earned by rarity-desc with rarity-tinted top border + radial glow, only on Toate), "Aproape acolo" mini-grid (locked badges at ≥75% progress, only on Toate / Blocate), and per-category `.prof-badges` grid of `.prof-badge` achievement stamps with rarity tag (common/uncommon/rare/epic/legendary), points, name/desc, gold "Câștigată · DATA" stamp when earned or progress bar when locked. **All 31 badges have custom token-driven inline SVG icons** (`CUSTOM_ICONS` map in `profile.js`) — flask/molecule/crown/star/flame/shield/calendar/etc. — using `currentColor` + `var(--gold/amber/cobalt/green*)`; elements with `data-accent="1"` get dimmed in the locked state on top of the global SVG opacity. Pulls `/api/profile`. |
| `admin.html` | ✅ migrated | Gamified — account-management workspace. Auth-gated single chapter when logged out (gold-border `.adm-auth-required` block, mirrors `profile.html`). When logged in: identity hero (`.adm-hero`) with gold-ringed avatar + role/country/Google pills + member-since meta, role-aware quick-stat grid (`.adm-stats`, count-up animated), conditional role picker (`.adm-roles` with two `.adm-role` tiles using green/gold accents), professor class workspace (create-class form + `.adm-tile` grid of own classes), quiz builder section using `.adm-question` cards with `.adm-type-pill` segmented control and `.adm-option`/`.adm-text-answer` rows (correct-answer radio flips the option to `.is-correct` green), student joined-classes + invitations + homework workspace, preferences (country selector + `.adm-nl-status` newsletter panel), securitate (password change with v2 password requirements), and an amber-bordered `.adm-danger` zone for account deletion (handles Google vs password users). Class details modal (`.adm-modal`) hosts invite-student autocomplete (`.adm-autocomplete`), per-class homework management and a homework-clasament submission table (`.adm-sub-table` with gold/silver/bronze rank colors). All forms keep the same backend endpoints (`/create-class`, `/invite-student`, `/api/classroom-quiz`, `/admin-stats`, etc.). |
| `privacy.html` | legacy | Probably stays minimal — just paragraphs. |
| `index.html` | legacy | Landing page. Decide direction separately. |

---

## 7 · Gamified mode · what's already there, what's missing

Already in `core.css` / `components.css`:
- `--gold`, `--gold-bright`, `--gold-tint` tokens
- `.pill--gold` for achievements
- `.pt-cell--sm` (small atom-badge variant)
- `.progress-bar` with `--progress` custom property
- The reveal motion utilities

Built in **`pages/chestionare.css`** (page-local for now — promote to
`components.css` only if a 2nd page needs them):
- `.quiz-pill` — large full-width answer pill with `--selected` / `--correct` /
  `--wrong` / `--disabled` states. Includes a letter chip on the left and an
  icon slot on the right.
- `.quiz-timer` with `--warn` / `--critical` modifiers; critical state runs
  `timer-pulse` infinite animation.
- `.quiz-progress` — slim 6px XP bar reading `--progress`.
- `.quiz-dots` / `.quiz-dot` — paginated jump nav with answered/active/correct/wrong.
- `.quiz-stat` block (label + display-font value + aux line) — composes into a
  3-col `.quiz-results-stats` grid with hairline dividers.
- `.quiz-results-bar` — taller (8px) finish-line variant of the progress bar,
  flips to amber gradient via `--low` when score < 50%.
- `.quiz-confirm` overlay — design-system modal pattern using `--shadow-lg`.

Built in **`pages/istoric.css`** (page-local for now):
- `.hist-timeline` — vertical hairline rail (1px line · 13px from left edge) with
  per-day group headers anchored by a 11px ink/green-bordered dot, and entry
  cards anchored to the rail by a 7px kind-colored marker (green/cobalt).
- `.hist-day-relative` — relative-time pill ("AZI", "IERI", "5 ZILE", "3 SĂPT.",
  "2 LUNI", "1 ANI"). Reusable for any feed.
- `.hist-best-card-medal` with `--gold` / `--silver` / `--bronze` modifiers
  (same medal pattern as leaderboard's `.lb-medal` — strong candidate to
  promote when profile.html lands).

Built in **`pages/profile.css`** (page-local for now):
- `.prof-hero` — gamified identity header: gold-ringed initial avatar +
  display-font name + pill row (role / country / streak) + mono meta line.
- `.prof-stats`, `.prof-grid` — same 4-cell / 6-cell hairline-bordered
  metric grids as `.hist-stats` / `.lb-stats`. **Triple-duplication now —
  promote to `components.css` as a neutral `.stat-grid` / `.stat-cell` set
  next time we touch any of these three pages.**
- `.prof-progress` — gold full-width 8px progress bar with mono percentage.
  Same shape as the green `.progress-bar` in `components.css`, but gamified
  (gold gradient, larger, with header + footer rows).
- `.prof-tabs` / `.prof-tab` — pill-row filter tabs identical in shape to
  `.hist-tabs` (tabs ARE another duplication candidate).
- `.prof-badge` — **achievement stamp** (the missing gamified primitive
  flagged below). Square card with rarity tag (`--common` / `--uncommon` /
  `--rare` / `--epic` / `--legendary` using ink-3 / green / cobalt / amber /
  gold tints), points, emoji icon slot, name + desc, and a gold "Câștigată"
  meta when earned or a slim progress bar when locked. `.prof-badge--locked`
  uses dashed border + grayscaled icon; `.prof-badge--earned` flips the icon
  background to gold-tint.

Likely still needed for the rest of the gamified track:
- Streak counter (mono number with "ZILE" label, fire-amber accent)
- Level badge (circular, gold border, mono number)

When a second page needs any of the `.quiz-*` components, lift it into
`components.css` (rename to a neutral class — e.g. `.answer-pill`,
`.stat-block`) so it's reusable.

The principle: **build gamified components from the same tokens, not a parallel
palette.** A "Duolingo" feel can come from animation, scale, and amber/gold accents
without changing the core look.

---

## 8 · Important conventions

- **Don't reach for `style.css`.** It exists for the legacy pages and will be deleted
  once everything is migrated. New CSS goes in v2 only.
- **Tokens, never hardcoded colors.** If you find yourself typing `#1F8F5C`, use
  `var(--green)`. If a needed shade doesn't exist, add it to `core.css` tokens.
- **Romanian text only.** Titles, labels, error messages, button copy — all Romanian.
  Keep it terse and technical.
- **Section numbers as pseudo-chapter heading.** `01`, `02`, `03` in the left column
  of every chapter — feels like a textbook.
- **Mono for numbers, serif for formulas, sans for body.** Don't mix.
- **Hairlines over heavy borders.** `var(--line)` for separators, `var(--line-strong)`
  only for inputs and emphasis. No drop shadows on cards by default.
- **`min-width: 0` on grid children that contain text** — long Romanian words
  (`stoichiometric`, `Coeficienți`) can break grid layouts otherwise.
- **Animations**: subtle. Reveal-on-load (staggered), count-up on result numbers,
  result-rise on panels. Always respect `prefers-reduced-motion`.

---

## 9 · How to pick this up tomorrow

If the user just says "redesign `<page>.html`":

1. Read this file.
2. Read `masa.html` + `pages/masa.css` + `pages/masa.js` as the gold-standard reference.
3. Read the legacy `<page>.html` to understand its features and JS logic.
4. Identify what's reusable (probably already in `components.css`) and what needs
   page-specific styles.
5. Follow the checklist in §5.
6. Don't ask the user about palette or fonts — they're decided.
7. Do ask the user before introducing a new global component to `components.css` —
   keep that file curated.

---

*Last updated: 2026-05-12. Migrated pages: masa, equations, isomers, bio, calcule, chestionare, leaderboard, istoric, profile, admin.*
