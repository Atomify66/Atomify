// Logo Theme Switcher - Reusable function for all pages
function setupLogoThemeSwitcher() {
  // Funcție pentru actualizarea logo-ului în funcție de temă
  function updateLogo(theme) {
    const logoImages = document.querySelectorAll('.logo-image, .footer-logo');
    logoImages.forEach(img => {
      const newSrc = theme === 'dark' ? 'logo_dark.png' : 'logo_light.png';
      
      // Add error handling for logo loading
      img.onerror = function() {
        console.warn(`Failed to load ${newSrc}, falling back to logo.png`);
        this.src = 'logo.png';
        this.onerror = null; // Prevent infinite loop
      };
      
      img.src = newSrc;
    });
  }

  // Obține tema curentă
  const currentTheme = localStorage.getItem('theme') || 'light';
  
  // Actualizează logo-ul la încărcarea paginii
  updateLogo(currentTheme);

  // Returnează funcția pentru a fi folosită în alte scripturi
  return updateLogo;
}

// Inițializează logo switcher-ul când DOM-ul este gata
document.addEventListener('DOMContentLoaded', setupLogoThemeSwitcher); 