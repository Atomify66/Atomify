// Atomify Tutorial System
class AtomifyTutorial {
  constructor() {
    this.currentStep = 0;
    this.tutorials = {
      unified: [
        {
          title: "Configurare Completă Atomify 🎯",
          content: "Să configurăm împreună toate setările importante pentru experiența ta optimă cu Atomify!",
          action: "next",
          highlight: null
        },
        {
          title: "Navigare la Panoul de Administrare 👨‍🏫",
          content: "Vom merge la panoul de administrare pentru a configura rolul, regiunea și newsletter-ul.",
          action: "navigate-to-admin",
          highlight: null
        },
        {
          title: "Alege Rolul Tău 👤",
          content: "Selectează rolul care te descrie cel mai bine: Student, Profesor sau Administrator. Fiecare rol îți oferă funcționalități diferite.",
          action: "highlight-admin-role",
          highlight: ".role-selector, #roleSelect"
        },
        {
          title: "Selectează Regiunea 🌍",
          content: "Alege regiunea ta din România pentru conținut localizat, competiții regionale și statistici personalizate.",
          action: "highlight-admin-region",
          highlight: ".region-selector, #regionSelect"
        },
        {
          title: "Newsletter Personalizat 📧",
          content: "Activează newsletter-ul pentru a primi actualizări despre noi funcționalități, competiții și sfaturi de studiu personalizate.",
          action: "highlight-admin-newsletter",
          highlight: ".newsletter-section, #newsletterToggle"
        },
        {
          title: "Gestionare Clase 👥",
          content: "Creează clase virtuale, invita studenți și urmărește progresul clasei cu statistici detaliate.",
          action: "highlight-admin-classes",
          highlight: ".class-management, #createClass"
        },
        {
          title: "Configurare Completă ✅",
          content: "Perfect! Acum să instalăm Atomify ca aplicație pentru acces rapid și experiența optimă.",
          action: "show-admin-complete",
          highlight: null
        },
        {
          title: "Instalează Atomify 📱",
          content: "Transformă-ți telefonul într-un instrument puternic de învățare! Atomify poate fi instalat ca o aplicație nativă.",
          action: "highlight-pwa-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Beneficii Aplicație ⚡",
          content: "Aplicația îți oferă acces rapid, icon pe ecranul de start și o experiență similară cu aplicațiile native.",
          action: "show-install-benefits",
          highlight: null
        },
        {
          title: "Instalare iPhone 📱",
          content: "Pentru iPhone: apasă butonul Share din Safari și selectează 'Adaugă la ecranul de start'.",
          action: "highlight-ios-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Instalare Android 🤖",
          content: "Pentru Android: apasă meniul din Chrome și selectează 'Instalează aplicația'.",
          action: "highlight-android-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Instalare Desktop 💻",
          content: "Pentru Desktop: apasă butonul 'Instalează' din bara de adrese a browserului.",
          action: "highlight-desktop-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Gata de Utilizare! 🎉",
          content: "Felicitări! Ai configurat totul perfect și ești gata să începi aventura în lumea chimiei cu Atomify!",
          action: "show-final-complete",
          highlight: null
        }
      ],
      welcome: [
        {
          title: "Bun venit la Atomify! 🎉",
          content: "Atomify este o platformă educațională inovatoare pentru învățarea chimiei, creată de campioni olimpici. Să explorăm împreună toate funcționalitățile!",
          action: "next",
          highlight: null
        },
        {
          title: "Autentificare cu Google 🔐",
          content: "Pentru a salva progresul și a accesa toate funcționalitățile, creează-ți un cont! Poți să te conectezi rapid cu Google sau să creezi un cont tradițional.",
          action: "highlight-auth",
          highlight: ".auth-section, .auth-buttons, #loginBtn, #registerBtn"
        },
        {
          title: "Instalează ca Aplicație 📱",
          content: "Transformă-ți telefonul într-un instrument puternic de învățare! Atomify poate fi instalat ca o aplicație nativă pentru acces rapid.",
          action: "install-pwa",
          highlight: "#pwa-install-btn",
          buttonText: "Instalează App"
        },
        {
          title: "Navigare Principală 🧭",
          content: "Folosește meniul de navigare pentru a accesa diferitele funcționalități. Fiecare secțiune are un scop specific și te va ajuta în învățare.",
          action: "highlight-nav",
          highlight: ".nav-links"
        }
      ],
      admin: [
        {
          title: "Panou de Administrare 👨‍🏫",
          content: "Bun venit în panoul de administrare! Aici poți configura toate setările pentru experiența ta personalizată.",
          action: "next",
          highlight: null
        },
        {
          title: "Alege Rolul Tău 👤",
          content: "Selectează rolul care te descrie cel mai bine: Student, Profesor sau Administrator. Fiecare rol îți oferă funcționalități diferite.",
          action: "highlight-admin-role",
          highlight: ".role-selector, #roleSelect"
        },
        {
          title: "Selectează Regiunea 🌍",
          content: "Alege regiunea ta din România pentru conținut localizat, competiții regionale și statistici personalizate.",
          action: "highlight-admin-region",
          highlight: ".region-selector, #regionSelect"
        },
        {
          title: "Newsletter Personalizat 📧",
          content: "Activează newsletter-ul pentru a primi actualizări despre noi funcționalități, competiții și sfaturi de studiu personalizate.",
          action: "highlight-admin-newsletter",
          highlight: ".newsletter-section, #newsletterToggle"
        },
        {
          title: "Gestionare Clase 👥",
          content: "Creează clase virtuale, invita studenți și urmărește progresul clasei cu statistici detaliate.",
          action: "highlight-admin-classes",
          highlight: ".class-management, #createClass"
        },
        {
          title: "Configurare Completă ⚙️",
          content: "Perfect! Acum ai configurat toate setările importante. Poți reveni oricând în panoul de administrare pentru modificări.",
          action: "show-admin-complete",
          highlight: null
        }
      ],
      pwa: [
        {
          title: "Instalează Atomify 📱",
          content: "Felicitări! Acum că ai configurat contul, instalează Atomify ca o aplicație pentru acces rapid și experiența optimă.",
          action: "next",
          highlight: null
        },
        {
          title: "Beneficii Aplicație ⚡",
          content: "Aplicația îți oferă acces rapid, icon pe ecranul de start și o experiență similară cu aplicațiile native.",
          action: "show-install-benefits",
          highlight: null
        },
        {
          title: "Instalare iPhone 📱",
          content: "Pentru iPhone: apasă butonul Share din Safari și selectează 'Adaugă la ecranul de start'.",
          action: "highlight-ios-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Instalare Android 🤖",
          content: "Pentru Android: apasă meniul din Chrome și selectează 'Instalează aplicația'.",
          action: "highlight-android-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Instalare Desktop 💻",
          content: "Pentru Desktop: apasă butonul 'Instalează' din bara de adrese a browserului.",
          action: "highlight-desktop-install",
          highlight: "#pwa-install-btn"
        },
        {
          title: "Gata de Utilizare! 🎉",
          content: "Perfect! Acum ai Atomify instalat ca aplicație. Poți începe să explorezi toate funcționalitățile!",
          action: "show-pwa-complete",
          highlight: null
        }
      ],
      features: [
        {
          title: "Generare Izomeri ⚛️",
          content: "Funcția principală a Atomify! Introdu o formulă chimică (ex: C4H10) și vei vedea toți izomerii posibili cu structuri 3D interactive. Perfect pentru înțelegerea stereochimiei!",
          action: "navigate",
          target: "/app/isomers.html",
          highlight: "a[href='isomers.html']"
        },
        {
          title: "Chestionare Interactive 📝",
          content: "Testează-ți cunoștințele cu chestionare personalizate pentru BAC. Fiecare întrebare este adaptată la nivelul tău și îți oferă feedback detaliat pentru învățare.",
          action: "navigate",
          target: "/app/chestionare.html",
          highlight: "a[href='chestionare.html']"
        },
        {
          title: "Calculatoare Avansate 🧮",
          content: "Calculează masa molară, echilibrează ecuații chimice și rezolvă probleme complexe cu instrumentele noastre specializate pentru chimie.",
          action: "navigate",
          target: "/app/calcule.html",
          highlight: "a[href='calcule.html']"
        },
        {
          title: "Clasament și Competiții 🏆",
          content: "Compară-ți performanța cu alți studenți din România. Participă la competiții zilnice și urmărește progresul personal în timp real.",
          action: "navigate",
          target: "/app/leaderboard.html",
          highlight: "a[href='leaderboard.html']"
        }
      ],
      advanced: [
        {
          title: "Profilul Tău 👤",
          content: "Vizualizează statistici detaliate, insigne câștigate și progresul personal. Vezi câte izomeri ai generat, scorurile la chestionare și activitatea zilnică.",
          action: "navigate",
          target: "/app/profile.html",
          highlight: "a[href='profile.html']"
        },
        {
          title: "Istoric Personal 📊",
          content: "Revizuiește toate izomerii generați, rezultatele chestionarelor și calculele efectuate. Analizează progresul în timp și identifică zonele de îmbunătățire.",
          action: "navigate",
          target: "/app/istoric.html",
          highlight: "a[href='istoric.html']"
        },
        {
          title: "Sistem de Insigne 🏅",
          content: "Câștigă insigne pentru realizări! Vezi progresul în profilul tău și primește notificări când câștigi o insignă nouă. Fiecare insigne îți oferă motivație și recunoaștere.",
          action: "show-badges",
          highlight: null
        },
        {
          title: "Administrare (Profesori) 👨‍🏫",
          content: "Configurare completă pentru profesori! Alege regiunea ta, activează newsletter-ul, selectează rolul și gestionează clasele. Vezi toate opțiunile disponibile.",
          action: "show-admin-features",
          highlight: "a[href='admin.html']"
        }
      ],
      tips: [
        {
          title: "Scurtături Rapide ⌨️",
          content: "Folosește Ctrl+I pentru generare izomeri, Ctrl+Q pentru chestionare, Ctrl+C pentru calcule, Ctrl+L pentru clasament, Ctrl+P pentru profil.",
          action: "show-shortcuts",
          highlight: null
        },
        {
          title: "Acces Rapid 📱",
          content: "După instalare, Atomify va apărea pe ecranul de start al telefonului tău pentru acces rapid și ușor.",
          action: "next",
          highlight: null
        },
        {
          title: "Tema Personalizată 🌙",
          content: "Comută între tema deschisă și închisă folosind butonul din navigare. Tema închisă este perfectă pentru studiu nocturn.",
          action: "highlight-theme",
          highlight: ".theme-toggle"
        },
        {
          title: "Traducere în 12 Limbi 🌍",
          content: "Atomify este disponibil în 12 limbi! Folosește butonul de traducere pentru a învăța în limba ta preferată.",
          action: "highlight-translate",
          highlight: ".translate-container, #google_translate_element"
        }
      ]
    };
    
    this.init();
  }

