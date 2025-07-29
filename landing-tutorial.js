// Landing Page Tutorial - Specific for index.html
class LandingTutorial {
  constructor() {
    this.steps = [
      {
        title: "Bun venit la Atomify! 🎉",
        content: "Platforma educațională inovatoare pentru învățarea chimiei, creată de campioni olimpici.",
        highlight: ".hero-title"
      },
      {
        title: "Instalează ca Aplicație 📱",
        content: "Transformă-ți telefonul într-un instrument puternic de învățare! Instalează Atomify ca aplicație nativă.",
        highlight: ".btn-hero.primary",
        action: "install-prompt"
      },
      {
        title: "Creează Contul Tău 👤",
        content: "Salvează progresul, urmărește statistici și participă la competiții cu alți studenți.",
        highlight: ".btn-primary"
      },
      {
        title: "Începe Aventura! 🚀",
        content: "Apasă butonul de mai jos pentru a accesa platforma completă și a explora toate funcționalitățile.",
        highlight: ".btn-hero.primary",
        action: "navigate-to-app"
      }
    ];
    
    this.currentStep = 0;
    this.init();
  }

  init() {
    console.log('🎓 Landing Tutorial: Initializing...');
    this.createLandingTutorialUI();
    this.bindEvents();
    this.checkFirstVisit();
    console.log('🎓 Landing Tutorial: Initialized successfully');
  }

  createLandingTutorialUI() {
    const tutorialHTML = `
      <div id="landing-tutorial" class="landing-tutorial" style="display: none;">
        <div class="tutorial-backdrop"></div>
        <div class="tutorial-card">
          <div class="tutorial-header">
            <div class="tutorial-step">${this.currentStep + 1} / ${this.steps.length}</div>
            <button class="tutorial-close" id="landingTutorialClose">×</button>
          </div>
          
          <div class="tutorial-body">
            <h3 class="tutorial-title"></h3>
            <p class="tutorial-text"></p>
          </div>
          
          <div class="tutorial-footer">
            <button class="tutorial-btn secondary" id="landingTutorialSkip">Sari peste</button>
            <div class="tutorial-dots"></div>
            <button class="tutorial-btn primary" id="landingTutorialNext">Următorul</button>
          </div>
        </div>
      </div>
      
      <button id="landingTutorialTrigger" class="landing-tutorial-trigger">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Ghid Rapid</span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', tutorialHTML);
    this.createDots();
  }

  createDots() {
    const dotsContainer = document.querySelector('.tutorial-dots');
    this.steps.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'tutorial-dot';
      dot.dataset.step = index;
      dot.addEventListener('click', () => this.goToStep(index));
      dotsContainer.appendChild(dot);
    });
  }

  bindEvents() {
    document.getElementById('landingTutorialTrigger').addEventListener('click', () => {
      this.startTutorial();
    });

    document.getElementById('landingTutorialClose').addEventListener('click', () => {
      this.closeTutorial();
    });

    document.getElementById('landingTutorialSkip').addEventListener('click', () => {
      this.skipTutorial();
    });

    document.getElementById('landingTutorialNext').addEventListener('click', () => {
      this.nextStep();
    });

    // Keyboard navigation
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

  checkFirstVisit() {
    console.log('🎓 Landing Tutorial: Tutorial will only start when "Ghid Rapid" button is clicked');
  }

  startTutorial() {
    this.currentStep = 0;
    this.showTutorial();
    this.updateStep();
  }

  showTutorial() {
    const tutorial = document.getElementById('landing-tutorial');
    tutorial.style.display = 'block';
    
    setTimeout(() => {
      tutorial.classList.add('active');
    }, 10);
  }

  closeTutorial() {
    const tutorial = document.getElementById('landing-tutorial');
    tutorial.classList.remove('active');
    
    setTimeout(() => {
      tutorial.style.display = 'none';
      this.removeHighlight();
    }, 300);
    
    localStorage.setItem('atomify_landing_tutorial_seen', 'true');
  }

  skipTutorial() {
    this.closeTutorial();
    this.showSkipMessage();
  }

  showSkipMessage() {
    const message = document.createElement('div');
    message.className = 'landing-skip-message';
    message.innerHTML = `
      <div class="skip-content">
        <span>💡 Poți accesa ghidul oricând din butonul "Ghid Rapid"</span>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  updateStep() {
    const step = this.steps[this.currentStep];
    if (!step) {
      this.completeTutorial();
      return;
    }

    // Update content
    document.querySelector('.tutorial-title').textContent = step.title;
    document.querySelector('.tutorial-text').textContent = step.content;
    document.querySelector('.tutorial-step').textContent = `${this.currentStep + 1} / ${this.steps.length}`;

    // Update dots
    document.querySelectorAll('.tutorial-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentStep);
    });

    // Handle step action with a small delay to ensure DOM is ready
    setTimeout(() => {
      this.handleStepAction(step);
    }, 150);

    // Update button text
    const nextBtn = document.getElementById('landingTutorialNext');
    if (this.currentStep === this.steps.length - 1) {
      nextBtn.textContent = 'Începe!';
    } else {
      nextBtn.textContent = 'Următorul';
    }
  }

