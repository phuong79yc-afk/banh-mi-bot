/**
 * Simple Spinner Manager
 * Professional Loading Spinners - Standalone
 * 
 * Usage:
 *   Spinner.show('ring', 'Loading...');
 *   Spinner.hide();
 *   Spinner.setType('dots');
 */

const Spinner = {
  isVisible: false,
  currentType: 'ring',

  // HTML Templates
  templates: {
    ring: '<div class="spinner-ring"></div>',
    dots: '<div class="spinner-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>',
    bars: '<div class="spinner-bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>',
    wave: '<div class="spinner-wave"><div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div></div>',
    pulse: '<div class="spinner-pulse"></div>',
    double: '<div class="spinner-double"></div>'
  },

  // CSS Styles
  styles: `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-20px); }
    }
    @keyframes grow {
      0%, 100% { height: 10px; opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes wave {
      0%, 100% { height: 20px; opacity: 0.5; }
      50% { height: 60px; opacity: 1; }
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
      70% { box-shadow: 0 0 0 25px rgba(102, 126, 234, 0); }
      100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
    }

    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }

    .spinner-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .spinner-content {
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      min-width: 300px;
    }

    .spinner-title {
      color: #333;
      margin-bottom: 30px;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .spinner-container {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
    }

    .spinner-ring {
      width: 60px;
      height: 60px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-dots {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .dot {
      width: 14px;
      height: 14px;
      background: #667eea;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    .spinner-bars {
      display: flex;
      gap: 5px;
      height: 60px;
      align-items: flex-end;
    }

    .bar {
      width: 8px;
      background: linear-gradient(to top, #667eea, #764ba2);
      border-radius: 4px;
      animation: grow 1s ease-in-out infinite;
    }

    .bar:nth-child(1) { animation-delay: 0s; height: 20px; }
    .bar:nth-child(2) { animation-delay: 0.1s; height: 40px; }
    .bar:nth-child(3) { animation-delay: 0.2s; height: 55px; }
    .bar:nth-child(4) { animation-delay: 0.3s; height: 40px; }
    .bar:nth-child(5) { animation-delay: 0.4s; height: 20px; }

    .spinner-wave {
      display: flex;
      gap: 4px;
      height: 60px;
      align-items: center;
    }

    .wave {
      width: 6px;
      background: #667eea;
      border-radius: 3px;
      animation: wave 1.2s ease-in-out infinite;
    }

    .wave:nth-child(1) { animation-delay: 0s; }
    .wave:nth-child(2) { animation-delay: 0.1s; }
    .wave:nth-child(3) { animation-delay: 0.2s; }
    .wave:nth-child(4) { animation-delay: 0.3s; }

    .spinner-pulse {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #667eea;
      animation: pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
    }

    .spinner-double {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .spinner-double::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-double::after {
      content: '';
      position: absolute;
      width: 70%;
      height: 70%;
      top: 15%;
      left: 15%;
      border: 4px solid #f3f3f3;
      border-bottom: 4px solid #764ba2;
      border-radius: 50%;
      animation: spin 0.7s linear infinite reverse;
    }

    .spinner-close {
      margin-top: 20px;
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .spinner-close:hover {
      background: #764ba2;
      transform: scale(1.05);
    }

    .spinner-close:active {
      transform: scale(0.95);
    }
  `,

  // Initialize
  init() {
    // Add styles
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = this.styles;
      document.head.appendChild(style);
    }

    // Create overlay
    if (!document.getElementById('spinner-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'spinner-overlay';
      overlay.className = 'spinner-overlay';
      overlay.innerHTML = `
        <div class="spinner-content">
          <div class="spinner-title" id="spinner-title">Loading...</div>
          <div class="spinner-container" id="spinner-container"></div>
          <button class="spinner-close" onclick="Spinner.hide()">Close</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.hide();
      });
    }
  },

  // Show spinner
  show(type = 'ring', title = 'Loading...', duration = null) {
    if (!document.getElementById('spinner-overlay')) {
      this.init();
    }

    this.currentType = type;
    const overlay = document.getElementById('spinner-overlay');
    const container = document.getElementById('spinner-container');
    const titleEl = document.getElementById('spinner-title');

    titleEl.textContent = title;
    container.innerHTML = this.templates[type] || this.templates.ring;
    overlay.classList.add('active');
    this.isVisible = true;

    // Auto close if duration specified
    if (duration) {
      setTimeout(() => this.hide(), duration);
    }
  },

  // Hide spinner
  hide() {
    const overlay = document.getElementById('spinner-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    this.isVisible = false;
  },

  // Change spinner type
  setType(type) {
    this.currentType = type;
    if (this.isVisible) {
      const container = document.getElementById('spinner-container');
      container.innerHTML = this.templates[type] || this.templates.ring;
    }
  },

  // Update title
  setTitle(title) {
    const titleEl = document.getElementById('spinner-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  },

  // Quick demo (show and auto-hide)
  demo(type = 'ring', duration = 3000) {
    this.show(type, 'Demo Loading...', duration);
  }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Spinner.init());
} else {
  Spinner.init();
}
