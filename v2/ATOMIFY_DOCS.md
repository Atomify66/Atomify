# Atomify v2 — Documentație completă

> Platformă educațională pentru chimie și matematică de liceu.  
> Distinsă în 2025 la Chișinău (Salonul Internațional al Invenției), la Olimpiada InfoEducație și de UPIR.  
> Autori: **Siret Luca-Alexandru** (arhitectură & dezvoltare) · **Zevri Matei-Tudor** (conținut & chimie)

---

## Cuprins

1. [Prezentare generală](#1-prezentare-generală)
2. [Stivă tehnologică](#2-stivă-tehnologică)
3. [Structura fișierelor](#3-structura-fișierelor)
4. [Pagini — detalii complete](#4-pagini--detalii-complete)
   - 4.1 [Landing Page (`index.html`)](#41-landing-page-indexhtml)
   - 4.2 [Generator de izomeri (`app/isomers.html`)](#42-generator-de-izomeri-appisomershtml)
   - 4.3 [Echilibrare ecuații (`app/equations.html`)](#43-echilibrare-ecuații-appequationshtml)
   - 4.4 [Masă molară (`app/masa.html`)](#44-masă-molară-appmasahtml)
   - 4.5 [Calcule chimice — cristalizare (`app/calcule.html`)](#45-calcule-chimice--cristalizare-appcalculehtml)
   - 4.6 [Biologie — ADN/ARN (`app/bio.html`)](#46-biologie--adnarn-appbiohtml)
   - 4.7 [Chestionare BAC (`app/chestionare.html`)](#47-chestionare-bac-appchestionarehtml)
   - 4.8 [Clasament (`app/leaderboard.html`)](#48-clasament-appleaderboardhtml)
   - 4.9 [Istoric personal (`app/istoric.html`)](#49-istoric-personal-appistorihtml)
   - 4.10 [Profil (`app/profile.html`)](#410-profil-appprofilehtml)
   - 4.11 [Cont & administrare (`app/admin.html`)](#411-cont--administrare-appadminhtml)
   - 4.12 [Confidențialitate (`privacy.html`)](#412-confidențialitate-privacyhtml)
5. [Sistem de autentificare](#5-sistem-de-autentificare)
6. [Backend — server.js](#6-backend--serverjs)
7. [Baza de date](#7-baza-de-date)
8. [Sistem de clasă virtuală](#8-sistem-de-clasă-virtuală)
9. [Sistem de insigne (badges)](#9-sistem-de-insigne-badges)
10. [PWA — aplicație instalabilă](#10-pwa--aplicație-instalabilă)
11. [Sistem de design v2](#11-sistem-de-design-v2)
12. [Componente globale](#12-componente-globale)
13. [Filtrare profanity](#13-filtrare-profanity)

---

## 1. Prezentare generală

**Atomify** este o platformă educațională web pentru elevii de liceu, orientată pe chimie și matematică. Filozofia platformei: nu o colecție de lecții pasive, ci un **laborator de lucru** cu instrumente interactive.

### Ce oferă

| Modul | Tip | Autentificare necesară |
|---|---|---|
| Generator de izomeri organici | Calculator | Nu (dar istoricul se salvează) |
| Echilibrare ecuații chimice | Calculator | Nu |
| Masă molară | Calculator | Nu |
| Calcule chimice (cristalizare) | Calculator | Nu |
| Biologie — ADN/ARN | Calculator | Nu |
| Chestionare BAC | Evaluare | Da |
| Clasament global/național/clasă | Comunitate | Da |
| Istoric personal | Jurnal | Da |
| Profil + insigne | Gamificare | Da |
| Cont + clase virtuale | Administrare | Da |

### Recunoașteri 2025

- **Iunie 2025** — Salonul Internațional al Invenției și Antreprenoriatului Inovator · Universitatea Pedagogică de Stat „Ion Creangă" · Chișinău · Categoria *Tinerii Inventatori*
- **August 2025** — Olimpiada Națională de Inovare și Creație Digitală *InfoEducație* · Etapa națională · Secțiunea Software educațional · Guvernul României & Ministerul Educației
- **August 2025** — Premiu *InfoEducație* · Uniunea Profesorilor de Informatică din România (UPIR)

---

## 2. Stivă tehnologică

### Backend
| Componentă | Tehnologie |
|---|---|
| Runtime | Node.js |
| Framework HTTP | Express |
| Baze de date | SQLite 3 (fișiere `users.db`, `sessions.db`) |
| Autentificare sesiuni | express-session + connect-sqlite3 |
| Autentificare Google | Passport.js + passport-google-oauth20 |
| Hash parole | bcrypt |
| Email notificări | nodemailer |
| Generator izomeri | MAYGEN-1.8.jar (Java, apelat via `child_process.spawn`) |
| Process manager | PM2 (`ecosystem.config.js`) |

### Frontend
| Componentă | Tehnologie |
|---|---|
| Markup | HTML5 vanilla |
| Stilizare | CSS3 vanilla (sistem de design propriu v2) |
| Interactivitate | JavaScript ES6+ vanilla, fără framework |
| Vizualizare moleculară | SmilesDrawer (lazy-load) |
| Formule matematice | MathJax 3 (LaTeX) |
| Export PDF | html2canvas + jsPDF (lazy-load) |
| PWA | Service Worker + Web App Manifest |

### Infrastructură
- Server: Linux (Constanța, România)
- Domeniu: `atomify.info`
- HTTPS obligatoriu în producție (via Nginx/proxy)

---

## 3. Structura fișierelor

```
/var/www/Atomify/v2/
├── index.html                  # Landing page (pagina publică principală)
├── privacy.html                # Politica de confidențialitate (rădăcină)
├── styles.css                  # CSS pentru landing page
├── server.js                   # Serverul Express (backend complet)
├── ecosystem.config.js         # Configurație PM2
├── quiz-data.js                # Datele chestionarelor (întrebări + răspunsuri)
├── MAYGEN-1.8.jar              # Generator izomeri organici (Java)
├── users.db                    # Baza de date SQLite (utilizatori, scoruri etc.)
├── sessions.db                 # Baza de date sesiuni
├── .env                        # Variabile de mediu (Google OAuth keys, etc.)
├── init_badges_db.js           # Script inițializare insigne
├── init_elements_db.js         # Script inițializare elemente chimice
├── init_profanity_db.js        # Script inițializare filtrare profanity
├── landing-tutorial.js         # Tutorial landing page
├── start.sh                    # Script de pornire server
├── *.smi/                      # Fișiere SMILES pre-generate (C4H10, C5H12, etc.)
│   └── *.smi
│
└── app/                        # Aplicația principală (toate paginile funcționale)
    ├── auth.js                 # Modul autentificare (window.AtomifyAuth)
    ├── navbar.js               # Navbar dinamic, partajat de toate paginile
    ├── navbar.css              # Stiluri navbar
    ├── style.css               # Stiluri vechi (compatibilitate)
    ├── pwa.js                  # Logică instalare PWA (prompt install)
    ├── sw.js                   # Service Worker (cache offline)
    ├── manifest.json           # Web App Manifest (PWA)
    ├── logo-theme-switcher.js  # Comutator temă luminos/întunecat
    ├── google-translate.js     # Integrare Google Translate
    ├── tutorial.js             # Sistem tutorial onboarding
    ├── logo.png                # Logo implicit
    ├── logo_light.png          # Logo pentru temă deschisă
    ├── logo_dark.png           # Logo pentru temă închisă
    │
    ├── isomers.html            # Pagina generator izomeri
    ├── equations.html          # Pagina echilibrare ecuații
    ├── masa.html               # Pagina masă molară
    ├── calcule.html            # Pagina calcule chimice (cristalizare)
    ├── bio.html                # Pagina biologie ADN/ARN
    ├── chestionare.html        # Pagina chestionare BAC
    ├── leaderboard.html        # Pagina clasament
    ├── istoric.html            # Pagina istoric personal
    ├── profile.html            # Pagina profil + insigne
    ├── admin.html              # Pagina cont & administrare clase
    ├── privacy.html            # Politica de confidențialitate (in-app)
    │
    └── v2/                     # Sistemul de design v2
        ├── core.css            # Reset, tipografie, variabile CSS, spațiere
        ├── components.css      # Componente reutilizabile (butoane, carduri, etc.)
        ├── chrome.css          # Navbar, footer, auth modal, structuri globale
        ├── shared.js           # Logică autentificare shared (modal login/register)
        └── pages/              # JS + CSS specific fiecărei pagini
            ├── isomers.js / isomers.css
            ├── equations.js / equations.css
            ├── masa.js / masa.css
            ├── calcule.js / calcule.css
            ├── bio.js / bio.css
            ├── chestionare.js / chestionare.css
            ├── leaderboard.js / leaderboard.css
            ├── istoric.js / istoric.css
            ├── profile.js / profile.css
            └── admin.js / admin.css
```

---

## 4. Pagini — detalii complete

### 4.1 Landing Page (`index.html`)

**URL**: `/` sau `https://atomify.info`

Pagina publică principală. Designul este inspirat din jurnalism tipărit — estetică de „jurnal de laborator", cu secțiuni numerotate, tipografie Fraunces/JetBrains Mono și paletă neutră (crem, verde, auriu).

#### Secțiuni

**Navbar**
- Rail superior cu text defilant (ediție, an, distincții)
- Logo Atomify + nr. ediție
- Meniu cu linkuri numbered: 00 Acasă · 01 Distincții · 02 Platformă · 03 Echipă · 04 Despre
- Buton CTA „Intră în Atomify" → `app/isomers.html`
- Mobile: hamburger toggle cu animație

**00 · Hero (`#home`)**
- Hero bar cu formule chimice decorative (C₆H₆, H₂O, CH₄, Au₇₉)
- Titlu principal: „Chimia și matematica, ca discipline de cercetare"
- Lead text descriptiv al platformei
- Byline cu distincțiile 2025
- Butoane: „Deschide platforma" + „Vezi distincțiile"
- Aside: Medalion SVG animat (Au, lauri, panglică) cu lista distincțiilor

**01 · Distincții (`#award`)**
- Secțiune detaliată cu toate cele 3 distincții
- Citat/blockquote cu descriere completă a recunoașterilor
- DL (definition list) cu datele, organizatorii și categoriile fiecărei distincții
- Medalion SVG duplicat pentru vizualizare

**02 · Platformă (`#features`)**
- 6 articole de tip „feature-row" cu numerotare 02.01–02.06:
  1. Generator de izomeri organici
  2. Calculatoare specializate
  3. Clase virtuale
  4. Chestionare interactive
  5. Clasamente & insigne
  6. Aplicație pe orice ecran (PWA)

**03 · Echipă (`#founders`)**
- Grid cu 2 carduri founder:
  - **Zevri Matei Tudor**: conținut & cercetare chimie; olimpicul de chimie
  - **Siret Luca Alexandru**: arhitectură & dezvoltare; matematică & informatică

**04 · Despre (`#about`)**
- Manifest al platformei: „mai mult decât un manual digital"
- 3 caracteristici: Origine olimpică · Distincții independente · Disponibilă oriunde
- 3 stat-carduri animate: 3 distincții · 6 module · Carbon (C)
  - Animație counter (ease cubic) declanșată de IntersectionObserver

**CTA**
- Secțiune simplă: „Intră în Atomify. Studiază cum trebuie."
- Buton „Începe gratuit"

**Footer**
- 4 coloane: Brand+descriere · Platformă · Despre · Contact
- Email: atomify66@gmail.com
- Colophon: „Tipărit cu cerneală verde · de doi liceeni"

#### Script inline
- Toggle meniu mobil
- Smooth scroll pe ancorele din navbar
- Counter animation cu requestAnimationFrame
- IntersectionObserver pentru reveal animat al elementelor + trigger counter

---

### 4.2 Generator de izomeri (`app/isomers.html`)

**URL**: `/app/isomers.html`  
**Auth**: Nu (dar istoria se salvează dacă ești autentificat)

Pagina principală a aplicației. Generează toți izomerii structurali ai unei formule moleculare organice.

#### Funcționare tehnică

1. Utilizatorul introduce formula (ex: `C4H10`)
2. Frontend trimite `POST /api/isomers` cu `{ formula }` 
3. Serverul invocă `java -jar MAYGEN-1.8.jar` cu formula ca argument
4. MAYGEN generează toate structurile SMILES și le returnează
5. Frontend lazy-load SmilesDrawer și desenează fiecare structură pe `<canvas>`
6. Istoria se salvează în `user_isomers` dacă userul e autentificat

#### Secțiuni HTML

**Masthead**: „Izomeri organici. · Structuri · 2D · SMILES · export PDF"

**Secțiunea 01 — Input**
- Input text pentru formulă moleculară
- Butoane: „Generează" + „Formulă aleatoare"
- Hint cu exemple: C₄H₁₀ · C₅H₁₂ · C₄H₁₀O
- `#result` — containerul unde se injectează rezultatele

**Secțiunea 02 — Formule clasice**
- Grid de carduri pentru formule pre-definite cu numărul de izomeri și nivelul (simplu/mediu/avansat):

| Formulă | Compus | Nr. izomeri | Nivel |
|---|---|---|---|
| C₄H₁₀ | Butan | 2 | simplu |
| C₅H₁₂ | Pentan | 3 | simplu |
| C₄H₈ | Butenă | 3 | simplu |
| C₆H₁₄ | Hexan | 5 | mediu |
| C₄H₁₀O | Butanol | 4 | mediu |
| C₇H₁₆ | Heptan | 9 | mediu |
| C₈H₁₈ | Octan | 18 | avansat |
| C₄H₈O₂ | Acid butiric | — | avansat |

#### Funcții JS (`v2/pages/isomers.js`)

- `ensureSmilesDrawer()` — lazy-load SmilesDrawer de pe CDN (unpkg)
- `ensurePdfLibs()` — lazy-load html2canvas + jsPDF pentru export
- `isMobile()` — detectare mobil pentru limitarea numărului de structuri afișate
- Submit form → `fetch('/api/isomers', { method: 'POST' })` → parse SMILES array → render fiecare structură
- Export PDF: capturează canvas-urile cu html2canvas, compune PDF cu jsPDF

#### Fișiere SMILES pre-generate
Directoarele `c4h10.smi/`, `c5h12.smi/`, etc. conțin fișiere `.smi` cu SMILES pre-generate pentru formulele uzuale — pot fi servite direct fără a porni MAYGEN.

---

### 4.3 Echilibrare ecuații (`app/equations.html`)

**URL**: `/app/equations.html`  
**Auth**: Nu

Echilibrează automat ecuațiile chimice și afișează coeficienții stoechiometrici.

#### Funcționare

1. Utilizatorul introduce ecuația (ex: `Ca(OH)2 + HCl → CaCl2 + H2O`)
2. Separatoarele acceptate: `->`, `→`, `=`
3. Algoritmul de echilibrare (implementat în JS) găsește coeficienții întregi minimi
4. Rezultatul afișează ecuația echilibrată cu formatare subscript automată
5. Buton de copiere în clipboard cu feedback toast

#### Secțiuni HTML

**Masthead**: „Reacții echilibrate. · Lege · Lavoisier · Coeficienți · ℕ"

**Secțiunea 01 — Input**
- Input cu placeholder `Ca(OH)2 + HCl → CaCl2 + H2O`
- Buton „Exemplu aleator"
- Hint separator: `->` sau `→` sau `=`

**Secțiunea 02 — Reacții clasice**
- 6 exemple predefinite cu buton de load direct în calculator:

| Nr. | Tip | Reacție |
|---|---|---|
| 01 | Sinteză | H₂ + O₂ → H₂O (formarea apei) |
| 02 | Ardere | CH₄ + O₂ → CO₂ + H₂O (metanul) |
| 03 | Neutralizare | Ca(OH)₂ + HCl → CaCl₂ + H₂O |
| 04 | Substituție | Al + CuSO₄ → Al₂(SO₄)₃ + Cu |
| 05 | Ardere | C₂H₆ + O₂ → CO₂ + H₂O (etanul) |
| 06 | Oxidare | Fe + O₂ → Fe₂O₃ (ruginirea) |

#### Componente speciale
- Toast `#eqToast` pentru feedback copiere (aria-live polite)

---

### 4.4 Masă molară (`app/masa.html`)

**URL**: `/app/masa.html`  
**Auth**: Nu

Calculează masa molară a oricărei formule chimice, bazat pe masele atomice ale celor 118 elemente.

#### Funcționare

1. Utilizatorul introduce formula (ex: `C2H5OH`, `Ca(OH)2`, `Mg(NO3)2`)
2. Parserul JS procesează formula (cu suport pentru paranteze imbricate)
3. Se calculează masa molară sumând masele atomice × stoichiometrie
4. Rezultatul afișează masa totală și defalcarea pe elemente (contribuție procentuală)

#### Secțiuni HTML

**Masthead**: „Masă molară. · SI · g·mol⁻¹ · 118 elemente"

**Secțiunea 01 — Input**
- Input text cu placeholder `C2H5OH, Ca(OH)2, Mg(NO3)2…`
- Buton „Specimen aleator"

**Secțiunea 02 — Specimene uzuale**
- Grid de 12 compuși frecvenți:

| Nr. | Compus | Formulă |
|---|---|---|
| 01 | Apă | H₂O |
| 02 | Sare | NaCl |
| 03 | Glucoză | C₆H₁₂O₆ |
| 04 | Calcar | CaCO₃ |
| 05 | Etanol | C₂H₅OH |
| 06 | Var stins | Ca(OH)₂ |
| 07 | Acid sulfuric | H₂SO₄ |
| 08 | Octan | C₈H₁₈ |
| 09 | Amoniac | NH₃ |
| 10 | Halogenat | C₆H₁₀Cl₂ |
| 11 | Nitrat | Mg(NO₃)₂ |
| 12 | Zaharoză | C₁₂H₂₂O₁₁ |

---

### 4.5 Calcule chimice — cristalizare (`app/calcule.html`)

**URL**: `/app/calcule.html`  
**Auth**: Nu

7 modele matematice pentru cinetica și termodinamica cristalizării. Toate formulele sunt redate cu MathJax (LaTeX).

#### Navigare internă (TOC)

```
01 · Nucleație
02 · Creștere
03 · Avrami
04 · Supersaturație
05 · van't Hoff
06 · Re · Pe · Ri
07 · Navier–Stokes
```

#### Detalii pe secțiuni

**01 — Rata de nucleație clasică (CNT)**
- Formula: J = A · exp(−ΔG*/k_B T)  
- Bariera energetică: ΔG* = 16πσ³ / 3(ΔGᵥ)²  
- Raza critică: r_c = 2σ/ΔGᵥ  
- **5 parametri de input**: σ (tensiune superficială, J/m²), T (K), S (supersaturație), V_m (m³/mol), A (factor pre-exponențial)  
- Output: rata J, raza critică r_c, bariera ΔG*

**02 — Rata de creștere (difuzie vs. suprafață)**
- G_diff = k_d·(S−1), G_surf = k_r·(S−1)  
- **3 parametri**: S, k_d, k_r  
- Output: ambele rate de creștere comparate

**03 — Ecuația Avrami/JMAK**
- Y(t) = 1 − exp[−K·tⁿ]  
- **3 obligatorii + 5 opționale** pentru estimarea diametrului mediu:
  - Obligatorii: n (exponent Avrami), K (constantă de rată), t (timp)
  - Opționale: C₀, C*, V, N, ρₛ
- Output: fracția cristalizată Y, diametrul mediu (dacă datele opționale sunt furnizate)

**04 — Raport de supersaturație**
- S = C / C*  
- **2 parametri**: C (concentrație actuală), C* (solubilitate echilibru)

**05 — Ecuația van't Hoff**
- ln(C₂/C₁) = −(ΔH_sol/R)(1/T₂ − 1/T₁)  
- R = 8.314 J/(mol·K)  
- **4 parametri**: T₁, C₁, T₂, ΔH_sol  
- Output: solubilitatea C₂ la temperatura T₂

**06 — Numere adimensionale**
- Re = ρvL/μ (Reynolds: inerție vs. vâscozitate)  
- Pe = vL/D (Péclet: advecție vs. difuzie)  
- Ri = g·(Δρ/ρ)·L/v² (Richardson: flotabilitate vs. forfecare)  
- **7 parametri (2 opționali)**: ρ₁, ρ₂ (opțional), v, L, μ, D, g

**07 — Regimul de curgere (Navier–Stokes)**
- Secțiune informativă (fără calculator interactiv)
- Ecuație completă Navier–Stokes pentru curgere incompresibilă
- 3 regimuri explicate: Re mic (Stokes/laminare), Re mare (Euler/turbulent), Ri mare (flotabilitate)

#### Interacțiune
- Fiecare calculator are buton „Calculează" + hint „ENTER · execută"
- Rezultatele se afișează în `<div class="calc-output">` sub fiecare panou
- MathJax randează toate formulele LaTeX inline și display

---

### 4.6 Biologie — ADN/ARN (`app/bio.html`)

**URL**: `/app/bio.html`  
**Auth**: Nu

Calculator pentru secvențe de acizi nucleici. Transformă o secvență ADN în: lanț complementar, ARNm transcris și statistici nucleotidice.

#### Funcționare

1. Utilizatorul introduce o secvență ADN (A/T/G/C), până la 5000 caractere
2. Spațiile și liniile noi sunt ignorate automat
3. Se calculează:
   - **Lanțul complementar ADN**: A↔T, G↔C
   - **ARNm transcris** (mRNA): T→U (thymine → uracil)
   - **Compoziție nucleotidică**: număr și procent A/T/G/C
4. Scurtătură keyboard: Ctrl+Enter pentru a transcrie

#### Secțiuni HTML

**Masthead**: „Acizi nucleici. · ADN · ARN · 4 baze · A T G C"

**Secțiunea 01 — Input**
- `<textarea>` cu maxlength="5000"
- Alfabet afișat cu culori distincte per nucleotidă (A/T/G/C)
- Buton „Secvență aleatoare"
- Buton „Transcrie"

**Secțiunea 02 — Secvențe de referință**
- Grid de secvențe genomice comune (motive uzuale), dinamice via JS

#### Toast
- `#bioToast` pentru feedback copiere secvențe (aria-live polite)

---

### 4.7 Chestionare BAC (`app/chestionare.html`)

**URL**: `/app/chestionare.html`  
**Auth**: **Obligatorie**

Sistem de testare pentru pregătirea examenului de bacalaureat la chimie. Chestionarele sunt cronometrate, cu feedback imediat și stocare scoruri.

#### Flow utilizator

1. **Neautentificat**: se afișează secțiunea `#quizAuthRequired` cu buton de login
2. **Autentificat**: se afișează biblioteca de chestionare disponibile
3. Utilizatorul selectează un chestionar → se pornește sesiunea activă
4. Navigare liberă între întrebări via dots + butoane Înapoi/Înainte
5. La final: buton „Finalizează testul" → dialog de confirmare → submit
6. Scorul se salvează în baza de date și apare în clasament + istoric

#### Structura UI

**Biblioteca (`#quizLibraryView`)**
- Grid de carduri pentru fiecare chestionar disponibil
- Cardurile afișează: nume, număr întrebări, limită de timp
- Quizurile de clasă (homework assignments) apar separat dacă userul e într-o clasă

**Sesiunea activă (`#quizSessionView`)**
- **Header**: Titlu quiz · Timer countdown · Counter răspunsuri (X/Total)
- **Progress bar** animat
- **Dots navigation**: punct per întrebare, colorat după status (neresolvată/răspunsă)
- **Quiz body**: Întrebarea curentă (cu MathJax pentru formule chimice/matematice), 4 variante de răspuns
- **Feedback**: se afișează după selectarea unui răspuns (corect/greșit + explicație)
- **Nav**: Înapoi · Finalizează testul · Înainte

**Dialog confirmare (`#quizConfirm`)**
- Afișează câte întrebări sunt fără răspuns
- Butoane: Anulează / Da, trimite

**Rezultate (`#quizResultsView`)**
- Scor final, procent, timp
- Posibilitate de review a răspunsurilor

#### Date quiz (`quiz-data.js`)
Fișierul conține toate întrebările, variantele de răspuns și răspunsurile corecte. Randomizare per sesiune/utilizator pentru a preveni copiatul.

#### API endpoints folosite
- `GET /api/quizzes` — lista chestionarelor disponibile
- `POST /api/quiz/submit` — trimite scorurile
- `GET /api/homework` — tema de acasă asignată (dacă e în clasă)

---

### 4.8 Clasament (`app/leaderboard.html`)

**URL**: `/app/leaderboard.html`  
**Auth**: **Obligatorie**

Clasamente naționale per chestionar, cu podium animat pentru primele 3 locuri.

#### Structura UI

**Neautentificat**: Secțiunea `#lbAuthRequired` cu buton login

**Autentificat**:

**Secțiunea 01 — Statisticile tale**
- Agregat personal: nr. chestionare completate, scor mediu, cel mai bun scor, rang global
- Afișate în `#lbStats`

**Secțiunea 02 — Clasament**

*Filtre*:
- **Dropdown chestionar** (`#lbQuizSelect`): „Toate chestionarele" sau un chestionar specific
- **Dropdown clasă** (`#lbClassFilter`): vizibil doar dacă există tab-ul „Clasă"

*Tabs*:
- **Global** — toți utilizatorii de pe platformă
- **Național** — grupat pe țară (bazat pe profil)
- **Clasă** — vizibil doar dacă userul face parte dintr-o clasă virtuală

*Podium* (`#lbPodium`): animat pentru locurile 1, 2, 3 cu înălțimi diferite

*Tabel* (`#lbTable`): rang · avatar · username · scor · procent · timp

#### API endpoints
- `GET /api/leaderboard?quiz=...&scope=global|national|class&classId=...`
- `GET /api/user/stats`

---

### 4.9 Istoric personal (`app/istoric.html`)

**URL**: `/app/istoric.html`  
**Auth**: **Obligatorie**

Jurnalul cronologic complet al activității utilizatorului pe platformă.

#### Structura UI

**Neautentificat**: `#histAuthRequired` cu buton login

**Autentificat**:

**Secțiunea 01 — Activitatea ta**
- 4 stat-carduri în `#histStats`:
  - Izomeri generați (total)
  - Chestionare completate (total)
  - Scor mediu (%)
  - Streak curent (zile consecutive)

**Secțiunea 02 — Jurnal cronologic**

*Tabs filter*:
- **Tot** — toate activitățile combinate
- **Izomeri** — doar generările de izomeri
- **Chestionare** — doar sesiunile de quiz

*Cele mai bune scoruri* (`#histBest`): carduri per quiz cu scorul maxim obținut

*Cronologie* (`#histTimeline`): lista inversă cronologică cu:
- **Izomeri**: formula, numărul de izomeri generați, timestamp
- **Chestionare**: quiz name, scor, procent, timp, timestamp

#### API endpoints
- `GET /api/history` — returnează combined history (izomeri + quizuri)
- `GET /api/history/best` — cele mai bune scoruri per quiz

---

### 4.10 Profil (`app/profile.html`)

**URL**: `/app/profile.html`  
**Auth**: **Obligatorie**

Pagina de profil cu identitate, statistici cumulate și insigne câștigate.

#### Structura UI

**Secțiunea 01 — Identitate**
- Avatar (inițiala username-ului)
- Nume utilizator
- Tag-uri: rol (student/profesor), date membre
- Meta: data alăturării, email (parțial mascat)

**Secțiunea 02 — Statistici**
- Cards cu metrici: izomeri generați, quizuri completate, scor mediu, zile active, streak maxim

**Secțiunea 03 — Insigne**
- Grid cu toate insignele disponibile pe platformă
- Insignele câștigate sunt evidențiate; cele neobținute sunt „greyed out"
- Fiecare insignă afișează: icon emoji, nume, descriere, raritate, puncte

#### API endpoints
- `GET /api/profile` — datele profilului + statistici
- `GET /api/badges` — toate insignele + statusul câștigat/necâștigat

---

### 4.11 Cont & administrare (`app/admin.html`)

**URL**: `/app/admin.html`  
**Auth**: **Obligatorie**

Panoul de gestionare a contului. Conținutul variază în funcție de rol.

#### Flow la prima accesare (fără rol)

Se afișează **Secțiunea 02 — Alege-ți rolul**:
- **Student**: se poate alătura claselor prin invitație de la profesor
- **Profesor**: poate crea clase, invita studenți, asigna teme

#### Secțiuni pentru toți utilizatorii

**Secțiunea 01 — Identitate**
- Avatar, username, tags de rol
- Quick stats relevante rolului

#### Secțiuni specifice rolului STUDENT

**Clasele mele**
- Lista claselor din care face parte
- Invitații pendinte (Accept/Respinge)
- Temele de acasă per clasă cu deadline și status (completată/necompletată)
- Buton „Rezolvă" pentru a naviga la chestionar cu homework context

#### Secțiuni specifice rolului PROFESOR

**Clasele mele (profesor)**
- Lista claselor create
- Buton „Creează o clasă nouă"
- Per clasă: număr studenți, data creării

**Invitație studenți**
- Input username student → trimite invitație
- Lista studenților pendienți/acceptați per clasă

**Teme de casă**
- Creează o nouă temă: selectezi clasa, chestionarul, deadline-ul, numărul max de încercări
- Lista temelor create cu statut (active/expirate)
- Vizualizare submisii per temă: student, scor, timp, data

**Chestionare de clasă (custom)**
- Creare quiz custom cu întrebări proprii (JSON editor)
- Atribuire quiz personalizat ca temă

#### Setări cont (comun)
- Schimbare parolă
- Preferințe email (notificări homework, quiz, grade, general, newsletter)
- Ștergere cont

#### API endpoints cheie
- `POST /api/set-role` — setare rol (student/profesor)
- `POST /api/classes` — creare clasă
- `POST /api/classes/:id/invite` — invitare student
- `PUT /api/invitations/:id` — accept/respingere invitație
- `POST /api/homework` — creare temă
- `GET /api/homework/submissions/:id` — submisii temă

---

### 4.12 Confidențialitate (`privacy.html`)

**URL**: `/privacy.html` (și `/app/privacy.html`)  
**Auth**: Nu

Politica de confidențialitate a platformei. Disponibilă atât din landing page cât și din footer-ul aplicației interne.

---

## 5. Sistem de autentificare

### `app/auth.js` — `window.AtomifyAuth`

Modul IIFE (Immediately Invoked Function Expression) care constituie sursa unică de adevăr pentru starea de autentificare.

#### API public

```javascript
window.AtomifyAuth = {
  user,          // Obiectul user curent sau null
  isAuthed(),    // boolean
  refresh(),     // re-fetch /user, actualizează starea, emite event. Returnează Promise<user>
  logout(),      // POST /logout, setează user=null, emite event
  onChange(fn),  // Abonare; fn(user) e apelat imediat + la fiecare schimbare. Returnează unsub fn
}
```

#### Eveniment custom
```javascript
window.dispatchEvent(new CustomEvent('atomify:auth-changed', { detail: { user } }));
```

#### Funcționalități cheie

**Coalescing refresh**: multiple apeluri simultane la `refresh()` comasate într-un singur fetch `/user`

**Fetch interceptor**: `window.fetch` e suprascris — orice request la `/login`, `/logout`, `/register` declanșează automat un `refresh()` cu delay 30ms (după răspuns OK)

**Lifecycle hooks**:
- `document.visibilitychange` → refresh la întoarcerea în tab
- `window.focus` → refresh la refocusarea ferestrei
- `window.pageshow` cu `e.persisted` → refresh la restaurare din bfcache

**Compatibilitate legacy**: sincronizează `window.currentUser` pentru codul vechi

#### Metode de autentificare

**Email/parolă** (prin formular local):
- `POST /register` — înregistrare cu username, parolă (validată: min 8 caractere, 1 majusculă, 1 cifră), confirmare parolă
- `POST /login` — autentificare cu username/parolă
- `POST /logout` — deconectare

**Google OAuth**:
- `GET /auth/google` → redirecționare Google
- `GET /auth/google/callback` → callback procesare
- Callback URL fix: `https://atomify.info/auth/google/callback`
- La cont nou via Google: inițializare automată user_stats și email_preferences

#### Validare parolă (client-side)
```
✓ Cel puțin 8 caractere
✓ Cel puțin o literă mare (A-Z)
✓ Cel puțin o cifră (0-9)
```
Feedback live pe `requirement` divs cu clase `met`/`not-met`.

---

## 6. Backend — server.js

Server Express complet cu ~1500+ linii. Gestionează toate endpoint-urile API, autentificarea, generarea izomerilor și logica de business.

### Middleware

```javascript
app.use(cors());
app.use(express.json());
app.use(session({
  store: new SQLiteStore({ db: "sessions.db" }),
  secret: "...",
  cookie: { maxAge: 86400000 } // 1 zi
}));
app.use(passport.initialize());
app.use(passport.session());
```

### Middleware autentificare
```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
```

### Endpoint-uri principale

#### Auth
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/user` | Returnează user-ul curent din sesiune |
| POST | `/login` | Login cu username/parolă; validare bcrypt |
| POST | `/register` | Înregistrare; hash bcrypt; filtru profanity username |
| POST | `/logout` | Distruge sesiunea |
| GET | `/auth/google` | Inițiază OAuth Google |
| GET | `/auth/google/callback` | Callback OAuth Google |

#### Izomeri
| Metodă | Path | Descriere |
|---|---|---|
| POST | `/api/isomers` | Generează izomeri via MAYGEN JAR; salvează în user_isomers |
| GET | `/api/isomers/history` | Istoricul generărilor utilizatorului |

#### Chestionare
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/api/quizzes` | Lista chestionarelor disponibile |
| POST | `/api/quiz/submit` | Submit rezultat quiz; actualizează stats; verifică insigne |
| GET | `/api/quiz/results` | Rezultatele utilizatorului |

#### Clasament
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/api/leaderboard` | Query params: `quiz`, `scope`, `classId` |

#### Clase virtuale
| Metodă | Path | Descriere |
|---|---|---|
| POST | `/api/classes` | Creare clasă (profesor) |
| GET | `/api/classes` | Lista claselor utilizatorului |
| POST | `/api/classes/:id/invite` | Invitare student |
| GET | `/api/invitations` | Invitații primite |
| PUT | `/api/invitations/:id` | Accept/respingere invitație |
| GET | `/api/classes/:id/members` | Membrii clasei |

#### Teme
| Metodă | Path | Descriere |
|---|---|---|
| POST | `/api/homework` | Creare temă (profesor) |
| GET | `/api/homework` | Temele utilizatorului |
| POST | `/api/homework/:id/submit` | Submit temă rezolvată |
| GET | `/api/homework/submissions/:id` | Submisii per temă |

#### Insigne
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/api/badges` | Toate insignele + statusul user-ului |
| GET | `/api/notifications` | Notificări insigne câștigate |
| PUT | `/api/notifications/:id/read` | Marchează notificare ca citită |

#### Profil & setări
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/api/profile` | Date profil + statistici |
| GET | `/api/history` | Istoric combinat |
| POST | `/api/set-role` | Setare rol (student/profesor) |
| PUT | `/api/email-preferences` | Actualizare preferințe email |
| DELETE | `/api/account` | Ștergere cont |

#### Elemente chimice
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/api/elements` | Toate elementele din tabelul periodic |
| GET | `/api/elements/:symbol` | Element specific |

### Generare izomeri (MAYGEN)

```javascript
const proc = spawn('java', ['-jar', 'MAYGEN-1.8.jar', '-f', formula, '-smi']);
// Colectează stdout (SMILES, unul per linie)
// Timeout dacă formula e prea complexă
// Dacă user e autentificat, salvează în user_isomers
```

---

## 7. Baza de date

Două fișiere SQLite: `users.db` (date) și `sessions.db` (sesiuni Express).

### Tabele principale în `users.db`

#### `users`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
username TEXT UNIQUE
password TEXT              -- bcrypt hash (NULL pentru conturi Google)
email TEXT UNIQUE
google_id TEXT UNIQUE      -- ID Google OAuth
role TEXT                  -- NULL | 'student' | 'profesor'
created_at DATETIME
```

#### `user_isomers`
```sql
id, user_id → users, formula TEXT, isomer_count INTEGER, generated_at DATETIME
```

#### `quiz_results`
```sql
id, user_id, quiz_id TEXT, quiz_name TEXT,
score INTEGER, total_questions INTEGER, percentage REAL,
time_taken INTEGER (secunde),
class_id → classes (NULL dacă nu e homework),
classroom_quiz_id → classroom_quizzes,
completed_at DATETIME
```

#### `classes`
```sql
id, name TEXT, description TEXT, professor_id → users, created_at DATETIME
```

#### `homework_assignments`
```sql
id, class_id, professor_id, title TEXT, description TEXT,
quiz_id TEXT, quiz_name TEXT, due_date DATETIME,
max_attempts INTEGER DEFAULT 1, created_at DATETIME
```

#### `homework_submissions`
```sql
id, homework_id, user_id, quiz_id, score, total_questions,
percentage, time_taken, attempt_number, answers TEXT (JSON), submitted_at
```

#### `badges`
```sql
id, name TEXT UNIQUE, description TEXT, icon TEXT,
category TEXT, requirement_type TEXT, requirement_value INTEGER,
points INTEGER, rarity TEXT ('common'|'rare'|'epic'|'legendary'), created_at
```

#### `user_badges`
```sql
id, user_id, badge_id, earned_at, progress_when_earned
UNIQUE(user_id, badge_id)
```

#### `user_stats`
```sql
id, user_id UNIQUE, isomers_generated, quizzes_completed,
quizzes_perfect, total_quiz_score, total_quiz_questions,
current_streak, longest_streak, last_activity_date,
days_active, total_study_time, favorite_subject, account_created
```

#### `badge_progress`
```sql
id, user_id, badge_id, current_progress, updated_at
UNIQUE(user_id, badge_id)
```

#### `classroom_quizzes`
```sql
id, class_id, professor_id, title TEXT, description TEXT,
time_limit INTEGER DEFAULT 600 (secunde),
questions TEXT (JSON), created_at, updated_at, is_active BOOLEAN
```

#### `class_invitations`
```sql
id, class_id, student_id, professor_id,
status TEXT DEFAULT 'pending', created_at, responded_at
```

#### `class_members`
```sql
id, class_id, student_id, joined_at
UNIQUE(class_id, student_id)
```

#### `notifications`
```sql
id, user_id, type TEXT, badge_id, read BOOLEAN DEFAULT 0, created_at
```

#### `email_preferences`
```sql
id, user_id UNIQUE,
email_homework_notifications BOOLEAN DEFAULT 1,
email_quiz_notifications BOOLEAN DEFAULT 1,
email_grade_notifications BOOLEAN DEFAULT 1,
email_general_notifications BOOLEAN DEFAULT 1,
newsletter_subscription BOOLEAN DEFAULT 0,
newsletter_email TEXT, created_at, updated_at
```

#### `profanity_words`
```sql
id, word TEXT UNIQUE, normalized_word TEXT, severity INTEGER,
category TEXT, is_active BOOLEAN, added_at, added_by → users
```

#### `chemical_elements`
```sql
id, symbol TEXT UNIQUE, name_ro TEXT, name_en TEXT,
atomic_mass REAL, atomic_number INTEGER, created_at, updated_at
```

---

## 8. Sistem de clasă virtuală

### Fluxul complet profesor → student

```
1. Profesorul creează o clasă (POST /api/classes)
2. Profesorul invită studentul după username (POST /api/classes/:id/invite)
   → Se inserează în class_invitations (status: 'pending')
   → Se trimite notificare email (dacă activat)
3. Studentul vede invitația pe pagina Cont (GET /api/invitations)
4. Studentul acceptă (PUT /api/invitations/:id {action: 'accept'})
   → status → 'accepted'
   → Se inserează în class_members
5. Profesorul atribuie o temă (POST /api/homework)
   → quiz_id + due_date + max_attempts
6. Studentul vede tema pe pagina Cont + pe pagina Chestionare
7. Studentul rezolvă quizul în contextul homework-ului
   → POST /api/homework/:id/submit cu răspunsurile
   → Salvat în homework_submissions
8. Profesorul vede toate submisiile (GET /api/homework/submissions/:id)
```

### Chestionare custom (classroom_quizzes)
Profesorii pot crea quizuri complet personalizate cu întrebările lor. Întrebările sunt stocate ca JSON în câmpul `questions`.

---

## 9. Sistem de insigne (badges)

Insigne acordate automat la atingerea unor praguri de activitate.

### Categorii
- **quizzes_completed** — pentru numărul de chestionare finalizate
- **quizzes_perfect** — pentru scor 100% la chestionare
- **isomers_generated** — pentru numărul de generări izomeri
- **days_active** — pentru zile distincte de utilizare
- **current_streak** / **longest_streak** — pentru consecvență

### Rarități
| Raritate | Descriere |
|---|---|
| common | Praguri de bază |
| rare | Realizări mai dificile |
| epic | Performanțe remarcabile |
| legendary | Performanțe excepționale |

### Verificare automată
- La fiecare `POST /api/quiz/submit` serverul rulează `checkAndAwardBadges(userId)`
- Se compară `user_stats` cu `badges.requirement_value`
- Dacă pragul e atins și insigna nu e deja acordată → inserare în `user_badges` + creare `notification`

### Notificări
- Stocate în tabela `notifications`
- Frontend-ul le poll-ează (sau le primește la refresh auth)
- Marcate ca citite prin `PUT /api/notifications/:id/read`

---

## 10. PWA — aplicație instalabilă

### `app/manifest.json`
- `name`: Atomify
- `short_name`: Atomify
- `theme_color`: #1F8F5C (verde)
- `background_color`: #F5F1E8 (crem)
- `display`: standalone
- `start_url`: /app/isomers.html
- Iconițe pentru toate dimensiunile (Android, iOS, desktop)

### `app/sw.js` — Service Worker
- Cache-first pentru asset-uri statice (CSS, JS, imagini, fonturi)
- Network-first pentru API endpoints (`/api/*`, `/user`, `/login` etc.)
- Offline fallback pentru paginile HTML
- Sync la reconectare pentru acțiuni blocate offline

### `app/pwa.js` — Prompt instalare
- Interceptează `beforeinstallprompt`
- Afișează buton custom „Instalează aplicația" când platforma e eligible
- Gestionează `appinstalled` event

### Compatibilitate
| Platformă | Suport |
|---|---|
| Android (Chrome) | Instalare nativă via prompt |
| iOS (Safari) | Add to Home Screen manual |
| macOS (Safari/Chrome) | Instalare din adresa browser |
| Windows (Edge/Chrome) | Instalare din adresa browser |
| Linux (Chrome) | Instalare din adresa browser |

---

## 11. Sistem de design v2

Sistemul de design v2 folosește CSS custom properties (variabile CSS) și nu depinde de niciun framework.

### Fișiere CSS

**`v2/core.css`** — fundația:
- CSS reset
- Variabile: culori, tipografie, spațiere, border-radius, shadows
- Tipografie: Fraunces (serif, titluri), JetBrains Mono (monospace, meta/eyebrow), Inter/system (body)
- Clase utilitare: `.visually-hidden`, `.ital`, etc.
- Animații reveal: `.reveal`, `.reveal-1` ... `.reveal-5`, `.animate-in`
- Tema dark/light via `[data-theme="dark"]` pe `<html>`

**`v2/components.css`** — componente reutilizabile:
- `.btn`, `.btn-cta`, `.btn-link` — butoane
- `.field`, `.field-input`, `.field-clear` — câmpuri input
- `.chapter`, `.chapter-num`, `.chapter-body`, `.chapter-head`, `.chapter-sub` — structura de capitol
- `.masthead`, `.masthead-eyebrow`, `.masthead-title`, `.masthead-meta` — header de pagină
- `.status`, `.status--loading`, `.status--error`, `.status--empty` — stări de UI
- `.calc-panel`, `.calc-field`, `.calc-output` — componente calculator

**`v2/chrome.css`** — structuri globale:
- `.site-header`, `.page-main`, `.site-footer` — layout pagină
- `.footer-grid`, `.footer-lockup`, `.footer-col`, `.footer-bottom` — footer
- `.auth-modal`, `.auth-form`, `.auth-close`, `.google-auth-btn` — modal autentificare
- Navbar styles (renderizate de navbar.js)

### Paletă de culori (light mode)
```css
--color-bg: #F5F1E8;          /* crem - fond principal */
--color-surface: #FFFFFF;      /* alb - carduri */
--color-text: #1A1A1A;         /* aproape negru - text principal */
--color-accent: #1F8F5C;       /* verde - accent/CTA */
--color-muted: #6B6B6B;        /* gri - text secundar */
--color-border: #E0DDD6;       /* bej - borduri */
--color-gold: #D4A017;         /* auriu - distincții */
```

### Animații reveal
Elementele cu `.reveal` sunt inițial invisible (opacity: 0, transform: translateY). La `IntersectionObserver`, se adaugă `.animate-in` care face tranziția.

`.reveal-1` ... `.reveal-5` aplică delay-uri crescătoare (100ms per nivel) pentru efect staggered.

---

## 12. Componente globale

### `app/navbar.js` — Navigarea principală

Renderizează navbar-ul shared pe toate paginile interne. Fiecare pagină apelează:
```javascript
initNavbar("isomers"); // sau "chestionare", "leaderboard", etc.
```

**Structura navbar**:
- Logo Atomify cu link
- Link-uri principale cu icoane SVG:
  - Izomeri (cu dropdown: Izomeri + Bio ADN/ARN)
  - Chestionar
  - Clasament
  - Ecuații
  - Masă Atomică
  - Calcule
- User area (dacă e autentificat):
  - Avatar cu inițiala
  - Username
  - Dropdown: Profil · Istoric · Cont · Ieșire
- Buton Login (dacă nu e autentificat)
- Toggle temă dark/light (soare/lună)
- Hamburger mobile

**Auth-awareness**: Navbar ascultă `atomify:auth-changed` și se re-randează la orice schimbare de stare.

### `v2/shared.js` — Modal autentificare

Gestionează interacțiunea cu modalul login/register prezent pe fiecare pagină internă:
- Toggle între formular login și register
- Submit login → `POST /login`
- Submit register → `POST /register` (cu validare parolă)
- Butoane Google OAuth → `window.location = '/auth/google'`
- Feedback erori în `#authMessage`
- Deschidere modal la click pe orice buton `[data-open-auth]` sau trigger din pagini

### `app/logo-theme-switcher.js`
- Citește preferința din `localStorage` (key: `atomify-theme`)
- Aplică `[data-theme="dark"]` pe `<html>` 
- La switch, actualizează `localStorage` și imaginea logo-ului (logo_light.png ↔ logo_dark.png)
- Respectă `prefers-color-scheme` la prima vizită

### `app/tutorial.js`
- Sistem de onboarding cu tooltip-uri
- Apelat la prima vizită (flag în `localStorage`)
- Ghidează utilizatorul prin elementele principale ale paginii

### `app/google-translate.js`
- Integrare Google Translate pentru traducerea conținutului în alte limbi
- Widget discret, neobstructiv

### `app/pwa.js`
- Înregistrează Service Worker-ul (`/app/sw.js`)
- Gestionează prompt-ul de instalare

---

## 13. Filtrare profanity

Serverul implementează un filtru robust pentru username-uri.

### Normalizare
Înainte de comparare, textul e normalizat:
- Lowercase
- Eliminare spații, cratime, underscore
- Conversie leetspeak: `@→a`, `4→a`, `3→e`, `1/!→i`, `0→o`, `5/$→s`, `7→t`, `8→b`, `6→g`
- Eliminare caractere speciale
- Colapsare caractere repetate (`aaa→a`)

### Tipuri de matching
1. **exact** — potrivire exactă cu cuvântul normalizat
2. **substring** — cuvântul profan e conținut în textul normalizat
3. **scattered** — caracterele cuvântului profan sunt răspândite în text

### Sursa datelor
Cuvintele sunt stocate în tabela `profanity_words` cu câmpuri: `word`, `normalized_word`, `severity` (1-3), `category`, `is_active`.
Populate inițial de scriptul `init_profanity_db.js` cu lista de cuvinte românești.

### Folosit la
- Validare username la înregistrare (`POST /register`)
- Validare username nou (dacă e implementat la schimbare)

---

## Informații de contact & acces

- **Website**: https://atomify.info  
- **Email**: atomify66@gmail.com  
- **Locație server**: Constanța, România  
- **Ediție curentă**: Vol. II · 2026 · București · RO

---

*Documentație generată automat pe baza codului sursă din `/var/www/Atomify/v2/` — 19 mai 2026.*