  handleStepAction(step) {
    this.removeHighlight();

    if (step.highlight) {
      this.highlightElement(step.highlight);
    }

    if (step.action === 'install-prompt') {
      // Show PWA install prompt if available
      if (window.atomifyPWA && window.atomifyPWA.deferredPrompt) {
        setTimeout(() => {
          window.atomifyPWA.installPWA();
        }, 1000);
      }
    } else if (step.action === 'navigate-to-app') {
      // Change button to navigate to app
      const nextBtn = document.getElementById('landingTutorialNext');
      nextBtn.textContent = 'Accesează Atomify';
      nextBtn.onclick = () => {
        window.location.href = '/app/isomers.html';
      };
    }
  }

  highlightElement(selector) {
    // Try multiple selectors if the first one doesn't work
    const selectors = selector.split(', ');
    let element = null;
    
    for (const sel of selectors) {
      element = document.querySelector(sel.trim());
      if (element) {
        break;
      }
    }
    
    if (element) {
      // Remove any existing highlights first
      this.removeHighlight();
      
      element.classList.add('landing-tutorial-highlight');
      
      // Ensure element is visible and scroll to it
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      console.log('🎓 Landing Tutorial: Highlighted element:', element);
    } else {
      console.warn('🎓 Landing Tutorial: Could not find element to highlight:', selector);
    }
  }

  removeHighlight() {
    document.querySelectorAll('.landing-tutorial-highlight').forEach(el => {
      el.classList.remove('landing-tutorial-highlight');
    });
  }



  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
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
    this.closeTutorial();
    this.showCompletionMessage();
  }

  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'landing-completion';
    message.innerHTML = `
      <div class="completion-content">
        <div class="completion-icon">🎉</div>
        <h3>Ești gata să începi!</h3>
        <p>Acum cunoști funcționalitățile principale ale Atomify. Să începem aventura!</p>
        <button class="completion-btn" onclick="window.location.href='/app/isomers.html'">
          Accesează Atomify
        </button>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 8000);
  }
}

// Initialize landing tutorial when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.landingTutorial = new LandingTutorial();
});

// Landing tutorial styles
const landingTutorialStyles = `
  .landing-tutorial-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    z-index: 1000;
    transition: all 0.3s ease;
  }



  .landing-tutorial {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .landing-tutorial.active {
    opacity: 1;
  }

  .tutorial-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
  }

  .tutorial-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 20px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tutorial-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .tutorial-step {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .tutorial-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 24px;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s ease;
  }


  .tutorial-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }

  .tutorial-text {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .tutorial-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tutorial-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tutorial-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }


  .tutorial-btn.secondary {
    background: #f5f5f5;
    color: #666;
  }

  .tutorial-dots {
    display: flex;
    gap: 8px;
  }

  .tutorial-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ddd;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tutorial-dot.active {
    background: #667eea;
    transform: scale(1.2);
  }

  .landing-tutorial-highlight {
    position: relative !important;
    z-index: 10001 !important;
    box-shadow: 0 0 0 4px #667eea, 0 0 30px rgba(102, 126, 234, 0.6) !important;
    border-radius: 12px !important;
    animation: landingPulse 2s infinite !important;
    transform: none !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  @keyframes landingPulse {
    0%, 100% { box-shadow: 0 0 0 4px #667eea, 0 0 30px rgba(102, 126, 234, 0.6); }
    50% { box-shadow: 0 0 0 6px #667eea, 0 0 40px rgba(102, 126, 234, 0.8); }
  }

  .landing-skip-message,
  .landing-completion {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
  }

  .completion-content {
    text-align: center;
  }

  .completion-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .completion-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 16px;
    transition: all 0.2s ease;
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
    .tutorial-card {
      width: 95%;
      padding: 24px;
    }

    .tutorial-title {
      font-size: 20px;
    }

    .tutorial-text {
      font-size: 14px;
    }

    .landing-tutorial-trigger {
      bottom: 16px;
      right: 16px;
      padding: 10px 16px;
      font-size: 13px;
    }
  }
`;

// Inject landing tutorial styles
const landingStyleSheet = document.createElement('style');
landingStyleSheet.textContent = landingTutorialStyles;
document.head.appendChild(landingStyleSheet); 