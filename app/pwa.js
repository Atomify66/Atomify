// PWA Registration and Installation Script
class AtomifyPWA {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    // Register service worker
    this.registerServiceWorker();
    
    // Listen for install prompt
    this.listenForInstallPrompt();
    
    // Check if already installed
    this.checkIfInstalled();
    
    // Add install button if needed
    this.addInstallButton();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  checkIfInstalled() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('PWA is running in standalone mode');
    }
  }

  addInstallButton() {
    // Create install button
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-btn';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v6m0 0l-3-3m3 3l3-3M12 8v14"/>
      </svg>
      <span>Instalează App</span>
    `;
    
    installButton.addEventListener('click', () => {
      this.installPWA();
    });

    // Add to navigation if not already installed
    if (!this.isInstalled) {
      const navControls = document.querySelector('.nav-controls');
      if (navControls) {
        navControls.appendChild(installButton);
      }
    }
  }

  showInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'flex';
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.showInstallSuccess();
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  }

  showInstallSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'pwa-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <span>Atomify a fost instalat cu succes!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showUpdateNotification() {
    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'pwa-notification update';
    notification.innerHTML = `
      <div class="notification-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>O nouă versiune este disponibilă!</span>
        <button onclick="location.reload()" class="update-btn">Actualizează</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      }
    }
    return false;
  }

  // Send test notification
  sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/app/logo_light.png',
        badge: '/app/logo_light.png'
      });
    }
  }
}

// Initialize PWA when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.atomifyPWA = new AtomifyPWA();
});

// Add PWA styles
const pwaStyles = `
  .pwa-install-btn {
    display: none;
    align-items: center;
    gap: 0.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-right: 1rem;
  }

  .pwa-install-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }

  .pwa-install-btn svg {
    width: 18px;
    height: 18px;
  }

  .pwa-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
  }

  .pwa-notification.success {
    border-left: 4px solid #28a745;
  }

  .pwa-notification.update {
    border-left: 4px solid #ffc107;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .notification-content svg {
    color: #28a745;
    flex-shrink: 0;
  }

  .update .notification-content svg {
    color: #ffc107;
  }

  .update-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    margin-left: auto;
  }

  .update-btn:hover {
    background: var(--primary-dark);
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
    .pwa-install-btn {
      margin-right: 0.5rem;
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .pwa-notification {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = pwaStyles;
document.head.appendChild(styleSheet); 