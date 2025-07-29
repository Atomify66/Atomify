// Google Translate Component - Reusable for all pages
(function() {
  'use strict';
  
  // Initialize Google Translate
  function initGoogleTranslate() {
    console.log('Initializing Google Translate...');
    // Check if Google Translate is already loaded
    if (typeof google !== 'undefined' && google.translate) {
      console.log('Google Translate already loaded, creating element...');
      createTranslateElement();
    } else {
      console.log('Loading Google Translate script...');
      // Load Google Translate script
      loadGoogleTranslateScript();
    }
  }
  
  // Load Google Translate script
  function loadGoogleTranslateScript() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }
  
  // Create translate element
  function createTranslateElement() {
    console.log('Creating translate element...');
    // Check if element already exists
    if (document.getElementById('google_translate_element')) {
      console.log('Translate element already exists');
      return;
    }
    
    // Create container if it doesn't exist
    let container = document.querySelector('.translate-container');
    if (!container) {
      console.log('Creating translate container...');
      container = document.createElement('div');
      container.className = 'translate-container';
      
      // Insert before theme toggle
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle && themeToggle.parentNode) {
        themeToggle.parentNode.insertBefore(container, themeToggle);
      }
    } else {
      console.log('Found existing translate container');
    }
    
    // Create translate element
    const translateElement = document.createElement('div');
    translateElement.id = 'google_translate_element';
    container.appendChild(translateElement);
    console.log('Created translate element with ID:', translateElement.id);
    
    // Initialize Google Translate
    try {
      new google.translate.TranslateElement({
        pageLanguage: 'ro',
        includedLanguages: 'en,fr,de,es,it,pt,ru,zh-CN,ja,ko,ar,hi',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
        gaTrack: false
      }, 'google_translate_element');
      console.log('Google Translate element initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Translate:', error);
    }
  }
  
  // Global function for Google Translate callback
  window.googleTranslateElementInit = function() {
    console.log('Google Translate callback triggered');
    createTranslateElement();
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleTranslate);
  } else {
    initGoogleTranslate();
  }
  
  // Fallback: If Google Translate doesn't load after 5 seconds, show a simple language selector
  setTimeout(function() {
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement && translateElement.children.length === 0) {
      console.log('Google Translate failed to load, creating fallback...');
      createFallbackTranslateElement();
    }
  }, 5000);
  
  function createFallbackTranslateElement() {
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement) {
      translateElement.innerHTML = `
        <select onchange="changeLanguage(this.value)" style="
          background: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          color: var(--text-color);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          min-width: 120px;
        ">
          <option value="ro">Română</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
        </select>
      `;
    }
  }
  
  function changeLanguage(lang) {
    // Simple language change - you can implement actual translation logic here
    console.log('Language changed to:', lang);
    // For now, just show an alert
    alert('Language change to ' + lang + ' - Google Translate integration needed for full functionality');
  }
  
  // Add language change event listener
  document.addEventListener('DOMContentLoaded', function() {
    // Listen for language changes
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const body = document.body;
          if (body.classList.contains('translated-ltr') || body.classList.contains('translated-rtl')) {
            // Language has been changed
            console.log('Language changed via Google Translate');
            
            // Update any dynamic content if needed
            updateTranslatedContent();
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
  
  // Function to update any dynamic content after translation
  function updateTranslatedContent() {
    // This function can be used to update any dynamic content
    // that might not be automatically translated by Google Translate
    
    // Example: Update placeholders, tooltips, etc.
    const inputs = document.querySelectorAll('input[placeholder]');
    inputs.forEach(input => {
      // You can add specific placeholder translations here if needed
    });
    
    // Example: Update aria-labels
    const elementsWithAria = document.querySelectorAll('[aria-label]');
    elementsWithAria.forEach(element => {
      // You can add specific aria-label translations here if needed
    });
  }
  
  // Export functions for external use
  window.GoogleTranslate = {
    init: initGoogleTranslate,
    updateContent: updateTranslatedContent
  };
  
})(); 