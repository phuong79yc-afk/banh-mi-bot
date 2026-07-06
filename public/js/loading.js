/**
 * Professional Loading Spinner Manager
 * Provides flexible loading state management with multiple spinner styles
 */

class LoaderManager {
  constructor(options = {}) {
    this.loaderId = options.loaderId || 'loader';
    this.contentId = options.contentId || 'content';
    this.hideDelay = options.hideDelay || 300;
    this.spinnerType = options.spinnerType || 'bars'; // bars, ring, dots, wave, double-ring
    this.showLogo = options.showLogo !== false;
    this.logoText = options.logoText || 'LOADING';
    this.loadingText = options.loadingText || 'Loading...';
    this.onHide = options.onHide || null;
    this.onShow = options.onShow || null;
    
    this.init();
  }

  init() {
    // Auto-hide on page load
    if (document.readyState === 'complete') {
      this.hide();
    } else {
      window.addEventListener('load', () => this.hide());
    }
  }

  /**
   * Show the loading spinner
   */
  show(options = {}) {
    const loader = document.getElementById(this.loaderId);
    if (!loader) {
      console.warn(`Loader element with id "${this.loaderId}" not found`);
      return;
    }

    // Apply custom options
    if (options.loadingText) {
      this.updateLoadingText(options.loadingText);
    }
    if (options.spinnerType) {
      this.setSpinnerType(options.spinnerType);
    }

    loader.classList.remove('hide');
    
    if (this.onShow) {
      this.onShow();
    }
  }

  /**
   * Hide the loading spinner
   */
  hide() {
    const loader = document.getElementById(this.loaderId);
    const content = document.getElementById(this.contentId);

    if (loader) {
      setTimeout(() => {
        loader.classList.add('hide');
      }, this.hideDelay);
    }

    if (content) {
      setTimeout(() => {
        content.classList.add('show');
      }, this.hideDelay);
    }

    if (this.onHide) {
      this.onHide();
    }
  }

  /**
   * Update the loading text dynamically
   */
  updateLoadingText(text) {
    const loaderText = document.querySelector(`#${this.loaderId} .loader-text`);
    if (loaderText) {
      loaderText.textContent = text;
    }
  }

  /**
   * Update the logo text
   */
  updateLogoText(text) {
    const loaderLogo = document.querySelector(`#${this.loaderId} .loader-logo`);
    if (loaderLogo) {
      loaderLogo.textContent = text;
    }
  }

  /**
   * Set spinner type dynamically
   */
  setSpinnerType(type) {
    const spinnerContainer = document.querySelector(`#${this.loaderId} .loader-content`);
    if (!spinnerContainer) return;

    // Remove existing spinner
    const existingSpinner = spinnerContainer.querySelector(
      '.loader-bars, .loader-ring, .loader-dots, .loader-wave, .loader-double-ring, .loader-progress'
    );
    if (existingSpinner) {
      existingSpinner.remove();
    }

    // Insert new spinner based on type
    const logo = spinnerContainer.querySelector('.loader-logo');
    let spinnerHTML = '';

    switch (type) {
      case 'ring':
        spinnerHTML = '<div class="loader-ring"></div>';
        break;
      case 'dots':
        spinnerHTML = '<div class="loader-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
        break;
      case 'wave':
        spinnerHTML = '<div class="loader-wave"><div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div></div>';
        break;
      case 'double-ring':
        spinnerHTML = '<div class="loader-double-ring"></div>';
        break;
      case 'progress':
        spinnerHTML = '<div class="loader-progress"><div class="progress-bar"></div></div>';
        break;
      case 'bars':
      default:
        spinnerHTML = '<div class="loader-bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>';
        break;
    }

    if (logo && logo.nextElementSibling) {
      logo.nextElementSibling.insertAdjacentHTML('beforebegin', spinnerHTML);
    } else {
      const textElement = spinnerContainer.querySelector('.loader-text');
      if (textElement) {
        textElement.insertAdjacentHTML('beforebegin', spinnerHTML);
      }
    }

    this.spinnerType = type;
  }

  /**
   * Show loading with progress simulation
   */
  showWithProgress(duration = 5000) {
    this.setSpinnerType('progress');
    this.show();

    // Simulate progress completion
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Show overlay loading (semi-transparent overlay)
   */
  showOverlay(text = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-overlay-content">
          <div class="loader-ring lg"></div>
          <p class="loader-text" style="margin-top: 1rem;">${text}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.classList.add('active');
  }

  /**
   * Hide overlay loading
   */
  hideOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Create a minimal loader variant
   */
  makeMinimal() {
    const loader = document.getElementById(this.loaderId);
    if (loader) {
      loader.classList.add('minimal');
    }
  }

  /**
   * Create a fullscreen loader variant
   */
  makeFullscreen() {
    const loader = document.getElementById(this.loaderId);
    if (loader) {
      loader.classList.add('fullscreen');
    }
  }

  /**
   * Add skeleton loading elements
   */
  addSkeletonLoading(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-title';
      container.appendChild(skeleton);

      for (let j = 0; j < 2; j++) {
        const skeletonText = document.createElement('div');
        skeletonText.className = 'skeleton-text';
        container.appendChild(skeletonText);
      }
    }
  }

  /**
   * Auto-hide on timeout
   */
  autoHide(delay = 10000) {
    setTimeout(() => {
      this.hide();
    }, delay);
  }
}

/**
 * Global utility functions
 */
const Loader = {
  /**
   * Initialize loader with options
   */
  init: function(options = {}) {
    if (!window._loaderInstance) {
      window._loaderInstance = new LoaderManager(options);
    }
    return window._loaderInstance;
  },

  /**
   * Show loader
   */
  show: function(options = {}) {
    if (!window._loaderInstance) {
      window._loaderInstance = new LoaderManager();
    }
    window._loaderInstance.show(options);
  },

  /**
   * Hide loader
   */
  hide: function() {
    if (window._loaderInstance) {
      window._loaderInstance.hide();
    }
  },

  /**
   * Update text
   */
  setText: function(text) {
    if (window._loaderInstance) {
      window._loaderInstance.updateLoadingText(text);
    }
  },

  /**
   * Set spinner type
   */
  setType: function(type) {
    if (window._loaderInstance) {
      window._loaderInstance.setSpinnerType(type);
    }
  },

  /**
   * Show overlay
   */
  showOverlay: function(text) {
    if (!window._loaderInstance) {
      window._loaderInstance = new LoaderManager();
    }
    window._loaderInstance.showOverlay(text);
  },

  /**
   * Hide overlay
   */
  hideOverlay: function() {
    if (window._loaderInstance) {
      window._loaderInstance.hideOverlay();
    }
  }
};

// Auto-initialize if loader element exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loader')) {
      Loader.init();
    }
  });
} else {
  if (document.getElementById('loader')) {
    Loader.init();
  }
}
