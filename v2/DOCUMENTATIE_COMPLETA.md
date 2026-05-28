# ATOMIFY — Documentație Completă
## Platformă educațională pentru chimie și biologie moleculară
### Versiunea v2 · atomify.info · Ultima actualizare: Mai 2026

---

> **Autori:** Siret Luca-Alexandru & Zevri Matei-Tudor  
> **Locație server:** Constanța, România  
> **Domeniu:** https://atomify.info

---

## CUPRINS

1. [Descriere generală a proiectului](#1-descriere-generală-a-proiectului)
2. [Infrastructura serverului](#2-infrastructura-serverului)
3. [Software instalat și versiuni](#3-software-instalat-și-versiuni)
4. [Arhitectura aplicației](#4-arhitectura-aplicației)
5. [Baza de date — structura completă](#5-baza-de-date--structura-completă)
6. [API-ul serverului — toate rutele](#6-api-ul-serverului--toate-rutele)
7. [Sistemul de autentificare](#7-sistemul-de-autentificare)
8. [Sistemul de email](#8-sistemul-de-email)
9. [Generatorul de izomeri (MAYGEN)](#9-generatorul-de-izomeri-maygen)
10. [Sistemul de insigne (badges)](#10-sistemul-de-insigne-badges)
11. [Filtrarea de conținut (profanity filter)](#11-filtrarea-de-conținut-profanity-filter)
12. [Fișierele CSS și sistemul de design v2](#12-fișierele-css-și-sistemul-de-design-v2)
13. [Configurația Nginx](#13-configurația-nginx)
14. [Configurația PM2](#14-configurația-pm2)
15. [Certificat SSL — Let's Encrypt](#15-certificat-ssl--lets-encrypt)
16. [Sistemul PWA (Progressive Web App)](#16-sistemul-pwa-progressive-web-app)
17. [Paginile aplicației — detalii complete](#17-paginile-aplicației--detalii-complete)
    - [index.html — Landing Page](#171-indexhtml--landing-page)
    - [isomers.html — Generator de izomeri](#172-isomershtml--generator-de-izomeri)
    - [equations.html — Echilibrare ecuații](#173-equationshtml--echilibrare-ecuații)
    - [masa.html — Masă molară](#174-masahtml--masă-molară)
    - [calcule.html — Calcule avansate (cristalizare)](#175-calculehtml--calcule-avansate-cristalizare)
    - [bio.html — Biologie moleculară ADN/ARN](#176-biohtml--biologie-moleculară-adnarn)
    - [chestionare.html — Chestionare BAC](#177-chestionarehtml--chestionare-bac)
    - [leaderboard.html — Clasament](#178-leaderboardhtml--clasament)
    - [istoric.html — Istoric personal](#179-istorichtml--istoric-personal)
    - [profile.html — Profil și insigne](#1710-profilehtml--profil-și-insigne)
    - [admin.html — Panoul contului](#1711-adminhtml--panoul-contului)
    - [privacy.html — Politica de confidențialitate](#1712-privacyhtml--politica-de-confidențialitate)
18. [Securitatea aplicației](#18-securitatea-aplicației)
19. [Fișierele JavaScript partajate](#19-fișierele-javascript-partajate)
20. [Structura directoarelor](#20-structura-directoarelor)

---

## 1. Descriere generală a proiectului

**Atomify** este o platformă educațională interactivă construită pentru elevi și profesori din România, concentrată pe studiul chimiei organice, biologiei moleculare și al modelelor matematice asociate. Aplicația a fost concepută ca instrument pentru pregătirea examenului de bacalaureat la chimie.

### Ce face Atomify:
- **Generează izomeri** organici dintr-o formulă moleculară (C4H10, C6H14 etc.), cu vizualizare 2D a structurilor SMILES și export PDF
- **Echilibrează ecuații chimice** automat prin algebra matricelor stoechiometrice
- **Calculează masa molară** a oricărei formule chimice (118 elemente)
- **Transcrie secvențe ADN/ARN** — lanț complementar, mRNA, compoziție nucleotidică
- **Rezolvă modele matematice** de cristalizare (nucleație, Avrami, van't Hoff, Navier–Stokes)
- **Oferă chestionare** de chimie cronometrate pentru pregătirea BAC
- **Gestionează clase virtuale** — profesori pot crea clase, invita studenți, da teme
- **Clasament global și național** cu statistici personale și insigne
- Funcționează ca **PWA** (Progressive Web App) — poate fi instalat pe telefon

---

## 2. Infrastructura serverului

### Sistemul de operare
- **OS:** Ubuntu Linux (kernel 6.8.0-107-generic)
- **Arhitectură:** x86_64 (64 biți)
- **Shell:** bash

### Stiva tehnologică (stack)
```
[Internet]
    ↓ HTTPS (port 443)
[Nginx 1.24.0] ← reverse proxy + SSL termination
    ↓ HTTP intern (port 3000)
[Node.js 18.20.8 / Express.js]
    ↓
[SQLite3] — users.db + sessions.db
    ↓ (spawn subprocess pentru izomeri)
[Java 17 (OpenJDK) / MAYGEN-1.8.jar]
```

### Portul aplicației
- Nginx ascultă pe **portul 80** (redirect automat la HTTPS) și **portul 443** (HTTPS)
- Aplicația Node.js rulează intern pe **portul 3000**
- Nginx face proxy invers (`proxy_pass http://127.0.0.1:3000`)

### Directorul aplicației
```
/var/www/Atomify/v2/        ← rădăcina aplicației v2
/var/www/Atomify/           ← conține și ecosystem.config.js pentru v2
```

---

## 3. Software instalat și versiuni

| Software | Versiune | Rol |
|----------|----------|-----|
| Node.js | 18.20.8 | Runtime JavaScript server-side |
| npm | 10.8.2 | Manager pachete Node.js |
| Express.js | 4.19.2 | Framework web HTTP |
| Nginx | 1.24.0 (Ubuntu) | Reverse proxy + SSL |
| Certbot | 2.9.0 | Management certificate SSL |
| OpenJDK | 17.0.18 | Rulare MAYGEN.jar pentru izomeri |
| PM2 | (instalat global) | Process manager Node.js — menține app în viață |
| SQLite3 | 5.1.7 (npm) | Baza de date locală |
| bcrypt | 5.1.1 | Hash parole |
| connect-sqlite3 | 0.9.13 | Store sesiuni SQLite |
| express-session | 1.18.0 | Gestionare sesiuni HTTP |
| passport | 0.7.0 | Autentificare (strategie generică) |
| passport-google-oauth20 | 2.0.0 | Autentificare Google OAuth2 |
| nodemailer | 6.9.13 | Trimitere email (Gmail SMTP) |
| cors | 2.8.5 | Cross-Origin Resource Sharing |
| dotenv | 16.4.5 | Variabile de mediu din .env |
| MAYGEN | 1.8 | Generator de structuri moleculare (JAR) |

### Dependențe de dezvoltare
| Pachet | Versiune | Rol |
|--------|----------|-----|
| jsdom | 26.1.0 | Simulare DOM pentru teste |

### Biblioteci JavaScript frontend (CDN)
| Bibliotecă | Versiune | Rol |
|-----------|----------|-----|
| SmilesDrawer | (unpkg) | Vizualizare structuri SMILES 2D |
| html2canvas | 1.4.1 | Capturi ecran canvas pentru PDF |
| jsPDF | 2.5.1 | Generare fișiere PDF în browser |
| MathJax | 3.x | Redare formule LaTeX în pagini |

---

## 4. Arhitectura aplicației

### Structura generală
Atomify v2 este o **aplicație monolitică Node.js** cu arhitectură client-server clasică:

- **Backend:** un singur fișier `server.js` (~5600 linii) care conține toate rutele API, logica de business, conexiunea la baza de date și configurarea middleware-urilor
- **Frontend:** fișiere HTML statice servite direct de Express, cu JavaScript modular pe pagini (`/app/v2/pages/`)
- **Baza de date:** SQLite3 locală, două fișiere — `users.db` (date utilizatori) și `sessions.db` (sesiuni active)

### Fluxul unei cereri tipice
```
Browser → HTTPS → Nginx (port 443)
       → proxy_pass → Node.js Express (port 3000)
       → middleware: cors, express.json, session, passport
       → rută API specifică
       → SQLite3 query
       → răspuns JSON
       → browser redă UI
```

### Fișierul .env (variabile de mediu sensibile)
Aplicația citește configurația din `/var/www/Atomify/v2/.env`:
```
GOOGLE_CLIENT_ID=...        # ID client OAuth Google
GOOGLE_CLIENT_SECRET=...    # Secret OAuth Google
GMAIL_USER=atomify66@gmail.com   # Cont Gmail pentru email
GMAIL_APP_PASS=...          # Parolă aplicație Gmail (nu parola contului)
NODE_ENV=production         # Modul producție
```

> **IMPORTANT:** Fișierul `.env` NU trebuie niciodată publicat pe GitHub sau copiat nesecurizat.

---

## 5. Baza de date — structura completă

Baza de date folosită este **SQLite3**, stocată în două fișiere locale:
- `users.db` — toate datele aplicației (utilizatori, clase, chestionare, insigne)
- `sessions.db` — sesiunile active ale utilizatorilor (create automat de connect-sqlite3)

### Tabelul `users` — utilizatorii platformei
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,          -- Numele de utilizator (unic)
  password TEXT,                 -- Hash bcrypt (NULL pentru utilizatori Google)
  email TEXT UNIQUE,             -- Adresa de email
  google_id TEXT UNIQUE,         -- ID-ul Google (pentru OAuth)
  role TEXT,                     -- 'student', 'professor', sau NULL (neales)
  country TEXT,                  -- Țara utilizatorului (pentru clasament național)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Tabelul `user_isomers` — istoricul generărilor de izomeri
```sql
CREATE TABLE user_isomers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,      -- Referință la users.id
  formula TEXT NOT NULL,         -- Formula moleculară (ex: C4H10)
  isomer_count INTEGER NOT NULL, -- Câți izomeri au fost generați
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `user_quiz_results` — istoricul chestionarelor (tabel legacy)
```sql
CREATE TABLE user_quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quiz_name TEXT NOT NULL,       -- Numele chestionarului
  score INTEGER NOT NULL,        -- Scorul obținut
  total_questions INTEGER NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `quiz_results` — rezultate detaliate (tabel principal)
```sql
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quiz_id TEXT NOT NULL,         -- ID-ul chestionarului (ex: 'chimie-organica-1')
  quiz_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage REAL NOT NULL,      -- Procentaj (0-100)
  time_taken INTEGER NOT NULL,   -- Timp în secunde
  class_id INTEGER,              -- NULL dacă nu e din clasă
  classroom_quiz_id INTEGER,     -- Referință la quiz personalizat de profesor
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes(id) ON DELETE SET NULL
)
```

### Tabelul `classes` — clasele virtuale
```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,            -- Numele clasei
  description TEXT,
  professor_id INTEGER NOT NULL, -- Profesorul care a creat clasa
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `class_members` — membrii confirmați ai claselor
```sql
CREATE TABLE class_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id)   -- Un student nu poate fi de două ori în aceeași clasă
)
```

### Tabelul `class_invitations` — invitații în așteptare
```sql
CREATE TABLE class_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  professor_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
)
```
> **Notă migrare:** Constrângerea `UNIQUE(class_id, student_id)` a fost eliminată printr-o migrare live (backup→create→copy→rename) pentru a permite re-invitarea studenților respinși anterior.

### Tabelul `homework_assignments` — teme date de profesori
```sql
CREATE TABLE homework_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  professor_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quiz_id TEXT NOT NULL,         -- Chestionarul asociat temei
  quiz_name TEXT NOT NULL,
  due_date DATETIME NOT NULL,    -- Termenul limită
  max_attempts INTEGER DEFAULT 1,-- Număr maxim de încercări permise
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `homework_submissions` — răspunsurile studenților la teme
```sql
CREATE TABLE homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,      -- student_id (alias)
  quiz_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  answers TEXT NOT NULL,         -- JSON cu răspunsurile date
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homework_id) REFERENCES homework_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `classroom_quizzes` — chestionare personalizate de profesori
```sql
CREATE TABLE classroom_quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  professor_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER DEFAULT 600, -- Limita de timp în secunde (implicit 10 min)
  questions TEXT NOT NULL,        -- JSON cu întrebările și răspunsurile
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,    -- 1 = activ, 0 = arhivat
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `badges` — definițiile insignelor disponibile
```sql
CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,        -- Ex: "Chimist Debutant"
  description TEXT NOT NULL,
  icon TEXT NOT NULL,               -- Emoji sau cod icon
  category TEXT NOT NULL,           -- 'izomeri', 'chestionare', 'activitate' etc.
  requirement_type TEXT NOT NULL,   -- 'isomers_generated', 'quizzes_completed' etc.
  requirement_value INTEGER NOT NULL,-- Valoarea prag pentru a câștiga insigna
  points INTEGER DEFAULT 0,         -- Puncte bonus
  rarity TEXT DEFAULT 'common',     -- 'common', 'rare', 'epic', 'legendary'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Tabelul `user_badges` — insignele câștigate de utilizatori
```sql
CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  progress_when_earned INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE(user_id, badge_id)         -- O insignă se câștigă o singură dată
)
```

### Tabelul `user_stats` — statisticile cumulate ale utilizatorilor
```sql
CREATE TABLE user_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  isomers_generated INTEGER DEFAULT 0,     -- Total izomeri generați
  quizzes_completed INTEGER DEFAULT 0,      -- Total chestionare completate
  quizzes_perfect INTEGER DEFAULT 0,        -- Chestionare cu scor 100%
  total_quiz_score INTEGER DEFAULT 0,
  total_quiz_questions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,         -- Zile consecutive active
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  days_active INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,       -- Timp total studiat (secunde)
  favorite_subject TEXT,
  account_created DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Tabelul `badge_progress` — progresul spre insigne necâștigate
```sql
CREATE TABLE badge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE(user_id, badge_id)
)
```

### Tabelul `notifications` — notificări pentru utilizatori
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,              -- Tipul notificării (ex: 'badge_earned')
  badge_id INTEGER,                -- Referință la insigna câștigată (dacă e cazul)
  read INTEGER DEFAULT 0,          -- 0 = necitit, 1 = citit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
)
```

### Tabelul `email_preferences` — preferințele de email ale utilizatorilor
```sql
CREATE TABLE email_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_homework_notifications INTEGER DEFAULT 1,  -- Notificări teme noi
  email_quiz_notifications INTEGER DEFAULT 1,       -- Notificări quiz-uri noi
  email_grade_notifications INTEGER DEFAULT 1,      -- Notificări note primite
  email_general_notifications INTEGER DEFAULT 1,
  newsletter_subscription INTEGER DEFAULT 0,         -- Abonat la newsletter
  newsletter_email TEXT,                             -- Email pentru newsletter (poate diferi)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
)
```

### Tabelul `profanity_words` — lista de cuvinte interzise
```sql
CREATE TABLE profanity_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,           -- Cuvântul original
  normalized_word TEXT NOT NULL,       -- Forma normalizată (fără diacritice, leetspeak)
  severity INTEGER DEFAULT 1,          -- Nivelul de severitate (1-3)
  category TEXT DEFAULT 'general',     -- Categoria cuvântului
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  added_by INTEGER,                    -- Admin care l-a adăugat
  is_active BOOLEAN DEFAULT 1,         -- Poate fi dezactivat fără ștergere
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
)
```

### Tabelul `chemical_elements` — tabelul periodic
```sql
CREATE TABLE chemical_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,   -- Ex: 'C', 'H', 'O', 'Na', 'Cl'
  name_ro TEXT NOT NULL,          -- Numele în română
  name_en TEXT NOT NULL,          -- Numele în engleză
  atomic_mass REAL NOT NULL,      -- Masa atomică (g/mol)
  atomic_number INTEGER NOT NULL, -- Numărul atomic (Z)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## 6. API-ul serverului — toate rutele

### Autentificare și conturi utilizatori

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| POST | `/register` | Nu | Înregistrare cont nou cu username + parolă |
| POST | `/login` | Nu | Autentificare username + parolă |
| POST | `/logout` | Nu | Deautentificare + distrugere sesiune |
| GET | `/auth/google` | Nu | Inițiază fluxul Google OAuth2 |
| GET | `/auth/google/callback` | Nu | Callback OAuth Google (redirect după autentificare) |
| GET | `/user` | Sesiune | Returnează datele utilizatorului autentificat |
| POST | `/set-role` | Sesiune | Setează rolul: `student` sau `professor` |
| POST | `/set-country` | Sesiune | Setează țara utilizatorului |
| POST | `/change-password` | Sesiune | Schimbă parola (verifică parola curentă) |
| POST | `/delete-account` | Sesiune | Șterge contul (cu verificare parolă sau Google) |

### Chestionare și rezultate

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/api/quizzes` | Sesiune | Lista tuturor chestionarelor disponibile (regulare + clasă) |
| GET | `/api/quiz/:quizId` | Sesiune | Întrebările unui chestionar (ordine randomizată) |
| POST | `/api/quiz/:quizId/submit` | Sesiune | Trimite răspunsurile și primește scorul |
| GET | `/api/classroom-quiz/:quizId` | Sesiune | Chestionar personalizat de profesor |
| POST | `/api/classroom-quiz` | Sesiune | Profesor: creează chestionar pentru clasă |
| PUT | `/api/classroom-quiz/:quizId` | Sesiune | Profesor: editează chestionar |
| DELETE | `/api/classroom-quiz/:quizId` | Sesiune | Profesor: șterge chestionar |
| GET | `/api/classroom-quizzes/professor` | Sesiune | Lista quiz-urilor create de profesor |
| GET | `/api/classroom-quizzes/student` | Sesiune | Lista quiz-urilor disponibile studentului |

### Clasamente

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/api/leaderboard/global` | Sesiune | Top global al tuturor studenților |
| GET | `/api/leaderboard/national` | Sesiune | Top național (filtrat după țara utilizatorului) |
| GET | `/api/leaderboard/class/:classId` | Sesiune | Top pentru o clasă specifică |
| GET | `/api/leaderboard/badges` | Sesiune | Clasament după insigne |
| GET | `/api/stats/personal` | Sesiune | Statisticile personale ale utilizatorului |

### Clase virtuale

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| POST | `/create-class` | Sesiune | Profesor: creează o clasă nouă |
| GET | `/my-classes` | Sesiune | Lista claselor utilizatorului (rol determină ce se returnează) |
| POST | `/invite-student` | requireAuth | Profesor: invită student prin username |
| GET | `/pending-invitations` | Sesiune | Invitații în așteptare pentru student |
| POST | `/respond-invitation` | Sesiune | Student: acceptă sau refuză invitația |
| GET | `/class-members/:classId` | Sesiune | Lista membrilor + invitații pending |
| POST | `/remove-student` | Sesiune | Profesor: elimină student din clasă |
| POST | `/exit-classroom` | Sesiune | Student: iese singur din clasă |
| GET | `/search-users` | requireAuth | Caută utilizatori pentru autocomplete |
| GET | `/check-user/:username` | requireAuth | Verifică dacă un username există |

### Teme (homework)

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| POST | `/create-homework` | requireAuth | Profesor: creează temă pentru clasă |
| GET | `/class/:classId/homework` | requireAuth | Profesor: listează temele clasei |
| GET | `/homework/:homeworkId/details` | requireAuth | Detalii temă + tabel submisii studenți |
| GET | `/my-homework` | requireAuth | Student: temele sale active |
| POST | `/homework/:homeworkId/submit` | requireAuth | Student: trimite răspunsurile la temă |

### Chimie — generare izomeri și elemente

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/validate-formula` | Nu | Validează o formulă moleculară înainte de generare |
| GET | `/api/isomers` | Nu | Generează izomerii (rulează MAYGEN.jar) |
| GET | `/api/elements` | Nu | Lista completă a elementelor chimice |
| GET | `/api/elements/masses` | Nu | Masele atomice ale elementelor (ex: {H: 1.008, C: 12.011}) |
| GET | `/api/elements/names` | Nu | Numele elementelor în română și engleză |
| GET | `/api/elements/:symbol` | Nu | Datele unui element specific |
| GET | `/api/test` | Nu | Endpoint de test/health-check |

### Istoric personal

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/user-history` | Sesiune | Istoricul izomerilor generați + chestionarelor |
| POST | `/save-isomer` | Sesiune | Salvează o generare în istoricul personal |
| POST | `/save-quiz-result` | Sesiune | Salvează rezultatul unui chestionar |
| POST | `/save-formula` | Sesiune | Salvează o formulă în istoricul personal |

### Profil și insigne

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/api/profile` | Sesiune | Date complete profil + insigne + statistici |
| GET | `/api/badges` | Sesiune | Lista tuturor insignelor disponibile |
| GET | `/api/notifications` | Sesiune | Notificările utilizatorului (insigne noi etc.) |
| POST | `/api/notifications/clear` | Sesiune | Marchează notificările ca citite |
| GET | `/api/recent-badges` | Sesiune | Ultimele insigne câștigate |
| POST | `/api/check-badges` | Sesiune | Verifică dacă utilizatorul a câștigat insigne noi |

### Newsletter

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| POST | `/newsletter-subscribe` | Nu | Abonare la newsletter (funcționează și fără cont) |
| POST | `/newsletter-unsubscribe` | Nu | Dezabonare de la newsletter |
| GET | `/newsletter-status` | Sesiune | Statusul abonamentului utilizatorului curent |

### PWA și fișiere statice

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/sw.js` | Nu | Servește Service Worker-ul |
| GET | `/manifest.json` | Nu | Manifestul PWA |
| GET | `/pwa-status` | Nu | Statusul PWA (versiune, cache) |

### Admin și debug

| Metodă | Rută | Protejat | Descriere |
|--------|------|----------|-----------|
| GET | `/admin-stats` | Sesiune | Statistici globale platformă (admin) |
| GET | `/debug-db` | Sesiune | Schema bazei de date (doar debug) |

---

## 7. Sistemul de autentificare

### Tipuri de autentificare suportate

**1. Autentificare cu username + parolă (clasică)**
- Utilizatorul se înregistrează cu username și parolă
- Parola este **hash-uită cu bcrypt** (salt rounds: 10 la înregistrare, 12 la schimbarea parolei)
- La login se compară hash-ul stocat cu parola introdusă prin `bcrypt.compare()`
- La succes, se setează `req.session.userId = row.id`

**Validarea parolei la înregistrare:**
- Minim 8 caractere
- Cel puțin o literă mare (A-Z)
- Cel puțin o cifră (0-9)
- Verificare anti-profanitate a username-ului

**2. Autentificare Google OAuth2 (social login)**
- Biblioteca: `passport` + `passport-google-oauth20`
- Strategia: GoogleStrategy
- Callback URL fix: `https://atomify.info/auth/google/callback`
- La prima autentificare, utilizatorul este creat automat în baza de date (fără parolă)
- La autentificări ulterioare, contul este găsit după `google_id` sau `email`
- Dacă un utilizator cu același email există deja (cont clasic), contul Google este legat de el

**Fluxul OAuth:**
```
1. Utilizatorul apasă "Autentifică-te cu Google"
2. Browser → GET /auth/google
3. Redirect la Google (scope: profile + email)
4. Google → callback: GET /auth/google/callback?code=...
5. Passport schimbă codul pe token-ul de acces
6. Datele profilului Google sunt primite
7. Utilizatorul este creat sau găsit în baza de date
8. req.session.userId = user.id
9. Redirect la /app/isomers.html?auth=success
```

### Managementul sesiunilor
- **Store:** SQLite3 (`sessions.db`) prin `connect-sqlite3`
- **Durata sesiunii:** 1 zi (86.400.000 ms)
- **Secret sesiune:** șir configurat în cod (recomandat mutat în .env pentru producție)
- **Salvarea sesiunii:** `resave: false`, `saveUninitialized: false` (economic, nu creează sesiuni goale)
- Cookie-ul de sesiune: `connect.sid` (httpOnly implicit)

### Middleware-ul `requireAuth`
```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
```
Verifică atât sesiunea clasică (`req.session.userId`) cât și utilizatorul Passport (`req.user`) pentru compatibilitate cu ambele tipuri de autentificare.

### Frontend — modulul `auth.js`
Fișierul `/app/auth.js` este un **singleton global** (`window.AtomifyAuth`) care:
- Menține starea autentificării pe toate paginile
- Intercepetează `window.fetch` și declanșează refresh după `/login`, `/logout`, `/register`
- Emite evenimentul custom `atomify:auth-changed` pe care navbar-ul îl ascultă
- Reîmprospătează starea la focusul tab-ului (pentru detectarea logout-ului din alt tab)
- Comasează cererile paralele la `/user` (nu face 3 cereri dacă 3 componente cer în același timp)

**API public `window.AtomifyAuth`:**
```javascript
AtomifyAuth.user           // utilizatorul curent sau null
AtomifyAuth.refresh()      // re-fetch /user, returnează Promise<user>
AtomifyAuth.logout()       // POST /logout + refresh
AtomifyAuth.onChange(fn)   // subscribe la schimbări; fn(user) apelat imediat
AtomifyAuth.isAuthed()     // boolean
```

---

## 8. Sistemul de email

### Configurare
- **Serviciu:** Gmail SMTP prin **nodemailer**
- **Cont:** `atomify66@gmail.com`
- **Autentificare Gmail:** parolă de aplicație (nu parola contului Gmail)
- Transportorul este inițializat la pornirea serverului. Dacă variabilele `GMAIL_USER` și `GMAIL_APP_PASS` lipsesc din `.env`, emailurile sunt dezactivate fără eroare.

### Tipuri de email-uri trimise

**1. Notificare temă nouă** (`sendHomeworkNotification`)
- Trimisă tuturor studenților din clasă când profesorul creează o temă nouă
- Conținut: titlul temei, numele clasei, termenul limită formatat în română
- Verifică preferințele utilizatorului: dacă `email_homework_notifications = 0`, emailul NU se trimite

**2. Notificare quiz nou** (`sendQuizNotification`)
- Trimisă când sunt disponibile quiz-uri noi
- Link direct la pagina de chestionare

**3. Notificare rezultat quiz** (`sendGradeNotification`)
- Trimisă după fiecare completare de chestionar
- Afișează scorul, totalul, procentajul și un emoji relevant (🎉 ≥80%, 👍 ≥60%, 📚 <60%)
- Verifică preferința `email_grade_notifications`

**4. Confirmare abonare newsletter** (`sendNewsletterConfirmation`)
- Trimisă la abonarea la newsletter (atât cu cont cât și fără cont)
- Lista funcționalităților platformei, link la platformă

### Preferințele de email
Fiecare utilizator are preferințe granulare stocate în `email_preferences`:
- `email_homework_notifications` — teme noi
- `email_quiz_notifications` — quiz-uri noi
- `email_grade_notifications` — rezultate
- `email_general_notifications` — notificări generale
- `newsletter_subscription` — newsletter
- `newsletter_email` — adresa de email pentru newsletter (poate fi diferită de cea a contului)

---

## 9. Generatorul de izomeri (MAYGEN)

### Descriere
Generarea de izomeri este funcționalitatea centrală a platformei. Se folosește **MAYGEN 1.8**, o unealtă Java open-source de generare de structuri moleculare exhaustivă.

### Fișierul executabil
```
/var/www/Atomify/v2/MAYGEN-1.8.jar
```

### Cum funcționează
```
1. Utilizatorul introduce formula (ex: C4H10)
2. Frontend-ul trimite GET /api/isomers?formula=C4H10
3. Serverul Node.js validează formula cu validateChemicalFormula()
4. Serverul pornește un subprocess Java:
   java -jar MAYGEN-1.8.jar -f C4H10 -smi -t <timeout>
5. MAYGEN generează toate structurile SMILES valide
6. Output-ul (linii SMILES) este citit prin stdout
7. Serverul returnează JSON cu lista de SMILES
8. Frontend-ul desenează structurile cu SmilesDrawer
```

### Validarea formulei (înainte de MAYGEN)
Funcția `validateChemicalFormula()` verifică:
- Format corect (litere + cifre, format chimic standard)
- Lista de molecule imposibile (`noIsomerMolecules`) — ex: NH4, H3O, CH
- Lista de formule problematice (`problematicFormulas`) — ex: C10H22 are >75.000 izomeri
- Complexitate (carbon ≥ 10 → respins cu sugestii alternative)
- Dacă trece toate verificările, returnează `{ valid: true }`

### Molecule fără izomeri blocate manual
```javascript
NH4   → "este ionul amoniu NH4+" — nu moleculă neutră
H3O   → "este ionul hidroniu H3O+"
CH    → moleculă instabilă
NH    → moleculă instabilă
```

### Formule prea complexe blocate manual
```javascript
C10H22 → ~75.000 izomeri → respins cu sugestie C6H14
C11H24 → ~159.000 izomeri → respins
C12H26 → ~355.000 izomeri → respins
C15H32 → milioane de izomeri → respins
```

### Timeout și marker special
```javascript
const COUNT_TIMED_OUT_MARKER = -1;
```
Dacă generarea durează prea mult, procesul Java este oprit și se returnează marker-ul -1.

### Exemple educaționale categorificate
Serverul include sugestii educaționale pe 3 niveluri:
- **Începători:** C4H10 (2 izomeri), C5H12 (3), C4H8 (3), C3H6O (2)
- **Intermediari:** C6H14 (5), C6H12, C5H10O, C4H10O (4)
- **Avansați:** C7H16 (9), C8H18 (18), C6H6 (benzen), C4H8O2

### Fișierele .smi precompute
Directorul conține fișiere `.smi` precompilate pentru formule comune:
```
c4h10.smi/C4H10.smi
c4h8.smi/C4H8.smi
c4h8o2.smi/C4H8O2.smi
c5h12.smi/C5H12.smi
...
```
Acestea sunt rezultate cache-uite ale rulărilor MAYGEN.

---

## 10. Sistemul de insigne (badges)

### Descriere
Sistemul de gamification include insigne câștigate automat la atingerea unor praguri de activitate.

### Cum funcționează
La fiecare acțiune importantă (completare quiz, generare izomeri), serverul apelează funcții de actualizare:
- `updateQuizStats(userId, score, totalQuestions, timeTaken)` — după fiecare quiz
- `updateIsomerStats(userId)` — după generarea izomerilor
- `updateUserActivity(userId)` — actualizează streak-ul zilnic

Aceste funcții actualizează tabelul `user_stats` și verifică dacă utilizatorul a atins pragul pentru noi insigne. Dacă da, înregistrează insigna în `user_badges` și creează o notificare în `notifications`.

### Categorii de insigne
- **Izomeri:** după N generări de izomeri
- **Chestionare:** după N quiz-uri completate, N perfecte
- **Activitate:** streak de zile consecutive, zile totale active
- **Raritate:** common, rare, epic, legendary

### Inițializarea statisticilor
La crearea unui cont nou (atât clasic cât și Google), se apelează `initializeUserStats(newUserId)` care creează o înregistrare goală în `user_stats`.

---

## 11. Filtrarea de conținut (profanity filter)

### Descriere
Aplicația filtrează conținut neadecvat în username-uri, numele claselor, titlurile temelor și descrierile.

### Funcția de normalizare `normalizeText(text)`
Transformă textul pentru comparare robustă:
1. Convertit la litere mici
2. Eliminare spații, puncte, liniuțe, underscore-uri
3. **Conversie leetspeak:** `@→a`, `4→a`, `3→e`, `1→i`, `0→o`, `5→s`, `7→t` etc.
4. Eliminare caractere speciale și cifre rămase
5. Reducere secvențe repetate: `aaaa→a`

### Verificarea `containsProfanity(text)`
1. Normalizează textul de intrare
2. Preia toate cuvintele active din `profanity_words`
3. Verifică:
   - **Match exact:** textul normalizat = cuvântul interzis
   - **Substring:** cuvântul interzis este conținut în text
   - **Scattered:** cuvântul interzis apare împrăștiat în text
4. Returnează `{ contains: boolean, matches: [...] }`

### Unde se aplică filtrul
- `POST /register` — username-ul la înregistrare
- `POST /create-class` — numele și descrierea clasei
- `POST /create-homework` — titlul și descrierea temei

### Inițializare
`init_profanity_db.js` populează tabelul cu cuvinte românești la prima rulare.

---

## 12. Fișierele CSS și sistemul de design v2

### Structura CSS (`/app/v2/`)
```
v2/
├── core.css          ← Reset, variabile CSS, tipografie, layout de bază
├── components.css    ← Componente reutilizabile (butoane, formulare, carduri)
├── chrome.css        ← Navbar, header, footer, modal de autentificare
└── pages/
    ├── isomers.css
    ├── chestionare.css
    ├── leaderboard.css
    ├── equations.css
    ├── masa.css
    ├── calcule.css
    ├── bio.css
    ├── istoric.css
    ├── profile.css
    └── admin.css
```

### Principii de design v2
- **Tema duală:** light/dark mode cu CSS custom properties (variabile)
- **Tipografie:** Font `Fraunces` (titluri cu italic) + `Inter` (corp text)
- **Sistem de reveal:** Clasele `.reveal`, `.reveal-1..4` adaugă animații la scroll
- **Capitole:** Structura `.chapter` cu `.chapter-num` (01, 02...) și `.chapter-body`
- **Masthead:** Secțiunea de intrare cu eyebrow, titlu mare și meta-info
- **Responsive:** Mobile-first, breakpoint principal la 720px

---

## 13. Configurația Nginx

### Fișier de configurare
```nginx
server {
    server_name atomify.info www.atomify.info;

    # Redirect www → non-www
    if ($host = www.atomify.info) {
        return 301 https://atomify.info$request_uri;
    }

    # Proxy invers spre Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;     # 5 minute pentru generarea izomerilor
        proxy_connect_timeout 75s;
        client_max_body_size 10M;    # Limită upload
    }

    # SSL gestionat de Certbot
    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/atomify.info/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atomify.info/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Redirect HTTP → HTTPS (port 80)
server {
    listen 80;
    listen [::]:80;
    server_name atomify.info www.atomify.info;
    # Certbot gestionează redirect-urile
    return 404;
}
```

### Explicații configurație
- **`proxy_read_timeout 300s`:** Timeout extins la 5 minute pentru rutele de generare izomeri (MAYGEN poate dura pentru formule complexe)
- **`proxy_set_header X-Real-IP`:** Transmite IP-ul real al clientului la Node.js (util pentru logging)
- **`proxy_set_header X-Forwarded-Proto`:** Permite Node.js să detecteze dacă cererea e HTTPS
- **`client_max_body_size 10M`:** Limita pentru upload-uri (10 MB)
- **Suport WebSocket:** `Upgrade` + `Connection upgrade` headers pentru potențiale WebSocket-uri

---

## 14. Configurația PM2

PM2 este un process manager pentru Node.js care menține aplicația în viață, o repornește automat la crash și pornește la boot-ul serverului.

### Fișierul `ecosystem.config.js`
```javascript
// /var/www/Atomify/v2/ecosystem.config.js
module.exports = {
    apps: [{
      name: "atomify",           // Numele procesului în PM2
      script: "./server.js",     // Fișierul de pornire
      cwd: "/var/www/Atomify/v2", // Directorul de lucru
      env_production: {
         NODE_ENV: "production", // Variabila de mediu pentru producție
      }
    }]
  }
```

### Statusul curent PM2
```
┌─────┬──────────┬───────────┬────────┬───────────┬────────┬──────┐
│  id │ name     │ pid       │ uptime │ status    │ cpu    │ mem  │
├─────┼──────────┼───────────┼────────┼───────────┼────────┼──────┤
│   0 │ atomify  │ 68129     │ 10D    │ online    │ 0%     │ 93MB │
└─────┴──────────┴───────────┴────────┴───────────┴────────┴──────┘
```
**10 restart-uri** (↺ 10) — indică că aplicația a căzut de 10 ori și PM2 a repornit-o automat.

### Comenzi utile PM2
```bash
pm2 status              # Statusul tuturor aplicațiilor
pm2 logs atomify        # Log-urile în timp real
pm2 restart atomify     # Restart manual
pm2 stop atomify        # Oprire
pm2 start ecosystem.config.js --env production   # Pornire cu ecosistem
pm2 startup             # Configurare auto-start la boot
pm2 save                # Salvează configurația curentă
```

---

## 15. Certificat SSL — Let's Encrypt

### Descriere
HTTPS-ul este asigurat prin **Certbot** (Let's Encrypt) — certificat SSL gratuit, reînnoit automat.

### Fișierele certificatului
```
/etc/letsencrypt/live/atomify.info/fullchain.pem    ← Certificatul public
/etc/letsencrypt/live/atomify.info/privkey.pem       ← Cheia privată
/etc/letsencrypt/options-ssl-nginx.conf              ← Configurații SSL Nginx
/etc/letsencrypt/ssl-dhparams.pem                    ← Parametri Diffie-Hellman
```

### Reînnoire automată
Certbot instalează un cron job sau timer systemd care verifică zilnic certificatele și le reînnoiește când mai sunt <30 zile de valabilitate. Reînnoirea se face automat, fără intervenție.

### Verificare manuală
```bash
certbot renew --dry-run   # Test reînnoire fără a schimba efectiv certificatul
certbot certificates      # Lista certificatelor active
```

### Securitate SSL
Fișierul `options-ssl-nginx.conf` de la Certbot include:
- Protocoale: TLSv1.2 + TLSv1.3 (TLS 1.0 și 1.1 dezactivate)
- Cipher suites moderne
- HSTS (opțional, poate fi adăugat manual)

---

## 16. Sistemul PWA (Progressive Web App)

### Descriere
Atomify poate fi instalat ca aplicație nativă pe telefon sau desktop prin standardul PWA.

### Fișierele PWA

**`/app/manifest.json`** — definițiile aplicației
- Nume, culori temă, iconițe, orientare, display mode (`standalone`)

**`/app/sw.js`** — Service Worker
- Cache-ing strategic al resurselor statice
- Funcționalitate offline (pagini deja vizitate sunt disponibile fără internet)
- Actualizare automată la noua versiune

**`/app/pwa.js`** — scriptul de instalare
- Interceptează evenimentul `beforeinstallprompt`
- Afișează butonul "Instalează aplicația"
- Gestionează instalarea

### Rutele servite de Node.js
```javascript
app.get('/sw.js', ...)        // Servit cu Content-Type: application/javascript
app.get('/manifest.json', ...)// Servit cu Content-Type: application/manifest+json
app.get('/pwa-status', ...)   // Endpoint de status PWA
```

---

## 17. Paginile aplicației — detalii complete

---

### 17.1 `index.html` — Landing Page

**URL:** `https://atomify.info/`  
**Locație:** `/var/www/Atomify/v2/index.html`  
**Titlu:** "Atomify · Laborator digital pentru științe"

**Scopul paginii:**  
Pagina de prezentare publică a platformei. Nu necesită autentificare. Introduce platforma, echipa și funcționalitățile disponibile.

**Structura paginii:**
- **Header fix** cu logo, navigare internă (sectiunile paginii) și buton "Deschide platforma"
- **Secțiunea Hero (#home):** Titlu mare, descriere, call-to-action principal
- **Secțiunea Platformă (#platform):** Descriere generală a instrumentelor
- **Secțiunea Instrumente (#tools):** Carduri pentru fiecare funcționalitate (izomeri, ecuații, masă molară, ADN/ARN, calcule, chestionare)
- **Secțiunea Audiență (#audience):** Descriere pentru elevi și profesori
- **Secțiunea Echipă (#team):** Prezentarea autorilor (Siret Luca-Alexandru, Zevri Matei-Tudor)
- **Secțiunea Recunoașteri (#awards):** Premii sau participări la concursuri
- **Footer** cu newsletter și link-uri

**Ce se întâmplă la click pe "Deschide platforma":**  
Redirect la `/app/isomers.html` — prima pagină funcțională a aplicației.

**Script-uri incluse:**
- `app/google-translate.js` — suport traducere automată Google
- `app/pwa.js` — instalare PWA
- `styles.css` — CSS-ul landing-ului (separat de `/app/v2/`)

---

### 17.2 `isomers.html` — Generator de izomeri

**URL:** `https://atomify.info/app/isomers.html`  
**Locație:** `/var/www/Atomify/v2/app/isomers.html`  
**Titlu:** "Atomify · Generare izomeri"  
**Categorie:** Calcul · Vol. III

**Scopul paginii:**  
Generarea tuturor structurilor izomere ale unei formule moleculare organice, cu vizualizare grafică 2D și export PDF.

**Funcționalitățile principale:**

1. **Formularul de introducere a formulei:**
   - Input text cu placeholder "C4H10, C5H12, C4H8O2…"
   - Buton "Generează" care trimite formularul
   - Buton "Formulă aleatoare" care alege aleator o formulă din lista de exemple
   - Buton X pentru ștergerea inputului

2. **Secțiunea de rezultate (`#result`):**
   - Numărul de izomeri găsiți
   - Grid cu toate structurile desenate (canvas-uri)
   - Fiecare canvas afișează structura SMILES cu **SmilesDrawer**
   - Buton "Exportă PDF" (folosind html2canvas + jsPDF)

3. **Secțiunea "Formule clasice" (exemplele presetate):**
   - Butonul "Butan (C4H10) — 2 izomeri"
   - Butonul "Hexan (C6H14) — 5 izomeri"
   - etc.
   - La click, formula se copiază automat în input

**Cum funcționează în spate (backend):**

1. Utilizatorul introduce "C4H10" și apasă "Generează"
2. JavaScript trimite `GET /validate-formula?formula=C4H10`
3. Serverul verifică formula (valențe, complexitate, blacklist)
4. Dacă validă: `GET /api/isomers?formula=C4H10`
5. Serverul Node.js pornește subprocess Java:
   ```bash
   java -jar /var/www/Atomify/v2/MAYGEN-1.8.jar -f C4H10 -smi
   ```
6. MAYGEN emite pe stdout linii SMILES (ex: `CC(C)C`, `CCCC`)
7. Node.js citește stdout, parsează liniile
8. Returnează JSON: `{ smiles: ["CC(C)C", "CCCC"], count: 2 }`
9. Frontend primește lista SMILES
10. Lazy-load SmilesDrawer (dacă nu e încărcat)
11. `SmiDrawer.apply()` transformă elementele `<canvas data-smiles="...">` în structuri 2D

**Detectare mobilă:**  
Pe mobil (width ≤ 720px sau user agent mobil), numărul maxim de structuri afișate este limitat pentru a evita DOM-uri prea mari.

**Salvare în istoric:**  
Dacă utilizatorul e autentificat, la generare se trimite automat `POST /save-isomer` cu formula și numărul de izomeri.

**Script-uri CSS:**
- `v2/core.css`, `v2/components.css`, `v2/chrome.css` (structura generală)
- `v2/pages/isomers.css` (stiluri specifice)
- `v2/pages/isomers.js` (logica paginii)

**Modal de autentificare:**  
Inclus direct în HTML — formularul de login/înregistrare și butonul Google OAuth apar în modal overlay.

---

### 17.3 `equations.html` — Echilibrare ecuații

**URL:** `https://atomify.info/app/equations.html`  
**Titlu:** "Atomify · Echilibrare ecuații"  
**Categorie:** Calcul · Vol. II

**Scopul paginii:**  
Echilibrarea automată a ecuațiilor chimice prin respectarea legii conservării masei (Lavoisier).

**Funcționalitățile principale:**

1. **Formularul de ecuație:**
   - Input text larg cu placeholder "Ca(OH)2 + HCl → CaCl2 + H2O"
   - Separatori acceptați: `->`, `→`, `=`
   - Buton "Echilibrează"
   - Buton "Exemplu aleator"

2. **Rezultatul echilibrării:**
   - Ecuația echilibrată cu coeficienți stoechiometrici
   - Masa molară a fiecărei substanțe (calculată din tabelul periodic)
   - Compoziția elementală procentuală a fiecărei substanțe
   - Verificare că suma atomilor e egală în reactanți și produși

3. **Biblioteca de reacții clasice:**
   - Sinteză: H2 + O2 → H2O
   - Neutralizare: Ca(OH)2 + HCl → CaCl2 + H2O
   - Ardere: CH4 + O2 → CO2 + H2O
   - etc.

**Cum funcționează în spate (frontend):**  
Ecuațiile sunt echilibrate **complet în browser**, fără cereri la server:

1. Parsarea ecuației: se separă reactanții și produșii
2. Parsarea formulelor compușilor (recursiv, cu paranteze)
3. Construirea **matricei stoechiometrice** (atomi × compuși)
4. Rezolvarea sistemului de ecuații liniare pentru coeficienți minimi întregi
5. Afișarea rezultatului cu coeficienții calculați

Masele molare se obțin de la server: `GET /api/elements/masses` (la încărcarea paginii).

**Script-uri:**
- `v2/pages/equations.js` — parser, echilibrare, UI
- `v2/pages/equations.css`

---

### 17.4 `masa.html` — Masă molară

**URL:** `https://atomify.info/app/masa.html`  
**Titlu:** "Atomify · Masă molară"  
**Categorie:** Calcul · Vol. I

**Scopul paginii:**  
Calcularea masei molare a oricărei formule chimice (118 elemente).

**Funcționalitățile principale:**

1. **Formularul:**
   - Input text cu placeholder "C2H5OH, Ca(OH)2, Mg(NO3)2…"
   - Buton "Calculează"
   - Buton "Specimen aleator"

2. **Rezultatul:**
   - Masa molară totală (g/mol) — animată cu count-up
   - Tabel cu fiecare element: simbol, număr atomi, masă parțială, procent
   - Formula afișată cu subindici corect (numerele convertite automat)

3. **Biblioteca de specimene uzuale:**
   - Apă (H2O), NaCl, CaCO3, C6H12O6 (glucoză), etc.
   - Click pe specimen → formula se copiază în input

**Cum funcționează:**  
Parser recursiv în JavaScript:
1. Citește formula caracter cu caracter
2. Detectează elemente (literă mare + opțional literă mică)
3. Detectează paranteze și grupuri — recursiv
4. Detectează indici (cifre)
5. Construiește `{ C: 2, H: 5, O: 1, H: 1 }` (sumă atomi)
6. Înmulțește cu masele atomice din `/api/elements/masses`
7. Calculează total și procente

**Masele atomice:**  
Obținute de la server prin `GET /api/elements/masses`, stocate din baza de date `chemical_elements`.

**Script-uri:**
- `v2/pages/masa.js`
- `v2/pages/masa.css`

---

### 17.5 `calcule.html` — Calcule avansate (cristalizare)

**URL:** `https://atomify.info/app/calcule.html`  
**Titlu:** "Atomify · Modele de cristalizare"  
**Categorie:** Calcul · Vol. V

**Scopul paginii:**  
Modele matematice avansate pentru cinetică și termodinamica cristalizării, cu calculatoare interactive și formule LaTeX renderizate cu MathJax.

**Cele 7 calculatoare incluse:**

1. **01 — Rata de nucleație clasică:**
   - Formula: $J = A \exp(-\Delta G^* / k_B T)$
   - Parametri: tensiune superficială (σ), temperatură (T), volum molar (Vm), supersaturație (S), factor pre-exponențial (A)
   - Calculează: $\Delta G^*$, raza critică $r_c$, rata $J$

2. **02 — Creștere cristal (lege putere):**
   - Formula: $r(t) = r_0 + k \cdot t^n$
   - Parametri: raza inițială, constanta de viteză k, exponentul n, timpul t
   - Calculează raza la momentul t

3. **03 — Ecuația Avrami (JMAK):**
   - Formula: $\alpha(t) = 1 - \exp(-k t^n)$
   - Parametri: k (viteză), n (exponent Avrami 1-4), t (timp)
   - Calculează fracția transformată α

4. **04 — Supersaturație relativă:**
   - Formula: $\sigma = (c - c^*) / c^*$
   - Parametri: concentrația actuală c și concentrația de echilibru c*

5. **05 — Ecuația van't Hoff:**
   - Formula: $\ln(c^*/c_0) = -\Delta H / R \cdot (1/T - 1/T_0)$
   - Calculează solubilitatea la temperaturi diferite

6. **06 — Numere adimensionale (Re, Pe, Ri):**
   - **Reynolds:** $Re = \rho v L / \mu$ (regim laminar/turbulent)
   - **Péclet:** $Pe = v L / D$ (transport convectiv vs difuzie)
   - **Richardson:** $Ri = g \Delta\rho L / (\rho v^2)$

7. **07 — Navier–Stokes simplificat:**
   - Forma incompresibilă: $\rho (\partial v / \partial t + v \cdot \nabla v) = -\nabla p + \mu \nabla^2 v$
   - Calculator pentru curgere plană Couette

**Cum funcționează:**  
Totul este calculat în browser cu JavaScript. MathJax renderizează formulele LaTeX. Nu există cereri la server — calculatoarele sunt statice.

**Script-uri:**
- `v2/pages/calcule.js` — logica calculatoarelor
- `v2/pages/calcule.css`
- MathJax CDN (tex-chtml)

---

### 17.6 `bio.html` — Biologie moleculară ADN/ARN

**URL:** `https://atomify.info/app/bio.html`  
**Titlu:** "Atomify · Biologie · ADN/ARN"  
**Categorie:** Calcul · Vol. IV

**Scopul paginii:**  
Conversia și analiza secvențelor de acizi nucleici — ADN complementar, ARN mesager, compoziție nucleotidică.

**Funcționalitățile principale:**

1. **Formularul de secvență ADN:**
   - Textarea cu maxim 5000 caractere
   - Alfabet acceptat: A, T, G, C (spațiile și liniile noi ignorate)
   - Buton "Transcrie" (sau Ctrl+Enter)
   - Buton "Secvență aleatoare"

2. **Rezultatele transcripției:**
   - **Lanțul complementar ADN** (A↔T, G↔C)
   - **ARN mesager (mRNA)** transcris (T→U în ADN complementar)
   - **Compoziția nucleotidică:** număr și procentaj A, T, G, C
   - **Lungimea secvenței** (număr baze)
   - Vizualizare colorată: A (verde), T (roșu), G (albastru), C (portocaliu)

3. **Biblioteca de secvențe exemplu:**
   - Gene cunoscute sau fragmente tipice

**Regulile biologice aplicate:**
```
ADN sens:         A  T  G  C
ADN complementar: T  A  C  G
ARN mesager:      U  A  C  G  (complementar ADN-ului matriță = antiparalel față de sens)
```

**Cum funcționează:**  
Totul este calculat în browser cu JavaScript — fără cereri la server. Funcțiile de conversie sunt simple:
- `complementDNA(seq)` — înlocuiește A↔T, G↔C
- `transcribeToRNA(dnaComplement)` — înlocuiește T→U

**Script-uri:**
- `v2/pages/bio.js`
- `v2/pages/bio.css`

---

### 17.7 `chestionare.html` — Chestionare BAC

**URL:** `https://atomify.info/app/chestionare.html`  
**Titlu:** "Atomify · Chestionare BAC"  
**Categorie:** Pregătire · Vol. VI

**Scopul paginii:**  
Chestionare de chimie cu timp limitat pentru pregătirea examenului de bacalaureat. Autentificare necesară.

**Funcționalitățile principale:**

1. **Biblioteca de chestionare (view #quizLibraryView):**
   - Carduri pentru fiecare chestionar (titlu, descriere, număr întrebări, timp limită)
   - Chestionare regulare (din `quiz-data.js`) + chestionare personalizate de profesori
   - Badge "Clasă" pentru chestionarele din clase virtuale
   - Click pe card → pornire sesiune

2. **Sesiunea activă de chestionar (view #quizSessionView):**
   - **Header sesiune:** titlul chestionarului + cronometru descrescător
   - **Progress bar** (procentaj răspunsuri date)
   - **Navigare prin puncte** (quiz dots) — click pe punct = sari la întrebarea respectivă; verde = răspuns dat, portocaliu = curentă, gol = neanswered
   - **Corpul întrebării:** text + opțiuni (radio buttons pentru single choice, input text pentru întrebări open-ended)
   - **Butoane:** Înapoi, Finalizează testul, Înainte
   - **Cronometru:** când ajunge la 0, testul se trimite automat

3. **Rezultatele (afișate după submit):**
   - Scor final (ex: 7/10)
   - Procentaj
   - Timp utilizat
   - Detaliu pentru fiecare întrebare: corect/greșit + răspunsul corect + explicație

**Cum funcționează în spate:**

**Pornire chestionar:**
1. Click pe card → `GET /api/quiz/:quizId`
2. Serverul preia întrebările din `quiz-data.js`
3. **Randomizare întrebări:** Fisher-Yates shuffle pe array-ul de întrebări
4. **Randomizare opțiuni:** pentru fiecare întrebare multi-choice, opțiunile sunt amestecate
5. Se creează un `optionMapping` care mapează noul index → indexul original
6. Serverul returnează întrebările randomizate **fără răspunsurile corecte** (safe)

**Trimitere răspunsuri:**
1. Utilizatorul apasă "Finalizează" sau expiră timpul
2. `POST /api/quiz/:quizId/submit` cu `{ answers: {qId: selectedIndex}, timeTaken, questionMappings }`
3. `questionMappings` conține `optionMapping` pentru fiecare întrebare (trimis înapoi la server)
4. Serverul remapează indexii selectați la indexii originali: `mappedUserAnswer = optionMapping[userAnswer]`
5. Compară cu `question.correctAnswer` (indexul original)
6. Calculează scorul, procentajul
7. Salvează în `quiz_results` și `user_quiz_results`
8. Actualizează statisticile și verifică insigne
9. Trimite email cu nota (dacă preferință activă)
10. Returnează JSON cu scor + detalii per întrebare

**Întrebări open-ended (tip text):**
- Răspunsul utilizatorului este normalizat: lowercase, eliminare diacritice (ă→a, î→i, ș→s, ț→t), eliminare punctuație extra
- Comparat cu lista de răspunsuri corecte acceptate (`correctAnswers[]`)
- Matching fuzzy — "oxigen" și "Oxigen" sunt echivalente

**Chestionare de clasă:**
- ID-ul are prefixul `classroom_` (ex: `classroom_42`)
- Serverul verifică că utilizatorul este membru al clasei înainte de a da acces
- Fluxul este identic cu chestionarele regulare

**Suport MathJax:**
Întrebările pot conține notație LaTeX ($ ... $ inline sau $$ ... $$ display). MathJax este configurat cu:
```javascript
window.MathJax = {
  tex: { inlineMath: [['$','$'], ['\\(','\\)']], ... },
  options: { skipHtmlTags: ['script','noscript','style',...] }
}
```

**Script-uri:**
- `v2/pages/chestionare.js` — logica completă a chestionarelor
- `v2/pages/chestionare.css`
- MathJax CDN

---

### 17.8 `leaderboard.html` — Clasament

**URL:** `https://atomify.info/app/leaderboard.html`  
**Titlu:** "Atomify · Clasament"  
**Categorie:** Comunitate · Vol. VII

**Scopul paginii:**  
Clasamentul studenților pe platformă. Autentificare necesară.

**Funcționalitățile principale:**

1. **Statisticile personale ale utilizatorului:**
   - Best score per chestionar
   - Timp mediu
   - Locul în clasament global

2. **Filtrele clasamentului:**
   - **Chestionar:** dropdown pentru a filtra după un quiz specific sau toate
   - **Clasă:** vizibil dacă utilizatorul e în clase — filtrează clasamentul clasei

3. **Tab-urile de clasament:**
   - **Global:** toți studenții de pe platformă, ordonați descrescător după procentaj, crescător după timp (la egalitate de procentaj)
   - **Național:** filtrat după țara utilizatorului curent (necesită setarea țării în profil)
   - **Clasă:** studenții dintr-o clasă specifică

4. **Podiumul (top 3):**
   - Afișare specială pentru locurile 1, 2, 3 cu medalii

5. **Tabelul complet:**
   - Rang, username, scor, procentaj, timp, data

**Cum funcționează în spate:**

- Tab "Global" → `GET /api/leaderboard/global?quizId=...&limit=50`
  - Filtru: `WHERE u.role = 'student'` (profesorii nu apar)
  - Ordine: `percentage DESC, time_taken ASC` (scor maxim, timp minim)
  - `ROW_NUMBER() OVER (ORDER BY ...)` pentru rang

- Tab "Național" → `GET /api/leaderboard/national?quizId=...`
  - Serverul găsește mai întâi țara utilizatorului curent
  - Dacă nu are setată țara → eroare cu mesaj să seteze țara din profil
  - Filtrare: `WHERE u.country = ?`

- Tab "Clasă" → `GET /api/leaderboard/class/:classId?quizId=...`
  - Verifică că utilizatorul e în acea clasă (student sau profesor)
  - Filtrare: `JOIN class_members WHERE class_id = ?`

**Script-uri:**
- `v2/pages/leaderboard.js`
- `v2/pages/leaderboard.css`

---

### 17.9 `istoric.html` — Istoric personal

**URL:** `https://atomify.info/app/istoric.html`  
**Titlu:** "Atomify · Istoric personal"  
**Categorie:** Comunitate · Vol. VIII

**Scopul paginii:**  
Jurnalul de activitate personală al utilizatorului. Autentificare necesară.

**Funcționalitățile principale:**

1. **Statistici rezumate (overview):**
   - Total izomeri generați
   - Total chestionare completate
   - Cel mai bun scor obținut
   - Ultima activitate

2. **Jurnalul cronologic:**
   - Filtrare: "Toate activitățile", "Izomeri", "Chestionare"
   - Fiecare intrare: dată, tip activitate, detalii (formulă + număr izomeri sau quiz + scor)
   - Sortare cronologică descrescătoare (cele mai recente primele)

3. **Cele mai bune scoruri:**
   - Tabel grupat pe quiz (un rând per quiz, cel mai bun scor)
   - Număr tentative per quiz

**Cum funcționează în spate:**  
`GET /user-history` returnează toate datele:
```json
{
  "isomers": [{ formula, isomer_count, generated_at }, ...],
  "quizSummary": [{ quiz_name, best_score, total_questions, attempts, last_attempt }, ...],
  "allQuizResults": [{ quiz_name, score, total_questions, completed_at }, ...]
}
```

Frontul combină cele două liste (`isomers` + `allQuizResults`) și le sortează cronologic.

**Script-uri:**
- `v2/pages/istoric.js`
- `v2/pages/istoric.css`

---

### 17.10 `profile.html` — Profil și insigne

**URL:** `https://atomify.info/app/profile.html`  
**Titlu:** "Atomify · Profilul meu"  
**Categorie:** Comunitate · Vol. IX

**Scopul paginii:**  
Profilul personal cu insignele câștigate, statisticile cumulate și setările contului. Autentificare necesară.

**Funcționalitățile principale:**

1. **Identitatea utilizatorului:**
   - Avatarul cu inițiala numelui
   - Username, email, rol (student/profesor)
   - Stare cont (cont Google sau cont clasic)

2. **Statisticile cumulate:**
   - Izomeri generați total
   - Chestionare completate total
   - Scor mediu
   - Streak zilnic curent și maxim
   - Zile active total

3. **Insignele câștigate:**
   - Grid cu insignele obținute (icon, nume, descriere, data câștigării)
   - Badge raritate colorat (common/rare/epic/legendary)
   - Insignele necâștigate cu bara de progres

4. **Notificările:**
   - Insigne noi câștigate marcate ca "new"
   - Buton "Marchează toate ca citite"

**Cum funcționează în spate:**

`GET /api/profile` returnează tot:
```json
{
  "user": { id, username, email, role, country },
  "stats": { isomers_generated, quizzes_completed, ... },
  "badges": [{ badge info + earned_at }],
  "badge_progress": [{ badge_id, current_progress }],
  "notifications": [{ type, badge_id, read }]
}
```

**Script-uri:**
- `v2/pages/profile.js`
- `v2/pages/profile.css`

---

### 17.11 `admin.html` — Panoul contului

**URL:** `https://atomify.info/app/admin.html`  
**Titlu:** "Atomify · Cont"  
**Categorie:** Cont · Vol. X

**Scopul paginii:**  
Pagina centrală de administrare a contului — diferite funcționalități în funcție de rol. Autentificare necesară.

**Secțiunile paginii:**

**01 — Identitate + statistici rapide:**
- Avatarul cu inițiala, username, taguri (rol, tipul contului)
- Statistici relevante rolului curent

**02 — Alegerea rolului (DOAR dacă utilizatorul nu are rol):**
- Apare la prima autentificare, după înregistrare sau Google OAuth
- Două butoane: "Student" și "Profesor"
- La click: `POST /set-role` cu `{ role: 'student' | 'professor' }`
- Odată ales, rolul nu mai poate fi schimbat (decât de admin)

**Secțiunile PROFESORULUI:**

**03 — Clasele mele:**
- Lista claselor create, numărul de studenți
- Buton "Creează clasă nouă" → `POST /create-class`
- Click pe clasă → gestionare membrii

**04 — Gestionare clasă (panel expandat):**
- Lista membrilor cu data intrării
- Input autocomplete pentru invitare student (caută live prin `/search-users`)
- Buton "Invită" → `POST /invite-student`
- Lista invitațiilor în așteptare
- Buton "Elimină student" → `POST /remove-student`

**05 — Teme:**
- Creare temă nouă: selectează clasa, chestionarul, termenul limită, numărul maxim de încercări
- Lista temelor active cu statistici (câți studenți au trimis / total)
- Click pe temă → tabelul cu răspunsurile studenților, clasament intern

**06 — Chestionare personalizate:**
- Creator vizual de chestionare: adaugă întrebări (multiple choice sau open-ended)
- Publicarea chestionarului pentru clasă

**Secțiunile STUDENTULUI:**

**03 — Clasele mele:**
- Lista claselor în care e înscris, cu profesorul
- Lista invitațiilor în așteptare
- Butoane "Acceptă" / "Refuză" → `POST /respond-invitation`
- Buton "Iese din clasă" → `POST /exit-classroom`

**04 — Temele mele:**
- Lista temelor active (cu termenul limită, statusul — trimis/netrimis, depășit)
- Click → pornire sesiune chestionar pentru temă
- Temele expirate sunt marcate vizual

**Secțiunile COMUNE (ambele roluri):**

**07 — Setările contului:**
- **Schimbare parolă** (doar conturi clasice): câmpuri parolă curentă + parolă nouă × 2 + validare identică
- **Setarea țării:** dropdown cu lista țărilor (necesară pentru clasamentul național)
- **Preferințe email:** toggle-uri granulare (teme noi, note, newsletter)
- **Abonare newsletter:** cu email-ul contului sau altul

**08 — Zona periculoasă:**
- **Ștergere cont:** buton "Șterge contul" + confirmare parolă (sau fără parolă pentru conturi Google)
- Ștergerea este **permanentă și ireversibilă** — CASCADE DELETE în toată baza de date

**Cum funcționează în spate:**  
Pagina face un `GET /user` la load pentru a determina rolul și a afișa secțiunile corecte. Fiecare acțiune face un request separat la API-ul corespunzător.

**Script-uri:**
- `v2/pages/admin.js` — logica completă (mult cod, gestionează toate secțiunile)
- `v2/pages/admin.css`

---

### 17.12 `privacy.html` — Politica de confidențialitate

**URL:** `https://atomify.info/app/privacy.html`  
**Locație:** `/var/www/Atomify/v2/app/privacy.html`

**Scopul paginii:**  
Documentul legal cu politica de confidențialitate GDPR a platformei Atomify.

**Conținut:**
- Ce date colectăm (email, username, activitate educațională)
- Cum le folosim (personalizare, clasamente, notificări)
- Cât timp le păstrăm
- Drepturile utilizatorului (acces, ștergere, portabilitate)
- Informații de contact

---

## 18. Securitatea aplicației

### Parole
- Hash bcrypt cu **10 runde de salt** la înregistrare (2^10 = 1024 iterații)
- Hash bcrypt cu **12 runde de salt** la schimbarea parolei (mai secure)
- Parola originală NU este stocată niciodată — doar hash-ul
- Verificarea se face cu `bcrypt.compare()` — time-constant (rezistent la timing attacks)

### Validarea input-urilor
- Username: maxim 50 caractere, nu gol, fără profanitate
- Parolă: minim 8 caractere, cel puțin o literă mare, cel puțin o cifră
- Email: verificat că conține `@`
- Formulele chimice: whitelist format, blacklist molecule imposibile
- Toate câmpurile din POST body sunt validate înainte de inserare în DB
- Toate parametrii de rute (`:classId`, `:quizId`) sunt parsate și validate

### Protecția rutelor
- Rutele sensibile verifică `req.session.userId` sau `req.user` (Passport)
- Ownership-ul verificat la fiecare acțiune: un profesor poate modifica doar clasele lui
- Un student poate accesa un quiz de clasă doar dacă e memebru al acelei clase

### SQL Injection
- Toate query-urile SQLite folosesc **parametri pregătiți** (prepared statements):
  ```javascript
  userDb.get("SELECT * FROM users WHERE id = ?", [userId], callback)
  ```
- NU se concatenează niciodată input-ul utilizatorului direct în SQL

### Sesiuni
- Sesiunile sunt stocate în SQLite, nu în memorie (sigur la restart)
- La logout: `req.logout()` + `req.session.destroy()` + `res.clearCookie('connect.sid')`
- `saveUninitialized: false` — nu se creează sesiuni pentru vizitatori anonimi

### HTTPS și transport
- Tot traficul este forțat prin HTTPS (Nginx face redirect 301 de pe HTTP)
- Certificat SSL Let's Encrypt cu reînnoire automată
- Header-uri proxy corecte transmise la Node.js

### Filtrarea conținutului
- Anti-profanitate aplicată pe username-uri, clase, teme
- Normalizare leetspeak pentru detectare robustă

### Variabile sensibile
- Google OAuth credentials, Gmail password — stocate în `.env` (nu în cod)
- `.env` este în `.gitignore` (NU în repository)

### Limitări cunoscute (de îmbunătățit)
- **Secretul sesiunii** (`"change_this_to_a_strong_random_value"`) este hardcodat — trebuie mutat în `.env`
- **CORS** este permisiv (`app.use(cors())`) — în producție ar trebui limitat la domenii specifice
- **Rate limiting** nu este implementat — rutele de login/register pot fi atacate prin brute force
- **HTTPS force** în Node.js este comentat din cauza unui redirect loop cu Nginx (Nginx face redirect-ul, nu Node.js — correct)

---

## 19. Fișierele JavaScript partajate

### `/app/auth.js` — Modulul de autentificare
Singleton global `window.AtomifyAuth` descris detaliat la secțiunea 7.

### `/app/navbar.js` — Bara de navigare
Generează și injectează navbar-ul în `<header class="site-header">` pe toate paginile.
- Primește `initNavbar('pageKey')` pentru a marca pagina activă
- Ascultă `atomify:auth-changed` și se re-renderizează automat la login/logout
- Suport: desktop dropdown, mobile drawer (hamburger menu)
- Theme switcher: buton light/dark mode
- Dropdown utilizator: link la profil, istoric, admin, buton logout

### `/app/pwa.js` — Progressive Web App
- Înregistrează Service Worker-ul (`/sw.js`)
- Gestionează butonul de instalare
- Detectează dacă e deja instalat (standalone mode)

### `/app/sw.js` — Service Worker
- Cache strategic pentru resurse statice (CSS, JS, imagini)
- Fetch interceptor: cache-first pentru assets, network-first pentru API
- Curăță cache-ul vechi la activare

### `/app/logo-theme-switcher.js` — Comutare logouri
- Schimbă automat logoul între versiunea light și dark în funcție de tema aleasă
- Sincronizat cu media query `prefers-color-scheme` și cu butonul manual

### `/app/google-translate.js` — Traducere Google
- Integrare Google Translate pentru traducerea paginii de landing
- Disponibil doar pe pagina principală index.html

### `/app/v2/shared.js` — Utilitare partajate
Funcții comune reutilizate de paginile v2:
- Gestionare modală autentificare
- Formatare date și numere
- Animații count-up
- Funcții helper pentru fetch cu gestionare erori

### `/quiz-data.js` — Datele chestionarelor
Fișier JavaScript cu toate chestionarele predefinite:
```javascript
module.exports = {
  'chimie-organica-1': {
    title: 'Chimie organică — Hidrocarburi',
    description: '...',
    timeLimit: 600,  // secunde
    questions: [
      {
        id: 'q1',
        question: 'Care este formula benzenului?',
        options: ['C6H6', 'C6H12', 'C6H14', 'C5H6'],
        correctAnswer: 0,  // index 0 = C6H6
        explanation: 'Benzenul are formula C6H6...'
      },
      // ...
    ]
  },
  // alte chestionare...
}
```

---

## 20. Structura directoarelor

```
/var/www/Atomify/v2/
├── server.js                  ← Serverul principal Express.js (~5600 linii)
├── package.json               ← Dependențele npm
├── package-lock.json
├── ecosystem.config.js        ← Configurație PM2
├── .env                       ← Variabile sensibile (NU în git!)
├── users.db                   ← Baza de date SQLite (utilizatori, clase, etc.)
├── sessions.db                ← Sesiunile active
├── MAYGEN-1.8.jar             ← Generatorul de izomeri (Java)
├── quiz-data.js               ← Datele chestionarelor predefinite
├── init_badges_db.js          ← Script de inițializare insigne
├── init_elements_db.js        ← Script de inițializare elemente chimice
├── init_profanity_db.js       ← Script de inițializare cuvinte interzise
├── landing-tutorial.js        ← Script tutorial pentru landing page
├── generate-icons.html        ← Unealtă de generare iconițe PWA
├── index.html                 ← Landing page (pagina principală)
├── styles.css                 ← CSS-ul landing page-ului
├── privacy.html               ← Politica de confidențialitate (rădăcină)
├── siret.png                  ← Fotografia Siret Luca-Alexandru
├── zevri.png                  ← Fotografia Zevri Matei-Tudor
├── c4h10.smi/                 ← Cache SMILES pentru C4H10
├── c4h8.smi/                  ← Cache SMILES pentru C4H8
├── [alte .smi cache-uri]      ← ...
├── node_modules/              ← Dependențele npm (nu în git)
├── test/                      ← Teste unitare
└── app/                       ← Aplicația principală (toate paginile)
    ├── isomers.html
    ├── equations.html
    ├── masa.html
    ├── calcule.html
    ├── bio.html
    ├── chestionare.html
    ├── leaderboard.html
    ├── istoric.html
    ├── profile.html
    ├── admin.html
    ├── privacy.html
    ├── manifest.json          ← Manifestul PWA
    ├── sw.js                  ← Service Worker
    ├── pwa.js                 ← Script instalare PWA
    ├── auth.js                ← Modulul de autentificare (singleton)
    ├── navbar.js              ← Bara de navigare partajată
    ├── navbar.css             ← Stiluri navbar (import în chrome.css)
    ├── logo-theme-switcher.js ← Comutare logo light/dark
    ├── google-translate.js    ← Integrare Google Translate
    ├── tutorial.js            ← Tutorial interactiv
    ├── style.css              ← CSS legacy
    ├── logo.png               ← Logo principal
    ├── logo_light.png         ← Logo pentru tema light
    ├── logo_dark.png          ← Logo pentru tema dark
    └── v2/                    ← Sistemul de design v2
        ├── core.css           ← Reset + variabile + tipografie
        ├── components.css     ← Componente reutilizabile
        ├── chrome.css         ← Navbar, header, footer, modal auth
        ├── shared.js          ← Funcții JavaScript partajate
        └── pages/             ← CSS + JS per pagină
            ├── isomers.css / isomers.js
            ├── equations.css / equations.js
            ├── masa.css / masa.js
            ├── calcule.css / calcule.js
            ├── bio.css / bio.js
            ├── chestionare.css / chestionare.js
            ├── leaderboard.css / leaderboard.js
            ├── istoric.css / istoric.js
            ├── profile.css / profile.js
            └── admin.css / admin.js
```

---

## Rezumat rapid (TL;DR)

| Aspect | Detaliu |
|--------|---------|
| **Domeniu** | https://atomify.info |
| **Stack** | Node.js 18 + Express 4 + SQLite3 + Nginx + PM2 |
| **OS** | Ubuntu Linux |
| **SSL** | Let's Encrypt (Certbot), reînnoire automată |
| **Autentificare** | Session + bcrypt (parole) + Google OAuth2 |
| **Generare izomeri** | MAYGEN-1.8.jar (Java 17) prin subprocess |
| **Email** | Nodemailer + Gmail SMTP |
| **Baza de date** | SQLite3, 17 tabele, în fișier local users.db |
| **Sesiuni** | connect-sqlite3 → sessions.db, 1 zi TTL |
| **PWA** | Service Worker + manifest.json |
| **Design** | CSS custom properties, dual theme, MathJax, SmilesDrawer |
| **Paginile** | 11 pagini HTML + landing page |
| **Roluri** | student, professor (ales la prima autentificare) |
| **Sisteme** | Insigne, Clasamente (global/național/clasă), Teme, Clase virtuale, Newsletter |

---

*Documentație generată automat pe baza codului sursă al aplicației Atomify v2 — Mai 2026*
