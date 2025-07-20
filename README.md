# 🧪 Atomify - Platforma Educațională de Chimie și Matematică

> **Platformă educațională inovatoare creată de campioni olimpici pentru învățarea interactivă a chimiei și matematicii**

[![Node.js](https://img.shields.io/badge/Node.js-18.19.1-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-5.1.7-orange.svg)](https://www.sqlite.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

## 📋 Cuprins

- [Despre Proiect](#despre-proiect)
- [Arhitectura Aplicației](#arhitectura-aplicației)
- [Funcționalități](#funcționalități)
- [Tehnologii Folosite](#tehnologii-folosite)
- [Instalare și Configurare](#instalare-și-configurare)
- [Utilizare](#utilizare)
- [API Documentation](#api-documentation)
- [Securitate](#securitate)
- [Testare](#testare)
- [Deployment](#deployment)
- [Contribuitori](#contribuitori)

## 🎯 Despre Proiect

**Atomify** este o platformă educațională inovatoare care revoluționează învățarea chimiei și matematicii prin tehnologii moderne și conținut creat de campioni olimpici. Aplicația combină expertiza academică de top cu tehnologia modernă pentru a oferi o experiență de învățare unică și captivantă.

### 🌟 Caracteristici Principale

- **Generare Izomeri Avansată** - Algoritmi unici pentru generarea și analiza izomerilor organici
- **Calculatoare Specializate** - Instrumente pentru masă molară, formule chimice și ecuații matematice
- **Chestionare Interactive** - Teste personalizate cu feedback detaliat
- **Sistem de Insigne** - Gamification pentru motivația utilizatorilor
- **Clase Virtuale** - Management pentru profesori și studenți
- **PWA (Progressive Web App)** - Se instalează ca aplicație nativă cu funcționalități avansate
- **Internaționalizare** - Suport pentru multiple limbi prin Google Translate

## 🏗️ Arhitectura Aplicației

### Secțiunea I.1. - Tehnologii Folosite

#### **Backend Stack:**
- **Node.js v18.19.1** - Runtime JavaScript pentru server
- **Express.js v4.21.2** - Framework web pentru API REST
- **SQLite v5.1.7** - Baza de date relațională ușoară
- **Passport.js v0.7.0** - Autentificare OAuth cu Google
- **bcrypt v6.0.0** - Criptarea parolelor
- **Nodemailer v7.0.5** - Sistem de notificări prin email
- **Puppeteer v24.12.1** - Generarea de rapoarte PDF

#### **Frontend Stack:**
- **HTML5** - Structura semantică
- **CSS3** - Stilizare modernă cu variabile CSS și animații
- **JavaScript ES6+** - Logica client-side
- **PWA** - Service Workers pentru instalare ca aplicație nativă
- **Google Translate API** - Internaționalizare

#### **Justificarea Tehnologiilor:**

1. **Node.js + Express**: Performanță ridicată, ecosistem bogat, dezvoltare rapidă
2. **SQLite**: Ușurință în deployment, nu necesită server separat, perfect pentru aplicații educaționale
3. **PWA**: Accesibilitate pe toate dispozitivele, instalare ca aplicație nativă
4. **Google OAuth**: Securitate ridicată, experiență utilizator simplificată

### Secțiunea I.2. - Proiectarea Arhitecturală

#### **Paradigme și Tehnici de Programare:**

1. **Arhitectura MVC (Model-View-Controller)**
   - Separarea logicii de business de interfața utilizator
   - Modularitate și mentenanță ușoară

2. **Programare Orientată pe Obiecte**
   - Clase pentru gestionarea utilizatorilor, chestionarelor, badge-urilor
   - Encapsulare și abstractizare

3. **Programare Funcțională**
   - Funcții pure pentru calcule matematice și chimice
   - Immutability pentru date

4. **Design Patterns**
   - Singleton pentru conexiunea la baza de date
   - Factory pentru crearea de chestionare
   - Observer pentru sistemul de notificări

#### **Structura Proiectului:**
```
izomer/
├── server.js                 # Server principal Express
├── package.json             # Dependențe și configurare
├── public/                  # Fișiere statice
│   ├── app/                # Aplicația principală
│   │   ├── isomers.html    # Generare izomeri
│   │   ├── chestionare.html # Chestionare interactive
│   │   ├── calcule.html    # Calculatoare
│   │   ├── admin.html      # Panou administrare
│   │   └── style.css       # Stiluri
│   ├── landing-tutorial.js # Tutorial landing page
│   └── index.html          # Landing page
├── users.db                # Baza de date utilizatori
├── sessions.db             # Sesiuni utilizatori
└── init_*.js              # Scripturi de inițializare
```

### Secțiunea I.3. - Portabilitate

- **Cross-Platform**: Funcționează pe Windows, macOS, Linux
- **Responsive Design**: Adaptare la toate rezoluțiile (mobile, tablet, desktop)
- **PWA**: Instalare ca aplicație nativă pe orice dispozitiv
- **Browser Compatibility**: Suport pentru toate browserele moderne

## ⚛️ Funcționalități Detaliate

### Secțiunea IV.1. - Funcționalitate, Utilitate și Interactivitate

#### **🧪 Generare Izomeri - Nucleul Aplicației**

##### **Algoritmi Avansați de Generare:**
- **Input Formula**: Utilizatorul introduce formula chimică (ex: C4H10)
- **Validare Automată**: Sistemul verifică validitatea formulei folosind tabelul periodic integrat
- **Generare Completă**: Algoritmii generează TOȚI izomerii posibili pentru formula dată
- **Analiza Tipurilor**: Clasificare automată în izomeri de catenă, poziție și funcțiune
- **Verificare Duplicat**: Eliminarea automată a duplicatelor prin algoritmi de hash molecular

##### **Funcționalități Avansate:**
```javascript
// Exemplu de utilizare în aplicație
1. Introduce formula: "C5H12"
2. Sistem verifică validitatea chimică
3. Generează automat toți izomerii:
   - n-pentanul (catenă dreaptă)
   - 2-metilbutanul (ramificat)
   - 2,2-dimetilpropanul (foarte ramificat)
4. Export în format PDF pentru studiu
```

##### **Caracteristici Tehnice:**
- **Baza de Date Elemente**: 118 elemente chimice cu mase atomice precise
- **Validare Formule**: Verificare sintaxă și fezabilitate chimică
- **Nomenclatura IUPAC**: Denumire automată conform standardelor internaționale
- **Optimizare Performanță**: Gestionarea eficientă a formulelor complexe
- **Cache Rezultate**: Salvarea rezultatelor pentru acces rapid

#### **🧮 Calculatoare Specializate - Instrumente Avansate**

##### **Calculator Masă Molară:**
```javascript
Funcționalități:
1. Input: Formula chimică (ex: Ca(OH)2)
2. Parsing automat al formulei:
   - Identificare elemente: Ca, O, H
   - Detectare coeficienți: Ca(1), O(2), H(2)
   - Calcul: 40.078 + 2×15.999 + 2×1.0079 = 74.093 g/mol
3. Rezultat cu precizie la 3 zecimale
4. Istoricul calculelor salvat local
```

##### **Calculator Ecuații Chimice:**
```javascript
Proces de Balanțare:
1. Input ecuație nebalansată: "Al + O2 → Al2O3"
2. Algoritm matricial de rezolvare:
   - Construire sistem ecuații liniare
   - Rezolvare prin eliminarea Gauss
   - Găsire coeficienți minimali întregi
3. Output: "4 Al + 3 O2 → 2 Al2O3"
4. Verificare conservare masă atomică
```

##### **Calculator Procente de Masă:**
- **Calculează compoziția procentuală** a fiecărui element din compus
- **Analiza purității** pentru mostre reale
- **Conversii între unități** (g/mol, %, ppm)

#### **📝 Chestionare Interactive - Sistem Educațional Complet**

##### **Tipuri de Chestionare:**

###### **1. Chestionare Izomeri:**
```javascript
Structura întrebării:
{
  "question": "Câți izomeri are C6H14?",
  "type": "multiple_choice",
  "options": ["3", "4", "5", "6"],
  "correct": "5",
  "explanation": "C6H14 are 5 izomeri: n-hexan, 2-metilpentan, 3-metilpentan, 2,2-dimetilbutan, 2,3-dimetilbutan",
  "difficulty": "intermediate",
  "time_limit": 60
}
```

###### **2. Chestionare Nomenclatură:**
- **Identificare grupuri funcționale**
- **Prioritatea grupurilor** în nomenclatură
- **Exerciții cu structuri complexe**

###### **3. Chestionare Masă Molară:**
- **Calcule rapide** de mase molare
- **Probleme cu procente de masă**
- **Determinarea formulei moleculare** din date experimentale

##### **Sistem de Evaluare Adaptiv:**
```javascript
Algoritm de scoring:
- Răspuns corect la timp: 100% puncte
- Răspuns greșit: 0% puncte + explicație detaliată
```

##### **Feedback Educațional:**
- **Explicații detaliate** pentru fiecare răspuns greșit
- **Referințe către materiale** de studiu
- **Sugestii de îmbunătățire** bazate pe performanță
- **Linkuri către exerciții similare**

#### **🏆 Sistem de Insigne (Gamification) - Motivație Educațională**

##### **Categorii de Insigne:**

###### **1. Insigne de Progres:**
```javascript
Badge Examples:
{
  "First Steps": "Completează primul chestionar",
  "Quick Learner": "Răspunde corect la 10 întrebări consecutive",
  "Speed Demon": "Răspunde în sub 10 secunde",
  "Perfectionist": "Obține 100% la un chestionar",
  "Dedication": "Conectează-te 7 zile consecutive"
}
```

###### **2. Insigne de Specializare:**
```javascript
Chemistry Badges:
{
  "Isomer Master": "Generează peste 100 de izomeri",
  "Formula Expert": "Calculează 50 de mase molare",
  "Nomenclature Pro": "Denumește corect 30 de compuși",
  "Equation Balancer": "Balansează 25 de ecuații",
  "Organic Genius": "Specializare în chimie organică"
}
```

###### **3. Insigne de Timp:**
- **Night Owl**: Studiază după miezul nopții
- **Early Bird**: Studiază înainte de 6 dimineața
- **Weekend Warrior**: Activitate în weekend
- **Marathon**: Sesiuni de studiu de peste 2 ore

##### **Sistemul de Puncte și Clasamente:**
```javascript
Point System:
- Chestionar completat: 10-50 puncte (în funcție de dificultate)
- Izomer generat: 5 puncte
- Calcul masă molară: 3 puncte
- Zi consecutivă: 2 puncte
- Răspuns perfect rapid: Bonus 10 puncte


#### **👥 Clase Virtuale - Management Educațional**

##### **Pentru Profesori:**

###### **Crearea și Gestionarea Claselor:**
```javascript
Class Management System:
1. Profesor creează clasa:
   - Nume clasă: "Chimie 12A"
   - Descriere: "Chimie organică - BAC 2024"
   - Cod acces: "CHIM12A24" (generat automat)
   
2. Invitarea studenților:
   - Partajare cod direct
   - Email invitations prin sistem
   - QR code pentru acces rapid
   
3. Monitorizarea progresului:
   - Dashboard cu statistici complete
   - Progresul individual al fiecărui student
   - Analiza punctelor slabe
```

###### **Instrumente pentru Profesori:**
- **Creator de Chestionare**: Interfață drag-and-drop pentru crearea testelor
- **Programarea Testelor**: Planificarea automată a evaluărilor
- **Rapoarte Detaliate**: Export PDF cu rezultatele clasei
- **Comunicare Directă**: Mesaje către studenți prin platformă

##### **Pentru Studenți:**

###### **Alăturarea la Clase:**
```javascript
Student Workflow:
1. Confirmă înscrierea cu un click
2. Accesează materialele specifice clasei
3. Primește notificări pentru teste noi
4. Vezi progresul față de colegii de clasă
```

###### **Dashboard Student:**
- **Progresul Personal**: Grafice interactive cu evoluția
- **Temele Următoare**: Lista cu deadline-urile apropiate
- **Punctajul în Clasă**: Poziția în clasament
- **Recomandări**: Exerciții personalizate bazate pe punctele slabe

#### **📧 Sistem de Newsletter și Comunicare**

##### **Newsletter Automat:**
```javascript
Email System Features:
1. Notificări Weekly:
   - Sumar activități săptămână
   - Noi funcționalități adăugate
   - Tips & tricks pentru chimie
   
2. Trigger-based Emails:
   - Welcome email la înregistrare
   - Congratulations pentru insigne noi
   - Reminder pentru activitate scăzută
   - Achievement notifications
```

##### **Personalizarea Comunicării:**
- **Preferințe Email**: Frecvența și tipul notificărilor
- **Segmentare**: Conținut diferit pentru studenți vs profesori
- **A/B Testing**: Optimizarea ratei de deschidere
- **Analytics**: Tracking engagement pentru îmbunătățire

#### **🔐 Sistem de Autentificare și Securitate**

##### **Google OAuth Integration:**
```javascript
Authentication Flow:
1. User clicks "Sign in with Google"
2. Redirect către Google OAuth server
3. User autorizează aplicația
4. Google returnează token + user info
5. Server validează token-ul
6. Creează/actualizează user în DB
7. Setează sesiune securizată
8. Redirect către dashboard
```

##### **Gestionarea Sesiunilor:**
- **Express-Session**: Sesiuni securizate cu SQLite storage
- **Cookie Security**: HttpOnly, Secure, SameSite attributes
- **Session Timeout**: Expirare automată după inactivitate
- **Multi-Device**: Sincronizare cross-device

##### **Protecția Datelor:**
```javascript
Security Measures:
- bcrypt hashing pentru parole (când există)
- Rate limiting pe API endpoints
- Input sanitization și validation
- SQL injection prevention
- XSS protection prin header security
- CORS configuration restrictivă
```

#### **📱 Progressive Web App (PWA) - Experiență Nativă**

##### **Instalare ca Aplicație:**
```javascript
PWA Installation Process:
1. Browser detectează PWA criteria
2. Afișează banner "Install App"
3. User acceptă instalarea
4. App se instalează în meniul aplicațiilor
5. Icon pe home screen
6. Rulare în fullscreen mode
```

##### **Service Worker Funcționalități:**
- **Cache Management**: Versionarea și actualizarea cache-ului
- **Background Updates**: Download silent al actualizărilor
- **Push Notifications**: Notificări real-time
- **App Shortcuts**: Acces rapid la funcții principale


##### **Istoricul Activităților:**
- **Timeline View**: Vizualizare cronologică a activităților
- **Search & Filter**: Căutare în istoric după dată/tip
- **Export Data**: Download istoric în format CSV/PDF
- **Statistics**: Analize detaliate ale performanței

#### **📊 Analytics și Raportare**

##### **Dashboard Analytics:**
```javascript
Analytics Data:
- Most popular features
- User engagement metrics
- Quiz completion rates
- Badge distribution
- Geographic user distribution
```

##### **Personal Statistics:**
- **Learning Curve**: Progresul în timp la chestionare
- **Strength Analysis**: Domeniile unde excelezi
- **Improvement Areas**: Punctele care necesită atenție

#### **🌐 Internaționalizare și Accesibilitate**

##### **Google Translate Integration:**
```javascript
Translation Features:
- 12 limbi suportate: RO, EN, FR, DE, ES, IT, PT, RU, ZH, JA, KO, AR
- Widget integrat în header
- Traducere automată a conținutului dinamic
- Păstrarea funcționalității după traducere
- Fallback la română pentru conținut netradus
```

##### **Responsive Design:**
- **Mobile First**: Optimizat pentru telefoane și tablete
- **Cross-Browser**: Compatibilitate cu toate browserele moderne
- **Touch Gestures**: Suport pentru swipe, pinch-to-zoom
- **Dark/Light Mode**: Comutare automată bazată pe preferințele sistemului


## 🛠️ Instalare și Configurare

### Cerințe Sistem
- Node.js v18.19.1 sau mai nou
- npm v9.2.0 sau mai nou
- SQLite3

### Pași de Instalare

1. **Clonează Repository-ul**
```bash
git clone https://github.com/your-username/atomify.git
cd atomify
```

2. **Instalează Dependențele**
```bash
npm install
```

3. **Configurează Variabilele de Mediu**
```bash
cp .env.example .env
# Editează .env cu configurațiile tale
```

4. **Inițializează Baza de Date**
```bash
node init_users_db.js
node init_badges_db.js
node init_elements_db.js
node init_profanity_db.js
```

5. **Configurează Google OAuth**
- Creează un proiect în Google Cloud Console
- Activează Google+ API
- Configurează OAuth 2.0
- Adaugă credențialele în .env

6. **Pornește Serverul**
```bash
npm start
# sau
node server.js
```

### Configurare Google OAuth

1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou
3. Activează Google+ API
4. Configurează OAuth consent screen
5. Creează credențiale OAuth 2.0
6. Adaugă în .env:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

## 📖 Utilizare

### Pentru Studenți
1. Accesează platforma
2. Conectează-te cu Google
3. Completează profilul (rol, țară)
4. Explorează funcționalitățile
5. Participă la chestionare și câștigă insigne

### Pentru Profesori
1. Conectează-te cu contul de profesor
2. Accesează panoul de administrare
3. Creează clase și invitați studenți
4. Gestionați chestionare și evaluări
5. Urmăriți progresul studenților

### Funcționalități PWA
1. Deschide platforma în browser
2. Apasă "Instalează Aplicația"
3. Accesează din meniul aplicațiilor
4. Interfață optimizată pentru mobile

## 🔌 API Documentation

### Autentificare
```
POST /auth/google
GET /auth/google/callback
GET /user
POST /logout
```

### Utilizatori
```
POST /set-role
POST /set-country
POST /change-password
POST /delete-account
```

### Chestionare
```
GET /api/quiz/:id
POST /api/quiz/:id/submit
GET /api/quiz-results/:id
```

### Izomeri
```
POST /api/check-isomer-count
POST /api/enumerate-isomers
GET /api/isomer-stats
```

### Badge-uri
```
GET /api/user-badges/:userId
POST /api/award-badge
GET /api/badge-requirements
```


#### **Modalități de Testare:**

1. **Testare Unitară**
   - Funcții matematice și chimice
   - Validarea formulelor
   - Algoritmi de generare izomeri

2. **Testare Integrare**
   - API endpoints
   - Autentificare OAuth
   - Baza de date

3. **Testare UI/UX**
   - Responsive design
   - Accesibilitate
   - Compatibilitate browser

4. **Testare Securitate**
   - Penetration testing
   - Validarea input-ului
   - Testarea autentificării

#### **Absența Erorilor:**
- ✅ Validarea tuturor input-urilor
- ✅ Gestionarea erorilor de server
- ✅ Fallback pentru funcționalități
- ✅ Logging pentru debugging

## 🚀 Deployment

### Pentru Produție

1. **Configurare Server**
```bash
# Instalează PM2 pentru process management
npm install -g pm2

# Pornește aplicația
pm2 start server.js --name "atomify"

# Configurează pentru restart automat
pm2 startup
pm2 save
```

2. **Configurare Nginx**
```nginx
server {
    listen 80;
    server_name atomify.info;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **SSL Certificate**
```bash
# Instalează Certbot
sudo apt install certbot python3-certbot-nginx

# Obține certificat SSL
sudo certbot --nginx -d atomify.info
```

## 👥 Contribuitori

### Echipa de Dezvoltare

#### **Zevri Matei Tudor** - Co-Fondator & Expert Chimie
- 🏆 Participant la Olimpiada Națională de Chimie
- Expert în chimie organică și anorganică
- Responsabil pentru conținutul chimic și algoritmi

#### **Siret Luca Alexandru** - Co-Fondator & Expert Matematică & Informatică
- 🏆 Participant la Olimpiada Națională de Matematică
- Expert în algoritmi și programare
- Responsabil pentru arhitectura tehnică


## 📞 Contact

- **Email**: atomify66@gmail.com
- **Website**: https://atomify.info
- **GitHub**: https://github.com/your-username/atomify

---

**Creat cu ❤️ de campioni olimpici pentru viitorul educației**

*Atomify - Revolutionează educația în Chimie și Matematică* 