  init() {
    console.log('🎓 Main Tutorial: Initializing...');
    this.createTutorialUI();
    this.bindEvents();
    this.checkFirstVisit();
    console.log('🎓 Main Tutorial: Initialized successfully');
  }

  createTutorialUI() {
    console.log('🎓 Main Tutorial: Creating UI elements...');
    const tutorialHTML = `
      <div id="tutorial-overlay" class="tutorial-overlay" style="display: none;">
        <div class="tutorial-backdrop"></div>
        <div class="tutorial-container">
          <div class="tutorial-header">
            <div class="tutorial-progress">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <span class="progress-text">1/10</span>
            </div>
            <button class="tutorial-close" id="tutorialClose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="tutorial-content">
            <h2 class="tutorial-title">Bun venit la Atomify!</h2>
            <p class="tutorial-description">Să explorăm împreună funcționalitățile platformei.</p>
          </div>
          
          <div class="tutorial-actions">
            <button class="tutorial-btn secondary" id="tutorialSkip">Sari peste</button>
            <button class="tutorial-btn primary" id="tutorialNext">Următorul</button>
          </div>
          
          <div class="tutorial-navigation" id="tutorialNavigation">
            <!-- Navigation dots will be generated dynamically -->
          </div>
        </div>
      </div>
      
      <button id="tutorialTrigger" class="tutorial-trigger">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Ghid</span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', tutorialHTML);
    
    // Verify the button was created
    const trigger = document.getElementById('tutorialTrigger');
    if (trigger) {
      console.log('🎓 Main Tutorial: Tutorial trigger button created successfully');
      console.log('🎓 Main Tutorial: Button position:', trigger.style.position);
      console.log('🎓 Main Tutorial: Button display:', trigger.style.display);
      console.log('🎓 Main Tutorial: Button z-index:', trigger.style.zIndex);
      

    } else {
      console.error('🎓 Main Tutorial: Failed to create tutorial trigger button!');
    }
  }

  bindEvents() {
    // Tutorial trigger
    const trigger = document.getElementById('tutorialTrigger');
    if (trigger) {
      console.log('🎓 Main Tutorial: Found trigger button, binding events');
      trigger.addEventListener('click', () => {
        console.log('🎓 Main Tutorial: Trigger clicked, checking login status');
        this.checkLoginAndStartTutorial();
      });
    } else {
      console.error('🎓 Main Tutorial: Could not find tutorial trigger button!');
    }

    // Tutorial close
    document.getElementById('tutorialClose').addEventListener('click', () => {
      this.closeTutorial();
    });

    // Tutorial skip
    document.getElementById('tutorialSkip').addEventListener('click', () => {
      this.skipTutorial();
    });

    // Tutorial next
    document.getElementById('tutorialNext').addEventListener('click', () => {
      this.nextStep();
    });



    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTutorial();
      } else if (e.key === 'ArrowRight') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.previousStep();
      }
    });
  }

  checkLoginAndStartTutorial() {
    // Always start with the unified tutorial that goes to admin page
    console.log('🎓 Tutorial: Starting unified tutorial');
    this.startUnifiedTutorial();
  }

  isUserLoggedIn() {
    // Check multiple indicators of login status
    const hasToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const hasUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    const isLoggedInElement = document.querySelector('.user-profile, .logout-btn, .user-menu');
    const isNotLoggedInElement = document.querySelector('.login-btn, .register-btn, .auth-section');
    
    // If we have auth data or user profile elements, user is logged in
    if (hasToken || hasUserData || isLoggedInElement) {
      return true;
    }
    
    // If we see login/register buttons, user is not logged in
    if (isNotLoggedInElement) {
      return false;
    }
    
    // Default to not logged in if we can't determine
    return false;
  }

  hasUserChosenRole() {
    // Check if user has selected a role
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    const hasRoleInData = this.getUserRoleFromData();
    
    // If we have a role stored or can detect it from the UI, user has chosen a role
    if (userRole || hasRoleInData) {
      return true;
    }
    
    // Check if role selector shows a selected value
    const roleSelector = document.querySelector('#roleSelect, .role-selector select, [data-role-selector]');
    if (roleSelector && roleSelector.value && roleSelector.value !== '') {
      return true;
    }
    
    // Default to false if we can't determine
    return false;
  }

  getUserRoleFromData() {
    // Try to get role from user data
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.role || parsed.userRole || parsed.user_type;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  checkFirstVisit() {
    // Check if there's a saved tutorial state to restore
    const savedState = localStorage.getItem('tutorial_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const timeDiff = Date.now() - state.timestamp;
        
        // Only restore if the state is recent (within 5 minutes)
        if (timeDiff < 5 * 60 * 1000) {
          console.log('🎓 Tutorial: Restoring saved state', state);
          this.restoreTutorialState(state);
          return;
        } else {
          // Clear old state
          localStorage.removeItem('tutorial_state');
        }
      } catch (e) {
        console.error('🎓 Tutorial: Error parsing saved state', e);
        localStorage.removeItem('tutorial_state');
      }
    }
    
    console.log('🎓 Tutorial: No saved state, guide button ready');
  }

  startUnifiedTutorial() {
    this.currentTutorial = this.tutorials['unified'];
    this.currentStep = 0;
    this.showTutorial();
    this.updateStep();
  }

  restoreTutorialState(state) {
    if (state.type === 'unified') {
      this.currentTutorial = this.tutorials['unified'];
      this.currentStep = state.step || 0;
      
      // Clear the saved state since we're restoring it
      localStorage.removeItem('tutorial_state');
      
      // Wait a bit for the page to be fully loaded, then show tutorial
      setTimeout(() => {
        // Show tutorial and update to the correct step
        this.showTutorial();
        this.updateStep();
        
        console.log('🎓 Tutorial: Restored to step', this.currentStep);
      }, 500);
    }
  }

  startTutorial(type = 'welcome') {
    this.currentTutorial = this.tutorials[type];
    this.currentStep = 0;
    this.showTutorial();
    this.updateStep();
  }

  showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add entrance animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  }

  closeTutorial() {
    // Clear any saved tutorial state
    localStorage.removeItem('tutorial_state');
    
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.remove('active');
    
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      this.removeHighlight();
    }, 300);
    
    localStorage.setItem('atomify_tutorial_seen', 'true');
  }

  skipTutorial() {
    // Clear any saved tutorial state
    localStorage.removeItem('tutorial_state');
    
    this.closeTutorial();
    this.showSkipMessage();
  }

  showSkipMessage() {
    const message = document.createElement('div');
    message.className = 'tutorial-skip-message';
    message.innerHTML = `
      <div class="skip-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
          <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
        </svg>
        <span>Poți accesa ghidul oricând din butonul "Ghid"</span>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  updateStep() {
    const step = this.currentTutorial[this.currentStep];
    if (!step) {
      this.completeTutorial();
      return;
    }

    // Update content
    document.querySelector('.tutorial-title').textContent = step.title;
    document.querySelector('.tutorial-description').textContent = step.content;

    // Update progress
    const progress = ((this.currentStep + 1) / this.currentTutorial.length) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
    document.querySelector('.progress-text').textContent = `${this.currentStep + 1}/${this.currentTutorial.length}`;

    // Update navigation dots
    this.updateNavigationDots();

    // Handle step action
    this.handleStepAction(step);

    // Update button text
    const nextBtn = document.getElementById('tutorialNext');
    if (this.currentStep === this.currentTutorial.length - 1) {
      nextBtn.textContent = 'Finalizează';
    } else if (step.action === 'navigate-to-admin') {
      nextBtn.textContent = 'Continua';
    } else {
      nextBtn.textContent = 'Continua';
    }
  }

  updateNavigationDots() {
    const navigationContainer = document.getElementById('tutorialNavigation');
    if (!navigationContainer || !this.currentTutorial) return;

    // Clear existing dots
    navigationContainer.innerHTML = '';

    // Generate dots for all steps
    for (let i = 0; i < this.currentTutorial.length; i++) {
      const dot = document.createElement('button');
      dot.className = `nav-dot ${i === this.currentStep ? 'active' : ''}`;
      dot.dataset.step = i;
      dot.addEventListener('click', () => this.goToStep(i));
      navigationContainer.appendChild(dot);
    }
  }

  handleStepAction(step) {
    this.removeHighlight();

    switch (step.action) {
      case 'highlight-nav':
        this.highlightElement('.nav-links');
        break;
      case 'highlight-theme':
        this.highlightElement('.theme-toggle');
        break;
      case 'highlight-auth':
        this.highlightElement('.auth-section, .auth-buttons, #loginBtn, #registerBtn');
        break;
      case 'highlight-translate':
        this.highlightElement('.translate-container, #google_translate_element');
        break;
      case 'install-pwa':
        this.highlightElement('#pwa-install-btn');
        this.showInstallGuide();
        break;
      case 'navigate':
        this.highlightElement(step.highlight);
        break;
      case 'show-shortcuts':
        this.showShortcutsModal();
        break;
      case 'show-badges':
        this.showBadgesModal();
        break;
      case 'show-admin-features':
        console.log('🎓 Tutorial: Showing admin features modal');
        this.showAdminFeaturesModal();
        break;
      case 'highlight-admin-role':
        this.highlightElement('.role-selector, #roleSelect, [data-role-selector]');
        break;
      case 'highlight-admin-region':
        this.highlightElement('.region-selector, #regionSelect, [data-region-selector]');
        break;
      case 'highlight-admin-newsletter':
        this.highlightElement('.newsletter-section, #newsletterToggle, [data-newsletter-toggle]');
        break;
      case 'highlight-admin-classes':
        this.highlightElement('.class-management, #createClass, [data-class-management]');
        break;
      case 'show-admin-complete':
        this.showAdminCompleteModal();
        break;
      case 'show-install-benefits':
        this.showInstallBenefitsModal();
        break;
      case 'highlight-ios-install':
        this.highlightElement('#pwa-install-btn');
        this.showIOSInstallGuide();
        break;
      case 'highlight-android-install':
        this.highlightElement('#pwa-install-btn');
        this.showAndroidInstallGuide();
        break;
      case 'highlight-desktop-install':
        this.highlightElement('#pwa-install-btn');
        this.showDesktopInstallGuide();
        break;
      case 'show-pwa-complete':
        this.showPWACompleteModal();
        break;
      case 'navigate-to-admin':
        this.navigateToAdminPage();
        break;
      case 'highlight-pwa-install':
        this.highlightElement('#pwa-install-btn');
        break;
      case 'show-final-complete':
        this.showFinalCompleteModal();
        break;
    }
  }

  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tutorial-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  removeHighlight() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }

  nextStep() {
    if (this.currentStep < this.currentTutorial.length - 1) {
      this.currentStep++;
      this.updateStep();
    } else {
      this.completeTutorial();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateStep();
    }
  }

  goToStep(step) {
    this.currentStep = step;
    this.updateStep();
  }

  completeTutorial() {
    // Clear any saved tutorial state
    localStorage.removeItem('tutorial_state');
    
    this.closeTutorial();
    this.showCompletionMessage();
  }

  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'tutorial-completion';
    message.innerHTML = `
      <div class="completion-content">
        <div class="completion-icon">🎉</div>
        <h3>Felicitări! Ești gata să începi!</h3>
        <p>Acum cunoști toate funcționalitățile Atomify. Să începem aventura în lumea chimiei!</p>
        <div class="completion-tips">
          <div class="tip">
            <span class="tip-icon">💡</span>
            <span>Folosește butonul "Ghid" pentru a revizui tutorialul oricând</span>
          </div>
          <div class="tip">
            <span class="tip-icon">📱</span>
            <span>Instalează aplicația pentru acces rapid și experiența optimă</span>
          </div>
          <div class="tip">
            <span class="tip-icon">🔐</span>
            <span>Creează-ți un cont pentru a salva progresul și a câștiga insigne</span>
          </div>
          <div class="tip">
            <span class="tip-icon">🏆</span>
            <span>Participă la competiții și urmărește clasamentul pentru motivație</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 8000);
  }

  showShortcutsModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>⌨️ Scurtături Rapide</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>I</kbd>
            <span>Generare Izomeri</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Q</kbd>
            <span>Chestionare</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>C</kbd>
            <span>Calculatoare</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>L</kbd>
            <span>Clasament</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>P</kbd>
            <span>Profil</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>H</kbd>
            <span>Istoric</span>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showBadgesModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>🏅 Sistem de Insigne</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">⚡</span>
            <div>
              <strong>Speed Demon</strong>
              <small>Complete chestionare rapid</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🦉</span>
            <div>
              <strong>Night Owl</strong>
              <small>Studiază târziu în noapte</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🏆</span>
            <div>
              <strong>Perfect Score</strong>
              <small>Obține 100% la chestionare</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📈</span>
            <div>
              <strong>Streak Master</strong>
              <small>Studiază zile consecutive</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🧪</span>
            <div>
              <strong>Isomer Expert</strong>
              <small>Generează mulți izomeri</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🎯</span>
            <div>
              <strong>Quiz Master</strong>
              <small>Complete multe chestionare</small>
            </div>
          </div>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 14px; color: var(--text-light);">
          Vezi toate insignele și progresul în profilul tău!
        </p>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>📱 Instalează Atomify ca Aplicație</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">📱</span>
            <div>
              <strong>iPhone (Safari)</strong>
              <small>Apasă Share → "Adaugă la ecranul de start"</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🤖</span>
            <div>
              <strong>Android (Chrome)</strong>
              <small>Apasă meniul → "Instalează aplicația"</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">💻</span>
            <div>
              <strong>Desktop (Chrome/Edge)</strong>
              <small>Apasă butonul "Instalează" din bara de adrese</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">⚡</span>
            <div>
              <strong>Beneficii</strong>
              <small>Acces rapid, icon pe ecranul de start, experiență de aplicație</small>
            </div>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showAdminFeaturesModal() {
    console.log('🎓 Tutorial: Creating admin features modal');
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>👨‍🏫 Panou de Administrare</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">🌍</span>
            <div>
              <strong>Alege Regiunea Ta</strong>
              <small>Selectează regiunea din România pentru conținut localizat și competiții regionale</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📧</span>
            <div>
              <strong>Newsletter Personalizat</strong>
              <small>Activează newsletter-ul pentru actualizări despre noi funcționalități, competiții și sfaturi de studiu</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">👤</span>
            <div>
              <strong>Alege Rolul Tău</strong>
              <small>Selectează între Student sau Profesor pentru funcționalități personalizate</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">👥</span>
            <div>
              <strong>Gestionare Clase</strong>
              <small>Creează clase virtuale, invita studenți și urmărește progresul clasei</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📊</span>
            <div>
              <strong>Statistici Detaliate</strong>
              <small>Vezi statistici avansate despre activitatea clasei și performanța individuală</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">⚙️</span>
            <div>
              <strong>Personalizare Conținut</strong>
              <small>Adaptează conținutul și chestionarele pentru nevoile specifice ale clasei</small>
            </div>
          </div>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 14px; color: var(--text-light);">
          Accesează panoul de administrare pentru a configura toate aceste funcționalități!
        </p>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showAdminCompleteModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>✅ Configurare Completă!</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">👤</span>
            <div>
              <strong>Rolul Tău</strong>
              <small>Configurat pentru funcționalități personalizate</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🌍</span>
            <div>
              <strong>Regiunea Ta</strong>
              <small>Conținut localizat și competiții regionale</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📧</span>
            <div>
              <strong>Newsletter</strong>
              <small>Actualizări și sfaturi personalizate</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">👥</span>
            <div>
              <strong>Gestionare Clase</strong>
              <small>Instrumente pentru profesori</small>
            </div>
          </div>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 14px; color: var(--text-light);">
          Toate setările au fost configurate! Poți reveni oricând în panoul de administrare.
        </p>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showInstallBenefitsModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>⚡ Beneficii Aplicație</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">🚀</span>
            <div>
              <strong>Acces Rapid</strong>
              <small>Icon pe ecranul de start pentru acces instant</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📱</span>
            <div>
              <strong>Experiență Aplicație</strong>
              <small>Interfață similară cu aplicațiile native</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">⚡</span>
            <div>
              <strong>Performanță Optimă</strong>
              <small>Încărcare mai rapidă și funcționare fluidă</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🎯</span>
            <div>
              <strong>Navigare Simplă</strong>
              <small>Acces direct fără a deschide browserul</small>
            </div>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showIOSInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>📱 Instalare iPhone</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">1️⃣</span>
            <div>
              <strong>Deschide Safari</strong>
              <small>Asigură-te că folosești Safari pe iPhone</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">2️⃣</span>
            <div>
              <strong>Apasă Share</strong>
              <small>Butonul Share din bara de instrumente</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">3️⃣</span>
            <div>
              <strong>Adaugă la Ecranul de Start</strong>
              <small>Selectează această opțiune din meniu</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">✅</span>
            <div>
              <strong>Gata!</strong>
              <small>Atomify va apărea pe ecranul de start</small>
            </div>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showAndroidInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>🤖 Instalare Android</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">1️⃣</span>
            <div>
              <strong>Deschide Chrome</strong>
              <small>Asigură-te că folosești Chrome pe Android</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">2️⃣</span>
            <div>
              <strong>Apasă Meniul</strong>
              <small>Butonul cu 3 puncte din colțul din dreapta</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">3️⃣</span>
            <div>
              <strong>Instalează Aplicația</strong>
              <small>Selectează această opțiune din meniu</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">✅</span>
            <div>
              <strong>Gata!</strong>
              <small>Atomify va fi instalat ca aplicație</small>
            </div>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showDesktopInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>💻 Instalare Desktop</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">1️⃣</span>
            <div>
              <strong>Folosește Chrome/Edge</strong>
              <small>Asigură-te că folosești un browser modern</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">2️⃣</span>
            <div>
              <strong>Caută Butonul Instalează</strong>
              <small>În bara de adrese sau în meniul browserului</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">3️⃣</span>
            <div>
              <strong>Apasă Instalează</strong>
              <small>Confirmă instalarea aplicației</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">✅</span>
            <div>
              <strong>Gata!</strong>
              <small>Atomify va fi instalat ca aplicație desktop</small>
            </div>
          </div>
        </div>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showPWACompleteModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>🎉 Gata de Utilizare!</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">📱</span>
            <div>
              <strong>Aplicația Instalată</strong>
              <small>Atomify este acum pe ecranul de start</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">⚡</span>
            <div>
              <strong>Acces Rapid</strong>
              <small>Deschide aplicația direct de pe telefon</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🎯</span>
            <div>
              <strong>Experiență Optimă</strong>
              <small>Interfață fluidă și performanță îmbunătățită</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🚀</span>
            <div>
              <strong>Începe Să Înveți</strong>
              <small>Explorează toate funcționalitățile Atomify</small>
            </div>
          </div>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 14px; color: var(--text-light);">
          Felicitări! Ești gata să începi aventura în lumea chimiei cu Atomify!
        </p>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  navigateToAdminPage() {
    // Save tutorial state before navigating
    localStorage.setItem('tutorial_state', JSON.stringify({
      type: 'unified',
      step: this.currentStep + 1, // Move to next step
      timestamp: Date.now()
    }));
    
    console.log('🎓 Tutorial: Saving state and navigating to admin page');
    
    // Navigate to admin page
    window.location.href = '/app/admin.html';
  }

  showFinalCompleteModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h3>🎉 Configurare Completă!</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="badge-icon">✅</span>
            <div>
              <strong>Rolul Configurat</strong>
              <small>Funcționalități personalizate activate</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">🌍</span>
            <div>
              <strong>Regiunea Selectată</strong>
              <small>Conținut localizat și competiții regionale</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📧</span>
            <div>
              <strong>Newsletter Activ</strong>
              <small>Actualizări și sfaturi personalizate</small>
            </div>
          </div>
          <div class="shortcut-item">
            <span class="badge-icon">📱</span>
            <div>
              <strong>Aplicația Instalată</strong>
              <small>Acces rapid și experiența optimă</small>
            </div>
          </div>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 14px; color: var(--text-light);">
          Felicitări! Ai configurat totul perfect și ești gata să începi aventura în lumea chimiei cu Atomify!
        </p>
        <button class="shortcuts-close">Închide</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.shortcuts-close').addEventListener('click', () => {
      modal.remove();
    });
  }


}

// Initialize tutorial when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.atomifyTutorial = new AtomifyTutorial();
});

// Add tutorial styles
const tutorialStyles = `
  .tutorial-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--primary-color, #667eea);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    z-index: 1000;
    transition: all 0.3s ease;
  }

  .tutorial-trigger:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  .tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .tutorial-overlay.active {
    opacity: 1;
  }

  .tutorial-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .tutorial-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--card-background);
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
  }

  .tutorial-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .tutorial-progress {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-bar {
    width: 200px;
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 14px;
    color: var(--text-light);
    font-weight: 500;
  }

  .tutorial-close {
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .tutorial-close:hover {
    background: var(--background-color);
    color: var(--text-color);
  }

  .tutorial-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 12px;
  }

  .tutorial-description {
    font-size: 16px;
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .tutorial-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .tutorial-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tutorial-btn.primary {
    background: var(--primary-color);
    color: white;
  }

  .tutorial-btn.primary:hover {
    background: var(--primary-dark);
  }

  .tutorial-btn.secondary {
    background: var(--background-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .tutorial-btn.secondary:hover {
    background: var(--border-color);
  }

  .tutorial-navigation {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .nav-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-dot.active {
    background: var(--primary-color);
    transform: scale(1.2);
  }

  .tutorial-highlight {
    position: relative;
    z-index: 10001 !important;
    box-shadow: 0 0 0 4px var(--primary-color), 0 0 20px rgba(102, 126, 234, 0.5) !important;
    border-radius: 8px;
    animation: tutorialPulse 2s infinite;
  }

  @keyframes tutorialPulse {
    0%, 100% { box-shadow: 0 0 0 4px var(--primary-color), 0 0 20px rgba(102, 126, 234, 0.5); }
    50% { box-shadow: 0 0 0 6px var(--primary-color), 0 0 30px rgba(102, 126, 234, 0.7); }
  }

  .tutorial-skip-message,
  .tutorial-completion,
  .notification-success {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    animation: slideInRight 0.3s ease;
  }

  .skip-content,
  .success-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .completion-content {
    text-align: center;
  }

  .completion-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .completion-tips {
    margin-top: 16px;
  }

  .tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-light);
  }

  .tip-icon {
    font-size: 16px;
  }

  .shortcuts-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
  }

  .shortcuts-content {
    background: var(--card-background);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    border: 1px solid var(--border-color);
  }

  .shortcuts-content h3 {
    margin-bottom: 20px;
    text-align: center;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--background-color);
    border-radius: 8px;
  }

  .shortcut-item kbd {
    background: var(--border-color);
    border: 1px solid var(--text-light);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
    font-family: monospace;
  }

  .badge-icon {
    font-size: 24px;
    margin-right: 12px;
  }

  .shortcut-item small {
    display: block;
    color: var(--text-light);
    font-size: 12px;
    margin-top: 2px;
  }

  .shortcuts-close {
    width: 100%;
    padding: 12px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .tutorial-container {
      width: 95%;
      padding: 20px;
    }

    .tutorial-title {
      font-size: 20px;
    }

    .tutorial-description {
      font-size: 14px;
    }

    .progress-bar {
      width: 150px;
    }

    .tutorial-trigger {
      bottom: 16px;
      right: 16px;
      padding: 10px 14px;
      font-size: 13px;
    }
  }
`;

// Inject styles
const mainTutorialStyleSheet = document.createElement('style');
mainTutorialStyleSheet.textContent = tutorialStyles;
document.head.appendChild(mainTutorialStyleSheet); 